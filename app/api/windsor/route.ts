import { esLocal } from "@/lib/claude/cuenta";
import { desconectarWindsor, linkDeConexion, tokenWindsor } from "@/lib/windsor/oauth";

const soloLocal = () => Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });

// GET /api/windsor → ¿está conectado Windsor?
export async function GET(request: Request) {
  if (!esLocal(request)) return soloLocal();
  return Response.json({ conectado: Boolean(await tokenWindsor()) });
}

// POST /api/windsor {accion: "conectar" | "desconectar"}
export async function POST(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const { accion } = (await request.json().catch(() => ({}))) as { accion?: string };
  try {
    if (accion === "conectar") return Response.json({ url: await linkDeConexion(new URL(request.url).origin) });
    if (accion === "desconectar") {
      await desconectarWindsor();
      return Response.json({ conectado: false });
    }
    return Response.json({ error: "Acción desconocida." }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
