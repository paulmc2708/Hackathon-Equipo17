// Transcripción con tiempos por palabra, con el whisper que haya en esta compu:
// whisper.cpp (whisper-cli, el más rápido en Mac), mlx_whisper o el whisper de OpenAI.
// El modelo de whisper.cpp se guarda en ~/.hookia/modelos (lo baja el botón "Instalar" de Editar video).
import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type Palabra = { texto: string; desde: number; hasta: number };
export type Motor = { tipo: "whisper-cpp"; bin: string; modelo: string } | { tipo: "mlx"; bin: string } | { tipo: "openai"; bin: string };

export const DIR_MODELOS = path.join(os.homedir(), ".hookia", "modelos");
// Homebrew en Mac (Apple Silicon e Intel) y rutas comunes de Linux: el servidor de Next no siempre hereda el PATH.
const RUTAS = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", path.join(os.homedir(), ".local", "bin")];

function correr(bin: string, args: string[], tope = 30 * 60 * 1000): Promise<{ codigo: number; error: string }> {
  return new Promise((ok) => {
    const h = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"], env: { ...process.env, PATH: `${RUTAS.join(":")}:${process.env.PATH ?? ""}` } });
    let error = "";
    h.stderr.setEncoding("utf8").on("data", (d: string) => (error = (error + d).slice(-20000)));
    const t = setTimeout(() => h.kill("SIGTERM"), tope);
    h.on("error", () => ok({ codigo: 127, error: "no instalado" }));
    h.on("close", (c) => {
      clearTimeout(t);
      ok({ codigo: c ?? 1, error });
    });
  });
}

async function existe(f: string) {
  try {
    await access(f);
    return true;
  } catch {
    return false;
  }
}

async function buscar(nombres: string[]) {
  for (const n of nombres) for (const d of [...RUTAS, ...(process.env.PATH ?? "").split(":")]) if (d && (await existe(path.join(d, n)))) return path.join(d, n);
  return null;
}

/** El modelo de whisper.cpp más bueno que haya bajado (small > base > tiny). */
async function modeloWhisperCpp() {
  const dirs = [DIR_MODELOS, "/opt/homebrew/share/whisper-cpp", "/usr/local/share/whisper-cpp", path.join(os.homedir(), ".cache", "whisper")];
  for (const nombre of ["ggml-small.bin", "ggml-base.bin", "ggml-small-q5_1.bin", "ggml-base-q5_1.bin", "ggml-tiny.bin"])
    for (const d of dirs) if (await existe(path.join(d, nombre))) return path.join(d, nombre);
  return null;
}

/** Qué whisper hay en esta compu (null si ninguno). */
export async function motorWhisper(): Promise<Motor | null> {
  const cpp = await buscar(["whisper-cli", "whisper-cpp"]);
  const modelo = cpp ? await modeloWhisperCpp() : null;
  if (cpp && modelo) return { tipo: "whisper-cpp", bin: cpp, modelo };
  const mlx = await buscar(["mlx_whisper"]);
  if (mlx) return { tipo: "mlx", bin: mlx };
  const openai = await buscar(["whisper"]);
  if (openai) return { tipo: "openai", bin: openai };
  return null;
}

const limpiar = (t: string) => t.replace(/\s+/g, " ").trim();

/** Transcribe el audio del video con tiempos por palabra (en segundos). */
export async function transcribir(video: string, motor: Motor): Promise<Palabra[]> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "hookia-voz-"));
  try {
    const wav = path.join(dir, "voz.wav");
    const a = await correr("ffmpeg", ["-hide_banner", "-y", "-i", video, "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
    if (a.codigo !== 0) throw new Error("No pude sacar el audio del video.");
    if (motor.tipo === "whisper-cpp") {
      // -ml 1 + -sow: un segmento por palabra, con su tiempo.
      const r = await correr(motor.bin, ["-m", motor.modelo, "-f", wav, "-l", "es", "-ml", "1", "-sow", "-oj", "-of", path.join(dir, "voz")]);
      if (r.codigo !== 0) throw new Error("whisper no pudo transcribir el audio.");
      const j = JSON.parse(await readFile(path.join(dir, "voz.json"), "utf8")) as { transcription?: { offsets?: { from: number; to: number }; text?: string }[] };
      return (j.transcription ?? [])
        .map((s) => ({ texto: limpiar(s.text ?? ""), desde: (s.offsets?.from ?? 0) / 1000, hasta: (s.offsets?.to ?? 0) / 1000 }))
        .filter((p) => p.texto && !/^\[.*\]$/.test(p.texto));
    }
    const args =
      motor.tipo === "mlx"
        ? [wav, "--model", "mlx-community/whisper-small-mlx", "--language", "es", "--word-timestamps", "True", "--output-format", "json", "--output-dir", dir]
        : [wav, "--model", "small", "--language", "es", "--word_timestamps", "True", "--output_format", "json", "--output_dir", dir];
    const r = await correr(motor.bin, args);
    if (r.codigo !== 0) throw new Error("whisper no pudo transcribir el audio.");
    const archivo = (await readdir(dir)).find((f) => f.endsWith(".json"));
    if (!archivo) throw new Error("whisper no devolvió la transcripción.");
    const j = JSON.parse(await readFile(path.join(dir, archivo), "utf8")) as { segments?: { words?: { word: string; start: number; end: number }[] }[] };
    return (j.segments ?? []).flatMap((s) => s.words ?? []).map((w) => ({ texto: limpiar(w.word), desde: w.start, hasta: w.end })).filter((p) => p.texto);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// Instalación de whisper.cpp con Homebrew y su modelo "small" (≈ 480 MB), con un botón desde la app.
const g = globalThis as unknown as { __hookiaInstalando?: { estado: "instalando" | "listo" | "error"; paso: string } };
export const estadoInstalacion = () => g.__hookiaInstalando ?? null;

export async function instalarWhisper() {
  if (g.__hookiaInstalando?.estado === "instalando") return;
  const estado = (g.__hookiaInstalando = { estado: "instalando" as "instalando" | "listo" | "error", paso: "Buscando Homebrew" });
  try {
    if (!(await buscar(["whisper-cli", "whisper-cpp"]))) {
      const brew = await buscar(["brew"]);
      if (!brew) throw new Error("Falta Homebrew (brew.sh). Instalalo y volvé a tocar Instalar.");
      estado.paso = "Instalando whisper (puede tardar unos minutos)";
      const r = await correr(brew, ["install", "whisper-cpp"]);
      if (r.codigo !== 0) throw new Error("No se pudo instalar whisper con Homebrew.");
    }
    if (!(await modeloWhisperCpp())) {
      estado.paso = "Bajando el modelo de voz en español (unos 480 MB)";
      await correr("mkdir", ["-p", DIR_MODELOS]);
      const destino = path.join(DIR_MODELOS, "ggml-small.bin");
      const r = await correr("curl", ["-fL", "--retry", "3", "-o", `${destino}.parcial`, "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"]);
      if (r.codigo !== 0) throw new Error("No pude bajar el modelo de voz. Revisá la conexión y probá de nuevo.");
      await correr("mv", [`${destino}.parcial`, destino]);
    }
    estado.estado = "listo";
    estado.paso = "Listo";
  } catch (e) {
    estado.estado = "error";
    estado.paso = (e as Error).message;
  }
}
