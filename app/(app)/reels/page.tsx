"use client";

// Mis reels: cada reel mirado segundo a segundo. Los números salen de Windsor y de cuentas hechas acá;
// los cuadros se sacan en el navegador, en los segundos que importan (el gancho y donde se fue la gente).
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Film, Minus, X } from "lucide-react";
import { Aviso, Boton, Charla, Copiar, Pagina, Pasos, Subir, Tarjeta, Vacio } from "@/components/ui";
import { useWindsorConectado } from "@/components/CuentaWindsor";
import { claveUsuario, useCreador, useUltimo, type Creador } from "@/lib/client/store";
import { useAgente } from "@/lib/client/useAgente";
import { cuadrosEnSegundos, type Adjunto } from "@/lib/client/media";
import type { ResultadoReel, ResultadoReels } from "@/lib/agent/tasks";

type Reel = ResultadoReels["reels"][number];
type Guardado = { resultado: ResultadoReel; duracion: number; promedio: number | null; cuadros: { segundo: number; mini: string }[] };

const num = (n: number) => Math.round(n).toLocaleString("es", { useGrouping: "always" } as Intl.NumberFormatOptions);
const seg = (s: number) => `${s.toLocaleString("es", { maximumFractionDigits: 1 })} s`;
const fecha = (f: string) => {
  const d = new Date(f.length <= 10 ? `${f}T12:00:00` : f);
  return Number.isNaN(d.getTime()) ? f : d.toLocaleDateString("es", { day: "numeric", month: "short" });
};
function mediana(xs: (number | null)[]) {
  const o = xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x)).sort((a, b) => a - b);
  if (!o.length) return null;
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}
const portada = (url: string) => (url ? `/api/foto?url=${encodeURIComponent(url)}` : "");

/** Los segundos que se miran: el primer cuadro, el gancho (1, 2, 3 s), donde se va el espectador promedio y el resto repartido. */
function segundosClave(dur: number, promedio: number | null) {
  const lista = [
    { s: 0.05, nota: "el primer cuadro: lo que ve el que viene scrolleando" },
    { s: 1, nota: "el gancho (primeros 3 segundos)" },
    { s: 2, nota: "el gancho (primeros 3 segundos)" },
    { s: 3, nota: "fin del gancho: acá se mide el salteo" },
  ];
  if (promedio && promedio > 3.3 && promedio < dur - 0.2) lista.push({ s: promedio, nota: "acá se va el espectador promedio" });
  const libres = 13 - lista.length;
  for (let i = 0; i < libres; i++) lista.push({ s: 4 + ((dur - 4.3) * (i + 0.5)) / libres, nota: "" });
  return lista
    .filter((x) => x.s < dur && (x.s <= 3.05 || x.s > 3.5))
    .sort((a, b) => a.s - b.s)
    .filter((x, i, a) => i === 0 || x.nota || x.s - a[i - 1].s >= 0.6);
}

/** Lo que se sabe del reel, en texto, con las comparaciones contra sus otros reels hechas acá (no por la IA). */
function datosDelReel(r: Reel | null, todos: Reel[], dur: number) {
  if (!r) return "";
  const visto = r.tiempo_promedio_s && dur ? Math.min(100, (r.tiempo_promedio_s / dur) * 100) : null;
  const medT = mediana(todos.map((x) => x.tiempo_promedio_s));
  const medS = mediana(todos.map((x) => x.salteo_pct));
  const tasa = (x: Reel, k: "compartidos" | "guardados") => (x[k] !== null && x.alcance ? x[k]! / x.alcance : null);
  const medComp = mediana(todos.map((x) => tasa(x, "compartidos")));
  const medGuar = mediana(todos.map((x) => tasa(x, "guardados")));
  const vs = (v: number | null, m: number | null) => (v !== null && m ? ` (${(v / m).toLocaleString("es", { maximumFractionDigits: 1 })} veces la mediana de sus reels)` : "");
  return [
    r.vistas !== null && `Vistas: ${num(r.vistas)}${r.multiplicador !== null ? ` (${r.multiplicador.toLocaleString("es")} veces su promedio)` : ""}`,
    r.alcance !== null && `Alcance: ${num(r.alcance)}`,
    `Duración: ${seg(dur)}`,
    r.tiempo_promedio_s !== null &&
      `Tiempo promedio de reproducción: ${seg(r.tiempo_promedio_s)}${visto !== null ? ` (${Math.round(visto)} % del video)` : ""}${medT ? `; la mediana de sus reels es ${seg(medT)}` : ""}`,
    r.salteo_pct !== null && `Tasa de salteo (se van antes de los 3 s): ${Math.round(r.salteo_pct)} %${medS !== null ? `; la mediana de sus reels es ${Math.round(medS)} %` : ""}`,
    [r.likes !== null && `likes ${num(r.likes)}`, r.comentarios !== null && `comentarios ${num(r.comentarios)}`, r.guardados !== null && `guardados ${num(r.guardados)}`, r.compartidos !== null && `compartidos ${num(r.compartidos)}`]
      .filter(Boolean)
      .join(" · "),
    tasa(r, "compartidos") !== null && `Compartidos por alcance${vs(tasa(r, "compartidos"), medComp)}`,
    tasa(r, "guardados") !== null && `Guardados por alcance${vs(tasa(r, "guardados"), medGuar)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const VEREDICTO = {
  muy_bien: { texto: "Te fue muy bien", color: "var(--good)" },
  bien: { texto: "Te fue bien", color: "var(--c-aqua)" },
  flojo: { texto: "Flojo", color: "var(--warn)" },
  mal: { texto: "No anduvo", color: "var(--bad)" },
} as const;

function guardadoDe(usuario: string, id: string): boolean {
  try {
    return Boolean(localStorage.getItem(`resultado-${claveUsuario(usuario)}-reel-${id}`));
  } catch {
    return false;
  }
}

function TarjetaReel({ r, i, analizado, onElegir }: { r: Reel; i: number; analizado: boolean; onElegir: () => void }) {
  const [sinFoto, setSinFoto] = useState(!r.portada_url);
  return (
    <button onClick={onElegir} className="group text-left">
      <Tarjeta i={i} className="flex h-full gap-4 !p-4 transition-colors group-hover:border-line-strong">
        <div className="relative aspect-[9/16] w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-sec/15">
          {!sinFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portada(r.portada_url)} alt="" className="size-full object-cover" onError={() => setSinFoto(true)} />
          ) : (
            <span className="flex size-full items-center justify-center text-sec">
              <Film size={20} strokeWidth={1.7} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[12px] text-text-3">{fecha(r.fecha)}</p>
          <p className="line-clamp-2 text-[14px]">{r.caption || "Sin texto"}</p>
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            {r.vistas !== null && <span className="rounded-full border border-line px-2 py-0.5 text-text-2">{num(r.vistas)} vistas</span>}
            {r.multiplicador !== null && (
              <span className={`rounded-full px-2 py-0.5 font-medium ${r.multiplicador >= 1 ? "bg-sec/15 text-sec" : "bg-raised text-text-2"}`}>
                {r.multiplicador.toLocaleString("es")}x tu promedio
              </span>
            )}
            {analizado && <span className="rounded-full bg-good/15 px-2 py-0.5 text-good">Analizado</span>}
          </div>
        </div>
      </Tarjeta>
    </button>
  );
}

/** Línea de tiempo del reel: los cuadros en orden, con dónde se fue la gente y hasta dónde mira el promedio. */
function Linea({ g }: { g: Guardado }) {
  const cerca = (s: number) => g.resultado.caidas.find((c) => Math.abs(c.segundo - s) <= Math.max(0.6, g.duracion / 26));
  const pos = (s: number) => `${Math.min(100, Math.max(0, (s / g.duracion) * 100))}%`;
  return (
    <Tarjeta className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[17px] font-medium">Segundo a segundo</p>
        {g.promedio !== null && (
          <span className="text-[13px] text-text-2">
            En promedio miran {seg(g.promedio)} de {seg(g.duracion)} ({Math.round(Math.min(100, (g.promedio / g.duracion) * 100))} %)
          </span>
        )}
      </div>
      <div className="relative h-2 rounded-full bg-raised">
        {g.promedio !== null && <div className="crecer absolute inset-y-0 left-0 rounded-full bg-sec/60" style={{ width: pos(g.promedio) }} />}
        {g.resultado.caidas.map((c, i) => (
          <span key={i} className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-bad" style={{ left: pos(c.segundo) }} title={`Segundo ${seg(c.segundo)}: ${c.cuanto}`} />
        ))}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {g.cuadros.map((c, i) => {
          const caida = cerca(c.segundo);
          return (
            <figure key={i} className="w-[78px] shrink-0 space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.mini} alt={`Segundo ${seg(c.segundo)}`} className={`aspect-[9/16] w-full rounded-[10px] object-cover ${caida ? "ring-2 ring-bad" : ""}`} />
              <figcaption className={`text-center text-[11px] ${caida ? "font-medium text-bad" : "text-text-3"}`}>{seg(c.segundo)}</figcaption>
            </figure>
          );
        })}
      </div>
      <p className="text-[11px] text-text-3">En rojo, donde se fue la gente.</p>
    </Tarjeta>
  );
}

function Diagnostico({ g }: { g: Guardado }) {
  const r = g.resultado;
  const v = VEREDICTO[r.veredicto];
  const mini = (s: number) => g.cuadros.reduce((a, c) => (Math.abs(c.segundo - s) < Math.abs(a.segundo - s) ? c : a), g.cuadros[0]);
  return (
    <div className="space-y-6">
      <Tarjeta className="space-y-3" i={0}>
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium" style={{ color: v.color, background: `color-mix(in oklab, ${v.color} 16%, transparent)` }}>
          {v.texto}
        </span>
        <p className="font-display text-[24px] leading-tight font-semibold tracking-[-0.02em]">{r.titulo}</p>
        <p className="text-[15px] leading-relaxed text-text-2">{r.como_te_fue}</p>
      </Tarjeta>

      <Linea g={g} />

      {r.caidas.length > 0 && (
        <div className="space-y-3">
          <p className="pt-2 text-[17px] font-medium">Dónde se fue la gente</p>
          {r.caidas.map((c, i) => {
            const m = g.cuadros.length ? mini(c.segundo) : null;
            return (
              <Tarjeta key={i} i={i + 1} className="flex gap-4">
                {m && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.mini} alt="" className="aspect-[9/16] w-[64px] shrink-0 rounded-[10px] object-cover ring-2 ring-bad" />
                )}
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[13px] font-medium text-bad">
                    Segundo {seg(c.segundo)} · {c.cuanto}
                  </p>
                  <p className="text-[15px]">{c.que_pasaba}</p>
                  <p className="text-[14px] text-text-2">{c.por_que}</p>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      <Tarjeta className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[17px] font-medium">Tu gancho</p>
          <p className="font-display text-[28px] leading-none font-semibold tracking-[-0.03em]">
            {r.gancho.nota}
            <span className="text-[15px] font-normal text-text-3">/10</span>
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="crecer h-full rounded-full" style={{ width: `${r.gancho.nota * 10}%`, background: r.gancho.nota >= 7 ? "var(--good)" : r.gancho.nota >= 5 ? "var(--warn)" : "var(--bad)" }} />
        </div>
        <p className="text-[14px] text-text-2"><span className="text-text">Qué se ve: </span>{r.gancho.que_se_ve}</p>
        <p className="text-[14px] text-text-2"><span className="text-text">El problema: </span>{r.gancho.problema}</p>
        <div className="space-y-3 rounded-[16px] border border-sec/30 bg-sec/10 p-4">
          <p className="text-[13px] font-medium text-sec">Probá así</p>
          <p className="text-[16px]">“{r.gancho.mejor}”</p>
          <div className="flex flex-wrap items-center gap-3">
            <Copiar texto={r.gancho.mejor} />
            <Link href={`/guiones?idea=${encodeURIComponent(`Rehacer este reel con el gancho: ${r.gancho.mejor}`)}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-sec hover:opacity-80">
              Escribir el guion con este gancho <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Tarjeta>

      <div className="grid gap-3 lg:grid-cols-2">
        {r.funciono.length > 0 && (
          <Tarjeta className="space-y-3">
            <p className="text-[15px] font-medium">Lo que funcionó: repetilo</p>
            <ul className="space-y-2">
              {r.funciono.map((f, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] text-text-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-good" />
                  {f}
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}
        <Tarjeta className="space-y-3 !border-sec/40">
          <p className="text-[15px] font-medium">Para el próximo</p>
          <ol className="space-y-3">
            {r.para_el_proximo.slice(0, 3).map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sec text-[12px] font-semibold text-[var(--sec-texto,#fff)]">{i + 1}</span>
                <div>
                  <p className="text-[14px] font-medium">{p.que}</p>
                  <p className="text-[13px] text-text-2">{p.por_que}</p>
                </div>
              </li>
            ))}
          </ol>
        </Tarjeta>
      </div>

      {r.criterios.length > 0 && (
        <Tarjeta className="space-y-3">
          <p className="text-[15px] font-medium">Lo que miré en los cuadros</p>
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {r.criterios.map((c, i) => (
              <li key={i} className="flex gap-2.5 text-[13px]" title={c.detalle}>
                {c.estado === "bien" ? <Check size={15} className="mt-0.5 shrink-0 text-good" /> : c.estado === "mal" ? <X size={15} className="mt-0.5 shrink-0 text-bad" /> : <Minus size={15} className="mt-0.5 shrink-0 text-text-3" />}
                <span>
                  <span className="text-text">{c.nombre}</span>
                  <span className="block text-text-3">{c.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

      {r.limitaciones && <p className="text-[12px] text-text-3">{r.limitaciones}</p>}
    </div>
  );
}

function AnalisisReel({ reel, todos, creador, onVolver }: { reel: Reel | null; todos: Reel[]; creador: Creador; onVolver: () => void }) {
  const [guardado, guardar] = useUltimo<Guardado>(`reel-${reel?.id || "manual"}`);
  const [video, setVideo] = useState<Adjunto[]>([]);
  const [capturas, setCapturas] = useState<Adjunto[]>([]);
  const [previos, setPrevios] = useState<string[]>([]);
  const [preparando, setPreparando] = useState(false);
  const [error, setError] = useState("");
  // Los cuadros de esta corrida: en un ref para el aviso de resultado y en estado para dibujarlos.
  const meta = useRef<Omit<Guardado, "resultado"> | null>(null);
  const [cuadrosAhora, setCuadrosAhora] = useState<Omit<Guardado, "resultado"> | null>(null);
  const ag = useAgente<ResultadoReel>("reel", (res) => {
    if (meta.current) guardar({ ...meta.current, resultado: res });
  });
  const ocupado = preparando || ag.corriendo;
  const g = ag.resultado && cuadrosAhora ? { ...cuadrosAhora, resultado: ag.resultado } : ocupado ? null : guardado;

  const analizar = async () => {
    setError("");
    setPreparando(true);
    const pasos: string[] = [];
    const paso = (t: string) => {
      pasos.push(t);
      setPrevios([...pasos]);
    };
    try {
      let archivo: Blob;
      if (video[0]) archivo = video[0].file;
      else if (reel?.video_url) {
        paso("Bajando tu reel de Instagram");
        const r = await fetch(`/api/video?url=${encodeURIComponent(reel.video_url)}`);
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error ?? "No pude bajar el video.");
        archivo = await r.blob();
      } else throw new Error("Subí el video del reel para poder mirarlo.");
      paso("Sacando los cuadros de los segundos clave");
      const promedio = reel?.tiempo_promedio_s ?? null;
      const { duracion, cuadros } = await cuadrosEnSegundos(archivo, (d) => segundosClave(d, promedio));
      if (!cuadros.length || !duracion) throw new Error("No pude leer ese video. Probá con otro archivo (MP4 o MOV).");
      meta.current = { duracion, promedio, cuadros: cuadros.map((c) => ({ segundo: c.segundo, mini: c.mini })) };
      setCuadrosAhora(meta.current);
      setPreparando(false);
      await ag.correr(
        creador,
        [
          ...cuadros.map((c) => ({ file: c.file, etiqueta: `cuadro del segundo ${c.segundo.toFixed(1)} de ${duracion.toFixed(1)}${c.nota ? ` (${c.nota})` : ""}` })),
          ...capturas,
        ],
        { reel: { url: reel?.url ?? "", caption: reel?.caption ?? "", datos: datosDelReel(reel, todos, duracion) } },
      );
    } catch (e) {
      setError((e as Error).message || "Algo falló. Probá de nuevo.");
      setPreparando(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onVolver} className="inline-flex items-center gap-1.5 text-[13px] text-text-2 hover:text-text">
        <ArrowLeft size={14} /> Todos mis reels
      </button>
      <Tarjeta className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] text-text-3">{reel ? fecha(reel.fecha) : "Un reel que subís vos"}</p>
            <p className="mt-1 line-clamp-2 text-[15px]">{reel?.caption || "Subí el video y te digo, segundo a segundo, dónde se te fue la gente y por qué."}</p>
            {reel?.url && (
              <a href={reel.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-text-3 hover:text-text">
                Verlo en Instagram <ArrowUpRight size={12} />
              </a>
            )}
          </div>
          <Boton cargando={ocupado} disabled={!reel?.video_url && !video.length} onClick={analizar}>
            {g ? "Analizar de nuevo" : "Analizar este reel"}
          </Boton>
        </div>
        {!ocupado && (
          <div className="grid gap-3 lg:grid-cols-2">
            {!reel?.video_url && <Subir videos titulo="El video del reel" ayuda="El archivo original, MP4 o MOV." adjuntos={video} onChange={(a) => setVideo(a.slice(-1))} etiqueta={(f) => `su reel (${f.name})`} />}
            <Subir
              titulo="Capturas de sus estadísticas (opcional)"
              ayuda="La de retención (el gráfico) y la de números. Con la de retención te digo el segundo exacto."
              adjuntos={capturas}
              onChange={(a) => setCapturas(a.slice(0, 2))}
              etiqueta={(f) => `captura de las estadísticas de este reel: retención o números (${f.name})`}
            />
          </div>
        )}
      </Tarjeta>
      <Pasos pasos={[...previos, ...ag.pasos]} corriendo={ocupado} />
      {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
      {(error || ag.error) && <Aviso>{error || ag.error}</Aviso>}
      {g && <Diagnostico g={g} />}
    </div>
  );
}

export default function MisReels() {
  const [creador, , listo] = useCreador();
  const { conectado: windsor, cuenta: cuentaW } = useWindsorConectado();
  const [lista, guardarLista] = useUltimo<ResultadoReels>("reels");
  const ag = useAgente<ResultadoReels>("reels", guardarLista);
  const [elegido, setElegido] = useState<Reel | "manual" | null>(null);
  const r = ag.resultado ?? (ag.corriendo ? null : lista);

  if (!listo || windsor === null) return null;
  if (!creador.usuario)
    return (
      <Pagina titulo="Mis reels">
        <Vacio titulo="Primero contame quién sos" texto="Necesito tu usuario para traer tus reels.">
          <Link href="/"><Boton>Completar mis datos</Boton></Link>
        </Vacio>
      </Pagina>
    );

  const propia = windsor && (!cuentaW || claveUsuario(creador.usuario) === cuentaW);
  if (elegido)
    return (
      <Pagina titulo="Mis reels" bajada="Dónde se te fue la gente, por qué y qué hacer en el próximo.">
        <AnalisisReel reel={elegido === "manual" ? null : elegido} todos={r?.reels ?? []} creador={creador} onVolver={() => setElegido(null)} />
      </Pagina>
    );

  return (
    <Pagina
      titulo="Mis reels"
      bajada="Cada reel, segundo a segundo: dónde se te fue la gente, por qué y qué hacer en el próximo."
      accion={
        propia ? (
          <Boton cargando={ag.corriendo} onClick={() => ag.correr(creador)}>
            {r?.reels.length ? "Actualizar" : "Traer mis reels"}
          </Boton>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {!propia && (
          <Tarjeta className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] font-medium">{windsor ? `Windsor es de @${cuentaW}, no de @${creador.usuario}` : "Conectá Windsor para traer tus reels solos"}</p>
              <p className="mt-1 text-[13px] text-text-2">Mientras, subí el video de un reel y te lo analizo igual.</p>
            </div>
            <Boton variante="borde" onClick={() => setElegido("manual")}>Subir un reel</Boton>
          </Tarjeta>
        )}
        <Pasos pasos={ag.pasos} corriendo={ag.corriendo} />
        {ag.mensaje && !ag.corriendo && <Charla mensaje={ag.mensaje} onResponder={ag.responder} />}
        {ag.error && <Aviso>{ag.error}</Aviso>}
        {propia && !r && !ag.corriendo && !ag.pasos.length && (
          <Vacio titulo="Todavía no trajiste tus reels" texto="Traigo tus últimos reels con sus números y elegís cuál mirar segundo a segundo.">
            <Boton onClick={() => ag.correr(creador)}>Traer mis reels</Boton>
          </Vacio>
        )}
        {r && (
          <>
            {r.reels.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {r.reels.map((x, i) => (
                  <TarjetaReel key={x.id || i} r={x} i={i} analizado={guardadoDe(creador.usuario, x.id || "")} onElegir={() => setElegido(x)} />
                ))}
              </div>
            ) : (
              <Vacio titulo="No encontré reels en tu cuenta" texto={r.limitaciones || "Probá de nuevo en un rato o subí el video a mano."}>
                <Boton variante="borde" onClick={() => setElegido("manual")}>Subir un reel</Boton>
              </Vacio>
            )}
            {propia && r.reels.length > 0 && (
              <button onClick={() => setElegido("manual")} className="text-[13px] font-medium text-sec hover:opacity-80">
                O subí otro video a mano
              </button>
            )}
            {r.limitaciones && r.reels.length > 0 && <p className="text-[12px] text-text-3">{r.limitaciones}</p>}
          </>
        )}
      </div>
    </Pagina>
  );
}
