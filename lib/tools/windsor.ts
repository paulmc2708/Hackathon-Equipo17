// Métricas PRIVADAS de la propia cuenta de la persona vía Windsor.ai (ella conecta su Instagram en Windsor
// y nos pasa su clave). API: https://connectors.windsor.ai/{connector}?fields=...&api_key=... (la clave solo va como query param).
// Los nombres de los campos se descubren con /{connector}/fields, por eso hay dos herramientas.
const BASE = "https://connectors.windsor.ai";
const PRESETS = ["last_7d", "last_14d", "last_30d", "last_90d"] as const;

async function pedir(url: URL) {
  const res = await fetch(url, { cache: "no-store" });
  const texto = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(texto);
  } catch {}
  if (!res.ok) return { error: `windsor_${res.status}`, detalle: texto.slice(0, 300) };
  return json ?? { error: "respuesta_invalida" };
}

export async function windsorCampos(apiKey: string, connector = "instagram") {
  const url = new URL(`${BASE}/${encodeURIComponent(connector)}/fields`);
  url.searchParams.set("api_key", apiKey);
  const r = await pedir(url);
  // Devolvemos solo id y nombre de cada campo, para no llenar el contexto.
  if (Array.isArray(r)) return { connector, campos: r.map((c: { id?: string; name?: string }) => ({ id: c.id, nombre: c.name })).slice(0, 400) };
  return r;
}

export async function windsorDatos(apiKey: string, campos: string[], preset: string, connector = "instagram") {
  const limpios = campos.filter((c) => /^[a-z0-9_]+$/i.test(c)).slice(0, 30);
  if (!limpios.length) return { error: "sin_campos", sugerencia: "Pedí primero la lista con windsor_campos." };
  const url = new URL(`${BASE}/${encodeURIComponent(connector)}`);
  url.searchParams.set("fields", limpios.join(","));
  url.searchParams.set("date_preset", (PRESETS as readonly string[]).includes(preset) ? preset : "last_30d");
  url.searchParams.set("api_key", apiKey);
  const r = (await pedir(url)) as { data?: unknown[] } | unknown[];
  const filas = Array.isArray(r) ? r : Array.isArray((r as { data?: unknown[] }).data) ? (r as { data: unknown[] }).data : null;
  if (!filas) return r;
  return { connector, filas: filas.slice(0, 200), total_filas: filas.length };
}
