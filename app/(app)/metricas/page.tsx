"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, Boton, Contador, Desplegable, Pagina, Pasos, Charla, Subir, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useWindsorConectado } from "@/components/CuentaWindsor";
import { useAgente } from "@/lib/client/useAgente";
import type { Adjunto } from "@/lib/client/media";
import type { ResultadoMetricas } from "@/lib/agent/tasks";
import { COLORES_KPI, CrecimientoSeguidores, LineaDiaria, periodoCorto, MejoresPublicaciones, PlanSemana } from "@/components/Graficas";

export default function Metricas() {
  const [creador, , listo] = useCreador();
  const { conectado: windsor } = useWindsorConectado();
  const windsorListo = windsor !== null;
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
              <p className="mt-1 text-[13px] text-text-2">Gratis. Entrás a Windsor con tu usuario, das permiso y listo.</p>
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
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no leíste tus métricas" texto="Te muestro tus números clave, qué publicaciones te funcionaron más y por qué, y qué hacer con eso." />
        )}

        {r && (
          <>
            <p className="text-[13px] text-text-3">{periodoCorto(r.periodo)}</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {r.kpis.slice(0, 4).map((k, i) => (
                <Tarjeta key={i} i={i} className="relative space-y-1 overflow-hidden !p-5">
                  <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: COLORES_KPI[i] }} aria-hidden />
                  <p className="flex items-center gap-2 text-[13px] text-text-2">
                    <span className="size-1.5 rounded-full" style={{ background: COLORES_KPI[i] }} aria-hidden />
                    {k.nombre}
                  </p>
                  <p className="font-display text-[26px] leading-tight font-semibold tracking-[-0.03em] sm:text-[30px]"><Contador valor={k.valor} /></p>
                  <p className="truncate text-[12px] text-text-3" title={k.detalle}>{k.detalle}</p>
                </Tarjeta>
              ))}
            </div>

            <PlanSemana plan={r.plan ?? []} />

            <LineaDiaria serie={r.serie ?? []} />

            <CrecimientoSeguidores serie={r.serie ?? []} />

            <MejoresPublicaciones publicaciones={r.publicaciones} />

            <Tarjeta className="space-y-3">
              <p className="text-[15px] leading-relaxed">{r.resumen}</p>
              {r.hallazgos.length > 0 && (
                <ul className="space-y-2 border-t border-line pt-3">
                  {r.hallazgos.map((h, i) => (
                    <li key={i} className="flex gap-2.5 text-[14px] text-text-2">
                      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-sec" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>

            <Desplegable titulo="Ver detalle y cómo lo calculé">
              <div className="space-y-4">
                {r.recomendaciones.map((x, i) => (
                  <div key={i}>
                    <p className="text-text">{x.que}</p>
                    <p>{x.por_que}</p>
                  </div>
                ))}
                <p className="text-text-3">Fuente: {r.fuente}</p>
                <p className="text-text-3">{r.limitaciones}</p>
              </div>
            </Desplegable>
          </>
        )}
      </div>
    </Pagina>
  );
}
