// Lo que sube la persona para editar, a la carpeta de esa edición (.data/videos/<id>/): sus tomas (videos sueltos
// o un .zip con varias), la música y el video de referencia. Cada toma queda como toma-1.mov, toma-2.mp4… en el
// orden en que llegan. El .zip se lee acá mismo, sin programas externos: solo se sacan videos y audio, con nombres
// nuestros, así nada de adentro del zip puede escribirse fuera de la carpeta ni pesar de más.
import { createReadStream, createWriteStream } from "node:fs";
import { open, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadable } from "node:stream/web";
import { createInflateRaw } from "node:zlib";

export const MAX_TOMAS = 8;
const MB = 1024 * 1024;
const MAX: Record<Clase, number> = { video: 600 * MB, audio: 80 * MB, zip: 2048 * MB };

const VIDEO = new Set(["mp4", "mov", "m4v", "webm"]);
const AUDIO = new Set(["mp3", "m4a", "aac", "wav"]);
const MIME: Record<string, string> = {
  "video/mp4": "mp4", "video/quicktime": "mov", "video/x-m4v": "m4v", "video/webm": "webm",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
  "application/zip": "zip", "application/x-zip-compressed": "zip",
};

export type Clase = "video" | "audio" | "zip";
export type Para = "toma" | "musica" | "referencia";

/** Qué es el archivo: por el tipo que manda el navegador o, si no lo dice, por la extensión del nombre. */
export function claseDe(mime: string, nombre: string): { clase: Clase; ext: string } | null {
  const ext = MIME[mime] ?? nombre.toLowerCase().match(/\.([a-z0-9]{2,4})$/)?.[1] ?? "";
  if (VIDEO.has(ext)) return { clase: "video", ext };
  if (AUDIO.has(ext)) return { clase: "audio", ext };
  if (ext === "zip") return { clase: "zip", ext };
  return null;
}

class Pesado extends Error {}
/** Un error con un mensaje para mostrarle a la persona tal cual. */
export class Mensaje extends Error {}
/** Corta la escritura si pasa del máximo (también protege de un zip que dice pesar menos de lo que pesa). */
function limite(max: number) {
  let total = 0;
  return new Transform({
    transform(chunk: Buffer, _e, listo) {
      total += chunk.length;
      listo(total > max ? new Pesado() : null, chunk);
    },
  });
}

const numero = (f: string) => Number(f.match(/^toma-(\d+)\./)?.[1] ?? 0);

/** Las tomas de la carpeta, en orden. */
export async function tomasDe(dir: string) {
  const archivos = await readdir(dir).catch(() => [] as string[]);
  return archivos.filter((f) => /^toma-\d+\.[a-z0-9]+$/.test(f)).sort((a, b) => numero(a) - numero(b)).map((f) => path.join(dir, f));
}

/** La música o el video de referencia, si los subió. */
export async function archivoDe(dir: string, base: "musica" | "referencia") {
  const f = (await readdir(dir).catch(() => [] as string[])).find((x) => x.startsWith(`${base}.`));
  return f ? path.join(dir, f) : null;
}

async function borrar(dir: string, base: string) {
  for (const f of await readdir(dir).catch(() => [] as string[])) if (f.startsWith(`${base}.`)) await rm(path.join(dir, f), { force: true });
}

async function escribir(entrada: NodeJS.ReadableStream, destino: string, max: number, inflar = false) {
  try {
    if (inflar) await pipeline(entrada, createInflateRaw(), limite(max), createWriteStream(destino, { mode: 0o600 }));
    else await pipeline(entrada, limite(max), createWriteStream(destino, { mode: 0o600 }));
  } catch (e) {
    await rm(destino, { force: true });
    throw e;
  }
}

type Entrada = { nombre: string; metodo: number; comp: number; tam: number; local: number; cifrado: boolean };

/** Lee el índice del .zip (el "directorio central" que va al final del archivo), con soporte de ZIP64. */
async function indiceDelZip(archivo: string): Promise<Entrada[]> {
  const fh = await open(archivo, "r");
  try {
    const { size } = await fh.stat();
    const cola = Math.min(size, 65557);
    const buf = Buffer.alloc(cola);
    await fh.read(buf, 0, cola, size - cola);
    let fin = -1;
    for (let i = cola - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { fin = i; break; }
    if (fin < 0) throw new Error("zip");
    let total = buf.readUInt16LE(fin + 10), tamIndice = buf.readUInt32LE(fin + 12), inicio = buf.readUInt32LE(fin + 16);
    if ((total === 0xffff || tamIndice === 0xffffffff || inicio === 0xffffffff) && fin >= 20 && buf.readUInt32LE(fin - 20) === 0x07064b50) {
      const r = Buffer.alloc(56);
      await fh.read(r, 0, 56, Number(buf.readBigUInt64LE(fin - 20 + 8)));
      if (r.readUInt32LE(0) === 0x06064b50) {
        total = Number(r.readBigUInt64LE(32));
        tamIndice = Number(r.readBigUInt64LE(40));
        inicio = Number(r.readBigUInt64LE(48));
      }
    }
    if (tamIndice > 32 * MB || inicio + tamIndice > size) throw new Error("zip");
    const cd = Buffer.alloc(tamIndice);
    await fh.read(cd, 0, tamIndice, inicio);
    const entradas: Entrada[] = [];
    for (let p = 0, k = 0; k < total && p + 46 <= cd.length && cd.readUInt32LE(p) === 0x02014b50; k++) {
      const banderas = cd.readUInt16LE(p + 8);
      let comp = cd.readUInt32LE(p + 20), tam = cd.readUInt32LE(p + 24), local = cd.readUInt32LE(p + 42);
      const lNombre = cd.readUInt16LE(p + 28), lExtra = cd.readUInt16LE(p + 30), lComentario = cd.readUInt16LE(p + 32);
      const nombre = cd.subarray(p + 46, p + 46 + lNombre).toString(banderas & 0x800 ? "utf8" : "latin1");
      // ZIP64: los tamaños que no entran en 32 bits van en el campo extra 0x0001, en este orden.
      for (let e = p + 46 + lNombre; e + 4 <= p + 46 + lNombre + lExtra; e += 4 + cd.readUInt16LE(e + 2)) {
        if (cd.readUInt16LE(e) !== 0x0001) continue;
        let q = e + 4;
        if (tam === 0xffffffff) { tam = Number(cd.readBigUInt64LE(q)); q += 8; }
        if (comp === 0xffffffff) { comp = Number(cd.readBigUInt64LE(q)); q += 8; }
        if (local === 0xffffffff) local = Number(cd.readBigUInt64LE(q));
      }
      entradas.push({ nombre, metodo: cd.readUInt16LE(p + 10), comp, tam, local, cifrado: (banderas & 1) === 1 });
      p += 46 + lNombre + lExtra + lComentario;
    }
    return entradas;
  } finally {
    await fh.close();
  }
}

/** Saca del .zip los videos (como tomas, en orden de nombre) y el primer audio (como música). */
async function sacarDelZip(zip: string, dir: string, desde: number, avisos: string[]) {
  let entradas: Entrada[];
  try {
    entradas = await indiceDelZip(zip);
  } catch {
    throw new Mensaje("No pude abrir ese .zip. Probá comprimirlo de nuevo o subí los videos sueltos.");
  }
  const utiles = entradas
    .filter((e) => {
      const base = e.nombre.split("/").pop() ?? "";
      return base && !base.startsWith(".") && !e.nombre.includes("__MACOSX/") && !e.nombre.endsWith("/");
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
  const nuevas: string[] = [];
  let musica: string | null = null, sobran = 0, fallidas = 0;
  const fh = await open(zip, "r");
  try {
    for (const e of utiles) {
      const ext = e.nombre.toLowerCase().match(/\.([a-z0-9]{2,4})$/)?.[1] ?? "";
      const esVideo = VIDEO.has(ext), esAudio = AUDIO.has(ext) && !musica && !(await archivoDe(dir, "musica"));
      if (!esVideo && !esAudio) continue;
      if (esVideo && desde + nuevas.length >= MAX_TOMAS) { sobran++; continue; }
      const max = MAX[esVideo ? "video" : "audio"];
      if (e.cifrado || (e.metodo !== 0 && e.metodo !== 8) || e.tam > max || e.comp === 0) { fallidas++; continue; }
      const cab = Buffer.alloc(30);
      await fh.read(cab, 0, 30, e.local);
      if (cab.readUInt32LE(0) !== 0x04034b50) { fallidas++; continue; }
      const inicio = e.local + 30 + cab.readUInt16LE(26) + cab.readUInt16LE(28);
      const destino = path.join(dir, esVideo ? `toma-${desde + nuevas.length + 1}.${ext}` : `musica.${ext}`);
      try {
        await escribir(createReadStream(zip, { start: inicio, end: inicio + e.comp - 1 }), destino, max, e.metodo === 8);
      } catch {
        fallidas++;
        continue;
      }
      if (esVideo) nuevas.push(e.nombre.split("/").pop()!);
      else musica = e.nombre.split("/").pop()!;
    }
  } finally {
    await fh.close();
  }
  if (sobran) avisos.push(`El zip traía más de ${MAX_TOMAS} videos: usé los primeros ${MAX_TOMAS}.`);
  if (fallidas) avisos.push(`No pude sacar ${fallidas} archivo${fallidas === 1 ? "" : "s"} del zip (con clave, dañado o muy pesado).`);
  if (!nuevas.length && !musica) throw new Mensaje("En ese .zip no encontré videos (MP4, MOV o WEBM).");
  return { nuevas, musica };
}

/**
 * Guarda lo que llegó en el cuerpo del pedido en la carpeta de la edición.
 * Devuelve cuántas tomas hay ahora, los nombres de las nuevas, la música (si llegó) y avisos para mostrar.
 */
export async function guardarSubida(dir: string, cuerpo: ReadableStream<Uint8Array>, para: Para, tipo: { clase: Clase; ext: string }, nombre: string) {
  const entrada = Readable.fromWeb(cuerpo as WebReadable<Uint8Array>);
  const avisos: string[] = [];
  let nuevas: string[] = [];
  let musica: string | null = null;
  const antes = (await tomasDe(dir)).length;
  try {
    if (para === "toma") {
      if (tipo.clase === "audio") throw new Mensaje("Eso es un audio: subilo en «Música».");
      if (tipo.clase === "zip") {
        const zip = path.join(dir, "subida.zip");
        await escribir(entrada, zip, MAX.zip);
        try {
          ({ nuevas, musica } = await sacarDelZip(zip, dir, antes, avisos));
        } finally {
          await rm(zip, { force: true });
        }
      } else {
        if (antes >= MAX_TOMAS) throw new Mensaje(`Ya subiste ${MAX_TOMAS} tomas: es el máximo.`);
        await escribir(entrada, path.join(dir, `toma-${antes + 1}.${tipo.ext}`), MAX.video);
        nuevas = [nombre];
      }
    } else if (para === "musica") {
      if (tipo.clase === "zip") throw new Mensaje("Para la música subí un MP3, M4A o WAV (o un video con la canción).");
      // También sirve un video: se usa su sonido.
      await borrar(dir, "musica");
      await escribir(entrada, path.join(dir, `musica.${tipo.ext}`), tipo.clase === "video" ? MAX.video : MAX.audio);
      musica = nombre;
    } else {
      if (tipo.clase !== "video") throw new Mensaje("El video de referencia tiene que ser un video (MP4 o MOV).");
      await borrar(dir, "referencia");
      await escribir(entrada, path.join(dir, `referencia.${tipo.ext}`), MAX.video);
    }
  } catch (e) {
    entrada.destroy();
    if (e instanceof Pesado) throw new Mensaje(tipo.clase === "zip" ? "El zip pesa más de 2 GB." : tipo.clase === "audio" ? "La música pesa más de 80 MB." : "El video pesa más de 600 MB.");
    if (e instanceof Mensaje) throw e;
    throw new Mensaje("Se cortó la subida. Probá de nuevo.");
  }
  return { tomas: (await tomasDe(dir)).length, nuevas, musica, avisos };
}
