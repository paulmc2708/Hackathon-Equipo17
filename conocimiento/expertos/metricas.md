# Analista de métricas: conocimiento experto

> En qué es experto: leer las métricas reales de una cuenta chica de marca personal (API de Instagram vía Windsor) sin caer en las trampas de definición, de muestra chica y de zona horaria, y convertirlas en una sola prioridad y un horario propio.

Esta ficha **suma** a lo que el agente ya sabe por el informe "Las métricas que importan" (`.claude/skills/metricas-que-importan/`: pirámide oro-plata-bronce-ruido, benchmarks por tamaño, semáforo y 17 reglas). No repite esos números: cuando hacen falta, dice "ver informe, sección 05". Lo nuevo acá es: qué significa cada campo de la API hoy, qué se borró y cuándo, cómo leer números chicos sin engañarse y cómo sacar el horario propio.

Etiquetas: **[Oficial]** documentación o anuncio de Meta. **[Estudio]** dataset grande de una empresa. **[Experto]** guía de un proveedor de datos, consultora o método estadístico estándar. **[Propuesta]** regla nuestra derivada de lo anterior. **[No verificado]** circula, pero no lo pudimos confirmar en una fuente primaria.

---

## Lo que sabe que un chat cualquiera no sabe

1. **"Impresiones" y "plays" ya no existen en la API.** Meta los deprecó en la versión 22.0 (publicada el 21-ene-2025) y los apagó para todas las versiones el **21-abr-2025**, junto con `clips_replays_count` (repeticiones) e `ig_reels_aggregated_all_plays_count`. Su reemplazo es `views`. Para posts creados desde el 2-jul-2024, pedir `impressions` devuelve error. [Oficial] (fuentes 1, 2, 3). Si un usuario o una herramienta vieja habla de "impresiones", el agente lo traduce a vistas y avisa que no son comparables con números de antes de 2025.

2. **Las vistas cuentan repeticiones; el alcance no.** `views` suma cada reproducción (incluidas las repetidas); el alcance cuenta **cuentas únicas**. En historias, Instagram lo dice así: "vistas" es la cantidad de veces que se reprodujo o se mostró, y "espectadores" (viewers) las cuentas únicas que la vieron al menos una vez. [Oficial] (fuente 10). Consecuencia práctica: **vistas ÷ alcance** es un indicador de repetición. Si da más de 1,3, la gente lo está mirando más de una vez (buena señal de retención o de video muy corto). [Propuesta]

3. **El alcance no se suma.** Como cuenta personas únicas, el alcance de la cuenta en 28 días es **menor** que la suma del alcance de cada post (la misma persona vio varios). Sumar alcances de posts y llamarlo "alcance del mes" es un error clásico. [Propuesta, se deduce de la definición oficial] (fuentes 1, 10).

4. **Skip rate tiene definición oficial y es una estimación.** `reels_skip_rate` = vistas que se saltearon en los primeros 3 segundos ÷ vistas iniciales, donde "vista inicial" es la primera vez que el reel arranca en una sesión. Meta la marca como **estimada y en desarrollo**. [Oficial] (fuente 1). Apareció en la app en ago-2025 y en la API a fines de 2025 (fuente 13). Por ser estimada, el agente nunca la presenta con decimales ("62,4 %"), sino redondeada ("6 de cada 10 se van antes de los 3 segundos").

5. **Tiempo promedio visto viene en milisegundos y el total incluye repeticiones.** `ig_reels_avg_watch_time` es "el tiempo promedio que se reprodujo el reel"; `ig_reels_video_view_total_time` es el tiempo total reproducido **incluyendo repeticiones** y Meta lo marca "en desarrollo". [Oficial] (fuente 1). La unidad en milisegundos es la que devuelve la API en la práctica [No verificado en la doc]: si el número da 8.500, son 8,5 s, no 8.500 s. La retención % = tiempo promedio ÷ duración del reel la calcula el código, nunca el modelo.

6. **Visitas al perfil y clics en la web dejaron de existir a nivel cuenta en la API.** Desde ene-2025 (v21) Meta retiró `profile_views`, `website_clicks`, `email_contacts`, `phone_call_clicks`, `text_message_clicks` y `get_directions_clicks` de los insights de cuenta. [Oficial, vía proveedores] (fuentes 4, 5, 6). Lo que queda: `profile_visits` **por post** y `profile_links_taps` a nivel cuenta (toques en los botones de contacto, con desglose por tipo de botón) (fuente 8). Las "visitas al perfil" que ve la persona en la app salen de datos internos de Meta y no hay un endpoint que las devuelva igual (fuente 7). Si Windsor no trae visitas de cuenta, **no es un error de la app**: es la API.

7. **"Cuentas que interactuaron" incluye anuncios.** `accounts_engaged` cuenta cuentas únicas que interactuaron con el contenido **incluidos los promocionados** (fuente 8). Si la persona pagó una promoción en el período, el número se infla y no se compara con períodos sin pauta. En cambio, `total_interactions` es una suma de acciones (likes, comentarios, guardados, compartidos, respuestas) y, según un proveedor, es **neta**: resta likes y guardados deshechos y comentarios borrados, así que puede bajar después de publicado (fuente 9) [No verificado en la doc].

8. **La app muestra 90 días; parte de la API, solo 30.** Las estadísticas de la app cubren hasta los últimos 90 días (fuente 11). En la API, `online_followers` (seguidores conectados por hora) solo está disponible para los últimos 30 días (fuente 14) y los datos demográficos piden al menos 100 seguidores y devuelven como máximo los 45 primeros valores (fuente 15). Regla: **guardar cada lectura en nuestra base**; si no, el historial de 90 días para la mediana se pierde.

9. **Los datos tardan en asentarse.** Proveedores que integran la API reportan demoras de hasta 48 h en algunas métricas (fuente 16) [Experto]. Sumado a que la mayoría de las vistas llega en los primeros 3 días (informe, sección 02), un post de menos de 72 h se muestra como "todavía madurando", nunca en rojo.

10. **El engagement "promedio" de los estudios no es comparable entre sí.** Cada fuente divide por algo distinto: seguidores (Rival IQ, Socialinsider: ~0,3-0,5 %), impresiones o vistas (Buffer: ~4 %) o alcance. Y cada una suma interacciones distintas. [Estudio] (informe, sección 05). Para Hookia se usa **una sola fórmula**: `total_interactions ÷ alcance` del post, y se compara solo contra la propia mediana. Los benchmarks externos se muestran como contexto, con la fuente al lado.

11. **No hay un horario mágico: los estudios se contradicen en la hora y coinciden solo en el día.** Buffer (9,6 M de posts, actualizado sep-2026): jueves 9 h, miércoles 12 h y 18 h; miércoles mejor día, viernes y sábado peores (fuente 17). Later: 5 h de la mañana en la hora local de la audiencia; Sprout Social: martes 13-19 h y miércoles 12-21 h (fuente 18). Coinciden en "mitad de semana", no en la hora. Por eso el horario se saca del dato `online_followers` de la propia cuenta. [Estudio]

12. **La zona horaria de `online_followers` no está documentada con claridad.** Los proveedores dicen que son 24 valores, uno por hora (fuente 19), y que las fechas vienen en UTC o en el límite de día de la cuenta expresado en UTC (fuentes 14, 19). Hay reportes viejos de que las herramientas de Meta usaban hora del Pacífico (fuente 20) [No verificado]. Regla: **antes de recomendar una hora, calibrar** comparando el pico de la API con el pico que la persona ve en la app ("Momentos de mayor actividad"); si difieren en un número fijo de horas, ese es el corrimiento.

---

## Diccionario de métricas (definición oficial, fórmula, para qué sirve)

Nombres de campo de la API de Instagram (Graph API). En Windsor pueden tener otro nombre: el agente los descubre con `windsor_campos` y nunca adivina.

| Métrica (campo) | Definición | Fórmula que usamos | Para qué sirve | Fuente |
|---|---|---|---|---|
| **Vistas** (`views`) | Veces que el contenido se reprodujo o se mostró, con repeticiones. Reemplaza a impresiones y plays. | Total | Escala. Nunca calidad. | [Oficial] 1, 2, 10 |
| **Alcance / espectadores** (`reach`) | Cuentas únicas que vieron el contenido al menos una vez. En la app nueva puede figurar como "espectadores" (viewers). | Base de todas las tasas | Denominador de casi todo | [Oficial] 10; nombre nuevo: 12 [No verificado, una sola fuente] |
| **Cuentas que interactuaron** (`accounts_engaged`) | Cuentas únicas que interactuaron, incluido contenido promocionado. | ÷ alcance de la cuenta | Tamaño de la comunidad activa | [Experto] 8 |
| **Interacciones totales** (`total_interactions`) | Suma de likes, comentarios, guardados, compartidos y respuestas; posiblemente neta. | ÷ alcance del post | La tasa de interacción única de Hookia | [Experto] 9 |
| **Likes**, **comentarios** (`likes`, `comments`) | Conteos por post. | ÷ alcance | Respuesta de quienes ya te siguen (informe, sección 02) | [Oficial] 1 |
| **Guardados** (`saved`) | Veces que se guardó el post. | ÷ alcance | Utilidad. Clave en carruseles | [Oficial] 1 |
| **Compartidos** (`shares`) | Veces que se compartió (DM, historia). | ÷ alcance = tasa de envíos | Señal oro para no seguidores | [Oficial] 1 |
| **Reposts** (`reposts`) | Veces que otra cuenta lo republicó (función de 2025). | ÷ alcance | Variante de compartido | [Experto] 13 |
| **Visitas al perfil del post** (`profile_visits`) | Visitas al perfil atribuidas a ese post. | Seguidos ÷ visitas | Conversión del perfil | [Experto] 8 |
| **Seguidos del post** (`follows`) | Cuentas que empezaron a seguirte a partir de ese post. | ÷ alcance a no seguidores | Conversión del contenido | [Experto] 8 |
| **Seguidos y dejados de seguir** (`follows_and_unfollows`) | Altas y bajas de seguidores, separables por tipo. | Altas − bajas = neto | Crecimiento real | [Experto] 8 |
| **Toques en links del perfil** (`profile_links_taps`) | Toques en botones de contacto, por tipo de botón. | Por semana | Señal de intención de compra | [Experto] 6, 8 |
| **Tiempo promedio visto** (`ig_reels_avg_watch_time`) | Tiempo promedio que se reprodujo el reel. | ÷ duración = retención % | Retención | [Oficial] 1 |
| **Tiempo total visto** (`ig_reels_video_view_total_time`) | Tiempo total reproducido, con repeticiones. En desarrollo. | Solo contexto | Atención total | [Oficial] 1 |
| **Salteo en 3 s** (`reels_skip_rate`) | Vistas salteadas en los primeros 3 s ÷ vistas iniciales. Estimada. | Tal cual, redondeada | Gancho | [Oficial] 1, 13 |
| **Repeticiones** | Ya no es un campo: `clips_replays_count` se borró el 21-abr-2025 y quedó dentro de `views`. | vistas ÷ alcance como aproximación | Rewatch | [Oficial] 1, 3 |
| **Seguidores conectados** (`online_followers`) | Seguidores conectados por hora, 24 valores; solo últimos 30 días. | Promedio por hora con código (`resumir_actividad`) | Horario propio | [Experto] 14, 19 |
| **Demografía** (`follower_demographics`, `engaged_audience_demographics`) | País, ciudad, edad, género; mínimo 100; top 45. | % por país | Elegir zona horaria y tono | [Experto] 15 |
| **Navegación de historias** (`navigation`, `replies`) | Avances, retrocesos, salidas y respuestas por historia. | Respuestas ÷ espectadores | Conversación, señal de venta | [Oficial] 10 |
| **Impresiones** (`impressions`), **plays**, `video_views` | **Borradas** (abr-2025 / ene-2025). | No usar | — | [Oficial] 1, 3, 4 |

---

## Marcos y reglas de decisión

### A. Cómo comparar con pocos datos (cuentas chicas)

Una cuenta de 2.000 seguidores publica 8-12 reels por mes. Con eso, **un solo post cambia el promedio**. Reglas [Experto: estadística robusta estándar, fuentes 21, 22, 23]:

- **Mediana, no promedio.** La mediana (el valor del medio) no se mueve por un post viral; el promedio sí. Ver caso 1.
- **Medir lo "fuera de lo normal" con la mediana.** El multiplicador `valor ÷ mediana` lo calcula `calcular_outliers`. Para confirmar que es un outlier de verdad (y no ruido), se puede usar el **puntaje z modificado** de Iglewicz y Hoaglin: `0,6745 × (valor − mediana) ÷ MAD`, donde MAD es la mediana de las distancias a la mediana. Si da más de 3,5, es un outlier (fuente 23). [Experto]
- **Tasas con denominador chico son muy imprecisas.** 3 compartidos sobre 300 de alcance es "1 %", pero con un intervalo de confianza de Wilson al 95 % puede ser cualquier cosa entre **0,3 % y 2,9 %** (fuente 22, cálculo propio). Regla [Propuesta]: si el alcance del post es menor a 500 o el evento (compartidos, guardados) es menor a 5, **no se pone semáforo a ese post**: se agrupa con otros.
- **Para el resumen semanal, tasa agrupada.** Tasa de la semana = suma de compartidos ÷ suma de alcances. Da más peso a los posts que llegaron a más gente. Mostrar también la mediana por post: si las dos difieren mucho, un post está tirando del resto. [Propuesta]
- **Ventanas:** 7 días es ruido (1-3 posts). **28 días** es la ventana de diagnóstico. **90 días** es la línea de base (la mediana contra la que se compara), que además coincide con lo que guarda la app (fuente 11). Comparar siempre ventanas del mismo largo. [Propuesta]
- **Comparar posts a la misma edad.** Un post de 2 días contra uno de 30 días siempre pierde. Comparar vistas a los 7 días, o esperar 72 h mínimo. [Propuesta, con base en la sección 02 del informe]
- **Mínimos para opinar:** menos de 5 posts en 28 días → "Necesitamos más publicaciones" (regla del informe). Menos de 100 seguidores → no hay demografía ni horarios (fuente 15).

### B. Estacionalidad y contexto [Propuesta]

- Caídas en semanas de feriado largo (Semana de Turismo, Carnaval, fiestas, vacaciones de invierno) se explican antes de alarmar; si hay historial, comparar con la misma semana del año anterior.
- Si la interacción bajó parejo y en línea con la caída del mercado (informe, sección 05), decirlo.
- Si hubo pauta paga, separar esos posts: inflan `accounts_engaged` (fuente 8).

### C. Árbol de prioridad (qué mejorar primero)

El código ya ordena gancho → retención → recompensa → conversión → constancia (informe, sección 11). Lo que el agente agrega al explicar:

- **Si el salteo está mal y todo lo demás bien** → el problema es solo el primer segundo; el contenido sirve. Mensaje: "lo que decís engancha a los que se quedan; arreglá cómo arrancás".
- **Si salteo bien, retención baja y vistas ÷ alcance cerca de 1** → nadie lo vuelve a mirar y se van en el medio: acortar.
- **Si hay muchos guardados y pocos compartidos** → contenido útil pero "privado". Sumar un ángulo para mandarle a alguien ("mandáselo a quien…").
- **Si hay compartidos pero pocos seguidos** → el contenido viaja, el perfil no convence. Mandar al diagnóstico de perfil.
- **Si hay seguidos pero no hay consultas** (`profile_links_taps`, respuestas a historias, DMs por palabra clave en cero) → audiencia sin camino a la venta. Mandar al embudo (informe, sección 09).

### D. Métricas que predicen ventas vs. métricas vanidosas (marca personal)

Para un experto que vende servicios, el orden de cercanía a la venta es [Propuesta, coherente con el informe, sección 09]:

1. **Conversaciones**: DMs que llegan por una palabra clave, respuestas a historias (`replies`). Es lo más cerca de un cliente.
2. **Intención**: `profile_links_taps` (toques en contacto o link), seguidos por post.
3. **Confianza**: guardados por alcance, retención en videos largos de explicación.
4. **Descubrimiento**: compartidos, alcance a no seguidores.
5. **Vanidad** (nunca como éxito): seguidores totales, likes totales, vistas totales.

Regla: si la persona vende algo y la semana tuvo **cero conversaciones**, ese es el titular aunque las vistas hayan subido.

### E. Mejor horario: la regla correcta

1. **Si hay `online_followers` de 14 días o más** → usar las 2 horas con más seguidores conectados del promedio por hora (lo calcula `resumir_actividad`). Recomendar publicar **30 a 60 minutos antes del pico**, para que el post ya esté cargado cuando llegan. [Propuesta: práctica extendida, no medida por Meta]
2. **Calibrar la zona horaria** (punto 12 de arriba) antes de decir la hora.
3. **Si la audiencia está repartida en países** (demografía por país): elegir la hora que cae en un horario razonable para el país con más seguidores, y decirla en la hora de la persona. Usar nombres de zona de la base IANA (fuente 24), por ejemplo `America/Montevideo`, `America/Argentina/Buenos_Aires`, `America/Mexico_City`, `America/Bogota`, `Europe/Madrid`, no desfases fijos, porque algunos países cambian de hora en el año.
4. **Si no hay datos de actividad** (menos de 100 seguidores, cuenta no profesional) → usar los estudios solo como punto de partida ("mitad de semana, mediodía o primera hora de la noche", fuentes 17, 18) y **probar**: 2 semanas en un horario, 2 en otro, mismo tipo de post, comparar medianas.
5. **El horario nunca es la acción número 1** si el gancho está en rojo: el efecto del horario es menor (informe, sección 06).

---

## Checklist que aplica

Antes de escribir una sola conclusión:

- [ ] ¿Qué campos trajo de verdad Windsor (`windsor_campos`)? ¿Alguno es de los borrados (impresiones, plays, `video_views`)? Se descarta.
- [ ] ¿Hay 5 posts o más en 28 días? ¿Cuáles tienen menos de 72 h ("madurando")?
- [ ] ¿Hay posts promocionados, en colaboración o Trial Reels? Se separan (informe, sección 11).
- [ ] ¿Las tasas son sobre alcance, calculadas por el código, y ningún post con alcance menor a 500 se juzga solo?
- [ ] ¿Se comparó contra la mediana propia de 90 días? ¿El outlier se explicó como pista, no como piso?
- [ ] ¿La caída coincide con un feriado, la caída general o un cambio de formato?
- [ ] ¿Tiempo visto en segundos? ¿Zona horaria calibrada antes de dar la hora?
- [ ] Si vende: ¿se miraron conversaciones e intención, no solo alcance?
- [ ] ¿Empezó por lo bueno, cada problema tiene acción y no hay siglas?

---

## Errores comunes que detecta

| Error | Por qué está mal | Qué dice el agente |
|---|---|---|
| "Mi reel tuvo 5.000 vistas y 3.000 de alcance, ¿se contó mal?" | No: vistas incluye repeticiones (fuentes 1, 10). | "Está bien: 5.000 reproducciones de 3.000 personas. Hay gente que lo volvió a mirar, eso es bueno." |
| Sumar el alcance de los posts para "el alcance del mes" | El alcance es de cuentas únicas (fuente 10). | Usa el alcance de cuenta de 28 días, no la suma. |
| Comparar impresiones de 2024 con vistas de 2026 | Métricas distintas, impresiones borrada (fuentes 1, 3). | "No se pueden comparar; arrancamos la serie desde que existen las vistas." |
| Promedio de vistas inflado por un viral | Un post de 9.800 sube el promedio 3,5 veces (caso 1). | Muestra la mediana y el viral aparte. |
| "Bajó mi tasa de compartidos de 2 % a 1 %" con 300 de alcance | Con esos números la diferencia entra en el ruido (fuente 22). | "Con este alcance, la diferencia todavía no es real. Miremos 4 semanas." |
| Juzgar un post de ayer | Los datos tardan hasta 48 h y las vistas siguen llegando 3 días (fuente 16; informe 02). | "Todavía está madurando; lo miramos el jueves." |
| "No me aparecen visitas al perfil en la app de Hookia" | La API ya no las da a nivel cuenta (fuentes 4, 7). | Explica y usa visitas por post. |
| Usar la hora de un estudio de EE. UU. tal cual | Los estudios usan otra audiencia y se contradicen (fuentes 17, 18). | Usa la actividad de sus seguidores en su zona. |
| Celebrar más seguidores con muchas bajas | Importa el neto (fuente 8). | Muestra altas − bajas. |

---

## Ejemplos aplicados (2-3 casos breves con números)

Los números de estos casos son **ilustrativos** (inventados para explicar el método), no datos de una cuenta real.

### Caso 1. Nutricionista, 2.400 seguidores: el viral que engaña

Vistas de sus 8 reels de los últimos 28 días: 410, 380, 520, 450, **9.800**, 470, 390, 610.

- Promedio: **1.629**. Mediana: **460**. El promedio es 3,5 veces la mediana por un solo post.
- Sin el viral, el promedio da 461: casi igual a la mediana. Es la prueba de que la mediana describe mejor "un reel normal".
- MAD (distancia típica a la mediana) = 65. Puntaje z modificado del viral: 0,6745 × (9.800 − 460) ÷ 65 ≈ **97** (muy por encima de 3,5): outlier claro. El de 610 da 1,6: normal.
- Lo que dice el agente: "Tu reel normal hoy llega a unas 460 personas. El del martes llegó a 9.800, 21 veces más. Ese no es tu piso, es una pista: hacé otro parecido esta semana."

### Caso 2. Coach de carrera, 1.100 seguidores: ¿mejoró o es ruido?

- Semana A: reel con 300 de alcance y 3 compartidos (1 %). Semana B: reel con 300 de alcance y 6 compartidos (2 %).
- Intervalos de Wilson al 95 %: A = 0,3 % a 2,9 %; B = 0,9 % a 4,3 %. Se superponen mucho: **no se puede decir que "duplicó"**.
- Con 3.000 de alcance y 30 compartidos (1 %), el intervalo sería 0,7 % a 1,4 %: con más alcance, el número se vuelve confiable.
- Lo que dice el agente: "Vas bien, pero todavía son pocos datos para decir que duplicaste. Si las próximas 3 semanas siguen arriba de 2 de cada 100, es real."

### Caso 3. Abogada laboralista en Montevideo, audiencia repartida

- Demografía: 55 % Uruguay, 30 % Argentina. `online_followers` de 14 días, promediado por código: pico a las 22-23 h según la API; en la app ve el pico a las 19-20 h.
- Diferencia fija de 3 h → la API venía en UTC y Montevideo es UTC−3 (verificar con IANA, fuente 24). Uruguay y Buenos Aires comparten hora: no hay conflicto.
- Recomendación: martes a jueves entre 18:15 y 18:45, y comparar 2 semanas contra su horario actual (13 h) con la mediana de vistas a 7 días.

---

## Lo nuevo de 2025-2026

| Fecha | Cambio | Qué implica para el agente | Fuente |
|---|---|---|---|
| Ene-2025 (v21) | Se borran de los insights de cuenta: visitas al perfil, clics en la web, email, llamada, mensaje y "cómo llegar"; `video_views` deprecado. | Usar `profile_visits` por post y `profile_links_taps`. | 4, 5, 6 [Oficial vía proveedores] |
| 21-ene-2025 (v22) | Llega `views` para feed, historias y reels, en media y en cuenta. | Única métrica de volumen. | 2 [Oficial] |
| 21-abr-2025 | Se apagan `impressions`, `plays`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count` en todas las versiones. | Series de antes y después no se mezclan. | 1, 3 [Oficial] |
| Ago-2025 | Salteo en 3 s y gráfico de retención por reel en la app; Reposts. | Base del indicador Gancho. | 13, informe 02 |
| Fines de 2025 | `reels_skip_rate` y `reposts` llegan a la API (estimadas, en desarrollo). | Se pueden leer por Windsor si el conector las expone. | 1, 13 |
| Ene-2026 | Altas y bajas de seguidores en la API (`follows_and_unfollows`). | Crecimiento neto real. | 8, informe 02 |
| Abr-2026 | Estadísticas rediseñadas en 3 pestañas (General, Interacción, Audiencia), gráfico de "vistas en el tiempo" y tasas de compartido y de salteo al frente. Instagram dice que las métricas anteriores siguen, "renovadas". | La persona ya ve tasas en la app: hablarle con las mismas palabras. | 25, 26 [Experto, citan a Instagram] |
| 2025-2026 | Posible cambio de nombre de "cuentas alcanzadas" a "espectadores" (viewers), con división seguidores / no seguidores. | Si la persona dice "espectadores", es el alcance. | 12 [No verificado, una sola fuente] |
| 2026 | Las tasas nuevas se usan para negociar con marcas. | Para canjes: mostrar tasas, no seguidores. | 27 [Experto] |

---

## Fuentes

Nota de método (18-oct-2026): en esta sesión la lectura directa de páginas (WebFetch) no estuvo disponible y el cupo de búsquedas se agotó a mitad de la investigación. Cada link de abajo apareció en resultados de búsqueda de esta sesión con el contenido citado en su resumen, salvo los marcados "link no reverificado en esta sesión", que son referencias estándar conocidas. Antes de usar un número en la interfaz, conviene abrir la fuente.

1. "Instagram Media Insights" (referencia de la API: `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time`, `reels_skip_rate`, deprecaciones). Meta for Developers, vigente 2026. https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/
2. "Graph API v22.0 changelog" (introducción de `views` y deprecaciones). Meta for Developers, 21-ene-2025. https://developers.facebook.com/docs/graph-api/changelog/version22.0/
3. "Instagram Insights Metrics Deprecation (April 21, 2025) and Views Integration". Emplifi Docs, 2025. https://docs.emplifi.io/platform/latest/home/instagram-insights-metrics-deprecation-april-2025
4. "Instagram Media and Profile Insights Metrics Deprecation (January, 2025)". Emplifi Docs, 2025. https://docs.emplifi.io/platform/latest/home/instagram-media-and-profile-insights-metrics-depre
5. "Instagram Insights field changes - December 11, 2024" (pasado a ene-2025). Supermetrics Docs, dic-2024. https://docs.supermetrics.com/docs/instagram-insights-field-changes-december-11-2024
6. "Upcoming Instagram Metric Deprecation in January". Sprout Social Support, nov-2024. https://support.sproutsocial.com/hc/en-us/articles/31982821870605-Upcoming-Instagram-Metric-Deprecation-in-January-Nov-2024
7. "Why Your Instagram Analytics Tool Disagrees With the Instagram App". Socioverse, 2025-2026. https://www.socioverse.io/blog/why-instagram-analytics-tools-show-different-numbers
8. "Instagram Insights metrics and dimensions" (`accounts_engaged`, `follows_and_unfollows`, `profile_links_taps`). Supermetrics Docs, 2026. https://docs.supermetrics.com/docs/instagram-insights-fields
9. "Instagram Insights Explained: Metrics, Icons, API Fields" (`total_interactions` neta). Postzen, 2026. https://www.postzen.dev/blog/instagram-insights-explained
10. "View insights on your Instagram Stories" (vistas vs. espectadores, cuentas que interactuaron, navegación). Instagram Help Center, vigente 2026. https://help.instagram.com/383939598845756/
11. "About Instagram Insights" (ventana de 90 días, definiciones con el ícono i). Meta Business Help Center, vigente 2026. https://www.facebook.com/business/help/788388387972460
12. "Instagram presents 5 new insights for content creators" (alcance → "Viewers"). Marketing4eCommerce, 2025. https://marketing4ecommerce.net/en/instagram-new-insights/
13. "Adding new Instagram Insights metrics" (skip rate y reposts en la API, citando el anuncio de Meta). Supermetrics Community, fines de 2025. https://community.supermetrics.com/ideas/adding-new-instagram-insights-metrics-723
14. "Instagram Connector" (`online_followers` solo 30 días; `end_time` en UTC). Airbyte Docs, 2026. https://docs.airbyte.com/integrations/sources/instagram
15. "Instagram Official APIs: Comprehensive Reference (April 2026)" (demografía: top 45, mínimo 100). James Chapman, GitHub Gist, abr-2026. https://gist.github.com/jameschapman2c/65eff9f54a2d350b17a6ce5127b9fe42
16. "How to Use the Instagram Graph API for Audience Insights in 2025" (mínimo 100 seguidores, demora de hasta 48 h). Phyllo, 2025. https://www.getphyllo.com/post/how-to-use-the-instagram-graph-api-for-audience-insight-iv
17. "Best Time to Post on Instagram: Data from 9.6M Posts" (actualizado sep-2026) y "Best Time to Post on Social Media in 2026" (52 M de posts, 200 mil cuentas, ene-2024 a dic-2025). Buffer, 2026. https://buffer.com/resources/when-is-the-best-time-to-post-on-instagram/ · https://buffer.com/resources/best-time-to-post-social-media/
18. "The Best Time to Post on Instagram in 2026 (4 Studies Compared)" (Later 5 h local; Sprout martes 13-19 h y miércoles 12-21 h). FrameOS, 2026. https://frameos.studio/blog/best-time-to-post-on-instagram
19. "Fivetran for Instagram Business" (`online_followers`: 24 valores por hora; fechas de audiencia en UTC). Fivetran Docs, 2026. https://fivetran.com/docs/connectors/applications/instagram-business
20. "What is the time zone used by Instagram Insights in Instagram Creator Studio?" (hora del Pacífico, reporte viejo). Quora, sin fecha. https://www.quora.com/What-is-the-time-zone-used-by-Instagram-Insights-in-Instagram-Creator-Studio
21. "Measures of Location" y "Measures of Scale" (mediana, MAD). NIST/SEMATECH e-Handbook of Statistical Methods, NIST, 2012. https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm · https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm (link no reverificado en esta sesión)
22. Wilson, E. B. "Probable Inference, the Law of Succession, and Statistical Inference". Journal of the American Statistical Association 22(158), 1927 (intervalo de Wilson). https://doi.org/10.1080/01621459.1927.10502953 (link no reverificado en esta sesión)
23. "Detection of Outliers" (puntaje z modificado de Iglewicz y Hoaglin, umbral 3,5). NIST/SEMATECH e-Handbook of Statistical Methods, NIST, 2012. https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm (link no reverificado en esta sesión)
24. "Time Zone Database" (nombres de zona como America/Montevideo). IANA, vigente. https://www.iana.org/time-zones (link no reverificado en esta sesión)
25. "Instagram Insights Update: What Changed in April 2026" (3 pestañas, vistas en el tiempo). Inro, abr-2026. https://www.inro.social/blog/instagram-insights-update
26. Lindsey Gamble, post en Threads citando el anuncio de Instagram ("All the previous metrics are still there"), abr-2026. https://www.threads.com/@lindseygamble_/post/DXhQ9Eylnp2/
27. "How to Use Instagram's New Metrics (Skip Rate, Share Rate, Save Rate) in Rate Negotiations". Jessica Jane Mann, Substack, 2026. https://jessicajanemann.substack.com/p/instagrams-new-metrics-just-became

Pendiente para la próxima ronda (no se pudo buscar más en esta sesión): tasas de guardado y de compartido "buenas" por tamaño de cuenta con fuente pública 2026, estudio de Metricool con datos por país de Latinoamérica, y la zona horaria exacta de `online_followers` en la documentación de Meta.
