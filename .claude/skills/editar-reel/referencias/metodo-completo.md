# Método completo de edición (lo que aprendimos en 3 semanas editando reels)

> Para el agente de video. Esto es todo lo que Paul y Claude fueron aprendiendo del 2 al 16 de octubre de 2026, editando unos 25 reels y 18 clips de charla. Cada regla salió de una corrección real de Paul ("hice X → no le gustó → regla"). Leelo ENTERO antes de la primera edición. Si algo de acá choca con lo que pide la persona, gana la persona. Si choca con `SKILL.md`, gana este archivo, que tiene el detalle.

Índice:
0. La idea en una línea
1. Elegir el modo de edición (animado, minimalista o sin animaciones)
2. Orden de trabajo fijo
3. Tomas y transcripción
4. Cortes: la base de todo
5. Subtítulos
6. Layout y encuadre
7. Gancho (hook)
8. Animaciones del cuerpo: criterio y técnica con números
9. Sonido
10. CTA y cierre
11. Modo sin animaciones (clips estilo Hormozi)
12. Modo minimalista (estilo Apple/Cursor)
13. Versión A y B de un mismo video
14. Auditoría obligatoria (comandos)
15. Guion y contenido (si la persona pide ayuda con qué decir)
16. Lo que se probó y se RECHAZÓ (no repetir)
17. Problemas técnicos conocidos y su arreglo
18. Herramientas

---

## 0. La idea en una línea
**La calidad sale del PROCESO, no de un truco:** cortar perfecto → recién ahí animar palabra por palabra → renderizar → mirar TODO el video cuadro por cuadro → corregir → volver a mirar. Cualquier entrega sin auditoría completa es una entrega mala, aunque "parezca" bien.

---

## 1. Elegir el modo de edición
Antes de arrancar, decidir (o preguntarle a la persona) cuál de estos tres modos va. Los tres comparten los cortes (sección 4) y la auditoría (sección 14).

| Modo | Cuándo | Qué tiene |
|---|---|---|
| **Animado / producido** | Reels de una persona a cámara explicando una herramienta, un dato, una lista. Es el modo por defecto. | Pantalla dividida: animación arriba, cara abajo. Gancho producido. Algo nuevo cada 2-3 s. Subtítulos en la división. |
| **Minimalista** (Apple/Cursor) | Marca sobria, startup, mensaje "de manifiesto", la persona pide "sin tanta animación". | Cara completa todo el video. Sin tarjetas: tipografía grande sobre la pared. Monocromo + un acento. Subtítulos blancos sin pastilla. |
| **Sin animaciones** (Hormozi) | Charlas, podcasts, entrevistas, clips de un video largo. | Cero animaciones. Cortes sin pausas, zoom alternado en cada corte, subtítulos GRANDES con la palabra dicha en amarillo. |

Si la persona no dice nada: preguntar con una sola pregunta y tres opciones. Si manda un video de inspiración, mirarlo (skill `watch`) y elegir el modo que más se parezca.

---

## 2. Orden de trabajo fijo (no saltear ni reordenar)
1. Recibir las tomas. Transcribirlas. Ordenarlas por lo que dicen (vienen desordenadas).
2. **Cortes** (sección 4). Chequeo de silencios + auditoría de miradas en grillas. *Si los cortes no están perfectos, no se arranca con nada más.*
3. Recién ahí: subtítulos, layout y animaciones.
4. Render de todas las versiones.
5. Auditoría completa (sección 14). Si algo falla: arreglar, re-renderizar y auditar TODO de nuevo.
6. Entregar el MP4 final (nunca el editor en vivo) con duración y qué tiene cada versión.

---

## 3. Tomas y transcripción
- Pasar cada toma a 1080×1920, 30 fps constantes, buena calidad:
  `ffmpeg -i TOMA.MOV -vf "scale=1080:1920,fps=30" -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac TOMA.mp4`
- Transcribir con whisper (modelo small alcanza para español) **con tiempos por palabra**.
  - whisper.cpp: `-ml 1 -oj` da una palabra por segmento en JSON. Los sub-tokens que no arrancan con espacio se pegan a la palabra anterior.
  - Si Metal falla o los tiempos por palabra salen raros: forzar CPU (`-ng -t 4`) y desactivar flash attention (es incompatible con timestamps DTW).
- Si hay tomas repetidas de la misma frase: la última buena suele ser la mejor. Descartar las que tienen trabas largas, miradas al costado/guion o ruidos.
- Cada toma puede tener otro encuadre: revisarlo en todas (sección 6).
- Si la persona dicta por voz, los nombres llegan mal (ej. "Cloud" = Claude). Ante la duda, preguntar.

---

## 4. Cortes: la base de todo
### Metas medibles
- **En el audio final no puede haber silencios de más de 0,3 s** (la vara de Paul para sus propios reels fue 0,15 s; 0,3 s es el máximo aceptable).
  Chequeo: `ffmpeg -i final.mp4 -af silencedetect=n=-32dB:d=0.3 -f null - 2>&1 | grep silence_start` → tiene que salir VACÍO.
- **Nunca** cortar una palabra ni dejar una frase empezada. Nunca cortarle una consonante final ("es|pacios").
- **Ninguna mirada al costado o al guion**, por mínima que sea. Si no se puede cortar sin romper la frase, se TAPA (un panel que baja, un sticker, un cartel encima).
- Transcribir el audio editado y compararlo con la transcripción original: **tienen que estar TODAS las palabras**.

### Algoritmo que funcionó (dos pasadas)
1. **Detectar voz por silencios**: `silencedetect` con umbral -30 dB y duración mínima 0,10 s sobre cada toma. Lo que queda entre silencios son "pedazos con voz".
   - Con duraciones menores a 0,10-0,12 s se empiezan a comer consonantes. No bajar de ahí.
2. **Márgenes**: 0,03 s antes y 0,045 s después de cada pedazo (en el modo charla: 0,06 s a cada lado de cada pausa cortada).
3. **Inicio fino** (para no arrancar con aire o respiración): calcular la energía del audio cada 10 ms; el pedazo arranca ~0,07 s antes del primer cuadro con voz clara, pero **nunca después de 0,07 s antes de que empiece la primera palabra** según whisper.
4. **Segunda pasada**: correr todo otra vez usando los tiempos de palabra de la primera pasada como guardia. Así no se come el arranque de palabras dichas suave ("y en realidad", "skills").
5. **Pedacitos sueltos** de menos de 0,12-0,15 s (sin palabra): afuera.
6. **Cortes a mano**: una lista `[toma, desde, hasta]` para sacar miradas, ruidos o palabras sueltas repetidas.
7. **Fundidos de audio de 30 ms** de entrada y salida en cada pedazo: evitan los clics en los cortes.
8. **Final del video**: la última palabra nunca puede quedar cortada. Buscar dónde termina la voz (< -40 dB); si después hay ≥0,3 s de silencio, dejar 0,25 s de cola natural; si no, cortar 0,06 s después del fin de la voz. Antes de cerrar un clip, escuchar SIEMPRE lo que viene después del corte: muchas veces la idea sigue.

> Probamos cortes más agresivos por envolvente de energía y se comían palabras suaves. No vale la pena: silencios + márgenes + segunda pasada + verificación con la transcripción.

### Excepciones (se dejan naturales)
- Tomas de **remate o reacción** (una risa, un chasquido de dedos, un gesto): enteras, sin sacarles pausas. La transición va en el gesto (chasquido → corte).
- En **charlas/entrevistas**: las trabas chicas del habla ("la la la respuesta") y repeticiones cortas SE DEJAN. Paul probó sacarlas todas y dijo "volvamos a lo de antes, queda más natural". Se cortan solo pausas y frases que sobran. Si una traba es muy larga, consultar.
- Cada clip de una charla tiene que **terminar la idea**, no cortar a mitad del razonamiento. No hay duración fija: se estira hasta la frase que cierra.

### Velocidad
- 1,03x como máximo. 1,08x se probó y no gustó ("volvamos a lo normal").
- Si se acelera, aplicar el mismo factor al video, al audio y a TODOS los tiempos de palabras/escenas.

### Estructura de datos que conviene generar
Un JSON por versión: `segments` (toma, desde, hasta, en qué segundo del video final arranca), `blocks` (segundo en que arranca cada bloque del guion), `words` (palabra real + segundo en el video final) y `duration`. Todas las animaciones se escriben contra esos tiempos.

---

## 5. Subtítulos
### Reglas
- Con las **palabras reales** que dijo (no las del guion). Corregir lo que whisper escribe mal con un diccionario chico: nombres de marcas (Claude, CapCut, Workfly…), tildes del voseo (podés, querés, tenés, hacés, pasás, después, última).
- **1 a 3 palabras por bloque** y como máximo ~14-18 letras.
- Cortar el bloque en cada **punto/coma/signo** y en cada cambio de toma.
- Un bloque **nunca termina en palabra colgada**: Y, O, LE, TE, LO, LA, EL, DE, ES, SI, QUE, UNA, UN, A, MI, POR, TU, SE, LOS, LAS, CON, AL, PARA → pasan al bloque siguiente.
- Evitar bloques de una sola palabra (juntarlos con el vecino si entran), salvo la palabra del CTA, que va sola.
- Dos bloques cortitos seguidos ("Y TE" + "LO PASO") se juntan.
- Whisper a veces pierde el punto: forzar corte antes de palabras como "DESPUÉS", "PERO", "OJO".
- Si whisper entiende mal una frase, escribir el texto correcto a mano y **alinearlo** con los tiempos de whisper (alineación tipo LCS entre texto corregido y palabras oídas; las palabras que no matchean se reparten entre la anterior y la siguiente conocida).
- Palabrotas: preguntar. Suaves ("cagada") van naturales. Fuertes, si la persona quiere: bip + "SOR***" en el subtítulo.

### Estilos usados
| Estilo | Detalle |
|---|---|
| **Pastilla oscura** (modo animado) | Fondo #262624, JetBrains Mono 800, 50 px, MAYÚSCULAS, letterSpacing 5. Palabra activa en naranja #ff8a5c. Entra con escala + blur (blur-in). |
| **Hormozi** (modo sin animaciones) | Inter 900, ~86 px, MAYÚSCULAS, letterSpacing -2, blanco con borde negro de 10 px (`-webkit-text-stroke` + `paint-order: stroke fill`) y sombra sólida `0 6px 0 #000`. SOLO la palabra que se está diciendo en amarillo #FFD60A. El bloque entra con un spring (escala 0,8 → 1). |
| **Minimalista** | Inter blanco en minúscula, SIN pastilla, sobre la ropa oscura. Palabra dicha a opacidad 1, las que vienen a 0,45. |

### Posición
- En el gancho: abajo de la cara (y ≈ 1500 de 1920).
- Después del gancho (modo animado): **SIEMPRE en la línea de la división** entre animación y cara (y ≈ 686), arriba de la cara sin taparla. Nunca abajo. Es el "puente visual": se ven cara, subtítulo y animación sin mover la mirada.
- Modo Hormozi: sobre el pecho (y ≈ 1330), con la cara libre.
- Nunca sobre la boca ni tapando contenido de la animación.

---

## 6. Layout y encuadre
### Pantalla dividida (base del modo animado)
- Lienzo 1080×1920. Animación arriba en la franja **0-690 px**, cara abajo.
- La cara ocupa entre **1/2 y 3/4** de la pantalla. Cabeza completa con hombros, sin pared de más arriba, nunca cortada abajo. Ajustar el `object-position` de la toma (valores usados: entre `50% 42%` y `50% 92%` según la toma) y revisarlo con 3 cuadros de cada toma.
- La división entra y sale con easing inOut cúbico en ~0,22 s. Mientras cambia, la cara reajusta su posición para no quedar cortada.
- **Momentos puntuales sin división** (cara completa): el gancho, un sticker flotante ("yo edito con Claude"), un aparte o remate (cara completa en blanco y negro, corte seco, sin animación arriba) y el CTA. Después vuelve el split. "Minimalista" NO significa usar la división lo menos posible.
- **El fondo real de la persona es parte del personaje y no se tapa ni se reemplaza** (cuadros, lámpara, cartel). Nada de fondos de color, 3D gigante ni texto enorme encima de la pared. Los paneles de arriba pueden bajar un rato cuando muestran algo: eso sí.
- Placas a pantalla completa sin la cara: **2 s como máximo**.

### Prohibido con la cara
- Espejarla ("parezco deforme").
- Zoom/punch-in en el modo animado.
- Filtros de color, LUT, sepia, saturación, contraste. La toma va con su color original (la persona pone filtros en la app si quiere). Una viñeta radial muy suave está OK.
- Cabeza recortada flotando encima de tarjetas.

### Paneles (zona de animación)
- Fondo claro con grilla sutil (ej. #ecebe7). Tarjetas blancas, radio 20-26 px, sombra `0 12px 28px rgba(0,0,0,.3)` (las grandes `0 18px 44px rgba(0,0,0,.32)`), padding 14-34 px.
- Etiqueta del panel arriba a la izquierda (x 44, y 40): mono 800, 26 px, letterSpacing 4, con un puntito de color de 13 px. Se puede meter el @ de la persona acá ("• CRECIMIENTO · @usuario").
- Entrada del panel: `scale(0.96 → 1)` + opacidad.

---

## 7. Gancho (hook)
- **Es lo más importante del video.** Una animación producida de 3-4 s con principio, golpe y remate. El golpe cae en la palabra más fuerte de la frase.
- **El cuadro 0 ya muestra algo fuerte** que se mueve o se rompe y que es LO MISMO que dice la frase. Nunca vacío esperando que algo entre. Nunca una barra o tarjeta quieta.
- Nunca texto suelto que parezca hecho con la app de Instagram ("está todo muy tirado").
- Debe entenderse en menos de 3 s y sin sonido.
- Ejemplos que funcionaron (el primero tuvo 906 mil vistas):
  - la mascota con una katana corta el logo de Instagram (platillo en reversa con el pico en el corte);
  - la mascota salta sobre el logo de YouTube como la lámpara de Pixar, aplastándolo un poco más en cada rebote;
  - mascota karateka que patea el logo de LinkedIn;
  - mazo de juez que cae con el sello DEMANDA;
  - 10 monedas, la mascota corta 9 que caen con física real y queda 1 → "10x MÁS BARATO";
  - mascotas "editores" en escritorios que reciben el sello DESPEDIDO y se van con su caja POR DETRÁS de la persona (recorte de silueta);
  - cartel de neón "SE BUSCA EDITOR" que titila, chispazo, se apaga, sello PUESTO ELIMINADO, se da vuelta y se prende "NUEVO EDITOR";
  - factura de suscripciones con logos reales que suma US$ 65, sello, fotocopiadora que saca clones y el total cae a US$ 0 con sello GRATIS;
  - velocímetro NO↔VIRAL que duda y se clava en VIRAL.
- Patrón: **la mascota o los objetos ACTÚAN lo que dice la persona** (lo despiden, lo aplastan, lo cortan). Eso le da gracia.
- Cosas que pasan "detrás" de la persona (entre ella y la pared): recorte de silueta (sección 8.6).

---

## 8. Animaciones del cuerpo
### 8.1 Criterio (lo más importante)
1. Leer las palabras con sus tiempos y marcar las **palabras fuertes** de cada frase (sustantivo, número, verbo de acción).
2. **Cada palabra fuerte = un evento en pantalla justo en su tiempo (±0,05 s)**: aparece la cosa que nombra, se sella, se circula, se escribe, se destapa.
3. **Algo nuevo cada 2-3 s**, que vaya con lo que dice y suba la apuesta. Si hay 3 s sin evento, agregar uno con sentido (nunca relleno).
4. **Mostrar lo real**: la interfaz real de la app, el número real, la captura real, el logo real (de la web oficial o Simple Icons). Nunca dibujar un logo inventado. Nunca inventar datos.
5. **Bucle abierto**: si dice "son 3 cosas", la lista aparece con los puntos TAPADOS (candado, tarjeta dada vuelta, "???" o desenfoque; nunca la palabra "TAPADO") y se destapan con efecto al nombrarlos. La mejor va al final ("y la última es la mejor de todas").
6. **Nada plano**: cada sticker o cartel lleva un detalle que transmite lo que dice.
7. **Pocos elementos y grandes**: 3-5 a la vez como máximo. Tarjetas llenas desde el primer cuadro, sin huecos. Elementos equivalentes del mismo tamaño y alineados. Imágenes sin recortar (si son cuadradas, la tarjeta también).
8. Si la persona señala hacia un lado al terminar una frase, la tarjeta va de ESE lado.
9. Círculos, lupas, flechas y cursores **sobre el dato o botón correcto**. Nada colgado al terminar (lupas, barras, cursores).
10. Contadores: arrancan en un valor real ya alto (nunca en 0) y suben hasta el dato real, con separador de miles.
11. Nada que pase por la cara: lo que cae sale por el costado.
12. Antes de dar una escena por terminada: ¿se entiende sin sonido? ¿hay algo vacío, plano, tapando la cara o fuera de lugar? Si sí, rehacer. Si una animación es obvia o pobre ("la animación de dinero no me gustó, metele creatividad"), rehacerla con una idea mejor.

### 8.2 Determinismo
Todo se calcula a partir del tiempo actual `t` (segundos del video final). Nada de `Math.random`, `setTimeout` ni animaciones CSS sueltas: el render tiene que dar siempre lo mismo. En HyperFrames: una sola timeline GSAP pausada y "seek-safe". En Remotion: `useCurrentFrame()`.

Funciones base:
- `ease(t, a, b)`: 0→1 entre los segundos a y b con ease-out cúbico.
- `back(t, a, b)`: igual con ease-out back(1.8) → se pasa un poquito y vuelve (el "pop").
- spring con stiffness ~190 y damping ~13 para paneles y tarjetas grandes.
- `typed(texto, t, a, b)`: texto que se escribe letra por letra, con cursor de color que titila (`floor(t*4) % 2`).
- Patrón de cada elemento: `if t < entrada o t > salida + 0,3 → no se dibuja`; entrada con back/spring; salida con `1 - ease(t, salida, salida + 0,22)`.

### 8.3 Recetas de movimiento (con números)
- **Blur-in por palabra**: para la palabra i, `p = ease(t, 0,05 + i·0,11, 0,25 + i·0,11)` → opacidad p, `blur((1-p)·6 px)`, `translateY((1-p)·12 px)`.
- **Letras que caen y golpean**: por letra i, `p = ease(t, golpe - 0,04 + i·0,022, golpe + 0,15 + i·0,022, back(2))` → `translateY((1-p)·-90px) scale(1,3 - 0,3p)`. En el golpe, temblor de la tarjeta 0,28 s: `sin((t-golpe)·80) · 7 · (1 - (t-golpe)/0,28)`.
- **Subrayado o círculo a mano**: path SVG curvo con `pathLength=1`, `strokeDasharray=1`, `strokeDashoffset = 1 - ease(...)`. Rojo #e0352b, 7-8 px, `stroke-linecap: round`. (Rough.js sirve para trazos "a mano" más orgánicos.)
- **Sello** (GRATIS, QUEDÓ PRONTO, DESPEDIDO): mono 800, borde 4 px, fondo blanco 95 %, rotado entre -10° y +5°, cae de grande a su tamaño (`scale(2 - p)` con back) + golpecito de sonido + temblor. GRATIS en VERDE, nunca en rojo.
- **Sticker**: `perspective(800px) rotateX((1-p)·70deg) rotate(-5deg) scale(0,6 + 0,4p)`, `transform-origin: 50% 100%` (se levanta como una tarjeta) + un brillo que lo cruza UNA vez (div de 70 px con gradiente blanco 75 %, `skewX(-20deg)`, de -20 % a 110 % del ancho).
- **Velocidad** ("rapidísimo"): entra desde -700 px en 0,22 s, `skewX` de -22° a 0, dos copias fantasma detrás (opacidad 0,28 y 0,14), 4 líneas de velocidad que se achican, frenada con rebote `sin(x·30)·6·exp(-x·12)` y un rayito.
- **Mascota pixel art**: camina con saltito `|sin(t·14)|·12`, se da vuelta con `scaleX(-1)`, "tipea" con `|sin((t+i)·22)|·4`. Entradas escalonadas (`+ i·0,07 s`). Accesorios (auriculares, caja, katana, bandana) con bordes gruesos de 4-7 px.
- **Placa de golpe**: pantalla completa, UNA frase grande, serif itálica en la palabra clave, palabras con blur-in. ≤2 s.
- **Gráficos al lado de la cara**: una palabra o número flotando junto a la cabeza ("10x" en serif itálica), una notificación que entra desde el costado, una calcomanía ("la que uso yo"). Sin tapar la cara.
- **Física real**: Matter.js con simulación determinista (calcularla una vez y cachearla), para cosas que caen y rebotan.

### 8.4 Identidad visual (preset de Paul; para otra persona, cambiar colores y letras pero mantener el sistema)
- Tinta #1d1d1b, acento naranja #d97757, amarillo #f3c534, rojo de corrección #e0352b, verde para GRATIS. Fondo de paneles #ecebe7 con grilla.
- Inter 900 MAYÚSCULAS (titulares, letterSpacing -3), JetBrains Mono 800 MAYÚSCULAS (etiquetas, letterSpacing 4), Lora itálica (acentos).
- Mascota propia en pixel art, constante en todos los videos.
- **Regla de marca:** todos los videos de una persona tienen que verse de la misma familia. No inventar un estilo nuevo por video. Variar de a poco: sumar 2-3 recursos nuevos por video, nunca todo junto. Si hace falta un estilo nuevo, preguntar.

### 8.5 Firma anti-copia
Hay gente que copia los reels tal cual y cambia la persona de abajo. Por eso:
- El @ de la persona chico (~26 % de opacidad, mono), que **salta entre las 4 esquinas** de la zona de animación cada 6 s. Nunca en el medio, nunca cerca de la cara, **nunca en el gancho** (arranca con las animaciones de arriba).
- Además, el @ metido DENTRO de las animaciones (usuario de un chat, etiqueta de un panel, autor de un comentario), así borrarlo rompe la animación. 2-3 veces por video.
- Marca "invisible" (texto al 1-3 %): no sirve, no usar.

### 8.6 Recorte de silueta (cosas que pasan detrás de la persona)
- MediaPipe Image Segmenter con el modelo `selfie_multiclass` (clases pelo, piel del cuerpo, piel de la cara y ropa; NO usar rembg porque agarra objetos del fondo como una bufanda colgada).
- Suavizar entre cuadros: `alfa = 0,6·actual + 0,4·anterior`, después `clip((alfa - 0,35)/0,3)` y un blur gaussiano de 1,2 px en la máscara.
- Codificar como WebM VP9 con alfa (`-c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0`) y poner encima de la escena, sincronizado con la toma.
- **Ojo:** si la máscara se calcula a baja resolución y se agranda el CUADRO, la cara se ve blanda y con otro color durante el gancho ("parece que tiene un filtro"). Calcular la máscara a baja resolución pero aplicarla sobre el cuadro ORIGINAL a 1080×1920, bitrate alto (`-b:v 8M -crf 15`), o mejor usar la silueta solo como máscara CSS sobre el mismo video. Verificar comparando un cuadro con y sin recorte: tienen que verse idénticos.

### 8.7 Efectos open source
- Se pueden usar (transiciones, partículas, luces, Lottie, 3D), pero **siempre con criterio y contexto**. Un demo con confeti, barrido negro, destello y onda uno atrás del otro fue rechazado de plano ("no me gustó nada"): se veía barato.
- Antes de meter un efecto nuevo, probarlo en UNA escena real y mostrársela a la persona.

---

## 9. Sonido
- **Platillo en reversa** (o campana en reversa) con el pico justo en el golpe del gancho. Volumen ~0,35.
- Efectos **minimalistas y sutiles que acompañan todo el video**: whoosh suaves, tic al destapar, golpecito en los sellos, clicks puntuales (~5 por video). Volúmenes 0,08-0,25. Nada de caricatura ni fuerte.
- Sonidos CC0 de Kenney (interface, UI, impact, digital) funcionan bien.
- **Sin música**: la persona la agrega en la app de Instagram (salvo que pida lo contrario).
- Un efecto gracioso puntual en un remate puede funcionar si va con la personalidad de la persona.
- Si hay varios clips de terceros con el mismo audio, cada uno suena con SU audio y se cortan en el mismo instante: medir el desfase por correlación de audio al ms.
- Audio final normalizado a -14 LUFS.

---

## 10. CTA y cierre
- El final **cumple la promesa del gancho** y recién ahí el CTA, como continuación.
- CTA de comentario: tarjeta de perfil con la foto y SOLO el @ (nada debajo), botón Seguir → Siguiendo, la palabra se escribe en la barra de comentario con cursor, burbuja "Te paso … por DM".
- CTA por mensaje: perfil + botones Seguir/Mensaje + chat que escribe y manda la palabra.
- CTA minimalista: @ + "Mandame por mensaje" + barra fina que escribe la palabra.
- El **último cuadro termina con la cara** de la persona.
- Foto de perfil: siempre la actual de la persona.

---

## 11. Modo sin animaciones (clips estilo Hormozi)
Lo hicimos con 18 clips de la charla de un founder en un evento. Funciona para cualquier video largo.
1. **Elegir los clips**: transcribir la charla entera y armar una lista de momentos con una idea completa cada uno (una anécdota, un dato, una pregunta del público con su respuesta). Ponerle a cada uno un título-gancho y la frase con la que cierra.
2. **Rangos**: para cada clip, una lista de rangos `[desde, hasta]` de la fuente. Se pueden saltear tramos que sobran y hasta reordenar (una frase de otro momento que completa la idea).
3. **Cortes**: adentro de cada rango sacar todas las pausas ≥0,18 s (silencedetect -35 dB), dejando 0,06 s de aire a cada lado. Fundidos de 30 ms. Dejar las trabas naturales. Cola natural al final (sección 4). Escuchar lo que viene después del corte para no cortar la idea.
4. **Layout vertical desde una fuente 16:9**:
   - Si la fuente muestra diapositiva + persona chiquita: diapositiva arriba (recortada a su zona) y la persona abajo, ampliada (en pantalla completa queda pixelada).
   - Si la fuente alterna entre vista de diapositivas y vista de cámara: detectar en qué vista está cada cuadro y, en la de cámara, hacer un encuadre vertical que **siga la cara** (seguimiento de la cara cada ~1/3 s, interpolado).
5. **Ritmo "dopamínico" sin animaciones**: zoom alternado en cada corte (1 → 1,14 → 1 → 1,14…), con origen en la cara. Ese cambio de tamaño en cada corte es lo que da energía.
6. **Subtítulos Hormozi** (sección 5): grandes, la palabra dicha en amarillo. Texto corregido a mano y alineado con los tiempos de whisper.
7. **Placa de quién habla** los primeros ~3 s: nombre + cargo en una pastilla oscura, que entra y sale con fade.
8. Entregar **de a uno o dos** y esperar el ok antes de seguir. Cuando la fuente se agota, no forzar más clips.

---

## 12. Modo minimalista (estilo Apple/Cursor)
- Cara completa todo el video, sin split, sin filtro (viñeta suave + velo blanco muy leve arriba).
- **Sin tarjetas, pastillas ni sombras.** Tipografía Inter 600 negra (#111113) grande sobre la pared (zona alta), etiqueta mono gris chica arriba, palabras que entran con blur.
- Monocromo; el color de acento (más oscuro para que se lea sobre la pared) SOLO en la palabra clave.
- Recursos: cambio de frase con blur cruzado, tachado con línea fina, números grandes que cuentan, "∞".
- Subtítulos blancos en minúscula sin pastilla, sobre la ropa (si es oscura).
- Sonido casi nulo: platillo en reversa bajo + swish muy bajo en los cambios grandes.
- No pisar con texto objetos característicos del fondo.
- Logo real de la marca.

---

## 13. Versión A y B
- Conviene grabar **dos ganchos** por video. A va como reel normal; B, días después, como reel de prueba (a no seguidores).
- **B tiene OTRA escena de gancho** con la misma idea (no la misma animación con otro texto), para que la plataforma no lo tome como duplicado y para evitar copias.
- El cuerpo se comparte: los tiempos del cuerpo se escriben en el reloj de A y en B se corren con `offset = inicioCuerpoA - inicioCuerpoB`.
- Cosas que ayudan a que no cuente como duplicado: otra duración, otro gancho, otro título. NO espejar ni acelerar.

---

## 14. Auditoría obligatoria (sin excepción, en CADA versión completa)
> Paul: "auditá 30 veces si es necesario". Una vez se mandó un video revisando 8 cuadros por escena y estaba lleno de errores. Nunca más.

1. **Silencios**: `ffmpeg -i out.mp4 -af silencedetect=n=-32dB:d=0.3 -f null - 2>&1 | grep silence_start` → vacío.
2. **Negros**: `ffmpeg -i out.mp4 -vf blackdetect=d=0.03:pix_th=0.1 -f null - 2>&1 | grep black_start` → vacío. (Si aparecen entre pedazos: cada secuencia de video tiene que durar 1 cuadro más de lo calculado.)
3. **Cuadros cada 0,2 s de TODO el video** en grillas legibles (≥200 px por cuadro, con el tiempo escrito):
   `ffmpeg -i out.mp4 -vf "fps=5,scale=216:-1,tile=10x4" audit/grilla-%02d.jpg`
   y MIRAR cada grilla. Si el ffmpeg no tiene `drawtext`, escribir los tiempos con Pillow.
4. En las grillas, chequear:
   - cuadro 0 completo (algo fuerte, nada vacío);
   - nada pasa por la cara ni la tapa;
   - el subtítulo no tapa contenido y está en su lugar;
   - círculos, lupas, flechas y cursores sobre el dato o botón correcto;
   - tarjetas equivalentes del mismo tamaño y alineadas; imágenes sin recortar;
   - nada vacío (paneles con huecos, páginas en blanco);
   - nada plano; algo nuevo cada 2-3 s;
   - firma en las esquinas y no en el gancho;
   - miradas tapadas o cortadas;
   - nada colgado al terminar una escena;
   - el encuadre de la cara bien en todas las tomas;
   - último cuadro con la cara.
5. **Palabras**: transcribir el MP4 final y compararlo con lo que dijo: no puede faltar ninguna.
6. **Antes de animar**, además: cuadros inicial/medio/final de CADA pedazo de corte, buscando miradas.
7. Si algo falla: arreglar, re-renderizar y auditar TODO de nuevo. Si una animación no queda bien, se rehace entera.
8. Entregar con un resumen corto: duración, qué tiene cada versión, qué se revisó y qué no se pudo resolver. No afirmar "revisé todos los cuadros" si se muestreó.

---

## 15. Guion y contenido (si la persona pide ayuda con qué decir)
Los datos de la cuenta de Paul mostraron que **el problema casi siempre está en el gancho y en el medio del video**, no en el contenido.

**El video que mejor anduvo** (906 mil vistas, 18 s vistos de promedio, 3,4 % de compartidos):
1. Tema = algo que le toca a CUALQUIERA que está scrolleando (la plataforma donde lo están mirando), no solo a un nicho.
2. Promesa enorme y concreta en la primera frase: noticia + choque + qué ganás, en una sola frase.
3. Gratis y con números reales ("son trece skills").
4. Bucle abierto fuerte: "y la última es la mejor de todas" + tarjeta dada vuelta con candado.
5. Lista de beneficios cortos, uno por toma, la mejor al final.
6. Remate "qué ganás vos", en el idioma del dolor.
7. CTA simple con palabra.
8. Guardable y compartible: ¿por qué alguien lo guardaría o se lo mandaría a un amigo?

**Reglas del gancho** (salieron de las métricas de omisión):
- Arrancar con una NOTICIA o algo que CHOCA ("esta página debería ser ilegal", "poné a 100 Claudes a pelear a muerte"). Nunca con un problema o una explicación ("si te quedás sin tokens…" tuvo 82 % de omisión).
- Algo concreto en la primera frase: un nombre, un número o una acción fuerte.
- Una sola idea corta. Directo, sin suavizar ("capaz que estás tirando…" → NO; "Estás tirando cientos de dólares por mes…" → SÍ).
- No inventar datos ni el sujeto (si la herramienta no es de Claude, el gancho no dice "Claude").
- Las frases quemadas se dejan de usar ("acaba de matar" se usó 3 veces y se quemó): se repite la ESTRUCTURA, no la frase.
- Proponer 3 ganchos, puntuarlos y decir cuál conviene y por qué.

**Principios del guion:**
- Personalidad: al menos una frase que solo esa persona diría.
- Empaque simple: frases cortas, palabras de todos los días, una idea por frase. Si una palabra necesita explicación, se cambia la palabra.
- Valor por segundo: lo útil cuanto antes; lo que se dice en 2 s no se dice en 20.
- Al grano: nada de ejemplos inventados que no aportan.
- Si el guion sale de un video de referencia: volver a verlo y respetar el mismo tema, la misma promesa y el mismo orden. Arrancar el guion con "Origen: … · qué dice el original: …" y "De qué trata: …".
- Leerlo en voz alta como lo diría la persona antes de pasarlo.
- "El video ES la prueba": si se puede, mostrar el proceso en pasos con datos reales, barra de capítulos arriba, mapa repaso antes del CTA y último cuadro igual al primero (loop).

**Caption**: "Comentá 'PALABRA' y te mando …" + una línea gancho + 5 hashtags, todo en un bloque.

---

## 16. Lo que se probó y se RECHAZÓ (no repetir)
| Probado | Resultado |
|---|---|
| Acelerar a 1,08x | "Volvamos a lo normal" → 1,03x máximo |
| Zoom / punch-in a la cara (modo animado) | No gustó |
| Espejar la cara para el reel de prueba | "Parezco deforme" |
| Cabeza recortada encima de las tarjetas | Volver al split |
| LUT de cine | Tiñó la pared de marrón |
| Grade CSS (contraste/saturación/sepia) | "Los hooks tienen un filtro naranja" → color original |
| Fondo de color / 3D gigante tapando el cuarto | "El fondo es mi esencia, nunca se tapa" |
| Títulos sueltos tipo app de Instagram | "Está todo muy tirado" → animación producida |
| Kit de efectos genéricos (confeti, barridos, destellos) en serie | "No me gustó nada" |
| Listas que dicen "TAPADO" | Candado / tarjeta dada vuelta / desenfoque |
| Sello GRATIS en rojo | Va en verde |
| Placas a pantalla completa de 5 s | 2 s máximo |
| Subtítulos abajo después del gancho | Van en la división |
| Firma en el medio o en el gancho | Solo esquinas, después del gancho |
| Marca de agua "invisible" | Se ve un poco y con contraste se pierde |
| Texto encima de las caras de clips de terceros | Solo los clips |
| Carteles aclaratorios ("no, soy yo, hecho con IA") | Afuera |
| Sacar todas las trabas en una charla | "Queda más natural con las trabas" |
| Cortar un clip antes de que termine la idea | Seguir hasta la frase que cierra |
| Revisar solo 8 cuadros por escena | Lleno de errores → cada 0,2 s, todo |
| Debajo del @ en el CTA, una descripción | Solo el @ |

---

## 17. Problemas técnicos conocidos
- **Cuadros negros entre pedazos**: cada secuencia de video tiene que durar +1 cuadro.
- **Render con WebGL** (3D, transiciones de shader, light leaks) en Remotion: `--gl=angle`.
- **Render que falla al renombrar**: el MP4 de salida está abierto en un reproductor → usar otro nombre.
- **Whisper con Metal que aborta** o tiempos por palabra raros: forzar CPU y sin flash attention.
- **Whisper escribe mal un nombre**: agregarlo al diccionario de correcciones (no reemplazar todo por el guion).
- **Palabra comida en el corte**: segunda pasada o subir el margen posterior.
- **Chromium que no arranca en un sandbox**: correr el render fuera del sandbox.
- **CFR**: exportar a 30 fps constantes; algunos editores en la nube devuelven fps variables.
- **Cara "con filtro" en el gancho**: es el recorte de silueta a baja resolución (sección 8.6).
- **Editores con IA en la nube** (ej. el AI Lab de CapCut): su primer borrador dejó 27 silencios de más de 0,15 s. Una respuesta "exitosa" de una herramienta no prueba que el corte esté bien: auditar igual.

---

## 18. Herramientas
- **HyperFrames** (HTML + GSAP, render determinista): skills `hyperframes`, `hyperframes-core`, `hyperframes-animation`, `hyperframes-registry` (≈400 piezas: buscá ahí antes de dibujar algo a mano), `talking-head-recut`, `embedded-captions`, `motion-graphics`, `hyperframes-audio`, `media-use`.
- **Remotion** (React) como alternativa: `@remotion/transitions`, `light-leaks`, `noise`, `motion-blur`, `lottie`, `three`.
- **ffmpeg / ffprobe**: cortes, silencedetect, blackdetect, grillas, transcodificación.
- **whisper.cpp** (modelo small, español, tiempos por palabra).
- **MediaPipe** (recorte de silueta y seguimiento de cara), **Pillow** (etiquetas en grillas), **Matter.js** (física), **Rough.js** (trazos a mano), **Simple Icons** (logos reales), sonidos **Kenney CC0**.
- Skill **`watch`**: mirar un video de inspiración (cuadros + transcripción). Para auditar, igual sacar grillas propias a 5 fps.
