// Conexión con Windsor.ai por OAuth (la persona entra con su usuario y contraseña de Windsor y da permiso).
// Es el mismo login que usa el conector MCP de Windsor en Claude. El MCP exige los scopes "create" y "delete" hasta para
// listar herramientas; igual al agente solo se le habilitan las de lectura (lib/windsor/herramientas.ts y --allowedTools).
// App local de una sola persona: el token se guarda en .data/ (ignorado por git).
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const WINDSOR_MCP = "https://mcp.windsor.ai/";
const META = "https://mcp.windsor.ai/.well-known/oauth-authorization-server";
const SCOPE = "create delete offline_access";
const DIR = path.join(process.cwd(), ".data");
const ARCH_CLIENTE = path.join(DIR, "windsor-cliente.json");
const ARCH_TOKEN = path.join(DIR, "windsor-token.json");
const ARCH_PENDIENTE = path.join(DIR, "windsor-pendiente.json");
const ARCH_CUENTA = path.join(DIR, "windsor-cuenta.json");

type Meta = { authorization_endpoint: string; token_endpoint: string; registration_endpoint: string };
type Token = { access_token: string; refresh_token?: string; expires_at?: number; scope?: string };

const leer = async <T,>(f: string): Promise<T | null> => {
  try {
    return JSON.parse(await readFile(f, "utf8")) as T;
  } catch {
    return null;
  }
};
const escribir = async (f: string, v: unknown) => {
  await mkdir(DIR, { recursive: true });
  await writeFile(f, JSON.stringify(v), { mode: 0o600 });
};
const b64url = (b: Buffer) => b.toString("base64url");

async function meta(): Promise<Meta> {
  const r = await fetch(META, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error("No pude hablar con Windsor.");
  return r.json();
}

type Cliente = { client_id: string; redirect_uri: string; scope?: string };

/** Clientes ya registrados, uno por dirección de vuelta (localhost y 127.0.0.1 son orígenes distintos). */
async function clientes(): Promise<Cliente[]> {
  const g = await leer<Cliente | Cliente[]>(ARCH_CLIENTE);
  return Array.isArray(g) ? g : g ? [g] : [];
}

/** Registra esta app como cliente de Windsor (registro dinámico), una vez por dirección de vuelta. */
async function cliente(m: Meta, redirectUri: string): Promise<string> {
  const lista = await clientes();
  const guardado = lista.find((c) => c.redirect_uri === redirectUri && c.scope === SCOPE);
  if (guardado) return guardado.client_id;
  const r = await fetch(m.registration_endpoint, {
    signal: AbortSignal.timeout(10000),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Hookia (local)",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: SCOPE,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.client_id) throw new Error("Windsor no aceptó el registro de la app.");
  await escribir(ARCH_CLIENTE, [...lista.filter((c) => c.redirect_uri !== redirectUri), { client_id: j.client_id, redirect_uri: redirectUri, scope: SCOPE }]);
  return j.client_id;
}

/** Arma el link para entrar a Windsor (OAuth con PKCE). `origen` es el del navegador; `volver`, la pantalla desde donde se conectó. */
export async function linkDeConexion(origen: string, volver = "/") {
  const m = await meta();
  const redirectUri = `${origen}/api/windsor/callback`;
  const clientId = await cliente(m, redirectUri);
  const verifier = b64url(randomBytes(32));
  const state = b64url(randomBytes(16));
  await escribir(ARCH_PENDIENTE, { verifier, state, redirectUri, clientId, volver: /^\/[a-z]*$/.test(volver) ? volver : "/" });
  const url = new URL(m.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", b64url(createHash("sha256").update(verifier).digest()));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", WINDSOR_MCP);
  return url.toString();
}

async function pedirToken(m: Meta, body: Record<string, string>): Promise<Token> {
  const r = await fetch(m.token_endpoint, {
    signal: AbortSignal.timeout(10000),
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...body, resource: WINDSOR_MCP }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("Windsor no devolvió el permiso.");
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: j.expires_in ? Date.now() + (j.expires_in - 60) * 1000 : undefined,
    scope: SCOPE,
  };
}

type Pendiente = { verifier: string; state: string; redirectUri: string; clientId: string; volver?: string };

/** A qué pantalla volver después de Windsor (la que arrancó la conexión). */
export async function pantallaDeVuelta() {
  return (await leer<Pendiente>(ARCH_PENDIENTE))?.volver ?? "/";
}

/** Vuelta de Windsor: cambia el código por el token y lo guarda. */
export async function completarConexion(code: string, state: string) {
  const p = await leer<Pendiente>(ARCH_PENDIENTE);
  if (!p || p.state !== state) throw new Error("La conexión venció. Probá de nuevo.");
  const t = await pedirToken(await meta(), {
    grant_type: "authorization_code",
    code,
    redirect_uri: p.redirectUri,
    client_id: p.clientId,
    code_verifier: p.verifier,
  });
  await escribir(ARCH_TOKEN, t);
  await rm(ARCH_PENDIENTE, { force: true });
  await rm(ARCH_CUENTA, { force: true });
}

/** Token vigente (lo renueva si venció). null si no está conectado. */
export async function tokenWindsor(): Promise<string | null> {
  const t = await leer<Token>(ARCH_TOKEN);
  // Un token sacado con otros permisos no le sirve al MCP: se pide conectar de nuevo.
  if (!t || t.scope !== SCOPE) return null;
  if (!t.expires_at || t.expires_at > Date.now()) return t.access_token;
  const c = await leer<{ client_id: string }>(ARCH_CLIENTE);
  if (!t.refresh_token || !c) return null;
  try {
    const n = await pedirToken(await meta(), { grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: c.client_id });
    await escribir(ARCH_TOKEN, { ...n, refresh_token: n.refresh_token ?? t.refresh_token });
    return n.access_token;
  } catch {
    return null;
  }
}

export async function desconectarWindsor() {
  await rm(ARCH_TOKEN, { force: true });
  await rm(ARCH_CUENTA, { force: true });
}

// De qué cuenta de Instagram es el Windsor conectado (lo averigua la tarea "cuenta").
// Sirve para no mezclar: si se analiza otra cuenta (por ejemplo, la que pide el jurado), no se usa Windsor.
export const usuarioLimpio = (u: string) => u.replace(/^@/, "").trim().toLowerCase();

export async function cuentaWindsor(): Promise<string | null> {
  return (await leer<{ usuario: string }>(ARCH_CUENTA))?.usuario || null;
}

export async function guardarCuentaWindsor(usuario: string) {
  const u = usuarioLimpio(usuario);
  if (/^[a-z0-9._]{1,30}$/.test(u)) await escribir(ARCH_CUENTA, { usuario: u });
}
