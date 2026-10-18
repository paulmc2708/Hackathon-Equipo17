"use client";

// El chat con el agente de cada área: un panel a la derecha (⌘J) que habla con el agente de la sección
// en la que estás, con lo que ya analizó de tu cuenta como contexto. Cada agente tiene su propia charla.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUp, BookOpen, Bot, Calculator, Library, MessageCircle, RotateCcw, X } from "lucide-react";
import { AGENTES, agenteDe, investigacionDe, resumenInvestigacion } from "@/lib/agentes";
import { claveUsuario, useCreador, useGuardado } from "@/lib/client/store";
import { colorDe, textoSobre } from "@/lib/client/secciones";
import { useAgente } from "@/lib/client/useAgente";
import type { ResultadoChat } from "@/lib/agent/tasks";

type Mensaje = { rol: "persona" | "agente"; texto: string; acciones?: ResultadoChat["acciones"] };

const DESTINO: Record<ResultadoChat["acciones"][number]["destino"], (idea: string) => string> = {
  perfil: () => "/perfil",
  metricas: () => "/metricas",
  reels: () => "/reels",
  ideas: () => "/ideas",
  competencia: () => "/competencia",
  guion: (idea) => (idea ? `/guiones?idea=${encodeURIComponent(idea)}` : "/guiones"),
  novedades: () => "/novedades",
};

/** Lo que ya se analizó de la cuenta, compacto, para que el agente conteste con eso. */
function contexto(usuario: string, lee: string[]) {
  const partes: string[] = [];
  for (const t of lee) {
    let v: Record<string, unknown> | null = null;
    try {
      v = JSON.parse(localStorage.getItem(`resultado-${usuario}-${t}`) ?? "null");
    } catch {}
    if (!v) continue;
    if (t === "metricas") {
      const tab = v.tablero as { puntaje?: unknown; indicadores?: unknown; problemas?: unknown; buenos?: unknown } | undefined;
      v = { periodo: v.periodo, resumen: v.resumen, puntaje: tab?.puntaje, indicadores: tab?.indicadores, problemas: tab?.problemas, buenos: tab?.buenos, bien: v.bien, mal: v.mal, kpis: v.kpis, plan: v.plan, publicaciones: v.publicaciones, actividad: v.actividad };
    }
    if (t === "reels" && Array.isArray(v.reels)) {
      v = { reels: (v.reels as Record<string, unknown>[]).map(({ caption, fecha, vistas, multiplicador, tiempo_promedio_s, salteo_pct, compartidos, guardados }) => ({ caption, fecha, vistas, multiplicador, tiempo_promedio_s, salteo_pct, compartidos, guardados })) };
    }
    partes.push(`[${t}]\n${JSON.stringify(v).slice(0, 6000)}`);
  }
  return partes.join("\n\n");
}

export function ChatAgente() {
  const path = usePathname();
  const id = agenteDe(path);
  const a = AGENTES[id];
  const [creador] = useCreador();
  const u = claveUsuario(creador.usuario);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [verSabe, setVerSabe] = useState(false);
  const [mensajes, setMensajes] = useGuardado<Mensaje[]>(`chat-${u || "_"}-${id}`, []);
  const ultimos = useRef<Mensaje[]>([]);
  useEffect(() => {
    ultimos.current = mensajes;
  }, [mensajes]);
  const ag = useAgente<ResultadoChat>("chat", (r) => setMensajes([...ultimos.current, { rol: "agente" as const, texto: r.respuesta, acciones: r.acciones }].slice(-20)));
  const fin = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLTextAreaElement>(null);

  // ⌘J (o Ctrl+J) abre y cierra el chat; Escape lo cierra.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setAbierto((v) => !v);
      } else if (e.key === "Escape") setAbierto(false);
    };
    const abrir = () => setAbierto(true);
    window.addEventListener("keydown", tecla);
    window.addEventListener("chat:abrir", abrir);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("chat:abrir", abrir);
    };
  }, []);
  useEffect(() => {
    if (abierto) setTimeout(() => caja.current?.focus(), 200);
  }, [abierto, id]);
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, ag.corriendo, abierto]);

  if (!creador.usuario) return null;

  const enviar = (t = texto) => {
    const limpio = t.trim();
    if (!limpio || ag.corriendo) return;
    const nuevos = [...mensajes, { rol: "persona" as const, texto: limpio }].slice(-20);
    setMensajes(nuevos);
    setTexto("");
    ag.correr(creador, [], { agente: id, mensajes: nuevos.map(({ rol, texto }) => ({ rol, texto })), contexto: contexto(u, a.lee) });
  };
  const color = colorDe(path);
  const estilo = { "--sec": color, "--sec-texto": textoSobre(color) } as React.CSSProperties;
  const pensando = ag.pasos.at(-1);

  return (
    <div style={estilo}>
      <AnimatePresence>
        {!abierto && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={() => setAbierto(true)}
            className="fixed right-4 bottom-4 z-40 flex h-12 items-center gap-2 rounded-full bg-sec px-4 text-[14px] font-medium text-[var(--sec-texto,#fff)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] transition-opacity hover:opacity-90 md:right-6 md:bottom-6"
            aria-label={`Hablar con ${a.nombre}`}
          >
            <MessageCircle size={18} strokeWidth={2} />
            <span className="hidden sm:inline">Hablá con tu {a.nombre.toLowerCase()}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {abierto && (
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="vidrio vidrio-fuerte fixed inset-y-0 right-0 z-[45] flex w-full flex-col border-l border-line sm:inset-y-4 sm:right-4 sm:w-[420px] sm:rounded-[24px] sm:border"
            role="dialog"
            aria-label={`Chat con ${a.nombre}`}
          >
            <header className="flex items-start gap-3 border-b border-line px-5 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-sec/15 text-sec">
                <Bot size={19} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">{a.nombre}</p>
                <p className="line-clamp-2 text-[12px] text-text-2">{a.rol}</p>
              </div>
              {mensajes.length > 0 && (
                <button onClick={() => setVerSabe((v) => !v)} className={`rounded-full p-2 hover:bg-raised hover:text-text ${verSabe ? "text-sec" : "text-text-3"}`} title="Lo que sabe" aria-label="Lo que sabe este agente" aria-pressed={verSabe}>
                  <BookOpen size={15} />
                </button>
              )}
              {mensajes.length > 0 && (
                <button onClick={() => setMensajes([])} className="rounded-full p-2 text-text-3 hover:bg-raised hover:text-text" title="Nueva charla" aria-label="Nueva charla">
                  <RotateCcw size={15} />
                </button>
              )}
              <button onClick={() => setAbierto(false)} className="rounded-full p-2 text-text-3 hover:bg-raised hover:text-text" aria-label="Cerrar">
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {(verSabe || !mensajes.length) && (
                <div className="space-y-3 rounded-[16px] border border-sec/25 bg-sec/[0.06] px-4 py-3">
                  <p className="text-[12px] font-medium text-sec">Lo que sabe</p>
                  <ul className="space-y-1.5">
                    {a.sabe.map((x) => (
                      <li key={x} className="flex gap-2 text-[13px]">
                        <BookOpen size={14} className="mt-0.5 shrink-0 text-sec" />
                        {x}
                      </li>
                    ))}
                  </ul>
                  {investigacionDe(id) && (
                    <>
                      <p className="pt-1 text-[12px] font-medium text-sec">Su investigación (fuentes reales, 2025-2026 primero)</p>
                      <p className="flex gap-2 text-[13px]">
                        <Library size={14} className="mt-0.5 shrink-0 text-sec" />
                        {resumenInvestigacion(id)}
                      </p>
                    </>
                  )}
                  {a.calcula.length > 0 && (
                    <>
                      <p className="pt-1 text-[12px] font-medium text-sec">Lo que calcula con código (no lo inventa)</p>
                      <ul className="space-y-1.5">
                        {a.calcula.map((x) => (
                          <li key={x} className="flex gap-2 text-[13px]">
                            <Calculator size={14} className="mt-0.5 shrink-0 text-sec" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
              {!mensajes.length && (
                <div className="space-y-4">
                  <p className="rounded-[16px] rounded-tl-[6px] bg-raised px-4 py-3 text-[14px]">{a.saludo}</p>
                  <div className="flex flex-col items-start gap-2">
                    {a.sugerencias.map((s) => (
                      <button key={s} onClick={() => enviar(s)} className="rounded-full border border-line px-3 py-1.5 text-left text-[13px] text-text-2 transition-colors hover:border-sec/50 hover:text-text">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mensajes.map((m, i) =>
                m.rol === "persona" ? (
                  <p key={i} className="ml-auto w-fit max-w-[85%] rounded-[16px] rounded-tr-[6px] bg-sec/15 px-4 py-2.5 text-[14px] whitespace-pre-wrap">
                    {m.texto}
                  </p>
                ) : (
                  <div key={i} className="max-w-[92%] space-y-2">
                    <p className="rounded-[16px] rounded-tl-[6px] bg-raised px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                    {!!m.acciones?.length && (
                      <div className="flex flex-wrap gap-2">
                        {m.acciones.slice(0, 2).map((x, j) => (
                          <Link key={j} href={DESTINO[x.destino](x.idea)} onClick={() => setAbierto(false)} className="inline-flex items-center gap-1.5 rounded-full bg-sec px-3 py-1.5 text-[13px] font-medium text-[var(--sec-texto,#fff)] hover:opacity-90">
                            {x.texto} <ArrowRight size={13} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )}
              {ag.corriendo && (
                <div className="flex w-fit items-center gap-2 rounded-[16px] rounded-tl-[6px] bg-raised px-4 py-3 text-[13px] text-text-2">
                  <span className="flex gap-1" aria-hidden>
                    {[0, 1, 2].map((k) => (
                      <span key={k} className="size-1.5 animate-pulse rounded-full bg-sec" style={{ animationDelay: `${k * 160}ms` }} />
                    ))}
                  </span>
                  {pensando && !/^Armando/.test(pensando) ? pensando : "Pensando…"}
                </div>
              )}
              {(ag.error || ag.mensaje) && !ag.corriendo && (
                <p className="rounded-[16px] rounded-tl-[6px] bg-raised px-4 py-3 text-[14px] text-text-2">{ag.error || ag.mensaje}</p>
              )}
              <div ref={fin} />
            </div>

            <form
              className="border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                enviar();
              }}
            >
              <div className="flex items-end gap-2 rounded-[16px] border border-line bg-bg p-2 focus-within:border-line-strong">
                <textarea
                  ref={caja}
                  rows={1}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  placeholder={`Preguntale a tu ${a.nombre.toLowerCase()}…`}
                  aria-label="Mensaje"
                  className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] outline-none placeholder:text-text-3"
                />
                <button type="submit" disabled={!texto.trim() || ag.corriendo} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sec text-[var(--sec-texto,#fff)] transition-opacity disabled:opacity-30" aria-label="Enviar">
                  <ArrowUp size={17} strokeWidth={2.2} />
                </button>
              </div>
              <p className="mt-2 px-1 text-[11px] text-text-3">Contesta con tus datos y lo que ya analizó. ⌘J abre y cierra.</p>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
