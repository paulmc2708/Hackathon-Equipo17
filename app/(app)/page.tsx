"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boton, Campo, Pagina, Tarjeta } from "@/components/ui";
import { CREADOR_VACIO, useCreador } from "@/lib/client/store";

// Inicio = onboarding de marca personal. Se completa una vez y lo usan todas las secciones.
export default function Inicio() {
  const [creador, guardar, listo] = useCreador();
  const router = useRouter();
  const [form, setForm] = useState<typeof CREADOR_VACIO | null>(null);
  const f = form ?? creador;
  const set = (k: keyof typeof CREADOR_VACIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...f, [k]: k === "captions" ? e.target.value.split(/\n\s*\n/) : e.target.value });

  if (!listo) return null;
  const tiene = Boolean(creador.usuario);

  return (
    <Pagina
      titulo={tiene ? `Hola, @${creador.usuario}` : "Tu coach de Instagram"}
      bajada={tiene ? "Esto es lo que sé de vos. Cambialo cuando quieras." : "Contame quién sos en un minuto. Con esto, todo lo que te proponga va a ser para vos."}
    >
      {tiene && !form && (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { href: "/perfil", t: "Analizar mi perfil", d: "Nota sobre 100 y qué cambiar" },
            { href: "/ideas", t: "Ideas de esta semana", d: "Lo que funciona en tu nicho" },
            { href: "/guiones", t: "Escribir un guion", d: "Hooks, guion y caption" },
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
      <Tarjeta className="space-y-6">
        <Campo label="Tu usuario de Instagram" placeholder="sin @" value={f.usuario} onChange={set("usuario")} />
        <Campo label="¿A qué te dedicás?" placeholder="Ej: entrenador personal" value={f.aQueSeDedica} onChange={set("aQueSeDedica")} />
        <Campo label="¿Qué vendés o querés vender?" placeholder="Ej: planes de entrenamiento online" value={f.queVende} onChange={set("queVende")} />
        <Campo label="¿A quién?" placeholder="Ej: gente que trabaja todo el día y no tiene tiempo" value={f.aQuien} onChange={set("aQuien")} />
        <Campo area label="¿Qué te hace distinto?" ayuda="2 o 3 cosas de tu historia. Es lo que nadie más puede contar." value={f.historia} onChange={set("historia")} />
        <Campo area label="3 textos tuyos" ayuda="Captions o mensajes que hayas escrito, separados por una línea en blanco. Así aprendo cómo hablás." value={f.captions.join("\n\n")} onChange={set("captions")} />
        <div className="flex gap-3">
          <Boton
            disabled={!f.usuario.trim()}
            onClick={() => {
              guardar({ ...f, usuario: f.usuario.replace(/^@/, "").trim(), captions: f.captions.map((c) => c.trim()).filter(Boolean) });
              setForm(null);
              if (!tiene) router.push("/perfil");
            }}
          >
            {tiene ? "Guardar cambios" : "Listo, analizá mi perfil"}
          </Boton>
          {form && <Boton variante="suave" onClick={() => setForm(null)}>Descartar</Boton>}
        </div>
      </Tarjeta>
    </Pagina>
  );
}
