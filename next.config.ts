import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    "/api/agent": ["./.claude/skills/ig-*/**/*", "./.claude/skills/analisis-instagram/**/*", "./.claude/skills/carrusel-10/**/*"],
  },
};

export default nextConfig;
