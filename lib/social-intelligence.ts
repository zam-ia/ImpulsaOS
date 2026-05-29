import type {
  DetectedFormat,
  HookCategory,
  SocialDataProvider,
  SocialMetricSummary,
  SocialPlatform,
  SocialPostMetric
} from "@/lib/types";
import { makeId, todayIso } from "@/lib/utils";

export type SocialPostMetricInput = Omit<
  SocialPostMetric,
  "id" | "businessId" | "engagementRate" | "categoriaHook" | "formatoDetectado" | "cta" | "scoreViralidad" | "createdAt"
> &
  Partial<
    Pick<
      SocialPostMetric,
      "engagementRate" | "categoriaHook" | "formatoDetectado" | "cta" | "scoreViralidad" | "createdAt"
    >
  >;

const hookRules: Array<{ category: HookCategory; terms: string[] }> = [
  { category: "controversia", terms: ["nadie", "mentira", "error", "no hagas", "deja de", "peor"] },
  { category: "dolor", terms: ["no vendes", "no funciona", "problema", "cansado", "atascado", "pierdes"] },
  { category: "pregunta", terms: ["?", "que harias", "por que", "como saber", "cuanto"] },
  { category: "prueba_social", terms: ["caso", "cliente", "resultado", "antes", "despues", "testimonio"] },
  { category: "autoridad", terms: ["analisis", "auditoria", "framework", "metodo", "estrategia"] },
  { category: "oferta", terms: ["descuento", "promo", "cupos", "oferta", "bono", "gratis"] },
  { category: "historia", terms: ["cuando", "mi historia", "aprendi", "me paso", "hace un ano"] },
  { category: "educativo", terms: ["pasos", "tips", "guia", "checklist", "aprende", "tutorial"] },
  { category: "curiosidad", terms: ["secreto", "mira esto", "pocos saben", "descubre", "te va a servir"] }
];

export const providerPlaybook: Array<{
  provider: SocialDataProvider;
  repository: string;
  useFor: string;
  mappedFields: string[];
}> = [
  {
    provider: "meta_business_sdk",
    repository: "facebook/facebook-nodejs-business-sdk + facebook/facebook-python-business-sdk",
    useFor: "Publicacion oficial, PagePost/IGMedia e insights de Meta cuando existan permisos.",
    mappedFields: ["red_social", "cuenta", "url_post", "fecha_publicacion", "likes", "comentarios", "shares", "views"]
  },
  {
    provider: "tiktok_business_sdk",
    repository: "tiktok/tiktok-business-api-sdk",
    useFor: "Metrica oficial de cuentas publicitarias o perfiles conectados con OAuth.",
    mappedFields: ["red_social", "cuenta", "fecha_publicacion", "views", "likes", "comentarios", "shares"]
  },
  {
    provider: "instaloader",
    repository: "instaloader/instaloader",
    useFor: "Importar metadata publica/exportada de Instagram: shortcode, fecha, caption, likes, comentarios y video duration.",
    mappedFields: ["url_post", "fecha_publicacion", "tipo_contenido", "duracion_video", "hook_textual"]
  },
  {
    provider: "tiktok_api",
    repository: "davidteather/TikTok-Api",
    useFor: "Lectura de videos publicos/trending cuando el uso cumpla politicas y rate limits.",
    mappedFields: ["views", "likes", "comentarios", "shares", "hook_textual", "duracion_video"]
  },
  {
    provider: "facebook_scraper",
    repository: "kevinzg/facebook-scraper",
    useFor: "Importacion manual de posts publicos de Facebook para benchmark no oficial.",
    mappedFields: ["post_url", "time", "post_text", "likes", "comments", "shares", "video_duration_seconds"]
  },
  {
    provider: "crawlee",
    repository: "apify/crawlee",
    useFor: "Orquestar colas de URLs, retries, proxies permitidos y jobs de investigacion.",
    mappedFields: ["url_post", "raw"]
  },
  {
    provider: "whisper",
    repository: "SYSTRAN/faster-whisper",
    useFor: "Extraer hook_verbal desde audio o video.",
    mappedFields: ["hook_verbal", "raw.transcript"]
  },
  {
    provider: "ocr",
    repository: "JaidedAI/EasyOCR",
    useFor: "Extraer hook_visual desde frames, miniaturas o screenshots.",
    mappedFields: ["hook_visual", "raw.ocr"]
  },
  {
    provider: "manual_csv",
    repository: "apache/superset",
    useFor: "Inspiracion BI: snapshots, metricas agregadas y tablas simples para lectura ejecutiva.",
    mappedFields: ["engagement_rate", "score_viralidad"]
  }
];

type SocialPostMetricRow = {
  id: string;
  business_id: string;
  competitor_profile_id: string | null;
  red_social: SocialPlatform;
  cuenta: string;
  url_post: string;
  fecha_publicacion: string;
  tipo_contenido: string;
  duracion_video: number | null;
  likes: number | null;
  comentarios: number | null;
  shares: number | null;
  views: number | null;
  engagement_rate: number | string | null;
  hook_textual: string | null;
  hook_verbal: string | null;
  hook_visual: string | null;
  categoria_hook: HookCategory | null;
  formato_detectado: DetectedFormat | null;
  tema: string | null;
  cta: string | null;
  score_viralidad: number | null;
  provider: SocialDataProvider | null;
  raw: Record<string, unknown> | null;
  created_at: string;
};

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function detectHookCategory(text: string): HookCategory {
  const normalized = cleanText(text).toLowerCase();
  if (!normalized) return "desconocido";
  return hookRules.find((rule) => rule.terms.some((term) => normalized.includes(term)))?.category ?? "curiosidad";
}

export function detectFormat(input: {
  redSocial: SocialPlatform;
  tipoContenido: string;
  duracionVideo: number;
  urlPost: string;
}): DetectedFormat {
  const text = `${input.redSocial} ${input.tipoContenido} ${input.urlPost}`.toLowerCase();
  if (text.includes("carousel") || text.includes("carrusel")) return "carrusel";
  if (text.includes("story") || text.includes("historia")) return "story";
  if (text.includes("live") || text.includes("directo")) return "live";
  if (text.includes("ad") || text.includes("anuncio")) return "ad";
  if (text.includes("reel") || (input.redSocial === "instagram" && input.duracionVideo > 0)) return "reel";
  if (text.includes("short") || input.redSocial === "tiktok") return "short";
  if (text.includes("image") || text.includes("imagen") || text.includes("foto")) return "imagen";
  if (text.includes("text") || text.includes("texto")) return "texto";
  return input.duracionVideo > 0 ? "short" : "desconocido";
}

export function detectCta(text: string) {
  const normalized = cleanText(text).toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("whatsapp") || normalized.includes("escribeme") || normalized.includes("dm")) {
    return "Enviar mensaje";
  }
  if (normalized.includes("comenta") || normalized.includes("comentarios")) return "Comentar palabra clave";
  if (normalized.includes("link") || normalized.includes("bio")) return "Abrir link";
  if (normalized.includes("guarda")) return "Guardar post";
  if (normalized.includes("comparte")) return "Compartir";
  return "";
}

export function calculateEngagementRate(input: Pick<SocialPostMetric, "likes" | "comentarios" | "shares" | "views">) {
  const interactions = input.likes + input.comentarios + input.shares;
  if (input.views > 0) return Number(((interactions / input.views) * 100).toFixed(2));
  return Number((interactions / 100).toFixed(2));
}

export function calculateViralScore(
  input: Pick<SocialPostMetric, "likes" | "comentarios" | "shares" | "views" | "engagementRate" | "hookTextual" | "hookVerbal" | "hookVisual">
) {
  const engagementPoints = Math.min(input.engagementRate * 6, 42);
  const commentPoints = Math.min(input.comentarios / 3, 18);
  const sharePoints = Math.min(input.shares / 2, 18);
  const viewPoints = Math.min(Math.log10(Math.max(input.views, 1)) * 5, 16);
  const hookPoints = [input.hookTextual, input.hookVerbal, input.hookVisual].filter((item) => item.trim()).length * 2;
  return Math.min(100, Math.round(engagementPoints + commentPoints + sharePoints + viewPoints + hookPoints));
}

export function normalizeSocialPostMetric(businessId: string, input: SocialPostMetricInput): SocialPostMetric {
  const hookTextual = cleanText(input.hookTextual);
  const hookVerbal = cleanText(input.hookVerbal);
  const hookVisual = cleanText(input.hookVisual);
  const categoriaHook = input.categoriaHook ?? detectHookCategory(`${hookTextual} ${hookVerbal} ${hookVisual}`);
  const formatoDetectado =
    input.formatoDetectado ??
    detectFormat({
      redSocial: input.redSocial,
      tipoContenido: input.tipoContenido,
      duracionVideo: input.duracionVideo,
      urlPost: input.urlPost
    });
  const engagementRate =
    input.engagementRate ??
    calculateEngagementRate({
      likes: input.likes,
      comentarios: input.comentarios,
      shares: input.shares,
      views: input.views
    });
  const metric: SocialPostMetric = {
    ...input,
    id: makeId("metric"),
    businessId,
    competitorProfileId: input.competitorProfileId ?? null,
    tipoContenido: cleanText(input.tipoContenido),
    hookTextual,
    hookVerbal,
    hookVisual,
    categoriaHook,
    formatoDetectado,
    tema: cleanText(input.tema),
    cta: input.cta ?? detectCta(`${hookTextual} ${hookVerbal} ${hookVisual}`),
    engagementRate,
    scoreViralidad: input.scoreViralidad ?? 0,
    raw: input.raw ?? {},
    createdAt: input.createdAt ?? todayIso()
  };

  return {
    ...metric,
    scoreViralidad: input.scoreViralidad ?? calculateViralScore(metric)
  };
}

export function socialMetricToInsertRow(metric: SocialPostMetric) {
  return {
    business_id: metric.businessId,
    competitor_profile_id: metric.competitorProfileId,
    red_social: metric.redSocial,
    cuenta: metric.cuenta,
    url_post: metric.urlPost,
    fecha_publicacion: metric.fechaPublicacion,
    tipo_contenido: metric.tipoContenido,
    duracion_video: metric.duracionVideo,
    likes: metric.likes,
    comentarios: metric.comentarios,
    shares: metric.shares,
    views: metric.views,
    engagement_rate: metric.engagementRate,
    hook_textual: metric.hookTextual,
    hook_verbal: metric.hookVerbal,
    hook_visual: metric.hookVisual,
    categoria_hook: metric.categoriaHook,
    formato_detectado: metric.formatoDetectado,
    tema: metric.tema,
    cta: metric.cta,
    score_viralidad: metric.scoreViralidad,
    provider: metric.provider,
    raw: metric.raw
  };
}

export function socialMetricFromRow(row: SocialPostMetricRow): SocialPostMetric {
  return {
    id: row.id,
    businessId: row.business_id,
    competitorProfileId: row.competitor_profile_id,
    redSocial: row.red_social,
    cuenta: row.cuenta,
    urlPost: row.url_post,
    fechaPublicacion: row.fecha_publicacion,
    tipoContenido: row.tipo_contenido,
    duracionVideo: row.duracion_video ?? 0,
    likes: row.likes ?? 0,
    comentarios: row.comentarios ?? 0,
    shares: row.shares ?? 0,
    views: row.views ?? 0,
    engagementRate: Number(row.engagement_rate ?? 0),
    hookTextual: row.hook_textual ?? "",
    hookVerbal: row.hook_verbal ?? "",
    hookVisual: row.hook_visual ?? "",
    categoriaHook: row.categoria_hook ?? "desconocido",
    formatoDetectado: row.formato_detectado ?? "desconocido",
    tema: row.tema ?? "",
    cta: row.cta ?? "",
    scoreViralidad: row.score_viralidad ?? 0,
    provider: row.provider ?? "manual_csv",
    raw: row.raw ?? {},
    createdAt: row.created_at
  };
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function mostFrequent<T extends string>(values: T[], fallback: T) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as T | undefined) ?? fallback;
}

export function summarizeSocialMetrics(posts: SocialPostMetric[]): SocialMetricSummary {
  if (!posts.length) {
    return {
      comentariosPromedio: 0,
      likesPromedio: 0,
      formatoGanador: "pendiente",
      hookDominante: "desconocido",
      formatosVigilar: [],
      topPostIds: [],
      updatedAt: todayIso()
    };
  }

  const topPosts = [...posts].sort((a, b) => b.scoreViralidad - a.scoreViralidad).slice(0, 5);
  const byFormat = posts.reduce<Record<string, { count: number; engagement: number; recent: number }>>((acc, post) => {
    const item = acc[post.formatoDetectado] ?? { count: 0, engagement: 0, recent: 0 };
    item.count += 1;
    item.engagement += post.engagementRate;
    if (Date.parse(post.fechaPublicacion) > Date.now() - 1000 * 60 * 60 * 24 * 30) item.recent += 1;
    acc[post.formatoDetectado] = item;
    return acc;
  }, {});
  const rankedFormats = Object.entries(byFormat).sort(
    (a, b) => b[1].engagement / b[1].count - a[1].engagement / a[1].count
  );
  const formatosVigilar = rankedFormats
    .filter(([, value]) => value.recent > 0)
    .slice(1, 4)
    .map(([format]) => format);

  return {
    comentariosPromedio: average(posts.map((post) => post.comentarios)),
    likesPromedio: average(posts.map((post) => post.likes)),
    formatoGanador: rankedFormats[0]?.[0] ?? "pendiente",
    hookDominante: mostFrequent(topPosts.map((post) => post.categoriaHook), "desconocido"),
    formatosVigilar,
    topPostIds: topPosts.map((post) => post.id),
    updatedAt: todayIso()
  };
}
