import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { esLocal } from "@/lib/claude/cuenta";
import { motivoDeRechazo, rechazoPorSeguridad } from "@/lib/seguridad";
import { carpetaVideo, editar, trabajo } from "@/lib/video/editar";

// Esta ruta no pasa por proxy.ts (para que Next no copie el video en memoria): hace la misma verificación acá.
const MAX = 600 * 1024 * 1024;
const EXT: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/x-m4v": "m4v" };

// POST /api/editar (el cuerpo es el video) → { id }. La edición sigue en segundo plano.
export async function POST(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  const tipo = (request.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = EXT[tipo];
  if (!ext) return Response.json({ error: "Subí un video MP4, MOV o WEBM." }, { status: 400 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX) return Response.json({ error: "El video pesa más de 600 MB." }, { status: 413 });
  if (!request.body) return Response.json({ error: "No llegó el video." }, { status: 400 });
  const id = randomUUID();
  const dir = carpetaVideo(id);
  await mkdir(dir, { recursive: true });
  const original = path.join(dir, `original.${ext}`);
  let total = 0;
  const limite = new Transform({
    transform(chunk: Buffer, _e, listo) {
      total += chunk.length;
      listo(total > MAX ? new Error("muy pesado") : null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(request.body as import("node:stream/web").ReadableStream), limite, createWriteStream(original, { mode: 0o600 }));
  } catch {
    await rm(dir, { recursive: true, force: true });
    return Response.json({ error: total > MAX ? "El video pesa más de 600 MB." : "Se cortó la subida. Probá de nuevo." }, { status: 400 });
  }
  const q = new URL(request.url).searchParams;
  const estilo = (["limpios", "resaltado", "pastilla", "ninguno"] as const).find((x) => x === q.get("estilo")) ?? "limpios";
  const animacion = (["poca", "media", "mucha"] as const).find((x) => x === q.get("animacion")) ?? "media";
  const color = /^#[0-9a-f]{6}$/i.test(q.get("color") ?? "") ? q.get("color")! : "#FFD60A";
  void editar(id, original, { estilo, animacion, color });
  return Response.json({ id });
}

// GET /api/editar?id=… → cómo va la edición.
export async function GET(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const t = /^[a-f0-9-]{36}$/.test(id) ? await trabajo(id) : null;
  return t ? Response.json(t) : Response.json({ error: "No encontré esa edición." }, { status: 404 });
}
