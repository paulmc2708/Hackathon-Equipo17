"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, Anillo, Boton, Copiar, Pagina, Pasos, Charla, Subir, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoPerfil } from "@/lib/agent/tasks";
import type { Adjunto } from "@/lib/client/media";

export default function Perfil() {
  const [creador, , listo] = useCreador();
  const [guardado, guardar] = useUltimo<ResultadoPerfil>("perfil");
  const [archivos, setArchivos] = useState<Adjunto[]>([]);
  const ag = useAgente<ResultadoPerfil>("perfil", guardar);
  const r = ag.resultado ?? (ag.corriendo ? null : guardado);
  const [verTodo, setVerTodo] = useState(false);
  const [verCambios, setVerCambios] = useState(false);
  const [criterio, setCriterio] = useState<number | null>(null);
  const cambios = r ? [...r.cambios].sort((a, b) => a.prioridad - b.prioridad) : [];
  const criterios = r ? [...r.criterios].sort((a, b) => a.puntos / (a.maximo || 1) - b.puntos / (b.maximo || 1)) : [];

  if (!listo) return null;
  if (!creador.usuario)
    return (
      <Pagina titulo="Mi perfil">
        <Vacio titulo="Primero contame quién sos" texto="Con tu usuario y lo que vendés, el análisis es para vos y no genérico.">
          <Link href="/"><Boton>Completar mis datos</Boton></Link>
        </Vacio>
      </Pagina>
    );

  return (
    <Pagina
      titulo="Mi perfil"
      bajada={`Cómo se ve @${creador.usuario} para alguien que llega desde un reel.`}
      accion={<Boton cargando={ag.corriendo} onClick={() => ag.correr(creador, archivos)}>{r ? "Volver a analizar" : "Analizar mi perfil"}</Boton>}
    >
      <div className="space-y-6">
        {!ag.corriendo && (
          <Subir
            titulo="Capturas de tu perfil (recomendado)"
            ayuda="La parte de arriba, la grilla y las estadísticas de 2 o 3 reels. Con eso el análisis usa tus números reales."
            adjuntos={archivos}
            onChange={setArchivos}
            etiqueta={(f) => `captura de SU perfil o estadísticas (${f.name})`}
          />
        )}
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no analizaste tu perfil" texto="Te doy una nota sobre 100, qué te está haciendo perder seguidores y los textos nuevos listos para copiar." />
        )}
        {r && (
          <>
            <Tarjeta className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
              <Anillo nota={r.nota_total} />
              <div className="min-w-0 space-y-2 text-center sm:text-left">
                <p className="text-[13px] font-medium text-sec">{r.nota_total >= 75 ? "Tu perfil está muy bien" : r.nota_total >= 50 ? "Tu perfil está bien, pero pierde gente" : "Tu perfil está perdiendo seguidores"}</p>
                <p className={`text-[16px] leading-relaxed ${verTodo ? "" : "line-clamp-3"}`}>{r.resumen}</p>
                {r.resumen.length > 220 && (
                  <button onClick={() => setVerTodo((v) => !v)} className="text-[13px] text-text-2 hover:text-text">
                    {verTodo ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>
            </Tarjeta>

            <div className="space-y-3">
              <p className="pt-2 text-[17px] font-medium">Lo primero que cambiaría</p>
              {cambios.slice(0, verCambios ? undefined : 3).map((c, i) => (
                <Tarjeta key={i} i={i} className="space-y-3">
                  <div className="flex items-start gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sec text-[13px] font-semibold text-[var(--sec-texto,#fff)]">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium">{c.que}</p>
                      <p className="mt-1 line-clamp-2 text-[13px] text-text-2">{c.por_que}</p>
                    </div>
                    {c.texto_sugerido && <Copiar texto={c.texto_sugerido} />}
                  </div>
                  {c.texto_sugerido && <p className="ml-11 rounded-[14px] border border-sec/25 bg-sec/10 px-4 py-3 text-[14px] whitespace-pre-line">{c.texto_sugerido}</p>}
                </Tarjeta>
              ))}
              {cambios.length > 3 && (
                <button onClick={() => setVerCambios((v) => !v)} className="text-[13px] text-text-2 hover:text-text">
                  {verCambios ? "Ver menos" : `Ver los otros ${cambios.length - 3} cambios`}
                </button>
              )}
            </div>

            <Tarjeta i={1}>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <p className="text-[17px] font-medium">Punto por punto</p>
                <span className="text-[12px] text-text-3">Tocá uno para ver por qué</span>
              </div>
              <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {criterios.map((c, i) => {
                  const pct = c.maximo ? c.puntos / c.maximo : 0;
                  const color = pct >= 0.75 ? "bg-good" : pct >= 0.45 ? "bg-warn" : "bg-bad";
                  const abierto = criterio === i;
                  return (
                    <button key={i} onClick={() => setCriterio(abierto ? null : i)} className="rounded-[12px] px-2 py-2.5 text-left transition-colors hover:bg-raised">
                      <span className="flex items-center justify-between gap-3 text-[14px]">
                        <span className="truncate">{c.criterio.replace(/\s*\(.*\)$/, "")}</span>
                        <span className="shrink-0 text-[12px] text-text-2">{c.puntos}/{c.maximo}</span>
                      </span>
                      <span className="mt-1.5 block h-1.5 rounded-full bg-raised">
                        <span className={`crecer block h-full rounded-full ${color}`} style={{ width: `${Math.max(4, pct * 100)}%`, animationDelay: `${i * 50}ms` }} />
                      </span>
                      {abierto && <span className="mt-2 block text-[13px] text-text-2">{c.observacion}</span>}
                    </button>
                  );
                })}
              </div>
            </Tarjeta>

            <div className="grid gap-3 sm:grid-cols-2">
              <Tarjeta className="space-y-3">
                <div className="flex items-center justify-between"><p className="text-[15px] font-medium">Bio nueva</p><Copiar texto={r.bio_sugerida} /></div>
                <p className="text-[14px] whitespace-pre-line text-text-2">{r.bio_sugerida}</p>
              </Tarjeta>
              <Tarjeta i={1} className="space-y-3">
                <p className="text-[15px] font-medium">Nombre (lo que lee el buscador)</p>
                {r.nombre_sugerido.map((n, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-[14px] text-text-2">{n}<Copiar texto={n} /></div>
                ))}
              </Tarjeta>
            </div>

            <details className="rounded-[20px] border border-line px-6 py-4 text-[13px] text-text-2">
              <summary className="cursor-pointer list-none font-medium text-text">Qué datos usé</summary>
              <p className="mt-3">{r.datos_usados}</p>
              <p className="mt-2 text-text-3">{r.limitaciones}</p>
            </details>
          </>
        )}
      </div>
    </Pagina>
  );
}
