// Modo "claude-local": el agente corre con Claude Code en modo headless (`claude -p`) en ESTA compu,
// con la sesión de Claude que esté iniciada (`claude auth login`). Sirve SOLO para correr la app en local:
// en Vercel no existe el binario. Las herramientas propias llegan por MCP (scripts/mcp-coach.ts).
import { execFile, spawn } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { BASE, armarContexto, type Evento, type Imagen } from "./run";
import { loadSkill } from "./skills";
import { TAREAS, type Pedido } from "./tasks";
import { registrarCalculo, salidaDeHerramienta, verificarMultiplicadores } from "./verificar";
import { CLAUDE, sinApiKey } from "../claude/cuenta";
import { WINDSOR_MCP, cuentaWindsor, guardarCuentaWindsor, tokenWindsor, usuarioLimpio } from "../windsor/oauth";
import { herramientasDeLectura } from "../windsor/herramientas";

// Siempre Claude Opus 5.5 (pedido de Paul).
const MODELO = "claude-opus-5-5";

/** Corta en el último fin de frase antes del límite, para no mostrar párrafos en el chat. */
const recortar = (t: string, max: number) => {
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const fin = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("? "), corte.lastIndexOf("! "));
  return fin > 40 ? corte.slice(0, fin + 1) : `${corte.trimEnd()}…`;
};

const EXT: Record<Imagen["media_type"], string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

const PASOS: Record<string, (i: Record<string, unknown>) => string> = {
  WebSearch: (i) => `Buscando en la web: ${i.query ?? ""}`,
  WebFetch: (i) => `Leyendo ${i.url ?? "una página"}`,
  Read: () => "Mirando las imágenes que subiste",
  StructuredOutput: () => "Armando el resultado",
  mcp__coach__obtener_perfil_instagram: (i) => `Trayendo los datos de @${String(i.usuario ?? "").replace(/^@/, "")}`,
  mcp__coach__calcular_outliers: (i) => `Calculando outliers de ${i.cuenta ?? "la cuenta"}`,
  mcp__coach__resumir_actividad: () => "Calculando a qué hora se conectan tus seguidores",
};

// Herramientas cuyos multiplicadores valen (los calcula el código).
const CALCULAN = new Set(["mcp__coach__calcular_outliers", "mcp__coach__obtener_perfil_instagram"]);

// En vez de las herramientas entregar_resultado / pedir_datos, el CLI devuelve JSON con este formato (--json-schema).
const reglaSalida = `
Salida (modo local):
- Tu respuesta final es un JSON con "accion".
- Casi siempre: accion "resultado", con "resultado" completo según el formato pedido.
- Si algo que solo la persona sabe mejoraría mucho el resultado, sumá "para_mejorar": UN solo pedido, una o dos frases y menos de 160 caracteres, como un mensaje de chat (por ejemplo: "¿Me pegás 2 o 3 captions tuyos? Así lo escribo con tu forma de hablar"). Si no hace falta, no lo pongas.
- Solo si no hay ningún dato con qué trabajar: accion "preguntas", con "preguntas" (una sola) y "por_que".`;

// ¿Este Claude Code entiende --effort? Las versiones viejas no: se pregunta una sola vez.
let conEffort: Promise<boolean> | null = null;
const soportaEffort = () =>
  (conEffort ??= new Promise((ok) =>
    execFile(CLAUDE, ["--help"], { env: sinApiKey(), timeout: 15000 }, (e, out) => ok(!e && /--effort\b/.test(String(out)))),
  ));

/** Los errores del CLI, en criollo. Los textos crudos van solo a la consola. */
function errorLegible(t: string) {
  if (/not logged|log ?in|please run .*login|invalid api key|oauth token/i.test(t)) return "Conectá tu cuenta de Claude en Conexiones.";
  if (/usage limit|hit your limit|limit reached|rate.?limit|\b429\b/i.test(t)) return "Llegaste al límite de uso de tu plan de Claude. Probá de nuevo en un rato.";
  if (/overload|\b529\b|\b503\b|unavailable/i.test(t)) return "Claude está con mucha demanda en este momento. Probá de nuevo en unos segundos.";
  if (/unknown option|unrecognized option|unknown argument/i.test(t)) return "Tu Claude Code está viejo para esta app. Actualizalo con: npm install -g @anthropic-ai/claude-code";
  if (/credit|billing|balance/i.test(t)) return "Tu cuenta de Claude no tiene saldo para este modelo.";
  return "";
}

export async function runAgentLocal(
  pedido: Pedido,
  imagenes: Imagen[],
  emit: (e: Evento) => void,
  opciones: { signal?: AbortSignal; sinWindsor?: boolean },
) {
  const def = TAREAS[pedido.tarea];
  const skills = await Promise.all(def.skills.map(loadSkill));

  // Windsor conectado por OAuth: se suma su MCP con el token y SOLO sus herramientas de lectura.
  // Únicamente si es la MISMA cuenta que se analiza: con otra (por ejemplo, la que pide el jurado) no se mezclan datos.
  const usuario = usuarioLimpio(pedido.creador.usuario);
  const cuentaW = await cuentaWindsor();
  const otra = cuentaW && pedido.tarea !== "cuenta" && usuario && cuentaW !== usuario ? cuentaW : null;
  const tokenW = opciones.sinWindsor || otra ? null : await tokenWindsor();
  let lecturaWindsor: string[] = [];
  let prohibidasWindsor: string[] = [];
  let falloWindsor = false;
  if (tokenW) {
    try {
      ({ nombres: lecturaWindsor, prohibidas: prohibidasWindsor } = await herramientasDeLectura(tokenW));
    } catch (e) {
      falloWindsor = true;
      console.error("Windsor MCP:", (e as Error).message);
      emit({ tipo: "paso", texto: "No pude conectar con Windsor; sigo sin tus métricas" });
    }
  }
  const conWindsor = lecturaWindsor.length > 0;
  if (pedido.tarea === "cuenta" && !conWindsor) {
    emit({ tipo: "error", mensaje: tokenW ? "Windsor no respondió. Probá de nuevo en un rato o reconectalo en Conexiones." : "Conectá Windsor en Conexiones para traer tu nombre y tu foto." });
    return;
  }
  if (opciones.signal?.aborted) return;

  // Dos carpetas: una con las capturas (lo único que el agente puede leer) y otra con la configuración,
  // que lleva los tokens (mcp.json) y queda fuera de su alcance.
  const dir = await mkdtemp(path.join(os.tmpdir(), "hookia-"));
  const config = await mkdtemp(path.join(os.tmpdir(), "hookia-cfg-"));
  try {
    const [dirReal, configReal] = await Promise.all([realpath(dir), realpath(config)]);
    const rutas: string[] = [];
    for (const [i, img] of imagenes.entries()) {
      const r = path.join(dir, `captura-${i + 1}.${EXT[img.media_type]}`);
      await writeFile(r, Buffer.from(img.data, "base64"), { mode: 0o600 });
      rutas.push(`${r} (${img.etiqueta || "captura"})`);
    }
    const sistema = path.join(config, "sistema.md");
    await writeFile(
      sistema,
      `${BASE.replace(/- Cuando termines, llamá a la herramienta entregar_resultado[^\n]*/, "").replace(/llamá a pedir_datos con/, 'devolvé accion "preguntas" con')}\n${reglaSalida}\n\n${skills.join("\n\n")}`,
      { mode: 0o600 },
    );
    const mcp = path.join(config, "mcp.json");
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
      { mode: 0o600 },
    );

    const salida = z.object({
      accion: z.enum(["resultado", "preguntas"]),
      preguntas: z.array(z.string()).max(4).optional(),
      por_que: z.string().optional(),
      resultado: def.esquema.optional(),
      para_mejorar: z.string().optional(),
    });
    const contexto = armarContexto(pedido, imagenes.length, { usar: conWindsor, cuenta: cuentaW, otra, fallo: falloWindsor });
    const prompt =
      `${def.consigna(pedido)}\n\n<persona>\n${contexto}\n</persona>` +
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
      ...((await soportaEffort()) ? ["--effort", def.esfuerzo] : []),
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
      // Read solo dentro de la carpeta de las capturas (con su ruta real: en macOS /var es /private/var).
      ...herramientas.flatMap((h) => (h === "Read" ? [...new Set([dir, dirReal])].map((d) => `Read(/${d}/**)`) : [h])),
      "mcp__coach",
      ...lecturaWindsor.map((n) => `mcp__windsor__${n}`),
      // Prohibido: la carpeta personal, la de configuración (tokens) y las herramientas de Windsor que crean, cambian o borran.
      "--disallowedTools",
      "Read(~/**)",
      ...[...new Set([config, configReal])].map((d) => `Read(/${d}/**)`),
      ...prohibidasWindsor.map((n) => `mcp__windsor__${n}`),
      "--setting-sources",
      "",
      "--no-session-persistence",
      ...(rutas.length ? ["--add-dir", dir] : []),
    ];

    if (opciones.signal?.aborted) return;
    // Sin ANTHROPIC_API_KEY en el entorno, así usa la sesión de Claude iniciada en esta compu.
    const hijo = spawn(CLAUDE, args, { cwd: dir, env: sinApiKey(), stdio: ["ignore", "pipe", "pipe"] });
    const cortar = () => hijo.kill("SIGTERM");
    opciones.signal?.addEventListener("abort", cortar, { once: true });
    if (opciones.signal?.aborted) cortar();

    // utf8: así una tilde partida entre dos pedazos del pipe no queda rota.
    hijo.stdout.setEncoding("utf8");
    hijo.stderr.setEncoding("utf8");
    let buf = "";
    let final: Record<string, unknown> | null = null;
    let errorTexto = "";
    const herramientaDe = new Map<string, string>();
    const calculos = new Map<string, number>();
    const procesar = (l: string) => {
      if (!l.trim()) return;
      let ev: Record<string, unknown>;
      try {
        ev = JSON.parse(l);
      } catch {
        return;
      }
      if (ev.type === "assistant") {
        const content = ((ev.message as { content?: unknown[] })?.content ?? []) as { type: string; id?: string; name?: string; input?: Record<string, unknown> }[];
        for (const b of content) {
          if (b.type === "tool_use" && b.name) {
            if (b.id) herramientaDe.set(b.id, b.name);
            const f = PASOS[b.name];
            if (b.name.startsWith("mcp__windsor__")) emit({ tipo: "paso", texto: "Leyendo tus métricas de Windsor" });
            else emit({ tipo: "paso", texto: f ? f(b.input ?? {}) : `Usando ${b.name.replace(/^mcp__coach__/, "")}` });
          }
        }
      } else if (ev.type === "user") {
        // Resultados de herramientas: se guardan los multiplicadores que calculó el código.
        const content = ((ev.message as { content?: unknown[] })?.content ?? []) as { type?: string; tool_use_id?: string; content?: unknown }[];
        for (const b of Array.isArray(content) ? content : []) {
          if (b?.type === "tool_result" && b.tool_use_id && CALCULAN.has(herramientaDe.get(b.tool_use_id) ?? "")) {
            registrarCalculo(calculos, salidaDeHerramienta(b.content));
          }
        }
      } else if (ev.type === "result") final = ev;
    };
    hijo.stderr.on("data", (d: string) => {
      errorTexto = (errorTexto + d).slice(-2000);
    });
    hijo.stdout.on("data", (d: string) => {
      buf += d;
      const lineas = buf.split("\n");
      buf = lineas.pop() ?? "";
      lineas.forEach(procesar);
    });

    const codigo: number = await new Promise((ok) => {
      hijo.on("error", () => ok(127));
      hijo.on("close", (c) => ok(c ?? 1));
    });
    procesar(buf);
    if (codigo === 127) {
      emit({ tipo: "error", mensaje: "Claude Code no está instalado en esta compu. Mirá Conexiones." });
      return;
    }
    if (opciones.signal?.aborted) return;
    if (!final) {
      if (errorTexto.trim()) console.error("Claude Code:", errorTexto.trim().slice(-500));
      emit({ tipo: "error", mensaje: errorLegible(errorTexto) || "Claude Code se cortó sin responder. Probá de nuevo." });
      return;
    }
    const f = final as { is_error?: boolean; result?: string; structured_output?: unknown; usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number } };
    if (f.is_error) {
      console.error("Claude Code:", String(f.result ?? "").slice(0, 500));
      emit({ tipo: "error", mensaje: errorLegible(String(f.result ?? "")) || "Claude no pudo terminar esta tarea. Probá de nuevo." });
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
      const resultado = ok.data.resultado;
      verificarMultiplicadores(resultado, calculos);
      if (pedido.tarea === "cuenta") {
        const u = (resultado as { usuario?: unknown }).usuario;
        if (typeof u === "string" && u.trim()) await guardarCuentaWindsor(u);
      }
      emit({ tipo: "resultado", tarea: pedido.tarea, data: resultado });
      const pedir = ok.data.para_mejorar?.trim();
      if (pedir && pedido.tarea !== "cuenta") emit({ tipo: "sugerencia", texto: recortar(pedir, 220) });
    } else {
      emit({ tipo: "error", mensaje: "El agente no devolvió un resultado. Probá de nuevo." });
    }
    emit({ tipo: "uso", entrada: f.usage?.input_tokens ?? 0, salida: f.usage?.output_tokens ?? 0, cache_leida: f.usage?.cache_read_input_tokens ?? 0 });
  } finally {
    await Promise.all([rm(dir, { recursive: true, force: true }), rm(config, { recursive: true, force: true })]);
  }
}
