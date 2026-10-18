// El conocimiento propio de cada agente: su ficha de experto (investigación en la web con fuentes, en
// conocimiento/expertos/<id>.md) y las secciones del informe "Instagram: qué métricas importan de verdad"
// (oct-2026, del equipo) que le tocan. Va en su system prompt, además de sus skills.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), ".claude", "skills", "metricas-que-importan", "secciones");
const DIR_EXPERTOS = path.join(process.cwd(), "conocimiento", "expertos");
const cache = new Map<string, string>();

async function ficha(idAgente: string): Promise<string> {
  const clave = `experto:${idAgente}`;
  let t = cache.get(clave);
  if (!t) {
    t = (await readFile(path.join(DIR_EXPERTOS, `${idAgente}.md`), "utf8").catch(() => "")).trim();
    if (t) cache.set(clave, t);
  }
  if (!t) return "";
  return (
    `<experto agente="${idAgente}">\n` +
    "Esta es tu especialidad. Usala para que tu respuesta sea la de un experto en esto, no la de un chat cualquiera: " +
    "aplicá sus reglas y umbrales, y citá el dato con su fuente cuando sume. Lo marcado [No verificado] no lo presentes como hecho.\n\n" +
    `${t}\n</experto>`
  );
}

export async function cargarConocimiento(secciones: string[], idAgente?: string): Promise<string> {
  const experto = idAgente ? await ficha(idAgente) : "";
  const informe = await informeDe(secciones);
  return [experto, informe].filter(Boolean).join("\n\n");
}

async function informeDe(secciones: string[]): Promise<string> {
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
