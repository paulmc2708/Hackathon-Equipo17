// ¿Esta compu está lista para editar? El editor corre acá y necesita tres cosas: ffmpeg (cortar y unir), ffmpeg con
// libass (subtítulos y textos; desde 2026 el ffmpeg de Homebrew no la trae y va aparte, ffmpeg-full) y whisper con
// su modelo de voz en español (transcribir). Lo que falte se instala con Homebrew, una sola vez, desde el botón Preparar.
import { existsSync } from "node:fs";
import { asegurarSubtitulos, correr, puedeSubtitular } from "./ffmpeg";
import { estadoInstalacion, instalarWhisper, motorWhisper } from "./transcribir";

export type EstadoEditor = {
  ffmpeg: boolean;
  subtitulos: boolean;
  whisper: boolean;
  brew: boolean;
  preparando: { estado: "instalando" | "listo" | "error"; paso: string } | null;
};

const g = globalThis as unknown as { __hookiaPreparar?: NonNullable<EstadoEditor["preparando"]> };
const hayBrew = () => ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"].some((b) => existsSync(b));

export async function estadoEditor(): Promise<EstadoEditor> {
  const [ffmpeg, subtitulos, motor] = await Promise.all([
    correr("ffmpeg", ["-hide_banner", "-version"]).then((r) => r.codigo === 0),
    puedeSubtitular(),
    motorWhisper(),
  ]);
  return { ffmpeg, subtitulos, whisper: Boolean(motor), brew: hayBrew(), preparando: g.__hookiaPreparar ?? null };
}

/** Instala lo que falte, en orden: primero ffmpeg-full (trae ffmpeg y los subtítulos) y después whisper con su modelo. */
export async function preparar() {
  if (g.__hookiaPreparar?.estado === "instalando") return;
  const e: NonNullable<EstadoEditor["preparando"]> = { estado: "instalando", paso: "Revisando tu compu" };
  g.__hookiaPreparar = e;
  try {
    if (!(await puedeSubtitular())) {
      const motivo = await asegurarSubtitulos(async (t) => {
        e.paso = t;
      });
      if (motivo) throw new Error(motivo.charAt(0).toUpperCase() + motivo.slice(1));
    }
    if (!(await motorWhisper())) {
      void instalarWhisper();
      await new Promise((r) => setTimeout(r, 50));
      while (estadoInstalacion()?.estado === "instalando") {
        e.paso = estadoInstalacion()?.paso || "Instalando whisper";
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!(await motorWhisper())) throw new Error(estadoInstalacion()?.paso || "No pude instalar whisper.");
    }
    e.estado = "listo";
    e.paso = "Listo";
  } catch (err) {
    e.estado = "error";
    e.paso = (err as Error).message || "Algo falló preparando tu compu.";
  }
}
