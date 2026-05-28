"use client";

import { FormEvent, useState } from "react";
import { BarChart3, CheckCircle2, ExternalLink, MousePointerClick, Plus, Radar, RefreshCw, Trophy, Users } from "lucide-react";
import { Modal } from "@/components/modal";
import { Field, PageHeader, Panel, PanelHeader, StatCard, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { CompetitorProfile, SocialPlatform } from "@/lib/types";

const platformOptions: SocialPlatform[] = ["facebook", "instagram", "tiktok", "whatsapp"];

export default function AnalyticsPage() {
  const {
    state,
    analytics,
    addCompetitorProfile,
    updateCompetitorProfile,
    runResearchAnalysis
  } = useWorkspace();
  const maxObjectiveScore = Math.max(...analytics.rankedObjectives.map((item) => item.score), 1);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
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

  function patchCreator(profile: CompetitorProfile, patch: Partial<CompetitorProfile>) {
    updateCompetitorProfile(profile.id, patch);
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Mide contenido propio, leads, clics a WhatsApp, perfiles competidores y senales EREX para alimentar el proximo calendario."
      >
        <button className="btn-secondary" type="button" onClick={runResearchAnalysis}>
          <RefreshCw className="h-4 w-4" />
          Analizar contenido
        </button>
        <button className="btn-primary" type="button" onClick={() => setShowCreatorModal(true)}>
          <Plus className="h-4 w-4" />
          Agregar creador
        </button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Alcance total" value={analytics.totalReach} icon={BarChart3} tone="peacock" />
        <StatCard label="Clics WhatsApp" value={analytics.totalClicks} icon={MousePointerClick} tone="moss" />
        <StatCard label="Leads" value={analytics.leadCount} icon={Users} tone="saffron" />
        <StatCard label="Conversion" value={`${analytics.conversion}%`} icon={CheckCircle2} tone="coral" />
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
            title="Creadores y fan pages a vigilar"
            description="Agrega links de perfiles para comparar pieza por pieza: formato, hooks, comentarios, likes y CTA."
          />
          <div className="stagger-list divide-y divide-ink/10">
            {state.competitorProfiles.map((profile) => (
              <article key={profile.id} className="grid gap-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="URL del perfil">
                    <input className="input" value={profile.profileUrl} onChange={(event) => patchCreator(profile, { profileUrl: event.target.value })} />
                  </Field>
                  <Field label="Handle">
                    <input className="input" value={profile.handle} onChange={(event) => patchCreator(profile, { handle: event.target.value })} />
                  </Field>
                  <Field label="Formato ganador">
                    <input
                      className="input"
                      value={profile.metricsSnapshot.topFormat}
                      onChange={(event) =>
                        patchCreator(profile, { metricsSnapshot: { ...profile.metricsSnapshot, topFormat: event.target.value } })
                      }
                    />
                  </Field>
                  <Field label="Hook dominante">
                    <input
                      className="input"
                      value={profile.metricsSnapshot.topHook}
                      onChange={(event) => patchCreator(profile, { metricsSnapshot: { ...profile.metricsSnapshot, topHook: event.target.value } })}
                    />
                  </Field>
                </div>

                <div className="grid gap-3 rounded-2xl border border-ink/10 bg-paper p-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-ink/50">Posts analizados</p>
                    <p className="mt-1 text-lg font-semibold">{profile.metricsSnapshot.postsAnalyzed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50">Likes promedio</p>
                    <p className="mt-1 text-lg font-semibold">{profile.metricsSnapshot.avgLikes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50">Comentarios promedio</p>
                    <p className="mt-1 text-lg font-semibold">{profile.metricsSnapshot.avgComments}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Panel>
          <PanelHeader title="Recomendaciones del motor" description="Insights combinando contenido propio, competidores, modo internet y documentos EREX." />
          <div className="stagger-list grid gap-3 p-4">
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

        <Panel>
          <PanelHeader title="Learning loop" description="Reglas actuales para ajustar la siguiente semana." />
          <div className="grid gap-3 p-4">
            <div className="rounded-3xl border border-ink/10 bg-paper p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-saffron" />
                <p className="font-semibold text-ink">Formato ganador</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Prioriza piezas con CTA a WhatsApp, hooks de comentario y formatos repetibles por fan page.
              </p>
            </div>
            <div className="rounded-3xl border border-ink/10 bg-paper p-4">
              <p className="font-semibold text-ink">Sistema EREX aplicado</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Valida cada idea con simpleza, controversia, referencia viral, camino A-B, realizabilidad y aporte propio.
              </p>
            </div>
            <div className="rounded-3xl border border-ink/10 bg-paper p-4">
              <p className="font-semibold text-ink">Modo internet</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Queda preparado para API de busqueda/scraping permitido. Sin claves, trabaja con links manuales y metricas registradas.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        open={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        title="Agregar creador o perfil competidor"
        description="Carga links de perfiles para que el sistema compare formatos, hooks, likes, comentarios y CTA."
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
              <input className="input" type="number" value={creatorForm.postsAnalyzed} onChange={(event) => setCreatorForm({ ...creatorForm, postsAnalyzed: Number(event.target.value) })} />
            </Field>
            <Field label="Likes promedio">
              <input className="input" type="number" value={creatorForm.avgLikes} onChange={(event) => setCreatorForm({ ...creatorForm, avgLikes: Number(event.target.value) })} />
            </Field>
            <Field label="Comentarios promedio">
              <input className="input" type="number" value={creatorForm.avgComments} onChange={(event) => setCreatorForm({ ...creatorForm, avgComments: Number(event.target.value) })} />
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
