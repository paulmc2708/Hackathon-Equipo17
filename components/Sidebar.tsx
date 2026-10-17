"use client";

// Barra lateral al estilo de app.workfly.io: un riel flotante de íconos que, al expandirse,
// se abre como panel encima del contenido. Los grupos se abren y cierran como acordeón.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Home,
  KeyRound,
  Lightbulb,
  MessagesSquare,
  PenLine,
  Radar,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon; pronto?: boolean };
type Grupo = { id: string; label: string; items: Item[] };

const INICIO: Item = { href: "/", label: "Inicio", icon: Home };
// Cada sección es un área grande que junta varias skills de Jake (ver CLAUDE.md §16).
const GRUPOS: Grupo[] = [
  {
    id: "analizar",
    label: "Analizar",
    items: [
      { href: "/perfil", label: "Mi perfil", icon: UserRound },
      { href: "/ideas", label: "Ideas de tu nicho", icon: Lightbulb },
    ],
  },
  {
    id: "crear",
    label: "Crear",
    items: [
      { href: "/guiones", label: "Contenido", icon: PenLine },
      { href: "/video", label: "Editar video", icon: Clapperboard, pronto: true },
    ],
  },
  {
    id: "crecer",
    label: "Crecer",
    items: [
      { href: "/comunidad", label: "Mensajes", icon: MessagesSquare, pronto: true },
      { href: "/busqueda", label: "Plan semanal", icon: Radar, pronto: true },
    ],
  },
];
const AJUSTES: Item = { href: "/ajustes", label: "Tu cuenta de Anthropic", icon: KeyRound };
const TODOS = [INICIO, ...GRUPOS.flatMap((g) => g.items), AJUSTES];

const GRUPOS_DEFAULT: Record<string, boolean> = { analizar: true, crear: true, crecer: true };

export function Sidebar() {
  const path = usePathname();
  const [abierta, setAbierta] = useState(false);
  const [grupos, setGrupos] = useState(GRUPOS_DEFAULT);
  const [buscar, setBuscar] = useState("");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let g = GRUPOS_DEFAULT;
    try {
      g = { ...GRUPOS_DEFAULT, ...JSON.parse(localStorage.getItem("sidebar-grupos") ?? "{}") };
    } catch {}
    queueMicrotask(() => setGrupos(g));
  }, []);

  // ⌘B / Ctrl+B abre y cierra. Escape y clic afuera cierran.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setAbierta((v) => !v);
      } else if (e.key === "Escape") setAbierta(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setAbierta(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  const alternarGrupo = (id: string) =>
    setGrupos((g) => {
      const n = { ...g, [id]: !g[id] };
      try {
        localStorage.setItem("sidebar-grupos", JSON.stringify(n));
      } catch {}
      return n;
    });

  const activo = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const fila = (it: Item) => {
    const Icon = it.icon;
    return (
      <Link
        key={it.href}
        href={it.href}
        onClick={() => setAbierta(false)}
        title={abierta ? undefined : it.label}
        className={`flex h-10 items-center gap-3 rounded-[14px] border px-2.5 text-[14px] font-medium transition-colors duration-150 ${
          activo(it.href)
            ? "border-line bg-raised text-text"
            : "border-transparent text-text-2 hover:bg-raised hover:text-text"
        } ${abierta ? "" : "justify-center"}`}
      >
        <Icon size={18} strokeWidth={1.6} className="shrink-0" />
        {abierta && (
          <>
            <span className="truncate">{it.label}</span>
            {it.pronto && <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px] text-text-3">pronto</span>}
          </>
        )}
      </Link>
    );
  };

  const filtro = buscar.trim().toLowerCase();
  const resultados = filtro ? TODOS.filter((it) => it.label.toLowerCase().includes(filtro)) : [];

  return (
    <>
      {/* Lugar que ocupa el riel en el layout; el panel expandido flota encima del contenido. */}
      <div className="w-[92px] shrink-0" aria-hidden />
      <div
        ref={panel}
        className={`fixed top-6 bottom-6 left-6 z-40 flex flex-col rounded-[14px] border border-line bg-panel transition-[width,box-shadow] duration-200 ease-out ${
          abierta ? "w-[288px] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" : "w-[68px]"
        }`}
      >
        <div className="flex h-14 items-center gap-3 px-[22px]">
          <span className="size-[22px] shrink-0 rounded-full bg-text" aria-hidden />
          {abierta && <span className="text-[15px] font-medium">Coach</span>}
        </div>

        <div className="px-2.5">
          <button
            onClick={() => setAbierta((v) => !v)}
            title="⌘B"
            aria-label={abierta ? "Contraer barra lateral" : "Expandir barra lateral"}
            className={`flex h-10 w-full items-center rounded-[14px] border text-[14px] transition-colors ${
              abierta
                ? "justify-between border-line-strong bg-hover/40 px-2.5 text-text"
                : "justify-center border-transparent text-text-2 hover:bg-raised hover:text-text"
            }`}
          >
            {abierta ? (
              <>
                Contraer <ChevronLeft size={16} strokeWidth={1.6} />
              </>
            ) : (
              <ChevronRight size={18} strokeWidth={1.6} />
            )}
          </button>
        </div>

        <div className="mt-2 px-2.5">
          {abierta ? (
            <label className="flex h-10 items-center gap-2 rounded-full border border-line px-3 text-text-2">
              <Search size={16} strokeWidth={1.6} />
              <input
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar en la app…"
                className="w-full bg-transparent text-[14px] text-text outline-none placeholder:text-text-3"
              />
            </label>
          ) : (
            <button
              onClick={() => setAbierta(true)}
              aria-label="Buscar"
              className="flex h-10 w-full items-center justify-center rounded-[14px] text-text-2 transition-colors hover:bg-raised hover:text-text"
            >
              <Search size={18} strokeWidth={1.6} />
            </button>
          )}
        </div>

        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-2.5">
          {filtro ? (
            resultados.length ? (
              resultados.map(fila)
            ) : (
              <p className="px-2.5 py-2 text-[13px] text-text-3">Nada con ese nombre.</p>
            )
          ) : (
            <>
              {fila(INICIO)}
              {GRUPOS.map((g) => (
                <div key={g.id} className="pt-2">
                  {abierta ? (
                    <button
                      onClick={() => alternarGrupo(g.id)}
                      aria-expanded={grupos[g.id]}
                      className="flex w-full items-center justify-between px-2.5 pt-2 pb-1.5 text-[12px] font-medium tracking-[0.05em] text-text-2 uppercase transition-colors hover:text-text"
                    >
                      {g.label}
                      <ChevronDown size={14} strokeWidth={1.6} className={`transition-transform duration-200 ${grupos[g.id] ? "" : "-rotate-90"}`} />
                    </button>
                  ) : (
                    <div className="mx-3 mb-2 border-t border-line" />
                  )}
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      !abierta || grupos[g.id] ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      {g.items.map(fila)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-line px-2.5 py-2.5">
          {fila(AJUSTES)}
        </div>
      </div>
    </>
  );
}
