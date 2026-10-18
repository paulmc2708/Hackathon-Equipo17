# Investigación: Analista de métricas

> Qué es: la investigación propia del Analista de métricas de Hookia. Fecha de corte: octubre 2026.
> Para qué: que cada conclusión que le des a la persona tenga un respaldo real.

## 0. Cómo usar esta investigación

- Complementa tu informe base [Informe base, oct-2026] sin repetir su pirámide, umbrales ni benchmarks. Suma: qué mide cada número de Instagram hoy (y cuándo cambió), cuándo un número alcanza para concluir y cómo testear y atribuir sin engañarse.
- Justificá cada conclusión con un dato de acá o del informe base, en criollo ("según la documentación de Meta..."). Nunca muestres etiquetas entre corchetes.
- Confianza: documentación de Meta [Alta]; prensa especializada que cita anuncios de Instagram [Media]; blogs y ayudas de proveedores [Baja] o [Media]. Si un proveedor contradice a Meta, gana Meta.
- La sección 2 son cuentas de probabilidad propias con supuestos a la vista, no un paper. Decilo así: "es una cuenta de probabilidad, no un estudio".
- Antes de comparar dos períodos, revisá si en el medio cambió una definición (tabla 3.2): un salto el día de un cambio de Meta no es rendimiento.
- Esta ronda NO pudo verificar (el cupo de búsquedas compartido se agotó): benchmarks por nicho 2025-2026, datos de LATAM y papers. Si te los piden, usá el informe base aclarando mercado y fórmula, o decí que no hay dato confiable. Nunca los inventes.
- Con cuentas chicas, ante la duda entre concluir y esperar, gana esperar: decí qué dato falta y cuándo va a estar.

## 1. Lo esencial: 12 conclusiones

1. **"Vistas" no significa lo mismo en un reel que en una foto o carrusel.** Desde agosto de 2024, en reels es cada inicio o repetición; en fotos y carruseles, cada aparición en pantalla [SMT, ago-2024] [Socialsamosa, ago-2024]. [Media]
2. **"Impresiones" y "reproducciones" ya no existen en la API.** Baja en la v22 (21-ene-2025) y en todas las versiones desde el 21-abr-2025 (solo las impresiones de contenido anterior a julio de 2024 siguieron en versiones viejas); el reemplazo es `views` [Meta v22, ene-2025]. Si una herramienta las muestra en cero, es por eso [Metricool Help, 2025]. [Alta]
3. **El salteo oficial se calcula sobre vistas iniciales:** vistas que se fueron en los primeros 3 s ÷ vistas iniciales (primera vez que el reel arranca en una sesión). Es estimado y "en desarrollo" [Meta Media Insights, 2026]. En agosto de 2025 reemplazó a la "tasa de visualización", que medía lo contrario [SMT, ago-2025]. [Alta]
4. **Hay dos familias de números: orgánico de Instagram y total de todas las superficies.** `views`, `likes`, `comments` y `total_interactions` son orgánicos; desde abril de 2026 hay totales que suman Facebook cruzado y pauta, iguales a la app [Meta Media Insights, 2026] [Meta blog, abr-2026]. Las tasas van orgánico sobre orgánico. [Alta]
5. **El alcance es estimado y Meta anunció que lo reemplazará por "espectadores".** Anunciado el 18-feb-2026 como medida común de Facebook e Instagram [Meta blog v25, feb-2026] [Meta v25, feb-2026]; los proveedores ven saltos en los dos sentidos [Ecorpit, 2026] [Emplifi, jun-2026]. [Alta el anuncio; Baja el tamaño del salto]
6. **El "% de compartidos" de la app no tiene denominador público.** Tres proveedores lo describen sobre vistas, impresiones o espectadores [Digivizer] [Sodaspoon] [Inro, abr-2026]. Calculá el tuyo siempre igual (compartidos ÷ alcance). [Baja; la solución es criterio]
7. **Instagram compara cada reel contra el promedio de la persona en el mismo tramo de tiempo** ("Vistas en el tiempo", enero de 2025) [TechCrunch, ene-2025]. Comparamos a igual edad y contra la mediana propia (un pico no la arrastra). [Media]
8. **Con 3 posts por semana, la mediana semanal se duplica o cae a la mitad sin causa** en el 36% de las semanas con dispersión moderada (σ = 0,8) [Cálculo propio]. Las tendencias se leen en bloques de 4 semanas. [Cálculo]
9. **Un pico de 3× la mediana es común por azar en cuentas dispersas:** con σ = 0,8, el 8,5% de los posts lo supera sin razón; en 30 posts, 93% de chances de ver al menos uno [Cálculo propio]. El umbral de outlier depende de la dispersión de cada persona. [Cálculo]
10. **Después de un pico, lo normal es bajar:** con posts independientes, tras uno de más de 3× la mediana el siguiente sale más bajo el 93-96% de las veces y rinde entre un cuarto y un quinto del pico [Cálculo propio]. No es castigo del algoritmo. [Cálculo]
11. **Comparar dos estilos pide muchos posts:** con σ = 0,8, ver que uno duplica las vistas pide ~21 posts por grupo; ver +30%, ~146 [Cálculo propio]. Con cuentas chicas solo se ven efectos grandes o señales medidas sobre cientos de vistas (salteo). [Cálculo]
12. **Una tasa con pocos eventos es ruido:** con 2 compartidos, el valor real compatible va de 0,24 a 7,2; con 10, de 4,8 a 18,4. Con 100 vistas iniciales, el salteo tiene ±9 puntos de margen [Cálculo propio]. [Cálculo]

## 2. Fundamentos: lo que dice la ciencia

> En esta ronda no se pudo abrir ningún paper (búsquedas agotadas, revistas bloqueadas por la red). Esto es estadística básica: cuentas exactas o simulaciones propias (20.000 repeticiones por escenario) con supuestos explícitos [Cálculo propio]. Decí "cuenta de probabilidad", nunca "un estudio demostró".

### 2.1 El supuesto de trabajo

- Las vistas de una cuenta no se reparten parejo: muchos posts normales y pocos muy altos (se nota cuando el promedio queda bastante arriba de la mediana). Modelo de trabajo: log-normal (el logaritmo de las vistas forma una campana). Es criterio: sirve para dimensionar el ruido, no para predecir.
- Dispersión de la persona: **σ ≈ ln(p75 ÷ p25) ÷ 1,349**, con p75 y p25 los cuartiles de vistas (o alcance) de sus posts maduros. Alternativa robusta: σ ≈ 1,4826 × mediana de |ln(vistas) − mediana de ln(vistas)|; 1,4826 iguala esa medida al desvío estándar de una campana.

| p75 ÷ p25 | σ | Lectura |
|---|---|---|
| 1,5 | 0,30 | muy pareja |
| 2 | 0,51 | pareja |
| 3 | 0,81 | moderada (ejemplo de este documento) |
| 4 | 1,03 | dispersa |
| 6 | 1,33 | depende de pegarla |

Con pocos posts, σ también es ruidoso: tomalo como orden de magnitud.

### 2.2 Mediana, no promedio (y aun la mediana tiembla)

- 9 posts de 500 vistas y 1 de 20.000: promedio 2.450 (4,9 veces lo típico), mediana 500.
- Con σ = 0,8, la mediana observada cae (80% de las veces) entre: 5 posts → 0,57× y 1,73× la real; 10 → 0,69× y 1,48×; 15 → 0,72× y 1,39×; 30 → 0,79× y 1,26×. Coincide con Jake Schincariol: con 30 posts se ve un patrón, con 6 no [Jake ig-audit, 2026].

### 2.3 Outliers: cuándo un pico es real

| σ | Prob. por post de pasar 3× la mediana por azar | Esperados en 30 posts | Al menos uno en 30 |
|---|---|---|---|
| 0,5 | 1,4% | 0,4 | 34% |
| 0,8 | 8,5% | 2,5 | 93% |
| 1,0 | 13,6% | 4,1 | 99% |
| 1,2 | 18,0% | 5,4 | casi 100% |

Umbral ajustado (z robusto sobre el logaritmo): **outlier si vistas > mediana × e^(z·σ)**.

| z | Prob. por post | Al menos uno en 30 | σ 0,5 | σ 0,8 | σ 1,0 |
|---|---|---|---|---|---|
| 2,0 | 2,3% | 50% | 2,7× | 5,0× | 7,4× |
| 2,5 | 0,62% | 17% | 3,5× | 7,4× | 12,2× |
| 3,0 | 0,13% | 4% | 4,5× | 11,0× | 20,1× |

Propuesta (criterio): z ≥ 2 es "señal" y z ≥ 2,5 es "outlier real". Un 2× se celebra pero no prueba nada: con σ = 0,8, el 19% de los posts lo pasa por azar.

### 2.4 Regresión a la media

Con posts independientes, tras uno de más de 3× la mediana, el siguiente sale más bajo el 96% (σ 0,8) o el 93% (σ 1,0) de las veces; la mediana de "siguiente ÷ pico" es 0,24 y 0,21. El pico tiene una parte de suerte que no se repite. Si la persona encontró algo de verdad, se ve en la mediana de las semanas siguientes, no en el post siguiente.

### 2.5 Ruido semana contra semana (3 posts por semana, sin cambio real)

| σ | Mediana de una semana ÷ la anterior (80% de las veces) | Prob. de "duplicar" o "caer a la mitad" |
|---|---|---|
| 0,5 | 0,54× a 1,84× | 15% |
| 0,8 | 0,37× a 2,64× | 36% |
| 1,0 | 0,29× a 3,34× | 46% |

### 2.6 Cuántos posts hacen falta para comparar dos cosas

Posts por grupo para detectar la mejora el 80% de las veces, con 5% de error (prueba sobre el logaritmo):

| σ | +30% | +50% | el doble | el triple |
|---|---|---|---|---|
| 0,5 | 58 | 24 | 9 | 4 |
| 0,8 | 146 | 62 | 21 | 9 |
| 1,0 | 229 | 96 | 33 | 14 |

Chequeo simulado con Mann-Whitney (σ 0,8): 22 por grupo detectan "el doble" el 77% de las veces; 30 por grupo, "+30%" solo el 23%.

Límites exactos, sin suponer distribución:
- **Grupos (Mann-Whitney):** si los 3 posts de A le ganan a los 3 de B, igual hay 1 en 20 de azar (10% a dos colas): 3 contra 3 nunca llega al 5%. 4 contra 4 solo si los 4 ganan a los 4 (2,9%); 5 contra 5, 0,8%.
- **Pares (prueba de signos; misma semana y tema, cambia una sola cosa):** 5 de 5 = 3,1% (una cola); 6 de 6 = 1,6% (una cola) o 3,1% (dos colas); 7 de 8 = 3,5%. En cambio 4 de 5 = 18,8% y 5 de 6 = 10,9%: no alcanzan.

### 2.7 Tasas con pocos eventos

- **Salteo (proporción):** margen ≈ ±1,96 × √(p(1−p)/n). Con 65%: 100 vistas iniciales → ±9,3 puntos; 300 → ±5,4; 1.000 → ±3,0; 3.000 → ±1,7 (aproximado: las vistas no son personas independientes).
- **Conteos (compartidos, guardados, seguidores), Poisson exacto al 95%:** 0 eventos → 0 a 3,7; 1 → 0,03 a 5,6; 2 → 0,24 a 7,2; 5 → 1,6 a 11,7; 10 → 4,8 a 18,4; 20 → 12,2 a 30,9; 40 → 28,6 a 54,5. Debajo de ~10 eventos, una tasa no distingue un post de otro: sumá posts del mismo tipo.

### 2.8 Correlación, confusores y estacionalidad (criterio)

- Que dos cosas suban juntas no prueba causa (los posts del martes eran también los de mejor gancho; la semana con más posts fue la del lanzamiento): una variable por vez y preguntar qué más pasó.
- Día y hora se miran al final: casi nunca son la causa [Jake ig-audit, 2026].
- Antes de alarmar por una baja, mirá a los pares: Competitive Insights muestra el crecimiento de hasta 10 cuentas que elige la persona [Vaizle, nov-2025]. Si todas frenaron, es la época o la plataforma.

## 3. Lo que dice Instagram (oficial, 2024-2026)

### 3.1 Qué mide cada número (referencia de Meta, actualizada en junio de 2026)

Fuente: [Meta Media Insights, 2026], salvo donde se indica otra.

| Métrica (API) | Qué cuenta, según Meta | Cómo leerla |
|---|---|---|
| `views` | Veces que se reprodujo o mostró en Instagram (Feed, Reels, Historias). Solo orgánico. "En desarrollo". | Da escala, no personas. |
| `reach` | Cuentas únicas que lo vieron al menos una vez. Estimado. | Denominador de las tasas. |
| `total_interactions` | Likes + guardados + comentarios + compartidos, menos los quitados y comentarios borrados. | Neto (puede bajar). No incluye reposts. |
| `shares`, `saved` | Conteos; los guardados solo los ve el dueño o un colaborador aceptado. | Base de Recompensa. |
| `reposts` | Reposts menos reposts borrados (Feed, Reels, Historias). | No es enviar por DM: va aparte. |
| `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time` | Tiempo promedio de reproducción; el total suma repeticiones. "En desarrollo". | Retención % = promedio ÷ duración. |
| `reels_skip_rate` | Vistas que saltearon en 3 s ÷ vistas iniciales. Estimado, en desarrollo, solo reels. | Gancho. Puede volver vacío con pocas vistas [Storrito]. |
| `follows` | Figura en la tabla por publicación. | Conversión por post; verificá en qué formatos viene. |
| `total_views`, `total_likes`, `total_comments` | Suman pauta y Facebook; solo con login de Facebook. | Iguales a la app desde abril de 2026 [Meta blog, abr-2026]. No dividir por alcance de Instagram. |
| `crossposted_views`, `facebook_views` | Vistas Instagram + Facebook, y vistas en Facebook (dic-2025) [SMT, dic-2025]. | Solo si cruza reels a Facebook. |

Meta guarda las métricas hasta 2 años. A nivel cuenta, `follower_count` son los nuevos seguidores por día [Meta Account Insights], y los conectores exponen los taps en botones de contacto (cómo llegar, llamar, correo) como `profile_links_taps` [CData].

### 3.2 Línea de tiempo de cambios (para detectar cortes de serie)

| Fecha | Cambio | Qué rompe | Fuente |
|---|---|---|---|
| may-2024 | Prueba de Trial Reels, que no se muestran a seguidores | No se comparan con reels normales | [TechCrunch, may-2024] |
| ago-2024 | "Vistas" pasa a métrica principal en todos los formatos y cuenta repeticiones | Vistas de antes y después | [SMT, ago-2024] [Socialsamosa, ago-2024] |
| 21-ene-2025 | API v22: llega `views`; baja de `plays`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count` e `impressions` | Series de impresiones | [Meta v22, ene-2025] [Meta blog v22, ene-2025] |
| 29-ene-2025 | App: tasa de visualización (pasan los 3 s) y "Vistas en el tiempo", separando seguidores y no seguidores | Primer indicador oficial de gancho | [TechCrunch, ene-2025] [Socialsamosa, ene-2025] |
| 21-abr-2025 | Baja de las métricas viejas en todas las versiones | Ceros o vacíos en conectores | [Meta v22, ene-2025] |
| ago-2025 | Gráfico de retención por reel; salteo reemplaza a tasa de visualización | Salteo ≈ 100% − la vieja tasa | [SMT, ago-2025] [Socialsamosa, ago-2025] |
| nov-2025 | Competitive Insights: hasta 10 cuentas, crecimiento y frecuencia por formato | Vara con pares | [Vaizle, nov-2025] [Exchange4media, nov-2025] [SMT, nov-2025] |
| 4-dic-2025 | API: salteo, reposts (publicación y cuenta), vistas cruzadas y de Facebook | Salteo en herramientas recién desde acá | [SMT, dic-2025] [Storrito] |
| 18-feb-2026 | API v25: "espectadores" reemplazará al alcance; el alcance de páginas de Facebook se da de baja con la v26 | Posible salto en alcance | [Meta blog v25, feb-2026] [Meta v25, feb-2026] |
| 22-abr-2026 | API: totales de vistas, likes y comentarios con Facebook cruzado y pauta, iguales a la app | Orgánico contra total | [Meta blog, abr-2026] [Meta IG changelog, 2026] [SMT, abr-2026b] |
| fines de abr-2026 | Insights rediseñado: % de compartidos, % de salteo y vistas en el tiempo; por ahora sin collabs, Trial Reels ni contenido cruzado | Collabs y trials, aparte | [SMT, abr-2026a] [Inro, abr-2026] |
| jun-2026 | Herramientas pasan a "espectadores" en Facebook (10, 15 o 17 de junio según proveedor); totales de Instagram incluyen lo cruzado | Corte en Facebook y en totales | [Iconosquare, jun-2026] [Ecorpit, 2026] [Emplifi, jun-2026] [Brandwatch, jun-2026] |

Para Instagram no encontré una lista oficial de métricas afectadas por "espectadores": `reach` sigue en la referencia de junio de 2026 [Meta Media Insights, 2026].

### 3.3 Qué implica para una persona con marca personal

- Instagram mismo empuja porcentajes y comparación con uno mismo [TechCrunch, ene-2025] [SMT, abr-2026a]: el tablero de Hookia va en la misma dirección.
- Si "le subieron las vistas" en agosto de 2024 sin cambiar nada, fue la definición: sus vistas viejas no sirven de vara.
- Quien cruza a Facebook o pauta ve en la app un número más grande que en la herramienta; ninguno está mal [Meta blog, abr-2026].

## 4. Datos de la industria 2025-2026

| Dato | Valor | Fuente | Fecha | Muestra / mercado | Confianza |
|---|---|---|---|---|---|
| Impresiones para cuentas conectadas después del cambio | Aparecen en 0 | [Metricool Help, 2025] | 2025 | Usuarios de Metricool | Media |
| Salteo por API | Pide un mínimo de vistas; reels chicos pueden volver vacíos | [Storrito] | dic-2025 o después | Sin muestra | Baja |
| Reposts por API | Solo reposts públicos en el perfil, no historias ni DM | [Storrito] | dic-2025 o después | Sin muestra | Baja |
| Espectadores contra alcance anterior | "Hasta 35% menos" | [Ecorpit, 2026] | 2026 | Sin muestra | Baja |
| Espectadores contra alcance anterior | Puede verse más alto | [Emplifi, jun-2026] | jun-2026 | Clientes de Emplifi | Baja |
| Segmentación de espectadores | Solo total único, sin pagado, orgánico ni viral | [Iconosquare, jun-2026] | jun-2026 | - | Media |
| Totales de Instagram | Incluyen vistas, reacciones y comentarios de lo cruzado a Facebook | [Brandwatch, jun-2026] | jun-2026 | Clientes de Brandwatch | Media |
| Denominador del "% de compartidos" | Vistas [Digivizer]; impresiones (500 ÷ 10.000 = 5%) [Sodaspoon]; espectadores [Inro, abr-2026] | Tres blogs | 2025-2026 | - | Baja |
| Salteo en blogs | "Quienes pasan de largo en 3 s" [Frameos, 2026], contra la oficial sobre vistas iniciales | [Frameos, 2026] | 2026 | - | Gana Meta |
| Competitive Insights | Hasta 10 cuentas; crecimiento y frecuencia (reels, feed, anuncios); sin compartidos, guardados ni clics | [Vaizle, nov-2025] [Exchange4media, nov-2025] | nov-2025 | Global, gradual | Media |
| Benchmarks por tamaño y nicho | Sin actualización verificada en esta ronda | [Informe base, oct-2026] | - | - | - |

**Lectura.** Las definiciones están en transición (vistas con repeticiones, impresiones eliminadas, totales con Facebook y pauta, alcance que pasa a "espectadores") y los proveedores no coinciden ni en fechas ni en denominadores. Lo práctico: comparar a la persona contra sí misma con una fórmula fija, marcar cada corte y usar los benchmarks externos solo como orden de magnitud, con la fórmula de quien los publicó.

**Qué fórmula conviene para una cuenta chica** (criterio sobre las definiciones de Meta):
- *Por seguidores:* se dispara cuando un reel viaja a no seguidores (800 seguidores, 5.000 de alcance). Solo para compararse con tablas que la usan.
- *Por alcance:* cuentas únicas, igual en todos los formatos. La recomendada para comparar posts y semanas [Meta Media Insights, 2026].
- *Por vistas:* da más bajo y cambia según el formato (repeticiones, apariciones en pantalla) [SMT, ago-2024]. Solo entre reels.

## 5. Lo que enseñan los que más saben

> Esta ronda solo pudo verificar los marcos disponibles en el repositorio (skills abiertas de Jake Schincariol). Hormozi, Gadzhi, Cubría y Doglio ya están en el informe base. Quedó pendiente sumar más expertos verificados.

**Jake Schincariol: auditoría contra la mediana propia** [Jake ig-audit, 2026] [Jake ig-viral, 2026]
- Quién: autor de instagram-agent-skill (MIT), la base de conocimiento de Hookia.
- Marco: "la única fuente honesta de lo que funciona para una cuenta es esa cuenta". Mide múltiplo outlier (vistas ÷ mediana propia), % de alcance a no seguidores, retención a 3 s, tiempo promedio, envíos y seguidores por alcance; ordena por múltiplo y envíos, nunca por vistas. Compara los 5 mejores con los 5 peores: primero retención a 3 s, después gancho, formato, duración y tema; día y hora al final. En el nicho: más de 3× es señal, menos de 1,5× es un día normal, mediana de los últimos 12 reels, cuentas de hasta ~10 veces el tamaño propio.
- Aplicación: con 20-60 posts (un profe, un nutricionista) alcanza para ordenar por múltiplo y separar gancho de perfil, no para concluir sobre día y hora.
- Respaldo y crítica: compararse con la propia historia es lo mismo que hace Instagram con "Vistas en el tiempo" [TechCrunch, ene-2025]. El 3× fijo ignora la dispersión: con σ = 0,8, el 8,5% de los posts lo pasa por azar (2.3); complementalo con el z robusto.

## 6. Qué está funcionando ahora (2025-2026)

- **Leer por porcentajes y contra uno mismo:** tasa de visualización y "Vistas en el tiempo" (ene-2025), salteo y retención por reel (ago-2025), % de compartidos y de salteo en Insights (abr-2026) [TechCrunch, ene-2025] [SMT, ago-2025] [SMT, abr-2026a].
- **El gancho llega a las herramientas:** salteo y reposts por API desde diciembre de 2025 [SMT, dic-2025], aunque a veces vuelve vacío en reels chicos [Storrito].
- **Testear con Trial Reels:** probar un gancho con gente nueva sin tocar el perfil; la mecánica está en el informe base y desde abril de 2026 quedan fuera de las métricas nuevas [TechCrunch, may-2024] [Informe base, oct-2026] [SMT, abr-2026a]. Diseño (criterio, sección 2.6): una variable (el arranque), mismo video y tema, métrica elegida antes (salteo), misma edad, 5 o 6 pares.
- **Registrar cada post** (gancho, formato, llamado a la acción): sin registro no hay auditoría, hay memoria selectiva [Jake ig-audit, 2026].

## 7. Mercado hispano y LATAM

- Esta ronda no verificó datos de LATAM ni de España (el buscador se agotó antes): no hay benchmarks hispanos nuevos.
- Las definiciones de Meta son globales: las reglas de lectura y las cuentas de la sección 2 valen igual en cualquier país [Meta Media Insights, 2026].
- Las funciones llegan de a poco (Competitive Insights fue gradual) [Vaizle, nov-2025]: preguntá si la tiene antes de mandarla a una pantalla.
- Criterio: los benchmarks del informe base son mayormente de marcas de EE. UU. y Europa; usalos como orden de magnitud y decilo. La comparación fina, contra su historia y pares de su idioma y tamaño [Jake ig-viral, 2026].
- Criterio estacional: en el hemisferio sur, diciembre a febrero es verano; si bajan los números, compará con las mismas semanas del año anterior o con sus pares.
- En una captura de la app en español, ubicá cada métrica por su definición: los nombres pueden no coincidir con la API.

## 8. Reglas de decisión

- **R1.** Si hay menos de 5 posts maduros (72 h o más) en 90 días → no des puntaje ni patrones; decí que faltan datos y proponé revisar en 3-4 semanas. Por qué: con 5 posts la mediana observada cae entre 0,57× y 1,73× de la real por azar [Cálculo propio].
- **R2.** Si hay entre 5 y 15 posts maduros → mostrá el puntaje como "preliminar" y no compares subgrupos (formatos, temas). Por qué: con 10 posts la mediana todavía se corre entre 0,69× y 1,48× [Cálculo propio].
- **R3.** Si querés afirmar que un tipo de post rinde mejor con menos de 4 posts por grupo → presentalo como hipótesis a testear. Por qué: con 3 contra 3, aun ganando los 3, queda 10% de azar (dos colas) [Cálculo propio].
- **R4.** Si un post supera 2× la mediana propia → ponelo en "lo que salió bien", sin decir "encontraste la fórmula" hasta que otro parecido quede arriba de la mediana. Por qué: con σ = 0,8, el 19% de los posts pasa 2× por azar [Cálculo propio].
- **R5.** Si tenés que decidir si un post es outlier → calculá σ = ln(p75 ÷ p25) ÷ 1,349 y marcalo solo sobre mediana × e^(2,5σ) (3,5× con σ 0,5; 7,4× con 0,8; 12× con 1,0). Por qué: el 3× fijo marca por azar al menos uno de cada 30 posts el 93% de las veces con σ = 0,8 [Cálculo propio] [Jake ig-viral, 2026].
- **R6.** Si el post siguiente a un viral rinde mucho menos → explicá la regresión a la media, que no cambie todo, y compará la mediana de las 4 semanas siguientes con las 4 anteriores. Por qué: tras más de 3× la mediana, el siguiente sale más bajo el 93-96% de las veces [Cálculo propio].
- **R7.** Si compara una semana con la anterior publicando 3 veces por semana o menos → no concluyas; compará bloques de 4 semanas por mediana. Por qué: sin cambio real, la mediana semanal duplica o cae a la mitad el 36% de las semanas (σ 0,8) [Cálculo propio].
- **R8.** Si quiere saber si un cambio le subió las vistas un 20-30% → decile que con su volumen no se puede ver y mirá señales con más eventos (salteo, retención). Por qué: +30% pide ~146 posts por grupo y el doble ~21 (σ 0,8) [Cálculo propio].
- **R9.** Si el promedio de vistas es más del doble de la mediana → reportá la mediana y nombrá el post que infla el promedio. Por qué: 9 posts de 500 y uno de 20.000 dan promedio 2.450 y mediana 500 [Cálculo propio].
- **R10.** Si una tasa (compartidos, guardados o seguidores por alcance) sale de menos de 10 eventos → no compares posts sueltos: sumá posts del mismo tipo. Por qué: con 2 eventos el valor real compatible va de 0,24 a 7,2 [Cálculo propio].
- **R11.** Si dos reels difieren en menos de 10 puntos de salteo y alguno tiene menos de 300 vistas iniciales → tratalos como empatados. Por qué: el salteo se calcula sobre vistas iniciales y con 300 tiene ±5,4 puntos (±9,3 con 100) [Cálculo propio] [Meta Media Insights, 2026].
- **R12.** Si el salteo viene vacío en reels con pocas vistas → marcá "sin dato" (ni cero ni malo) y usá tiempo promedio o retención. Por qué: es estimado y en desarrollo, y la API pide un mínimo de vistas [Meta Media Insights, 2026] [Storrito].
- **R13.** Si el salteo es parecido en sus mejores y peores reels → no culpes al gancho: buscá la diferencia en retención, compartidos o tema. Por qué: Jake mira primero si la retención a 3 s separa a los mejores de los peores: si los separa, es el gancho [Jake ig-audit, 2026]; si no, la causa está en otro lado (inferencia nuestra).
- **R14.** Si un conector trae impresiones o reproducciones en cero o vacías → ignoralas y usá vistas y alcance. Por qué: Meta las dio de baja en la v22 y en todas las versiones desde el 21-abr-2025 [Meta v22, ene-2025] [Metricool Help, 2025].
- **R15.** Si compara vistas de antes y después de agosto de 2024, o vistas de carruseles con vistas de reels → compará alcance o tasas por alcance. Por qué: las vistas cuentan repeticiones y, en fotos y carruseles, apariciones en pantalla [SMT, ago-2024] [Socialsamosa, ago-2024].
- **R16.** Si cruza reels a Facebook, pauta, o la app no coincide con la herramienta → calculá tasas con `views`, `likes` y `comments` orgánicos, sacá los pautados de la mediana y explicá que la app muestra totales (Instagram, Facebook cruzado y pauta). Por qué: lo orgánico excluye anuncios y los totales iguales a la app llegaron a la API en abril de 2026, solo con login de Facebook [Meta Media Insights, 2026] [Meta blog, abr-2026].
- **R17.** Si el alcance o los "espectadores" saltan justo en una fecha de cambio de Meta → marcá el corte y compará solo dentro de cada período. Por qué: espectadores usa otro método y los proveedores ven saltos hacia arriba y hacia abajo [Meta blog v25, feb-2026] [Emplifi, jun-2026] [Ecorpit, 2026].
- **R18.** Si mostrás la tasa de compartidos → calculala siempre como compartidos ÷ alcance y no la compares con el % de la app. Por qué: Meta no publicó ese denominador y los proveedores lo describen de tres formas [Inro, abr-2026] [Sodaspoon] [Digivizer].
- **R19.** Si un post tiene reposts → mostralos aparte de los compartidos y fuera de las interacciones. Por qué: el repost es una republicación pública neta de borrados y `total_interactions` no lo incluye [Meta Media Insights, 2026] [Storrito].
- **R20.** Si comparás un post nuevo con los anteriores → hacelo a la misma edad (72 h o 7 días). Por qué: "Vistas en el tiempo" compara cada reel con el promedio de la persona en el mismo tramo [TechCrunch, ene-2025].
- **R21.** Si hay Trial Reels, collabs o contenido cruzado → sacalos de la mediana general y analizalos aparte (trial contra trial). Por qué: quedaron fuera de las métricas nuevas de Insights (abr-2026) y un trial solo llega a no seguidores [SMT, abr-2026a] [TechCrunch, may-2024].
- **R22.** Si quiere probar un gancho → mismo video y tema, cambia solo el arranque, como Trial Reel, métrica elegida antes (salteo), misma edad, 5 o 6 pares. Por qué: ganar 5 de 5 pares es 3,1% de azar y 4 de 5, 18,8% (una cola) [Cálculo propio] [Informe base, oct-2026].
- **R23.** Si un test termina parejo (4 o 5 de 6 pares) → no declares ganador: quedate con la versión más simple y testeá otra variable. Por qué: 5 de 6 todavía es 10,9% de azar [Cálculo propio].
- **R24.** Si pregunta qué día u hora le conviene → dejalo para el final: con menos de ~20 posts por franja no se ve. Por qué: casi nunca es la causa [Jake ig-audit, 2026] y ver el doble pide ~21 posts por grupo [Cálculo propio].
- **R25.** Si las métricas bajaron → antes de culpar al contenido revisá: cambio de definición en esa fecha, viral previo que inflaba la base y si los pares también frenaron. Por qué: Competitive Insights muestra crecimiento y frecuencia de hasta 10 cuentas elegidas [Vaizle, nov-2025] [SMT, nov-2025].
- **R26.** Si elegís cuentas para comparar → dentro de ~10 veces su tamaño y, por criterio, de su idioma. Por qué: lo que funciona en una cuenta enorme suele funcionar por su tamaño [Jake ig-viral, 2026].
- **R27.** Si un reel tuvo mucho alcance a no seguidores y casi no sumó seguidores → tratalo como problema de perfil, no de gancho. Por qué: es la distinción central de la auditoría de Jake [Jake ig-audit, 2026].
- **R28.** Si vende y no sabe qué post le trajo clientes → palabra clave distinta por post, link con parámetros UTM por publicación y registro semanal de consultas y ventas. Por qué: la API trae seguidores por post, seguidores nuevos por día y taps en botones de contacto, pero no ventas [Meta Media Insights, 2026] [Meta Account Insights] [CData].
- **R29.** Si una semana con más ventas coincide con más posts → preguntá qué más pasó (lanzamiento, mail, pauta, fecha especial) antes de atribuirlo. Por qué: una semana sola no separa causas y ya varía al doble o a la mitad por azar [Cálculo propio].
- **R30.** Si `windsor_campos` no trae una métrica (salteo, reposts, totales) → decí que no está en su conexión y no la estimes. Por qué: varias figuran "en desarrollo" y los totales solo existen con login de Facebook [Meta Media Insights, 2026].
- **R31.** Si pide comparar con hace más de 2 años → explicá que Instagram guarda métricas hasta 2 años y proponé guardarlas en Hookia desde ahora. Por qué: lo dice la documentación de Meta [Meta Media Insights, 2026].

## 9. Mitos y errores comunes

- **"Más vistas es más gente."** Las vistas cuentan repeticiones y apariciones; la gente distinta es el alcance [SMT, ago-2024] [Meta Media Insights, 2026].
- **"Me bajaron las impresiones a cero: me castigaron."** Es la baja de la métrica desde el 21-abr-2025 [Meta v22, ene-2025] [Metricool Help, 2025].
- **"Después del viral me hicieron shadowban."** Volver al nivel normal tras un pico pasa el 93-96% de las veces por regresión a la media [Cálculo propio].
- **"Si Instagram me avisa que un reel tuvo 20% más vistas que mi promedio, encontré algo."** Instagram usa ese tipo de comparación en sus consejos [TechCrunch, ene-2025], pero 1 de cada 4 reels supera el promedio en 20% por azar (25-27% según la dispersión) [Cálculo propio].
- **"La semana pasada crecí 50%: vamos bien."** Con 3 posts por semana, hasta un tercio de las semanas salta al doble o a la mitad sin causa [Cálculo propio].
- **"El % de compartidos de la app tiene que coincidir con el de mi herramienta."** No hay denominador oficial publicado [Inro, abr-2026] [Sodaspoon] [Digivizer].
- **"Con 2 o 3 posts por versión ya sé qué gancho gana."** Con 3 contra 3, ni el mejor resultado posible baja de 10% de azar [Cálculo propio].

## 10. Cómo explicárselo a la persona

- "Tus impresiones no bajaron por algo que hiciste: Instagram dejó de informarlas en abril de 2025. Miremos alcance, que es cuánta gente distinta te vio."
- "Este reel te fue 4 veces mejor que lo normal, buenísimo. Antes de decir que es la fórmula, hagamos dos más parecidos: en cuentas como la tuya, un pico así sale por suerte más seguido de lo que parece."
- "Que el reel de después del viral rindiera menos es lo esperable: después de un pico, lo normal es volver a tu nivel. No es un castigo."
- "No miremos esta semana contra la anterior: con 3 posts por semana, una semana puede salir el doble o la mitad sin que cambie nada. Miremos el mes."
- "Para saber si el gancho nuevo funciona, probemos bien: mismo video, distinto arranque, como reel de prueba. Si gana 5 de 5 veces, ya no es casualidad."
- "Este reel lo vio mucha gente nueva y casi nadie te siguió. No es el video, es el perfil: arreglemos bio y fijados antes de tocar los ganchos."

## Fuentes

- [Oficial] Meta v22, ene-2025: Meta for Developers (2025). "Graph API Changelog: Version 22.0". developers.facebook.com. https://developers.facebook.com/docs/graph-api/changelog/version22.0/
- [Oficial] Meta blog v22, ene-2025: Meta for Developers (2025). "Introducing Graph API v22 and Marketing API v22". Meta for Developers Blog. https://developers.facebook.com/blog/post/2025/01/21/introducing-graph-api-v22-and-marketing-api-v22/
- [Oficial] Meta Media Insights, 2026: Meta for Developers (actualizada en jun-2026). "Instagram Media Insights". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/
- [Oficial] Meta Account Insights: Meta for Developers (s/f, consultada oct-2026). "Instagram Account Insights". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights
- [Oficial] Meta blog v25, feb-2026: Meta for Developers (2026). "Introducing Graph API v25.0 and Marketing API v25.0". Meta for Developers Blog. https://developers.facebook.com/blog/post/2026/02/18/introducing-graph-api-v25-and-marketing-api-v25
- [Oficial] Meta v25, feb-2026: Meta for Developers (2026). "Graph API Changelog: Version 25.0". developers.facebook.com. https://developers.facebook.com/docs/graph-api/changelog/version25.0
- [Oficial] Meta blog, abr-2026: Meta for Developers (2026). "Instagram API updates for partnerships, metrics, collaboration and engagement". Meta for Developers Blog. https://developers.facebook.com/blog/post/2026/04/22/instagram-api-updates-for-partnerships-metrics-collaboration-and-engagement/
- [Oficial] Meta IG changelog, 2026: Meta for Developers (2026). "Changelog for Instagram Platform". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/changelog
- [Creador] Jake ig-audit, 2026: Jake Schincariol (2026). "ig-audit" (instagram-agent-skill, MIT). GitHub. https://github.com/Jakeschincariol/instagram-agent-skill
- [Creador] Jake ig-viral, 2026: Jake Schincariol (2026). "ig-viral" (instagram-agent-skill, MIT). GitHub. https://github.com/Jakeschincariol/instagram-agent-skill
- [Estudio] Informe base, oct-2026: Hookia (2026). "Instagram: qué métricas importan de verdad". Repositorio de Hookia. .claude/skills/metricas-que-importan/informe.md
- [Estudio] Cálculo propio: Hookia (2026). "Cuentas exactas y simulaciones de ruido estadístico (log-normal, Mann-Whitney, prueba de signos, Poisson)". Método y supuestos en la sección 2. Sin URL.
- [Prensa] SMT, ago-2024: Social Media Today (2024). "Instagram Updates Metrics to Focus Creators on Views". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-updates-metrics-to-focus-creators-on-views/723645/
- [Prensa] Socialsamosa, ago-2024: Social Samosa (2024). "Instagram updates metrics, creators prioritise reach" (título según la URL). socialsamosa.com. https://socialsamosa.com/news-2/instagram-updates-metrics-creators-prioritise-reach-6807009
- [Prensa] TechCrunch, may-2024: TechCrunch (2024). "Instagram tests 'trial reels' that don't display to a creator's followers". techcrunch.com. https://techcrunch.com/2024/05/31/instagram-tests-trial-reels-that-dont-display-to-a-creators-followers/
- [Prensa] TechCrunch, ene-2025: TechCrunch (2025). "Instagram gives creators more insight into their reels' performance". techcrunch.com. https://techcrunch.com/2025/01/29/instagram-gives-creators-more-insight-into-their-reels-performance/
- [Prensa] Socialsamosa, ene-2025: Social Samosa (2025). "Instagram enhances Reels insights with view rate & performance tips". socialsamosa.com. https://www.socialsamosa.com/news-2/instagram-enhances-reels-insights-view-rate-performance-tips-8673312
- [Prensa] SMT, ago-2025: Social Media Today (2025). "Instagram Adds Retention Metrics for Reels". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-adds-retention-insights-reels/758464/
- [Prensa] Socialsamosa, ago-2025: Social Samosa (2025). "Instagram adds Retention chart & Skip Rate as new performance metrics for reels". socialsamosa.com. https://www.socialsamosa.com/news-2/instagram-retention-chart-skip-rate-new-performance-metrics-reels-9730992
- [Prensa] SMT, nov-2025: Social Media Today (2025). "Instagram Adds Competitor Insights for Professional Accounts". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-adds-competitor-insights-professional-accounts/804465/
- [Prensa] Vaizle, nov-2025: Vaizle Insights (2025). "Instagram Rolls Out Competitor Insights for Professional Accounts". insights.vaizle.com. https://insights.vaizle.com/news/instagram-rolls-out-competitor-insights-for-professional-accounts
- [Prensa] Exchange4media, nov-2025: Exchange4media (2025). "Instagram lets brands track their competitors: here's how the new feature works". exchange4media.com. https://www.exchange4media.com/digital-news/instagram-lets-brands-track-their-competitors-heres-how-the-new-feature-works-149037.html
- [Prensa] SMT, dic-2025: Social Media Today (2025). "Meta Announces Updates for the Instagram Marketing API". socialmediatoday.com. https://www.socialmediatoday.com/news/meta-announces-updates-for-the-instagram-marketing-api/807083/
- [Prensa] Storrito: Storrito (s/f, posterior a dic-2025). "How Instagram's Updated Marketing API Metrics Work". Blog de proveedor. https://storrito.com/resources/how-instagrams-updated-marketing-api-metrics-work/
- [Prensa] SMT, abr-2026a: Social Media Today (2026). "Instagram improves Insights UI, adds new metrics". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-improves-insights-ui-adds-new-metrics/818504/
- [Prensa] SMT, abr-2026b: Social Media Today (2026). "Meta expands Instagram management APIs". socialmediatoday.com. https://www.socialmediatoday.com/news/meta-expands-instagram-management-apis/818385/
- [Prensa] Inro, abr-2026: Inro (2026). "Instagram Insights Update: What Changed in April 2026". Blog de proveedor. https://www.inro.social/blog/instagram-insights-update
- [Prensa] Sodaspoon: Sodaspoon (s/f). "New Instagram Insights: Better Metrics for Posts and Reels". Blog de proveedor. https://www.sodaspoon.com/blogs/resources/new-instagram-insights-better-metrics-for-posts-and-reels
- [Prensa] Digivizer: Digivizer (s/f). "Instagram Analytics: What Meta's New Metrics Update Reveal About Content Performance". Blog de proveedor. https://digivizer.com/blog/instagram-analytics-what-metas-new-metrics-update-reveal-about-content-performance/
- [Prensa] Frameos, 2026: Frameos Studio (2026). "How to Read Instagram Insights in 2026 (After the Views Change)". Blog de proveedor. https://frameos.studio/blog/how-to-read-instagram-insights
- [Prensa] Metricool Help, 2025: Metricool (2025). "Instagram replaces 'Impressions' with 'Views': What you need to know". Centro de ayuda de proveedor. https://help.metricool.com/en/article/instagram-replaces-impressions-with-views-what-you-need-to-know-ustr2f
- [Prensa] Iconosquare, jun-2026: Iconosquare (2026). "Facebook Reach Metrics Changes - June 2026". Centro de ayuda de proveedor. https://support.iconosquare.com/facebook-reach-metrics-changes-june-2026
- [Prensa] Emplifi, jun-2026: Emplifi (2026). "Facebook Metric Deprecation (June 2026)". Documentación de proveedor. https://docs.emplifi.io/platform/latest/home/facebook-metric-deprecation-june-2026
- [Prensa] Ecorpit, 2026: Ecorpit (2026). "Meta retires legacy reach metrics on 15 June 2026". Blog de proveedor. https://ecorpit.com/meta-ads-legacy-metrics-media-views-viewers-migration-2026/
- [Prensa] Brandwatch, jun-2026: Brandwatch (2026). "Cross-posted Facebook data in Instagram: total views, reactions and comments (June 2026)" (título según la URL). Centro de ayuda de proveedor. https://social-media-management-help.brandwatch.com/en/articles/15695131-cross-posted-facebook-data-in-instagram-total-views-reactions-and-comments-june-2026
- [Prensa] CData: CData Software (s/f). "AccountContactButtonType" (conector de Instagram). Documentación de proveedor. https://cdn.cdata.com/help/ENN/ado/pg_table-accountcontactbuttontype.htm
