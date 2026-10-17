export type Post = {
  url?: string;
  caption?: string;
  fecha?: string;
  vistas?: number | null;
  likes?: number | null;
  comentarios?: number | null;
};

export type PostConOutlier = Post & {
  metrica: "vistas" | "interacciones";
  valor: number;
  multiplicador: number;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Outlier = valor del post ÷ mediana de la propia cuenta.
 * Usa vistas si al menos la mitad de los posts las tienen; si no, interacciones (likes + comentarios).
 */
export function computeOutliers(posts: Post[]): { metrica: "vistas" | "interacciones"; mediana: number; posts: PostConOutlier[] } {
  const conVistas = posts.filter((p) => typeof p.vistas === "number" && p.vistas! > 0);
  const metrica: "vistas" | "interacciones" = conVistas.length >= Math.max(1, posts.length / 2) ? "vistas" : "interacciones";
  const valorDe = (p: Post) =>
    metrica === "vistas" ? (p.vistas ?? 0) : (p.likes ?? 0) + (p.comentarios ?? 0);
  const validos = posts.filter((p) => valorDe(p) > 0);
  if (validos.length === 0) return { metrica, mediana: 0, posts: [] };
  const med = median(validos.map(valorDe));
  const out = validos
    .map((p) => ({ ...p, metrica, valor: valorDe(p), multiplicador: med > 0 ? Math.round((valorDe(p) / med) * 10) / 10 : 0 }))
    .sort((a, b) => b.multiplicador - a.multiplicador);
  return { metrica, mediana: med, posts: out };
}
