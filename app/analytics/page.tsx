"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MousePointerClick,
  Pencil,
  Plus,
  Radar,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  Users
} from "lucide-react";
import { Modal } from "@/components/modal";
import { Field, PageHeader, Panel, PanelHeader, StatCard, StatusBadge } from "@/components/ui";
import { providerPlaybook } from "@/lib/social-intelligence";
import { useWorkspace } from "@/lib/store";
import type { SocialDataProvider, SocialMetricSummary, SocialPlatform, SocialPostMetric } from "@/lib/types";

type CreatorAccount = {
  id: string;
  platform: "instagram" | "facebook" | "tiktok" | string;
  profile_url: string;
  username?: string | null;
  handle?: string | null;
  profile_title?: string | null;
  profile_description?: string | null;
  last_fetch_status?: string | null;
  last_fetch_error?: string | null;
};

type AnalysisRun = {
  id: string;
  status: string;
  progress?: number | null;
  current_step?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  error_message?: string | null;
  created_at: string;
};

type CreatorPost = {
  id: string;
  platform?: string | null;
  post_url?: string | null;
  post_type?: string | null;
  published_at?: string | null;
  caption?: string | null;
  hook?: string | null;
  hook_type?: string | null;
  topic?: string | null;
  format?: string | null;
  cta?: string | null;
  likes?: number | null;
  comments?: number | null;
  views?: number | null;
  performance_score?: number | null;
};

type ContentPattern = {
  id: string;
  title?: string | null;
  description?: string | null;
  why_it_works?: string | null;
  adaptation_notes?: string | null;
  opportunity_score?: number | null;
};

type AdaptableIdea = {
  id: string;
  idea_title?: string | null;
  adapted_angle?: string | null;
  suggested_hook?: string | null;
  suggested_format?: string | null;
  suggested_channel?: string | null;
  opportunity_score?: number | null;
  risk_of_copying?: string | null;
  status?: string | null;
};

type CreatorProfile = {
  id: string;
  name: string;
  type?: string | null;
  niche?: string | null;
  audience?: string | null;
  notes?: string | null;
  status?: string | null;
  posts_analyzed?: number | null;
  avg_likes?: number | null;
  avg_comments?: number | null;
  winning_format?: string | null;
  dominant_hook?: string | null;
  opportunity_score?: number | null;
  last_analyzed_at?: string | null;
  profile_summary?: string | null;
  analysis_source?: string | null;
  analysis_notes?: string | null;
  creator_accounts?: CreatorAccount[];
  analysis_runs?: AnalysisRun[];
  creator_posts?: CreatorPost[];
  content_patterns?: ContentPattern[];
  adaptable_ideas?: AdaptableIdea[];
};

const platformOptions: SocialPlatform[] = ["facebook", "instagram", "tiktok", "whatsapp"];
const providerOptions: SocialDataProvider[] = [
  "manual_csv",
  "meta_business_sdk",
  "tiktok_business_sdk",
  "instaloader",
  "tiktok_api",
  "facebook_scraper",
  "crawlee",
  "ocr",
  "whisper"
];

const profileTypes = [
  ["fanpage_propia", "Fanpage propia"],
  ["direct_competitor", "Competidor directo"],
  ["creator_reference", "Creador referente"],
  ["trend_account", "Cuenta de tendencia"],
  ["educational_brand", "Marca educativa"],
  ["health_influencer", "Influencer del sector salud"],
  ["other", "Otro"]
];

const analysisObjectives = [
  "Crecimiento de seguidores",
  "Captacion de leads",
  "Contenido educativo",
  "Venta de cursos/diplomados",
  "Analisis de competencia",
  "Inspiracion de formatos",
  "Benchmark general"
];

const statusLabels: Record<string, string> = {
  guardado: "Guardado",
  en_cola: "En cola",
  analizando_perfil: "Analizando perfil",
  analizando_publicaciones: "Analizando publicaciones",
  clasificando_formatos: "Clasificando formatos",
  extrayendo_hooks: "Extrayendo hooks",
  extrayendo_ctas: "Extrayendo CTAs",
  calculando_metricas: "Calculando metricas",
  generando_insights: "Generando insights",
  generando_ideas_adaptables: "Generando ideas adaptables",
  alimentando_motor: "Alimentando motor",
  analisis_completado: "Analisis completado",
  requiere_revision_manual: "Requiere revision manual",
  error_analisis: "Error de analisis",
  archivado: "Archivado"
};

function latestRun(creator: CreatorProfile) {
  return [...(creator.analysis_runs ?? [])].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
}

function formatDate(value?: string | null) {
  if (!value) return "Pendiente";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function networkSummary(accounts: CreatorAccount[] = []) {
  if (!accounts.length) return "Sin redes";
  return accounts.map((account) => account.platform).join(", ");
}

function scoreTone(score: number) {
  if (score >= 80) return "text-moss";
  if (score >= 55) return "text-saffron";
  return "text-ink/55";
}

export default function AnalyticsPage() {
  const { state, analytics, replaceSocialPostMetrics, recalculateSocialMetrics, runResearchAnalysis } = useWorkspace();
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCreator, setReportCreator] = useState<CreatorProfile | null>(null);
  const [remoteRows, setRemoteRows] = useState<SocialPostMetric[] | null>(null);
  const [remoteSummary, setRemoteSummary] = useState<SocialMetricSummary | null>(null);
  const [dataError, setDataError] = useState("");
  const [creatorError, setCreatorError] = useState("");
  const [creatorMessage, setCreatorMessage] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [workingCreatorId, setWorkingCreatorId] = useState<string | null>(null);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [creatorForm, setCreatorForm] = useState({
    name: "",
    type: "direct_competitor",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    analysisObjective: "Crecimiento de seguidores",
    notes: ""
  });
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    type: "direct_competitor",
    niche: "",
    audience: "",
    notes: ""
  });
  const [postForm, setPostForm] = useState({
    creatorId: "",
    platform: "instagram" as "instagram" | "facebook" | "tiktok",
    postUrl: "",
    publishedAt: new Date().toISOString().slice(0, 10),
    postType: "reel educativo",
    caption: "",
    hook: "",
    topic: "",
    format: "",
    cta: "",
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    views: 0,
    durationSeconds: 0
  });
  const [legacyPostForm, setLegacyPostForm] = useState({
    redSocial: "instagram" as SocialPlatform,
    cuenta: "",
    urlPost: "",
    fechaPublicacion: new Date().toISOString().slice(0, 10),
    tipoContenido: "reel",
    duracionVideo: 0,
    likes: 0,
    comentarios: 0,
    shares: 0,
    views: 0,
    hookTextual: "",
    hookVerbal: "",
    hookVisual: "",
    tema: "",
    provider: "manual_csv" as SocialDataProvider
  });

  const maxObjectiveScore = Math.max(...analytics.rankedObjectives.map((item) => item.score), 1);
  const displayRows = remoteRows ?? state.socialPostMetrics;
  const summary = remoteSummary ?? state.socialMetricSummary;
  const activeCreators = creators.filter((creator) => creator.status !== "archivado");
  const topPosts = useMemo(
    () => [...displayRows].sort((a, b) => b.scoreViralidad - a.scoreViralidad).slice(0, 6),
    [displayRows]
  );
  const dataMode = remoteRows ? "Supabase" : "Local";
  const benchmark = useMemo(() => {
    const ranked = [...activeCreators].sort((a, b) => Number(b.opportunity_score ?? 0) - Number(a.opportunity_score ?? 0));
    return {
      creators: activeCreators.length,
      completed: activeCreators.filter((creator) => creator.status === "analisis_completado").length,
      manual: activeCreators.filter((creator) => creator.status === "requiere_revision_manual").length,
      topFormat: ranked.find((creator) => creator.winning_format)?.winning_format ?? "Pendiente",
      topHook: ranked.find((creator) => creator.dominant_hook)?.dominant_hook ?? "Pendiente"
    };
  }, [activeCreators]);

  const loadSocialMetrics = useCallback(async () => {
    setLoadingData(true);
    setDataError("");
    try {
      const response = await fetch("/api/social/import", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setRemoteRows(null);
        setRemoteSummary(null);
        setDataError(payload.error ?? "No se pudieron leer metricas desde Supabase.");
        return;
      }
      const rows = payload.rows ?? [];
      setRemoteRows(rows);
      setRemoteSummary(payload.summary ?? null);
      replaceSocialPostMetrics(rows);
    } catch (error) {
      setRemoteRows(null);
      setRemoteSummary(null);
      setDataError(error instanceof Error ? error.message : "No se pudieron leer metricas desde Supabase.");
    } finally {
      setLoadingData(false);
    }
  }, [replaceSocialPostMetrics]);

  const loadCreators = useCallback(async () => {
    setLoadingCreators(true);
    setCreatorError("");
    try {
      const response = await fetch("/api/creators", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setCreatorError(payload.error ?? "No se pudieron leer creadores desde Supabase.");
        return;
      }
      setCreators(payload.creators ?? []);
    } catch (error) {
      setCreatorError(error instanceof Error ? error.message : "No se pudieron leer creadores desde Supabase.");
    } finally {
      setLoadingCreators(false);
    }
  }, []);

  useEffect(() => {
    loadSocialMetrics();
    loadCreators();
  }, [loadCreators, loadSocialMetrics]);

  useEffect(() => {
    const shouldPoll = creators.some((creator) => {
      const run = latestRun(creator);
      return run && !["analisis_completado", "requiere_revision_manual", "error_analisis"].includes(run.status);
    });
    if (!shouldPoll) return;
    const id = window.setInterval(loadCreators, 3500);
    return () => window.clearInterval(id);
  }, [creators, loadCreators]);

  async function submitCreator(event: FormEvent<HTMLFormElement>, startAnalysis: boolean) {
    event.preventDefault();
    setCreatorError("");
    setCreatorMessage("");
    const response = await fetch("/api/creators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creatorForm, startAnalysis })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setCreatorError(payload.error ?? "No se pudo guardar el perfil.");
      return;
    }
    setShowCreatorModal(false);
    setCreatorForm({
      name: "",
      type: "direct_competitor",
      instagramUrl: "",
      facebookUrl: "",
      tiktokUrl: "",
      analysisObjective: "Crecimiento de seguidores",
      notes: ""
    });
    setCreatorMessage(startAnalysis ? "Perfil guardado y analisis iniciado." : "Perfil guardado.");
    await loadCreators();
  }

  async function startAnalysis(creatorId: string) {
    setWorkingCreatorId(creatorId);
    setCreatorError("");
    setCreatorMessage("");
    const response = await fetch(`/api/creators/${creatorId}/start-analysis`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) setCreatorError(payload.error ?? "No se pudo iniciar analisis.");
    else setCreatorMessage("Analisis iniciado. Puedes cerrar esta vista; el progreso queda guardado.");
    setWorkingCreatorId(null);
    await loadCreators();
  }

  async function startBulkAnalysis() {
    setWorkingCreatorId("bulk");
    setCreatorError("");
    setCreatorMessage("");
    const response = await fetch("/api/creators/start-bulk-analysis", { method: "POST" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) setCreatorError(payload.error ?? "No se pudo iniciar el analisis general.");
    else setCreatorMessage(`Analisis general ejecutado para ${payload.results?.length ?? 0} perfiles.`);
    setWorkingCreatorId(null);
    await loadCreators();
  }

  async function sendToEngine(creatorId: string) {
    setWorkingCreatorId(creatorId);
    setCreatorError("");
    setCreatorMessage("");
    const response = await fetch(`/api/creators/${creatorId}/send-to-content-engine`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) setCreatorError(payload.error ?? "No se pudieron enviar insights al motor.");
    else setCreatorMessage("Insights enviados al Motor de Contenido.");
    setWorkingCreatorId(null);
  }

  async function archiveCreator(creatorId: string) {
    await fetch(`/api/creators/${creatorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archivado" })
    });
    await loadCreators();
  }

  function openEdit(creator: CreatorProfile) {
    setEditForm({
      id: creator.id,
      name: creator.name,
      type: creator.type ?? "direct_competitor",
      niche: creator.niche ?? "",
      audience: creator.audience ?? "",
      notes: creator.notes ?? ""
    });
    setShowEditModal(true);
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/creators/${editForm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        type: editForm.type,
        niche: editForm.niche,
        audience: editForm.audience,
        notes: editForm.notes
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setCreatorError(payload.error ?? "No se pudo editar el perfil.");
      return;
    }
    setShowEditModal(false);
    setCreatorMessage("Perfil actualizado.");
    await loadCreators();
  }

  async function deleteCreator(creatorId: string) {
    await fetch(`/api/creators/${creatorId}`, { method: "DELETE" });
    await loadCreators();
  }

  async function openReport(creator: CreatorProfile) {
    const response = await fetch(`/api/creators/${creator.id}`, { cache: "no-store" });
    const payload = await response.json();
    setReportCreator(payload.creator ?? creator);
    setShowReportModal(true);
  }

  async function submitManualPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatorError("");
    const response = await fetch("/api/creator-posts/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...postForm, publishedAt: new Date(postForm.publishedAt).toISOString() })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setCreatorError(payload.error ?? "No se pudo guardar el post.");
      return;
    }
    setShowPostModal(false);
    setCreatorMessage("Post cargado. Reanaliza el perfil para recalcular patrones.");
    await loadCreators();
  }

  async function submitLegacyPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      competitorProfileId: null,
      redSocial: legacyPostForm.redSocial,
      cuenta: legacyPostForm.cuenta,
      urlPost: legacyPostForm.urlPost,
      fechaPublicacion: new Date(legacyPostForm.fechaPublicacion).toISOString(),
      tipoContenido: legacyPostForm.tipoContenido,
      duracionVideo: legacyPostForm.duracionVideo,
      likes: legacyPostForm.likes,
      comentarios: legacyPostForm.comentarios,
      shares: legacyPostForm.shares,
      views: legacyPostForm.views,
      hookTextual: legacyPostForm.hookTextual,
      hookVerbal: legacyPostForm.hookVerbal,
      hookVisual: legacyPostForm.hookVisual,
      tema: legacyPostForm.tema,
      provider: legacyPostForm.provider,
      raw: { source: "manual_ui" }
    };
    try {
      await fetch("/api/social/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [input] })
      });
      await loadSocialMetrics();
    } catch {
      setDataError("No se pudo guardar el post en metricas sociales.");
    }
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Metricas reales, radar competitivo y patrones que alimentan el Motor de Contenido."
      >
        <button className="btn-secondary" type="button" onClick={recalculateSocialMetrics}>
          <RefreshCw className="h-4 w-4" />
          Recalcular
        </button>
        <button className="btn-secondary" type="button" onClick={loadSocialMetrics}>
          <RefreshCw className="h-4 w-4" />
          Leer SQL
        </button>
        <button className="btn-secondary" type="button" onClick={runResearchAnalysis}>
          <Radar className="h-4 w-4" />
          Analizar
        </button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Alcance total" value={analytics.totalReach} icon={BarChart3} tone="peacock" />
        <StatCard label="Clics WhatsApp" value={analytics.totalClicks} icon={MousePointerClick} tone="moss" />
        <StatCard label="Leads" value={analytics.leadCount} icon={Users} tone="saffron" />
        <StatCard label="Conversion" value={`${analytics.conversion}%`} icon={CheckCircle2} tone="coral" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Comentarios promedio" value={summary.comentariosPromedio} icon={Sparkles} tone="peacock" />
        <StatCard label="Likes promedio" value={summary.likesPromedio} icon={Trophy} tone="saffron" />
        <StatCard label="Formato ganador" value={summary.formatoGanador} icon={BarChart3} tone="moss" />
        <StatCard label="Hook dominante" value={summary.hookDominante} icon={Radar} tone="peacock" />
      </div>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-[var(--color-surface)] px-4 py-3 text-sm text-ink/65">
        Fuente actual: <span className="font-semibold text-ink">{dataMode}</span>
        {loadingData ? " · cargando metricas reales..." : ` · ${displayRows.length} posts analizados`}
        {dataError ? <span className="text-coral"> · {dataError}</span> : null}
      </div>

      <Panel className="mt-6">
        <PanelHeader
          title="Creadores y Fan Pages"
          description="Radar competitivo: registra links, analiza patrones, genera ideas adaptables y envia hallazgos al motor."
          action={
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" type="button" onClick={() => setShowCreatorModal(true)}>
                <Plus className="h-4 w-4" />
                Agregar perfil
              </button>
              <button className="btn-secondary" type="button" onClick={startBulkAnalysis} disabled={workingCreatorId === "bulk"}>
                {workingCreatorId === "bulk" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
                Iniciar analisis general
              </button>
              <button className="btn-secondary" type="button" onClick={() => setCreatorMessage(`Benchmark: ${benchmark.creators} perfiles, formato fuerte ${benchmark.topFormat}, hook ${benchmark.topHook}.`)}>
                <BarChart3 className="h-4 w-4" />
                Ver benchmark
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => activeCreators.filter((creator) => creator.status === "analisis_completado").forEach((creator) => void sendToEngine(creator.id))}
              >
                <Send className="h-4 w-4" />
                Enviar insights al Motor
              </button>
              <button className="btn-secondary" type="button" onClick={loadCreators}>
                <RefreshCw className="h-4 w-4" />
                Actualizar estados
              </button>
            </div>
          }
        />
        <div className="grid gap-3 border-b border-ink/10 p-4 md:grid-cols-4">
          <div className="rounded-3xl bg-paper p-4">
            <p className="text-xs text-ink/50">Perfiles guardados</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{benchmark.creators}</p>
          </div>
          <div className="rounded-3xl bg-paper p-4">
            <p className="text-xs text-ink/50">Analisis completos</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{benchmark.completed}</p>
          </div>
          <div className="rounded-3xl bg-paper p-4">
            <p className="text-xs text-ink/50">Revision manual</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{benchmark.manual}</p>
          </div>
          <div className="rounded-3xl bg-paper p-4">
            <p className="text-xs text-ink/50">Patron principal</p>
            <p className="mt-1 text-sm font-semibold text-ink">{benchmark.topFormat}</p>
          </div>
        </div>
        {creatorError || creatorMessage ? (
          <div className="border-b border-ink/10 px-4 py-3 text-sm">
            {creatorError ? <span className="text-coral">{creatorError}</span> : null}
            {creatorMessage ? <span className="text-moss">{creatorMessage}</span> : null}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-paper text-xs uppercase text-ink/50">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Redes</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Posts</th>
                <th className="px-4 py-3">Formato ganador</th>
                <th className="px-4 py-3">Hook dominante</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Ultimo analisis</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {activeCreators.map((creator) => {
                const run = latestRun(creator);
                const progress = run?.progress ?? (creator.status === "analisis_completado" ? 100 : 0);
                return (
                  <tr key={creator.id} className="transition-colors hover:bg-paper/70">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink">{creator.name}</p>
                      <p className="text-xs text-ink/55">{creator.niche || creator.audience || creator.analysis_notes || "Datos estrategicos por calcular"}</p>
                    </td>
                    <td className="px-4 py-4 text-ink/65">{creator.type || "Pendiente"}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(creator.creator_accounts ?? []).map((account) => (
                          <a key={account.id} className="rounded-full bg-violet/10 px-2 py-1 text-xs font-semibold text-violet" href={account.profile_url} target="_blank" rel="noreferrer">
                            {account.platform}
                          </a>
                        ))}
                        {!creator.creator_accounts?.length ? <span className="text-xs text-ink/50">Sin redes</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-44">
                        <StatusBadge status={creator.status ?? "guardado"} />
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8">
                          <div className="h-full rounded-full bg-violet" style={{ width: `${Math.min(100, Math.max(0, Number(progress)))}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-ink/50">{run?.current_step ?? statusLabels[creator.status ?? "guardado"] ?? "Guardado"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-ink">{creator.posts_analyzed ?? 0}</td>
                    <td className="px-4 py-4 text-ink/70">{creator.winning_format || "Pendiente"}</td>
                    <td className="px-4 py-4 text-ink/70">{creator.dominant_hook || "Pendiente"}</td>
                    <td className={`px-4 py-4 font-semibold ${scoreTone(Number(creator.opportunity_score ?? 0))}`}>{Math.round(Number(creator.opportunity_score ?? 0))}</td>
                    <td className="px-4 py-4 text-ink/60">{formatDate(creator.last_analyzed_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary px-3 py-2 text-xs" type="button" onClick={() => openReport(creator)}>
                          <FileText className="h-3.5 w-3.5" />
                          Informe
                        </button>
                        <button className="btn-secondary px-3 py-2 text-xs" type="button" onClick={() => startAnalysis(creator.id)}>
                          {workingCreatorId === creator.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}
                          {creator.last_analyzed_at ? "Reanalizar" : "Iniciar"}
                        </button>
                        <button
                          className="btn-secondary px-3 py-2 text-xs"
                          type="button"
                          onClick={() => {
                            setPostForm({ ...postForm, creatorId: creator.id, platform: (creator.creator_accounts?.[0]?.platform as "instagram" | "facebook" | "tiktok") ?? "instagram" });
                            setShowPostModal(true);
                          }}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Cargar post
                        </button>
                        <button className="btn-secondary px-3 py-2 text-xs" type="button" onClick={() => sendToEngine(creator.id)}>
                          <Send className="h-3.5 w-3.5" />
                          Motor
                        </button>
                        <button className="btn-secondary px-3 py-2 text-xs" type="button" onClick={() => openEdit(creator)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button className="btn-secondary px-3 py-2 text-xs" type="button" onClick={() => archiveCreator(creator.id)}>
                          <Archive className="h-3.5 w-3.5" />
                          Archivar
                        </button>
                        <button className="btn-secondary px-3 py-2 text-xs text-coral" type="button" onClick={() => deleteCreator(creator.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!activeCreators.length && !loadingCreators ? (
          <div className="p-8 text-center text-sm text-ink/60">Agrega un perfil con solo nombre y una URL para activar el radar.</div>
        ) : null}
        {loadingCreators ? <div className="p-8 text-center text-sm text-ink/60">Cargando radar...</div> : null}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader
            title="Posts analizados"
            description="Columnas base: red, cuenta, URL, fecha, formato, likes, comentarios, shares, views, hooks y score."
            action={
              <button className="btn-secondary" type="button" onClick={() => setShowPostModal(true)}>
                <Plus className="h-4 w-4" />
                Cargar post a radar
              </button>
            }
          />
          <div className="divide-y divide-ink/10">
            {topPosts.map((post) => (
              <article key={post.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet/10 px-2 py-1 text-xs font-semibold text-violet">{post.redSocial}</span>
                    <span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{post.formatoDetectado}</span>
                    <span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{post.categoriaHook}</span>
                  </div>
                  <h3 className="font-semibold text-ink">{post.hookTextual || post.hookVerbal || post.hookVisual || post.tema}</h3>
                  <p className="mt-1 text-sm text-ink/60">
                    {post.cuenta} · {post.tema || "sin tema"} · CTA: {post.cta || "pendiente"}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center sm:min-w-[360px]">
                  <div className="rounded-2xl bg-paper p-3">
                    <p className="text-xs text-ink/50">Score</p>
                    <p className="font-semibold">{post.scoreViralidad}</p>
                  </div>
                  <div className="rounded-2xl bg-paper p-3">
                    <p className="text-xs text-ink/50">ER</p>
                    <p className="font-semibold">{post.engagementRate}%</p>
                  </div>
                  <div className="rounded-2xl bg-paper p-3">
                    <p className="text-xs text-ink/50">Com.</p>
                    <p className="font-semibold">{post.comentarios}</p>
                  </div>
                  <div className="rounded-2xl bg-paper p-3">
                    <p className="text-xs text-ink/50">Likes</p>
                    <p className="font-semibold">{post.likes}</p>
                  </div>
                </div>
              </article>
            ))}
            {!topPosts.length ? <div className="p-6 text-sm text-ink/60">Agrega posts manualmente o importa un CSV para activar el motor.</div> : null}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Sistema de lectura" description="Adaptadores previstos sin scraping agresivo: API oficial, datos publicos permitidos y carga asistida." />
          <div className="grid gap-3 p-4">
            <div className="rounded-3xl border border-ink/10 bg-paper p-4">
              <p className="font-semibold text-ink">Formatos a vigilar</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.formatosVigilar.length ? (
                  summary.formatosVigilar.map((format) => (
                    <span key={format} className="rounded-full bg-violet/10 px-3 py-1 text-xs font-semibold text-violet">
                      {format}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-ink/60">Pendiente de mas datos recientes.</span>
                )}
              </div>
            </div>
            {providerPlaybook.slice(0, 5).map((provider) => (
              <div key={provider.provider} className="rounded-3xl border border-ink/10 bg-paper p-4">
                <p className="font-semibold text-ink">{provider.provider}</p>
                <p className="mt-1 text-sm leading-6 text-ink/60">{provider.useFor}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <PanelHeader title="Objetivos con mejor score" description="Promedio de score viral/estrategico por objetivo." />
          <div className="space-y-4 p-4">
            {analytics.rankedObjectives.map((item) => (
              <div key={item.objective}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{item.objective}</span>
                  <span className="text-ink/60">{item.score}/100</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-paper">
                  <div className="h-full bg-moss" style={{ width: `${(item.score / maxObjectiveScore) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recomendaciones del motor" description="Insights combinando contenido propio, competidores, modo internet y documentos EREX." />
          <div className="stagger-list grid gap-3 p-4">
            {state.researchInsights.slice(0, 4).map((insight) => (
              <article key={insight.id} className="rounded-3xl border border-ink/10 bg-paper p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 px-2 py-1 text-xs font-semibold text-violet">
                    <Radar className="h-3.5 w-3.5" />
                    {insight.source}
                  </span>
                  <span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/55">{insight.confidence}% confianza</span>
                </div>
                <h3 className="font-semibold text-ink">{insight.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/65">{insight.summary}</p>
                <p className="mt-3 rounded-2xl bg-[var(--color-surface)] p-3 text-sm leading-6 text-ink/75">{insight.recommendation}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Modal
        open={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        title="Agregar creador o fanpage"
        description="Solo necesitas nombre y al menos un link. El sistema completa metricas y patrones despues del analisis."
        size="lg"
      >
        <form className="grid gap-4" onSubmit={(event) => submitCreator(event, false)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <input className="input" required value={creatorForm.name} onChange={(event) => setCreatorForm({ ...creatorForm, name: event.target.value })} />
            </Field>
            <Field label="Tipo de perfil">
              <select className="select" value={creatorForm.type} onChange={(event) => setCreatorForm({ ...creatorForm, type: event.target.value })}>
                {profileTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Instagram URL">
              <input className="input" value={creatorForm.instagramUrl} onChange={(event) => setCreatorForm({ ...creatorForm, instagramUrl: event.target.value })} />
            </Field>
            <Field label="Facebook URL">
              <input className="input" value={creatorForm.facebookUrl} onChange={(event) => setCreatorForm({ ...creatorForm, facebookUrl: event.target.value })} />
            </Field>
            <Field label="TikTok URL">
              <input className="input" value={creatorForm.tiktokUrl} onChange={(event) => setCreatorForm({ ...creatorForm, tiktokUrl: event.target.value })} />
            </Field>
            <Field label="Objetivo del analisis">
              <select className="select" value={creatorForm.analysisObjective} onChange={(event) => setCreatorForm({ ...creatorForm, analysisObjective: event.target.value })}>
                {analysisObjectives.map((objective) => (
                  <option key={objective} value={objective}>
                    {objective}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notas opcionales">
            <textarea className="textarea" value={creatorForm.notes} onChange={(event) => setCreatorForm({ ...creatorForm, notes: event.target.value })} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setShowCreatorModal(false)}>
              Cancelar
            </button>
            <button className="btn-secondary" type="submit">
              Guardar perfil
            </button>
            <button className="btn-primary" type="button" onClick={(event) => submitCreator(event as unknown as FormEvent<HTMLFormElement>, true)}>
              <Radar className="h-4 w-4" />
              Guardar e iniciar analisis
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Carga manual asistida"
        description="Usalo cuando la plataforma no permita lectura automatica. Estos datos alimentan el siguiente reanalisis."
        size="lg"
      >
        <form className="grid gap-4" onSubmit={submitManualPost}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Perfil">
              <select className="select" required value={postForm.creatorId} onChange={(event) => setPostForm({ ...postForm, creatorId: event.target.value })}>
                <option value="">Selecciona perfil</option>
                {activeCreators.map((creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Plataforma">
              <select className="select" value={postForm.platform} onChange={(event) => setPostForm({ ...postForm, platform: event.target.value as "instagram" | "facebook" | "tiktok" })}>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
              </select>
            </Field>
            <Field label="URL de publicacion">
              <input className="input" required value={postForm.postUrl} onChange={(event) => setPostForm({ ...postForm, postUrl: event.target.value })} />
            </Field>
            <Field label="Fecha">
              <input className="input" type="date" value={postForm.publishedAt} onChange={(event) => setPostForm({ ...postForm, publishedAt: event.target.value })} />
            </Field>
            <Field label="Tipo">
              <input className="input" value={postForm.postType} onChange={(event) => setPostForm({ ...postForm, postType: event.target.value })} />
            </Field>
            <Field label="Formato detectado">
              <input className="input" value={postForm.format} onChange={(event) => setPostForm({ ...postForm, format: event.target.value })} />
            </Field>
            <Field label="Likes">
              <input className="input" type="number" value={postForm.likes} onChange={(event) => setPostForm({ ...postForm, likes: Number(event.target.value) })} />
            </Field>
            <Field label="Comentarios">
              <input className="input" type="number" value={postForm.comments} onChange={(event) => setPostForm({ ...postForm, comments: Number(event.target.value) })} />
            </Field>
            <Field label="Compartidos">
              <input className="input" type="number" value={postForm.shares} onChange={(event) => setPostForm({ ...postForm, shares: Number(event.target.value) })} />
            </Field>
            <Field label="Guardados">
              <input className="input" type="number" value={postForm.saves} onChange={(event) => setPostForm({ ...postForm, saves: Number(event.target.value) })} />
            </Field>
            <Field label="Vistas">
              <input className="input" type="number" value={postForm.views} onChange={(event) => setPostForm({ ...postForm, views: Number(event.target.value) })} />
            </Field>
            <Field label="Duracion video">
              <input className="input" type="number" value={postForm.durationSeconds} onChange={(event) => setPostForm({ ...postForm, durationSeconds: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="Caption o copy visible">
            <textarea className="textarea" value={postForm.caption} onChange={(event) => setPostForm({ ...postForm, caption: event.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Hook detectado">
              <input className="input" value={postForm.hook} onChange={(event) => setPostForm({ ...postForm, hook: event.target.value })} />
            </Field>
            <Field label="Tema">
              <input className="input" value={postForm.topic} onChange={(event) => setPostForm({ ...postForm, topic: event.target.value })} />
            </Field>
            <Field label="CTA">
              <input className="input" value={postForm.cta} onChange={(event) => setPostForm({ ...postForm, cta: event.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setShowPostModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit">
              <Plus className="h-4 w-4" />
              Guardar post
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar perfil"
        description="Corrige campos estrategicos despues del analisis automatico o semiautomatico."
        size="md"
      >
        <form className="grid gap-4" onSubmit={submitEdit}>
          <Field label="Nombre">
            <input className="input" required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
          </Field>
          <Field label="Tipo">
            <select className="select" value={editForm.type} onChange={(event) => setEditForm({ ...editForm, type: event.target.value })}>
              {profileTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nicho">
            <input className="input" value={editForm.niche} onChange={(event) => setEditForm({ ...editForm, niche: event.target.value })} />
          </Field>
          <Field label="Publico objetivo">
            <input className="input" value={editForm.audience} onChange={(event) => setEditForm({ ...editForm, audience: event.target.value })} />
          </Field>
          <Field label="Notas">
            <textarea className="textarea" value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setShowEditModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit">
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={reportCreator?.name ?? "Informe del creador"}
        description="Resumen, posts, patrones e ideas adaptables listos para alimentar el motor."
        size="xl"
      >
        {reportCreator ? (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-3xl bg-paper p-4">
                <p className="text-xs text-ink/50">Redes</p>
                <p className="mt-1 font-semibold text-ink">{networkSummary(reportCreator.creator_accounts)}</p>
              </div>
              <div className="rounded-3xl bg-paper p-4">
                <p className="text-xs text-ink/50">Posts</p>
                <p className="mt-1 font-semibold text-ink">{reportCreator.posts_analyzed ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-paper p-4">
                <p className="text-xs text-ink/50">Formato</p>
                <p className="mt-1 font-semibold text-ink">{reportCreator.winning_format ?? "Pendiente"}</p>
              </div>
              <div className="rounded-3xl bg-paper p-4">
                <p className="text-xs text-ink/50">Hook</p>
                <p className="mt-1 font-semibold text-ink">{reportCreator.dominant_hook ?? "Pendiente"}</p>
              </div>
            </div>
            <section className="rounded-3xl border border-ink/10 bg-paper p-4">
              <h3 className="font-semibold text-ink">Resumen estrategico</h3>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {reportCreator.analysis_notes ||
                  (reportCreator.status === "requiere_revision_manual"
                    ? "La cuenta necesita URLs o metricas visibles cargadas manualmente antes de detectar patrones confiables."
                    : "El sistema detecta patrones desde publicaciones cargadas o metadatos publicos, calcula rendimiento y propone adaptaciones sin copiar contenido.")}
              </p>
              {reportCreator.profile_summary ? <p className="mt-3 rounded-2xl bg-[var(--color-surface)] p-3 text-sm leading-6 text-ink/70">{reportCreator.profile_summary}</p> : null}
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {(reportCreator.creator_accounts ?? []).map((account) => (
                  <div key={account.id} className="rounded-2xl bg-[var(--color-surface)] p-3 text-sm">
                    <p className="font-semibold text-ink">{account.platform}</p>
                    <p className="mt-1 line-clamp-2 text-ink/60">{account.profile_title || account.profile_description || account.profile_url}</p>
                    <p className="mt-2 text-xs text-ink/45">Lectura: {account.last_fetch_status || "pendiente"}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl border border-ink/10 bg-paper p-4">
              <h3 className="font-semibold text-ink">Posts detectados</h3>
              <div className="mt-3 grid gap-2">
                {(reportCreator.creator_posts ?? []).slice(0, 8).map((post) => (
                  <div key={post.id} className="grid gap-2 rounded-2xl bg-[var(--color-surface)] p-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="font-medium text-ink">{post.hook || post.caption || post.topic || post.post_type}</p>
                      <p className="text-xs text-ink/55">{post.platform} · {post.format || post.post_type} · CTA: {post.cta || "pendiente"}</p>
                    </div>
                    <p className="text-sm font-semibold text-violet">Score {Math.round(Number(post.performance_score ?? 0))}</p>
                  </div>
                ))}
                {!reportCreator.creator_posts?.length ? <p className="text-sm text-ink/55">Aun no hay posts. Usa carga manual asistida y reanaliza.</p> : null}
              </div>
            </section>
            <section className="rounded-3xl border border-ink/10 bg-paper p-4">
              <h3 className="font-semibold text-ink">Patrones ganadores</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(reportCreator.content_patterns ?? []).map((pattern) => (
                  <article key={pattern.id} className="rounded-2xl bg-[var(--color-surface)] p-3">
                    <p className="font-semibold text-ink">{pattern.title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink/60">{pattern.description}</p>
                    <p className="mt-2 text-sm text-ink/75">{pattern.adaptation_notes}</p>
                  </article>
                ))}
                {!reportCreator.content_patterns?.length ? <p className="text-sm text-ink/55">Sin patrones todavia.</p> : null}
              </div>
            </section>
            <section className="rounded-3xl border border-ink/10 bg-paper p-4">
              <h3 className="font-semibold text-ink">Ideas adaptables</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(reportCreator.adaptable_ideas ?? []).map((idea) => (
                  <article key={idea.id} className="rounded-2xl bg-[var(--color-surface)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{idea.idea_title}</p>
                      <span className="rounded-full bg-violet/10 px-2 py-1 text-xs font-semibold text-violet">{Math.round(Number(idea.opportunity_score ?? 0))}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-ink/60">{idea.adapted_angle}</p>
                    <p className="mt-2 rounded-2xl bg-paper p-3 text-sm text-ink/75">{idea.suggested_hook}</p>
                  </article>
                ))}
                {!reportCreator.adaptable_ideas?.length ? <p className="text-sm text-ink/55">Sin ideas adaptables todavia.</p> : null}
              </div>
            </section>
            <div className="flex justify-end">
              <button className="btn-primary" type="button" onClick={() => reportCreator && sendToEngine(reportCreator.id)}>
                <Send className="h-4 w-4" />
                Enviar hallazgos al Motor de Contenido
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <form className="hidden" onSubmit={submitLegacyPost}>
        <select value={legacyPostForm.redSocial} onChange={(event) => setLegacyPostForm({ ...legacyPostForm, redSocial: event.target.value as SocialPlatform })}>
          {platformOptions.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
        <select value={legacyPostForm.provider} onChange={(event) => setLegacyPostForm({ ...legacyPostForm, provider: event.target.value as SocialDataProvider })}>
          {providerOptions.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </form>
    </>
  );
}
