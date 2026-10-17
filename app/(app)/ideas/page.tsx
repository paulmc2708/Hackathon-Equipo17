"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Aviso, Boton, Pagina, Pasos, Charla, Subir, Tarjeta, Vacio } from "@/components/ui";
import type { Adjunto } from "@/lib/client/media";
import { claveUsuario, useCreador, useUltimo } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import { useEnFila } from "@/lib/client/cola";
import { EnFila } from "@/components/EnFila";
import type { ResultadoIdeas } from "@/lib/agent/tasks";
import { AnilloPotencial, nivelPotencial, potencial } from "@/components/Graficas";

const ETAPA = { atraer: "Atraer", confianza: "Confianza", vender: "Vender" } as const;

const cuando = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hoy = new Date().toDateString() === d.toDateString();
  return `${hoy ? "hoy" : d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })} a las ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
};

export default function Ideas() {
  const [creador, , listo] = useCreador();
  const usuario = claveUsuario(creador.usuario);
  const [guardado] = useUltimo<ResultadoIdeas>("ideas");
  // La búsqueda de las 7:00 (y la última que corriste vos) también queda en tu compu, para mostrarla con su hora.
  const [diaria, setDiaria] = useState<{ de: string; generado: string; resultado: ResultadoIdeas } | null>(null);
  useEffect(() => {
    if (!usuario) return;
    fetch(`/api/diario?usuario=${encodeURIComponent(usuario)}`, { cache: "no-store", signal: AbortSignal.timeout(15000) })
      .then((x) => x.json())
      .then((j) => setDiaria(j?.ideas?.resultado ? { de: usuario, generado: j.ideas.generado, resultado: j.ideas.resultado } : null))
      .catch(() => {});
  }, [usuario]);
  // Se guarda solo, en el navegador y en tu compu (lib/client/resultados.ts), aunque cambies de sección mientras busca.
  const ag = useAgente<ResultadoIdeas>("ideas");
  const enFila = useEnFila("ideas");
  const [seguidos, setSeguidos] = useState<Adjunto[]>([]);
  const deHoy = diaria?.de === usuario ? diaria : null;
  const r = ag.resultado ?? (ag.corriendo ? null : (deHoy?.resultado ?? guardado));

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
        <EnFila tarea="ideas" onAhora={() => ag.correr(creador, seguidos)} />
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {!r && !ag.corriendo && !ag.pasos.length && !enFila && (
          <Vacio titulo="Todavía no buscaste ideas" texto="Busco cuentas de tu nicho, encuentro los reels que les fueron muy por encima de su promedio y te digo cómo grabarlos vos." />
        )}
        {r && deHoy && !ag.resultado && <p className="text-[13px] text-text-3">Actualizado {cuando(deHoy.generado)}. Todos los días a las 7:00 te busco los reels que más anduvieron en tu nicho (activalo en Novedades del día).</p>}
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
