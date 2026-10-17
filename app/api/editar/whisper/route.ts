import { esLocal } from "@/lib/claude/cuenta";
import { motivoDeRechazo, rechazoPorSeguridad } from "@/lib/seguridad";
import { estadoInstalacion, instalarWhisper, motorWhisper } from "@/lib/video/transcribir";

// GET /api/editar/whisper → ¿hay whisper para los subtítulos? · POST {accion: "instalar"} → lo instala con Homebrew.
export async function GET(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  const motor = await motorWhisper();
  return Response.json({ disponible: Boolean(motor), motor: motor?.tipo ?? null, instalacion: estadoInstalacion() });
}

export async function POST(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  const { accion } = (await request.json().catch(() => ({}))) as { accion?: string };
  if (accion !== "instalar") return Response.json({ error: "Acción desconocida." }, { status: 400 });
  void instalarWhisper();
  return Response.json({ ok: true, instalacion: estadoInstalacion() });
}
