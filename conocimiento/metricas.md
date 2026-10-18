# Investigación: Analista de métricas

> Qué es: la investigación propia del Analista de métricas de Hookia. Fecha de corte: octubre 2026.
> Para qué: que cada conclusión que le des a la persona tenga un respaldo real.

## 0. Cómo usar esta investigación

- Complementa tu informe base [Informe base, oct-2026] sin repetir su pirámide ni umbrales. Suma: qué mide cada número hoy (y cuándo cambió), qué fórmula usa cada benchmark, cuándo un número alcanza para concluir y cómo testear sin engañarse.
- Justificá cada conclusión con un dato de acá o del informe base, en criollo ("según la documentación de Meta..."). Nunca muestres etiquetas entre corchetes.
- Confianza: documentación de Meta [Alta]; prensa especializada que cita anuncios de Instagram [Media]; blogs y ayudas de proveedores [Baja] o [Media]. Si un proveedor contradice a Meta, gana Meta.
- La sección 2 son cuentas de probabilidad propias con supuestos a la vista, no un paper. Decilo así: "es una cuenta de probabilidad, no un estudio".
- Antes de comparar dos períodos, revisá si en el medio cambió una definición (tabla 3.2): un salto el día de un cambio de Meta no es rendimiento.
- Benchmarks externos: nombrá siempre la fórmula y la muestra ("por seguidores, en marcas"). No hay benchmarks por tramo de tamaño para LATAM o España con método claro: decilo y no los inventes.
- Con cuentas chicas, ante la duda, gana esperar: decí qué dato falta y cuándo va a estar.

## 1. Lo esencial: 12 conclusiones

1. **"Vistas" cambió y las "impresiones" desaparecieron.** Desde agosto de 2024 las vistas cuentan repeticiones en reels y apariciones en pantalla en fotos y carruseles [SMT, ago-2024]; impresiones y reproducciones salieron de la API (v22, y en todas las versiones desde el 21-abr-2025), reemplazadas por `views` [Meta v22, ene-2025]. Si una herramienta las muestra en cero, es por eso [Metricool Help, 2025]. [Alta]
2. **Los benchmarks de engagement no se comparan entre sí.** En 2026, la misma plataforma da 0,30% (Rival IQ, por seguidores, marcas), 0,45-0,48% (Socialinsider), 2,19% (creadores nano, HypeAuditor) o 4,2% (Hootsuite): cambia el denominador y la muestra [Quid, 2026] [Socialinsider, 2026] [HypeAuditor, 2025] [Hootsuite, 2026]. [Media]
3. **El salteo oficial se calcula sobre vistas iniciales:** vistas que se fueron en los primeros 3 s ÷ vistas iniciales (primer arranque en una sesión); estimado y "en desarrollo" [Meta Media Insights, 2026]. En agosto de 2025 reemplazó a la "tasa de visualización", que medía lo contrario [SMT, ago-2025]. [Alta]
4. **Hay dos familias de números: orgánico de Instagram y total de todas las superficies.** las métricas base son orgánicas; desde abril de 2026 hay totales con Facebook cruzado y pauta, iguales a la app [Meta Media Insights, 2026] [Meta blog, abr-2026]. Las tasas van orgánico sobre orgánico. [Alta]
5. **El alcance es estimado y Meta anunció que lo reemplazará por "espectadores".** Anunciado el 18-feb-2026 como medida común de Facebook e Instagram [Meta blog v25, feb-2026] [Meta v25, feb-2026]; en Facebook los proveedores ven saltos en los dos sentidos ("hasta 35% menos" o más alto) [Ecorpit, 2026] [Emplifi, jun-2026]; la referencia de Instagram de junio de 2026 todavía trae `reach` (3.3). [Alta el anuncio; Baja el tamaño del salto]
6. **El "% de compartidos" de la app no tiene denominador público.** Ni la ayuda ni la API lo publican y los blogs de proveedores lo describen distinto (sobre espectadores, vistas o impresiones) [Inro, abr-2026]; Mosseri habla de envíos por alcance [SMT, may-2026]. Calculá el tuyo siempre igual: compartidos ÷ alcance. [Baja; la solución es criterio]
7. **Instagram compara cada reel contra el promedio de la persona en el mismo tramo de tiempo** ("Vistas en el tiempo", enero de 2025) [TechCrunch, ene-2025]. Comparamos a igual edad y contra la mediana propia. [Media]
8. **Con 3 posts por semana, la mediana semanal se duplica o cae a la mitad sin causa** en el 36% de las semanas con dispersión moderada (σ = 0,8) [Cálculo propio, 2026]. Las tendencias se leen en bloques de 4 semanas. [Cálculo]
9. **Un pico de 3× la mediana es común por azar en cuentas dispersas:** con σ = 0,8, el 8,5% de los posts lo supera sin razón; en 30 posts, 93% de chances de ver al menos uno [Cálculo propio, 2026]. El umbral depende de la dispersión; la estadística robusta usa mediana ± 2,5 desvíos absolutos medianos, no promedio ± desvíos [Leys et al. 2013]. [Cálculo + Alta]
10. **Después de un pico, lo normal es bajar:** con posts independientes, tras uno de más de 3× la mediana el siguiente sale más bajo el 93-96% de las veces y rinde entre un cuarto y un quinto del pico [Cálculo propio, 2026]. No es castigo del algoritmo: es regresión a la media, que pesa más cuanto más ruidosa la medida [Barnett et al. 2005]. [Cálculo + Alta]
11. **Comparar dos estilos pide muchos posts:** con σ = 0,8, ver que uno duplica las vistas pide ~21 posts por grupo; ver +30%, ~146 [Cálculo propio, 2026]. Con cuentas chicas solo se ven efectos grandes o señales sobre cientos de vistas (salteo). [Cálculo]
12. **Una tasa con pocos eventos es ruido:** con 2 compartidos, el valor real compatible va de 0,24 a 7,2; con 10, de 4,8 a 18,4. Con 100 vistas iniciales, el salteo tiene ±9 puntos de margen [Cálculo propio, 2026]. [Cálculo]

## 2. Fundamentos: lo que dice la ciencia

> Las tablas son estadística básica: cuentas exactas o simulaciones propias (20.000 repeticiones por escenario) con supuestos explícitos [Cálculo propio, 2026]. Decí "cuenta de probabilidad", nunca "un estudio demostró". Los papers (en cada apartado y en 2.9) respaldan el método, no los números de las tablas.

### 2.1 El supuesto de trabajo

- Las vistas de una cuenta no se reparten parejo: muchos posts normales y pocos muy altos (se nota cuando el promedio queda bastante arriba de la mediana). En internet la atención es asimétrica: la mayoría del contenido recibe pocas vistas y unos pocos se llevan casi todo [Szabo & Huberman 2010]. Modelo de trabajo: log-normal (el logaritmo de las vistas forma una campana). Con datos reales casi nunca se puede separar una ley de potencia de una log-normal: en la mayoría de los conjuntos analizados la comparación fue no concluyente [Clauset et al. 2009]. Por eso usamos mediana y logaritmos, que sirven para las dos. Es criterio: sirve para dimensionar el ruido, no para predecir.
- Dispersión: **σ ≈ ln(p75 ÷ p25) ÷ 1,349**, con los cuartiles de vistas (o alcance) de sus posts maduros. Alternativa robusta: σ ≈ 1,4826 × mediana de |ln(vistas) − mediana de ln(vistas)| (1,4826 la iguala al desvío de una campana).

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

Propuesta (criterio): z ≥ 2 es "señal" y z ≥ 2,5 es "outlier real". Un 2× se celebra pero no prueba nada: con σ = 0,8, el 19% de los posts lo pasa por azar. Respaldo: la estadística robusta desaconseja promedio ± 3 desvíos (se dejan arrastrar por los picos que querés detectar) y recomienda mediana ± 2,5 desvíos absolutos medianos; 56 de 127 papers de psicología revisados usaban el corte viejo [Leys et al. 2013]. Nuestro z ≥ 2,5 es esa regla sobre el logaritmo.

### 2.4 Regresión a la media

Con posts independientes, tras uno de más de 3× la mediana, el siguiente sale más bajo el 96% (σ 0,8) o el 93% (σ 1,0) de las veces; la mediana de "siguiente ÷ pico" es 0,24 y 0,21. Si encontró algo de verdad, se ve en la mediana de las semanas siguientes, no en el post siguiente. En epidemiología: hace que la variación natural parezca un cambio real, pesa más con mediciones ruidosas y cuando se sigue solo a casos elegidos por ser extremos ("el post después del viral"); siempre hay que considerarla [Barnett et al. 2005].

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

Chequeo con Mann-Whitney (σ 0,8): 22 por grupo detectan "el doble" el 77% de las veces. La tabla coincide con la cuenta rápida n ≈ 16 σ² ÷ δ², con δ = ln(mejora): σ 0,8 y el doble da 16 × 0,64 ÷ 0,48 ≈ 21 [Cálculo propio, 2026].

Tres lecciones de quienes más testean (Microsoft, Google, LinkedIn: más de 20.000 experimentos por año cada una):
- Potencia y tamaño de muestra se calculan antes de arrancar [Kohavi et al. 2009].
- Mirar el resultado todo el tiempo y cortar cuando "da" infla los falsos positivos muy por encima del 5% prometido [Johari et al. 2017]. Fijá la duración (por ejemplo, 7 días y 6 pares).
- Ley de Twyman: un número que parece muy interesante suele ser un error; revisá datos y definiciones antes de festejar [Kohavi et al. 2020].

Límites exactos, sin suponer distribución:
- **Grupos (Mann-Whitney):** si los 3 posts de A le ganan a los 3 de B, igual hay 1 en 20 de azar (10% a dos colas): 3 contra 3 nunca llega al 5%. 4 contra 4 solo si los 4 ganan a los 4 (2,9%); 5 contra 5, 0,8%.
- **Pares (prueba de signos; misma semana y tema, cambia una sola cosa):** 5 de 5 = 3,1% (una cola); 6 de 6 = 1,6% (una cola) o 3,1% (dos colas); 7 de 8 = 3,5%. En cambio 4 de 5 = 18,8% y 5 de 6 = 10,9%: no alcanzan.

### 2.7 Tasas con pocos eventos

- **Salteo (proporción):** margen ≈ ±1,96 × √(p(1−p)/n). Con 65%: 100 vistas iniciales → ±9,3 puntos; 300 → ±5,4; 1.000 → ±3,0 (aproximado: las vistas no son personas independientes).
- **Conteos (compartidos, guardados, seguidores), Poisson exacto al 95%:** 0 eventos → 0 a 3,7; 1 → 0,03 a 5,6; 2 → 0,24 a 7,2; 5 → 1,6 a 11,7; 10 → 4,8 a 18,4; 20 → 12,2 a 30,9. Debajo de ~10 eventos una tasa no distingue un post de otro: sumá posts del mismo tipo.

### 2.8 Correlación, confusores y estacionalidad (criterio)

- Que dos cosas suban juntas no prueba causa (la semana con más posts fue la del lanzamiento): una variable por vez y preguntar qué más pasó.
- Día y hora se miran al final: casi nunca son la causa [Jake ig-audit, 2026].
- Antes de alarmar por una baja, mirá a los pares: Competitive Insights muestra el crecimiento de hasta 10 cuentas que elige la persona [Vaizle, nov-2025]. Si todas frenaron, es la época o la plataforma.

### 2.9 Azar y éxito: lo que muestran los experimentos

| Paper | Muestra | Hallazgo | Para qué te sirve |
|---|---|---|---|
| [Salganik et al. 2006], Science | 14.341 personas, canciones desconocidas; 8 "mundos" con descargas visibles y uno sin | Ver lo que eligen otros aumentó la desigualdad y la imprevisibilidad. Las mejores rara vez fracasaron, las peores rara vez triunfaron; en el medio, cualquier resultado | Un reel puntual tiene mucho azar |
| [Salganik & Watts 2008], Social Psychology Quarterly | 12.207 personas; popularidad mostrada al revés | No se autocumplió del todo: las mejores recuperaron su lugar a la larga | La calidad se ve en muchos posts |
| [Martin et al. 2016], WWW | Cascadas de Twitter y simulaciones | Con muchos datos de usuario, contenido e historial, los mejores modelos explicaron menos de la mitad de la variación del tamaño; hay un techo de predicción | Nadie (ni Hookia) puede prometer qué post explota |
| [Goel et al. 2016], Management Science | Mil millones de eventos de difusión en Twitter | La popularidad depende sobre todo de la mayor "transmisión" (una cuenta o superficie grande), no de cadenas largas | Un pico suele ser un empujón grande puntual, difícil de repetir |
| [Szabo & Huberman 2010], Communications of the ACM | Digg (60 millones de votos) y 7.146 videos de YouTube | Los números tempranos predicen los finales: Digg, 2 horas para 30 días; YouTube, unos 10 días | Comparar a igual edad sirve, pero el video madura lento |

Lectura: el éxito de un post es en buena parte impredecible, la calidad aparece en el agregado y la historia propia es la mejor vara (como "Vistas en el tiempo" y la auditoría de Jake).

## 3. Lo que dice Instagram (oficial, 2024-2026)

### 3.1 Qué mide cada número (referencia de Meta, actualizada en junio de 2026)

Fuente: [Meta Media Insights, 2026], salvo donde se indica otra.

| Métrica (API) | Qué cuenta, según Meta | Cómo leerla |
|---|---|---|
| `views` | Veces que se reprodujo o mostró (Feed, Reels, Historias). Orgánico, "en desarrollo". | Escala, no personas. |
| `reach` | Cuentas únicas que lo vieron al menos una vez. Estimado. | Denominador de las tasas. |
| `total_interactions` | Likes + guardados + comentarios + compartidos, menos los quitados y comentarios borrados. | Neto (puede bajar). No incluye reposts. |
| `shares`, `saved` | Conteos; los guardados solo los ve el dueño o un colaborador aceptado. | Base de Recompensa. |
| `reposts` | Reposts menos reposts borrados (Feed, Reels, Historias). | No es enviar por DM: va aparte. |
| `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time` | Tiempo promedio de reproducción; el total suma repeticiones. "En desarrollo". | Retención % = promedio ÷ duración. |
| `reels_skip_rate` | Vistas que saltearon en 3 s ÷ vistas iniciales. Estimado, en desarrollo, solo reels. | Gancho. Puede volver vacío con pocas vistas [Storrito, consultado 2026]. |
| `follows` | Publicaciones del feed e historias (3.3). | Conversión por post. |
| `total_views`, `total_likes`, `total_comments` | Suman pauta y Facebook; solo con login de Facebook. | Iguales a la app (abr-2026) [Meta blog, abr-2026]; no dividir por alcance. |
| `crossposted_views`, `facebook_views` | Vistas Instagram + Facebook, y vistas en Facebook (dic-2025) [SMT, dic-2025]. | Solo si cruza reels a Facebook. |

Meta guarda las métricas hasta 2 años. A nivel cuenta, `follower_count` son los nuevos seguidores por día [Meta Account Insights, 2026], y los conectores exponen los taps en botones de contacto (cómo llegar, llamar, correo) como `profile_links_taps` [CData, consultado 2026].

### 3.2 Línea de tiempo de cambios (para detectar cortes de serie)

| Fecha | Cambio | Qué rompe | Fuente |
|---|---|---|---|
| may-2024 | Prueba de Trial Reels (solo a no seguidores) | No se comparan con reels normales | [TechCrunch, may-2024] |
| ago-2024 | "Vistas" pasa a métrica principal y cuenta repeticiones | Vistas de antes y después | [SMT, ago-2024] |
| 10-dic-2024 | Trial Reels para todas las cuentas profesionales (3.3) | Trials aparte de la mediana | [IG Creators trial, 2024] [TechCrunch, dic-2024] |
| 21-ene-2025 | API v22: llega `views`; baja `plays`, repeticiones e `impressions` | Series de impresiones | [Meta v22, ene-2025] [Meta blog v22, ene-2025] |
| 29-ene-2025 | App: tasa de visualización (3 s) y "Vistas en el tiempo" | Primer indicador oficial de gancho | [TechCrunch, ene-2025] |
| 21-abr-2025 | Baja de las métricas viejas en todas las versiones | Ceros o vacíos en conectores | [Meta v22, ene-2025] |
| ago-2025 | Gráfico de retención por reel; salteo reemplaza a tasa de visualización | Salteo ≈ 100% − la vieja tasa | [SMT, ago-2025] |
| nov-2025 | Competitive Insights: hasta 10 cuentas pares | Vara con pares | [Vaizle, nov-2025] [SMT, nov-2025] |
| 4-dic-2025 | API: salteo, reposts, vistas cruzadas y de Facebook | Salteo en herramientas desde acá | [SMT, dic-2025] [Storrito, consultado 2026] |
| 18-feb-2026 | API v25: "espectadores" reemplazará al alcance (sobre todo en Facebook) | Posible salto en alcance | [Meta blog v25, feb-2026] [Meta v25, feb-2026] |
| 22-abr-2026 | API: totales con Facebook cruzado y pauta, iguales a la app | Orgánico contra total | [Meta blog, abr-2026] [Meta IG changelog, 2026] [SMT, abr-2026b] |
| fines de abr-2026 | Insights rediseñado: % de compartidos y de salteo; sin collabs, trials ni cruzado | Collabs y trials, aparte | [SMT, abr-2026a] [Inro, abr-2026] |
| jun-2026 | Herramientas pasan a "espectadores" en Facebook (10 a 17 de junio); totales de Instagram con lo cruzado | Corte en Facebook y en totales | [Iconosquare, jun-2026] [Ecorpit, 2026] [Emplifi, jun-2026] [Brandwatch, jun-2026] |

### 3.3 Trial Reels, seguidores por superficie y definiciones de la app

**Trial Reels (mecánica oficial).**
- Lanzados el 10-dic-2024 para cuentas profesionales: el reel se muestra primero solo a no seguidores; los seguidores no lo ven en el feed ni en Reels salvo que alguien se lo mande [IG Creators trial, 2024] [TechCrunch, dic-2024].
- A las ~24 horas el visor muestra vistas, likes, comentarios y compartidos. Opción de compartirlo en automático con los seguidores si rinde bien según las vistas de las primeras 72 horas [IG Creators trial, 2024].
- 2025: Mosseri confirmó acceso para creadores con al menos 1.000 seguidores y cuenta pública [SMT trial, 2025]. Instagram informó (jun-2025) que 40% de quienes los usaron publicaron más y que el alcance de Reels a no seguidores subió 80% (números de la empresa, sin verificación externa) [SMT trial alcance, 2025]. Mar-2026: se pueden programar [SMT, mar-2026].
- Para medir: un trial compite en frío, sin tu comunidad; comparalo solo con otros trials, a las mismas 24-72 horas.

**De dónde vienen los seguidores.** No encontré una vista oficial de seguidores nuevos por superficie (reels, perfil, historias, Explorar). Lo que hay: seguidores por publicación (en reels, cuentas que te siguieron después de verlo, según la ayuda de Instagram) [IG Help reels, 2026]; en la API, `follows` figura para publicaciones del feed e historias [Meta Media Insights, 2026]. Las guías de terceros con "origen" describen el del alcance, no el de los seguidores. Si no viene, no lo estimes.

**Definiciones que confunden en la app.**
- *Interacciones:* likes + guardados + comentarios + compartidos, netos; sin reposts (3.1).
- *% de compartidos:* Meta no publicó el denominador (ni en la ayuda ni en la API). Mosseri siempre habla de "envíos por alcance" y pide mirar tasas para entender el alcance [SMT, may-2026]: Hookia usa compartidos ÷ alcance.
- *Espectadores:* en la ayuda de reels, "espectadores" son cuentas únicas, a diferencia de "vistas", que suman repeticiones [IG Help reels, 2026]. El reemplazo de la v25 apunta a Facebook (junio de 2026) y a una medida común; la referencia de Instagram de junio de 2026 sigue con `reach`, sin campo de espectadores [Meta blog v25, feb-2026] [Meta Media Insights, 2026]. Para Instagram, tratá "espectadores" y "cuentas alcanzadas" como la misma idea (personas únicas) y marcá corte si cambia la fuente.
- *Cuentas chicas:* algunas métricas de cuenta no existen con menos de 100 seguidores, y cuando no hay dato la API devuelve vacío, no cero [Meta IG Insights, 2026].

### 3.4 Qué implica para una persona con marca personal

- Instagram empuja porcentajes y comparación con uno mismo [TechCrunch, ene-2025] [SMT, abr-2026a], como el tablero de Hookia.
- Si cruza a Facebook o pauta, la app muestra más que la herramienta; ninguna está mal [Meta blog, abr-2026].

## 4. Datos de la industria 2025-2026

| Dato | Valor | Fuente | Fecha | Muestra / mercado | Confianza |
|---|---|---|---|---|---|
| Engagement mediano por seguidores, marcas | 0,30% (antes 0,36%: −17%). Likes, comentarios, compartidos y reacciones ÷ seguidores; mediana por industria | [Quid, 2026] [Rival IQ, 2023] | 2026 | 150 empresas al azar por industria; orgánico y potenciado | Media |
| Engagement promedio por seguidores, marcas | 0,48% en 2025 (−24%); 0,45% en el 2.º trim. de 2026. (Likes + comentarios) ÷ seguidores (su guía de métricas suma guardados y compartidos) | [Socialinsider, 2026] | 2025-2026 | 35 millones de posts de 447.613 perfiles de negocio | Media |
| Engagement de reels por seguidores, según tamaño | 0,80% con 1.000 a 5.000 seguidores; 0,40% con 100.000 a 1 millón | [Socialinsider video, 2026] | ene-jun 2026 | 111.000 videos de cuatro redes | Media |
| Engagement por seguidores y de reels, marcas | 0,4% por seguidores; reels 2,7%, casi el doble que carruseles (denominador no aclarado). Vistas de no seguidores: de 30% a 49% | [Dash Social, 2026] [Dash Social TikTok, 2026] [Dash Social medios, 2026] | jul-dic 2025 | 3.363 empresas globales; sin anuncios pagos | Media |
| Engagement promedio, 13 industrias | 4,2%; "más de 4% es fuerte". Sin fórmula explícita; su magnitud es la de las fórmulas por alcance (inferencia) | [Hootsuite, 2026] | 2026 | Clientes de Hootsuite | Baja |
| Engagement por tramo, creadores | Nano (1.000 a 10.000) 2,19%, el tramo más alto; promedio 1,59%. Antes (likes + comentarios) ÷ seguidores; ahora usa vistas si hay suficientes reels recientes | [HypeAuditor, 2025] | 2025 | 76 millones de cuentas | Media |
| Fórmula por alcance de Later | (likes + comentarios + guardados + compartidos) ÷ alcance; en reels, ÷ vistas. Su tabla por tramo (nano 4-8%, micro 2-4%) no cita muestra | [Later, 2026] | 2026 | Sin muestra para la tabla | Baja (tabla) |
| Engagement mediano, entretenimiento en LATAM | ~3,5%; mediana de interacciones: reels 908, carruseles 826 (fórmula no aclarada) | [Emplifi LATAM, 2026] | 2.º trim. 2026 | Perfiles de marca de Emplifi | Baja |

**Lectura.** Entre 0,30% y 4,2% la diferencia es el denominador (seguidores contra alcance o vistas) y la muestra (marcas contra creadores), no el rendimiento. Todos coinciden en que el engagement por seguidores cae con el tamaño de la cuenta y baja año a año. Lo práctico: la persona contra sí misma con una fórmula fija, cada corte marcado, y los benchmarks solo como orden de magnitud, con la fórmula de quien los publicó.

**Qué fórmula conviene para una cuenta chica** (criterio sobre las definiciones de Meta y de cada proveedor):
- *Por seguidores:* se dispara cuando un reel viaja a no seguidores (800 seguidores, 5.000 de alcance). Solo para compararse con tablas que la usan (Rival IQ, Socialinsider, HypeAuditor).
- *Por alcance:* cuentas únicas, igual en todos los formatos; es la fórmula de Later sin el problema de los no seguidores. La recomendada para comparar posts y semanas [Meta Media Insights, 2026] [Later, 2026].
- *Por vistas:* da más bajo y cambia según el formato (repeticiones, apariciones en pantalla) [SMT, ago-2024]. Solo entre reels.
- *Vara externa para menos de 10.000 seguidores:* la de creadores nano (2,19% por seguidores) o la de reels por tamaño (0,80% con 1.000 a 5.000), no la mediana de marcas (0,30%): son cuentas con una persona al frente y el engagement por seguidores sube cuanto más chica es la cuenta [HypeAuditor, 2025] [Socialinsider video, 2026].

## 5. Lo que enseñan los que más saben

> Hormozi, Gadzhi, Cubría y Doglio ya están en el informe base. Acá, analistas con método de medición concreto.

**Jake Schincariol: auditoría contra la mediana propia** [Jake ig-audit, 2026] [Jake ig-viral, 2026]
- Quién: autor de instagram-agent-skill (MIT), la base de conocimiento de Hookia.
- Marco: "la única fuente honesta de lo que funciona para una cuenta es esa cuenta". Mide múltiplo outlier (vistas ÷ mediana propia), alcance a no seguidores, retención a 3 s, envíos y seguidores por alcance; ordena por múltiplo y envíos, nunca por vistas. Compara los 5 mejores con los 5 peores: retención a 3 s, gancho, formato, duración, tema; día y hora al final. En el nicho: más de 3× es señal, mediana de los últimos 12 reels, cuentas de hasta ~10 veces el tamaño propio.
- Aplicación: con 20-60 posts (un profe, un nutricionista) alcanza para ordenar por múltiplo y separar gancho de perfil, no para concluir sobre día y hora.
- Respaldo y crítica: es lo que hace Instagram con "Vistas en el tiempo" [TechCrunch, ene-2025]. El 3× fijo ignora la dispersión (2.3): complementalo con el z robusto.

**Avinash Kaushik: cuatro métricas por publicación** [Kaushik, 2011]
- Quién: analista web (ex Google), blog Occam's Razor. Clásico de 2011.
- Marco: Conversación (comentarios por post), Amplificación (compartidos por post), Aplauso (likes por post) y Valor económico (lo que el canal aporta al negocio). Todo dividido por publicación, nunca en totales. Su advertencia: "no medimos para manipular las métricas, medimos para saber si agregamos valor al negocio".
- Aplicación: calza con los indicadores de Hookia (Recompensa = amplificación; Conversión = valor económico). Hoy conviene dividir por alcance [SMT, may-2026].
- Crítica: es de la era Twitter-Facebook; no tiene gancho ni retención, que hoy son centrales.

**Paddy Galloway: clic + mirada, y estudiar outliers** [Galloway en Creator Science, 2024] [Galloway en Colin and Samir, 2025]
- Quién: estratega de YouTube de canales grandes.
- Marco: el rendimiento se parte en "clic" (empaque: título y miniatura) y "mirada" (retención). Analiza los outliers propios y del nicho, y piensa en tres públicos: núcleo, casual y nuevo. Propone testear muchas ideas (50 en cinco días) en vez de pulir una.
- Aplicación a Instagram: "clic" = salteo en los 3 s; "mirada" = retención; público nuevo = vistas de no seguidores.
- Crítica: es YouTube; los umbrales no se trasladan tal cual.

**Brendan Kane: testear variantes a escala** [Kane, 2020]
- Quién: autor de "One Million Followers" (2018) y "Hook Point" (2020).
- Marco: el gancho tiene que ganarse los siguientes 5 a 10 segundos; se encuentra probando muchas versiones, no adivinando. Dice haber probado 150.000 variantes y sumado un millón de seguidores en menos de un mes (autodeclarado, [Baja]).
- Aplicación: con cuentas chicas el test sirve si cambia una sola cosa y se repite (2.6); Trial Reels es la versión gratuita de su método.

**Eric Ries: métricas de vanidad contra métricas accionables** [Ries, 2011]
- Marco: una métrica sirve si es accionable (muestra causa y efecto), accesible (se entiende) y auditable (se puede rastrear hasta una persona, un evento o un peso concreto). Lo demás es vanidad [secundaria para la redacción exacta].
- Aplicación: seguidores totales y vistas totales son vanidad; "consultas que llegaron por la palabra clave de este reel" es auditable (R28).

## 6. Qué está funcionando ahora (2025-2026)

- **Leer por porcentajes y contra uno mismo:** tasa de visualización y "Vistas en el tiempo" (ene-2025), salteo y retención por reel (ago-2025), % de compartidos y de salteo en Insights (abr-2026) [TechCrunch, ene-2025] [SMT, ago-2025] [SMT, abr-2026a].
- **El gancho llega a las herramientas:** salteo y reposts por API desde diciembre de 2025 [SMT, dic-2025], aunque a veces vuelve vacío en reels chicos [Storrito, consultado 2026].
- **Testear con Trial Reels:** probar un gancho con gente nueva sin tocar el perfil (mecánica en 3.3); desde abril de 2026 quedan fuera de las métricas nuevas de Insights y desde marzo se pueden programar [IG Creators trial, 2024] [SMT, abr-2026a] [SMT, mar-2026]. Diseño en R22.
- **Registrar cada post** (gancho, formato, llamado a la acción): sin registro no hay auditoría, hay memoria selectiva [Jake ig-audit, 2026].

## 7. Mercado hispano y LATAM

- **Dónde pasa la interacción (Comscore, datos de abr-2025):** Instagram concentra más de la mitad de las interacciones medidas en Argentina (más de 57%) y Chile (50,77%); en México lidera Facebook (~28%, Instagram 18,62%) y en Colombia TikTok (26,99%). Los Reels sumaron 33% más interacciones de 2023 a 2024 [IAB Argentina, 2025] [Mobiletime, 2025] [Merca2.0, 2025]. [Media, secundaria]
- **Quiénes son los creadores:** cerca de 80% (79,8%) de los creadores de Instagram en LATAM son nano (1.000 a 10.000 seguidores), con engagement de 1,46% (dato de 2023) [AdLatina, 2025] [secundaria]; por país: Chile 83%, Argentina 82%, Colombia 78% y México 75-76% [BrandMe, 2025]. Tu usuario típico está en el tramo más poblado.
- **Benchmarks:** el único verificado con mercado LATAM es de marcas de entretenimiento (~3,5%, Emplifi, tabla 4). No encontré estudios por tramo de tamaño para LATAM ni España con método claro.
- **España:** en 2025, el 10% de los reels de perfiles con más de 10.000 seguidores fueron promocionados y generaron el 28% de las vistas (IAB Spain y Primetag, ~285.000 perfiles) [PuroMarketing, 2026] [secundaria]: la pauta distorsiona cualquier mediana si no se separa (R16).
- Las definiciones de Meta y las cuentas de la sección 2 valen igual en cualquier país [Meta Media Insights, 2026].
- Criterio: los benchmarks son mayormente de marcas de EE. UU. y Europa; la comparación fina es contra su historia y pares de su idioma y tamaño [Jake ig-viral, 2026].
- Criterio estacional: en el hemisferio sur diciembre a febrero es verano; compará con las mismas semanas del año anterior o con pares.
- En capturas de la app en español, ubicá cada métrica por su definición: los nombres no siempre coinciden con la API.

## 8. Reglas de decisión

- **R1.** Si hay menos de 5 posts maduros (72 h o más) en 90 días → no des puntaje ni patrones; decí que faltan datos y revisá en 3-4 semanas. Por qué: con 5 posts la mediana cae entre 0,57× y 1,73× de la real por azar [Cálculo propio, 2026].
- **R2.** Si hay entre 5 y 15 posts maduros → mostrá el puntaje como "preliminar" y no compares subgrupos (formatos, temas). Por qué: con 10 posts la mediana todavía se corre entre 0,69× y 1,48× [Cálculo propio, 2026].
- **R3.** Si querés afirmar que un tipo de post rinde mejor con menos de 4 posts por grupo → presentalo como hipótesis a testear. Por qué: con 3 contra 3, aun ganando los 3, queda 10% de azar (dos colas) [Cálculo propio, 2026].
- **R4.** Si un post supera 2× la mediana propia → "lo que salió bien", sin "encontraste la fórmula" hasta que otro parecido quede arriba de la mediana. Por qué: con σ = 0,8, el 19% de los posts pasa 2× por azar [Cálculo propio, 2026].
- **R5.** Si tenés que decidir si un post es outlier → calculá σ = ln(p75 ÷ p25) ÷ 1,349 y marcalo solo sobre mediana × e^(2,5σ) (3,5× con σ 0,5; 7,4× con 0,8; 12× con 1,0). Por qué: el 3× fijo marca por azar al menos uno de cada 30 posts el 93% de las veces con σ = 0,8 [Cálculo propio, 2026] [Jake ig-viral, 2026], y el corte robusto recomendado es 2,5 desvíos absolutos medianos [Leys et al. 2013].
- **R6.** Si el post siguiente a un viral rinde mucho menos → explicá la regresión a la media y compará la mediana de las 4 semanas siguientes con las 4 anteriores. Por qué: tras más de 3× la mediana, el siguiente sale más bajo el 93-96% de las veces [Cálculo propio, 2026].
- **R7.** Si compara una semana con la anterior publicando 3 veces por semana o menos → no concluyas; compará bloques de 4 semanas por mediana. Por qué: sin cambio real, la mediana semanal duplica o cae a la mitad el 36% de las semanas (σ 0,8) [Cálculo propio, 2026].
- **R8.** Si quiere saber si un cambio le subió las vistas un 20-30% → con su volumen no se ve: mirá señales con más eventos (salteo, retención). Por qué: +30% pide ~146 posts por grupo y el doble ~21 (σ 0,8) [Cálculo propio, 2026].
- **R9.** Si el promedio de vistas duplica la mediana → reportá la mediana y nombrá el post que lo infla. Por qué: 9 posts de 500 y uno de 20.000 dan promedio 2.450 y mediana 500 [Cálculo propio, 2026].
- **R10.** Si una tasa (compartidos, guardados o seguidores por alcance) sale de menos de 10 eventos → no compares posts sueltos: sumá posts del mismo tipo. Por qué: con 2 eventos el valor real compatible va de 0,24 a 7,2 [Cálculo propio, 2026].
- **R11.** Si dos reels difieren en menos de 10 puntos de salteo y alguno tiene menos de 300 vistas iniciales → tratalos como empatados. Por qué: el salteo se calcula sobre vistas iniciales y con 300 tiene ±5,4 puntos (±9,3 con 100) [Cálculo propio, 2026] [Meta Media Insights, 2026].
- **R12.** Si el salteo viene vacío en reels con pocas vistas → marcá "sin dato" (ni cero ni malo) y usá tiempo promedio o retención. Por qué: es estimado y en desarrollo, y la API pide un mínimo de vistas [Meta Media Insights, 2026] [Storrito, consultado 2026].
- **R13.** Si el salteo es parecido en sus mejores y peores reels → no culpes al gancho: buscá la diferencia en retención, compartidos o tema. Por qué: si la retención a 3 s separa a mejores de peores es el gancho [Jake ig-audit, 2026]; si no, la causa está en otro lado (inferencia).
- **R14.** Si un conector trae impresiones o reproducciones en cero o vacías → ignoralas y usá vistas y alcance. Por qué: baja en todas las versiones desde el 21-abr-2025 [Meta v22, ene-2025] [Metricool Help, 2025].
- **R15.** Si compara vistas de antes y después de agosto de 2024, o vistas de carruseles con vistas de reels → compará alcance o tasas por alcance. Por qué: las vistas cuentan repeticiones y apariciones en pantalla [SMT, ago-2024].
- **R16.** Si cruza reels a Facebook, pauta, o la app no coincide con la herramienta → tasas con métricas orgánicas, pautados fuera de la mediana, y explicá que la app muestra totales (con Facebook y pauta). Por qué: lo orgánico excluye anuncios y los totales iguales a la app llegaron a la API en abril de 2026 [Meta Media Insights, 2026] [Meta blog, abr-2026].
- **R17.** Si el alcance o los "espectadores" saltan justo en una fecha de cambio de Meta → marcá el corte y compará solo dentro de cada período. Por qué: otro método; los proveedores ven saltos en ambos sentidos [Meta blog v25, feb-2026] [Emplifi, jun-2026] [Ecorpit, 2026].
- **R18.** Si mostrás la tasa de compartidos → calculala siempre como compartidos ÷ alcance y no la compares con el % de la app. Por qué: Meta no publicó ese denominador, los proveedores lo describen distinto y Mosseri razona en envíos por alcance [Inro, abr-2026] [SMT, may-2026].
- **R19.** Si un post tiene reposts → mostralos aparte de los compartidos y fuera de las interacciones. Por qué: `total_interactions` no incluye reposts [Meta Media Insights, 2026] [Storrito, consultado 2026].
- **R20.** Si comparás un post nuevo con los anteriores → hacelo a la misma edad (72 h o 7 días). Por qué: así compara "Vistas en el tiempo" [TechCrunch, ene-2025].
- **R21.** Si hay Trial Reels, collabs o contenido cruzado → sacalos de la mediana general y analizalos aparte (trial contra trial). Por qué: quedaron fuera de las métricas nuevas (abr-2026) y un trial solo llega a no seguidores [SMT, abr-2026a] [TechCrunch, may-2024].
- **R22.** Si quiere probar un gancho → mismo video y tema, cambia solo el arranque, como Trial Reel, métrica elegida antes (salteo), misma edad, 5 o 6 pares. Por qué: ganar 5 de 5 pares es 3,1% de azar y 4 de 5, 18,8% (una cola) [Cálculo propio, 2026] [Informe base, oct-2026].
- **R23.** Si un test termina parejo (4 o 5 de 6 pares) → no declares ganador: quedate con la versión más simple y testeá otra variable. Por qué: 5 de 6 todavía es 10,9% de azar [Cálculo propio, 2026].
- **R24.** Si pregunta qué día u hora le conviene → dejalo para el final. Por qué: casi nunca es la causa [Jake ig-audit, 2026] y ver el doble pide ~21 posts por grupo [Cálculo propio, 2026].
- **R25.** Si las métricas bajaron → antes de culpar al contenido revisá cambios de definición, un viral previo que inflaba la base, los pares y la caída general. Por qué: Competitive Insights muestra hasta 10 pares [Vaizle, nov-2025] [SMT, nov-2025] y el engagement por seguidores bajó 17-24% interanual en 2026 [Quid, 2026] [Socialinsider, 2026].
- **R26.** Si elegís cuentas para comparar → dentro de ~10 veces su tamaño y, por criterio, de su idioma. Por qué: en una cuenta enorme las cosas funcionan por su tamaño [Jake ig-viral, 2026].
- **R27.** Si un reel tuvo mucho alcance a no seguidores y casi no sumó seguidores → tratalo como problema de perfil, no de gancho. Por qué: distinción central de la auditoría de Jake [Jake ig-audit, 2026].
- **R28.** Si vende y no sabe qué post le trajo clientes → palabra clave distinta por post, link con parámetros UTM por publicación y registro semanal de consultas y ventas. Por qué: la API trae seguidores por post y por día y taps de contacto, no ventas [Meta Media Insights, 2026] [Meta Account Insights, 2026] [CData, consultado 2026].
- **R29.** Si una semana con más ventas coincide con más posts → preguntá qué más pasó (lanzamiento, mail, pauta, fecha especial) antes de atribuirlo. Por qué: una semana ya varía al doble o a la mitad por azar [Cálculo propio, 2026].
- **R30.** Si `windsor_campos` no trae una métrica (salteo, reposts, totales) → decí que no está en su conexión y no la estimes. Por qué: varias están "en desarrollo" y los totales piden login de Facebook [Meta Media Insights, 2026].
- **R31.** Si pide comparar con hace más de 2 años → Instagram guarda hasta 2 años: proponé guardarlas en Hookia. Por qué: documentación de Meta [Meta Media Insights, 2026].
- **R32.** Si la persona compara su engagement con "el promedio de Instagram" → fijá primero la fórmula: por seguidores, marcas 0,30-0,48% y creadores nano 2,19%; por alcance o vistas, 2-4% o más; nunca cruces fórmulas. Por qué: da de 0,30% a 4,2% según denominador y muestra [Quid, 2026] [Socialinsider, 2026] [HypeAuditor, 2025] [Hootsuite, 2026].
- **R33.** Si la cuenta tiene menos de 10.000 seguidores y pide una vara externa → usá creadores nano (2,19% por seguidores) o reels por tamaño (0,80% con 1.000 a 5.000) aclarando que son datos globales. Por qué: el engagement por seguidores cae con el tamaño y no hay tablas hispanas por tramo [HypeAuditor, 2025] [Socialinsider video, 2026].
- **R34.** Si otra herramienta le da un engagement muy distinto al de Hookia → explicá qué denominador usa cada una. Por qué: HypeAuditor pasó de seguidores a vistas y Later divide por alcance (en reels, por vistas) [HypeAuditor, 2025] [Later, 2026].
- **R35.** Si un post salta muy por encima de todo lo anterior → revisá pauta, collab, cruce a Facebook y definiciones antes de festejar. Por qué: un número llamativo suele ser un error (Twyman) [Kohavi et al. 2020] y en España 10% de reels promocionados juntó 28% de las vistas [PuroMarketing, 2026].
- **R36.** Si arma un test y quiere mirarlo cada hora para decidir → fijá antes duración y pares, y no cortes antes. Por qué: espiar y cortar cuando "da" infla los falsos positivos muy por encima del 5% [Johari et al. 2017].
- **R37.** Si quiere sentenciar un reel en sus primeras horas → esperá 72 horas o comparalo con sus reels a la misma edad. Por qué: en video los números tempranos tardaron unos 10 días en predecir los finales [Szabo & Huberman 2010] y el 70% de las vistas llega en 3 días [Informe base, oct-2026].
- **R38.** Si recomendás Trial Reels → confirmá 1.000 seguidores y cuenta pública, leelo a las 24-72 h contra otros trials y activá el compartido automático solo con un gancho probado. Por qué: requisito confirmado por Mosseri; métricas a las ~24 h y compartido automático según vistas de 72 h [SMT trial, 2025] [IG Creators trial, 2024].
- **R39.** Si pregunta qué superficie (reels, historias, perfil, Explorar) le trae seguidores → mostrá seguidores por publicación y decí que Instagram no da ese desglose. Por qué: la API da `follows` en feed e historias, sin superficie [Meta Media Insights, 2026] [IG Help reels, 2026].
- **R40.** Si la cuenta tiene menos de 100 seguidores y faltan métricas de cuenta → explicá que es un límite de Instagram, no un cero ni un error. Por qué: bajo ese umbral algunas no existen y la API devuelve vacío [Meta IG Insights, 2026].
- **R41.** Si celebra un viral como "la fórmula" → pedí 2 o 3 repeticiones del mismo ángulo antes de cambiar la estrategia. Por qué: fuera de las mejores y peores piezas cualquier resultado es posible y los modelos explican menos de la mitad del tamaño de una cascada [Salganik et al. 2006] [Martin et al. 2016].
- **R42.** Si armás el resumen del mes → reportá comentarios, compartidos y likes por alcance más una métrica de negocio auditable (consultas, ventas), nunca totales sueltos. Por qué: lo útil es por unidad y rastreable; lo demás es vanidad [Kaushik, 2011] [Ries, 2011].

## 9. Mitos y errores comunes

- **"Más vistas es más gente."** Las vistas cuentan repeticiones; la gente distinta es el alcance [SMT, ago-2024].
- **"Después del viral me hicieron shadowban."** Volver al nivel normal tras un pico pasa el 93-96% de las veces por regresión a la media [Cálculo propio, 2026].
- **"Si Instagram me avisa que un reel tuvo 20% más vistas que mi promedio, encontré algo."** Instagram usa esa comparación [TechCrunch, ene-2025], pero 1 de cada 4 reels la supera por azar (25-27% según la dispersión) [Cálculo propio, 2026].
- **"La semana pasada crecí 50%: vamos bien."** Con 3 posts por semana, hasta un tercio de las semanas salta al doble o a la mitad sin causa [Cálculo propio, 2026].
- **"El % de compartidos de la app tiene que coincidir con el de mi herramienta."** No hay denominador oficial publicado y cada proveedor lo describe distinto [Inro, abr-2026].
- **"Mi engagement de 1% es malísimo, el promedio es 4%."** Depende de la fórmula: por seguidores, las marcas rondan 0,30-0,48%; el 4% sale de fórmulas por alcance [Quid, 2026] [Hootsuite, 2026].
- **"Con 2 o 3 posts por versión ya sé qué gancho gana."** Con 3 contra 3, ni el mejor resultado posible baja de 10% de azar [Cálculo propio, 2026].

## 10. Cómo explicárselo a la persona

- "Tus impresiones no bajaron por algo que hiciste: Instagram dejó de informarlas en abril de 2025. Miremos alcance, que es cuánta gente distinta te vio."
- "Este reel te fue 4 veces mejor que lo normal, buenísimo. Antes de decir que es la fórmula, hagamos dos más parecidos: en cuentas como la tuya, un pico así sale por suerte más seguido de lo que parece."
- "Que el reel de después del viral rindiera menos es lo esperable: después de un pico, lo normal es volver a tu nivel. No es un castigo."
- "Para saber si el gancho nuevo funciona, probemos bien: mismo video, distinto arranque, como reel de prueba. Si gana 5 de 5 veces, ya no es casualidad."
- "Tu 1,2% no es malo: ese número sale de dividir por seguidores, y con esa cuenta las marcas andan en 0,3-0,5% y los creadores chicos cerca de 2%. Comparémonos con vos misma mes a mes."
- "No mires el test cada hora: si cortás cuando te conviene, casi siempre vas a 'ver' un ganador que no existe. Lo dejamos 7 días y después decidimos."
- "Este reel lo vio mucha gente nueva y casi nadie te siguió. No es el video, es el perfil: arreglemos bio y fijados antes de tocar los ganchos."

## Fuentes

- [Oficial] Meta v22, ene-2025: Meta for Developers (2025). "Graph API Changelog: Version 22.0". developers.facebook.com. https://developers.facebook.com/docs/graph-api/changelog/version22.0/
- [Oficial] Meta blog v22, ene-2025: Meta for Developers (2025). "Introducing Graph API v22 and Marketing API v22". Meta for Developers Blog. https://developers.facebook.com/blog/post/2025/01/21/introducing-graph-api-v22-and-marketing-api-v22/
- [Oficial] Meta Media Insights, 2026: Meta for Developers (actualizada en jun-2026). "Instagram Media Insights". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/
- [Oficial] Meta Account Insights, 2026: Meta for Developers (s/f, consultada oct-2026). "Instagram Account Insights". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/api-reference/instagram-user/insights
- [Oficial] Meta blog v25, feb-2026: Meta for Developers (2026). "Introducing Graph API v25.0 and Marketing API v25.0". Meta for Developers Blog. https://developers.facebook.com/blog/post/2026/02/18/introducing-graph-api-v25-and-marketing-api-v25
- [Oficial] Meta v25, feb-2026: Meta for Developers (2026). "Graph API Changelog: Version 25.0". developers.facebook.com. https://developers.facebook.com/docs/graph-api/changelog/version25.0
- [Oficial] Meta blog, abr-2026: Meta for Developers (2026). "Instagram API updates for partnerships, metrics, collaboration and engagement". Meta for Developers Blog. https://developers.facebook.com/blog/post/2026/04/22/instagram-api-updates-for-partnerships-metrics-collaboration-and-engagement/
- [Oficial] Meta IG changelog, 2026: Meta for Developers (2026). "Changelog for Instagram Platform". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/changelog
- [Oficial] IG Creators trial, 2024: Instagram for Creators (2024). "Trial reels: Try content with non-followers first to see what performs best". creators.instagram.com. https://creators.instagram.com/blog/instagram-trial-reels
- [Oficial] IG Help reels, 2026: Instagram Help Center (s/f, consultada en 2026). "View insights on your Instagram reels". help.instagram.com. https://help.instagram.com/202865988324236
- [Oficial] Meta IG Insights, 2026: Meta for Developers (s/f, consultada en 2026). "Instagram Platform: Insights". developers.facebook.com. https://developers.facebook.com/docs/instagram-platform/insights/
- [Paper] Salganik et al. 2006: Salganik, M. J., Dodds, P. S. y Watts, D. J. (2006). "Experimental Study of Inequality and Unpredictability in an Artificial Cultural Market". Science. https://pdodds.w3.uvm.edu/research/papers/years/2006/salganik2006a.pdf
- [Paper] Salganik & Watts 2008: Salganik, M. J. y Watts, D. J. (2008). "Leading the Herd Astray: An Experimental Study of Self-fulfilling Prophecies in an Artificial Cultural Market". Social Psychology Quarterly. https://journals.sagepub.com/doi/10.1177/019027250807100404
- [Paper] Szabo & Huberman 2010: Szabo, G. y Huberman, B. A. (2010). "Predicting the Popularity of Online Content". Communications of the ACM 53(8), 80-89. https://arxiv.org/abs/0811.0405
- [Paper] Clauset et al. 2009: Clauset, A., Shalizi, C. R. y Newman, M. E. J. (2009). "Power-law distributions in empirical data". SIAM Review 51(4), 661-703. https://arxiv.org/abs/0706.1062
- [Paper] Goel et al. 2016: Goel, S., Anderson, A., Hofman, J. y Watts, D. J. (2016). "The Structural Virality of Online Diffusion". Management Science 62(1), 180-196. https://pubsonline.informs.org/doi/10.1287/mnsc.2015.2158
- [Paper] Martin et al. 2016: Martin, T., Hofman, J. M., Sharma, A., Anderson, A. y Watts, D. J. (2016). "Exploring limits to prediction in complex social systems". Actas de WWW 2016. https://arxiv.org/abs/1602.01013
- [Paper] Barnett et al. 2005: Barnett, A. G., van der Pols, J. C. y Dobson, A. J. (2005). "Regression to the mean: what it is and how to deal with it". International Journal of Epidemiology 34(1), 215-220. https://pubmed.ncbi.nlm.nih.gov/15333621/
- [Paper] Leys et al. 2013: Leys, C., Ley, C., Klein, O., Bernard, P. y Licata, L. (2013). "Detecting outliers: Do not use standard deviation around the mean, use absolute deviation around the median". Journal of Experimental Social Psychology 49(4), 764-766. https://doi.org/10.1016/j.jesp.2013.03.013
- [Paper] Kohavi et al. 2009: Kohavi, R., Longbotham, R., Sommerfield, D. y Henne, R. M. (2009). "Controlled experiments on the web: survey and practical guide". Data Mining and Knowledge Discovery 18(1), 140-181. https://doi.org/10.1007/s10618-008-0114-1
- [Paper] Johari et al. 2017: Johari, R., Koomen, P., Pekelis, L. y Walsh, D. (2017). "Peeking at A/B Tests: Why it matters, and what to do about it". Actas de KDD 2017, 1517-1525. https://videolectures.net/videos/kdd2017_walsh_peeking_tests
- [Libro] Kohavi et al. 2020: Kohavi, R., Tang, D. y Xu, Y. (2020). "Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing". Cambridge University Press. https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/twymans-law-and-experimentation-trustworthiness/886425EC1B92BD23A0DC5E6817785190
- [Creador] Jake ig-audit, 2026: Jake Schincariol (2026). "ig-audit" (instagram-agent-skill, MIT). GitHub. https://github.com/Jakeschincariol/instagram-agent-skill
- [Creador] Jake ig-viral, 2026: Jake Schincariol (2026). "ig-viral" (instagram-agent-skill, MIT). GitHub. https://github.com/Jakeschincariol/instagram-agent-skill
- [Creador] Kaushik, 2011: Avinash Kaushik (2011). "Best Social Media Metrics: Conversation, Amplification, Applause, Economic Value". Occam's Razor. https://www.kaushik.net/avinash/best-social-media-metrics-conversation-amplification-applause-economic-value/
- [Creador] Galloway en Creator Science, 2024: Jay Clouse con Paddy Galloway (2024). "Paddy Galloway is the world's most sought-after YouTube strategist". Creator Science. https://podcast.creatorscience.com/paddy-galloway-2/
- [Creador] Galloway en Colin and Samir, 2025: Colin and Samir con Paddy Galloway (2025). "The New Rules of YouTube". The Colin and Samir Show. https://www.colinandsamir.com/resources/the-new-rules-of-youtube-from-paddy-galloway
- [Libro] Kane, 2020: Brendan Kane (2020). "Hook Point: How to Stand Out in a 3-Second World". juliemasters.com. https://juliemasters.com/brendan-kane-finding-your-hook-point-how-to-stand-out-in-a-3-second-world/
- [Libro] Ries, 2011: Eric Ries (2011). "The Lean Startup". productplan.com. https://www.productplan.com/glossary/vanity-metrics
- [Estudio] Informe base, oct-2026: Hookia (2026). "Instagram: qué métricas importan de verdad". Repositorio de Hookia. .claude/skills/metricas-que-importan/informe.md
- [Estudio] Cálculo propio, 2026: Hookia (2026). "Cuentas exactas y simulaciones de ruido estadístico (log-normal, Mann-Whitney, prueba de signos, Poisson)". Método y supuestos en la sección 2. Sin URL.
- [Estudio] Quid, 2026: Quid (ex Rival IQ) (2026). "2026 Social Media Industry Benchmark Report". quid.com. https://www.quid.com/knowledge-hub/resource-library/blog/2026-social-media-industry-benchmark-report
- [Estudio] Rival IQ, 2023: Rival IQ (2023). "2023 Social Media Industry Benchmark Report". rivaliq.com. https://www.rivaliq.com/blog/social-media-industry-benchmark-report-2023/
- [Estudio] Socialinsider, 2026: Socialinsider (2026). "2026 Instagram Organic Engagement Benchmarks". socialinsider.io. https://www.socialinsider.io/social-media-benchmarks/instagram
- [Estudio] Socialinsider video, 2026: Socialinsider (2026). "Social Media Video Statistics 2026: Engagement & Views". socialinsider.io. https://www.socialinsider.io/social-media-benchmarks/social-media-video-statistics
- [Estudio] Dash Social, 2026: Dash Social (2026). "Dash Social Releases 2026 Industry Benchmarks". dashsocial.com. https://www.dashsocial.com/press-release/2026-social-media-benchmarks
- [Estudio] Dash Social TikTok, 2026: Dash Social (2026). "2026 TikTok Benchmarks". dashsocial.com. https://www.dashsocial.com/social-media-benchmarks/tiktok
- [Estudio] Dash Social medios, 2026: Dash Social (2026). "2026 Media and Entertainment Industry Benchmarks". dashsocial.com. https://www.dashsocial.com/social-media-benchmarks/media-industry
- [Estudio] Hootsuite, 2026: Hootsuite (2026). "Average engagement rate benchmarks: 13 industries (2026)". blog.hootsuite.com. https://blog.hootsuite.com/average-engagement-rate/
- [Estudio] HypeAuditor, 2025: HypeAuditor (2025). "The State of Influencer Marketing 2025: Stats and Trends". hypeauditor.com. https://hypeauditor.com/state-of-influencer-marketing-2025/
- [Estudio] Emplifi LATAM, 2026: Emplifi (2026). "Latin America Social Media Benchmarks: Entertainment Q2 2026". emplifi.io. https://emplifi.io/resources/q2-2026-entertainment-latin-america-benchmarks/
- [Prensa] TechCrunch, dic-2024: TechCrunch (2024). "Instagram rolls out 'trial reels' that aren't shown to a creator's followers". techcrunch.com. https://techcrunch.com/2024/12/10/instagram-rolls-out-trial-reels-that-arent-shown-to-a-creators-followers/
- [Prensa] SMT trial, 2025: Social Media Today (2025). "Instagram Trial Reels Are Now Available to More Creators". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-expands-access-trial-reels/752895/
- [Prensa] SMT trial alcance, 2025: Social Media Today (2025). "Instagram Says Trial Reels Have Helped Creators Significantly Increase Reach". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-trial-reels-increase-reach-tests/750121/
- [Prensa] SMT, mar-2026: Social Media Today (2026). "Instagram allows creators to schedule Trial Reels". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-allows-creators-to-schedule-trial-reels/816549/
- [Prensa] SMT, may-2026: Social Media Today (2026). "Instagram engagement rates provide insight into reach". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-engagement-rates-provide-insight-into-reach/821170/
- [Prensa] SMT, ago-2024: Social Media Today (2024). "Instagram Updates Metrics to Focus Creators on Views". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-updates-metrics-to-focus-creators-on-views/723645/
- [Prensa] TechCrunch, may-2024: TechCrunch (2024). "Instagram tests 'trial reels' that don't display to a creator's followers". techcrunch.com. https://techcrunch.com/2024/05/31/instagram-tests-trial-reels-that-dont-display-to-a-creators-followers/
- [Prensa] TechCrunch, ene-2025: TechCrunch (2025). "Instagram gives creators more insight into their reels' performance". techcrunch.com. https://techcrunch.com/2025/01/29/instagram-gives-creators-more-insight-into-their-reels-performance/
- [Prensa] SMT, ago-2025: Social Media Today (2025). "Instagram Adds Retention Metrics for Reels". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-adds-retention-insights-reels/758464/
- [Prensa] SMT, nov-2025: Social Media Today (2025). "Instagram Adds Competitor Insights for Professional Accounts". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-adds-competitor-insights-professional-accounts/804465/
- [Prensa] Vaizle, nov-2025: Vaizle Insights (2025). "Instagram Rolls Out Competitor Insights for Professional Accounts". insights.vaizle.com. https://insights.vaizle.com/news/instagram-rolls-out-competitor-insights-for-professional-accounts
- [Prensa] SMT, dic-2025: Social Media Today (2025). "Meta Announces Updates for the Instagram Marketing API". socialmediatoday.com. https://www.socialmediatoday.com/news/meta-announces-updates-for-the-instagram-marketing-api/807083/
- [Prensa] Storrito, consultado 2026: Storrito (s/f, posterior a dic-2025). "How Instagram's Updated Marketing API Metrics Work". https://storrito.com/resources/how-instagrams-updated-marketing-api-metrics-work/
- [Prensa] SMT, abr-2026a: Social Media Today (2026). "Instagram improves Insights UI, adds new metrics". socialmediatoday.com. https://www.socialmediatoday.com/news/instagram-improves-insights-ui-adds-new-metrics/818504/
- [Prensa] SMT, abr-2026b: Social Media Today (2026). "Meta expands Instagram management APIs". socialmediatoday.com. https://www.socialmediatoday.com/news/meta-expands-instagram-management-apis/818385/
- [Prensa] Inro, abr-2026: Inro (2026). "Instagram Insights Update: What Changed in April 2026". https://www.inro.social/blog/instagram-insights-update
- [Prensa] Metricool Help, 2025: Metricool (2025). "Instagram replaces 'Impressions' with 'Views': What you need to know". https://help.metricool.com/en/article/instagram-replaces-impressions-with-views-what-you-need-to-know-ustr2f
- [Prensa] Iconosquare, jun-2026: Iconosquare (2026). "Facebook Reach Metrics Changes - June 2026". https://support.iconosquare.com/facebook-reach-metrics-changes-june-2026
- [Prensa] Emplifi, jun-2026: Emplifi (2026). "Facebook Metric Deprecation (June 2026)". https://docs.emplifi.io/platform/latest/home/facebook-metric-deprecation-june-2026
- [Prensa] Ecorpit, 2026: Ecorpit (2026). "Meta retires legacy reach metrics on 15 June 2026". https://ecorpit.com/meta-ads-legacy-metrics-media-views-viewers-migration-2026/
- [Prensa] Brandwatch, jun-2026: Brandwatch (2026). "Cross-posted Facebook data in Instagram: total views, reactions and comments (June 2026)" (título según la URL). https://social-media-management-help.brandwatch.com/en/articles/15695131-cross-posted-facebook-data-in-instagram-total-views-reactions-and-comments-june-2026
- [Prensa] CData, consultado 2026: CData Software (s/f). "AccountContactButtonType" (conector de Instagram). https://cdn.cdata.com/help/ENN/ado/pg_table-accountcontactbuttontype.htm
- [Prensa] Later, 2026: Later (2026). "Instagram engagement rate: formula, good benchmarks". https://later.com/blog/instagram-engagement-rate/
- [Prensa] IAB Argentina, 2025: IAB Argentina (2025). "9 de cada 10 argentinos son activos en redes sociales". iabargentina.com.ar. https://www.iabargentina.com.ar/noticia-180.php
- [Prensa] Mobiletime, 2025: Mobile Time Latinoamérica (2025). "Redes sociales en Latam: entre más usuarios, creadores usan más IA". mobiletime.la. https://mobiletime.la/noticias/19/08/2025/redes-sociales-en-latam/
- [Prensa] Merca2.0, 2025: Merca2.0 (2025). "Comscore revela las tendencias de redes sociales 2025". merca20.com. https://www.merca20.com/comscore-revela-las-tendencias-de-redes-sociales-2025-tiktok-influencers-y-el-poder-del-video/
- [Prensa] AdLatina, 2025: Marketers by Adlatina (2025). "Influencer marketing: 22 mil millones de dólares en Instagram en 2025". marketersbyadlatina.com. https://www.marketersbyadlatina.com/articulo/11784_influencer-marketing-22-mil-millones-de-dolares-en-instagram-en-2025
- [Estudio] BrandMe, 2025: BrandMe (2025). "¿Cómo es el Influencer Marketing en Latinoamérica 2025?". brandme.la. https://brandme.la/como-es-el-influencer-marketing-en-latinoamerica-2025/
- [Prensa] PuroMarketing, 2026: PuroMarketing (2026). "Influencers en España: se profesionalizan y el contenido patrocinado crece" (título según la URL). puromarketing.com. https://www.puromarketing.com/125/216733/influencers-espana-profesionalizan-contenido-patrocinado-crece-tiktok-instagram
