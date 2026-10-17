"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Aviso, Boton, Campo, Copiar, Pagina, Pasos, Charla, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoCarrusel, ResultadoGuion } from "@/lib/agent/tasks";

const TRABAJO = { gancho: "Gancho", ejemplo: "Ejemplo", diagrama: "Diagrama", practica: "Práctico", cta: "CTA" } as const;

function Guiones() {
  const params = useSearchParams();
  const [creador, , listo] = useCreador();
  const [guardado, guardar] = useUltimo<ResultadoGuion>("guion");
  const [guardadoCar, guardarCar] = useUltimo<ResultadoCarrusel>("carrusel");
  const [idea, setIdea] = useState(params.get("idea") ?? "");
  const [formato, setFormato] = useState<"reel" | "carrusel">(params.get("formato") === "carrusel" ? "carrusel" : "reel");
  const agReel = useAgente<ResultadoGuion>("guion", guardar);
  const agCar = useAgente<ResultadoCarrusel>("carrusel", guardarCar);
  const ag = formato === "reel" ? agReel : agCar;
  const r = formato === "reel" ? agReel.resultado ?? (agReel.corriendo ? null : guardado) : null;
  const c = formato === "carrusel" ? agCar.resultado ?? (agCar.corriendo ? null : guardadoCar) : null;

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
        <div className="flex w-fit gap-1 rounded-full border border-line p-1 text-[14px]">
          {(["reel", "carrusel"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormato(f)}
              className={`rounded-full px-4 py-1.5 transition-colors ${formato === f ? "bg-text text-bg" : "text-text-2 hover:text-text"}`}
            >
              {f === "reel" ? "Reel" : "Carrusel"}
            </button>
          ))}
        </div>
        <Campo area label={formato === "reel" ? "¿Sobre qué es el reel?" : "¿Sobre qué es el carrusel?"} placeholder="Una idea, un tema o un hook que te guste" value={idea} onChange={(e) => setIdea(e.target.value)} />
        <Boton cargando={ag.corriendo} disabled={idea.trim().length < 3} onClick={() => ag.correr(creador, [], { idea })}>
          {formato === "reel" ? "Escribir guion" : "Idear carrusel"}
        </Boton>
      </Tarjeta>
      <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
      {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
      {ag.error && <Aviso>{ag.error}</Aviso>}
      {c && (
        <>
          <Tarjeta className="flex items-center justify-between gap-4">
            <p className="text-[17px] font-medium">{c.titulo}</p>
            <Copiar texto={c.slides.map((s) => `${s.numero}. ${s.texto}`).join("\n\n")} />
          </Tarjeta>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...c.slides].sort((a, b) => a.numero - b.numero).map((s, i) => (
              <Tarjeta key={s.numero} i={i} className="space-y-3">
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="flex size-6 items-center justify-center rounded-full bg-text font-medium text-bg">{s.numero}</span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{TRABAJO[s.trabajo]}</span>
                </div>
                <p className="text-[16px] leading-snug whitespace-pre-line">{s.texto}</p>
                <p className="text-[13px] text-text-2"><span className="text-text-3">Visual: </span>{s.visual}</p>
              </Tarjeta>
            ))}
          </div>
          <Tarjeta className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-medium">Caption</p>
              <Copiar texto={`${c.caption}\n\n${c.hashtags.join(" ")}`} />
            </div>
            <p className="text-[14px] whitespace-pre-line text-text-2">{c.caption}</p>
            <p className="text-[13px] text-text-3">{c.hashtags.join(" ")}</p>
          </Tarjeta>
        </>
      )}
      {r && (
        <>
          <div className="space-y-3">
            <p className="text-[17px] font-medium">3 hooks</p>
            {[...r.hooks].sort((a, b) => b.puntaje - a.puntaje).map((h, i) => (
              <Tarjeta key={i} i={i} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[16px]">“{h.texto}”</p>
                  <p className="mt-1.5 text-[13px] text-text-2">{h.formula} · {h.puntaje}/{h.puntaje > 10 ? 100 : 10} · {h.por_que}</p>
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
    <Pagina titulo="Contenido" bajada="De una idea a un reel listo para grabar o a un carrusel armado slide por slide, con tu forma de hablar.">
      <Suspense fallback={null}>
        <Guiones />
      </Suspense>
    </Pagina>
  );
}
