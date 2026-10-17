import { z } from "zod";

export const Creador = z.object({
  usuario: z.string().min(1),
  aQueSeDedica: z.string().optional().default(""),
  queVende: z.string().optional().default(""),
  aQuien: z.string().optional().default(""),
  historia: z.string().optional().default(""),
  captions: z.array(z.string()).optional().default([]),
});
export type Creador = z.infer<typeof Creador>;

const Etapa = z.enum(["atraer", "confianza", "vender"]);

const ResultadoPerfil = z.object({
  nota_total: z.number().int().min(0).max(100),
  resumen: z.string(),
  criterios: z.array(z.object({ criterio: z.string(), puntos: z.number(), maximo: z.number(), observacion: z.string() })),
  cambios: z.array(z.object({ prioridad: z.number().int(), que: z.string(), por_que: z.string(), texto_sugerido: z.string() })),
  nombre_sugerido: z.array(z.string()),
  bio_sugerida: z.string(),
  destacadas: z.array(z.string()),
  fijados: z.array(z.object({ rol: z.string(), idea: z.string() })),
  datos_usados: z.string(),
  limitaciones: z.string(),
});

const ResultadoIdeas = z.object({
  nicho: z.string(),
  ideas: z.array(
    z.object({
      titulo: z.string(),
      cuenta: z.string(),
      link: z.string(),
      metrica: z.string(),
      multiplicador: z.number().nullable(),
      por_que_funciono: z.string(),
      formula_hook: z.string(),
      angulo_personal: z.string(),
      etapa: Etapa,
      hook_sugerido: z.string(),
    }),
  ),
  fuentes: z.array(z.string()),
  limitaciones: z.string(),
});

const ResultadoGuion = z.object({
  hooks: z.array(z.object({ texto: z.string(), formula: z.string(), puntaje: z.number(), por_que: z.string() })),
  guion: z.array(z.object({ segundos: z.string(), dice: z.string(), en_pantalla: z.string() })),
  cta: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  etapa: Etapa,
});

const ResultadoCompetencia = z.object({
  resumen: z.string(),
  cuentas: z.array(
    z.object({
      cuenta: z.string(),
      que_hace_bien: z.string(),
      formatos: z.array(z.string()),
      formulas_de_hook: z.array(z.string()),
      ritmo_y_edicion: z.string(),
      como_vende: z.string(),
      que_adaptar_vos: z.string(),
      datos_usados: z.string(),
    }),
  ),
  patrones_comunes: z.array(z.string()),
  oportunidades: z.array(z.string()),
  ideas: z.array(z.object({ titulo: z.string(), inspirada_en: z.string(), angulo_personal: z.string(), etapa: Etapa, hook_sugerido: z.string() })),
  limitaciones: z.string(),
});

const ResultadoCarrusel = z.object({
  titulo: z.string(),
  slides: z.array(
    z.object({
      numero: z.number().int(),
      trabajo: z.enum(["gancho", "ejemplo", "diagrama", "practica", "cta"]),
      texto: z.string(),
      visual: z.string(),
    }),
  ),
  caption: z.string(),
  hashtags: z.array(z.string()),
  etapa: Etapa,
});

const ResultadoMetricas = z.object({
  periodo: z.string(),
  resumen: z.string(),
  kpis: z.array(z.object({ nombre: z.string(), valor: z.string(), detalle: z.string() })),
  publicaciones: z.array(
    z.object({ url: z.string(), descripcion: z.string(), metrica: z.string(), valor: z.number(), multiplicador: z.number().nullable() }),
  ),
  hallazgos: z.array(z.string()),
  recomendaciones: z.array(z.object({ que: z.string(), por_que: z.string() })),
  fuente: z.string(),
  limitaciones: z.string(),
});

export type ResultadoPerfil = z.infer<typeof ResultadoPerfil>;
export type ResultadoMetricas = z.infer<typeof ResultadoMetricas>;
export type ResultadoCarrusel = z.infer<typeof ResultadoCarrusel>;
export type ResultadoCompetencia = z.infer<typeof ResultadoCompetencia>;
export type ResultadoIdeas = z.infer<typeof ResultadoIdeas>;
export type ResultadoGuion = z.infer<typeof ResultadoGuion>;

// Respuestas a preguntas que hizo el agente antes de arrancar (pedir_datos).
const Respuestas = z.array(z.object({ pregunta: z.string(), respuesta: z.string() })).optional().default([]);

export const Pedido = z.discriminatedUnion("tarea", [
  z.object({ tarea: z.literal("perfil"), creador: Creador, respuestas: Respuestas }),
  z.object({ tarea: z.literal("ideas"), creador: Creador, respuestas: Respuestas }),
  z.object({ tarea: z.literal("metricas"), creador: Creador, respuestas: Respuestas }),
  z.object({
    tarea: z.literal("competencia"),
    creador: Creador,
    respuestas: Respuestas,
    cuentas: z.array(z.string().max(40)).max(8).default([]),
    notas: z.string().max(1500).optional().default(""),
  }),
  z.object({ tarea: z.literal("guion"), creador: Creador, respuestas: Respuestas, idea: z.string().min(3) }),
  z.object({ tarea: z.literal("carrusel"), creador: Creador, respuestas: Respuestas, idea: z.string().min(3) }),
]);
export type Pedido = z.infer<typeof Pedido>;
export type Tarea = Pedido["tarea"];

export const TAREAS: Record<
  Tarea,
  { skills: string[]; esquema: z.ZodTypeAny; esfuerzo: "medium" | "high"; usaWeb: boolean; consigna: (p: Pedido) => string }
> = {
  metricas: {
    skills: ["analisis-instagram", "ig-audit"],
    esquema: ResultadoMetricas,
    esfuerzo: "high",
    usaWeb: false,
    consigna: () =>
      "Tarea: tablero de métricas de SU Instagram, para mostrar en la web. " +
      "Si tenés las herramientas de Windsor: 1) windsor_campos para ver los nombres exactos; 2) windsor_datos de los últimos 30 días " +
      "(y de 90 para comparar, si sirve) con los campos de cuenta (seguidores, alcance, vistas, interacciones) y los de cada publicación (url o id, caption, tipo, vistas, alcance, likes, comentarios, guardados, compartidos). " +
      "3) Pasá las publicaciones por calcular_outliers para saber cuáles le fueron por encima de su mediana. " +
      "Si NO hay Windsor, usá las capturas de estadísticas que haya subido. Si no hay ninguna de las dos, usá pedir_datos: pedile que conecte Windsor en Conexiones o que suba capturas de sus estadísticas. " +
      "Devolvé: 4-6 KPIs (valor tal cual sale de los datos, con el período en detalle), las 5 publicaciones que mejor le fueron con su multiplicador, 3-5 hallazgos (qué tienen en común las que funcionan, qué no funciona) y 3-5 recomendaciones concretas. " +
      "Todos los números salen de las herramientas o de las capturas: si un dato no está, no lo pongas. En 'fuente' decí de dónde salió cada cosa.",
  },
  competencia: {
    skills: ["analisis-instagram", "ig-viral", "ig-reel"],
    esquema: ResultadoCompetencia,
    esfuerzo: "high",
    usaWeb: true,
    consigna: (p) =>
      "Tarea: análisis de competencia y referentes para esta persona (marca personal). " +
      `Cuentas que eligió: ${p.tarea === "competencia" && p.cuentas.length ? p.cuentas.map((c) => "@" + c.replace(/^@/, "")).join(", ") : "ninguna todavía"}. ` +
      `${p.tarea === "competencia" && p.notas ? `Lo que le gusta de ellas: ${p.notas}. ` : ""}` +
      "Fuentes, en este orden: 1) obtener_perfil_instagram de cada cuenta (outliers calculados con código); 2) las capturas y los cuadros de videos que adjuntó " +
      "(cada imagen dice de qué es); 3) web_search/web_fetch para completar. " +
      "Si no eligió cuentas, proponé 3-5 de su nicho y tamaño parecido con web_search y aclaralo. " +
      "Si con lo que hay no podés analizar en serio (ni API, ni capturas, ni datos en la web), usá pedir_datos y pedile: los @ que le interesan, capturas de esos perfiles (arriba + grilla) y videos que le gusten. " +
      "Por cuenta: qué hace bien, formatos, fórmulas de hook (ig-reel), ritmo y edición (lo que se ve en los cuadros), cómo vende y qué adaptaría ESTA persona con su historia. " +
      "Después: patrones que se repiten, oportunidades (lo que nadie está haciendo y ella puede) y 5 ideas concretas inspiradas en lo analizado. Nunca inventes números: decí de dónde sale cada dato.",
  },
  perfil: {
    skills: ["analisis-instagram", "ig-profile", "ig-audit"],
    esquema: ResultadoPerfil,
    esfuerzo: "medium",
    usaWeb: false,
    consigna: () =>
      "Tarea: diagnóstico del perfil de Instagram de esta persona (marca personal). " +
      "Fuentes, en este orden: obtener_perfil_instagram con su usuario, sus métricas de Windsor si están, y las capturas adjuntas. " +
      "Si no tenés datos reales de su perfil (la API no responde y no hay capturas), usá pedir_datos y pedile capturas: la parte de arriba del perfil, la grilla y las estadísticas de 2 o 3 reels. " +
      "Puntuá los 12 criterios de rubric.json (en el resultado, nombres de criterio en español), escribí los cambios en orden de impacto " +
      "y los textos listos para copiar (nombre, bio, destacadas, 3 fijados). Si un criterio no se puede ver con los datos que hay, decilo en la observación y no lo inventes.",
  },
  ideas: {
    skills: ["analisis-instagram", "ig-viral"],
    esquema: ResultadoIdeas,
    esfuerzo: "medium",
    usaWeb: true,
    consigna: () =>
      "Tarea: ideas virales de SU nicho que estén funcionando ahora. " +
      "1) Con web_search encontrá 4-8 cuentas de su nicho, de habla hispana y de tamaño parecido. " +
      "2) Para cada cuenta usá obtener_perfil_instagram: trae sus posts con el multiplicador ya calculado con código. " +
      "Si no hay API, buscá datos públicos con web_search/web_fetch y pasalos por calcular_outliers. " +
      "3) Quedate con 6-8 posts de más de 1,5x. Para cada uno: por qué funcionó, la fórmula del hook y cómo lo grabaría ESTA persona con su historia (ángulo personal) " +
      "y para qué etapa sirve (atraer, confianza o vender). Si no hay multiplicador real, poné null y explicalo en limitaciones.",
  },
  carrusel: {
    skills: ["carrusel-10", "ig-carousel", "ig-caption", "ig-human"],
    esquema: ResultadoCarrusel,
    esfuerzo: "high",
    usaWeb: false,
    consigna: (p) =>
      `Tarea: idear un carrusel de Instagram a partir de esta idea: "${p.tarea === "carrusel" ? p.idea : ""}". ` +
      "Seguí la estructura de carrusel-10: 1 gancho, 2-3 ejemplo, 4-5 diagramas, 6-9 información práctica, 10 CTA simple " +
      "(si la idea pide menos slides, ajustá pero mantené el orden de los trabajos). " +
      "Por cada slide: el texto exacto (corto, una idea) y en 'visual' qué imagen, diagrama o captura iría, descripto para que la persona la arme o la pida a un generador de imágenes. " +
      "No generes imágenes. Sumá caption y 3-5 hashtags. Escribilo con su voz (captions de ejemplo) y pasalo por ig-human.",
  },
  guion: {
    skills: ["ig-reel", "ig-caption", "ig-human"],
    esquema: ResultadoGuion,
    esfuerzo: "high",
    usaWeb: false,
    consigna: (p) =>
      `Tarea: guion de un reel para hablar a cámara a partir de esta idea: "${p.tarea === "guion" ? p.idea : ""}". ` +
      "3 hooks con fórmula y puntaje, guion por tramos de segundos (lo que dice y el texto en pantalla), un CTA que lleve a lo que vende, " +
      "caption y 3-5 hashtags. Escribilo con la voz de sus captions de ejemplo y pasalo por las reglas de ig-human.",
  },
};
