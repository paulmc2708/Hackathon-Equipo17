# Guía de diseño pro para reels

Reglas para que un reel editado se vea profesional y moderno, no "de plantilla". Valen para cualquier persona y cualquier estilo: aplicalas con los colores, la letra y el tono de la persona. Usalas junto con el kit de edición (kit-edicion.zip).

## 1. El primer segundo
- El cuadro 0 ya muestra el hook: texto grande y algo que se mueve. Nunca un cuadro vacío, negro o "cargando".
- El hook va primero en el video aunque la persona haya grabado las tomas en otro orden.

## 2. Tamaño y espacio
- Los elementos ocupan el panel: el texto principal entre 64 y 140 px, los números hasta 230 px. Si queda más de un tercio del panel vacío, agrandá o sumá un elemento.
- Pocas cosas y grandes: máximo 3 a 5 elementos a la vez. Si hay más, se destapan de a uno.
- Todo dentro de la zona segura (1080x1920): arriba 230 px libres, abajo 380 px, derecha 160 px.

## 3. Ritmo
- Cada animación cae en la palabra que la nombra (usá los tiempos de words.json). Si dice "tres cosas", el 3 aparece en "tres".
- Cambiá algo en pantalla cada 2 a 4 segundos: una escena nueva, un ítem que se destapa, un zoom.
- Las placas a pantalla completa (sin la cara) duran 2 segundos como máximo.
- Entre escenas, nada de cuadros vacíos: la escena siguiente entra mientras sale la anterior, o vuelve la cara a pantalla completa.

## 4. Movimiento que se ve caro
- Entradas con resorte (rebote suave), no lineales: los objetos llegan, pasan un poco y se acomodan.
- Texto que entra palabra por palabra con desenfoque que se aclara.
- Escalonado: los elementos de una lista entran con 2 a 4 cuadros de diferencia, no todos juntos.
- Profundidad: sombras suaves y tarjetas un poco inclinadas que se enderezan.
- Física real para impacto (cosas que caen y se apilan) y sacudida corta en un golpe fuerte.
- Contadores que nunca arrancan en 0: salen de un valor cercano y frenan al llegar.
- Listas con bucle abierto: se ven tapadas desde el principio y se destapan al nombrarlas.

## 5. Color y letra
- Una paleta de la persona: fondo, texto y UN color de acento. El acento solo para lo importante (la palabra clave, el número, el ganador).
- Una sola familia de letra en peso 800-900 para titulares; la palabra clave puede ir en itálica y color de acento.
- Fondos con un degradé suave y grano fino, no planos.
- Si la persona quiere, color de cine en la cara (face.grade): un poco más de contraste y viñeta suave.

## 6. Subtítulos
- De 1 a 3 palabras, con la palabra que se dice resaltada.
- Siempre con las palabras reales del audio (corregí nombres y marcas).
- Sobre el pecho, nunca sobre boca u ojos.

## 7. Antes de entregar
- Auditá con scripts/audit.mjs y mirá todas las grillas. Preguntate en cada cuadro: ¿se entiende sin sonido?, ¿hay algo vacío o chico?, ¿la animación muestra lo que se dice?
- Si algo se ve "de plantilla" (chico, quieto, con mucho espacio vacío), rehacelo más grande y con movimiento.
