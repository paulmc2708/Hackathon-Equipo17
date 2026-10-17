import { NextResponse, type NextRequest } from "next/server";
import { motivoDeRechazo } from "@/lib/seguridad";

// Guardia de todas las rutas /api (ver lib/seguridad.ts). La subida de videos (/api/editar) no pasa por acá
// para que Next no copie el archivo entero en memoria: esa ruta hace la misma verificación adentro.
export function proxy(request: NextRequest) {
  const motivo = motivoDeRechazo(request, { vueltaOAuth: request.nextUrl.pathname === "/api/windsor/callback" });
  return motivo ? NextResponse.json({ error: "Pedido rechazado por seguridad." }, { status: 403 }) : NextResponse.next();
}

export const config = { matcher: "/api/((?!editar).*)" };
