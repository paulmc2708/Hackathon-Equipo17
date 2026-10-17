// Servidor MCP (stdio) con las herramientas propias del agente, para el modo "claude-local"
// (Claude Code headless). Mismas funciones que usa el modo API: lib/tools/*.
// Lo lanza lib/agent/claudeLocal.ts con: npx tsx scripts/mcp-coach.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { obtenerPerfil } from "../lib/tools/instagram";
import { computeOutliers } from "../lib/tools/outliers";
import { resumirActividad } from "../lib/tools/actividad";
import { evaluarTablero } from "../lib/metricas/tablero";
import { windsorCampos, windsorDatos } from "../lib/tools/windsor";

const server = new McpServer({ name: "coach", version: "1.0.0" });
const texto = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data) }] });

server.registerTool(
  "obtener_perfil_instagram",
  {
    description:
      "Trae datos públicos de una cuenta PROFESIONAL de Instagram por su usuario (API oficial de Meta): bio, seguidores y sus últimos posts con el outlier ya calculado. Devuelve un error si la API no está configurada o la cuenta es personal/privada.",
    inputSchema: { usuario: z.string().describe("Usuario sin @") },
  },
  async ({ usuario }) => texto(await obtenerPerfil(usuario)),
);

server.registerTool(
  "calcular_outliers",
  {
    description:
      "Calcula con código el multiplicador de cada post (valor ÷ mediana de la cuenta). Usala con datos de capturas o de la web.",
    inputSchema: {
      cuenta: z.string(),
      posts: z.array(
        z.object({
          url: z.string().optional(),
          caption: z.string().optional(),
          fecha: z.string().optional(),
          vistas: z.number().nullable().optional(),
          likes: z.number().nullable().optional(),
          comentarios: z.number().nullable().optional(),
        }),
      ),
    },
  },
  async ({ cuenta, posts }) => texto({ cuenta, ...computeOutliers(posts) }),
);

server.registerTool(
  "resumir_actividad",
  {
    description:
      "Promedia con código los seguidores conectados por hora (online_followers) de varios días: devuelve las 24 horas promediadas y el promedio por día de la semana. Pasale un objeto por día con sus 24 valores (hora 0 a 23, en la zona horaria en que vienen los datos).",
    inputSchema: {
      dias: z
        .array(z.object({ fecha: z.string().optional().describe("AAAA-MM-DD"), horas: z.array(z.number().nullable()).length(24) }))
        .min(1)
        .max(90),
    },
  },
  async ({ dias }) => texto(resumirActividad(dias)),
);

const numero = z.number().nullable().optional();
server.registerTool(
  "evaluar_tablero",
  {
    description:
      "Calcula con código el tablero del informe 'Las métricas que importan': puntaje 0-100, los 4 indicadores de oro (gancho, retención, recompensa, conversión) con su semáforo, lo que salió bien y hasta 3 problemas con su mensaje, en orden de prioridad. Pasale las publicaciones con sus números (null si falta un dato) y los datos de la cuenta.",
    inputSchema: {
      posts: z
        .array(
          z.object({
            url: z.string().optional(),
            fecha: z.string().optional().describe("AAAA-MM-DD"),
            tipo: z.enum(["reel", "carrusel", "imagen", "otro"]).optional(),
            duracion_s: numero,
            vistas: numero,
            alcance: numero,
            alcance_no_seguidores: numero,
            likes: numero,
            comentarios: numero,
            guardados: numero,
            compartidos: numero,
            tiempo_promedio_s: numero.describe("segundos"),
            salteo_pct: numero.describe("0 a 100: % que se va antes de los 3 s"),
            seguidores_ganados: numero,
            hashtags: numero,
            cta: z.enum(["ninguno", "pregunta", "comentar_palabra", "guardar", "compartir", "link", "comprar", "otro"]).nullable().optional(),
          }),
        )
        .max(40),
      cuenta: z
        .object({ seguidores: numero, visitas_perfil_30d: numero, seguidores_ganados_30d: numero, seguidores_netos_30d: numero, vende: z.boolean().optional() })
        .optional(),
    },
  },
  async ({ posts, cuenta }) => texto(evaluarTablero(posts, cuenta ?? {})),
);

const windsorKey = process.env.WINDSOR_KEY;
if (windsorKey) {
  server.registerTool(
    "windsor_campos",
    {
      description: "Lista los campos de las métricas PRIVADAS de Instagram de la persona (conectada en Windsor.ai). Llamala antes de windsor_datos.",
      inputSchema: { connector: z.string().optional() },
    },
    async ({ connector }) => texto(await windsorCampos(windsorKey, connector || "instagram")),
  );
  server.registerTool(
    "windsor_datos",
    {
      description: "Trae las métricas privadas de la persona desde Windsor.ai con los campos exactos de windsor_campos.",
      inputSchema: {
        campos: z.array(z.string()).max(30),
        periodo: z.enum(["last_7d", "last_14d", "last_30d", "last_90d"]),
        connector: z.string().optional(),
      },
    },
    async ({ campos, periodo, connector }) => texto(await windsorDatos(windsorKey, campos, periodo, connector || "instagram")),
  );
}

server.connect(new StdioServerTransport()).catch((e) => {
  console.error(e);
  process.exit(1);
});
