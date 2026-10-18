// Editor de video, modo "Hablo a cámara": el método de Paul hecho código (.claude/skills/editar-reel/referencias/
// metodo-completo.md, secciones 4, 5, 11 y 14).
// 0) Si subió varias tomas, las une en el orden en que las subió.
// 1) Cortes en dos pasadas: busca la voz por silencios (-30 dB, desde 0,10 s), deja 0,03 s antes y 0,045 s después
//    de cada pedazo, tira los pedacitos sueltos, cuida el arranque de las palabras con los tiempos de whisper y deja
//    la cola natural al final. Funde 30 ms el audio en cada corte para que no haya clics. Un video largo (más de
//    3 minutos) se corta como charla: solo pausas de 0,18 s o más, con 0,06 s de aire.
// 2) Normaliza el audio a -14 LUFS. 3) Subtítulos y textos con el estilo que eligió o el de su video de referencia;
//    con los subtítulos grandes (estilo Hormozi), zoom alternado en cada corte.
// 4) Audita antes de entregar: silencedetect, blackdetect, sonoridad medida, grillas de cuadros cada 0,2 s y que
//    estén todas las palabras.
// Corre con ffmpeg en esta compu. El modo "Muestro productos o lugares" está en montaje.ts.
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pedido, type ResultadoEditor } from "../agent/tasks";
import { runAgentLocal } from "../agent/claudeLocal";
import { leerCreador } from "../diario/archivos";
import { estiloEnUnaFrase, estiloFinal, lugarDeTextos, referenciaDe, resumenDeReferencia, type Estilo, type OpcionesEstilo, type Referencia } from "./estilo";
import { correr, duracion, grillasDeAuditoria, medir, silencios, sonoridad, ultimoError, type Medida } from "./ffmpeg";
import { tomasDe } from "./subida";
import { armarAss, corregirPalabras, ordenarTextos, presetDeSubs, type PresetSubs } from "./subtitulos";
import { motorWhisper, transcribir, type Palabra } from "./transcribir";

export const DIR_VIDEOS = path.join(process.cwd(), ".data", "videos");
export const carpetaVideo = (id: string) => path.join(DIR_VIDEOS, id.replace(/[^a-z0-9-]/gi, ""));

export type Auditoria = {
  pausas_largas: number;
  negros: number;
  ok: boolean;
  detalle: string[];
  /** Sonoridad medida del audio final, en LUFS. */
  lufs?: number | null;
  /** Cuántas grillas de cuadros (cada 0,2 s) quedaron en la carpeta auditoria/ para mirarlas. */
  grillas?: number;
  /** Palabras que dijo en las tomas y cuántas siguen en el video editado (las dos las escucha whisper). */
  palabras?: { antes: number; estan: number };
};
export type OpcionesEdicion = OpcionesEstilo & {
  /** Solo para "Muestro productos o lugares": lo que va en los textos y en la placa final. */
  marca: string;
  producto: string;
  precio: string;
  cta: string;
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

/** Los tramos que quedan: todo menos las pausas, dejando `margen` de aire a cada lado de lo que se dice. */
export function tramosDeHabla(dur: number, pausas: { inicio: number; fin: number }[], margen = 0.06) {
  const tramos: { inicio: number; fin: number }[] = [];
  let desde = 0;
  for (const p of pausas) {
    const corteIni = p.inicio + (p.inicio <= 0.01 ? 0 : margen);
    const corteFin = Math.min(dur, p.fin) - (p.fin >= dur ? 0 : margen);
    if (corteFin - corteIni <= 0.05) continue;
    if (corteIni - desde > 0.05) tramos.push({ inicio: desde, fin: corteIni });
    desde = corteFin;
  }
  if (dur - desde > 0.05) tramos.push({ inicio: desde, fin: dur });
  return tramos;
}

/** Los números de los cortes (método de Paul, sección 4; la charla, sección 11). */
export const CORTES = {
  reel: { umbral: -30, silencio: 0.1, antes: 0.03, despues: 0.045 },
  charla: { umbral: -35, silencio: 0.18, antes: 0.06, despues: 0.06 },
  /** Lo que dura un pedacito suelto sin palabra que se tira. */
  pedacito: 0.12,
  /** El pedazo arranca, como tarde, este tiempo antes de la primera palabra que oyó whisper. */
  guarda: 0.07,
  /** Fin de la voz: por debajo de -40 dB. Si después hay 0,3 s o más de silencio, quedan 0,25 s de cola; si no, 0,06 s. */
  finVoz: -40,
  colaLarga: 0.25,
  colaCorta: 0.06,
};
/** Un video de más de 3 minutos es una charla, un podcast o una entrevista: se corta con la vara de la charla. */
export const LARGO_CHARLA = 180;

type Tramo = { inicio: number; fin: number };

/**
 * Los pedazos con voz: todo lo que hay entre silencios, con su aire antes y después.
 * Con las palabras de whisper, ningún pedazo arranca después de `guarda` antes de una palabra (así no se come
 * el arranque de lo que se dice suave) y los pedacitos con una palabra adentro no se tiran.
 * `finVoz` es dónde termina la voz de verdad (a -40 dB): de ahí sale la cola natural del final.
 */
export function tramosDeVoz(
  dur: number,
  pausas: Tramo[],
  o: { antes: number; despues: number },
  palabras: Palabra[] = [],
  finVoz = dur,
): Tramo[] {
  const lista = pausas.map((p) => ({ inicio: Math.max(0, p.inicio), fin: Math.min(dur, p.fin) })).filter((p) => p.fin > p.inicio).sort((a, b) => a.inicio - b.inicio);
  const crudos: Tramo[] = [];
  let desde = 0;
  for (const p of lista) {
    if (p.inicio > desde) crudos.push({ inicio: desde, fin: p.inicio });
    desde = Math.max(desde, p.fin);
  }
  if (dur > desde) crudos.push({ inicio: desde, fin: dur });
  const conPalabra = (t: Tramo) => palabras.some((w) => w.desde < t.fin && w.hasta > t.inicio);
  const conVoz = crudos.filter((t) => t.fin - t.inicio >= CORTES.pedacito || conPalabra(t));
  const pedazos = conVoz.map((t) => ({ inicio: Math.max(0, t.inicio - o.antes), fin: Math.min(dur, t.fin + o.despues) }));
  // Guarda con las palabras: si una palabra arranca en lo que se iba a cortar (o pegada al arranque), el pedazo arranca antes.
  for (let i = 0; i < pedazos.length; i++) {
    const tope = i ? pedazos[i - 1].fin : 0;
    for (const w of palabras) {
      if (w.desde >= tope && w.desde < pedazos[i].inicio + CORTES.guarda) pedazos[i].inicio = Math.max(tope, Math.min(pedazos[i].inicio, w.desde - CORTES.guarda));
    }
  }
  // Une los que se tocan.
  const out: Tramo[] = [];
  for (const t of pedazos) {
    const ult = out[out.length - 1];
    if (ult && t.inicio - ult.fin < 0.02) ult.fin = Math.max(ult.fin, t.fin);
    else out.push({ ...t });
  }
  // La cola del final: la última palabra nunca queda cortada. Lo que se deja después de la voz fuerte no pasa
  // de 0,28 s, así la auditoría (-32 dB, más de 0,3 s) no lo cuenta como pausa.
  const ult = out[out.length - 1];
  if (ult && finVoz <= dur) {
    const cola = dur - finVoz >= 0.3 ? CORTES.colaLarga : CORTES.colaCorta;
    const tope = (conVoz[conVoz.length - 1]?.fin ?? dur) + 0.28;
    ult.fin = Math.min(dur, Math.max(ult.fin, Math.min(finVoz + cola, tope)));
  }
  return out;
}

/** Dónde termina la voz: el arranque del silencio (a -40 dB) que llega hasta el final. Si no hay, el final. */
async function dondeTerminaLaVoz(archivo: string, dur: number) {
  const s = await silencios(archivo, 0.05, CORTES.finVoz);
  const ult = s[s.length - 1];
  return ult && (!Number.isFinite(ult.fin) || ult.fin >= dur - 0.05) ? ult.inicio : dur;
}

/** Transcribe con whisper si hay; si falla, sigue sin palabras (el corte se hace igual, solo con los silencios). */
async function oir(video: string, motor: Awaited<ReturnType<typeof motorWhisper>>) {
  if (!motor) return [] as Palabra[];
  try {
    return await transcribir(video, motor);
  } catch (e) {
    console.error("Whisper:", (e as Error).message);
    return [] as Palabra[];
  }
}

/** Cuántas palabras de `antes` siguen en `despues`, en orden (subsecuencia común más larga, sin tildes ni signos). */
export function palabrasQueEstan(antes: Palabra[], despues: Palabra[]) {
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ]/g, "");
  const a = antes.map((p) => norm(p.texto)).filter(Boolean);
  const b = despues.map((p) => norm(p.texto)).filter(Boolean);
  let fila = new Array(b.length + 1).fill(0) as number[];
  for (let i = 1; i <= a.length; i++) {
    const nueva = new Array(b.length + 1).fill(0) as number[];
    for (let j = 1; j <= b.length; j++) nueva[j] = a[i - 1] === b[j - 1] ? fila[j - 1] + 1 : Math.max(fila[j], nueva[j - 1]);
    fila = nueva;
  }
  return { antes: a.length, estan: fila[b.length] };
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

/** El zoom de cada pedazo: alterna 1 → 1,14 → 1… en cada corte. Un pedazo de menos de 0,5 s sigue con el del anterior (no salta). */
export function zoomsAlternados(tramos: Tramo[]) {
  let z = 1;
  return tramos.map((t, i) => {
    if (i > 0 && t.fin - t.inicio >= 0.5) z = z === 1 ? 1.14 : 1;
    return z;
  });
}

/**
 * Corta y une los tramos. Con `zoom` (el tamaño del video), el zoom alternado del modo sin animaciones, con origen
 * arriba del centro (~40 % del alto, donde suele estar la cara). Nunca se espeja ni se le pone filtro a la cara.
 */
async function cortarYUnir(entrada: string, salida: string, tramos: Tramo[], zoom?: { ancho: number; alto: number }) {
  const f = (n: number) => n.toFixed(3);
  const zooms = zoom ? zoomsAlternados(tramos) : tramos.map(() => 1);
  const encuadre = (z: number) => {
    if (!zoom || z === 1) return "";
    const W = par(zoom.ancho), H = par(zoom.alto);
    const ZW = par(W * z), ZH = par(H * z);
    return `,scale=${ZW}:${ZH},crop=${W}:${H}:${Math.round((ZW - W) / 2)}:${Math.round((ZH - H) * 0.4)},setsar=1`;
  };
  const partes = tramos.map((t, i) => {
    const d = t.fin - t.inicio;
    const fundido = Math.min(0.03, d / 4);
    return (
      `[0:v]trim=start=${f(t.inicio)}:end=${f(t.fin)},setpts=PTS-STARTPTS${encuadre(zooms[i])}[v${i}];` +
      `[0:a]atrim=start=${f(t.inicio)}:end=${f(t.fin)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${f(fundido)},afade=t=out:st=${f(Math.max(0, d - fundido))}:d=${f(fundido)}[a${i}];`
    );
  });
  const grafo = `${partes.join("")}${tramos.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${tramos.length}:v=1:a=1[v][a0];[a0]loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
  const r = await correr("ffmpeg", [
    "-hide_banner", "-y", "-i", entrada, "-filter_complex", grafo,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", salida,
  ]);
  if (r.codigo !== 0) throw new Error(`ffmpeg no pudo armar el video: ${ultimoError(r.error)}`);
}

/**
 * La auditoría del método (sección 14): pausas (-32 dB, más de 0,3 s), cuadros negros (desde 0,03 s), sonoridad
 * medida, grillas de cuadros cada 0,2 s de todo el video (quedan guardadas para mirarlas) y, si hay whisper, que
 * estén todas las palabras. No dice que revisó los cuadros: las grillas las mira una persona o el Editor.
 */
async function auditar(archivo: string, dir: string, palabras?: { antes: Palabra[]; despues: Palabra[] }): Promise<Auditoria> {
  const pausas = (await silencios(archivo, 0.3)).filter((p) => p.fin - p.inicio > 0.3 && Number.isFinite(p.fin));
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-vf", "blackdetect=d=0.03:pix_th=0.10", "-an", "-f", "null", "-"]);
  const negros = (r.error.match(/black_start:/g) ?? []).length;
  const lufs = await sonoridad(archivo);
  const lufsOk = lufs !== null && Math.abs(lufs + 14) <= 1.5;
  const grillas = await grillasDeAuditoria(archivo, path.join(dir, "auditoria"));
  const cuenta = palabras?.antes.length && palabras.despues.length ? palabrasQueEstan(palabras.antes, palabras.despues) : undefined;
  // whisper no escucha igual dos veces: se acepta que difiera en 3 % de las palabras.
  const palabrasOk = !cuenta || cuenta.estan >= Math.floor(cuenta.antes * 0.97);
  const coma = (n: number) => n.toFixed(1).replace(".", ",");
  const detalle = [
    pausas.length ? `Quedan ${pausas.length} pausa(s) de más de 0,3 s.` : "Ninguna pausa de más de 0,3 s.",
    negros ? `Hay ${negros} tramo(s) en negro.` : "Ningún cuadro en negro.",
    lufs === null ? "Hay que revisar el audio: no pude medir la sonoridad." : lufsOk ? `Audio parejo: medí ${coma(lufs)} LUFS (la meta es -14).` : `Hay que revisar el audio: medí ${coma(lufs)} LUFS y la meta es -14.`,
    ...(cuenta
      ? [palabrasOk ? `Están las palabras: whisper oyó ${cuenta.estan} de ${cuenta.antes} después del corte.` : `Faltan palabras: whisper oyó ${cuenta.estan} de ${cuenta.antes} después del corte.`]
      : []),
    ...(grillas ? [`Guardé ${grillas} grilla${grillas === 1 ? "" : "s"} con un cuadro cada 0,2 s para revisar el video entero.`] : []),
  ];
  return { pausas_largas: pausas.length, negros, ok: !pausas.length && !negros && lufsOk && palabrasOk, detalle, lufs, grillas, ...(cuenta ? { palabras: cuenta } : {}) };
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

/** El agente Editor decide el gancho, los textos en pantalla y qué palabras corregir. */
async function planDelEditor(palabras: Palabra[], duracionS: number, animacion: OpcionesEdicion["animacion"], estilo: string) {
  const creador = (await leerCreador()) ?? { usuario: "editor", aQueSeDedica: "", queVende: "", aQuien: "", historia: "", captions: [] };
  let plan = null as ResultadoEditor | null;
  await runAgentLocal(
    Pedido.parse({ tarea: "editor", creador, respuestas: [], transcripcion: transcripcionEnTramos(palabras), duracion: duracionS, animacion, estilo }),
    [],
    (e) => {
      if (e.tipo === "resultado") plan = e.data as ResultadoEditor;
    },
    {},
  );
  return plan as ResultadoEditor | null;
}

/** Subtítulos y textos: con lo que oyó whisper en el video editado, le pide el plan al Editor y los quema con el estilo. */
async function ponerTextos(id: string, video: string, oidas: Palabra[], o: OpcionesEdicion, estilo: Estilo, ref: Referencia | null, preset: PresetSubs | null, paso: (t: string) => Promise<void>) {
  if (!oidas.length) throw new Error("No escuché palabras en el video.");
  // Lo que whisper escribe mal seguido (tildes del voseo, marcas) se corrige antes de que lo vea el Editor.
  let palabras = corregirPalabras(oidas);
  const dur = await duracion(video);
  await paso(ref ? "Tu editor elige el gancho y los textos, con el estilo de tu referencia" : "Tu editor elige el gancho y los textos clave");
  // Con referencia, cuántos textos pone sale de ella; si no, de lo que eligió.
  const animacion = ref ? ({ ninguno: "poca", pocos: "media", muchos: "mucha" } as const)[estilo.textos.cantidad] : o.animacion;
  const plan = await planDelEditor(palabras, dur, animacion, estiloEnUnaFrase(ref)).catch(() => null);
  if (plan?.correcciones.length) {
    const mapa = new Map(plan.correcciones.map((c) => [c.mal.toLowerCase(), c.bien]));
    palabras = palabras.map((p) => {
      const limpia = p.texto.toLowerCase().replace(/[.,;:!?¿¡…]/g, "");
      const bien = mapa.get(limpia);
      return bien ? { ...p, texto: p.texto.replace(new RegExp(limpia.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), bien) } : p;
    });
  }
  await paso(ref ? "Poniendo subtítulos y textos como en tu referencia" : "Poniendo subtítulos y textos animados");
  const v = await medir(video);
  const gancho = estilo.textos.gancho && plan?.gancho?.trim() ? { texto: plan.gancho.trim(), desde: 0, hasta: Math.min(2, dur) } : null;
  const textos = estilo.textos.cantidad === "ninguno" ? [] : ordenarTextos(plan?.textos ?? [], dur);
  const ass = armarAss({ ancho: v.ancho || 1080, alto: v.alto || 1920, palabras, subs: estilo.subtitulos, acento: estilo.subtitulos.color_resaltado, posTextos: lugarDeTextos(estilo), gancho, textos, preset });
  const dir = carpetaVideo(id);
  await writeFile(path.join(dir, "subtitulos.ass"), ass);
  const r = await correr("ffmpeg", ["-hide_banner", "-y", "-i", path.basename(video), "-vf", "ass=subtitulos.ass", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", "con-textos.mp4"], dir);
  if (r.codigo !== 0) throw new Error(`No pude poner los subtítulos: ${ultimoError(r.error)}`);
  await rename(path.join(dir, path.basename(video)), path.join(dir, "sin-textos.mp4"));
  await rename(path.join(dir, "con-textos.mp4"), path.join(dir, "editado.mp4"));
  return { subtitulos: "listos" as const, gancho: gancho?.texto, textos: textos.length, notas: plan?.notas };
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
    // Los subtítulos de la app siguen los estilos del método; los de una referencia, lo que leyó el Editor.
    const preset = o.estilo === "referencia" && ref ? null : presetDeSubs(o.estilo);
    const antes = await duracion(original);
    const charla = antes > LARGO_CHARLA;
    const vara = charla ? CORTES.charla : CORTES.reel;
    const motor = await motorWhisper();
    if (motor) await paso("Escuchando tus tomas palabra por palabra, para no cortar ninguna");
    const oidasAntes = await oir(original, motor);
    await paso(charla ? "Es un video largo: lo corto como charla, solo las pausas de más de 0,18 s" : "Buscando dónde hablás y dónde hay pausas");
    const pausas = await silencios(original, vara.silencio, vara.umbral);
    const finVoz = await dondeTerminaLaVoz(original, antes);
    const tramos = tramosDeVoz(antes, pausas, vara, oidasAntes, finVoz);
    const cortadas = Math.max(0, tramos.length - 1);
    const salida = path.join(dir, "editado.mp4");
    const pasada1 = path.join(dir, "pasada1.mp4");
    // Zoom alternado en cada corte solo con los subtítulos grandes (el modo sin animaciones del método).
    const m = await medir(original);
    const zoom = preset === "hormozi" && m.ancho && m.alto ? { ancho: m.ancho, alto: m.alto } : undefined;
    await paso(cortadas ? `Cortando ${cortadas} pausa${cortadas === 1 ? "" : "s"} sin cortar palabras${zoom ? ", con zoom alternado en cada corte" : ""}` : "No encontré pausas para cortar: normalizo el audio");
    await cortarYUnir(original, pasada1, tramos.length ? tramos : [{ inicio: 0, fin: antes }], zoom);
    // Segunda pasada: agarra lo que haya quedado de más de 0,3 s al unir (la vara de la auditoría).
    await paso("Segunda pasada: revisando lo que quedó al unir");
    const dur1 = await duracion(pasada1);
    const quedan = (await silencios(pasada1, 0.3)).filter((p) => Math.min(dur1, p.fin) - p.inicio > 0.3);
    if (quedan.length) {
      await cortarYUnir(pasada1, salida, tramosDeHabla(dur1, quedan));
      await unlink(pasada1).catch(() => {});
    } else await rename(pasada1, salida);
    if (motor) await paso("Escuchando el video editado: subtítulos y que no falte ninguna palabra");
    const oidasDespues = await oir(salida, motor);
    let textos: Awaited<ReturnType<typeof ponerTextos>> | { subtitulos: "apagados" | "error" | "sin_whisper" } = { subtitulos: "apagados" };
    if (o.estilo !== "ninguno") {
      if (!motor) textos = { subtitulos: "sin_whisper" };
      else {
        try {
          textos = await ponerTextos(id, salida, oidasDespues, o, estilo, ref, preset, paso);
        } catch (e) {
          console.error("Subtítulos:", (e as Error).message);
          textos = { subtitulos: "error" };
          await paso("No pude poner los subtítulos: te dejo el video sin pausas");
        }
      }
    }
    await paso("Auditando: pausas, cuadros negros, audio, palabras y grillas de cuadros");
    const auditoria = await auditar(salida, dir, motor ? { antes: oidasAntes, despues: oidasDespues } : undefined);
    const despues = await duracion(salida);
    await stat(salida);
    t.resultado = {
      antes_s: antes, despues_s: despues, pausas_cortadas: cortadas, auditoria, ...textos,
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
