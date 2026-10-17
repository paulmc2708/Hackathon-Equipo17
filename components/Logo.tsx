"use client";

// Logo de Hookia: un anzuelo (el "gancho" que engancha en los primeros segundos) sobre el degradé de la marca.
import { useId } from "react";

export function LogoHookia({ tam = 28 }: { tam?: number }) {
  const id = `hk${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" width={tam} height={tam} className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3987e5" />
          <stop offset="1" stopColor="#d55181" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="19.5" cy="7.6" r="2.1" />
        <path d="M19.5 9.7V18.2a5.2 5.2 0 0 1-10.4 0v-3.4" />
        <path d="M9.1 14.8l3 2.6" />
      </g>
    </svg>
  );
}

/** "Hookia" con el "ia" en el degradé de la marca. */
export function NombreHookia({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-[-0.03em] ${className}`}>
      Hook<span className="bg-gradient-to-r from-[#3987e5] to-[#d55181] bg-clip-text text-transparent">ia</span>
    </span>
  );
}
