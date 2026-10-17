import { esLocal } from "@/lib/claude/cuenta";

// GET /api/foto?url=… → baja la foto de perfil de Instagram (sus servidores no dejan leerla desde el navegador).
// Solo hosts de Instagram/Facebook, solo imágenes y de hasta 2 MB.
const HOSTS = [/\.cdninstagram\.com$/, /\.fbcdn\.net$/];
const MAX = 2 * 1024 * 1024;

export async function GET(request: Request) {
  if (!esLocal(request)) return Response.json({ error: "Solo disponible corriendo la app en tu compu." }, { status: 403 });
  let url: URL;
  try {
    url = new URL(new URL(request.url).searchParams.get("url") ?? "");
  } catch {
    return Response.json({ error: "URL inválida." }, { status: 400 });
  }
  if (url.protocol !== "https:" || !HOSTS.some((h) => h.test(url.hostname))) {
    return Response.json({ error: "Esa foto no es de Instagram." }, { status: 400 });
  }
  const r = await fetch(url, { cache: "no-store", redirect: "error" }).catch(() => null);
  const tipo = r?.headers.get("content-type") ?? "";
  if (!r?.ok || !tipo.startsWith("image/")) return Response.json({ error: "No pude bajar la foto." }, { status: 502 });
  const datos = await r.arrayBuffer();
  if (datos.byteLength > MAX) return Response.json({ error: "La foto es muy pesada." }, { status: 502 });
  return new Response(datos, { headers: { "Content-Type": tipo, "Cache-Control": "no-store" } });
}
