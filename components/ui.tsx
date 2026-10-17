"use client";

// Piezas de interfaz con la estética de app.workfly.io y animaciones suaves (Motion).
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Loader2, X } from "lucide-react";
import type { Adjunto } from "@/lib/client/media";
import { useState, type ReactNode } from "react";

const SUAVE = { type: "spring" as const, stiffness: 260, damping: 30 };

export function Pagina({ titulo, bajada, children, accion }: { titulo: string; bajada?: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-10 flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[38px] leading-[1.1] font-semibold tracking-[-0.04em]">{titulo}</h1>
          {bajada && <p className="mt-2 text-[16px] text-text-2">{bajada}</p>}
        </div>
        {accion}
      </header>
      {children}
    </motion.div>
  );
}

export function Boton({
  children,
  variante = "principal",
  cargando,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "principal" | "borde" | "suave"; cargando?: boolean }) {
  const estilos = {
    principal: "rounded-full bg-text text-bg hover:bg-white",
    borde: "rounded-[14px] border border-line-strong/60 bg-bg text-text hover:bg-raised",
    suave: "rounded-[14px] text-text-2 hover:bg-raised hover:text-text",
  }[variante];
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={SUAVE}
      {...(props as React.ComponentProps<typeof motion.button>)}
      disabled={props.disabled || cargando}
      className={`inline-flex h-10 items-center justify-center gap-2 px-4 text-[14px] font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${estilos} ${props.className ?? ""}`}
    >
      {cargando && <Loader2 size={15} className="animate-spin" />}
      {children}
    </motion.button>
  );
}

export function Tarjeta({ children, className = "", i = 0 }: { children: ReactNode; className?: string; i?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SUAVE, delay: Math.min(i, 10) * 0.04 }}
      className={`rounded-[20px] border border-line bg-panel p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Campo({ label, ayuda, area, ...props }: { label: string; ayuda?: string; area?: boolean } & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const base =
    "w-full rounded-[14px] border border-line bg-bg px-4 py-3 text-[15px] text-text outline-none transition-colors duration-150 placeholder:text-text-3 focus:border-line-strong";
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-medium text-text">{label}</span>
      {area ? <textarea rows={3} {...props} className={`${base} resize-none`} /> : <input {...props} className={base} />}
      {ayuda && <span className="mt-1.5 block text-[13px] text-text-2">{ayuda}</span>}
    </label>
  );
}

export function Vacio({ titulo, texto, children }: { titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-line px-6 py-16 text-center">
      <p className="text-[17px] font-medium">{titulo}</p>
      <p className="mt-1.5 max-w-[420px] text-[14px] text-text-2">{texto}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/** Pasos del agente en vivo, como un log prolijo. */
export function Pasos({ pasos, corriendo }: { pasos: string[]; corriendo: boolean }) {
  if (!pasos.length && !corriendo) return null;
  return (
    <div className="rounded-[20px] border border-line bg-panel p-5">
      <ol className="space-y-2.5">
        <AnimatePresence initial={false}>
          {pasos.map((p, i) => {
            const actual = corriendo && i === pasos.length - 1;
            return (
              <motion.li
                key={i}
                layout
                initial={{ opacity: 0, x: -6, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={SUAVE}
                className={`flex items-center gap-3 text-[14px] ${actual ? "text-text" : "text-text-2"}`}
              >
                <span className={`flex size-5 items-center justify-center rounded-full border ${actual ? "border-line-strong" : "border-line"}`}>
                  {actual ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                </span>
                {p}
              </motion.li>
            );
          })}
        </AnimatePresence>
        {corriendo && pasos.length === 0 && (
          <li className="flex items-center gap-3 text-[14px] text-text-2">
            <Loader2 size={14} className="animate-spin" /> Arrancando…
          </li>
        )}
      </ol>
    </div>
  );
}

export function Preguntas({
  preguntas,
  porQue,
  onResponder,
}: {
  preguntas: string[];
  porQue: string;
  onResponder: (r: string[], adjuntos: Adjunto[]) => void;
}) {
  const [r, setR] = useState(preguntas.map(() => ""));
  const [fotos, setFotos] = useState<Adjunto[]>([]);
  const [videos, setVideos] = useState<Adjunto[]>([]);
  return (
    <Tarjeta className="space-y-5">
      <div>
        <p className="text-[17px] font-medium">Antes de seguir, contame un poco más</p>
        {porQue && <p className="mt-1 text-[14px] text-text-2">{porQue}</p>}
      </div>
      {preguntas.map((q, i) => (
        <Campo key={i} label={q} value={r[i]} onChange={(e) => setR((x) => x.map((v, j) => (j === i ? e.target.value : v)))} />
      ))}
      <Subir titulo="Sumar capturas" ayuda="De tu perfil, tus estadísticas o perfiles que te interesan" adjuntos={fotos} onChange={setFotos} etiqueta={(f) => `captura que mandó al responder (${f.name})`} />
      <Subir videos titulo="Sumar videos que te gustan" adjuntos={videos} onChange={setVideos} etiqueta={(f) => `video de referencia que mandó (${f.name})`} />
      <Boton onClick={() => onResponder(r, [...fotos, ...videos])} disabled={r.every((x) => !x.trim()) && !fotos.length && !videos.length}>
        Responder y seguir
      </Boton>
    </Tarjeta>
  );
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[14px] border border-bad/30 bg-bad/10 px-4 py-3 text-[14px] text-bad">
      {children}
    </motion.p>
  );
}

export function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(texto).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        });
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12px] text-text-2 transition-colors hover:bg-raised hover:text-text"
    >
      {ok ? <Check size={13} /> : <Copy size={13} />}
      {ok ? "Copiado" : "Copiar"}
    </button>
  );
}

/** Anillo de la nota del perfil (0-100), que se llena con animación. */
export function Anillo({ nota }: { nota: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = nota >= 75 ? "var(--good)" : nota >= 50 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="relative size-[132px]">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - nota / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[38px] leading-none font-semibold tracking-[-0.04em]">{nota}</span>
        <span className="mt-1 text-[12px] text-text-2">de 100</span>
      </div>
    </div>
  );
}

export function Subir({
  titulo,
  ayuda,
  adjuntos,
  onChange,
  etiqueta,
  videos = false,
}: {
  titulo: string;
  ayuda?: string;
  adjuntos: Adjunto[];
  onChange: (a: Adjunto[]) => void;
  etiqueta: (f: File) => string;
  videos?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-dashed border-line px-4 py-3 text-[14px] text-text-2 transition-colors hover:border-line-strong hover:text-text">
        <span>
          <span className="block text-text">{titulo}</span>
          {ayuda && <span className="mt-0.5 block text-[13px]">{ayuda}</span>}
        </span>
        <span className="shrink-0 rounded-full border border-line px-3 py-1 text-[12px]">Elegir</span>
        <input
          type="file"
          multiple
          accept={videos ? "video/*" : "image/png,image/jpeg,image/webp"}
          className="hidden"
          onChange={(e) => {
            const nuevos = Array.from(e.target.files ?? []).map((file) => ({ file, etiqueta: etiqueta(file) }));
            onChange([...adjuntos, ...nuevos].slice(0, videos ? 2 : 8));
            e.target.value = "";
          }}
        />
      </label>
      {adjuntos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {adjuntos.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[12px] text-text-2">
              <span className="max-w-[220px] truncate">{a.file.name}</span>
              <button onClick={() => onChange(adjuntos.filter((_, j) => j !== i))} aria-label="Quitar" className="text-text-3 hover:text-text">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
