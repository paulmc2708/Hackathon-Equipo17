import { esLocal } from "@/lib/claude/cuenta";

// GET /api/video?url=… → baja un reel de la persona desde Instagram (sus servidores no dejan leerlo desde el navegador),
// para sacarle los cuadros en el navegador. Solo hosts de Instagram/Facebook, solo video y de hasta 120 MB.
const HOSTS = [/\.cdninstagram\.com$/, /\.fbcdn\.net$/];
const MAX = 120 * 1024 * 1024;

export async function GET(request: Request) {
  if (!esLocal(request)) return Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });
  let url: URL;
  try {
    url = new URL(new URL(request.url).searchParams.get("url") ?? "");
  } catch {
    return Response.json({ error: "URL inválida." }, { status: 400 });
  }
  if (url.protocol !== "https:" || !HOSTS.some((h) => h.test(url.hostname))) {
    return Response.json({ error: "Ese video no es de Instagram." }, { status: 400 });
  }
  const r = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(60000) }).catch(() => null);
  const tipo = r?.headers.get("content-type") ?? "";
  if (!r?.ok || !r.body || !tipo.startsWith("video/")) return Response.json({ error: "No pude bajar el video. Puede que el link haya vencido." }, { status: 502 });
  if (Number(r.headers.get("content-length") ?? 0) > MAX) return Response.json({ error: "El video es muy pesado." }, { status: 502 });
  // Se pasa en streaming, cortando si se pasa del máximo.
  let total = 0;
  const limite = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, c) {
      total += chunk.byteLength;
      if (total > MAX) c.error(new Error("muy pesado"));
      else c.enqueue(chunk);
    },
  });
  return new Response(r.body.pipeThrough(limite), { headers: { "Content-Type": tipo, "Cache-Control": "no-store" } });
}
