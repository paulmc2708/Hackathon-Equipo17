"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Botón para pasar de modo oscuro a claro (y volver). Se guarda en el navegador. */
export function BotonTema({ abierta }: { abierta: boolean }) {
  const [tema, setTema] = useState<"oscuro" | "claro">("oscuro");
  useEffect(() => {
    queueMicrotask(() => setTema(document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro"));
  }, []);
  const cambiar = () => {
    const t = tema === "claro" ? "oscuro" : "claro";
    document.documentElement.dataset.tema = t;
    try {
      localStorage.setItem("tema", t);
    } catch {}
    setTema(t);
  };
  const Icono = tema === "claro" ? Moon : Sun;
  const texto = tema === "claro" ? "Modo oscuro" : "Modo claro";
  return (
    <button
      onClick={cambiar}
      title={abierta ? undefined : texto}
      aria-label={texto}
      className={`flex h-10 w-full items-center gap-3 rounded-[14px] px-2.5 text-[14px] font-medium text-text-2 transition-colors hover:bg-raised hover:text-text ${abierta ? "" : "justify-center"}`}
    >
      <Icono size={18} strokeWidth={1.7} className="shrink-0" />
      {abierta && <span>{texto}</span>}
    </button>
  );
}
