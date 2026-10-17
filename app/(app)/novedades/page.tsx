"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarClock } from "lucide-react";
import { Aviso, Boton, Charla, Pagina, Pasos, Tarjeta, Vacio } from "@/components/ui";
import { claveUsuario, useCreador } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoNovedades } from "@/lib/agent/tasks";

const ETAPA = { atraer: "Atraer", confianza: "Confianza", vender: "Vender" } as const;
const FORMATO = { reel: "Reel", carrusel: "Carrusel", historia: "Historia" } as const;

type Estado = {
  soportado: boolean;
  activo: boolean;
  corriendo: boolean;
  cuentaDelAviso: string;
  ultima: { fecha: string; generado: string; usuario: string; resultado: ResultadoNovedades | null; error: string } | null;
};

const cuando = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hoy = new Date().toDateString() === d.toDateString();
  return `${hoy ? "hoy" : d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })} a las ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
};

const hoyLargo = () => new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function Novedades() {
  const [creador, , listo] = useCreador();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [errorAviso, setErrorAviso] = useState("");

  const usuario = claveUsuario(creador.usuario);
  const refrescar = useCallback(async () => {
    if (!usuario) return;
    const j = await fetch(`/api/diario?usuario=${encodeURIComponent(usuario)}`, { cache: "no-store", signal: AbortSignal.timeout(15000) })
      .then((r) => r.json())
      .catch(() => null);
    if (j) setEstado(j);
  }, [usuario]);
  useEffect(() => {
    queueMicrotask(refrescar);
  }, [refrescar]);

  const ag = useAgente<ResultadoNovedades>("novedades", async (res) => {
    await fetch("/api/diario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "guardar", resultado: res, usuario: creador.usuario }) }).catch(() => {});
    refrescar();
  });

  // Solo lo guardado de ESTA cuenta (si recién cambiaste de @, no se muestra un momento lo de la anterior).
  const ultima = estado?.ultima && claveUsuario(estado.ultima.usuario ?? "") === usuario ? estado.ultima : null;
  const r = ag.resultado ?? (ag.corriendo ? null : ultima?.resultado ?? null);

  const alternarAviso = async () => {
    if (!estado) return;
    setCambiando(true);
    setErrorAviso("");
    const j = await fetch("/api/diario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: estado.activo ? "desactivar" : "activar" }) })
      .then((x) => x.json())
      .catch(() => null);
    if (!j?.ok) setErrorAviso(j?.error ?? "No pude cambiarlo. Probá de nuevo.");
    await refrescar();
    setCambiando(false);
  };

  if (!listo) return null;
  if (!creador.usuario)
    return (
      <Pagina titulo="Novedades de tu nicho">
        <Vacio titulo="Primero contame quién sos" texto="Necesito saber de qué es tu cuenta para buscarte lo que pasa en tu nicho.">
          <Link href="/"><Boton>Completar mis datos</Boton></Link>
        </Vacio>
      </Pagina>
    );

  return (
    <Pagina
      titulo="Novedades de tu nicho"
      bajada="Lo que pasó hoy y esta semana en tu nicho, y qué podés publicar con eso."
      accion={
        <Boton cargando={ag.corriendo} onClick={() => ag.correr(creador, [], { hoy: hoyLargo() })}>
          {r ? "Buscar de nuevo" : "Buscar ahora"}
        </Boton>
      }
    >
      <div className="space-y-6">
        {estado && (
          <Tarjeta className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-sec/15 text-sec">
                <CalendarClock size={18} strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[15px] font-medium">Todos los días a las 7:00</p>
                <p className="mt-0.5 text-[13px] text-text-2">
                  {!estado.soportado
                    ? "El aviso automático por ahora funciona en Mac. Mientras, usá Buscar ahora."
                    : estado.activo
                      ? "Activado. Te dejo las novedades listas antes de que arranques el día."
                      : "Te busco las novedades solo, sin que abras nada. Si la Mac está dormida, lo hago cuando se despierta."}
                </p>
                {estado.activo && estado.cuentaDelAviso && claveUsuario(estado.cuentaDelAviso) !== usuario && (
                  <p className="mt-1 text-[12px] text-text-3">El aviso corre para @{estado.cuentaDelAviso}, tu cuenta.</p>
                )}
                {estado.corriendo && <p className="mt-1 text-[12px] text-sec">Buscando las novedades de hoy en segundo plano…</p>}
                {errorAviso && <p className="mt-1 text-[12px] text-bad">{errorAviso}</p>}
              </div>
            </div>
            {estado.soportado && (
              <button
                onClick={alternarAviso}
                disabled={cambiando}
                role="switch"
                aria-checked={estado.activo}
                aria-label="Aviso diario a las 7:00"
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${estado.activo ? "bg-sec" : "bg-line-strong"}`}
              >
                <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform duration-200 ${estado.activo ? "translate-x-5" : ""}`} />
              </button>
            )}
          </Tarjeta>
        )}

        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!ag.corriendo && !r && ultima?.error && <Aviso>La última búsqueda automática no salió: {ultima.error}</Aviso>}

        {!r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no hay novedades" texto="Te busco lo que pasó esta semana en tu nicho (noticias, temas del momento, lo que está pegando) y te dejo ideas para publicar hoy." />
        )}

        {r && (
          <>
            {ultima?.generado && !ag.resultado && <p className="text-[13px] text-text-3">Actualizado {cuando(ultima.generado)}</p>}
            <Tarjeta className="space-y-2">
              <p className="text-[13px] font-medium text-sec">Esta semana en tu nicho</p>
              <p className="text-[16px] leading-relaxed">{r.resumen}</p>
            </Tarjeta>

            {r.ideas.length > 0 && (
              <div className="space-y-3">
                <p className="pt-2 text-[17px] font-medium">Ideas para publicar hoy</p>
                <div className="grid gap-3 lg:grid-cols-2">
                  {r.ideas.map((idea, i) => (
                    <Tarjeta key={i} i={i} className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{ETAPA[idea.etapa]}</span>
                        <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{FORMATO[idea.formato]}</span>
                      </div>
                      <p className="text-[16px] leading-snug font-medium">{idea.titulo}</p>
                      <p className="rounded-[14px] border border-sec/25 bg-sec/10 px-4 py-3 text-[14px]">“{idea.hook}”</p>
                      <p className="line-clamp-2 text-[13px] text-text-2">{idea.por_que_hoy}</p>
                      <Link
                        href={`/guiones?${idea.formato === "carrusel" ? "formato=carrusel&" : ""}idea=${encodeURIComponent(`${idea.titulo}. Hook: ${idea.hook}. Por qué ahora: ${idea.por_que_hoy}`)}`}
                        className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-sec hover:opacity-80"
                      >
                        {idea.formato === "carrusel" ? "Armar el carrusel" : "Escribir el guion"} <ArrowRight size={14} />
                      </Link>
                    </Tarjeta>
                  ))}
                </div>
              </div>
            )}

            {r.novedades.length > 0 && (
              <Tarjeta className="space-y-1">
                <p className="mb-2 text-[17px] font-medium">Lo que pasó</p>
                <ul className="divide-y divide-line">
                  {r.novedades.map((n, i) => (
                    <li key={i} className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-[15px] font-medium">{n.titulo}</p>
                        <span className="shrink-0 text-[12px] text-text-3">{n.fecha}</span>
                      </div>
                      <p className="mt-1 text-[14px] text-text-2">{n.que_pasa}</p>
                      <p className="mt-1 text-[13px]"><span className="text-sec">Por qué te importa: </span>{n.por_que_te_importa}</p>
                      {/^https?:\/\//.test(n.fuente) && (
                        <a href={n.fuente} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-text-3 hover:text-text">
                          Ver la fuente <ArrowUpRight size={12} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            )}

            {r.tendencias.length > 0 && (
              <Tarjeta className="space-y-3">
                <p className="text-[17px] font-medium">Lo que está pegando</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {r.tendencias.map((t, i) => (
                    <div key={i} className="rounded-[14px] bg-raised/60 px-4 py-3">
                      <p className="text-[14px] font-medium">{t.que}</p>
                      <p className="mt-0.5 text-[13px] text-text-2">{t.por_que_funciona}</p>
                      {/^https?:\/\//.test(t.ejemplo) && (
                        <a href={t.ejemplo} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-text-3 hover:text-text">
                          Ver un ejemplo <ArrowUpRight size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Tarjeta>
            )}

            {r.limitaciones && <p className="text-[12px] text-text-3">{r.limitaciones}</p>}
          </>
        )}
      </div>
    </Pagina>
  );
}
