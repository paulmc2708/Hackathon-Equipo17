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

// Respuestas a preguntas que hizo el agente antes de arrancar (pedir_datos).
const Respuestas = z.array(z.object({ pregunta: z.string(), respuesta: z.string() })).optional().default([]);

export const Pedido = z.discriminatedUnion("tarea", [
  z.object({ tarea: z.literal("perfil"), creador: Creador, respuestas: Respuestas }),
  z.object({ tarea: z.literal("ideas"), creador: Creador, respuestas: Respuestas }),
  z.object({ tarea: z.literal("guion"), creador: Creador, respuestas: Respuestas, idea: z.string().min(3) }),
]);
export type Pedido = z.infer<typeof Pedido>;
export type Tarea = Pedido["tarea"];

export const TAREAS: Record<
  Tarea,
  { skills: string[]; esquema: z.ZodTypeAny; esfuerzo: "medium" | "high"; usaWeb: boolean; consigna: (p: Pedido) => string }
> = {
  perfil: {
    skills: ["ig-profile", "ig-audit"],
    esquema: ResultadoPerfil,
    esfuerzo: "medium",
    usaWeb: false,
    consigna: () =>
      "Tarea: diagnóstico del perfil de Instagram de esta persona (marca personal). " +
      "Primero intentá obtener_perfil_instagram con su usuario. Si no hay datos, usá las capturas adjuntas. " +
      "Puntuá los 12 criterios de rubric.json (en el resultado, nombres de criterio en español), escribí los cambios en orden de impacto " +
      "y los textos listos para copiar (nombre, bio, destacadas, 3 fijados). Si un criterio no se puede ver con los datos que hay, decilo en la observación y no lo inventes.",
  },
  ideas: {
    skills: ["ig-viral"],
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
