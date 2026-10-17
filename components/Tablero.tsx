"use client";

// El tablero del informe "Las métricas que importan": puntaje, los 4 indicadores de oro con semáforo,
// lo que salió bien y lo que salió mal. Los números los calcula el código (lib/metricas/tablero.ts).
import { Check, CircleAlert, CircleCheck, CircleDashed, TriangleAlert, type LucideIcon } from "lucide-react";
import { Contador, Tarjeta } from "@/components/ui";
import type { Indicador, Semaforo, Tablero } from "@/lib/metricas/tablero";

export const SEMAFORO: Record<Semaforo, { texto: string; color: string; Icono: LucideIcon }> = {
  bien: { texto: "Bien", color: "var(--good)", Icono: CircleCheck },
  mejorable: { texto: "Mejorable", color: "var(--warn)", Icono: CircleAlert },
  a_trabajar: { texto: "A trabajar", color: "var(--bad)", Icono: TriangleAlert },
  sin_dato: { texto: "Sin dato", color: "var(--text-3)", Icono: CircleDashed },
};

const colorPuntaje = (p: number) => (p >= 70 ? "var(--good)" : p >= 45 ? "var(--warn)" : "var(--bad)");

/** Chip de semáforo accesible: color + ícono + palabra (nunca solo color). */
export function ChipSemaforo({ s }: { s: Semaforo }) {
  const { texto, color, Icono } = SEMAFORO[s];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap" style={{ color, background: `color-mix(in oklab, ${color} 14%, transparent)` }}>
      <Icono size={13} strokeWidth={2.2} />
      {texto}
    </span>
  );
}

/** Bloque 1: el puntaje general y una frase. */
export function PuntajeContenido({ t, frase }: { t: Tablero; frase: string }) {
  const p = t.puntaje;
  const r = 52, c = 2 * Math.PI * r;
  return (
    <Tarjeta className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative size-[132px] shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
          {p !== null && (
            <circle cx="60" cy="60" r={r} fill="none" stroke={colorPuntaje(p)} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} className="transition-[stroke-dashoffset] duration-1000" />
          )}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[38px] leading-none font-semibold tracking-[-0.04em]">{p === null ? "–" : <Contador valor={String(p)} />}</span>
          <span className="mt-1 text-[11px] text-text-3">de 100</span>
        </span>
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-[13px] font-medium text-sec">Tu contenido esta semana</p>
        <p className="text-[19px] leading-snug font-medium tracking-[-0.01em]">{frase}</p>
        <p className="text-[12px] text-text-3">
          {t.pocos_posts
            ? "Necesito más publicaciones para darte un diagnóstico confiable: con menos de 5, tomalo como una primera mirada."
            : `Con tus últimas ${t.posts_evaluados} publicaciones, comparado con cuentas de ${t.tamano} seguidores y con tu propio historial.`}
        </p>
      </div>
    </Tarjeta>
  );
}

/** Bloque 2: Gancho · Retención · Recompensa · Conversión. */
export function IndicadoresOro({ indicadores }: { indicadores: Indicador[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {indicadores.map((x, i) => (
        <Tarjeta key={x.id} i={i} className="flex flex-col gap-2 !p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-medium">{x.nombre}</p>
            <ChipSemaforo s={x.semaforo} />
          </div>
          <p className="text-[12px] text-text-3">{x.que_mide}</p>
          <p className="mt-1 text-[16px] leading-snug font-medium">{x.valor}</p>
          <p className="mt-auto text-[12px] text-text-2">{x.comparacion}</p>
        </Tarjeta>
      ))}
    </div>
  );
}

/** Bloque 3: lo que salió bien (primero) y lo que salió mal, con su acción. */
export function BienYMal({ bien, mal }: { bien: string[]; mal: { problema: string; accion: string }[] }) {
  if (!bien.length && !mal.length) return null;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Tarjeta className="space-y-3">
        <p className="text-[15px] font-medium">Lo que salió bien</p>
        {bien.length ? (
          <ul className="space-y-2.5">
            {bien.slice(0, 3).map((b, i) => (
              <li key={i} className="flex gap-2.5 text-[14px]">
                <Check size={16} className="mt-0.5 shrink-0 text-good" />
                {b}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-text-2">Todavía no hay algo que destaque. Con las acciones de abajo vas a empezar a verlo.</p>
        )}
      </Tarjeta>
      <Tarjeta className="space-y-3">
        <p className="text-[15px] font-medium">Lo que hay que mejorar</p>
        {mal.length ? (
          <ul className="space-y-3.5">
            {mal.slice(0, 3).map((m, i) => (
              <li key={i} className="space-y-1">
                <p className="flex gap-2.5 text-[14px]">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-bad" />
                  {m.problema}
                </p>
                <p className="pl-[26px] text-[13px] text-text-2">
                  <span className="font-medium text-text">Qué hacer: </span>
                  {m.accion}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-text-2">No encontré nada urgente. Seguí así y mirá el detalle para afinar.</p>
        )}
      </Tarjeta>
    </div>
  );
}

/** En el detalle: de qué está hecho el puntaje. */
export function ComponentesPuntaje({ t }: { t: Tablero }) {
  return (
    <div className="space-y-2.5">
      {t.componentes.map((c) => (
        <div key={c.nombre} className="space-y-1">
          <div className="flex justify-between text-[13px]">
            <span className="text-text">
              {c.nombre} <span className="text-text-3">· pesa {c.peso} %</span>
            </span>
            <span className="text-text-2">{c.puntos === null ? "sin dato" : `${c.puntos}/100`}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raised">
            {c.puntos !== null && <div className="crecer h-full rounded-full" style={{ width: `${c.puntos}%`, background: colorPuntaje(c.puntos) }} />}
          </div>
        </div>
      ))}
      <p className="pt-1 text-[12px] text-text-3">Pesos y umbrales del informe &quot;Las métricas que importan&quot; (oct-2026). Si falta un dato, su peso se reparte entre los demás.</p>
    </div>
  );
}
