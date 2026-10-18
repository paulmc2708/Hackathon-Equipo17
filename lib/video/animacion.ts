// Las animaciones del editor, hechas con HyperFrames (HTML + GSAP renderizado a video; librería pública de HeyGen),
// siguiendo el método de edición de Paul (skill editar-reel, referencias/metodo-completo.md, secciones 5 a 10):
// - Gancho con la cara completa: la tarjeta ya se ve en el cuadro 0 y las letras de la palabra fuerte caen y golpean.
// - Cuerpo en pantalla dividida: animación arriba (franja de 690 px, fondo #ecebe7 con grilla, tarjetas blancas con
//   sombra suave, una etiqueta con el @ y la firma que salta de esquina) y la cara abajo, encuadrada según dónde está
//   (la ubica el agente Editor) y sin zoom. La división entra y sale en 0,22 s. Los subtítulos van en la línea de la
//   división; con la cara completa, abajo de la cara (y ≈ 1500).
// - Tarjetas que elige el Editor: título con subrayado a mano, lista con los ítems tapados que se destapan justo cuando
//   los nombra, número que cuenta desde un valor alto (nunca desde 0), comparación con lo malo tachado y sello que cae.
// - Cierre con la cara completa: su perfil con la foto y SOLO el @, Seguir → Siguiendo, la palabra que se escribe en la
//   barra de comentarios y la burbuja "te paso … por DM". El último cuadro termina con la cara.
// Con la cara completa, todo va en un lugar libre (arriba de la cabeza o entre el mentón y los subtítulos) y las letras
// se achican para entrar ahí: nada tapa la cara. Se renderiza con el Chrome sin pantalla de HyperFrames y se le pone el
// audio del video cortado. Si algo de esto falla, el editor vuelve a los subtítulos simples (ASS) y lo avisa.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runAgentLocal } from "../agent/claudeLocal";
import { Pedido, type ResultadoAuditoriaVideo, type ResultadoEditor } from "../agent/tasks";
import { leerCreador } from "../diario/archivos";
import type { Estilo } from "./estilo";
import { binario, correr, cuadrosSeguidos, medir, ultimoError } from "./ffmpeg";
import { bloques } from "./subtitulos";
import type { Palabra } from "./transcribir";

const MODULOS = path.join(process.cwd(), "node_modules");
const BIN = path.join(MODULOS, ".bin", "hyperframes");
const GSAP = path.join(MODULOS, "gsap", "dist", "gsap.min.js");
// Las letras del método (Inter 900, JetBrains Mono 800 y Lora itálica), incluidas en el render: se ven igual en cualquier compu.
const FUENTES = {
  inter: path.join(MODULOS, "@fontsource", "inter", "files", "inter-latin-900-normal.woff2"),
  mono: path.join(MODULOS, "@fontsource", "jetbrains-mono", "files", "jetbrains-mono-latin-800-normal.woff2"),
  lora: path.join(MODULOS, "@fontsource", "lora", "files", "lora-latin-700-italic.woff2"),
};
const ENV = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1", HYPERFRAMES_SKIP_SKILLS: "1" };
const W = 1080;
const H = 1920;
/** Franja de animación arriba, en pantalla dividida (método: 0 a 690 px). */
const ZONA = 690;
const TINTA = "#1d1d1b";
const ROJO = "#e0352b";
const VERDE = "#1f9d55";
const PANEL = "#ecebe7";
/** Lo que dura el cierre con el perfil y el llamado a la acción. */
const CIERRE = 2.6;
/** Alto de la tarjeta del cierre a tamaño real (con la barra de comentario y la burbuja). */
const ALTO_CIERRE = 380;

export type Diseno = "partida" | "completa";
type Tarjeta = ResultadoEditor["textos"][number];
type Caja = { x: number; y: number; ancho: number; alto: number };
/** Una caja para tarjetas con la cara completa; `pegada` es el borde de la caja donde se apoya la tarjeta (el más cerca de la cara). */
type Lugar = Caja & { pegada: "arriba" | "abajo" };
type Tramo = { y0: number; y1: number };
/** Un efecto de sonido del método (sección 9): en qué segundo y cuál. El platillo dura hasta el golpe del gancho. */
export type Sonido = { t: number; tipo: "platillo" | "golpe" | "whoosh" | "tic" | "click"; dur?: number };

function hf(args: string[], cwd: string, alAvanzar?: (pct: number) => void, tope = 20 * 60 * 1000): Promise<{ codigo: number; salida: string }> {
  return new Promise((ok) => {
    const h = spawn(BIN, args, { cwd, env: { ...ENV, ...(path.isAbsolute(binario("ffmpeg")) ? { HYPERFRAMES_FFMPEG_PATH: binario("ffmpeg"), HYPERFRAMES_FFPROBE_PATH: binario("ffprobe") } : {}) }, stdio: ["ignore", "pipe", "pipe"] });
    let salida = "";
    const leer = (d: string) => {
      salida = (salida + d).slice(-20000);
      for (const m of d.matchAll(/@hf-progress (\{[^\n]*\})/g)) {
        try {
          const j = JSON.parse(m[1]) as { pct?: number };
          if (typeof j.pct === "number") alAvanzar?.(j.pct);
        } catch {}
      }
    };
    h.stdout.setEncoding("utf8").on("data", leer);
    h.stderr.setEncoding("utf8").on("data", leer);
    const t = setTimeout(() => h.kill("SIGTERM"), tope);
    h.on("error", () => ok({ codigo: 127, salida: "no pude correr hyperframes" }));
    h.on("close", (c) => {
      clearTimeout(t);
      ok({ codigo: c ?? 1, salida });
    });
  });
}

/** Por qué no se pueden hacer animaciones en esta compu (null si se puede): HyperFrames instalado y Node 22 o más. */
export function sinAnimaciones(): string | null {
  if (!existsSync(BIN) || !existsSync(GSAP) || !Object.values(FUENTES).every((f) => existsSync(f))) return "falta instalar HyperFrames: corré npm install en la carpeta de Hookia";
  const mayor = Number(process.versions.node.split(".")[0]);
  if (mayor < 22) return `HyperFrames necesita Node 22 o más nuevo (tenés ${process.versions.node})`;
  return null;
}

/** ¿Está el Chrome sin pantalla con el que renderiza HyperFrames? */
export async function hayChrome() {
  return !sinAnimaciones() && (await hf(["browser", "path"], process.cwd(), undefined, 30000)).codigo === 0;
}

/** Baja el Chrome sin pantalla de HyperFrames (una sola vez, unos 100 MB). Devuelve el motivo si no pudo. */
export async function bajarChrome(): Promise<string | null> {
  const no = sinAnimaciones();
  if (no) return no;
  const r = await hf(["browser", "ensure"], process.cwd(), undefined, 15 * 60 * 1000);
  return r.codigo === 0 ? null : `no pude bajar el Chrome de HyperFrames: ${r.salida.trim().split("\n").pop() ?? ""}`;
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const n2 = (x: number) => Number(x.toFixed(3));
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const LETRAS: Record<Estilo["subtitulos"]["letra"], string> = {
  moderna: `"Inter", -apple-system, "Helvetica Neue", Arial, sans-serif`,
  gruesa: `"Inter", "Arial Black", Arial, sans-serif`,
  condensada: `Impact, "Arial Narrow", sans-serif`,
  redondeada: `"SF Pro Rounded", "Arial Rounded MT Bold", sans-serif`,
  serif: `"Lora", Georgia, serif`,
  manuscrita: `"Marker Felt", "Comic Sans MS", cursive`,
  mono: `"JetBrains Mono", ui-monospace, Menlo, monospace`,
};

/** "70%" → {n: 70, antes: "", despues: "%"}: para contar hasta el número de la tarjeta. */
function numero(t: string) {
  const m = t.trim().match(/^([^\d]*)(\d{1,3}(?:[.,]\d{3})+|\d+)([^\d]*)$/);
  if (!m) return null;
  const n = Number(m[2].replace(/[.,]/g, ""));
  return Number.isFinite(n) && n > 0 ? { n, antes: m[1], despues: m[3], miles: /[.,]/.test(m[2]) } : null;
}
const conMiles = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/**
 * Atributos para que el navegador achique la letra del elemento hasta que su texto entre en `ancho` × `alto`
 * (lo hace el script de la composición con las letras ya cargadas, antes de armar la animación).
 */
const ajusta = (ancho: number, alto: number, max: number, min: number, linea = 1.05) =>
  `data-ancho="${Math.round(ancho)}" data-alto="${Math.round(Math.max(alto, min * linea))}" data-max="${max}" data-min="${min}" data-linea="${linea}"`;

/** El video cubriendo la caja, con la cara centrada a lo ancho y su centro a la altura `yCara` (en px de la caja). */
function marcoPara(caja: { ancho: number; alto: number }, fuente: { ancho: number; alto: number }, cara: { x: number; y: number }, yCara: number): Caja {
  const s = Math.max(caja.ancho / fuente.ancho, caja.alto / fuente.alto);
  const vw = fuente.ancho * s, vh = fuente.alto * s;
  const x = Math.min(0, Math.max(caja.ancho - vw, caja.ancho / 2 - cara.x * vw));
  const y = Math.min(0, Math.max(caja.alto - vh, yCara - cara.y * vh));
  return { x: Math.round(x), y: Math.round(y), ancho: Math.round(vw), alto: Math.round(vh) };
}

/**
 * Dónde va cada cosa según dónde está la cara (la ubica el agente Editor en cuadros del video), sin zoom a la cara:
 * - con la cara completa (gancho, cierre y todo el video en pantalla completa) el video va tal cual; los subtítulos
 *   abajo de la cara (método: y ≈ 1500, o arriba de la cabeza si la cara está muy abajo) y las tarjetas en los lugares
 *   libres: arriba de la cabeza o entre el mentón y los subtítulos;
 * - en la división, la cabeza entera un poco debajo de la línea (sin pared de más arriba) y el mentón nunca cortado.
 */
export function disposicion(fuente: { ancho: number; alto: number }, encuadre: ResultadoEditor["encuadre"] | undefined) {
  const ok = (x: number, d: number) => (Number.isFinite(x) && x > 0 && x < 1 ? x : d);
  const cara = { x: ok(encuadre?.cara_x ?? NaN, 0.5), y: ok(encuadre?.cara_y ?? NaN, 0.42) };
  const alto = ok(encuadre?.cara_alto ?? NaN, 0.22);
  const f = { ancho: fuente.ancho || W, alto: fuente.alto || H };
  const completo = marcoPara({ ancho: W, alto: H }, f, cara, 0.44 * H);
  const abajo = H - ZONA;
  const vhD = f.alto * Math.max(W / f.ancho, abajo / f.alto);
  const dividido = marcoPara({ ancho: W, alto: abajo }, f, cara, Math.min(abajo - 40 - 0.5 * alto * vhD, 0.08 * abajo + 0.75 * alto * vhD));
  // Con la cara completa: dónde arranca la cabeza (con el pelo) y dónde termina el mentón.
  const cabeza = completo.y + (cara.y - 0.75 * alto) * completo.alto;
  const menton = completo.y + (cara.y + 0.5 * alto) * completo.alto;
  const subArriba = menton + 70 > 1640;
  const ySub = Math.round(subArriba ? Math.max(260, cabeza - 90) : Math.max(1500, menton + 70));
  const libreArriba: Tramo = { y0: 110, y1: subArriba ? ySub - 74 : cabeza - 30 };
  const libreAbajo: Tramo = { y0: menton + 36, y1: subArriba ? 1660 : ySub - 74 };
  return { completo, dividido, ySub, subArriba, libreArriba, libreAbajo };
}

/**
 * La caja para una tarjeta con la cara completa, en el lugar libre que conviene. Si no hay lugar (cara muy cerca), la
 * caja se estira hacia afuera de la cara (hacia arriba o hacia el pecho), nunca sobre la boca.
 */
function lugarPara(d: ReturnType<typeof disposicion>, prefiere: "arriba" | "mayor", minimo = 170, tope = 460): Lugar {
  const a = d.libreArriba, b = d.libreAbajo;
  const alto = (z: Tramo) => z.y1 - z.y0;
  let z = prefiere === "arriba" ? a : alto(a) >= alto(b) ? a : b;
  if (alto(z) < minimo) z = alto(a) >= alto(b) ? a : b;
  let { y0, y1 } = z;
  if (y1 - y0 < minimo) {
    if (z === a) y0 = Math.max(40, y1 - minimo);
    else y1 = Math.min(1700, y0 + minimo);
  }
  const h = Math.max(60, Math.min(tope, y1 - y0));
  return z === a ? { x: 60, y: Math.round(y1 - h), ancho: W - 120, alto: Math.round(h), pegada: "abajo" } : { x: 60, y: Math.round(y0), ancho: W - 120, alto: Math.round(h), pegada: "arriba" };
}
/**
 * La caja del cierre (perfil, barra de comentario y burbuja): entre el mentón y el pecho, a tamaño real si entra (los
 * subtítulos bajan abajo de ella); si la cara está muy abajo, arriba de la cabeza, achicada para que entre.
 */
function lugarCierre(d: ReturnType<typeof disposicion>): Lugar {
  const y0 = Math.round(d.libreAbajo.y0);
  if (!d.subArriba && y0 + 0.8 * ALTO_CIERRE <= 1650) return { x: 60, y: y0, ancho: W - 120, alto: Math.min(ALTO_CIERRE, 1650 - y0), pegada: "arriba" };
  return lugarPara(d, "arriba", 230, 460);
}
const estiloLugar = (l: Lugar) => `left:${l.x}px;top:${l.y}px;width:${l.ancho}px;height:${l.alto}px;justify-content:${l.pegada === "abajo" ? "flex-end" : "flex-start"}`;

/** Cuándo dice una palabra (la primera que empieza igual), entre dos momentos: para destapar un ítem justo al nombrarlo. */
function cuandoDice(palabras: Palabra[], texto: string, desde: number, hasta: number) {
  const clave = sinTildes(texto).split(/[^a-z0-9ñ]+/).find((x) => x.length >= 3) ?? sinTildes(texto).trim();
  if (!clave) return null;
  const p = palabras.find((w) => w.desde >= desde - 0.2 && w.desde <= hasta && sinTildes(w.texto).replace(/[^a-z0-9ñ]/g, "").startsWith(clave.slice(0, 5)));
  return p ? p.desde : null;
}

/** Tiembla 0,28 s (como en el método: algo golpea y la tarjeta acusa el golpe). */
const temblor = (sel: string, t: number) =>
  `tl.fromTo("${sel}", { x: -7 }, { x: 7, duration: 0.035, repeat: 7, yoyo: true, ease: "none", immediateRender: false }, ${n2(t)}); tl.set("${sel}", { x: 0 }, ${n2(t + 0.29)});`;

/** Las palabras que el Editor marcó en MAYÚSCULAS (si marcó algunas y no todas): las claves de la frase. */
const letrasDe = (p: string) => p.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/g, "");
function claves(pal: string[]) {
  const mayus = pal.map((p) => letrasDe(p).length >= 2 && p === p.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(p));
  return mayus.some(Boolean) && !mayus.every(Boolean) ? mayus : pal.map(() => false);
}

/**
 * La mascota en pixel art del método (sección 20): grilla de 12 × 6, cuerpo en el color de acento, ojos casi negros y
 * una franja al 12 % de sombra en la panza; cada píxel de 1,02 para que no queden rayitas.
 */
const MASCOTA = ["..########..", "..#e####e#..", "############", "############", "..########..", "..#.#..#.#.."];
function mascota(id: string, color: string, px: number) {
  const rects = MASCOTA.flatMap((fila, y) => [...fila].map((c, x) => (c === "." ? "" : `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c === "e" ? "#1a1a1a" : color}"/>`))).join("");
  return `<svg class="mascota" id="${id}" viewBox="0 0 12 6" width="${12 * px}" height="${6 * px}" shape-rendering="crispEdges">${rects}<rect x="0" y="3" width="12" height="1" fill="#000" opacity="0.12"/></svg>`;
}

/** Subrayado a mano en rojo (path con pathLength 1 que se dibuja). */
const trazo = (id: string, centrado = false) => `<svg class="trazo${centrado ? " centro" : ""}" viewBox="0 0 600 30" preserveAspectRatio="none"><path id="${id}" d="M6 20 C 140 6, 320 28, 594 12" pathLength="1"/></svg>`;

/**
 * El HTML de una tarjeta y sus animaciones (con tiempos absolutos del video). `ancho` y `alto` son el lugar que tiene
 * su contenido adentro de la tarjeta blanca: las letras se achican para entrar ahí.
 */
function tarjeta(t: Tarjeta, id: string, desde: number, hasta: number, acento: string, palabras: Palabra[], ancho: number, alto: number) {
  const anim: string[] = [];
  const sonidos: Sonido[] = [{ t: desde, tipo: "whoosh" }];
  // Entrada que se ve cara (guía de diseño): la tarjeta llega un poco inclinada, se pasa apenas y se endereza.
  const entra = (sel: string) => anim.push(`tl.fromTo("${sel}", { y: 34, scale: 0.94, rotation: -2.5, opacity: 0 }, { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.45, ease: "back.out(1.6)" }, ${n2(desde)});`);
  const d = t.detalle.map((x) => x.trim()).filter(Boolean);
  const rotulo = (txt: string) => (txt.trim() ? `<div class="rotulo"><i></i>${esc(txt.trim().toUpperCase())}</div>` : "");
  const conRotulo = (txt: string) => alto - (txt.trim() ? 50 : 0);
  let html = "";
  if (t.tipo === "palabra") {
    // El sello: cae de grande a su tamaño, girado, y tiembla. GRATIS va en verde (método).
    const color = /^(gratis|gratuito|free)$/i.test(t.texto.trim()) ? VERDE : acento;
    html = `<div class="sello-caja" id="${id}-s"><div class="sello ajusta" id="${id}-c" style="color:${color};border-color:${color}" ${ajusta(ancho * 0.8, alto * 0.7, 130, 36, 1.1)}>${esc(t.texto.toUpperCase())}</div></div>`;
    anim.push(`tl.fromTo("#${id}-c", { scale: 2, opacity: 0, rotation: -16 }, { scale: 1, opacity: 1, rotation: -7, duration: 0.3, ease: "back.out(1.8)" }, ${n2(desde)});`);
    anim.push(temblor(`#${id}-s`, desde + 0.3));
    sonidos[0] = { t: desde + 0.28, tipo: "golpe" };
  } else if (t.tipo === "numero") {
    const valor = d[0] ?? t.texto;
    const num = numero(valor);
    const etiqueta = d[0] ? (d[1] ?? t.texto) : (d[1] ?? "");
    // El contador arranca en un valor ya alto (nunca en 0) y sube hasta el dato real, con separador de miles.
    // El HTML trae el valor final (así la letra se ajusta al más ancho) y el script pone el inicial antes de animar.
    const inicio = num ? `${num.antes}${num.miles ? conMiles(num.n * 0.6) : Math.round(num.n * 0.6)}${num.despues}` : valor;
    html = `<div class="caja" id="${id}-c"><div class="cifra ajusta" ${ajusta(ancho, alto, 64, 18, 1)}><div class="num-caja"><div class="num" id="${id}-n" data-inicio="${esc(inicio)}">${esc(valor)}</div><svg class="circulo" viewBox="0 0 200 100" preserveAspectRatio="none"><path id="${id}-o" d="M150 12 C 90 -4, 14 14, 10 50 C 6 86, 120 98, 176 80 C 206 68, 196 26, 140 14" pathLength="1"/></svg></div>${etiqueta ? `<div class="etiqueta">${esc(etiqueta)}</div>` : ""}</div></div>`;
    entra(`#${id}-c`);
    if (num) {
      const formato = num.miles ? `String(Math.round(o.v)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".")` : "Math.round(o.v)";
      anim.push(
        `tl.fromTo("#${id}-o", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, ${n2(desde + 1.05)});`,
        `(() => { const el = document.getElementById("${id}-n"); const o = { v: ${Math.round(num.n * 0.6)} }; tl.fromTo(o, { v: ${Math.round(num.n * 0.6)} }, { v: ${num.n}, duration: 0.8, ease: "power2.out", onUpdate: () => { el.textContent = ${JSON.stringify(num.antes)} + ${formato} + ${JSON.stringify(num.despues)}; } }, ${n2(desde + 0.2)}); })();`,
      );
    }
  } else if (t.tipo === "lista" && d.length) {
    // Bucle abierto: los ítems arrancan tapados (desenfocados) y se destapan justo cuando los nombra.
    const items = d.slice(0, 4);
    html = `<div class="caja" id="${id}-c">${rotulo(t.texto)}<div class="items ajusta" ${ajusta(ancho, conRotulo(t.texto), 64, 22, 1.1)}>${items
      .map((x, i) => `<div class="item" id="${id}-i${i}"><span class="bola" id="${id}-b${i}"><b>${i + 1}</b></span><span class="texto-item">${esc(x.toUpperCase())}</span></div>`)
      .join("")}</div></div>`;
    entra(`#${id}-c`);
    items.forEach((x, i) => {
      const cuando = Math.min(hasta - 0.3, Math.max(desde + 0.4, cuandoDice(palabras, x, desde, hasta) ?? desde + 0.5 + i * ((hasta - desde - 0.8) / items.length)));
      anim.push(`tl.fromTo("#${id}-i${i}", { opacity: 0.3, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.25, ease: "power2.out" }, ${n2(cuando)});`);
      anim.push(`tl.fromTo("#${id}-b${i}", { scale: 0.6 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, ${n2(cuando)});`);
      sonidos.push({ t: cuando, tipo: "tic" });
    });
  } else if (t.tipo === "comparacion" && d.length >= 2) {
    html = `<div class="caja" id="${id}-c">${rotulo(t.texto)}<div class="dos ajusta" ${ajusta(ancho, conRotulo(t.texto), 64, 22, 1.04)}><div class="lado antes"><span>${esc(d[0].toUpperCase())}</span><svg class="tachado" viewBox="0 0 100 20" preserveAspectRatio="none"><path id="${id}-x" d="M4 12 C 30 6, 70 16, 96 8" pathLength="1"/></svg></div><div class="lado ahora" id="${id}-b" style="background:${acento}"><span>${esc(d[1].toUpperCase())}</span></div></div></div>`;
    entra(`#${id}-c`);
    anim.push(`tl.fromTo("#${id}-x", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.inOut" }, ${n2(desde + 0.5)});`);
    sonidos.push({ t: desde + 0.85, tipo: "tic" });
    anim.push(`tl.fromTo("#${id}-b", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, ${n2(desde + 0.85)});`);
  } else {
    // Título: cada palabra entra con blur-in (una cada 0,11 s) y después se subraya a mano, en rojo.
    // La palabra clave (la que el Editor marcó en MAYÚSCULAS) va en serif itálica y en el color de acento.
    const pal = (t.texto.trim() || d.join(" ")).split(/\s+/).filter(Boolean);
    const clave = claves(pal);
    html = `<div class="caja" id="${id}-c"><h2 class="titulo ajusta" ${ajusta(ancho, alto - 44, 150, 40, 1.02)}>${pal.map((p, i) => (clave[i] ? `<span id="${id}-w${i}" class="clave" style="color:${acento}">${esc(p.toLowerCase())}</span>` : `<span id="${id}-w${i}">${esc(p.toUpperCase())}</span>`)).join(" ")}</h2>${trazo(`${id}-m`)}</div>`;
    entra(`#${id}-c`);
    pal.forEach((_, i) => anim.push(`tl.fromTo("#${id}-w${i}", { opacity: 0, y: 12, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.2, ease: "power3.out" }, ${n2(desde + 0.05 + i * 0.11)});`));
    anim.push(`tl.fromTo("#${id}-m", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, ${n2(desde + 0.15 + pal.length * 0.11)});`);
  }
  return { html, anim, sonidos };
}

/** Arma el index.html de la composición. */
export function composicion(o: { dur: number; palabras: Palabra[]; plan: ResultadoEditor | null; estilo: Estilo; diseno: Diseno; usuario: string; foto?: string; fuente?: { ancho: number; alto: number }; sonidos?: Sonido[] }) {
  const sonidos = o.sonidos ?? [];
  const { dur, estilo } = o;
  const acento = /^#[0-9a-f]{6}$/i.test(estilo.subtitulos.color_resaltado) ? estilo.subtitulos.color_resaltado : "#d97757";
  const s = estilo.subtitulos;
  const lugar = disposicion(o.fuente ?? { ancho: W, alto: H }, o.plan?.encuadre);
  const usuario = o.usuario.replace(/^@/, "").trim();
  const anim: string[] = [];
  const clips: string[] = [];
  const enPanel: string[] = [];

  // Los tiempos: el gancho (cara completa), el cuerpo (dividido, si es pantalla partida) y el cierre (cara completa).
  const conCierre = dur >= 10;
  const tCierre = conCierre ? dur - CIERRE : dur;
  const gancho = (o.plan?.gancho ?? "").trim();
  const planTarjetas = [...(o.plan?.textos ?? [])].filter((t) => t.texto.trim() || t.detalle.some((x) => x.trim())).sort((a, b) => a.desde - b.desde);
  const tGancho = gancho ? Math.min(4, Math.max(2.4, planTarjetas[0]?.desde ?? 2.6), tCierre) : 0;
  // El sticker (momento a cara completa) y la placa de golpe van aparte: como mucho uno de cada uno, en el medio.
  const especial = (tipo: "sticker" | "placa", min: number, max: number) => {
    const t = planTarjetas.find((x) => x.tipo === tipo && x.desde >= tGancho + 1 && x.desde + min <= tCierre - 0.4);
    return t ? { ...t, hasta: Math.min(tCierre - 0.4, t.desde + Math.min(max, Math.max(min, t.hasta - t.desde))) } : null;
  };
  const sticker = especial("sticker", 1.5, 2.4);
  const placa = especial("placa", 1.2, 2);
  const tarjetas = planTarjetas
    .filter((t) => t.tipo !== "sticker" && t.tipo !== "placa")
    .map((t) => ({ ...t, desde: Math.max(tGancho + 0.15, t.desde) }))
    .filter((t, i, a) => t.desde < tCierre - 0.8 && (i === 0 || t.desde - a[i - 1].desde >= 1.2));
  // Sin tarjetas no hay qué mostrar arriba: el panel quedaría vacío, así que va con la cara completa.
  const partida = o.diseno === "partida" && tarjetas.length > 0;
  // En la división el panel nunca queda vacío: la primera tarjeta entra apenas baja el panel.
  if (partida) tarjetas[0].desde = tGancho + 0.15;

  // Las tarjetas del cuerpo: en pantalla partida van dentro del panel y cada una queda hasta la siguiente.
  const flota = lugarPara(lugar, "arriba", 300);
  tarjetas.forEach((t, i) => {
    const sig = tarjetas[i + 1]?.desde ?? tCierre;
    const hasta = partida ? sig : Math.min(sig - 0.1, Math.max(t.hasta, t.desde + 1.6), t.desde + 3.2);
    if (hasta - t.desde < 0.8) return;
    const id = `t${i}`;
    // Adentro de la tarjeta blanca: el panel deja 960 × 540 (menos el margen de la tarjeta); con la cara completa, el lugar libre.
    const { html, anim: a, sonidos: sn } = partida ? tarjeta(t, id, t.desde, hasta, acento, o.palabras, 960 - 80, 540 - 68) : tarjeta(t, id, t.desde, hasta, acento, o.palabras, flota.ancho - 80, flota.alto - 68);
    // Sin cuadros vacíos entre escenas: la tarjeta sale (0,22 s) mientras entra la siguiente.
    const sale = Math.min(dur, hasta + 0.25);
    const vida = `<div class="vida" id="${id}-v">${html}</div>`;
    if (partida) enPanel.push(`<section id="${id}" class="tarjeta-panel clip" data-start="${n2(t.desde)}" data-duration="${n2(sale - t.desde)}">${vida}</section>`);
    else clips.push(`<section id="${id}" class="tarjeta-flota clip" data-start="${n2(t.desde)}" data-duration="${n2(sale - t.desde)}" style="${estiloLugar(flota)}">${vida}</section>`);
    anim.push(...a, `tl.fromTo("#${id}-v", { y: 0, opacity: 1, scale: 1 }, { y: -26, opacity: 0, scale: 0.97, duration: 0.22, ease: "power2.in", immediateRender: false }, ${n2(hasta)});`);
    sonidos.push(...sn);
  });

  // El sticker a cara completa (receta del método): se levanta como una tarjeta, inclinado, y lo cruza un brillo una vez.
  if (sticker) {
    const l = lugarPara(lugar, "arriba", 200, 300);
    clips.push(
      `<section id="sticker" class="tarjeta-flota clip" data-start="${n2(sticker.desde)}" data-duration="${n2(sticker.hasta - sticker.desde)}" style="${estiloLugar(l)};align-items:center"><div class="sticker" id="sticker-c" style="background:${acento}"><div class="sticker-txt ajusta" ${ajusta(l.ancho * 0.75, l.alto - 90, 96, 30, 1.02)}>${esc(sticker.texto.toUpperCase())}</div><i class="brillo" id="sticker-b"></i></div></section>`,
    );
    anim.push(`tl.fromTo("#sticker-c", { rotationX: 70, rotation: -5, scale: 0.6, opacity: 0, transformPerspective: 800 }, { rotationX: 0, rotation: -5, scale: 1, opacity: 1, transformPerspective: 800, duration: 0.45, ease: "back.out(1.6)" }, ${n2(sticker.desde)});`);
    anim.push(`tl.fromTo("#sticker-b", { left: "-20%" }, { left: "110%", duration: 0.55, ease: "power1.inOut" }, ${n2(sticker.desde + 0.45)});`);
    sonidos.push({ t: sticker.desde, tipo: "whoosh" });
  }

  // La placa de golpe (método): pantalla completa, UNA frase grande con la palabra clave en serif itálica, palabras con
  // blur-in, 2 s como máximo.
  if (placa) {
    const pal = placa.texto.split(/\s+/).filter(Boolean).slice(0, 9);
    const clave = claves(pal);
    clips.push(
      `<section id="placa" class="placa clip" data-start="${n2(placa.desde)}" data-duration="${n2(placa.hasta - placa.desde)}"><div class="placa-txt ajusta" id="placa-t" ${ajusta(880, 900, 150, 50, 1.02)}>${pal.map((p, i) => (clave[i] ? `<span id="pl${i}" class="clave" style="color:${acento}">${esc(p.toLowerCase())}</span>` : `<span id="pl${i}">${esc(p.toUpperCase())}</span>`)).join(" ")}</div></section>`,
    );
    pal.forEach((_, i) => anim.push(`tl.fromTo("#pl${i}", { opacity: 0, y: 12, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.2, ease: "power3.out" }, ${n2(placa.desde + 0.05 + i * 0.11)});`));
    sonidos.push({ t: placa.desde, tipo: "whoosh" });
  }

  // El gancho, con la cara completa: la tarjeta se ve desde el cuadro 0 y las letras de la palabra fuerte caen y golpean
  // (receta del método: por letra, de -90 px y escala 1,3 a su lugar con back(2), con el temblor de la tarjeta en el golpe).
  if (gancho) {
    const l = lugarPara(lugar, "arriba", 170, 420);
    const pal = gancho.split(/\s+/).slice(0, 8);
    // La palabra fuerte es la que el Editor escribió en MAYÚSCULAS; si no marcó una (o todas lo están), la más larga.
    const mayus = claves(pal);
    const larga = pal.reduce((m, p, i) => (letrasDe(p).length >= letrasDe(pal[m]).length ? i : m), 0);
    const fuerte = mayus.some(Boolean) ? mayus.indexOf(true) : larga;
    const letras = [...pal[fuerte].toUpperCase()];
    const golpe = 0.14;
    clips.push(
      `<section id="gancho" class="tarjeta-flota clip" data-start="0" data-duration="${n2(tGancho)}" style="${estiloLugar(l)}"><div class="caja gancho" id="gancho-c"><h1 class="ajusta" ${ajusta(l.ancho - 80, l.alto - 68 - 46, 130, 34, 1.02)}>${pal
        .map((p, i) =>
          i === fuerte
            ? `<span class="pal fuerte" style="color:${acento}">${letras.map((c, j) => `<span class="letra" id="gl${j}">${esc(c)}</span>`).join("")}</span>`
            : `<span class="pal">${esc(p.toUpperCase())}</span>`,
        )
        .join(" ")}</h1>${trazo("gancho-m", true)}<div class="mascota-g" id="mg">${mascota("mg-svg", acento, 13)}</div></div></section>`,
    );
    // La mascota actúa el gancho: está agachada sobre la tarjeta en el cuadro 0, salta y cae sobre la palabra fuerte
    // justo en el golpe (se aplasta y rebota, como la lámpara de Pixar).
    anim.push(`tl.fromTo("#mg", { y: 0, scaleY: 0.8, scaleX: 1.1 }, { y: -110, scaleY: 1.1, scaleX: 0.92, duration: Math.max(0.08, ${n2(golpe)}), ease: "power2.out" }, 0);`);
    anim.push(`tl.to("#mg", { y: 0, scaleY: 1, scaleX: 1, duration: 0.12, ease: "power2.in" }, ${n2(golpe)});`);
    anim.push(`tl.to("#mg", { scaleY: 0.62, scaleX: 1.25, duration: 0.06, ease: "power1.out" }, ${n2(golpe + 0.12)});`);
    anim.push(`tl.to("#mg", { scaleY: 1, scaleX: 1, duration: 0.35, ease: "elastic.out(1, 0.45)" }, ${n2(golpe + 0.18)});`);
    anim.push(`tl.to("#mg", { y: -26, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 }, ${n2(golpe + 1.1)});`);
    letras.forEach((_, j) => anim.push(`tl.fromTo("#gl${j}", { y: -90, scale: 1.3 }, { y: 0, scale: 1, duration: 0.19, ease: "back.out(2)" }, ${n2(Math.max(0, golpe - 0.04 + j * 0.022))});`));
    const fin = golpe + 0.15 + letras.length * 0.022;
    anim.push(temblor("#gancho-c", fin));
    sonidos.push({ t: 0, tipo: "platillo", dur: fin }, { t: fin, tipo: "golpe" });
    anim.push(`tl.fromTo("#gancho-m", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, ${n2(fin + 0.2)});`);
  }

  // El cierre, con la cara completa: perfil con la foto y SOLO el @, Seguir → Siguiendo, la palabra que se escribe en
  // la barra de comentarios y la burbuja "te paso … por DM".
  let ySubCierre = lugar.ySub;
  if (conCierre) {
    const cta = (o.plan?.cierre ?? "").trim() || "Seguime para más";
    const palabra = cta.match(/(?<![A-Za-zÁÉÍÓÚÜÑáéíóúüñ])[A-ZÁÉÍÓÚÑ]{3,}(?![A-Za-zÁÉÍÓÚÜÑáéíóúüñ])/)?.[0] ?? "";
    const queTePaso = cta.match(/te (?:lo |la |los |las )?(?:paso|mando|envío)\s+(.+)$/i)?.[1]?.replace(/[.!]+$/, "").trim();
    const burbuja = queTePaso ? `Te paso ${queTePaso} por DM` : "Te lo paso por DM";
    const l = lugarCierre(lugar);
    const escala = Math.min(1, l.alto / ALTO_CIERRE);
    // Si la tarjeta baja hasta donde van los subtítulos, en el cierre los subtítulos van abajo de ella.
    if (l.pegada === "arriba" && l.y + l.alto > lugar.ySub - 58) ySubCierre = Math.min(1720, l.y + l.alto + 74);
    const foto = o.foto && /^data:image\/(jpeg|png|webp);base64,/.test(o.foto) ? `<img class="foto" src="${o.foto}" alt="" />` : `<div class="foto inicial">${esc((usuario || "?").charAt(0).toUpperCase())}</div>`;
    clips.push(
      `<section id="cierre" class="tarjeta-flota clip" data-start="${n2(tCierre)}" data-duration="${n2(CIERRE)}" style="${estiloLugar(l)}"><div class="escala" style="transform:scale(${n2(escala)});transform-origin:50% ${l.pegada === "abajo" ? "100%" : "0%"}"><div class="caja perfil" id="cierre-c">` +
        (usuario
          ? `<div class="fila">${foto}<div class="arroba">@${esc(usuario)}</div><div class="boton"><span id="seguir" style="background:${acento}">Seguir</span><span id="siguiendo">Siguiendo</span></div></div>`
          : `<div class="cta">${esc(cta)}</div>`) +
        (palabra ? `<div class="comentario"><span class="escribe" id="escribe"></span><i id="cursor" style="background:${acento}"></i></div><div class="burbuja" id="burbuja">${esc(burbuja)}</div>` : usuario ? `<div class="cta">${esc(cta)}</div>` : "") +
        `<div class="mascota-c" id="mc">${mascota("mc-svg", acento, 8)}</div>` +
        `</div></div></section>`,
    );
    sonidos.push({ t: tCierre + 0.05, tipo: "whoosh" });
    if (usuario) sonidos.push({ t: tCierre + 0.7, tipo: "click" });
    if (palabra) sonidos.push({ t: tCierre + 1.6, tipo: "click" }, { t: tCierre + 1.75, tipo: "tic" });
    anim.push(`tl.fromTo("#cierre-c", { y: 60, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, ${n2(tCierre)});`);
    if (usuario) anim.push(`tl.fromTo("#siguiendo", { opacity: 0 }, { opacity: 1, duration: 0.12 }, ${n2(tCierre + 0.7)}); tl.fromTo("#seguir", { opacity: 1 }, { opacity: 0, duration: 0.12, immediateRender: false }, ${n2(tCierre + 0.7)});`);
    if (palabra) {
      anim.push(
        `(() => { const el = document.getElementById("escribe"); const o = { p: 0 }; const txt = ${JSON.stringify(palabra)}; tl.fromTo(o, { p: 0 }, { p: 1, duration: 0.6, ease: "none", onUpdate: () => { el.textContent = txt.slice(0, Math.round(o.p * txt.length)); } }, ${n2(tCierre + 1)}); })();`,
      );
      anim.push(`tl.fromTo("#cursor", { opacity: 1 }, { opacity: 0, duration: 0.25, repeat: ${Math.floor(CIERRE / 0.25) - 1}, yoyo: true, ease: "steps(1)" }, ${n2(tCierre)});`);
      // La mascota "tipea" mientras se escribe la palabra (saltitos cortos).
      anim.push(`tl.fromTo("#mc", { y: 0 }, { y: -10, duration: 0.07, ease: "power1.out", yoyo: true, repeat: 7, immediateRender: false }, ${n2(tCierre + 1)});`);
      anim.push(`tl.fromTo("#burbuja", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, ${n2(tCierre + 1.75)});`);
    }
  }

  // La división (solo en pantalla partida): entra después del gancho y sale para el cierre, en 0,22 s; mientras cambia,
  // la cara se reacomoda para no quedar cortada.
  const c = lugar.completo, dv = lugar.dividido;
  if (partida) {
    const geo = (x: "c" | "d") => ({
      panel: x === "c" ? -ZONA : 0,
      persona: x === "c" ? `top: 0, height: ${H}` : `top: ${ZONA}, height: ${H - ZONA}`,
      marco: x === "c" ? `left: ${c.x}, top: ${c.y}, width: ${c.ancho}, height: ${c.alto}` : `left: ${dv.x}, top: ${dv.y}, width: ${dv.ancho}, height: ${dv.alto}`,
    });
    const cambio = (t: number, de: "c" | "d", a: "c" | "d", inmediato: boolean) => {
      const ir = `duration: 0.22, ease: "power2.inOut"${inmediato ? "" : ", immediateRender: false"}`;
      anim.push(`tl.fromTo(".panel", { y: ${geo(de).panel} }, { y: ${geo(a).panel}, ${ir} }, ${n2(t)});`);
      anim.push(`tl.fromTo(".persona", { ${geo(de).persona} }, { ${geo(a).persona}, ${ir} }, ${n2(t)});`);
      anim.push(`tl.fromTo(".marco", { ${geo(de).marco} }, { ${geo(a).marco}, ${ir} }, ${n2(t)});`);
    };
    if (tGancho > 0) {
      cambio(tGancho, "c", "d", true);
      sonidos.push({ t: Math.max(0, tGancho - 0.08), tipo: "whoosh" });
    }
    else anim.push(`tl.set(".panel", { y: 0 }, 0); tl.set(".persona", { ${geo("d").persona} }, 0); tl.set(".marco", { ${geo("d").marco} }, 0);`);
    // El sticker es un momento a cara completa en el medio: la división sale y vuelve a entrar.
    if (sticker) {
      cambio(sticker.desde, "d", "c", false);
      cambio(sticker.hasta, "c", "d", false);
      sonidos.push({ t: sticker.hasta, tipo: "whoosh" });
    }
    if (conCierre) cambio(tCierre, "d", "c", false);
    // La firma anti-copia: el @ chico que salta de esquina cada 6 s (nunca en el gancho; arriba a la izquierda va la etiqueta).
    if (usuario) {
      for (let t = tGancho + 1, k = 0; t < tCierre - 1; t += 6, k++) {
        const e = k % 3;
        anim.push(`tl.set("#f${e}", { opacity: 0.26 }, ${n2(t)}); tl.set("#f${e}", { opacity: 0 }, ${n2(Math.min(t + 6, tCierre))});`);
      }
    }
  }

  // Los subtítulos: bloques de 1 a 3 palabras. En la división, sobre la línea (y ≈ 686); con la cara completa, abajo de
  // la cara. Un bloque que cruza un cambio de pantalla se parte, así cada pedazo va en su lugar.
  if (s.hay && o.palabras.length) {
    const max = Math.max(1, Math.min(4, s.palabras || 3));
    const cortes = [partida ? tGancho : 0, conCierre ? tCierre : 0, ...(partida && sticker ? [sticker.desde, sticker.hasta] : [])].filter((t) => t > 0 && t < dur);
    const enSticker = (t: number) => !!sticker && t >= sticker.desde - 0.001 && t < sticker.hasta - 0.001;
    const entrada: Record<typeof s.animacion, string> = {
      aparece: `{ opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.14 }`,
      pop: `{ scale: 0.8, filter: "blur(4px)" }, { scale: 1, filter: "blur(0px)", duration: 0.16, ease: "back.out(2)" }`,
      golpe: `{ scale: 1.3 }, { scale: 1, duration: 0.14, ease: "power2.out" }`,
      sube: `{ y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.15, ease: "power2.out" }`,
      palabra_por_palabra: `{ opacity: 1 }, { opacity: 1, duration: 0.01 }`,
    };
    bloques(o.palabras, max, 18).forEach((b, i) => {
      const fin = Math.min(dur, Math.max(b.hasta, b.desde + 0.25));
      const puntos = [b.desde, ...cortes.filter((t) => t > b.desde + 0.02 && t < fin - 0.02), fin];
      for (let j = 0; j < puntos.length - 1; j++) {
        const [a0, a1] = [puntos[j], puntos[j + 1]];
        const dividido = partida && a0 >= tGancho - 0.001 && a0 < tCierre - 0.001 && !enSticker(a0);
        const y = (dividido ? ZONA - 4 : a0 >= tCierre - 0.001 ? ySubCierre : lugar.ySub) - 58;
        const sid = `s${i}p${j}`;
        const spans = b.palabras.map((p, k) => `<span id="${sid}w${k}">${esc(s.mayusculas ? p.texto.toUpperCase() : p.texto)}</span>`).join(" ");
        clips.push(`<div id="${sid}" class="sub clip" data-start="${n2(a0)}" data-duration="${n2(a1 - a0)}" style="top:${y}px"><div class="txt" id="${sid}t">${spans}</div></div>`);
        if (j === 0) anim.push(`tl.fromTo("#${sid}t", ${entrada[s.animacion] ?? entrada.pop}, ${n2(a0)});`);
        b.palabras.forEach((p, k) => {
          const dice = Math.max(a0, p.desde);
          if (s.animacion === "palabra_por_palabra" && k > 0 && p.desde > a0) anim.push(`tl.fromTo("#${sid}w${k}", { opacity: 0 }, { opacity: 1, duration: 0.06 }, ${n2(dice)});`);
          if (s.resaltar && dice < a1) {
            anim.push(`tl.set("#${sid}w${k}", { color: "${acento}" }, ${n2(dice)});`);
            if (k < b.palabras.length - 1) anim.push(`tl.set("#${sid}w${k}", { color: "${s.color_texto}" }, ${n2(Math.max(a0, b.palabras[k + 1].desde))});`);
          }
        });
      }
    });
  }

  const fondoSub = {
    pastilla: `background: #262624; color: ${s.color_texto}; padding: 12px 26px; border-radius: 14px;`,
    caja: `background: ${acento}; color: ${TINTA}; padding: 12px 26px; border-radius: 14px;`,
    borde: `color: ${s.color_texto}; -webkit-text-stroke: 10px #000; paint-order: stroke fill; text-shadow: 0 6px 0 #000;`,
    sombra: `color: ${s.color_texto}; text-shadow: 0 6px 18px rgba(0,0,0,.65);`,
    ninguno: `color: ${s.color_texto}; text-shadow: 0 2px 6px rgba(0,0,0,.4);`,
  }[s.fondo];
  const tamSub = { chico: 44, mediano: 52, grande: 68, enorme: 92 }[s.tamano];
  const mono = s.letra === "mono";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="gsap.min.js"></script>
<style>
  @font-face { font-family: "Inter"; src: url("inter.woff2") format("woff2"); font-weight: 900; }
  @font-face { font-family: "JetBrains Mono"; src: url("mono.woff2") format("woff2"); font-weight: 800; }
  @font-face { font-family: "Lora"; src: url("lora.woff2") format("woff2"); font-weight: 700; font-style: italic; }
  body { margin: 0; background: #111; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #111; font-family: "Inter", -apple-system, Arial, sans-serif; color: ${TINTA}; }
  .persona { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
  .marco { position: absolute; left: ${c.x}px; top: ${c.y}px; width: ${c.ancho}px; height: ${c.alto}px; }
  #voz { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: fill; }
  .panel { position: absolute; left: 0; top: 0; width: ${W}px; height: ${ZONA}px; overflow: hidden; background-color: ${PANEL}; transform: translateY(-${ZONA}px);
    background-image: linear-gradient(rgba(29,29,27,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(29,29,27,.06) 2px, transparent 2px);
    background-size: 54px 54px; box-shadow: 0 6px 22px rgba(0,0,0,.25); }
  .etiqueta-panel { position: absolute; left: 44px; top: 40px; display: flex; align-items: center; gap: 12px; font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 800; font-size: 26px; letter-spacing: 4px; color: ${TINTA}; opacity: .75; }
  .etiqueta-panel i, .rotulo i { display: block; width: 13px; height: 13px; border-radius: 7px; background: ${acento}; }
  .firma { position: absolute; font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 800; font-size: 22px; letter-spacing: 3px; color: ${TINTA}; opacity: 0; }
  .tarjeta-panel { position: absolute; left: 60px; top: 96px; width: ${W - 120}px; height: 540px; display: flex; flex-direction: column; justify-content: center; }
  .tarjeta-flota { position: absolute; display: flex; flex-direction: column; }
  .caja { box-sizing: border-box; width: 100%; background: #fff; border-radius: 24px; padding: 34px 40px; box-shadow: 0 18px 44px rgba(0,0,0,.32); }
  .tarjeta-flota .caja { box-shadow: 0 12px 28px rgba(0,0,0,.3); }
  .titulo, .gancho h1 { margin: 0; font-size: 100px; font-weight: 900; letter-spacing: -3px; line-height: 1.02; text-transform: uppercase; }
  .titulo span, .gancho h1 .pal { display: inline-block; }
  .gancho h1 .pal { white-space: nowrap; }
  .gancho h1 .letra { display: inline-block; }
  .gancho { text-align: center; }
  .trazo { display: block; width: 62%; height: 26px; margin-top: 18px; overflow: visible; }
  .trazo.centro { margin-left: auto; margin-right: auto; }
  .trazo path, .tachado path { fill: none; stroke: ${ROJO}; stroke-width: 8; stroke-linecap: round; stroke-dasharray: 1; }
  .rotulo { display: flex; align-items: center; gap: 12px; font-family: "JetBrains Mono", ui-monospace, monospace; font-weight: 800; font-size: 28px; letter-spacing: 4px; height: 28px; margin-bottom: 22px; white-space: nowrap; overflow: hidden; }
  .items { font-size: 56px; }
  .item { display: flex; align-items: center; gap: .38em; margin-top: .28em; }
  .item:first-child { margin-top: 0; }
  .texto-item { font-weight: 900; letter-spacing: -.03em; line-height: 1.05; }
  .bola { flex: none; width: 1.3em; height: 1.3em; border-radius: 50%; background: ${TINTA}; color: #fff; display: flex; align-items: center; justify-content: center; }
  .bola b { font-family: "JetBrains Mono", monospace; font-size: .6em; font-weight: 800; }
  .cifra { font-size: 56px; }
  .num { font-size: 3.6em; font-weight: 900; line-height: 1; letter-spacing: -.04em; color: ${TINTA}; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .etiqueta { font-family: "Lora", Georgia, serif; font-style: italic; font-weight: 700; font-size: 1em; margin-top: .2em; line-height: 1.1; color: ${TINTA}; }
  .dos { display: flex; gap: .4em; font-size: 54px; }
  .lado { position: relative; flex: 1; box-sizing: border-box; border-radius: .4em; padding: .8em .45em; font-weight: 900; letter-spacing: -.03em; line-height: 1.04; text-align: center; }
  .lado.antes { background: #f1f0ec; color: #8a8a85; }
  .lado.ahora { color: #fff; }
  .tachado { position: absolute; left: 8%; top: 38%; width: 84%; height: 26%; overflow: visible; }
  .sello-caja { display: flex; align-items: center; justify-content: center; }
  .sello { display: inline-block; font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 110px; font-weight: 800; letter-spacing: .06em; white-space: nowrap; border: 8px solid; border-radius: 18px; padding: .12em .36em; background: rgba(255,255,255,.95); box-shadow: 0 18px 44px rgba(0,0,0,.25); }
  .escala { width: 100%; }
  .vida { width: 100%; }
  .caja { position: relative; }
  .mascota { display: block; }
  .mascota-g { position: absolute; left: 34px; top: -78px; transform-origin: 50% 100%; }
  .mascota-c { position: absolute; right: 40px; top: -48px; transform-origin: 50% 100%; }
  .titulo .clave, .placa-txt .clave { font-family: "Lora", Georgia, serif; font-style: italic; font-weight: 700; letter-spacing: 0; text-transform: none; }
  .num-caja { position: relative; display: inline-block; }
  .circulo { position: absolute; left: -16%; top: -26%; width: 132%; height: 150%; overflow: visible; }
  .circulo path { fill: none; stroke: ${ROJO}; stroke-width: 7; stroke-linecap: round; stroke-dasharray: 1; }
  .sticker { position: relative; overflow: hidden; border-radius: 26px; padding: 30px 46px; color: #fff; box-shadow: 0 18px 44px rgba(0,0,0,.32); transform-origin: 50% 100%; }
  .sticker-txt { font-weight: 900; font-size: 80px; letter-spacing: -2px; line-height: 1.02; text-align: center; text-transform: uppercase; }
  .brillo { position: absolute; top: -10%; left: -20%; width: 70px; height: 120%; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.75), rgba(255,255,255,0)); transform: skewX(-20deg); }
  .placa { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background-color: ${PANEL};
    background-image: linear-gradient(rgba(29,29,27,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(29,29,27,.06) 2px, transparent 2px); background-size: 54px 54px; }
  .placa-txt { width: 880px; font-weight: 900; font-size: 120px; letter-spacing: -3px; line-height: 1.02; text-align: center; text-transform: uppercase; color: ${TINTA}; }
  .placa-txt span { display: inline-block; }
  .perfil .fila { display: flex; align-items: center; gap: 22px; }
  .foto { width: 110px; height: 110px; border-radius: 55px; object-fit: cover; flex: none; }
  .foto.inicial { background: ${TINTA}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 54px; font-weight: 900; }
  .arroba { flex: 1; font-weight: 900; font-size: 44px; letter-spacing: -1px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .boton { position: relative; width: 230px; height: 70px; flex: none; }
  .boton span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; border-radius: 16px; font-size: 32px; font-weight: 900; color: #fff; }
  #siguiendo { background: #e6e5e1; color: ${TINTA}; }
  .comentario { margin-top: 24px; height: 84px; box-sizing: border-box; border-radius: 42px; border: 3px solid #e3e2de; display: flex; align-items: center; padding: 0 32px; font-family: "JetBrains Mono", monospace; font-weight: 800; font-size: 38px; letter-spacing: 3px; }
  .comentario i { display: block; width: 4px; height: 44px; margin-left: 4px; }
  .burbuja { margin-top: 18px; margin-left: auto; width: fit-content; max-width: 90%; background: ${acento}; color: #fff; border-radius: 26px 26px 6px 26px; padding: 18px 28px; font-size: 34px; font-weight: 900; line-height: 1.1; }
  .cta { margin-top: 20px; font-weight: 900; font-size: 52px; letter-spacing: -2px; line-height: 1.05; text-transform: uppercase; }
  .perfil > .cta:first-child { margin-top: 0; }
  .sub { position: absolute; left: 40px; width: ${W - 80}px; height: 116px; display: flex; align-items: center; justify-content: center; }
  .sub .txt { font-family: ${LETRAS[s.letra] ?? LETRAS.moderna}; font-size: ${tamSub}px; font-weight: ${mono ? 800 : 900}; line-height: 1.1; text-align: center; letter-spacing: ${mono ? 5 : -1}px; ${fondoSub} }
  .sub .txt span { display: inline-block; }
</style>
</head>
<body>
<div id="root" data-composition-id="hookia" data-start="0" data-width="${W}" data-height="${H}" data-duration="${n2(dur)}">
  <div class="persona"><div class="marco"><video id="voz" src="base.mp4" data-start="0" data-duration="${n2(dur)}" muted playsinline></video></div></div>
  ${
    partida
      ? `<div class="panel">${usuario ? `<div class="etiqueta-panel"><i></i>@${esc(usuario)}</div><div class="firma" id="f0" style="right:44px;top:44px">@${esc(usuario)}</div><div class="firma" id="f1" style="right:44px;top:${ZONA - 84}px">@${esc(usuario)}</div><div class="firma" id="f2" style="left:44px;top:${ZONA - 84}px">@${esc(usuario)}</div>` : ""}\n    ${enPanel.join("\n    ")}\n  </div>`
      : ""
  }
  ${clips.join("\n  ")}
</div>
<script>
  (function () {
    // Primero las letras: con ellas cargadas se achica cada texto para que entre en su lugar, y recién ahí se arma la animación.
    var root = document.getElementById("root");
    var medidor = document.createElement("div");
    medidor.style.cssText = "position:absolute;left:-8000px;top:0;visibility:hidden;box-sizing:border-box;";
    root.appendChild(medidor);
    function ajustar(el) {
      var d = el.dataset, ancho = +d.ancho, alto = +d.alto, min = +d.min || 24, t = +d.max;
      var cs = getComputedStyle(el);
      medidor.className = el.className;
      medidor.style.width = ancho + "px";
      medidor.style.fontFamily = cs.fontFamily;
      medidor.style.fontWeight = cs.fontWeight;
      medidor.style.fontStyle = cs.fontStyle;
      medidor.style.letterSpacing = cs.letterSpacing;
      medidor.style.textTransform = cs.textTransform;
      medidor.style.lineHeight = d.linea || "1.05";
      medidor.innerHTML = el.innerHTML;
      for (; t > min; t -= 2) {
        medidor.style.fontSize = t + "px";
        if (medidor.scrollHeight <= alto && medidor.scrollWidth <= medidor.clientWidth + 1) break;
      }
      medidor.innerHTML = "";
      el.style.fontSize = t + "px";
    }
    function armar() {
      document.querySelectorAll(".ajusta").forEach(ajustar);
      medidor.remove();
      document.querySelectorAll("[data-inicio]").forEach(function (el) { el.textContent = el.getAttribute("data-inicio"); });
      const tl = gsap.timeline({ paused: true });
      ${anim.join("\n      ")}
      window.__timelines["hookia"] = tl;
      if (window.__hfForceTimelineRebind) window.__hfForceTimelineRebind();
    }
    var cargas = ['900 100px "Inter"', '800 40px "JetBrains Mono"', 'italic 700 40px "Lora"'].map(function (f) { return document.fonts.load(f).catch(function () { return null; }); });
    Promise.all(cargas).then(function () { return document.fonts.ready; }).then(armar, armar);
  })();
</script>
</body>
</html>
`;
}

// Los efectos, generados con ffmpeg (sin bajar nada): suaves, como pide el método (volúmenes de 0,08 a 0,25; el platillo, 0,35).
const EFECTOS: Record<Sonido["tipo"], { fuente: (dur: number) => string; volumen: number }> = {
  platillo: { fuente: (d) => `anoisesrc=d=${n2(d)}:c=white:r=48000:a=0.5,highpass=f=4000,afade=t=in:d=${n2(d)}:curve=exp`, volumen: 0.35 },
  golpe: { fuente: () => "sine=f=85:d=0.22:r=48000,afade=t=out:st=0.02:d=0.2", volumen: 0.25 },
  whoosh: { fuente: () => "anoisesrc=d=0.32:c=pink:r=48000:a=0.6,highpass=f=500,lowpass=f=4000,afade=t=in:d=0.16,afade=t=out:st=0.16:d=0.16", volumen: 0.12 },
  tic: { fuente: () => "sine=f=2400:d=0.05:r=48000,afade=t=out:st=0.004:d=0.046", volumen: 0.15 },
  click: { fuente: () => "sine=f=1400:d=0.03:r=48000,afade=t=out:st=0.003:d=0.027", volumen: 0.1 },
};

/** Los argumentos de ffmpeg que mezclan la voz (entrada 1) con los efectos; sin efectos, la voz tal cual. */
function conSonidos(sonidos: Sonido[], dur: number) {
  // Dos efectos del mismo tipo casi juntos suenan a uno: se deja el primero.
  const lista = [...sonidos].sort((a, b) => a.t - b.t).filter((x, i, a) => x.t < dur - 0.05 && !a.slice(0, i).some((y) => y.tipo === x.tipo && x.t - y.t < 0.35));
  if (!lista.length) return ["-map", "0:v", "-map", "1:a", "-c:a", "copy"];
  const partes = lista.map((x, i) => `${EFECTOS[x.tipo].fuente(Math.max(0.1, x.dur ?? 0))},aformat=sample_rates=48000:channel_layouts=stereo,volume=${EFECTOS[x.tipo].volumen},adelay=${Math.round(x.t * 1000)}:all=1[e${i}]`);
  const grafo = `${partes.join(";")};[1:a]aformat=sample_rates=48000:channel_layouts=stereo[voz];[voz]${lista.map((_, i) => `[e${i}]`).join("")}amix=inputs=${lista.length + 1}:duration=first:normalize=0,alimiter=limit=0.95[a]`;
  return ["-filter_complex", grafo, "-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "192k", "-t", n2(dur).toString()];
}

/**
 * La auditoría visual del preset: el agente Editor mira cuadros de TODO el video terminado (hasta 48, con el cuadro 0)
 * y revisa que la cara se vea entera, que nada quede vacío o tapado y que los textos se lean.
 */
export async function auditoriaVisual(o: { video: string; dur: number; diseno: Diseno; paso: (t: string) => Promise<void> }) {
  const m = await medir(o.video);
  // El método pide mirar cuadros de TODO el video: uno cada medio segundo (o menos, en videos largos), hasta 48.
  const cada = Math.max(0.5, o.dur / 47);
  const carpeta = path.join(os.tmpdir(), `hookia-auditoria-${Date.now()}`);
  await mkdir(carpeta, { recursive: true });
  try {
    const imagenes = await cuadrosSeguidos(o.video, m, { desde: 0, hasta: o.dur, cada, columnas: 4, filas: 4, alto: 360, salida: path.join(carpeta, "cuadros"), quien: "El reel terminado", maxHojas: 3 });
    const cuadros = Math.min(48, Math.floor(o.dur / cada) + 1);
    if (!imagenes.length) return { resultado: null, cuadros: 0 };
    await o.paso(`Auditoría visual: tu editor revisa ${cuadros} cuadros del video terminado`);
    const creador = (await leerCreador()) ?? { usuario: "editor", aQueSeDedica: "", queVende: "", aQuien: "", historia: "", captions: [] };
    let resultado = null as ResultadoAuditoriaVideo | null;
    await runAgentLocal(
      Pedido.parse({ tarea: "auditoria_video", creador, respuestas: [], duracion: o.dur, diseno: o.diseno }),
      imagenes,
      (e) => {
        if (e.tipo === "resultado") resultado = e.data as ResultadoAuditoriaVideo;
      },
      { sinWindsor: true },
    );
    return { resultado: resultado as ResultadoAuditoriaVideo | null, cuadros };
  } finally {
    await rm(carpeta, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Renderiza las animaciones sobre el video ya cortado y deja `salida` con el audio original.
 * Devuelve cuántas tarjetas puso; si algo falla, tira un error con el motivo (el editor vuelve a lo simple).
 */
export async function animar(o: {
  dir: string;
  video: string;
  salida: string;
  dur: number;
  palabras: Palabra[];
  plan: ResultadoEditor | null;
  estilo: Estilo;
  diseno: Diseno;
  usuario: string;
  foto?: string;
  paso: (t: string) => Promise<void>;
}) {
  const no = sinAnimaciones();
  if (no) throw new Error(no);
  if (!(await hayChrome())) {
    await o.paso("Bajando el Chrome con el que se dibujan las animaciones (una sola vez)");
    const motivo = await bajarChrome();
    if (motivo) throw new Error(motivo);
  }
  // El proyecto de HyperFrames va en la carpeta temporal, fuera de la de Hookia: el render escribe muchos archivos y,
  // adentro del proyecto, el servidor de Next los ve cambiar y se pone a recompilar y recargar la página sin parar.
  const proyecto = path.join(os.tmpdir(), `hookia-animacion-${path.basename(o.dir)}`);
  await rm(proyecto, { recursive: true, force: true });
  await mkdir(proyecto, { recursive: true });
  await copyFile(o.video, path.join(proyecto, "base.mp4"));
  await copyFile(GSAP, path.join(proyecto, "gsap.min.js"));
  for (const [nombre, archivo] of Object.entries(FUENTES)) await copyFile(archivo, path.join(proyecto, `${nombre}.woff2`));
  const fuente = await medir(o.video);
  const sonidos: Sonido[] = [];
  await writeFile(path.join(proyecto, "index.html"), composicion({ ...o, fuente: { ancho: fuente.ancho, alto: fuente.alto }, sonidos }));
  await o.paso(`Dibujando las animaciones con HyperFrames (${o.diseno === "partida" ? "pantalla dividida" : "pantalla completa"}): puede tardar un par de minutos`);
  let mitad = false;
  const r = await hf(["render", "--quality", "looks", "--output", "animado.mp4"], proyecto, (pct) => {
    if (!mitad && pct >= 50) {
      mitad = true;
      void o.paso("Animaciones a la mitad");
    }
  });
  const animado = path.join(proyecto, "animado.mp4");
  if (r.codigo !== 0 || !existsSync(animado)) throw new Error(`HyperFrames no pudo renderizar: ${r.salida.trim().split("\n").slice(-2).join(" ").slice(0, 200)}`);
  // El video de HyperFrames va sin sonido: se le pone el audio del video cortado, con los efectos del método encima.
  const m = await correr("ffmpeg", ["-hide_banner", "-y", "-i", animado, "-i", o.video, ...conSonidos(sonidos, o.dur), "-c:v", "copy", "-shortest", "-movflags", "+faststart", o.salida]);
  await rm(proyecto, { recursive: true, force: true }).catch(() => {});
  if (m.codigo !== 0) throw new Error(`No pude ponerle el audio a las animaciones: ${ultimoError(m.error)}`);
  return { tarjetas: o.plan?.textos.length ?? 0 };
}
