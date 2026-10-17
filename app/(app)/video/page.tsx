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

function subir(file: File, onProgreso: (p: number) => void): Promise<string> {
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open("POST", "/api/editar");
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
      const id = await subir(f, setSubiendo);
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
                <p className="border-t border-line pt-3 text-[13px] text-text-2">
                  Lo que sigue: subtítulos de 1 a 3 palabras y textos animados cada 2 o 3 segundos, elegidos por tu editor según lo que decís.
                </p>
              </Tarjeta>
            </div>
          </>
        )}
      </div>
    </Pagina>
  );
}
