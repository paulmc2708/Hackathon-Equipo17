import { NextResponse, type NextRequest } from "next/server";

// Las rutas /api ejecutan comandos en la compu (Claude Code, Windsor): solo se aceptan desde la misma compu
// y desde la misma página. El Host bloquea DNS rebinding; el Origin y Sec-Fetch-Site bloquean que otra web
// abierta en el navegador dispare pedidos (CSRF).
const LOCALES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const hostDe = (h: string | null) => (h ?? "").replace(/:\d+$/, "").toLowerCase();
const rechazar = () => NextResponse.json({ error: "Pedido rechazado por seguridad." }, { status: 403 });

export function proxy(request: NextRequest) {
  if (process.env.VERCEL) return NextResponse.next();
  const host = request.headers.get("host");
  if (!LOCALES.has(hostDe(host))) return rechazar();
  const sitio = request.headers.get("sec-fetch-site");
  const lectura = request.method === "GET" || request.method === "HEAD";
  // La vuelta del login de Windsor llega desde windsor.ai como navegación normal: se valida con el "state" del OAuth.
  const vueltaOAuth = lectura && request.nextUrl.pathname === "/api/windsor/callback";
  if (!vueltaOAuth && sitio && sitio !== "same-origin" && sitio !== "none") return rechazar();
  if (!lectura) {
    const origen = request.headers.get("origin");
    if (!origen) return rechazar();
    try {
      if (new URL(origen).host !== host) return rechazar();
    } catch {
      return rechazar();
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
