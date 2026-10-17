import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { runAgent, type Evento, type Imagen } from "@/lib/agent/run";
import { runAgentLocal } from "@/lib/agent/claudeLocal";
import { esLocal } from "@/lib/claude/cuenta";
import { Pedido } from "@/lib/agent/tasks";

export const maxDuration = 300;

const MAX_IMAGENES = 16;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const Cuerpo = z.object({
  pedido: Pedido,
  imagenes: z
    .array(z.object({ media_type: z.enum(TIPOS), data: z.string(), etiqueta: z.string().max(120).optional() }))
    .max(MAX_IMAGENES)
    .optional()
    .default([]),
});

// POST /api/agent → NDJSON en streaming: una línea por evento ({tipo: "paso" | "texto" | "resultado" | "error" | "uso", ...}).
export async function POST(request: Request) {
  // Por defecto el agente corre en local con Claude Code (la cuenta de Claude conectada en esta compu).
  // Modo API solo si se configura a propósito: LLM_MODO=api + ANTHROPIC_API_KEY (por ejemplo, para Vercel).
  const local = process.env.LLM_MODO !== "api";
  if (local && !esLocal(request)) {
    return Response.json({ error: "El agente corre en tu compu: abrí la app desde localhost." }, { status: 403 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!local && !apiKey) {
    return Response.json({ error: "Falta ANTHROPIC_API_KEY para el modo API." }, { status: 500 });
  }
  // Clave de Windsor.ai de la persona (opcional): sus métricas privadas de Instagram.
  const windsorKey = request.headers.get("x-windsor-key")?.trim() || undefined;
  if (windsorKey && !/^[\w-]{16,128}$/.test(windsorKey)) {
    return Response.json({ error: "La clave de Windsor no tiene el formato esperado." }, { status: 400 });
  }
  if (!apiKey && !local) {
    return Response.json({ error: "Conectá tu cuenta de Anthropic en Ajustes para usar el agente." }, { status: 401 });
  }
  const parsed = Cuerpo.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Pedido inválido", detalle: z.prettifyError(parsed.error) }, { status: 400 });
  }
  const { pedido, imagenes } = parsed.data;
  if (imagenes.some((i) => (i.data.length * 3) / 4 > MAX_BYTES)) {
    return Response.json({ error: "Cada captura tiene que pesar menos de 5 MB" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: Evento) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        if (local) await runAgentLocal(pedido, imagenes as Imagen[], emit, { signal: request.signal });
        else await runAgent(pedido, imagenes as Imagen[], emit, { apiKey, windsorKey, signal: request.signal });
      } catch (err) {
        let mensaje = "Algo falló. Probá de nuevo.";
        if (err instanceof Anthropic.RateLimitError) mensaje = "Hay mucha demanda en este momento. Esperá unos segundos y probá de nuevo.";
        else if (err instanceof Anthropic.AuthenticationError) mensaje = "La clave de Anthropic del servidor no es válida.";
        else if (err instanceof Anthropic.PermissionDeniedError) mensaje = "La cuenta de Anthropic del servidor no tiene saldo para este modelo.";
        else if (err instanceof Anthropic.APIError) mensaje = `Error de la API (${err.status}).`;
        console.error(err instanceof Anthropic.APIError ? `Anthropic ${err.status}` : err);
        emit({ tipo: "error", mensaje });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
