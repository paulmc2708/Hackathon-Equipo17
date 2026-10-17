// Conexión con Windsor.ai por OAuth (la persona entra con su usuario y contraseña de Windsor y da permiso).
// Es el mismo login que usa el conector MCP de Windsor en Claude. El MCP exige el scope "create" hasta para
// listar herramientas; nunca pedimos "delete", y al agente solo se le habilitan las de lectura (lib/windsor/herramientas.ts).
// App local de una sola persona: el token se guarda en .data/ (ignorado por git).
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const WINDSOR_MCP = "https://mcp.windsor.ai/";
const META = "https://mcp.windsor.ai/.well-known/oauth-authorization-server";
const SCOPE = "create offline_access";
const DIR = path.join(process.cwd(), ".data");
const ARCH_CLIENTE = path.join(DIR, "windsor-cliente.json");
const ARCH_TOKEN = path.join(DIR, "windsor-token.json");
const ARCH_PENDIENTE = path.join(DIR, "windsor-pendiente.json");

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
  const r = await fetch(META, { cache: "no-store" });
  if (!r.ok) throw new Error("No pude hablar con Windsor.");
  return r.json();
}

/** Registra esta app como cliente de Windsor (registro dinámico), una vez por dirección de vuelta. */
async function cliente(m: Meta, redirectUri: string): Promise<string> {
  const guardado = await leer<{ client_id: string; redirect_uri: string; scope?: string }>(ARCH_CLIENTE);
  if (guardado?.redirect_uri === redirectUri && guardado.scope === SCOPE) return guardado.client_id;
  const r = await fetch(m.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Coach de Instagram (local)",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: SCOPE,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.client_id) throw new Error("Windsor no aceptó el registro de la app.");
  await escribir(ARCH_CLIENTE, { client_id: j.client_id, redirect_uri: redirectUri, scope: SCOPE });
  return j.client_id;
}

/** Arma el link para entrar a Windsor (OAuth con PKCE). */
export async function linkDeConexion(origen: string) {
  const m = await meta();
  const redirectUri = `${origen}/api/windsor/callback`;
  const clientId = await cliente(m, redirectUri);
  const verifier = b64url(randomBytes(32));
  const state = b64url(randomBytes(16));
  await escribir(ARCH_PENDIENTE, { verifier, state, redirectUri, clientId });
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

/** Vuelta de Windsor: cambia el código por el token y lo guarda. */
export async function completarConexion(code: string, state: string) {
  const p = await leer<{ verifier: string; state: string; redirectUri: string; clientId: string }>(ARCH_PENDIENTE);
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
}
