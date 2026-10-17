"use client";

import { useState } from "react";
import { Boton, Campo, Pagina, Tarjeta } from "@/components/ui";
import { useWindsorConectado } from "@/components/CuentaWindsor";
import { useCuentaInstagram } from "@/lib/client/useCuentaInstagram";
import { useCreador } from "@/lib/client/store";
import { fotoDePerfil } from "@/lib/client/media";
import { Avatar } from "@/components/Avatar";
import { Resumen } from "@/components/Resumen";

// Inicio en 3 pasos: conectar Claude, conectar Instagram (Windsor) y contar en una frase quién sos.
// Lo demás lo pregunta el agente cuando lo necesita.
export default function Inicio() {
  const [creador, guardar, listo] = useCreador();
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
  return (
    <Pagina titulo={tiene ? `Hola, ${creador.nombre?.trim().split(/\s+/)[0] || `@${creador.usuario}`}` : "Bienvenido a Hookia"} bajada={tiene ? "Esto es lo más importante de tu Instagram hoy." : "Contame quién sos y arrancamos."}>
      {tiene && <Resumen />}
      <div className="space-y-8">
        {cuentaIG.trayendo ? (
          <p className="text-[13px] text-text-2">Trayendo tu nombre y tu foto desde Instagram…</p>
        ) : (
          cuentaIG.falta && (
            <button onClick={cuentaIG.traer} className="text-[13px] font-medium text-sec hover:opacity-80">
              Traer mi foto y mi nombre de Instagram
            </button>
          )
        )}
        <div>
          <p className="mb-3 text-[15px] font-medium">Tus datos</p>
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
