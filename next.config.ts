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
    "/api/agent": ["./.claude/skills/ig-*/**/*"],
  },
};

export default nextConfig;
