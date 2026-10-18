// El conocimiento propio de cada agente, que va en su system prompt además de sus skills:
// - las secciones del informe "Instagram: qué métricas importan de verdad" (oct-2026, del equipo) que le tocan;
// - su investigación propia (conocimiento/<agente>.md): datos, estudios, papers, fuentes oficiales y creadores,
//   con sus reglas de decisión, para que cada conclusión tenga un respaldo real.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), ".claude", "skills", "metricas-que-importan", "secciones");
const DIR_INVESTIGACION = path.join(process.cwd(), "conocimiento");
const cache = new Map<string, string>();

async function leer(archivo: string) {
  let t = cache.get(archivo);
  if (t === undefined) {
    t = (await readFile(archivo, "utf8").catch(() => "")).trim();
    cache.set(archivo, t);
  }
  return t;
}

async function informe(secciones: string[]) {
  if (!secciones.length) return "";
  const archivos = await readdir(DIR).catch(() => [] as string[]);
  const partes: string[] = [];
  for (const n of secciones) {
    const f = archivos.find((a) => a.startsWith(`${n}-`));
    const t = f ? await leer(path.join(DIR, f)) : "";
    if (t) partes.push(t);
  }
  if (!partes.length) return "";
  return (
    `<conocimiento fuente="Informe 'Instagram: qué métricas importan de verdad' (oct-2026), del equipo">\n` +
    "Es tu base: si algo que creías no coincide con esto, gana el informe. Cuando sirva, usá el dato con su fuente.\n\n" +
    `${partes.join("\n\n")}\n</conocimiento>`
  );
}

async function investigacion(agente: string) {
  if (!/^[a-z]+$/.test(agente)) return "";
  const t = await leer(path.join(DIR_INVESTIGACION, `${agente}.md`));
  if (!t) return "";
  return (
    `<investigacion agente="${agente}" fuente="Investigación propia del agente (oct-2026), con fuentes">\n` +
    "Es tu investigación: lo que te hace experto en tu área. Usala así:\n" +
    "- Cada conclusión o recomendación que des se apoya en algo concreto: los datos de la persona y, para explicar por qué, un dato o una fuente de esta investigación o del informe. En los campos de explicación (por qué, motivo, diagnóstico) sumá ese respaldo en una frase corta y en criollo, por ejemplo: \"según un estudio de Buffer de 2025...\".\n" +
    "- Las reglas de decisión (R1, R2...) son tu guía para pasar de lo que ves en sus datos a qué recomendar.\n" +
    "- Respetá los niveles de confianza y no exageres. Si un dato es de otro mercado (por ejemplo, de EE. UU.), aclaralo.\n" +
    "- No cites fuentes que no estén acá ni inventes números. Si algo es criterio tuyo y no tiene respaldo, decilo.\n" +
    "- Los datos de la persona mandan: si contradicen un promedio de la industria, explicá la diferencia.\n\n" +
    `${t}\n</investigacion>`
  );
}

/** Las secciones del informe que le tocan al agente y, si la tiene, su investigación propia. */
export async function cargarConocimiento(secciones: string[], agente?: string): Promise<string> {
  const partes = await Promise.all([informe(secciones), agente ? investigacion(agente) : ""]);
  return partes.filter(Boolean).join("\n\n");
}
