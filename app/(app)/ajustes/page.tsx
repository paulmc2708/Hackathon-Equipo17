"use client";

import { useState } from "react";
import { Boton, Campo, Pagina, Tarjeta } from "@/components/ui";
import { useClave } from "@/lib/client/store";

export default function Ajustes() {
  const [clave, guardar, listo] = useClave();
  const [borrador, setBorrador] = useState<string | null>(null);
  if (!listo) return null;
  const valor = borrador ?? clave;
  const valida = !valor || /^sk-ant-[\w-]{20,}$/.test(valor);
  return (
    <Pagina titulo="Tu cuenta de Anthropic" bajada="El agente corre con tu propia cuenta: pagás solo lo que usás, sin suscripción nuestra.">
      <Tarjeta className="space-y-5">
        <Campo
          label="Clave de API"
          type="password"
          placeholder="sk-ant-…"
          value={valor}
          onChange={(e) => setBorrador(e.target.value.trim())}
          ayuda="La sacás en console.anthropic.com → API keys. Se guarda solo en este navegador y no la guardamos en ningún servidor."
        />
        {!valida && <p className="text-[13px] text-bad">Esa clave no parece de Anthropic: tiene que empezar con sk-ant-.</p>}
        <div className="flex items-center gap-3">
          <Boton disabled={!valida || borrador === null} onClick={() => { guardar(valor); setBorrador(null); }}>Guardar</Boton>
          {clave && <Boton variante="suave" onClick={() => { guardar(""); setBorrador(null); }}>Desconectar</Boton>}
          <span className="text-[13px] text-text-2">{clave ? "Conectada" : "Sin conectar: se usa el modo demo si está disponible"}</span>
        </div>
      </Tarjeta>
    </Pagina>
  );
}
