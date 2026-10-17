"use client";

// Las tareas de análisis de la cuenta (perfil, métricas, reels, estrategia, ideas, novedades y el nombre y la foto)
// corren acá, fuera de las páginas: siguen aunque cambies de sección, la misma tarea de la misma cuenta nunca corre
// dos veces a la vez (si ya está corriendo, te sumás a esa) y el resultado se guarda siempre donde lo lee su página.
// Lo usan las páginas (useAgente) y el análisis automático (lib/client/cola.ts).
import { SIN_USUARIO } from "@/lib/agent/tasks";
import { preparar, type Adjunto } from "./media";
import { guardarResultado } from "./resultados";
import { claveUsuario, type Creador } from "./store";

export type Tarea = "perfil" | "ideas" | "guion" | "competencia" | "carrusel" | "metricas" | "cuenta" | "novedades" | "reels" | "reel" | "chat" | "estrategia";
export type Respuesta = { pregunta: string; respuesta: string };
export type Preguntas = { preguntas: string[]; por_que: string };
export type Evento =
  | { tipo: "paso"; texto: string }
  | { tipo: "texto"; delta: string }
  | { tipo: "resultado"; tarea: Tarea; data: unknown }
  | ({ tipo: "preguntas" } & Preguntas)
  | { tipo: "sugerencia"; texto: string }
  | { tipo: "error"; mensaje: string }
  | { tipo: "uso"; entrada: number; salida: number; cache_leida: number };

export const COMPARTIDAS = ["cuenta", "perfil", "metricas", "reels", "estrategia", "ideas", "novedades"] as const;
export type TareaCompartida = (typeof COMPARTIDAS)[number];
export const esCompartida = (t: string): t is TareaCompartida => (COMPARTIDAS as readonly string[]).includes(t);

export const modoDemo = () => {
  try {
    return localStorage.getItem("modo-demo") === "1";
  } catch {
    return false;
  }
};

// Lo que la persona le contestó al agente (por ejemplo, sus captions) se guarda por cuenta y viaja en cada pedido:
// así no le vuelve a preguntar lo mismo. Solo respuestas con texto, las últimas 8.
const claveRespuestas = (usuario: string) => `respuestas-${claveUsuario(usuario)}`;
export function respuestasGuardadas(usuario: string): Respuesta[] {
  try {
    const v = JSON.parse(localStorage.getItem(claveRespuestas(usuario)) ?? "[]");
    return Array.isArray(v) ? v.filter((r) => typeof r?.pregunta === "string" && typeof r?.respuesta === "string") : [];
  } catch {
    return [];
  }
}
export function guardarRespuesta(usuario: string, r: Respuesta) {
  if (!usuario || !r.respuesta.trim() || r.respuesta.startsWith("(")) return;
  try {
    const lista = [...respuestasGuardadas(usuario).filter((x) => x.pregunta !== r.pregunta), r].slice(-8);
    localStorage.setItem(claveRespuestas(usuario), JSON.stringify(lista));
  } catch {}
}

/** Lo que cada tarea necesita además de la persona (las novedades, la fecha de hoy). */
export const extraDe = (tarea: Tarea): Record<string, unknown> | undefined =>
  tarea === "novedades" ? { hoy: new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) } : undefined;

/** Lee el stream NDJSON de /api/agent y avisa cada evento. */
export async function leerEventos(res: Response, alEvento: (e: Evento) => void | Promise<void>) {
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Algo falló (${res.status}).`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lineas = buf.split("\n");
    buf = lineas.pop() ?? "";
    for (const l of lineas) if (l.trim()) await alEvento(JSON.parse(l) as Evento);
  }
}

export type EstadoCorrida = {
  pasos: string[];
  preguntas: Preguntas | null;
  sugerencia: string;
  resultado: unknown;
  error: string;
  corriendo: boolean;
  /** Quién la largó: una página o el análisis automático. */
  origen: "pagina" | "cola";
};
export type Fin = { resultado: unknown; preguntas: Preguntas | null; error: string; cancelada: boolean };
export type Aviso = { usuario: string; tarea: TareaCompartida; fin?: Fin };

const VACIO: EstadoCorrida = { pasos: [], preguntas: null, sugerencia: "", resultado: null, error: "", corriendo: false, origen: "pagina" };
const estados = new Map<string, EstadoCorrida>();
const enCurso = new Map<string, Promise<Fin>>();
const cortes = new Map<string, AbortController>();
const ultimos = new Map<string, { creador: Creador; adjuntos: Adjunto[]; extra?: Record<string, unknown>; respuestas: Respuesta[] }>();
const oyentes = new Set<() => void>();
const alEmpezar = new Set<(a: Aviso) => void>();
const alTerminar = new Set<(a: Aviso) => void>();

// Si la persona recarga o cierra la pestaña, el pedido se corta: eso no es un error de la tarea (se vuelve a hacer).
let saliendo = false;
if (typeof window !== "undefined") {
  const salir = () => (saliendo = true);
  window.addEventListener("beforeunload", salir);
  window.addEventListener("pagehide", salir);
  window.addEventListener("pageshow", () => (saliendo = false));
}

/** Una corrida por cuenta y tarea ("nutri.ana:perfil"). Sin usuario todavía (la cuenta de Windsor), "_". */
export const claveCorrida = (usuario: string, tarea: string) => {
  const u = claveUsuario(usuario);
  return `${u && u !== SIN_USUARIO ? u : "_"}:${tarea}`;
};

const cambiar = (clave: string, parcial: Partial<EstadoCorrida>) => {
  estados.set(clave, { ...(estados.get(clave) ?? VACIO), ...parcial });
  oyentes.forEach((f) => f());
};
export const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => void oyentes.delete(f);
};
export const estadoDe = (clave: string) => estados.get(clave) ?? VACIO;
export const corridaEnCurso = (clave: string) => enCurso.get(clave) ?? null;
export const ultimoPedido = (clave: string) => ultimos.get(clave) ?? null;
export const cuandoEmpieza = (f: (a: Aviso) => void) => {
  alEmpezar.add(f);
  return () => void alEmpezar.delete(f);
};
export const cuandoTermina = (f: (a: Aviso) => void) => {
  alTerminar.add(f);
  return () => void alTerminar.delete(f);
};
export const cancelarCorrida = (clave: string) => cortes.get(clave)?.abort();

/** Corre una tarea compartida. Si esa misma tarea de esa cuenta ya está corriendo, devuelve esa corrida. */
export function correr(o: { tarea: TareaCompartida; creador: Creador; adjuntos?: Adjunto[]; extra?: Record<string, unknown>; respuestas?: Respuesta[]; origen?: "pagina" | "cola" }): Promise<Fin> {
  const clave = claveCorrida(o.creador.usuario, o.tarea);
  const ya = enCurso.get(clave);
  if (ya) return ya;
  const p = correrAhora(clave, o);
  enCurso.set(clave, p);
  return p;
}

async function correrAhora(
  clave: string,
  o: { tarea: TareaCompartida; creador: Creador; adjuntos?: Adjunto[]; extra?: Record<string, unknown>; respuestas?: Respuesta[]; origen?: "pagina" | "cola" },
): Promise<Fin> {
  // Primero se suelta el hilo: así correr() ya la anotó en enCurso antes de avisarle a nadie que arrancó.
  await Promise.resolve();
  const adjuntos = o.adjuntos ?? [];
  const respuestas = o.respuestas ?? [];
  ultimos.set(clave, { creador: o.creador, adjuntos, extra: o.extra, respuestas });
  const control = new AbortController();
  cortes.set(clave, control);
  estados.set(clave, { ...VACIO, corriendo: true, origen: o.origen ?? "pagina", pasos: adjuntos.length ? ["Preparando lo que subiste"] : [] });
  oyentes.forEach((f) => f());
  alEmpezar.forEach((f) => f({ usuario: o.creador.usuario, tarea: o.tarea }));
  const fin: Fin = { resultado: null, preguntas: null, error: "", cancelada: false };
  try {
    const imagenes = await preparar(adjuntos);
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedido: { tarea: o.tarea, creador: o.creador, respuestas: [...respuestasGuardadas(o.creador.usuario), ...respuestas].slice(-10), ...o.extra },
        imagenes,
        demo: modoDemo(),
      }),
      signal: control.signal,
    });
    await leerEventos(res, async (ev) => {
      if (ev.tipo === "paso") {
        const pasos = estadoDe(clave).pasos;
        if (pasos.at(-1) !== ev.texto) cambiar(clave, { pasos: [...pasos, ev.texto] });
      } else if (ev.tipo === "preguntas") {
        fin.preguntas = { preguntas: ev.preguntas, por_que: ev.por_que };
        cambiar(clave, { preguntas: fin.preguntas });
      } else if (ev.tipo === "sugerencia") cambiar(clave, { sugerencia: ev.texto });
      else if (ev.tipo === "resultado") {
        await guardarResultado(o.tarea, o.creador, ev.data);
        fin.resultado = ev.data;
        cambiar(clave, { resultado: ev.data });
      } else if (ev.tipo === "error") {
        fin.error = ev.mensaje;
        cambiar(clave, { error: ev.mensaje });
      }
    });
  } catch (e) {
    if ((e as Error).name === "AbortError" || saliendo) fin.cancelada = true;
    else {
      fin.error = (e as Error).message || "Algo falló. Probá de nuevo.";
      cambiar(clave, { error: fin.error });
    }
  } finally {
    cortes.delete(clave);
    enCurso.delete(clave);
    cambiar(clave, { corriendo: false });
    alTerminar.forEach((f) => f({ usuario: o.creador.usuario, tarea: o.tarea, fin }));
  }
  return fin;
}
