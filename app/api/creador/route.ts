import { esLocal } from "@/lib/claude/cuenta";
import { guardarCreador } from "@/lib/diario/archivos";

// POST /api/creador → guarda en esta compu lo que la persona contó de sí misma (para el aviso diario).
export async function POST(request: Request) {
  if (!esLocal(request)) return Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });
  const cuerpo = await request.json().catch(() => null);
  const ok = await guardarCreador(cuerpo);
  return Response.json({ ok }, { status: ok ? 200 : 400 });
}
