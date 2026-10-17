import { esLocal } from "@/lib/claude/cuenta";
import { completarConexion } from "@/lib/windsor/oauth";

// Vuelta de Windsor después de que la persona da permiso.
export async function GET(request: Request) {
  if (!esLocal(request)) return new Response("Solo en local", { status: 403 });
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  let resultado = "ok";
  if (!code) resultado = url.searchParams.get("error") === "access_denied" ? "cancelado" : "error";
  else {
    try {
      await completarConexion(code, state);
    } catch {
      resultado = "error";
    }
  }
  return Response.redirect(new URL(`/ajustes?windsor=${resultado}`, url.origin), 302);
}
