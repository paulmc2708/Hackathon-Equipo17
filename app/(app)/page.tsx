"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Boton, Campo, Pagina, Tarjeta } from "@/components/ui";
import { useWindsorConectado } from "@/components/CuentaWindsor";
import { useCuentaInstagram } from "@/lib/client/useCuentaInstagram";
import { claveUsuario, datosDeCuenta, useCreador, useCuentasGuardadas, type Creador } from "@/lib/client/store";
import { fotoDePerfil } from "@/lib/client/media";
import { Avatar } from "@/components/Avatar";
import { Resumen } from "@/components/Resumen";

/** "@nutri.ana", "nutri.ana" o el link del perfil → "nutri.ana". */
const usuarioDe = (t: string) => (t.match(/instagram\.com\/([\w.]+)/i)?.[1] ?? t).replace(/^@/, "").replace(/[^\w.]/g, "").slice(0, 30);

/** Analizar otra cuenta (por ejemplo, la que pide el jurado): cada cuenta tiene sus análisis aparte. */
function OtraCuenta({ creador, guardar, onListo }: { creador: Creador; guardar: (c: Creador) => void; onListo: () => void }) {
  const cuentas = useCuentasGuardadas().filter((c) => claveUsuario(c.usuario) !== claveUsuario(creador.usuario));
  const [otra, setOtra] = useState("");
  const ir = (u: string) => {
    const limpio = usuarioDe(u);
    if (!limpio) return;
    guardar(datosDeCuenta(creador, limpio));
    onListo();
  };
  return (
    <Tarjeta className="space-y-4">
      <div>
        <p className="text-[15px] font-medium">¿Qué cuenta querés analizar?</p>
        <p className="mt-1 text-[13px] text-text-2">Cada cuenta tiene sus análisis aparte. Lo de @{creador.usuario} queda guardado para volver.</p>
      </div>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          ir(otra);
        }}
      >
        <input
          autoFocus
          value={otra}
          onChange={(e) => setOtra(e.target.value)}
          placeholder="@usuario o el link del perfil"
          aria-label="Usuario de Instagram"
          className="h-10 w-full rounded-[14px] border border-line bg-bg px-4 text-[15px] text-text outline-none placeholder:text-text-3 focus:border-line-strong"
        />
        <Boton type="submit" disabled={!usuarioDe(otra)}>Analizar esta cuenta</Boton>
      </form>
      {cuentas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-text-3">Ya analizadas:</span>
          {cuentas.map((c) => (
            <button key={c.usuario} onClick={() => ir(c.usuario)} className="rounded-full border border-line px-3 py-1 text-[13px] text-text-2 transition-colors hover:border-line-strong hover:text-text">
              @{c.usuario}
            </button>
          ))}
        </div>
      )}
    </Tarjeta>
  );
}

// Inicio en 3 pasos: conectar Claude, conectar Instagram (Windsor) y contar en una frase quién sos.
// Lo demás lo pregunta el agente cuando lo necesita.
export default function Inicio() {
  const [creador, guardar, listo] = useCreador();
  const [usuario, setUsuario] = useState<string | null>(null);
  const [quien, setQuien] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [errorFoto, setErrorFoto] = useState("");
  const [cambiando, setCambiando] = useState(false);
  const { conectado: windsor, cuenta: cuentaW } = useWindsorConectado();
  const cuentaIG = useCuentaInstagram(creador, guardar, windsor, cuentaW, listo);
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
  const limpiarFormulario = () => {
    setUsuario(null);
    setQuien(null);
    setNombre(null);
  };
  const tiene = Boolean(creador.usuario);
  // Estás viendo otra cuenta que la de Windsor (por ejemplo, la del jurado): se avisa y se ofrece volver.
  const otraQueWindsor = Boolean(windsor && cuentaW && tiene && claveUsuario(creador.usuario) !== cuentaW);
  return (
    <Pagina
      titulo={tiene ? `Hola, ${creador.nombre?.trim().split(/\s+/)[0] || `@${creador.usuario}`}` : "Bienvenido a Hookia"}
      bajada={tiene ? "Esto es lo más importante de tu Instagram hoy." : "Contame quién sos y arrancamos."}
      accion={
        tiene ? (
          <Boton variante="borde" onClick={() => setCambiando((v) => !v)} aria-expanded={cambiando}>
            <ArrowLeftRight size={15} strokeWidth={1.8} /> Otra cuenta
          </Boton>
        ) : undefined
      }
    >
      {cambiando && (
        <div className="mb-8">
          <OtraCuenta
            creador={creador}
            guardar={guardar}
            onListo={() => {
              setCambiando(false);
              limpiarFormulario();
            }}
          />
        </div>
      )}
      {otraQueWindsor && (
        <div className="mb-8 flex flex-col gap-3 rounded-[16px] border border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-text-2">
            Estás viendo <span className="font-medium text-text">@{creador.usuario}</span>. Tus métricas privadas de Windsor son de @{cuentaW}, así que acá uso lo público y lo que subas.
          </p>
          <Boton
            variante="suave"
            onClick={() => {
              guardar(datosDeCuenta(creador, cuentaW!));
              limpiarFormulario();
            }}
          >
            Volver a @{cuentaW}
          </Boton>
        </div>
      )}
      {tiene && <Resumen />}
      <div className="space-y-8">
        {cuentaIG.trayendo ? (
          <p className="text-[13px] text-text-2">Trayendo tu nombre y tu foto desde Instagram…</p>
        ) : (
          cuentaIG.falta && (
            <div className="space-y-1">
              <button onClick={cuentaIG.traer} className="text-[13px] font-medium text-sec hover:opacity-80">
                {cuentaIG.error ? "Probar de nuevo: traer mi foto y mi nombre" : "Traer mi foto y mi nombre de Instagram"}
              </button>
              {cuentaIG.error && <p className="text-[13px] text-bad">No pude traer tus datos de Instagram: {cuentaIG.error}</p>}
            </div>
          )
        )}
        <div>
          <p className="mb-3 text-[15px] font-medium">Tus datos</p>
          <Tarjeta className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar creador={{ ...creador, nombre: n, usuario: u }} tam={56} />
              <div>
                <label className="inline-flex cursor-pointer items-center rounded-full border border-line px-4 py-2 text-[14px] font-medium transition-colors focus-within:ring-2 focus-within:ring-sec hover:border-line-strong">
                  {creador.foto ? "Cambiar foto" : "Subir tu foto de perfil"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      subirFoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
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
              disabled={!usuarioDe(u)}
              onClick={() => {
                const nuevo = usuarioDe(u);
                // Otro @ = otra cuenta: se traen sus datos (o de cero) y encima va solo lo que escribiste acá.
                const base = tiene && claveUsuario(nuevo) !== claveUsuario(creador.usuario) ? datosDeCuenta(creador, nuevo) : creador;
                guardar({
                  ...base,
                  usuario: nuevo,
                  ...(nombre !== null || base === creador ? { nombre: n.trim() } : {}),
                  ...(quien !== null || base === creador ? { aQueSeDedica: q.trim() } : {}),
                });
                limpiarFormulario();
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
