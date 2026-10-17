import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { esLocal } from "@/lib/claude/cuenta";
import { motivoDeRechazo, rechazoPorSeguridad } from "@/lib/seguridad";
import { carpetaVideo } from "@/lib/video/editar";

// GET /api/editar/archivo?id=…[&descargar=1] → el video editado. Acepta Range (Safari lo necesita para reproducir).
export async function GET(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(id)) return Response.json({ error: "Pedido inválido." }, { status: 400 });
  const archivo = path.join(carpetaVideo(id), "editado.mp4");
  const info = await stat(archivo).catch(() => null);
  if (!info) return Response.json({ error: "Todavía no está el video editado." }, { status: 404 });
  const base: Record<string, string> = { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Cache-Control": "no-store" };
  if (url.searchParams.get("descargar")) base["Content-Disposition"] = 'attachment; filename="reel-editado-hookia.mp4"';
  const rango = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (rango) {
    const inicio = rango[1] ? Number(rango[1]) : Math.max(0, info.size - Number(rango[2]));
    const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), info.size - 1) : info.size - 1;
    if (inicio > fin || inicio >= info.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    const flujo = Readable.toWeb(createReadStream(archivo, { start: inicio, end: fin })) as ReadableStream;
    return new Response(flujo, { status: 206, headers: { ...base, "Content-Range": `bytes ${inicio}-${fin}/${info.size}`, "Content-Length": String(fin - inicio + 1) } });
  }
  return new Response(Readable.toWeb(createReadStream(archivo)) as ReadableStream, { headers: { ...base, "Content-Length": String(info.size) } });
}
