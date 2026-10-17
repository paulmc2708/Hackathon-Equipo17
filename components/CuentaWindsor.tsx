"use client";

import { useCallback, useEffect, useState } from "react";
import { Boton, Tarjeta } from "@/components/ui";

/** ¿Windsor está conectado? y de qué cuenta de Instagram es (null si todavía no se sabe). */
export function useWindsorConectado() {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [cuenta, setCuenta] = useState<string | null>(null);
  const refrescar = useCallback(async () => {
    const j = await fetch("/api/windsor", { cache: "no-store", signal: AbortSignal.timeout(20000) }).then((r) => r.json()).catch(() => null);
    setCuenta(typeof j?.cuenta === "string" ? j.cuenta : null);
    setConectado(Boolean(j?.conectado));
  }, []);
  useEffect(() => {
    queueMicrotask(refrescar);
    window.addEventListener("windsor:cambio", refrescar);
    return () => window.removeEventListener("windsor:cambio", refrescar);
  }, [refrescar]);
  return { conectado, cuenta, refrescar };
}

/** Conectar Instagram vía Windsor: la persona entra a Windsor con su usuario y da permiso (solo lectura). */
export function CuentaWindsor({ compacta = false }: { compacta?: boolean }) {
  const { conectado, cuenta } = useWindsorConectado();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const conectar = async () => {
    setCargando(true);
    setError("");
    const j = await fetch("/api/windsor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "conectar", volver: window.location.pathname }) })
      .then((r) => r.json())
      .catch(() => null);
    if (j?.url) window.location.href = j.url;
    else {
      setError(j?.error ?? "No pude abrir Windsor. Probá de nuevo.");
      setCargando(false);
    }
  };

  const vuelta = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("windsor") : null;
  const avisoVuelta = vuelta === "cancelado" ? "Cancelaste el permiso en Windsor. Probá de nuevo cuando quieras." : vuelta === "error" ? "Windsor no terminó de conectar. Probá de nuevo." : "";

  if (conectado === null) return <Tarjeta className="h-[120px] animate-pulse">{null}</Tarjeta>;

  return (
    <Tarjeta className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[17px] font-medium">Tu Instagram (vía Windsor)</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${conectado ? "border-good/40 text-good" : "border-line text-text-3"}`}>
            {conectado ? "Conectado" : "Sin conectar"}
          </span>
          {conectado && cuenta && <span className="text-[13px] text-text-2">@{cuenta}</span>}
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
              window.dispatchEvent(new Event("windsor:cambio"));
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
      {(error || (!conectado && avisoVuelta)) && <p className="text-[13px] text-bad">{error || avisoVuelta}</p>}
    </Tarjeta>
  );
}
