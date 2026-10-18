# Editor: conocimiento experto

> En qué es experto: editar reels verticales de 1080 × 1920 con ritmo medido, subtítulos legibles en el celular y audio a -14 LUFS, usando solo ffmpeg y subtítulos ASS, y comprobar cada regla con un número antes de entregar.

Suma a lo que ya traen `lib/video/preset.ts`, `editar-reel`, `copiar-estilo`, `montaje-producto` y `metricas-que-importan/secciones/04-retencion.md` (skip rate, tiempo visto, sonido, gancho de 2 s): eso no se repite.

**Etiquetas:** [Oficial] Meta, Instagram u organismo de normas. [Estudio] industria. [Académico] paper revisado. [Experto] práctica profesional sin estudio. [No verificado] circula sin fuente primaria. Las fuentes con † no se pudieron reabrir el 18/10/2026 (se agotó la búsqueda web de la sesión): son documentos conocidos, pero hay que revisar el link antes de citarlos en público.

## Lo que sabe que un chat cualquiera no sabe

1. **La "zona segura" no tiene un solo número, y la más citada es la de anuncios.** Las guías que repiten los números de Meta para anuncios en Reels piden dejar libre el 14 % de arriba (unos 269 px), el 35 % de abajo (672 px) y el 6 % de cada costado (65 px) sobre 1080 × 1920: el área limpia queda en unos 895 × 980 px [Experto, citando a Meta] (fuentes 9 y 10). Una medición hecha sobre vistas previas en marzo de 2026 da 13 % arriba, 23,4 % abajo y 3,2 % a los costados, más la columna de botones a la derecha (fuente 12). El 35 % de abajo incluye el botón del anuncio. En un reel orgánico, abajo solo van el @, la descripción y el audio. Por eso el editor usa el 35 % como límite duro para el llamado a la acción y el 23-25 % como límite para los subtítulos.

2. **El "algo nuevo cada 2-3 s" tiene base en el cine, no en TikTok.** Cutting, DeLong y Nothelfer analizaron 150 películas de Hollywood de 1935 a 2005. Encontraron que el largo de cada plano se fue pareciendo cada vez más al de sus vecinos, hasta acercarse a un patrón 1/f, el mismo que tienen las fluctuaciones de la atención humana [Académico] (fuente 1). La duración promedio de plano (ASL, *average shot length*) bajó de 8-10 s en los años 60 a 3-4 s en 2005 [Estudio, nota de prensa] (fuente 3). Un estudio de 2011 extendió la muestra a 160 películas, hasta 2010: planos más cortos, más movimiento y películas más oscuras (*"Quicker, faster, darker"*) [Académico] (fuente 4). El reel con un cambio cada 2-3 s es la continuación de esa curva, no un invento de las redes.

3. **El ritmo no es solo la duración promedio: es la variación.** El mismo Cutting aclara que el patrón de variación del largo de los planos es independiente del promedio (fuente 3). El crítico Barry Salt advierte que el hallazgo no es la "fórmula del éxito comercial" (fuente 6). Regla práctica: no cortar con metrónomo (todos los planos de 2,0 s), sino alternar tramos de 1,2-1,8 s con tramos de 2,5-3 s, agrupados por idea [Experto].

4. **Un corte bien puesto no se nota.** En la investigación sobre la "ceguera al corte" (*edit blindness*), los cortes que coinciden con un movimiento o con un cambio de mirada pasan mucho más inadvertidos que los cortes en reposo [Académico] (fuente 15). Para un reel hablado: cortar en un parpadeo, en un gesto o al empezar una palabra acentuada disimula el salto de imagen (*jump cut*, corte entre dos tramos de la misma toma) mejor que cortar con la cara quieta.

5. **Los subtítulos ayudan a entender aunque haya sonido.** La revisión de Gernsbacher (2015) junta más de 100 estudios: los subtítulos mejoran la comprensión, la atención y la memoria de lo visto, también en personas que oyen bien [Académico] (fuente 16). Leer subtítulos no le saca atención a la imagen de forma importante (Perego y colegas, con seguimiento de la mirada) [Académico] (fuente 17). Que la mayoría mire Reels con sonido no es motivo para sacar los subtítulos.

6. **Un subtítulo de 66 px en el lienzo equivale a "texto grande" en el celular.** Un lienzo de 1080 px de ancho se ve en un celular de unos 390 puntos de ancho, o sea a una escala de 0,36. WCAG define texto grande como 18 pt (unos 24 px CSS) y le pide un contraste mínimo de 3:1; al texto normal le pide 4,5:1 [Oficial] (fuente 19). Cuenta propia: 24 / 0,36 ≈ 66 px en el lienzo. El tamaño "chico" del código (`0.034 × 1920 ≈ 65 px`) está justo en el límite. Debajo de eso, el editor exige 4,5:1 y borde o sombra. ms-edit ya dice que menos de 30 px es textura, no información.

7. **-14 LUFS es una costumbre de las plataformas, no una norma.** La norma de streaming de la AES (TD1004, 2015) recomienda entre -16 y -20 LUFS integrados y picos de -1 dBTP como máximo [Oficial] (fuente 23). Spotify normaliza a -14 LUFS (fuente 24). Que Instagram normalice a un valor fijo **[No verificado]**: Meta no lo publica. El preset se queda en -14, pero queda **a tener en cuenta**: una voz sin música masterizada a -16 suena más natural en un celular. El LUFS se mide con ITU-R BS.1770 (fuente 22), y el filtro `ebur128` de ffmpeg lo implementa (fuente 25).

8. **El `loudnorm` de una sola pasada del código es dinámico. A tener en cuenta:** `lib/video/editar.ts` y `lib/video/montaje.ts` usan `loudnorm=I=-14:TP=-1.5:LRA=11` en una sola pasada. En ese modo, el filtro ajusta la ganancia sobre la marcha, como un control automático: puede subir el eco del cuarto entre palabras. La documentación de ffmpeg prevé una medición previa y una segunda pasada con `linear=true`, que aplica una ganancia fija (fuente 25). ms-edit recomienda lo mismo con `volume` + `alimiter`. El objetivo de -14 no cambia: cambia cómo se llega.

9. **Las etiquetas de IA de Meta dependen de qué herramienta tocó el video.** Desde 2024, Meta etiqueta como "Información de IA" (*AI info*) lo que detecta por los metadatos C2PA o IPTC, o lo que el usuario declara. En septiembre de 2024 movió la etiqueta al menú del post cuando el contenido solo fue *editado* con IA, y la deja visible cuando fue *generado* [Oficial] (fuentes 27 y 28 †). Meta pide declarar el video fotorrealista o el audio realista creado o alterado digitalmente. Cortes, subtítulos y loudness con ffmpeg no son IA generativa y no disparan la etiqueta. Una voz clonada o un fondo generado sí obligarían a declararlo.

10. **Instagram ya no tiene filtros de terceros.** Meta cerró Meta Spark, la plataforma de efectos de realidad aumentada de terceros, el 14/01/2025 [Oficial] (fuente 29 †). Lo que la persona llama "filtro" hoy es un efecto propio de Instagram, o una corrección de color. El preset prohíbe filtros sobre la cara. La corrección técnica (exposición y balance de blancos) es otra cosa: ver "Audio y color".

11. **Las cuentas comerciales tienen menos música.** Las cuentas de empresa de Instagram usan una biblioteca de música con licencia comercial, más chica que la de los creadores (Meta Sound Collection) [Oficial] (fuente 31 †). Para una marca chica, el editor no promete "el tema de moda": pone música libre de derechos, o deja el video listo para que la persona sume el audio desde la app al publicar.

12. **La grilla del perfil recorta la portada.** Desde enero de 2025 la grilla del perfil es rectangular, no cuadrada (fuentes 7 y 8): se reportó una vista 3:4, que de una portada de 1080 × 1920 muestra unos 1080 × 1440 del centro. El texto de la portada va entre los y 240 y 1680, o se pierde en la grilla.

## Especificaciones y zonas seguras (tabla)

| Qué | Valor que usa el editor | Fuente y nivel |
|---|---|---|
| Lienzo | 1080 × 1920 px, 9:16. Mínimo aceptable 720 × 1280 | ms-edit + consenso [Experto] |
| Cuadros por segundo | 30 fps, o el de la toma hasta 60. No mezclar 25 y 30 en el mismo video | [Experto] |
| Códec de video | H.264 High, `yuv420p`, `-movflags +faststart` | [Experto]; ffmpeg (25) |
| Calidad al exportar | CRF 18-20 (unos 8-12 Mbps en 1080p30). Instagram vuelve a comprimir: subir de más no ayuda, subir de menos sí perjudica | [Experto] |
| Audio | AAC 48 kHz, 192-256 kbps, -14 LUFS integrados, picos ≤ -1 dBTP (el código usa -1,5 por el margen que pierde el AAC) | AES (23), Spotify (24) |
| Duración al subir | Hasta 3 min (desde el 20/01/2025, antes 90 s); los de más de 90 s también aparecen en la pestaña Reels | [Oficial vía prensa] (7, 8) |
| Portada | 1080 × 1920. En la grilla se ve el centro en 3:4 (unos 1080 × 1440): texto entre los y 240 y 1680 | Cambio de grilla (7); cálculo propio |
| Zona segura arriba | 14 % = 269 px (anuncios). Medido en 2026: 13 % = 250 px | (9, 10, 12) |
| Zona segura abajo | 35 % = 672 px (anuncios, con botón). Medido: 23,4 % = 450 px. Orgánico: subtítulos sobre y ≈ 1470 | (9, 12); ms-edit |
| Costados | 6 % = 65 px por lado. A la derecha, debajo de y ≈ 1000, la columna de botones ocupa unos 130-160 px | (9, 12); guía de diseño |
| Contraste del texto | 4,5:1 (texto normal); 3:1 a partir de unos 66 px en el lienzo | WCAG (19); cálculo propio |
| "Subir en la máxima calidad" | Activarlo en la app (Ajustes → Uso de datos y calidad de contenido) antes de publicar | [Oficial, opción de la app] |

**Una caja para todo** (la intersección de todas las fuentes): textos clave entre x 90-950 e y 270-1470. El llamado a la acción, por encima de y 1250. En 2026 Meta unificó la zona segura de Historias y Reels en anuncios (fuente 11), pero los números de esa guía no coinciden con los de otras: mientras no haya una página oficial abierta, vale la caja más estricta.

## Ritmo, cortes y subtítulos (reglas con números)

**Ritmo**
- La duración promedio de plano se calcula como la duración ÷ (cortes + 1). Para un reel hablado con el preset, el objetivo es tener un cambio visual (un corte, un texto o una animación) cada 2-3 s. El plano de cámara puede durar más si arriba cambia la animación [preset].
- La variación importa: mezclar planos de 1,2-1,8 s con planos de 2,5-3 s. Nunca más de 3 planos seguidos del mismo largo (fuente 3) [Experto].
- En los cortes de una misma toma (*jump cut*), cortar en un movimiento: un parpadeo, un gesto de manos o el arranque de una palabra fuerte. Se nota menos (fuente 15).
- **J-cut y L-cut** (el audio del plano siguiente empieza antes de la imagen, o el audio del anterior sigue un poco sobre la imagen nueva): 3-8 cuadros (100-250 ms). Sirven para pasar de la cara a un plano de apoyo (*B-roll*) sin que se note el salto. No agregan silencio: el audio sigue continuo y cumple la regla de 0,3 s [Experto].
- **A tener en cuenta:** el "punch-in" (acercar la cara de golpe un 110-120 % en un corte) es lo más usado en reels hablados para disimular los jump cuts [Experto]. El preset de Paul lo prohíbe: se mantiene la prohibición, y el corte se disimula con el momento en que se corta y con la animación de arriba.
- El documento interno de producción de MrBeast que se filtró en septiembre de 2024 habla de que los primeros minutos deciden la retención y de subir la apuesta seguido. Está escrito para videos largos de YouTube, no para reels. **[No verificado]** como dato para reels: usarlo solo como idea, nunca como número (fuente 33 †).

**Subtítulos**
- Velocidad de lectura de referencia: la BBC usa 160-180 palabras por minuto (fuente 21 †) y Netflix pide como máximo 42 caracteres por línea y 2 líneas (fuente 20 †). En los subtítulos en castellano de Netflix se usan 17 caracteres por segundo para adultos **[No verificado]**. Con bloques de 1-3 palabras (de 6 a 18 caracteres), un bloque necesita entre 0,4 y 1 s de pantalla. El código ya lo cubre: corta en pausas de más de 0,25 s y estira el bloque hasta 0,3 s.
- Un bloque nunca debe durar menos de unos 0,25 s (unos 8 cuadros a 30 fps): menos que eso titila. Si una palabra suelta dura menos, se junta con la siguiente [Experto].
- Tamaño: el alto de la letra entre 60 y 135 px (del 3,4 % al 7 % del alto, los tamaños de `subtitulos.ts`). Contraste: blanco sobre la imagen con un borde de 3-6 px o una sombra. Pasar a pastilla (*rgba 17,17,17 al 85 %*) si el fondo de la toma es claro (fuente 19).
- Palabra por palabra (*karaoke*): no hay estudios que lo comparen con el bloque fijo; es práctica de creadores [Experto]. La palabra activa va en el color de acento y no crece más de un 10 %, para que el bloque no "salte".
- En el layout dividido del preset, los subtítulos van sobre la línea de división (y ≈ 690), dentro de la caja segura.

## Audio y color (reglas con números)

**Audio**
- Medir antes y después con `ebur128=peak=true`. Objetivo: -14 ± 0,5 LUFS integrados y picos ≤ -1,5 dBTP medidos sobre el archivo AAC final (fuentes 22, 23, 25).
- Hacerlo en dos pasadas (`loudnorm` con `measured_*` y `linear=true`, o ganancia fija + limitador): ver punto 8 de arriba.
- Si para llegar a -14 el limitador tiene que bajar más de 6 dB, entregar a -16 y avisar (ms-edit; AES acepta de -16 a -20) (fuente 23).
- Voz: filtro pasa altos a 75-80 Hz para el ruido grave (aire acondicionado, golpes en la mesa). Reducción de ruido suave (`afftdn` de ffmpeg con 6-12 dB como máximo). Si se reduce más, la voz suena "de lata" [Experto] (fuente 25).
- **Música debajo de la voz:** entre 15 y 20 dB por debajo del nivel integrado de la voz. ms-edit usa 15. Si la canción tiene letra, 20 o más, porque compite con las palabras [Experto]. No hay estudio que fije el número.
- Efectos de sonido (whoosh, clic, golpe): de 6 a 12 dB por debajo de la voz, de 100 a 400 ms, alineados con el cuadro de la animación. No más de uno cada 2-3 s, para que no se vuelva ruido [Experto]. No hay evidencia académica sobre su efecto en la retención de reels: es criterio de edición.
- Rango de volumen (LRA): una voz para el celular suena pareja con 5-8 LU. El código usa LRA = 11, un rango amplio, pensado para música [Experto] (fuente 25).

**Color y cara**
- **Corregir no es filtrar.** La corrección técnica arregla la exposición y el balance de blancos para que la piel se vea como en la vida real. El filtro cambia el aspecto con una intención estética. El preset prohíbe lo segundo sobre la cara.
- Piel: en el vectorscopio (el gráfico de colores de ffmpeg, `vectorscope`), los tonos de piel de cualquier etnia caen sobre la "línea de piel", entre el rojo y el amarillo. Si se van hacia el verde o el magenta, hay una dominante de color [Experto] (fuente 25).
- Exposición: en el forma de onda (`waveform`, el gráfico de brillo), la piel queda más o menos entre el 55 % y el 75 % según el tono. Ningún tramo grande de la cara llega al 100 % (blanco quemado): medirlo con `signalstats` (`YMAX`, `YHIGH`) [Experto].
- **A tener en cuenta:** algunos coloristas suben el contraste y agregan una viñeta en la cara (lo menciona la guía de diseño, como opción). El preset manda: color original. Como mucho, y solo si la toma está claramente oscura o azulada, una corrección global de exposición o de balance de blancos, avisada en el resumen.
- En producto o lugar (sin cara), `montaje.ts` sí aplica color. Saturación +0,1 a +0,2 como máximo, y en comida nunca enfriar la imagen: la comida fría se ve menos rica [Experto].

## Reels de producto o lugar (por rubro)

Base común (suma a `montaje-producto`): reel de 12-30 s, con cortes de 1,2-3 s, o sea entre 6 y 15 planos. Un plano de detalle cada 2 o 3 planos abiertos. El precio, una sola vez y grande (lo pide montaje-producto). El llamado a la acción en los últimos 2-3 s, por encima de y 1250. Google usa el marco ABCD para anuncios: Atraer, *Branding* (marca a la vista temprano), Conectar y Dirigir a una acción (fuente 32 †). Sirve como checklist, sin prometer un porcentaje de ventas.

| Rubro | Primer plano (0-2 s) | Planos que suman | Texto en pantalla | Cuidado técnico |
|---|---|---|---|---|
| Ropa | La prenda puesta y en movimiento (un giro, caminar hacia la cámara) | Detalle de la tela o la costura a 10-20 cm; calce de espalda; outfit completo; antes y después de combinarla | Nombre, 1 detalle que no se ve ("no se arruga"), talles y precio si los pasaron | Luz de ventana de costado; no mezclar luz cálida y fría en el mismo plano |
| Gastronomía | El momento tentador: el queso que se estira, el corte, el vapor, la salsa que cae | Desde arriba (cenital) y a 45°; las manos preparando; el local con gente | Nombre del plato, precio o combo, horario, "pedí por DM" | Nunca enfriar el color; planos de 1-1,5 s en el proceso, más largo el plato final |
| Inmobiliaria | El ambiente con más luz o la vista, con el barrio en el gancho | Recorrido en el orden en que se camina (entrada → living → cocina → dormitorio → vista); movimientos de cámara lentos y horizontales | Barrio, ambientes, metros, precio al final, contacto | Verticales derechas (las paredes no se inclinan); gran angular (0,5x) solo en interiores chicos |
| Turismo y lugares | Una persona de espaldas entrando al lugar, o la vista más abierta | Plano en primera persona (*POV*); detalle de textura (agua, comida, cama); gente usando el lugar | Nombre del lugar y la zona, 1 dato (distancia, precio por noche) | Horario dorado (la primera y la última hora de sol); no estabilizar de más |
| Servicios y profesionales | El resultado (un antes y un después) o las manos trabajando | El proceso en 3-4 pasos; la cara de la persona al final | Qué resuelve, en 2-4 palabras; la palabra clave del llamado a la acción | El último plano, con la persona: es marca personal |

Todo lo de esta tabla es [Experto]. No hay estudios públicos de cantidad de planos por rubro para negocios chicos. No inventar precios ni datos: usar solo los que pasó la persona (lo dice montaje-producto).

## Cómo lee un video de referencia

1. **Cortes (con código, no a ojo):**
   - `ffmpeg -vf "scdet=threshold=10"`, o `select='gt(scene,0.3)'`, para tener los tiempos de los cortes (fuente 25).
   - PySceneDetect `ContentDetector` (umbral por defecto 27). `AdaptiveDetector` para videos con mucho movimiento de cámara, porque confunde menos un paneo con un corte (fuente 26 †).
   - Con eso salen: la cantidad de planos, la duración promedio de plano, la **mediana** y el desvío. La mediana importa más que el promedio, porque una placa larga infla el promedio (fuente 3).
2. **Destellos y transiciones:** un pico de brillo de 1-3 cuadros en `signalstats` (`YAVG`) justo en un corte es un destello blanco. Un cambio gradual de 6 a 15 cuadros es un fundido.
3. **Zoom:** comparar el tamaño de la cara entre cuadros seguidos. Un salto de más del 10 % en el corte es un zoom alternado; un cambio parejo de 1-3 % por segundo es un zoom lento (para el preset, solo se anota).
4. **Subtítulos:** buscar la franja que cambia en cada palabra (la resta entre cuadros seguidos, por zonas). Su posición en y da arriba, centro o abajo. Contar palabras por bloque en 5 o más bloques.
5. **Paleta:** `palettegen` de ffmpeg sobre 10-20 cuadros da los 3-5 colores dominantes. El color de acento es el que aparece solo en los textos resaltados.
6. **Letra:** se describe por categoría (moderna, gruesa, condensada, redondeada, serif, manuscrita), no por el nombre exacto. Se reemplaza por una letra con licencia libre del mismo tipo (Inter, Montserrat, Bebas Neue, de licencia OFL) [Experto].
7. **Audio:** medir los LUFS de la referencia con `ebur128`, buscar si hay efectos en los cortes (picos cortos en el audio) y si la música baja cuando se habla.
8. **Qué NO se copia** (derechos): las tomas, la música, los gráficos, los logos y las letras con licencia paga de la referencia. El estilo (el ritmo, la posición y el tamaño de los textos, el tipo de transición) no es material protegido. Lo que se lleva es una tabla de parámetros, nunca un archivo de la referencia [Experto]. Instagram, además, baja en las recomendaciones el contenido que no es original (fuente 30).

## Checklist de auditoría antes de entregar

| # | Qué se mide | Comando o método | Pasa si |
|---|---|---|---|
| 1 | Formato | `ffprobe` | 1080 × 1920, 30 fps (o el de la toma), H.264 `yuv420p`, AAC 48 kHz; audio y video duran lo mismo (± 1 cuadro) |
| 2 | Pausas | `silencedetect=n=-32dB:d=0.3` sobre el audio final | No aparece ninguna |
| 3 | Negros | `blackdetect=d=0.05:pix_th=0.10` | Ningún tramo negro |
| 4 | Cuadros congelados | `freezedetect=n=-60dB:d=1.5` | Nada quieto más de 1,5 s (salvo una placa de 2 s como máximo) |
| 5 | Loudness | `ebur128=peak=true` sobre el MP4 final | -14 ± 0,5 LUFS; picos ≤ -1,5 dBTP |
| 6 | Palabras | Transcribir de nuevo y comparar | Coincide el 100 % de las palabras |
| 7 | Ritmo | Detección de cortes + tiempos de las animaciones | Ningún tramo de más de 3 s sin un cambio visual |
| 8 | Subtítulos | Grilla de cuadros cada 0,2-0,3 s | 1-3 palabras por bloque, ningún bloque de menos de 0,25 s, nunca sobre boca u ojos, dentro de x 90-950 e y 270-1470 |
| 9 | Contraste | Muestrear el color del texto y del fondo detrás | ≥ 4,5:1, o ≥ 3:1 si el alto de la letra es de 66 px o más |
| 10 | Cara | `signalstats` + mirar la grilla | Sin espejar, sin filtro, la piel sin quemar (YMAX < 235 en la zona de la cara) |
| 11 | Llamado a la acción | Cuadros de los últimos 3 s | Se ve por encima de y 1250 y el último cuadro tiene a la persona (en un reel de producto, el producto) |
| 12 | Portada | Cuadro 0, recortado al centro en 3:4 | El gancho se lee en la grilla del perfil |
| 13 | Etiqueta de IA | Revisar qué herramientas se usaron | Si se usó voz o imagen generada, avisar que hay que declararlo al publicar |
| 14 | Derechos | Revisar la lista de recursos | Música libre o para sumar en la app; letras con licencia libre; nada copiado de la referencia |

Máximo 3 vueltas de corrección (el preset). En el resumen de entrega, los números medidos (LUFS, pausas, cortes por segundo), no un "salió bien".

## Lo nuevo de 2025-2026

- **Reels de hasta 3 minutos** (20/01/2025, antes 90 s) y **grilla rectangular** (fuentes 7 y 8). El preset no cambia: el video dura lo que dura la idea.
- **Edits**, la app de edición de Instagram, anunciada la misma semana (fuente 8). Es la competencia directa; la diferencia de Hookia es el método de Paul y la auditoría con números.
- **Cierre de Meta Spark** (14/01/2025): no hay más filtros de realidad aumentada de terceros (fuente 29 †).
- **Zona segura unificada** de Historias y Reels en anuncios (marzo de 2026, con números que no coinciden entre guías): revisar la vista previa de Ads Manager antes de fijar uno nuevo (fuentes 11 a 13).
- **"Información de IA"** más discreta para lo editado con IA y visible para lo generado (desde septiembre de 2024; fuentes 27 y 28 †).
- **Originalidad:** Instagram prioriza el contenido original frente a las cuentas que resuben (fuente 30). Copiar el estilo, sí; subir tramos de otro video, no.
- La curva de retención (agosto de 2025, ver `metricas-que-importan`) le dice al editor dónde cortar en el próximo video.

## Fuentes

Verificadas por búsqueda el 18/10/2026:
1. "Attention and the Evolution of Hollywood Film". Cutting, J. E., DeLong, J. E. y Nothelfer, C. E. *Psychological Science*, 2010. https://journals.sagepub.com/doi/10.1177/0956797610361679
2. Nota de prensa sobre el estudio de Cutting y colegas. *ScienceDaily*, 23/02/2010. https://www.sciencedaily.com/releases/2010/02/100223121435.htm
3. "The science of Hollywood films" (planos de 8-10 s en los 60 a 3-4 s en 2005; declaración de Cutting sobre la variación). *National Geographic* / Fox News, 25/02/2010. https://www.nationalgeographic.com/culture/article/100225-foxnews-science-of-hollywood-films-chaos-theory
4. "Quicker, faster, darker: Changes in Hollywood film over 75 years". Cutting, J. E. y colegas. *i-Perception*, 2011. https://journals.sagepub.com/doi/reader/10.1068/i0441aap
5. Seguimiento de Cutting y colegas sobre el ritmo en un siglo de películas. *Cognitive Research: Principles and Implications* (índice DOAJ), marzo de 2018. https://doaj.org/article/a49cadddc45f4911b835823e6226ab22
6. Comentario crítico de Barry Salt sobre el trabajo de Cutting. *Cinemetrics*, Universidad de Chicago, s. f. https://cinemetrics.uchicago.edu/article/590235ff-85aa-4714-9553-71d4c44fd61c
7. "Instagram head announces big changes: 3-minute Reels and new look for profile grid". *Business Today*, 21/01/2025. https://www.businesstoday.in/technology/news/story/instagram-head-announces-big-changes-3-minute-reels-and-new-look-for-profile-grid-461527-2025-01-21
8. "Instagram introduces three-minute Reels". *Social Samosa*, enero de 2025. https://www.socialsamosa.com/news-2/instagram-introduces-three-minute-reels-8636683
9. "Guide to safe zones: TikTok, Facebook, Instagram Stories". House of Marketers, 2025. https://www.houseofmarketers.com/guide-to-safe-zones-tiktok-facebook-instagram-stories
10. "Instagram Reels safe zone". Socialync, 2025-2026. https://www.socialync.io/tools/safe-zones/instagram-reels
11. "Meta Ads Safe Zones: A Guide to the 2026 Unified Creative Updates". Billo, 2026. https://billo.app/blog/meta-ads-safe-zones
12. "Facebook Ad Safe Zones" (medición sobre vistas previas, marzo de 2026). Adkit, 2026. https://adkit.so/tools/safe-zones/facebook
13. "Meta Ads Creative Guide 2026: safe zones". 1ClickReport, 2026. https://www.1clickreport.com/blog/meta-ads-creative-safe-zones-2026-guide

† Documentos conocidos, con el link sin reverificar en esta sesión:

14. "Intensified Continuity: Visual Style in Contemporary American Film". Bordwell, D. *Film Quarterly* 55(3), 2002. https://doi.org/10.1525/fq.2002.55.3.16
15. "Edit Blindness: The relationship between attention and global change blindness in dynamic scenes". Smith, T. J. y Henderson, J. M. *Journal of Eye Movement Research* 2(2), 2008. https://doi.org/10.16910/jemr.2.2.6
16. "Video Captions Benefit Everyone". Gernsbacher, M. A. *Policy Insights from the Behavioral and Brain Sciences* 2(1), 2015. https://doi.org/10.1177/2372732215602130
17. "The cognitive effectiveness of subtitle processing". Perego, E., Del Missier, F., Porta, M. y Mosconi, M. *Media Psychology* 13(3), 2010. https://doi.org/10.1080/15213269.2010.502873
18. Estudio sobre ver video sin sonido (69 %). Verizon Media y Publicis Media, 2019. Ya citado en `metricas-que-importan`; sin link primario.
19. "Understanding SC 1.4.3: Contrast (Minimum)". W3C, WCAG 2.2, 2023. https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
20. "English (USA) Timed Text Style Guide". Netflix Partner Help Center, actualización continua. https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide
21. "Subtitle Guidelines". BBC, actualización continua. https://www.bbc.co.uk/accessibility/forproducts/guides/subtitles/
22. Recomendación ITU-R BS.1770: algoritmos para medir el loudness y el pico verdadero. UIT, versión vigente. https://www.itu.int/rec/R-REC-BS.1770
23. AES TD1004.1.15-10, "Recommendations for Loudness of Audio Streaming and Network File Playback". Audio Engineering Society, 2015. https://www.aes.org/technical/documents/AESTD1004_1_15_10.pdf
24. "Loudness normalization". Spotify for Artists, actualización continua. https://support.spotify.com/us/artists/article/loudness-normalization/
25. "FFmpeg Filters Documentation" (loudnorm, ebur128, silencedetect, blackdetect, freezedetect, scdet, signalstats, vectorscope, waveform, afftdn, palettegen). FFmpeg, versión vigente. https://ffmpeg.org/ffmpeg-filters.html
26. "Detection Algorithms". Documentación de PySceneDetect, versión vigente. https://www.scenedetect.com/docs/latest/api/detectors.html
27. "Labeling AI-Generated Images on Facebook, Instagram and Threads". Meta (Nick Clegg), 06/02/2024. https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/
28. "Our Approach to Labeling AI-Generated Content and Manipulated Media". Meta (Monika Bickert), 05/04/2024, con actualizaciones de julio y septiembre de 2024. https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/
29. Anuncio del cierre de Meta Spark (efectivo el 14/01/2025). Meta, agosto de 2024. https://spark.meta.com/blog/meta-spark-announcement/
30. "Recommendations and originality". Instagram Creators, 2024-2025. https://creators.instagram.com/recommendations-and-originality
31. "Sound Collection". Meta for Business, actualización continua. https://www.facebook.com/sound/collection/
32. Marco "ABCDs of effective video ads". Google / Think with Google, 2021. Sin link verificado: citar solo el marco, sin cifras.
33. "How to Succeed in MrBeast Production", documento interno filtrado. Septiembre de 2024. Sin link primario. [No verificado]
