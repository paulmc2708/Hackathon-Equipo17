// Busca las novedades del nicho y las deja en .data/diario/AAAA-MM-DD.json.
// Lo dispara macOS todos los días a las 7:00 (ver lib/diario/programar.ts) o el botón "Buscar ahora".
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pedido } from "../lib/agent/tasks";
import { runAgentLocal } from "../lib/agent/claudeLocal";
import { DIARIO, guardarCorrida, hoyLocal, leerCreador } from "../lib/diario/archivos";

async function main() {
  const fecha = hoyLocal();
  const generado = () => new Date().toISOString();
  const creador = await leerCreador();
  if (!creador) {
    await guardarCorrida({ fecha, generado: generado(), resultado: null, error: "Todavía no completaste tus datos en Inicio.", pasos: [] });
    return;
  }
  const marca = path.join(DIARIO, "corriendo.json");
  await writeFile(marca, JSON.stringify({ pid: process.pid, desde: generado() }), { mode: 0o600 }).catch(() => {});
  const hoy = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  let resultado: unknown = null;
  let error = "";
  const pasos: string[] = [];
  try {
    await runAgentLocal(Pedido.parse({ tarea: "novedades", creador, respuestas: [], hoy }), [], (e) => {
      if (e.tipo === "resultado") resultado = e.data;
      else if (e.tipo === "error") error = e.mensaje;
      else if (e.tipo === "paso") pasos.push(e.texto);
    }, {});
  } catch (e) {
    error = (e as Error).message || "Algo falló.";
  }
  if (!resultado && !error) error = "El agente no devolvió novedades.";
  await guardarCorrida({ fecha, generado: generado(), resultado, error, pasos });
  await rm(marca, { force: true });
  console.log(`[${generado()}] novedades ${resultado ? "listas" : `con error: ${error}`}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
