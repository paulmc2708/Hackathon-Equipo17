"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, Boton, Campo, Pagina, Pasos, Charla, Subir, Tarjeta, Vacio, Desplegable } from "@/components/ui";
import { useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import type { Adjunto } from "@/lib/client/media";
import type { ResultadoCompetencia } from "@/lib/agent/tasks";
import { COLORES_KPI } from "@/components/Graficas";

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

  // Acepta @usuario, usuario o el link del perfil (instagram.com/usuario/?igsh=…).
  const lista = [
    ...new Set(
      cuentas
        .split(/[\s,]+/)
        .map((c) => (c.match(/instagram\.com\/([\w.]+)/i)?.[1] ?? c).replace(/^@/, "").replace(/[^\w.]/g, "").slice(0, 30))
        .filter((c) => c && !["p", "reel", "reels", "stories", "explore"].includes(c.toLowerCase())),
    ),
  ].slice(0, 8);

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
          <Campo area maxLength={1500} label="¿Qué te gusta de ellas? (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: cómo arrancan los videos, los subtítulos, cómo venden sin parecer vendedores" />
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
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}

        {r && (
          <>
            <Tarjeta><p className="line-clamp-5 text-[16px] leading-relaxed sm:line-clamp-none">{r.resumen}</p></Tarjeta>

            <div className="space-y-3">
              <p className="pt-2 text-[17px] font-medium">Cuenta por cuenta</p>
              <div className="grid gap-3 lg:grid-cols-2">
                {r.cuentas.map((c, i) => (
                  <Tarjeta key={i} i={i} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold" style={{ background: COLORES_KPI[i % COLORES_KPI.length], color: i % COLORES_KPI.length === 3 ? "#111" : "#fff" }}>
                        {c.cuenta.replace(/^@/, "")[0]?.toUpperCase()}
                      </span>
                      <a href={`https://instagram.com/${c.cuenta.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="truncate text-[16px] font-medium hover:text-sec">
                        @{c.cuenta.replace(/^@/, "")}
                      </a>
                    </div>
                    <p className="line-clamp-3 text-[14px] text-text-2">{c.que_hace_bien}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...c.formatos, ...c.formulas_de_hook].slice(0, 5).map((t, k) => (
                        <span key={k} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-text-2">{t}</span>
                      ))}
                    </div>
                    <p className="mt-auto rounded-[14px] border border-sec/30 bg-sec/10 px-4 py-3 text-[14px]"><span className="font-medium text-sec">Para vos: </span>{c.que_adaptar_vos}</p>
                    <Desplegable tarjeta={false} titulo={<span className="text-[13px] font-normal text-text-3">Ver ritmo, cómo vende y datos</span>}>
                      <p><span className="text-text">Ritmo y edición: </span>{c.ritmo_y_edicion}</p>
                      <p className="mt-1"><span className="text-text">Cómo vende: </span>{c.como_vende}</p>
                      <p className="mt-1 text-text-3">Datos: {c.datos_usados}</p>
                    </Desplegable>
                  </Tarjeta>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Tarjeta className="space-y-3">
                <p className="text-[15px] font-medium">Lo que se repite</p>
                <ul className="space-y-2 text-[14px] text-text-2">
                  {r.patrones_comunes.map((p, k) => (
                    <li key={k} className="flex gap-2.5"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-c-azul" aria-hidden />{p}</li>
                  ))}
                </ul>
              </Tarjeta>
              <Tarjeta i={1} className="space-y-3">
                <p className="text-[15px] font-medium">Lo que nadie está haciendo</p>
                <ul className="space-y-2 text-[14px] text-text-2">
                  {r.oportunidades.map((p, k) => (
                    <li key={k} className="flex gap-2.5"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-c-aqua" aria-hidden />{p}</li>
                  ))}
                </ul>
              </Tarjeta>
            </div>

            <div className="space-y-3">
              <p className="pt-2 text-[17px] font-medium">Ideas para vos</p>
              {r.ideas.map((idea, i) => (
                <Tarjeta key={i} i={i} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-text-2">{ETAPA[idea.etapa]}</span>
                    <span className="text-text-3">inspirada en {idea.inspirada_en}</span>
                  </div>
                  <p className="text-[16px] font-medium">{idea.titulo}</p>
                  <p className="line-clamp-2 text-[14px] text-text-2">{idea.angulo_personal}</p>
                  <div className="flex flex-col gap-3 rounded-[14px] border border-sec/30 bg-sec/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
            </div>
            <Desplegable titulo="Qué no pude ver">
              <p>{r.limitaciones}</p>
            </Desplegable>
          </>
        )}
      </div>
    </Pagina>
  );
}
