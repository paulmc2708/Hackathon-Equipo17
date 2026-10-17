// El estilo de edición: cómo se ven y se mueven los subtítulos y los textos, los zooms, las transiciones y el color.
// Sale del video de referencia que le gusta a la persona o, si no pasó ninguno, de las opciones de la app.
// Lo medible de la referencia (cada cuánto cambia de plano) lo mide el código; lo que se ve (la letra, los colores,
// la animación) lo lee el agente Editor en los cuadros (skill copiar-estilo). Después se le pone la marca de la persona.
import path from "node:path";
import { runAgentLocal } from "../agent/claudeLocal";
import type { Imagen } from "../agent/run";
import { Pedido, type ResultadoEstilo } from "../agent/tasks";
import { leerCreador } from "../diario/archivos";
import { hojaDeCuadros, medir, medirPlanos } from "./ffmpeg";
import { archivoDe } from "./subida";

export type Estilo = ResultadoEstilo;
export type Subs = Estilo["subtitulos"];
export type Referencia = { estilo: Estilo; duracion: number; planos: number; ritmo: number };

const HEX = /^#[0-9a-f]{6}$/i;
const NEUTRO: Estilo["color"] = { contraste: 0, saturacion: 0, calidez: 0, blanco_y_negro: false, grano: false, vineta: false };

/** El estilo de la app cuando no hay video de referencia: el de siempre, con los subtítulos que eligió. */
export function estiloDeOpciones(o: { estilo: "limpios" | "resaltado" | "pastilla" | "ninguno"; color: string; animacion: "poca" | "media" | "mucha" }): Estilo {
  return {
    resumen: "",
    subtitulos: {
      hay: o.estilo !== "ninguno",
      posicion: "abajo",
      tamano: "mediano",
      mayusculas: false,
      palabras: 3,
      letra: "moderna",
      fondo: o.estilo === "pastilla" ? "pastilla" : "borde",
      animacion: o.animacion === "poca" ? "aparece" : "pop",
      resaltar: o.estilo === "resaltado",
      color_texto: "#FFFFFF",
      color_resaltado: o.color,
    },
    textos: { gancho: true, posicion: "arriba", cantidad: o.animacion === "poca" ? "pocos" : o.animacion === "mucha" ? "muchos" : "pocos" },
    zoom: "ninguno",
    transicion: "corte",
    color: NEUTRO,
    placa_final: true,
    que_copio: [],
    impronta: "",
  };
}

/**
 * Le pone la marca de la persona al estilo de la referencia y lo deja dentro de lo que el método permite:
 * su color reemplaza el de resaltado (salvo que pida los de la referencia) y, si habla a cámara,
 * nada de zooms a la cara ni filtros de color sobre la cara (preset de Paul).
 */
export function conMarca(e: Estilo, o: { color: string; coloresDe: "marca" | "referencia"; modo: "habla" | "productos"; subtitulos: boolean }): Estilo {
  const k = (x: number) => (Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0);
  const s = e.subtitulos;
  const marca = o.coloresDe === "marca" || !HEX.test(s.color_resaltado);
  return {
    ...e,
    subtitulos: {
      ...s,
      hay: s.hay && o.subtitulos,
      palabras: Math.max(1, Math.min(4, Math.round(s.palabras) || 3)),
      color_texto: HEX.test(s.color_texto) ? s.color_texto : "#FFFFFF",
      color_resaltado: marca ? o.color : s.color_resaltado,
    },
    // Lo que el método no deja copiar cuando habla a cámara tampoco se anuncia como copiado.
    que_copio: o.modo === "habla" ? e.que_copio.filter((q) => !/zoom|acerca|destello|flash|contraste|saturaci|calidez|cálid|blanco y negro|grano|viñeta|filtro/i.test(q)) : e.que_copio,
    zoom: o.modo === "habla" ? "ninguno" : e.zoom,
    transicion: o.modo === "habla" ? "corte" : e.transicion,
    color: o.modo === "habla" ? NEUTRO : { ...e.color, contraste: k(e.color.contraste), saturacion: k(e.color.saturacion), calidez: k(e.color.calidez) },
  };
}

/** Los filtros de ffmpeg para el color del estilo (suaves: como mucho un 25 % más de contraste). */
export function filtrosDeColor(c: Estilo["color"]) {
  const f: string[] = [];
  const contraste = 1 + 0.25 * c.contraste;
  const saturacion = c.blanco_y_negro ? 0 : 1 + 0.45 * c.saturacion;
  if (Math.abs(contraste - 1) > 0.01 || Math.abs(saturacion - 1) > 0.01) f.push(`eq=contrast=${contraste.toFixed(3)}:saturation=${saturacion.toFixed(3)}`);
  if (Math.abs(c.calidez) > 0.05 && !c.blanco_y_negro) {
    const w = c.calidez;
    f.push(`colorbalance=rs=${(0.07 * w).toFixed(3)}:bs=${(-0.07 * w).toFixed(3)}:rm=${(0.05 * w).toFixed(3)}:bm=${(-0.05 * w).toFixed(3)}`);
  }
  if (c.vineta) f.push("vignette=angle=PI/5");
  if (c.grano) f.push("noise=alls=6:allf=t+u");
  return f;
}

/**
 * Mira el video de referencia: el código mide cada cuánto cambia de plano y saca 16 cuadros
 * (los primeros 2 segundos en una grilla y el resto repartido en tres más); el agente Editor lee el estilo.
 */
export async function leerReferencia(archivo: string, dir: string, modo: "habla" | "productos", paso: (t: string) => Promise<void>): Promise<Referencia | null> {
  const m = await medir(archivo);
  if (!m.dur || !m.ancho) return null;
  await paso("Midiendo tu video de referencia: cada cuánto cambia de plano");
  const { cortes, planos, ritmo } = await medirPlanos(archivo, m.dur);
  const grillas: number[][] = [[0.15, 0.6, 1.1, 1.7].map((s) => Math.min(s, m.dur * 0.9))];
  const resto = Math.max(0, m.dur - 2);
  for (let g = 0; g < 3 && resto > 1; g++) grillas.push([0, 1, 2, 3].map((j) => 2 + (resto * (g * 4 + j + 0.5)) / 12));
  const imagenes: Imagen[] = [];
  for (const [i, segundos] of grillas.entries()) {
    const img = await hojaDeCuadros(archivo, m, segundos, path.join(dir, `referencia-${i + 1}.jpg`), 640, i === 0 ? "el video de referencia, el gancho" : "el video de referencia");
    if (img) imagenes.push(img);
  }
  if (!imagenes.length) return null;
  await paso(`Tu editor lee el estilo de la referencia: ${planos} plano${planos === 1 ? "" : "s"}, uno cada ${ritmo.toFixed(1).replace(".", ",")} s`);
  const creador = (await leerCreador()) ?? { usuario: "editor", aQueSeDedica: "", queVende: "", aQuien: "", historia: "", captions: [] };
  let estilo: Estilo | null = null;
  await runAgentLocal(
    Pedido.parse({ tarea: "estilo", creador, respuestas: [], modo, duracion: m.dur, planos, ritmo, cortes: cortes.slice(0, 80) }),
    imagenes,
    (e) => {
      if (e.tipo === "resultado") estilo = e.data as Estilo;
      if (e.tipo === "error") console.error("Estilo de la referencia:", e.mensaje);
    },
    {},
  );
  const leido = estilo as Estilo | null;
  return leido ? { estilo: leido, duracion: m.dur, planos, ritmo } : null;
}

/** El estilo de la referencia en una frase, para pasárselo al Editor cuando arma los textos o el montaje. */
export function estiloEnUnaFrase(r: Referencia | null) {
  if (!r) return "";
  const s = r.estilo.subtitulos;
  return `${r.estilo.resumen} Subtítulos: ${s.hay ? `${s.palabras} palabra(s), ${s.posicion}, ${s.tamano}${s.mayusculas ? ", en mayúsculas" : ""}` : "no tiene"}. Textos: ${r.estilo.textos.cantidad}${r.estilo.textos.gancho ? ", con título de gancho" : ""}. Cambia de plano cada ${r.ritmo.toFixed(1)} s.`;
}

/** Las opciones de la app que tocan el estilo. */
export type OpcionesEstilo = {
  modo: "habla" | "productos";
  estilo: "limpios" | "resaltado" | "pastilla" | "ninguno" | "referencia";
  color: string;
  animacion: "poca" | "media" | "mucha";
  coloresDe: "marca" | "referencia";
};

/**
 * El estilo con el que se edita: el de la referencia (con la marca de la persona) o el de la app.
 * Si con referencia eligió igual un estilo de subtítulos de la app, ese manda para los subtítulos.
 */
export function estiloFinal(o: OpcionesEstilo, ref: Referencia | null): Estilo {
  const base = estiloDeOpciones({ estilo: o.estilo === "referencia" ? "limpios" : o.estilo, color: o.color, animacion: o.animacion });
  if (!ref) return base;
  const e = conMarca(ref.estilo, { color: o.color, coloresDe: o.coloresDe, modo: o.modo, subtitulos: o.estilo !== "ninguno" });
  return o.estilo === "referencia" ? e : { ...e, subtitulos: base.subtitulos };
}

/** Dónde van los textos del editor: donde los pone la referencia, salvo que ahí vayan los subtítulos. */
export function lugarDeTextos(e: Estilo): "arriba" | "centro" {
  if (!e.subtitulos.hay || e.subtitulos.posicion !== e.textos.posicion) return e.textos.posicion;
  return e.subtitulos.posicion === "arriba" ? "centro" : "arriba";
}

/** Busca el video de referencia en la carpeta de la edición y lee su estilo. Si falla, sigue sin él y lo avisa. */
export async function referenciaDe(dir: string, modo: "habla" | "productos", paso: (t: string) => Promise<void>): Promise<{ ref: Referencia | null; aviso: string }> {
  const archivo = await archivoDe(dir, "referencia");
  if (!archivo) return { ref: null, aviso: "" };
  await paso("Mirando tu video de referencia");
  try {
    const ref = await leerReferencia(archivo, dir, modo, paso);
    if (ref) return { ref, aviso: "" };
  } catch (e) {
    console.error("Video de referencia:", (e as Error).message);
  }
  await paso("No pude leer el estilo de la referencia: sigo con tu estilo");
  return { ref: null, aviso: "No pude leer el estilo de tu video de referencia: usé tu estilo de siempre." };
}

/** Lo que se muestra en la app de la referencia: qué se copió y cómo se hizo propio. */
export const resumenDeReferencia = (r: Referencia | null, e?: Estilo) =>
  r ? { resumen: r.estilo.resumen, que_copio: (e ?? r.estilo).que_copio.slice(0, 6), impronta: r.estilo.impronta, planos: r.planos, ritmo: r.ritmo } : null;
