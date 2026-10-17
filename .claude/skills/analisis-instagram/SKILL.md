---
name: analisis-instagram
description: Análisis completo de Instagram para una persona con marca personal. Arma el contexto haciendo preguntas, analiza su perfil, su nicho, su competencia, las cuentas que sigue y lo viral de afuera, y recomienda qué hacer con hooks y formatos concretos. Orquesta las skills ig-profile, ig-audit, ig-viral, ig-reel, ig-carousel e ig-human. Usala para cualquier pedido de "analizá mi Instagram", "qué hago para crecer", "mirá mi competencia", "qué está funcionando en mi nicho".
---

# Análisis de Instagram (marca personal)

El objetivo final: que la persona sepa **qué cambiar en su perfil, qué publicar y cómo**, con evidencia real. Nada de consejos genéricos.

## 0. Antes de analizar: preguntá (siempre que falte algo)
Necesitás este contexto mínimo. Si falta algo que cambia el resultado, preguntá (de 1 a 4 preguntas cortas, en tono de charla) y frená:
- ¿A qué te dedicás y qué sabés hacer mejor que nadie?
- ¿Qué vendés o querés vender? ¿A quién?
- ¿Qué te hace distinto? (2 o 3 cosas de tu historia)
- 3 textos o captions tuyos, para copiar tu voz.

Y pedí material, porque mejora mucho el análisis:
- **Capturas de su perfil:** la parte de arriba, la grilla y las estadísticas de 2 o 3 reels (vistas, alcance, retención si la tiene).
- **Perfiles que le interesan** (sus @) y capturas de esos perfiles.
- **Videos de gente que hace cosas que le gustan** (cómo arrancan, la edición, el ritmo).
- **Las cuentas que sigue:** capturas de su lista de "Seguidos". Instagram no da esa lista por API: hay que pedirla con capturas.

## 1. Fuentes de datos (en este orden; nunca inventes números)
1. `obtener_perfil_instagram` (API oficial de Meta, Business Discovery): datos públicos de cuentas profesionales, con el outlier ya calculado con código.
2. Métricas privadas de la persona vía Windsor (`windsor_campos` → `windsor_datos`), si las conectó.
3. Las imágenes que subió (cada una dice de qué es: su perfil, un perfil de referencia, un cuadro de un video).
4. Búsqueda web (`web_search` / `web_fetch`) para completar y para lo que está pasando esta semana.
Si un dato no sale de ninguna fuente, decilo en "limitaciones". Los multiplicadores (outliers) los calcula `calcular_outliers`, no vos.

## 2. Su perfil (ig-profile + ig-audit)
- Nota sobre 100 con los 12 criterios de `ig-profile/rubric.json`, punto por punto y con lo que viste.
- Qué le funcionó y qué no, a partir de sus números: outlier contra su propia mediana. No sirven las vistas sueltas.
- Cambios en orden de impacto, con los textos listos para copiar: nombre, bio, destacadas y los 3 fijados.
- Pensado para marca personal: ¿se entiende en 3 segundos quién es y qué ganás si lo seguís? ¿Aparece su cara? ¿Hay un camino claro a lo que vende?

## 3. Su nicho y lo viral de afuera (ig-viral)
- 6-12 cuentas de su nicho, de habla hispana y de tamaño parecido (hasta 10 veces su tamaño).
- Los posts que superan 1,5x la mediana de su cuenta (lo ideal es más de 3x). Por cada uno: por qué funcionó, la fórmula del hook (`ig-reel/hooks.json`), el formato y cómo lo grabaría ESTA persona con su historia.
- También fuera de Instagram: qué se está hablando esta semana en su tema (web).

## 4. Competencia y referentes
Por cada cuenta: qué hace bien, formatos, fórmulas de hook, ritmo y edición (lo que se ve en los cuadros de video), cómo vende y qué adaptaría la persona. Al final: los patrones que se repiten y **las oportunidades**, es decir, lo que nadie está haciendo y ella puede hacer.

## 5. Las cuentas que sigue
De las capturas de "Seguidos", elegí las que son creadoras de su tema o de temas cercanos, analizalas como en el punto 4 y decí qué le está entrando por los ojos y qué le conviene copiar o evitar.

## 6. Recomendaciones (lo que se lleva)
- **5 ideas concretas**, cada una con su hook sugerido, su formato (reel o carrusel) y su etapa del embudo:
  - **atraer:** que te descubran;
  - **confianza:** que te vean como el que sabe;
  - **vender:** que te compren.
- Para los carruseles, la estructura de `carrusel-10`. Para los reels, `ig-reel`.
- Una semana sugerida que mezcle las tres etapas.
- Todo en su voz y pasado por `ig-human`.

## Principios de contenido (de Paul, aplicarlos a todo)
1. **Personalidad:** algo que solo esa persona diría. Los hooks y las estructuras se copian; la persona no.
2. **Empaque simple:** frases cortas, palabras de todos los días, una idea por frase. Si hay que explicar una palabra, se cambia la palabra.
3. **Valor por segundo:** lo útil cuanto antes. Lo que se dice en 2 segundos no se dice en 20.
4. **Bucle abierto:** anunciar la lista al principio ("son 4 cosas, la última es la más importante").
5. **Prueba concreta** en el hook cuando se pueda (un número real, una captura, un resultado), nunca inventada.
6. **Hook:** una noticia o un choque en la primera frase, algo concreto (un nombre, un número, una acción) y que se entienda en menos de 3 segundos. El primer cuadro muestra lo mismo que dice la frase.
7. **El hook es una promesa** que el video cumple. Cada 2-3 segundos, algo nuevo que suba la apuesta. Al final se cumple la promesa y recién ahí va el llamado a la acción.
8. Nada de datos inventados ("el 90 % no sabe…").
