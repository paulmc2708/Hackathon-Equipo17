// Las animaciones del editor, hechas con HyperFrames (HTML + GSAP renderizado a video; librería pública de HeyGen).
// El agente Editor decide qué tarjeta va en cada momento (título, lista, número, comparación o palabra clave) y el
// código arma la composición con plantillas: pantalla partida (gráficos arriba sobre fondo claro con cuadrícula y la
// persona abajo) o completa (la persona entera y las tarjetas arriba), subtítulos de 1 a 3 palabras sincronizados con
// lo que dice y la tarjeta final con su @. Se renderiza con el Chrome sin pantalla de HyperFrames y después se le pone
// el audio del video cortado. Si algo de esto falla, el editor vuelve a los subtítulos simples (ASS) y lo avisa.
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

const BIN = path.join(process.cwd(), "node_modules", ".bin", "hyperframes");
const GSAP = path.join(process.cwd(), "node_modules", "gsap", "dist", "gsap.min.js");
const ENV = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1", HYPERFRAMES_NO_UPDATE_CHECK: "1", HYPERFRAMES_SKIP_SKILLS: "1" };
const W = 1080;
const H = 1920;

export type Diseno = "partida" | "completa";
type Tarjeta = ResultadoEditor["textos"][number];

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
  if (!existsSync(BIN) || !existsSync(GSAP)) return "falta instalar HyperFrames: corré npm install en la carpeta de Hookia";
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

const LETRAS: Record<Estilo["subtitulos"]["letra"], string> = {
  moderna: `-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif`,
  gruesa: `"Arial Black", "Helvetica Neue", Arial, sans-serif`,
  condensada: `Impact, "Arial Narrow", sans-serif`,
  redondeada: `"SF Pro Rounded", "Arial Rounded MT Bold", sans-serif`,
  serif: `Georgia, "Times New Roman", serif`,
  manuscrita: `"Marker Felt", "Comic Sans MS", cursive`,
  mono: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`,
};

/** "70%" → {n: 70, antes: "", despues: "%"}: para contar desde 0 un número de la tarjeta. */
function numero(t: string) {
  const m = t.trim().match(/^([^\d]*)(\d{1,3}(?:[.,]\d{3})*|\d+)([^\d]*)$/);
  if (!m) return null;
  const n = Number(m[2].replace(/[.,]/g, ""));
  return Number.isFinite(n) && n > 0 ? { n, antes: m[1], despues: m[3], miles: /[.,]/.test(m[2]) } : null;
}

/** Tamaño de letra para que un título entre en la tarjeta (en pantalla completa, las tarjetas son más chicas). */
const tamanoTitulo = (t: string, k = 1) => Math.round((t.length <= 12 ? 128 : t.length <= 20 ? 104 : t.length <= 32 ? 84 : 68) * k);

/** El HTML de una tarjeta (sin tiempos) y sus animaciones, con el tiempo absoluto en que entra. */
function tarjeta(t: Tarjeta, id: string, desde: number, k = 1) {
  const anim: string[] = [];
  const entra = (sel: string, de = "{ y: 60, scale: 0.94, opacity: 0 }") =>
    anim.push(`tl.fromTo("${sel}", ${de}, { y: 0, x: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.45, ease: "back.out(1.5)" }, ${n2(desde)});`);
  const d = t.detalle.map((x) => x.trim()).filter(Boolean);
  let html = "";
  if (t.tipo === "palabra") {
    html = `<div class="palabra" id="${id}-c">${esc(t.texto)}</div>`;
    entra(`#${id}-c`, "{ scale: 0.6, rotation: -4, opacity: 0 }");
  } else if (t.tipo === "numero") {
    const num = numero(d[0] ?? t.texto);
    const etiqueta = d[0] ? (d[1] ?? t.texto) : (d[1] ?? "");
    html = `<div class="caja" id="${id}-c"><div class="num" id="${id}-n">${esc(d[0] ?? t.texto)}</div>${etiqueta ? `<div class="etiqueta">${esc(etiqueta)}</div>` : ""}</div>`;
    entra(`#${id}-c`);
    if (num) {
      const formato = num.miles ? `Math.round(o.v).toLocaleString("es")` : "Math.round(o.v)";
      anim.push(
        `(() => { const el = document.getElementById("${id}-n"); const o = { v: 0 }; tl.fromTo(o, { v: 0 }, { v: ${num.n}, duration: 0.9, ease: "power2.out", onUpdate: () => { el.textContent = ${JSON.stringify(num.antes)} + ${formato} + ${JSON.stringify(num.despues)}; } }, ${n2(desde + 0.15)}); })();`,
      );
    }
  } else if (t.tipo === "lista" && d.length) {
    html = `<div class="caja" id="${id}-c"><div class="titulo-lista">${esc(t.texto)}</div>${d
      .slice(0, 4)
      .map((x, i) => `<div class="item" id="${id}-i${i}"><span class="bola">${i + 1}</span><span>${esc(x)}</span></div>`)
      .join("")}</div>`;
    entra(`#${id}-c`);
    d.slice(0, 4).forEach((_, i) => anim.push(`tl.fromTo("#${id}-i${i}", { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, ${n2(desde + 0.35 + i * 0.4)});`));
  } else if (t.tipo === "comparacion" && d.length >= 2) {
    html = `<div class="comparacion" id="${id}-c">${t.texto ? `<div class="titulo-lista">${esc(t.texto)}</div>` : ""}<div class="dos"><div class="lado antes" id="${id}-a"><span>${esc(d[0])}</span><i id="${id}-x"></i></div><div class="lado ahora" id="${id}-b"><span>${esc(d[1])}</span></div></div></div>`;
    entra(`#${id}-c`);
    anim.push(`tl.fromTo("#${id}-x", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.inOut" }, ${n2(desde + 0.5)});`);
    anim.push(`tl.fromTo("#${id}-b", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }, ${n2(desde + 0.8)});`);
  } else {
    html = `<div class="caja" id="${id}-c"><h2 style="font-size:${tamanoTitulo(t.texto, k)}px">${esc(t.texto)}</h2><span class="marca" id="${id}-m"></span></div>`;
    entra(`#${id}-c`);
    anim.push(`tl.fromTo("#${id}-m", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, ${n2(desde + 0.35)});`);
  }
  return { html, anim };
}

type Caja = { x: number; y: number; ancho: number; alto: number };

/**
 * Dónde va cada cosa según dónde está la cara (la ubica el agente Editor en cuadros del video):
 * en pantalla partida, el video se recorta (y si la cara es chica, se acerca) para que la cara quede centrada abajo;
 * en pantalla completa, las tarjetas van arriba de la cabeza (o debajo del mentón si no hay lugar) y los subtítulos
 * debajo de la cara, siempre dentro de la zona segura de Meta (14 % de arriba y 35 % de abajo libres).
 */
export function disposicion(fuente: { ancho: number; alto: number }, encuadre: ResultadoEditor["encuadre"] | undefined, partida: boolean) {
  const ok = (x: number, d: number) => (Number.isFinite(x) && x > 0 && x < 1 ? x : d);
  const cx = ok(encuadre?.cara_x ?? NaN, 0.5), cy = ok(encuadre?.cara_y ?? NaN, 0.4), ch = ok(encuadre?.cara_alto ?? NaN, 0.22);
  const sw = fuente.ancho || 1080, sh = fuente.alto || 1920;
  if (partida) {
    const bw = W, bh = H / 2;
    let s = Math.max(bw / sw, bh / sh);
    const objetivo = 0.42 * bh;
    if (ch * sh * s < objetivo) s *= Math.min(1.6, objetivo / (ch * sh * s));
    const vw = sw * s, vh = sh * s;
    const x = Math.min(0, Math.max(bw - vw, bw / 2 - cx * vw));
    const y = Math.min(0, Math.max(bh - vh, bh * 0.46 - cy * vh));
    const video: Caja = { x: Math.round(x), y: Math.round(y), ancho: Math.round(vw), alto: Math.round(vh) };
    return { video, tarjetas: { x: 80, y: 0, ancho: W - 160, alto: H / 2 - 70 } as Caja, ySub: H / 2 - 60 };
  }
  // Pantalla completa: el video cubre todo el cuadro, centrado.
  const s = Math.max(W / sw, H / sh);
  const vh = sh * s;
  const arriba = (H - vh) / 2;
  const caraArriba = arriba + (cy - ch / 2) * vh, caraAbajo = arriba + (cy + ch / 2) * vh;
  const zonaArriba = 0.14 * H;
  let tarjetas: Caja;
  let ySub: number;
  if (caraArriba - 0.02 * H - zonaArriba >= 0.14 * H) {
    tarjetas = { x: 80, y: Math.round(zonaArriba), ancho: W - 160, alto: Math.round(Math.min(0.24 * H, caraArriba - 0.02 * H - zonaArriba)) };
    ySub = Math.round(Math.min(0.64 * H, Math.max(0.5 * H, caraAbajo + 0.03 * H)));
  } else {
    const y = Math.round(Math.min(0.46 * H, Math.max(zonaArriba, caraAbajo + 0.02 * H)));
    tarjetas = { x: 80, y, ancho: W - 160, alto: Math.round(0.17 * H) };
    ySub = Math.round(Math.min(0.66 * H, y + 0.19 * H));
  }
  return { video: { x: 0, y: Math.round(arriba), ancho: W, alto: Math.round(vh) } as Caja, tarjetas, ySub };
}

/** Arma el index.html de la composición. */
export function composicion(o: { dur: number; palabras: Palabra[]; plan: ResultadoEditor | null; estilo: Estilo; diseno: Diseno; usuario: string; fuente?: { ancho: number; alto: number } }) {
  const { dur, estilo, diseno } = o;
  const acento = /^#[0-9a-f]{6}$/i.test(estilo.subtitulos.color_resaltado) ? estilo.subtitulos.color_resaltado : "#7C5CFF";
  const s = estilo.subtitulos;
  const partida = diseno === "partida";
  const anim: string[] = [];
  const clips: string[] = [];
  const lugar = disposicion(o.fuente ?? { ancho: 1080, alto: 1920 }, o.plan?.encuadre, partida);

  // Las tarjetas: después del gancho y antes del cierre. En pantalla partida, cada una queda hasta la siguiente.
  const conCierre = dur >= 8;
  const finTarjetas = conCierre ? dur - 2.2 : dur;
  const gancho = (o.plan?.gancho ?? "").trim();
  const inicio = gancho ? Math.min(2.2, dur) : 0.3;
  const tarjetas = [...(o.plan?.textos ?? [])]
    .filter((t) => t.texto.trim() || t.detalle.some((x) => x.trim()))
    .sort((a, b) => a.desde - b.desde)
    .map((t) => ({ ...t, desde: Math.max(inicio, t.desde) }))
    .filter((t, i, a) => t.desde < finTarjetas - 0.8 && (i === 0 || t.desde - a[i - 1].desde >= 1.2));
  tarjetas.forEach((t, i) => {
    const sig = tarjetas[i + 1]?.desde ?? finTarjetas;
    const hasta = partida ? sig : Math.min(sig - 0.1, Math.max(t.hasta, t.desde + 1.6), t.desde + 3.2);
    if (hasta - t.desde < 0.8) return;
    const id = `t${i}`;
    const { html, anim: a } = tarjeta(t, id, t.desde, partida ? 1 : 0.7);
    clips.push(`<section id="${id}" class="tarjeta clip" data-start="${n2(t.desde)}" data-duration="${n2(hasta - t.desde)}">${html}</section>`);
    anim.push(...a);
  });

  // El gancho: la promesa grande en los primeros 2 segundos. Se ve completo desde el cuadro 0 (el preset lo pide: la
  // primera imagen es la portada) y cada palabra late una vez. En pantalla partida queda hasta la primera tarjeta.
  if (gancho) {
    const pal = gancho.split(/\s+/).slice(0, 8);
    const finGancho = partida && tarjetas[0] ? Math.max(inicio, tarjetas[0].desde) : inicio;
    clips.push(
      `<section id="gancho" class="tarjeta clip" data-start="0" data-duration="${n2(finGancho)}"><div class="gancho-caja"><div class="gancho" id="gancho-t">${esc(pal.join(" "))}</div><span class="marca" id="gancho-m"></span></div></section>`,
    );
    anim.push(`tl.fromTo("#gancho-t", { scale: 1.08 }, { scale: 1, duration: 0.45, ease: "power2.out" }, 0);`);
    anim.push(`tl.fromTo("#gancho-m", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, 0.2);`);
  }

  // El cierre: seguime, el llamado a la acción y su @ (la persona sigue en cuadro).
  if (conCierre) {
    const cta = (o.plan?.cierre ?? "").trim() || "Seguime para más";
    clips.push(
      `<section id="cierre" class="tarjeta clip" data-start="${n2(dur - 2.2)}" data-duration="2.2"><div class="caja cierre" id="cierre-c"><div class="cta">${esc(cta)}</div>${o.usuario ? `<div class="arroba">@${esc(o.usuario)}</div>` : ""}</div></section>`,
    );
    anim.push(`tl.fromTo("#cierre-c", { y: 80, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, ${n2(dur - 2.2)});`);
  }

  // Los subtítulos: bloques de 1 a 3 palabras, con la animación y el resaltado del estilo.
  if (s.hay && o.palabras.length) {
    const max = Math.max(1, Math.min(4, s.palabras || 3));
    bloques(o.palabras, max, partida ? 18 : 16).forEach((b, i) => {
      const fin = Math.min(dur, Math.max(b.hasta, b.desde + 0.25));
      const spans = b.palabras.map((p, j) => `<span id="s${i}w${j}">${esc(s.mayusculas ? p.texto.toUpperCase() : p.texto)}</span>`).join(" ");
      clips.push(`<div id="s${i}" class="sub clip" data-start="${n2(b.desde)}" data-duration="${n2(fin - b.desde)}"><div class="txt" id="s${i}t">${spans}</div></div>`);
      const entrada: Record<typeof s.animacion, string> = {
        aparece: `{ opacity: 0 }, { opacity: 1, duration: 0.1 }`,
        pop: `{ scale: 0.7 }, { scale: 1, duration: 0.15, ease: "back.out(2)" }`,
        golpe: `{ scale: 1.3 }, { scale: 1, duration: 0.14, ease: "power2.out" }`,
        sube: `{ y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.15, ease: "power2.out" }`,
        palabra_por_palabra: `{ opacity: 1 }, { opacity: 1, duration: 0.01 }`,
      };
      anim.push(`tl.fromTo("#s${i}t", ${entrada[s.animacion] ?? entrada.pop}, ${n2(b.desde)});`);
      b.palabras.forEach((p, j) => {
        if (s.animacion === "palabra_por_palabra" && j > 0) anim.push(`tl.fromTo("#s${i}w${j}", { opacity: 0 }, { opacity: 1, duration: 0.06 }, ${n2(Math.max(b.desde, p.desde))});`);
        if (s.resaltar) {
          anim.push(`tl.set("#s${i}w${j}", { color: "${acento}" }, ${n2(Math.max(b.desde, p.desde))});`);
          if (j < b.palabras.length - 1) anim.push(`tl.set("#s${i}w${j}", { color: "${s.color_texto}" }, ${n2(Math.max(b.desde, b.palabras[j + 1].desde))});`);
        }
      });
    });
  }

  const fondoSub = {
    pastilla: `background: rgba(17,17,17,.9); color: ${s.color_texto}; padding: 14px 30px; border-radius: 18px;`,
    caja: `background: ${acento}; color: #111; padding: 14px 30px; border-radius: 14px;`,
    borde: `color: ${s.color_texto}; -webkit-text-stroke: 10px #111; paint-order: stroke fill;`,
    sombra: `color: ${s.color_texto}; text-shadow: 0 6px 18px rgba(0,0,0,.65);`,
    ninguno: `color: ${s.color_texto}; text-shadow: 0 2px 6px rgba(0,0,0,.4);`,
  }[s.fondo];
  const tamSub = { chico: 50, mediano: 62, grande: 78, enorme: 104 }[s.tamano];
  // Dónde van los subtítulos: en pantalla partida, sobre la línea del medio; si no, debajo de la cara y arriba de la
  // franja de abajo que tapa Instagram (zona segura de Meta: 14 % de arriba, 35 % de abajo y 6 % a los costados libres).
  const ySub = lugar.ySub;
  const v = lugar.video, tj = lugar.tarjetas;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="gsap.min.js"></script>
<style>
  body { margin: 0; background: #111; }
  #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #F4F2EC; font-family: -apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif; }
  .panel { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H / 2}px; background-color: #F4F2EC;
    background-image: linear-gradient(rgba(17,17,17,.07) 2px, transparent 2px), linear-gradient(90deg, rgba(17,17,17,.07) 2px, transparent 2px);
    background-size: 60px 60px; }
  .persona { position: absolute; left: 0; width: ${W}px; overflow: hidden; ${partida ? `top: ${H / 2}px; height: ${H / 2}px;` : `top: 0; height: ${H}px;`} }
  #voz { position: absolute; left: ${v.x}px; top: ${v.y}px; width: ${v.ancho}px; height: ${v.alto}px; object-fit: fill; }
  .tarjeta { position: absolute; left: ${tj.x}px; top: ${tj.y}px; width: ${tj.ancho}px; height: ${tj.alto}px; display: flex; align-items: center; justify-content: center; }
  .caja { box-sizing: border-box; width: 100%; background: #fff; color: #111; border: 4px solid #111; border-radius: 32px; padding: 52px 60px; box-shadow: 12px 12px 0 #111; }
  .caja h2 { margin: 0; line-height: 1.04; letter-spacing: -2px; font-weight: 800; }
  .marca { display: block; height: 16px; width: 46%; background: ${acento}; margin-top: 26px; border-radius: 8px; transform-origin: left center; }
  .palabra { font-size: 190px; line-height: 1; font-weight: 900; letter-spacing: -6px; color: ${acento}; text-align: center; ${partida ? "" : "text-shadow: 0 8px 30px rgba(0,0,0,.35);"} }
  .num { font-size: 200px; line-height: 1; font-weight: 900; letter-spacing: -6px; color: ${acento}; }
  .etiqueta { font-size: 66px; font-weight: 700; margin-top: 18px; line-height: 1.1; }
  .titulo-lista { font-size: 74px; font-weight: 800; letter-spacing: -1px; margin-bottom: 28px; line-height: 1.08; }
  .item { display: flex; align-items: center; gap: 26px; font-size: 64px; font-weight: 600; margin-top: 18px; line-height: 1.15; }
  .bola { flex: none; width: 86px; height: 86px; border-radius: 43px; background: ${acento}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 800; }
  .comparacion { width: 100%; }
  .comparacion .titulo-lista { text-align: center; ${partida ? "" : "color: #fff; text-shadow: 0 4px 16px rgba(0,0,0,.6);"} }
  .dos { display: flex; gap: 28px; }
  .lado { position: relative; flex: 1; box-sizing: border-box; border: 4px solid #111; border-radius: 28px; padding: 48px 32px; font-size: 64px; font-weight: 800; line-height: 1.1; text-align: center; box-shadow: 10px 10px 0 #111; }
  .lado.antes { background: #E8E6E0; color: #6B7280; }
  .lado.antes i { position: absolute; left: 24px; right: 24px; top: 50%; height: 8px; background: #E5484D; border-radius: 4px; transform-origin: left center; }
  .lado.ahora { background: ${acento}; color: #fff; }
  .gancho { font-size: 104px; line-height: 1.04; font-weight: 900; letter-spacing: -3px; text-align: center; color: #111; ${partida ? "" : "color: #fff; text-shadow: 0 6px 24px rgba(0,0,0,.55);"} }
  .gancho-caja { display: flex; flex-direction: column; align-items: center; width: 100%; }
  .gancho-caja .marca { width: 34%; margin-top: 28px; transform-origin: center center; }
  .cierre { text-align: center; }
  .cta { font-size: 76px; font-weight: 900; letter-spacing: -2px; line-height: 1.05; }
  .arroba { font-size: 52px; font-weight: 700; color: ${acento}; margin-top: 20px; }
  .sub { position: absolute; left: 40px; width: ${W - 80}px; top: ${ySub}px; height: 120px; display: flex; align-items: center; justify-content: center; }
  .sub .txt { font-family: ${LETRAS[s.letra] ?? LETRAS.moderna}; font-size: ${tamSub}px; font-weight: 800; line-height: 1.1; text-align: center; ${fondoSub} }
  .sub .txt span { display: inline-block; }
  /* Pantalla completa: tarjetas compactas arriba de la cabeza, para no tapar la cara. */
  .completa .caja { padding: 30px 40px; border-width: 3px; border-radius: 26px; box-shadow: 8px 8px 0 #111; }
  .completa .marca { height: 12px; margin-top: 16px; }
  .completa .num { font-size: 130px; letter-spacing: -4px; }
  .completa .etiqueta { font-size: 44px; margin-top: 10px; }
  .completa .titulo-lista { font-size: 50px; margin-bottom: 14px; }
  .completa .item { font-size: 44px; margin-top: 10px; gap: 18px; }
  .completa .bola { width: 58px; height: 58px; border-radius: 29px; font-size: 32px; }
  .completa .lado { font-size: 44px; padding: 26px 22px; box-shadow: 7px 7px 0 #111; }
  .completa .palabra { font-size: 140px; }
  .completa .gancho { font-size: 84px; }
  .completa .cta { font-size: 56px; }
  .completa .arroba { font-size: 40px; margin-top: 12px; }
</style>
</head>
<body>
<div id="root" class="${partida ? "partida" : "completa"}" data-composition-id="hookia" data-start="0" data-width="${W}" data-height="${H}" data-duration="${n2(dur)}">
  ${partida ? `<div class="panel"></div>` : ""}
  <div class="persona"><video id="voz" src="base.mp4" data-start="0" data-duration="${n2(dur)}" muted playsinline></video></div>
  ${clips.join("\n  ")}
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  ${anim.join("\n  ")}
  window.__timelines["hookia"] = tl;
</script>
</body>
</html>
`;
}

/**
 * La auditoría visual del preset: el agente Editor mira cuadros de TODO el video terminado (hasta 27, con el cuadro 0)
 * y revisa que la cara se vea entera, que nada quede vacío o tapado y que los textos se lean.
 */
export async function auditoriaVisual(o: { video: string; dur: number; diseno: Diseno; paso: (t: string) => Promise<void> }) {
  const m = await medir(o.video);
  const cada = Math.max(1, o.dur / 26);
  const carpeta = path.join(os.tmpdir(), `hookia-auditoria-${Date.now()}`);
  await mkdir(carpeta, { recursive: true });
  try {
    const imagenes = await cuadrosSeguidos(o.video, m, { desde: 0, hasta: o.dur, cada, columnas: 3, filas: 3, alto: 420, salida: path.join(carpeta, "cuadros"), quien: "El reel terminado", maxHojas: 3 });
    const cuadros = Math.min(27, Math.floor(o.dur / cada) + 1);
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
  const fuente = await medir(o.video);
  await writeFile(path.join(proyecto, "index.html"), composicion({ ...o, fuente: { ancho: fuente.ancho, alto: fuente.alto } }));
  await o.paso(`Dibujando las animaciones con HyperFrames (${o.diseno === "partida" ? "pantalla partida" : "pantalla completa"}): puede tardar un par de minutos`);
  let mitad = false;
  const r = await hf(["render", "--quality", "looks", "--output", "animado.mp4"], proyecto, (pct) => {
    if (!mitad && pct >= 50) {
      mitad = true;
      void o.paso("Animaciones a la mitad");
    }
  });
  const animado = path.join(proyecto, "animado.mp4");
  if (r.codigo !== 0 || !existsSync(animado)) throw new Error(`HyperFrames no pudo renderizar: ${r.salida.trim().split("\n").slice(-2).join(" ").slice(0, 200)}`);
  // El video de HyperFrames va sin sonido: se le pone el audio del video cortado.
  // El audio se copia tal cual (ya está normalizado): recodificarlo le suma un silencio al final.
  const m = await correr("ffmpeg", ["-hide_banner", "-y", "-i", animado, "-i", o.video, "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", "-movflags", "+faststart", o.salida]);
  await rm(proyecto, { recursive: true, force: true }).catch(() => {});
  if (m.codigo !== 0) throw new Error(`No pude ponerle el audio a las animaciones: ${ultimoError(m.error)}`);
  return { tarjetas: o.plan?.textos.length ?? 0 };
}
