"use client";

// Lo que la app recuerda de la persona, en su navegador (por ahora; después va a la base de datos).
// Todo va por cuenta de Instagram: si cambiás de @ (por ejemplo, para probar la cuenta que pide el jurado),
// los análisis, la nota y los datos de cada cuenta quedan separados y no se mezclan.
import { useEffect, useState } from "react";

export type Creador = {
  usuario: string;
  aQueSeDedica: string;
  queVende: string;
  aQuien: string;
  historia: string;
  captions: string[];
  nombre?: string;
  /** Foto de perfil como data URL (jpeg cuadrado chico). */
  foto?: string;
};

export const CREADOR_VACIO: Creador = { usuario: "", aQueSeDedica: "", queVende: "", aQuien: "", historia: "", captions: [], nombre: "", foto: "" };

/** "@Paul.McCubbinn " → "paul.mccubbinn" (Instagram no distingue mayúsculas). */
export const claveUsuario = (u: string) => u.replace(/^@/, "").trim().toLowerCase();

const leer = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const escribir = (k: string, v: unknown) => {
  try {
    if (v === null || v === "") localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {}
  window.dispatchEvent(new Event(`store:${k}`));
};
/** Para guardar fuera de un componente (por ejemplo, cuando termina un análisis que corre solo): avisa a los useGuardado. */
export const leerGuardado = leer;
export const escribirGuardado = escribir;

// Antes los resultados no iban por cuenta: se pasan una vez a la cuenta que estaba cargada.
const TAREAS_GUARDADAS = ["perfil", "ideas", "metricas", "competencia", "guion", "carrusel"];
function migrar() {
  try {
    if (localStorage.getItem("almacen-por-cuenta")) return;
    const u = claveUsuario(JSON.parse(localStorage.getItem("creador") ?? "null")?.usuario ?? "");
    for (const t of TAREAS_GUARDADAS) {
      const v = localStorage.getItem(`resultado-${t}`);
      if (v && u && !localStorage.getItem(`resultado-${u}-${t}`)) localStorage.setItem(`resultado-${u}-${t}`, v);
      localStorage.removeItem(`resultado-${t}`);
    }
    const h = localStorage.getItem("historial-perfil");
    if (h && u && !localStorage.getItem(`historial-perfil-${u}`)) localStorage.setItem(`historial-perfil-${u}`, h);
    localStorage.removeItem("historial-perfil");
    localStorage.setItem("almacen-por-cuenta", "1");
  } catch {}
}
if (typeof window !== "undefined") migrar();

/** Estado guardado en localStorage, que se lee después de montar (en el servidor no existe). */
export function useGuardado<T>(clave: string, inicial: T) {
  // Se guarda junto con su clave: si la clave cambia (otra cuenta), no se muestra un momento el valor de la anterior.
  const [estado, setEstado] = useState<{ clave: string | null; valor: T }>({ clave: null, valor: inicial });
  useEffect(() => {
    const cargar = () => setEstado({ clave, valor: leer(clave, inicial) });
    queueMicrotask(cargar);
    window.addEventListener(`store:${clave}`, cargar);
    return () => window.removeEventListener(`store:${clave}`, cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  const listo = estado.clave === clave;
  const guardar = (v: T) => {
    setEstado({ clave, valor: v });
    escribir(clave, v);
  };
  return [listo ? estado.valor : inicial, guardar, listo] as const;
}

/** Manda los datos de la persona a su compu (.data/creador.json), así el aviso de las 7:00 sabe de qué es su nicho. */
export function sincronizarCreador(c: Creador) {
  if (!c.usuario) return;
  const { foto: _foto, ...sinFoto } = c;
  void _foto;
  fetch("/api/creador", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sinFoto) }).catch(() => {});
}

const PERFIL = (u: string) => `perfil-de-${claveUsuario(u)}`;

/** La cuenta cargada ahora, leída en el momento (fuera de un componente). */
export const creadorGuardado = (): Creador => ({ ...CREADOR_VACIO, ...leer<Partial<Creador>>("creador", {}) });

/** Guarda la cuenta cargada (y su copia por cuenta) desde fuera de un componente. */
export function guardarCreador(c: Creador) {
  escribir("creador", c);
  if (c.usuario) escribir(PERFIL(c.usuario), c);
  sincronizarCreador(c);
}

export function useCreador() {
  const [valor, guardar, listo] = useGuardado<Creador>("creador", CREADOR_VACIO);
  const guardarYSincronizar = (c: Creador) => {
    guardar(c);
    if (c.usuario) escribir(PERFIL(c.usuario), c);
    sincronizarCreador(c);
  };
  return [valor, guardarYSincronizar, listo] as const;
}

/** Datos de otra cuenta: los que ya tenía guardados o, si es nueva, de cero. Guarda antes los de la actual. */
export function datosDeCuenta(actual: Creador, usuario: string): Creador {
  const u = usuario.replace(/^@/, "").trim();
  if (actual.usuario) escribir(PERFIL(actual.usuario), actual);
  return { ...CREADOR_VACIO, ...leer<Partial<Creador>>(PERFIL(u), {}), usuario: u };
}

/** Las cuentas que ya se analizaron en este navegador (para volver a una con un toque). */
export function useCuentasGuardadas() {
  const [cuentas, setCuentas] = useState<{ usuario: string; nombre: string; foto: string }[]>([]);
  useEffect(() => {
    const cargar = () => {
      const lista: { usuario: string; nombre: string; foto: string }[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k?.startsWith("perfil-de-")) continue;
          const c = leer<Partial<Creador>>(k, {});
          if (c.usuario) lista.push({ usuario: c.usuario, nombre: c.nombre ?? "", foto: c.foto ?? "" });
        }
      } catch {}
      setCuentas(lista.sort((a, b) => a.usuario.localeCompare(b.usuario)));
    };
    queueMicrotask(cargar);
    window.addEventListener("store:creador", cargar);
    return () => window.removeEventListener("store:creador", cargar);
  }, []);
  return cuentas;
}

/** El último resultado de una tarea, de la cuenta que está cargada. */
export function useUltimo<T>(tarea: string) {
  const [c, , listoC] = useGuardado<Creador>("creador", CREADOR_VACIO);
  const [valor, guardar, listo] = useGuardado<T | null>(`resultado-${claveUsuario(c.usuario) || "_"}-${tarea}`, null);
  return [valor, guardar, listo && listoC] as const;
}

export type NotaPerfil = { fecha: string; nota: number };
/** Las notas del perfil de la cuenta cargada, para mostrar el progreso ("pasaste de 49 a 72"). */
export function useHistorialPerfil() {
  const [c, , listoC] = useGuardado<Creador>("creador", CREADOR_VACIO);
  const [valor, guardar, listo] = useGuardado<NotaPerfil[]>(`historial-perfil-${claveUsuario(c.usuario) || "_"}`, []);
  return [valor, guardar, listo && listoC] as const;
}

/** Suma una nota al historial (sin repetir la misma nota del mismo día). */
export function sumarNota(historial: NotaPerfil[], nota: number): NotaPerfil[] {
  const hoy = new Date().toISOString().slice(0, 10);
  const ult = historial[historial.length - 1];
  if (ult && ult.fecha === hoy && ult.nota === nota) return historial;
  return [...historial, { fecha: hoy, nota }].slice(-20);
}
