"use client";

// Gráficas livianas en SVG, con el acento de globals.css y tooltip al pasar el mouse.
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Tarjeta } from "@/components/ui";
import type { ResultadoMetricas } from "@/lib/agent/tasks";

const num = (n: number) => n.toLocaleString("es", { maximumFractionDigits: 1 });
const corto = (n: number) => (n >= 1e6 ? `${num(n / 1e6)} M` : n >= 1e4 ? `${num(n / 1e3)} mil` : num(n));
const dia = (f: string) => {
  const d = new Date(`${f}T12:00:00`);
  return Number.isNaN(d.getTime()) ? f : d.toLocaleDateString("es", { day: "numeric", month: "short" });
};

type Serie = ResultadoMetricas["serie"];
type Campo = "vistas" | "alcance" | "seguidores_nuevos";
const CAMPOS: { id: Campo; nombre: string }[] = [
  { id: "vistas", nombre: "Vistas" },
  { id: "alcance", nombre: "Alcance" },
  { id: "seguidores_nuevos", nombre: "Seguidores nuevos" },
];

/** Una serie por vez (se elige arriba), línea de 2 px con área suave y cruz + tooltip al pasar el mouse. */
export function LineaDiaria({ serie }: { serie: Serie }) {
  const disponibles = CAMPOS.filter((c) => serie.filter((p) => p[c.id] !== null).length >= 2);
  const [campo, setCampo] = useState<Campo>(disponibles[0]?.id ?? "vistas");
  const [hover, setHover] = useState<number | null>(null);
  const puntos = useMemo(() => serie.map((p) => ({ fecha: p.fecha, v: p[campo] })).filter((p): p is { fecha: string; v: number } => p.v !== null), [serie, campo]);
  if (!disponibles.length || puntos.length < 2) return null;

  const W = 640, H = 200, PX = 8, PT = 12, PB = 24;
  const max = Math.max(...puntos.map((p) => p.v)) || 1;
  const x = (i: number) => PX + (i * (W - 2 * PX)) / (puntos.length - 1);
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB);
  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const area = `${linea}L${x(puntos.length - 1)},${H - PB}L${x(0)},${H - PB}Z`;
  const total = puntos.reduce((a, p) => a + p.v, 0);
  const h = hover !== null ? puntos[hover] : null;

  return (
    <Tarjeta className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-text-2">{CAMPOS.find((c) => c.id === campo)?.nombre} por día</p>
          <p className="font-display text-[28px] leading-tight font-semibold tracking-[-0.03em]">{corto(total)} <span className="text-[14px] font-normal text-text-2">en total</span></p>
        </div>
        {disponibles.length > 1 && (
          <div className="flex gap-1 overflow-x-auto rounded-full border border-line p-1 text-[13px]">
            {disponibles.map((c) => (
              <button
                key={c.id}
                onClick={() => setCampo(c.id)}
                className={`rounded-full px-3 py-1 whitespace-nowrap transition-colors ${campo === c.id ? "bg-accent-soft text-accent" : "text-text-2 hover:text-text"}`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" preserveAspectRatio="none" role="img" aria-label={`${campo} por día`}>
          <defs>
            <linearGradient id="relleno" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={PX} x2={W - PX} y1={PT + t * (H - PT - PB)} y2={PT + t * (H - PT - PB)} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={PX} x2={W - PX} y1={H - PB} y2={H - PB} stroke="var(--line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="url(#relleno)" />
          <path d={linea} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {hover !== null && h && (
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="var(--line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          )}
          {puntos.map((p, i) => (
            <rect
              key={i}
              x={x(i) - (W - 2 * PX) / (puntos.length - 1) / 2}
              y={0}
              width={(W - 2 * PX) / (puntos.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        {hover !== null && h && (
          <>
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent"
              style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.v) / H) * 200}px` }}
            />
            <div
              className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-[10px] border border-line bg-raised px-3 py-1.5 text-[12px] whitespace-nowrap"
              style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}
            >
              <span className="text-text-2">{dia(h.fecha)} · </span>
              <span className="font-medium">{num(h.v)}</span>
            </div>
          </>
        )}
        <div className="mt-1 flex justify-between text-[11px] text-text-3">
          <span>{dia(puntos[0].fecha)}</span>
          <span>{dia(puntos[puntos.length - 1].fecha)}</span>
        </div>
      </div>
    </Tarjeta>
  );
}

/** Mejores publicaciones: barra = cuántas veces superó tu promedio, con la línea de "tu promedio" (1x). */
export function MejoresPublicaciones({ publicaciones }: { publicaciones: ResultadoMetricas["publicaciones"] }) {
  const lista = publicaciones.filter((p) => p.multiplicador !== null) as (ResultadoMetricas["publicaciones"][number] & { multiplicador: number })[];
  if (!lista.length) return null;
  const max = Math.max(1.5, ...lista.map((p) => p.multiplicador));
  const pos = (m: number) => `${(m / max) * 100}%`;
  return (
    <Tarjeta className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[17px] font-medium">Tus reels que más anduvieron</p>
        <span className="text-[12px] text-text-3">veces tu promedio</span>
      </div>
      <div className="relative space-y-4">
        <div className="pointer-events-none absolute inset-y-0 border-l border-dashed border-line-strong" style={{ left: pos(1) }} aria-hidden />
        {lista.map((p, i) => (
          <div key={i} className="group space-y-1.5" title={`${num(p.valor)} ${p.metrica}`}>
            <div className="flex items-center justify-between gap-4 text-[14px]">
              <span className="truncate">{p.descripcion}</span>
              <span className="flex shrink-0 items-center gap-2 text-[13px] text-text-2">
                <span className="hidden group-hover:inline">{num(p.valor)} {p.metrica}</span>
                <span className="font-medium text-text">{num(p.multiplicador)}x</span>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-text-3 hover:text-text" aria-label="Abrir publicación">
                    <ArrowUpRight size={14} />
                  </a>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-raised">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${p.multiplicador >= 1 ? "bg-accent" : "bg-text-3"}`}
                style={{ width: pos(p.multiplicador) }}
              />
            </div>
          </div>
        ))}
        <p className="text-[11px] text-text-3">La línea punteada es tu promedio.</p>
      </div>
    </Tarjeta>
  );
}

const DESTINO = {
  guion: { texto: "Escribir este guion", href: (idea: string) => `/guiones?idea=${encodeURIComponent(idea)}` },
  ideas: { texto: "Buscar ideas", href: () => "/ideas" },
  perfil: { texto: "Arreglar mi perfil", href: () => "/perfil" },
} as const;

/** El llamado a la acción: 3 pasos para esta semana, cada uno con su botón. */
export function PlanSemana({ plan }: { plan: ResultadoMetricas["plan"] }) {
  if (!plan.length) return null;
  return (
    <Tarjeta className="space-y-5 !border-accent/40 !bg-accent-soft">
      <div>
        <p className="text-[13px] font-medium text-accent">Tu plan para esta semana</p>
        <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em]">Hacé esto, en este orden</p>
      </div>
      <ol className="space-y-3">
        {plan.slice(0, 3).map((p, i) => {
          const d = p.accion !== "ninguna" ? DESTINO[p.accion] : null;
          return (
            <li key={i} className="flex flex-col gap-3 rounded-[16px] border border-line bg-bg p-4 sm:flex-row sm:items-center">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">{p.paso}</p>
                <p className="mt-0.5 text-[13px] text-text-2">{p.por_que}</p>
              </div>
              {d && (
                <Link
                  href={d.href(p.idea || p.paso)}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-[13px] whitespace-nowrap font-medium text-white transition-opacity hover:opacity-90"
                >
                  {d.texto} <ArrowRight size={14} />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Tarjeta>
  );
}
