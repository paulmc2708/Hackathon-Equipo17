"use client";

// Página de PRUEBA del agente (etapa 2). La interfaz final va en las secciones de la barra lateral.
import { useEffect, useRef, useState } from "react";

type Tarea = "perfil" | "ideas" | "guion";
type Evento =
  | { tipo: "paso"; texto: string }
  | { tipo: "texto"; delta: string }
  | { tipo: "resultado"; tarea: Tarea; data: unknown }
  | { tipo: "preguntas"; preguntas: string[]; por_que: string }
  | { tipo: "error"; mensaje: string }
  | { tipo: "uso"; entrada: number; salida: number; cache_leida: number };

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function aBase64(file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

export default function AgentePrueba() {
  const [tarea, setTarea] = useState<Tarea>("perfil");
  const [form, setForm] = useState({ usuario: "", aQueSeDedica: "", queVende: "", aQuien: "", historia: "", captions: "", idea: "" });
  const [archivos, setArchivos] = useState<File[]>([]);
  const [pasos, setPasos] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [uso, setUso] = useState("");
  const [corriendo, setCorriendo] = useState(false);
  const [preguntas, setPreguntas] = useState<{ preguntas: string[]; por_que: string } | null>(null);
  const [borrador, setBorrador] = useState<string[]>([]);
  const [respuestas, setRespuestas] = useState<{ pregunta: string; respuesta: string }[]>([]);
  const abort = useRef<AbortController | null>(null);
  const [clave, setClave] = useState("");
  // Se lee después de montar para no romper la hidratación (en el servidor no hay localStorage).
  useEffect(() => {
    let guardada = "";
    try { guardada = localStorage.getItem("anthropic-key") ?? ""; } catch {}
    if (guardada) queueMicrotask(() => setClave(guardada));
  }, []);
  const guardarClave = (v: string) => {
    setClave(v);
    try { if (v) localStorage.setItem("anthropic-key", v); else localStorage.removeItem("anthropic-key"); } catch {}
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function correr(previas = respuestas) {
    setPreguntas(null);
    setPasos([]); setTexto(""); setResultado(null); setError(""); setUso(""); setCorriendo(true);
    abort.current = new AbortController();
    try {
      const imagenes = await Promise.all(
        archivos.filter((f) => TIPOS.includes(f.type)).map(async (f) => ({ media_type: f.type, data: await aBase64(f) })),
      );
      const creador = {
        usuario: form.usuario,
        aQueSeDedica: form.aQueSeDedica,
        queVende: form.queVende,
        aQuien: form.aQuien,
        historia: form.historia,
        captions: form.captions.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
      };
      const pedido = tarea === "guion" ? { tarea, creador, respuestas: previas, idea: form.idea } : { tarea, creador, respuestas: previas };
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(clave ? { "x-anthropic-key": clave } : {}) },
        body: JSON.stringify({ pedido, imagenes }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lineas = buf.split("\n");
        buf = lineas.pop() ?? "";
        for (const l of lineas) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l) as Evento;
          if (ev.tipo === "paso") setPasos((p) => [...p, ev.texto]);
          else if (ev.tipo === "texto") setTexto((t) => t + ev.delta);
          else if (ev.tipo === "resultado") setResultado(ev.data);
          else if (ev.tipo === "preguntas") { setPreguntas(ev); setBorrador(ev.preguntas.map(() => "")); }
          else if (ev.tipo === "error") setError(ev.mensaje);
          else if (ev.tipo === "uso") setUso(`${ev.entrada} tokens de entrada (${ev.cache_leida} desde caché) · ${ev.salida} de salida`);
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setCorriendo(false);
    }
  }

  const campo = "w-full rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-neutral-400";
  const etiqueta = "mb-1 block text-[13px] text-neutral-500";

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[360px_1fr]">
      <section className="space-y-4">
        <h1 className="text-[26px] font-semibold tracking-tight">Probar el agente</h1>
        <div className="flex gap-1 rounded-[10px] bg-neutral-100 p-1 text-[14px]">
          {(["perfil", "ideas", "guion"] as Tarea[]).map((t) => (
            <button key={t} onClick={() => setTarea(t)}
              className={`flex-1 rounded-[8px] px-3 py-1.5 capitalize ${tarea === t ? "bg-white shadow-sm" : "text-neutral-500"}`}>
              {t === "guion" ? "Guion" : t === "ideas" ? "Ideas" : "Perfil"}
            </button>
          ))}
        </div>
        <div>
          <label className={etiqueta}>Tu clave de Anthropic (se guarda solo en este navegador)</label>
          <input className={campo} type="password" placeholder="sk-ant-…" value={clave} onChange={(e) => guardarClave(e.target.value.trim())} />
          <p className="mt-1 text-[12px] text-neutral-400">La sacás en console.anthropic.com → API keys. Pagás solo lo que usás.</p>
        </div>
        <div><label className={etiqueta}>Usuario de Instagram</label><input className={campo} placeholder="sin @" value={form.usuario} onChange={set("usuario")} /></div>
        <div><label className={etiqueta}>¿A qué te dedicás?</label><input className={campo} value={form.aQueSeDedica} onChange={set("aQueSeDedica")} /></div>
        <div><label className={etiqueta}>¿Qué vendés o querés vender?</label><input className={campo} value={form.queVende} onChange={set("queVende")} /></div>
        <div><label className={etiqueta}>¿A quién?</label><input className={campo} value={form.aQuien} onChange={set("aQuien")} /></div>
        <div><label className={etiqueta}>Tu historia (qué te hace distinto)</label><textarea className={campo} rows={2} value={form.historia} onChange={set("historia")} /></div>
        <div><label className={etiqueta}>3 captions tuyos (separados por una línea en blanco)</label><textarea className={campo} rows={4} value={form.captions} onChange={set("captions")} /></div>
        {tarea === "guion" && (
          <div><label className={etiqueta}>Idea del reel</label><textarea className={campo} rows={2} value={form.idea} onChange={set("idea")} /></div>
        )}
        <div>
          <label className={etiqueta}>Capturas (opcional)</label>
          <input type="file" multiple accept={TIPOS.join(",")} className="text-[13px]"
            onChange={(e) => setArchivos(Array.from(e.target.files ?? []).slice(0, 6))} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setRespuestas([]); correr([]); }} disabled={corriendo || !form.usuario}
            className="rounded-[10px] bg-neutral-900 px-4 py-2 text-[14px] text-white disabled:opacity-40">
            {corriendo ? "Trabajando…" : "Correr agente"}
          </button>
          {corriendo && <button onClick={() => abort.current?.abort()} className="rounded-[10px] px-4 py-2 text-[14px] text-neutral-500">Cancelar</button>}
        </div>
      </section>

      <section className="min-w-0 space-y-6">
        {pasos.length > 0 && (
          <ol className="space-y-1.5 text-[14px] text-neutral-600">
            {pasos.map((p, i) => <li key={i} className="flex gap-2"><span className="text-neutral-300">{i + 1}</span>{p}</li>)}
          </ol>
        )}
        {preguntas && (
          <div className="space-y-3 rounded-[12px] border border-neutral-200 p-4">
            <p className="text-[14px] text-neutral-500">{preguntas.por_que}</p>
            {preguntas.preguntas.map((q, i) => (
              <div key={i}>
                <label className="mb-1 block text-[14px]">{q}</label>
                <input className={campo} value={borrador[i] ?? ""}
                  onChange={(e) => setBorrador((b) => b.map((x, j) => (j === i ? e.target.value : x)))} />
              </div>
            ))}
            <button className="rounded-[10px] bg-neutral-900 px-4 py-2 text-[14px] text-white"
              onClick={() => {
                const nuevas = [...respuestas, ...preguntas.preguntas.map((pregunta, i) => ({ pregunta, respuesta: borrador[i] ?? "" }))];
                setRespuestas(nuevas);
                correr(nuevas);
              }}>
              Responder y seguir
            </button>
          </div>
        )}
        {texto && <p className="whitespace-pre-wrap text-[14px] text-neutral-500">{texto}</p>}
        {error && <p className="rounded-[10px] bg-red-50 px-3 py-2 text-[14px] text-red-700">{error}</p>}
        {resultado !== null && (
          <pre className="overflow-x-auto rounded-[12px] border border-neutral-200 bg-neutral-50 p-4 text-[12px]">{JSON.stringify(resultado, null, 2)}</pre>
        )}
        {uso && <p className="text-[12px] text-neutral-400">{uso}</p>}
      </section>
    </main>
  );
}
