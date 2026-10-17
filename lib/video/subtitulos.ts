// Subtítulos y textos en pantalla con el preset de Paul: bloques de 1 a 3 palabras, en zona segura
// (nunca en el tercio de abajo, donde va la descripción de Instagram), y textos que entran con un "pop" corto.
// Se arma un archivo .ass (libass) y ffmpeg lo quema en el video.
import type { Palabra } from "./transcribir";

export type EstiloSub = "limpios" | "resaltado" | "pastilla";
export type TextoPantalla = { texto: string; desde: number; hasta: number };
type Bloque = { texto: string; desde: number; hasta: number; palabras: Palabra[] };

/** Bloques de 1 a 3 palabras: corta en la puntuación, en las pausas, a las 3 palabras o si se hace largo. */
export function bloques(palabras: Palabra[]): Bloque[] {
  const out: Bloque[] = [];
  let actual: Palabra[] = [];
  const cerrar = () => {
    if (!actual.length) return;
    out.push({ texto: actual.map((p) => p.texto).join(" "), desde: actual[0].desde, hasta: actual[actual.length - 1].hasta, palabras: actual });
    actual = [];
  };
  for (const p of palabras) {
    const prev = actual[actual.length - 1];
    if (prev && (p.desde - prev.hasta > 0.25 || actual.length >= 3 || /[.,;:!?…]$/.test(prev.texto))) cerrar();
    actual.push(p);
    if (actual.length >= 2 && actual.map((x) => x.texto).join(" ").length > 16) cerrar();
  }
  cerrar();
  // Cada bloque queda hasta que arranca el siguiente (como mucho 0,3 s más), así no titila.
  for (let i = 0; i < out.length - 1; i++) out[i].hasta = Math.max(out[i].hasta, Math.min(out[i + 1].desde, out[i].hasta + 0.3));
  return out;
}

const hora = (s: number) => {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), seg = Math.floor((cs % 6000) / 100), c = cs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
};
/** #RRGGBB → &H00BBGGRR (el formato de color de ASS). */
const colorAss = (hex: string) => {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? `&H00${m[3]}${m[2]}${m[1]}`.toUpperCase() : "&H0000E5FF";
};
const escapar = (t: string) => t.replace(/[{}\\]/g, "").replace(/\n/g, " ");

export function armarAss(o: { ancho: number; alto: number; palabras: Palabra[]; estilo: EstiloSub; color: string; gancho?: TextoPantalla | null; textos: TextoPantalla[] }) {
  const { ancho: W, alto: H } = o;
  const tam = Math.round(H * 0.045);
  const acento = colorAss(o.color);
  const pastilla = o.estilo === "pastilla";
  const estilos = [
    // Subtítulos: centro, a un 62 % de la altura (arriba de la zona de la descripción).
    `Style: Sub,Arial,${tam},&H00FFFFFF,&H00FFFFFF,&H00111111,${pastilla ? "&H26111111" : "&H66000000"},-1,0,0,0,100,100,0,0,${pastilla ? 3 : 1},${pastilla ? Math.round(tam * 0.28) : Math.max(2, Math.round(tam * 0.09))},${pastilla ? 0 : 1},2,${Math.round(W * 0.08)},${Math.round(W * 0.08)},${Math.round(H * 0.36)},1`,
    // Gancho de los primeros 2 segundos: arriba, grande.
    `Style: Gancho,Arial,${Math.round(tam * 1.3)},&H00FFFFFF,&H00FFFFFF,&H00111111,&H66000000,-1,0,0,0,100,100,0,0,1,${Math.max(3, Math.round(tam * 0.12))},2,8,${Math.round(W * 0.07)},${Math.round(W * 0.07)},${Math.round(H * 0.12)},1`,
    // Textos clave que elige el editor: arriba, en el color de la marca.
    `Style: Texto,Arial,${Math.round(tam * 1.1)},${acento},${acento},&H00111111,&H66000000,-1,0,0,0,100,100,0,0,1,${Math.max(3, Math.round(tam * 0.11))},2,8,${Math.round(W * 0.08)},${Math.round(W * 0.08)},${Math.round(H * 0.16)},1`,
  ];
  const ev: string[] = [];
  const pop = (dur: number) => `{\\fad(70,${Math.min(120, Math.round(dur * 250))})\\fscx72\\fscy72\\t(0,150,\\fscx100\\fscy100)}`;
  if (o.gancho?.texto) ev.push(`Dialogue: 2,${hora(o.gancho.desde)},${hora(o.gancho.hasta)},Gancho,,0,0,0,,${pop(o.gancho.hasta - o.gancho.desde)}${escapar(o.gancho.texto).toUpperCase()}`);
  for (const t of o.textos) ev.push(`Dialogue: 1,${hora(t.desde)},${hora(t.hasta)},Texto,,0,0,0,,${pop(t.hasta - t.desde)}${escapar(t.texto).toUpperCase()}`);
  for (const b of bloques(o.palabras)) {
    const entrada = "{\\fad(60,0)\\blur2\\t(0,90,\\blur0)}";
    if (o.estilo !== "resaltado") {
      ev.push(`Dialogue: 0,${hora(b.desde)},${hora(b.hasta)},Sub,,0,0,0,,${entrada}${escapar(b.texto)}`);
      continue;
    }
    // Palabra activa resaltada: un evento por palabra, con esa palabra en el color de la marca.
    b.palabras.forEach((p, i) => {
      const fin = i < b.palabras.length - 1 ? b.palabras[i + 1].desde : b.hasta;
      const texto = b.palabras.map((x, j) => (j === i ? `{\\c${acento}}${escapar(x.texto)}{\\c&H00FFFFFF}` : escapar(x.texto))).join(" ");
      ev.push(`Dialogue: 0,${hora(i === 0 ? b.desde : p.desde)},${hora(Math.max(fin, p.desde + 0.05))},Sub,,0,0,0,,${i === 0 ? entrada : ""}${texto}`);
    });
  }
  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${W}`,
    `PlayResY: ${H}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    ...estilos,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...ev,
    "",
  ].join("\n");
}

/** Ordena los textos del editor, los mete adentro del video y saca los que se pisan. */
export function ordenarTextos(textos: TextoPantalla[], dur: number, desdeMinimo = 2.1) {
  const out: TextoPantalla[] = [];
  for (const t of [...textos].sort((a, b) => a.desde - b.desde)) {
    const desde = Math.max(desdeMinimo, t.desde, (out[out.length - 1]?.hasta ?? 0) + 0.15);
    const hasta = Math.min(dur, Math.max(t.hasta, desde + 0.8), desde + 2.2);
    if (hasta - desde >= 0.6 && t.texto.trim()) out.push({ texto: t.texto.trim().slice(0, 28), desde, hasta });
  }
  return out;
}
