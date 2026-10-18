"use client";

// Piezas de interfaz con la estética de app.workfly.io y animaciones suaves (Motion).
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Bot, Check, ChevronDown, ChevronLeft, Copy, Loader2, Paperclip, X } from "lucide-react";
import type { Adjunto } from "@/lib/client/media";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { colorDe, textoSobre } from "@/lib/client/secciones";
import { primerNumero } from "@/lib/numeros";
import { AGENTES, agenteDe } from "@/lib/agentes";

const SUAVE = { type: "spring" as const, stiffness: 260, damping: 30 };

export function Pagina({ titulo, bajada, children, accion }: { titulo: string; bajada?: string; children: ReactNode; accion?: ReactNode }) {
  const path = usePathname();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ "--sec": colorDe(path), "--sec-texto": textoSobre(colorDe(path)) } as React.CSSProperties}
      className="isolate"
    >
      <header className="brillo mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <span className="mb-4 block h-1 w-8 rounded-full bg-sec" aria-hidden />
          <h1 className="font-display text-[32px] leading-[1.1] sm:text-[38px] font-semibold tracking-[-0.04em]">{titulo}</h1>
          {bajada && <p className="mt-2 text-[16px] text-text-2">{bajada}</p>}
          <button
            onClick={() => window.dispatchEvent(new Event("chat:abrir"))}
            title={`Sabe: ${AGENTES[agenteDe(path)].sabe.join(" · ")}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-sec/30 bg-sec/10 px-3 py-1 text-[12px] font-medium text-sec transition-colors hover:bg-sec/15"
          >
            <Bot size={13} strokeWidth={2} /> Tu {AGENTES[agenteDe(path)].nombre.toLowerCase()}
          </button>
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
    principal: "rounded-full bg-sec text-[var(--sec-texto,#fff)] hover:opacity-90",
    borde: "rounded-[14px] border border-line-strong/60 bg-bg text-text hover:bg-raised",
    suave: "rounded-[14px] text-text-2 hover:bg-raised hover:text-text",
  }[variante];
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={SUAVE}
      {...(props as React.ComponentProps<typeof motion.button>)}
      disabled={props.disabled || cargando}
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 px-4 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${estilos} ${props.className ?? ""}`}
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
      className={`vidrio rounded-[20px] p-5 transition-colors duration-200 hover:border-white/20 sm:p-6 ${className}`}
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
  // Al terminar queda una sola línea; la flechita abre el historial.
  const [abierto, setAbierto] = useState(false);
  const [antes, setAntes] = useState(corriendo);
  if (antes !== corriendo) {
    setAntes(corriendo);
    if (corriendo) setAbierto(false);
  }
  if (!pasos.length && !corriendo) return null;
  const cerrado = !corriendo && !abierto;
  return (
    <div className={`rounded-[20px] border border-line bg-panel ${corriendo ? "p-5" : "px-5 py-3"}`}>
      {!corriendo && (
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          className="flex w-full items-center gap-3 text-left text-[14px] text-text"
        >
          <span className="flex size-5 items-center justify-center rounded-full border border-line">
            <Check size={11} />
          </span>
          <span className="flex-1">Análisis completado</span>
          <ChevronDown size={16} className={`text-text-2 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
        </button>
      )}
      <AnimatePresence initial={false}>
      {!cerrado && (
      <motion.div
        initial={corriendo ? false : { height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
      <ol className={`space-y-2.5 ${corriendo ? "" : "mt-3 border-t border-line pt-3"}`}>
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
      </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

/** Lo que el agente le pide a la persona, como un mensaje de chat: una sola caja para responder como quiera o pasarle archivos. */
export function Charla({ mensaje, onResponder }: { mensaje: string; onResponder: (texto: string, adjuntos: Adjunto[]) => void }) {
  const [texto, setTexto] = useState("");
  const [archivos, setArchivos] = useState<Adjunto[]>([]);
  const listo = Boolean(texto.trim() || archivos.length);
  const enviar = () => listo && onResponder(texto.trim(), archivos);
  return (
    <Tarjeta className="space-y-4">
      <div className="flex gap-3">
        <span className="mt-1 size-2.5 shrink-0 rounded-full bg-text" aria-hidden />
        <div className="space-y-1.5">
          {mensaje.split("\n\n").map((t, i) => (
            <p key={i} className={i === 0 ? "text-[15px] leading-relaxed" : "text-[13px] text-text-2"}>{t}</p>
          ))}
        </div>
      </div>
      {archivos.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-5">
          {archivos.map((a, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[12px] text-text-2">
              {a.file.name}
              <button onClick={() => setArchivos((x) => x.filter((_, j) => j !== i))} aria-label="Sacar archivo" className="hover:text-text">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-[16px] border border-line bg-bg p-2 focus-within:border-line-strong">
        <label className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-2 focus-within:ring-2 focus-within:ring-sec hover:bg-raised hover:text-text" title="Pasar capturas o videos">
          <Paperclip size={17} strokeWidth={1.7} />
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            aria-label="Pasar capturas o videos"
            className="sr-only"
            onChange={(e) => {
              const nuevos = Array.from(e.target.files ?? []).map((file) => ({ file, etiqueta: `${file.type.startsWith("video/") ? "video" : "captura"} que mandó al responder (${file.name})` }));
              setArchivos((x) => [...x, ...nuevos]);
              e.target.value = "";
            }}
          />
        </label>
        <textarea
          rows={1}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Respondé como le contarías a un amigo, o pasame una captura"
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-[15px] text-text outline-none placeholder:text-text-3"
        />
        <button
          onClick={enviar}
          disabled={!listo}
          aria-label="Enviar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-text text-bg transition-opacity disabled:opacity-30"
        >
          <ArrowUp size={17} strokeWidth={2} />
        </button>
      </div>
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
    <div className="relative size-[132px] shrink-0">
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
  acepta,
  maximo,
  numerar = false,
}: {
  titulo: string;
  ayuda?: string;
  adjuntos: Adjunto[];
  onChange: (a: Adjunto[]) => void;
  etiqueta: (f: File) => string;
  videos?: boolean;
  /** Tipos que acepta el selector (por defecto, imágenes o videos). */
  acepta?: string;
  maximo?: number;
  /** Muestra el orden (1, 2, 3…) y deja mover cada archivo un lugar antes. */
  numerar?: boolean;
}) {
  const tope = maximo ?? (videos ? 2 : 8);
  const mover = (i: number) => onChange(adjuntos.map((a, j) => (j === i - 1 ? adjuntos[i] : j === i ? adjuntos[i - 1] : a)));
  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border border-dashed border-line px-4 py-3 text-[14px] text-text-2 transition-colors focus-within:ring-2 focus-within:ring-sec hover:border-line-strong hover:text-text">
        <span>
          <span className="block text-text">{titulo}</span>
          {ayuda && <span className="mt-0.5 block text-[13px]">{ayuda}</span>}
        </span>
        <span className="shrink-0 rounded-full border border-line px-3 py-1 text-[12px]">Elegir</span>
        <input
          type="file"
          multiple={tope > 1}
          accept={acepta ?? (videos ? "video/*" : "image/png,image/jpeg,image/webp")}
          className="sr-only"
          onChange={(e) => {
            const nuevos = Array.from(e.target.files ?? []).map((file) => ({ file, etiqueta: etiqueta(file) }));
            onChange(tope === 1 ? nuevos.slice(-1) : [...adjuntos, ...nuevos].slice(0, tope));
            e.target.value = "";
          }}
        />
      </label>
      {adjuntos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {adjuntos.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[12px] text-text-2">
              {numerar && i > 0 && (
                <button onClick={() => mover(i)} aria-label={`Pasar ${a.file.name} un lugar antes`} className="text-text-3 hover:text-text">
                  <ChevronLeft size={12} />
                </button>
              )}
              {numerar && <span className="font-medium text-text">{i + 1}</span>}
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

/** Cuenta hacia arriba el número que haya en el texto ("1.921.284", "85 mil", "+320"), dejando el resto igual. */
export function Contador({ valor }: { valor: string }) {
  const m = primerNumero(valor);
  const objetivo = m ? m.valor : NaN;
  const decimales = m?.decimales ?? 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(objetivo)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setN(objetivo));
      return;
    }
    let raf = 0;
    let t0 = 0;
    const paso = (t: number) => {
      t0 ||= t;
      const k = Math.min(1, (t - t0) / 900);
      setN(objetivo * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo]);
  if (!m || !Number.isFinite(objetivo)) return <>{valor}</>;
  const txt = n.toLocaleString("es", { minimumFractionDigits: decimales, maximumFractionDigits: decimales, useGrouping: "always" } as Intl.NumberFormatOptions);
  return <>{valor.slice(0, m.inicio)}{txt}{valor.slice(m.inicio + m.largo)}</>;
}

/** Desplegable con apertura y cierre suaves (reemplaza a <details>, que abre de golpe). */
export function Desplegable({ titulo, children, className = "", tarjeta = true }: { titulo: ReactNode; children: ReactNode; className?: string; tarjeta?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className={`${tarjeta ? "rounded-[20px] border border-line px-6 py-4" : ""} text-[13px] text-text-2 ${className}`}>
      <button onClick={() => setAbierto((v) => !v)} aria-expanded={abierto} className="flex w-full items-center justify-between gap-3 text-left font-medium text-text transition-colors hover:text-sec">
        {titulo}
        <motion.span animate={{ rotate: abierto ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="shrink-0 text-text-3">
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Contenido que aparece y desaparece con altura animada. */
export function Aparece({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
