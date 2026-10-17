// Guarda y lee la evaluación del perfil de cada cuenta en .data/perfil/<usuario>.json (solo en esta compu, permisos 600),
// para que la nota sea constante entre análisis (ver rubrica.ts). Una cuenta nunca usa la evaluación de otra.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Pedido, ResultadoPerfil, ResultadoPerfilModelo } from "../agent/tasks";
import { estabilizar, textoDeAnterior, type Evaluacion } from "./rubrica";

const DIR = path.join(process.cwd(), ".data", "perfil");

/** El usuario normalizado como en el resto de la app; null si no es un usuario de Instagram válido (no se guarda nada). */
export function claveDePerfil(u: string) {
  const limpio = u.replace(/^@/, "").trim().toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(limpio) ? limpio : null;
}

const archivo = (u: string) => path.join(DIR, `${u}.json`);

export async function leerEvaluacion(usuario: string): Promise<Evaluacion | null> {
  const u = claveDePerfil(usuario);
  if (!u) return null;
  try {
    const ev = JSON.parse(await readFile(archivo(u), "utf8")) as Evaluacion;
    return ev && ev.usuario === u && Array.isArray(ev.criterios) && typeof ev.nota === "number" ? ev : null;
  } catch {
    return null;
  }
}

export async function guardarEvaluacion(ev: Evaluacion) {
  const u = claveDePerfil(ev.usuario);
  if (!u || u !== ev.usuario) return;
  await mkdir(DIR, { recursive: true, mode: 0o700 });
  await writeFile(archivo(u), JSON.stringify(ev), { mode: 0o600 });
}

/** Lo que se suma a la consigna del perfil: la evaluación anterior de ESTA cuenta, si hay. */
export async function consignaConAnterior(pedido: Pedido) {
  if (pedido.tarea !== "perfil") return "";
  const ev = await leerEvaluacion(pedido.creador.usuario);
  return ev ? textoDeAnterior(ev) : "";
}

/** Cierra el análisis del perfil: la nota la suma el código, los criterios que no cambiaron quedan igual y se guarda. */
export async function cerrarPerfil(pedido: Pedido, modelo: ResultadoPerfilModelo): Promise<ResultadoPerfil> {
  const usuario = claveDePerfil(pedido.creador.usuario);
  const anterior = usuario ? await leerEvaluacion(usuario) : null;
  const r = estabilizar(modelo.criterios, modelo.perfil_visto, anterior, usuario ?? "", new Date().toISOString());
  if (usuario) await guardarEvaluacion(r.evaluacion).catch((e) => console.error("Perfil:", (e as Error).message));
  return { ...modelo, nota_total: r.nota, criterios: r.criterios, comparacion: r.comparacion };
}
