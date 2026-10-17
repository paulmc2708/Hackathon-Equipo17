import { randomUUID } from "node:crypto";
import { mkdir, stat } from "node:fs/promises";
import { z } from "zod";
import { esLocal } from "@/lib/claude/cuenta";
import { motivoDeRechazo, rechazoPorSeguridad } from "@/lib/seguridad";
import { carpetaVideo, editar, trabajo } from "@/lib/video/editar";
import { montar } from "@/lib/video/montaje";
import { claseDe, guardarSubida, Mensaje, tomasDe } from "@/lib/video/subida";

// Esta ruta no pasa por proxy.ts (para que Next no copie los videos en memoria): hace la misma verificación acá.
const ID = /^[a-f0-9-]{36}$/;

const Opciones = z.object({
  modo: z.enum(["habla", "productos"]).catch("habla"),
  estilo: z.enum(["limpios", "resaltado", "pastilla", "ninguno", "referencia"]).catch("limpios"),
  animacion: z.enum(["poca", "media", "mucha"]).catch("media"),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).catch("#FFD60A"),
  coloresDe: z.enum(["marca", "referencia"]).catch("marca"),
  marca: z.string().catch("").transform((t) => t.slice(0, 80)),
  producto: z.string().catch("").transform((t) => t.slice(0, 120)),
  precio: z.string().catch("").transform((t) => t.slice(0, 60)),
  cta: z.string().catch("").transform((t) => t.slice(0, 80)),
});

// Las subidas a una misma edición van de a una (así dos tomas no se pisan el número), y cada edición arranca una sola vez.
const g = globalThis as unknown as { __hookiaColas?: Map<string, Promise<unknown>>; __hookiaArrancadas?: Set<string> };
const colas = (g.__hookiaColas ??= new Map());
const arrancadas = (g.__hookiaArrancadas ??= new Set());
function enFila<T>(id: string, tarea: () => Promise<T>): Promise<T> {
  const p = (colas.get(id) ?? Promise.resolve()).catch(() => {}).then(tarea);
  colas.set(id, p);
  return p;
}

const existe = async (id: string) => ID.test(id) && !!(await stat(carpetaVideo(id)).catch(() => null));

// POST /api/editar?accion=subir&para=toma|musica|referencia[&id=…]&nombre=… (el cuerpo es el archivo; una toma
//   puede ser un .zip con varias) → { id, tomas, nuevas, musica, avisos }.
// POST /api/editar?accion=empezar&id=… (JSON con el modo y las opciones) → { id }. La edición sigue en segundo plano.
export async function POST(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  const q = new URL(request.url).searchParams;
  const accion = q.get("accion");
  if (accion === "empezar") return empezar(request, q.get("id") ?? "");
  if (accion !== "subir") return Response.json({ error: "Pedido inválido." }, { status: 400 });
  const para = (["toma", "musica", "referencia"] as const).find((x) => x === q.get("para")) ?? "toma";
  const nombre = (q.get("nombre") ?? "").slice(0, 200);
  const tipo = claseDe((request.headers.get("content-type") ?? "").split(";")[0].trim(), nombre);
  if (!tipo) return Response.json({ error: para === "musica" ? "Subí la música en MP3, M4A o WAV." : "Subí videos MP4, MOV o WEBM, o un .zip con tus videos." }, { status: 400 });
  if (!request.body) return Response.json({ error: "No llegó el archivo." }, { status: 400 });
  let id = q.get("id") ?? "";
  if (id) {
    if (!(await existe(id))) return Response.json({ error: "No encontré esa edición. Empezá de nuevo." }, { status: 404 });
    if (arrancadas.has(id) || (await trabajo(id))) return Response.json({ error: "Esa edición ya arrancó. Empezá una nueva." }, { status: 409 });
  } else {
    id = randomUUID();
    await mkdir(carpetaVideo(id), { recursive: true });
  }
  const cuerpo = request.body;
  try {
    const r = await enFila(id, () => guardarSubida(carpetaVideo(id), cuerpo, para, tipo, nombre));
    return Response.json({ id, ...r });
  } catch (e) {
    return Response.json({ id, error: e instanceof Mensaje ? e.message : "Se cortó la subida. Probá de nuevo." }, { status: 400 });
  }
}

async function empezar(request: Request, id: string) {
  if (!(await existe(id))) return Response.json({ error: "No encontré esa edición. Subí tus videos de nuevo." }, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > 10_000) return Response.json({ error: "Pedido inválido." }, { status: 400 });
  const o = Opciones.parse(await request.json().catch(() => ({})));
  await (colas.get(id) ?? Promise.resolve()).catch(() => {});
  if (!(await tomasDe(carpetaVideo(id))).length) return Response.json({ error: "Todavía no subiste ninguna toma." }, { status: 400 });
  if (arrancadas.has(id) || (await trabajo(id))) return Response.json({ error: "Esa edición ya arrancó." }, { status: 409 });
  arrancadas.add(id);
  void (o.modo === "productos" ? montar(id, o) : editar(id, o));
  return Response.json({ id });
}

// GET /api/editar?id=… → cómo va la edición.
export async function GET(request: Request) {
  if (motivoDeRechazo(request) || !esLocal(request)) return rechazoPorSeguridad();
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const t = ID.test(id) ? await trabajo(id) : null;
  return t ? Response.json(t) : Response.json({ error: "No encontré esa edición." }, { status: 404 });
}
