# Build 101 (17 y 18/10/2026, FIUM/LATU): coach de Instagram con IA

Leé este archivo entero antes de escribir código. Lo armó Claude con Paul (creador de contenido de IA, Uruguay, @paul.mccubbinn) el 17/10. A Paul hablale en rioplatense, corto y sin jerga. La consigna oficial está en `consigna-build101.pdf`: **manda sobre todo lo demás**.

## 0. Lo que exige la consigna (y cómo lo cumplimos)
- **La IA tiene que ser indispensable.** Si se la sacás, el producto no hace nada. Acá la IA lee el perfil (visión), entiende el nicho, busca qué está funcionando ahora (agente con búsqueda web), explica por qué funcionó y escribe hooks y guiones con la voz de la persona.
- **Tiene que andar con casos nuevos.** El jurado puede cambiar el caso, por ejemplo pedir otra cuenta de Instagram. **Nada precargado ni hardcodeado presentado como generado por IA:** eso descalifica.
- **Se revisa el repo y su historial** para detectar trabajo previo. Se permiten librerías, modelos y herramientas existentes (las skills de Jake y HyperFrames son de terceros y públicas). Por eso el kit de edición que habíamos hecho antes **quedó afuera del repo**. Arrancar el repo de cero hoy y commitear seguido: el historial tiene que mostrar que se construyó en el hackathon.
- **Lo simulado o pendiente se declara.** Dejar en el README qué anda, qué no y qué queda pendiente.
- **Rúbrica:**
  - Producto funcionando: **35 %**
  - Problema y valor para el usuario: **25 %**
  - Calidad de la IA: **20 %**
  - Experiencia de uso: 10 %
  - Originalidad: 10 %

  **No suman puntos la complejidad ni la cantidad de funciones.** Empate: gana el producto que funciona.
- **Conclusión:** UN flujo principal que funcione siempre, con cualquier cuenta, rápido y lindo, vale más que cinco funciones a medias.
- **Pitch:** 3 minutos de demo y presentación, más 3 minutos de preguntas.

## 1. El producto (el flujo principal)
**Usuario:** un creador o un negocio chico que quiere crecer en Instagram para vender (un curso, un servicio) y no sabe qué publicar.
**Alternativa actual:** adivinar, copiar sin entender o pagarle a un community manager. Caso real de un cliente de Paul: pagó US$ 5.000 y no le sirvió.

**Flujo principal, que es lo que se demuestra:**
1. La persona pone su **@** (y opcionalmente capturas de su perfil y de sus estadísticas).
2. **Diagnóstico del perfil:** nota sobre 100 con 12 criterios, qué le pasa a sus reels y nombre, bio, destacadas y fijados reescritos, listos para copiar.
3. **Ideas virales de SU nicho, de esta semana:** el agente busca cuentas parecidas, encuentra los reels que les fueron muy por encima de su promedio (el "outlier", calculado con código sobre datos reales) y explica la fórmula del gancho.
4. **De idea a guion:** elige una idea → 3 hooks puntuados + guion + texto en pantalla + caption, con su forma de hablar.

**Extras, solo si el flujo principal ya anda perfecto:**
- (a) "Búsqueda automática semanal": un cron que repite el paso 3 y deja ideas nuevas.
- (b) Edición de video: la consigna lo permite (IA de visión y video), pero es lo más frágil en vivo. Recién el día 2 y si sobra tiempo.

## 2. Arquitectura (simple y robusta, todo en Vercel)
```
Next.js (App Router) en Vercel
 ├─ /api/analyze   → Claude (Messages API, streaming) con:
 │     · system = el SKILL.md que corresponde (ig-profile, ig-viral, ig-reel…) con prompt caching
 │     · imágenes = las capturas (visión)
 │     · herramientas propias: getProfile(@), getRecentMedia(@), computeOutliers(datos)  ← código nuestro
 │     · herramientas de Anthropic: web_search_20260209 y web_fetch_20260209
 │     · salida = JSON con formato fijo (structured outputs) → la UI lo muestra en tarjetas
 ├─ DB: Vercel Postgres o Supabase (usuarios, voz, resultados, ideas guardadas)
 └─ Vercel Cron (extra a) → llama /api/ideas para cada usuario con la búsqueda activada
```
- **Por qué no Managed Agents para el flujo principal:** levantar un sandbox suma demora y riesgo en vivo. La API de mensajes con herramientas responde rápido, corre en Vercel y es fácil de depurar. Managed Agents solo si se hace el video (necesita sandbox con ffmpeg/Chrome).
- **Modelo:** `claude-opus-5-5` (effort `medium`; `high` para el guion). Si el crédito aprieta: `claude-sonnet-5-5` para la búsqueda.
- **Antes de escribir código de la API de Claude, cargar la skill `claude-api`** (en Claude Code) y leer TypeScript → README, tool-use, streaming y prompt caching. No adivinar el SDK (`@anthropic-ai/sdk`).
- **El outlier se calcula en código** (vistas o interacciones ÷ la mediana de la cuenta), no lo "estima" el modelo. Es la "comprobación sencilla de calidad" que pide la rúbrica: mostrar el número real al lado de cada idea.

## 3. Datos de Instagram (lo más importante para que ande con cualquier cuenta)
- **Plan A, la API oficial de Meta, "Business Discovery":**
  - Con una cuenta profesional propia conectada a una página de Facebook y una app en developers.facebook.com (en modo desarrollo alcanza), se piden datos públicos de cualquier cuenta profesional por su @:
    `GET /{ig-user-id}?fields=business_discovery.username(USUARIO){username,name,biography,followers_count,media_count,media.limit(30){caption,like_count,comments_count,media_type,permalink,timestamp}}`
  - **Verificar en la hora 1 si trae vistas de reels.** Si no, el outlier se calcula con likes y comentarios, y se avisa en la UI.
  - Token en una variable de Vercel. Nunca en el código ni en el chat.
- **Plan B, capturas + visión:** la persona sube capturas de su perfil y estadísticas y Claude las lee. Siempre funciona y es un uso real de IA (visión). También sirve para cuentas personales (no profesionales).
- **Plan C, búsqueda web:** para descubrir cuentas y reels del nicho y lo que se está hablando esta semana.
- **No usar:** Windsor (es para tus propias cuentas, no multiusuario), scraping que viole términos, ni logins con contraseña de Instagram.
- **Arrancar los planes A y B en paralelo.** Si el A no sale en 2-3 horas, el B solo alcanza para cumplir la consigna.

## 4. Plan por horas (si no da el tiempo, se corta desde abajo)
### Día 1
- [ ] **H0 (1 h):**
  - Repo privado nuevo en GitHub y Next.js + Tailwind + shadcn.
  - Deploy en Vercel conectado al repo y `ANTHROPIC_API_KEY` en Vercel.
  - Una página que llama a Claude en streaming.
  - Persona 2: la app de Meta (plan A).
- [ ] **H1-H4, perfil (ig-profile + ig-audit + visión):** formulario con @ y capturas → JSON → pantalla de diagnóstico.
- [ ] **H4-H7, ideas virales (ig-viral + web_search + computeOutliers):** tarjetas de ideas con el número de outlier real y el link.
- [ ] **H7-H9, guion (ig-reel + ig-caption + ig-human):** desde una idea → 3 hooks + guion + caption. La "voz" sale de 3 captions de la persona: las pega una vez y se guardan.
- [ ] **Fin del día 1:** probar el flujo entero con 5 cuentas distintas (nichos distintos, chicas y grandes) y anotar los fallos.
### Día 2
- [ ] **H0-H3:** arreglar los fallos de ayer, estados de carga y de error, y la interfaz (§6).
- [ ] **H3-H5:** extra (a), la búsqueda semanal con Vercel Cron.
- [ ] **H5-H7:** extra (b) video, solo si todo lo anterior está impecable.
- [ ] **H7-H9:**
  - README con qué anda, qué no y las limitaciones.
  - Ensayar el pitch cronometrado.
  - Video de respaldo de la demo.

## 5. Skills incluidas (`.claude/skills/`, de terceros, con licencia)
- `ig-*` (13): instagram-agent-skill de Jake Schincariol (MIT, ver `licencias/`). Por importancia: **ig-profile, ig-viral, ig-reel, ig-caption, ig-human**; después ig-audit, ig-plan, ig-carousel, ig-story, ig-dm, ig-reply, ig-comment e ig-repurpose. `ig-profile/rubric.json` tiene los 12 criterios; `ig-reel/hooks.json`, las fórmulas de hooks.
- `ms-edit`, `ms-virality`: master-skills de Jake (MIT).
- `hyperframes*`, `embedded-captions`, `talking-head-recut`, `motion-graphics`, `media-use`: HyperFrames (HeyGen, Apache-2.0), solo para el extra de video.
- `watch`: mirar un video de referencia (extra de video).
- Las skills se usan como **prompts de sistema** (el texto del SKILL.md + sus JSON) adentro de nuestra app. Cachearlas con prompt caching.
- En el README y en el pitch: "usamos las skills abiertas de Jake Schincariol como base de conocimiento; el producto, la integración con datos reales, el cálculo de outliers y la interfaz los hicimos en el hackathon".

## 6. Interfaz: estilo Workfly, que NO parezca hecha a las apuradas con IA
Referencia: Workfly (app.workfly.io), minimalista tipo Apple/Cursor. Si Paul pasa capturas de Workfly, seguir su estructura y su aire.
- **Barra lateral fija a la izquierda**, con el logo arriba y el usuario abajo. Secciones con ícono y nombre:
  1. Inicio
  2. Mi perfil
  3. Ideas virales
  4. Guiones
  5. Búsqueda automática
  6. Editar video (con la etiqueta "pronto" si no se llega)
  7. Ajustes

  La activa, marcada. En celular, menú hamburguesa.
- A la derecha, el área de trabajo. El **chat con el agente** es un panel lateral que se abre desde cualquier sección.
- Fondo blanco o gris muy claro, texto casi negro y **un solo color de acento**. Una tipografía (Inter o Geist), mucho aire, espaciado parejo (múltiplos de 4/8 px). Íconos lucide, **sin emojis como íconos**.
- Prohibido: degradés violetas, sombras pesadas, todo centrado, textos de relleno ("Unlock your potential…") y datos falsos de ejemplo.
- shadcn/ui personalizado (radios, colores y tipografía propios), que no se vea el default.
- Estados: cargando (skeletons + **pasos del agente en vivo**: "Leyendo tus capturas… Buscando cuentas de tu nicho… Calculando outliers…"), vacío (mensaje + botón) y error (mensaje claro + reintentar). La rúbrica premia los buenos mensajes de progreso y de error.
- Todo en español, corto. Antes de dar una pantalla por buena: captura en escritorio y en celular, y revisarla.

## 7. GitHub y equipo
- Repo **privado**, todo el equipo como colaborador, Vercel conectado (cada push a `main` publica; cada PR tiene su URL de prueba). El jurado pide acceso de lectura al repo: dejarlo listo.
- Una rama por tarea, commits chicos y seguidos, PR a `main`. `git pull` antes de arrancar algo.
- Las tareas de §4 como issues de GitHub, una por persona.
- `.env` y claves nunca al repo (ya están en `.gitignore`).

## 8. Instrucciones para el modelo (base del system prompt)
- Sos un coach de Instagram para creadores hispanohablantes. Usás la skill que te pasamos para cada tarea.
- **Nunca inventes datos** (vistas, seguidores, fechas, sueldos). Si falta un dato, decilo o pedilo. Lo calculado lo hace la herramienta, no vos.
- Hablá en el idioma del usuario. Textos finales sin tono de bot (aplicar las reglas de ig-human).
- Nunca pidas contraseñas ni publiques por el usuario.
- Devolvé JSON con el formato pedido (structured outputs).

## 9. Pitch (3 minutos)
1. **Problema (30 s):** "Jorge es chef de yates, tiene 611 publicaciones y ningún reel pasa las 1.000 vistas. Le pagó US$ 5.000 a alguien y no le sirvió." (Pedirle permiso a Jorge para usar su caso, o usar uno anónimo.)
2. **Demo en vivo (2 min):** pedirle al jurado una cuenta → diagnóstico → ideas de su nicho con el outlier real → guion.
3. **Por qué la IA es indispensable y cómo comprobamos la calidad (30 s):** visión + agente que busca en vivo + outlier calculado sobre datos reales + guion con la voz de la persona.

Para las preguntas, tener claras las limitaciones: cuentas privadas, qué pasa si la API no trae vistas y cuánto cuesta cada análisis.

## 10. Seguridad
- Claves solo en variables de entorno. No traer nada de las cuentas de Paul (Zernio, contactos, claves).
- Nada de scraping que viole términos, ni DMs o publicaciones en nombre del usuario.
