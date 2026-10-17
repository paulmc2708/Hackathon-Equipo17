// Tablero de "Las métricas que importan" (informe de oct-2026, sección 11): puntaje 0-100, los 4 indicadores de oro
// con semáforo y las reglas de "qué mejorar". Todo con código sobre los datos reales: la IA después lo explica.
// Umbrales y pesos: los del informe (son una propuesta suya: Instagram no publica ni pesos ni umbrales).

export type CtaTipo = "ninguno" | "pregunta" | "comentar_palabra" | "guardar" | "compartir" | "link" | "comprar" | "otro";

export type PostDatos = {
  url?: string;
  fecha?: string;
  tipo?: "reel" | "carrusel" | "imagen" | "otro";
  duracion_s?: number | null;
  vistas?: number | null;
  alcance?: number | null;
  alcance_no_seguidores?: number | null;
  likes?: number | null;
  comentarios?: number | null;
  guardados?: number | null;
  compartidos?: number | null;
  tiempo_promedio_s?: number | null;
  salteo_pct?: number | null;
  seguidores_ganados?: number | null;
  hashtags?: number | null;
  cta?: CtaTipo | null;
};

export type CuentaDatos = {
  seguidores?: number | null;
  visitas_perfil_30d?: number | null;
  seguidores_ganados_30d?: number | null;
  seguidores_netos_30d?: number | null;
  vende?: boolean;
};

export type Semaforo = "bien" | "mejorable" | "a_trabajar" | "sin_dato";
export type IdIndicador = "gancho" | "retencion" | "recompensa" | "conversion";
export type Indicador = { id: IdIndicador; nombre: string; que_mide: string; valor: string; semaforo: Semaforo; comparacion: string; puntos: number | null };
export type Regla = { regla: number; prioridad: number; mensaje: string; dato: string };
export type Tablero = {
  puntaje: number | null;
  indicadores: Indicador[];
  componentes: { nombre: string; peso: number; puntos: number | null }[];
  problemas: Regla[];
  buenos: { mensaje: string; dato: string; url?: string }[];
  constancia: { por_semana: number; semanas_en_cero: number } | null;
  posts_evaluados: number;
  pocos_posts: boolean;
  tamano: string;
};

const DIA = 864e5;
const n = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
function mediana(xs: number[]) {
  const o = xs.filter(n).sort((a, b) => a - b);
  if (!o.length) return null;
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}
/** Interpola puntos 0-100 entre pares [valor, puntos] (ordenados por valor). */
function escala(v: number, tramos: [number, number][]) {
  if (v <= tramos[0][0]) return tramos[0][1];
  for (let i = 1; i < tramos.length; i++) {
    const [x0, y0] = tramos[i - 1], [x1, y1] = tramos[i];
    if (v <= x1) return y0 + ((v - x0) / (x1 - x0)) * (y1 - y0);
  }
  return tramos[tramos.length - 1][1];
}
const pct = (v: number, dec = 0) => `${v.toLocaleString("es", { maximumFractionDigits: dec })} %`;
const deCada10 = (p: number) => Math.round(p / 10);

// Benchmarks por tamaño de cuenta (sección 05 del informe).
const TAMANOS = [
  { hasta: 1000, nombre: "menos de 1.000", salteo: 65.5, interaccion: 5.2 },
  { hasta: 5000, nombre: "1.000 a 5.000", salteo: 65.5, interaccion: 4.6 },
  { hasta: 10000, nombre: "5.000 a 10.000", salteo: 65.3, interaccion: 4.1 },
  { hasta: 50000, nombre: "10.000 a 50.000", salteo: 63.4, interaccion: 3.7 },
  { hasta: 100000, nombre: "50.000 a 100.000", salteo: 62.6, interaccion: 3.6 },
  { hasta: Infinity, nombre: "más de 100.000", salteo: 60.5, interaccion: 3.5 },
];

export function evaluarTablero(todos: PostDatos[], cuenta: CuentaDatos = {}, hoy = new Date()): Tablero {
  const t = hoy.getTime();
  const edad = (p: PostDatos) => (p.fecha ? (t - new Date(p.fecha.length <= 10 ? `${p.fecha}T12:00:00` : p.fecha).getTime()) / DIA : NaN);
  // Un post se evalúa recién después de 72 h (el 65-76 % de las vistas llega en 3 días).
  const maduros = todos.filter((p) => !(edad(p) < 3));
  let ventana = maduros.filter((p) => edad(p) <= 30);
  if (ventana.length < 5) ventana = maduros.filter((p) => !(edad(p) > 90));
  const base = maduros.filter((p) => !(edad(p) > 90));
  const reels = ventana.filter((p) => p.tipo === "reel" || p.tipo === undefined);
  const tam = TAMANOS.find((x) => (cuenta.seguidores ?? 0) < x.hasta) ?? TAMANOS[0];
  const tasa = (p: PostDatos, k: "compartidos" | "guardados" | "likes" | "comentarios") => (n(p[k]) && n(p.alcance) && p.alcance! > 0 ? p[k]! / p.alcance! : null);

  // 1. Gancho: % que se va en los primeros 3 s.
  const salteo = mediana(reels.map((p) => p.salteo_pct).filter(n));
  const gancho: Indicador = {
    id: "gancho",
    nombre: "Gancho",
    que_mide: "Cuántos se quedan después de los primeros 3 segundos",
    valor: salteo === null ? "Sin dato" : `${deCada10(100 - salteo)} de cada 10 se quedan`,
    semaforo: salteo === null ? "sin_dato" : salteo < 55 ? "bien" : salteo <= 68 ? "mejorable" : "a_trabajar",
    comparacion: salteo === null ? "Instagram no mandó el salteo de tus reels." : `Se va el ${pct(salteo)}; en cuentas de tu tamaño se va el ${pct(tam.salteo, 1)}.`,
    puntos: salteo === null ? null : escala(salteo, [[40, 100], [55, 75], [68, 40], [85, 0]]),
  };

  // 2. Retención: tiempo promedio visto ÷ duración.
  const vistos = reels.map((p) => (n(p.tiempo_promedio_s) && n(p.duracion_s) && p.duracion_s! > 0 ? Math.min(100, (p.tiempo_promedio_s! / p.duracion_s!) * 100) : null)).filter(n);
  const visto = mediana(vistos);
  const segundos = mediana(reels.map((p) => p.tiempo_promedio_s).filter(n));
  const retencion: Indicador = {
    id: "retencion",
    nombre: "Retención",
    que_mide: "Cuánto de cada video miran",
    valor: visto !== null ? `Miran el ${pct(visto)} de cada video` : segundos !== null ? `Miran ${segundos.toLocaleString("es", { maximumFractionDigits: 1 })} s en promedio` : "Sin dato",
    semaforo: visto === null ? "sin_dato" : visto > 50 ? "bien" : visto >= 35 ? "mejorable" : "a_trabajar",
    comparacion: visto !== null ? "En videos cortos, lo normal es ver cerca del 45 %." : segundos !== null ? "En Instagram se mira un reel 8,5 s en promedio." : "Falta el tiempo promedio de tus reels.",
    puntos: visto === null ? null : escala(visto, [[15, 0], [35, 40], [50, 75], [70, 100]]),
  };

  // 3. Recompensa: envíos por alcance (contra tu propia mediana de 90 días) y guardados.
  const envAhora = mediana(ventana.map((p) => tasa(p, "compartidos")).filter(n));
  const envBase = mediana(base.map((p) => tasa(p, "compartidos")).filter(n));
  const hayHistoria = base.length > ventana.length;
  const ratio = envAhora !== null && envBase ? envAhora / envBase : null;
  const guardAhora = mediana(ventana.map((p) => tasa(p, "guardados")).filter(n));
  const recompensa: Indicador = {
    id: "recompensa",
    nombre: "Recompensa",
    que_mide: "Cuántos te comparten y te guardan",
    valor: envAhora === null ? "Sin dato" : `De cada 100 que te ven, ${(envAhora * 100).toLocaleString("es", { maximumFractionDigits: 1 })} te comparten`,
    semaforo: envAhora === null || ratio === null || !hayHistoria ? (envAhora === null ? "sin_dato" : "mejorable") : ratio > 1.25 ? "bien" : ratio >= 0.8 ? "mejorable" : "a_trabajar",
    comparacion:
      envAhora === null
        ? "Faltan los compartidos de tus posts."
        : hayHistoria && ratio !== null
          ? `${ratio >= 1 ? "Más" : "Menos"} que tu propio promedio (${ratio.toLocaleString("es", { maximumFractionDigits: 1 })} veces).${guardAhora !== null ? ` Y ${(guardAhora * 100).toLocaleString("es", { maximumFractionDigits: 1 })} de cada 100 te guardan.` : ""}`
          : `Todavía no hay historial tuyo para comparar.${guardAhora !== null ? ` ${(guardAhora * 100).toLocaleString("es", { maximumFractionDigits: 1 })} de cada 100 te guardan.` : ""}`,
    puntos: ratio === null || !hayHistoria ? null : escala(ratio, [[0.5, 0], [0.8, 40], [1, 60], [1.25, 80], [1.5, 100]]),
  };

  // 4. Conversión: visitas al perfil → seguidores.
  const visitaSeguidor = n(cuenta.visitas_perfil_30d) && cuenta.visitas_perfil_30d! > 0 && n(cuenta.seguidores_ganados_30d) ? (cuenta.seguidores_ganados_30d! / cuenta.visitas_perfil_30d!) * 100 : null;
  const conversion: Indicador = {
    id: "conversion",
    nombre: "Conversión",
    que_mide: "Cuántos de los que entran a tu perfil te siguen",
    valor: visitaSeguidor === null ? "Sin dato" : `De cada 100 que entran a tu perfil, ${Math.round(visitaSeguidor)} te siguen`,
    semaforo: visitaSeguidor === null ? "sin_dato" : visitaSeguidor > 18 ? "bien" : visitaSeguidor >= 10 ? "mejorable" : "a_trabajar",
    comparacion: visitaSeguidor === null ? "Faltan las visitas al perfil o los seguidores ganados." : "Lo normal es que te sigan entre 13 y 18 de cada 100.",
    puntos: visitaSeguidor === null ? null : escala(visitaSeguidor, [[3, 0], [10, 40], [18, 80], [25, 100]]),
  };

  // Comunidad (plata): likes + comentarios + guardados por alcance, contra cuentas de tu tamaño.
  const comunidad = mediana(
    ventana.map((p) => (n(p.alcance) && p.alcance! > 0 ? ((p.likes ?? 0) + (p.comentarios ?? 0) + (p.guardados ?? 0)) / p.alcance! : null)).filter(n),
  );
  const puntosComunidad = comunidad === null ? null : escala((comunidad * 100) / tam.interaccion, [[0, 0], [0.5, 20], [1, 60], [1.5, 100]]);

  // Constancia: posts por semana en las últimas 4 semanas y semanas sin publicar.
  const ult28 = todos.filter((p) => edad(p) <= 28);
  const conFecha = todos.some((p) => !Number.isNaN(edad(p)));
  const semanas = [0, 1, 2, 3].map((s) => ult28.filter((p) => edad(p) > s * 7 && edad(p) <= (s + 1) * 7).length);
  const constancia = conFecha ? { por_semana: ult28.length / 4, semanas_en_cero: semanas.filter((x) => x === 0).length } : null;
  const puntosConstancia = constancia ? Math.max(0, escala(constancia.por_semana, [[0, 0], [1, 35], [2, 55], [3, 80], [5, 100]]) - constancia.semanas_en_cero * 10) : null;

  // Puntaje: pesos del informe; si falta un dato, su peso se reparte entre los demás.
  const componentes = [
    { nombre: "Gancho", peso: 20, puntos: gancho.puntos },
    { nombre: "Retención", peso: 20, puntos: retencion.puntos },
    { nombre: "Envíos", peso: 20, puntos: recompensa.puntos },
    { nombre: "Conversión a seguidores", peso: 15, puntos: conversion.puntos },
    { nombre: "Respuesta de tu comunidad", peso: 10, puntos: puntosComunidad },
    { nombre: "Constancia", peso: 10, puntos: puntosConstancia },
    { nombre: "Originalidad", peso: 5, puntos: null },
  ].map((c) => ({ ...c, puntos: c.puntos === null ? null : Math.round(Math.max(0, Math.min(100, c.puntos))) }));
  const conDato = componentes.filter((c) => c.puntos !== null);
  const puntaje = conDato.length >= 2 ? Math.round(conDato.reduce((a, c) => a + c.peso * c.puntos!, 0) / conDato.reduce((a, c) => a + c.peso, 0)) : null;

  // Reglas de "qué mejorar" (sección 11). Prioridad: gancho → retención → compartidos → conversión → constancia → el resto.
  const problemas: Regla[] = [];
  const sumar = (regla: number, prioridad: number, mensaje: string, dato: string) => problemas.push({ regla, prioridad, mensaje, dato });
  if (salteo !== null && salteo > 68)
    sumar(1, 1, "La mayoría se va antes de los 3 segundos. Arrancá con el resultado final, tu cara y una frase en pantalla que genere curiosidad.", `Se va el ${pct(salteo)} en los primeros 3 s`);
  if (salteo !== null && salteo <= 68 && visto !== null && visto < 35)
    sumar(2, 2, "Enganchás bien pero se van en el medio. Mirá el segundo donde cae la curva y cortá esa parte. Más cortes, menos pausas.", `Miran el ${pct(visto)} de cada video`);
  const durMed = mediana(reels.map((p) => p.duracion_s).filter(n));
  if (durMed !== null && durMed > 90 && visto !== null && visto < 50)
    sumar(3, 2.5, "Tus videos son largos para lo que retienen. Probá versiones de 30 a 60 segundos.", `Tus reels duran ${Math.round(durMed)} s`);
  if (hayHistoria && ratio !== null && ratio < 0.8)
    sumar(4, 3, "Tu contenido gusta pero no se comparte. Hacé posts que la gente quiera mandarle a un amigo: un dato útil, algo con lo que se identifiquen, algo gracioso de tu nicho.", `Te comparten ${ratio.toLocaleString("es", { maximumFractionDigits: 1 })} veces tu promedio`);
  const noSeg = mediana(ventana.map((p) => (n(p.alcance_no_seguidores) && n(p.alcance) && p.alcance! > 0 ? (p.alcance_no_seguidores! / p.alcance!) * 100 : null)).filter(n));
  if (noSeg !== null && noSeg < 20)
    sumar(5, 3.5, "Casi solo te ven tus seguidores. Para crecer necesitás reels que se compartan: probá los reels de prueba para testear ideas con gente nueva.", `El ${pct(noSeg)} de tu alcance es gente que no te sigue`);
  if (visitaSeguidor !== null && visitaSeguidor < 10)
    sumar(6, 4, "La gente entra a tu perfil pero no te sigue. Revisá: foto con tu cara, bio que diga qué ganan siguiéndote y que tus últimos posts se vean coherentes.", `Te siguen ${Math.round(visitaSeguidor)} de cada 100 que entran`);
  if (constancia && (constancia.por_semana < 3 || constancia.semanas_en_cero > 0))
    sumar(7, 5, "Publicar 3 veces por semana duplica el crecimiento frente a 1 o 2. Las semanas sin publicar te frenan.", `${constancia.por_semana.toLocaleString("es", { maximumFractionDigits: 1 })} posts por semana${constancia.semanas_en_cero ? `, ${constancia.semanas_en_cero} semana(s) sin publicar` : ""}`);
  const conTipo = ventana.filter((p) => p.tipo);
  if (conTipo.length >= 4 && conTipo.filter((p) => p.tipo === "imagen").length / conTipo.length > 0.5)
    sumar(8, 6, "Las fotos sueltas perdieron casi la mitad de su interacción este año. Pasá a reels (para llegar a gente nueva) y carruseles (para que te guarden).", "Más de la mitad de tus posts son fotos sueltas");
  if (conTipo.length >= 3 && !conTipo.some((p) => p.tipo === "reel"))
    sumar(9, 6.5, "Sin reels es muy difícil llegar a gente nueva: logran el doble de alcance que una foto.", "Ningún reel en este período");
  const conCta = ventana.filter((p) => p.cta);
  if (conCta.length >= 4 && conCta.filter((p) => p.cta === "ninguno").length / conCta.length >= 0.6)
    sumar(11, 7, "Terminá con una pregunta real. Pedir comentarios los triplica; pedir likes no sirve.", "La mayoría de tus posts no pide nada");
  if (conCta.length >= 4 && conCta.filter((p) => p.cta === "comprar").length / conCta.length > 0.25)
    sumar(15, 7.5, "Estás pidiendo más de lo que das. Por cada post que vende, publicá 3 que enseñen o entretengan.", "Más de 1 de cada 4 posts pide la compra");
  if (cuenta.vende && conCta.length >= 3 && !conCta.some((p) => p.cta === "comentar_palabra" || p.cta === "link"))
    sumar(17, 8, "No sabemos qué contenido te trae ventas. Usá una palabra clave distinta por post (\"comentá GUÍA\") o un link con seguimiento.", "Ningún post con palabra clave o link propio");
  const conHash = ventana.filter((p) => n(p.hashtags));
  if (conHash.length >= 3 && (mediana(conHash.map((p) => p.hashtags!)) ?? 0) > 5)
    sumar(13, 9, "Los hashtags casi no suman alcance. Usá de 3 a 5 específicos de tu tema.", "Usás más de 5 hashtags por post");
  problemas.sort((a, b) => a.prioridad - b.prioridad);

  // Lo que salió bien: indicadores en verde y posts que rindieron el doble de su mediana.
  const buenos: Tablero["buenos"] = [];
  for (const i of [gancho, retencion, recompensa, conversion]) if (i.semaforo === "bien") buenos.push({ mensaje: `${i.nombre}: ${i.valor.toLowerCase()}.`, dato: i.comparacion });
  const medVistas = mediana(base.map((p) => p.vistas).filter(n));
  const medEnv = envBase;
  for (const p of [...ventana].sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))) {
    const x = medVistas && n(p.vistas) ? p.vistas! / medVistas : 0;
    const e = medEnv && tasa(p, "compartidos") !== null ? tasa(p, "compartidos")! / medEnv : 0;
    if (x >= 2 || e >= 2)
      buenos.push({ mensaje: "Este post funcionó el doble que tu promedio. Hacé otro parecido en los próximos 2 días.", dato: x >= 2 ? `${x.toLocaleString("es", { maximumFractionDigits: 1 })} veces tus vistas de siempre` : `te compartieron ${e.toLocaleString("es", { maximumFractionDigits: 1 })} veces más que siempre`, url: p.url });
    if (buenos.length >= 5) break;
  }
  // Un tema que ya funcionó hace 3+ meses: volver a contarlo.
  const viejo = maduros.filter((p) => edad(p) > 90 && medVistas && n(p.vistas) && p.vistas! / medVistas >= 2).sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0))[0];
  if (viejo) buenos.push({ mensaje: "Este tema ya funcionó. Volvé a contarlo con un gancho y una edición nuevos.", dato: "Un post de hace más de 3 meses que rindió el doble", url: viejo.url });

  return {
    puntaje,
    indicadores: [gancho, retencion, recompensa, conversion],
    componentes,
    problemas: problemas.slice(0, 3),
    buenos: buenos.slice(0, 3),
    constancia,
    posts_evaluados: ventana.length,
    pocos_posts: ventana.length < 5,
    tamano: tam.nombre,
  };
}
