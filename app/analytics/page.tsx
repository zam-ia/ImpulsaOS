"use client";

import { BarChart3, CheckCircle2, MousePointerClick, Trophy, Users } from "lucide-react";
import { PageHeader, Panel, PanelHeader, StatCard } from "@/components/ui";
import { useWorkspace } from "@/lib/store";

export default function AnalyticsPage() {
  const { state, analytics } = useWorkspace();
  const maxObjectiveScore = Math.max(...analytics.rankedObjectives.map((item) => item.score), 1);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Mide contenido, leads, clics a WhatsApp, publicaciones y señales para retroalimentar el próximo calendario."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Alcance total" value={analytics.totalReach} icon={BarChart3} tone="peacock" />
        <StatCard label="Clics WhatsApp" value={analytics.totalClicks} icon={MousePointerClick} tone="moss" />
        <StatCard label="Leads" value={analytics.leadCount} icon={Users} tone="saffron" />
        <StatCard label="Conversión" value={`${analytics.conversion}%`} icon={CheckCircle2} tone="coral" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Objetivos con mejor score" description="Promedio de score viral/estratégico por objetivo." />
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
          <PanelHeader title="Learning loop" description="Señales simples para ajustar la siguiente semana." />
          <div className="grid gap-3 p-4">
            <div className="rounded-md border border-ink/10 bg-paper p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-saffron" />
                <p className="font-semibold text-ink">Formato ganador</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {state.publications.length > 0
                  ? "Prioriza piezas con CTA a WhatsApp y reutiliza hooks con mayor score."
                  : "Genera y publica al menos una semana para empezar a detectar patrones."}
              </p>
            </div>
            <div className="rounded-md border border-ink/10 bg-paper p-4">
              <p className="font-semibold text-ink">Recomendación de control</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Mantén aprobación humana para piezas con QA menor a 78, precios mencionados o claims comerciales sensibles.
              </p>
            </div>
            <div className="rounded-md border border-ink/10 bg-paper p-4">
              <p className="font-semibold text-ink">Uso de modo gratuito</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Usa plantillas locales para diseño, fallback manual para Meta y WhatsApp Business App para cierre hasta validar volumen.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
