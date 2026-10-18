// Preset de edición: la vara de calidad que aplica el agente de video SIEMPRE, sin que la persona la pida.
// Es el método de edición de Paul (creador de contenido del equipo), escrito como reglas. El detalle completo, con
// todos los números, está en .claude/skills/editar-reel/referencias/metodo-completo.md (lo lee el agente Editor). Lo personal de cada usuario
// (colores, letra, estilo de subtítulos, ritmo de animaciones) sale de las preguntas de abajo y de su video de inspiración.

/** Lo que el agente le pregunta ANTES de editar. */
export const PREGUNTAS_VIDEO = [
  { id: "inspiracion", pregunta: "Pasame un video que te guste cómo está editado (link o archivo). Lo uso de referencia para el estilo." },
  { id: "subtitulos", pregunta: "¿Cómo querés los subtítulos?", opciones: ["Limpios (blanco, 1-3 palabras)", "Palabra activa resaltada en tu color", "Pastilla oscura tipo etiqueta"] },
  { id: "colores", pregunta: "¿Tenés colores o una letra de marca? Si no, uso un estilo minimalista neutro." },
  { id: "animaciones", pregunta: "¿Cuánta animación querés?", opciones: ["Poca: solo cuando nombro algo clave", "Media: algo nuevo cada 2-3 segundos", "Mucha: muy dinámico"] },
  { id: "tomas", pregunta: "Subí las tomas en orden, empezando por el gancho. Si grabaste dos ganchos, decime cuál va." },
] as const;

/** Estilos de subtítulos predefinidos (la persona elige uno; el resto lo resuelve el preset). */
export const SUBTITULOS = {
  limpios: { palabrasPorBloque: [1, 3], color: "#FFFFFF", resaltado: null, fondo: null },
  resaltado: { palabrasPorBloque: [1, 3], color: "#FFFFFF", resaltado: "acento", fondo: null },
  pastilla: { palabrasPorBloque: [1, 3], color: "#FFFFFF", resaltado: "acento", fondo: "rgba(17,17,17,0.85)" },
} as const;

/** Reglas fijas que van en el system prompt del agente de video. */
export const PRESET_EDICION = `PRESET DE EDICIÓN (se aplica siempre, no se negocia):
Ritmo ("dopamínico", sin tiempos muertos)
- Cortá TODAS las pausas: en el audio final no puede quedar ningún silencio de más de 0,3 s. Verificalo con ffmpeg silencedetect (-32 dB) sobre el audio editado; si sale algo, recortá de nuevo.
- Nunca cortes una palabra ni una frase a la mitad: después de cortar, transcribí el audio editado y compará con lo que dijo la persona. Tienen que estar TODAS las palabras.
- Velocidad 1,0x a 1,03x como máximo. Nada de zoom a la cara (punch-ins).
- Sacá las miradas al costado o al guion y las tomas repetidas: quedate con la mejor.
- Cada 2-3 segundos algo nuevo en pantalla que vaya con lo que dice (un dato, una palabra clave, un gráfico simple). Nada de animación de relleno.

Gancho
- Los primeros 2 segundos deciden todo: el gancho va primero, con una animación que muestre la promesa (no texto suelto).

Subtítulos
- 1 a 3 palabras por bloque, con las palabras reales que dijo (corregí nombres y marcas que la transcripción escriba mal).
- En zona segura: nunca sobre la boca ni tapando la cara ni el contenido. Sincronizados al milisegundo.

Diseño (minimalista y detallista)
- Pocos elementos, mucho aire, un solo color de acento, una tipografía.
- Nada plano: cada elemento entra con un detalle que transmita lo que dice (lo rápido entra rápido, un sello golpea, una lista se destapa de a uno). Transiciones cortas y suaves.
- Placas de texto a pantalla completa: 2 segundos como máximo.
- Sin filtros de color sobre la cara y sin espejarla. Logos siempre reales.
- Sonido: sutil y mínimo (un whoosh, un click). Audio final normalizado a -14 LUFS.

Cierre
- El final cumple la promesa del gancho y termina en un llamado a la acción claro (comentá PALABRA, seguime, link).
- El último cuadro, con la persona.

Auditoría ANTES de entregar (obligatoria)
- Grillas de cuadros cada 0,2 s de TODO el video: nada vacío, nada que se pise, nada fuera de lugar, el cuadro 0 completo.
- silencedetect sin pausas > 0,3 s y blackdetect sin negros.
- Transcripción final completa.
- Si algo falla, corregí y volvé a auditar (máximo 3 vueltas). Entregá con un resumen corto de lo que revisaste y de lo que no pudiste resolver.`;
