"use client";

import { useState } from "react";
import { Boton, Campo, Pagina, Tarjeta } from "@/components/ui";
import { CuentaClaude } from "@/components/CuentaClaude";
import { CuentaWindsor, useWindsorConectado } from "@/components/CuentaWindsor";
import { useCuentaInstagram } from "@/lib/client/useCuentaInstagram";
import { useCreador } from "@/lib/client/store";
import { fotoDePerfil } from "@/lib/client/media";
import { Avatar } from "@/components/Avatar";
import { Resumen } from "@/components/Resumen";
import { useCuenta } from "@/lib/client/useCuenta";

// Inicio en 3 pasos: conectar Claude, conectar Instagram (Windsor) y contar en una frase quién sos.
// Lo demás lo pregunta el agente cuando lo necesita.
export default function Inicio() {
  const [creador, guardar, listo] = useCreador();
  const { cuenta } = useCuenta();
  const [usuario, setUsuario] = useState<string | null>(null);
  const [quien, setQuien] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [errorFoto, setErrorFoto] = useState("");
  const { conectado: windsor } = useWindsorConectado();
  const cuentaIG = useCuentaInstagram(creador, guardar, windsor, listo);
  if (!listo) return null;

  const u = usuario ?? creador.usuario;
  const q = quien ?? creador.aQueSeDedica;
  const n = nombre ?? creador.nombre ?? "";
  const subirFoto = async (f?: File) => {
    if (!f) return;
    setErrorFoto("");
    try {
      guardar({ ...creador, foto: await fotoDePerfil(f) });
    } catch {
      setErrorFoto("No pude leer esa imagen. Probá con un JPG o PNG.");
    }
  };
  const tiene = Boolean(creador.usuario);
  const paso = (n: number, titulo: string, hecho: boolean) => (
    <p className="mb-3 flex items-center gap-2 text-[13px] text-text-2">
      <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${hecho ? "bg-good text-bg" : "border border-line"}`}>{hecho ? "✓" : n}</span>
      {titulo}
    </p>
  );

  return (
    <Pagina titulo={tiene ? `Hola, ${creador.nombre?.trim().split(/\s+/)[0] || `@${creador.usuario}`}` : "Tu coach de Instagram"} bajada="Conectá tus cuentas y contame quién sos. El resto te lo voy preguntando.">
      {tiene && <Resumen />}
      <div className="space-y-8">
        <div>
          {paso(1, "Conectá tu cuenta de Claude", Boolean(cuenta?.conectado))}
          <CuentaClaude />
        </div>
        <div>
          {paso(2, "Conectá tu Instagram (opcional, recomendado)", Boolean(windsor))}
          <CuentaWindsor />
          {cuentaIG.trayendo && <p className="mt-3 text-[13px] text-text-2">Trayendo tu nombre y tu foto desde Instagram…</p>}
        </div>
        <div>
          {paso(3, "Contame quién sos", tiene)}
          <Tarjeta className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar creador={{ ...creador, nombre: n, usuario: u }} tam={56} />
              <div>
                <label className="inline-flex cursor-pointer items-center rounded-full border border-line px-4 py-2 text-[14px] font-medium transition-colors hover:border-line-strong">
                  {creador.foto ? "Cambiar foto" : "Subir tu foto de perfil"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => subirFoto(e.target.files?.[0])} />
                </label>
                {creador.foto && (
                  <button onClick={() => guardar({ ...creador, foto: "" })} className="ml-3 text-[13px] text-text-2 hover:text-text">
                    Sacar
                  </button>
                )}
                <span className="mt-1.5 block text-[13px] text-text-2">{errorFoto || "La misma que usás en Instagram."}</span>
              </div>
            </div>
            <Campo label="Tu nombre" placeholder="Como aparece en tu perfil" value={n} onChange={(e) => setNombre(e.target.value)} />
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
                guardar({ ...creador, nombre: n.trim(), usuario: u.replace(/^@/, "").trim(), aQueSeDedica: q.trim() });
                setUsuario(null);
                setQuien(null);
                setNombre(null);
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
