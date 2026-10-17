"use client";

// Tablero de Inicio: solo muestra lo que el agente ya sacó con datos reales. Si falta algo, ofrece sacarlo.
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Contador, Tarjeta } from "@/components/ui";
import { useHistorialPerfil, useUltimo } from "@/lib/client/store";
import { SemanaVsSemana } from "@/components/Evolucion";
import { COLORES_KPI, periodoCorto } from "@/components/Graficas";
import type { ResultadoIdeas, ResultadoMetricas, ResultadoPerfil } from "@/lib/agent/tasks";

const colorNota = (n: number) => (n >= 75 ? "var(--good)" : n >= 50 ? "var(--warn)" : "var(--bad)");

function Pendiente({ href, titulo, accion, i }: { href: string; titulo: string; accion: string; i: number }) {
  return (
    <Link href={href} className="block h-full">
      <Tarjeta i={i} className="flex h-full flex-col justify-between gap-6 !border-dashed !p-5 transition-colors hover:border-line-strong">
        <p className="text-[13px] text-text-2">{titulo}</p>
        <p className="flex items-center gap-1.5 text-[14px] font-medium">
          {accion} <ArrowRight size={14} strokeWidth={1.8} />
        </p>
      </Tarjeta>
    </Link>
  );
}

function Dato({ titulo, valor, detalle, i, children }: { titulo: string; valor: string; detalle?: string; i: number; children?: React.ReactNode }) {
  return (
    <Tarjeta i={i} className="relative h-full space-y-1 overflow-hidden !p-5">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: COLORES_KPI[i % COLORES_KPI.length] }} aria-hidden />
      <p className="text-[13px] text-text-2">{titulo}</p>
      <p className="font-display text-[24px] sm:text-[30px] leading-tight font-semibold tracking-[-0.03em]"><Contador valor={valor} /></p>
      {detalle && <p className="truncate text-[12px] text-text-3" title={detalle}>{detalle}</p>}
      {children}
    </Tarjeta>
  );
}

export function Resumen() {
  const [perfil, , l1] = useUltimo<ResultadoPerfil>("perfil");
  const [metricas, , l2] = useUltimo<ResultadoMetricas>("metricas");
  const [ideas, , l3] = useUltimo<ResultadoIdeas>("ideas");
  const [historial] = useHistorialPerfil();
  const difNota = historial.length >= 2 ? historial[historial.length - 1].nota - historial[0].nota : 0;
  if (!l1 || !l2 || !l3) return null;

  const kpis = metricas?.kpis.slice(0, 3) ?? [];
  const mejor = metricas?.publicaciones.reduce<ResultadoMetricas["publicaciones"][number] | null>((a, p) => (!a || p.valor > a.valor ? p : a), null);
  const cambio = perfil?.cambios.slice().sort((a, b) => a.prioridad - b.prioridad)[0];
  const reco = metricas?.recomendaciones[0];

  return (
    <section className="mb-10 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-medium">Tu Instagram hoy</h2>
        {metricas && <span className="text-[12px] text-text-3">{periodoCorto(metricas.periodo)}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {perfil ? (
          <Link href="/perfil" className="block h-full">
            <Dato titulo="Nota de tu perfil" valor={`${perfil.nota_total}/100`} detalle={difNota ? `${difNota > 0 ? "+" : ""}${difNota} desde tu primer análisis` : undefined} i={0}>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                <div className="crecer h-full rounded-full" style={{ width: `${perfil.nota_total}%`, background: colorNota(perfil.nota_total) }} />
              </div>
            </Dato>
          </Link>
        ) : (
          <Pendiente href="/perfil" titulo="Nota de tu perfil" accion="Analizar mi perfil" i={0} />
        )}
        {kpis.length ? (
          kpis.map((k, i) => (
            <Link key={i} href="/metricas" className="block h-full">
              <Dato titulo={k.nombre} valor={k.valor} detalle={k.detalle} i={i + 1} />
            </Link>
          ))
        ) : (
          <div className="col-span-1 lg:col-span-3">
            <Pendiente href="/metricas" titulo="Seguidores, alcance y vistas" accion="Leer mis métricas" i={1} />
          </div>
        )}
      </div>

      {metricas?.serie && <SemanaVsSemana serie={metricas.serie} compacta />}

      {(mejor || cambio || reco || ideas) && (
        <div className="grid gap-3 lg:grid-cols-2">
          {mejor && (
            <Tarjeta i={4} className="space-y-2 !p-5">
              <p className="text-[13px] text-text-2">Tu publicación que mejor anduvo</p>
              <p className="line-clamp-2 text-[15px]">{mejor.descripcion}</p>
              <p className="flex items-center gap-2 text-[13px] text-text-2">
                {mejor.multiplicador !== null && <span className="whitespace-nowrap rounded-full bg-text px-2 py-0.5 text-[12px] font-medium text-bg">{mejor.multiplicador}x tu promedio</span>}
                {mejor.valor.toLocaleString("es")} {mejor.metrica}
                {mejor.url && (
                  <a href={mejor.url} target="_blank" rel="noreferrer" className="text-text-3 hover:text-text" aria-label="Abrir publicación">
                    <ArrowUpRight size={14} />
                  </a>
                )}
              </p>
            </Tarjeta>
          )}
          {(cambio || reco) && (
            <Tarjeta i={5} className="space-y-2 !p-5">
              <p className="text-[13px] text-text-2">Lo primero que haría</p>
              <p className="text-[15px]">{cambio?.que ?? reco?.que}</p>
              <p className="line-clamp-2 text-[13px] text-text-2">{cambio?.por_que ?? reco?.por_que}</p>
            </Tarjeta>
          )}
          {ideas && ideas.ideas.length > 0 && (
            <Link href="/ideas" className="block">
              <Tarjeta i={6} className="flex items-center justify-between gap-4 !p-5 transition-colors hover:border-line-strong">
                <div>
                  <p className="text-[13px] text-text-2">Ideas de tu nicho</p>
                  <p className="text-[15px]">{ideas.ideas.length} ideas listas para grabar</p>
                </div>
                <ArrowRight size={16} strokeWidth={1.8} className="text-text-2" />
              </Tarjeta>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
