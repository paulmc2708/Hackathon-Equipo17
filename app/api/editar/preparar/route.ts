import { esLocal } from "@/lib/claude/cuenta";
import { motivoDeRechazo, rechazoPorSeguridad } from "@/lib/seguridad";
import { estadoEditor, preparar } from "@/lib/video/preparar";

// GET /api/editar/preparar → ¿está lista la compu para editar? (ffmpeg, subtítulos y whisper)
// POST /api/editar/preparar → instala lo que falte con Homebrew (en segundo plano; el avance sale en el GET).
export async function GET(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  return Response.json(await estadoEditor());
}

export async function POST(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  void preparar();
  return Response.json(await estadoEditor());
}
