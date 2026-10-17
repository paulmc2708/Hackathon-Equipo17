"use client";

// Apenas Windsor queda conectado, el agente trae el nombre real y la foto de la cuenta, una sola vez.
// Solo para la cuenta de Windsor: si estás viendo otra cuenta (por ejemplo, la que pidió el jurado), no le pone tus datos.
import { useEffect, useRef } from "react";
import { CREADOR_VACIO, claveUsuario, type Creador } from "./store";
import { fotoDePerfil } from "./media";
import { useAgente } from "./useAgente";
import { SIN_USUARIO, type ResultadoCuenta } from "@/lib/agent/tasks";

// Último intento (para no llamar al agente en cada visita si Windsor no trae los datos).
const INTENTADO = "cuenta-instagram-ultimo-intento";
const ESPERA = 10 * 60 * 1000;

function creadorActual(): Creador {
  try {
    return { ...CREADOR_VACIO, ...JSON.parse(localStorage.getItem("creador") ?? "{}") };
  } catch {
    return CREADOR_VACIO;
  }
}

const enModoDemo = () => {
  try {
    return localStorage.getItem("modo-demo") === "1";
  } catch {
    return false;
  }
};

async function bajarFoto(url: string) {
  if (!url) return "";
  try {
    const r = await fetch(`/api/foto?url=${encodeURIComponent(url)}`);
    if (!r.ok) return "";
    const blob = await r.blob();
    return await fotoDePerfil(new File([blob], "foto", { type: blob.type }));
  } catch {
    return "";
  }
}

export function useCuentaInstagram(creador: Creador, guardar: (c: Creador) => void, windsor: boolean | null, cuentaW: string | null, listo: boolean) {
  const ag = useAgente<ResultadoCuenta>("cuenta", async (r) => {
    const deWindsor = claveUsuario(r.usuario) === SIN_USUARIO ? "" : r.usuario.replace(/^@/, "").trim();
    // Primero la foto (tarda) y recién después se leen los datos, así no se pisa lo que la persona guardó mientras tanto.
    const foto = creadorActual().foto ? "" : await bajarFoto(r.foto_url);
    const c = creadorActual();
    window.dispatchEvent(new Event("windsor:cambio"));
    if (c.usuario && deWindsor && claveUsuario(c.usuario) !== claveUsuario(deWindsor)) return;
    guardar({
      ...c,
      nombre: c.nombre?.trim() || r.nombre.trim(),
      usuario: c.usuario || deWindsor,
      foto: c.foto || foto,
    });
  });
  const lanzado = useRef(false);
  // ¿La cuenta que se está viendo es la de Windsor? (si todavía no se sabe, se asume que sí)
  const esLaDeWindsor = !creador.usuario || !cuentaW || claveUsuario(creador.usuario) === cuentaW;

  const traer = () => {
    try {
      localStorage.setItem(INTENTADO, String(Date.now()));
    } catch {}
    lanzado.current = true;
    ag.correr({ ...creador, usuario: creador.usuario || SIN_USUARIO });
  };

  useEffect(() => {
    if (!listo || !windsor || lanzado.current || !esLaDeWindsor || enModoDemo()) return;
    // Corre si todavía no se sabe de qué cuenta es Windsor (hace falta para no mezclar cuentas)
    // o si no tiene ni nombre ni foto. Si la persona sacó la foto a mano, no se la vuelve a poner.
    if (cuentaW && (creador.nombre?.trim() || creador.foto)) return;
    try {
      if (Date.now() - Number(localStorage.getItem(INTENTADO) ?? 0) < ESPERA) return;
    } catch {}
    traer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, windsor, cuentaW, esLaDeWindsor, creador.nombre, creador.foto]);

  const falta = Boolean(windsor) && esLaDeWindsor && !(creador.nombre?.trim() && creador.foto);
  return { trayendo: ag.corriendo, error: ag.error, falta, traer };
}
