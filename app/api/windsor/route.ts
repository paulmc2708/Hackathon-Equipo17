import { esLocal } from "@/lib/claude/cuenta";
import { cuentaWindsor, desconectarWindsor, linkDeConexion, tokenWindsor } from "@/lib/windsor/oauth";

const soloLocal = () => Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });

// GET /api/windsor → ¿está conectado Windsor? y, si ya se sabe, de qué cuenta de Instagram es.
export async function GET(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const conectado = Boolean(await tokenWindsor());
  return Response.json({ conectado, cuenta: conectado ? await cuentaWindsor() : null });
}

// POST /api/windsor {accion: "conectar" | "desconectar", volver?: "/ajustes"}
export async function POST(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const { accion, volver } = (await request.json().catch(() => ({}))) as { accion?: string; volver?: string };
  try {
    if (accion === "conectar") {
      // El origen del navegador (proxy.ts ya verificó que coincide con el Host local): si la app se abrió en
      // 127.0.0.1, Windsor tiene que volver a 127.0.0.1 y no a localhost, que guarda otros datos.
      const origen = request.headers.get("origin") || new URL(request.url).origin;
      return Response.json({ url: await linkDeConexion(origen, typeof volver === "string" ? volver : "/") });
    }
    if (accion === "desconectar") {
      await desconectarWindsor();
      return Response.json({ conectado: false });
    }
    return Response.json({ error: "Acción desconocida." }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
