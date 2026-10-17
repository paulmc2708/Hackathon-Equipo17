// Cuenta de Claude de ESTA compu (Claude Code): estado, iniciar y cerrar sesión.
// Solo para correr en local: los endpoints que usan esto rechazan pedidos que no vengan de localhost.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export const CLAUDE = process.env.CLAUDE_BIN || "claude";

export type Estado = { instalado: boolean; conectado: boolean; email?: string; metodo?: string };

function correr(args: string[], ms = 15000): Promise<{ codigo: number; salida: string }> {
  return new Promise((ok) => {
    let salida = "";
    let hijo: ReturnType<typeof spawn>;
    try {
      hijo = spawn(CLAUDE, args, { stdio: ["ignore", "pipe", "pipe"], env: sinApiKey() });
    } catch {
      return ok({ codigo: 127, salida: "" });
    }
    const t = setTimeout(() => hijo.kill("SIGTERM"), ms);
    hijo.stdout?.on("data", (d) => (salida += String(d)));
    hijo.stderr?.on("data", (d) => (salida += String(d)));
    hijo.on("error", () => ok({ codigo: 127, salida }));
    hijo.on("close", (c) => {
      clearTimeout(t);
      ok({ codigo: c ?? 1, salida });
    });
  });
}

export function sinApiKey() {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  return env;
}

export async function estado(): Promise<Estado> {
  const r = await correr(["auth", "status"]);
  if (r.codigo === 127) return { instalado: false, conectado: false };
  try {
    const j = JSON.parse(r.salida.slice(r.salida.indexOf("{")));
    return { instalado: true, conectado: Boolean(j.loggedIn), email: j.email, metodo: j.authMethod };
  } catch {
    return { instalado: true, conectado: false };
  }
}

// Un solo inicio de sesión a la vez (la app corre en local, un único proceso).
let login: { hijo: ChildProcessWithoutNullStreams; salida: string } | null = null;

/** Arranca `claude auth login`. Claude Code abre el navegador solo; devolvemos el link por si no se abrió. */
export async function iniciarLogin(): Promise<{ url?: string; pideCodigo: boolean; error?: string }> {
  if (login) login.hijo.kill("SIGTERM");
  let hijo: ChildProcessWithoutNullStreams;
  try {
    hijo = spawn(CLAUDE, ["auth", "login", "--claudeai"], { env: sinApiKey() });
  } catch {
    return { pideCodigo: false, error: "Claude Code no está instalado." };
  }
  const actual = { hijo, salida: "" };
  login = actual;
  hijo.stdout.on("data", (d) => (actual.salida += String(d)));
  hijo.stderr.on("data", (d) => (actual.salida += String(d)));
  hijo.on("close", () => {
    if (login === actual) login = null;
  });
  hijo.on("error", () => {
    if (login === actual) login = null;
  });
  // Esperamos a que imprima el link (hasta 8 s).
  for (let i = 0; i < 40 && !/https:\/\/\S+/.test(actual.salida); i++) await new Promise((r) => setTimeout(r, 200));
  const url = actual.salida.match(/https:\/\/\S+/)?.[0];
  return { url, pideCodigo: /paste code/i.test(actual.salida) };
}

/** Si el login pide pegar un código (cuando el navegador no vuelve solo), se lo pasamos al proceso. */
export async function enviarCodigo(codigo: string) {
  if (!login) return false;
  login.hijo.stdin.write(codigo.trim() + "\n");
  for (let i = 0; i < 50 && login; i++) await new Promise((r) => setTimeout(r, 200));
  return true;
}

export function cancelarLogin() {
  login?.hijo.kill("SIGTERM");
  login = null;
}

export async function cerrarSesion() {
  await correr(["auth", "logout"]);
}

/** Estos endpoints ejecutan comandos en la compu: solo se aceptan desde la misma compu. */
export function esLocal(request: Request) {
  if (process.env.VERCEL) return false;
  const host = (request.headers.get("host") ?? "").split(":")[0];
  return ["localhost", "127.0.0.1", "[::1]"].includes(host);
}
