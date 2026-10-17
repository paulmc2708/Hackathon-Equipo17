// Comprobación de calidad: los multiplicadores (outliers) que muestra la web tienen que ser los que calculó el código
// (calcular_outliers u obtener_perfil_instagram) en esta misma corrida. Si el modelo escribió uno que no sale de ahí, se borra.

/** Misma publicación aunque cambie el formato del link (reel/p, www, barra final, ?igsh=…). */
export function clavePublicacion(url: string) {
  const ig = url.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([\w-]+)/i);
  if (ig) return `ig:${ig[1]}`;
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
}

type Post = { url?: unknown; multiplicador?: unknown };

/** Guarda los multiplicadores que devolvió una herramienta de cálculo (su salida en JSON). */
export function registrarCalculo(calculos: Map<string, number>, salida: unknown) {
  const o = salida as { posts?: Post[]; outliers?: { posts?: Post[] } } | null;
  for (const p of [...(o?.posts ?? []), ...(o?.outliers?.posts ?? [])]) {
    if (typeof p?.url === "string" && p.url && typeof p.multiplicador === "number") calculos.set(clavePublicacion(p.url), p.multiplicador);
  }
}

/**
 * Recorre el resultado y deja en null todo multiplicador que no coincida con uno calculado (por link).
 * Devuelve cuántos sacó. Modifica el objeto que recibe.
 */
export function verificarMultiplicadores(resultado: unknown, calculos: Map<string, number>): number {
  let sacados = 0;
  const visitar = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(visitar);
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    if (typeof o.multiplicador === "number") {
      const link = typeof o.link === "string" ? o.link : typeof o.url === "string" ? o.url : "";
      const real = link ? calculos.get(clavePublicacion(link)) : undefined;
      if (real === undefined || Math.abs(real - o.multiplicador) > 0.051) {
        o.multiplicador = null;
        sacados++;
      }
    }
    Object.values(o).forEach(visitar);
  };
  visitar(resultado);
  if (sacados && resultado && typeof resultado === "object" && typeof (resultado as { limitaciones?: unknown }).limitaciones === "string") {
    const r = resultado as { limitaciones: string };
    const nota = `${sacados === 1 ? "A una publicación le saqué" : `A ${sacados} publicaciones les saqué`} el "veces su promedio" porque no lo pude calcular con datos reales.`;
    r.limitaciones = [r.limitaciones.trim(), nota].filter(Boolean).join(" ");
  }
  return sacados;
}

/** Saca el JSON de la salida de una herramienta (texto, o bloques de texto como los de MCP). */
export function salidaDeHerramienta(content: unknown): unknown {
  const texto =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((b) => (b && typeof b === "object" && typeof (b as { text?: unknown }).text === "string" ? (b as { text: string }).text : "")).join("")
        : "";
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}
