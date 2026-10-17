"use client";

import { useRef, useState } from "react";
import type { Creador } from "./store";
import { preparar, type Adjunto } from "./media";

export type Tarea = "perfil" | "ideas" | "guion" | "competencia" | "carrusel" | "metricas" | "cuenta" | "novedades";
type Respuesta = { pregunta: string; respuesta: string };
type Evento =
  | { tipo: "paso"; texto: string }
  | { tipo: "texto"; delta: string }
  | { tipo: "resultado"; tarea: Tarea; data: unknown }
  | { tipo: "preguntas"; preguntas: string[]; por_que: string }
  | { tipo: "sugerencia"; texto: string }
  | { tipo: "error"; mensaje: string }
  | { tipo: "uso"; entrada: number; salida: number; cache_leida: number };

/** Corre el agente y expone su progreso en vivo: pasos, preguntas, resultado y error. */
export function useAgente<R>(tarea: Tarea, onResultado?: (r: R) => void) {
  const [pasos, setPasos] = useState<string[]>([]);
  const [preguntas, setPreguntas] = useState<{ preguntas: string[]; por_que: string } | null>(null);
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
        body: JSON.stringify({ pedido: { tarea, creador, respuestas: respuestas.current, ...extra }, imagenes }),
        signal: abort.current.signal,
      });
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
        for (const l of lineas) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l) as Evento;
          if (ev.tipo === "paso") setPasos((p) => (p.at(-1) === ev.texto ? p : [...p, ev.texto]));
          else if (ev.tipo === "preguntas") setPreguntas(ev);
          else if (ev.tipo === "sugerencia") setSugerencia(ev.texto);
          else if (ev.tipo === "resultado") {
            setResultado(ev.data as R);
            onResultado?.(ev.data as R);
          } else if (ev.tipo === "error") setError(ev.mensaje);
        }
      }
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
    respuestas.current = [...respuestas.current, { pregunta: pedido, respuesta: texto || (nuevos.length ? "(me mandó archivos)" : "") }];
    const u = ultimo.current;
    return correr(u.creador, [...u.adjuntos, ...nuevos], u.extra, true);
  }

  /** Lo que el agente le está pidiendo ahora a la persona, si hay algo. */
  const mensaje = preguntas ? [preguntas.preguntas.join(" "), preguntas.por_que].filter(Boolean).join("\n\n") : sugerencia;

  const cancelar = () => abort.current?.abort();

  return { pasos, preguntas, sugerencia, mensaje, resultado, error, corriendo, correr, responder, cancelar };
}
