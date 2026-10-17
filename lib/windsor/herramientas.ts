// Lista las herramientas del MCP de Windsor y se queda SOLO con las de lectura.
// El MCP también tiene herramientas que publican, comentan o tocan anuncios: esas nunca se habilitan.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { WINDSOR_MCP } from "./oauth";

const ESCRITURA = /(create|update|delete|remove|publish|post|comment|reply|send|set|pause|enable|disable|activate|deactivate|manage|edit|upload|write|launch|bid|budget|archive)/i;

let cache: { token: string; nombres: string[]; prohibidas: string[] } | null = null;

export async function herramientasDeLectura(token: string): Promise<{ nombres: string[]; prohibidas: string[] }> {
  if (cache?.token === token) return cache;
  const cliente = new Client({ name: "hookia", version: "1.0.0" });
  const transporte = new StreamableHTTPClientTransport(new URL(WINDSOR_MCP), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  try {
    await cliente.connect(transporte);
    const { tools } = await cliente.listTools();
    const nombres = tools
      .filter((t) => t.annotations?.readOnlyHint === true || (t.annotations?.readOnlyHint !== false && !ESCRITURA.test(t.name)))
      .filter((t) => !t.annotations?.destructiveHint)
      .map((t) => t.name);
    const prohibidas = tools.map((t) => t.name).filter((n) => !nombres.includes(n));
    cache = { token, nombres, prohibidas };
    return cache;
  } finally {
    await cliente.close().catch(() => {});
  }
}
