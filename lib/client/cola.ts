"use client";

// Análisis automático: apenas la persona conecta Windsor, la app analiza su cuenta entera sin que toque nada,
// de a una sección por vez: su nombre y su foto, el perfil, las métricas, los reels, la estrategia, las ideas
// y las novedades del nicho. La fila se guarda por cuenta (cola-<usuario>): si recargás, sigue donde quedó.
// Solo corre para la cuenta de Windsor y nunca en modo demo.
import { SIN_USUARIO } from "@/lib/agent/tasks";
import {
  cancelarCorrida,
  claveCorrida,
  correr,
  corridaEnCurso,
  cuandoEmpieza,
  cuandoTermina,
  esCompartida,
  estadoDe,
  extraDe,
  modoDemo,
  type Fin,
  type TareaCompartida,
} from "./ejecutor";
import { tieneResultado } from "./resultados";
import { CREADOR_VACIO, claveUsuario, creadorGuardado, escribirGuardado, leerGuardado, useGuardado, type Creador } from "./store";

export type EstadoPaso = "pendiente" | "corriendo" | "listo" | "preguntas" | "error";
export type PasoCola = { tarea: TareaCompartida; estado: EstadoPaso; error?: string; preguntas?: string[]; por_que?: string };
export type Cola = {
  usuario: string;
  creada: string;
  pausada: boolean;
  cancelada: boolean;
  /** La persona cerró el cartel (o no había nada para mostrar). */
  cerrada: boolean;
  /** Por qué frenó sola: "claude" (sin conectar) o "windsor:<cuenta>" (Windsor es de otra cuenta). */
  motivo?: string;
  pasos: PasoCola[];
};

export const SECCIONES: Record<TareaCompartida, { nombre: string; href: string }> = {
  cuenta: { nombre: "Tu nombre y tu foto", href: "/" },
  perfil: { nombre: "Mi perfil", href: "/perfil" },
  metricas: { nombre: "Mis métricas", href: "/metricas" },
  reels: { nombre: "Mis reels", href: "/reels" },
  estrategia: { nombre: "Estrategia", href: "/estrategia" },
  ideas: { nombre: "Ideas de tu nicho", href: "/ideas" },
  novedades: { nombre: "Novedades del día", href: "/novedades" },
};
// Primero quién sos y tus números (los usan los demás); al final lo que se busca en la web.
const ORDEN: TareaCompartida[] = ["cuenta", "perfil", "metricas", "reels", "estrategia", "ideas", "novedades"];

export const claveCola = (usuario: string) => `cola-${claveUsuario(usuario) || "_"}`;
export const leerCola = (usuario: string) => leerGuardado<Cola | null>(claveCola(usuario), null);
const guardarCola = (c: Cola) => escribirGuardado(claveCola(c.usuario), c);

function cambiarCola(usuario: string, f: (c: Cola) => Cola | null) {
  const c = leerCola(usuario);
  const n = c && f(c);
  if (n) guardarCola(n);
}
function cambiarPaso(usuario: string, tarea: TareaCompartida, cambios: Partial<PasoCola>) {
  cambiarCola(usuario, (c) => (c.pasos.some((p) => p.tarea === tarea) ? { ...c, pasos: c.pasos.map((p) => (p.tarea === tarea ? { tarea, estado: p.estado, ...cambios } : p)) } : null));
}

/** ¿Hace falta traer el nombre y la foto? Si no se sabe de qué cuenta es Windsor, o si no hay ni nombre ni foto. */
export const faltaCuenta = (c: Creador, cuentaW: string | null) => !cuentaW || !(c.nombre?.trim() || c.foto);

async function windsorAhora() {
  const j = await fetch("/api/windsor", { cache: "no-store", signal: AbortSignal.timeout(20000) })
    .then((r) => r.json())
    .catch(() => null);
  return j ? { conectado: Boolean(j.conectado), cuenta: typeof j.cuenta === "string" && j.cuenta ? claveUsuario(j.cuenta) : null } : null;
}
async function claudeConectado() {
  const j = await fetch("/api/claude", { cache: "no-store", signal: AbortSignal.timeout(20000) })
    .then((r) => r.json())
    .catch(() => null);
  return Boolean(j?.conectado);
}
/** Las novedades (y una copia de las ideas) quedan en la compu, no en el navegador. */
async function enLaCompu(u: string) {
  const j = await fetch(`/api/diario?usuario=${encodeURIComponent(u)}`, { cache: "no-store", signal: AbortSignal.timeout(15000) })
    .then((r) => r.json())
    .catch(() => null);
  const deEsta = (x: { usuario?: string; resultado?: unknown } | null | undefined) => Boolean(x?.resultado && claveUsuario(x.usuario ?? "") === u);
  return { novedades: deEsta(j?.ultima), ideas: deEsta(j?.ideas) };
}

/** Anota cómo terminó una tarea de la fila (la haya corrido la fila o una página). */
function anotarFin(u: string, tarea: TareaCompartida, fin: Fin) {
  if (fin.cancelada) cambiarPaso(u, tarea, { estado: "pendiente" });
  else if (fin.resultado) cambiarPaso(u, tarea, { estado: "listo" });
  else if (fin.preguntas) cambiarPaso(u, tarea, { estado: "preguntas", preguntas: fin.preguntas.preguntas, por_que: fin.preguntas.por_que });
  else cambiarPaso(u, tarea, { estado: "error", error: fin.error || "Se cortó antes de terminar." });
}

if (typeof window !== "undefined") {
  cuandoEmpieza(({ usuario, tarea }) => {
    const u = claveUsuario(usuario);
    if (leerCola(u)?.pasos.some((p) => p.tarea === tarea && p.estado !== "corriendo")) cambiarPaso(u, tarea, { estado: "corriendo" });
  });
  cuandoTermina(({ usuario, tarea, fin }) => {
    if (fin && esCompartida(tarea)) anotarFin(claveUsuario(usuario), tarea, fin);
  });
}

const preparando = new Map<string, Promise<Cola | null>>();
/**
 * Arma la fila de la cuenta si hace falta. Con `todo` (recién conectó Windsor) se analiza todo de nuevo;
 * si no, solo la primera vez y solo lo que todavía no tiene resultado. Si ya hay una fila andando, se sigue esa.
 */
export function prepararCola(usuario: string, o: { todo: boolean; cuentaW: string | null }): Promise<Cola | null> {
  const u = claveUsuario(usuario);
  if (!u || u === SIN_USUARIO) return Promise.resolve(null);
  const ya = preparando.get(u);
  if (ya) return ya;
  const p = (async () => {
    const actual = leerCola(u);
    const andando = actual && !actual.cancelada && actual.pasos.some((x) => x.estado === "pendiente" || x.estado === "corriendo");
    if (andando || (actual && !o.todo)) return actual;
    let tareas = ORDEN.filter((t) => t !== "cuenta" || faltaCuenta(creadorGuardado(), o.cuentaW));
    if (!o.todo) {
      const compu = await enLaCompu(u);
      tareas = tareas.filter((t) => t === "cuenta" || (t === "novedades" ? !compu.novedades : t === "ideas" ? !(compu.ideas || tieneResultado(u, t)) : !tieneResultado(u, t)));
    }
    // Aunque no haya nada que analizar se anota igual, así no se revisa en cada visita. Si solo falta la foto, sin cartel.
    const cola: Cola = {
      usuario: u,
      creada: new Date().toISOString(),
      pausada: false,
      cancelada: false,
      cerrada: !tareas.some((t) => t !== "cuenta"),
      pasos: tareas.map((tarea) => ({ tarea, estado: "pendiente" })),
    };
    guardarCola(cola);
    return cola;
  })().finally(() => preparando.delete(u));
  preparando.set(u, p);
  return p;
}

const activas = new Set<string>();
/** Corre lo que falta de la fila, de a una tarea. Frena si la pausás, si cambiás de cuenta o si Windsor es de otra cuenta. */
export async function avanzar(usuario: string) {
  const u = claveUsuario(usuario);
  if (!u || u === SIN_USUARIO || activas.has(u)) return;
  activas.add(u);
  try {
    // Lo que quedó "analizando" de antes de recargar la página se vuelve a hacer.
    cambiarCola(u, (c) =>
      c.pasos.some((p) => p.estado === "corriendo" && !corridaEnCurso(claveCorrida(u, p.tarea)))
        ? { ...c, pasos: c.pasos.map((p) => (p.estado === "corriendo" && !corridaEnCurso(claveCorrida(u, p.tarea)) ? { tarea: p.tarea, estado: "pendiente" } : p)) }
        : null,
    );
    let revisarClaude = true;
    for (;;) {
      const cola = leerCola(u);
      if (!cola || cola.pausada || cola.cancelada) return;
      // Si una página está corriendo una de estas tareas, se espera a que termine: de a una por vez.
      const ocupada = cola.pasos.map((p) => corridaEnCurso(claveCorrida(u, p.tarea))).find(Boolean);
      if (ocupada) {
        await ocupada;
        continue;
      }
      const paso = cola.pasos.find((p) => p.estado === "pendiente");
      if (!paso) return;
      if (modoDemo() || claveUsuario(creadorGuardado().usuario) !== u) return;
      const w = await windsorAhora();
      if (!w?.conectado) return;
      if (w.cuenta && w.cuenta !== u) return cambiarCola(u, (c) => ({ ...c, motivo: `windsor:${w.cuenta}` }));
      if (revisarClaude) {
        if (!(await claudeConectado())) return cambiarCola(u, (c) => ({ ...c, motivo: "claude" }));
        revisarClaude = false;
      }
      if (leerCola(u)?.motivo) cambiarCola(u, (c) => ({ ...c, motivo: undefined }));
      if (leerCola(u)?.pausada) return;
      const c = creadorGuardado();
      if (paso.tarea === "cuenta" && !faltaCuenta(c, w.cuenta)) {
        cambiarPaso(u, "cuenta", { estado: "listo" });
        continue;
      }
      const fin = await correr({
        tarea: paso.tarea,
        creador: paso.tarea === "cuenta" ? { ...c, usuario: c.usuario || SIN_USUARIO } : c,
        extra: extraDe(paso.tarea),
        origen: "cola",
      });
      // Por las dudas (si el aviso no llegó a anotarlo), que nunca quede "pendiente" y se repita sin fin.
      const quedo = leerCola(u)?.pasos.find((p) => p.tarea === paso.tarea);
      if (quedo && (quedo.estado === "pendiente" || quedo.estado === "corriendo") && !fin.cancelada) anotarFin(u, paso.tarea, fin);
      if (fin.cancelada) return;
    }
  } finally {
    activas.delete(u);
  }
}

export const pausar = (u: string) => cambiarCola(u, (c) => ({ ...c, pausada: true }));
export function seguir(u: string) {
  cambiarCola(u, (c) => ({ ...c, pausada: false, motivo: undefined }));
  void avanzar(u);
}
/** Frena todo: corta lo que está analizando la fila (no lo que largaste vos desde una página). */
export function cancelar(u: string) {
  cambiarCola(u, (c) => ({ ...c, cancelada: true }));
  for (const p of leerCola(u)?.pasos ?? []) {
    const clave = claveCorrida(u, p.tarea);
    if (p.estado === "corriendo" && estadoDe(clave).origen === "cola") cancelarCorrida(clave);
  }
}
export function reintentar(u: string, tarea: TareaCompartida) {
  cambiarCola(u, (c) => ({ ...c, cancelada: false, cerrada: false, pausada: false, motivo: undefined, pasos: c.pasos.map((p) => (p.tarea === tarea ? { tarea, estado: "pendiente" } : p)) }));
  void avanzar(u);
}
export const cerrar = (u: string) => cambiarCola(u, (c) => ({ ...c, cerrada: true }));

/** Botón "Actualizar" de Inicio: vuelve a analizar todo de cero. Si ya hay un análisis andando, sigue ese. */
export async function actualizarTodo(usuario: string, cuentaW: string | null) {
  const u = claveUsuario(usuario);
  if (!u || u === SIN_USUARIO) return;
  await prepararCola(u, { todo: true, cuentaW });
  try {
    localStorage.setItem("analisis-abierto", "1"); // que el cartel del avance aparezca abierto
  } catch {}
  cambiarCola(u, (c) => (c.cerrada ? { ...c, cerrada: false } : null));
  void avanzar(u);
}

/** La fila de la cuenta cargada (se actualiza sola). */
export function useCola() {
  const [creador, , listo] = useGuardado<Creador>("creador", CREADOR_VACIO);
  const [cola, , listoCola] = useGuardado<Cola | null>(claveCola(creador.usuario), null);
  return listo && listoCola && cola && claveUsuario(cola.usuario) === claveUsuario(creador.usuario) ? cola : null;
}

/**
 * ¿Esta tarea espera su turno en el análisis automático? Devuelve la sección que se está analizando ahora
 * (o "" si todavía no arrancó ninguna), o null si no está en la fila. Sirve para mostrar "en la fila" y no "analizá".
 */
export function useEnFila(tarea: TareaCompartida): { ahora: string } | null {
  const cola = useCola();
  if (!cola || cola.pausada || cola.cancelada || cola.motivo) return null;
  if (cola.pasos.find((p) => p.tarea === tarea)?.estado !== "pendiente") return null;
  const actual = cola.pasos.find((p) => p.estado === "corriendo");
  return { ahora: actual ? SECCIONES[actual.tarea].nombre : "" };
}
