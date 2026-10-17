# Hookia: tu coach de Instagram con IA (Build 101, equipo 17)

> Hookia encuentra lo que funciona en tu nicho y te escribe el guion con tu voz.

> Si vas a seguir desarrollando: leé primero [LEER-PRIMERO.md](LEER-PRIMERO.md).

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
3. Instalá Claude Code:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
4. Arrancá la app y abrí http://localhost:3000
   ```bash
   npm run dev
   ```
5. En la app, tocá **Conectar con Claude** (en Inicio o en Conexiones) y entrá con tu cuenta. Listo.

Todo corre en tu compu y gasta solo de tu cuenta de Claude. Este modo **no funciona en Vercel** (ahí no está Claude Code); es para uso local.

### Opcional
- **Tus métricas privadas de Instagram:** creá una cuenta gratis en windsor.ai, conectá tu Instagram ahí y después tocá **Conectar con Windsor** en la app (entrás con tu usuario de Windsor y das permiso). El agente solo usa las herramientas de Windsor que leen.
- **Datos públicos por @ (API de Meta):** `META_IG_USER_ID`, `META_ACCESS_TOKEN` en `.env.local` (ver `.env.example`).
- **Modo API** (para subirlo a un servidor más adelante): `LLM_MODO=api` y `ANTHROPIC_API_KEY` en `.env.local`.

## Cómo funciona
- `app/api/agent/route.ts`: recibe el pedido y devuelve los pasos del agente en vivo (NDJSON).
- `lib/agent/claudeLocal.ts`: modo local. Lanza `claude -p` con las skills como system prompt, las herramientas propias por MCP (`scripts/mcp-coach.ts`), búsqueda web y salida JSON validada.
- `lib/agent/run.ts`: modo API (SDK de Anthropic), con las mismas herramientas y salida.
- `lib/agent/tasks.ts`: las tareas (perfil, ideas, guion) con su skill, formato de salida y consigna.
- `lib/tools/`: datos de Instagram (Meta), Windsor y el cálculo de outliers (código, no IA).

## Estado
- Funciona: interfaz, agente en modo local y API, preguntas antes de arrancar, perfil, ideas, guion, Windsor.
- Novedades del día: el agente busca en la web lo que pasó esta semana en el nicho de la persona (con fecha y link de cada fuente) y propone ideas para publicar. Se corre a mano con **Buscar ahora** o solo, todos los días a las 7:00: en Mac se programa con un LaunchAgent (`lib/diario/programar.ts`), que corre `scripts/diario.ts` aunque la app esté cerrada. Si la Mac está dormida a esa hora, corre al despertarse; si está apagada, ese día no corre. En Windows y Linux, por ahora, solo a mano.
- Pendiente: edición de video, mensajes y comentarios, memoria en base de datos.
- Licencias de terceros en `licencias/`.

## Seguridad
- La app escucha solo en tu compu (`127.0.0.1`): nadie en la misma red Wi-Fi puede entrar.
- Las rutas `/api` (que corren Claude Code y Windsor) rechazan pedidos que no vengan de la misma página: bloquea DNS rebinding y que otra web abierta en el navegador las dispare (`proxy.ts`).
- Cabeceras de seguridad en todas las páginas: política de contenido (CSP), sin iframes de terceros, `nosniff`, sin referrer y sin cámara/micrófono/ubicación (`next.config.ts`).
- El agente solo puede leer la carpeta temporal con tus capturas (nunca tu carpeta personal) y, de Windsor, solo las herramientas que leen: las que crean, cambian o borran están prohibidas.
- Claves y tokens: no hacen falta variables de entorno. El permiso de Windsor queda en `.data/` con permisos solo para tu usuario (600), nunca se sube a GitHub (`.gitignore`) ni llega al navegador. Si usás el modo API o Meta, las claves van en `.env.local`, que tampoco se sube.
- Dependencias de la app: `npm audit --omit=dev` sin vulnerabilidades.
