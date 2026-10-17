// El conocimiento propio de cada agente: las secciones del informe "Instagram: qué métricas importan de verdad"
// (oct-2026, del equipo) que le tocan. Va en su system prompt, además de sus skills.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), ".claude", "skills", "metricas-que-importan", "secciones");
const cache = new Map<string, string>();

export async function cargarConocimiento(secciones: string[]): Promise<string> {
  if (!secciones.length) return "";
  const archivos = await readdir(DIR).catch(() => [] as string[]);
  const partes: string[] = [];
  for (const n of secciones) {
    const f = archivos.find((a) => a.startsWith(`${n}-`));
    if (!f) continue;
    let t = cache.get(f);
    if (!t) {
      t = (await readFile(path.join(DIR, f), "utf8")).trim();
      cache.set(f, t);
    }
    partes.push(t);
  }
  if (!partes.length) return "";
  return (
    `<conocimiento fuente="Informe 'Instagram: qué métricas importan de verdad' (oct-2026), del equipo">\n` +
    "Es tu base: si algo que creías no coincide con esto, gana el informe. Cuando sirva, usá el dato con su fuente.\n\n" +
    `${partes.join("\n\n")}\n</conocimiento>`
  );
}
