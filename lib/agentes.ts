// El equipo de Hookia: un agente por área, cada uno con su conocimiento (skills), sus datos y su chat.
// Lo usan la web (nombre, saludo, sugerencias) y el servidor (skills y búsqueda web de cada uno).
import indice from "@/conocimiento/indice.json";

export type IdAgente = "coach" | "perfil" | "metricas" | "reels" | "ideas" | "competencia" | "contenido" | "novedades" | "estrategia" | "editor";

export type Agente = {
  nombre: string;
  rol: string;
  /** Lo que sabe y lo que calcula, para mostrarlo en la app (su valor agregado frente a un chat cualquiera). */
  sabe: string[];
  calcula: string[];
  /** Secciones del informe "Las métricas que importan" que lleva en su system prompt. */
  conocimiento: string[];
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
    sabe: ["Las 12 conclusiones del informe \"Las métricas que importan\"", "Cómo decide Instagram a quién mostrarte (fuentes oficiales)", "Los mitos que no sirven"],
    calcula: [],
    conocimiento: ["01", "02", "10"],
    skills: ["analisis-instagram", "ig-human"],
    usaWeb: false,
    lee: ["perfil", "metricas", "ideas"],
    saludo: "Hola. Soy tu coach: tengo a mano lo que analizaron los demás. ¿Por dónde arrancamos?",
    sugerencias: ["¿Qué hago primero esta semana?", "¿Qué es lo que más me está frenando?", "Armame un plan para crecer este mes"],
  },
  perfil: {
    nombre: "Analista de perfil",
    rol: "Mira tu perfil con la rúbrica de 12 criterios y te reescribe la bio, el nombre y las destacadas.",
    sabe: ["La rúbrica de 12 criterios para perfiles (Jake Schincariol)", "Marca personal: confianza, caras y autenticidad (informe)", "El camino de la visita al perfil al seguidor y al cliente (informe)"],
    calcula: ["Tu nota de 0 a 100: suma los 12 criterios y solo cambia si cambió tu perfil"],
    conocimiento: ["07", "09"],
    skills: ["ig-profile", "ig-human"],
    usaWeb: false,
    lee: ["perfil"],
    saludo: "Soy el analista de tu perfil. Preguntame por la nota, la bio o qué cambiar primero.",
    sugerencias: ["¿Por qué tengo esta nota?", "Dame otra versión de la bio", "¿Qué destacadas pongo?"],
  },
  metricas: {
    nombre: "Analista de métricas",
    rol: "Lee tus números con el informe \"Las métricas que importan\" y te dice qué está bien, qué está mal y qué hacer.",
    sabe: ["El informe completo \"Las métricas que importan\" (28 páginas, oct-2026)", "Benchmarks por tamaño de cuenta"],
    calcula: ["Tu puntaje de 0 a 100 con los pesos del informe", "El semáforo de gancho, retención, recompensa y conversión", "Las reglas de qué mejorar, en orden", "A qué hora publicar"],
    conocimiento: [],
    skills: ["metricas-que-importan"],
    usaWeb: false,
    lee: ["metricas"],
    saludo: "Soy tu analista de métricas. Leo tus números con el informe de las métricas que importan. ¿Qué querés saber?",
    sugerencias: ["¿Por qué tengo este puntaje?", "¿Qué indicador mejoro primero?", "¿Cómo hago para que me compartan más?"],
  },
  reels: {
    nombre: "Analista de reels",
    rol: "Mira tus reels segundo a segundo: dónde se fue la gente, por qué y qué cambiar.",
    sabe: ["Cómo leer la curva de retención (informe)", "8 criterios para revisar los cuadros (investigación del equipo)", "Las fórmulas de hooks (Jake Schincariol)"],
    calcula: ["Los cuadros del gancho y de donde se fue la gente", "Tu reel contra la mediana de tus otros reels"],
    conocimiento: ["04", "05"],
    skills: ["analisis-reel", "ig-reel"],
    usaWeb: false,
    lee: ["reels"],
    saludo: "Soy el analista de tus reels. Preguntame por tus ganchos, la retención o qué reel repetir.",
    sugerencias: ["¿Qué tienen en común mis mejores reels?", "¿Cómo mejoro mis primeros 3 segundos?", "¿Qué reel debería repetir?"],
  },
  ideas: {
    nombre: "Cazador de tendencias",
    rol: "Busca lo que está funcionando en tu nicho y lo adapta a tu historia.",
    sabe: ["El método de reels virales (Jake Schincariol)", "Qué formato rinde para qué y cada cuánto publicar (informe)", "Cómo decide Instagram (informe)"],
    calcula: ["El outlier de cada reel: vistas ÷ la mediana de su cuenta"],
    conocimiento: ["02", "06", "10"],
    skills: ["ig-viral", "ig-reel"],
    usaWeb: true,
    lee: ["ideas"],
    saludo: "Soy el cazador de tendencias de tu nicho. Pedime ideas, ganchos o que te explique por qué algo funcionó.",
    sugerencias: ["Dame 3 ganchos para esta semana", "¿Por qué funcionó la primera idea?", "¿Qué está pegando en mi nicho?"],
  },
  competencia: {
    nombre: "Analista de competencia",
    rol: "Mira a las cuentas que te inspiran y te dice qué copiarles y qué hacer mejor.",
    sabe: ["El método de reels virales y las fórmulas de hooks (Jake Schincariol)", "Lo que enseñan Hormozi, Gadzhi, Cubría y Doglio (informe)"],
    calcula: ["Los outliers de las cuentas que mirás"],
    conocimiento: ["06", "08"],
    skills: ["ig-viral", "ig-reel"],
    usaWeb: true,
    lee: ["competencia"],
    saludo: "Soy el analista de tu competencia. Preguntame qué les funciona y cómo diferenciarte.",
    sugerencias: ["¿Qué hacen mejor que yo?", "¿Cómo me diferencio?", "¿Qué formato les copio?"],
  },
  contenido: {
    nombre: "Guionista",
    rol: "Escribe tus hooks, guiones, carruseles y captions con tu forma de hablar.",
    sabe: ["La ciencia del gancho: la mitad del impacto pasa en 2 segundos (informe)", "Qué llamado a la acción funciona: pedir comentarios +203 %, pedir likes −5 % (informe)", "26 fórmulas de hooks (Jake Schincariol)", "Hook – Retain – Reward (Hormozi)"],
    calcula: [],
    conocimiento: ["04", "06", "08"],
    skills: ["ig-reel", "ig-caption", "ig-human"],
    usaWeb: false,
    lee: ["guion", "carrusel"],
    saludo: "Soy tu guionista. Pedime cambios al guion, otros ganchos o un caption nuevo.",
    sugerencias: ["Haceme el gancho más corto", "Escribilo más informal", "Dame un cierre que venda"],
  },
  estrategia: {
    nombre: "Estratega",
    rol: "Mira tu contenido como un embudo de ventas y te dice qué publicar para vender lo que vendés.",
    sabe: ["El embudo de ventas y sus reglas E1 a E7 (informe)", "Lo que enseñan Hormozi, Brunson, Cubría, Doglio y Vilma Núñez (investigación del equipo)", "Marca personal (informe)"],
    calcula: ["Cuántos posts tenés en cada etapa del embudo", "Cuántos piden la compra"],
    conocimiento: ["07", "08", "09"],
    skills: ["estrategia-contenido", "ig-human"],
    usaWeb: false,
    lee: ["estrategia", "metricas"],
    saludo: "Soy tu estratega. Te ayudo a que el contenido te traiga clientes, no solo likes. ¿Qué vendés o querés vender?",
    sugerencias: ["¿Por qué no vendo con mis posts?", "Armame un regalo gratis para captar clientes", "¿Qué publico esta semana para vender?"],
  },
  editor: {
    nombre: "Editor",
    rol: "Edita tus tomas con el método de Paul (sin pausas, ritmo rápido, subtítulos cortos y auditoría antes de entregar) y copia el estilo del video que te guste, con tu marca.",
    sabe: ["El método de edición de Paul: cero pausas de más de 0,3 s y algo nuevo cada 2 o 3 segundos", "Cómo leer el estilo de un video de referencia: subtítulos, textos, zooms y color", "Cómo montar un reel de productos o lugares, para cualquier rubro", "Qué retiene a la gente en un video (informe)"],
    calcula: ["Los cortes de pausas, con ffmpeg", "Cada cuánto cambia de plano tu video de referencia", "La auditoría: pausas, cuadros negros, planos y audio a -14 LUFS"],
    conocimiento: ["04"],
    skills: ["editar-reel"],
    usaWeb: false,
    lee: [],
    saludo: "Soy tu editor. Edito con el método de Paul: cero pausas de más de 0,3 s y algo nuevo cada 2 o 3 segundos. ¿Qué querés saber?",
    sugerencias: ["¿Cómo grabo para que quede mejor?", "¿Qué pongo en los primeros 2 segundos?", "¿Cada cuánto tengo que cambiar de plano?"],
  },
  novedades: {
    nombre: "Radar del nicho",
    rol: "Todos los días a las 7:00 busca lo que pasó en tu nicho y te deja ideas frescas.",
    sabe: ["Lo que pasó esta semana en tu nicho (búsqueda en vivo)", "Formatos y frecuencia que funcionan (informe)"],
    calcula: ["Los outliers de los reels del nicho"],
    conocimiento: ["06"],
    skills: ["ig-viral"],
    usaWeb: true,
    lee: [],
    saludo: "Soy el radar de tu nicho. Preguntame qué pasó esta semana o cómo usar una novedad.",
    sugerencias: ["¿Qué novedad aprovecho hoy?", "Convertí la primera novedad en un reel", "¿Qué se viene en mi nicho?"],
  },
};

/** Qué agente hace cada tarea (para cargarle su conocimiento). */
export const AGENTE_DE_TAREA: Partial<Record<string, IdAgente>> = {
  perfil: "perfil",
  metricas: "metricas",
  reels: "reels",
  reel: "reels",
  ideas: "ideas",
  competencia: "competencia",
  guion: "contenido",
  carrusel: "contenido",
  novedades: "novedades",
  estrategia: "estrategia",
  editor: "editor",
  montaje: "editor",
  estilo: "editor",
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
  if (p.startsWith("/estrategia")) return "estrategia";
  if (p.startsWith("/video")) return "editor";
  return "coach";
}

// La investigación propia de cada agente (conocimiento/<agente>.md). Los números los cuenta scripts/investigacion.ts.
type FichaInvestigacion = { fuentes: number; recientes: number; porTipo: Record<string, number>; reglas: number; kb: number };
export const investigacionDe = (id: IdAgente) => (indice.agentes as Record<string, FichaInvestigacion | undefined>)[id];

const TIPOS_FUENTE: [string, string, string][] = [
  ["Paper", "paper académico", "papers académicos"],
  ["Estudio", "estudio con datos", "estudios con datos"],
  ["Oficial", "fuente oficial de Instagram", "fuentes oficiales de Instagram"],
  ["Creador", "creador experto", "creadores expertos"],
  ["Libro", "libro", "libros"],
  ["Prensa", "nota de prensa", "notas de prensa"],
];

/** "52 fuentes (31 de 2025-2026): 8 papers académicos, 20 estudios con datos… · 24 reglas de decisión" */
export function resumenInvestigacion(id: IdAgente) {
  const f = investigacionDe(id);
  if (!f) return "";
  const tipos = TIPOS_FUENTE.filter(([t]) => f.porTipo[t]).map(([t, uno, varios]) => `${f.porTipo[t]} ${f.porTipo[t] === 1 ? uno : varios}`);
  return `${f.fuentes} fuentes (${f.recientes} de 2025-2026): ${tipos.join(", ")} · ${f.reglas} reglas de decisión`;
}
