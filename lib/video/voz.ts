// Dónde habla la persona y dónde hace pausa, medido con el ruido de fondo de ESTE audio y no con un umbral fijo.
// Con un umbral fijo (-32 dB), si se graba con ruido (una sala, el aire acondicionado, gente) las pausas nunca bajan
// de ahí: el editor no encuentra ninguna y entrega el video sin cortar. Acá se mide el volumen cada 10 ms, solo en la
// banda de la voz, se estima el ruido de fondo y el nivel de la voz, y el umbral queda entre los dos.
// Si hay transcripción, los huecos entre palabras ayudan a cortar también respiraciones y ruidos entre frases.
import { spawn } from "node:child_process";
import { binario } from "./ffmpeg";
import type { Palabra } from "./transcribir";

export type Pausa = { inicio: number; fin: number };
export type Voz = {
  dur: number;
  /** Volumen de cada cuadro de 10 ms, en dB (0 = el máximo). */
  db: Float32Array;
  /** Debajo de esto es pausa. */
  umbral: number;
  ruido: number;
  voz: number;
  /** false si la voz casi no se distingue del fondo (música o ruido todo el tiempo): no se corta por volumen. */
  confiable: boolean;
};

const CUADRO = 0.01;
const MUESTRAS = 160; // 10 ms a 16 kHz
/** Picos de hasta 30 ms dentro de una pausa (un clic, un golpe) no la cortan: una sílaba dura bastante más. */
const TOLERANCIA = 3;

function pcm(archivo: string): Promise<Int16Array> {
  return new Promise((ok, mal) => {
    const h = spawn(
      binario("ffmpeg"),
      ["-hide_banner", "-nostats", "-loglevel", "error", "-i", archivo, "-vn", "-ac", "1", "-ar", "16000", "-af", "highpass=f=90,lowpass=f=7000", "-f", "s16le", "-"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const partes: Buffer[] = [];
    let error = "";
    h.stdout.on("data", (d: Buffer) => partes.push(d));
    h.stderr.setEncoding("utf8").on("data", (d: string) => (error = (error + d).slice(-2000)));
    h.on("error", () => mal(new Error("Falta ffmpeg en esta compu. Instalalo con: brew install ffmpeg")));
    h.on("close", (c) => {
      if (c !== 0) return mal(new Error(`No pude leer el audio: ${error.trim().split("\n").pop() ?? ""}`));
      const b = Buffer.concat(partes);
      // Copia alineada: un Int16Array necesita arrancar en un byte par.
      ok(new Int16Array(b.buffer.slice(b.byteOffset, b.byteOffset + (b.length & ~1))));
    });
  });
}

/** El percentil q (0 a 1) de una lista ya ordenada. */
const percentil = (ord: Float32Array, q: number) => ord[Math.min(ord.length - 1, Math.max(0, Math.floor(q * (ord.length - 1))))];

/** Mide el volumen del audio cada 10 ms y decide el umbral de pausa con su propio ruido de fondo. */
export async function analizarVoz(archivo: string): Promise<Voz> {
  const s = await pcm(archivo);
  const n = Math.floor(s.length / MUESTRAS);
  const db = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let suma = 0;
    for (let j = i * MUESTRAS; j < (i + 1) * MUESTRAS; j++) suma += s[j] * s[j];
    const rms = Math.sqrt(suma / MUESTRAS) / 32768;
    db[i] = rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
  }
  if (!n) return { dur: 0, db, umbral: -100, ruido: -100, voz: -100, confiable: false };
  const ord = db.slice().sort();
  // El ruido de fondo: lo más bajo que se repite (las pausas). La voz: lo alto, sin contar los picos.
  const ruido = percentil(ord, 0.05);
  const voz = percentil(ord, 0.9);
  const rango = voz - ruido;
  // El umbral, a un tercio del camino entre el fondo y la voz, y nunca pegado a ninguno de los dos.
  const umbral = Math.min(ruido + Math.max(5, rango * 0.3), voz - 6);
  return { dur: n * CUADRO, db, umbral, ruido, voz, confiable: rango >= 10 };
}

/** Los tramos de más de `minimo` segundos en que el volumen queda por debajo de `umbral` (entre `desde` y `hasta`). */
function tramosBajos(v: Voz, umbral: number, minimo: number, desde = 0, hasta = v.dur): Pausa[] {
  const out: Pausa[] = [];
  const i0 = Math.max(0, Math.floor(desde / CUADRO));
  const i1 = Math.min(v.db.length, Math.ceil(hasta / CUADRO));
  let inicio = -1;
  let arriba = 0;
  const cerrar = (fin: number) => {
    if (inicio >= 0 && (fin - inicio) * CUADRO >= minimo) out.push({ inicio: inicio * CUADRO, fin: fin * CUADRO });
    inicio = -1;
    arriba = 0;
  };
  for (let i = i0; i < i1; i++) {
    if (v.db[i] < umbral) {
      if (inicio < 0) inicio = i;
      arriba = 0;
    } else if (inicio >= 0 && ++arriba > TOLERANCIA) {
      cerrar(i - arriba + 1);
    }
  }
  cerrar(i1 - arriba);
  return out;
}

/** El volumen típico (la mediana) entre dos momentos. */
export function nivelEntre(v: Voz, desde: number, hasta: number) {
  const a = v.db.subarray(Math.max(0, Math.floor(desde / CUADRO)), Math.min(v.db.length, Math.ceil(hasta / CUADRO)));
  return a.length ? percentil(a.slice().sort(), 0.5) : -100;
}

/** Junta pausas que se pisan o se tocan. */
function juntar(pausas: Pausa[]) {
  const ord = [...pausas].sort((a, b) => a.inicio - b.inicio);
  const out: Pausa[] = [];
  for (const p of ord) {
    const ult = out[out.length - 1];
    if (ult && p.inicio <= ult.fin + 0.02) ult.fin = Math.max(ult.fin, p.fin);
    else out.push({ ...p });
  }
  return out;
}

/**
 * Las pausas de más de `minimo` segundos para cortar.
 * 1) Por volumen: todo lo que queda debajo del umbral de este audio.
 * 2) Si hay transcripción: en los huecos entre palabras se acepta un volumen más alto (una respiración, un ruido
 *    del ambiente), pero nunca el de la voz. Así, aunque los tiempos de la transcripción no sean exactos, no se corta
 *    una palabra: lo que suena como voz no se toca.
 */
export function pausasParaCortar(v: Voz, palabras: Palabra[] = [], minimo = 0.3): Pausa[] {
  const porVolumen = v.confiable ? tramosBajos(v, v.umbral, minimo) : [];
  // Una respiración o un ruido suenan bastante más bajo que la voz (12 dB o más): entre palabras eso también es pausa.
  const relajado = Math.max(v.umbral, v.voz - 12);
  const entrePalabras: Pausa[] = [];
  for (let i = 1; i < palabras.length; i++) {
    const a = palabras[i - 1].hasta, b = palabras[i].desde;
    if (b - a < minimo) continue;
    entrePalabras.push(...tramosBajos(v, relajado, minimo, a - 0.05, b + 0.05));
  }
  return juntar([...porVolumen, ...entrePalabras]);
}

/**
 * Lleva los tiempos de las palabras al video ya cortado (los tramos son lo que quedó, en el tiempo del original).
 * Una palabra que quedó casi toda en una parte cortada se descarta (suele ser un error de la transcripción en un
 * silencio); devuelve también cuántas quedaron partidas por un corte, para la auditoría.
 */
export function moverPalabras(palabras: Palabra[], tramos: Pausa[]) {
  const acumulado: number[] = [];
  let suma = 0;
  for (const t of tramos) {
    acumulado.push(suma);
    suma += t.fin - t.inicio;
  }
  const llevar = (x: number) => {
    for (let i = 0; i < tramos.length; i++) {
      const t = tramos[i];
      if (x < t.inicio) return acumulado[i];
      if (x <= t.fin) return acumulado[i] + (x - t.inicio);
    }
    return suma;
  };
  const out: Palabra[] = [];
  let partidas = 0;
  for (const p of palabras) {
    const largo = Math.max(0.001, p.hasta - p.desde);
    const queda = tramos.reduce((s, t) => s + Math.max(0, Math.min(t.fin, p.hasta) - Math.max(t.inicio, p.desde)), 0);
    if (queda / largo < 0.5) continue;
    if (queda / largo < 0.9) partidas++;
    const desde = llevar(p.desde), hasta = llevar(p.hasta);
    if (hasta > desde) out.push({ ...p, desde, hasta });
  }
  return { palabras: out, partidas };
}
