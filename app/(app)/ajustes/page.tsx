"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Boton, Pagina, Tarjeta } from "@/components/ui";
import { verRecorridoDeNuevo } from "@/components/Puerta";
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
        <Tarjeta className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[15px] font-medium">¿Para qué sirve cada sección?</p>
            <p className="mt-1 text-[13px] text-text-2">Volvé a ver el recorrido de 30 segundos.</p>
          </div>
          <Boton variante="borde" onClick={verRecorridoDeNuevo}>Ver el recorrido</Boton>
        </Tarjeta>
      </div>
    </Pagina>
  );
}
