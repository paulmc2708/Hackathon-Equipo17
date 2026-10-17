"use client";

// "¿A qué hora publicar?": seguidores conectados por hora y la hora recomendada, una hora antes
// de la franja de 3 h en que más se conectan. Las cuentas se hacen acá, con los números del agente.
import Link from "next/link";
import { useState } from "react";
import { Clock } from "lucide-react";
import { Tarjeta } from "@/components/ui";
import { calcularHorario, type Actividad, type Horario } from "@/lib/horario";

const hora = (h: number) => `${String(h).padStart(2, "0")}:00`;
const franja = (h: Horario) => `de ${h.desde} a ${(h.desde + 3) % 24} h`;
const num = (n: number) => Math.round(n).toLocaleString("es", { useGrouping: "always" } as Intl.NumberFormatOptions);

/** Tarjeta grande de Mis métricas: la hora para publicar y las barras por hora. */
export function HorarioSeguidores({ actividad }: { actividad: Actividad | undefined }) {
  const [sobre, setSobre] = useState<number | null>(null);
  const h = calcularHorario(actividad);
  if (!h || !actividad)
    return (
      <Tarjeta className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-sec/15 text-sec">
          <Clock size={18} strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[15px] font-medium">¿A qué hora publicar?</p>
          <p className="mt-1 text-[13px] text-text-2">
            Subí arriba la captura de Estadísticas → Público → Momentos de actividad y tocá Actualizar. Te digo la hora justa para tus seguidores.
          </p>
        </div>
      </Tarjeta>
    );

  const max = Math.max(...h.barras);
  const enFranja = (i: number) => (h.paso === 3 ? i * 3 === h.desde : (i - h.desde + 24) % 24 < 3);
  const etiqueta = (i: number) => (h.paso === 3 ? `${i * 3} a ${(i * 3 + 3) % 24} h` : `${i} h`);
  const conNumeros = actividad.fuente === "windsor";

  return (
    <Tarjeta className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[460px]">
          <p className="text-[13px] font-medium text-sec">¿A qué hora publicar?</p>
          <p className="mt-2 font-display text-[44px] leading-none font-semibold tracking-[-0.04em]">{hora(h.publicar)}</p>
          <p className="mt-3 text-[14px] text-text-2">
            Tus seguidores se conectan más {franja(h)}. Publicá una hora antes: cuando entran, tu post ya está arriba.
          </p>
        </div>
        {actividad.mejor_dia && (
          <span className="rounded-full border border-line px-3 py-1 text-[13px] text-text-2">
            Mejor día: <span className="font-medium text-text">{actividad.mejor_dia}</span>
          </span>
        )}
      </div>

      <div>
        <div className="relative flex h-[132px] items-end gap-[3px] sm:gap-1" onMouseLeave={() => setSobre(null)} role="img" aria-label={`Seguidores conectados por hora. Más conectados ${franja(h)}.`}>
          {h.barras.map((v, i) => (
            <div key={i} className="flex h-full flex-1 items-end" onMouseEnter={() => setSobre(i)}>
              <div
                className={`subir w-full rounded-[5px] transition-opacity ${enFranja(i) ? "bg-sec" : h.paso === 1 && i === h.publicar ? "bg-sec/50" : "bg-sec/20"} ${sobre !== null && sobre !== i ? "opacity-70" : ""}`}
                style={{ height: `${Math.max(3, (v / max) * 100)}%`, animationDelay: `${i * 18}ms` }}
              />
            </div>
          ))}
          {sobre !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-[10px] border border-line bg-raised px-3 py-1.5 text-[12px] whitespace-nowrap"
              style={{ left: `${Math.min(88, Math.max(12, ((sobre + 0.5) / h.barras.length) * 100))}%` }}
            >
              <span className="text-text-2">{etiqueta(sobre)}</span>
              {conNumeros && <span className="font-medium"> · {num(h.barras[sobre])} conectados</span>}
            </div>
          )}
        </div>
        <div className="mt-2 flex gap-[3px] text-[11px] text-text-3 sm:gap-1">
          {h.barras.map((_, i) => (
            <span key={i} className="flex-1 overflow-visible text-center whitespace-nowrap">
              {h.paso === 3 ? `${i * 3} h` : i % 3 === 0 ? `${i} h` : ""}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-text-3">
        {actividad.fuente === "windsor"
          ? `${actividad.dia || "Promedio de los últimos días"}, en tu hora. Sale de tus datos de Windsor.`
          : `Leído de tu captura de Instagram${actividad.dia ? ` (${actividad.dia})` : ""}, así que es aproximado.`}
        {actividad.instagram_dice && ` Instagram dice que están más activos: ${actividad.instagram_dice}.`}
        {h.zonaDudosa && " No sé en qué zona horaria vienen estos datos: fijate que coincida con tu Instagram."}
      </p>
    </Tarjeta>
  );
}

/** Versión chica para Inicio. */
export function HoraParaPublicar({ actividad, i = 0 }: { actividad: Actividad | undefined; i?: number }) {
  const h = calcularHorario(actividad);
  if (!h) return null;
  const max = Math.max(...h.barras);
  return (
    <Link href="/metricas" className="block h-full">
      <Tarjeta i={i} className="flex h-full flex-col justify-between gap-4 !p-5 transition-colors hover:border-line-strong">
        <div>
          <p className="text-[13px] text-text-2">Mejor hora para publicar</p>
          <p className="mt-1 font-display text-[30px] leading-tight font-semibold tracking-[-0.03em]">{hora(h.publicar)}</p>
          <p className="text-[12px] text-text-3">Una hora antes de que se conecten más ({franja(h)})</p>
        </div>
        <div className="flex h-8 items-end gap-[2px]" aria-hidden>
          {h.barras.map((v, j) => (
            <div
              key={j}
              className={`subir flex-1 rounded-[2px] ${(h.paso === 3 ? j * 3 === h.desde : (j - h.desde + 24) % 24 < 3) ? "bg-c-aqua" : "bg-c-aqua/20"}`}
              style={{ height: `${Math.max(8, (v / max) * 100)}%`, animationDelay: `${j * 15}ms` }}
            />
          ))}
        </div>
      </Tarjeta>
    </Link>
  );
}
