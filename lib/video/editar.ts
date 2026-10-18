// Editor de video, modo "Hablo a cámara": el método de Paul hecho código (lib/video/preset.ts).
// 0) Si subió varias tomas, las une en el orden en que las subió. 1) Transcribe con whisper (si no está, lo instala).
// 2) Corta todas las pausas de más de 0,3 s sin cortar palabras: las busca con el ruido de fondo de SU audio (voz.ts),
//    no con un umbral fijo, y entre palabras también saca respiraciones; deja aire al terminar y al arrancar a hablar y
//    funde 30 ms el audio en cada corte para que no haya clics. Hace una segunda pasada por lo que haya quedado.
// 3) Normaliza el audio a -14 LUFS. 4) Subtítulos y textos con el estilo que eligió o el de su video de referencia.
// 5) Audita antes de entregar: ninguna pausa > 0,3 s, ningún cuadro negro y ninguna palabra partida por un corte.
// Corre con ffmpeg en esta compu. El modo "Muestro productos o lugares" está en montaje.ts.
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pedido, type ResultadoEditor } from "../agent/tasks";
import { runAgentLocal } from "../agent/claudeLocal";
import { leerCreador } from "../diario/archivos";
import { estiloEnUnaFrase, estiloFinal, lugarDeTextos, referenciaDe, resumenDeReferencia, type Estilo, type OpcionesEstilo, type Referencia } from "./estilo";
import { asegurarSubtitulos, correr, duracion, hojaDeCuadros, medir, ultimoError, type Medida } from "./ffmpeg";
import type { Imagen } from "../agent/run";
import { tomasDe } from "./subida";
import { armarAss, ordenarTextos } from "./subtitulos";
import { estadoInstalacion, instalarWhisper, motorWhisper, transcribir, type Motor, type Palabra } from "./transcribir";
import { analizarVoz, moverPalabras, palabrasCortadas, pausasParaCortar, type Pausa } from "./voz";
import { animar, auditoriaVisual } from "./animacion";

export const DIR_VIDEOS = path.join(process.cwd(), ".data", "videos");
export const carpetaVideo = (id: string) => path.join(DIR_VIDEOS, id.replace(/[^a-z0-9-]/gi, ""));

export type Auditoria = { pausas_largas: number; negros: number; ok: boolean; detalle: string[] };
export type OpcionesEdicion = OpcionesEstilo & {
  /** Solo para "Muestro productos o lugares": lo que va en los textos y en la placa final. */
  marca: string;
  producto: string;
  precio: string;
  cta: string;
  /** Para el cierre del video (tarjeta de perfil): su @ y su foto de perfil, si la app la tiene. */
  usuario: string;
  foto: string;
};
/** Un corte del montaje de productos: qué tramo de qué toma, y el texto que lleva (puede ir vacío). */
export type Corte = { toma: number; desde: number; hasta: number; texto: string };
export type Trabajo = {
  id: string;
  estado: "procesando" | "listo" | "error";
  pasos: string[];
  error: string;
  creado: string;
  resultado?: {
    antes_s: number;
    despues_s: number;
    pausas_cortadas: number;
    auditoria: Auditoria;
    /** listos: subtítulos y textos puestos · sin_whisper: falta whisper en la compu · apagados: la persona no los quiso. */
    subtitulos: "listos" | "sin_whisper" | "apagados" | "error";
    /** Por qué no se pudieron poner los subtítulos, para decírselo a la persona. */
    error_subtitulos?: string;
    /** hyperframes: tarjetas animadas de verdad · simples: subtítulos y textos con ASS (si HyperFrames no pudo). */
    animaciones?: "hyperframes" | "simples";
    diseno?: "partida" | "completa";
    /** Por qué no salieron las animaciones de HyperFrames, si no salieron. */
    aviso_animaciones?: string;
    gancho?: string;
    textos?: number;
    notas?: string;
    /** habla: tomas hablando a cámara · productos: tomas de productos o lugares, montadas por el agente. */
    modo?: "habla" | "productos";
    tomas?: number;
    cortes?: Corte[];
    cierre?: string;
    /** agente: el plan lo hizo el Editor · simple: el agente no respondió y el código armó un orden simple (se avisa). */
    plan?: "agente" | "simple";
    /** Cortes del plan del agente que el código tuvo que acomodar (se salían de la toma o duraban de más). */
    corregidos?: number;
    /** Lo que se copió del video de referencia, si pasó uno. */
    referencia?: ReturnType<typeof resumenDeReferencia>;
    avisos?: string[];
  };
};

// Los trabajos viven en memoria (sobreviven a la recarga en caliente de Next) y en .data/videos/<id>/estado.json.
const g = globalThis as unknown as { __hookiaTrabajos?: Map<string, Trabajo> };
const trabajos = (g.__hookiaTrabajos ??= new Map<string, Trabajo>());

export const guardar = async (t: Trabajo) => {
  trabajos.set(t.id, t);
  await writeFile(path.join(carpetaVideo(t.id), "estado.json"), JSON.stringify(t), { mode: 0o600 }).catch(() => {});
};

export async function trabajo(id: string): Promise<Trabajo | null> {
  const t = trabajos.get(id);
  if (t) return t;
  try {
    return JSON.parse(await readFile(path.join(carpetaVideo(id), "estado.json"), "utf8")) as Trabajo;
  } catch {
    return null;
  }
}

/** Un trabajo nuevo, con su función para ir sumando pasos (se ven en vivo en la app). */
export function nuevoTrabajo(id: string) {
  const t: Trabajo = { id, estado: "procesando", pasos: [], error: "", creado: new Date().toISOString() };
  const paso = async (texto: string) => {
    t.pasos = [...t.pasos, texto];
    await guardar(t);
  };
  return { t, paso };
}

/**
 * Los tramos que quedan: todo menos las pausas. Deja aire a cada lado de lo que se dice: más al terminar de hablar
 * (los finales de palabra se apagan despacio) que antes de arrancar (el ataque de la voz es rápido). Una pausa de
 * 0,3 s queda en 0,18 s; el silencio del principio y del final se saca entero.
 */
export function tramosDeHabla(dur: number, pausas: Pausa[], alTerminar = 0.12, alArrancar = 0.06) {
  const tramos: Pausa[] = [];
  let desde = 0;
  for (const p of pausas) {
    const corteIni = p.inicio + (p.inicio <= 0.01 ? 0 : alTerminar);
    const corteFin = Math.min(dur, p.fin) - (p.fin >= dur - 0.05 ? 0 : alArrancar);
    if (corteFin - corteIni <= 0.05) continue;
    if (corteIni - desde > 0.05) tramos.push({ inicio: desde, fin: corteIni });
    desde = corteFin;
  }
  if (dur - desde > 0.05) tramos.push({ inicio: desde, fin: dur });
  return tramos;
}

const par = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** Une las tomas en orden, todas al tamaño de la primera (con barras si alguna es distinta) y a 30 cuadros por segundo. */
async function unirTomas(tomas: string[], medidas: Medida[], salida: string) {
  const W = par(medidas[0].ancho), H = par(medidas[0].alto);
  const partes = tomas.map((_, i) => {
    const v = `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=30,setsar=1,format=yuv420p[v${i}];`;
    const a = medidas[i].audio
      ? `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}];`
      : `anullsrc=r=48000:cl=stereo,atrim=duration=${medidas[i].dur.toFixed(3)}[a${i}];`;
    return v + a;
  });
  const grafo = `${partes.join("")}${tomas.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${tomas.length}:v=1:a=1[v][a]`;
  const r = await correr("ffmpeg", [
    "-hide_banner", "-y", ...tomas.flatMap((x) => ["-i", x]), "-filter_complex", grafo,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", salida,
  ]);
  if (r.codigo !== 0) throw new Error(`No pude unir tus tomas: ${ultimoError(r.error)}`);
}

async function cortarYUnir(entrada: string, salida: string, tramos: Pausa[], normalizar = true) {
  const f = (n: number) => n.toFixed(3);
  const partes = tramos.map((t, i) => {
    const d = t.fin - t.inicio;
    const fundido = Math.min(0.03, d / 4);
    return (
      `[0:v]trim=start=${f(t.inicio)}:end=${f(t.fin)},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=start=${f(t.inicio)}:end=${f(t.fin)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${f(fundido)},afade=t=out:st=${f(Math.max(0, d - fundido))}:d=${f(fundido)}[a${i}];`
    );
  });
  const grafo = `${partes.join("")}${tramos.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${tramos.length}:v=1:a=1[v][a0];[a0]${normalizar ? "loudnorm=I=-14:TP=-1.5:LRA=11" : "anull"}[a]`;
  const r = await correr("ffmpeg", [
    "-hide_banner", "-y", "-i", entrada, "-filter_complex", grafo,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", salida,
  ]);
  if (r.codigo !== 0) throw new Error(`ffmpeg no pudo armar el video: ${ultimoError(r.error)}`);
}

/** La auditoría, con la misma vara que el corte: el ruido de fondo de este audio, no un umbral fijo que puede mentir. */
async function auditar(archivo: string, palabras: Palabra[], partidas: number, soloVoz = archivo): Promise<Auditoria> {
  // Las pausas se miden en la voz sola: los efectos de sonido del video terminado podrían taparlas.
  const pausas = pausasParaCortar(await analizarVoz(soloVoz), palabras, 0.3);
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-vf", "blackdetect=d=0.1:pix_th=0.10", "-an", "-f", "null", "-"]);
  const negros = (r.error.match(/black_start:/g) ?? []).length;
  const detalle = [
    pausas.length ? `Quedan ${pausas.length} pausa(s) de más de 0,3 s.` : "Ninguna pausa de más de 0,3 s (medido con el ruido de fondo de tu audio).",
    negros ? `Hay ${negros} tramo(s) en negro.` : "Ningún cuadro en negro.",
    palabras.length
      ? partidas
        ? `Revisá ${partidas} palabra(s) que quedaron justo en un corte.`
        : "Ninguna palabra cortada (comparado con la transcripción)."
      : "Sin transcripción no pude revisar que estén todas las palabras.",
    "Audio normalizado a -14 LUFS.",
  ];
  return { pausas_largas: pausas.length, negros, ok: !pausas.length && !negros && !partidas, detalle };
}

/** whisper hace falta para los subtítulos y para cortar mejor: si no está, lo instala (una sola vez) y sigue. */
async function asegurarWhisper(paso: (t: string) => Promise<void>): Promise<Motor | null> {
  const ya = await motorWhisper();
  if (ya) return ya;
  await paso("Instalando whisper para los subtítulos: es una sola vez y puede tardar unos minutos");
  await instalarWhisper();
  while (estadoInstalacion()?.estado === "instalando") await new Promise((r) => setTimeout(r, 2000));
  const motor = await motorWhisper();
  if (!motor) await paso(`No pude instalar whisper (${estadoInstalacion()?.paso || "sin detalle"}): sigo sin subtítulos`);
  return motor;
}

/** Lo que dice, en tramos de unos 3 segundos con el segundo en que arranca cada uno. */
function transcripcionEnTramos(palabras: Palabra[]) {
  const lineas: string[] = [];
  let actual: Palabra[] = [];
  for (const p of palabras) {
    if (actual.length && p.desde - actual[0].desde > 3) {
      lineas.push(`[${actual[0].desde.toFixed(1)}] ${actual.map((x) => x.texto).join(" ")}`);
      actual = [];
    }
    actual.push(p);
  }
  if (actual.length) lineas.push(`[${actual[0].desde.toFixed(1)}] ${actual.map((x) => x.texto).join(" ")}`);
  return lineas.join("\n");
}

/** El agente Editor decide el gancho, las tarjetas, el cierre, dónde está la cara (mirando cuadros) y qué palabras corregir. */
async function planDelEditor(palabras: Palabra[], duracionS: number, animacion: OpcionesEdicion["animacion"], estilo: string, imagenes: Imagen[] = []) {
  const creador = (await leerCreador()) ?? { usuario: "editor", aQueSeDedica: "", queVende: "", aQuien: "", historia: "", captions: [] };
  let plan = null as ResultadoEditor | null;
  await runAgentLocal(
    Pedido.parse({ tarea: "editor", creador, respuestas: [], transcripcion: transcripcionEnTramos(palabras), duracion: duracionS, animacion, estilo }),
    imagenes,
    (e) => {
      if (e.tipo === "resultado") plan = e.data as ResultadoEditor;
    },
    {},
  );
  return plan as ResultadoEditor | null;
}

/** Subtítulos y textos: usa la transcripción (ya movida al video cortado), le pide el plan al Editor y los quema con el estilo. */
async function ponerTextos(
  id: string, video: string, o: OpcionesEdicion, estilo: Estilo, ref: Referencia | null, paso: (t: string) => Promise<void>,
  motor: Motor | null, transcriptas: Palabra[],
) {
  if (!motor) return { subtitulos: "sin_whisper" as const };
  let palabras = transcriptas;
  if (!palabras.length) {
    await paso("Transcribiendo lo que decís, palabra por palabra");
    palabras = await transcribir(video, motor);
  }
  if (!palabras.length) throw new Error("No escuché palabras en el video.");
  const dur = await duracion(video);
  await paso(ref ? "Tu editor elige el gancho y los textos, con el estilo de tu referencia" : "Tu editor elige el gancho y los textos clave");
  // Con referencia, cuántos textos pone sale de ella; si no, de lo que eligió.
  const animacion = ref ? ({ ninguno: "poca", pocos: "media", muchos: "mucha" } as const)[estilo.textos.cantidad] : o.animacion;
  // 4 cuadros de su video, para que el Editor ubique la cara (encuadre) y ningún texto la tape.
  const persona = await hojaDeCuadros(video, await medir(video), [0.15, 0.4, 0.65, 0.9].map((f) => f * dur), path.join(carpetaVideo(id), "cuadros-persona.jpg"), 480, "su video").catch(() => null);
  const plan = await planDelEditor(palabras, dur, animacion, estiloEnUnaFrase(ref), persona ? [persona] : []).catch(() => null);
  if (plan?.correcciones.length) {
    const mapa = new Map(plan.correcciones.map((c) => [c.mal.toLowerCase(), c.bien]));
    palabras = palabras.map((p) => {
      const limpia = p.texto.toLowerCase().replace(/[.,;:!?¿¡…]/g, "");
      const bien = mapa.get(limpia);
      return bien ? { ...p, texto: p.texto.replace(new RegExp(limpia.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), bien) } : p;
    });
  }
  const dir = carpetaVideo(id);
  // Las animaciones de verdad: HyperFrames dibuja las tarjetas, los subtítulos y el cierre (lib/video/animacion.ts).
  let aviso_animaciones = "";
  try {
    const animado = path.join(dir, "animado-final.mp4");
    const r = await animar({ dir, video, salida: animado, dur, palabras, plan, estilo, diseno: estilo.diseno, usuario: o.usuario || (await leerCreador())?.usuario || "", foto: o.foto || undefined, paso });
    await rename(path.join(dir, path.basename(video)), path.join(dir, "sin-textos.mp4"));
    await rename(animado, path.join(dir, "editado.mp4"));
    return { subtitulos: "listos" as const, gancho: plan?.gancho?.trim() || undefined, textos: r.tarjetas, notas: plan?.notas, animaciones: "hyperframes" as const, diseno: estilo.diseno };
  } catch (e) {
    aviso_animaciones = (e as Error).message || "algo falló";
    console.error("Animaciones:", aviso_animaciones);
    await paso(`No pude armar las animaciones (${aviso_animaciones.replace(/\.$/, "")}): pongo subtítulos y textos simples`);
  }
  const sinLibass = await asegurarSubtitulos(paso);
  if (sinLibass) throw new Error(sinLibass);
  await paso(ref ? "Poniendo subtítulos y textos como en tu referencia" : "Poniendo subtítulos y textos animados");
  const v = await medir(video);
  const gancho = estilo.textos.gancho && plan?.gancho?.trim() ? { texto: plan.gancho.trim(), desde: 0, hasta: Math.min(2, dur) } : null;
  const textos = estilo.textos.cantidad === "ninguno" ? [] : ordenarTextos(plan?.textos ?? [], dur);
  // Sin pantalla partida, "al centro" cae sobre la cara: los subtítulos van abajo (preset: nunca tapan la cara).
  const subs = estilo.subtitulos.posicion === "centro" ? { ...estilo.subtitulos, posicion: "abajo" as const } : estilo.subtitulos;
  const ass = armarAss({ ancho: v.ancho || 1080, alto: v.alto || 1920, palabras, subs, acento: estilo.subtitulos.color_resaltado, posTextos: lugarDeTextos({ ...estilo, subtitulos: subs }), gancho, textos });
  await writeFile(path.join(dir, "subtitulos.ass"), ass);
  const r = await correr("ffmpeg", ["-hide_banner", "-y", "-i", path.basename(video), "-vf", "ass=subtitulos.ass", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", "con-textos.mp4"], dir);
  if (r.codigo !== 0) throw new Error(`No pude poner los subtítulos: ${ultimoError(r.error)}`);
  await rename(path.join(dir, path.basename(video)), path.join(dir, "sin-textos.mp4"));
  await rename(path.join(dir, "con-textos.mp4"), path.join(dir, "editado.mp4"));
  return { subtitulos: "listos" as const, gancho: gancho?.texto, textos: textos.length, notas: plan?.notas, animaciones: "simples" as const, aviso_animaciones };
}

/** Edita las tomas subidas (toma-1, toma-2… en su carpeta) y deja editado.mp4. Corre en segundo plano. */
export async function editar(id: string, o: OpcionesEdicion, trabajoEnCurso = nuevoTrabajo(id)) {
  const { t, paso } = trabajoEnCurso;
  const dir = carpetaVideo(id);
  await mkdir(dir, { recursive: true });
  try {
    const tomas = await tomasDe(dir);
    if (!tomas.length) throw new Error("No llegó ninguna toma. Subí tu video de nuevo.");
    await paso(tomas.length > 1 ? `Midiendo tus ${tomas.length} tomas` : "Midiendo el video");
    const medidas = await Promise.all(tomas.map(medir));
    if (medidas.some((m) => !m.dur || !m.ancho)) throw new Error("No pude leer una de tus tomas. Probá con un MP4 o MOV.");
    if (!medidas.some((m) => m.audio)) throw new Error("El video no tiene sonido: así no puedo encontrar las pausas.");
    let original = tomas[0];
    if (tomas.length > 1) {
      await paso(`Uniendo tus ${tomas.length} tomas en el orden en que las subiste`);
      original = path.join(dir, "unido.mp4");
      await unirTomas(tomas, medidas, original);
    }
    const { ref, aviso } = await referenciaDe(dir, "habla", paso);
    const estilo = estiloFinal(o, ref);
    const antes = await duracion(original);
    // Primero la transcripción: sirve para cortar mejor (los huecos entre palabras) y para los subtítulos.
    const motor = o.estilo !== "ninguno" ? await asegurarWhisper(paso) : await motorWhisper();
    let palabras: Palabra[] = [];
    if (motor) {
      await paso("Transcribiendo lo que decís, palabra por palabra");
      palabras = await transcribir(original, motor).catch((e) => {
        console.error("whisper:", (e as Error).message);
        return [];
      });
    }
    await paso("Midiendo el ruido de fondo de tu audio para encontrar todas las pausas");
    const voz = await analizarVoz(original);
    const pausas = pausasParaCortar(voz, palabras, 0.3);
    const todo = [{ inicio: 0, fin: antes }];
    const tramos = tramosDeHabla(antes, pausas);
    const salida = path.join(dir, "editado.mp4");
    const pasada1 = path.join(dir, "pasada1.mp4");
    await paso(
      pausas.length
        ? `Cortando ${pausas.length} pausa${pausas.length === 1 ? "" : "s"} sin cortar palabras`
        : voz.confiable || palabras.length
          ? "No encontré pausas de más de 0,3 s: normalizo el audio"
          : "Hay tanto ruido de fondo que no distingo las pausas: normalizo el audio",
    );
    await cortarYUnir(original, pasada1, tramos.length ? tramos : todo);
    let partidas = palabrasCortadas(voz, palabras, tramos.length ? tramos : todo);
    let movidas = moverPalabras(palabras, tramos.length ? tramos : todo);
    palabras = movidas.palabras;
    // Segunda pasada, como pide el preset: agarra lo que haya quedado.
    await paso("Segunda pasada: revisando que no quede ninguna pausa");
    const dur1 = await duracion(pasada1);
    const voz1 = await analizarVoz(pasada1);
    const quedan = pausasParaCortar(voz1, palabras, 0.3);
    if (quedan.length) {
      const tramos2 = tramosDeHabla(dur1, quedan);
      await cortarYUnir(pasada1, salida, tramos2.length ? tramos2 : [{ inicio: 0, fin: dur1 }], false);
      partidas += palabrasCortadas(voz1, palabras, tramos2.length ? tramos2 : [{ inicio: 0, fin: dur1 }]);
      movidas = moverPalabras(palabras, tramos2.length ? tramos2 : [{ inicio: 0, fin: dur1 }]);
      palabras = movidas.palabras;
    } else await rename(pasada1, salida);
    let textos: Awaited<ReturnType<typeof ponerTextos>> | { subtitulos: "apagados" } | { subtitulos: "error"; error_subtitulos: string } = { subtitulos: "apagados" };
    if (o.estilo !== "ninguno") {
      try {
        textos = await ponerTextos(id, salida, o, estilo, ref, paso, motor, palabras);
      } catch (e) {
        const motivo = (e as Error).message || "algo falló";
        console.error("Subtítulos:", motivo);
        textos = { subtitulos: "error", error_subtitulos: motivo };
        await paso(`No pude poner los subtítulos (${motivo.replace(/\.$/, "")}): te dejo el video sin pausas`);
      }
    }
    await paso("Auditando: pausas, cuadros negros y audio");
    const sinTextos = path.join(dir, "sin-textos.mp4");
    const auditoria = await auditar(salida, palabras, partidas, existsSync(sinTextos) ? sinTextos : salida);
    // Con animaciones, además, la auditoría visual: el Editor mira cuadros de todo el video terminado.
    if ("animaciones" in textos && textos.animaciones === "hyperframes") {
      const visual = await auditoriaVisual({ video: salida, dur: await duracion(salida), diseno: textos.diseno ?? "completa", paso }).catch(() => null);
      const r = visual?.resultado;
      if (r) {
        auditoria.detalle.push(r.ok ? `Revisé ${visual.cuadros} cuadros del video terminado: ${r.resumen}` : `Revisá lo que vi en ${visual.cuadros} cuadros del video terminado: ${r.resumen}`);
        for (const p of r.problemas.slice(0, 5)) auditoria.detalle.push(`Revisá el segundo ${Math.round(p.segundo)}: ${p.problema}`);
        auditoria.ok = auditoria.ok && r.ok && r.cara_entera;
      } else auditoria.detalle.push("Sin auditoría visual: tu editor no pudo revisar los cuadros esta vez.");
    }
    const despues = await duracion(salida);
    await stat(salida);
    t.resultado = {
      antes_s: antes, despues_s: despues, pausas_cortadas: pausas.length + quedan.length, auditoria, ...textos,
      modo: "habla", tomas: tomas.length, referencia: resumenDeReferencia(ref, estilo), avisos: aviso ? [aviso] : [],
    };
    t.estado = "listo";
    await paso("Listo");
  } catch (e) {
    t.estado = "error";
    t.error = (e as Error).message || "Algo falló editando el video.";
    await guardar(t);
  }
}
