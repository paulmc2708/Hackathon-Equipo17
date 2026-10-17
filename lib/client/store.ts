"use client";

// Lo que la app recuerda de la persona, en su navegador (por ahora; después va a la base de datos).
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

/** Estado guardado en localStorage, que se lee después de montar (en el servidor no existe). */
export function useGuardado<T>(clave: string, inicial: T) {
  const [valor, setValor] = useState<T>(inicial);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const cargar = () => setValor(leer(clave, inicial));
    queueMicrotask(() => {
      cargar();
      setListo(true);
    });
    window.addEventListener(`store:${clave}`, cargar);
    return () => window.removeEventListener(`store:${clave}`, cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  const guardar = (v: T) => {
    setValor(v);
    escribir(clave, v);
  };
  return [valor, guardar, listo] as const;
}

export const useCreador = () => useGuardado<Creador>("creador", CREADOR_VACIO);
export const useUltimo = <T,>(tarea: string) => useGuardado<T | null>(`resultado-${tarea}`, null);
