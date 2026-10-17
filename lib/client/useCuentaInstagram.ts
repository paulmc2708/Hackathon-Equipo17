"use client";

// El nombre real y la foto de la cuenta, desde Windsor. Lo trae solo el análisis automático
// (components/AnalisisAutomatico.tsx) apenas Windsor queda conectado; acá está el botón para pedirlo a mano.
// Solo para la cuenta de Windsor: si estás viendo otra cuenta (por ejemplo, la que pidió el jurado), no le pone tus datos.
import { claveUsuario, type Creador } from "./store";
import { useAgente } from "./useAgente";
import { SIN_USUARIO, type ResultadoCuenta } from "@/lib/agent/tasks";

// Último intento (para no llamar al agente en cada visita si Windsor no trae los datos).
const INTENTADO = "cuenta-instagram-ultimo-intento";
const ESPERA = 10 * 60 * 1000;

export function marcarIntento() {
  try {
    localStorage.setItem(INTENTADO, String(Date.now()));
  } catch {}
}
export function intentoReciente() {
  try {
    return Date.now() - Number(localStorage.getItem(INTENTADO) ?? 0) < ESPERA;
  } catch {
    return false;
  }
}

export function useCuentaInstagram(creador: Creador, windsor: boolean | null, cuentaW: string | null) {
  // La corrida es compartida: si ya la largó el análisis automático, acá se ve esa misma.
  const ag = useAgente<ResultadoCuenta>("cuenta");
  // ¿La cuenta que se está viendo es la de Windsor? (si todavía no se sabe, se asume que sí)
  const esLaDeWindsor = !creador.usuario || !cuentaW || claveUsuario(creador.usuario) === cuentaW;

  const traer = () => {
    marcarIntento();
    ag.correr({ ...creador, usuario: creador.usuario || SIN_USUARIO });
  };

  const falta = Boolean(windsor) && esLaDeWindsor && !(creador.nombre?.trim() && creador.foto);
  return { trayendo: ag.corriendo, error: ag.error, falta, traer };
}
