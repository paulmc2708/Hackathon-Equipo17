import { z } from "zod";
import { AGENTES, type IdAgente } from "../agentes";
import { IDS_CRITERIOS, RUBRICA, type Comparacion, type CriterioEvaluado } from "../perfil/rubrica";

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

// Lo que llena el modelo en el análisis del perfil. La nota NO la escribe el modelo: la suma el código con los puntos
// de cada criterio y cada criterio que no cambió conserva los del análisis anterior (lib/perfil/rubrica.ts).
const ResultadoPerfil = z.object({
  resumen: z.string(),
  // Copiado tal cual del perfil: el próximo análisis lo compara con código para saber si cambió.
  perfil_visto: z.object({ nombre: z.string(), bio: z.string(), link: z.string(), categoria: z.string(), destacadas: z.array(z.string()) }),
  criterios: z.array(z.object({ id: z.enum(IDS_CRITERIOS), puntos: z.number(), visible: z.boolean(), observacion: z.string(), cambio: z.string() })),
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

// Estrategia: el contenido mirado como embudo de ventas. La clasificación la hace la IA leyendo cada post;
// las cuentas (cuántos hay en cada etapa, cuántos piden la compra) las hace la web.
const EtapaEmbudo = z.enum(["descubrimiento", "confianza", "captacion", "conversion"]);
const ResultadoEstrategia = z.object({
  resumen: z.string(),
  posts: z.array(
    z.object({
      url: z.string(),
      titulo: z.string(),
      etapa: EtapaEmbudo,
      cta: z.enum(["ninguno", "pregunta", "comentar_palabra", "guardar", "compartir", "link", "comprar", "otro"]),
      por_que: z.string(),
    }),
  ),
  tiene_regalo: z.boolean().nullable(),
  tiene_lista: z.boolean().nullable(),
  diagnostico: z.array(z.object({ regla: z.string(), problema: z.string(), accion: z.string() })),
  conceptos: z.array(z.object({ nombre: z.string(), autor: z.string(), para_vos: z.string() })),
  semana: z.array(z.object({ titulo: z.string(), etapa: EtapaEmbudo, formato: z.enum(["reel", "carrusel", "historia"]), hook: z.string(), por_que: z.string() })),
  limitaciones: z.string(),
});
export type ResultadoEstrategia = z.infer<typeof ResultadoEstrategia>;

// El plan del Editor para un video ya cortado: el gancho de los primeros 2 s, los textos clave y las palabras mal transcriptas.
const ResultadoEditor = z.object({
  gancho: z.string(),
  textos: z.array(z.object({ texto: z.string(), desde: z.number(), hasta: z.number() })),
  correcciones: z.array(z.object({ mal: z.string(), bien: z.string() })),
  notas: z.string(),
});
export type ResultadoEditor = z.infer<typeof ResultadoEditor>;

// El montaje de un reel de producto o lugar: qué tramo de cada toma, en qué orden, con qué textos y cómo cierra.
const ResultadoMontaje = z.object({
  gancho: z.string(),
  cortes: z.array(z.object({ toma: z.number().int(), desde: z.number(), hasta: z.number(), texto: z.string() })),
  cierre: z.string(),
  notas: z.string(),
});
export type ResultadoMontaje = z.infer<typeof ResultadoMontaje>;

// El estilo de edición de un video de referencia, leído en sus cuadros: lo que la persona quiere copiar.
// Lo que se puede medir (cada cuánto cambia de plano) lo mide el código y viaja en la consigna.
const ResultadoEstilo = z.object({
  resumen: z.string(),
  subtitulos: z.object({
    hay: z.boolean(),
    posicion: z.enum(["arriba", "centro", "abajo"]),
    tamano: z.enum(["chico", "mediano", "grande", "enorme"]),
    mayusculas: z.boolean(),
    palabras: z.number().int(),
    letra: z.enum(["moderna", "gruesa", "condensada", "redondeada", "serif", "manuscrita"]),
    fondo: z.enum(["ninguno", "borde", "sombra", "pastilla", "caja"]),
    animacion: z.enum(["aparece", "pop", "golpe", "sube", "palabra_por_palabra"]),
    resaltar: z.boolean(),
    color_texto: z.string(),
    color_resaltado: z.string(),
  }),
  textos: z.object({ gancho: z.boolean(), posicion: z.enum(["arriba", "centro"]), cantidad: z.enum(["ninguno", "pocos", "muchos"]) }),
  zoom: z.enum(["ninguno", "alternado", "lento"]),
  transicion: z.enum(["corte", "destello"]),
  color: z.object({ contraste: z.number(), saturacion: z.number(), calidez: z.number(), blanco_y_negro: z.boolean(), grano: z.boolean(), vineta: z.boolean() }),
  placa_final: z.boolean(),
  que_copio: z.array(z.string()),
  impronta: z.string(),
});
export type ResultadoEstilo = z.infer<typeof ResultadoEstilo>;

// Respuesta del chat de un agente: corta, y si conviene, hasta 2 accesos a la sección donde se hace.
const ResultadoChat = z.object({
  respuesta: z.string(),
  acciones: z.array(z.object({ texto: z.string(), destino: z.enum(["perfil", "metricas", "reels", "ideas", "competencia", "guion", "novedades"]), idea: z.string() })),
});
export type ResultadoChat = z.infer<typeof ResultadoChat>;

export type ResultadoNovedades = z.infer<typeof ResultadoNovedades>;
export type ResultadoReels = z.infer<typeof ResultadoReels>;
export type ResultadoReel = z.infer<typeof ResultadoReel>;
export type ResultadoCuenta = z.infer<typeof ResultadoCuenta>;
export type ResultadoPerfilModelo = z.infer<typeof ResultadoPerfil>;
/** Lo que recibe la web: lo del modelo más la nota, los criterios y la comparación que arma el código (lib/perfil). */
export type ResultadoPerfil = Omit<ResultadoPerfilModelo, "criterios" | "perfil_visto"> & {
  nota_total: number;
  // Los análisis guardados antes de la nota constante no traen id, visible ni cambio.
  criterios: (Omit<CriterioEvaluado, "id" | "visible" | "cambio"> & Partial<Pick<CriterioEvaluado, "id" | "visible" | "cambio">>)[];
  perfil_visto?: ResultadoPerfilModelo["perfil_visto"];
  comparacion?: Comparacion;
};
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
  z.object({ tarea: z.literal("estrategia"), creador: Creador, respuestas: Respuestas }),
  z.object({
    tarea: z.literal("montaje"),
    creador: Creador,
    respuestas: Respuestas,
    tomas: z.array(z.object({ n: z.number().int(), duracion: z.number() })).min(1).max(10),
    marca: z.string().transform((t) => t.slice(0, 80)).default(""),
    producto: z.string().transform((t) => t.slice(0, 120)).default(""),
    precio: z.string().transform((t) => t.slice(0, 60)).default(""),
    cta: z.string().transform((t) => t.slice(0, 80)).default(""),
    // Del video de referencia, si hay: cada cuánto cambia de plano (medido con código) y su estilo en una frase.
    ritmo: z.number().optional(),
    estilo: z.string().transform((t) => t.slice(0, 600)).default(""),
  }),
  z.object({
    tarea: z.literal("estilo"),
    creador: Creador,
    respuestas: Respuestas,
    modo: z.enum(["habla", "productos"]).default("habla"),
    duracion: z.number(),
    planos: z.number().int(),
    ritmo: z.number(),
    cortes: z.array(z.number()).max(80).default([]),
  }),
  z.object({
    tarea: z.literal("editor"),
    creador: Creador,
    respuestas: Respuestas,
    transcripcion: z.string().transform((t) => t.slice(0, 12000)),
    duracion: z.number(),
    animacion: z.enum(["poca", "media", "mucha"]).default("media"),
    estilo: z.string().transform((t) => t.slice(0, 600)).default(""),
  }),
  z.object({
    tarea: z.literal("chat"),
    creador: Creador,
    respuestas: Respuestas,
    agente: z.enum(Object.keys(AGENTES) as [IdAgente, ...IdAgente[]]),
    mensajes: z.array(z.object({ rol: z.enum(["persona", "agente"]), texto: z.string().transform((t) => t.slice(0, 2000)) })).min(1).max(20),
    contexto: z.string().transform((t) => t.slice(0, 14000)).default(""),
  }),
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
  {
    skills: string[] | ((p: Pedido) => string[]);
    esquema: z.ZodTypeAny;
    esfuerzo: "low" | "medium" | "high";
    usaWeb: boolean | ((p: Pedido) => boolean);
    consigna: (p: Pedido) => string;
  }
> = {
  chat: {
    skills: (p) => (p.tarea === "chat" ? AGENTES[p.agente].skills : []),
    esquema: ResultadoChat,
    esfuerzo: "low",
    usaWeb: (p) => p.tarea === "chat" && AGENTES[p.agente].usaWeb,
    consigna: (p) => {
      if (p.tarea !== "chat") return "";
      const a = AGENTES[p.agente];
      return (
        `Sos ${a.nombre}, de Hookia: ${a.rol} Estás en un chat con la persona, adentro de la app. ` +
        "Contestá su ÚLTIMO mensaje usando lo que ya se analizó (en <analisis>), sus datos de <persona>, lo que sabés por tus skills y, si hace falta, sus métricas de Windsor" +
        (a.usaWeb ? " o la web" : "") +
        ". Corto: de 2 a 6 frases, en rioplatense, como un coach por WhatsApp. Concreto y con SUS datos; nunca inventes números. " +
        "Si conviene que haga algo en la app, sumá hasta 2 'acciones' (texto corto del botón, destino y, si el destino es 'guion', la 'idea' lista para escribir; si no, idea vacía). Si no hace falta, 'acciones' vacío. " +
        "Si no tenés con qué contestar, decí qué te falta en una frase (por ejemplo, que toque 'Leer mis métricas' o que suba una captura). No le hagas preguntas de más.\n\n" +
        `<analisis>\n${p.contexto || "(todavía no hay análisis guardados en esta sección)"}\n</analisis>\n\n` +
        `<chat>\n${p.mensajes.map((m) => `${m.rol === "persona" ? "Persona" : a.nombre}: ${m.texto}`).join("\n")}\n</chat>`
      );
    },
  },
  estrategia: {
    skills: ["estrategia-contenido", "ig-human"],
    esquema: ResultadoEstrategia,
    esfuerzo: "high",
    usaWeb: false,
    consigna: () =>
      "Tarea: su estrategia de contenido mirada como un embudo de ventas, con el método de la skill estrategia-contenido. No le hagas preguntas: si falta algo clave, pedilo en 'para_mejorar'. " +
      "1) Con Windsor, traé sus últimas 30 publicaciones (link, fecha, tipo, caption, alcance, guardados, compartidos y comentarios) y su bio con el link. Si no hay Windsor, usá <persona> y las capturas. " +
      "2) Clasificá cada publicación en una etapa (descubrimiento, confianza, captacion o conversion) por su tema y su llamado a la acción, y poné su 'cta'. 'titulo': de 5 a 8 palabras que la identifiquen; 'por_que': una frase. " +
      "3) Por la bio, el link y los captions, decí si tiene regalo gratis (guía, clase, checklist) y lista propia (email, WhatsApp o canal): true, false o null si no se puede saber. " +
      "4) 'diagnostico': de las reglas E1 a E7 que apliquen, las 3 más importantes, cada una con 'regla' (E1…E7), 'problema' (con el dato) y 'accion' concreta. " +
      "5) 'conceptos': los 2 o 3 conceptos de la skill que más le sirvan, con su autor tal cual figura y cómo aplicarlo a SU negocio en una frase. " +
      "6) 'semana': 4 piezas para esta semana que arreglen el embudo, mezclando etapas y con a lo sumo 1 de venta, cada una con un gancho listo para decir a cámara. " +
      "7) 'resumen': 2 o 3 frases en criollo, como un coach: primero lo que viene bien, después lo que le falta para vender lo que vende. " +
      "Sin siglas. Nunca inventes números: los conteos los hace la web con tu clasificación.",
  },
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
  montaje: {
    skills: ["montaje-producto"],
    esquema: ResultadoMontaje,
    esfuerzo: "medium",
    usaWeb: false,
    consigna: (p) =>
      p.tarea !== "montaje"
        ? ""
        : "Tarea: armá el montaje de un reel con estas tomas, con el método de la skill montaje-producto. No le hagas preguntas. " +
          `Tomas: ${p.tomas.map((t) => `toma ${t.n} (${t.duracion.toFixed(1)} s)`).join(", ")}. Abrí TODAS las imágenes: cada una dice de qué toma y de qué segundo es. ` +
          `Marca: ${p.marca || "(no la pasó)"}. Producto o lugar: ${p.producto || "(no lo pasó: deducilo de las imágenes y de <persona>)"}. Precio u oferta: ${p.precio || "(no lo pasó: no pongas precio)"}. Llamado a la acción: ${p.cta || "(no lo pasó: elegí uno simple según el rubro)"}. ` +
          (p.ritmo
            ? `El video de referencia que eligió cambia de plano cada ${p.ritmo.toFixed(1)} s (medido con código): copiá ese ritmo, con cortes de entre ${Math.max(0.5, p.ritmo * 0.7).toFixed(1)} y ${Math.min(3.2, Math.max(1, p.ritmo * 1.4)).toFixed(1)} s. `
            : "Cortes de entre 1,2 y 3 s. ") +
          (p.estilo ? `Su estilo, para que el montaje se le parezca: ${p.estilo} ` : "") +
          "1) 'gancho': de 2 a 6 palabras para los primeros 2 segundos. " +
          "2) 'cortes': en orden, cada uno con su 'toma' (número), 'desde' y 'hasta' en segundos DENTRO de esa toma (total entre 12 y 30 s según lo que haya) y 'texto' de 0 a 4 palabras (vacío si no suma). El primer corte es el más llamativo. " +
          "3) 'cierre': el llamado a la acción en pocas palabras, para la placa final. 4) 'notas': una frase con qué grabar mejor la próxima vez.",
  },
  estilo: {
    skills: ["copiar-estilo"],
    esquema: ResultadoEstilo,
    esfuerzo: "medium",
    usaWeb: false,
    consigna: (p) =>
      p.tarea !== "estilo"
        ? ""
        : "Tarea: leé el estilo de edición de este video de referencia, con el método de la skill copiar-estilo. No le hagas preguntas. " +
          `Medido con código (no lo cambies): dura ${p.duracion.toFixed(1)} s y tiene ${p.planos} plano${p.planos === 1 ? "" : "s"}: cambia de plano cada ${p.ritmo.toFixed(1)} s en promedio` +
          (p.cortes.length ? ` (cortes en los segundos ${p.cortes.slice(0, 30).map((c) => c.toFixed(1)).join(", ")})` : "") +
          ". Abrí TODAS las imágenes: son cuadros SEGUIDOS de la referencia y cada una dice de qué tramo es y cada cuánto hay un cuadro (el gancho, de 0 a 3 s cada 0,2 s; los subtítulos en movimiento, cada 0,15 s; las transiciones, alrededor de cortes medidos; un recorrido de todo el video; y el cierre). " +
          "Compará cuadros seguidos para ver cómo se MUEVE: cómo entra cada texto (aparece, pop, golpe, sube o palabra por palabra), cuántas palabras hay a la vez, si se resalta la palabra que se dice, cada cuánto aparece un texto nuevo, si hay zooms y cómo son las transiciones. " +
          `El estilo se va a usar para editar un video de la persona ${p.modo === "productos" ? "mostrando productos o lugares, sin hablar a cámara" : "hablando a cámara"}. ` +
          "Completá cada campo con lo que VES; si algo no se distingue, elegí lo más parecido y aclaralo en 'resumen'. 'color_texto' y 'color_resaltado' en formato #RRGGBB. " +
          "'que_copio': de 3 a 6 cosas concretas que se van a copiar, cortas (por ejemplo: 'Subtítulos de 1 palabra, en mayúsculas, al centro'). " +
          "'impronta': en una frase, cómo lo adaptás a <persona> (su color, su @, su forma de hablar) para que sea suyo y no una copia.",
  },
  editor: {
    skills: ["editar-reel"],
    esquema: ResultadoEditor,
    esfuerzo: "medium",
    usaWeb: false,
    consigna: (p) =>
      p.tarea !== "editor"
        ? ""
        : "Tarea: sos el editor de este reel, con el método de la skill editar-reel. El video ya está cortado sin pausas; abajo va lo que dice, con el segundo en que arranca cada tramo. No le hagas preguntas. " +
          `Dura ${p.duracion.toFixed(1)} s. Animación pedida: ${p.animacion} (poca: solo en lo clave; media: algo nuevo cada 2 o 3 s; mucha: cada 1,5 a 2 s). ` +
          (p.estilo ? `Eligió un video de referencia; copiá cómo usa los textos (cuántos, cómo arranca): ${p.estilo} ` : "") +
          "1) 'gancho': la promesa del video en 2 a 6 palabras, para mostrar grande en los primeros 2 segundos (no repitas la primera frase tal cual: decí qué gana el que mira). " +
          "2) 'textos': los textos clave en pantalla, desde el segundo 2,2 en adelante y según la animación pedida, cada uno de 1 a 4 palabras (un dato, una palabra clave, un ítem de una lista) que caiga justo cuando lo dice ('desde' y 'hasta' en segundos, entre 0,8 y 2 s cada uno, sin pisarse). Nada de relleno. " +
          "3) 'correcciones': palabras que whisper escribió mal (nombres, marcas, términos del nicho), con cómo van bien. 4) 'notas': una frase sobre qué mejorar al grabar el próximo. " +
          `\n\nLo que dice:\n${p.transcripcion}`,
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
      "Puntuá los 12 criterios de rubric.json: uno por cada id, con 'puntos' enteros entre 0 y su máximo (" +
      RUBRICA.map((c) => `${c.id} ${c.maximo}`).join(", ") +
      "). La nota total la suma el sistema con esos puntos: no la escribas en ningún texto. " +
      "Si un criterio no se puede ver con los datos que hay, poné visible=false, decilo en la observación y no lo inventes. " +
      "En 'perfil_visto' copiá TAL CUAL lo que ves del perfil (el nombre en negrita, la bio completa, el link, la categoría y los nombres de las destacadas); vacío si no se ve. " +
      "'cambio' va vacío, salvo que abajo venga una evaluación anterior y ese criterio haya cambiado en el perfil. " +
      "Escribí los cambios en orden de impacto y los textos listos para copiar (nombre, bio, destacadas, 3 fijados). " +
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
