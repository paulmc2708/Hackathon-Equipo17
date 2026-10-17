"use client";

import { useCallback, useEffect, useState } from "react";
import { Boton, Tarjeta } from "@/components/ui";

export function useWindsorConectado() {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const refrescar = useCallback(async () => {
    const j = await fetch("/api/windsor", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    setConectado(Boolean(j?.conectado));
  }, []);
  useEffect(() => {
    queueMicrotask(refrescar);
  }, [refrescar]);
  return { conectado, refrescar };
}

/** Conectar Instagram vía Windsor: la persona entra a Windsor con su usuario y da permiso (solo lectura). */
export function CuentaWindsor({ compacta = false }: { compacta?: boolean }) {
  const { conectado, refrescar } = useWindsorConectado();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const conectar = async () => {
    setCargando(true);
    setError("");
    const j = await fetch("/api/windsor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "conectar" }) })
      .then((r) => r.json())
      .catch(() => null);
    if (j?.url) window.location.href = j.url;
    else {
      setError(j?.error ?? "No pude abrir Windsor. Probá de nuevo.");
      setCargando(false);
    }
  };

  if (conectado === null) return <Tarjeta className="h-[120px] animate-pulse">{null}</Tarjeta>;

  return (
    <Tarjeta className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[17px] font-medium">Tu Instagram (vía Windsor)</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${conectado ? "border-good/40 text-good" : "border-line text-text-3"}`}>
            {conectado ? "Conectado" : "Sin conectar"}
          </span>
        </div>
        {!compacta && (
          <p className="mt-1 text-[14px] text-text-2">
            {conectado
              ? "Leo tus números reales: alcance, vistas, seguidores y qué publicación te funcionó. Solo lectura: no puedo publicar ni tocar nada."
              : "Entrás a Windsor con tu usuario, das permiso y listo. Windsor es gratis y lee tus métricas de Instagram. El agente solo lee: nunca publica ni borra nada."}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        {conectado ? (
          <Boton
            variante="suave"
            onClick={async () => {
              await fetch("/api/windsor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "desconectar" }) });
              refrescar();
            }}
          >
            Desconectar
          </Boton>
        ) : (
          <Boton cargando={cargando} onClick={conectar}>
            Conectar con Windsor
          </Boton>
        )}
      </div>
      {error && <p className="text-[13px] text-bad">{error}</p>}
    </Tarjeta>
  );
}
