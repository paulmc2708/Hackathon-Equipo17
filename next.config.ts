import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// Política de contenido: solo se carga lo propio. En desarrollo Next necesita eval y el websocket de recarga.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // El servidor escucha en 127.0.0.1; así también anda abriendo http://localhost:3000.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // El agente lee los SKILL.md en tiempo de ejecución: incluirlos en el deploy de Vercel.
  outputFileTracingIncludes: {
    "/api/agent": ["./.claude/skills/ig-*/**/*", "./.claude/skills/analisis-instagram/**/*", "./.claude/skills/carrusel-10/**/*", "./.claude/skills/metricas-que-importan/**/*", "./conocimiento/**/*"],
  },
};

export default nextConfig;
