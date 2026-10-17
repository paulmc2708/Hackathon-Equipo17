import { esLocal } from "@/lib/claude/cuenta";
import { guardarCorrida, hoyLocal, ultimaCorrida } from "@/lib/diario/archivos";
import { activar, corriendo, correrAhora, desactivar, estaActivo, soportado } from "@/lib/diario/programar";

const soloLocal = () => Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });

// GET /api/diario → estado del aviso de las 7:00 y la última búsqueda guardada.
export async function GET(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const [activo, enCurso, ultima] = await Promise.all([estaActivo(), corriendo(), ultimaCorrida()]);
  return Response.json({ soportado, activo, corriendo: enCurso, ultima });
}

// POST /api/diario {accion: "activar" | "desactivar" | "correr" | "guardar", resultado?}
export async function POST(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const { accion, resultado } = (await request.json().catch(() => ({}))) as { accion?: string; resultado?: unknown };
  try {
    if (accion === "activar") await activar();
    else if (accion === "desactivar") await desactivar();
    else if (accion === "correr") await correrAhora();
    else if (accion === "guardar" && resultado && typeof resultado === "object") {
      await guardarCorrida({ fecha: hoyLocal(), generado: new Date().toISOString(), resultado, error: "", pasos: [] });
    } else return Response.json({ error: "Acción desconocida." }, { status: 400 });
    return Response.json({ ok: true, activo: await estaActivo() });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "No pude hacerlo." }, { status: 500 });
  }
}
