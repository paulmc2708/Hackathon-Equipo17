// Cuándo publicar: pasa las horas de los seguidores conectados a la hora de esta compu y busca
// la franja de 3 h en que más se conectan. Código puro (lo usan Mis métricas e Inicio).
import type { ResultadoMetricas } from "@/lib/agent/tasks";

export type Actividad = ResultadoMetricas["actividad"];

export type Horario = {
  barras: number[]; // en la hora de la persona: 24 (una por hora) u 8 (franjas de 3 h, como en Instagram)
  paso: 1 | 3;
  desde: number; // arranque de la franja de 3 h con más seguidores conectados
  publicar: number; // una hora antes
  zonaDudosa: boolean;
};

/** Horas de diferencia con UTC de una zona horaria en una fecha (America/Los_Angeles en octubre → -7). */
function desfase(zona: string, fecha: Date): number | null {
  try {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: zona, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })
        .formatToParts(fecha)
        .map((x) => [x.type, x.value]),
    );
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - fecha.getTime()) / 36e5);
  } catch {
    return null;
  }
}

export function calcularHorario(a: Actividad | undefined): Horario | null {
  if (!a || a.fuente === "ninguna" || !Array.isArray(a.horas)) return null;
  let barras = a.horas.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  if ((barras.length !== 24 && barras.length !== 8) || !barras.some((v) => v > 0)) return null;
  let paso: 1 | 3 = barras.length === 24 ? 1 : 3;
  let zonaDudosa = false;

  // Instagram por API da las horas en otra zona (suele ser la del Pacífico): se pasan a la hora de esta compu.
  if (a.zona && a.zona !== "local") {
    const ahora = new Date();
    const origen = desfase(a.zona, ahora);
    if (origen === null) zonaDudosa = true;
    else {
      const c = ((Math.round(-ahora.getTimezoneOffset() / 60 - origen) % 24) + 24) % 24;
      if (c) {
        const src = paso === 3 ? barras.flatMap((v) => [v, v, v]) : barras;
        paso = 1;
        barras = src.map((_, h) => src[(h - c + 24) % 24]);
      }
    }
  }

  let desde = 0;
  if (paso === 3) desde = barras.indexOf(Math.max(...barras)) * 3;
  else {
    let mejor = -1;
    for (let s = 0; s < 24; s++) {
      const suma = barras[s] + barras[(s + 1) % 24] + barras[(s + 2) % 24];
      if (suma > mejor) [mejor, desde] = [suma, s];
    }
  }
  return { barras, paso, desde, publicar: (desde + 23) % 24, zonaDudosa };
}

