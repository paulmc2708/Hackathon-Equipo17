// Lo que el editor le pide a ffmpeg: correrlo, medir un video y sacar cuadros para que el agente los mire.
import { spawn } from "node:child_process";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Imagen } from "../agent/run";

/** Corre ffmpeg/ffprobe y devuelve el código y lo último que escribió en stderr. */
export function correr(bin: string, args: string[], cwd?: string): Promise<{ codigo: number; salida: string; error: string }> {
  return new Promise((ok) => {
    const h = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
    let salida = "", error = "";
    h.stdout.setEncoding("utf8").on("data", (d: string) => (salida = (salida + d).slice(-200000)));
    h.stderr.setEncoding("utf8").on("data", (d: string) => (error = (error + d).slice(-400000)));
    h.on("error", () => ok({ codigo: 127, salida, error: "no instalado" }));
    h.on("close", (c) => ok({ codigo: c ?? 1, salida, error }));
  });
}

/** Las últimas líneas de error de ffmpeg, cortas, para la consola o el mensaje. */
export const ultimoError = (error: string) => error.split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 200);

export async function duracion(archivo: string) {
  const r = await correr("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", archivo]);
  if (r.codigo === 127) throw new Error("Falta ffmpeg en esta compu. Instalalo con: brew install ffmpeg");
  return Number(r.salida.trim()) || 0;
}

export async function tieneAudio(archivo: string) {
  const r = await correr("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", archivo]);
  return r.salida.trim().length > 0;
}

export type Medida = { dur: number; ancho: number; alto: number; audio: boolean };

/** Duración, tamaño tal como se ve (los videos del celular vienen girados) y si tiene sonido. */
export async function medir(archivo: string): Promise<Medida> {
  const r = await correr("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height:stream_tags=rotate:stream_side_data=rotation", "-of", "json", archivo]);
  if (r.codigo === 127) throw new Error("Falta ffmpeg en esta compu. Instalalo con: brew install ffmpeg");
  type Stream = { codec_type?: string; width?: number; height?: number; tags?: { rotate?: string }; side_data_list?: { rotation?: number }[] };
  let j: { streams?: Stream[]; format?: { duration?: string } } = {};
  try {
    j = JSON.parse(r.salida);
  } catch {}
  const v = j.streams?.find((s) => s.codec_type === "video");
  const giro = Math.abs(Number(v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? v?.tags?.rotate ?? 0)) % 180;
  const [ancho, alto] = giro === 90 ? [v?.height ?? 0, v?.width ?? 0] : [v?.width ?? 0, v?.height ?? 0];
  return { dur: Number(j.format?.duration) || 0, ancho, alto, audio: !!j.streams?.some((s) => s.codec_type === "audio") };
}

/** Silencios de más de `minimo` segundos. El umbral de la auditoría es -32 dB; para encontrar la voz se usa -30 dB. */
export async function silencios(archivo: string, minimo = 0.3, umbral = -32) {
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-af", `silencedetect=n=${umbral}dB:d=${minimo}`, "-f", "null", "-"]);
  const lista: { inicio: number; fin: number }[] = [];
  let inicio: number | null = null;
  for (const l of r.error.split("\n")) {
    const a = l.match(/silence_start: (-?[\d.]+)/);
    const b = l.match(/silence_end: (-?[\d.]+)/);
    if (a) inicio = Math.max(0, Number(a[1]));
    if (b && inicio !== null) {
      lista.push({ inicio, fin: Number(b[1]) });
      inicio = null;
    }
  }
  if (inicio !== null) lista.push({ inicio, fin: Infinity });
  return lista;
}

/** La sonoridad integrada del audio en LUFS (ebur128), medida, no supuesta. null si no se pudo medir. */
export async function sonoridad(archivo: string): Promise<number | null> {
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-vn", "-af", "ebur128=framelog=quiet", "-f", "null", "-"]);
  const resumen = r.error.slice(r.error.lastIndexOf("Summary:"));
  const m = resumen.match(/I:\s+(-?[\d.]+) LUFS/);
  return m ? Number(m[1]) : null;
}

/**
 * Grillas con un cuadro cada 0,2 s de TODO el video (40 cuadros por grilla, 216 px de ancho cada uno), como pide
 * la auditoría del método. Quedan en `carpeta` para mirarlas (el código no las mira solo). Devuelve cuántas salieron.
 */
export async function grillasDeAuditoria(archivo: string, carpeta: string): Promise<number> {
  await mkdir(carpeta, { recursive: true });
  const r = await correr("ffmpeg", ["-hide_banner", "-y", "-i", archivo, "-an", "-vf", "fps=5,scale=216:-2,tile=10x4", "-q:v", "5", path.join(carpeta, "grilla-%02d.jpg")]);
  if (r.codigo !== 0) return 0;
  return (await readdir(carpeta)).filter((f) => /^grilla-\d+\.jpg$/.test(f)).length;
}

/** Cada cuánto cambia de plano un video: lo mide ffmpeg (detección de escena), no lo estima el modelo. */
export async function medirPlanos(archivo: string, dur: number) {
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-an", "-vf", "scale=320:-2,select='gt(scene,0.3)',showinfo", "-f", "null", "-"]);
  const todos = [...r.error.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1])).filter((t) => t > 0.2 && t < dur - 0.2);
  // Dos cambios a menos de 0,25 s son el mismo corte (un destello, un barrido).
  const cortes = todos.filter((t, i) => i === 0 || t - todos[i - 1] > 0.25);
  const planos = cortes.length + 1;
  return { cortes, planos, ritmo: dur / planos };
}

/**
 * Cuatro cuadros de un video en una sola imagen (2 × 2), para que el agente los mire de una vez.
 * Si no salen los cuatro (un video muy corto o raro), manda uno solo, el del medio.
 */
export async function hojaDeCuadros(archivo: string, m: Medida, segundos: number[], salida: string, lado = 480, quien = "el video"): Promise<Imagen | null> {
  const s = segundos.slice(0, 4).map((x) => Math.max(0, Math.min(m.dur - 0.15, x)));
  const escala = m.ancho > m.alto ? `scale=${lado}:-2` : `scale=-2:${lado}`;
  const f = (x: number) => x.toFixed(1).replace(".", ",");
  if (s.length === 4) {
    const r = await correr("ffmpeg", [
      "-hide_banner", "-y",
      ...s.flatMap((x) => ["-ss", x.toFixed(2), "-i", archivo]),
      "-filter_complex", `${s.map((_, j) => `[${j}:v]${escala},setsar=1[c${j}];`).join("")}[c0][c1][c2][c3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0`,
      "-frames:v", "1", "-q:v", "4", salida,
    ]);
    if (r.codigo === 0) {
      return {
        media_type: "image/jpeg",
        data: (await readFile(salida)).toString("base64"),
        etiqueta: `${quien} (dura ${f(m.dur)} s), 4 cuadros: arriba a la izquierda el segundo ${f(s[0])}, arriba a la derecha el ${f(s[1])}, abajo a la izquierda el ${f(s[2])} y abajo a la derecha el ${f(s[3])}`,
      };
    }
  }
  const medio = m.dur / 2;
  const r = await correr("ffmpeg", ["-hide_banner", "-y", "-ss", medio.toFixed(2), "-i", archivo, "-frames:v", "1", "-vf", escala, "-q:v", "4", salida]);
  if (r.codigo !== 0) return null;
  return { media_type: "image/jpeg", data: (await readFile(salida)).toString("base64"), etiqueta: `${quien} (dura ${f(m.dur)} s), un cuadro del segundo ${f(medio)}` };
}
