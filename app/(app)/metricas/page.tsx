"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Aparece, Aviso, Boton, Contador, Desplegable, Pagina, Pasos, Charla, Subir, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useWindsorConectado } from "@/components/CuentaWindsor";
import { useAgente } from "@/lib/client/useAgente";
import { useEnFila } from "@/lib/client/cola";
import { EnFila } from "@/components/EnFila";
import type { Adjunto } from "@/lib/client/media";
import type { ResultadoMetricas } from "@/lib/agent/tasks";
import { CrecimientoSeguidores, SemanaVsSemana, seguidoresActuales } from "@/components/Evolucion";
import { COLORES_KPI, LineaDiaria, periodoCorto, MejoresPublicaciones, PlanSemana } from "@/components/Graficas";
import { HorarioSeguidores } from "@/components/Horario";
import { BienYMal, ComponentesPuntaje, IndicadoresOro, PuntajeContenido } from "@/components/Tablero";

function Kpis({ kpis }: { kpis: ResultadoMetricas["kpis"] }) {
  if (!kpis.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.slice(0, 4).map((k, i) => (
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
  );
}

function Notas({ r }: { r: ResultadoMetricas }) {
  return (
    <Desplegable titulo="Qué encontré y cómo lo calculé">
      <div className="space-y-4">
        {r.hallazgos.map((h, i) => (
          <p key={`h${i}`} className="text-text">{h}</p>
        ))}
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
  );
}

export default function Metricas() {
  const [creador, , listo] = useCreador();
  const { conectado: windsor } = useWindsorConectado();
  const windsorListo = windsor !== null;
  const [guardado] = useUltimo<ResultadoMetricas>("metricas");
  const [capturas, setCapturas] = useState<Adjunto[]>([]);
  const [detalle, setDetalle] = useState(false);
  // El resultado se guarda solo (lib/client/resultados.ts), aunque cambies de sección mientras analiza.
  const ag = useAgente<ResultadoMetricas>("metricas");
  const enFila = useEnFila("metricas");
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
            ayuda="Panel profesional de Instagram: el resumen, 2 o 3 reels y Público → Momentos de actividad (para saber a qué hora publicar)."
            adjuntos={capturas}
            onChange={setCapturas}
            etiqueta={(f) => `captura de SUS estadísticas de Instagram (${f.name})`}
          />
        )}
        <EnFila tarea="metricas" onAhora={() => ag.correr(creador, capturas)} />
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && !enFila && (
          <Vacio titulo="Todavía no leíste tus métricas" texto="Te muestro tus números clave, qué publicaciones te funcionaron más y por qué, y qué hacer con eso." />
        )}

        {r && (
          <>
            <p className="text-[13px] text-text-3">{periodoCorto(r.periodo)}</p>
            {r.tablero ? (
              <>
                <PuntajeContenido t={r.tablero} frase={r.resumen} />
                <IndicadoresOro indicadores={r.tablero.indicadores} />
                <BienYMal bien={r.bien ?? []} mal={r.mal ?? []} />
                <PlanSemana plan={r.plan ?? []} />
                <HorarioSeguidores actividad={r.actividad} />
                <button
                  onClick={() => setDetalle((v) => !v)}
                  aria-expanded={detalle}
                  className="flex w-full items-center justify-between rounded-[20px] border border-line px-6 py-4 text-left text-[14px] font-medium transition-colors hover:border-line-strong"
                >
                  {detalle ? "Ocultar el detalle" : "Ver detalle: tus números, gráficas y cada publicación"}
                  <ChevronDown size={16} className={`text-text-3 transition-transform duration-200 ${detalle ? "rotate-180" : ""}`} />
                </button>
                <Aparece visible={detalle}>
                  <div className="space-y-6 pt-1">
                    <Kpis kpis={r.kpis} />
                    <SemanaVsSemana serie={r.serie ?? []} />
                    <CrecimientoSeguidores serie={r.serie ?? []} actuales={seguidoresActuales(r)} />
                    <LineaDiaria serie={r.serie ?? []} />
                    <MejoresPublicaciones publicaciones={r.publicaciones} />
                    <Tarjeta className="space-y-3">
                      <p className="text-[15px] font-medium">De qué está hecho tu puntaje</p>
                      <ComponentesPuntaje t={r.tablero} />
                    </Tarjeta>
                    <Notas r={r} />
                  </div>
                </Aparece>
              </>
            ) : (
              <>
                <p className="rounded-[14px] border border-sec/30 bg-sec/10 px-4 py-3 text-[14px]">
                  {r.bien
                    ? "Para tu puntaje necesito los números de cada publicación: conectá Windsor o subí capturas de las estadísticas de 3 reels."
                    : "Tocá Actualizar y te armo el tablero nuevo: tu puntaje, el gancho, la retención, si te comparten y si te siguen."}
                </p>
                <BienYMal bien={r.bien ?? []} mal={r.mal ?? []} />
                <Kpis kpis={r.kpis} />
                <PlanSemana plan={r.plan ?? []} />
                <HorarioSeguidores actividad={r.actividad} />
                <SemanaVsSemana serie={r.serie ?? []} />
                <CrecimientoSeguidores serie={r.serie ?? []} actuales={seguidoresActuales(r)} />
                <LineaDiaria serie={r.serie ?? []} />
                <MejoresPublicaciones publicaciones={r.publicaciones} />
                <Notas r={r} />
              </>
            )}
          </>
        )}
      </div>
    </Pagina>
  );
}
