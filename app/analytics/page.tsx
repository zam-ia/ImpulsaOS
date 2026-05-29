"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ExternalLink,
  MousePointerClick,
  Plus,
  Radar,
  RefreshCw,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import { Modal } from "@/components/modal";
import { Field, PageHeader, Panel, PanelHeader, StatCard, StatusBadge } from "@/components/ui";
import { providerPlaybook } from "@/lib/social-intelligence";
import { useWorkspace } from "@/lib/store";
import type { CompetitorProfile, SocialDataProvider, SocialMetricSummary, SocialPlatform, SocialPostMetric } from "@/lib/types";

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

export default function AnalyticsPage() {
  const {
    state,
    analytics,
    addCompetitorProfile,
    updateCompetitorProfile,
    addSocialPostMetric,
    replaceSocialPostMetrics,
    recalculateSocialMetrics,
    runResearchAnalysis
  } = useWorkspace();
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [remoteRows, setRemoteRows] = useState<SocialPostMetric[] | null>(null);
  const [remoteSummary, setRemoteSummary] = useState<SocialMetricSummary | null>(null);
  const [dataError, setDataError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [creatorForm, setCreatorForm] = useState({
    platform: "instagram" as SocialPlatform,
    name: "Nuevo creador",
    handle: "",
    profileUrl: "",
    niche: "",
    notes: "",
    trackedFormats: "reel auditoria\ncarrusel educativo\nstory CTA",
    isActive: true,
    postsAnalyzed: 0,
    avgLikes: 0,
    avgComments: 0,
    topFormat: "",
    topHook: ""
  });
  const [postForm, setPostForm] = useState({
    competitorProfileId: "",
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
  const visibleProfiles = state.competitorProfiles.filter((profile) => !profile.id.startsWith("creator_demo_"));
  const summary = remoteSummary ?? state.socialMetricSummary;
  const topPosts = useMemo(
    () => [...displayRows].sort((a, b) => b.scoreViralidad - a.scoreViralidad).slice(0, 6),
    [displayRows]
  );
  const dataMode = remoteRows ? "Supabase" : "Local";

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

  useEffect(() => {
    loadSocialMetrics();
  }, [loadSocialMetrics]);

  function submitCreator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addCompetitorProfile({
      platform: creatorForm.platform,
      name: creatorForm.name,
      handle: creatorForm.handle,
      profileUrl: creatorForm.profileUrl,
      niche: creatorForm.niche,
      notes: creatorForm.notes,
      trackedFormats: creatorForm.trackedFormats
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      isActive: creatorForm.isActive,
      metricsSnapshot: {
        postsAnalyzed: creatorForm.postsAnalyzed,
        avgLikes: creatorForm.avgLikes,
        avgComments: creatorForm.avgComments,
        topFormat: creatorForm.topFormat || "pendiente",
        topHook: creatorForm.topHook || "pendiente"
      }
    });
    setShowCreatorModal(false);
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      competitorProfileId: postForm.competitorProfileId || null,
      redSocial: postForm.redSocial,
      cuenta: postForm.cuenta,
      urlPost: postForm.urlPost,
      fechaPublicacion: new Date(postForm.fechaPublicacion).toISOString(),
      tipoContenido: postForm.tipoContenido,
      duracionVideo: postForm.duracionVideo,
      likes: postForm.likes,
      comentarios: postForm.comentarios,
      shares: postForm.shares,
      views: postForm.views,
      hookTextual: postForm.hookTextual,
      hookVerbal: postForm.hookVerbal,
      hookVisual: postForm.hookVisual,
      tema: postForm.tema,
      provider: postForm.provider,
      raw: { source: "manual_ui" }
    };
    try {
      const response = await fetch("/api/social/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [input] })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || payload.mode !== "supabase") {
        addSocialPostMetric(input);
      }
      await loadSocialMetrics();
    } catch {
      addSocialPostMetric(input);
    }
    setShowPostModal(false);
  }

  function patchCreator(profile: CompetitorProfile, patch: Partial<CompetitorProfile>) {
    updateCompetitorProfile(profile.id, patch);
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Analiza contenido propio y de otros creadores con metricas normalizadas, hooks, formatos y score de viralidad."
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
        <button className="btn-primary" type="button" onClick={() => setShowPostModal(true)}>
          <Plus className="h-4 w-4" />
          Agregar post
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader
            title="Posts analizados"
            description="Columnas base: red, cuenta, URL, fecha, formato, likes, comentarios, shares, views, hooks y score."
          />
          <div className="divide-y divide-ink/10">
            {topPosts.map((post) => (
              <article key={post.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet/10 px-2 py-1 text-xs font-semibold text-violet">
                      {post.redSocial}
                    </span>
                    <span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">
                      {post.formatoDetectado}
                    </span>
                    <span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">
                      {post.categoriaHook}
                    </span>
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
            {!topPosts.length ? (
              <div className="p-6 text-sm text-ink/60">Agrega posts manualmente o importa un CSV para activar el motor.</div>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Sistema de lectura" description="Adaptadores previstos segun los repos analizados, sin complicar la interfaz." />
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
          <PanelHeader
            title="Creadores y fan pages"
            description="Mantiene los links de perfiles que alimentan los benchmarks por pieza."
            action={
              <button className="btn-secondary" type="button" onClick={() => setShowCreatorModal(true)}>
                <Plus className="h-4 w-4" />
                Agregar creador
              </button>
            }
          />
          <div className="divide-y divide-ink/10">
            {visibleProfiles.map((profile) => (
              <article key={profile.id} className="grid gap-3 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{profile.platform}</span>
                      <StatusBadge status={profile.isActive ? "approved" : "draft"} />
                    </div>
                    <input
                      className="input max-w-lg font-semibold"
                      value={profile.name}
                      onChange={(event) => patchCreator(profile, { name: event.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.profileUrl ? (
                      <a className="btn-secondary" href={profile.profileUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </a>
                    ) : null}
                    <select
                      className="select max-w-36"
                      value={profile.isActive ? "true" : "false"}
                      onChange={(event) => patchCreator(profile, { isActive: event.target.value === "true" })}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Pausado</option>
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHeader title="Recomendaciones del motor" description="Insights combinando contenido propio, competidores, modo internet y documentos EREX." />
        <div className="stagger-list grid gap-3 p-4 md:grid-cols-2">
          {state.researchInsights.map((insight) => (
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

      <Modal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        title="Agregar post analizado"
        description="Carga la pieza una vez; el sistema calcula engagement, hook, formato, CTA y score viral."
        size="lg"
      >
        <form className="grid gap-4" onSubmit={submitPost}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Perfil referencia">
              <select
                className="select"
                value={postForm.competitorProfileId}
                onChange={(event) => setPostForm({ ...postForm, competitorProfileId: event.target.value })}
              >
                <option value="">Sin perfil</option>
                {visibleProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Proveedor">
              <select
                className="select"
                value={postForm.provider}
                onChange={(event) => setPostForm({ ...postForm, provider: event.target.value as SocialDataProvider })}
              >
                {providerOptions.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Red social">
              <select
                className="select"
                value={postForm.redSocial}
                onChange={(event) => setPostForm({ ...postForm, redSocial: event.target.value as SocialPlatform })}
              >
                {platformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cuenta">
              <input className="input" value={postForm.cuenta} onChange={(event) => setPostForm({ ...postForm, cuenta: event.target.value })} />
            </Field>
            <Field label="URL post">
              <input className="input" value={postForm.urlPost} onChange={(event) => setPostForm({ ...postForm, urlPost: event.target.value })} />
            </Field>
            <Field label="Fecha publicacion">
              <input
                className="input"
                type="date"
                value={postForm.fechaPublicacion}
                onChange={(event) => setPostForm({ ...postForm, fechaPublicacion: event.target.value })}
              />
            </Field>
            <Field label="Tipo contenido">
              <input
                className="input"
                value={postForm.tipoContenido}
                onChange={(event) => setPostForm({ ...postForm, tipoContenido: event.target.value })}
              />
            </Field>
            <Field label="Duracion video">
              <input
                className="input"
                type="number"
                value={postForm.duracionVideo}
                onChange={(event) => setPostForm({ ...postForm, duracionVideo: Number(event.target.value) })}
              />
            </Field>
            <Field label="Likes">
              <input className="input" type="number" value={postForm.likes} onChange={(event) => setPostForm({ ...postForm, likes: Number(event.target.value) })} />
            </Field>
            <Field label="Comentarios">
              <input
                className="input"
                type="number"
                value={postForm.comentarios}
                onChange={(event) => setPostForm({ ...postForm, comentarios: Number(event.target.value) })}
              />
            </Field>
            <Field label="Shares">
              <input className="input" type="number" value={postForm.shares} onChange={(event) => setPostForm({ ...postForm, shares: Number(event.target.value) })} />
            </Field>
            <Field label="Views">
              <input className="input" type="number" value={postForm.views} onChange={(event) => setPostForm({ ...postForm, views: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="Hook textual">
            <textarea className="textarea" value={postForm.hookTextual} onChange={(event) => setPostForm({ ...postForm, hookTextual: event.target.value })} />
          </Field>
          <Field label="Hook verbal">
            <textarea className="textarea" value={postForm.hookVerbal} onChange={(event) => setPostForm({ ...postForm, hookVerbal: event.target.value })} />
          </Field>
          <Field label="Hook visual">
            <textarea className="textarea" value={postForm.hookVisual} onChange={(event) => setPostForm({ ...postForm, hookVisual: event.target.value })} />
          </Field>
          <Field label="Tema">
            <input className="input" value={postForm.tema} onChange={(event) => setPostForm({ ...postForm, tema: event.target.value })} />
          </Field>
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
        open={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        title="Agregar creador o perfil competidor"
        description="Carga links de perfiles para comparar formatos, hooks, likes, comentarios y CTA."
        size="lg"
      >
        <form className="grid gap-4" onSubmit={submitCreator}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Plataforma">
              <select
                className="select"
                value={creatorForm.platform}
                onChange={(event) => setCreatorForm({ ...creatorForm, platform: event.target.value as SocialPlatform })}
              >
                {platformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nombre">
              <input className="input" value={creatorForm.name} onChange={(event) => setCreatorForm({ ...creatorForm, name: event.target.value })} />
            </Field>
            <Field label="URL">
              <input className="input" value={creatorForm.profileUrl} onChange={(event) => setCreatorForm({ ...creatorForm, profileUrl: event.target.value })} />
            </Field>
            <Field label="Handle">
              <input className="input" value={creatorForm.handle} onChange={(event) => setCreatorForm({ ...creatorForm, handle: event.target.value })} />
            </Field>
            <Field label="Nicho">
              <input className="input" value={creatorForm.niche} onChange={(event) => setCreatorForm({ ...creatorForm, niche: event.target.value })} />
            </Field>
            <Field label="Posts analizados">
              <input
                className="input"
                type="number"
                value={creatorForm.postsAnalyzed}
                onChange={(event) => setCreatorForm({ ...creatorForm, postsAnalyzed: Number(event.target.value) })}
              />
            </Field>
            <Field label="Likes promedio">
              <input
                className="input"
                type="number"
                value={creatorForm.avgLikes}
                onChange={(event) => setCreatorForm({ ...creatorForm, avgLikes: Number(event.target.value) })}
              />
            </Field>
            <Field label="Comentarios promedio">
              <input
                className="input"
                type="number"
                value={creatorForm.avgComments}
                onChange={(event) => setCreatorForm({ ...creatorForm, avgComments: Number(event.target.value) })}
              />
            </Field>
            <Field label="Formato ganador">
              <input className="input" value={creatorForm.topFormat} onChange={(event) => setCreatorForm({ ...creatorForm, topFormat: event.target.value })} />
            </Field>
            <Field label="Hook dominante">
              <input className="input" value={creatorForm.topHook} onChange={(event) => setCreatorForm({ ...creatorForm, topHook: event.target.value })} />
            </Field>
          </div>
          <Field label="Formatos a vigilar">
            <textarea className="textarea" value={creatorForm.trackedFormats} onChange={(event) => setCreatorForm({ ...creatorForm, trackedFormats: event.target.value })} />
          </Field>
          <Field label="Notas">
            <textarea className="textarea" value={creatorForm.notes} onChange={(event) => setCreatorForm({ ...creatorForm, notes: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setShowCreatorModal(false)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit">
              <Plus className="h-4 w-4" />
              Guardar creador
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
