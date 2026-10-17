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

/** Usuario provisorio de la tarea "cuenta" cuando todavía no se sabe el @ (lo saca de Windsor). */
export const SIN_USUARIO = "cuenta-de-windsor";

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
  serie: z.array(z.object({ fecha: z.string(), vistas: z.number().nullable(), alcance: z.number().nullable(), seguidores_nuevos: z.number().nullable() })),
  seguidores_total: z.number().nullable(),
  // A qué hora se conectan sus seguidores: 24 valores (uno por hora) de Windsor, u 8 (franjas de 3 h) leídos de la captura.
  actividad: z.object({
    fuente: z.enum(["windsor", "captura", "ninguna"]),
    zona: z.string(),
    horas: z.array(z.number()),
    dia: z.string(),
    mejor_dia: z.string(),
    instagram_dice: z.string(),
  }),
  bien: z.array(z.string()),
  mal: z.array(z.object({ problema: z.string(), accion: z.string() })),
  plan: z.array(
    z.object({
      paso: z.string(),
      por_que: z.string(),
      accion: z.enum(["guion", "ideas", "perfil", "ninguna"]),
      idea: z.string(),
    }),
  ),
  fuente: z.string(),
  limitaciones: z.string(),
});

const ResultadoCuenta = z.object({
  nombre: z.string(),
  usuario: z.string(),
  foto_url: z.string(),
  seguidores: z.number().nullable(),
});

const ResultadoNovedades = z.object({
  fecha: z.string(),
  nicho: z.string(),
  resumen: z.string(),
  novedades: z.array(z.object({ titulo: z.string(), que_pasa: z.string(), por_que_te_importa: z.string(), fuente: z.string(), fecha: z.string() })),
  tendencias: z.array(z.object({ que: z.string(), por_que_funciona: z.string(), ejemplo: z.string() })),
  ideas: z.array(
    z.object({
      titulo: z.string(),
      hook: z.string(),
      formato: z.enum(["reel", "carrusel", "historia"]),
      etapa: Etapa,
      por_que_hoy: z.string(),
    }),
  ),
  limitaciones: z.string(),
});

// Sus reels, con sus números (de Windsor) y el link del video para mirarlo cuadro por cuadro.
const ResultadoReels = z.object({
  reels: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      fecha: z.string(),
      caption: z.string(),
      duracion_s: z.number().nullable(),
      vistas: z.number().nullable(),
      alcance: z.number().nullable(),
      tiempo_promedio_s: z.number().nullable(),
      salteo_pct: z.number().nullable(),
      likes: z.number().nullable(),
      comentarios: z.number().nullable(),
      guardados: z.number().nullable(),
      compartidos: z.number().nullable(),
      multiplicador: z.number().nullable(),
      video_url: z.string(),
      portada_url: z.string(),
    }),
  ),
  metrica: z.string(),
  fuente: z.string(),
  limitaciones: z.string(),
});

// Diagnóstico de UN reel, segundo a segundo.
const ResultadoReel = z.object({
  veredicto: z.enum(["muy_bien", "bien", "flojo", "mal"]),
  titulo: z.string(),
  como_te_fue: z.string(),
  caidas: z.array(z.object({ segundo: z.number(), cuanto: z.string(), que_pasaba: z.string(), por_que: z.string() })),
  gancho: z.object({ nota: z.number().int().min(0).max(10), que_se_ve: z.string(), problema: z.string(), mejor: z.string() }),
  funciono: z.array(z.string()),
  para_el_proximo: z.array(z.object({ que: z.string(), por_que: z.string() })),
  criterios: z.array(z.object({ id: z.string(), nombre: z.string(), estado: z.enum(["bien", "mal", "no_se_ve"]), detalle: z.string() })),
  limitaciones: z.string(),
});

export type ResultadoNovedades = z.infer<typeof ResultadoNovedades>;
export type ResultadoReels = z.infer<typeof ResultadoReels>;
export type ResultadoReel = z.infer<typeof ResultadoReel>;
export type ResultadoCuenta = z.infer<typeof ResultadoCuenta>;
export type ResultadoPerfil = z.infer<typeof ResultadoPerfil>;
export type ResultadoMetricas = z.infer<typeof ResultadoMetricas> & {
  /** Lo calcula evaluar_tablero (código) y lo pega el servidor: no lo escribe el modelo. */
  tablero?: import("../metricas/tablero").Tablero;
  posts?: import("../metricas/tablero").PostDatos[];
};
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
  z.object({ tarea: z.literal("cuenta"), creador: Creador, respuestas: Respuestas }),
  z.object({ tarea: z.literal("novedades"), creador: Creador, respuestas: Respuestas, hoy: z.string().max(40).optional().default("") }),
  z.object({ tarea: z.literal("reels"), creador: Creador, respuestas: Respuestas }),
  z.object({
    tarea: z.literal("reel"),
    creador: Creador,
    respuestas: Respuestas,
    // Lo que se sabe del reel, ya calculado en la web (% visto, veces su promedio…), en texto.
    reel: z.object({ url: z.string().max(400).default(""), caption: z.string().transform((t) => t.slice(0, 500)).default(""), datos: z.string().transform((t) => t.slice(0, 2000)).default("") }),
  }),
  z.object({
    tarea: z.literal("competencia"),
    creador: Creador,
    respuestas: Respuestas,
    cuentas: z.array(z.string().transform((c) => c.replace(/^@/, "").replace(/[^\w.]/g, "").slice(0, 30))).max(8).default([]),
    notas: z.string().transform((t) => t.slice(0, 1500)).optional().default(""),
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
  reels: {
    skills: ["analisis-instagram"],
    esquema: ResultadoReels,
    esfuerzo: "medium",
    usaWeb: false,
    consigna: () =>
      "Tarea: traer SUS últimos reels con sus números, para analizarlos uno por uno. No le hagas preguntas. " +
      "Con Windsor: mirá qué campos hay y pedí sus publicaciones de los últimos 90 días (solo reels o videos, hasta 12, de la más nueva a la más vieja) con: id, link (permalink), fecha, caption, vistas, alcance, tiempo promedio de reproducción, tasa de salteo si existe, likes, comentarios, guardados, compartidos, y los links del video (media_url) y de la portada (thumbnail_url). " +
      "Pasá esas publicaciones por calcular_outliers (con el permalink como url) y usá el multiplicador que devuelve; si no lo calculó, null. " +
      "En 'tiempo_promedio_s' poné SEGUNDOS (si viene en milisegundos, dividí por 1000) y en 'salteo_pct' un porcentaje de 0 a 100. 'duracion_s' solo si el dato existe; si no, null. Si un dato no está, null o vacío: nunca lo inventes. " +
      "'caption': los primeros 120 caracteres. En 'metrica' decí con qué se calculó el multiplicador (vistas o interacciones) y en 'fuente' de dónde salió todo. " +
      "Si no hay Windsor, devolvé 'reels' vacío y explicalo en 'limitaciones' (la persona puede subir el video a mano).",
  },
  reel: {
    skills: ["analisis-reel", "ig-reel"],
    esquema: ResultadoReel,
    esfuerzo: "high",
    usaWeb: false,
    consigna: (p) =>
      "Tarea: diagnóstico de ESTE reel suyo, segundo a segundo, con el método de la skill analisis-reel. No le hagas preguntas. " +
      (p.tarea === "reel"
        ? `Reel: ${p.reel.url || "(lo subió a mano)"}. Caption: ${p.reel.caption || "(no hay)"}.
Sus números (calculados por la web con sus datos reales): ${p.reel.datos || "no hay: usá las capturas de estadísticas si las subió"}.
`
        : "") +
      "Abrí TODAS las imágenes: los cuadros dicen de qué segundo son; si hay una captura de la retención o de las estadísticas, leela. " +
      "1) 'caidas': de 1 a 3 momentos donde se fue la gente (de la curva si está; si no, el salteo para los primeros 3 s y el tiempo promedio para el espectador promedio). Para cada uno: el segundo, cuánto (aprox., y de dónde sale; si no hay datos de retención, 'cuanto' = 'probable, sin datos de retención'), qué pasaba en ese cuadro y por qué hace que se vayan. " +
      "2) 'gancho': nota de 0 a 10 de los primeros 3 s, qué se ve o se lee, el problema y una versión mejor lista para decir a cámara. " +
      "3) 'criterios': los 8 (C1 a C8) con estado bien, mal o no_se_ve (si no se puede ver en los cuadros, no_se_ve). " +
      "4) 'funciono': 1 a 3 cosas para repetir. 5) 'para_el_proximo': exactamente 3 acciones concretas, en orden de impacto. " +
      "'veredicto' según sus números contra su propio promedio (no contra internet). 'titulo': una frase de hasta 70 caracteres que lo resuma como lo diría un coach. " +
      "Corto y en criollo: 'como_te_fue' de 2 frases con los números; cada 'que_pasaba', 'por_que', 'problema' y 'por_que' del próximo, de una frase. Si falta algún dato, decilo en 'limitaciones'.",
  },
  novedades: {
    skills: ["analisis-instagram", "ig-viral"],
    esquema: ResultadoNovedades,
    esfuerzo: "medium",
    usaWeb: true,
    consigna: (p) =>
      `Tarea: las novedades de HOY y de ESTA SEMANA en el nicho de esta persona, para que su contenido esté fresco. Hoy es ${p.tarea === "novedades" && p.hoy ? p.hoy : "la fecha actual"}. No le hagas preguntas. ` +
      "1) Deducí su nicho y a quién le habla: de <persona> y, si tenés Windsor, de su bio, sus publicaciones y sus captions. Cada nicho es un mundo: pensá qué le importa a SU audiencia (no a la de otro nicho). " +
      "2) Con web_search buscá, en español y en inglés, lo que pasó en los últimos 7 días en ese nicho: noticias, lanzamientos, cambios, polémicas, fechas y temporadas, estudios nuevos, lo que se está comentando. Abrí las fuentes que uses (web_fetch) y quedate con 4 a 8 novedades reales, con fecha y link. Nada de notas viejas ni inventadas: si una novedad no tiene fecha de esta semana o un link que abriste, no va. " +
      "3) Buscá qué formatos y temas están pegando ahora entre creadores de ese nicho (2 a 5 tendencias), con un link de ejemplo si lo encontrás. " +
      "4) Proponé 5 ideas para publicar hoy o esta semana que aprovechen esas novedades, cruzadas con lo que la persona vende y su historia, mezclando etapas (atraer, confianza, vender) y formatos. Cada idea con un hook listo para decir. " +
      "Escribí corto, en rioplatense y sin tecnicismos: 'resumen' de 2 frases; cada 'que_pasa' y 'por_que_te_importa' de una frase. Si no encontrás novedades reales de esta semana, decilo en 'limitaciones' y no rellenes.",
  },
  cuenta: {
    skills: [],
    esquema: ResultadoCuenta,
    esfuerzo: "medium",
    usaWeb: false,
    consigna: () =>
      "Tarea corta: con las herramientas de Windsor, traé los datos de la cuenta de Instagram que la persona conectó: " +
      "el nombre que muestra su perfil (su nombre real, no el @), su usuario sin @, la URL de su foto de perfil y sus seguidores. " +
      "Mirá primero qué cuentas y campos hay. Si un dato no está, dejalo vacío (seguidores en null). No inventes nada y no hagas preguntas: devolvé accion \"resultado\".",
  },
  metricas: {
    skills: ["metricas-que-importan", "analisis-instagram"],
    esquema: ResultadoMetricas,
    esfuerzo: "high",
    usaWeb: false,
    consigna: () =>
      "Tarea: tablero de métricas de SU Instagram, para mostrar en la web. " +
      "Si tenés las herramientas de Windsor: 1) mirá qué cuentas y campos tiene disponibles; 2) pedí los datos de los últimos 30 días " +
      "(y de 90 para comparar, si sirve) con los campos de cuenta (seguidores, alcance, vistas, interacciones) y los de cada publicación (url o id, caption, tipo, vistas, alcance, likes, comentarios, guardados, compartidos). " +
      "3) Pasá las publicaciones por calcular_outliers para saber cuáles le fueron por encima de su mediana. " +
      "4) EL TABLERO (lo más importante): pedí de sus últimas publicaciones de 60 días (hasta 20), por cada una: link, fecha, tipo (reel, carrusel o imagen), duración, vistas, alcance, alcance a no seguidores, likes, comentarios, guardados, compartidos, tiempo promedio de reproducción (en segundos), tasa de salteo (0 a 100) y seguidores ganados; y de la cuenta: seguidores hoy, visitas al perfil y seguidores ganados en 30 días (y netos si hay seguidos/dejados de seguir). " +
      "Leyendo cada caption, poné su 'cta' (ninguno, pregunta, comentar_palabra, guardar, compartir, link, comprar u otro) y cuántos hashtags tiene. En 'cuenta.vende' poné true si vende algo (por <persona> o sus posts). Si un dato no está, null: no lo inventes. " +
      "Pasá todo a evaluar_tablero, que calcula con código el puntaje, los 4 indicadores con su semáforo y qué mejorar, con las reglas del informe. Después escribí, usando lo que devolvió: " +
      "'resumen' = UNA frase que resuma el puntaje como en el informe (ej: 'Tus videos enganchan mejor que el promedio; el punto débil es que pocos te comparten.'); " +
      "'bien' = hasta 3 cosas que salieron bien, con un dato concreto y qué repetir (ej: 'Tu reel del martes retuvo al 58 %: el doble de tu promedio. Repetí ese formato.'); " +
      "'mal' = los problemas que devolvió la herramienta, en ese orden y como máximo 3, cada uno en criollo ('problema', con el dato) y con su 'accion' concreta; " +
      "y que el 'plan' sean tus 3 acciones para esta semana, concretas y verificables (ej: 'Publicá 3 veces esta semana (vas 1)'), que ataquen esos problemas. Sin siglas. " +
      "Si NO hay Windsor, usá las capturas de estadísticas que haya subido. Si no hay ninguna de las dos, usá pedir_datos: pedile que conecte Windsor en Conexiones o que suba capturas de sus estadísticas. " +
      "Devolvé: 4-6 KPIs (valor tal cual sale de los datos, con el período en detalle), las 5 publicaciones que mejor le fueron con su multiplicador, 3-5 hallazgos (qué tienen en común las que funcionan, qué no funciona) y 3-5 recomendaciones concretas. " +
      "En 'seguidores_total' poné cuántos seguidores tiene HOY, tal cual sale de los datos (null si no lo tenés). " +
      "Además: 'serie' con un punto por día del período (fecha AAAA-MM-DD, vistas, alcance y seguidores nuevos de ese día; null si no hay dato), sacado tal cual de las métricas diarias. " +
      "Y 'actividad', a qué hora están conectados sus seguidores: con Windsor, buscá el campo de seguidores conectados por hora (en la API de Instagram es online_followers; en Windsor puede tener un nombre parecido). Si está, pedí los últimos 14 días, pasá cada día con sus 24 horas a resumir_actividad y copiá lo que devuelve: las 24 'horas' y 'mejor_dia'; en 'dia' poné 'Promedio de N días'. " +
      "En 'zona' poné la zona horaria de esos datos como nombre IANA: la API de Instagram suele darlos en hora del Pacífico (America/Los_Angeles); si Windsor dice otra, usá esa. fuente 'windsor'. " +
      "Si Windsor no lo tiene pero hay una captura de 'Momentos de actividad de los seguidores' (Estadísticas → Público), leé las barras de izquierda a derecha (0 h, 3 h … 21 h): la más alta vale 100 (si una está resaltada en color, con el número arriba, es esa) y las otras en proporción a su altura, por debajo de 100. Poné esos 8 números en 'horas', zona 'local', fuente 'captura', en 'dia' el día marcado arriba y en 'instagram_dice' lo que dice 'Cuándo están más activos los seguidores', tal cual (ej: 'Jueves 12 - 21'). " +
      "Si no hay ninguna de las dos: fuente 'ninguna' y lo demás vacío. Nunca pongas horarios 'promedio' de internet ni inventados. Si en el plan o en las recomendaciones decís a qué hora publicar, usá una hora antes de la franja con más seguidores conectados (si la más alta arranca a las 18 h, a las 17:00), igual que la web. " +
      "Y 'plan': exactamente 3 pasos para ESTA semana, en orden, cada uno una acción concreta que pueda hacer hoy. accion = 'guion' si el paso es grabar un reel (en 'idea' poné el tema listo para escribir el guion), 'ideas' si es buscar ideas nuevas, 'perfil' si es arreglar el perfil, 'ninguna' si no aplica (idea vacía). " +
      "Escribí corto, para alguien sin tiempo: hallazgos, 'paso' y 'que' de hasta 90 caracteres; 'por_que' de una frase de hasta 120; 'detalle' de cada KPI de hasta 40 (ej: '+320 vs. el mes anterior'); 'periodo' corto, tipo 'Últimos 30 días'; 'resumen' de 2 frases. Lo largo va en 'limitaciones'. " +
      "Todos los números salen de las herramientas o de las capturas: si un dato no está, no lo pongas. En 'fuente' decí de dónde salió cada cosa, en una línea.",
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
      "Si con lo que hay no podés analizar nada (ni API, ni capturas, ni datos en la web), usá pedir_datos con un solo pedido corto: el @ de 2 o 3 cuentas que le gusten. " +
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
      "Si no tenés NINGÚN dato real de su perfil (ni Windsor, ni API, ni capturas), usá pedir_datos con un solo pedido: una captura de la parte de arriba de su perfil. " +
      "Puntuá los 12 criterios de rubric.json (en el resultado, nombres de criterio en español), escribí los cambios en orden de impacto " +
      "y los textos listos para copiar (nombre, bio, destacadas, 3 fijados). Si un criterio no se puede ver con los datos que hay, decilo en la observación y no lo inventes. " +
      "Escribí corto, para alguien sin tiempo: 'resumen' de 2 frases (qué está bien y qué le hace perder gente), cada 'observacion' y 'por_que' de una frase, 'que' de hasta 80 caracteres. Lo largo va en 'limitaciones'.",
  },
  ideas: {
    skills: ["analisis-instagram", "ig-viral"],
    esquema: ResultadoIdeas,
    esfuerzo: "medium",
    usaWeb: true,
    consigna: () =>
      "Tarea: ideas virales de SU nicho que estén funcionando ahora. No le hagas preguntas: trabajá con lo que ves. " +
      "0) Deducí su nicho y a quién le habla: de <persona> y, si tenés Windsor, de su bio, sus publicaciones y sus captions. Escribilo en 'nicho'. " +
      "Si adjuntó capturas de su lista de Seguidos, leé esos @ y quedate con los creadores de su nicho: son las primeras cuentas a analizar. " +
      "1) Completá con web_search hasta 4-8 cuentas de su nicho, de habla hispana y de tamaño parecido. " +
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
