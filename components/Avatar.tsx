"use client";

import Image from "next/image";
import type { Creador } from "@/lib/client/store";

export function nombreVisible(c: Creador) {
  return c.nombre?.trim() || (c.usuario ? `@${c.usuario}` : "");
}

/** Foto de la persona; si no subió, sus iniciales; si todavía no hay nadie, el punto del logo. */
export function Avatar({ creador, tam = 32 }: { creador: Creador; tam?: number }) {
  if (creador.foto) {
    return <Image src={creador.foto} alt="" width={tam} height={tam} unoptimized className="shrink-0 rounded-full object-cover" style={{ width: tam, height: tam }} />;
  }
  const n = nombreVisible(creador).replace(/^@/, "");
  if (!n) return <span className="shrink-0 rounded-full bg-text" style={{ width: tam * 0.7, height: tam * 0.7 }} aria-hidden />;
  const iniciales = n
    .split(/[\s._]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-raised font-medium text-text"
      style={{ width: tam, height: tam, fontSize: tam * 0.38 }}
      aria-hidden
    >
      {iniciales}
    </span>
  );
}
