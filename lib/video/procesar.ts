// La entrada del editor: la persona suelta sus tomas y Hookia decide solo qué tipo de video es.
// Si alguien habla a cámara, va al modo "Hablo a cámara" (editar.ts); si no, al montaje de productos o lugares
// (montaje.ts). Para decidir escucha las pausas del audio: la voz hace pausas cortas seguido; la música o el
// ruido del ambiente, casi nunca. Lo puede pisar la persona eligiendo el tipo en "Más opciones".
import { carpetaVideo, editar, nuevoTrabajo, type OpcionesEdicion } from "./editar";
import { medir, silencios } from "./ffmpeg";
import { montar } from "./montaje";
import { tomasDe } from "./subida";

export type Modo = OpcionesEdicion["modo"] | "auto";

/** "habla" si en las tomas hay alguien hablando; "productos" si no. Mira como mucho el primer minuto y medio con sonido. */
export async function detectarModo(tomas: string[]): Promise<OpcionesEdicion["modo"]> {
  let pausas = 0, segundos = 0;
  for (const toma of tomas) {
    const m = await medir(toma);
    if (!m.audio || !m.dur) continue;
    // Pausas de entre 0,25 y 2,5 s: las de alguien que habla. Las más largas son silencio, no voz.
    pausas += (await silencios(toma, 0.25)).filter((p) => Number.isFinite(p.fin) && p.fin - p.inicio < 2.5).length;
    segundos += m.dur;
    if (segundos >= 90) break;
  }
  if (segundos < 1) return "productos";
  return pausas / (segundos / 60) >= 5 ? "habla" : "productos";
}

/** Arranca la edición: decide el tipo de video (si es automático) y lo edita. Corre en segundo plano. */
export async function procesar(id: string, o: Omit<OpcionesEdicion, "modo"> & { modo: Modo }) {
  const trabajo = nuevoTrabajo(id);
  let modo = o.modo;
  if (modo === "auto") {
    await trabajo.paso("Mirando tus tomas para saber qué tipo de video es");
    modo = await detectarModo(await tomasDe(carpetaVideo(id))).catch(() => "habla" as const);
    await trabajo.paso(modo === "habla" ? "Hablás a cámara: corto las pausas y pongo subtítulos" : "Son tomas de productos o lugares: armo el montaje");
  }
  return modo === "productos" ? montar(id, { ...o, modo }, trabajo) : editar(id, { ...o, modo }, trabajo);
}
