import { readFile } from "node:fs/promises";
import path from "node:path";

const SKILLS_DIR = path.join(process.cwd(), ".claude", "skills");

// Archivos de apoyo que algunas skills referencian (rúbricas, fórmulas de hooks).
const EXTRAS: Record<string, string[]> = {
  "ig-profile": ["rubric.json"],
  "ig-reel": ["hooks.json"],
  "metricas-que-importan": ["informe.md"],
};

const cache = new Map<string, string>();

/** Devuelve el SKILL.md (sin frontmatter) más sus archivos de apoyo, listo para el system prompt. */
export async function loadSkill(name: string): Promise<string> {
  const hit = cache.get(name);
  if (hit) return hit;
  const dir = path.join(SKILLS_DIR, name);
  const raw = await readFile(path.join(dir, "SKILL.md"), "utf8");
  const body = raw.replace(/^---[\s\S]*?---\s*/, "");
  const parts = [`<skill name="${name}">\n${body.trim()}`];
  for (const extra of EXTRAS[name] ?? []) {
    try {
      const content = await readFile(path.join(dir, extra), "utf8");
      parts.push(`<file name="${extra}">\n${content.trim()}\n</file>`);
    } catch {
      // archivo opcional
    }
  }
  const text = parts.join("\n\n") + "\n</skill>";
  cache.set(name, text);
  return text;
}
