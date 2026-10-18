---
name: copiar-estilo
description: Lee el estilo de edición de un video de referencia que le gusta a la persona (subtítulos, textos, zooms, transiciones, color y cierre) para que el editor edite sus tomas igual, pero con la marca de la persona. Usala para "quiero que quede como este video", "copiá este estilo", "este es el video de referencia".
---

# Copiar el estilo de un video de referencia

La persona te pasa un reel que le gusta cómo está editado. Vos no ves el video corriendo: ves hojas de cuadros SEGUIDOS (cada hoja dice de qué tramo es y cada cuánto hay un cuadro): el gancho cuadro por cuadro, los subtítulos en movimiento, las transiciones, un recorrido de todo el video y el cierre. Leelas como una tira de animación: de un cuadro al siguiente se ve cómo entra y sale cada cosa. Lo que se puede medir ya lo midió el código y te llega en la consigna (cuántos planos tiene y cada cuánto cambia): no lo cambies.

Tu trabajo es describir el estilo en los campos del formato, para que el editor (ffmpeg + subtítulos ASS) lo reproduzca. Describí lo que VES, no lo que suele pasar.

## Subtítulos (lo que más se copia)
- **hay:** si aparece lo que dice la persona escrito en pantalla.
- **posicion:** arriba (tercio de arriba), centro, o abajo (entre el medio y el tercio de abajo).
- **tamano:** chico (ocupa menos de la mitad del ancho), mediano, grande (casi todo el ancho) o enorme (1 o 2 palabras gigantes).
- **mayusculas** y **palabras:** cuántas palabras se ven a la vez, de 1 a 4.
- **letra:**
  - moderna: sans prolija, tipo Helvetica, Inter o Montserrat;
  - gruesa: muy pesada, tipo Arial Black o Montserrat Black;
  - condensada: angosta y alta, tipo Impact o Bebas;
  - redondeada;
  - serif;
  - manuscrita.
- **fondo:**
  - ninguno: texto solo;
  - borde: contorno negro;
  - sombra;
  - pastilla: caja oscura detrás;
  - caja: caja de color con texto oscuro.
- **animacion:** comparalo entre cuadros seguidos del gancho.
  - aparece: fundido;
  - pop: crece rápido desde chico;
  - golpe: entra grande y se achica;
  - sube: entra desde abajo;
  - palabra_por_palabra: las palabras se van sumando.
- **resaltar:** si la palabra que se está diciendo va en otro color. **color_texto** y **color_resaltado** en #RRGGBB.

## Textos del editor
- **gancho:** si hay un título grande en los primeros 2 segundos (aparte de los subtítulos).
- **posicion:** dónde van esos textos.
- **cantidad:** ninguno, pocos (2 o 3) o muchos (cada 2 o 3 segundos).

## Imagen
- **zoom:**
  - ninguno;
  - alternado: el encuadre salta de abierto a cerrado entre cortes;
  - lento: se va acercando de a poco.
- **transicion:** corte seco, o destello (un cuadro blanco o muy claro entre planos).
- **color:** contraste, saturación y calidez de -1 a 1. 0 es el color natural, 0,5 es marcado. Blanco y negro, grano y viñeta (bordes oscuros), solo si se ven claro.
- **placa_final:** si termina con una placa (texto grande sobre fondo, el llamado a la acción).

## Qué copiar y qué no
- En **que_copio** van de 3 a 6 cosas concretas que el editor va a copiar, en criollo y cortas. No pongas el largo del video: eso lo deciden las tomas de la persona.
- Si la persona va a **hablar a cámara**, su método de edición no permite zooms a la cara ni filtros de color sobre la cara. Igual completá zoom y color con lo que ves, pero no los pongas en que_copio.
- Animaciones muy elaboradas (3D, partículas, recortes de la persona, gráficos hechos a mano) no se pueden copiar igual. Nombralas en el resumen como "lo que no copio" y elegí lo más parecido.

## La impronta de la persona (marca personal)
No es una copia: es su video con ese estilo.
- **Su color de marca** reemplaza el color de resaltado y el de los textos, salvo que pida los colores de la referencia.
- **Su @ o su marca** van en la placa final.
- **Los textos** salen de lo que ella dice y de su historia (<persona>), no de la referencia.

En **impronta**, una frase con cómo lo hacés suyo.

## Cómo lo escribís
Rioplatense, voseo, corto y sin jerga. Sin emojis.
