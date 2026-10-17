// El equipo de Hookia: un agente por área, cada uno con su conocimiento (skills), sus datos y su chat.
// Lo usan la web (nombre, saludo, sugerencias) y el servidor (skills y búsqueda web de cada uno).

export type IdAgente = "coach" | "perfil" | "metricas" | "reels" | "ideas" | "competencia" | "contenido" | "novedades";

export type Agente = {
  nombre: string;
  rol: string;
  /** Skills que lleva en su system prompt. */
  skills: string[];
  usaWeb: boolean;
  /** Resultados guardados de la persona que lee para contestar (tareas). */
  lee: string[];
  saludo: string;
  sugerencias: string[];
};

export const AGENTES: Record<IdAgente, Agente> = {
  coach: {
    nombre: "Coach",
    rol: "Te guía por toda la app y junta lo que encontraron los demás agentes.",
    skills: ["analisis-instagram", "ig-human"],
    usaWeb: false,
    lee: ["perfil", "metricas", "ideas"],
    saludo: "Hola. Soy tu coach: tengo a mano lo que analizaron los demás. ¿Por dónde arrancamos?",
    sugerencias: ["¿Qué hago primero esta semana?", "¿Qué es lo que más me está frenando?", "Armame un plan para crecer este mes"],
  },
  perfil: {
    nombre: "Analista de perfil",
    rol: "Mira tu perfil con la rúbrica de 12 criterios y te reescribe la bio, el nombre y las destacadas.",
    skills: ["ig-profile", "ig-human"],
    usaWeb: false,
    lee: ["perfil"],
    saludo: "Soy el analista de tu perfil. Preguntame por la nota, la bio o qué cambiar primero.",
    sugerencias: ["¿Por qué tengo esta nota?", "Dame otra versión de la bio", "¿Qué destacadas pongo?"],
  },
  metricas: {
    nombre: "Analista de métricas",
    rol: "Lee tus números con el informe \"Las métricas que importan\" y te dice qué está bien, qué está mal y qué hacer.",
    skills: ["metricas-que-importan"],
    usaWeb: false,
    lee: ["metricas"],
    saludo: "Soy tu analista de métricas. Leo tus números con el informe de las métricas que importan. ¿Qué querés saber?",
    sugerencias: ["¿Por qué tengo este puntaje?", "¿Qué indicador mejoro primero?", "¿Cómo hago para que me compartan más?"],
  },
  reels: {
    nombre: "Analista de reels",
    rol: "Mira tus reels segundo a segundo: dónde se fue la gente, por qué y qué cambiar.",
    skills: ["analisis-reel", "ig-reel"],
    usaWeb: false,
    lee: ["reels"],
    saludo: "Soy el analista de tus reels. Preguntame por tus ganchos, la retención o qué reel repetir.",
    sugerencias: ["¿Qué tienen en común mis mejores reels?", "¿Cómo mejoro mis primeros 3 segundos?", "¿Qué reel debería repetir?"],
  },
  ideas: {
    nombre: "Cazador de tendencias",
    rol: "Busca lo que está funcionando en tu nicho y lo adapta a tu historia.",
    skills: ["ig-viral", "ig-reel"],
    usaWeb: true,
    lee: ["ideas"],
    saludo: "Soy el cazador de tendencias de tu nicho. Pedime ideas, ganchos o que te explique por qué algo funcionó.",
    sugerencias: ["Dame 3 ganchos para esta semana", "¿Por qué funcionó la primera idea?", "¿Qué está pegando en mi nicho?"],
  },
  competencia: {
    nombre: "Analista de competencia",
    rol: "Mira a las cuentas que te inspiran y te dice qué copiarles y qué hacer mejor.",
    skills: ["ig-viral", "ig-reel"],
    usaWeb: true,
    lee: ["competencia"],
    saludo: "Soy el analista de tu competencia. Preguntame qué les funciona y cómo diferenciarte.",
    sugerencias: ["¿Qué hacen mejor que yo?", "¿Cómo me diferencio?", "¿Qué formato les copio?"],
  },
  contenido: {
    nombre: "Guionista",
    rol: "Escribe tus hooks, guiones, carruseles y captions con tu forma de hablar.",
    skills: ["ig-reel", "ig-caption", "ig-human"],
    usaWeb: false,
    lee: ["guion", "carrusel"],
    saludo: "Soy tu guionista. Pedime cambios al guion, otros ganchos o un caption nuevo.",
    sugerencias: ["Haceme el gancho más corto", "Escribilo más informal", "Dame un cierre que venda"],
  },
  novedades: {
    nombre: "Radar del nicho",
    rol: "Todos los días a las 7:00 busca lo que pasó en tu nicho y te deja ideas frescas.",
    skills: ["ig-viral"],
    usaWeb: true,
    lee: [],
    saludo: "Soy el radar de tu nicho. Preguntame qué pasó esta semana o cómo usar una novedad.",
    sugerencias: ["¿Qué novedad aprovecho hoy?", "Convertí la primera novedad en un reel", "¿Qué se viene en mi nicho?"],
  },
};

/** Qué agente atiende cada pantalla. */
export function agenteDe(path: string): IdAgente {
  const p = path.split("?")[0];
  if (p.startsWith("/perfil")) return "perfil";
  if (p.startsWith("/metricas")) return "metricas";
  if (p.startsWith("/reels")) return "reels";
  if (p.startsWith("/ideas")) return "ideas";
  if (p.startsWith("/competencia")) return "competencia";
  if (p.startsWith("/guiones")) return "contenido";
  if (p.startsWith("/novedades")) return "novedades";
  return "coach";
}
