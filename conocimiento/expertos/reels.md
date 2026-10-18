# Analista de reels: conocimiento experto

> En qué es experto: leer la curva de retención y el skip rate de un reel de marca personal, cruzarlos con lo que se ve en cada cuadro y decir en qué segundo se fue la gente, por qué y qué grabar distinto mañana.

Esta ficha **suma** a `analisis-reel`, la sección 04 de `metricas-que-importan` e `ig-reel`, sin repetir lo que ya está ahí (señales de Mosseri, Emplifi, TikTok, tabla de skip rate, sonido). Acá va lo que falta para **interpretar** bien esos números.

Etiquetas: **[Oficial]** = Instagram/Meta. **[Estudio]** = estudio de una empresa con muestra declarada. **[Académico]** = paper revisado por pares. **[Experto]** = blog o guía de una herramienta o agencia. **[No verificado]** = circula, pero no encontramos el origen. **[Regla de trabajo]** = umbral nuestro, derivado de las fuentes citadas al lado; no es un número oficial.

Método: buscador web, 18/10/2026. Las páginas de Meta y varios medios no se pudieron abrir directo; sus datos salen de lo que el buscador muestra de ellas. Las fuentes 38 y 39 son de fondo y su link no se pudo abrir.

---

## Lo que sabe que un chat cualquiera no sabe

1. **Skip rate y "retención a 3 s" son la misma cosa vista al revés.** El skip rate es el % de gente que se fue en los primeros 3 segundos [6][3]. Así que retención a 3 s ≈ 100 − skip rate. Con el promedio de Socialinsider (60,5 % a 65,5 % según tamaño, 140.000 reels, ene-jun 2026) [1], **el reel típico retiene a 3 s apenas entre 35 % y 40 %**. Ese número coincide con el rango que las agencias de anuncios llaman "hold rate bueno" a 3 s (30 % a 50 %+) [31]. Ojo: otras agencias llaman "hold rate" a otra cosa (vistas al 100 % ÷ vistas de 3 s) [32]. Antes de comparar un número de afuera, preguntar siempre cómo lo definen. [Estudio] + [Experto]

2. **Los "umbrales sanos" de skip rate que circulan están mal calibrados.** Babbleboxx e Inro dicen que un skip rate sano es menos de 30-40 % y que más de 50 % es un gancho que no funciona [3][4]. Pero el promedio medido sobre 140.000 reels reales es 60-65 % [1]. Si les creyéramos, casi todas las cuentas tendrían el gancho roto. **Gana Socialinsider**, porque es una medición con muestra y método, y las otras son reglas a ojo (Babbleboxx aclara que Instagram no publicó umbrales oficiales [3]). [Regla de trabajo] para el agente: skip rate **menor a 55 %** = mejor que el mercado; **55-68 %** = normal; **más de 70 %** = el gancho está fallando. Siempre priorizar la comparación contra la mediana de la propia cuenta.

3. **El skip rate no existe para todos los reels.** Cuando Instagram sumó skip rate y share rate al nuevo panel, no los mostraba para colaboraciones (collab posts), trial reels, publicaciones cruzadas desde Facebook ni contenido promocionado [7]. Si la persona no ve el dato, no es que lo esconde: el agente tiene que marcar "no evaluable" y usar el tiempo promedio. [Experto, citando el panel de Instagram, 27/04/2026]

4. **"Vistas" cuenta repeticiones; "alcance" cuenta personas.** Desde el 21/04/2025, Instagram unificó todo en "Vistas" (reemplazó impresiones y reproducciones) y **sacó el contador aparte de repeticiones** [17][18]. En reels, cada vez que el video arranca o vuelve a arrancar suma una vista; los espectadores únicos son el alcance [19]. Consecuencia práctica: **vistas ÷ alcance** es hoy la mejor pista de cuánto se repite un reel. Si da cerca de 1, casi nadie lo volvió a ver; si da claramente más que la mediana de la cuenta, el reel tiene "loop" o un momento que la gente repite [4]. [Oficial vía terceros] + [Regla de trabajo]

5. **El algoritmo mira el tiempo visto en % y en segundos.** Mosseri aclaró que se tienen en cuenta las dos cosas: el porcentaje del video visto (relativo) y los segundos totales (absoluto) [16][15]. Por eso un reel de 60 s con 40 % visto (24 s) puede andar mejor que uno de 15 s con 80 % visto (12 s). El agente **nunca juzga un reel solo por el % visto**: muestra los dos números y compara reels de duración parecida. [Oficial, citado por terceros]

6. **Que Instagram "permita" 3 minutos no quiere decir que convenga.** En enero de 2025 Instagram subió el límite de 90 s a 3 minutos y dijo que los reels de hasta 3 minutos podían recomendarse a no seguidores [11][12][14]. Antes, en un evento con creadores, había mostrado una diapositiva que decía que pasarse de 90 s podía bajar el alcance [13]. Las dos cosas se reconcilian así: **ser elegible no es rendir**. Los datos de Socialinsider muestran que el alcance cae arriba de 90 s y que el engagement es más alto entre 45 y 60 s y se desploma después de 180 s [2]. Para marca personal: el reel dura lo que dura la idea; si pasa de 90 s, tiene que justificarlo con retención. [Oficial] + [Estudio]

7. **Los primeros 3 segundos son la mitad del partido, y después la gente se va más despacio.** Meta, con Nielsen, encontró que hasta el 47 % del valor de una campaña de video ocurre en los primeros 3 s y hasta el 74 % en los primeros 10 s; además, el 65 % de los que miran 3 s llega a 10 s y el 45 % llega a 30 s [26]. Es un dato viejo (época del feed de Facebook, ~2016) y de anuncios, pero dice algo útil sobre **la forma de la curva**: la caída más brutal está al principio y después se aplana. Si en un reel la curva cae más fuerte en el medio que al principio, ahí hay un problema de contenido, no de gancho. Ojo con una confusión que circula: Salesforce (2016) cita "47 %" como el aumento de recuerdo publicitario por ver 3 s [27]. Son dos números distintos que se mezclan seguido; el agente usa la versión de Meta. [Oficial, viejo]

8. **La prueba muda de Meta sirve para cualquier reel.** El método de Meta para evaluar creatividades era mirar los primeros 10 s sin sonido (como en el feed) y después 30 s con sonido, y cruzarlo con recuerdo de marca [26][28]. Aunque hoy la mayoría mira Reels con sonido, el chequeo sigue sirviendo: **si silenciado, en los primeros 3 s no se entiende de qué va, el gancho depende de una sola vía**. Un dato que circula, "41 % de los videos no tienen sentido sin sonido", aparece atribuido a un estudio citado por Facebook, pero no encontramos el original [28]. [Oficial] + [No verificado]

9. **La curiosidad necesita una pista, no un misterio total.** Loewenstein (1994) explica la curiosidad como la incomodidad de notar un hueco en lo que sabemos; ese hueco solo duele si ya sabemos algo del tema, y la curiosidad suele desinflarse (y hasta decepcionar) apenas se satisface [29][30]. Traducido a reels: el gancho tiene que dar **una parte** de la respuesta ("el error que hace que tu dieta falle el día 3"), no esconderlo todo ("no vas a creer esto"). Y si el remate llega en el segundo 4, el resto del video ya no tiene motor: la gente se va justo después de la respuesta. [Académico]

10. **Copiar no rinde, aunque des crédito.** Desde 2024, Instagram saca de recomendaciones a las cuentas que repostean contenido ajeno 10 veces o más en 30 días, y pone en el repost una etiqueta que lleva al original [20]. En abril de 2026 lo extendió a fotos y carruseles: si lo que publicás es mayormente de otros o sin transformar, no se le muestra a no seguidores [21][22]. Una marca de agua, un recorte chico o nombrar al autor en la descripción **no cuenta como original**; lo que cuenta es comentar, remixar o reinterpretar [21][22]. Para el agente: si el reel es un TikTok re-subido con logo, el problema de alcance puede no tener nada que ver con la retención. [Oficial vía medios] + [Experto]

11. **Las zonas seguras oficiales son más estrictas abajo de lo que dice `ig-reel`.** Meta pide dejar libre de texto, logos y elementos clave alrededor del 14 % de arriba, el 35 % de abajo y el 6 % de cada costado [23][24]. En 1080×1920 eso es: arriba 269 px, abajo 672 px (o sea, nada importante debajo de y≈1248) y 65 px por lado. `ig-reel` usa arriba 230, abajo hasta y=1440 y deja libres 230 px a la derecha. **Cómo se combinan:** Meta habla de anuncios (que suman el botón de compra abajo), así que para un reel orgánico la zona de abajo puede ser un poco más generosa. Regla final del agente: gancho y textos clave entre **y=270 y y=1250**; subtítulos pueden bajar hasta **y=1440**; nada importante en los **230 px de la derecha** (botones). Según Billo, en marzo de 2026 Meta unificó en una sola zona segura 9:16 para Reels e Historias de Facebook e Instagram [25]. [Oficial] + [Experto]

12. **Los trial reels son el laboratorio de ganchos, pero se comparan entre ellos.** Desde diciembre de 2024, un trial reel se muestra primero solo a no seguidores, no aparece en el perfil, sus métricas llegan en unas 24 horas y se puede configurar para que se comparta con todos si anda bien en 72 horas [9][10]. Mosseri dijo, según la cobertura de medios, que casi siempre tienen menos alcance que un reel normal y que hay que comparar trials contra trials [Oficial, citado por terceros; no vimos el video original]. Para el agente: **probar dos ganchos del mismo contenido como trials** y comparar tiempo promedio y compartidos entre ellos, nunca contra los reels normales. [Oficial]

---

## Cómo lee una curva de retención (patrones y qué significan)

Base oficial: el gráfico de Instagram arranca siempre en 100 % y baja; según Instagram, cuanto más plana la línea, más enganchada está la audiencia [8]. Es una curva **agregada** (no por persona). Lo de abajo son patrones de lectura; los umbrales son [Regla de trabajo].

| Patrón | Cómo se ve | Qué significa | Qué mirar en los cuadros |
|---|---|---|---|
| **Precipicio inicial** | Cae a menos de 30-35 % antes del segundo 3 (skip rate arriba de 65-70 %) | El primer cuadro no frena el pulgar o no se entiende de qué va | Cuadros 0 y 1: ¿hay cara, texto, movimiento? ¿Arranca con saludo o silencio? |
| **Escalón del segundo 3 a 6** | Pasa bien el segundo 3 y vuelve a caer fuerte enseguida | El gancho prometió algo y lo que sigue no lo cumple, o el remate se dio demasiado rápido (punto 9) | Cuadros 3-6: ¿se pasó a "contexto", a "les cuento", a un plano quieto? |
| **Escalera** | Caídas chicas y parejas en cada cambio de tema | Cada bloque es una puerta de salida: no hay hilo que una los pasos | Transiciones: ¿cada bloque abre la pregunta del siguiente? |
| **Pendiente suave** | Baja de a poco sin escalones | Sano. Es la forma que predice la curva de Meta (lo peor pasa al principio) [26] | Repetir la estructura |
| **Meseta y precipicio** | Plana un buen rato y de golpe cae | Llegó el remate y se acabó la razón para quedarse, o empezó el llamado a la acción | ¿Qué pasa en ese segundo? Si es el CTA, acortarlo o meterlo antes del remate |
| **Joroba** | La línea sube un poco en un tramo | Gente que vuelve atrás o repite ese momento: es lo más valioso del video | Ese cuadro es candidato a gancho del próximo reel |
| **Cola levantada** | El final no cae y vistas ÷ alcance sale alto | El reel tiene loop: el final empalma con el principio | Confirmar que el último cuadro "conecta" con el primero |
| **Caída al final** | Se cae en los últimos 2-3 s | Placa de cierre, logo, "bueno, eso es todo" | Último cuadro: sacar todo lo que no aporta |

**Tres cálculos que el agente hace siempre (en código, no a ojo):**
- **Retención a 3 s** = 100 − skip rate. Comparar contra la mediana de la cuenta y, de referencia, contra el 35-40 % del mercado [1].
- **Segundos vistos** = tiempo promedio. **% visto** = tiempo promedio ÷ duración. Mostrar los dos (punto 5).
- **Índice de repetición** = vistas ÷ alcance, contra la mediana de la cuenta (punto 4).

**Sobre los benchmarks de % visto:** Quso midió una mediana de ~45 % de visualización en 508.000 Shorts y ~91 % en el 10 % de arriba (ya cargado en la sección 04). Kineclip advierte que los benchmarks publicados varían mucho según duración, nicho y audiencia [34], y el dataset de OpusClip muestra cómo se reparten los clips por duración, no cómo rinden [35]. Por eso: los números de afuera sirven de orientación, el veredicto sale de comparar con la propia cuenta.

---

## Diagnóstico por síntoma (síntoma → causa probable → arreglo)

**1. "Se van en el segundo 1" (skip rate arriba de 70 %).**
- Causas probables: arranca con saludo, nombre o logo; primer cuadro quieto o oscuro; el texto del gancho aparece tarde o está tapado por la interfaz; en silencio no se entiende nada (punto 8).
- Arreglo: empezar por la frase que hoy está en el segundo 6 (lo dice `ig-reel`); texto del gancho visible desde el cuadro 0, entre y=270 y y=1250 (punto 11); cara cerca y en movimiento. Probar dos ganchos como trial reels (punto 12).

**2. "Pasan el gancho pero se van en el 3-6".**
- Causas probables: el gancho es pura intriga sin pista y decepciona; o da la respuesta entera de entrada y ya no hay por qué quedarse (punto 9); el segundo plano es "les cuento un poco de contexto".
- Arreglo: dar media respuesta en el gancho y la otra mitad al final; meter en el segundo 3 "lo que está en juego" (por qué le importa a quien mira); cambiar el plano justo ahí.

**3. "Se van en el medio" (escalón fuerte después del segundo 8).**
- Causas probables: plano quieto largo, explicación con relleno, cambio de tema sin aviso, un ejemplo que no es del público.
- Arreglo: cortar el tramo del escalón (mirar ese cuadro exacto), un cambio visible cada pocos segundos, cada bloque termina abriendo la pregunta del siguiente.

**4. "Bajada pareja, pero el reel es largo y el tiempo promedio es bajo en segundos".**
- Causa probable: el reel dura más que la idea. Encima, pasar de 90 s suele bajar alcance aunque sea elegible [2][13].
- Arreglo: recortar a 30-60 s y repetir. Si el tema necesita más, partirlo en dos reels.

**5. "Lo miran casi entero pero no siguen ni comparten".**
- Causas probables: el remate decepciona (la curiosidad se desinfla al resolverse [29]); no hay nada que "le sirva a un amigo"; el cierre pide tres cosas.
- Arreglo: que el remate supere lo prometido (un dato propio, un caso real, una plantilla); un solo pedido al final; frase pensada para mandar ("mandáselo al que siempre…"). Recordar que los envíos pesan con no seguidores (ya en `analisis-reel`).

**6. "Buena retención pero poco alcance a no seguidores".**
- Causas probables: contenido no original o con marca de agua (punto 10); reel de más de 3 minutos, que no se recomienda [12]; collab o cruzado, donde además faltan métricas (punto 3).
- Arreglo: re-subir el archivo limpio, grabado y editado por la persona; transformar de verdad lo que se toma de otros (opinar, mostrar el caso propio).

**7. "Vistas altas, alcance bajo".**
- Causa probable: pocos lo miran muchas veces (punto 4). Bueno si es loop; malo si es un grupo chico de seguidores fieles.
- Arreglo: mirar el alcance a no seguidores; si es bajo, el problema es la puerta de entrada (portada y gancho), no el contenido.

**8. "Trial reel con números bajos".**
- Causa probable: es normal; los trials casi siempre tienen menos alcance.
- Arreglo: compararlo solo contra otros trials (punto 12).

---

## Checklist cuadro por cuadro

Complementa los 8 criterios de `analisis-reel` (C1-C8). Acá van chequeos nuevos o más finos. Si algo no se puede ver en los cuadros, se marca "no evaluable".

**Cuadro 0 (el que decide el skip rate)**
- [ ] ¿Se entiende de qué va **en silencio**? (prueba muda de Meta [26])
- [ ] ¿El texto del gancho está entre y=270 y y=1250, y lejos de los 230 px de la derecha? (punto 11)
- [ ] ¿Da una pista concreta (un número, un error, un resultado) y no solo intriga? (punto 9)
- [ ] ¿Se ve una marca de agua, un logo de otra app o un recorte de otro video? (punto 10)

**Cuadros 1 a 3 (el gancho)**
- [ ] ¿Hay al menos un cambio visible (acercamiento, texto nuevo, corte) entre el 0 y el 3?
- [ ] ¿La voz y el texto dicen lo mismo con palabras distintas, o el texto repite palabra por palabra lo que se dice? (lo segundo desperdicia una vía)
- [ ] ¿Ya se dijo la respuesta completa? Si sí, esperar un escalón en el 3-6.

**Cuadros 3 a 6 (la promesa)**
- [ ] ¿Aparece "lo que está en juego" para quien mira?
- [ ] ¿Hay un plano de "contexto" o presentación? Marcarlo como candidato a cortar.

**Cuadro del segundo donde se fue el espectador promedio**
- [ ] ¿Qué cambió (o qué no cambió) justo ahí? Plano quieto, pausa, tema nuevo, remate entregado, CTA.

**Cuadros del medio**
- [ ] ¿El ejemplo es del público de la persona (pacientes, clientes, alumnos) o genérico?
- [ ] ¿Cada bloque deja una pregunta abierta para el siguiente?

**Últimos 3 cuadros**
- [ ] ¿El remate está **antes** del cierre o se esconde detrás de una placa?
- [ ] ¿Hay un solo pedido?
- [ ] ¿El último cuadro empalma con el primero (posible loop)? Cruzar con vistas ÷ alcance.

**Ficha técnica (sin cuadros)**
- [ ] Duración: ¿más de 90 s? ¿más de 3 min? (punto 6)
- [ ] ¿Es collab, trial, cruzado o promocionado? Entonces el skip rate puede faltar (punto 3).

---

## Errores comunes que detecta

1. **Comparar el skip rate contra "lo sano es 30 %".** Ese número no sale de mediciones (punto 2). El agente compara contra la mediana de la cuenta y, de referencia, contra el 60-65 % de Socialinsider [1].
2. **Mirar solo el % visto.** Castiga a los reels largos y premia a los de 7 s. Siempre % y segundos (punto 5).
3. **Contar vistas como personas.** Las vistas incluyen repeticiones desde abril de 2025 [17][19].
4. **Gancho de intriga vacía** ("esto te va a volar la cabeza"). Sin pista no hay curiosidad (punto 9).
5. **Gancho que entrega todo.** El remate en el segundo 3 deja el resto sin motor.
6. **Texto clave abajo o pegado a la derecha.** Lo tapan la descripción y los botones (punto 11).
7. **Re-subir un TikTok con logo o un video ajeno con crédito.** No cuenta como original (punto 10).
8. **Usar los 3 minutos porque se puede** (punto 6).
9. **Juzgar un trial reel contra los reels normales** (punto 12).
10. **Mezclar definiciones de "hold rate"** [31][32].
11. **Creer el rumor de reels de 20 minutos o "memos" de Mosseri sin fuente** [37]. [No verificado]

---

## Ejemplos aplicados (2-3 reels de marca personal o negocio chico)

> **Los tres casos son ilustrativos:** los números están inventados para mostrar el razonamiento, no son datos reales de ninguna cuenta.

**Ejemplo 1. Nutricionista, reel de 38 s: "3 desayunos que te dejan con hambre".**
- Datos: skip rate 72 %; tiempo promedio 6 s (16 % visto); vistas ÷ alcance 1,05; mediana de la cuenta: skip rate 61 %.
- Cuadros: en el 0 está ella en la cocina diciendo "¡Hola! Hoy les quiero contar…"; el texto aparece recién en el 2 y está en el tercio de abajo.
- Diagnóstico: precipicio inicial. El skip rate está 11 puntos peor que la mediana de su cuenta y arriba del umbral de 70 %. En silencio, el cuadro 0 no dice nada, y el texto queda tapado por la descripción.
- Para el próximo: arrancar con el plato en mano y el texto "Este desayuno te da hambre a las 10" en el cuadro 0, a la altura del pecho (y≈900). Dar la pista en el gancho ("le falta proteína") y dejar el arreglo para el final. Probar este gancho y uno alternativo como dos trial reels.

**Ejemplo 2. Abogado laboralista, reel de 75 s: "Te despidieron: qué no firmar".**
- Datos: skip rate 54 % (mejor que su mediana de 63 %); curva con meseta hasta el 9 y escalón de 25 puntos entre el 10 y el 14; tiempo promedio 19 s.
- Cuadros: del 10 al 14 es el mismo plano fijo leyendo el artículo de la ley.
- Diagnóstico: el gancho funciona; el problema está en el medio. La lectura de la ley es una puerta de salida.
- Para el próximo: reemplazar la lectura por "lo que dice, en criollo" con un texto en pantalla de 4 palabras y un acercamiento; dejar el número del artículo en la descripción; bajar a 45-60 s, el rango donde el engagement es más alto [2].

**Ejemplo 3. Cafetería de barrio, reel de 12 s: el latte art en cámara lenta.**
- Datos: skip rate 48 %; 92 % visto; vistas ÷ alcance 1,9 (su mediana es 1,2); pocos envíos; casi todo el alcance es de seguidores.
- Diagnóstico: la cola levantada y el índice de repetición dicen que tiene loop. Pero no llega a no seguidores: es el mismo video que la cafetería subió antes a TikTok, con la marca de agua en el último cuadro.
- Para el próximo: exportar el original sin marca de agua (punto 10); sumar una frase que se pueda mandar ("Para el que dice que no le gusta el café"); repetir el formato de loop porque claramente funciona.

---

## Lo nuevo de 2025-2026

- **Enero de 2025:** reels de hasta 3 minutos y elegibles para recomendación (primero en EE. UU., según el blog oficial) [11][12][14]. Mosseri aclara que se mide el tiempo visto en % y en segundos [15][16].
- **Marzo de 2025:** se pueden ver los reels a velocidad 2x [36]. Instagram no aclara cómo cuenta eso en el tiempo promedio. [No verificado]: el agente no saca conclusiones de esto.
- **21 de abril de 2025:** "Vistas" reemplaza a impresiones y reproducciones; desaparece el contador aparte de repeticiones [17][18].
- **Agosto de 2025:** curva de retención segundo a segundo y skip rate en las estadísticas de cada reel; el skip rate reemplaza a la "tasa de visualización" [6][8].
- **Diciembre de 2024 (y todo 2025):** trial reels para cuentas profesionales: prueban con no seguidores primero, métricas en ~24 h, se comparten solos si rinden en 72 h [9][10].
- **Marzo de 2026:** zona segura 9:16 unificada para Reels e Historias en los anuncios de Meta, según Billo [25].
- **Abril de 2026:** rediseño de las estadísticas por pestañas, con skip rate y share rate por publicación (sin datos para collabs, trials, cruzados ni promocionados) [5][7]. Ganan peso el alcance a seguidores y el alcance a no seguidores [7].
- **Abril de 2026:** la regla de contenido no original se extiende de reels a fotos y carruseles; marca de agua o recorte chico no alcanzan para ser "original" [21][22].
- **Junio de 2026:** primer benchmark grande de skip rate (Socialinsider, 140.000 reels): cuanto más grande la cuenta, menos se saltean sus reels [1].
- **Sin confirmar:** que el skip rate sea "el factor número 1" del panel "Qué influye en tus vistas" (lo dice solo Inro [4]); reels de 20 minutos o memos de fin de 2025 [37]. [No verificado]

---

## Fuentes

1. "[What Data Says] Instagram Reels Statistics For 2026". Socialinsider. 24/06/2026. https://www.socialinsider.io/blog/instagram-reels-statistics/
2. "Social Media Video Statistics 2026: Engagement & Views". Socialinsider. 2026. https://www.socialinsider.io/social-media-benchmarks/social-media-video-statistics
3. "Instagram adds Reels retention & skip rate: what influencer marketers should do next". Babbleboxx. 2025. https://www.babbleboxx.com/post/instagram-adds-reels-retention-skip-rate-what-influencer-marketers-should-do-next
4. "Instagram Reels Insights: Complete Guide (2026)". Inro. 2026. https://www.inro.social/blog/instagram-reels-insights
5. "Instagram Insights Update: What Changed in April 2026". Inro. 2026. https://www.inro.social/blog/instagram-insights-update
6. "Instagram Reel Analytics: Retention & Skip Rate Explained". Metricool. Febrero de 2026. https://metricool.com/instagram-reel-analytics/
7. "Instagram führt neue KPIs ein: Skip Rate, Share Rate…". OnlineMarketing.de. 27/04/2026. https://onlinemarketing.de/social-media-marketing/instagram-fuehrt-neue-kpis-ein-skiprate-sharerate-insights-reels-posts
8. "What Is Instagram's New Retention Chart for Reels?". Website Builder Expert. 2025. https://www.websitebuilderexpert.com/news/instagram-reel-retention-chart/
9. "Trial reels: Try content with non-followers first to see what performs best". Instagram for Creators (blog oficial). Diciembre de 2024. https://creators.instagram.com/blog/instagram-trial-reels
10. "Test Content With Non-Followers Using Trial Reels". Meta Newsroom. Diciembre de 2024. https://about.fb.com/news/2024/12/trial-reels-try-content-non-followers-first-see-what-perfoms-best/
11. "Instagram Officially Expands Reels Length to 3 Minutes". Social Media Today. 18/01/2025. https://www.socialmediatoday.com/news/instagram-officially-expands-reels-length-3-minutes/737766/
12. "Finding success on reels in 2025". Instagram for Creators (blog oficial). 21/01/2025. https://creators.instagram.com/blog/the-latest-with-instagram
13. "Instagram Says Posting Longer Reels Can Hurt Your Performance". Social Media Today. 2024. https://www.socialmediatoday.com/news/instagram-longer-reels-hurt-performance/715867/
14. "Instagram Says It Will Recommend Longer Reels in Explore". Social Media Today. Enero de 2025. https://www.socialmediatoday.com/news/instagram-will-recommend-longer-3-minute-reels/737913/
15. "Instagram Explains How Its Algorithm Weighs Time Spent Watching Longer Clips". Social Media Today. 2025. https://www.socialmediatoday.com/news/instagram-longer-video-watch-time-versus-completion-rate/740916/
16. "The Instagram Reels Algorithm 2025: The Most Important Changes and Success Strategies". Fanpage Karma. 2025. https://www.fanpagekarma.com/insights/?p=9293
17. "Instagram Metrics Changes: From Impressions and Plays to Views". SocialPilot. 2025. https://socialpilot.co/instagram-marketing/instagram-views-metrics-changes
18. "Instagram metrics deprecation (Apr 2025)". Agorapulse (centro de ayuda). Abril de 2025. https://support.agorapulse.com/en/articles/10749883-instagram-metrics-deprecation-apr-2025
19. "Instagram views vs viewers". Kontentino. 2026. https://www.kontentino.com/q-and-a/instagram-views-vs-viewers/
20. "Instagram updated algorithm prioritizes original content". Gigazine. 02/05/2024. https://www.gigazine.net/gsc_news/en/20240502-instagram-updated-algorithm-prioritizes-original-content
21. "New Instagram Policies Target Reposted Content". PetaPixel. 30/04/2026. https://petapixel.com/2026/04/30/new-instagram-policies-target-reposted-content/
22. "Instagram Updates its Original Content Policy". Planoly. 2026. https://planoly.com/blog/instagram-updates-its-original-content-policy
23. "Awareness Image Ad Specs on Instagram Reels". Meta Ads Guide (oficial). Consultado el 18/10/2026. https://www.facebook.com/business/ads-guide/update/image/instagram-reels
24. "About text overlays and the Safe Zone for ads in Stories and Reels". Meta Business Help Center (oficial). Consultado el 18/10/2026. https://www.facebook.com/business/help/980593475366490/
25. "Meta Ads Safe Zones: A Guide to the 2026 Unified Creative Updates". Billo. 2026. https://billo.app/?p=50654
26. "Capture Attention with Updated Features for Video Ads". Meta for Business (oficial). Sin fecha visible (datos de ~2016). https://www.facebook.com/business/news/updated-features-for-video-ads
27. "Facebook video ads global". Salesforce Blog. Febrero de 2016. https://salesforce.com/content/blogs/us/en/2016/02/facebook-video-ads-global.html
28. "Capture Attention with Updated Features for Video Ads: tips for building video creative for Facebook & Instagram". Adobe Express (página que resume la guía de Meta). Sin fecha. https://new.express.adobe.com/page/XSgiw
29. Loewenstein, G. "The Psychology of Curiosity: A Review and Reinterpretation". Psychological Bulletin, 116(1), 75-98. 1994. Ficha: https://stafforini.com/works/loewenstein-1994-psychology-curiosity-review/
30. "Curiosity Depends on What You Already Know". Nautilus. Sin fecha visible. https://nautil.us/curiosity-depends-on-what-you-already-know-235803
31. "Hold rate" (glosario). Marpipe. Sin fecha. https://www.marpipe.com/ad-glossary/hold-rate
32. "Hook Rate Explained: How to Measure the First Three Seconds of a Video Ad". Kickbite. Sin fecha. https://www.kickbite.io/en/blog/hook-rate
33. "What's a Good Video Retention Rate? The Benchmarks". Quso.ai. 2026. https://quso.ai/research/video-retention-benchmarks
34. "Short-form retention benchmarks 2026". Kineclip. 2026. https://kineclip.com/blog/short-form-retention-benchmarks-2026/
35. "The Ideal YouTube Shorts Length & Format for Retention (Data-Backed)". OpusClip. 2025. https://www.opus.pro/blog/ideal-youtube-shorts-length-format-retention
36. "Instagram now lets you speed up videos just like on TikTok". TechCrunch. 27/03/2025. https://techcrunch.com/2025/03/27/instagram-now-lets-you-speed-up-videos-just-like-on-tiktok/
37. "Instagram algorithm 2025: complete guide for marketers". Dataslayer. 2025. Citada solo como ejemplo de dato sin confirmar. https://www.dataslayer.ai/blog/instagram-algorithm-2025-complete-guide-for-marketers
38. Lang, A. "The Limited Capacity Model of Mediated Message Processing". Journal of Communication, 50(1), 46-70. 2000. Referencia de fondo sobre por qué un corte o un cambio de plano despierta la atención (respuesta de orientación); no se usa ningún número de acá. [Académico; link no verificado en esta sesión] https://doi.org/10.1111/j.1460-2466.2000.tb02833.x
39. Cutting, J. E., DeLong, J. E. y Nothelfer, C. E. "Attention and the Evolution of Hollywood Film". Psychological Science, 21(3), 432-439. 2010. Referencia de fondo sobre la duración de los planos y la atención; no se usa ningún número de acá. [Académico; link no verificado en esta sesión] https://doi.org/10.1177/0956797610361679
