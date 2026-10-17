"use client";

import Link from "next/link";
import { useState } from "react";
import { Boton, Campo, Pagina, Tarjeta } from "@/components/ui";
import { CuentaClaude } from "@/components/CuentaClaude";
import { CuentaWindsor } from "@/components/CuentaWindsor";
import { useCreador } from "@/lib/client/store";
import { useCuenta } from "@/lib/client/useCuenta";

// Inicio en 3 pasos: conectar Claude, conectar Instagram (Windsor) y contar en una frase quién sos.
// Lo demás lo pregunta el agente cuando lo necesita.
export default function Inicio() {
  const [creador, guardar, listo] = useCreador();
  const { cuenta } = useCuenta();
  const [usuario, setUsuario] = useState<string | null>(null);
  const [quien, setQuien] = useState<string | null>(null);
  if (!listo) return null;

  const u = usuario ?? creador.usuario;
  const q = quien ?? creador.aQueSeDedica;
  const tiene = Boolean(creador.usuario);
  const paso = (n: number, titulo: string, hecho: boolean) => (
    <p className="mb-3 flex items-center gap-2 text-[13px] text-text-2">
      <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${hecho ? "bg-good text-bg" : "border border-line"}`}>{hecho ? "✓" : n}</span>
      {titulo}
    </p>
  );

  return (
    <Pagina titulo={tiene ? `Hola, @${creador.usuario}` : "Tu coach de Instagram"} bajada="Conectá tus cuentas y contame quién sos. El resto te lo voy preguntando.">
      {tiene && (
        <div className="mb-10 grid gap-3 sm:grid-cols-3">
          {[
            { href: "/perfil", t: "Analizar mi perfil", d: "Nota sobre 100 y qué cambiar" },
            { href: "/metricas", t: "Mis métricas", d: "Tus números y qué hacer con ellos" },
            { href: "/competencia", t: "Mi competencia", d: "Qué hacen las cuentas que te gustan" },
          ].map((a, i) => (
            <Link key={a.href} href={a.href}>
              <Tarjeta i={i} className="h-full transition-colors hover:border-line-strong">
                <p className="text-[15px] font-medium">{a.t}</p>
                <p className="mt-1 text-[13px] text-text-2">{a.d}</p>
              </Tarjeta>
            </Link>
          ))}
        </div>
      )}
      <div className="space-y-8">
        <div>
          {paso(1, "Conectá tu cuenta de Claude", Boolean(cuenta?.conectado))}
          <CuentaClaude />
        </div>
        <div>
          {paso(2, "Conectá tu Instagram (opcional, recomendado)", false)}
          <CuentaWindsor />
        </div>
        <div>
          {paso(3, "Contame quién sos", tiene)}
          <Tarjeta className="space-y-5">
            <Campo label="Tu usuario de Instagram" placeholder="sin @" value={u} onChange={(e) => setUsuario(e.target.value)} />
            <Campo
              label="¿A qué te dedicás y qué vendés?"
              placeholder="Ej: soy entrenador personal y vendo planes online"
              value={q}
              onChange={(e) => setQuien(e.target.value)}
              ayuda="Con una frase alcanza. Si necesito más, te pregunto."
            />
            <Boton
              disabled={!u.trim()}
              onClick={() => {
                guardar({ ...creador, usuario: u.replace(/^@/, "").trim(), aQueSeDedica: q.trim() });
                setUsuario(null);
                setQuien(null);
              }}
            >
              {tiene ? "Guardar" : "Listo"}
            </Boton>
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
