"use client";

// Dónde queda cada resultado: en las mismas claves que lee cada página (por cuenta), así da igual si el análisis
// lo largó la página o el análisis automático. Lo usa lib/client/ejecutor.ts cuando llega un resultado.
import { SIN_USUARIO, type ResultadoCuenta, type ResultadoPerfil } from "@/lib/agent/tasks";
import { fotoDePerfil } from "./media";
import { claveUsuario, creadorGuardado, escribirGuardado, guardarCreador, leerGuardado, sumarNota, type Creador, type NotaPerfil } from "./store";

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

/** El nombre y la foto que trae Windsor, solo para la cuenta de Windsor (no pisa otra cuenta que estés viendo). */
async function guardarCuenta(r: ResultadoCuenta) {
  const deWindsor = claveUsuario(r.usuario) === SIN_USUARIO ? "" : r.usuario.replace(/^@/, "").trim();
  // Primero la foto (tarda) y recién después se leen los datos, así no se pisa lo que la persona guardó mientras tanto.
  const foto = creadorGuardado().foto ? "" : await bajarFoto(r.foto_url);
  const c = creadorGuardado();
  window.dispatchEvent(new Event("windsor:cambio"));
  if (c.usuario && deWindsor && claveUsuario(c.usuario) !== claveUsuario(deWindsor)) return;
  guardarCreador({ ...c, nombre: c.nombre?.trim() || r.nombre.trim(), usuario: c.usuario || deWindsor, foto: c.foto || foto });
}

const alDiario = (resultado: unknown, usuario: string, tipo?: "ideas") =>
  fetch("/api/diario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "guardar", tipo, resultado, usuario }) })
    .then(() => window.dispatchEvent(new Event("diario:guardado")))
    .catch(() => {});

/** Guarda el resultado de una tarea para la cuenta con la que se pidió (aunque mientras tanto hayas cambiado de cuenta). */
export async function guardarResultado(tarea: string, creador: Creador, data: unknown) {
  const u = claveUsuario(creador.usuario);
  if (tarea === "cuenta") return guardarCuenta(data as ResultadoCuenta);
  if (!u || u === SIN_USUARIO) return;
  if (tarea === "novedades") return alDiario(data, creador.usuario);
  escribirGuardado(`resultado-${u}-${tarea}`, data);
  if (tarea === "perfil") {
    const clave = `historial-perfil-${u}`;
    escribirGuardado(clave, sumarNota(leerGuardado<NotaPerfil[]>(clave, []), (data as ResultadoPerfil).nota_total));
  }
  if (tarea === "ideas") await alDiario(data, creador.usuario, "ideas");
}

/** ¿Ya hay un resultado guardado de esta tarea para esta cuenta? (las novedades viven en la compu: se preguntan aparte) */
export const tieneResultado = (u: string, tarea: string) => leerGuardado<unknown>(`resultado-${claveUsuario(u)}-${tarea}`, null) !== null;
