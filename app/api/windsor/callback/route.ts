import { esLocal } from "@/lib/claude/cuenta";
import { completarConexion, pantallaDeVuelta } from "@/lib/windsor/oauth";

// Vuelta de Windsor después de que la persona da permiso.
export async function GET(request: Request) {
  if (!esLocal(request)) return new Response("Solo en local", { status: 403 });
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const volver = await pantallaDeVuelta();
  let resultado = "ok";
  if (!code) resultado = url.searchParams.get("error") === "access_denied" ? "cancelado" : "error";
  else {
    try {
      await completarConexion(code, state);
    } catch {
      resultado = "error";
    }
  }
  // Redirección relativa: el navegador se queda en el mismo origen (localhost o 127.0.0.1) con el que vino.
  return new Response(null, { status: 302, headers: { Location: `${volver}?windsor=${resultado}` } });
}
