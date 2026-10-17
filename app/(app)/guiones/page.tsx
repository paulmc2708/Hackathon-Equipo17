"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Aviso, Boton, Campo, Copiar, Pagina, Pasos, Preguntas, Tarjeta, Vacio } from "@/components/ui";
import { useClave, useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoGuion } from "@/lib/agent/tasks";

function Guiones() {
  const params = useSearchParams();
  const [creador, , listo] = useCreador();
  const [clave] = useClave();
  const [guardado, guardar] = useUltimo<ResultadoGuion>("guion");
  const [idea, setIdea] = useState(params.get("idea") ?? "");
  const ag = useAgente<ResultadoGuion>("guion", guardar);
  const r = ag.resultado ?? (ag.corriendo ? null : guardado);

  if (!listo) return null;
  if (!creador.usuario)
    return (
      <Vacio titulo="Primero contame quién sos" texto="Para escribir con tu voz necesito tus datos y 3 textos tuyos.">
        <Link href="/"><Boton>Completar mis datos</Boton></Link>
      </Vacio>
    );

  return (
    <div className="space-y-6">
      <Tarjeta className="space-y-4">
        <Campo area label="¿Sobre qué es el reel?" placeholder="Una idea, un tema o un hook que te guste" value={idea} onChange={(e) => setIdea(e.target.value)} />
        <Boton cargando={ag.corriendo} disabled={idea.trim().length < 3} onClick={() => ag.correr(creador, clave, [], { idea })}>
          Escribir guion
        </Boton>
      </Tarjeta>
      <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
      {ag.preguntas && <Preguntas preguntas={ag.preguntas.preguntas} porQue={ag.preguntas.por_que} onResponder={ag.responder} />}
      {ag.error && <Aviso>{ag.error}</Aviso>}
      {r && (
        <>
          <div className="space-y-3">
            <p className="text-[17px] font-medium">3 hooks</p>
            {[...r.hooks].sort((a, b) => b.puntaje - a.puntaje).map((h, i) => (
              <Tarjeta key={i} i={i} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[16px]">“{h.texto}”</p>
                  <p className="mt-1.5 text-[13px] text-text-2">{h.formula} · {h.puntaje}/10 · {h.por_que}</p>
                </div>
                <Copiar texto={h.texto} />
              </Tarjeta>
            ))}
          </div>
          <Tarjeta i={3}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[17px] font-medium">Guion</p>
              <Copiar texto={r.guion.map((g) => g.dice).join("\n")} />
            </div>
            <div className="divide-y divide-line">
              {r.guion.map((g, i) => (
                <div key={i} className="grid grid-cols-[64px_1fr] gap-4 py-3">
                  <span className="text-[13px] text-text-3">{g.segundos}</span>
                  <div>
                    <p className="text-[15px]">{g.dice}</p>
                    {g.en_pantalla && <p className="mt-1 text-[13px] text-text-2">En pantalla: {g.en_pantalla}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Tarjeta>
          <Tarjeta i={4} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-medium">Caption</p>
              <Copiar texto={`${r.caption}\n\n${r.hashtags.join(" ")}`} />
            </div>
            <p className="text-[14px] whitespace-pre-line text-text-2">{r.caption}</p>
            <p className="text-[13px] text-text-3">{r.hashtags.join(" ")}</p>
          </Tarjeta>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Pagina titulo="Contenido" bajada="De una idea a un reel listo para grabar, con tu forma de hablar.">
      <Suspense fallback={null}>
        <Guiones />
      </Suspense>
    </Pagina>
  );
}
