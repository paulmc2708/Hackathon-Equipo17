import { computeOutliers } from "./outliers";

// Business Discovery (API oficial de Meta): datos públicos de cuentas PROFESIONALES por su @.
// Necesita META_IG_USER_ID (id de nuestra cuenta profesional) y META_ACCESS_TOKEN. La versión es configurable.
const VERSION = process.env.META_GRAPH_VERSION || "v23.0";

export function instagramConfigurado() {
  return Boolean(process.env.META_IG_USER_ID && process.env.META_ACCESS_TOKEN);
}

type Media = {
  caption?: string;
  like_count?: number;
  comments_count?: number;
  media_type?: string;
  media_product_type?: string;
  permalink?: string;
  timestamp?: string;
};

export async function obtenerPerfil(usuario: string) {
  const handle = usuario.replace(/^@/, "").trim();
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) return { error: "usuario_invalido" };
  if (!instagramConfigurado()) {
    return {
      error: "api_no_configurada",
      sugerencia: "Pedile capturas al usuario o usá web_search. No inventes números.",
    };
  }
  const fields =
    `business_discovery.username(${handle}){username,name,biography,website,followers_count,follows_count,media_count,` +
    `media.limit(30){caption,like_count,comments_count,media_type,media_product_type,permalink,timestamp}}`;
  const url = new URL(`https://graph.facebook.com/${VERSION}/${process.env.META_IG_USER_ID}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", process.env.META_ACCESS_TOKEN!);
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || json.error) {
    return {
      error: "meta_error",
      detalle: json.error?.message ?? res.statusText,
      sugerencia: "Puede ser una cuenta personal o privada (Business Discovery solo ve cuentas profesionales). Pedí capturas.",
    };
  }
  const bd = json.business_discovery ?? {};
  const media: Media[] = bd.media?.data ?? [];
  const reels = media.filter((m) => m.media_product_type === "REELS" || m.media_type === "VIDEO");
  const base = reels.length >= 5 ? reels : media;
  const outliers = computeOutliers(
    base.map((m) => ({
      url: m.permalink,
      caption: m.caption?.slice(0, 300),
      fecha: m.timestamp,
      likes: m.like_count ?? null,
      comentarios: m.comments_count ?? null,
    })),
  );
  return {
    usuario: bd.username,
    nombre: bd.name,
    bio: bd.biography,
    web: bd.website,
    seguidores: bd.followers_count,
    seguidos: bd.follows_count,
    publicaciones: bd.media_count,
    publicaciones_analizadas: base.length,
    solo_reels: base === reels,
    outliers,
    nota: "Estos datos no incluyen vistas: el outlier se calcula con interacciones (likes + comentarios).",
  };
}
