// Lo que el editor le pide a ffmpeg: correrlo, medir un video y sacar cuadros para que el agente los mire.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Imagen } from "../agent/run";

// Homebrew achicó su ffmpeg en enero de 2026: el de siempre ya no trae libass, la librería con la que se queman los
// subtítulos y los textos (filtro "ass"). El completo se instala aparte (ffmpeg-full) y no queda en el PATH: si está, se usa ese.
const COMPLETO = ["/opt/homebrew/opt/ffmpeg-full/bin", "/usr/local/opt/ffmpeg-full/bin"];
export function binario(nombre: "ffmpeg" | "ffprobe") {
  const d = COMPLETO.find((x) => existsSync(path.join(x, nombre)));
  return d ? path.join(d, nombre) : nombre;
}

/** Corre ffmpeg/ffprobe (el completo si está) y devuelve el código y lo último que escribió en stderr. */
export function correr(bin: string, args: string[], cwd?: string): Promise<{ codigo: number; salida: string; error: string }> {
  return new Promise((ok) => {
    const h = spawn(bin === "ffmpeg" || bin === "ffprobe" ? binario(bin) : bin, args, { stdio: ["ignore", "pipe", "pipe"], cwd });
    let salida = "", error = "";
    h.stdout.setEncoding("utf8").on("data", (d: string) => (salida = (salida + d).slice(-200000)));
    h.stderr.setEncoding("utf8").on("data", (d: string) => (error = (error + d).slice(-400000)));
    h.on("error", () => ok({ codigo: 127, salida, error: "no instalado" }));
    h.on("close", (c) => ok({ codigo: c ?? 1, salida, error }));
  });
}

/** Las últimas líneas de error de ffmpeg, cortas, para la consola o el mensaje. */
export const ultimoError = (error: string) => error.split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 200);

/** brew install desde la app: si Homebrew pide confirmar ("Do you want to proceed? [y/n]"), contesta que sí. */
export function instalarConBrew(brew: string, formula: string): Promise<{ codigo: number; error: string }> {
  return new Promise((ok) => {
    const env = { ...process.env };
    delete env.HOMEBREW_ASK;
    const h = spawn(brew, ["install", formula], { stdio: ["pipe", "ignore", "pipe"], env });
    let error = "";
    h.stdin.on("error", () => {});
    h.stdin.end("y\ny\n");
    h.stderr.setEncoding("utf8").on("data", (d: string) => (error = (error + d).slice(-20000)));
    h.on("error", () => ok({ codigo: 127, error: "no pude correr brew" }));
    h.on("close", (c) => ok({ codigo: c ?? 1, error }));
  });
}

let conSubtitulos = false;
/** ¿El ffmpeg de esta compu puede quemar subtítulos y textos (filtro "ass", de libass)? */
export async function puedeSubtitular() {
  if (!conSubtitulos) conSubtitulos = /\sass\s+V->V/.test((await correr("ffmpeg", ["-hide_banner", "-filters"])).salida);
  return conSubtitulos;
}

const g = globalThis as unknown as { __hookiaFfmpegFull?: { estado: "instalando" | "listo" | "error"; paso: string } };
/**
 * Si el ffmpeg no trae subtítulos, instala ffmpeg-full con Homebrew (una sola vez) y avisa en los pasos.
 * Devuelve null si ya se puede, o el motivo por el que no.
 */
export async function asegurarSubtitulos(paso: (t: string) => Promise<void>): Promise<string | null> {
  if (await puedeSubtitular()) return null;
  if (g.__hookiaFfmpegFull?.estado !== "instalando") {
    const estado = (g.__hookiaFfmpegFull = { estado: "instalando" as "instalando" | "listo" | "error", paso: "" });
    await paso("Tu ffmpeg no trae subtítulos: instalo ffmpeg-full (una sola vez, puede tardar unos minutos)");
    const brew = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"].find((b) => existsSync(b));
    const r = brew ? await instalarConBrew(brew, "ffmpeg-full") : null;
    estado.estado = r?.codigo === 0 ? "listo" : "error";
    estado.paso = !brew ? "falta Homebrew (brew.sh)" : r?.codigo === 0 ? "" : `brew install ffmpeg-full falló: ${ultimoError(r?.error ?? "")}`;
  }
  while (g.__hookiaFfmpegFull?.estado === "instalando") await new Promise((r) => setTimeout(r, 2000));
  if (await puedeSubtitular()) return null;
  return `tu ffmpeg no trae libass y no pude instalar ffmpeg-full${g.__hookiaFfmpegFull?.paso ? ` (${g.__hookiaFfmpegFull.paso})` : ""}. Probá en la terminal: brew install ffmpeg-full`;
}

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

/** Silencios de más de `minimo` segundos (umbral -32 dB, como el preset). */
export async function silencios(archivo: string, minimo = 0.3) {
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-af", `silencedetect=n=-32dB:d=${minimo}`, "-f", "null", "-"]);
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
