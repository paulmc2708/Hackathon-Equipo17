// Modo "claude-local": el agente corre con Claude Code en modo headless (`claude -p`) en ESTA compu,
// con la sesión de Claude que esté iniciada (`claude auth login`). Sirve SOLO para correr la app en local:
// en Vercel no existe el binario. Las herramientas propias llegan por MCP (scripts/mcp-coach.ts).
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { BASE, armarContexto, type Evento, type Imagen } from "./run";
import { loadSkill } from "./skills";
import { TAREAS, type Pedido } from "./tasks";
import { CLAUDE, sinApiKey } from "../claude/cuenta";
import { WINDSOR_MCP, tokenWindsor } from "../windsor/oauth";
import { herramientasDeLectura } from "../windsor/herramientas";

// Siempre Claude Opus 5.5 (pedido de Paul).
const MODELO = "claude-opus-5-5";

const EXT: Record<Imagen["media_type"], string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

const PASOS: Record<string, (i: Record<string, unknown>) => string> = {
  WebSearch: (i) => `Buscando en la web: ${i.query ?? ""}`,
  WebFetch: (i) => `Leyendo ${i.url ?? "una página"}`,
  Read: () => "Mirando las imágenes que subiste",
  StructuredOutput: () => "Armando el resultado",
  mcp__coach__obtener_perfil_instagram: (i) => `Trayendo los datos de @${String(i.usuario ?? "").replace(/^@/, "")}`,
  mcp__coach__calcular_outliers: (i) => `Calculando outliers de ${i.cuenta ?? "la cuenta"}`,
};

// En vez de las herramientas entregar_resultado / pedir_datos, el CLI devuelve JSON con este formato (--json-schema).
const reglaSalida = `
Salida (modo local):
- Tu respuesta final es un JSON con "accion".
- Si te falta contexto importante: accion "preguntas", con "preguntas" (1 a 4) y "por_que".
- Si no: accion "resultado", con "resultado" completo según el formato pedido.`;

export async function runAgentLocal(pedido: Pedido, imagenes: Imagen[], emit: (e: Evento) => void, opciones: { signal?: AbortSignal }) {
  const def = TAREAS[pedido.tarea];
  const skills = await Promise.all(def.skills.map(loadSkill));
  // Windsor conectado por OAuth: se suma su MCP con el token y SOLO sus herramientas de lectura.
  const tokenW = await tokenWindsor();
  let lecturaWindsor: string[] = [];
  if (tokenW) {
    try {
      lecturaWindsor = await herramientasDeLectura(tokenW);
    } catch {
      emit({ tipo: "paso", texto: "No pude conectar con Windsor; sigo sin tus métricas" });
    }
  }
  const conWindsor = lecturaWindsor.length > 0;
  const dir = await mkdtemp(path.join(os.tmpdir(), "coach-"));
  try {
    const rutas: string[] = [];
    for (const [i, img] of imagenes.entries()) {
      const r = path.join(dir, `captura-${i + 1}.${EXT[img.media_type]}`);
      await writeFile(r, Buffer.from(img.data, "base64"));
      rutas.push(`${r} (${img.etiqueta || "captura"})`);
    }
    const sistema = path.join(dir, "sistema.md");
    await writeFile(
      sistema,
      `${BASE.replace(/- Cuando termines, llamá a la herramienta entregar_resultado[^\n]*/, "").replace(/llamá a pedir_datos con/, 'devolvé accion "preguntas" con')}\n${reglaSalida}\n\n${skills.join("\n\n")}`,
    );
    const mcp = path.join(dir, "mcp.json");
    await writeFile(
      mcp,
      JSON.stringify({
        mcpServers: {
          ...(conWindsor ? { windsor: { type: "http", url: WINDSOR_MCP, headers: { Authorization: `Bearer ${tokenW}` } } } : {}),
          coach: {
            command: path.join(process.cwd(), "node_modules", ".bin", "tsx"),
            args: [path.join(process.cwd(), "scripts", "mcp-coach.ts")],
            env: {
              ...(process.env.META_IG_USER_ID ? { META_IG_USER_ID: process.env.META_IG_USER_ID } : {}),
              ...(process.env.META_ACCESS_TOKEN ? { META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN } : {}),
              ...(process.env.META_GRAPH_VERSION ? { META_GRAPH_VERSION: process.env.META_GRAPH_VERSION } : {}),
            },
          },
        },
      }),
    );

    const salida = z.object({
      accion: z.enum(["resultado", "preguntas"]),
      preguntas: z.array(z.string()).max(4).optional(),
      por_que: z.string().optional(),
      resultado: def.esquema.optional(),
    });
    const prompt =
      `${def.consigna(pedido)}\n\n<persona>\n${armarContexto(pedido, imagenes.length, conWindsor)}\n</persona>` +
      (rutas.length ? `\n\nImágenes adjuntas (abrilas todas con Read; entre paréntesis dice de qué es cada una):\n${rutas.join("\n")}` : "");

    const herramientas = [...(def.usaWeb ? ["WebSearch", "WebFetch"] : []), ...(rutas.length ? ["Read"] : [])];
    const args = [
      "-p",
      prompt,
      "--output-format",
      "stream-json",
      "--verbose",
      "--model",
      MODELO,
      "--system-prompt-file",
      sistema,
      "--json-schema",
      JSON.stringify(z.toJSONSchema(salida, { target: "draft-7" })),
      "--mcp-config",
      mcp,
      "--strict-mcp-config",
      "--tools",
      herramientas.join(","),
      "--allowedTools",
      ...herramientas,
      "mcp__coach",
      ...lecturaWindsor.map((n) => `mcp__windsor__${n}`),
      "--setting-sources",
      "",
      "--no-session-persistence",
      ...(rutas.length ? ["--add-dir", dir] : []),
    ];

    // Sin ANTHROPIC_API_KEY en el entorno, así usa la sesión de Claude iniciada en esta compu.
    const hijo = spawn(CLAUDE, args, { cwd: dir, env: sinApiKey(), stdio: ["ignore", "pipe", "pipe"] });
    opciones.signal?.addEventListener("abort", () => hijo.kill("SIGTERM"));

    let buf = "";
    let final: Record<string, unknown> | null = null;
    let errorTexto = "";
    hijo.stderr.on("data", (d) => (errorTexto += String(d)).slice(-2000));
    hijo.stdout.on("data", (d) => {
      buf += String(d);
      const lineas = buf.split("\n");
      buf = lineas.pop() ?? "";
      for (const l of lineas) {
        if (!l.trim()) continue;
        let ev: Record<string, unknown>;
        try {
          ev = JSON.parse(l);
        } catch {
          continue;
        }
        if (ev.type === "assistant") {
                    const content = ((ev.message as { content?: unknown[] })?.content ?? []) as { type: string; name?: string; input?: Record<string, unknown> }[];
          for (const b of content) {
            if (b.type === "tool_use" && b.name) {
              const f = PASOS[b.name];
              if (b.name.startsWith("mcp__windsor__")) emit({ tipo: "paso", texto: "Leyendo tus métricas de Windsor" });
              else emit({ tipo: "paso", texto: f ? f(b.input ?? {}) : `Usando ${b.name.replace(/^mcp__coach__/, "")}` });
            }
          }
        } else if (ev.type === "result") final = ev;
      }
    });

    const codigo: number = await new Promise((ok) => {
      hijo.on("error", () => ok(127));
      hijo.on("close", (c) => ok(c ?? 1));
    });
    if (codigo === 127) {
      emit({ tipo: "error", mensaje: "Claude Code no está instalado en esta compu. Mirá Conexiones." });
      return;
    }
    if (opciones.signal?.aborted) return;
    if (!final) {
      const noLogin = /log ?in|not logged/i.test(errorTexto);
      emit({ tipo: "error", mensaje: noLogin ? "Conectá tu cuenta de Claude en Conexiones." : `Claude Code terminó sin respuesta (código ${codigo}).` });
      return;
    }
    const f = final as { is_error?: boolean; result?: string; structured_output?: unknown; usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number } };
    if (f.is_error) {
      emit({ tipo: "error", mensaje: /log ?in/i.test(String(f.result)) ? "Conectá tu cuenta de Claude en Conexiones." : String(f.result ?? "Algo falló.").slice(0, 300) });
      return;
    }
    let crudo: unknown = f.structured_output;
    if (crudo === undefined && typeof f.result === "string") {
      try {
        crudo = JSON.parse(f.result.replace(/^```(?:json)?\s*|\s*```$/g, ""));
      } catch {}
    }
    const ok = salida.safeParse(crudo);
    if (!ok.success) {
      emit({ tipo: "error", mensaje: "La respuesta no vino en el formato esperado. Probá de nuevo." });
      return;
    }
    if (ok.data.accion === "preguntas" && ok.data.preguntas?.length && pedido.respuestas.length < 8) {
      emit({ tipo: "preguntas", preguntas: ok.data.preguntas, por_que: ok.data.por_que ?? "" });
    } else if (ok.data.resultado) {
      emit({ tipo: "resultado", tarea: pedido.tarea, data: ok.data.resultado });
    } else {
      emit({ tipo: "error", mensaje: "El agente no devolvió un resultado. Probá de nuevo." });
    }
    emit({ tipo: "uso", entrada: f.usage?.input_tokens ?? 0, salida: f.usage?.output_tokens ?? 0, cache_leida: f.usage?.cache_read_input_tokens ?? 0 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
