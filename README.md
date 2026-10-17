# Coach de Instagram con IA (Build 101, equipo 17)

Un agente especializado en marca personal: analiza tu perfil, encuentra lo que funciona en tu nicho y te escribe el guion con tu voz. Usa las skills abiertas de Jake Schincariol (MIT) como base de conocimiento.

## Usarlo en tu compu con TU cuenta de Claude (sin pagar API)
El agente corre con Claude Code en modo headless (`claude -p`) y usa la cuenta de Claude con la que inicies sesión. El modelo es siempre **Claude Opus 5.5**.

1. Necesitás Node 22 o más nuevo y una cuenta de Claude con Claude Code.
2. Cloná e instalá:
   ```bash
   git clone https://github.com/paulmc2708/Hackathon-Equipo17.git
   cd Hackathon-Equipo17
   npm install
   ```
3. Instalá Claude Code e iniciá sesión con tu cuenta:
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude auth login
   ```
4. Creá `.env.local` con esta línea:
   ```
   LLM_MODO=claude-local
   ```
5. Arrancá la app y abrí http://localhost:3000
   ```bash
   npm run dev
   ```

Todo corre en tu compu y gasta solo de tu cuenta de Claude. Este modo **no funciona en Vercel** (ahí no está Claude Code); es para uso local.

### Opcional
- **Tus métricas privadas de Instagram:** creá una cuenta gratis en windsor.ai, conectá tu Instagram y pegá tu clave de Windsor en *Conexiones*.
- **Datos públicos por @ (API de Meta):** `META_IG_USER_ID`, `META_ACCESS_TOKEN` en `.env.local` (ver `.env.example`).
- **Modo API** (en vez de headless): sacá `LLM_MODO` y poné `ANTHROPIC_API_KEY`, o pegá tu clave en *Conexiones*.

## Cómo funciona
- `app/api/agent/route.ts`: recibe el pedido y devuelve los pasos del agente en vivo (NDJSON).
- `lib/agent/claudeLocal.ts`: modo local. Lanza `claude -p` con las skills como system prompt, las herramientas propias por MCP (`scripts/mcp-coach.ts`), búsqueda web y salida JSON validada.
- `lib/agent/run.ts`: modo API (SDK de Anthropic), con las mismas herramientas y salida.
- `lib/agent/tasks.ts`: las tareas (perfil, ideas, guion) con su skill, formato de salida y consigna.
- `lib/tools/`: datos de Instagram (Meta), Windsor y el cálculo de outliers (código, no IA).

## Estado
- Funciona: interfaz, agente en modo local y API, preguntas antes de arrancar, perfil, ideas, guion, Windsor.
- Pendiente: edición de video, mensajes y comentarios, plan semanal, memoria en base de datos.
- Licencias de terceros en `licencias/`.
