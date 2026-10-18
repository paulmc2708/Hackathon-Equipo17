"use client";

// Análisis automático: apenas conectás Windsor, la app analiza tu cuenta entera, de a una sección, sin que toques nada.
// Vive en el layout (sigue mientras navegás) y muestra el avance en un cartel chico abajo a la derecha, arriba del chat.
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, CircleAlert, Clock, Loader2, MessageCircleQuestion, Pause, Play, RotateCcw, X } from "lucide-react";
import { useWindsorConectado } from "@/components/CuentaWindsor";
import { useCuenta } from "@/lib/client/useCuenta";
import { claveUsuario, useCreador } from "@/lib/client/store";
import { avanzar, cancelar, cerrar, faltaCuenta, pausar, prepararCola, reintentar, seguir, SECCIONES, useCola, type Cola, type PasoCola } from "@/lib/client/cola";
import { claveCorrida, correr, estadoDe, modoDemo, suscribir } from "@/lib/client/ejecutor";
import { intentoReciente, marcarIntento } from "@/lib/client/useCuentaInstagram";
import { SIN_USUARIO } from "@/lib/agent/tasks";

// Recién volvió de conectar Windsor: se analiza todo apenas se sepa de qué cuenta es.
const PEDIDO = "analisis-pedido";
const ABIERTO = "analisis-abierto";

export function AnalisisAutomatico() {
  const [creador, , listo] = useCreador();
  const { conectado: windsor, cuenta: cuentaW } = useWindsorConectado();
  const { cuenta: claude } = useCuenta();
  const u = claveUsuario(creador.usuario);
  const conClaude = Boolean(claude?.conectado);

  // Vuelta de Windsor (?windsor=ok): se anota el pedido y se limpia la dirección, así recargar no lo repite.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("windsor") !== "ok") return;
    try {
      localStorage.setItem(PEDIDO, "1");
      localStorage.setItem(ABIERTO, "1");
    } catch {}
    // Después de que Puerta lea el ?windsor=ok (sale del modo demo).
    const t = setTimeout(() => {
      q.delete("windsor");
      window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}`);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!listo || windsor !== true || !conClaude || modoDemo()) return;
    // Sin usuario todavía: primero se trae de Windsor quién sos (como mucho una vez cada 10 minutos).
    if (!u) {
      if (!intentoReciente()) {
        marcarIntento();
        void correr({ tarea: "cuenta", creador: { ...creador, usuario: SIN_USUARIO }, origen: "cola" });
      }
      return;
    }
    // Estás viendo otra cuenta que la de Windsor (por ejemplo, la del jurado): no se analiza sola.
    if (cuentaW && cuentaW !== u) return;
    let vivo = true;
    (async () => {
      let pedido = false;
      try {
        pedido = localStorage.getItem(PEDIDO) === "1";
      } catch {}
      const cola = await prepararCola(u, { todo: pedido, cuentaW });
      try {
        if (pedido) localStorage.removeItem(PEDIDO);
      } catch {}
      if (!vivo || !cola) return;
      // Nada pendiente pero falta el nombre o la foto: se traen solos, como siempre (una vez cada 10 minutos).
      if (!cola.pasos.some((p) => p.estado === "pendiente") && faltaCuenta(creador, cuentaW) && !intentoReciente()) {
        marcarIntento();
        void correr({ tarea: "cuenta", creador, origen: "cola" });
      }
      void avanzar(u);
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, windsor, conClaude, u, cuentaW]);

  const cola = useCola();
  if (!cola || cola.cancelada || cola.cerrada || !cola.pasos.length) return null;
  if (cuentaW && cuentaW !== claveUsuario(cola.usuario)) return null;
  return <Avance cola={cola} />;
}

const ESTADO: Record<PasoCola["estado"], string> = {
  pendiente: "En la fila",
  corriendo: "Analizando…",
  listo: "Listo",
  preguntas: "Te pregunta algo",
  error: "No pude",
};

function Icono({ estado }: { estado: PasoCola["estado"] }) {
  const base = "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full";
  if (estado === "listo") return <span className={`${base} bg-good/15 text-good`}><Check size={12} strokeWidth={2.5} /></span>;
  if (estado === "corriendo") return <span className={`${base} border border-line-strong text-text`}><Loader2 size={12} className="animate-spin" /></span>;
  if (estado === "preguntas") return <span className={`${base} bg-c-azul/15 text-c-azul`}><MessageCircleQuestion size={12} strokeWidth={2} /></span>;
  if (estado === "error") return <span className={`${base} bg-bad/15 text-bad`}><CircleAlert size={12} strokeWidth={2} /></span>;
  return <span className={`${base} border border-line text-text-3`}><Clock size={11} strokeWidth={2} /></span>;
}

/** Anillo chico con cuánto va. */
function Anillito({ valor, tam = 28 }: { valor: number; tam?: number }) {
  const r = tam / 2 - 3;
  const largo = 2 * Math.PI * r;
  return (
    <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={3} />
      <circle
        cx={tam / 2}
        cy={tam / 2}
        r={r}
        fill="none"
        stroke="var(--c-azul)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={largo}
        strokeDashoffset={largo * (1 - Math.min(1, Math.max(0, valor)))}
        className="transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}

const SIN_CORRIDA = null;

function Avance({ cola }: { cola: Cola }) {
  const u = claveUsuario(cola.usuario);
  const [abierto, setAbiertoEstado] = useState(true);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setAbiertoEstado(localStorage.getItem(ABIERTO) !== "0");
      } catch {}
    });
  }, []);
  const setAbierto = (v: boolean) => {
    setAbiertoEstado(v);
    try {
      localStorage.setItem(ABIERTO, v ? "1" : "0");
    } catch {}
  };

  const actual = cola.pasos.find((p) => p.estado === "corriendo");
  const clave = actual ? claveCorrida(u, actual.tarea) : "";
  // El último paso en vivo de lo que se está analizando ("Leyendo tus métricas de Windsor…").
  const vivo = useSyncExternalStore(suscribir, () => (clave ? estadoDe(clave) : SIN_CORRIDA), () => SIN_CORRIDA);
  const ultimoPaso = vivo?.corriendo ? vivo.pasos.at(-1) : undefined;

  const total = cola.pasos.length;
  const terminados = cola.pasos.filter((p) => p.estado !== "pendiente" && p.estado !== "corriendo").length;
  const terminado = terminados === total;
  const listos = cola.pasos.filter((p) => p.estado === "listo").length;
  const conPregunta = cola.pasos.filter((p) => p.estado === "preguntas").length;
  const windsorDe = cola.motivo?.startsWith("windsor:") ? cola.motivo.slice(8) : "";
  const titulo = terminado ? "Listo: analicé tu cuenta" : cola.motivo ? "Frené el análisis" : cola.pausada ? "Análisis en pausa" : "Analizando tu cuenta";
  const linea = terminado
    ? listos < total
      ? `${listos} de ${total} listos${conPregunta ? ` · ${conPregunta} ${conPregunta === 1 ? "te pregunta" : "te preguntan"} algo` : ""}`
      : "Tocá cada sección para ver lo que encontré"
    : actual
      ? `${terminados + 1} de ${total} · ${SECCIONES[actual.tarea].nombre}`
      : `${terminados} de ${total} listos`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {abierto ? (
        <motion.section
          key="abierto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Análisis automático de tu cuenta"
          className="vidrio vidrio-fuerte pointer-events-auto w-full rounded-[20px] p-4"
        >
          <div className="flex items-start gap-3">
            <span className="relative flex items-center justify-center">
              <Anillito valor={terminados / total} />
              {actual && !cola.pausada && <span className="absolute size-1.5 animate-pulse rounded-full bg-c-azul" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">{titulo}</p>
              <p className="truncate text-[12px] text-text-2">{linea}</p>
            </div>
            {terminado ? (
              <button onClick={() => cerrar(u)} aria-label="Cerrar" className="flex size-8 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-raised hover:text-text">
                <X size={16} />
              </button>
            ) : (
              <button onClick={() => setAbierto(false)} aria-label="Achicar" className="flex size-8 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-raised hover:text-text">
                <ChevronDown size={16} />
              </button>
            )}
          </div>
          {!terminado && !cola.motivo && <p className="mt-2 text-[12px] text-text-3">Va solo, de a una sección. Podés seguir usando la app.</p>}
          {cola.motivo && (
            <p className="mt-2 text-[12px] text-text-2">
              {windsorDe ? `Tus métricas de Windsor son de @${windsorDe}: abrí esa cuenta en Inicio y sigo solo.` : "Conectá tu cuenta de Claude en Conexiones y sigo."}
            </p>
          )}
          <ol className="mt-3 max-h-[46vh] space-y-0.5 overflow-y-auto border-t border-line pt-2">
            {cola.pasos.map((p) => {
              const s = SECCIONES[p.tarea];
              const hecho = p.estado === "listo" || p.estado === "preguntas" || p.estado === "error";
              return (
                <li key={p.tarea} className="flex items-start gap-3 py-1.5">
                  <Icono estado={p.estado} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      {hecho ? (
                        <Link href={s.href} className="truncate text-[14px] text-text underline-offset-4 hover:underline">
                          {s.nombre}
                        </Link>
                      ) : (
                        <span className={`truncate text-[14px] ${p.estado === "corriendo" ? "text-text" : "text-text-2"}`}>{s.nombre}</span>
                      )}
                      {p.estado === "error" ? (
                        <button onClick={() => reintentar(u, p.tarea)} className="inline-flex shrink-0 items-center gap-1 text-[12px] text-bad hover:opacity-80">
                          No pude: reintentar <RotateCcw size={11} />
                        </button>
                      ) : (
                        <span className={`shrink-0 text-[12px] ${p.estado === "preguntas" ? "text-c-azul" : "text-text-3"}`}>{ESTADO[p.estado]}</span>
                      )}
                    </div>
                    {p.estado === "corriendo" && ultimoPaso && <p className="truncate text-[12px] text-text-3">{ultimoPaso}</p>}
                    {p.estado === "error" && p.error && <p className="line-clamp-2 text-[12px] text-text-3">{p.error}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          {!terminado && (
            <div className="mt-3 flex gap-2 border-t border-line pt-3">
              {cola.pausada || cola.motivo ? (
                <button onClick={() => seguir(u)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12px] text-text transition-colors hover:bg-raised">
                  <Play size={12} /> Seguir
                </button>
              ) : (
                <button onClick={() => pausar(u)} title="Termino lo que estoy analizando y freno" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12px] text-text-2 transition-colors hover:bg-raised hover:text-text">
                  <Pause size={12} /> Pausar
                </button>
              )}
              <button onClick={() => cancelar(u)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] text-text-3 transition-colors hover:bg-raised hover:text-text">
                <X size={12} /> Cancelar
              </button>
            </div>
          )}
        </motion.section>
      ) : (
        <motion.button
          key="cerrado"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => setAbierto(true)}
          aria-label={`${titulo}. ${linea}. Ver el avance`}
          className="vidrio vidrio-fuerte pointer-events-auto flex h-12 items-center gap-3 rounded-full pr-1.5 pl-2.5 max-md:w-12 max-md:justify-center max-md:p-0 md:pr-4"
        >
          <span className="relative flex items-center justify-center">
            <Anillito valor={terminados / total} />
            {actual && !cola.pausada && <span className="absolute size-1.5 animate-pulse rounded-full bg-c-azul" aria-hidden />}
          </span>
          <span className="min-w-0 text-left max-md:hidden">
            <span className="block text-[13px] leading-tight font-medium">{titulo}</span>
            <span className="block max-w-[220px] truncate text-[12px] leading-tight text-text-2">{linea}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
