"use client";

// En cada sección: si el análisis automático todavía no llegó a esta, se avisa que está en la fila
// (en vez de "todavía no analizaste"), y si la está analizando ahora, que podés irte que sigue sola.
import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";
import { Boton, Tarjeta } from "@/components/ui";
import { useEnFila } from "@/lib/client/cola";
import { claveCorrida, estadoDe, suscribir, type TareaCompartida } from "@/lib/client/ejecutor";
import { CREADOR_VACIO, useGuardado, type Creador } from "@/lib/client/store";

export function EnFila({ tarea, onAhora }: { tarea: TareaCompartida; onAhora?: () => void }) {
  const fila = useEnFila(tarea);
  const [creador] = useGuardado<Creador>("creador", CREADOR_VACIO);
  const clave = claveCorrida(creador.usuario, tarea);
  const corrida = useSyncExternalStore(suscribir, () => estadoDe(clave), () => estadoDe(clave));

  if (corrida.corriendo && corrida.origen === "cola")
    return <p className="text-[13px] text-text-2">Lo estoy analizando solo, como parte del análisis de tu cuenta. Podés ir a otra sección: sigue igual.</p>;
  if (!fila) return null;
  return (
    <Tarjeta className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-sec/15 text-sec">
          <Clock size={18} strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[15px] font-medium">Está en la fila</p>
          <p className="mt-0.5 text-[13px] text-text-2">
            {fila.ahora ? `Estoy con ${fila.ahora}. Después sigo con esto, solo: no tenés que tocar nada.` : "Lo analizo solo apenas arranque: no tenés que tocar nada."}
          </p>
        </div>
      </div>
      {onAhora && (
        <Boton variante="borde" onClick={onAhora}>
          Analizar ahora
        </Boton>
      )}
    </Tarjeta>
  );
}
