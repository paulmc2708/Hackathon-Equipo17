"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, Anillo, Boton, Copiar, Pagina, Pasos, Preguntas, Subir, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoPerfil } from "@/lib/agent/tasks";

export default function Perfil() {
  const [creador, , listo] = useCreador();
  const [guardado, guardar] = useUltimo<ResultadoPerfil>("perfil");
  const [archivos, setArchivos] = useState<File[]>([]);
  const ag = useAgente<ResultadoPerfil>("perfil", guardar);
  const r = ag.resultado ?? (ag.corriendo ? null : guardado);

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
        {!r && !ag.corriendo && <Subir archivos={archivos} onChange={setArchivos} />}
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.preguntas && <Preguntas preguntas={ag.preguntas.preguntas} porQue={ag.preguntas.por_que} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no analizaste tu perfil" texto="Te doy una nota sobre 100, qué te está haciendo perder seguidores y los textos nuevos listos para copiar." />
        )}
        {r && (
          <>
            <Tarjeta className="flex flex-col items-center gap-8 sm:flex-row">
              <Anillo nota={r.nota_total} />
              <p className="text-[16px] leading-relaxed text-text-2">{r.resumen}</p>
            </Tarjeta>

            <Tarjeta i={1}>
              <p className="mb-4 text-[17px] font-medium">Punto por punto</p>
              <div className="divide-y divide-line">
                {r.criterios.map((c, i) => {
                  const pct = c.maximo ? c.puntos / c.maximo : 0;
                  const color = pct >= 0.75 ? "bg-good" : pct >= 0.45 ? "bg-warn" : "bg-bad";
                  return (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3">
                      <span className="text-[14px] font-medium">{c.criterio}</span>
                      <span className="flex items-center gap-2 text-[13px] text-text-2">
                        <span className={`size-2 rounded-full ${color}`} />
                        {c.puntos}/{c.maximo}
                      </span>
                      <span className="col-span-2 text-[13px] text-text-2">{c.observacion}</span>
                    </div>
                  );
                })}
              </div>
            </Tarjeta>

            <div className="space-y-3">
              <p className="pt-4 text-[17px] font-medium">Qué cambiar, en orden</p>
              {[...r.cambios].sort((a, b) => a.prioridad - b.prioridad).map((c, i) => (
                <Tarjeta key={i} i={i} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[15px] font-medium">{c.que}</p>
                      <p className="mt-1 text-[13px] text-text-2">{c.por_que}</p>
                    </div>
                    {c.texto_sugerido && <Copiar texto={c.texto_sugerido} />}
                  </div>
                  {c.texto_sugerido && <p className="rounded-[14px] bg-raised px-4 py-3 text-[14px] whitespace-pre-line">{c.texto_sugerido}</p>}
                </Tarjeta>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Tarjeta className="space-y-3">
                <div className="flex items-center justify-between"><p className="text-[15px] font-medium">Bio nueva</p><Copiar texto={r.bio_sugerida} /></div>
                <p className="text-[14px] whitespace-pre-line text-text-2">{r.bio_sugerida}</p>
              </Tarjeta>
              <Tarjeta i={1} className="space-y-3">
                <p className="text-[15px] font-medium">Nombre (lo que lee el buscador)</p>
                {r.nombre_sugerido.map((n) => (
                  <div key={n} className="flex items-center justify-between gap-3 text-[14px] text-text-2">{n}<Copiar texto={n} /></div>
                ))}
              </Tarjeta>
            </div>

            <p className="text-[12px] text-text-3">Datos usados: {r.datos_usados}. {r.limitaciones}</p>
          </>
        )}
      </div>
    </Pagina>
  );
}
