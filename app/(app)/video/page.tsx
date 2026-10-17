"use client";

// Editar video, primera parte: subís una toma y te la devuelvo sin pausas de más de 0,3 s, con el audio parejo
// y auditada, con el método de edición de Paul (lib/video/preset.ts). Todo corre con ffmpeg en tu compu.
import { useEffect, useState } from "react";
import { Check, Download, RotateCcw, TriangleAlert } from "lucide-react";
import { Aviso, Boton, Pagina, Pasos, Subir, Tarjeta } from "@/components/ui";
import { claveUsuario, useCreador, useGuardado } from "@/lib/client/store";
import type { Adjunto } from "@/lib/client/media";
import type { Trabajo } from "@/lib/video/editar";

const tiempo = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

type Opciones = { estilo: "limpios" | "resaltado" | "pastilla" | "ninguno"; color: string; animacion: "poca" | "media" | "mucha" };
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
type Whisper = { disponible: boolean; instalacion: { estado: "instalando" | "listo" | "error"; paso: string } | null };

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

function subir(file: File, o: Opciones, onProgreso: (p: number) => void): Promise<string> {
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open("POST", `/api/editar?${new URLSearchParams(o).toString()}`);
    x.setRequestHeader("Content-Type", file.type || "video/mp4");
    x.upload.onprogress = (e) => e.lengthComputable && onProgreso(e.loaded / e.total);
    x.onload = () => {
      try {
        const j = JSON.parse(x.responseText);
        if (x.status === 200 && j.id) ok(j.id);
        else mal(new Error(j.error ?? "No pude subir el video."));
      } catch {
        mal(new Error("No pude subir el video."));
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
  const [video, setVideo] = useState<Adjunto[]>([]);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const [t, setT] = useState<Trabajo | null>(null);
  const [error, setError] = useState("");
  const [opciones, setOpciones] = useGuardado<Opciones>("edicion-opciones", { estilo: "limpios", color: "#FFD60A", animacion: "media" });
  const [whisper, setWhisper] = useState<Whisper | null>(null);
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
    const f = video[0]?.file;
    if (!f) return;
    setError("");
    setT(null);
    setSubiendo(0);
    try {
      const id = await subir(f, opciones, setSubiendo);
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
    setVideo([]);
  };

  const procesando = subiendo !== null || t?.estado === "procesando";
  const r = t?.estado === "listo" ? t.resultado : undefined;

  return (
    <Pagina titulo="Editar video" bajada="Subís tu toma y te la devuelvo sin pausas, con el audio parejo y revisada cuadro por cuadro.">
      <div className="space-y-6">
        {!actual && (
          <Tarjeta className="space-y-5">
            <div className="space-y-1">
              <p className="text-[15px] font-medium">Tu toma, hablando a cámara</p>
              <p className="text-[13px] text-text-2">Corto todas las pausas de más de 0,3 segundos sin cortar ninguna palabra, dejo el audio parejo y lo audito antes de devolvértelo. Es el método de edición de Paul, hecho código.</p>
            </div>
            <Subir videos titulo="Elegí el video" ayuda="MP4 o MOV, hasta 600 MB." adjuntos={video} onChange={(a) => setVideo(a.slice(-1))} etiqueta={(f) => f.name} />
            <div className="space-y-2">
              <p className="text-[14px] font-medium">Subtítulos (de 1 a 3 palabras)</p>
              <Chips valor={opciones.estilo} opciones={ESTILOS} onCambio={(estilo) => setOpciones({ ...opciones, estilo })} />
            </div>
            {opciones.estilo !== "ninguno" && (
              <>
                <div className="space-y-2">
                  <p className="text-[14px] font-medium">El color de tu marca</p>
                  <div className="flex items-center gap-2">
                    {COLORES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setOpciones({ ...opciones, color: c })}
                        aria-label={`Color ${c}`}
                        aria-pressed={opciones.color === c}
                        className={`size-8 rounded-full border-2 transition-transform ${opciones.color === c ? "scale-110 border-text" : "border-line"}`}
                        style={{ background: c }}
                      />
                    ))}
                    <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-[13px] text-text-2">
                      <input type="color" value={opciones.color} onChange={(e) => setOpciones({ ...opciones, color: e.target.value })} className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Otro color" />
                      Otro
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[14px] font-medium">Cuánta animación</p>
                  <Chips valor={opciones.animacion} opciones={ANIMACION} onCambio={(animacion) => setOpciones({ ...opciones, animacion })} />
                </div>
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
            <Boton disabled={!video.length} cargando={procesando} onClick={empezar}>Editar mi video</Boton>
          </Tarjeta>
        )}

        {subiendo !== null && (
          <Tarjeta className="space-y-3">
            <p className="text-[14px]">Subiendo tu video… {Math.round(subiendo * 100)} %</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-sec transition-[width] duration-200" style={{ width: `${subiendo * 100}%` }} />
            </div>
          </Tarjeta>
        )}
        {t && t.estado !== "listo" && <Pasos pasos={t.pasos} corriendo={t.estado === "procesando"} />}
        {(error || t?.estado === "error") && (
          <div className="space-y-3">
            <Aviso>{error || t?.error}</Aviso>
            <Boton variante="borde" onClick={otro}><RotateCcw size={15} /> Probar con otro video</Boton>
          </div>
        )}

        {r && actual && (
          <>
            <Tarjeta className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between" i={0}>
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-sec">Listo, sin pausas</p>
                <p className="font-display text-[34px] leading-tight font-semibold tracking-[-0.03em]">
                  {tiempo(r.antes_s)} <span className="text-text-3">→</span> {tiempo(r.despues_s)}
                </p>
                <p className="text-[14px] text-text-2">
                  Corté {r.pausas_cortadas} pausa{r.pausas_cortadas === 1 ? "" : "s"} y te ahorré {Math.max(0, Math.round(r.antes_s - r.despues_s))} segundos de tiempo muerto.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={`/api/editar/archivo?id=${actual}&descargar=1`} className="inline-flex h-10 items-center gap-2 rounded-full bg-sec px-4 text-[14px] font-medium text-[var(--sec-texto,#fff)] hover:opacity-90">
                  <Download size={15} /> Descargar el reel
                </a>
                <Boton variante="borde" onClick={otro}>Editar otro</Boton>
              </div>
            </Tarjeta>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_1fr]">
              <Tarjeta className="!p-3">
                <video src={`/api/editar/archivo?id=${actual}`} controls playsInline className="aspect-[9/16] w-full rounded-[14px] bg-black object-contain" />
              </Tarjeta>
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
                  {r.subtitulos === "listos" ? (
                    <>
                      <p className="flex gap-2.5 text-[14px] text-text"><Check size={16} className="mt-0.5 shrink-0 text-good" /> Subtítulos de 1 a 3 palabras y {r.textos ?? 0} textos clave en pantalla.</p>
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
            </div>
          </>
        )}
      </div>
    </Pagina>
  );
}
