import { cancelarLogin, cerrarSesion, enviarCodigo, esLocal, estado, iniciarLogin, loginEnCurso } from "@/lib/claude/cuenta";

const soloLocal = () => Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });

// GET /api/claude → estado de la cuenta de Claude de esta compu.
export async function GET(request: Request) {
  if (!esLocal(request)) return soloLocal();
  return Response.json({ ...(await estado()), loginEnCurso: loginEnCurso() });
}

// POST /api/claude {accion: "login" | "codigo" | "cancelar" | "logout", codigo?}
export async function POST(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const body = (await request.json().catch(() => ({}))) as { accion?: string; codigo?: string };
  switch (body.accion) {
    case "login":
      return Response.json(await iniciarLogin());
    case "codigo":
      if (!body.codigo || body.codigo.length > 400) return Response.json({ error: "Falta el código." }, { status: 400 });
      await enviarCodigo(body.codigo);
      return Response.json(await estado());
    case "cancelar":
      cancelarLogin();
      return Response.json({ ok: true });
    case "logout":
      await cerrarSesion();
      return Response.json(await estado());
    default:
      return Response.json({ error: "Acción desconocida." }, { status: 400 });
  }
}
