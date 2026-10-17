"use client";

// Editar video, para cualquier persona o negocio. Dos tipos de video:
// - Hablo a cámara (marca personal, coach, profesional): une tus tomas en orden, corta las pausas de más de 0,3 s,
//   deja el audio parejo y pone subtítulos y textos.
// - Muestro productos o lugares (ropa, comida, una tienda, un local, una casa): el agente Editor mira tus tomas,
//   elige el mejor tramo de cada una y arma el reel vertical con textos, placa final y música.
// En los dos, si subís un video que te guste, el Editor copia su estilo con tu marca. Todo corre con ffmpeg en tu compu.
import { useEffect, useState } from "react";
import { Check, Download, Mic, RotateCcw, ShoppingBag, TriangleAlert } from "lucide-react";
import { Aviso, Boton, Campo, Pagina, Pasos, Subir, Tarjeta } from "@/components/ui";
import { claveUsuario, useCreador, useGuardado } from "@/lib/client/store";
import type { Adjunto } from "@/lib/client/media";
import type { Trabajo } from "@/lib/video/editar";

const tiempo = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const coma = (n: number) => n.toFixed(1).replace(".", ",");

type Modo = "habla" | "productos";
type Opciones = {
  modo: Modo;
  estilo: "referencia" | "limpios" | "resaltado" | "pastilla" | "ninguno";
  color: string;
  animacion: "poca" | "media" | "mucha";
  coloresDe: "marca" | "referencia";
  marca: string;
  producto: string;
  precio: string;
  cta: string;
};
const INICIAL: Opciones = { modo: "habla", estilo: "limpios", color: "#FFD60A", animacion: "media", coloresDe: "marca", marca: "", producto: "", precio: "", cta: "" };
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
const MODOS: { id: Modo; nombre: string; texto: string; icono: typeof Mic }[] = [
  { id: "habla", nombre: "Hablo a cámara", texto: "Marca personal, coach, profesional. Corto las pausas y pongo subtítulos.", icono: Mic },
  { id: "productos", nombre: "Muestro productos o lugares", texto: "Ropa, comida, una tienda, un local, una casa. Armo el reel con tus tomas y tu música.", icono: ShoppingBag },
];
type Whisper = { disponible: boolean; instalacion: { estado: "instalando" | "listo" | "error"; paso: string } | null };
type Subida = { id: string; tomas: number; avisos: string[] };

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

export default function Video() {
  const [creador] = useCreador();
  const u = claveUsuario(creador.usuario);
  const [actual, setActual] = useGuardado<string>(`edicion-${u || "_"}`, "");
  const [guardadas, setOpciones] = useGuardado<Opciones>("edicion-opciones", INICIAL);
  const opciones = { ...INICIAL, ...guardadas };
  const cambiar = (o: Partial<Opciones>) => setOpciones({ ...opciones, ...o });
  const [tomas, setTomas] = useState<Adjunto[]>([]);
  const [referencia, setReferencia] = useState<Adjunto[]>([]);
  const [musica, setMusica] = useState<Adjunto[]>([]);
  const [subiendo, setSubiendo] = useState<{ n: number; de: number; p: number } | null>(null);
  const [t, setT] = useState<Trabajo | null>(null);
  const [error, setError] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);
  const [whisper, setWhisper] = useState<Whisper | null>(null);
  const productos = opciones.modo === "productos";
  const conRef = referencia.length > 0;
  // Sin referencia no existe "como la referencia": vuelve a los subtítulos limpios.
  const estilo = opciones.estilo === "referencia" && !conRef ? "limpios" : opciones.estilo;

  // ¿Hay whisper para los subtítulos? Mientras se instala, se pregunta cada 3 s.
  useEffect(() => {
    let vivo = true;
    let espera: ReturnType<typeof setTimeout>;
    const mirar = async () => {
      const j = await fetch("/api/editar/whisper", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (!vivo) return;
      if (j) setWhisper(j);
      if (j?.instalacion?.estado === "instalando") espera = setTimeout(mirar, 3000);
    };
    mirar();
    window.addEventListener("whisper:instalar", mirar);
    return () => {
      vivo = false;
      clearTimeout(espera);
      window.removeEventListener("whisper:instalar", mirar);
    };
  }, []);
  const instalar = async () => {
    await fetch("/api/editar/whisper", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "instalar" }) }).catch(() => null);
    window.dispatchEvent(new Event("whisper:instalar"));
  };

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
      ...tomas.map((a) => ({ file: a.file, para: "toma" as const })),
      ...referencia.map((a) => ({ file: a.file, para: "referencia" as const })),
      ...(productos ? musica.map((a) => ({ file: a.file, para: "musica" as const })) : []),
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
    <Pagina titulo="Editar video" bajada="Subís tus tomas y te devuelvo el reel listo, con el método de edición de Paul. Si me pasás un video que te guste, copio su estilo con tu marca.">
      <div className="space-y-6">
        {!actual && (
          <Tarjeta className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {MODOS.map((m) => {
                const activo = opciones.modo === m.id;
                const Icono = m.icono;
                return (
                  <button
                    key={m.id}
                    onClick={() => cambiar({ modo: m.id })}
                    aria-pressed={activo}
                    className={`flex gap-3 rounded-[14px] border px-4 py-3.5 text-left transition-colors ${activo ? "border-sec bg-sec/10" : "border-line hover:border-line-strong"}`}
                  >
                    <Icono size={18} className={`mt-0.5 shrink-0 ${activo ? "text-sec" : "text-text-3"}`} />
                    <span className="space-y-0.5">
                      <span className="block text-[14px] font-medium text-text">{m.nombre}</span>
                      <span className="block text-[13px] text-text-2">{m.texto}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <Subir
              videos
              numerar
              maximo={8}
              acepta="video/*,.zip,application/zip"
              titulo={productos ? "Tus tomas" : "Tus tomas, en orden"}
              ayuda={productos ? "Hasta 8 videos (MP4 o MOV), o un .zip con todos. Yo elijo el orden." : "Hasta 8 videos (MP4 o MOV), o un .zip con todos. Los uno en este orden."}
              adjuntos={tomas}
              onChange={setTomas}
              etiqueta={(f) => f.name}
            />

            <div className="space-y-3">
              <Subir
                videos
                maximo={1}
                titulo="Un video que te guste (opcional)"
                ayuda="Guardá el reel que te gusta y subilo. Copio sus subtítulos, sus textos, su ritmo y sus colores, con tu marca."
                adjuntos={referencia}
                onChange={(a) => {
                  setReferencia(a);
                  if (a.length && opciones.estilo === "limpios") cambiar({ estilo: "referencia" });
                }}
                etiqueta={(f) => f.name}
              />
              {conRef && (
                <div className="space-y-2">
                  <p className="text-[14px] font-medium">Colores</p>
                  <Chips
                    valor={opciones.coloresDe}
                    opciones={[{ id: "marca", nombre: "Los de mi marca" }, { id: "referencia", nombre: "Los del video que me gusta" }]}
                    onCambio={(coloresDe) => cambiar({ coloresDe })}
                  />
                </div>
              )}
            </div>

            {productos && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Tu marca" placeholder="El nombre de tu marca o negocio" value={opciones.marca} onChange={(e) => cambiar({ marca: e.target.value })} />
                  <Campo label="Qué mostrás" placeholder="Ej.: camperas de invierno" value={opciones.producto} onChange={(e) => cambiar({ producto: e.target.value })} />
                  <Campo label="Precio u oferta (opcional)" placeholder="Ej.: $ 2.490 o 2x1" value={opciones.precio} onChange={(e) => cambiar({ precio: e.target.value })} />
                  <Campo label="Qué querés que hagan (opcional)" placeholder="Ej.: Comprá en el link de la bio" value={opciones.cta} onChange={(e) => cambiar({ cta: e.target.value })} />
                </div>
                <Subir
                  maximo={1}
                  acepta="audio/*,video/*"
                  titulo="Música (opcional)"
                  ayuda="MP3 o M4A (o un video con la canción). Si no subís, uso el sonido de tus tomas."
                  adjuntos={musica}
                  onChange={setMusica}
                  etiqueta={(f) => f.name}
                />
              </div>
            )}

            {!productos && (
              <div className="space-y-2">
                <p className="text-[14px] font-medium">Subtítulos (de 1 a 3 palabras)</p>
                <Chips valor={estilo} opciones={conRef ? [{ id: "referencia", nombre: "Como el video que me gusta" }, ...ESTILOS] : ESTILOS} onCambio={(e) => cambiar({ estilo: e })} />
              </div>
            )}

            {(productos || estilo !== "ninguno") && (
              <div className="space-y-2">
                <p className="text-[14px] font-medium">El color de tu marca</p>
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
            )}

            {!productos && estilo !== "ninguno" && (
              <>
                {!conRef && (
                  <div className="space-y-2">
                    <p className="text-[14px] font-medium">Cuánta animación</p>
                    <Chips valor={opciones.animacion} opciones={ANIMACION} onCambio={(animacion) => cambiar({ animacion })} />
                  </div>
                )}
                {whisper && !whisper.disponible && (
                  <div className="flex flex-col gap-3 rounded-[14px] border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[13px] text-text-2">
                      {whisper.instalacion?.estado === "instalando"
                        ? `${whisper.instalacion.paso}…`
                        : whisper.instalacion?.estado === "error"
                          ? whisper.instalacion.paso
                          : "Para los subtítulos necesito whisper en tu compu (transcribe lo que decís). Se instala una sola vez."}
                    </p>
                    {whisper.instalacion?.estado !== "instalando" && <Boton variante="borde" onClick={instalar}>Instalar whisper</Boton>}
                  </div>
                )}
              </>
            )}

            <Boton disabled={!tomas.length} cargando={procesando} onClick={empezar}>{productos ? "Armar mi reel" : "Editar mi video"}</Boton>
          </Tarjeta>
        )}

        {subiendo !== null && (
          <Tarjeta className="space-y-3">
            <p className="text-[14px]">
              Subiendo {subiendo.de > 1 ? `${subiendo.n} de ${subiendo.de}` : "tu video"}… {Math.round(subiendo.p * 100)} %
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-sec transition-[width] duration-200" style={{ width: `${subiendo.p * 100}%` }} />
            </div>
          </Tarjeta>
        )}
        {t && t.estado !== "listo" && <Pasos pasos={t.pasos} corriendo={t.estado === "procesando"} />}
        {(error || t?.estado === "error") && (
          <div className="space-y-3">
            <Aviso>{error || t?.error}</Aviso>
            <Boton variante="borde" onClick={otro}><RotateCcw size={15} /> Probar de nuevo</Boton>
          </div>
        )}

        {r && actual && (
          <>
            <Tarjeta className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between" i={0}>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-sec">{r.modo === "productos" ? "Listo, tu reel" : "Listo, sin pausas"}</p>
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
                      const mal = /^(Quedan|Hay)/.test(d);
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
                        <p className="flex gap-2.5 text-[14px] text-text"><Check size={16} className="mt-0.5 shrink-0 text-good" /> Subtítulos y {r.textos ?? 0} textos clave en pantalla.</p>
                        {r.gancho && <p>Gancho de los primeros 2 segundos: <span className="font-medium text-text">“{r.gancho}”</span></p>}
                        {r.notas && <p><span className="font-medium text-text">Para la próxima: </span>{r.notas}</p>}
                      </>
                    ) : r.subtitulos === "sin_whisper" ? (
                      <p>No puse subtítulos porque falta whisper en tu compu. Instalalo con el botón de arriba (tocá “Editar otro”) y editalo de nuevo.</p>
                    ) : r.subtitulos === "error" ? (
                      <p>No pude poner los subtítulos esta vez: te dejé el video sin pausas.</p>
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
