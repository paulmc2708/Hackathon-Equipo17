import Anthropic from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaContentBlockParam,
  BetaMessage,
  BetaMessageParam,
  BetaTool,
  BetaToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { z } from "zod";
import { loadSkill } from "./skills";
import { TAREAS, type Pedido } from "./tasks";
import { obtenerPerfil } from "../tools/instagram";
import { computeOutliers } from "../tools/outliers";

export const MODEL = "claude-opus-5-5";
const MAX_VUELTAS = 14;

export type Imagen = { media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string };

export type Evento =
  | { tipo: "paso"; texto: string }
  | { tipo: "texto"; delta: string }
  | { tipo: "resultado"; tarea: Pedido["tarea"]; data: unknown }
  | { tipo: "error"; mensaje: string }
  | { tipo: "uso"; entrada: number; salida: number; cache_leida: number };

const BASE = `Sos un coach de Instagram para personas con MARCA PERSONAL (expertos que venden lo que saben: coaches, profesionales, freelancers, creadores), en español.
Trabajás con la skill que viene abajo: seguí su método.
Reglas:
- Nunca inventes datos (seguidores, vistas, likes, fechas, sueldos). Los números salen de las herramientas o de las capturas. Si falta un dato, decilo en "limitaciones".
- Los multiplicadores (outliers) los calcula el código: usá los que devuelven las herramientas, no los estimes vos.
- Todo lo que propongas tiene que servir para ESTA persona: su historia, lo que vende y a quién.
- Escribí en español, claro y sin tono de bot (reglas de ig-human): sin guiones largos, sin muletillas de IA, sin emojis de más.
- Nunca pidas contraseñas ni publiques nada.
- Cuando termines, llamá a la herramienta entregar_resultado UNA sola vez con el resultado completo. No escribas el resultado como texto.`;

const herramientasPropias = (esquema: z.ZodTypeAny): BetaTool[] => [
  {
    name: "obtener_perfil_instagram",
    description:
      "Trae datos públicos de una cuenta PROFESIONAL de Instagram por su usuario (API oficial de Meta): bio, seguidores, cantidad de posts y sus últimos posts con el outlier ya calculado (valor ÷ mediana de la cuenta). Devuelve un error si la API no está configurada o la cuenta es personal/privada.",
    input_schema: {
      type: "object",
      properties: { usuario: { type: "string", description: "Usuario sin @, por ejemplo: entrenadorjuan" } },
      required: ["usuario"],
    },
  },
  {
    name: "calcular_outliers",
    description:
      "Calcula con código el multiplicador de cada post (valor ÷ mediana de la cuenta). Usala con datos que conseguiste de capturas o de la web. Usa vistas si están en al menos la mitad de los posts; si no, likes + comentarios.",
    input_schema: {
      type: "object",
      properties: {
        cuenta: { type: "string" },
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              caption: { type: "string" },
              fecha: { type: "string" },
              vistas: { type: ["number", "null"] },
              likes: { type: ["number", "null"] },
              comentarios: { type: ["number", "null"] },
            },
          },
        },
      },
      required: ["cuenta", "posts"],
    },
  },
  {
    name: "entregar_resultado",
    description: "Entrega el resultado final de la tarea. Llamala una sola vez, al final.",
    input_schema: z.toJSONSchema(esquema, { target: "draft-7" }) as BetaTool["input_schema"],
  },
];

const PasosLegibles: Record<string, (input: Record<string, unknown>) => string> = {
  web_search: (i) => `Buscando en la web: ${i.query ?? ""}`,
  web_fetch: (i) => `Leyendo ${i.url ?? "una página"}`,
  obtener_perfil_instagram: (i) => `Trayendo los datos de @${String(i.usuario ?? "").replace(/^@/, "")}`,
  calcular_outliers: (i) => `Calculando outliers de ${i.cuenta ?? "la cuenta"}`,
  entregar_resultado: () => "Armando el resultado",
};

function describirPaso(block: BetaContentBlock): string | null {
  if (block.type !== "tool_use" && block.type !== "server_tool_use") return null;
  const f = PasosLegibles[block.name];
  return f ? f((block.input ?? {}) as Record<string, unknown>) : `Usando ${block.name}`;
}

async function ejecutarHerramienta(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "obtener_perfil_instagram") return JSON.stringify(await obtenerPerfil(String(input.usuario ?? "")));
  if (name === "calcular_outliers") {
    const posts = Array.isArray(input.posts) ? input.posts : [];
    return JSON.stringify({ cuenta: input.cuenta, ...computeOutliers(posts) });
  }
  return JSON.stringify({ error: `herramienta desconocida: ${name}` });
}

export async function runAgent(pedido: Pedido, imagenes: Imagen[], emit: (e: Evento) => void, signal?: AbortSignal) {
  const client = new Anthropic();
  const def = TAREAS[pedido.tarea];
  const skills = await Promise.all(def.skills.map(loadSkill));

  // Prefijo estable (cacheable): instrucciones base + skills. Lo variable va en el mensaje del usuario.
  const system = [{ type: "text" as const, text: `${BASE}\n\n${skills.join("\n\n")}`, cache_control: { type: "ephemeral" as const } }];

  const tools = [
    ...herramientasPropias(def.esquema),
    ...(def.usaWeb
      ? [
          { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 8 },
          { type: "web_fetch_20260209" as const, name: "web_fetch" as const, max_uses: 6 },
        ]
      : []),
  ];

  const c = pedido.creador;
  const contexto = [
    `Usuario de Instagram: @${c.usuario.replace(/^@/, "")}`,
    c.aQueSeDedica && `A qué se dedica: ${c.aQueSeDedica}`,
    c.queVende && `Qué vende o quiere vender: ${c.queVende}`,
    c.aQuien && `A quién le vende: ${c.aQuien}`,
    c.historia && `Su historia (lo que lo hace distinto): ${c.historia}`,
    c.captions.length > 0 && `Captions suyos (para copiar su voz):\n${c.captions.map((t) => `- ${t}`).join("\n")}`,
    imagenes.length > 0 && `Adjuntó ${imagenes.length} captura(s) de su perfil o estadísticas.`,
  ]
    .filter(Boolean)
    .join("\n");

  const content: BetaContentBlockParam[] = [
    ...imagenes.map((img) => ({ type: "image" as const, source: { type: "base64" as const, ...img } })),
    { type: "text", text: `${def.consigna(pedido)}\n\n<persona>\n${contexto}\n</persona>` },
  ];
  const messages: BetaMessageParam[] = [{ role: "user", content }];

  let entrada = 0, salida = 0, cacheLeida = 0;

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 32000,
        system,
        tools,
        messages,
        output_config: { effort: def.esfuerzo },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { signal },
    );
    stream.on("text", (delta) => emit({ tipo: "texto", delta }));
    stream.on("contentBlock", (block) => {
      const paso = describirPaso(block);
      if (paso) emit({ tipo: "paso", texto: paso });
    });

    const msg: BetaMessage = await stream.finalMessage();
    entrada += msg.usage.input_tokens;
    salida += msg.usage.output_tokens;
    cacheLeida += msg.usage.cache_read_input_tokens ?? 0;

    if (msg.stop_reason === "refusal") {
      emit({ tipo: "error", mensaje: "El modelo no pudo completar este pedido. Probá reformularlo." });
      break;
    }
    if (msg.stop_reason === "max_tokens") {
      emit({ tipo: "error", mensaje: "La respuesta quedó cortada. Probá de nuevo." });
      break;
    }
    if (msg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: msg.content });
      continue;
    }

    const usos = msg.content.filter((b) => b.type === "tool_use");
    messages.push({ role: "assistant", content: msg.content });

    if (usos.length === 0) {
      // Terminó sin entregar: se lo recordamos una vez.
      messages.push({ role: "user", content: "Llamá a entregar_resultado con el resultado completo." });
      continue;
    }

    const resultados: BetaToolResultBlockParam[] = [];
    let entregado = false;
    for (const uso of usos) {
      if (uso.type !== "tool_use") continue;
      const input = (uso.input ?? {}) as Record<string, unknown>;
      if (uso.name === "entregar_resultado") {
        const ok = def.esquema.safeParse(input);
        if (ok.success) {
          emit({ tipo: "resultado", tarea: pedido.tarea, data: ok.data });
          entregado = true;
          resultados.push({ type: "tool_result", tool_use_id: uso.id, content: "ok" });
        } else {
          resultados.push({
            type: "tool_result",
            tool_use_id: uso.id,
            is_error: true,
            content: `El resultado no cumple el formato: ${z.prettifyError(ok.error)}. Corregilo y volvé a llamar.`,
          });
        }
        continue;
      }
      try {
        resultados.push({ type: "tool_result", tool_use_id: uso.id, content: await ejecutarHerramienta(uso.name, input) });
      } catch (err) {
        resultados.push({ type: "tool_result", tool_use_id: uso.id, is_error: true, content: String(err) });
      }
    }
    if (entregado) break;
    messages.push({ role: "user", content: resultados });
  }

  emit({ tipo: "uso", entrada, salida, cache_leida: cacheLeida });
}
