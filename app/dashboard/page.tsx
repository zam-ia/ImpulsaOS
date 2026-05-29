"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck, CheckCircle2, MousePointerClick, Plus, Sparkles, Target, Users } from "lucide-react";
import { Modal } from "@/components/modal";
import { EmptyState, Field, PageHeader, Panel, PanelHeader, StatCard, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import { shortDate } from "@/lib/utils";
import type { Channel, GoalDeadlineMode, GoalType } from "@/lib/types";

const goalTypes: Array<{ value: GoalType; label: string }> = [
  { value: "followers_growth", label: "Crecimiento de seguidores" },
  { value: "lead_generation", label: "Generacion de leads" },
  { value: "course_sales", label: "Venta de curso/diplomado" },
  { value: "brand_positioning", label: "Posicionamiento de marca" },
  { value: "community_engagement", label: "Comunidad / engagement" },
  { value: "audience_reactivation", label: "Reactivacion de audiencia" }
];

const deadlineOptions: Array<{ value: GoalDeadlineMode; label: string; days: number }> = [
  { value: "this_month", label: "Este mes", days: 30 },
  { value: "15_days", label: "15 dias", days: 15 },
  { value: "30_days", label: "30 dias", days: 30 },
  { value: "specific_campaign", label: "Campana especifica", days: 45 }
];

const goalChannels: Channel[] = ["facebook", "instagram_reel", "instagram_post", "tiktok", "whatsapp"];

export default function DashboardPage() {
  const { state, analytics, createGoal, generateGoalContent, updateAssetStatus, renderAsset } = useWorkspace();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    type: "followers_growth" as GoalType,
    name: "",
    targetNumber: 10000,
    currentNumber: 7200,
    deadlineMode: "30_days" as GoalDeadlineMode,
    channels: ["instagram_reel", "facebook", "tiktok"] as Channel[],
    productId: state.products[0]?.id ?? "",
    audience: "Profesionales de salud",
    restrictionsText: "Solo organico\nCon aprobacion obligatoria\nCon flyers automaticos"
  });

  const activeGoal = state.goals.find((goal) => goal.id === state.activeGoalId) ?? state.goals.find((goal) => goal.status === "active") ?? null;
  const activePlan = activeGoal ? state.goalPlans.find((plan) => plan.goalId === activeGoal.id) ?? null : null;
  const goalProgress = activeGoal ? Math.min(100, Math.round((activeGoal.currentNumber / Math.max(activeGoal.targetNumber, 1)) * 100)) : 0;
  const daysRemaining = activeGoal ? Math.max(Math.ceil((new Date(activeGoal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0) : 0;
  const production = useMemo(
    () => ({
      ideas: state.ideas.filter((idea) => !activeGoal || idea.goalId === activeGoal.id).length,
      scripts: state.assets.filter((asset) => (!activeGoal || asset.goalId === activeGoal.id) && asset.script).length,
      flyers: state.assets.filter((asset) => (!activeGoal || asset.goalId === activeGoal.id) && ["design", "visual_prompt"].includes(asset.assetType)).length,
      approved: state.assets.filter((asset) => (!activeGoal || asset.goalId === activeGoal.id) && ["approved", "ready_to_publish", "scheduled", "published"].includes(asset.status)).length,
      recording: state.assets.filter((asset) => (!activeGoal || asset.goalId === activeGoal.id) && asset.status === "pending_recording").length
    }),
    [activeGoal, state.assets, state.ideas]
  );
  const reviewAssets = state.assets.filter((asset) => asset.status === "needs_review").slice(0, 5);
  const upcoming = state.publications
    .filter((publication) => ["needs_review", "approved", "ready_to_publish", "scheduled"].includes(publication.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);
  const hotLeads = state.leads
    .filter((lead) => lead.interestLevel >= 70 && !["won", "lost"].includes(lead.stage))
    .slice(0, 4);

  function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const deadline = deadlineOptions.find((item) => item.value === goalForm.deadlineMode) ?? deadlineOptions[2];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + deadline.days);
    const goalId = createGoal({
      name: goalForm.name || "",
      type: goalForm.type,
      targetNumber: Number(goalForm.targetNumber) || 0,
      currentNumber: Number(goalForm.currentNumber) || 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      deadlineMode: goalForm.deadlineMode,
      channels: goalForm.channels,
      productId: goalForm.productId || null,
      audience: goalForm.audience,
      restrictions: goalForm.restrictionsText.split(/\n|,/).map((item) => item.trim()).filter(Boolean)
    });
    setShowGoalModal(false);
    setTimeout(() => generateGoalContent(goalId), 0);
  }

  return (
    <>
      <PageHeader
        title="Panel operativo"
        description="El sistema empieza por una meta activa. Desde ahi genera ideas, guiones, copies, flyers, programacion y metricas."
      >
        <button className="btn-secondary" onClick={() => setShowGoalModal(true)}>
          <Plus className="h-4 w-4" />
          Crear meta
        </button>
        <button className="btn-primary" onClick={() => (activeGoal ? generateGoalContent(activeGoal.id) : setShowGoalModal(true))}>
          <Sparkles className="h-4 w-4" />
          Generar contenido
        </button>
      </PageHeader>

      <Panel className="mb-6 overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet/10 text-violet">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink/60">Meta activa</p>
                <h3 className="text-xl font-semibold text-ink">{activeGoal?.name ?? "Crea una meta para iniciar el motor"}</h3>
              </div>
            </div>
            {activeGoal ? (
              <>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-paper">
                  <div className="h-full bg-moss" style={{ width: `${goalProgress}%` }} />
                </div>
                <div className="mt-3 grid gap-3 text-sm text-ink/65 sm:grid-cols-3">
                  <span>Avance: <strong className="text-ink">{goalProgress}%</strong></span>
                  <span>Faltan: <strong className="text-ink">{Math.max(activeGoal.targetNumber - activeGoal.currentNumber, 0).toLocaleString("es-PE")}</strong></span>
                  <span>Dias restantes: <strong className="text-ink">{daysRemaining}</strong></span>
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/70">{activePlan?.recommendedStrategy ?? activeGoal.mainStrategy}</p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink/65">
                Define la meta comercial o de crecimiento. Si una pieza no aporta a la meta activa, no se genera, no se aprueba y no se publica.
              </p>
            )}
          </div>
          <div className="grid gap-3 border-t border-ink/10 bg-paper p-5 sm:grid-cols-2 lg:border-l lg:border-t-0">
            <Metric label="Ideas generadas" value={production.ideas} />
            <Metric label="Guiones listos" value={production.scripts} />
            <Metric label="Flyers listos" value={production.flyers} />
            <Metric label="Videos por grabar" value={production.recording} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Piezas en revision" value={analytics.review} icon={AlertTriangle} tone="saffron" />
        <StatCard label="Publicaciones programadas" value={analytics.scheduled} icon={CalendarCheck} tone="peacock" />
        <StatCard label="Leads calientes" value={analytics.hotLeadCount} icon={Users} tone="coral" />
        <StatCard label="Clics a WhatsApp" value={analytics.totalClicks} icon={MousePointerClick} tone="moss" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel>
          <PanelHeader
            title="Bandeja de revision"
            description="Aprobar activa acciones: render, programacion, tarea de publicacion o cola de grabacion."
            action={
              <Link href="/content" className="btn-secondary">
                Ver contenido
              </Link>
            }
          />
          {reviewAssets.length === 0 ? (
            <EmptyState title="No hay piezas pendientes" description="Crea una meta y genera contenido para llenar esta bandeja." />
          ) : (
            <div className="stagger-list divide-y divide-ink/10">
              {reviewAssets.map((asset) => {
                const idea = state.ideas.find((item) => item.id === asset.ideaId);
                return (
                  <article key={asset.id} className="p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={asset.status} />
                          <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">QA {asset.qa.score}/100</span>
                          <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{asset.channel.replaceAll("_", " ")}</span>
                        </div>
                        <h3 className="font-semibold text-ink">{asset.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink/65">{idea?.hook}</p>
                        {asset.qa.blockers.length > 0 ? <p className="mt-2 text-sm font-medium text-coral">{asset.qa.blockers.join(" ")}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary" onClick={() => renderAsset(asset.id)}>Render</button>
                        <button className="btn-secondary" onClick={() => updateAssetStatus(asset.id, "rejected")}>Rechazar</button>
                        <button className="btn-primary" onClick={() => updateAssetStatus(asset.id, "approved")}>
                          <CheckCircle2 className="h-4 w-4" />
                          Aprobar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Proximas publicaciones" description="Orden sugerido de ejecucion." />
            {upcoming.length === 0 ? (
              <EmptyState title="Sin calendario activo" description="Genera contenido desde una meta para crear la cola editorial." />
            ) : (
              <div className="stagger-list divide-y divide-ink/10">
                {upcoming.map((publication) => {
                  const asset = state.assets.find((item) => item.id === publication.assetId);
                  return (
                    <div key={publication.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{shortDate(publication.scheduledAt)}</p>
                        <StatusBadge status={publication.status} />
                      </div>
                      <p className="mt-2 text-sm leading-5 text-ink/65">{asset?.title ?? "Asset sin titulo"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Alertas" description="Bloqueos y tareas que frenan la meta." />
            <div className="grid gap-3 p-4">
              <AlertLine label="Piezas requieren aprobacion" value={reviewAssets.length} />
              <AlertLine label="Videos esperan grabacion" value={production.recording} />
              <AlertLine label="Piezas aprobadas" value={production.approved} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Leads calientes" description="Conversaciones que conviene atender primero." />
            {hotLeads.length === 0 ? (
              <EmptyState title="Sin leads calientes" description="Los clics trackeados y leads manuales apareceran aqui." />
            ) : (
              <div className="stagger-list divide-y divide-ink/10">
                {hotLeads.map((lead) => (
                  <Link key={lead.id} href="/leads" className="pressable block rounded-md p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{lead.name || "Lead sin nombre"}</p>
                      <span className="text-sm font-semibold text-coral">{lead.interestLevel}%</span>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">{lead.interest}</p>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} title="Crear meta estrategica" description="Todo el contenido, calendario y analisis saldra de esta meta activa." size="xl">
        <form className="grid gap-4" onSubmit={submitGoal}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tipo de objetivo">
              <select className="select" value={goalForm.type} onChange={(event) => setGoalForm({ ...goalForm, type: event.target.value as GoalType })}>
                {goalTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Nombre de meta">
              <input className="input" value={goalForm.name} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })} placeholder="Llegar a 10k seguidores" />
            </Field>
            <Field label="Meta cuantitativa">
              <input className="input" type="number" value={goalForm.targetNumber} onChange={(event) => setGoalForm({ ...goalForm, targetNumber: Number(event.target.value) })} />
            </Field>
            <Field label="Punto de partida">
              <input className="input" type="number" value={goalForm.currentNumber} onChange={(event) => setGoalForm({ ...goalForm, currentNumber: Number(event.target.value) })} />
            </Field>
            <Field label="Fecha limite">
              <select className="select" value={goalForm.deadlineMode} onChange={(event) => setGoalForm({ ...goalForm, deadlineMode: event.target.value as GoalDeadlineMode })}>
                {deadlineOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Oferta o producto">
              <select className="select" value={goalForm.productId} onChange={(event) => setGoalForm({ ...goalForm, productId: event.target.value })}>
                <option value="">Marca general</option>
                {state.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Canales">
            <div className="flex flex-wrap gap-2">
              {goalChannels.map((channel) => (
                <label key={channel} className="inline-flex items-center gap-2 rounded-2xl border border-ink/10 bg-paper px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={goalForm.channels.includes(channel)}
                    onChange={(event) => setGoalForm({
                      ...goalForm,
                      channels: event.target.checked ? [...goalForm.channels, channel] : goalForm.channels.filter((item) => item !== channel)
                    })}
                  />
                  {channel.replaceAll("_", " ")}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Publico objetivo">
            <input className="input" value={goalForm.audience} onChange={(event) => setGoalForm({ ...goalForm, audience: event.target.value })} />
          </Field>
          <Field label="Restricciones" hint="Una por linea: sin pauta, solo organico, con aprobacion obligatoria, etc.">
            <textarea className="textarea" value={goalForm.restrictionsText} onChange={(event) => setGoalForm({ ...goalForm, restrictionsText: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" type="button" onClick={() => setShowGoalModal(false)}>Cancelar</button>
            <button className="btn-primary" type="submit">
              <Sparkles className="h-4 w-4" />
              Crear meta y generar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function AlertLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-paper px-3 py-2 text-sm">
      <span className="text-ink/65">{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}
