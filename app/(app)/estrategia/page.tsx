"use client";

// Estrategia: tu contenido como un embudo de ventas. La IA clasifica cada post; las cuentas las hace esta página.
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { Aviso, Boton, Charla, Desplegable, Pagina, Pasos, Tarjeta, Vacio } from "@/components/ui";
import { ChipSemaforo } from "@/components/Tablero";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import { useEnFila } from "@/lib/client/cola";
import { EnFila } from "@/components/EnFila";
import type { ResultadoEstrategia } from "@/lib/agent/tasks";
import type { Semaforo } from "@/lib/metricas/tablero";

type Etapa = ResultadoEstrategia["posts"][number]["etapa"];
const ETAPAS: { id: Etapa; nombre: string; para: string; color: string }[] = [
  { id: "descubrimiento", nombre: "Atraer", para: "que te conozca gente nueva", color: "var(--c-azul)" },
  { id: "confianza", nombre: "Confianza", para: "que te vean como el que sabe", color: "var(--c-aqua)" },
  { id: "captacion", nombre: "Captar", para: "que te dejen sus datos", color: "var(--c-amarillo)" },
  { id: "conversion", nombre: "Vender", para: "que te compren", color: "var(--c-magenta)" },
];
const FORMATO = { reel: "Reel", carrusel: "Carrusel", historia: "Historia" } as const;
const siNo = (v: boolean | null) => (v === null ? "No sé" : v ? "Sí" : "No");

function Embudo({ r }: { r: ResultadoEstrategia }) {
  const total = r.posts.length;
  const cuenta = (e: Etapa) => r.posts.filter((p) => p.etapa === e).length;
  const max = Math.max(1, ...ETAPAS.map((e) => cuenta(e.id)));
  const ventas = r.posts.filter((p) => p.etapa === "conversion" || p.cta === "comprar").length;
  const parte = total ? ventas / total : 0;
  const semaforo: Semaforo = !total ? "sin_dato" : parte > 0.25 ? "a_trabajar" : ventas === 0 ? "mejorable" : "bien";
  return (
    <Tarjeta className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[17px] font-medium">Tu embudo hoy</p>
        <span className="text-[12px] text-text-3">tus últimos {total} posts</span>
      </div>
      <div className="space-y-2.5">
        {ETAPAS.map((e, i) => {
          const n = cuenta(e.id);
          return (
            <div key={e.id} className="flex items-center gap-3">
              <div className="w-[92px] shrink-0 sm:w-[120px]">
                <p className="text-[14px] font-medium">{e.nombre}</p>
                <p className="hidden text-[11px] text-text-3 sm:block">{e.para}</p>
              </div>
              <div className="relative h-9 flex-1 overflow-hidden rounded-[10px] bg-raised" style={{ marginInline: `${i * 4}%` }}>
                <div className="crecer h-full rounded-[10px]" style={{ width: `${(n / max) * 100}%`, background: e.color, animationDelay: `${i * 90}ms` }} />
              </div>
              <p className="w-[64px] shrink-0 text-right text-[13px] text-text-2">
                {n} <span className="text-text-3">({total ? Math.round((n / total) * 100) : 0} %)</span>
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] text-text-2">
          {ventas === 0 ? "Ningún post pide la compra." : `${ventas} de ${total} posts piden la compra (1 de cada ${Math.max(1, Math.round(total / ventas))}).`} Lo sano es 1 cada 3 o 4 de valor.
        </p>
        <ChipSemaforo s={semaforo} />
      </div>
      <div className="flex flex-wrap gap-2 text-[13px]">
        <span className="rounded-full border border-line px-3 py-1 text-text-2">Regalo gratis: <span className="font-medium text-text">{siNo(r.tiene_regalo)}</span></span>
        <span className="rounded-full border border-line px-3 py-1 text-text-2">Lista propia (email, WhatsApp): <span className="font-medium text-text">{siNo(r.tiene_lista)}</span></span>
      </div>
    </Tarjeta>
  );
}

export default function Estrategia() {
  const [creador, , listo] = useCreador();
  const [guardado] = useUltimo<ResultadoEstrategia>("estrategia");
  // El resultado se guarda solo (lib/client/resultados.ts), aunque cambies de sección mientras analiza.
  const ag = useAgente<ResultadoEstrategia>("estrategia");
  const enFila = useEnFila("estrategia");
  const r = ag.resultado ?? (ag.corriendo ? null : guardado);

  if (!listo) return null;
  if (!creador.usuario)
    return (
      <Pagina titulo="Estrategia">
        <Vacio titulo="Primero contame quién sos" texto="Para armarte la estrategia necesito saber qué vendés y a quién.">
          <Link href="/"><Boton>Completar mis datos</Boton></Link>
        </Vacio>
      </Pagina>
    );

  return (
    <Pagina
      titulo="Estrategia"
      bajada="Tu contenido como un embudo: qué te trae gente, qué te da confianza y qué te hace vender."
      accion={
        <Boton cargando={ag.corriendo} onClick={() => ag.correr(creador)}>
          {r ? "Analizar de nuevo" : "Armar mi estrategia"}
        </Boton>
      }
    >
      <div className="space-y-6">
        <EnFila tarea="estrategia" onAhora={() => ag.correr(creador)} />
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && !enFila && (
          <Vacio titulo="Todavía no armamos tu estrategia" texto="Clasifico tus posts en atraer, confianza, captar y vender, te digo dónde se te rompe el embudo y qué publicar esta semana para vender lo que vendés." />
        )}
        {r && (
          <>
            <Tarjeta className="space-y-2" i={0}>
              <p className="text-[13px] font-medium text-sec">Lo que veo</p>
              <p className="text-[17px] leading-relaxed">{r.resumen}</p>
            </Tarjeta>

            <Embudo r={r} />

            {r.diagnostico.length > 0 && (
              <div className="space-y-3">
                <p className="pt-2 text-[17px] font-medium">Dónde se te rompe</p>
                <div className="grid gap-3 lg:grid-cols-3">
                  {r.diagnostico.slice(0, 3).map((d, i) => (
                    <Tarjeta key={i} i={i} className="space-y-2">
                      <p className="text-[15px] font-medium">{d.problema}</p>
                      <p className="text-[13px] text-text-2"><span className="font-medium text-text">Qué hacer: </span>{d.accion}</p>
                    </Tarjeta>
                  ))}
                </div>
              </div>
            )}

            {r.semana.length > 0 && (
              <div className="space-y-3">
                <p className="pt-2 text-[17px] font-medium">Qué publicar esta semana</p>
                <div className="grid gap-3 lg:grid-cols-2">
                  {r.semana.map((p, i) => {
                    const e = ETAPAS.find((x) => x.id === p.etapa)!;
                    return (
                      <Tarjeta key={i} i={i} className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-[12px]">
                          <span className="rounded-full px-2.5 py-0.5 font-medium" style={{ color: e.color, background: `color-mix(in oklab, ${e.color} 15%, transparent)` }}>{e.nombre}</span>
                          <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{FORMATO[p.formato]}</span>
                        </div>
                        <p className="text-[16px] leading-snug font-medium">{p.titulo}</p>
                        <p className="rounded-[14px] border border-sec/25 bg-sec/10 px-4 py-3 text-[14px]">“{p.hook}”</p>
                        <p className="text-[13px] text-text-2">{p.por_que}</p>
                        <Link
                          href={`/guiones?${p.formato === "carrusel" ? "formato=carrusel&" : ""}idea=${encodeURIComponent(`${p.titulo}. Hook: ${p.hook}. Para qué: ${e.para}.`)}`}
                          className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-sec hover:opacity-80"
                        >
                          {p.formato === "carrusel" ? "Armar el carrusel" : "Escribir el guion"} <ArrowRight size={14} />
                        </Link>
                      </Tarjeta>
                    );
                  })}
                </div>
              </div>
            )}

            {r.conceptos.length > 0 && (
              <Tarjeta className="space-y-4">
                <p className="flex items-center gap-2 text-[15px] font-medium">
                  <BookOpen size={16} className="text-sec" /> Ideas de los que saben, aplicadas a vos
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {r.conceptos.slice(0, 3).map((c, i) => (
                    <div key={i} className="space-y-1 rounded-[14px] bg-raised/60 px-4 py-3">
                      <p className="text-[14px] font-medium">{c.nombre}</p>
                      <p className="text-[12px] text-text-3">{c.autor}</p>
                      <p className="text-[13px] text-text-2">{c.para_vos}</p>
                    </div>
                  ))}
                </div>
              </Tarjeta>
            )}

            {r.posts.length > 0 && (
              <Desplegable titulo="Cómo clasifiqué cada post">
                <ul className="divide-y divide-line">
                  {r.posts.map((p, i) => {
                    const e = ETAPAS.find((x) => x.id === p.etapa)!;
                    return (
                      <li key={i} className="flex items-start justify-between gap-4 py-2.5">
                        <div className="min-w-0">
                          <p className="text-text">{p.titulo}</p>
                          <p className="text-[12px]">{p.por_que}</p>
                        </div>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: e.color, background: `color-mix(in oklab, ${e.color} 15%, transparent)` }}>{e.nombre}</span>
                          {/^https?:\/\//.test(p.url) && (
                            <a href={p.url} target="_blank" rel="noreferrer" className="text-text-3 hover:text-text" aria-label="Abrir publicación">
                              <ArrowUpRight size={14} />
                            </a>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Desplegable>
            )}
            {r.limitaciones && <p className="text-[12px] text-text-3">{r.limitaciones}</p>}
          </>
        )}
      </div>
    </Pagina>
  );
}
