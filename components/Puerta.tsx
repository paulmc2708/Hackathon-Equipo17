"use client";

// Antes de entrar: conectar Claude (el motor) e Instagram (Windsor). Después, un recorrido corto por las secciones.
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BarChart3, Check, Lightbulb, PenLine, UserRound, type LucideIcon } from "lucide-react";
import { LogoHookia, NombreHookia } from "@/components/Logo";
import { CuentaClaude } from "@/components/CuentaClaude";
import { CuentaWindsor, useWindsorConectado } from "@/components/CuentaWindsor";
import { useCuenta } from "@/lib/client/useCuenta";
import { useCreador } from "@/lib/client/store";

const DEMO = "modo-demo";
const TOUR = "recorrido-visto";

const leer = (k: string) => {
  try {
    return localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
};
const marcar = (k: string, v: boolean) => {
  try {
    if (v) localStorage.setItem(k, "1");
    else localStorage.removeItem(k);
  } catch {}
};

export function Puerta({ children }: { children: ReactNode }) {
  const { cuenta } = useCuenta();
  const { conectado: windsor } = useWindsorConectado();
  const [demo, setDemo] = useState(false);
  const [tourVisto, setTourVisto] = useState(true);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setDemo(leer(DEMO));
      setTourVisto(leer(TOUR));
      setListo(true);
    });
    const ver = () => setTourVisto(false);
    window.addEventListener("recorrido:ver", ver);
    return () => window.removeEventListener("recorrido:ver", ver);
  }, []);

  const cargando = !listo || cuenta === null || windsor === null;
  const paso = cargando ? 0 : !cuenta.conectado ? 1 : !windsor && !demo ? 2 : 0;
  const tapada = cargando || paso > 0;

  // La página se dibuja siempre (escondida mientras tanto) para que Next pueda prerenderizarla.
  return (
    <>
      <div className={tapada ? "hidden" : "contents"} aria-hidden={tapada || undefined}>
        {children}
      </div>
      {cargando && (
        <div className="flex min-h-screen w-full items-center justify-center" aria-busy>
          <span className="size-3 animate-pulse rounded-full bg-text" />
        </div>
      )}
      {!cargando && paso > 0 && (
        <Bienvenida
          paso={paso as 1 | 2}
          onDemo={() => {
            marcar(DEMO, true);
            setDemo(true);
          }}
        />
      )}
      <AnimatePresence>
        {!tapada && !tourVisto && (
          <Recorrido
            onFin={() => {
              marcar(TOUR, true);
              setTourVisto(true);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Bienvenida({ paso, onDemo }: { paso: 1 | 2; onDemo: () => void }) {
  const PASOS = ["Conectá Claude", "Conectá tu Instagram"];
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[520px] space-y-8">
        <div className="space-y-3 text-center">
          <span className="mx-auto block w-fit"><LogoHookia tam={48} /></span>
          <h1 className="text-[38px] leading-tight"><NombreHookia /></h1>
          <p className="text-[15px] text-text-2">Tu coach de Instagram con IA. Dos pasos y arrancamos: te lleva un minuto.</p>
        </div>

        <ol className="flex items-center justify-center gap-2 text-[13px]">
          {PASOS.map((t, i) => {
            const n = i + 1;
            const hecho = n < paso;
            const actual = n === paso;
            return (
              <li key={t} className="flex items-center gap-2">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                    hecho ? "bg-good text-bg" : actual ? "bg-c-azul text-white" : "border border-line text-text-3"
                  }`}
                >
                  {hecho ? <Check size={13} strokeWidth={3} /> : n}
                </span>
                <span className={actual ? "text-text" : "text-text-3"}>{t}</span>
                {n < PASOS.length && <span className="mx-1 h-px w-6 bg-line" aria-hidden />}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          <motion.div key={paso} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="space-y-3">
            <p className="text-center text-[14px] text-text-2">
              {paso === 1
                ? "Claude es el que analiza tu cuenta y escribe tus guiones. Usa tu cuenta de Claude: sin costos aparte."
                : "Con tu Instagram conectado leo tus números reales: qué te funcionó, cuánto creciste y qué hacer ahora."}
            </p>
            {paso === 1 ? <CuentaClaude /> : <CuentaWindsor />}
            {paso === 2 && (
              <button onClick={onDemo} className="mx-auto block pt-2 text-[12px] text-text-3 underline-offset-4 hover:text-text-2 hover:underline">
                Probar sin conectar (modo demo)
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

type Diapo = { icono: LucideIcon; color: string; titulo: string; texto: string };
const DIAPOS: Diapo[] = [
  { icono: UserRound, color: "var(--c-azul)", titulo: "Mi perfil", texto: "Le pongo nota a tu perfil y te dejo la bio y el nombre nuevos, listos para copiar." },
  { icono: BarChart3, color: "var(--c-aqua)", titulo: "Mis métricas", texto: "Tus números explicados en simple y un plan de 3 pasos para esta semana." },
  { icono: Lightbulb, color: "var(--c-amarillo)", titulo: "Ideas de tu nicho", texto: "Lo que está funcionando ahora en tu nicho, con su potencial y cómo hacerlo vos." },
  { icono: PenLine, color: "var(--c-magenta)", titulo: "Contenido", texto: "De una idea a un guion o un carrusel, escrito con tu forma de hablar." },
];

function Recorrido({ onFin }: { onFin: () => void }) {
  const [creador] = useCreador();
  const [i, setI] = useState(0);
  const total = DIAPOS.length + 2;
  const nombre = creador.nombre?.trim().split(/\s+/)[0];
  const d = i >= 1 && i <= DIAPOS.length ? DIAPOS[i - 1] : null;
  const ultimo = i === total - 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" role="dialog" aria-modal aria-label="Recorrido por la app">
      <motion.div initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="vidrio vidrio-fuerte w-full max-w-[440px] rounded-[24px] p-7">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="min-h-[190px] space-y-4">
            {i === 0 && (
              <>
                <LogoHookia tam={48} />
                <p className="font-display text-[26px] leading-tight font-semibold tracking-[-0.03em]">{nombre ? `¡Listo, ${nombre}!` : "¡Listo!"}</p>
                <p className="text-[15px] text-text-2">Bienvenido a Hookia. Te muestro en 30 segundos qué podés hacer: son 4 secciones, cada una con su color.</p>
              </>
            )}
            {d && (
              <>
                <span className="flex size-12 items-center justify-center rounded-[16px]" style={{ background: `color-mix(in oklab, ${d.color} 22%, transparent)`, color: d.color }}>
                  <d.icono size={22} strokeWidth={1.8} />
                </span>
                <p className="font-display text-[26px] leading-tight font-semibold tracking-[-0.03em]">{d.titulo}</p>
                <p className="text-[15px] text-text-2">{d.texto}</p>
              </>
            )}
            {ultimo && (
              <>
                <span className="flex size-12 items-center justify-center rounded-[16px] bg-c-azul text-white">
                  <ArrowRight size={22} />
                </span>
                <p className="font-display text-[26px] leading-tight font-semibold tracking-[-0.03em]">Arrancá por tu perfil</p>
                <p className="text-[15px] text-text-2">En 1 minuto te digo qué te está haciendo perder seguidores. Lo demás se llena solo a medida que usás la app.</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-5 bg-text" : "w-1.5 bg-line-strong"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!ultimo && (
              <button onClick={onFin} className="px-2 text-[13px] text-text-3 hover:text-text-2">
                Saltar
              </button>
            )}
            {ultimo ? (
              <Link href="/perfil" onClick={onFin} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-c-azul px-5 text-[14px] font-medium text-white hover:opacity-90">
                Analizar mi perfil <ArrowRight size={15} />
              </Link>
            ) : (
              <button onClick={() => setI((x) => x + 1)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-text px-5 text-[14px] font-medium text-bg hover:opacity-90">
                Siguiente <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Para volver a ver el recorrido desde Conexiones. */
export function verRecorridoDeNuevo() {
  marcar(TOUR, false);
  window.dispatchEvent(new Event("recorrido:ver"));
}
