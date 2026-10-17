import { esLocal } from "@/lib/claude/cuenta";
import { guardarCorrida, hoyLocal, leerCreador, ultimaCorrida } from "@/lib/diario/archivos";
import { activar, corriendo, correrAhora, desactivar, estaActivo, soportado } from "@/lib/diario/programar";

const soloLocal = () => Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });

// GET /api/diario?usuario=x → estado del aviso de las 7:00, para qué cuenta corre y la última búsqueda de esa cuenta.
export async function GET(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const usuario = new URL(request.url).searchParams.get("usuario") ?? "";
  const [activo, enCurso, ultima, creador] = await Promise.all([estaActivo(), corriendo(), ultimaCorrida(usuario), leerCreador()]);
  return Response.json({ soportado, activo, corriendo: enCurso, ultima, cuentaDelAviso: creador?.usuario ?? "" });
}

// POST /api/diario {accion: "activar" | "desactivar" | "correr" | "guardar", resultado?}
export async function POST(request: Request) {
  if (!esLocal(request)) return soloLocal();
  const { accion, resultado, usuario } = (await request.json().catch(() => ({}))) as { accion?: string; resultado?: unknown; usuario?: string };
  try {
    if (accion === "activar") await activar();
    else if (accion === "desactivar") await desactivar();
    else if (accion === "correr") await correrAhora();
    else if (accion === "guardar" && resultado && typeof resultado === "object" && typeof usuario === "string" && usuario.trim()) {
      await guardarCorrida({ fecha: hoyLocal(), generado: new Date().toISOString(), usuario, resultado, error: "", pasos: [] });
    } else return Response.json({ error: "Acción desconocida." }, { status: 400 });
    return Response.json({ ok: true, activo: await estaActivo() });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "No pude hacerlo." }, { status: 500 });
  }
}
