"use client";

// Editar video: soltás tus tomas y te devuelvo el reel listo para subir. Hookia detecta si hablás a cámara
// (corta las pausas y pone subtítulos) o si mostrás productos o lugares (arma el montaje con textos y música),
// y edita con el método de Paul (lib/video/preset.ts). El video de referencia va a la vista; lo demás opcional (tipo de video,
// subtítulos, color, marca y música) queda en "Más opciones". Todo corre con ffmpeg en tu compu.
import { useEffect, useRef, useState } from "react";
import { Archive, Check, ChevronLeft, CloudUpload, Download, Loader2, Plus, RotateCcw, TriangleAlert, X } from "lucide-react";
import { Aviso, Boton, Campo, Desplegable, Pagina, Pasos, Subir, Tarjeta } from "@/components/ui";
import { claveUsuario, useCreador, useGuardado } from "@/lib/client/store";
import type { Adjunto } from "@/lib/client/media";
import type { Trabajo } from "@/lib/video/editar";

const tiempo = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const coma = (n: number) => n.toFixed(1).replace(".", ",");
const MAX_TOMAS = 30; // igual que lib/video/subida.ts

type Opciones = {
  modo: "auto" | "habla" | "productos";
  estilo: "referencia" | "limpios" | "resaltado" | "pastilla" | "ninguno";
  color: string;
  animacion: "poca" | "media" | "mucha";
  coloresDe: "marca" | "referencia";
  marca: string;
  producto: string;
  precio: string;
  cta: string;
};
const INICIAL: Opciones = { modo: "auto", estilo: "limpios", color: "#FFD60A", animacion: "media", coloresDe: "marca", marca: "", producto: "", precio: "", cta: "" };
const MODOS: { id: Opciones["modo"]; nombre: string }[] = [
  { id: "auto", nombre: "Que lo decida Hookia" },
  { id: "habla", nombre: "Hablo a cámara" },
  { id: "productos", nombre: "Muestro productos o lugares" },
];
const ESTILOS: { id: Opciones["estilo"]; nombre: string }[] = [
  { id: "limpios", nombre: "Limpios" },
  { id: "resaltado", nombre: "Palabra resaltada" },
  { id: "pastilla", nombre: "Pastilla oscura" },
  { id: "ninguno", nombre: "Sin subtítulos" },
];
const COLORES = ["#FFD60A", "#22C55E", "#FF4D8D", "#38BDF8", "#FFFFFF"];
const ANIMACION: { id: Opciones["animacion"]; nombre: string }[] = [
  { id: "poca", nombre: "Poca" },
  { id: "media", nombre: "Media" },
  { id: "mucha", nombre: "Mucha" },
];
type EstadoEditor = { ffmpeg: boolean; subtitulos: boolean; whisper: boolean; animaciones: boolean; sin_animaciones: string | null; brew: boolean; preparando: { estado: "instalando" | "listo" | "error"; paso: string } | null };
type Subida = { id: string; tomas: number; avisos: string[] };
/** Una toma elegida, con su vista previa (un enlace local al archivo, que se libera al sacarla). */
type Toma = { clave: string; file: File; url: string; zip: boolean };

const esZip = (f: File) => /zip/.test(f.type) || /\.zip$/i.test(f.name);
const sirve = (f: File) => f.type.startsWith("video/") || esZip(f) || /\.(mp4|mov|m4v|webm)$/i.test(f.name);

function Chips<T extends string>({ valor, opciones, onCambio }: { valor: T; opciones: { id: T; nombre: string }[]; onCambio: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={o.id}
          onClick={() => onCambio(o.id)}
          aria-pressed={valor === o.id}
          className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${valor === o.id ? "border-sec bg-sec/15 text-text" : "border-line text-text-2 hover:border-line-strong"}`}
        >
          {o.nombre}
        </button>
      ))}
    </div>
  );
}

/** Sube un archivo a la edición (la crea si todavía no hay id). */
function subirUno(file: File, para: "toma" | "musica" | "referencia", id: string, onProgreso: (p: number) => void): Promise<Subida> {
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    const q = new URLSearchParams({ accion: "subir", para, nombre: file.name, ...(id ? { id } : {}) });
    x.open("POST", `/api/editar?${q.toString()}`);
    x.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    x.upload.onprogress = (e) => e.lengthComputable && onProgreso(e.loaded / e.total);
    x.onload = () => {
      try {
        const j = JSON.parse(x.responseText);
        if (x.status === 200 && j.id) ok({ id: j.id, tomas: j.tomas ?? 0, avisos: j.avisos ?? [] });
        else mal(new Error(j.error ?? `No pude subir ${file.name}.`));
      } catch {
        mal(new Error(`No pude subir ${file.name}.`));
      }
    };
    x.onerror = () => mal(new Error("Se cortó la subida. Probá de nuevo."));
    x.send(file);
  });
}

/** La zona grande para soltar los videos (o elegirlos de la compu). */
function ZonaSoltar({ onArchivos }: { onArchivos: (f: File[]) => void }) {
  const [encima, setEncima] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setEncima(true);
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault();
        setEncima(false);
        onArchivos(Array.from(e.dataTransfer.files));
      }}
      className={`flex cursor-pointer flex-col items-center rounded-[20px] border-2 border-dashed px-6 py-16 text-center transition-colors duration-150 focus-within:ring-2 focus-within:ring-sec ${encima ? "border-sec bg-sec/[0.06]" : "border-line hover:border-line-strong"}`}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-sec/12 text-sec">
        <CloudUpload size={26} strokeWidth={1.8} />
      </span>
      <span className="mt-5 text-[19px] font-medium tracking-[-0.01em] text-text">Soltá tu video acá</span>
      <span className="mt-1.5 max-w-[420px] text-[14px] text-text-2">o elegilo de tu compu. Una o varias tomas (MP4 o MOV), o un .zip con todas.</span>
      <span className="mt-6 inline-flex h-10 items-center rounded-full bg-sec px-5 text-[14px] font-medium text-[var(--sec-texto,#fff)]">Elegir video</span>
      <input
        type="file"
        multiple
        accept="video/*,.zip,application/zip"
        className="sr-only"
        onChange={(e) => {
          onArchivos(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </label>
  );
}

/** Las tomas elegidas, en orden, con su primer cuadro. Se pueden sacar o pasar un lugar antes. */
function Miniaturas({ tomas, onSacar, onMover }: { tomas: Toma[]; onSacar: (i: number) => void; onMover: (i: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {tomas.map((t, i) => (
        <div key={t.clave} className="group relative overflow-hidden rounded-[14px] border border-line bg-raised">
          {t.zip ? (
            <div className="flex aspect-[9/16] flex-col items-center justify-center gap-2 px-2 text-text-2">
              <Archive size={22} />
              <span className="text-[12px]">Varias tomas</span>
            </div>
          ) : (
            <video src={`${t.url}#t=0.5`} muted playsInline preload="metadata" className="aspect-[9/16] w-full bg-black object-cover" />
          )}
          <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-[12px] font-medium text-white">{i + 1}</span>
          <div className="absolute top-2 right-2 flex gap-1">
            {i > 0 && (
              <button onClick={() => onMover(i)} aria-label={`Pasar ${t.file.name} un lugar antes`} className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                <ChevronLeft size={13} />
              </button>
            )}
            <button onClick={() => onSacar(i)} aria-label={`Sacar ${t.file.name}`} className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
              <X size={13} />
            </button>
          </div>
          <p className="truncate px-2.5 py-2 text-[12px] text-text-2">{t.file.name}</p>
        </div>
      ))}
    </div>
  );
}

/** ¿La compu está lista para editar? El editor corre acá: si falta algo, Preparar lo instala (una sola vez) y se ve el avance. */
function PrepararEditor() {
  const [e, setE] = useState<EstadoEditor | null>(null);
  useEffect(() => {
    let vivo = true;
    let espera: ReturnType<typeof setTimeout>;
    const mirar = async () => {
      const j = await fetch("/api/editar/preparar", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (!vivo) return;
      if (j) setE(j);
      if (j?.preparando?.estado === "instalando") espera = setTimeout(mirar, 2000);
    };
    mirar();
    window.addEventListener("editor:preparar", mirar);
    return () => {
      vivo = false;
      clearTimeout(espera);
      window.removeEventListener("editor:preparar", mirar);
    };
  }, []);
  if (!e) return null;
  const instalando = e.preparando?.estado === "instalando";
  if (e.ffmpeg && e.subtitulos && e.whisper && e.animaciones && !instalando)
    return (
      <p className="flex items-center gap-2 text-[13px] text-text-3">
        <Check size={14} className="text-good" /> Tu compu está lista para editar.
      </p>
    );
  const preparar = async () => {
    await fetch("/api/editar/preparar", { method: "POST" }).catch(() => null);
    window.dispatchEvent(new Event("editor:preparar"));
  };
  const cosas = [
    { listo: e.ffmpeg, texto: "Cortar las pausas y unir tus tomas (ffmpeg)" },
    { listo: e.subtitulos, texto: "Poner subtítulos y textos animados (ffmpeg completo)" },
    { listo: e.whisper, texto: "Transcribir lo que decís (whisper y su modelo de voz en español, unos 480 MB)" },
    { listo: e.animaciones, texto: e.sin_animaciones ? `Animaciones: ${e.sin_animaciones}` : "Dibujar las animaciones (HyperFrames y su Chrome, unos 100 MB)" },
  ];
  return (
    <Tarjeta className="space-y-4">
      <div className="space-y-1">
        <p className="text-[15px] font-medium">Antes de editar, preparo tu compu</p>
        <p className="text-[13px] text-text-2">El editor corre en tu compu. Es una sola vez y tarda unos minutos.</p>
      </div>
      <ul className="space-y-2">
        {cosas.map((c) => (
          <li key={c.texto} className="flex items-start gap-2.5 text-[14px]">
            {c.listo ? <Check size={16} className="mt-0.5 shrink-0 text-good" /> : <span className="mt-[7px] size-2 shrink-0 rounded-full bg-text-3" />}
            <span className={c.listo ? "text-text-2" : "text-text"}>{c.texto}</span>
          </li>
        ))}
      </ul>
      {instalando ? (
        <p className="flex items-center gap-2 text-[13px] text-text-2">
          <Loader2 size={14} className="animate-spin" /> {e.preparando?.paso.replace(/[.…]+$/, "")}…
        </p>
      ) : (
        <>
          {e.preparando?.estado === "error" && <Aviso>{e.preparando.paso}</Aviso>}
          {!e.brew && (
            <p className="text-[13px] text-text-2">
              Para instalarlo hace falta Homebrew: entrá a{" "}
              <a href="https://brew.sh" target="_blank" rel="noreferrer" className="font-medium text-text underline underline-offset-2">
                brew.sh
              </a>
              , seguí el paso que indica y después tocá Preparar.
            </p>
          )}
          <Boton variante="borde" onClick={preparar}>
            {e.preparando?.estado === "error" ? "Probar de nuevo" : "Preparar"}
          </Boton>
        </>
      )}
    </Tarjeta>
  );
}

export default function Video() {
  const [creador] = useCreador();
  const u = claveUsuario(creador.usuario);
  const [actual, setActual] = useGuardado<string>(`edicion-${u || "_"}`, "");
  const [guardadas, setOpciones] = useGuardado<Opciones>("edicion-opciones-2", INICIAL);
  const opciones = { ...INICIAL, ...guardadas };
  const cambiar = (o: Partial<Opciones>) => setOpciones({ ...opciones, ...o });
  const [tomas, setTomas] = useState<Toma[]>([]);
  const [referencia, setReferencia] = useState<Adjunto[]>([]);
  const [musica, setMusica] = useState<Adjunto[]>([]);
  const [subiendo, setSubiendo] = useState<{ n: number; de: number; p: number } | null>(null);
  const [t, setT] = useState<Trabajo | null>(null);
  const [error, setError] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);
  const conRef = referencia.length > 0;
  // Sin referencia no existe "como la referencia": vuelve a los subtítulos limpios.
  const estilo = opciones.estilo === "referencia" && !conRef ? "limpios" : opciones.estilo;
  const puedeHablar = opciones.modo !== "productos";
  const puedeProductos = opciones.modo !== "habla";

  // Las vistas previas son enlaces locales a los archivos: se liberan al salir de la pantalla.
  const vivas = useRef<Toma[]>([]);
  useEffect(() => {
    vivas.current = tomas;
  }, [tomas]);
  useEffect(() => () => vivas.current.forEach((x) => URL.revokeObjectURL(x.url)), []);
  const agregar = (archivos: File[]) => {
    const validos = archivos.filter(sirve);
    if (validos.length < archivos.length) setError("Solo videos (MP4 o MOV) o un .zip con tus videos.");
    else setError("");
    const nuevas = validos.slice(0, Math.max(0, MAX_TOMAS - tomas.length)).map((file) => ({ clave: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file), zip: esZip(file) }));
    if (validos.length > nuevas.length) setError(`Hasta ${MAX_TOMAS} tomas por video.`);
    setTomas([...tomas, ...nuevas]);
  };
  const sacar = (i: number) => {
    URL.revokeObjectURL(tomas[i].url);
    setTomas(tomas.filter((_, j) => j !== i));
  };
  const mover = (i: number) => setTomas(tomas.map((x, j) => (j === i - 1 ? tomas[i] : j === i ? tomas[i - 1] : x)));

  // Mientras edita, se pregunta cómo va cada segundo y medio.
  useEffect(() => {
    if (!actual) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout>;
    const mirar = async () => {
      const j = await fetch(`/api/editar?id=${actual}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (!vivo) return;
      if (j) setT(j);
      if (!j || j.estado === "procesando") espera = setTimeout(mirar, 1500);
    };
    mirar();
    return () => {
      vivo = false;
      clearTimeout(espera);
    };
  }, [actual]);

  const empezar = async () => {
    if (!tomas.length) return;
    setError("");
    setAvisos([]);
    setT(null);
    // Primero las tomas (en orden), después la referencia y la música.
    const cola = [
      ...tomas.map((x) => ({ file: x.file, para: "toma" as const })),
      ...referencia.map((a) => ({ file: a.file, para: "referencia" as const })),
      ...(puedeProductos ? musica.map((a) => ({ file: a.file, para: "musica" as const })) : []),
    ];
    const total = cola.reduce((s, c) => s + c.file.size, 0) || 1;
    let hecho = 0;
    let id = "";
    const juntados: string[] = [];
    setSubiendo({ n: 1, de: cola.length, p: 0 });
    try {
      for (const [i, c] of cola.entries()) {
        const r = await subirUno(c.file, c.para, id, (p) => setSubiendo({ n: i + 1, de: cola.length, p: (hecho + p * c.file.size) / total }));
        id = r.id;
        hecho += c.file.size;
        juntados.push(...r.avisos);
      }
      const res = await fetch(`/api/editar?accion=empezar&id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...opciones, estilo }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "No pude arrancar la edición.");
      setAvisos(juntados);
      setActual(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubiendo(null);
    }
  };
  const otro = () => {
    tomas.forEach((x) => URL.revokeObjectURL(x.url));
    setActual("");
    setT(null);
    setTomas([]);
    setReferencia([]);
    setMusica([]);
    setAvisos([]);
    setError("");
  };

  const procesando = subiendo !== null || t?.estado === "procesando";
  const r = t?.estado === "listo" ? t.resultado : undefined;
  const todosLosAvisos = [...avisos, ...(r?.avisos ?? [])];

  return (
    <Pagina titulo="Editar video" bajada="Soltá tus tomas y te devuelvo el reel listo para subir, editado con el método de Paul.">
      <div className="space-y-4">
        {!actual && !procesando && (
          <>
            <PrepararEditor />
            <Tarjeta className="space-y-5">
              {!tomas.length ? (
                <ZonaSoltar onArchivos={agregar} />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[15px] font-medium">{tomas.length === 1 ? "Tu video" : `Tus ${tomas.length} tomas, en este orden`}</p>
                    {tomas.length < MAX_TOMAS && (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-text-2 transition-colors focus-within:ring-2 focus-within:ring-sec hover:border-line-strong hover:text-text">
                        <Plus size={14} /> Agregar
                        <input type="file" multiple accept="video/*,.zip,application/zip" className="sr-only" onChange={(e) => { agregar(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
                      </label>
                    )}
                  </div>
                  <Miniaturas tomas={tomas} onSacar={sacar} onMover={mover} />
                  <Boton onClick={empezar} className="h-12 px-6 text-[15px]">Editar video</Boton>
                </>
              )}
              {error && <Aviso>{error}</Aviso>}
            </Tarjeta>

            {/* El video que le gusta a la persona, a la vista: el editor copia su estilo (skill copiar-estilo) con su marca. */}
            <Tarjeta className="space-y-3">
              <Subir
                videos
                maximo={1}
                titulo="¿Tenés un video que te guste cómo está editado? (opcional)"
                ayuda="Subilo y edito tus tomas igual: copio sus subtítulos, sus textos, su ritmo y sus colores, con tu marca."
                adjuntos={referencia}
                onChange={(a) => {
                  setReferencia(a);
                  if (a.length && opciones.estilo === "limpios") cambiar({ estilo: "referencia" });
                }}
                etiqueta={(f) => f.name}
              />
              {conRef && (
                <Chips
                  valor={opciones.coloresDe}
                  opciones={[{ id: "marca", nombre: "Con los colores de mi marca" }, { id: "referencia", nombre: "Con los colores del video" }]}
                  onCambio={(coloresDe) => cambiar({ coloresDe })}
                />
              )}
            </Tarjeta>

            <Desplegable titulo="Más opciones">
              <div className="space-y-6 pb-2 pt-2">
                <div className="space-y-2">
                  <p className="text-[14px] font-medium text-text">Tipo de video</p>
                  <Chips valor={opciones.modo} opciones={MODOS} onCambio={(modo) => cambiar({ modo })} />
                  {opciones.modo === "auto" && <p className="text-[13px]">Escucho tus tomas: si hablás a cámara, corto las pausas y pongo subtítulos; si no, armo el montaje con textos y música.</p>}
                </div>
                {puedeHablar && (
                  <div className="space-y-2">
                    <p className="text-[14px] font-medium text-text">Subtítulos</p>
                    <Chips valor={estilo} opciones={conRef ? [{ id: "referencia", nombre: "Como el video que me gusta" }, ...ESTILOS] : ESTILOS} onCambio={(e) => cambiar({ estilo: e })} />
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-[14px] font-medium text-text">El color de tu marca</p>
                  <div className="flex items-center gap-2">
                    {COLORES.map((c) => (
                      <button
                        key={c}
                        onClick={() => cambiar({ color: c })}
                        aria-label={`Color ${c}`}
                        aria-pressed={opciones.color === c}
                        className={`size-8 rounded-full border-2 transition-transform ${opciones.color === c ? "scale-110 border-text" : "border-line"}`}
                        style={{ background: c }}
                      />
                    ))}
                    <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-[13px] text-text-2">
                      <input type="color" value={opciones.color} onChange={(e) => cambiar({ color: e.target.value })} className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Otro color" />
                      Otro
                    </label>
                  </div>
                </div>
                {puedeHablar && !conRef && estilo !== "ninguno" && (
                  <div className="space-y-2">
                    <p className="text-[14px] font-medium text-text">Cuánta animación</p>
                    <Chips valor={opciones.animacion} opciones={ANIMACION} onCambio={(animacion) => cambiar({ animacion })} />
                  </div>
                )}
                {puedeProductos && (
                  <div className="space-y-4">
                    <p className="text-[14px] font-medium text-text">Si mostrás productos o lugares</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo label="Tu marca" placeholder="El nombre de tu marca o negocio" value={opciones.marca} onChange={(e) => cambiar({ marca: e.target.value })} />
                      <Campo label="Qué mostrás" placeholder="Ej.: camperas de invierno" value={opciones.producto} onChange={(e) => cambiar({ producto: e.target.value })} />
                      <Campo label="Precio u oferta" placeholder="Ej.: $ 2.490 o 2x1" value={opciones.precio} onChange={(e) => cambiar({ precio: e.target.value })} />
                      <Campo label="Qué querés que hagan" placeholder="Ej.: Comprá en el link de la bio" value={opciones.cta} onChange={(e) => cambiar({ cta: e.target.value })} />
                    </div>
                    <Subir
                      maximo={1}
                      acepta="audio/*,video/*"
                      titulo="Música"
                      ayuda="MP3 o M4A (o un video con la canción). Si no subís, uso el sonido de tus tomas."
                      adjuntos={musica}
                      onChange={setMusica}
                      etiqueta={(f) => f.name}
                    />
                  </div>
                )}
              </div>
            </Desplegable>
          </>
        )}

        {procesando && (
          <Tarjeta className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-sec" />
              <p className="text-[17px] font-medium">{subiendo ? "Subiendo tus tomas" : "Editando tu video"}</p>
            </div>
            <p className="text-[13px] text-text-2">
              {subiendo
                ? `${subiendo.de > 1 ? `${subiendo.n} de ${subiendo.de} · ` : ""}${Math.round(subiendo.p * 100)} %`
                : "Suele tardar uno o dos minutos. Podés seguir usando la app: cuando vuelvas, está acá."}
            </p>
            {subiendo && (
              <div className="h-1.5 overflow-hidden rounded-full bg-raised">
                <div className="h-full rounded-full bg-sec transition-[width] duration-200" style={{ width: `${subiendo.p * 100}%` }} />
              </div>
            )}
          </Tarjeta>
        )}
        {t && t.estado === "procesando" && <Pasos pasos={t.pasos} corriendo />}
        {actual && t?.estado === "error" && (
          <div className="space-y-3">
            <Aviso>{t.error}</Aviso>
            <Boton variante="borde" onClick={otro}><RotateCcw size={15} /> Probar de nuevo</Boton>
          </div>
        )}

        {r && actual && (
          <>
            <Tarjeta className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between" i={0}>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-sec">Tu reel está listo</p>
                <p className="font-display text-[34px] leading-tight font-semibold tracking-[-0.03em]">
                  {r.modo === "productos" ? `${r.tomas} toma${r.tomas === 1 ? "" : "s"}` : tiempo(r.antes_s)} <span className="text-text-3">→</span> {tiempo(r.despues_s)}
                </p>
                <p className="text-[14px] text-text-2">
                  {r.modo === "productos"
                    ? `Elegí ${r.cortes?.length ?? 0} planos de tus tomas, con el gancho, los textos y el cierre.`
                    : `${(r.tomas ?? 1) > 1 ? `Uní tus ${r.tomas} tomas, corté` : "Corté"} ${r.pausas_cortadas} pausa${r.pausas_cortadas === 1 ? "" : "s"} y te ahorré ${Math.max(0, Math.round(r.antes_s - r.despues_s))} segundos de tiempo muerto.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={`/api/editar/archivo?id=${actual}&descargar=1`} className="inline-flex h-10 items-center gap-2 rounded-full bg-sec px-4 text-[14px] font-medium text-[var(--sec-texto,#fff)] hover:opacity-90">
                  <Download size={15} /> Descargar el reel
                </a>
                <Boton variante="borde" onClick={otro}>Editar otro</Boton>
              </div>
            </Tarjeta>

            {todosLosAvisos.length > 0 && (
              <div className="space-y-1.5 rounded-[14px] border border-line px-4 py-3">
                {todosLosAvisos.map((a, i) => (
                  <p key={i} className="flex gap-2.5 text-[13px] text-text-2"><TriangleAlert size={15} className="mt-0.5 shrink-0 text-warn" />{a}</p>
                ))}
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
              <Tarjeta className="!p-3 lg:sticky lg:top-6">
                <video src={`/api/editar/archivo?id=${actual}`} controls playsInline className="aspect-[9/16] w-full rounded-[14px] bg-black object-contain" />
              </Tarjeta>
              <div className="space-y-3">
                <Tarjeta className="space-y-4">
                  <p className="text-[15px] font-medium">La auditoría antes de entregártelo</p>
                  <ul className="space-y-2.5">
                    {r.auditoria.detalle.map((d, i) => {
                      const mal = /^(Quedan|Hay|Revisá|Sin transcripción)/.test(d);
                      return (
                        <li key={i} className="flex gap-2.5 text-[14px]">
                          {mal ? <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" /> : <Check size={16} className="mt-0.5 shrink-0 text-good" />}
                          {d}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="space-y-1.5 border-t border-line pt-3 text-[13px] text-text-2">
                    {r.modo === "productos" ? (
                      <>
                        {r.plan === "simple" ? (
                          <p>Tu editor no respondió esta vez: armé un montaje simple, con el tramo del medio de cada toma.</p>
                        ) : (
                          <p className="flex gap-2.5 text-[14px] text-text"><Check size={16} className="mt-0.5 shrink-0 text-good" /> El plan lo hizo tu editor mirando tus tomas{r.corregidos ? `, y el código acomodó ${r.corregidos} corte${r.corregidos === 1 ? "" : "s"} que se salían de la toma o del ritmo` : ""}.</p>
                        )}
                        {r.gancho && <p>Gancho de los primeros 2 segundos: <span className="font-medium text-text">“{r.gancho}”</span></p>}
                        {r.cierre && <p>Placa final: <span className="font-medium text-text">“{r.cierre}”</span></p>}
                        {r.notas && <p><span className="font-medium text-text">Para la próxima: </span>{r.notas}</p>}
                      </>
                    ) : r.subtitulos === "listos" ? (
                      <>
                        {r.animaciones === "hyperframes" ? (
                          <p className="flex gap-2.5 text-[14px] text-text"><Check size={16} className="mt-0.5 shrink-0 text-good" /> Animaciones hechas con HyperFrames: {r.textos ?? 0} tarjetas, {r.diseno === "partida" ? "pantalla partida" : "pantalla completa"}, subtítulos sincronizados y cierre con tu @.</p>
                        ) : (
                          <p className="flex gap-2.5 text-[14px] text-text"><Check size={16} className="mt-0.5 shrink-0 text-good" /> Subtítulos y {r.textos ?? 0} textos clave en pantalla.</p>
                        )}
                        {r.aviso_animaciones && <p className="flex gap-2.5"><TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" /> No pude armar las animaciones: {r.aviso_animaciones.replace(/\.$/, "")}. Usé subtítulos y textos simples.</p>}
                        {r.gancho && <p>Gancho de los primeros 2 segundos: <span className="font-medium text-text">“{r.gancho}”</span></p>}
                        {r.notas && <p><span className="font-medium text-text">Para la próxima: </span>{r.notas}</p>}
                      </>
                    ) : r.subtitulos === "sin_whisper" ? (
                      <p>No puse subtítulos porque falta whisper en tu compu. Tocá “Editar otro”, después “Preparar”, y editalo de nuevo.</p>
                    ) : r.subtitulos === "error" ? (
                      <p>No pude poner los subtítulos esta vez{r.error_subtitulos ? `: ${r.error_subtitulos.replace(/\.$/, "")}` : ""}. Te dejé el video sin pausas.</p>
                    ) : (
                      <p>Sin subtítulos, como pediste.</p>
                    )}
                  </div>
                </Tarjeta>

                {r.referencia && (
                  <Tarjeta className="space-y-3" i={1}>
                    <p className="text-[15px] font-medium">Lo que copié del video que te gusta</p>
                    {r.referencia.que_copio.length > 0 && (
                      <ul className="space-y-2">
                        {r.referencia.que_copio.map((q, i) => (
                          <li key={i} className="flex gap-2.5 text-[14px]"><Check size={16} className="mt-0.5 shrink-0 text-good" />{q}</li>
                        ))}
                      </ul>
                    )}
                    <p className="text-[13px] text-text-2">
                      Medido con código: cambia de plano cada {coma(r.referencia.ritmo)} s ({r.referencia.planos} plano{r.referencia.planos === 1 ? "" : "s"}).
                      {r.modo === "productos" ? " Tu reel va con ese ritmo." : ""}
                    </p>
                    {r.referencia.impronta && <p className="text-[13px] text-text-2"><span className="font-medium text-text">Lo hice tuyo: </span>{r.referencia.impronta}</p>}
                  </Tarjeta>
                )}

                {r.modo === "productos" && !!r.cortes?.length && (
                  <Tarjeta className="space-y-3" i={2}>
                    <p className="text-[15px] font-medium">El montaje, plano por plano</p>
                    <ol className="space-y-2">
                      {r.cortes.map((c, i) => (
                        <li key={i} className="flex items-baseline gap-3 text-[14px]">
                          <span className="w-5 shrink-0 text-right text-text-3">{i + 1}</span>
                          <span className="text-text-2">Toma {c.toma} · {coma(c.hasta - c.desde)} s</span>
                          {c.texto && <span className="truncate font-medium">“{c.texto}”</span>}
                        </li>
                      ))}
                    </ol>
                  </Tarjeta>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Pagina>
  );
}
