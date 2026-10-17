# Coach de Instagram con IA (Build 101, equipo 17)

Agente especializado en marca personal: analiza tu perfil, encuentra lo que funciona en tu nicho y te escribe el guion con tu voz.

## Correr en local
1. `npm install`
2. Copiar `.env.example` a `.env.local` y poner `ANTHROPIC_API_KEY`.
3. `npm run dev` → http://localhost:3000/agente (página de prueba del agente)

## Cómo funciona el agente
- `app/api/agent/route.ts`: recibe el pedido y devuelve los eventos del agente en streaming (NDJSON).
- `lib/agent/run.ts`: loop del agente con Claude (`claude-opus-5-5`). System prompt = reglas + la skill de la tarea (cacheado). Herramientas: `obtener_perfil_instagram`, `calcular_outliers`, `web_search`, `web_fetch` y `entregar_resultado` (salida validada con zod).
- `lib/agent/tasks.ts`: las tareas (perfil, ideas, guion) con su skill, su esquema de salida y su consigna.
- `lib/tools/`: Instagram (Business Discovery de Meta) y el cálculo de outliers (código, no IA).

## Estado
- Funciona: estructura del agente, streaming, validación de la salida y cálculo de outliers.
- Pendiente: interfaz final (barra lateral), conexión real con Meta, memoria del creador.
- Skills de terceros: instagram-agent-skill y master-skills de Jake Schincariol (MIT), HyperFrames (Apache-2.0). Ver `licencias/`.
