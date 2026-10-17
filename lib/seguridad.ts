// Las rutas /api ejecutan comandos en la compu (Claude Code, Windsor, ffmpeg): solo se aceptan desde la misma compu
// y desde la misma página. El Host bloquea DNS rebinding; el Origin y Sec-Fetch-Site bloquean que otra web
// abierta en el navegador dispare pedidos (CSRF). Lo usan proxy.ts y las rutas que no pasan por él (subida de videos).
const LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const hostDe = (h: string | null) => (h ?? "").replace(/:\d+$/, "").toLowerCase();

/** null si el pedido es seguro; si no, el motivo del rechazo. */
export function motivoDeRechazo(request: Request, opciones: { vueltaOAuth?: boolean } = {}): string | null {
  if (process.env.VERCEL) return null;
  const host = request.headers.get("host");
  if (!LOCALES.has(hostDe(host))) return "host";
  const sitio = request.headers.get("sec-fetch-site");
  const lectura = request.method === "GET" || request.method === "HEAD";
  // La vuelta del login de Windsor llega desde windsor.ai como navegación normal: se valida con el "state" del OAuth.
  if (!(lectura && opciones.vueltaOAuth) && sitio && sitio !== "same-origin" && sitio !== "none") return "sitio";
  if (!lectura) {
    const origen = request.headers.get("origin");
    if (!origen) return "origen";
    try {
      if (new URL(origen).host !== host) return "origen";
    } catch {
      return "origen";
    }
  }
  return null;
}

export const rechazoPorSeguridad = () => Response.json({ error: "Pedido rechazado por seguridad." }, { status: 403 });
