"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Boton, Campo, Tarjeta } from "@/components/ui";
import { useCuenta } from "@/lib/client/useCuenta";

/** Tarjeta para conectar la cuenta de Claude de esta compu (Claude Code) con un botón. */
export function CuentaClaude() {
  const { cuenta, refrescar, avisar } = useCuenta();
  const [esperando, setEsperando] = useState<{ url?: string; pideCodigo: boolean } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mientras se inicia sesión en el navegador, revisamos cada 2 s si ya quedó conectada.
  useEffect(() => {
    if (!esperando) return;
    timer.current = setInterval(async () => {
      const r = await fetch("/api/claude", { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (r?.conectado) {
        setEsperando(null);
        avisar();
      }
    }, 2000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [esperando, avisar]);

  const accion = async (body: Record<string, string>) => {
    setCargando(true);
    setError("");
    try {
      const r = await fetch("/api/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error ?? "Algo falló.");
      return j;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setCargando(false);
    }
  };

  const conectar = async () => {
    const j = await accion({ accion: "login" });
    if (j) setEsperando({ url: j.url, pideCodigo: j.pideCodigo });
  };

  if (!cuenta) return <Tarjeta className="h-[132px] animate-pulse">{null}</Tarjeta>;

  return (
    <Tarjeta className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[17px] font-medium">Tu cuenta de Claude</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cuenta.conectado ? "border-good/40 text-good" : "border-line text-text-3"}`}>
            {cuenta.conectado ? "Conectada" : "Sin conectar"}
          </span>
        </div>
        <p className="mt-1 text-[14px] text-text-2">
          {cuenta.conectado
            ? `El agente corre en tu compu con ${cuenta.email ?? "tu cuenta"}. No hay costos aparte: usa tu plan de Claude.`
            : "El agente corre en tu compu con tu propia cuenta de Claude. Conectala una vez y listo."}
        </p>
      </div>

      {!cuenta.instalado && (
        <div className="space-y-2 rounded-[14px] bg-raised px-4 py-3 text-[14px]">
          <p>Primero instalá Claude Code en esta compu. En la terminal:</p>
          <code className="block rounded-[10px] bg-bg px-3 py-2 text-[13px]">npm install -g @anthropic-ai/claude-code</code>
          <Boton variante="borde" onClick={refrescar}>Ya lo instalé</Boton>
        </div>
      )}

      {cuenta.instalado && esperando && (
        <div className="space-y-4 rounded-[14px] bg-raised px-4 py-4 text-[14px]">
          <p>Se abrió una pestaña para que entres con tu cuenta de Claude. Cuando termines, esto se actualiza solo.</p>
          {esperando.url && (
            <a href={esperando.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-text-2 underline-offset-4 hover:text-text hover:underline">
              ¿No se abrió? Abrila acá <ExternalLink size={13} />
            </a>
          )}
          <div className="space-y-3 border-t border-line pt-4">
            <Campo
              label="Si la página te muestra un código, pegalo acá"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código de autorización"
            />
            <div className="flex gap-3">
              <Boton
                disabled={!codigo.trim()}
                cargando={cargando}
                onClick={async () => {
                  const j = await accion({ accion: "codigo", codigo });
                  if (j?.conectado) {
                    setEsperando(null);
                    setCodigo("");
                    avisar();
                  } else if (j) setError("Todavía no quedó conectada. Revisá el código y probá de nuevo.");
                }}
              >
                Confirmar código
              </Boton>
              <Boton variante="suave" onClick={async () => { await accion({ accion: "cancelar" }); setEsperando(null); }}>
                Cancelar
              </Boton>
            </div>
          </div>
        </div>
      )}

      {cuenta.instalado && !esperando && (
        <div className="flex gap-3">
          {cuenta.conectado ? (
            <>
              <Boton variante="borde" cargando={cargando} onClick={conectar}>Cambiar de cuenta</Boton>
              <Boton variante="suave" onClick={async () => { await accion({ accion: "logout" }); avisar(); }}>Desconectar</Boton>
            </>
          ) : (
            <Boton cargando={cargando} onClick={conectar}>Conectar con Claude</Boton>
          )}
        </div>
      )}
      {error && <p className="text-[13px] text-bad">{error}</p>}
    </Tarjeta>
  );
}
