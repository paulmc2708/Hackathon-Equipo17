// Archivos locales de Hookia en .data/ (ignorado por git, solo en esta compu, permisos 600).
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Creador } from "../agent/tasks";

export const DATA = path.join(process.cwd(), ".data");
export const DIARIO = path.join(DATA, "diario");
const ARCH_CREADOR = path.join(DATA, "creador.json");

const escribir = async (f: string, v: unknown) => {
  await mkdir(path.dirname(f), { recursive: true });
  await writeFile(f, JSON.stringify(v), { mode: 0o600 });
};

/** Lo que la persona contó de sí misma, para que el aviso diario sepa de qué es su nicho sin la página abierta. */
export async function guardarCreador(c: unknown) {
  const ok = Creador.safeParse(c);
  if (!ok.success) return false;
  await escribir(ARCH_CREADOR, ok.data);
  return true;
}

export async function leerCreador() {
  try {
    return Creador.parse(JSON.parse(await readFile(ARCH_CREADOR, "utf8")));
  } catch {
    return null;
  }
}

/** Fecha local AAAA-MM-DD (el aviso corre a las 7 de la mañana de acá, no de Londres). */
export function hoyLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type Corrida = { fecha: string; generado: string; resultado: unknown | null; error: string; pasos: string[] };

export async function guardarCorrida(c: Corrida) {
  await escribir(path.join(DIARIO, `${c.fecha}.json`), c);
}

/** La última corrida guardada (la más nueva por fecha). */
export async function ultimaCorrida(): Promise<Corrida | null> {
  try {
    const archivos = (await readdir(DIARIO)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    const ult = archivos.at(-1);
    return ult ? (JSON.parse(await readFile(path.join(DIARIO, ult), "utf8")) as Corrida) : null;
  } catch {
    return null;
  }
}
