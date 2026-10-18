// Subtítulos y textos en pantalla con el método de Paul (metodo-completo.md, sección 5): bloques de 1 a 3 palabras
// y como mucho ~16 letras, cortados en la puntuación, sin palabras colgadas al final, en zona segura (nunca en el
// tercio de abajo, donde va la descripción de Instagram), y textos que entran con un detalle corto.
// Los estilos de la app son los tres del método: minimalista, Hormozi (grandes, la palabra dicha en el color) y
// pastilla oscura. Con un video de referencia, el look sale de lo que leyó el Editor.
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
};
/** Alto de la letra, como parte del alto del video, y cuántas letras entran por bloque con ese tamaño. */
const TAMANO: Record<Subs["tamano"], { alto: number; letras: number }> = {
  chico: { alto: 0.034, letras: 22 },
  mediano: { alto: 0.044, letras: 16 },
  grande: { alto: 0.056, letras: 13 },
  enorme: { alto: 0.07, letras: 10 },
};

/** Los tres estilos de subtítulos del método, según lo que eligió en la app. */
export type PresetSubs = "minimalista" | "hormozi" | "pastilla";
export const presetDeSubs = (estilo: string): PresetSubs | null =>
  estilo === "limpios" ? "minimalista" : estilo === "resaltado" ? "hormozi" : estilo === "pastilla" ? "pastilla" : null;

/** Palabras que nunca cierran un bloque: pasan al siguiente. */
const COLGADAS = new Set(["y", "o", "le", "te", "lo", "la", "el", "de", "es", "si", "que", "una", "un", "a", "mi", "por", "tu", "se", "los", "las", "con", "al", "para"]);
/** Antes de estas se corta siempre (whisper a veces pierde el punto). */
const CORTE_ANTES = new Set(["después", "despues", "pero", "ojo"]);
/** Verbos que anuncian la palabra del llamado a la acción ("comentá PLAN"): esa palabra va sola. */
const PIDE_PALABRA = /^(coment[aá]|escrib[ií](me)?|mand[aá]me|pon[eé]|dec[ií]me)$/i;
const limpia = (t: string) => t.toLowerCase().replace(/[.,;:!?¿¡…"'«»“”]/g, "");

/** Lo que whisper escribe mal seguido: tildes del voseo y nombres de marcas. Respeta mayúsculas y signos. */
const CORRECCIONES: Record<string, string> = {
  podes: "podés", queres: "querés", tenes: "tenés", despues: "después", ultima: "última", ultimo: "último",
  claud: "Claude", clod: "Claude", clode: "Claude", capcut: "CapCut", chatgpt: "ChatGPT", instagram: "Instagram", whatsapp: "WhatsApp",
};
export function corregirPalabras(palabras: Palabra[]): Palabra[] {
  return palabras.map((p) => {
    const m = p.texto.match(/^([¿¡"'«“]*)(.*?)([.,;:!?…"'»”]*)$/);
    if (!m) return p;
    const bien = CORRECCIONES[m[2].toLowerCase()];
    if (!bien) return p;
    const conMayuscula = /^[A-ZÁÉÍÓÚÑ]/.test(m[2]) && /^[a-záéíóúñ]/.test(bien) ? bien[0].toUpperCase() + bien.slice(1) : bien;
    return { ...p, texto: `${m[1]}${conMayuscula}${m[3]}` };
  });
}

/**
 * Bloques de 1 a `max` palabras y como mucho `letras` letras: corta en la puntuación, en las pausas y antes de
 * DESPUÉS/PERO/OJO; un bloque nunca termina en una palabra colgada (Y, DE, QUE, PARA…); los bloques de una sola
 * palabra se juntan con el vecino si entran, salvo la palabra del llamado a la acción, que va sola.
 */
export function bloques(palabras: Palabra[], max = 3, letras = 16): Bloque[] {
  const grupos: Palabra[][] = [];
  let actual: Palabra[] = [];
  const largo = (ps: Palabra[]) => ps.map((x) => x.texto).join(" ").length;
  const cerrar = () => {
    if (!actual.length) return;
    // Si termina en una palabra colgada (y no es lo único que hay), esa pasa al bloque siguiente.
    const ult = actual[actual.length - 1];
    if (actual.length > 1 && COLGADAS.has(limpia(ult.texto)) && !/[.,;:!?…]$/.test(ult.texto)) {
      grupos.push(actual.slice(0, -1));
      actual = [ult];
      return;
    }
    grupos.push(actual);
    actual = [];
  };
  const esCta = (i: number) => i > 0 && PIDE_PALABRA.test(limpia(palabras[i - 1].texto));
  for (const [i, p] of palabras.entries()) {
    const prev = actual[actual.length - 1];
    const corta = prev && (p.desde - prev.hasta > 0.25 || /[.,;:!?…]$/.test(prev.texto) || CORTE_ANTES.has(limpia(p.texto)) || esCta(i));
    if (corta) cerrar();
    else if (prev && (actual.length >= max || largo([...actual, p]) > letras)) cerrar();
    actual.push(p);
    // La palabra del llamado a la acción va sola.
    if (esCta(i)) {
      grupos.push(actual);
      actual = [];
    }
  }
  if (actual.length) grupos.push(actual);
  // Bloques de una sola palabra: con el vecino si entran y no los separa un punto (salvo la del llamado a la acción).
  const juntos: Palabra[][] = [];
  for (const g of grupos) {
    const prev = juntos[juntos.length - 1];
    const solo = (x: Palabra[]) => x.length === 1;
    const ctaSola = (x: Palabra[]) => x.length === 1 && esCta(palabras.indexOf(x[0]));
    const entra = prev && prev.length + g.length <= max && largo([...prev, ...g]) <= letras && g[0].desde - prev[prev.length - 1].hasta <= 0.6;
    const separa = prev && (/[.;:!?…]$/.test(prev[prev.length - 1].texto) || CORTE_ANTES.has(limpia(g[0].texto)));
    if (entra && !separa && (solo(prev) || solo(g)) && !ctaSola(prev) && !ctaSola(g)) prev.push(...g);
    else juntos.push([...g]);
  }
  const out: Bloque[] = juntos.filter((g) => g.length).map((g) => ({ texto: g.map((p) => p.texto).join(" "), desde: g[0].desde, hasta: g[g.length - 1].hasta, palabras: g }));
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
  /** Uno de los tres estilos del método (si eligió los subtítulos de la app); pisa letra, tamaño y animación. */
  preset?: PresetSubs | null;
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
  const P = o.preset ? estiloDelMetodo(o.preset, H) : null;
  const estilos = [
    P
      ? `Style: Sub,${P.fuente},${P.tam},&H00FFFFFF,&H00FFFFFF,${P.contorno},${P.atras},${P.negrita ? -1 : 0},0,0,0,100,100,${P.espacio},0,${P.tipo},${P.grosor},${P.sombra},2,${Math.round(W * 0.08)},${Math.round(W * 0.08)},${P.margen},1`
      : linea("Sub", tam, primario, subs.fondo, colorAss(subs.color_resaltado, "00"), posSub.alin, posSub.margen),
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
  if (subs.hay && P) {
    const activo = colorAss(subs.color_resaltado);
    const caso = (t: string) => (P.mayusculas ? t.toUpperCase() : P.minusculas ? t.toLowerCase() : t);
    for (const b of bloques(o.palabras, 3, P.letras)) {
      b.palabras.forEach((p, i) => {
        const fin = i < b.palabras.length - 1 ? b.palabras[i + 1].desde : b.hasta;
        const texto = b.palabras
          .map((x, j) => {
            const t = escapar(caso(x.texto));
            // Minimalista: lo dicho a opacidad 1 y lo que viene a 0,45. Hormozi y pastilla: solo la palabra dicha en color.
            if (P.atenuar) return j > i ? `{\\alpha&H8C&}${t}` : `{\\alpha&H00&}${t}`;
            return j === i ? `{\\c${activo}}${t}{\\c&HFFFFFF&}` : t;
          })
          .join(" ");
        ev.push(`Dialogue: 0,${hora(i === 0 ? b.desde : p.desde)},${hora(Math.max(fin, p.desde + 0.05))},Sub,,0,0,0,,${i === 0 ? P.entrada : P.fijo}${texto}`);
      });
    }
  } else if (subs.hay) {
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

/**
 * Los tres estilos de subtítulos del método (sección 5), en ASS. Las letras son las que hay en cualquier Mac
 * (Arial Black por Inter 900, Menlo por JetBrains Mono, Helvetica Neue por Inter).
 */
function estiloDelMetodo(p: PresetSubs, H: number) {
  if (p === "hormozi") {
    // Grandes, en mayúsculas, borde negro grueso y sombra sólida; sobre el pecho (y ≈ 1330 de 1920); entra con un resorte 0,8 → 1.
    const tam = Math.round(H * 0.054);
    const sombra = Math.round(tam * 0.06);
    return {
      fuente: "Arial Black", tam, negrita: false, espacio: -1, tipo: 1, grosor: Math.round(tam * 0.11), sombra: 0,
      contorno: "&H00000000", atras: "&H00000000", margen: Math.round(H * (1 - 0.693) - tam / 2), letras: 13,
      mayusculas: true, minusculas: false, atenuar: false,
      entrada: `{\\xshad0\\yshad${sombra}\\4c&H000000&\\fscx80\\fscy80\\t(0,110,\\fscx104\\fscy104)\\t(110,190,\\fscx100\\fscy100)}`,
      fijo: `{\\xshad0\\yshad${sombra}\\4c&H000000&}`,
    };
  }
  if (p === "pastilla") {
    // Pastilla #262624, letra mono gruesa en mayúsculas con aire entre letras; la palabra dicha en el color; entra con desenfoque.
    const tam = Math.round(H * 0.03);
    return {
      fuente: "Menlo", tam, negrita: true, espacio: Math.round(tam * 0.08), tipo: 3, grosor: Math.round(tam * 0.32), sombra: 0,
      contorno: "&H00242626", atras: "&H00242626", margen: Math.round(H * 0.36), letras: 16,
      mayusculas: true, minusculas: false, atenuar: false,
      entrada: "{\\blur6\\fscx94\\fscy94\\t(0,160,\\blur0\\fscx100\\fscy100)}",
      fijo: "",
    };
  }
  // Minimalista: blanco en minúscula, sin pastilla; una sombra suave para que se lea sobre cualquier ropa.
  const tam = Math.round(H * 0.042);
  return {
    fuente: "Helvetica Neue", tam, negrita: true, espacio: 0, tipo: 1, grosor: 0, sombra: Math.max(1, Math.round(tam * 0.04)),
    contorno: "&H00111111", atras: "&H80000000", margen: Math.round(H * 0.36), letras: 16,
    mayusculas: false, minusculas: true, atenuar: true,
    entrada: "{\\blur4\\t(0,140,\\blur0)}",
    fijo: "",
  };
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
