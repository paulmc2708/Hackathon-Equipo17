---
name: editar-reel
description: Edita un reel hablado (una persona a cámara) a partir de las tomas crudas, con el método de edición de Paul ya preseteado: cortes sin pausas de más de 0,3 s, ritmo dopamínico, subtítulos de 1 a 3 palabras, animaciones producidas y auditoría cuadro por cuadro antes de entregar. Antes de editar le pregunta a la persona un video de inspiración y cómo quiere los subtítulos. Usa HyperFrames (o Remotion), ffmpeg y whisper. Usala para "editá mi video", "tengo estas tomas", "armame el reel".
---

# Editar un reel como lo edita Paul

La persona sube sus tomas crudas y recibe el reel listo para subir, sin tener que tocarlo. **No se aprende a editar de cero: se arranca desde este preset.** Lo único que se personaliza es el estilo (colores, letra, subtítulos, cantidad de animación), y sale de las preguntas del paso 0.

## 0. Antes de editar: preguntar
Las preguntas están en `lib/video/preset.ts` → `PREGUNTAS_VIDEO`:
1. Un **video de inspiración** que le guste. Miralo con la skill `watch`: cómo arranca, el ritmo, los subtítulos y las animaciones.
2. **Subtítulos**, una de tres opciones: limpios, palabra activa resaltada en su color, o pastilla oscura.
3. **Colores y letra** de su marca. Si no tiene, minimalista neutro.
4. **Cuánta animación**: poca (solo en lo clave), media (algo nuevo cada 2-3 s) o mucha.
5. **Las tomas en orden**, empezando por el gancho. Si grabó dos ganchos, cuál va.

## 1. Cortes: es la BASE, sin esto no se arranca con nada
1. Transcribir cada toma con whisper, con tiempos por palabra.
2. Elegir la mejor toma de cada frase. Afuera quedan las repetidas, las trabadas, las miradas al costado o al guion y los ruidos.
3. Cortar los silencios: en el audio final **no puede haber ninguna pausa de más de 0,3 s**. El ideal de Paul es 0,15 s. Hacerlo en dos pasadas. Márgenes de 30-45 ms antes y después de cada palabra y fundidos de audio de 30 ms en cada corte, para que no haya clics.
4. **Nunca cortar una palabra ni una frase a la mitad.** Transcribir de nuevo el audio editado y compararlo con lo que dijo: tienen que estar TODAS las palabras.
5. Verificar con `ffmpeg -af silencedetect=n=-32dB:d=0.3` sobre el audio final. No puede aparecer nada.
6. Velocidad entre 1,0x y 1,03x como máximo. Nada de zoom a la cara.
7. Revisar el encuadre en TODAS las tomas: la cabeza entera con hombros, sin pared de más arriba.

## 2. Estructura que retiene (contenido "dopamínico")
- **Gancho (0-2 s):** va primero aunque se haya grabado en otro orden. Es una animación producida que muestra la promesa, no texto suelto. El cuadro 0 ya está completo: nada vacío esperando que entre algo.
- **Cada 2-3 segundos, algo nuevo** que vaya con lo que dice y suba la apuesta: un dato, una palabra clave, un ítem que se destapa, una captura. Nada de animación de relleno ni tramos quietos.
- **Bucle abierto:** si dice "son 3 cosas", la lista aparece con los puntos tapados y se destapan al nombrarlos.
- **Final:** cumple la promesa del gancho y recién ahí va el llamado a la acción. El último cuadro tiene a la persona.

## 3. Layout
- **Base: pantalla dividida.** La animación arriba (más o menos el 36 % superior) y la cara abajo, ocupando entre la mitad y tres cuartos de la pantalla.
- **Momentos puntuales sin división:** la cara a pantalla completa con un sticker flotante, o una placa de golpe a pantalla completa de 2 s como máximo. Después vuelve el split.
- Frases "aparte" o de remate: la cara a pantalla completa, con corte seco, opcionalmente en blanco y negro.
- El fondo real de la persona (su cuarto, su lugar) es parte del personaje: no se tapa con fondos de color.

## 4. Subtítulos
- De 1 a 3 palabras por bloque, con las palabras reales que dijo. Corregir lo que whisper escribe mal (nombres y marcas).
- En el gancho pueden ir abajo de la cara. Después van **entre la cara y la animación**, en la línea de la división, arriba de la cara sin taparla. Nunca sobre la boca.
- Entran con un blur-in corto, y la palabra que se está diciendo va resaltada si eligió esa opción.
- Sincronizados con los tiempos por palabra.

## 5. Animaciones producidas: nada plano
- Cada elemento entra con un detalle que transmite lo que dice:
  - lo rápido entra disparado, con estela y una frenada con rebote;
  - un sello golpea con un temblor corto;
  - un sticker entra con giro 3D y un brillo que lo cruza una vez;
  - un círculo rojo dibujado a mano marca el dato correcto;
  - un cursor hace clic en el botón correcto.
- Movimiento con resortes (spring/back), nunca lineal. Transiciones cortas.
- Pocos elementos y grandes: entre 3 y 5 a la vez como máximo. Tarjetas llenas, sin espacio vacío. Elementos equivalentes del mismo tamaño y alineados.
- Logos siempre reales (de la web de la marca). Imágenes sin recortar.
- Los contadores no arrancan en 0 si el número ya existe. No queda nada colgado al terminar una escena.
- Cada animación cae en la palabra que la nombra (tiempos de la transcripción).
- Sin filtros de color sobre la cara y sin espejarla: la toma con su color original.
- Sonido mínimo y sutil: un whoosh, un clic, un golpecito en los sellos. Audio final normalizado a -14 LUFS.
- La firma o el @ de la persona va chico, en las esquinas, y también adentro de las animaciones (por ejemplo, el usuario de un chat). Nunca encima de la cara.
- Referencias detalladas: `referencias/guia-diseno-pro.md` y `referencias/tips-animaciones-claude.md`.

## 6. Herramientas
- **HyperFrames** (skills `hyperframes`, `hyperframes-core`, `hyperframes-animation`, `hyperframes-registry`, `talking-head-recut`, `embedded-captions`, `motion-graphics`): video en HTML + GSAP, render con `npx hyperframes`. Antes de dibujar algo a mano, buscalo en el catálogo de unas 400 piezas (`hyperframes-registry`).
- `ms-edit` (Jake): el flujo completo de edición de un reel hablado.
- ffmpeg para cortes y chequeos. Whisper (whisper.cpp o el CLI de HyperFrames) para transcribir.

## 7. Auditoría ANTES de entregar (obligatoria, sin excepción)
1. Grillas de cuadros cada 0,2-0,3 s de TODO el video, en tamaño legible. Revisalas todas: nada vacío, nada que se pise, nada fuera de lugar, ningún subtítulo tapando contenido, el cuadro 0 completo y el último cuadro con la persona.
2. `silencedetect` sin pausas de más de 0,3 s y `blackdetect` sin cuadros negros.
3. Transcripción final completa, comparada con lo que dijo.
4. Si algo falla, corregí y volvé a auditar (máximo 3 vueltas). Entregá con un resumen corto de lo que revisaste y de lo que no pudiste resolver.
