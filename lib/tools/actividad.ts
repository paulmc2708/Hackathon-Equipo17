// Horarios de los seguidores: promedia con código los "seguidores conectados por hora" de varios días
// (online_followers en la API de Instagram), así el modelo no hace cuentas.
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export type DiaActividad = { fecha?: string; horas: (number | null)[] };

const valido = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Promedio de cada hora (0 a 23) entre todos los días, y promedio por día de la semana. */
export function resumirActividad(dias: DiaActividad[]) {
  const suma = Array<number>(24).fill(0);
  const cuenta = Array<number>(24).fill(0);
  const semana = new Map<number, { total: number; n: number }>();
  let usados = 0;
  for (const d of dias) {
    if (!Array.isArray(d.horas) || d.horas.length !== 24) continue;
    const ok = d.horas.filter(valido);
    if (!ok.length) continue;
    usados++;
    d.horas.forEach((v, h) => {
      if (valido(v)) {
        suma[h] += v;
        cuenta[h]++;
      }
    });
    const dia = d.fecha ? new Date(`${d.fecha.slice(0, 10)}T12:00:00Z`).getUTCDay() : NaN;
    if (ok.length === 24 && !Number.isNaN(dia)) {
      const s = semana.get(dia) ?? { total: 0, n: 0 };
      semana.set(dia, { total: s.total + ok.reduce((a, b) => a + b, 0) / 24, n: s.n + 1 });
    }
  }
  const horas = suma.map((s, h) => (cuenta[h] ? Math.round(s / cuenta[h]) : 0));
  const dias_semana = [...semana.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([d, s]) => ({ dia: DIAS[d], promedio: Math.round(s.total / s.n) }));
  const mejor = dias_semana.reduce<(typeof dias_semana)[number] | null>((a, d) => (!a || d.promedio > a.promedio ? d : a), null);
  return { dias_usados: usados, horas, dias_semana, mejor_dia: mejor?.dia ?? "" };
}
