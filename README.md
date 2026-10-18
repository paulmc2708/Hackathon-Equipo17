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

## El equipo de agentes
Cada área de la app tiene su agente, con su conocimiento (skills), sus datos y su propio chat (botón abajo a la derecha o ⌘J). Contesta con lo que ya analizó de tu cuenta (`lib/agentes.ts`, `components/ChatAgente.tsx`).

| Agente | Área | Qué sabe y qué hace |
|---|---|---|
| Coach | Inicio | Junta lo que encontraron los demás |
| Analista de perfil | Mi perfil | Rúbrica de 12 criterios; nombre, bio y destacadas nuevas. La nota la suma el código y es constante: solo cambia si cambió el perfil, y dice qué (`lib/perfil/`) |
| Analista de métricas | Mis métricas | El informe "Instagram: qué métricas importan" (oct-2026). Puntaje 0-100, 4 indicadores con semáforo y reglas de "qué mejorar", **calculados con código** (`lib/metricas/tablero.ts`) |
| Analista de reels | Mis reels | Cada reel segundo a segundo: cuadros del gancho y de donde se fue la gente |
| Cazador de tendencias | Ideas | Reels del nicho por encima de su promedio (outlier calculado con código) |
| Analista de competencia | Competencia | Qué les funciona a las cuentas que te inspiran |
| Guionista | Contenido | Hooks, guion, carrusel y caption con tu voz |
| Estratega | Estrategia | Tu contenido como embudo (atraer, confianza, captar, vender) y qué publicar para vender |
| Radar del nicho | Novedades del día | Todos los días a las 7:00: novedades y reels del nicho |
| Editor | Editar video | El método de edición de Paul. Copia el estilo de un video que te guste (skill `copiar-estilo`) con tu marca, y monta reels de productos o lugares para cualquier rubro (skill `montaje-producto`) |

**Comprobación de calidad:** los números no los escribe el modelo. Salen de código:
- los outliers, el puntaje, los semáforos, la hora para publicar y los conteos del embudo;
- la nota del perfil: suma de los 12 criterios, anclada a la evaluación anterior de esa cuenta;
- en el editor, cada cuánto cambia de plano el video de referencia (detección de escena con ffmpeg), la revisión del plan del montaje (tramos dentro de cada toma, ritmo, largo total) y la auditoría del video final.

Si el modelo escribe un "veces su promedio" que no salió del cálculo, se borra (`lib/agent/verificar.ts`).

## Estado
- Funciona: interfaz, agente en modo local y API, preguntas antes de arrancar, perfil, ideas, guion, Windsor.
- Funciona: Mis métricas con el tablero del informe, "¿A qué hora publicar?" (Windsor o captura de "Momentos de actividad"), Mis reels (con Windsor trae los reels; si no, se sube el video), Estrategia, chat por agente, cuentas separadas ("Otra cuenta" en Inicio, para probar con la cuenta que pida el jurado sin mezclar datos).
- Análisis automático (`lib/client/cola.ts`, `components/AnalisisAutomatico.tsx`): apenas conectás Windsor, la app analiza tu cuenta entera sola, de a una sección (perfil → métricas → reels → estrategia → ideas → novedades), aunque navegues o recargues. Un cartel abajo a la derecha muestra el avance y deja pausar, cancelar o reintentar. Si el agente necesita un dato, deja la pregunta en esa sección y sigue con la siguiente. No corre en modo demo ni con una cuenta que no es la de Windsor.
- Editar video, para cualquier persona o negocio (`lib/video/`). La pantalla es una sola acción: se sueltan hasta 8 tomas, o un .zip con todas (se lee en el servidor, sin programas externos), y "Editar video". Hookia detecta solo el tipo de video por las pausas del audio (`procesar.ts`); se puede elegir a mano en "Más opciones". Dos tipos:
  - **Hablo a cámara:** une las tomas en orden y corta todas las pausas de más de 0,3 s sin cortar palabras. Normaliza el audio a -14 LUFS. Pone subtítulos de 1 a 3 palabras y textos clave que elige el agente Editor.
  - **Muestro productos o lugares** (ropa, comida, una tienda, un local, una casa): el Editor mira 4 cuadros de cada toma y elige el mejor tramo de cada una, el orden, el gancho, los textos y el cierre. El código revisa ese plan y ffmpeg arma el reel vertical 1080 × 1920 (fondo desenfocado si la toma es horizontal), con la placa final del llamado a la acción y la música con entrada y salida suaves.
  - **Video de referencia (opcional):**
    - El código mide cada cuánto cambia de plano. El Editor lee en los cuadros cómo son los subtítulos (letra, tamaño, lugar, animación, colores), los textos, los zooms, las transiciones y el color.
    - Edita las tomas de la persona con ese estilo, pero con su color, su @ y sus palabras.
    - Si habla a cámara, el método de Paul manda: nada de zooms ni filtros sobre la cara.
  - **Auditoría antes de entregar:** pausas, cuadros negros, formato, largo de cada plano y audio.
  - **Requisitos:** `ffmpeg` (`brew install ffmpeg`) y whisper para los subtítulos. Whisper se instala con el botón de la pantalla: Homebrew + el modelo "small" de whisper.cpp, unos 480 MB.
  - **Pruebas:**
    - Acá se probó con videos sintéticos: zip con música, tomas giradas, horizontales y sin sonido, y un video de referencia.
    - Se corrió un montaje real con el agente.
    - Whisper se probó simulado, porque este contenedor no puede bajar modelos de voz.
  - **Limitaciones:**
    - Copia el estilo, pero no queda idéntico cuadro por cuadro. Animaciones muy elaboradas (3D, partículas, recortes de la persona) no se rehacen.
    - Los videos HDR del iPhone no se probaron.
- Limitaciones: la curva de retención segundo a segundo no la da la API (se lee de una captura si la persona la sube); los números exactos de reels de OTRAS cuentas necesitan el token de Meta (Business Discovery), que no está configurado; el audio de los reels todavía no se transcribe (se leen los subtítulos que se ven en los cuadros).
- Novedades del día: el agente busca en la web lo que pasó esta semana en el nicho de la persona (con fecha y link de cada fuente) y propone ideas para publicar. Se corre a mano con **Buscar ahora** o solo, todos los días a las 7:00: en Mac se programa con un LaunchAgent (`lib/diario/programar.ts`), que corre `scripts/diario.ts` aunque la app esté cerrada. Si la Mac está dormida a esa hora, corre al despertarse; si está apagada, ese día no corre. En Windows y Linux, por ahora, solo a mano.
- Pendiente: mensajes y comentarios, memoria en base de datos.
- Licencias de terceros en `licencias/`.

## Seguridad
- La app escucha solo en tu compu (`127.0.0.1`): nadie en la misma red Wi-Fi puede entrar.
- Las rutas `/api` (que corren Claude Code y Windsor) rechazan pedidos que no vengan de la misma página: bloquea DNS rebinding y que otra web abierta en el navegador las dispare (`proxy.ts`).
- Cabeceras de seguridad en todas las páginas: política de contenido (CSP), sin iframes de terceros, `nosniff`, sin referrer y sin cámara/micrófono/ubicación (`next.config.ts`).
- El agente solo puede leer la carpeta temporal con tus capturas (nunca tu carpeta personal) y, de Windsor, solo las herramientas que leen: las que crean, cambian o borran están prohibidas.
- Claves y tokens: no hacen falta variables de entorno. El permiso de Windsor queda en `.data/` con permisos solo para tu usuario (600), nunca se sube a GitHub (`.gitignore`) ni llega al navegador. Si usás el modo API o Meta, las claves van en `.env.local`, que tampoco se sube.
- Dependencias de la app: `npm audit --omit=dev` sin vulnerabilidades.
