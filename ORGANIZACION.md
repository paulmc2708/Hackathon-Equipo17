# Cómo lo vamos a hacer (orden de trabajo)

Regla: cada etapa termina con algo que **anda y se puede mostrar**. No se arranca la siguiente hasta que la anterior funciona en local.

## Las partes del producto
| Parte | Qué es | Dónde vive |
|---|---|---|
| 1. La app (cáscara) | Next.js: barra lateral, secciones, formularios, tarjetas de resultado | `app/`, `components/` |
| 2. El agente | El "cerebro": Claude con el SKILL.md de cada tarea, herramientas y respuesta en streaming | `lib/agent/`, `app/api/agent/route.ts` |
| 3. Las herramientas del agente | Funciones nuestras que el agente puede usar: traer el perfil por @, traer los reels, calcular outliers, leer capturas, buscar en la web | `lib/tools/` |
| 4. Memoria | Lo que sabemos de cada persona: nicho, qué vende, su historia, su voz, análisis anteriores | `lib/db/` (Supabase o Vercel Postgres) |
| 5. Pantallas por sección | Mi perfil, Ideas virales, Guiones (y extras: Búsqueda automática, Video) | `app/(app)/perfil`, `/ideas`, `/guiones`… |

## Estructura de carpetas (propuesta)
```
app/
  (app)/layout.tsx        ← barra lateral + panel del agente
  (app)/page.tsx          ← Inicio / onboarding
  (app)/perfil/page.tsx
  (app)/ideas/page.tsx
  (app)/guiones/page.tsx
  api/agent/route.ts      ← corre el agente y devuelve eventos en streaming
components/               ← Sidebar, AgentPanel, ResultCards, Steps (progreso en vivo)…
lib/
  agent/run.ts            ← loop del agente (SDK de Anthropic + tool runner)
  agent/skills.ts         ← lee .claude/skills/<skill>/SKILL.md y lo arma como system prompt
  agent/schemas.ts        ← formato JSON de salida de cada tarea (zod)
  tools/instagram.ts      ← Business Discovery (Meta)
  tools/outliers.ts       ← cálculo de outliers (código puro, con tests)
  db/                     ← perfil del creador, resultados
.claude/skills/           ← skills de terceros (ya está)
```

## Etapas
### Etapa 0: arrancar en local (30-45 min)
- [ ] `npx create-next-app@latest` (TypeScript, Tailwind, App Router) en esta carpeta, sin borrar lo que hay.
- [ ] shadcn/ui, lucide-react, zod y @anthropic-ai/sdk.
- [ ] `.env.local` con `ANTHROPIC_API_KEY` (nunca se commitea).
- [ ] `npm run dev`: abre en http://localhost:3000.
- [ ] Push a GitHub y conectar a Vercel. Primer deploy.
**Listo cuando:** la página vacía anda en local y en la URL de Vercel.

### Etapa 1: la cáscara (1-2 h)
- [ ] Barra lateral a la izquierda: Inicio, Mi perfil, Ideas virales, Guiones, Búsqueda automática, Editar video (pronto) y Ajustes.
- [ ] Inicio = onboarding de marca personal (§12 de CLAUDE.md): @, qué hacés, qué vendés, a quién, tu historia y 3 captions.
- [ ] Estados vacíos en cada sección ("Todavía no analizaste tu perfil" + botón).
- [ ] Diseño según §6 de CLAUDE.md. Capturas en escritorio y celular.
**Listo cuando:** se navega por todo, se ve profesional y no hay datos falsos.

### Etapa 2: el agente adentro (2-3 h), la parte más importante
- [ ] `/api/agent` recibe `{tarea, datosDelCreador, archivos}` y corre Claude (`claude-opus-5-5`) con:
  - system = instrucciones base (§8) + el SKILL.md de la tarea (cacheado);
  - herramientas: `web_search`, `web_fetch` (de Anthropic) y las nuestras;
  - salida JSON con el esquema de la tarea.
- [ ] Devuelve en streaming los pasos ("Buscando cuentas de tu nicho…") y al final el resultado.
- [ ] Panel del agente en la UI: muestra los pasos en vivo y deja hacerle preguntas.
**Listo cuando:** desde la UI le pedís "analizá @cuenta" y responde en vivo con un JSON válido.

### Etapa 3: datos reales (en paralelo con la 2, otra persona)
- [ ] App de Meta + token → `getProfile(@)` y `getRecentMedia(@)` con Business Discovery.
- [ ] Ver si trae vistas de reels. Si no, outlier con interacciones y avisarlo.
- [ ] `computeOutliers()` en código + 3 tests.
- [ ] Capturas: subir imágenes y pasárselas a Claude (visión) como respaldo.
**Listo cuando:** con 3 cuentas distintas trae los datos reales y calcula los outliers.

### Etapa 4: el flujo principal (resto del día 1)
- [ ] **Mi perfil:** nota /100, tabla de 12 puntos y los cambios para copiar.
- [ ] **Ideas virales:** tarjetas con link, outlier real, fórmula del gancho, ángulo personal y etapa del embudo (atraer, confianza o vender).
- [ ] **Guiones:** de una idea a 3 hooks + guion + caption, con su voz.
**Listo cuando:** el flujo completo anda con 5 cuentas de nichos distintos.

### Etapa 5 (día 2): solidez, extras y pitch
- [ ] Arreglar lo que falló con las 5 cuentas, errores claros y reintentos.
- [ ] Memoria: guardar el creador y sus análisis ("tu perfil pasó de 49 a 72").
- [ ] Extra: búsqueda semanal con Vercel Cron.
- [ ] Extra: video, solo si todo lo anterior está impecable.
- [ ] README (qué anda, qué no, limitaciones), ensayo del pitch y video de respaldo.

## Reparto (ajustar según cuántos somos)
- **Persona A:** etapas 0, 1 y 4, la UI.
- **Persona B:** etapa 2, el agente.
- **Persona C:** etapa 3, los datos de Meta y los outliers.
- Si son 2: A hace la UI; B hace el agente y, después, los datos.

Cada tarea = un issue en GitHub + una rama + un PR. `git pull` antes de arrancar y push seguido.
