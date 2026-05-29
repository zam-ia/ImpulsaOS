import { getFirstBusiness } from "@/lib/repositories/business.repo";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type CreatorPlatform = "instagram" | "facebook" | "tiktok";
export type CreatorAnalysisStatus =
  | "guardado"
  | "en_cola"
  | "analizando_perfil"
  | "analizando_publicaciones"
  | "clasificando_formatos"
  | "extrayendo_hooks"
  | "extrayendo_ctas"
  | "calculando_metricas"
  | "generando_insights"
  | "generando_ideas_adaptables"
  | "alimentando_motor"
  | "analisis_completado"
  | "requiere_revision_manual"
  | "error_analisis"
  | "archivado";

type CreatorAccountInput = {
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
};

export type CreateCreatorInput = CreatorAccountInput & {
  name: string;
  type: string;
  analysisObjective?: string;
  notes?: string;
  startAnalysis?: boolean;
};

type PublicPageMetadata = {
  ok: boolean;
  status: "ok" | "blocked" | "error";
  url: string;
  title: string;
  description: string;
  imageUrl: string | null;
  postUrls: string[];
  htmlText: string;
  error?: string;
};

const statusProgress: Record<CreatorAnalysisStatus, number> = {
  guardado: 0,
  en_cola: 5,
  analizando_perfil: 15,
  analizando_publicaciones: 35,
  clasificando_formatos: 50,
  extrayendo_hooks: 62,
  extrayendo_ctas: 70,
  calculando_metricas: 78,
  generando_insights: 86,
  generando_ideas_adaptables: 94,
  alimentando_motor: 98,
  analisis_completado: 100,
  requiere_revision_manual: 100,
  error_analisis: 100,
  archivado: 100
};

export function detectPlatform(url: string): CreatorPlatform | null {
  const value = url.toLowerCase();
  if (value.includes("instagram.com")) return "instagram";
  if (value.includes("facebook.com") || value.includes("fb.com")) return "facebook";
  if (value.includes("tiktok.com")) return "tiktok";
  return null;
}

export function extractHandle(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const raw = parts.find((part) => !["p", "reel", "videos", "watch", "photo"].includes(part.toLowerCase())) ?? "";
    return raw.replace(/^@/, "");
  } catch {
    return "";
  }
}

function collectAccounts(input: CreatorAccountInput) {
  return [input.instagramUrl, input.facebookUrl, input.tiktokUrl]
    .filter((url): url is string => Boolean(url?.trim()))
    .map((url) => ({ url: url.trim(), platform: detectPlatform(url.trim()), handle: extractHandle(url.trim()) }))
    .filter((account): account is { url: string; platform: CreatorPlatform; handle: string } => Boolean(account.platform));
}

function scorePost(post: { likes?: number; comments?: number; shares?: number; saves?: number; views?: number }) {
  return Math.round((post.likes ?? 0) + (post.comments ?? 0) * 3 + (post.shares ?? 0) * 4 + (post.saves ?? 0) * 5 + (post.views ?? 0) * 0.01);
}

function dominant(values: Array<string | null | undefined>, fallback: string) {
  const counts = values.filter(Boolean).reduce<Record<string, number>>((acc, value) => {
    acc[value as string] = (acc[value as string] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}

function classifyHook(text: string) {
  const value = text.toLowerCase();
  if (value.includes("error") || value.includes("no hagas")) return "gancho de error comun";
  if (value.includes("si eres") || value.includes("si trabajas")) return "gancho de identificacion";
  if (value.includes("?")) return "gancho de pregunta";
  if (value.includes("nadie") || value.includes("mito")) return "gancho controversial";
  if (value.includes("guarda") || value.includes("checklist")) return "gancho de beneficio";
  return "gancho de curiosidad";
}

function classifyFormat(text: string) {
  const value = text.toLowerCase();
  if (value.includes("checklist")) return "Carrusel checklist";
  if (value.includes("error")) return "Errores comunes";
  if (value.includes("mito")) return "Mitos y verdades";
  if (value.includes("reel") || value.includes("video")) return "Reel educativo";
  if (value.includes("flyer")) return "Flyer comercial";
  return "Talking head";
}

function classifyCta(text: string) {
  const value = text.toLowerCase();
  if (value.includes("whatsapp") || value.includes("info")) return "WhatsApp / palabra clave";
  if (value.includes("guarda")) return "Guardar";
  if (value.includes("comenta")) return "Comentar";
  if (value.includes("sigue")) return "Seguir";
  return "Sin CTA claro";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i")
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return "";
}

function getTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, "") ?? "");
}

function absolutizeUrl(url: string, baseUrl: string) {
  try {
    return new URL(url, baseUrl).toString().split("?")[0];
  } catch {
    return "";
  }
}

function extractPublicPostUrls(html: string, baseUrl: string, platform: CreatorPlatform) {
  const values = new Set<string>();
  const hrefPattern = /href=["']([^"']+)["']/gi;
  const stringPattern = /https?:\\?\/\\?\/(?:www\.)?(?:instagram\.com|tiktok\.com|facebook\.com|fb\.watch)[^"'\\\s<>]+/gi;
  const instagramPattern = /\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?/gi;
  const tiktokPattern = /\/@[A-Za-z0-9_.-]+\/video\/\d+/gi;
  const facebookPattern = /\/(?:posts|videos|reel|watch|photo.php|permalink.php)[^"'\\\s<>]*/gi;
  const patterns = platform === "instagram" ? [instagramPattern] : platform === "tiktok" ? [tiktokPattern] : [facebookPattern];

  for (const match of html.matchAll(hrefPattern)) {
    const normalized = absolutizeUrl(decodeHtml(match[1]), baseUrl);
    if (isPostUrl(normalized, platform)) values.add(normalized);
  }
  for (const match of html.matchAll(stringPattern)) {
    const normalized = absolutizeUrl(decodeHtml(match[0].replace(/\\\//g, "/")), baseUrl);
    if (isPostUrl(normalized, platform)) values.add(normalized);
  }
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const normalized = absolutizeUrl(match[0], baseUrl);
      if (isPostUrl(normalized, platform)) values.add(normalized);
    }
  }

  return [...values].slice(0, Number(process.env.PUBLIC_WEB_ANALYSIS_MAX_POSTS ?? 8));
}

function isPostUrl(url: string, platform: CreatorPlatform) {
  if (!url) return false;
  if (platform === "instagram") return /instagram\.com\/(?:p|reel|reels|tv)\//i.test(url);
  if (platform === "tiktok") return /tiktok\.com\/@[^/]+\/video\/\d+/i.test(url);
  return /(facebook\.com|fb\.watch)\/.*(posts|videos|reel|watch|photo\.php|permalink\.php)/i.test(url);
}

function derivePostType(url: string, text: string, platform: CreatorPlatform) {
  const value = `${url} ${text}`.toLowerCase();
  if (platform === "tiktok") return "tiktok";
  if (value.includes("/reel/") || value.includes("/reels/")) return "reel";
  if (value.includes("video")) return "video";
  if (value.includes("carousel") || value.includes("checklist")) return "carrusel";
  return platform === "instagram" ? "post instagram" : "post facebook";
}

function extractMetric(text: string, label: "like" | "comment" | "view") {
  const normalized = text.toLowerCase().replace(/,/g, "");
  const labels = {
    like: "(?:likes?|me gusta)",
    comment: "(?:comments?|comentarios?)",
    view: "(?:views?|reproducciones?|visualizaciones?)"
  };
  const before = normalized.match(new RegExp(`(\\d+(?:\\.\\d+)?\\s*(?:k|m|mil)?)\\s+${labels[label]}`, "i"));
  const after = normalized.match(new RegExp(`${labels[label]}\\s*:?\\s*(\\d+(?:\\.\\d+)?\\s*(?:k|m|mil)?)`, "i"));
  return parseCompactNumber(before?.[1] ?? after?.[1] ?? "");
}

function parseCompactNumber(value: string) {
  const cleaned = value.toLowerCase().trim();
  if (!cleaned) return 0;
  const amount = Number.parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount)) return 0;
  if (cleaned.includes("mil")) return Math.round(amount * 1000);
  if (cleaned.includes("k")) return Math.round(amount * 1000);
  if (cleaned.includes("m")) return Math.round(amount * 1000000);
  return Math.round(amount);
}

function parseLooseJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function fetchPublicPage(url: string): Promise<PublicPageMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "es-PE,es;q=0.9,en;q=0.7",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36 ImpulsaOS/1.0"
      }
    });
    const html = await response.text();
    const blocked = response.status === 401 || response.status === 403 || /login|captcha|challenge|not allowed|temporarily blocked/i.test(html.slice(0, 5000));
    const platform = detectPlatform(url);
    const title = getMetaContent(html, ["og:title", "twitter:title"]) || getTitle(html);
    const description = getMetaContent(html, ["og:description", "description", "twitter:description"]);
    const imageUrl = getMetaContent(html, ["og:image", "twitter:image"]) || null;
    return {
      ok: response.ok && !blocked,
      status: blocked ? "blocked" : response.ok ? "ok" : "error",
      url: response.url || url,
      title,
      description,
      imageUrl,
      postUrls: platform ? extractPublicPostUrls(html, response.url || url, platform) : [],
      htmlText: decodeHtml(`${title} ${description}`),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      status: "error",
      url,
      title: "",
      description: "",
      imageUrl: null,
      postUrls: [],
      htmlText: "",
      error: error instanceof Error ? error.message : "No se pudo leer la pagina publica"
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function enrichCreatorFromPublicWeb(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  creator: Record<string, any>,
  businessId: string
) {
  const accounts = (creator.creator_accounts ?? []) as Array<Record<string, any>>;
  const snapshots: Array<Record<string, unknown>> = [];
  const rows: Array<Record<string, unknown>> = [];

  for (const account of accounts) {
    const platform = account.platform as CreatorPlatform;
    const profile = await fetchPublicPage(account.profile_url);
    snapshots.push({
      account_id: account.id,
      platform,
      profile_url: account.profile_url,
      status: profile.status,
      title: profile.title,
      description: profile.description,
      posts_found: profile.postUrls.length,
      error: profile.error
    });

    await supabase
      .from("creator_accounts")
      .update({
        profile_title: profile.title || null,
        profile_description: profile.description || null,
        profile_image_url: profile.imageUrl,
        last_fetch_status: profile.status,
        last_fetch_error: profile.error ?? null,
        last_analyzed_at: new Date().toISOString()
      })
      .eq("id", account.id);

    for (const postUrl of profile.postUrls) {
      const postMeta = await fetchPublicPage(postUrl);
      const text = `${postMeta.title} ${postMeta.description}`;
      const likes = extractMetric(text, "like");
      const comments = extractMetric(text, "comment");
      const views = extractMetric(text, "view");
      rows.push({
        business_id: businessId,
        creator_id: creator.id,
        account_id: account.id,
        platform,
        post_url: postUrl,
        post_type: derivePostType(postUrl, text, platform),
        published_at: null,
        caption: postMeta.description || postMeta.title,
        hook: (postMeta.description || postMeta.title).split(/[.!?\n]/)[0]?.slice(0, 220) ?? "",
        hook_type: classifyHook(text),
        topic: creator.niche || creator.type || "contenido competitivo",
        format: classifyFormat(`${postUrl} ${text}`),
        cta: classifyCta(text),
        intention: text.toLowerCase().includes("whatsapp") ? "captacion de leads" : "educacion",
        likes,
        comments,
        shares: 0,
        saves: 0,
        views,
        hashtags: [...text.matchAll(/#[\p{L}\p{N}_]+/gu)].map((match) => match[0]).slice(0, 20),
        thumbnail_url: postMeta.imageUrl,
        duration_seconds: 0,
        performance_score: scorePost({ likes, comments, views }),
        source: "public_web",
        raw_snapshot: {
          title: postMeta.title,
          description: postMeta.description,
          fetch_status: postMeta.status
        }
      });
    }
  }

  if (rows.length) {
    await supabase.from("creator_posts").upsert(rows, { onConflict: "creator_id,post_url" });
  }

  const readableProfiles = snapshots
    .map((snapshot) => `${snapshot.platform}: ${snapshot.title || snapshot.description || snapshot.status}`)
    .filter(Boolean)
    .join("\n");
  await supabase
    .from("creators")
    .update({
      profile_summary: readableProfiles || null,
      profile_snapshot: { accounts: snapshots, web_posts_discovered: rows.length },
      analysis_source: rows.length ? "public_web" : "public_profile",
      analysis_notes: rows.length
        ? "Se detectaron publicaciones desde HTML/metadatos publicos permitidos."
        : "Se leyo el perfil, pero la red no expuso publicaciones en HTML publico. Agrega URLs de posts para metricas exactas."
    })
    .eq("id", creator.id);

  return { snapshots, rowsCreated: rows.length, profileReadable: readableProfiles };
}

function apifyActorFor(platform: CreatorPlatform) {
  if (platform === "instagram") return process.env.APIFY_INSTAGRAM_ACTOR_ID || "apify/instagram-scraper";
  if (platform === "tiktok") return process.env.APIFY_TIKTOK_ACTOR_ID || "clockworks/tiktok-scraper";
  return process.env.APIFY_FACEBOOK_ACTOR_ID || "";
}

function apifyInputFor(platform: CreatorPlatform, account: Record<string, any>) {
  const limit = Number(process.env.PUBLIC_WEB_ANALYSIS_MAX_POSTS ?? 8);
  if (platform === "instagram") {
    return { directUrls: [account.profile_url], resultsType: "posts", resultsLimit: limit, addParentData: false };
  }
  if (platform === "tiktok") {
    return { profiles: [account.handle || account.username || extractHandle(account.profile_url)], resultsPerPage: limit, shouldDownloadVideos: false };
  }
  return { startUrls: [{ url: account.profile_url }], maxPosts: limit, resultsLimit: limit };
}

function normalizeApifyPost(item: Record<string, any>, creator: Record<string, any>, account: Record<string, any>, businessId: string) {
  const platform = account.platform as CreatorPlatform;
  const url = String(item.url ?? item.postUrl ?? item.webVideoUrl ?? item.shareUrl ?? item.inputUrl ?? "");
  if (!url) return null;
  const caption = String(item.caption ?? item.text ?? item.description ?? item.title ?? "");
  const likes = Number(item.likesCount ?? item.likes ?? item.diggCount ?? 0);
  const comments = Number(item.commentsCount ?? item.comments ?? item.commentCount ?? 0);
  const shares = Number(item.sharesCount ?? item.shares ?? item.shareCount ?? 0);
  const saves = Number(item.savesCount ?? item.collectCount ?? item.bookmarks ?? 0);
  const views = Number(item.videoViewCount ?? item.playCount ?? item.viewsCount ?? item.views ?? 0);
  return {
    business_id: businessId,
    creator_id: creator.id,
    account_id: account.id,
    platform,
    post_url: url,
    post_type: String(item.type ?? derivePostType(url, caption, platform)),
    published_at: item.timestamp ?? item.takenAt ?? item.createTimeISO ?? item.createTime ?? null,
    caption,
    hook: caption.split(/[.!?\n]/)[0]?.slice(0, 220) ?? "",
    hook_type: classifyHook(caption),
    topic: creator.niche || creator.type || "contenido competitivo",
    format: classifyFormat(`${url} ${caption}`),
    cta: classifyCta(caption),
    intention: caption.toLowerCase().includes("whatsapp") ? "captacion de leads" : "educacion",
    likes,
    comments,
    shares,
    saves,
    views,
    hashtags: Array.isArray(item.hashtags) ? item.hashtags.slice(0, 20) : [...caption.matchAll(/#[\p{L}\p{N}_]+/gu)].map((match) => match[0]).slice(0, 20),
    thumbnail_url: item.displayUrl ?? item.thumbnailUrl ?? item.coverUrl ?? null,
    duration_seconds: Number(item.duration ?? item.videoDuration ?? 0),
    performance_score: scorePost({ likes, comments, shares, saves, views }),
    source: "apify",
    raw_snapshot: item
  };
}

async function enrichCreatorFromApify(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  creator: Record<string, any>,
  businessId: string
) {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { rowsCreated: 0, snapshots: [] as Array<Record<string, unknown>> };

  const snapshots: Array<Record<string, unknown>> = [];
  const rows: Array<Record<string, unknown>> = [];
  for (const account of (creator.creator_accounts ?? []) as Array<Record<string, any>>) {
    const platform = account.platform as CreatorPlatform;
    const actorId = apifyActorFor(platform);
    if (!actorId) {
      snapshots.push({ platform, profile_url: account.profile_url, status: "missing_actor" });
      continue;
    }
    const response = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apifyInputFor(platform, account))
    }).catch(() => null);
    if (!response?.ok) {
      snapshots.push({ platform, profile_url: account.profile_url, status: "error", error: response?.status ?? "fetch_failed" });
      continue;
    }
    const items = await response.json().catch(() => []);
    const normalized: Array<Record<string, unknown>> = [];
    if (Array.isArray(items)) {
      for (const item of items) {
        const normalizedPost = normalizeApifyPost(item, creator, account, businessId);
        if (normalizedPost) normalized.push(normalizedPost);
      }
    }
    rows.push(...normalized);
    snapshots.push({ platform, profile_url: account.profile_url, status: "ok", posts_found: normalized.length, actor: actorId });
  }

  if (rows.length) await supabase.from("creator_posts").upsert(rows, { onConflict: "creator_id,post_url" });
  if (snapshots.length) {
    await supabase
      .from("creators")
      .update({
        profile_snapshot: { apify: snapshots },
        analysis_source: rows.length ? "apify" : "public_web",
        analysis_notes: rows.length
          ? "Se detectaron publicaciones mediante proveedor de navegacion configurado por API."
          : "Proveedor de navegacion consultado, sin publicaciones disponibles."
      })
      .eq("id", creator.id);
  }
  return { rowsCreated: rows.length, snapshots };
}

async function callGeminiSearchForCreator(creator: Record<string, any>, profileSignals: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.GEMINI_ENABLE_SEARCH === "false") return null;

  const model = process.env.GEMINI_SEARCH_MODEL || "gemini-2.5-flash";
  const accounts = (creator.creator_accounts ?? []).map((account: Record<string, unknown>) => ({
    platform: account.platform,
    url: account.profile_url,
    handle: account.handle ?? account.username
  }));
  const prompt = `Analiza informacion publica indexada de estos perfiles sociales sin copiar contenido ni evadir login. Devuelve JSON estricto con: summary, discovered_posts[{url,title,platform,caption}], patterns[{title,description,why_it_works,adaptation_notes,opportunity_score}], adaptable_ideas[{idea_title,adapted_angle,suggested_hook,suggested_format,suggested_channel,recommended_objective,opportunity_score}], risks[], sources[]. Si no encuentras posts verificables, usa solo senales publicas y marca el analisis como preliminar. Perfil: ${JSON.stringify({ creator: { name: creator.name, type: creator.type, notes: creator.notes }, accounts, profileSignals }).slice(0, 10000)}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.35 }
    })
  }).catch(() => null);

  if (!response?.ok) return null;
  const data = await response.json().catch(() => null);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const json = text ? parseLooseJson(text) : null;
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources = chunks
    .map((chunk: Record<string, any>) => ({ title: chunk.web?.title, uri: chunk.web?.uri }))
    .filter((source: { title?: string; uri?: string }) => source.uri);
  return json ? { ...json, sources: json.sources ?? sources } : null;
}

async function callGeminiForCreator(input: {
  creator: Record<string, unknown>;
  profileSignals?: Record<string, unknown>;
  posts: Array<Record<string, unknown>>;
  metrics: Record<string, unknown>;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  if (!apiKey) return null;

  const prompt = `Devuelve JSON estricto para analisis competitivo sin copiar contenido. Si hay pocos posts, usa señales del perfil como analisis preliminar y dilo claramente. Campos: summary, visual_recommendations, risks, opportunities, adaptable_ideas[3]. Datos: ${JSON.stringify(input).slice(0, 12000)}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.55 }
    })
  }).catch(() => null);

  if (!response?.ok) return null;
  const data = await response.json().catch(() => null);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function updateRun(runId: string, status: CreatorAnalysisStatus, message: string, error?: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase
    .from("analysis_runs")
    .update({
      status,
      progress: statusProgress[status],
      current_step: message,
      error_message: error ?? null,
      finished_at: ["analisis_completado", "requiere_revision_manual", "error_analisis"].includes(status) ? new Date().toISOString() : null
    })
    .eq("id", runId);
}

export async function listCreators() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Supabase no configurado", creators: [] };
  const business = await getFirstBusiness();
  const { data, error } = await supabase
    .from("creators")
    .select("*, creator_accounts(*), analysis_runs(*), content_patterns(*), adaptable_ideas(*)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message, creators: [] };
  return { ok: true, creators: data ?? [] };
}

export async function createCreator(input: CreateCreatorInput) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Supabase no configurado" };
  if (!input.name?.trim()) return { ok: false, error: "Nombre requerido" };
  const accounts = collectAccounts(input);
  if (!accounts.length) return { ok: false, error: "Agrega al menos una URL valida de Instagram, Facebook o TikTok" };

  const business = await getFirstBusiness();
  const { data: creator, error } = await supabase
    .from("creators")
    .insert({
      business_id: business.id,
      name: input.name.trim(),
      type: input.type || "direct_competitor",
      notes: [input.analysisObjective, input.notes].filter(Boolean).join("\n"),
      status: "guardado"
    })
    .select("*")
    .single();

  if (error || !creator) return { ok: false, error: error?.message ?? "No se pudo crear perfil" };

  const { error: accountError } = await supabase.from("creator_accounts").insert(
    accounts.map((account) => ({
      creator_id: creator.id,
      platform: account.platform,
      profile_url: account.url,
      username: account.handle,
      handle: account.handle,
      account_status: "active"
    }))
  );
  if (accountError) return { ok: false, error: accountError.message };

  if (input.startAnalysis) {
    const analysis = await startCreatorAnalysis(creator.id);
    return { ok: analysis.ok, creator, analysis };
  }

  return { ok: true, creator };
}

export async function startCreatorAnalysis(creatorId: string, goalId?: string | null) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Supabase no configurado" };
  const business = await getFirstBusiness();
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select("*, creator_accounts(*)")
    .eq("id", creatorId)
    .single();
  if (creatorError || !creator) return { ok: false, error: creatorError?.message ?? "Perfil no encontrado" };

  const { data: run, error: runError } = await supabase
    .from("analysis_runs")
    .insert({
      business_id: business.id,
      creator_id: creatorId,
      goal_id: goalId ?? null,
      mode: "public_web_assisted",
      status: "en_cola",
      progress: 5,
      current_step: "Analisis en cola",
      started_at: new Date().toISOString()
    })
    .select("*")
    .single();
  if (runError || !run) return { ok: false, error: runError?.message ?? "No se pudo crear analysis_run" };

  await supabase.from("creators").update({ status: "en_cola" }).eq("id", creatorId);

  try {
    await updateRun(run.id, "analizando_perfil", "Validando URLs y lectura de perfil");
    const apifyScan = await enrichCreatorFromApify(supabase, creator, business.id);
    const webScan = apifyScan.rowsCreated ? { snapshots: [], rowsCreated: 0, profileReadable: "" } : await enrichCreatorFromPublicWeb(supabase, creator, business.id);
    await updateRun(
      run.id,
      "analizando_publicaciones",
      apifyScan.rowsCreated || webScan.rowsCreated
        ? `Se detectaron ${apifyScan.rowsCreated + webScan.rowsCreated} publicaciones; clasificando contenido`
        : "No se expusieron publicaciones publicas; usando senales de perfil y posts cargados"
    );
    const searchScan = apifyScan.rowsCreated || webScan.rowsCreated ? null : await callGeminiSearchForCreator(creator, { apifyScan, webScan });
    const searchPosts = Array.isArray(searchScan?.discovered_posts) ? searchScan.discovered_posts : [];
    if (searchPosts.length) {
      const accounts = (creator.creator_accounts ?? []) as Array<Record<string, any>>;
      const rows = searchPosts
        .map((post: Record<string, unknown>) => {
          const url = String(post.url ?? "");
          const platform = (detectPlatform(url) ?? post.platform ?? accounts[0]?.platform ?? "instagram") as CreatorPlatform;
          if (!isPostUrl(url, platform)) return null;
          const account = accounts.find((item) => item.platform === platform) ?? accounts[0];
          const caption = String(post.caption ?? post.title ?? "");
          return {
            business_id: business.id,
            creator_id: creatorId,
            account_id: account?.id ?? null,
            platform,
            post_url: url,
            post_type: derivePostType(url, caption, platform),
            caption,
            hook: caption.split(/[.!?\n]/)[0]?.slice(0, 220) ?? "",
            hook_type: classifyHook(caption),
            topic: creator.niche || creator.type || "contenido competitivo",
            format: classifyFormat(`${url} ${caption}`),
            cta: classifyCta(caption),
            intention: caption.toLowerCase().includes("whatsapp") ? "captacion de leads" : "educacion",
            performance_score: 0,
            source: "gemini_search",
            raw_snapshot: post
          };
        })
        .filter(Boolean);
      if (rows.length) await supabase.from("creator_posts").upsert(rows, { onConflict: "creator_id,post_url" });
    }
    const { data: posts } = await supabase.from("creator_posts").select("*").eq("creator_id", creatorId);
    const normalizedPosts = (posts ?? []).map((post) => ({
      ...post,
      performance_score: post.performance_score || scorePost(post)
    }));

    await updateRun(run.id, "clasificando_formatos", "Clasificando formatos, intenciones y temas");
    for (const post of normalizedPosts) {
      const caption = post.caption ?? "";
      await supabase
        .from("creator_posts")
        .update({
          format: post.format || classifyFormat(`${post.post_type ?? ""} ${caption}`),
          hook_type: post.hook_type || classifyHook(`${post.hook ?? ""} ${caption}`),
          cta: post.cta || classifyCta(caption),
          intention: post.intention || (caption.toLowerCase().includes("whatsapp") ? "captacion de leads" : "educacion"),
          performance_score: post.performance_score
        })
        .eq("id", post.id);
    }

    await updateRun(run.id, "calculando_metricas", "Calculando promedios y ganadores");
    const postsAfter = normalizedPosts;
    const postsAnalyzed = postsAfter.length;
    const avgLikes = postsAnalyzed ? Math.round(postsAfter.reduce((sum, post) => sum + (post.likes ?? 0), 0) / postsAnalyzed) : 0;
    const avgComments = postsAnalyzed ? Math.round(postsAfter.reduce((sum, post) => sum + (post.comments ?? 0), 0) / postsAnalyzed) : 0;
    const profileText = `${creator.name ?? ""} ${creator.type ?? ""} ${webScan.profileReadable ?? ""}`;
    const winningFormat = dominant(postsAfter.map((post) => post.format || classifyFormat(`${post.post_type ?? ""} ${post.caption ?? ""}`)), postsAnalyzed ? "Reel educativo" : classifyFormat(profileText));
    const dominantHook = dominant(postsAfter.map((post) => post.hook_type || classifyHook(`${post.hook ?? ""} ${post.caption ?? ""}`)), classifyHook(profileText));
    const opportunityScore = postsAnalyzed ? Math.min(95, Math.round(avgComments * 1.2 + avgLikes * 0.05 + 62)) : webScan.profileReadable ? 62 : 38;
    const finalStatus: CreatorAnalysisStatus = postsAnalyzed || webScan.profileReadable ? "analisis_completado" : "requiere_revision_manual";

    await updateRun(run.id, "generando_insights", "Generando patrones y recomendaciones");
    const gemini = await callGeminiForCreator({
      creator,
      profileSignals: { apifyScan, webScan, searchScan },
      posts: postsAfter,
      metrics: { postsAnalyzed, avgLikes, avgComments, winningFormat, dominantHook, opportunityScore }
    });
    const intelligence = gemini ?? searchScan;
    const patternTitle = postsAnalyzed ? `${winningFormat} con ${dominantHook}` : `Patron preliminar: ${winningFormat} con ${dominantHook}`;
    const { data: pattern } = await supabase
      .from("content_patterns")
      .insert({
        business_id: business.id,
        creator_id: creatorId,
        analysis_run_id: run.id,
        platform: creator.creator_accounts?.[0]?.platform ?? null,
        pattern_type: postsAnalyzed ? "winning_format" : "profile_signal",
        title: patternTitle,
        description: intelligence?.summary ?? (postsAnalyzed ? "Patron detectado desde publicaciones cargadas o visibles publicamente." : "Patron preliminar detectado desde bio, titulo y metadatos publicos del perfil."),
        evidence_posts: postsAfter.slice(0, 5).map((post) => post.id),
        why_it_works: String(intelligence?.opportunities?.[0] ?? intelligence?.patterns?.[0]?.why_it_works ?? "Reduce esfuerzo de consumo y permite adaptar el aprendizaje sin copiar piezas."),
        risk_of_copying: postsAnalyzed ? "medium" : "low",
        opportunity_score: opportunityScore,
        adaptation_notes: String(intelligence?.visual_recommendations ?? intelligence?.patterns?.[0]?.adaptation_notes ?? "Adaptar al tono, publico y meta activa antes de generar contenido.")
      })
      .select("*")
      .single();

    await updateRun(run.id, "generando_ideas_adaptables", "Creando ideas adaptables para el motor");
    const ideaRows = (intelligence?.adaptable_ideas?.length ? intelligence.adaptable_ideas : [
      { idea_title: "3 errores al elegir una capacitacion en salud", adapted_angle: "Errores comunes con CTA de guardado", suggested_hook: "Si trabaja en salud y elige cursos solo por precio, esto le puede salir caro." },
      { idea_title: "Que no te pase: esperar el ultimo momento para capacitarte", adapted_angle: "Identificacion profesional", suggested_hook: "Si recien busca capacitarse cuando ya le piden el certificado, esto es para usted." },
      { idea_title: "Checklist para elegir un diplomado sin perder tiempo", adapted_angle: "Carrusel guardable", suggested_hook: "Guarde esto antes de inscribirse a cualquier diplomado." }
    ]).slice(0, 5);

    await supabase.from("adaptable_ideas").insert(
      ideaRows.map((idea: Record<string, unknown>) => ({
        business_id: business.id,
        source_creator_id: creatorId,
        source_pattern_id: pattern?.id ?? null,
        goal_id: goalId ?? null,
        idea_title: String(idea.idea_title ?? idea.title ?? "Idea adaptable"),
        adapted_angle: String(idea.adapted_angle ?? "Adaptar patron sin copiar contenido."),
        suggested_hook: String(idea.suggested_hook ?? "Hook pendiente"),
        suggested_format: String(idea.suggested_format ?? winningFormat),
        suggested_channel: String(idea.suggested_channel ?? "instagram_reel"),
        recommended_objective: String(idea.recommended_objective ?? "viralidad"),
        risk_of_copying: "low",
        opportunity_score: opportunityScore,
        status: "pendiente"
      }))
    );

    if (searchScan?.sources?.length) {
      await supabase
        .from("creators")
        .update({
          profile_snapshot: {
            ...(creator.profile_snapshot ?? {}),
            apify: apifyScan.snapshots,
            accounts: webScan.snapshots,
            web_posts_discovered: webScan.rowsCreated,
            gemini_search_sources: searchScan.sources
          }
        })
        .eq("id", creatorId);
    }

    await supabase
      .from("creators")
      .update({
        status: finalStatus,
        posts_analyzed: postsAnalyzed,
        avg_likes: avgLikes,
        avg_comments: avgComments,
        winning_format: winningFormat,
        dominant_hook: dominantHook,
        opportunity_score: opportunityScore,
        last_analyzed_at: new Date().toISOString()
      })
      .eq("id", creatorId);

    await updateRun(
      run.id,
      finalStatus,
      postsAnalyzed
        ? "Analisis completado con publicaciones detectadas"
        : webScan.profileReadable
          ? "Analisis preliminar completado; agrega URLs de posts para metricas exactas"
          : "Requiere carga manual de publicaciones visibles"
    );
    return { ok: true, runId: run.id, status: finalStatus };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await updateRun(run.id, "error_analisis", "Error de analisis", message);
    await supabase.from("creators").update({ status: "error_analisis" }).eq("id", creatorId);
    return { ok: false, runId: run.id, error: message };
  }
}

export async function startBulkAnalysis() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Supabase no configurado" };
  const business = await getFirstBusiness();
  const { data, error } = await supabase
    .from("creators")
    .select("id")
    .eq("business_id", business.id)
    .in("status", ["guardado", "saved", "pending", "requiere_revision_manual", "error_analisis"]);
  if (error) return { ok: false, error: error.message };
  const results = [];
  for (const creator of data ?? []) {
    results.push(await startCreatorAnalysis(creator.id));
  }
  return { ok: true, results };
}

export async function sendCreatorInsightsToEngine(creatorId: string, goalId?: string | null) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Supabase no configurado" };
  const business = await getFirstBusiness();
  const { data: creator } = await supabase
    .from("creators")
    .select("*, content_patterns(*), adaptable_ideas(*), analysis_runs(*)")
    .eq("id", creatorId)
    .single();
  if (!creator) return { ok: false, error: "Perfil no encontrado" };
  const latestRun = [...(creator.analysis_runs ?? [])].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  const payload = {
    creator_id: creatorId,
    analysis_run_id: latestRun?.id ?? null,
    goal_id: goalId ?? null,
    mejores_formatos: [creator.winning_format].filter(Boolean),
    mejores_hooks: [creator.dominant_hook].filter(Boolean),
    ideas_adaptables: creator.adaptable_ideas ?? [],
    patrones: creator.content_patterns ?? [],
    riesgos_detectados: ["No copiar piezas; adaptar patrones al tono y publico propio."],
    frecuencia_sugerida: creator.posts_analyzed > 0 ? "3 a 5 piezas semanales inspiradas en patrones ganadores" : "Cargar posts manuales antes de definir frecuencia",
    score_general: creator.opportunity_score ?? 0
  };

  const { data, error } = await supabase
    .from("content_engine_inputs")
    .insert({
      business_id: business.id,
      creator_id: creatorId,
      analysis_run_id: latestRun?.id ?? null,
      goal_id: goalId ?? null,
      source: "content_analysis",
      payload,
      insight_payload: payload,
      status: "sent",
      sent_to_engine_at: new Date().toISOString()
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, input: data };
}
