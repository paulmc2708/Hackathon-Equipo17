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

/** Convierte capturas y videos en imágenes etiquetadas (máximo 16 en total). */
export async function preparar(adjuntos: Adjunto[]): Promise<ImagenLista[]> {
  const listas: ImagenLista[] = [];
  for (const a of adjuntos) {
    if (a.file.type.startsWith("video/")) listas.push(...(await cuadrosDeVideo(a.file, a.etiqueta)));
    else if (a.file.type.startsWith("image/")) listas.push(await imagen(a.file, a.etiqueta));
  }
  return listas.slice(0, 16);
}
