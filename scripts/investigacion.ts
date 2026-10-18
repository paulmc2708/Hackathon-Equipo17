// Cuenta y revisa la investigación propia de cada agente (conocimiento/<agente>.md) y deja conocimiento/indice.json,
// que la app muestra en "Lo que sabe" de cada agente. Los números salen de contar el documento, no se escriben a mano.
// Revisa también que cada cita del texto tenga su fuente, que las reglas estén numeradas y que no haya rayas largas.
// Correr: npm run investigacion
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "conocimiento");
const TIPOS = ["Oficial", "Paper", "Estudio", "Libro", "Creador", "Prensa"] as const;
type Tipo = (typeof TIPOS)[number];
export type FichaInvestigacion = { fuentes: number; recientes: number; porTipo: Record<Tipo, number>; reglas: number; kb: number };

const NO_SON_CITAS = /^(alta|media|baja)\b|^(secundaria|clásico|no verificado|oficial|paper|estudio|libro|creador|prensa|x|\s*)$/i;

/** El texto de una sección "## …" (hasta la próxima "## "). */
function seccion(md: string, empieza: string) {
  const i = md.search(new RegExp(`^## ${empieza}`, "m"));
  if (i < 0) return "";
  const resto = md.slice(i + 3);
  const fin = resto.search(/^## /m);
  return fin < 0 ? resto : resto.slice(0, fin);
}

function revisar(id: string, md: string): { ficha: FichaInvestigacion; problemas: string[] } {
  const problemas: string[] = [];
  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<Tipo, number>;
  const etiquetas = new Set<string>();
  let recientes = 0;
  for (const linea of seccion(md, "Fuentes").split("\n")) {
    const m = linea.match(/^- \[(\w+)\]\s*([^:]+):\s*(.*)$/);
    if (!m) continue;
    const tipo = TIPOS.find((t) => t === m[1]);
    if (!tipo) {
      problemas.push(`tipo de fuente desconocido: [${m[1]}]`);
      continue;
    }
    porTipo[tipo]++;
    etiquetas.add(m[2].trim());
    const anio = Number(m[3].match(/\((\d{4})[^)]*\)/)?.[1] ?? 0);
    if (anio >= 2025) recientes++;
  }

  const numeros = [...seccion(md, "8\\.").matchAll(/^- \*\*R(\d+)\.\*\*/gm)].map((m) => Number(m[1]));
  numeros.forEach((n, i) => n !== i + 1 && problemas.push(`regla R${n} fuera de orden (esperaba R${i + 1})`));

  // Citas del texto (antes de Fuentes): [Etiqueta] o [Etiqueta; Otra], sin contar los links [texto](url).
  const texto = md.slice(0, Math.max(0, md.search(/^## Fuentes/m)));
  const citadas = new Set<string>();
  for (const m of texto.matchAll(/\[([^\]\n]+)\](?!\()/g)) {
    for (const parte of m[1].split(";").map((x) => x.trim())) {
      // Las citas llevan año ([Buffer 2025], [Mosseri, ene-2025]); lo demás entre corchetes son notas o plantillas.
      if (!parte || NO_SON_CITAS.test(parte) || /confianza/i.test(parte) || !/\d{4}/.test(parte)) continue;
      citadas.add(parte);
      if (!etiquetas.has(parte)) problemas.push(`cita sin fuente: [${parte}]`);
    }
  }
  for (const e of etiquetas) if (!citadas.has(e)) problemas.push(`fuente que no se cita en el texto: ${e}`);
  if (md.includes("—")) problemas.push(`tiene ${md.split("—").length - 1} rayas largas (—)`);
  if (/\p{Extended_Pictographic}/u.test(md)) problemas.push("tiene emojis");

  const fuentes = TIPOS.reduce((s, t) => s + porTipo[t], 0);
  if (!fuentes) problemas.push(`${id}: no encontré la lista de fuentes`);
  return { ficha: { fuentes, recientes, porTipo, reglas: numeros.length, kb: Math.round(Buffer.byteLength(md) / 1024) }, problemas };
}

async function main() {
  const archivos = (await readdir(DIR)).filter((f) => /^[a-z]+\.md$/.test(f)).sort();
  const agentes: Record<string, FichaInvestigacion> = {};
  for (const f of archivos) {
    const id = f.replace(/\.md$/, "");
    const { ficha, problemas } = revisar(id, await readFile(path.join(DIR, f), "utf8"));
    agentes[id] = ficha;
    console.log(`\n${id}: ${ficha.fuentes} fuentes (${ficha.recientes} de 2025-2026), ${ficha.reglas} reglas, ${ficha.kb} KB`);
    console.log("  " + TIPOS.map((t) => `${t}: ${ficha.porTipo[t]}`).join(" · "));
    for (const p of problemas) console.log(`  ! ${p}`);
  }
  await writeFile(path.join(DIR, "indice.json"), JSON.stringify({ agentes }, null, 2) + "\n");

  const total = Object.values(agentes).reduce((s, a) => s + a.fuentes, 0);
  console.log(`\nTotal: ${total} fuentes en ${archivos.length} investigaciones. Dejé conocimiento/indice.json.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
