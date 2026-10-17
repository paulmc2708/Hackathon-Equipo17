"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Aviso, Boton, Pagina, Pasos, Preguntas, Subir, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo, useWindsor } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { Adjunto } from "@/lib/client/media";
import type { ResultadoMetricas } from "@/lib/agent/tasks";

export default function Metricas() {
  const [creador, , listo] = useCreador();
  const [windsor, , windsorListo] = useWindsor();
  const [guardado, guardar] = useUltimo<ResultadoMetricas>("metricas");
  const [capturas, setCapturas] = useState<Adjunto[]>([]);
  const ag = useAgente<ResultadoMetricas>("metricas", guardar);
  const r = ag.resultado ?? (ag.corriendo ? null : guardado);

  if (!listo || !windsorListo) return null;
  if (!creador.usuario)
    return (
      <Pagina titulo="Mis métricas">
        <Vacio titulo="Primero contame quién sos" texto="Necesito tu usuario para leer tus números.">
          <Link href="/"><Boton>Completar mis datos</Boton></Link>
        </Vacio>
      </Pagina>
    );

  const maximo = r ? Math.max(1, ...r.publicaciones.map((p) => p.valor)) : 1;

  return (
    <Pagina
      titulo="Mis métricas"
      bajada={windsor ? "Tus números reales de Instagram, leídos desde Windsor y explicados." : "Conectá Windsor o subí capturas de tus estadísticas y te explico tus números."}
      accion={
        <Boton cargando={ag.corriendo} onClick={() => ag.correr(creador, capturas)}>
          {r ? "Actualizar" : "Leer mis métricas"}
        </Boton>
      }
    >
      <div className="space-y-6">
        {!windsor && (
          <Tarjeta className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] font-medium">Conectá Windsor para tener tus números al día</p>
              <p className="mt-1 text-[13px] text-text-2">Gratis. Conectás tu Instagram en Windsor, pegás tu clave y listo.</p>
            </div>
            <Link href="/ajustes"><Boton variante="borde">Ir a Conexiones</Boton></Link>
          </Tarjeta>
        )}
        {!ag.corriendo && (
          <Subir
            titulo={windsor ? "Sumar capturas de estadísticas (opcional)" : "O subí capturas de tus estadísticas"}
            ayuda="Panel profesional de Instagram: resumen de la cuenta y 2 o 3 reels."
            adjuntos={capturas}
            onChange={setCapturas}
            etiqueta={(f) => `captura de SUS estadísticas de Instagram (${f.name})`}
          />
        )}
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.preguntas && <Preguntas preguntas={ag.preguntas.preguntas} porQue={ag.preguntas.por_que} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no leíste tus métricas" texto="Te muestro tus números clave, qué publicaciones te funcionaron más y por qué, y qué hacer con eso." />
        )}

        {r && (
          <>
            <p className="text-[13px] text-text-3">{r.periodo}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {r.kpis.map((k, i) => (
                <Tarjeta key={k.nombre} i={i} className="space-y-1 !p-5">
                  <p className="text-[13px] text-text-2">{k.nombre}</p>
                  <p className="font-display text-[30px] leading-tight font-semibold tracking-[-0.03em]">{k.valor}</p>
                  <p className="text-[12px] text-text-3">{k.detalle}</p>
                </Tarjeta>
              ))}
            </div>

            <Tarjeta><p className="text-[16px] leading-relaxed text-text-2">{r.resumen}</p></Tarjeta>

            {r.publicaciones.length > 0 && (
              <Tarjeta className="space-y-4">
                <p className="text-[17px] font-medium">Lo que mejor te funcionó</p>
                {r.publicaciones.map((p, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4 text-[14px]">
                      <span className="truncate">{p.descripcion}</span>
                      <span className="flex shrink-0 items-center gap-2 text-text-2">
                        {p.multiplicador !== null && <span className="rounded-full bg-text px-2 py-0.5 text-[12px] font-medium text-bg">{p.multiplicador}x</span>}
                        {p.valor.toLocaleString("es")} {p.metrica}
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="text-text-3 hover:text-text" aria-label="Abrir publicación">
                            <ArrowUpRight size={14} />
                          </a>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                      <div className="h-full rounded-full bg-text transition-[width] duration-700" style={{ width: `${(p.valor / maximo) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </Tarjeta>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Tarjeta className="space-y-2">
                <p className="text-[15px] font-medium">Qué muestran tus números</p>
                <ul className="space-y-1.5 text-[14px] text-text-2">{r.hallazgos.map((h) => <li key={h}>· {h}</li>)}</ul>
              </Tarjeta>
              <Tarjeta i={1} className="space-y-3">
                <p className="text-[15px] font-medium">Qué hacer ahora</p>
                {r.recomendaciones.map((x) => (
                  <div key={x.que}>
                    <p className="text-[14px]">{x.que}</p>
                    <p className="text-[13px] text-text-2">{x.por_que}</p>
                  </div>
                ))}
              </Tarjeta>
            </div>
            <p className="text-[12px] text-text-3">Fuente: {r.fuente}. {r.limitaciones}</p>
          </>
        )}
      </div>
    </Pagina>
  );
}
