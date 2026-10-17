"use client";

// Prepara lo que la persona sube para mandárselo al agente: capturas achicadas y, de cada video,
// algunos cuadros repartidos (se sacan en el navegador, sin subir el video entero).
export type ImagenLista = { media_type: "image/jpeg"; data: string; etiqueta: string };
export type Adjunto = { file: File; etiqueta: string };

const MAX_LADO = 1280;

function aJpeg(fuente: CanvasImageSource, ancho: number, alto: number): string {
  const k = Math.min(1, MAX_LADO / Math.max(ancho, alto));
  const c = document.createElement("canvas");
  c.width = Math.round(ancho * k);
  c.height = Math.round(alto * k);
  c.getContext("2d")!.drawImage(fuente, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85).split(",")[1];
}

/** Recorta la foto al centro en un cuadrado chico, para guardarla en el navegador sin ocupar casi nada. */
export async function fotoDePerfil(file: File, lado = 192): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = c.height = lado;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, lado, lado);
  bmp.close();
  return c.toDataURL("image/jpeg", 0.85);
}

async function imagen(file: File, etiqueta: string): Promise<ImagenLista> {
  const bmp = await createImageBitmap(file);
  const data = aJpeg(bmp, bmp.width, bmp.height);
  bmp.close();
  return { media_type: "image/jpeg", data, etiqueta };
}

async function cuadrosDeVideo(file: File, etiqueta: string, cantidad = 6): Promise<ImagenLista[]> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((ok, mal) => {
      v.onloadedmetadata = () => ok();
      v.onerror = () => mal(new Error("No pude leer el video."));
    });
    const dur = Number.isFinite(v.duration) ? v.duration : 0;
    const out: ImagenLista[] = [];
    for (let i = 0; i < cantidad; i++) {
      const t = dur ? (dur * (i + 0.5)) / cantidad : 0;
      await new Promise<void>((ok) => {
        v.onseeked = () => ok();
        v.currentTime = t;
      });
      out.push({
        media_type: "image/jpeg",
        data: aJpeg(v, v.videoWidth, v.videoHeight),
        etiqueta: `${etiqueta} · cuadro ${i + 1} de ${cantidad} (segundo ${t.toFixed(1)} de ${dur.toFixed(1)})`,
      });
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Acorta los nombres de archivo largos dentro de la etiqueta ("Grabación de pantalla 2026-10-17 a las…"). */
const etiquetaCorta = (t: string) => t.replace(/\(([^()]{41,})\)/g, (_, n: string) => `(${n.slice(0, 36).trimEnd()}…)`);

/** Convierte capturas y videos en imágenes etiquetadas (máximo 16 en total). */
export async function preparar(adjuntos: Adjunto[]): Promise<ImagenLista[]> {
  const listas: ImagenLista[] = [];
  for (const a of adjuntos) {
    const etiqueta = etiquetaCorta(a.etiqueta);
    if (a.file.type.startsWith("video/")) listas.push(...(await cuadrosDeVideo(a.file, etiqueta)));
    else if (a.file.type.startsWith("image/")) listas.push(await imagen(a.file, etiqueta));
  }
  return listas.slice(0, 16);
}

export type CuadroReel = { segundo: number; nota: string; file: File; mini: string };

/**
 * Cuadros de un reel en segundos puntuales (el gancho, donde se fue el espectador promedio, etc.).
 * `segundos` recibe la duración real del video. Devuelve cada cuadro como archivo (para el agente)
 * y en miniatura (para mostrarlo en la web).
 */
export async function cuadrosEnSegundos(video: Blob, segundos: (duracion: number) => { s: number; nota: string }[]) {
  const url = URL.createObjectURL(video);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((ok, mal) => {
      v.onloadedmetadata = () => ok();
      v.onerror = () => mal(new Error("No pude abrir el video."));
    });
    const duracion = Number.isFinite(v.duration) ? v.duration : 0;
    const cuadros: CuadroReel[] = [];
    for (const { s, nota } of segundos(duracion)) {
      const t = Math.max(0.05, Math.min(s, Math.max(0.05, duracion - 0.05)));
      await new Promise<void>((ok) => {
        const listo = () => ok();
        v.onseeked = listo;
        setTimeout(listo, 4000);
        v.currentTime = t;
      });
      const data = aJpeg(v, v.videoWidth, v.videoHeight);
      const bin = atob(data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "image/jpeg" });
      const c = document.createElement("canvas");
      const k = 180 / Math.max(1, v.videoWidth);
      c.width = 180;
      c.height = Math.round(v.videoHeight * k);
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
      cuadros.push({ segundo: t, nota, file: new File([blob], `cuadro-${t.toFixed(1)}s.jpg`, { type: "image/jpeg" }), mini: c.toDataURL("image/jpeg", 0.7) });
    }
    return { duracion, cuadros };
  } finally {
    URL.revokeObjectURL(url);
  }
}
