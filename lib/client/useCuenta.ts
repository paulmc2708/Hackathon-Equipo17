"use client";

import { useCallback, useEffect, useState } from "react";

export type Cuenta = { instalado: boolean; conectado: boolean; email?: string } | null;

/** Estado de la cuenta de Claude de esta compu, compartido entre componentes (evento "cuenta:cambio"). */
export function useCuenta() {
  const [cuenta, setCuenta] = useState<Cuenta>(null);
  const refrescar = useCallback(async () => {
    try {
      const r = await fetch("/api/claude", { cache: "no-store", signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      setCuenta(r.ok ? j : { instalado: true, conectado: false });
    } catch {
      setCuenta({ instalado: true, conectado: false });
    }
  }, []);
  useEffect(() => {
    queueMicrotask(refrescar);
    const f = () => refrescar();
    window.addEventListener("cuenta:cambio", f);
    return () => window.removeEventListener("cuenta:cambio", f);
  }, [refrescar]);
  return { cuenta, refrescar, avisar: () => window.dispatchEvent(new Event("cuenta:cambio")) };
}
