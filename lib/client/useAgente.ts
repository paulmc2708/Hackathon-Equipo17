"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { CREADOR_VACIO, useGuardado, type Creador } from "./store";
import { preparar, type Adjunto } from "./media";
import {
  cancelarCorrida,
  claveCorrida,
  correr as correrCompartida,
  esCompartida,
  estadoDe,
  extraDe,
  guardarRespuesta,
  leerEventos,
  modoDemo,
  respuestasGuardadas,
  suscribir,
  ultimoPedido,
  type Preguntas,
  type Respuesta,
  type Tarea,
} from "./ejecutor";
import { claveCola, type Cola } from "./cola";

export type { Tarea } from "./ejecutor";

export type Agente<R> = {
  pasos: string[];
  preguntas: Preguntas | null;
  sugerencia: string;
  mensaje: string;
  resultado: R | null;
  error: string;
  corriendo: boolean;
  /** Quién largó la corrida que se ve: esta página o el análisis automático. */
  origen: "pagina" | "cola";
  correr: (creador: Creador, adjuntos?: Adjunto[], extra?: Record<string, unknown>, nuevas?: boolean) => Promise<void>;
  responder: (texto: string, nuevos?: Adjunto[]) => Promise<void> | undefined;
  cancelar: () => void;
};

const mensajeDe = (preguntas: Preguntas | null, sugerencia: string) => (preguntas ? [preguntas.preguntas.join(" "), preguntas.por_que].filter(Boolean).join("\n\n") : sugerencia);

/**
 * Corre el agente y expone su progreso en vivo: pasos, preguntas, resultado y error.
 * Las tareas de análisis de la cuenta (perfil, métricas, reels…) corren fuera de la página (lib/client/ejecutor.ts):
 * siguen si cambiás de sección, no se repiten si ya están corriendo y se guardan solas donde las lee su página.
 */
export function useAgente<R>(tarea: Tarea, onResultado?: (r: R) => void): Agente<R> {
  const compartida = esCompartida(tarea);
  const local = useAgenteLocal<R>(tarea, compartida ? undefined : onResultado);
  const global = useAgenteCompartido<R>(compartida ? tarea : null, onResultado);
  return compartida ? global : local;
}

/** La corrida compartida de esta tarea para la cuenta cargada (la puede haber largado otra página o la fila). */
function useAgenteCompartido<R>(tarea: Tarea | null, onResultado?: (r: R) => void): Agente<R> {
  const [creador] = useGuardado<Creador>("creador", CREADOR_VACIO);
  const clave = claveCorrida(creador.usuario, tarea ?? "-");
  const estado = useSyncExternalStore(suscribir, () => estadoDe(clave), () => estadoDe(clave));
  // Si esta sesión no corrió la tarea, se muestra lo que dejó la fila del análisis automático (una pregunta, un error).
  const [cola] = useGuardado<Cola | null>(claveCola(creador.usuario), null);
  const deLaCola = !estado.corriendo && !estado.resultado && !estado.preguntas && !estado.error ? cola?.pasos.find((p) => p.tarea === tarea) : undefined;
  const preguntas = estado.preguntas ?? (deLaCola?.estado === "preguntas" && deLaCola.preguntas?.length ? { preguntas: deLaCola.preguntas, por_que: deLaCola.por_que ?? "" } : null);
  const error = estado.error || (deLaCola?.estado === "error" ? deLaCola.error ?? "" : "");

  async function correr(c: Creador, adjuntos: Adjunto[] = [], extra?: Record<string, unknown>, nuevas = false) {
    if (!tarea || !esCompartida(tarea)) return;
    const previas = nuevas ? ultimoPedido(claveCorrida(c.usuario, tarea))?.respuestas ?? [] : [];
    const fin = await correrCompartida({ tarea, creador: c, adjuntos, extra, respuestas: previas, origen: "pagina" });
    if (fin.resultado) onResultado?.(fin.resultado as R);
  }

  function responder(texto: string, nuevos: Adjunto[] = []) {
    const pedido = preguntas ? preguntas.preguntas.join(" ") : estado.sugerencia;
    if (!pedido || !tarea || !esCompartida(tarea)) return;
    // Lo último que se pidió (en esta sesión); si la pregunta quedó de la fila, se arma de nuevo con la cuenta cargada.
    const u = ultimoPedido(clave) ?? { creador, adjuntos: [], extra: extraDe(tarea), respuestas: [] as Respuesta[] };
    const r = { pregunta: pedido, respuesta: texto || (nuevos.length ? "(me mandó archivos)" : "") };
    guardarRespuesta(u.creador.usuario, r);
    // Lo nuevo va primero: si hay más de 16 imágenes, se cortan las viejas y no lo que acaba de mandar.
    return correrCompartida({ tarea, creador: u.creador, adjuntos: [...nuevos, ...u.adjuntos], extra: u.extra, respuestas: [...u.respuestas, r], origen: "pagina" }).then((fin) => {
      if (fin.resultado) onResultado?.(fin.resultado as R);
    });
  }

  return {
    pasos: estado.pasos,
    preguntas,
    sugerencia: estado.sugerencia,
    mensaje: mensajeDe(preguntas, estado.sugerencia),
    resultado: (estado.resultado as R | null) ?? null,
    error,
    corriendo: estado.corriendo,
    origen: estado.origen,
    correr,
    responder,
    cancelar: () => cancelarCorrida(clave),
  };
}

/** Tareas de una sola pantalla (guion, carrusel, chat, competencia, un reel): viven mientras la página está abierta. */
function useAgenteLocal<R>(tarea: Tarea, onResultado?: (r: R) => void): Agente<R> {
  const [pasos, setPasos] = useState<string[]>([]);
  const [preguntas, setPreguntas] = useState<Preguntas | null>(null);
  const [sugerencia, setSugerencia] = useState("");
  const [resultado, setResultado] = useState<R | null>(null);
  const [error, setError] = useState("");
  const [corriendo, setCorriendo] = useState(false);
  const respuestas = useRef<Respuesta[]>([]);
  const ultimo = useRef<{ creador: Creador; adjuntos: Adjunto[]; extra?: Record<string, unknown> } | null>(null);
  const abort = useRef<AbortController | null>(null);

  async function correr(creador: Creador, adjuntos: Adjunto[] = [], extra?: Record<string, unknown>, nuevas = false) {
    if (!nuevas) respuestas.current = [];
    ultimo.current = { creador, adjuntos, extra };
    setPasos([]);
    setPreguntas(null);
    setSugerencia("");
    setResultado(null);
    setError("");
    setCorriendo(true);
    abort.current = new AbortController();
    try {
      if (adjuntos.length) setPasos(["Preparando lo que subiste"]);
      const imagenes = await preparar(adjuntos);
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido: { tarea, creador, respuestas: [...respuestasGuardadas(creador.usuario), ...respuestas.current].slice(-10), ...extra },
          imagenes,
          demo: modoDemo(),
        }),
        signal: abort.current.signal,
      });
      await leerEventos(res, (ev) => {
        if (ev.tipo === "paso") setPasos((p) => (p.at(-1) === ev.texto ? p : [...p, ev.texto]));
        else if (ev.tipo === "preguntas") setPreguntas(ev);
        else if (ev.tipo === "sugerencia") setSugerencia(ev.texto);
        else if (ev.tipo === "resultado") {
          setResultado(ev.data as R);
          onResultado?.(ev.data as R);
        } else if (ev.tipo === "error") setError(ev.mensaje);
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message || "Algo falló. Probá de nuevo.");
    } finally {
      setCorriendo(false);
    }
  }

  /** Contesta lo que pidió el agente (antes o después del resultado), con texto y/o archivos, y vuelve a correr. */
  function responder(texto: string, nuevos: Adjunto[] = []) {
    const pedido = preguntas ? preguntas.preguntas.join(" ") : sugerencia;
    if (!pedido || !ultimo.current) return;
    const r = { pregunta: pedido, respuesta: texto || (nuevos.length ? "(me mandó archivos)" : "") };
    respuestas.current = [...respuestas.current, r];
    const u = ultimo.current;
    guardarRespuesta(u.creador.usuario, r);
    // Lo nuevo va primero: si hay más de 16 imágenes, se cortan las viejas y no lo que acaba de mandar.
    return correr(u.creador, [...nuevos, ...u.adjuntos], u.extra, true);
  }

  return {
    pasos,
    preguntas,
    sugerencia,
    mensaje: mensajeDe(preguntas, sugerencia),
    resultado,
    error,
    corriendo,
    origen: "pagina",
    correr,
    responder,
    cancelar: () => abort.current?.abort(),
  };
}
