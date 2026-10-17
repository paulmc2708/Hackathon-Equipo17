"use client";

// Gráficas de evolución: todo se calcula con código sobre los datos reales que trajo el agente.
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Contador, Tarjeta } from "@/components/ui";
import type { ResultadoMetricas } from "@/lib/agent/tasks";

type Serie = ResultadoMetricas["serie"];
type Campo = "vistas" | "alcance" | "seguidores_nuevos";

/** Siempre con punto de miles (8.355), como lo muestra Instagram. */
const num = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const dia = (f: string) => {
  const d = new Date(`${f}T12:00:00`);
  return Number.isNaN(d.getTime()) ? f : d.toLocaleDateString("es", { day: "numeric", month: "short" });
};

/** "8.355" → 8355 · "12,4 mil" → 12400 · "1,2 M" → 1200000. */
export function leerNumero(t: string): number | null {
  const m = t.match(/\d[\d.]*(?:,\d+)?/);
  if (!m) return null;
  let n = Number(m[0].replace(/\./g, "").replace(",", "."));
  if (/\bmil\b/i.test(t)) n *= 1e3;
  else if (/\b(M|millones?)\b/.test(t)) n *= 1e6;
  return Number.isFinite(n) ? n : null;
}

/** Seguidores totales de hoy, si el agente los puso como KPI. */
export function seguidoresActuales(kpis: ResultadoMetricas["kpis"]) {
  const k = kpis.find((x) => /seguidores/i.test(x.nombre) && !/nuevos|ganad/i.test(x.nombre));
  return k ? leerNumero(k.valor) : null;
}

/** Línea mínima sin ejes, para acompañar un número. */
export function Sparkline({ valores, color, alto = 36, corte }: { valores: number[]; color: string; alto?: number; corte?: number }) {
  if (valores.length < 2) return null;
  const W = 120, max = Math.max(...valores) || 1, min = Math.min(...valores);
  const x = (i: number) => (i * W) / (valores.length - 1);
  const y = (v: number) => 2 + (1 - (v - min) / (max - min || 1)) * (alto - 4);
  const d = valores.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${alto}`} className="w-full" style={{ height: alto }} preserveAspectRatio="none" aria-hidden>
      {corte !== undefined && <line x1={x(corte)} x2={x(corte)} y1={0} y2={alto} stroke="var(--line-strong)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />}
      <path d={d} className="revelar" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const CAMPOS: { id: Campo; nombre: string; color: string }[] = [
  { id: "vistas", nombre: "Vistas", color: "var(--c-azul)" },
  { id: "alcance", nombre: "Alcance", color: "var(--c-aqua)" },
  { id: "seguidores_nuevos", nombre: "Seguidores nuevos", color: "var(--c-magenta)" },
];

function comparar(serie: Serie, campo: Campo) {
  const v = serie.map((p) => p[campo]).filter((x): x is number => x !== null);
  if (v.length < 14) return null;
  const ult = v.slice(-14);
  const antes = ult.slice(0, 7).reduce((a, b) => a + b, 0);
  const ahora = ult.slice(7).reduce((a, b) => a + b, 0);
  const cambio = antes ? Math.round(((ahora - antes) / antes) * 100) : null;
  return { ult, antes, ahora, cambio };
}

function Cambio({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[12px] text-text-3">sin semana anterior</span>;
  const sube = pct > 2, baja = pct < -2;
  const Icono = sube ? ArrowUpRight : baja ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-medium ${sube ? "bg-good/15 text-good" : baja ? "bg-bad/15 text-bad" : "bg-raised text-text-2"}`}>
      <Icono size={13} strokeWidth={2.2} />
      {sube ? "+" : ""}
      {pct}% {sube ? "más" : baja ? "menos" : "igual"}
    </span>
  );
}

/** Esta semana contra la anterior, con flecha, % y una línea de los últimos 14 días. */
export function SemanaVsSemana({ serie, compacta = false }: { serie: Serie; compacta?: boolean }) {
  const filas = CAMPOS.map((c) => ({ ...c, d: comparar(serie, c.id) })).filter((c) => c.d);
  if (!filas.length) return null;
  return (
    <Tarjeta className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[17px] font-medium">Esta semana contra la anterior</p>
        <span className="hidden text-[12px] text-text-3 sm:inline">últimos 7 días vs. los 7 de antes</span>
      </div>
      <div className={`grid gap-3 ${filas.length > 1 ? "sm:grid-cols-3" : ""}`}>
        {filas.map(({ id, nombre, color, d }) => (
          <div key={id} className="space-y-2 rounded-[16px] bg-raised/60 p-4">
            <p className="flex items-center gap-2 text-[13px] text-text-2">
              <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
              {nombre}
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-display text-[24px] leading-none font-semibold tracking-[-0.03em]">
                <Contador valor={num(d!.ahora)} />
              </span>
              <Cambio pct={d!.cambio} />
            </div>
            {!compacta && <Sparkline valores={d!.ult} color={color} corte={7} />}
            {!compacta && <p className="text-[11px] text-text-3">La semana anterior: {num(d!.antes)}</p>}
          </div>
        ))}
      </div>
    </Tarjeta>
  );
}

/** Crecimiento de seguidores: curva acumulada (de cuántos a cuántos) o barras por día. */
export function CrecimientoSeguidores({ serie, actuales }: { serie: Serie; actuales: number | null }) {
  const [vista, setVista] = useState<"acumulado" | "dia">("acumulado");
  const [hover, setHover] = useState<number | null>(null);
  const dias = serie.filter((p): p is Serie[number] & { seguidores_nuevos: number } => p.seguidores_nuevos !== null);
  if (dias.length < 3) return null;
  const total = dias.reduce((a, p) => a + p.seguidores_nuevos, 0);
  const mejor = dias.reduce((a, p) => (p.seguidores_nuevos > a.seguidores_nuevos ? p : a));
  const parteMejor = total ? Math.round((mejor.seguidores_nuevos / total) * 100) : 0;
  const inicio = actuales !== null && actuales >= total ? actuales - total : null;
  const acumulado = dias.reduce<number[]>((acc, p) => [...acc, (acc.at(-1) ?? inicio ?? 0) + p.seguidores_nuevos], []);
  const crecio = inicio ? Math.round((total / inicio) * 100) : null;

  const W = 640, H = 170, PT = 10, PB = 10;
  const minA = Math.min(inicio ?? acumulado[0], ...acumulado), maxA = Math.max(...acumulado);
  const x = (i: number) => (i * W) / (dias.length - 1);
  const yA = (v: number) => PT + (1 - (v - minA) / (maxA - minA || 1)) * (H - PT - PB);
  const linea = acumulado.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yA(v).toFixed(1)}`).join("");
  const area = `${linea}L${W},${H}L0,${H}Z`;
  const maxD = mejor.seguidores_nuevos || 1;

  return (
    <div style={{ "--sec": "var(--c-magenta)" } as React.CSSProperties}>
      <Tarjeta className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[13px] text-text-2">Tu crecimiento</p>
            {inicio !== null ? (
              <p className="font-display text-[28px] leading-tight font-semibold tracking-[-0.03em]">
                {num(inicio)} <span className="text-text-3">→</span> <Contador valor={num(actuales!)} />
                <span className="ml-2 align-middle text-[14px] font-normal text-text-2">seguidores</span>
              </p>
            ) : (
              <p className="font-display text-[28px] leading-tight font-semibold tracking-[-0.03em]"><Contador valor={`+${num(total)}`} /> seguidores</p>
            )}
            <p className="mt-1 text-[13px] text-text-2">
              +{num(total)} en {dias.length} días · +{num(Math.round(total / dias.length))} por día{crecio !== null ? ` · creciste ${num(crecio)}%` : ""}
            </p>
          </div>
          <div className="flex gap-1 rounded-full border border-line p-1 text-[13px]">
            {(["acumulado", "dia"] as const).map((v) => (
              <button key={v} onClick={() => setVista(v)} className={`rounded-full px-3 py-1 whitespace-nowrap transition-colors ${vista === v ? "bg-sec/15 text-sec" : "text-text-2 hover:text-text"}`}>
                {v === "acumulado" ? "Acumulado" : "Por día"}
              </button>
            ))}
          </div>
        </div>

        {vista === "acumulado" ? (
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-[170px] w-full" preserveAspectRatio="none" role="img" aria-label="Seguidores acumulados por día">
              <defs>
                <linearGradient id="crece" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--sec)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--sec)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#crece)" className="aparecer" />
              <path d={linea} className="revelar" fill="none" stroke="var(--sec)" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {dias.map((p, i) => (
                <rect key={p.fecha} x={x(i) - W / dias.length / 2} y={0} width={W / dias.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              ))}
            </svg>
            {hover !== null && (
              <div className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-[10px] border border-line bg-raised px-3 py-1.5 text-[12px] whitespace-nowrap" style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}>
                <span className="text-text-2">{dia(dias[hover].fecha)} · </span>
                <span className="font-medium">{inicio !== null ? `${num(acumulado[hover])} seguidores` : `+${num(acumulado[hover])}`}</span>
                <span className="text-text-3"> (+{num(dias[hover].seguidores_nuevos)} ese día)</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-[170px] items-end gap-[2px]" role="img" aria-label="Seguidores nuevos por día">
            {dias.map((p, i) => (
              <div
                key={p.fecha}
                title={`${dia(p.fecha)}: +${num(p.seguidores_nuevos)}`}
                className={`subir flex-1 rounded-t-[4px] transition-colors ${p === mejor ? "bg-sec" : "bg-sec/35 hover:bg-sec/70"}`}
                style={{ height: `${Math.max(3, (p.seguidores_nuevos / maxD) * 100)}%`, animationDelay: `${i * 18}ms` }}
              />
            ))}
          </div>
        )}
        <div className="flex justify-between text-[11px] text-text-3">
          <span>{dia(dias[0].fecha)}</span>
          <span>{dia(dias[dias.length - 1].fecha)}</span>
        </div>
        <p className="text-[14px] text-text-2">
          {parteMejor >= 20
            ? `Tu mejor día fue el ${dia(mejor.fecha)}: trajo el ${parteMejor}% de tus seguidores nuevos. Fijate qué publicaste ese día, es lo que tenés que repetir.`
            : "Tu crecimiento viene parejo: ningún día solo explica todo. Seguí publicando seguido."}
        </p>
      </Tarjeta>
    </div>
  );
}

/** Evolución de la nota del perfil entre análisis. */
export function EvolucionNota({ historial }: { historial: { fecha: string; nota: number }[] }) {
  if (historial.length < 2) return null;
  const primera = historial[0].nota, ultima = historial[historial.length - 1].nota;
  const dif = ultima - primera;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24">
        <Sparkline valores={historial.map((h) => h.nota)} color="var(--sec)" alto={28} />
      </div>
      <p className="text-[13px] text-text-2">
        {dif === 0 ? `Igual que tu primer análisis (${primera})` : `Pasaste de ${primera} a ${ultima}`}
        {dif !== 0 && <span className={`ml-1.5 font-medium ${dif > 0 ? "text-good" : "text-bad"}`}>{dif > 0 ? `+${dif}` : dif}</span>}
      </p>
    </div>
  );
}
