"use client";

import { useState } from "react";
import { Boton, Campo, Pagina, Tarjeta } from "@/components/ui";
import { useClave, useWindsor } from "@/lib/client/store";

function Conexion({
  titulo,
  texto,
  label,
  placeholder,
  ayuda,
  valida,
  usar,
}: {
  titulo: string;
  texto: string;
  label: string;
  placeholder: string;
  ayuda: string;
  valida: (v: string) => boolean;
  usar: () => readonly [string, (v: string) => void, boolean];
}) {
  const [guardada, guardar, listo] = usar();
  const [borrador, setBorrador] = useState<string | null>(null);
  if (!listo) return null;
  const valor = borrador ?? guardada;
  const ok = !valor || valida(valor);
  return (
    <Tarjeta className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[17px] font-medium">{titulo}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${guardada ? "border-good/40 text-good" : "border-line text-text-3"}`}>
            {guardada ? "Conectada" : "Sin conectar"}
          </span>
        </div>
        <p className="mt-1 text-[14px] text-text-2">{texto}</p>
      </div>
      <Campo label={label} type="password" placeholder={placeholder} value={valor} onChange={(e) => setBorrador(e.target.value.trim())} ayuda={ayuda} />
      {!ok && <p className="text-[13px] text-bad">Esa clave no tiene el formato esperado.</p>}
      <div className="flex gap-3">
        <Boton disabled={!ok || borrador === null} onClick={() => { guardar(valor); setBorrador(null); }}>Guardar</Boton>
        {guardada && <Boton variante="suave" onClick={() => { guardar(""); setBorrador(null); }}>Desconectar</Boton>}
      </div>
    </Tarjeta>
  );
}

export default function Ajustes() {
  return (
    <Pagina titulo="Conexiones" bajada="Tus claves se guardan solo en este navegador. No las guardamos en ningún servidor.">
      <div className="space-y-4">
        <Conexion
          titulo="Tu cuenta de Anthropic"
          texto="El agente corre con tu propia cuenta: pagás solo lo que usás, sin suscripción nuestra. Si no conectás ninguna, se usa el modo demo."
          label="Clave de API"
          placeholder="sk-ant-…"
          ayuda="La sacás en console.anthropic.com → API keys."
          valida={(v) => /^sk-ant-[\w-]{20,}$/.test(v)}
          usar={useClave}
        />
        <Conexion
          titulo="Tus métricas de Instagram (Windsor.ai)"
          texto="Para analizar tus números privados: alcance, vistas, seguidores y qué publicación te funcionó. Windsor tiene plan gratis."
          label="Clave de API de Windsor"
          placeholder="Tu api_key de Windsor"
          ayuda="1) Creá tu cuenta en windsor.ai  2) Conectá tu Instagram  3) Copiá tu clave de API desde tu cuenta de Windsor."
          valida={(v) => /^[\w-]{16,128}$/.test(v)}
          usar={useWindsor}
        />
      </div>
    </Pagina>
  );
}
