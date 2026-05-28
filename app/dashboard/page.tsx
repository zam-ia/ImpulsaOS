"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, CheckCircle2, MousePointerClick, Sparkles, Users } from "lucide-react";
import { EmptyState, PageHeader, Panel, PanelHeader, StatCard, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import { shortDate } from "@/lib/utils";

export default function DashboardPage() {
  const { state, analytics, generateWeek, updateAssetStatus, renderAsset } = useWorkspace();
  const reviewAssets = state.assets.filter((asset) => asset.status === "needs_review").slice(0, 5);
  const upcoming = state.publications
    .filter((publication) => ["needs_review", "approved", "scheduled"].includes(publication.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);
  const hotLeads = state.leads
    .filter((lead) => lead.interestLevel >= 70 && !["won", "lost"].includes(lead.stage))
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title="Panel operativo"
        description="Vista diaria para revisar piezas, aprobar calendario, detectar leads calientes y mantener el motor funcionando con aprobación humana."
      >
        <button className="btn-primary" onClick={generateWeek}>
          <Sparkles className="h-4 w-4" />
          Generar semana de contenido
        </button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Piezas en revisión" value={analytics.review} icon={AlertTriangle} tone="saffron" />
        <StatCard label="Publicaciones programadas" value={analytics.scheduled} icon={CalendarCheck} tone="peacock" />
        <StatCard label="Leads calientes" value={analytics.hotLeadCount} icon={Users} tone="coral" />
        <StatCard label="Clics a WhatsApp" value={analytics.totalClicks} icon={MousePointerClick} tone="moss" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel>
          <PanelHeader
            title="Bandeja de revisión"
            description="Aprueba, rechaza o renderiza piezas antes de publicar."
            action={
              <Link href="/content" className="btn-secondary">
                Ver contenido
              </Link>
            }
          />
          {reviewAssets.length === 0 ? (
            <EmptyState
              title="No hay piezas pendientes"
              description="Genera una semana de contenido o crea una campaña para llenar esta bandeja."
            />
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
                          <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">
                            QA {asset.qa.score}/100
                          </span>
                          <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">
                            {asset.channel.replaceAll("_", " ")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-ink">{asset.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink/65">{idea?.hook}</p>
                        {asset.qa.blockers.length > 0 ? (
                          <p className="mt-2 text-sm font-medium text-coral">{asset.qa.blockers.join(" ")}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary" onClick={() => renderAsset(asset.id)}>
                          Render
                        </button>
                        <button className="btn-secondary" onClick={() => updateAssetStatus(asset.id, "rejected")}>
                          Rechazar
                        </button>
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
            <PanelHeader title="Próximas publicaciones" description="Orden sugerido de ejecución." />
            {upcoming.length === 0 ? (
              <EmptyState title="Sin calendario activo" description="Genera una semana para crear la cola editorial." />
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
                      <p className="mt-2 text-sm leading-5 text-ink/65">{asset?.title ?? "Asset sin título"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Leads calientes" description="Conversaciones que conviene atender primero." />
            {hotLeads.length === 0 ? (
              <EmptyState title="Sin leads calientes" description="Los clics trackeados y leads manuales aparecerán aquí." />
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
    </>
  );
}
