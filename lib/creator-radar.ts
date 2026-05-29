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

async function callGeminiForCreator(input: {
  creator: Record<string, unknown>;
  posts: Array<Record<string, unknown>>;
  metrics: Record<string, unknown>;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  if (!apiKey) return null;

  const prompt = `Devuelve JSON estricto para analisis competitivo sin copiar contenido. Campos: summary, visual_recommendations, risks, opportunities, adaptable_ideas[3]. Datos: ${JSON.stringify(input).slice(0, 12000)}`;
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
      mode: "manual_assisted",
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
    await updateRun(run.id, "analizando_publicaciones", "Leyendo publicaciones cargadas o visibles");
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
    const winningFormat = dominant(postsAfter.map((post) => post.format || classifyFormat(`${post.post_type ?? ""} ${post.caption ?? ""}`)), postsAnalyzed ? "Reel educativo" : "pendiente");
    const dominantHook = dominant(postsAfter.map((post) => post.hook_type || classifyHook(`${post.hook ?? ""} ${post.caption ?? ""}`)), postsAnalyzed ? "gancho de curiosidad" : "pendiente");
    const opportunityScore = postsAnalyzed ? Math.min(95, Math.round(avgComments * 1.2 + avgLikes * 0.05 + 62)) : 48;
    const finalStatus: CreatorAnalysisStatus = postsAnalyzed ? "analisis_completado" : "requiere_revision_manual";

    await updateRun(run.id, "generando_insights", "Generando patrones y recomendaciones");
    const gemini = await callGeminiForCreator({
      creator,
      posts: postsAfter,
      metrics: { postsAnalyzed, avgLikes, avgComments, winningFormat, dominantHook, opportunityScore }
    });
    const patternTitle = postsAnalyzed ? `${winningFormat} con ${dominantHook}` : "Carga manual requerida para detectar patrones reales";
    const { data: pattern } = await supabase
      .from("content_patterns")
      .insert({
        business_id: business.id,
        creator_id: creatorId,
        analysis_run_id: run.id,
        platform: creator.creator_accounts?.[0]?.platform ?? null,
        pattern_type: postsAnalyzed ? "winning_format" : "manual_needed",
        title: patternTitle,
        description: gemini?.summary ?? (postsAnalyzed ? "Patron detectado desde publicaciones cargadas." : "No hay publicaciones cargadas suficientes; usar carga manual asistida."),
        evidence_posts: postsAfter.slice(0, 5).map((post) => post.id),
        why_it_works: String(gemini?.opportunities?.[0] ?? "Reduce esfuerzo de consumo y permite adaptar el aprendizaje sin copiar piezas."),
        risk_of_copying: postsAnalyzed ? "medium" : "low",
        opportunity_score: opportunityScore,
        adaptation_notes: String(gemini?.visual_recommendations ?? "Adaptar al tono, publico y meta activa antes de generar contenido.")
      })
      .select("*")
      .single();

    await updateRun(run.id, "generando_ideas_adaptables", "Creando ideas adaptables para el motor");
    const ideaRows = (gemini?.adaptable_ideas?.length ? gemini.adaptable_ideas : [
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

    await updateRun(run.id, finalStatus, postsAnalyzed ? "Analisis completado" : "Requiere carga manual de publicaciones visibles");
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
