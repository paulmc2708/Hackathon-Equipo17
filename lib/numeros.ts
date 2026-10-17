// Leer números escritos por el agente o por Windsor, vengan en formato de acá ("8.355", "4,5 %")
// o en inglés ("4.5%", "12.4K", "1,234"). El punto es de miles solo si lo siguen grupos de 3 cifras.

/** "8.355" → 8355 · "4.5" → 4,5 · "4,5" → 4,5 · "1,234" → 1234 · "1.234,5" → 1234,5. */
export function interpretarNumero(s: string): { valor: number; decimales: number } | null {
  s = s.replace(/[.,]+$/, "");
  if (!/^\d/.test(s)) return null;
  const punto = s.lastIndexOf("."), coma = s.lastIndexOf(",");
  let dec: "." | "," | null = null;
  if (punto >= 0 && coma >= 0) dec = punto > coma ? "." : ",";
  else if (coma >= 0) dec = /^\d{1,3}(,\d{3})+$/.test(s) ? null : ",";
  else if (punto >= 0) dec = /^\d{1,3}(\.\d{3})+$/.test(s) ? null : ".";
  const entero = dec ? s.slice(0, s.lastIndexOf(dec)) : s;
  const fraccion = dec ? s.slice(s.lastIndexOf(dec) + 1) : "";
  const valor = Number(`${entero.replace(/[.,]/g, "")}${fraccion ? `.${fraccion}` : ""}`);
  return Number.isFinite(valor) ? { valor, decimales: fraccion.length } : null;
}

/** El primer número de un texto, con dónde está (para reemplazarlo por uno animado). */
export function primerNumero(t: string) {
  const m = t.match(/\d(?:[\d.,]*\d)?/);
  if (!m || m.index === undefined) return null;
  const n = interpretarNumero(m[0]);
  return n ? { ...n, inicio: m.index, largo: m[0].length } : null;
}

/** Con "mil", "K" o "M" al lado: "12,4 mil" → 12400 · "1.2M" → 1200000. */
export function leerCantidad(t: string): number | null {
  const n = primerNumero(t);
  if (!n) return null;
  const resto = t.slice(n.inicio + n.largo).trim();
  const mult = /^(mil\b|k\b)/i.test(resto) ? 1e3 : /^(m\b|millones?\b|mill\b)/i.test(resto) ? 1e6 : 1;
  return n.valor * mult;
}
