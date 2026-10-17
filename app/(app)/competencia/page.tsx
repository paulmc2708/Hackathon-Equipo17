"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, Boton, Campo, Pagina, Pasos, Preguntas, Subir, Tarjeta, Vacio } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { Adjunto } from "@/lib/client/media";
import type { ResultadoCompetencia } from "@/lib/agent/tasks";

const ETAPA = { atraer: "Atraer", confianza: "Confianza", vender: "Vender" } as const;

export default function Competencia() {
  const [creador, , listo] = useCreador();
  const [guardado, guardar] = useUltimo<ResultadoCompetencia>("competencia");
  const [cuentas, setCuentas] = useState("");
  const [notas, setNotas] = useState("");
  const [fotos, setFotos] = useState<Adjunto[]>([]);
  const [videos, setVideos] = useState<Adjunto[]>([]);
  const ag = useAgente<ResultadoCompetencia>("competencia", guardar);
  const r = ag.resultado ?? (ag.corriendo ? null : guardado);

  if (!listo) return null;
  if (!creador.usuario)
    return (
      <Pagina titulo="Competencia">
        <Vacio titulo="Primero contame quién sos" texto="Para compararte con otros necesito saber a qué te dedicás y qué vendés.">
          <Link href="/"><Boton>Completar mis datos</Boton></Link>
        </Vacio>
      </Pagina>
    );

  const lista = cuentas.split(/[\s,]+/).map((c) => c.replace(/^@/, "").trim()).filter(Boolean).slice(0, 8);

  return (
    <Pagina titulo="Competencia" bajada="Mirá qué hacen las cuentas que te gustan, qué les funciona y qué podés hacer vos mejor.">
      <div className="space-y-6">
        <Tarjeta className="space-y-5">
          <Campo
            label="Cuentas que te interesan"
            placeholder="@cuenta1, @cuenta2, @cuenta3"
            value={cuentas}
            onChange={(e) => setCuentas(e.target.value)}
            ayuda="Hasta 8. Si no ponés ninguna, te propongo yo cuentas de tu nicho."
          />
          <Campo area label="¿Qué te gusta de ellas? (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: cómo arrancan los videos, los subtítulos, cómo venden sin parecer vendedores" />
          <Subir
            titulo="Capturas de esos perfiles (recomendado)"
            ayuda="La parte de arriba y la grilla. Así veo números reales aunque la cuenta no sea profesional."
            adjuntos={fotos}
            onChange={setFotos}
            etiqueta={(f) => `captura de un perfil de referencia (${f.name})`}
          />
          <Subir
            videos
            titulo="Videos que te gustan (opcional)"
            ayuda="Hasta 2. Miro cómo arrancan, el ritmo y la edición."
            adjuntos={videos}
            onChange={setVideos}
            etiqueta={(f) => `video de referencia que le gusta (${f.name})`}
          />
          <Boton cargando={ag.corriendo} onClick={() => ag.correr(creador, [...fotos, ...videos], { cuentas: lista, notas })}>
            {r ? "Analizar de nuevo" : "Analizar competencia"}
          </Boton>
        </Tarjeta>

        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.preguntas && <Preguntas preguntas={ag.preguntas.preguntas} porQue={ag.preguntas.por_que} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}

        {r && (
          <>
            <Tarjeta><p className="text-[16px] leading-relaxed text-text-2">{r.resumen}</p></Tarjeta>

            <div className="space-y-3">
              <p className="pt-2 text-[17px] font-medium">Cuenta por cuenta</p>
              {r.cuentas.map((c, i) => (
                <Tarjeta key={i} i={i} className="space-y-3">
                  <p className="text-[17px] font-medium">@{c.cuenta.replace(/^@/, "")}</p>
                  <p className="text-[14px] text-text-2"><span className="text-text">Qué hace bien:</span> {c.que_hace_bien}</p>
                  <p className="text-[14px] text-text-2"><span className="text-text">Ritmo y edición:</span> {c.ritmo_y_edicion}</p>
                  <p className="text-[14px] text-text-2"><span className="text-text">Cómo vende:</span> {c.como_vende}</p>
                  <div className="flex flex-wrap gap-2">
                    {[...c.formatos, ...c.formulas_de_hook].map((t) => (
                      <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-text-2">{t}</span>
                    ))}
                  </div>
                  <p className="rounded-[14px] bg-raised px-4 py-3 text-[14px]"><span className="text-text-2">Para vos: </span>{c.que_adaptar_vos}</p>
                  <p className="text-[12px] text-text-3">Datos: {c.datos_usados}</p>
                </Tarjeta>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Tarjeta className="space-y-2">
                <p className="text-[15px] font-medium">Lo que se repite</p>
                <ul className="space-y-1.5 text-[14px] text-text-2">{r.patrones_comunes.map((p) => <li key={p}>· {p}</li>)}</ul>
              </Tarjeta>
              <Tarjeta i={1} className="space-y-2">
                <p className="text-[15px] font-medium">Lo que nadie está haciendo</p>
                <ul className="space-y-1.5 text-[14px] text-text-2">{r.oportunidades.map((p) => <li key={p}>· {p}</li>)}</ul>
              </Tarjeta>
            </div>

            <div className="space-y-3">
              <p className="pt-2 text-[17px] font-medium">Ideas para vos</p>
              {r.ideas.map((idea, i) => (
                <Tarjeta key={i} i={i} className="space-y-3">
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{ETAPA[idea.etapa]}</span>
                    <span className="text-text-3">inspirada en {idea.inspirada_en}</span>
                  </div>
                  <p className="text-[16px] font-medium">{idea.titulo}</p>
                  <p className="text-[14px] text-text-2">{idea.angulo_personal}</p>
                  <div className="flex items-center justify-between gap-4 rounded-[14px] bg-raised px-4 py-3">
                    <p className="text-[14px]">“{idea.hook_sugerido}”</p>
                    <Link href={`/guiones?idea=${encodeURIComponent(`${idea.titulo}. Ángulo: ${idea.angulo_personal}. Hook: ${idea.hook_sugerido}`)}`}>
                      <Boton variante="borde" className="shrink-0">Escribir guion</Boton>
                    </Link>
                  </div>
                </Tarjeta>
              ))}
            </div>
            <p className="text-[12px] text-text-3">{r.limitaciones}</p>
          </>
        )}
      </div>
    </Pagina>
  );
}
