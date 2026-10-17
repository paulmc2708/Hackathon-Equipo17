import { esLocal } from "@/lib/claude/cuenta";
import { guardarCreador } from "@/lib/diario/archivos";
import { cuentaWindsor, usuarioLimpio } from "@/lib/windsor/oauth";

// POST /api/creador → guarda en esta compu lo que la persona contó de sí misma (para el aviso diario).
// Si ya se sabe cuál es su cuenta (la de Windsor), probar otra cuenta no cambia para quién corre el aviso.
export async function POST(request: Request) {
  if (!esLocal(request)) return Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });
  const cuerpo = (await request.json().catch(() => null)) as { usuario?: unknown } | null;
  const propia = await cuentaWindsor();
  if (propia && typeof cuerpo?.usuario === "string" && usuarioLimpio(cuerpo.usuario) !== propia) return Response.json({ ok: true, ignorado: true });
  const ok = await guardarCreador(cuerpo);
  return Response.json({ ok }, { status: ok ? 200 : 400 });
}
