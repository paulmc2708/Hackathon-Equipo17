"use client";

// Apenas Windsor queda conectado, el agente trae el nombre real y la foto de la cuenta, una sola vez.
import { useEffect, useRef } from "react";
import { CREADOR_VACIO, type Creador } from "./store";
import { fotoDePerfil } from "./media";
import { useAgente } from "./useAgente";
import type { ResultadoCuenta } from "@/lib/agent/tasks";

const INTENTADO = "cuenta-instagram-intentado";

function creadorActual(): Creador {
  try {
    return { ...CREADOR_VACIO, ...JSON.parse(localStorage.getItem("creador") ?? "{}") };
  } catch {
    return CREADOR_VACIO;
  }
}

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

export function useCuentaInstagram(creador: Creador, guardar: (c: Creador) => void, windsor: boolean | null, listo: boolean) {
  const ag = useAgente<ResultadoCuenta>("cuenta", async (r) => {
    const c = creadorActual();
    const foto = c.foto || (await bajarFoto(r.foto_url));
    guardar({
      ...c,
      nombre: c.nombre?.trim() || r.nombre.trim(),
      usuario: c.usuario || r.usuario.replace(/^@/, "").trim(),
      foto,
    });
  });
  const lanzado = useRef(false);

  useEffect(() => {
    if (!listo || !windsor || lanzado.current) return;
    if (creador.nombre?.trim() && creador.foto) return;
    try {
      if (sessionStorage.getItem(INTENTADO)) return;
      sessionStorage.setItem(INTENTADO, "1");
    } catch {}
    lanzado.current = true;
    ag.correr({ ...creador, usuario: creador.usuario || "cuenta-de-windsor" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, windsor, creador.nombre, creador.foto]);

  return { trayendo: ag.corriendo, error: ag.error };
}
