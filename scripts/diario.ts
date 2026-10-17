// La búsqueda diaria de las 7:00: las novedades del nicho y los reels del nicho que mejor anduvieron.
// Deja todo en .data/diario/<cuenta>/. Lo dispara macOS (ver lib/diario/programar.ts) o el botón "Buscar ahora".
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pedido } from "../lib/agent/tasks";
import { runAgentLocal } from "../lib/agent/claudeLocal";
import { DIARIO, guardarCorrida, hoyLocal, leerCreador, type TipoCorrida } from "../lib/diario/archivos";

async function correr(pedido: Pedido) {
  let resultado: unknown = null;
  let error = "";
  const pasos: string[] = [];
  try {
    await runAgentLocal(pedido, [], (e) => {
      if (e.tipo === "resultado") resultado = e.data;
      else if (e.tipo === "error") error = e.mensaje;
      else if (e.tipo === "paso") pasos.push(e.texto);
    }, {});
  } catch (e) {
    error = (e as Error).message || "Algo falló.";
  }
  if (!resultado && !error) error = "El agente no devolvió nada.";
  return { resultado, error, pasos };
}

async function main() {
  const fecha = hoyLocal();
  const generado = () => new Date().toISOString();
  const creador = await leerCreador();
  if (!creador) {
    await guardarCorrida({ fecha, generado: generado(), usuario: "", resultado: null, error: "Todavía no completaste tus datos en Inicio.", pasos: [] });
    return;
  }
  const marca = path.join(DIARIO, "corriendo.json");
  await writeFile(marca, JSON.stringify({ pid: process.pid, desde: generado() }), { mode: 0o600 }).catch(() => {});
  const hoy = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  try {
    const tareas: [TipoCorrida, Pedido][] = [
      ["novedades", Pedido.parse({ tarea: "novedades", creador, respuestas: [], hoy })],
      ["ideas", Pedido.parse({ tarea: "ideas", creador, respuestas: [] })],
    ];
    for (const [tipo, pedido] of tareas) {
      const r = await correr(pedido);
      await guardarCorrida({ fecha, generado: generado(), usuario: creador.usuario, tipo, ...r });
      console.log(`[${generado()}] ${tipo} ${r.resultado ? "listas" : `con error: ${r.error}`}`);
    }
  } finally {
    await rm(marca, { force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
