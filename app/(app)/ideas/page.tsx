"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Aviso, Boton, Pagina, Pasos, Charla, Subir, Tarjeta, Vacio } from "@/components/ui";
import type { Adjunto } from "@/lib/client/media";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoIdeas } from "@/lib/agent/tasks";
import { AnilloPotencial, nivelPotencial, potencial } from "@/components/Graficas";

const ETAPA = { atraer: "Atraer", confianza: "Confianza", vender: "Vender" } as const;

export default function Ideas() {
  const [creador, , listo] = useCreador();
  const [guardado, guardar] = useUltimo<ResultadoIdeas>("ideas");
  const ag = useAgente<ResultadoIdeas>("ideas", guardar);
  const [seguidos, setSeguidos] = useState<Adjunto[]>([]);
  const r = ag.resultado ?? (ag.corriendo ? null : guardado);

  if (!listo) return null;
  if (!creador.usuario)
    return (
      <Pagina titulo="Ideas virales">
        <Vacio titulo="Primero contame quién sos" texto="Necesito tu nicho para buscar lo que funciona para gente como vos.">
          <Link href="/"><Boton>Completar mis datos</Boton></Link>
        </Vacio>
      </Pagina>
    );

  return (
    <Pagina
      titulo="Ideas virales"
      bajada="Lo que está funcionando ahora en tu nicho, adaptado a tu historia."
      accion={<Boton cargando={ag.corriendo} onClick={() => ag.correr(creador, seguidos)}>{r ? "Buscar de nuevo" : "Buscar ideas"}</Boton>}
    >
      <div className="space-y-6">
        {!ag.corriendo && (
          <Subir
            titulo="Las cuentas que ya seguís (opcional)"
            ayuda="Instagram no deja leer tu lista de Seguidos: pasame 1 o 2 capturas y uso los creadores de tu nicho."
            adjuntos={seguidos}
            onChange={setSeguidos}
            etiqueta={(f) => `captura de SU lista de Seguidos en Instagram (${f.name})`}
          />
        )}
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no buscaste ideas" texto="Busco cuentas de tu nicho, encuentro los reels que les fueron muy por encima de su promedio y te digo cómo grabarlos vos." />
        )}
        {r && (
          <div className="grid gap-3">
            {r.ideas
              .map((idea) => ({ idea, pot: potencial(idea.multiplicador) }))
              .sort((a, b) => (b.pot ?? -1) - (a.pot ?? -1))
              .map(({ idea, pot }, i) => (
              <Tarjeta key={i} i={i} className="space-y-4">
                <div className="flex items-start gap-4">
                  <AnilloPotencial valor={pot} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="font-medium text-sec">{pot === null ? "Sin datos para medirlo" : `Potencial ${nivelPotencial(pot).toLowerCase()}`}</span>
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{ETAPA[idea.etapa]}</span>
                    </div>
                    <p className="text-[17px] leading-snug font-medium">{idea.titulo}</p>
                    <p className="mt-1 text-[13px] text-text-2">
                      {idea.multiplicador !== null ? `A @${idea.cuenta.replace(/^@/, "")} le fue ${idea.multiplicador}x su promedio` : `De @${idea.cuenta.replace(/^@/, "")}`}
                      {idea.link && (
                        <a href={idea.link} target="_blank" rel="noreferrer" className="ml-1.5 inline-flex items-center gap-0.5 text-text-3 hover:text-text">
                          ver <ArrowUpRight size={12} />
                        </a>
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[14px] bg-raised px-4 py-3">
                    <p className="text-[12px] text-text-3">Por qué funcionó</p>
                    <p className="mt-0.5 line-clamp-3 text-[14px]">{idea.por_que_funciono}</p>
                  </div>
                  <div className="rounded-[14px] bg-raised px-4 py-3">
                    <p className="text-[12px] text-text-3">Cómo lo hacés vos</p>
                    <p className="mt-0.5 line-clamp-3 text-[14px]">{idea.angulo_personal}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 rounded-[14px] border border-sec/30 bg-sec/12 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px]">“{idea.hook_sugerido}”</p>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/guiones?idea=${encodeURIComponent(`${idea.titulo}. Ángulo: ${idea.angulo_personal}. Hook: ${idea.hook_sugerido}`)}`}>
                      <Boton>Escribir guion</Boton>
                    </Link>
                    <Link href={`/guiones?formato=carrusel&idea=${encodeURIComponent(`${idea.titulo}. Ángulo: ${idea.angulo_personal}. Gancho: ${idea.hook_sugerido}`)}`}>
                      <Boton variante="borde">Carrusel</Boton>
                    </Link>
                  </div>
                </div>
              </Tarjeta>
            ))}
            <p className="text-[12px] text-text-3">El potencial se calcula con el número real: cuántas veces ese reel superó el promedio de su cuenta. No lo estima la IA.</p>
            <p className="text-[12px] text-text-3">{r.limitaciones}</p>
          </div>
        )}
      </div>
    </Pagina>
  );
}
