// Subtítulos y textos en pantalla con el preset de Paul: bloques de 1 a 3 palabras, en zona segura (nunca en el
// tercio de abajo, donde va la descripción de Instagram), y textos que entran con un detalle corto.
// El look (letra, tamaño, dónde van, cómo entran, colores) sale del estilo: el de la app o el del video de referencia.
// Se arma un archivo .ass (libass) y ffmpeg lo quema en el video.
import type { Subs } from "./estilo";
import type { Palabra } from "./transcribir";

export type TextoPantalla = { texto: string; desde: number; hasta: number };
/** La placa final: el llamado a la acción grande, con la marca arriba y un dato abajo (por ejemplo, el precio). */
export type Placa = { texto: string; arriba?: string; abajo?: string; desde: number; hasta: number };
type Bloque = { texto: string; desde: number; hasta: number; palabras: Palabra[] };

const LETRA: Record<Subs["letra"], { fuente: string; negrita: boolean }> = {
  moderna: { fuente: "Helvetica Neue", negrita: true },
  gruesa: { fuente: "Arial Black", negrita: false },
  condensada: { fuente: "Impact", negrita: false },
  redondeada: { fuente: "Arial Rounded MT Bold", negrita: false },
  serif: { fuente: "Georgia", negrita: true },
  manuscrita: { fuente: "Marker Felt", negrita: false },
  mono: { fuente: "Menlo", negrita: true },
};
/** Alto de la letra, como parte del alto del video, y cuántas letras entran por bloque con ese tamaño. */
const TAMANO: Record<Subs["tamano"], { alto: number; letras: number }> = {
  chico: { alto: 0.034, letras: 22 },
  mediano: { alto: 0.044, letras: 16 },
  grande: { alto: 0.056, letras: 13 },
  enorme: { alto: 0.07, letras: 10 },
};

/** Bloques de 1 a `max` palabras: corta en la puntuación, en las pausas, al llegar a `max` palabras o si se hace largo. */
export function bloques(palabras: Palabra[], max = 3, letras = 16): Bloque[] {
  const out: Bloque[] = [];
  let actual: Palabra[] = [];
  const cerrar = () => {
    if (!actual.length) return;
    out.push({ texto: actual.map((p) => p.texto).join(" "), desde: actual[0].desde, hasta: actual[actual.length - 1].hasta, palabras: actual });
    actual = [];
  };
  for (const p of palabras) {
    const prev = actual[actual.length - 1];
    if (prev && (p.desde - prev.hasta > 0.25 || actual.length >= max || /[.,;:!?…]$/.test(prev.texto))) cerrar();
    actual.push(p);
    if (actual.length >= 2 && actual.map((x) => x.texto).join(" ").length > letras) cerrar();
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
/** #RRGGBB → &HAABBGGRR (el formato de color de ASS; alfa 00 es opaco). */
const colorAss = (hex: string, alfa = "00") => {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? `&H${alfa}${m[3]}${m[2]}${m[1]}`.toUpperCase() : `&H${alfa}0AD6FF`;
};
const escapar = (t: string) => t.replace(/[{}\\]/g, "").replace(/\n/g, " ");

/** El borde, la sombra o la caja de un texto, según el fondo del estilo. */
function borde(fondo: Subs["fondo"], tam: number, caja: string) {
  switch (fondo) {
    case "ninguno":
      return { tipo: 1, grosor: 0, sombra: Math.max(1, Math.round(tam * 0.03)), contorno: "&H00111111", atras: "&H80000000" };
    case "sombra":
      return { tipo: 1, grosor: 0, sombra: Math.max(2, Math.round(tam * 0.07)), contorno: "&H00111111", atras: "&H60000000" };
    case "pastilla":
      return { tipo: 3, grosor: Math.round(tam * 0.28), sombra: 0, contorno: "&H26111111", atras: "&H26111111" };
    case "caja":
      return { tipo: 3, grosor: Math.round(tam * 0.28), sombra: 0, contorno: caja, atras: caja };
    default:
      return { tipo: 1, grosor: Math.max(2, Math.round(tam * 0.09)), sombra: 1, contorno: "&H00111111", atras: "&H66000000" };
  }
}

export function armarAss(o: {
  ancho: number;
  alto: number;
  palabras: Palabra[];
  subs: Subs;
  /** El color de la marca: textos del editor, placa final y caja de color. */
  acento: string;
  posTextos?: "arriba" | "centro";
  gancho?: TextoPantalla | null;
  textos: TextoPantalla[];
  cierre?: Placa | null;
}) {
  const { ancho: W, alto: H, subs } = o;
  const letra = LETRA[subs.letra] ?? LETRA.moderna;
  const medida = TAMANO[subs.tamano] ?? TAMANO.mediano;
  const tam = Math.round(H * medida.alto);
  const caja = subs.fondo === "caja";
  const acento = colorAss(o.acento);
  const oscuro = "&H00111111";
  const resaltado = colorAss(caja ? "#FFFFFF" : subs.color_resaltado);
  const primario = caja ? oscuro : colorAss(subs.color_texto);
  const linea = (nombre: string, t: number, color: string, fondo: Subs["fondo"], cajaColor: string, alin: number, margenV: number) => {
    const b = borde(fondo, t, cajaColor);
    return `Style: ${nombre},${letra.fuente},${t},${color},${color},${b.contorno},${b.atras},${letra.negrita ? -1 : 0},0,0,0,100,100,0,0,${b.tipo},${b.grosor},${b.sombra},${alin},${Math.round(W * 0.08)},${Math.round(W * 0.08)},${margenV},1`;
  };
  // Dónde van los subtítulos: abajo es sobre la línea del 64 % (arriba de la descripción de Instagram).
  const posSub = { abajo: { alin: 2, margen: Math.round(H * 0.36), y: H - Math.round(H * 0.36) }, centro: { alin: 5, margen: 0, y: Math.round(H / 2) }, arriba: { alin: 8, margen: Math.round(H * 0.2), y: Math.round(H * 0.2) } }[subs.posicion];
  const arriba = (o.posTextos ?? "arriba") === "arriba";
  const fondoTextos = subs.fondo === "ninguno" ? "borde" : subs.fondo;
  const colorTextos = caja ? oscuro : acento;
  const estilos = [
    linea("Sub", tam, primario, subs.fondo, colorAss(subs.color_resaltado, "00"), posSub.alin, posSub.margen),
    // Gancho de los primeros 2 segundos y textos clave del editor: arriba (o al centro si los subtítulos van arriba).
    linea("Gancho", Math.round(Math.min(tam * 1.3, H * 0.07)), caja ? oscuro : "&H00FFFFFF", fondoTextos, acento, arriba ? 8 : 5, arriba ? Math.round(H * 0.12) : 0),
    linea("Texto", Math.round(Math.min(tam * 1.1, H * 0.06)), colorTextos, fondoTextos, acento, arriba ? 8 : 5, arriba ? Math.round(H * 0.16) : 0),
    // Placa final: centrada, el llamado a la acción en el color de la marca.
    linea("Cierre", Math.round(H * 0.05), colorTextos, fondoTextos, acento, 5, 0),
    linea("Placa", Math.round(H * 0.038), "&H00FFFFFF", fondoTextos === "caja" ? "borde" : fondoTextos, acento, 5, 0),
  ];
  const ev: string[] = [];
  const pop = (dur: number) => `{\\fad(70,${Math.min(120, Math.round(dur * 250))})\\fscx72\\fscy72\\t(0,150,\\fscx100\\fscy100)}`;
  const may = (t: string) => (subs.mayusculas ? t.toUpperCase() : t);
  if (o.gancho?.texto) ev.push(`Dialogue: 2,${hora(o.gancho.desde)},${hora(o.gancho.hasta)},Gancho,,0,0,0,,${pop(o.gancho.hasta - o.gancho.desde)}${escapar(o.gancho.texto).toUpperCase()}`);
  for (const t of o.textos) ev.push(`Dialogue: 1,${hora(t.desde)},${hora(t.hasta)},Texto,,0,0,0,,${pop(t.hasta - t.desde)}${escapar(t.texto).toUpperCase()}`);
  if (o.cierre?.texto) {
    const c = o.cierre;
    const d = c.hasta - c.desde;
    if (c.arriba) ev.push(`Dialogue: 3,${hora(c.desde)},${hora(c.hasta)},Placa,,0,0,0,,{\\pos(${Math.round(W / 2)},${Math.round(H * 0.38)})}${pop(d)}${escapar(c.arriba)}`);
    ev.push(`Dialogue: 3,${hora(c.desde)},${hora(c.hasta)},Cierre,,0,0,0,,{\\pos(${Math.round(W / 2)},${Math.round(H * 0.5)})}${pop(d)}${escapar(c.texto).toUpperCase()}`);
    if (c.abajo) ev.push(`Dialogue: 3,${hora(c.desde + 0.15)},${hora(c.hasta)},Placa,,0,0,0,,{\\pos(${Math.round(W / 2)},${Math.round(H * 0.62)})}${pop(d)}${escapar(c.abajo)}`);
  }
  if (subs.hay) {
    const entrada = {
      aparece: "{\\fad(60,0)\\blur2\\t(0,90,\\blur0)}",
      pop: "{\\fad(50,0)\\fscx75\\fscy75\\t(0,140,\\fscx100\\fscy100)}",
      golpe: "{\\fscx125\\fscy125\\t(0,120,\\fscx100\\fscy100)}",
      sube: `{\\fad(60,0)\\move(${Math.round(W / 2)},${posSub.y + Math.round(H * 0.015)},${Math.round(W / 2)},${posSub.y},0,150)}`,
      palabra_por_palabra: "",
    }[subs.animacion] ?? "{\\fad(60,0)}";
    for (const b of bloques(o.palabras, subs.palabras, medida.letras)) {
      if (subs.animacion === "palabra_por_palabra") {
        // Las palabras se van sumando a medida que las dice; las que faltan ya ocupan su lugar (transparentes), así nada salta.
        b.palabras.forEach((p, i) => {
          const fin = i < b.palabras.length - 1 ? b.palabras[i + 1].desde : b.hasta;
          const texto = b.palabras
            .map((x, j) => {
              const t = escapar(may(x.texto));
              if (j > i) return `{\\alpha&HFF&}${t}`;
              if (j === i) return `{\\alpha&HFF&\\t(0,90,\\alpha&H00&)${subs.resaltar ? `\\c${resaltado}` : ""}}${t}{\\c${primario}}`;
              return `{\\alpha&H00&}${t}`;
            })
            .join(" ");
          ev.push(`Dialogue: 0,${hora(i === 0 ? b.desde : p.desde)},${hora(Math.max(fin, p.desde + 0.05))},Sub,,0,0,0,,${texto}`);
        });
        continue;
      }
      if (!subs.resaltar) {
        ev.push(`Dialogue: 0,${hora(b.desde)},${hora(b.hasta)},Sub,,0,0,0,,${entrada}${escapar(may(b.texto))}`);
        continue;
      }
      // Palabra activa resaltada: un evento por palabra, con esa palabra en el color de resaltado.
      b.palabras.forEach((p, i) => {
        const fin = i < b.palabras.length - 1 ? b.palabras[i + 1].desde : b.hasta;
        const texto = b.palabras.map((x, j) => (j === i ? `{\\c${resaltado}}${escapar(may(x.texto))}{\\c${primario}}` : escapar(may(x.texto)))).join(" ");
        ev.push(`Dialogue: 0,${hora(i === 0 ? b.desde : p.desde)},${hora(Math.max(fin, p.desde + 0.05))},Sub,,0,0,0,,${i === 0 ? entrada : ""}${texto}`);
      });
    }
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
