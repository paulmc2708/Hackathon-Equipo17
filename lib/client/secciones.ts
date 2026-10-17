// Color e ícono de cada sección: los usan la barra lateral y el título de cada página.
export const COLOR_SECCION: Record<string, string> = {
  "/": "var(--c-azul)",
  "/perfil": "var(--c-azul)",
  "/metricas": "var(--c-aqua)",
  "/competencia": "var(--c-naranja)",
  "/ideas": "var(--c-amarillo)",
  "/guiones": "var(--c-magenta)",
  "/video": "var(--c-violeta)",
  "/comunidad": "var(--c-naranja)",
  "/novedades": "var(--c-aqua)",
  "/ajustes": "var(--c-azul)",
};

export function colorDe(path: string) {
  if (path === "/") return COLOR_SECCION["/"];
  const k = Object.keys(COLOR_SECCION).find((h) => h !== "/" && path.startsWith(h));
  return k ? COLOR_SECCION[k] : "var(--accent)";
}

/** Letra que se lee bien encima del color de la sección (el amarillo pide letra oscura). */
export const textoSobre = (color: string) => (color.includes("amarillo") ? "#111111" : "#ffffff");
