// Editor de video, modo "Muestro productos o lugares": sirve para cualquier rubro (una marca de ropa, una tienda, un
// local de comida, una inmobiliaria, un profesional que muestra su trabajo). La persona sube varias tomas y, si quiere,
// una música y un video de referencia. El agente Editor mira 4 cuadros de cada toma y decide el montaje (skill
// montaje-producto): qué tramo de cada una, en qué orden, el gancho, los textos y el cierre. El código revisa ese plan
// (tramos dentro de cada toma, ritmo, largo total), arma el reel vertical 1080 × 1920 con ffmpeg (recorte, o fondo
// desenfocado si la toma es horizontal), pone los textos con el estilo y el color de la marca, la placa final con el
// llamado a la acción y la música con entrada y salida suaves, y lo audita antes de entregar.
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { runAgentLocal } from "../agent/claudeLocal";
import type { Imagen } from "../agent/run";
import { Pedido, SIN_USUARIO, type ResultadoMontaje } from "../agent/tasks";
import { leerCreador } from "../diario/archivos";
import { carpetaVideo, guardar, nuevoTrabajo, type Auditoria, type Corte, type OpcionesEdicion } from "./editar";
import { estiloEnUnaFrase, estiloFinal, filtrosDeColor, lugarDeTextos, referenciaDe, resumenDeReferencia, type Estilo, type Referencia } from "./estilo";
import { correr, hojaDeCuadros, medir, ultimoError, type Medida } from "./ffmpeg";
import { archivoDe, tomasDe } from "./subida";
import { armarAss, type Placa, type TextoPantalla } from "./subtitulos";

const W = 1080, H = 1920, FPS = 30;
/** La placa final dura 2 s (el preset: placas de 2 s como máximo). */
const PLACA = 2;
const TOTAL_MAX = 30;

type Toma = Medida & { n: number; archivo: string };
type Limites = { min: number; max: number };

const par = (n: number) => Math.max(2, Math.round(n / 2) * 2);
const aCuadros = (s: number) => Math.max(1, Math.round(s * FPS)) / FPS;
const coma = (n: number) => n.toFixed(1).replace(".", ",");
/** Texto para la pantalla: sin emojis (la letra no los dibuja), sin espacios de más y corto. */
const limpiar = (t: string, largo: number) => (t ?? "").replace(/\p{Extended_Pictographic}|️|‍/gu, "").replace(/\s+/g, " ").trim().slice(0, largo).trim();

/** Cuánto puede durar cada plano: lo que mide la referencia o, si no hay, el preset (algo nuevo cada 1 a 3 s). */
function limitesDeRitmo(ref: Referencia | null): Limites {
  if (!ref) return { min: 1, max: 3.2 };
  return { min: Math.min(1.2, Math.max(0.5, ref.ritmo * 0.7)), max: Math.min(3.2, Math.max(1, ref.ritmo * 1.4)) };
}

/**
 * Revisa el plan del agente con código: que cada corte sea de una toma que existe, que quede adentro de la toma,
 * que dure lo que permite el ritmo, que no repita el tramo anterior y que el total no pase de 30 s.
 */
export function revisarPlan(cortes: Corte[], tomas: { n: number; dur: number }[], lim: Limites) {
  const durDe = new Map(tomas.map((t) => [t.n, t.dur]));
  const out: Corte[] = [];
  let corregidos = 0, total = 0;
  for (const c of cortes) {
    const dur = durDe.get(c.toma);
    if (!dur || !Number.isFinite(c.desde) || !Number.isFinite(c.hasta)) { corregidos++; continue; }
    const pedido = Math.abs(c.hasta - c.desde);
    const largo = aCuadros(Math.min(lim.max, Math.max(lim.min, pedido), dur - 0.05));
    let desde = Math.max(0, Math.min(c.desde, c.hasta));
    if (desde + largo > dur - 0.05) desde = Math.max(0, dur - 0.05 - largo);
    const hasta = desde + largo;
    const anterior = out[out.length - 1];
    if (anterior && anterior.toma === c.toma && desde < anterior.hasta && hasta > anterior.desde) { corregidos++; continue; }
    if (largo < 0.4) { corregidos++; continue; }
    if (total + largo > TOTAL_MAX + 0.01) { corregidos++; break; }
    if (Math.abs(desde - Math.min(c.desde, c.hasta)) > 0.05 || Math.abs(largo - pedido) > 0.05) corregidos++;
    out.push({ toma: c.toma, desde, hasta, texto: limpiar(c.texto, 32) });
    total += largo;
  }
  return { cortes: out, corregidos };
}

/** Sin agente: el tramo del medio de cada toma, en el orden en que se subieron. La app avisa que es un orden simple. */
function planSimple(tomas: Toma[], lim: Limites): Corte[] {
  return tomas.map((t) => {
    const largo = Math.min((lim.min + lim.max) / 2, t.dur);
    const desde = Math.max(0, t.dur / 2 - largo / 2);
    return { toma: t.n, desde, hasta: desde + largo, texto: "" };
  });
}

async function planDelMontaje(tomas: Toma[], imagenes: Imagen[], o: OpcionesEdicion, ref: Referencia | null) {
  const creador = (await leerCreador()) ?? { usuario: "editor", aQueSeDedica: "", queVende: "", aQuien: "", historia: "", captions: [] };
  let plan = null as ResultadoMontaje | null;
  let error = "";
  await runAgentLocal(
    Pedido.parse({
      tarea: "montaje", creador, respuestas: [],
      tomas: tomas.map((t) => ({ n: t.n, duracion: Math.round(t.dur * 10) / 10 })),
      marca: o.marca, producto: o.producto, precio: o.precio, cta: o.cta,
      ritmo: ref?.ritmo, estilo: estiloEnUnaFrase(ref),
    }),
    imagenes,
    (e) => {
      if (e.tipo === "resultado") plan = e.data as ResultadoMontaje;
      if (e.tipo === "error") error = e.mensaje;
    },
    {},
  );
  return { plan: plan as ResultadoMontaje | null, error, usuario: creador.usuario };
}

/** Arma el reel en una sola pasada de ffmpeg: cada corte encuadrado en vertical, la placa final, el color, los textos y el audio. */
async function armarReel(dir: string, tomas: Map<number, Toma>, cortes: Corte[], estilo: Estilo, musica: string | null, placa: string | null) {
  const args = ["-hide_banner", "-y"];
  // Una entrada por corte, con -ss y -t: ffmpeg lee solo ese tramo de la toma.
  for (const c of cortes) args.push("-ss", c.desde.toFixed(3), "-t", (c.hasta - c.desde + 0.1).toFixed(3), "-i", path.basename(tomas.get(c.toma)!.archivo));
  const iPlaca = cortes.length;
  if (placa) args.push("-loop", "1", "-framerate", String(FPS), "-t", String(PLACA + 0.1), "-i", path.basename(placa));
  const iMusica = cortes.length + (placa ? 1 : 0);
  if (musica) args.push("-stream_loop", "-1", "-i", path.basename(musica));
  const total = cortes.reduce((s, c) => s + (c.hasta - c.desde), 0) + PLACA;
  const g: string[] = [];
  cortes.forEach((c, i) => {
    const t = tomas.get(c.toma)!;
    const d = (c.hasta - c.desde).toFixed(3);
    // Vertical: se recorta para llenar. Horizontal o cuadrada: entera, sobre la misma toma desenfocada de fondo.
    const encuadre =
      t.ancho / t.alto <= 0.7
        ? `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`
        : `split=2[f${i}][p${i}];[f${i}]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=${W}:${H},eq=brightness=-0.06[fb${i}];` +
          `[p${i}]scale=${W}:${H}:force_original_aspect_ratio=decrease[pp${i}];[fb${i}][pp${i}]overlay=(W-w)/2:(H-h)/2`;
    const cuadros = Math.max(1, Math.round((c.hasta - c.desde) * FPS));
    const zoom =
      estilo.zoom === "lento"
        ? `,scale=${W * 2}:${H * 2},zoompan=z='min(1+0.08*on/${cuadros},1.08)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`
        : estilo.zoom === "alternado" && i % 2 === 1
          ? `,scale=${par(W * 1.12)}:${par(H * 1.12)},crop=${W}:${H}`
          : "";
    const destello = estilo.transicion === "destello" && i > 0 ? ",fade=t=in:st=0:d=0.12:color=white" : "";
    g.push(`[${i}:v]setpts=PTS-STARTPTS,fps=${FPS},${encuadre}${zoom},setsar=1,format=yuv420p,trim=duration=${d},setpts=PTS-STARTPTS${destello}[v${i}]`);
  });
  g.push(
    placa
      ? `[${iPlaca}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},scale=270:480,boxblur=12:2,scale=${W}:${H},eq=brightness=-0.22,fps=${FPS},setsar=1,format=yuv420p,trim=duration=${PLACA},setpts=PTS-STARTPTS[vp]`
      : `color=c=0x111111:s=${W}x${H}:r=${FPS}:d=${PLACA},setsar=1,format=yuv420p[vp]`,
  );
  const conSonido = cortes.some((c) => tomas.get(c.toma)!.audio);
  if (musica) {
    g.push(`${cortes.map((_, i) => `[v${i}]`).join("")}[vp]concat=n=${cortes.length + 1}:v=1:a=0[vc]`);
    g.push(`[${iMusica}:a]atrim=duration=${total.toFixed(3)},asetpts=PTS-STARTPTS,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,afade=t=in:st=0:d=0.25,afade=t=out:st=${Math.max(0, total - 1.2).toFixed(3)}:d=1.2[a]`);
  } else {
    cortes.forEach((c, i) => {
      const d = c.hasta - c.desde;
      g.push(
        tomas.get(c.toma)!.audio
          ? `[${i}:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,atrim=duration=${d.toFixed(3)},afade=t=in:st=0:d=0.03,afade=t=out:st=${Math.max(0, d - 0.03).toFixed(3)}:d=0.03[a${i}]`
          : `anullsrc=r=48000:cl=stereo,atrim=duration=${d.toFixed(3)}[a${i}]`,
      );
    });
    g.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${PLACA}[ap]`);
    g.push(`${cortes.map((_, i) => `[v${i}][a${i}]`).join("")}[vp][ap]concat=n=${cortes.length + 1}:v=1:a=1[vc][ac]`);
    g.push(`[ac]${conSonido ? "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" : "anull"}[a]`);
  }
  g.push(`[vc]${[...filtrosDeColor(estilo.color), "ass=montaje.ass"].join(",")}[v]`);
  const r = await correr("ffmpeg", [
    ...args, "-filter_complex", g.join(";"), "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", "editado.mp4",
  ], dir);
  if (r.codigo !== 0) throw new Error(`ffmpeg no pudo armar el reel: ${ultimoError(r.error)}`);
}

async function auditarMontaje(archivo: string, cortes: Corte[], lim: Limites, audio: "musica" | "tomas" | "ninguno"): Promise<Auditoria> {
  const m = await medir(archivo);
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-vf", "blackdetect=d=0.1:pix_th=0.10", "-an", "-f", "null", "-"]);
  const negros = (r.error.match(/black_start:/g) ?? []).length;
  const largo = Math.max(...cortes.map((c) => c.hasta - c.desde));
  const vertical = m.ancho === W && m.alto === H;
  const ritmoOk = largo <= lim.max + 0.05;
  const detalle = [
    vertical ? "Formato vertical 1080 × 1920, listo para Reels." : `Hay un problema con el formato: salió de ${m.ancho} × ${m.alto}.`,
    ritmoOk ? `${cortes.length} planos: algo nuevo cada ${coma(largo)} s como mucho.` : `Hay planos de más de ${coma(lim.max)} s.`,
    negros ? `Hay ${negros} tramo(s) en negro.` : "Ningún cuadro en negro.",
    audio === "musica" ? "Música con entrada y salida suaves, a -14 LUFS." : audio === "tomas" ? "El sonido de tus tomas, parejo a -14 LUFS." : "Hay que ponerle música: tus tomas no tenían sonido. Sumale una canción al publicarlo.",
  ];
  if (m.dur < 8) detalle.push(`Hay pocas tomas: el reel dura ${coma(m.dur)} s. Con 2 o 3 tomas más queda mejor.`);
  return { pausas_largas: 0, negros, ok: vertical && !negros && ritmoOk, detalle };
}

/** Monta el reel con las tomas subidas (toma-1, toma-2… en su carpeta) y deja editado.mp4. Corre en segundo plano. */
export async function montar(id: string, o: OpcionesEdicion) {
  const { t, paso } = nuevoTrabajo(id);
  const dir = carpetaVideo(id);
  await mkdir(dir, { recursive: true });
  try {
    const archivos = await tomasDe(dir);
    if (!archivos.length) throw new Error("No llegó ninguna toma. Subí tus videos de nuevo.");
    await paso(`Midiendo tus ${archivos.length} toma${archivos.length === 1 ? "" : "s"}`);
    const tomas: Toma[] = [];
    for (const [i, archivo] of archivos.entries()) {
      const m = await medir(archivo);
      if (m.dur >= 0.5 && m.ancho) tomas.push({ ...m, n: i + 1, archivo });
    }
    if (!tomas.length) throw new Error("No pude leer tus tomas. Probá con MP4 o MOV.");
    const avisos: string[] = [];
    if (tomas.length < archivos.length) avisos.push(`${archivos.length - tomas.length} toma(s) no se pudieron leer o duraban menos de medio segundo.`);
    const { ref, aviso } = await referenciaDe(dir, "productos", paso);
    if (aviso) avisos.push(aviso);
    const estilo = estiloFinal(o, ref);
    const lim = limitesDeRitmo(ref);

    await paso(`Mirando 4 cuadros de cada toma`);
    const imagenes: Imagen[] = [];
    for (const tm of tomas) {
      const img = await hojaDeCuadros(tm.archivo, tm, [0, 1, 2, 3].map((j) => (tm.dur * (j + 0.5)) / 4), path.join(dir, `cuadros-${tm.n}.jpg`), 480, `la toma ${tm.n}`);
      if (img) imagenes.push(img);
    }
    await paso("Tu editor elige el mejor tramo de cada toma, el orden y los textos");
    const { plan, error, usuario } = await planDelMontaje(tomas, imagenes, o, ref);
    await paso("Revisando el plan con código: tramos, ritmo y largo total");
    let revisado = revisarPlan(plan?.cortes ?? [], tomas, lim);
    let origen: "agente" | "simple" = "agente";
    if (!revisado.cortes.length) {
      origen = "simple";
      revisado = revisarPlan(planSimple(tomas, lim), tomas, lim);
      avisos.push(`Tu editor no respondió${error ? ` (${error.replace(/\.$/, "")})` : ""}: armé un montaje simple, en el orden en que subiste las tomas.`);
    }
    const cortes = revisado.cortes;
    const porToma = new Map(tomas.map((tm) => [tm.n, tm]));

    // Los textos, en el tiempo del reel: el gancho en los primeros 2 s y el de cada corte mientras dura ese corte.
    const enPantalla = cortes.reduce((s, c) => s + (c.hasta - c.desde), 0);
    const textoGancho = limpiar(plan?.gancho ?? "", 40);
    const gancho: TextoPantalla | null = textoGancho ? { texto: textoGancho, desde: 0, hasta: Math.min(2, enPantalla) } : null;
    const textos: TextoPantalla[] = [];
    let reloj = 0;
    for (const c of cortes) {
      const ini = reloj, fin = reloj + (c.hasta - c.desde);
      reloj = fin;
      if (!c.texto || c.texto.toLowerCase() === textoGancho.toLowerCase()) continue;
      const desde = Math.max(ini + 0.08, gancho && ini < gancho.hasta ? gancho.hasta + 0.1 : 0);
      if (fin - 0.06 - desde >= 0.6) textos.push({ texto: c.texto, desde, hasta: fin - 0.06 });
    }
    // La placa final: el llamado a la acción, con la marca (o el @) arriba y el precio abajo si no apareció antes.
    const cta = limpiar(plan?.cierre || o.cta, 48);
    const arriba = limpiar(o.marca, 40) || (usuario && usuario !== SIN_USUARIO && usuario !== "editor" ? `@${usuario.replace(/^@/, "")}` : "");
    const precio = limpiar(o.precio, 40);
    const yaDijoPrecio = !!precio && cortes.some((c) => c.texto.toLowerCase().includes(precio.toLowerCase()));
    const cierre: Placa | null = cta ? { texto: cta, arriba, abajo: yaDijoPrecio ? "" : precio, desde: enPantalla + 0.1, hasta: enPantalla + PLACA } : null;
    await writeFile(
      path.join(dir, "montaje.ass"),
      armarAss({ ancho: W, alto: H, palabras: [], subs: estilo.subtitulos, acento: estilo.subtitulos.color_resaltado, posTextos: lugarDeTextos(estilo), gancho, textos, cierre }),
    );

    // El fondo de la placa: el último cuadro del último corte, desenfocado.
    const ultimo = cortes[cortes.length - 1];
    const placa = path.join(dir, "placa.jpg");
    const conPlaca = (await correr("ffmpeg", ["-hide_banner", "-y", "-ss", Math.max(0, ultimo.hasta - 0.1).toFixed(2), "-i", porToma.get(ultimo.toma)!.archivo, "-frames:v", "1", "-q:v", "3", placa])).codigo === 0;
    const archivoMusica = await archivoDe(dir, "musica");
    const musica = archivoMusica && (await medir(archivoMusica)).audio ? archivoMusica : null;
    if (archivoMusica && !musica) avisos.push("La música que subiste no tiene sonido: usé el de tus tomas.");

    await paso(`Encuadrando en vertical y uniendo ${cortes.length} planos`);
    await paso(musica ? "Poniendo el gancho, los textos, la placa final y tu música" : "Poniendo el gancho, los textos y la placa final");
    await armarReel(dir, porToma, cortes, estilo, musica, conPlaca ? placa : null);
    await paso("Auditando: formato, planos, cuadros negros y audio");
    const salida = path.join(dir, "editado.mp4");
    const audio = musica ? "musica" : cortes.some((c) => porToma.get(c.toma)!.audio) ? "tomas" : "ninguno";
    const auditoria = await auditarMontaje(salida, cortes, lim, audio);
    await stat(salida);
    t.resultado = {
      antes_s: tomas.reduce((s, tm) => s + tm.dur, 0),
      despues_s: (await medir(salida)).dur,
      pausas_cortadas: 0,
      auditoria,
      subtitulos: "apagados",
      gancho: gancho?.texto,
      textos: textos.length,
      notas: plan?.notas,
      modo: "productos",
      tomas: tomas.length,
      cortes,
      cierre: cierre?.texto,
      plan: origen,
      corregidos: revisado.corregidos,
      referencia: resumenDeReferencia(ref, estilo),
      avisos,
    };
    t.estado = "listo";
    await paso("Listo");
  } catch (e) {
    t.estado = "error";
    t.error = (e as Error).message || "Algo falló armando el reel.";
    await guardar(t);
  }
}
