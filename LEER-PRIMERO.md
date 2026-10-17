# LEER PRIMERO: contexto completo para seguir el proyecto

> Para Claude (u otro agente): leé este archivo ENTERO antes de tocar nada, después `CLAUDE.md` (decisiones en detalle, secciones 0-19) y `consigna-build101.pdf`. Este archivo lo escribió el Claude que armó el proyecto con Paul el 17/10/2026, para seguirlo desde la cuenta de Claude del evento.

## Quién es Paul y cómo hablarle
- Paul McCubbin (@paul.mccubbinn), de Uruguay. Hace contenido de IA en Instagram y es socio de Workfly.
- Habla rioplatense. Respondele **corto, simple, sin jerga**, en voseo. Muchas veces dicta por voz: "Cloud" = Claude, "Shalt 100" ≈ shadcn, "Borderfly" = Workfly, "Barcell" = Vercel.
- Es exigente con la calidad: no le mandes nada sin probarlo. Si algo no se puede (reglas, términos de uso), decíselo claro y proponé la alternativa que sí se puede.
- **La hackathon es una competencia aparte:** no mezclar casos, datos ni ejemplos de clientes de Paul.

## La hackathon
- **Build 101**, 17 y 18 de octubre de 2026, en FIUM/LATU. Equipo 17. Repo: `github.com/paulmc2708/Hackathon-Equipo17` (público, por decisión de Paul).
- La consigna (`consigna-build101.pdf`) manda sobre todo:
  - **La IA tiene que ser indispensable.**
  - **Tiene que andar con casos nuevos en vivo:** el jurado puede pedir otra cuenta.
  - **Nada precargado:** mostrarlo como si fuera de la IA descalifica.
  - **Revisan el historial del repo:** no traer código de antes; las librerías y las skills públicas sí se pueden usar.
  - **Se declara lo simulado o pendiente.**
- Rúbrica:

  | Criterio | Peso |
  |---|---|
  | Producto funcionando | 35 % |
  | Problema y valor para el usuario | 25 % |
  | Calidad de la IA | 20 % |
  | Experiencia de uso | 10 % |
  | Originalidad | 10 % |

  No suman puntos la complejidad ni la cantidad de funciones.
- Pitch: 3 minutos de demo y 3 de preguntas.

## El producto
**Hookia**: un coach de Instagram con IA para personas con marca personal (el nombre se eligió el 17/10; se chequeó que no lo use otro producto del rubro: HookLab, Hookly, Viraly, Viral Lab, Hookora, Clipia, Reelab y Trendlab ya existen): expertos que venden lo que saben, como coaches, profesionales, freelancers o creadores. No es para empresas con área de marketing.
- Diferencial frente a "Claude Code + las skills de Jake" (CLAUDE.md §11):
  - cero instalación técnica;
  - datos reales, con outliers calculados con código;
  - un camino guiado: perfil → ideas → contenido;
  - memoria de la persona;
  - búsqueda automática;
  - hecho para habla hispana.
- Objetivo final, según Paul:
  - **analizar el Instagram de la persona, su nicho, su competencia y las cuentas que sigue;**
  - **buscar lo viral de afuera y los hooks;**
  - **recomendar qué hacer;**
  - **editarle los videos** con su método, ya preseteado.

## Decisiones tomadas (no re-discutir)
1. **El LLM corre con Claude Code headless (`claude -p`) en la compu de cada persona, con SU cuenta de Claude.** No hay API externa ni créditos.
   - La persona conecta su cuenta desde la página con el botón **Conectar con Claude** (`claude auth login`).
   - Todo corre en **localhost**. Por ahora no se sube a Vercel.
   - Código: `lib/agent/claudeLocal.ts`, `lib/claude/cuenta.ts`, `app/api/claude/route.ts`.
   - Probado el 17/10: guion, competencia y perfil (este último pidió capturas porque no había datos).
2. **Modelo SIEMPRE `claude-opus-5-5`.** Nunca Sonnet.
3. Las herramientas propias del agente van por **MCP** (`scripts/mcp-coach.ts`, corre con tsx):
   - `obtener_perfil_instagram` (Meta, Business Discovery);
   - `calcular_outliers` (código puro);
   - `windsor_campos` y `windsor_datos` (métricas privadas vía Windsor.ai, si la persona pega su clave en Conexiones).

   Además, WebSearch/WebFetch, y Read para las imágenes.
4. **Salida validada:** `--json-schema` con zod. El agente devuelve `accion: "preguntas"` (le pide datos a la persona) o `accion: "resultado"`.
5. **Siempre pregunta antes de arrancar** si le falta contexto, y pide material: capturas de su perfil, perfiles que le interesan, videos que le gustan y sus "Seguidos".
6. **Interfaz al estilo de app.workfly.io:**
   - oscuro y minimalista, tipo Apple/Cursor;
   - barra lateral flotante a la izquierda: riel de íconos que se expande como panel (⌘B), con grupos en acordeón y buscador;
   - animaciones suaves con Motion;
   - tokens de diseño en `app/globals.css`.
7. **Las skills de Jake agrupadas en áreas grandes**, no en 11 botones (CLAUDE.md §16):

   | Grupo | Secciones |
   |---|---|
   | Analizar | Mi perfil · Mis métricas · Competencia · Ideas de tu nicho |
   | Crear | Contenido (reel o carrusel) · Editar video |
   | Crecer | Mensajes · Plan semanal |

8. **El video tiene el método de Paul preseteado**, y lo personal se pregunta: skill `editar-reel` y `lib/video/preset.ts`.

## Cómo correrlo
```bash
npm install
npm install -g @anthropic-ai/claude-code   # si no está
npm run dev                                 # http://localhost:3000
```
En la app: **Conectar con Claude** (Inicio o Conexiones) → completar los datos en Inicio → Mi perfil / Competencia / Ideas / Contenido.

## Mapa del código
| Ruta | Qué es |
|---|---|
| `app/(app)/*` | Pantallas: Inicio (onboarding y conexión), perfil, competencia, ideas, guiones (Contenido), video, comunidad, novedades (Novedades del día, con el aviso de las 7:00) y ajustes (Conexiones) |
| `components/Sidebar.tsx`, `components/ui.tsx`, `components/CuentaClaude.tsx` | Barra lateral, piezas de UI con Motion y tarjeta para conectar Claude |
| `app/api/agent/route.ts` | Corre el agente y devuelve los pasos en vivo (NDJSON). Solo responde desde localhost |
| `lib/agent/tasks.ts` | Las tareas (perfil, competencia, ideas, guion): skills, esquema de salida y consigna |
| `lib/agent/claudeLocal.ts` | Modo headless (el que se usa) |
| `lib/agent/run.ts` | Modo API (solo para un servidor a futuro: `LLM_MODO=api`) |
| `lib/client/*` | Hooks del navegador: agente, cuenta, datos guardados y adjuntos (capturas y cuadros de videos sacados en el navegador) |
| `lib/tools/*` | Instagram (Meta), Windsor y outliers |
| `lib/video/preset.ts` | Preset de edición + preguntas antes de editar |
| `.claude/skills/` | Skills: ig-* y ms-* de Jake (MIT), HyperFrames (Apache-2.0), find-skills (Vercel, MIT) y las nuestras: `analisis-instagram`, `carrusel-10`, `editar-reel` |

## Pendientes, en orden de prioridad
1. **Parte "agéntica" (pedido de Paul, lo próximo):** un chat con el agente, al costado o como pantalla de inicio. La persona le pregunta algo ("quiero crecer", "analizá mi Instagram"), el agente le pide los datos (texto, capturas, videos) y **va organizando lo que encuentra en las secciones de la web**: deja el diagnóstico en Mi perfil, las cuentas en Competencia, las ideas en Ideas y los guiones en Contenido, y le dice qué hacer en cada una.
   - Mismo motor headless.
   - Técnica sugerida: que el chat use `claude -p --input-format stream-json --output-format stream-json` (o una sesión que se reanuda con `--resume`). Que tenga una herramienta MCP `guardar_en_seccion(seccion, datos)` que escriba en el estado de la app (las secciones leen de `useUltimo("perfil")`, etc.; hoy está en localStorage).
2. **Personalización de la página (Paul: "re importante"):** que la web se adapte a cada persona: su nombre y su foto, su nicho, accesos según lo que vende y en qué etapa está, y textos y ejemplos de su rubro. Paul lo sigue con la cuenta del evento.
3. **Pulir el análisis:**
   - las cuentas que sigue la persona (capturas de "Seguidos" → elegir creadores → analizarlos);
   - hooks de afuera (ig-reel `hooks.json`);
   - probar Competencia con capturas reales y con 2-3 cuentas.
4. ~~Carruseles~~ **HECHO (17/10):** en Contenido se elige Reel o Carrusel. El carrusel sale slide por slide (estructura `carrusel-10`): texto exacto + qué visual va, sin generar imágenes. Probado con un caso real. Pendiente: conectar un generador de imágenes cuando haya conector.
5. **Edición de video** (para Paul es "importantísimo"): pantalla Editar video →
   1. preguntas de `PREGUNTAS_VIDEO`;
   2. subir las tomas a una carpeta local;
   3. `claude -p` con la skill `editar-reel` + HyperFrames, con Bash/Read/Write habilitados solo en esa carpeta;
   4. mostrar el progreso;
   5. descargar el mp4.

   Necesita ffmpeg y whisper en la compu. Escribir el código EN la hackathon: no copiar código de los proyectos viejos de Paul.
6. ~~Búsqueda programada~~ **HECHO (17/10):** Novedades del día (`app/(app)/novedades`, tarea `novedades`), con aviso diario a las 7:00 en Mac (`lib/diario/programar.ts` + `scripts/diario.ts`). Falta: Plan semanal (`ig-plan`) y Mensajes (`ig-dm`, `ig-reply`, `ig-comment`).
7. Memoria en una base de datos (hoy todo está en localStorage del navegador) y la historia del perfil ("pasaste de 49 a 72").
8. API de Meta (Business Discovery) con un token de una cuenta profesional del equipo, y verificar Windsor con una cuenta real.
12. README final: qué anda, qué no y que la demo corre en local con Claude Code. Ensayar el pitch y grabar un video de respaldo.

## Reglas
- No escribir claves en el repo (`.env*` está ignorado). No traer datos de las cuentas de Paul (Zernio, contactos, clientes).
- Probar cada cosa en la app antes de decir que anda. Commits chicos, push seguido, una rama por tarea si son varios.
- Textos de la interfaz en español, cortos, sin jerga y sin datos de ejemplo falsos.
