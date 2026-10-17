"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Aviso, Boton, Pagina, Pasos, Preguntas, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoIdeas } from "@/lib/agent/tasks";

const ETAPA = { atraer: "Atraer", confianza: "Confianza", vender: "Vender" } as const;

export default function Ideas() {
  const [creador, , listo] = useCreador();
  const [guardado, guardar] = useUltimo<ResultadoIdeas>("ideas");
  const ag = useAgente<ResultadoIdeas>("ideas", guardar);
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
      accion={<Boton cargando={ag.corriendo} onClick={() => ag.correr(creador)}>{r ? "Buscar de nuevo" : "Buscar ideas"}</Boton>}
    >
      <div className="space-y-6">
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.preguntas && <Preguntas preguntas={ag.preguntas.preguntas} porQue={ag.preguntas.por_que} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no buscaste ideas" texto="Busco cuentas de tu nicho, encuentro los reels que les fueron muy por encima de su promedio y te digo cómo grabarlos vos." />
        )}
        {r && (
          <div className="grid gap-3">
            {r.ideas.map((idea, i) => (
              <Tarjeta key={i} i={i} className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{ETAPA[idea.etapa]}</span>
                      {idea.multiplicador !== null && (
                        <span className="rounded-full bg-text px-2.5 py-0.5 font-medium text-bg">{idea.multiplicador}x su promedio</span>
                      )}
                      <span className="text-text-3">{idea.metrica}</span>
                    </div>
                    <p className="text-[17px] font-medium">{idea.titulo}</p>
                  </div>
                  {idea.link && (
                    <a href={idea.link} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-[13px] text-text-2 hover:text-text">
                      @{idea.cuenta.replace(/^@/, "")} <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
                <p className="text-[14px] text-text-2"><span className="text-text">Por qué funcionó:</span> {idea.por_que_funciono}</p>
                <p className="text-[14px] text-text-2"><span className="text-text">Tu ángulo:</span> {idea.angulo_personal}</p>
                <div className="flex items-center justify-between gap-4 rounded-[14px] bg-raised px-4 py-3">
                  <p className="text-[14px]">“{idea.hook_sugerido}”</p>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/guiones?idea=${encodeURIComponent(`${idea.titulo}. Ángulo: ${idea.angulo_personal}. Hook: ${idea.hook_sugerido}`)}`}>
                      <Boton variante="borde">Reel</Boton>
                    </Link>
                    <Link href={`/guiones?formato=carrusel&idea=${encodeURIComponent(`${idea.titulo}. Ángulo: ${idea.angulo_personal}. Gancho: ${idea.hook_sugerido}`)}`}>
                      <Boton variante="borde">Carrusel</Boton>
                    </Link>
                  </div>
                </div>
              </Tarjeta>
            ))}
            <p className="text-[12px] text-text-3">{r.limitaciones}</p>
          </div>
        )}
      </div>
    </Pagina>
  );
}
