"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Pagina } from "@/components/ui";
import { CuentaClaude } from "@/components/CuentaClaude";
import { CuentaWindsor } from "@/components/CuentaWindsor";

function AvisoWindsor() {
  const estado = useSearchParams().get("windsor");
  if (!estado) return null;
  const texto = { ok: "Listo, Windsor quedó conectado.", cancelado: "Cancelaste la conexión con Windsor.", error: "No se pudo conectar Windsor. Probá de nuevo." }[estado];
  if (!texto) return null;
  return <p className={`rounded-[14px] border px-4 py-3 text-[14px] ${estado === "ok" ? "border-good/30 bg-good/10 text-good" : "border-line text-text-2"}`}>{texto}</p>;
}

export default function Ajustes() {
  return (
    <Pagina titulo="Conexiones" bajada="Todo corre en tu compu. Conectás tus cuentas una vez y listo.">
      <div className="space-y-4">
        <Suspense fallback={null}>
          <AvisoWindsor />
        </Suspense>
        <CuentaClaude />
        <CuentaWindsor />
      </div>
    </Pagina>
  );
}
