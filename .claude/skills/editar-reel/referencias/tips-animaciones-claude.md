# Tips para animaciones de nivel con Claude

Fuente: reel "Claude Motion Tips" de @withian.t (octubre 2026). Usalos junto con la skill "Editar tu video (edit)" cuando armes gráficos o animaciones. Siempre con los colores y el estilo de la persona, nunca copiando a otro creador.

## 1. Efectos de código abierto
No hagas todo desde cero. Pasale a Claude el link del repo de GitHub y pedile que lo use en la escena, con la paleta de la persona. Efectos probados:
- p5.js + p5.brush (github.com/acamposuribe/p5.brush, MIT): trazos, rellenos y sombreados que parecen pintados a mano.
- thinking-orbs (github.com/Jakubantalik/thinking-orbs, MIT): esferas de puntos animadas, ideales para "la IA está pensando".
- Matter.js: física real (cosas que caen, rebotan, chocan).
- Rough.js: dibujos y gráficos a mano alzada.
- PixiJS + filtros: efectos visuales (brillos, distorsiones, partículas).
- Anime.js: animaciones fluidas de elementos y textos.
Ejemplo de pedido: "Usá p5.brush (link) para que este título aparezca pintado con acuarela, paleta #F28C28 #2B2B2B, que el trazo termine con un remate prolijo".

## 2. Usá tu propia música para marcar el ritmo
Si el video lleva música propia, pasale el archivo y pedile que marque los golpes fuertes del tema y sincronice ahí: el momento principal cae en el primer golpe fuerte, lo que crece en el siguiente golpe y los detalles chicos en los golpes intermedios. Una música suave pide movimientos lentos y fluidos; una con golpes marcados pide cortes y entradas secas. Si la música se pone después en Instagram, sincronizá con las palabras fuertes de la voz.

## 3. Color y movimiento: decilo con precisión
- Color: dale la paleta de la marca en códigos (hex) y para qué se usa cada uno (fondo, texto, acento). Sin paleta, Claude elige colores genéricos.
- Movimiento: describilo como un director: de dónde a dónde, en cuánto tiempo y cómo termina. Ejemplo: "entra de izquierda a derecha en 0,6 s, sigue una curva hacia arriba, con desenfoque de movimiento, y frena seco".
- Referencias: antes de pedir, pasale imágenes o trabajos de referencia de la persona para que tome materiales y encuadres.

## 4. Robá prompts que ya funcionaron
Hay galerías públicas con cientos de videos hechos con Claude (por ejemplo con HyperFrames o Remotion) donde los autores comparten sus prompts. Buscá uno parecido a lo que querés, leé el prompt y adaptalo al video de la persona.
