# Investigación: Analista de métricas

> Qué es: la investigación propia del Analista de métricas de Hookia. Fecha de corte: octubre 2026.
> Para qué: que cada conclusión que le des a la persona tenga un respaldo real.

## 0. Cómo usar esta investigación

- Esto complementa tu informe base ("Instagram: qué métricas importan de verdad") [Informe base, oct-2026]. No repite su pirámide, sus umbrales ni sus benchmarks. Suma tres cosas: qué mide exactamente cada número que trae Instagram hoy (y cuándo cambió su definición), cuándo un número alcanza para concluir algo y cuándo es ruido, y cómo testear y atribuir sin engañarse.
- Justificá cada conclusión con un dato de acá o del informe base, dicho en criollo: "según la documentación oficial de Meta...", "la cuenta de probabilidad dice que...". Nunca le muestres a la persona una etiqueta entre corchetes.
- Confianza: la documentación para desarrolladores de Meta es [Alta]; la prensa especializada que cita anuncios de Instagram es [Media]; los blogs y centros de ayuda de proveedores son [Baja] o [Media]. Si un proveedor contradice a Meta, gana Meta.
- La sección 2 son cuentas de probabilidad propias, con los supuestos a la vista, no un paper. Sirven para saber cuánta confianza darle a un número. Decilo así: "es una cuenta de probabilidad, no un estudio".
- Antes de comparar dos períodos, revisá si en el medio cambió una definición (tabla 3.2). Un salto el día de un cambio de Meta no es rendimiento de la persona.
- Lo que esta ronda NO pudo verificar (el cupo de búsquedas compartido se agotó): benchmarks por nicho 2025-2026, datos propios de LATAM y papers académicos. Si te piden eso, usá el informe base aclarando mercado y fórmula, o decí que no hay dato confiable. Nunca lo inventes.
- Ante la duda entre "concluir" y "esperar más datos", con cuentas chicas casi siempre gana esperar: decí qué dato falta y cuándo lo vas a tener.

## 1. Lo esencial: 12 conclusiones

1. **"Vistas" no significa lo mismo en un reel que en una foto o un carrusel.** Desde agosto de 2024, en reels una vista es cada vez que el video empieza o se repite; en fotos y carruseles, cada vez que aparece en pantalla. Las repeticiones cuentan [SMT, ago-2024] [Socialsamosa, ago-2024]. [Media]
2. **"Impresiones" y "reproducciones" ya no existen en la API.** Meta las dio de baja con la versión 22 (21-ene-2025) y desde el 21-abr-2025 no se pueden pedir en ninguna versión (las impresiones de contenido anterior al 2-jul-2024 quedaron solo en versiones viejas). El reemplazo es `views` [Meta v22, ene-2025]. Si una herramienta las muestra en cero, es por eso [Metricool Help, 2025]. [Alta]
3. **El salteo oficial se calcula sobre "vistas iniciales".** Es la cantidad de vistas que se fueron en los primeros 3 segundos dividida por las vistas iniciales (la primera vez que el reel arranca en una sesión). Meta lo marca como estimado y "en desarrollo" [Meta Media Insights, 2026]. En agosto de 2025 reemplazó a la "tasa de visualización", que medía lo contrario [SMT, ago-2025]. [Alta]
4. **Hay dos familias de números: lo orgánico de Instagram y el total de todas las superficies.** `views`, `likes`, `comments` y `total_interactions` son solo orgánicos; desde abril de 2026 hay totales que suman Facebook cruzado y pauta, y que coinciden con la app [Meta Media Insights, 2026] [Meta blog, abr-2026]. Las tasas se calculan orgánico sobre orgánico. [Alta]
5. **El alcance es estimado y Meta lo está reemplazando por "espectadores".** Lo anunció el 18-feb-2026 como medida común para Facebook e Instagram; las métricas de alcance de páginas de Facebook se dan de baja con la versión 26 [Meta blog v25, feb-2026] [Meta v25, feb-2026]. Los proveedores ven diferencias en los dos sentidos [Ecorpit, 2026] [Emplifi, jun-2026]. [Alta el anuncio; Baja el tamaño del salto]
6. **El "% de compartidos" de la app no tiene denominador público.** Tres proveedores lo describen sobre vistas, sobre impresiones o sobre espectadores [Digivizer] [Sodaspoon] [Inro, abr-2026]. Calculá el tuyo siempre igual (compartidos ÷ alcance) y no lo mezcles con el de la app. [Baja sobre la definición; la solución es criterio]
7. **Instagram mismo compara cada reel contra el promedio de la persona en el mismo tramo de tiempo** ("Vistas en el tiempo", enero de 2025) [TechCrunch, ene-2025]. Por eso se compara a igual edad (72 h, 7 días) y contra la propia historia. Nosotros usamos la mediana en vez del promedio porque un pico no la arrastra. [Media]
8. **Con 3 posts por semana, la mediana semanal puede duplicarse o caer a la mitad sin que nada cambie.** Pasa en el 36% de las semanas con una dispersión moderada (σ = 0,8) [Cálculo propio]. Las tendencias se leen en bloques de 4 semanas. [Cálculo]
9. **Un pico de 3 veces la mediana es común por puro azar en cuentas dispersas.** Con σ = 0,8, el 8,5% de los posts supera 3× la mediana sin ninguna razón; en 30 posts hay 93% de probabilidad de ver al menos uno [Cálculo propio]. El umbral de outlier tiene que depender de la dispersión de cada persona. [Cálculo]
10. **Después de un pico, lo normal es bajar.** Si los posts son independientes, tras uno que pasó 3× la mediana, el siguiente sale más bajo el 93-96% de las veces y típicamente rinde entre un cuarto y un quinto del pico [Cálculo propio]. No es un castigo del algoritmo. [Cálculo]
11. **Comparar dos estilos pide muchos más posts de los que la gente cree.** Con σ = 0,8, ver que un estilo duplica las vistas pide unos 21 posts por grupo; ver una mejora del 30%, unos 146 [Cálculo propio]. Con cuentas chicas solo se detectan efectos grandes, o señales medidas sobre cientos de vistas, como el salteo. [Cálculo]
12. **Una tasa con pocos eventos es ruido.** Con 2 compartidos, el valor real compatible va de 0,24 a 7,2 (30 veces de rango); con 10, de 4,8 a 18,4. Con 100 vistas iniciales, el salteo tiene un margen de ±9 puntos [Cálculo propio]. [Cálculo]

## 2. Fundamentos: lo que dice la ciencia

> En esta ronda no se pudo abrir ningún paper: el cupo de búsquedas compartido se agotó y la red bloqueó revistas y repositorios. Por eso esta sección no cita estudios académicos. Lo que sigue es estadística básica aplicada: cuentas exactas o simulaciones hechas por nosotros (20.000 repeticiones por escenario), con los supuestos a la vista [Cálculo propio]. Usalo como "cuenta de probabilidad", nunca como "un estudio demostró".

### 2.1 El supuesto de trabajo

- Las vistas y el alcance de una cuenta no se reparten parejo: muchos posts "normales" y pocos muy altos. Se nota en los datos de la persona cuando el promedio queda bastante por encima de la mediana. Modelo de trabajo: log-normal (el logaritmo de las vistas forma una campana). Es criterio, no dato: sirve para dimensionar el ruido, no para predecir.
- La dispersión (σ) se estima con los datos de la propia persona: **σ ≈ ln(p75 ÷ p25) ÷ 1,349**, donde p75 y p25 son el cuartil alto y el bajo de las vistas (o del alcance) de sus posts maduros. Otra forma: σ ≈ 1,4826 × la mediana de las distancias absolutas entre cada ln(vistas) y la mediana de ln(vistas). La constante 1,4826 hace que esa medida equivalga al desvío estándar en una campana.

| p75 ÷ p25 de la persona | σ aproximado | Lectura |
|---|---|---|
| 1,5 | 0,30 | cuenta muy pareja |
| 2 | 0,51 | pareja |
| 3 | 0,81 | moderada (el ejemplo de este documento) |
| 4 | 1,03 | dispersa |
| 6 | 1,33 | muy dispersa: depende de pegarla |

Con pocos posts, la estimación de σ también es ruidosa: tomala como orden de magnitud.

### 2.2 Mediana, no promedio (y aun la mediana tiembla)

- Ejemplo exacto: 9 posts de 500 vistas y 1 de 20.000. Promedio: 2.450 (4,9 veces lo típico). Mediana: 500.
- En una log-normal, el promedio ya queda arriba de la mediana sin ningún viral: 1,13 veces con σ 0,5; 1,38 con σ 0,8; 1,65 con σ 1,0.
- La mediana observada también varía con pocos posts. Con σ = 0,8, el 80% de las veces cae entre:

| Posts maduros | Mediana observada respecto de la real |
|---|---|
| 5 | entre 0,57× y 1,73× |
| 10 | entre 0,69× y 1,48× |
| 15 | entre 0,72× y 1,39× |
| 30 | entre 0,79× y 1,26× |

Lectura: con 5 posts, la vara de la persona puede estar corrida un 40-70%; con 30, un 20-25%. Coincide con el criterio de Jake Schincariol: con 30 posts se ve un patrón, con 6 no [Jake ig-audit, 2026].

### 2.3 Outliers: cuándo un pico es real

Probabilidad de que un post supere 3× la mediana **solo por azar**:

| σ de la persona | Por post | Esperados en 30 posts | Al menos uno en 30 |
|---|---|---|---|
| 0,5 | 1,4% | 0,4 | 34% |
| 0,8 | 8,5% | 2,5 | 93% |
| 1,0 | 13,6% | 4,1 | 99% |
| 1,2 | 18,0% | 5,4 | casi 100% |

Umbral que se ajusta a la persona (z robusto sobre el logaritmo): **outlier si vistas > mediana × e^(z·σ)**.

| z | Prob. por post | Al menos uno en 30 | Umbral con σ 0,5 | con σ 0,8 | con σ 1,0 |
|---|---|---|---|---|---|
| 2,0 | 2,3% | 50% | 2,7× | 5,0× | 7,4× |
| 2,5 | 0,62% | 17% | 3,5× | 7,4× | 12,2× |
| 3,0 | 0,13% | 4% | 4,5× | 11,0× | 20,1× |

Propuesta (criterio): z ≥ 2 para "señal" y z ≥ 2,5 para "outlier real". Un post de 2× es para celebrar, pero no prueba una fórmula: con σ = 0,8, el 19% de los posts pasa 2× por azar.

### 2.4 Regresión a la media

- Si los posts fueran independientes, después de uno que pasó 3× la mediana, el siguiente sale más bajo el 96% de las veces con σ = 0,8 y el 93% con σ = 1,0. La mediana del cociente "siguiente ÷ pico" es 0,24 y 0,21: el post siguiente suele rendir entre un cuarto y un quinto del pico.
- Por qué pasa: el pico tiene un componente de suerte que no se repite. Si la persona de verdad encontró algo, se ve en la mediana de las semanas siguientes, no en el post siguiente.

### 2.5 Ruido semana contra semana

Tres posts por semana y ningún cambio real. Cociente entre la mediana de una semana y la de la anterior:

| σ | El 80% de las veces cae entre | Prob. de que "duplique" o "caiga a la mitad" |
|---|---|---|
| 0,5 | 0,54× y 1,84× | 15% |
| 0,8 | 0,37× y 2,64× | 36% |
| 1,0 | 0,29× y 3,34× | 46% |

### 2.6 Cuántos posts hacen falta para comparar dos cosas

Posts por grupo para detectar una mejora con 80% de probabilidad y 5% de error (prueba sobre el logaritmo de las vistas):

| σ | +30% | +50% | el doble | el triple |
|---|---|---|---|---|
| 0,5 | 58 | 24 | 9 | 4 |
| 0,8 | 146 | 62 | 21 | 9 |
| 1,0 | 229 | 96 | 33 | 14 |

Chequeo por simulación con la prueba de Mann-Whitney (σ = 0,8): con 22 posts por grupo se detecta "el doble" el 77% de las veces; con 30 por grupo, "+30%" solo el 23%.

Límites exactos con muestras chicas, sin suponer ninguna distribución:
- **Grupos (Mann-Whitney):** aunque los 3 posts de A le ganen a los 3 de B, hay 1 en 20 de que sea azar (10% a dos colas): con 3 contra 3 nunca se llega al 5%. Con 4 contra 4, solo si los 4 ganan a los 4 (2,9% a dos colas). Con 5 contra 5, 0,8%.
- **Pares (prueba de signos; misma semana, mismo tema, cambia una sola cosa):** ganar 5 de 5 = 3,1% (una cola) o 6,3% (dos colas); 6 de 6 = 1,6% (una cola) o 3,1% (dos colas); 7 de 8 = 3,5% (una cola). En cambio, 4 de 5 = 18,8% y 5 de 6 = 10,9% (una cola): no alcanzan.

### 2.7 Tasas con pocos eventos

- **Proporciones (salteo):** margen aproximado ±1,96 × √(p(1−p)/n). Con un salteo de 65%: 100 vistas iniciales → ±9,3 puntos; 300 → ±5,4; 1.000 → ±3,0; 3.000 → ±1,7. Es una aproximación: las vistas no son personas independientes.
- **Conteos (compartidos, guardados, seguidores ganados):** intervalo exacto de Poisson al 95%.

| Eventos observados | Valor real compatible |
|---|---|
| 0 | 0 a 3,7 |
| 1 | 0,03 a 5,6 |
| 2 | 0,24 a 7,2 |
| 5 | 1,6 a 11,7 |
| 10 | 4,8 a 18,4 |
| 20 | 12,2 a 30,9 |
| 40 | 28,6 a 54,5 |

Lectura: por debajo de unos 10 eventos, una tasa por alcance no sirve para distinguir un post de otro. Sumá posts del mismo tipo.

### 2.8 Correlación, confusores y estacionalidad (criterio)

- Que dos cosas suban juntas no prueba que una cause la otra. Ejemplos típicos: los posts del martes eran también los de mejor gancho; la semana con más publicaciones fue también la del lanzamiento. Por eso se cambia una variable por vez y se pregunta qué más pasó.
- Día y hora se miran al final y solo si lo demás no explica nada: casi nunca son la causa [Jake ig-audit, 2026].
- Estacionalidad: antes de alarmar por una baja, compará con cuentas parecidas. Competitive Insights muestra el crecimiento de seguidores de hasta 10 cuentas que elige la persona [Vaizle, nov-2025]: si todas frenaron, es la época o la plataforma, no su contenido.

## 3. Lo que dice Instagram (oficial, 2024-2026)

### 3.1 Qué mide exactamente cada número (documentación de Meta)

Referencia de métricas por publicación de Meta, actualizada en junio de 2026 [Meta Media Insights, 2026], salvo donde se indica otra fuente.

| Métrica (nombre en la API) | Qué cuenta, según Meta | Cómo leerla |
|---|---|---|
| Vistas (`views`) | Veces que la publicación se reprodujo o mostró en Instagram (Feed, Reels, Historias). Solo orgánico: lo que pasa en anuncios no suma. Figura "en desarrollo". | No son personas: incluye repeticiones. Sirve para dar escala, no para tasas entre formatos. |
| Alcance (`reach`) | Cuentas únicas que vieron el contenido al menos una vez. Meta aclara que es estimado. | La única medida "por persona": el denominador de las tasas. |
| Interacciones totales (`total_interactions`) | Likes + guardados + comentarios + compartidos, menos likes quitados, guardados quitados y comentarios borrados. | Es neto: puede bajar con el tiempo. No incluye reposts. |
| Compartidos (`shares`) y guardados (`saved`) | Conteos. Los guardados solo los ve el dueño o un colaborador aceptado. | Base del indicador de Recompensa. |
| Reposts (`reposts`) | Reposts menos reposts borrados, en Feed, Reels e Historias. | No es lo mismo que mandar por DM: mostralo aparte. |
| Tiempo promedio (`ig_reels_avg_watch_time`) y total (`ig_reels_video_view_total_time`) | Tiempo promedio de reproducción; el total incluye el tiempo de repeticiones. "En desarrollo". | Retención % = promedio ÷ duración del reel. |
| Salteo (`reels_skip_rate`) | Vistas que se fueron en los primeros 3 s ÷ vistas iniciales (primera vez que el reel arranca en una sesión). Estimado, en desarrollo, solo reels. | Gancho. Puede volver vacío si hubo pocas vistas [Storrito]. |
| Seguidores (`follows`) | Figura en la tabla de métricas por publicación. | Conversión por post. Verificá con `windsor_campos` que venga para cada formato. |
| Totales (`total_views`, `total_likes`, `total_comments`) | Suman pauta y Facebook. Solo con login de Facebook. | Coinciden con la app desde abril de 2026 [Meta blog, abr-2026]. No los dividas por el alcance de Instagram. |
| `crossposted_views` y `facebook_views` | Vistas sumadas de Instagram y Facebook, y vistas en Facebook (API, diciembre de 2025) [SMT, dic-2025]. | Solo para quien cruza reels a Facebook. |

Además: Meta guarda las métricas hasta 2 años [Meta Media Insights, 2026]. A nivel cuenta, la referencia lista `follower_count` como nuevos seguidores por día [Meta Account Insights], y los conectores exponen taps en los botones de contacto del perfil (cómo llegar, llamar, correo) como `profile_links_taps` [CData].

### 3.2 Línea de tiempo de cambios de definición (para detectar cortes)

| Fecha | Cambio | Qué rompe en una comparación | Fuente |
|---|---|---|---|
| may-2024 | Instagram prueba los Trial Reels, que no se muestran a los seguidores | Sus métricas no se comparan con reels normales | [TechCrunch, may-2024] |
| ago-2024 | "Vistas" pasa a ser la métrica principal en reels, vivos, fotos, carruseles e historias; cuentan las repeticiones; alcance, interacciones y tiempo de reproducción cambian de lugar | Vistas de antes y de después no son comparables | [SMT, ago-2024] [Socialsamosa, ago-2024] |
| 21-ene-2025 | API v22: llega `views`; se dan de baja `plays`, `clips_replays_count`, `ig_reels_aggregated_all_plays_count` e `impressions` | Series históricas de impresiones y reproducciones se cortan | [Meta v22, ene-2025] [Meta blog v22, ene-2025] |
| 29-ene-2025 | App: "tasa de visualización" (quiénes pasan los 3 s) y "Vistas en el tiempo" (contra tu promedio en el mismo tramo), separando seguidores y no seguidores | Primer indicador oficial de gancho | [TechCrunch, ene-2025] [Socialsamosa, ene-2025] |
| 21-abr-2025 | Las métricas viejas dejan de responder en todas las versiones | Conectores muestran ceros o vacíos | [Meta v22, ene-2025] |
| ago-2025 | Gráfico de retención por reel; el salteo reemplaza a la tasa de visualización | Salteo = 100% menos la vieja tasa de visualización (aprox.) | [SMT, ago-2025] [Socialsamosa, ago-2025] |
| 3/4-nov-2025 | Competitive Insights: hasta 10 cuentas, crecimiento de seguidores y frecuencia por formato | Nueva vara de comparación con pares | [Vaizle, nov-2025] [Exchange4media, nov-2025] [SMT, nov-2025] |
| 4-dic-2025 | API: salteo de reels, reposts (por publicación y por cuenta), `crossposted_views`, `facebook_views` | Las herramientas recién desde acá traen salteo | [SMT, dic-2025] [Storrito] |
| 18-feb-2026 | API v25: anuncio de "espectadores" para reemplazar el alcance; alcance de páginas, impresiones de video y de historias de Facebook se dan de baja con la v26 | Posible salto de nivel en el alcance | [Meta blog v25, feb-2026] [Meta v25, feb-2026] |
| 22-abr-2026 | API: totales de vistas, likes y comentarios que suman Facebook cruzado y pauta, iguales a la app | Dos familias de números (orgánico y total) | [Meta blog, abr-2026] [Meta IG changelog, 2026] [SMT, abr-2026b] |
| fines de abr-2026 | Insights rediseñado: pestañas de interacción y audiencia, % de compartidos, % de salteo y vistas en el tiempo por publicación; por ahora quedan afuera collabs, Trial Reels y contenido cruzado | Collabs y trials se analizan aparte | [SMT, abr-2026a] [Inro, abr-2026] |
| jun-2026 | Las herramientas pasan a "espectadores" en Facebook (10, 15 o 17 de junio según el proveedor); los totales de Instagram incluyen lo cruzado a Facebook | Corte de serie en Facebook y en totales | [Iconosquare, jun-2026] [Ecorpit, 2026] [Emplifi, jun-2026] [Brandwatch, jun-2026] |

Para Instagram, en lo que se pudo verificar, todavía no hay una lista oficial de métricas afectadas por "espectadores": `reach` sigue en la referencia de junio de 2026 [Meta Media Insights, 2026].

### 3.3 Qué implica para una persona con marca personal

- Instagram mismo empuja a mirar porcentajes y a compararse con uno mismo: "Vistas en el tiempo" compara cada reel con tu promedio en el mismo tramo, y desde abril de 2026 la app muestra % de compartidos y % de salteo por publicación [TechCrunch, ene-2025] [SMT, abr-2026a]. El tablero de Hookia va en la misma dirección.
- Si a alguien "le subieron las vistas" en agosto de 2024 sin cambiar nada, fue la definición. Sus vistas de 2023 no sirven como vara.
- Quien cruza reels a Facebook o pauta puede ver en la app un número más grande que el de la herramienta. Ninguno está mal: miden cosas distintas [Meta blog, abr-2026].
- Los Trial Reels existen desde 2024 como laboratorio con no seguidores; la mecánica (métricas a ~24 h, opción de pasarlo a seguidores) está en el informe base [TechCrunch, may-2024] [Informe base, oct-2026]. Desde abril de 2026 quedan fuera de las métricas nuevas de Insights [SMT, abr-2026a].
- Competitive Insights (noviembre de 2025) deja comparar crecimiento y frecuencia con hasta 10 cuentas parecidas, pero no muestra compartidos, guardados ni clics [Vaizle, nov-2025] [Exchange4media, nov-2025].

## 4. Datos de la industria 2025-2026

| Dato | Valor | Fuente | Fecha | Muestra / mercado | Confianza |
|---|---|---|---|---|---|
| Impresiones en herramientas, para cuentas conectadas después del cambio | Aparecen en 0 | [Metricool Help, 2025] | 2025 | Usuarios de Metricool, global | Media |
| Fecha del reemplazo de impresiones por vistas | Metricool dice "desde abril de 2024"; Meta fecha la baja en la v22 (21-ene-2025) | [Metricool Help, 2025] [Meta v22, ene-2025] | 2025 | Sin muestra | Gana Meta |
| Salteo por API | Exige un mínimo de vistas; reels con poco alcance pueden volver vacíos | [Storrito] | dic-2025 o después | Sin muestra | Baja |
| Reposts por API | Cuentan reposts públicos en el perfil, no historias ni DM | [Storrito] | dic-2025 o después | Sin muestra | Baja |
| Fecha de paso a "espectadores" en Facebook | 10, 15 o 17 de junio de 2026 según el proveedor | [Iconosquare, jun-2026] [Ecorpit, 2026] [Emplifi, jun-2026] | jun-2026 | Clientes de cada proveedor | Media |
| Espectadores contra el alcance anterior | "Hasta 35% menos"; según el mismo proveedor, el alcance viejo incluía cargas en segundo plano del feed | [Ecorpit, 2026] | 2026 | Sin muestra | Baja |
| Espectadores contra el alcance anterior | Puede verse más alto | [Emplifi, jun-2026] | jun-2026 | Clientes de Emplifi | Baja |
| Segmentación de espectadores | Solo total único, sin pagado, orgánico ni viral | [Iconosquare, jun-2026] | jun-2026 | Sin muestra | Media |
| Totales de Instagram con Facebook cruzado | Vistas, reacciones y comentarios totales incluyen lo cruzado | [Brandwatch, jun-2026] | jun-2026 | Clientes de Brandwatch | Media |
| Denominador del "% de compartidos" de la app | Vistas [Digivizer]; impresiones, con el ejemplo 500 ÷ 10.000 = 5% [Sodaspoon]; espectadores [Inro, abr-2026] | Tres blogs | 2025-2026 | Sin muestra | Baja |
| Definición del salteo en blogs | "Quienes pasan de largo en los primeros 3 s" [Frameos, 2026], contra la oficial sobre vistas iniciales | [Frameos, 2026] [Meta Media Insights, 2026] | 2026 | Sin muestra | Gana Meta |
| Competitive Insights | Hasta 10 cuentas; crecimiento y frecuencia por formato (reels, feed, anuncios); lanzamiento gradual | [Vaizle, nov-2025] [Exchange4media, nov-2025] | nov-2025 | Global, gradual | Media |
| Benchmarks por tamaño y nicho 2025-2026 | Sin actualización verificada en esta ronda | Usar [Informe base, oct-2026] | - | - | - |

**Lectura.** Los números de Instagram están en plena transición de definiciones: vistas que cuentan repeticiones (2024), impresiones eliminadas (2025), totales que mezclan Facebook y pauta (2026) y un alcance que pasa a "espectadores" con otro método (2026). Los proveedores no coinciden ni en las fechas ni en el sentido del salto, y describen el % de compartidos con tres denominadores distintos. Conclusión práctica: comparar a la persona contra sí misma, con una fórmula propia fija, y marcar cada corte de serie. Los benchmarks externos sirven como orden de magnitud y siempre con la fórmula de quien los publicó.

### Qué fórmula conviene para una cuenta chica (criterio basado en las definiciones de Meta)

- **Por seguidores** (interacciones ÷ seguidores): depende de cuántos seguidores tiene y se dispara cuando un reel viaja a no seguidores (una cuenta de 800 seguidores con un reel de 5.000 de alcance). Usala solo para compararte con tablas que usan esa fórmula.
- **Por alcance** (interacciones ÷ alcance): cuentas únicas, igual para todos los formatos. Es la recomendada para comparar posts y semanas de la misma persona [Meta Media Insights, 2026].
- **Por vistas** (interacciones ÷ vistas): da más bajo porque las vistas cuentan repeticiones y, en fotos y carruseles, apariciones en pantalla [SMT, ago-2024]. Usala solo entre reels.

## 5. Lo que enseñan los que más saben

> En esta ronda solo se pudieron verificar los marcos de creadores disponibles en el repositorio (las skills abiertas de Jake Schincariol). Los marcos de Hormozi, Gadzhi, Cubría y Doglio ya están en el informe base y no se repiten. Quedó pendiente sumar más expertos verificados.

**Jake Schincariol: auditoría contra la mediana propia** [Jake ig-audit, 2026] [Jake ig-viral, 2026]
- Quién es: autor de instagram-agent-skill (licencia MIT), la base de conocimiento que usa Hookia.
- Marco: "la única fuente honesta de lo que funciona para una cuenta es esa cuenta". Mide el múltiplo outlier (vistas ÷ mediana propia), el % de alcance a no seguidores, cuántos siguen a los 3 s, el tiempo promedio, los envíos por alcance y los seguidores por alcance. Ordena por múltiplo y envíos, nunca por vistas. Compara los 5 mejores contra los 5 peores y mira, en este orden: retención a 3 s, fórmula de gancho, formato, duración, tema, si respondió comentarios en la primera hora y, recién al final, día y hora. Para el nicho: más de 3× la mediana es señal y menos de 1,5× es un día normal; la mediana sale de los últimos 12 reels; solo cuentas dentro de unas 10 veces el tamaño propio.
- Frases que conviene usar: "con 30 posts se ve un patrón, con 6 no"; "un reel con vistas y sin seguidores no fracasó: es un problema de perfil".
- Cómo aplicarlo a un experto hispanohablante: el profe o el nutricionista suele tener 20-60 posts y 1.000-10.000 seguidores. Con eso alcanza para ordenar por múltiplo y separar "gancho" de "perfil", no para concluir sobre día y hora.
- Evidencia y crítica: la mediana y el orden por envíos coinciden con lo que pide Instagram (tasas, comparación con el propio promedio) [TechCrunch, ene-2025]. El umbral fijo de 3× no considera la dispersión: con σ = 0,8, el 8,5% de los posts lo pasa por azar (sección 2.3). Complementalo con el z robusto. Su "30 posts" coincide con la tabla 2.2 (con 30 posts, la mediana todavía tiembla un 20-25%).

## 6. Qué está funcionando ahora (2025-2026)

- **Leer por porcentajes y contra uno mismo.** Instagram pasó de mostrar totales a mostrar tasas y comparaciones propias: tasa de visualización y "Vistas en el tiempo" (enero de 2025), salteo y retención por reel (agosto de 2025), % de compartidos y % de salteo en el Insights rediseñado (abril de 2026) [TechCrunch, ene-2025] [SMT, ago-2025] [SMT, abr-2026a].
- **Las herramientas ya pueden traer el gancho.** Desde diciembre de 2025 la API da salteo de reels y reposts; desde abril de 2026, totales iguales a la app [SMT, dic-2025] [Meta blog, abr-2026]. Hookia puede mostrar el indicador de Gancho con datos oficiales, aunque a veces vuelva vacío en reels chicos [Storrito].
- **Comparación con pares, dentro de la app.** Competitive Insights (noviembre de 2025) da una vara de crecimiento y frecuencia contra cuentas elegidas por la persona [Vaizle, nov-2025].
- **Medir personas, no reproducciones.** Meta empuja "espectadores" como medida común entre Facebook e Instagram (2026) [Meta blog v25, feb-2026]. Lo que vale es cuánta gente distinta te vio, no cuántas veces se reprodujo algo.
- **Testear con Trial Reels.** Es la forma más limpia que tiene un creador de probar un gancho con gente nueva sin tocar su perfil [TechCrunch, may-2024] [Informe base, oct-2026]. Diseño recomendado (criterio con las cuentas de la sección 2.6): una sola variable (el arranque), mismo video y tema, métrica elegida antes de publicar (salteo), medido a la misma edad y repetido en 5 o 6 pares.
- **Registrar cada post.** Anotar qué gancho, formato y llamado a la acción tuvo cada publicación es lo que permite auditar después [Jake ig-audit, 2026]. Sin registro, cada conclusión es memoria selectiva.

## 7. Mercado hispano y LATAM

- En esta ronda no se verificaron datos propios de LATAM ni de España (el buscador se agotó antes de llegar a ese bloque). No hay benchmarks hispanos nuevos acá.
- Lo que sí aplica igual en todos los mercados: las definiciones de Meta (vistas, alcance, salteo, totales) son las mismas para todas las cuentas, así que todas las reglas de lectura de este documento valen tal cual [Meta Media Insights, 2026].
- Las cuentas de probabilidad de la sección 2 no dependen del país: dependen de cuántos posts tiene la persona y de su dispersión.
- Las funciones nuevas llegan de a poco: Competitive Insights se lanzó en forma gradual [Vaizle, nov-2025]. Antes de decirle a la persona "mirá tal pantalla", preguntá si la tiene.
- Criterio para los benchmarks del informe base (mayormente paneles globales de marcas): usalos como orden de magnitud y aclaralo ("es un promedio de cuentas de empresas, sobre todo de Estados Unidos y Europa"). Para la comparación fina, usá su propia historia y pares de su idioma y tamaño [Jake ig-viral, 2026].
- Criterio estacional: en el hemisferio sur, diciembre a febrero es verano y época de vacaciones. Si los números bajan ahí, compará con las mismas semanas del año anterior o con sus pares antes de concluir.
- Los nombres de las métricas en la app en español pueden no coincidir con los de la API. Cuando la persona mande una captura, ubicá cada métrica por su definición, no por su nombre.

## 8. Reglas de decisión

- **R1.** Si hay menos de 5 publicaciones maduras (72 h o más) en los últimos 90 días → no des puntaje ni patrones: decí "todavía no hay datos suficientes" y proponé revisar en 3 o 4 semanas. Por qué: con 5 posts, la mediana observada puede caer entre 0,57× y 1,73× de la real solo por azar [Cálculo propio].
- **R2.** Si hay entre 5 y 15 posts maduros → mostrá el puntaje como "preliminar" y no compares subgrupos (formatos, temas). Por qué: con 10 posts, la mediana todavía puede correrse entre 0,69× y 1,48× [Cálculo propio].
- **R3.** Si querés afirmar que un tipo de post rinde mejor y tenés menos de 4 por grupo → presentalo como hipótesis a testear, no como conclusión. Por qué: con 3 contra 3, aun si los 3 ganan, la probabilidad de azar es 10% a dos colas y nunca baja de ahí [Cálculo propio].
- **R4.** Si un post supera 2× la mediana propia → ponelo en "lo que salió bien", pero no digas "encontraste la fórmula" hasta que otro parecido también quede arriba de la mediana. Por qué: con σ = 0,8, uno de cada cinco posts (19%) pasa 2× por azar [Cálculo propio].
- **R5.** Si tenés que decidir si un post es un outlier real → calculá σ = ln(p75 ÷ p25) ÷ 1,349 y marcalo solo si supera mediana × e^(2,5σ) (3,5× con σ 0,5; 7,4× con σ 0,8; 12× con σ 1,0). Por qué: un umbral fijo de 3× marca por azar al menos un post de cada 30 el 93% de las veces cuando σ = 0,8 [Cálculo propio] [Jake ig-viral, 2026].
- **R6.** Si el post siguiente a un viral rinde mucho menos → explicá la regresión a la media, pedí no cambiar todo y compará la mediana de las 4 semanas siguientes con la de las 4 anteriores. Por qué: tras un post de más de 3× la mediana, el siguiente sale más bajo el 93-96% de las veces aunque nada cambie [Cálculo propio].
- **R7.** Si la persona compara una semana con la anterior y publica 3 veces por semana o menos → no concluyas nada de una semana: compará bloques de 4 semanas por mediana. Por qué: sin cambio real, la mediana semanal duplica o cae a la mitad en el 36% de las semanas con σ = 0,8 [Cálculo propio].
- **R8.** Si la persona quiere saber si un cambio le subió las vistas un 20-30% → decile que con su volumen no se puede ver y mirá señales medidas sobre más eventos (salteo, retención). Por qué: detectar +30% con σ = 0,8 pide unos 146 posts por grupo; el doble, unos 21 [Cálculo propio].
- **R9.** Si el promedio de vistas es más del doble de la mediana → reportá la mediana y nombrá el post que infla el promedio. Por qué: 9 posts de 500 vistas y uno de 20.000 dan un promedio de 2.450 y una mediana de 500 [Cálculo propio].
- **R10.** Si una tasa (compartidos, guardados o seguidores por alcance) sale de menos de 10 eventos → no la uses para comparar posts sueltos: sumá posts del mismo tipo. Por qué: con 2 eventos, el valor real compatible va de 0,24 a 7,2 [Cálculo propio].
- **R11.** Si dos reels difieren en menos de 10 puntos de salteo y alguno tiene menos de 300 vistas iniciales → tratalos como empatados. Por qué: con 300 vistas el margen es de ±5,4 puntos por reel y con 100, de ±9,3; el salteo se calcula sobre vistas iniciales [Cálculo propio] [Meta Media Insights, 2026].
- **R12.** Si el salteo viene vacío en reels con pocas vistas → marcá "sin dato" (ni cero ni malo) y usá el tiempo promedio o la retención para el gancho. Por qué: Meta lo marca como estimado y en desarrollo, y la API pide un mínimo de vistas para devolverlo [Meta Media Insights, 2026] [Storrito].
- **R13.** Si el salteo es parecido en los mejores y en los peores reels de la persona → no culpes al gancho: buscá la diferencia en retención, compartidos o tema. Por qué: la auditoría de Jake mira primero si la retención a 3 s separa a los mejores de los peores; si no los separa, la causa está más adelante [Jake ig-audit, 2026].
- **R14.** Si un conector trae impresiones o reproducciones en cero o vacías → ignoralas y usá vistas y alcance. Por qué: Meta las dio de baja en la v22 y desde el 21-abr-2025 no se pueden pedir [Meta v22, ene-2025] [Metricool Help, 2025].
- **R15.** Si comparás vistas de antes y de después de agosto de 2024 → no las compares entre sí: usá alcance o tasas por alcance. Por qué: desde ese mes las vistas cuentan repeticiones y, en fotos y carruseles, cada aparición en pantalla [SMT, ago-2024] [Socialsamosa, ago-2024].
- **R16.** Si la persona compara las vistas de un carrusel con las de un reel → compará alcance e interacciones por alcance. Por qué: una vista de reel es un inicio de reproducción y una de carrusel es una aparición en pantalla [SMT, ago-2024].
- **R17.** Si la persona cruza reels a Facebook o pauta publicaciones → calculá las tasas con `views`, `likes` y `comments` orgánicos de Instagram y sacá los posts pautados de la mediana. Por qué: los totales suman Facebook y pauta, y las métricas orgánicas excluyen anuncios [Meta Media Insights, 2026] [Meta blog, abr-2026].
- **R18.** Si el número de la app no coincide con el de la herramienta → explicá que la app muestra totales (Instagram, Facebook cruzado y pauta) y la herramienta puede traer solo lo orgánico. Por qué: los totales que coinciden con la app llegaron a la API en abril de 2026 y solo con login de Facebook [Meta blog, abr-2026] [Meta Media Insights, 2026].
- **R19.** Si el alcance o los "espectadores" pegan un salto justo en una fecha de cambio de Meta → marcá el corte y compará solo dentro de cada período. Por qué: Meta reemplaza el alcance por espectadores con otro método y los proveedores reportan diferencias hacia arriba y hacia abajo [Meta blog v25, feb-2026] [Emplifi, jun-2026] [Ecorpit, 2026].
- **R20.** Si mostrás la tasa de compartidos → calculala siempre como compartidos ÷ alcance y no la compares con el % que muestra la app. Por qué: Meta no publicó el denominador de la app y los proveedores lo describen de tres formas distintas [Inro, abr-2026] [Sodaspoon] [Digivizer].
- **R21.** Si un post tiene reposts → mostralos aparte de los compartidos y no los sumes a las interacciones. Por qué: un repost es una republicación pública (neta de borrados), distinta del envío por DM, y `total_interactions` no la incluye [Meta Media Insights, 2026] [Storrito].
- **R22.** Si comparás un post nuevo con los anteriores → compará a la misma edad (72 h o 7 días), nunca un post de 2 días contra uno de 30. Por qué: "Vistas en el tiempo", la herramienta de Instagram, compara cada reel con el promedio de la persona en el mismo tramo [TechCrunch, ene-2025].
- **R23.** Si hay Trial Reels, collabs o contenido cruzado → sacalos de la mediana general y analizalos aparte (trial contra trial). Por qué: Instagram los dejó fuera de las métricas nuevas de Insights en abril de 2026, y un trial se muestra solo a no seguidores [SMT, abr-2026a] [TechCrunch, may-2024].
- **R24.** Si la persona quiere probar un gancho → mismo video y mismo tema, cambia solo el arranque, publicado como Trial Reel, con la métrica elegida antes (salteo), medido a la misma edad y repetido en 5 o 6 pares. Por qué: ganar 5 de 5 pares tiene 3,1% de probabilidad de azar (una cola) y ganar 4 de 5, 18,8% [Cálculo propio] [Informe base, oct-2026].
- **R25.** Si un test termina parejo (por ejemplo, 4 o 5 de 6 pares) → no declares ganador: quedate con la versión más simple y testeá otra variable. Por qué: 5 de 6 todavía tiene 10,9% de probabilidad de azar (una cola) [Cálculo propio].
- **R26.** Si la persona pregunta qué día u hora le conviene → dejalo para el final y explicá que con menos de unos 20 posts por franja no se puede ver. Por qué: el día y la hora casi nunca son la causa [Jake ig-audit, 2026], y ver una diferencia del doble con σ = 0,8 pide unos 21 posts por grupo [Cálculo propio].
- **R27.** Si las métricas bajaron → antes de culpar al contenido revisá tres cosas: un cambio de definición en esa fecha, un viral previo que inflaba la base y si las cuentas parecidas también frenaron. Por qué: Competitive Insights muestra el crecimiento y la frecuencia de hasta 10 cuentas elegidas por la persona [Vaizle, nov-2025] [SMT, nov-2025].
- **R28.** Si elegís cuentas para comparar (en Competitive Insights o a mano) → que estén dentro de unas 10 veces el tamaño de la persona y, por criterio, en su idioma. Por qué: el marco de Jake compara solo cuentas de tamaño cercano, porque lo que funciona en una cuenta enorme suele funcionar por su tamaño [Jake ig-viral, 2026].
- **R29.** Si un reel tuvo mucho alcance a no seguidores pero casi no sumó seguidores → tratalo como problema de perfil, no de gancho. Por qué: "un reel con vistas y sin seguidores es un problema de perfil" es la distinción central de la auditoría de Jake [Jake ig-audit, 2026].
- **R30.** Si la persona vende y no sabe qué post le trajo clientes → proponé una palabra clave distinta por post, un link con parámetros de campaña (UTM) por publicación y anotar consultas y ventas por semana. Por qué: la API trae seguidores por post, nuevos seguidores por día y taps en botones de contacto, pero no ventas [Meta Media Insights, 2026] [Meta Account Insights] [CData].
- **R31.** Si una semana con más ventas coincide con más publicaciones → no lo atribuyas a los posts sin preguntar qué más pasó (lanzamiento, mail, pauta, fecha especial). Por qué: una sola semana no separa causas, y una semana sola ya varía al doble o a la mitad por azar [Cálculo propio].
- **R32.** Si `windsor_campos` no trae una métrica (salteo, reposts, totales) → decí que no está disponible en su conexión y no la estimes. Por qué: varias métricas figuran "en desarrollo" y los totales solo existen con login de Facebook [Meta Media Insights, 2026].
- **R33.** Si la persona pide comparar con hace más de 2 años → explicá que Instagram guarda las métricas hasta 2 años y proponé guardar sus datos en Hookia desde ahora. Por qué: así lo dice la documentación de Meta [Meta Media Insights, 2026].

## 9. Mitos y errores comunes

- **"Más vistas es más gente."** Las vistas cuentan repeticiones y, en fotos y carruseles, apariciones en pantalla; la gente distinta es el alcance [SMT, ago-2024] [Meta Media Insights, 2026].
- **"Me bajaron las impresiones a cero: me castigaron."** Es la baja de la métrica en la API desde el 21-abr-2025 [Meta v22, ene-2025] [Metricool Help, 2025].
- **"Después del viral me fue mal: me hicieron shadowban."** Lo esperable tras un pico es volver al nivel normal: pasa el 93-96% de las veces por pura regresión a la media [Cálculo propio].
- **"El promedio dice cómo me va."** Un solo viral puede dejar el promedio en casi 5 veces lo típico; la mediana no se mueve [Cálculo propio].
- **"Si Instagram me avisa que un reel tuvo 20% más vistas que mi promedio, encontré algo."** Instagram usa ese tipo de comparación en sus consejos [TechCrunch, ene-2025], pero por azar 1 de cada 4 reels supera el promedio en un 20% (25-27% según la dispersión) [Cálculo propio]. Sirve para mirar ese reel, no para cambiar la estrategia.
- **"Un post de 3× ya demuestra la fórmula."** En cuentas dispersas, un 3× aparece por azar en casi cualquier tanda de 30 posts [Cálculo propio].
- **"La semana pasada crecí 50%: vamos bien."** Con 3 posts por semana, las semanas saltan al doble o a la mitad sin causa en hasta un tercio de los casos [Cálculo propio].
- **"El % de compartidos de la app y el de mi herramienta tienen que coincidir."** No hay un denominador oficial publicado y cada proveedor usa uno [Inro, abr-2026] [Sodaspoon] [Digivizer].
- **"Repostear y compartir es lo mismo."** Son métricas separadas: el repost es una republicación pública y no entra en las interacciones totales [Meta Media Insights, 2026] [Storrito].
- **"Con 2 posts por versión ya sé cuál gancho gana."** Con 3 contra 3 ni siquiera el mejor resultado posible baja de 10% de azar [Cálculo propio].

## 10. Cómo explicárselo a la persona

- "Tus impresiones no bajaron por algo que hiciste: Instagram dejó de informarlas en abril de 2025 y por eso la herramienta las muestra en cero. Miremos alcance, que es cuánta gente distinta te vio."
- "Este reel te fue 4 veces mejor que lo normal, buenísimo. Antes de decir que encontraste la fórmula, hagamos dos más parecidos: en cuentas como la tuya, un pico así aparece por suerte más seguido de lo que parece."
- "Que el reel de después del viral rindiera menos es lo esperable: después de un pico, lo normal es volver a tu nivel. No es un castigo del algoritmo."
- "No miremos esta semana contra la anterior: con 3 posts por semana, una semana puede salir el doble o la mitad sin que cambie nada. Miremos el último mes contra el anterior."
- "Para saber si el gancho nuevo funciona, probemos bien: mismo video, distinto arranque, como reel de prueba. Si gana 5 de 5 veces, ya no es casualidad."
- "La app y tu herramienta no muestran lo mismo porque la app suma lo que viene de Facebook y de la pauta. Para comparar tus posts usamos solo lo orgánico de Instagram."
- "Con 2 compartidos todavía no podemos decir que este post se comparte más que otro: con tan pocos, la diferencia puede ser suerte. Juntemos varios del mismo tipo."
- "Este reel lo vio mucha gente nueva pero casi nadie te siguió. Eso no es el video: es el perfil. Arreglemos tu bio y tus fijados antes de tocar los ganchos."
- "El día y la hora son lo último que vamos a mirar: casi nunca son la causa, y con tus publicaciones todavía no alcanza para verlo."

## Fuentes

- [Oficial] Meta v22, ene-2025: Meta for Developers (2025). "Graph API Changelog: Version 22.0". developers.facebook.com. https://developers.facebook.com/docs/graph-api/changelog/version22.0/
- [Oficial] Meta blog v22, ene-2025: Meta for Developers (2025). "Introducing Graph API v22 and Marketing API v22". Meta for Developers Blog. https://developers.facebook.com/blog/post/2025/01/21/introducing-graph-api-v22-and-marketing-api-v22/
- [Oficial] Meta Media Insights, 2026: Meta for Developers (actualizada en jun-2026). "Instagram Media Insights". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/
- [Oficial] Meta Account Insights: Meta for Developers (s/f, consultada oct-2026). "Instagram Account Insights". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights
- [Oficial] Meta blog v25, feb-2026: Meta for Developers (2026). "Introducing Graph API v25.0 and Marketing API v25.0". Meta for Developers Blog. https://developers.facebook.com/blog/post/2026/02/18/introducing-graph-api-v25-and-marketing-api-v25
- [Oficial] Meta v25, feb-2026: Meta for Developers (2026). "Graph API Changelog: Version 25.0". developers.facebook.com. https://developers.facebook.com/docs/graph-api/changelog/version25.0
- [Oficial] Meta blog, abr-2026: Meta for Developers (2026). "Instagram API updates for partnerships, metrics, collaboration and engagement". Meta for Developers Blog. https://developers.facebook.com/blog/post/2026/04/22/instagram-api-updates-for-partnerships-metrics-collaboration-and-engagement/
- [Oficial] Meta IG changelog, 2026: Meta for Developers (2026). "Changelog for Instagram Platform". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/changelog
- [Creador] Jake ig-audit, 2026: Jake Schincariol (2026). "ig-audit" (instagram-agent-skill, licencia MIT). GitHub. https://github.com/Jakeschincariol/instagram-agent-skill
- [Creador] Jake ig-viral, 2026: Jake Schincariol (2026). "ig-viral" (instagram-agent-skill, licencia MIT). GitHub. https://github.com/Jakeschincariol/instagram-agent-skill
- [Estudio] Informe base, oct-2026: Hookia (2026). "Instagram: qué métricas importan de verdad". Repositorio de Hookia. .claude/skills/metricas-que-importan/informe.md
- [Estudio] Cálculo propio: Hookia (2026). "Cuentas exactas y simulaciones de ruido estadístico de este documento (log-normal, Mann-Whitney, prueba de signos, Poisson)". Método y supuestos en la sección 2. Sin URL.
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
- [Prensa] CData: CData Software (s/f). "AccountContactButtonType" (documentación del conector de Instagram). Documentación de proveedor. https://cdn.cdata.com/help/ENN/ado/pg_table-accountcontactbuttontype.htm
