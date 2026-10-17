// Editor de video, primera parte: el método de Paul hecho código (lib/video/preset.ts).
// 1) Corta todas las pausas de más de 0,3 s sin cortar palabras (deja 60 ms de aire a cada lado y funde 30 ms
//    el audio en cada corte para que no haya clics). 2) Normaliza el audio a -14 LUFS. 3) Audita antes de entregar:
//    silencedetect (ninguna pausa > 0,3 s) y blackdetect (ningún cuadro negro). Corre con ffmpeg en esta compu.
import { spawn } from "node:child_process";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const DIR_VIDEOS = path.join(process.cwd(), ".data", "videos");
export const carpetaVideo = (id: string) => path.join(DIR_VIDEOS, id.replace(/[^a-z0-9-]/gi, ""));

export type Auditoria = { pausas_largas: number; negros: number; ok: boolean; detalle: string[] };
export type Trabajo = {
  id: string;
  estado: "procesando" | "listo" | "error";
  pasos: string[];
  error: string;
  creado: string;
  resultado?: { antes_s: number; despues_s: number; pausas_cortadas: number; auditoria: Auditoria };
};

// Los trabajos viven en memoria (sobreviven a la recarga en caliente de Next) y en .data/videos/<id>/estado.json.
const g = globalThis as unknown as { __hookiaTrabajos?: Map<string, Trabajo> };
const trabajos = (g.__hookiaTrabajos ??= new Map<string, Trabajo>());

const guardar = async (t: Trabajo) => {
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

/** Corre ffmpeg/ffprobe y devuelve el código y lo último que escribió en stderr. */
function correr(bin: string, args: string[]): Promise<{ codigo: number; salida: string; error: string }> {
  return new Promise((ok) => {
    const h = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let salida = "", error = "";
    h.stdout.setEncoding("utf8").on("data", (d: string) => (salida = (salida + d).slice(-200000)));
    h.stderr.setEncoding("utf8").on("data", (d: string) => (error = (error + d).slice(-400000)));
    h.on("error", () => ok({ codigo: 127, salida, error: "no instalado" }));
    h.on("close", (c) => ok({ codigo: c ?? 1, salida, error }));
  });
}

async function duracion(archivo: string) {
  const r = await correr("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", archivo]);
  if (r.codigo === 127) throw new Error("Falta ffmpeg en esta compu. Instalalo con: brew install ffmpeg");
  return Number(r.salida.trim()) || 0;
}

async function tieneAudio(archivo: string) {
  const r = await correr("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", archivo]);
  return r.salida.trim().length > 0;
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

async function cortarYUnir(entrada: string, salida: string, tramos: { inicio: number; fin: number }[]) {
  const f = (n: number) => n.toFixed(3);
  const partes = tramos.map((t, i) => {
    const d = t.fin - t.inicio;
    const fundido = Math.min(0.03, d / 4);
    return (
      `[0:v]trim=start=${f(t.inicio)}:end=${f(t.fin)},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=start=${f(t.inicio)}:end=${f(t.fin)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${f(fundido)},afade=t=out:st=${f(Math.max(0, d - fundido))}:d=${f(fundido)}[a${i}];`
    );
  });
  const grafo = `${partes.join("")}${tramos.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${tramos.length}:v=1:a=1[v][a0];[a0]loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
  const archivoGrafo = `${salida}.grafo.txt`;
  await writeFile(archivoGrafo, grafo);
  const r = await correr("ffmpeg", [
    "-hide_banner", "-y", "-i", entrada, "-filter_complex_script", archivoGrafo,
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", salida,
  ]);
  if (r.codigo !== 0) throw new Error(`ffmpeg no pudo armar el video: ${r.error.split("\n").filter(Boolean).slice(-2).join(" ").slice(0, 200)}`);
}

async function auditar(archivo: string): Promise<Auditoria> {
  const pausas = (await silencios(archivo, 0.3)).filter((p) => p.fin - p.inicio > 0.3 && Number.isFinite(p.fin));
  const r = await correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-vf", "blackdetect=d=0.1:pix_th=0.10", "-an", "-f", "null", "-"]);
  const negros = (r.error.match(/black_start:/g) ?? []).length;
  const detalle = [
    pausas.length ? `Quedan ${pausas.length} pausa(s) de más de 0,3 s.` : "Ninguna pausa de más de 0,3 s.",
    negros ? `Hay ${negros} tramo(s) en negro.` : "Ningún cuadro en negro.",
    "Audio normalizado a -14 LUFS.",
  ];
  return { pausas_largas: pausas.length, negros, ok: !pausas.length && !negros, detalle };
}

/** Edita el video subido (original.*) y deja editado.mp4 en su carpeta. Corre en segundo plano. */
export async function editar(id: string, original: string) {
  const t: Trabajo = { id, estado: "procesando", pasos: [], error: "", creado: new Date().toISOString() };
  const paso = async (texto: string) => {
    t.pasos = [...t.pasos, texto];
    await guardar(t);
  };
  await mkdir(carpetaVideo(id), { recursive: true });
  try {
    await paso("Midiendo el video");
    const antes = await duracion(original);
    if (!antes) throw new Error("No pude leer ese video. Probá con un MP4 o MOV.");
    if (!(await tieneAudio(original))) throw new Error("El video no tiene sonido: así no puedo encontrar las pausas.");
    await paso("Buscando las pausas de más de 0,3 segundos");
    const pausas = (await silencios(original, 0.3)).filter((p) => (Math.min(antes, p.fin) - p.inicio) > 0.3);
    const tramos = tramosDeHabla(antes, pausas);
    const salida = path.join(carpetaVideo(id), "editado.mp4");
    const pasada1 = path.join(carpetaVideo(id), "pasada1.mp4");
    await paso(pausas.length ? `Cortando ${pausas.length} pausa${pausas.length === 1 ? "" : "s"} sin cortar palabras` : "No encontré pausas largas: normalizo el audio");
    await cortarYUnir(original, pasada1, tramos.length ? tramos : [{ inicio: 0, fin: antes }]);
    // Segunda pasada, como pide el preset: agarra lo que haya quedado al unir.
    await paso("Segunda pasada: revisando lo que quedó al unir");
    const dur1 = await duracion(pasada1);
    const quedan = (await silencios(pasada1, 0.3)).filter((p) => Math.min(dur1, p.fin) - p.inicio > 0.3);
    if (quedan.length) await cortarYUnir(pasada1, salida, tramosDeHabla(dur1, quedan));
    else await rename(pasada1, salida);
    await paso("Auditando: pausas, cuadros negros y audio");
    const auditoria = await auditar(salida);
    const despues = await duracion(salida);
    await stat(salida);
    t.resultado = { antes_s: antes, despues_s: despues, pausas_cortadas: pausas.length, auditoria };
    t.estado = "listo";
    await paso("Listo");
  } catch (e) {
    t.estado = "error";
    t.error = (e as Error).message || "Algo falló editando el video.";
    await guardar(t);
  }
}
