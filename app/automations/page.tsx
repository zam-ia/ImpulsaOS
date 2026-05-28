"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  MessageCircle,
  PlayCircle,
  Plus,
  RadioTower,
  Save,
  ShieldAlert,
  Sparkles,
  Workflow
} from "lucide-react";
import { WhatsappPreview } from "@/components/whatsapp-preview";
import { EmptyState, Field, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { useWorkspace } from "@/lib/store";
import type { BotScenario, Channel, OrganicCaptureCampaign } from "@/lib/types";
import { cleanList, shortDate } from "@/lib/utils";

const channelOptions: Array<{ value: Channel; label: string }> = [
  { value: "instagram_post", label: "Instagram feed" },
  { value: "instagram_reel", label: "Instagram reel" },
  { value: "instagram_story", label: "Instagram story" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" }
];

const nextActions: Array<{ value: BotScenario["nextAction"]; label: string }> = [
  { value: "suggest_reply", label: "Sugerir respuesta" },
  { value: "create_lead", label: "Crear lead" },
  { value: "send_whatsapp_link", label: "Enviar link WhatsApp" },
  { value: "escalate_human", label: "Escalar a humano" }
];

function scenarioMatch(message: string, scenario: BotScenario) {
  const lower = message.toLowerCase();
  return scenario.triggerPhrases.some((phrase) => lower.includes(phrase.toLowerCase()));
}

function localBotPreview(campaign: OrganicCaptureCampaign, message: string) {
  const active = campaign.scenarios.filter((scenario) => scenario.isActive);
  const matched = active.find((scenario) => scenarioMatch(message, scenario)) ?? active[0];
  const reply = matched?.possibleReplies[0] ?? "Gracias por escribirme. Te hago una pregunta rapida para orientarte mejor.";

  return {
    scenario: matched,
    reply,
    questions: matched?.qualificationQuestions ?? [],
    shouldEscalate: matched?.riskLevel === "high" || matched?.nextAction === "escalate_human"
  };
}

export default function AutomationsPage() {
  const {
    state,
    analytics,
    generateWeek,
    runAutomation,
    runResearchAnalysis,
    updateCaptureCampaign,
    addBotScenario,
    updateBotScenario
  } = useWorkspace();
  const campaign = state.captureCampaigns[0];
  const [testMessage, setTestMessage] = useState("Hola, quiero saber precio y si esto me garantiza ventas");
  const [apiResult, setApiResult] = useState<string>("");
  const [isRunningApi, setIsRunningApi] = useState(false);
  const preview = useMemo(() => localBotPreview(campaign, testMessage), [campaign, testMessage]);
  const activeConnections = state.connections.filter((connection) => connection.isActive);
  const apiReady = Boolean(campaign.aiConfig.apiKeyEnvName && campaign.aiConfig.provider !== "none");
  const campaignProduct = state.products.find((product) => product.id === campaign.productId);

  function updateCampaign(patch: Partial<OrganicCaptureCampaign>) {
    updateCaptureCampaign(campaign.id, patch);
  }

  function toggleChannel(channel: Channel) {
    const exists = campaign.channels.includes(channel);
    updateCampaign({
      channels: exists ? campaign.channels.filter((item) => item !== channel) : [...campaign.channels, channel]
    });
  }

  function toggleTargetConnection(connectionId: string) {
    const selected = campaign.targetConnectionIds ?? [];
    const exists = selected.includes(connectionId);
    updateCampaign({
      targetConnectionIds: exists ? selected.filter((item) => item !== connectionId) : [...selected, connectionId]
    });
  }

  function toggleCompetitorProfile(profileId: string) {
    const selected = campaign.competitorProfileIds ?? [];
    const exists = selected.includes(profileId);
    updateCampaign({
      competitorProfileIds: exists ? selected.filter((item) => item !== profileId) : [...selected, profileId]
    });
  }

  async function testApiBot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunningApi(true);
    setApiResult("");
    try {
      const response = await fetch("/api/automation/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          incomingMessage: testMessage,
          useApi: campaign.aiConfig.mode !== "manual"
        })
      });
      const result = await response.json();
      setApiResult(JSON.stringify(result, null, 2));
    } finally {
      setIsRunningApi(false);
    }
  }

  return (
    <>
      <PageHeader
        title={state.settings.moduleLabels.automations}
        description="Configura la automatizacion completa: contenido semanal, canales, IA por API, modo BOT, casos hipoteticos, respuestas posibles, calificacion de leads y handoff a WhatsApp."
      >
        <button className="btn-primary" onClick={generateWeek}>
          <Sparkles className="h-4 w-4" />
          Generar contenido
        </button>
      </PageHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-moss/12 text-moss">
              <Workflow className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-ink/60">Estado</p>
              <p className="mt-1 text-xl font-semibold">{campaign.status}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-peacock/12 text-peacock">
              <BrainCircuit className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-ink/60">IA</p>
              <p className="mt-1 text-xl font-semibold">{campaign.aiConfig.mode}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-saffron/25 text-ink">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-ink/60">Modo bot</p>
              <p className="mt-1 text-xl font-semibold">{campaign.botMode}</p>
            </div>
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral/12 text-coral">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-ink/60">Leads</p>
              <p className="mt-1 text-xl font-semibold">{analytics.leadCount}</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Campana de captacion" description="Define que producto empuja, en que canales y con que CTA se captan leads." />
            <div className="grid gap-4 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre">
                  <input className="input" value={campaign.name} onChange={(event) => updateCampaign({ name: event.target.value })} />
                </Field>
                <Field label="Producto">
                  <select
                    className="select"
                    value={campaign.productId ?? ""}
                    onChange={(event) => updateCampaign({ productId: event.target.value || null })}
                  >
                    {state.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Objetivo">
                  <select
                    className="select"
                    value={campaign.objective}
                    onChange={(event) => updateCampaign({ objective: event.target.value as OrganicCaptureCampaign["objective"] })}
                  >
                    <option value="captar_leads">Captar leads</option>
                    <option value="agendar">Agendar</option>
                    <option value="vender">Vender</option>
                    <option value="nutrir">Nutrir</option>
                  </select>
                </Field>
                <Field label="Cadencia">
                  <select
                    className="select"
                    value={campaign.cadence}
                    onChange={(event) => updateCampaign({ cadence: event.target.value as OrganicCaptureCampaign["cadence"] })}
                  >
                    <option value="weekly">Semanal</option>
                    <option value="daily">Diaria</option>
                    <option value="manual">Manual</option>
                  </select>
                </Field>
              </div>

              <Field label="Canales activos">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {channelOptions.map((option) => {
                    const active = campaign.channels.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`pressable rounded-2xl border px-3 py-2 text-left text-sm font-semibold ${
                          active ? "border-moss bg-moss/10 text-moss" : "border-ink/10 bg-paper text-ink/65"
                        }`}
                        onClick={() => toggleChannel(option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Paginas o cuentas que trabajara esta automatizacion">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {state.connections
                    .filter((connection) => connection.platform !== "whatsapp")
                    .map((connection) => {
                      const active = (campaign.targetConnectionIds ?? []).includes(connection.id);
                      return (
                        <button
                          key={connection.id}
                          type="button"
                          className={`pressable rounded-2xl border px-3 py-2 text-left text-sm font-semibold ${
                            active ? "border-peacock bg-peacock/10 text-peacock" : "border-ink/10 bg-paper text-ink/65"
                          }`}
                          onClick={() => toggleTargetConnection(connection.id)}
                        >
                          <span className="block">{connection.label}</span>
                          <span className="mt-1 block text-xs font-medium opacity-70">{connection.pageSlot ?? connection.platform}</span>
                        </button>
                      );
                    })}
                </div>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Modo investigacion">
                  <select
                    className="select"
                    value={campaign.researchMode ?? "manual_links"}
                    onChange={(event) => updateCampaign({ researchMode: event.target.value as OrganicCaptureCampaign["researchMode"] })}
                  >
                    <option value="off">Apagado</option>
                    <option value="manual_links">Links manuales de creadores</option>
                    <option value="internet_watch">Internet watch por API</option>
                  </select>
                </Field>
                <Field label="Perfiles competidores a vigilar">
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-paper p-2">
                    {state.competitorProfiles.map((profile) => {
                      const active = (campaign.competitorProfileIds ?? []).includes(profile.id);
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? "bg-violet text-white" : "bg-[var(--color-surface)] text-ink/65"}`}
                          onClick={() => toggleCompetitorProfile(profile.id)}
                        >
                          {profile.name}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Lead magnet">
                  <textarea className="textarea" value={campaign.leadMagnet} onChange={(event) => updateCampaign({ leadMagnet: event.target.value })} />
                </Field>
                <Field label="Palabra clave">
                  <input className="input" value={campaign.trackedKeyword} onChange={(event) => updateCampaign({ trackedKeyword: event.target.value })} />
                </Field>
                <Field label="CTA WhatsApp">
                  <textarea className="textarea" value={campaign.whatsappCta} onChange={(event) => updateCampaign({ whatsappCta: event.target.value })} />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Integracion IA por API" description="Puedes usar una API real o dejar el motor en modo manual/hibrido con escenarios configurados." />
            <div className="grid gap-4 p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Modo IA">
                  <select
                    className="select"
                    value={campaign.aiConfig.mode}
                    onChange={(event) =>
                      updateCampaign({
                        aiConfig: { ...campaign.aiConfig, mode: event.target.value as OrganicCaptureCampaign["aiConfig"]["mode"] }
                      })
                    }
                  >
                    <option value="manual">Solo casos hipoteticos</option>
                    <option value="api">API IA</option>
                    <option value="hybrid">Hibrido con fallback</option>
                  </select>
                </Field>
                <Field label="Proveedor">
                  <select
                    className="select"
                    value={campaign.aiConfig.provider}
                    onChange={(event) =>
                      updateCampaign({
                        aiConfig: { ...campaign.aiConfig, provider: event.target.value as OrganicCaptureCampaign["aiConfig"]["provider"] }
                      })
                    }
                  >
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom</option>
                    <option value="none">Ninguno</option>
                  </select>
                </Field>
                <Field label="Modelo">
                  <input
                    className="input"
                    value={campaign.aiConfig.model}
                    onChange={(event) => updateCampaign({ aiConfig: { ...campaign.aiConfig, model: event.target.value } })}
                  />
                </Field>
                <Field label="Variable API key">
                  <input
                    className="input"
                    value={campaign.aiConfig.apiKeyEnvName}
                    onChange={(event) => updateCampaign({ aiConfig: { ...campaign.aiConfig, apiKeyEnvName: event.target.value } })}
                  />
                </Field>
                <Field label="Limite diario">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={campaign.aiConfig.dailyLimit}
                    onChange={(event) => updateCampaign({ aiConfig: { ...campaign.aiConfig, dailyLimit: Number(event.target.value) } })}
                  />
                </Field>
                <Field label="Temperatura">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={campaign.aiConfig.temperature}
                    onChange={(event) => updateCampaign({ aiConfig: { ...campaign.aiConfig, temperature: Number(event.target.value) } })}
                  />
                </Field>
              </div>
              <Field label="Prompt del sistema">
                <textarea
                  className="textarea"
                  value={campaign.aiConfig.systemPrompt}
                  onChange={(event) => updateCampaign({ aiConfig: { ...campaign.aiConfig, systemPrompt: event.target.value } })}
                />
              </Field>
              <div className="rounded-2xl border border-ink/10 bg-paper p-3 text-sm leading-6 text-ink/65">
                {apiReady ? (
                  <span>Para activar API real, coloca `{campaign.aiConfig.apiKeyEnvName}` en `.env.local`. Si falla, el modo hibrido usa escenarios.</span>
                ) : (
                  <span>Modo sin API: el bot usa solo casos hipoteticos y respuestas posibles configuradas abajo.</span>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Casos hipoteticos y respuestas posibles"
              description="Define intenciones, frases disparadoras, respuestas y cuando escalar a humano."
              action={
                <button className="btn-secondary" onClick={() => addBotScenario(campaign.id)}>
                  <Plus className="h-4 w-4" />
                  Agregar caso
                </button>
              }
            />
            <div className="stagger-list divide-y divide-ink/10">
              {campaign.scenarios.map((scenario) => (
                <article key={scenario.id} className="grid gap-4 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">{scenario.intent}</span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            scenario.riskLevel === "high"
                              ? "bg-coral/12 text-coral"
                              : scenario.riskLevel === "medium"
                                ? "bg-saffron/25 text-ink"
                                : "bg-moss/10 text-moss"
                          }`}
                        >
                          {scenario.riskLevel}
                        </span>
                      </div>
                      <input
                        className="input max-w-xl font-semibold"
                        value={scenario.name}
                        onChange={(event) => updateBotScenario(campaign.id, scenario.id, { name: event.target.value })}
                      />
                    </div>
                    <select
                      className="select max-w-52"
                      value={scenario.isActive ? "true" : "false"}
                      onChange={(event) => updateBotScenario(campaign.id, scenario.id, { isActive: event.target.value === "true" })}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Pausado</option>
                    </select>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Field label="Frases que activan el caso">
                      <textarea
                        className="textarea"
                        value={scenario.triggerPhrases.join("\n")}
                        onChange={(event) => updateBotScenario(campaign.id, scenario.id, { triggerPhrases: cleanList(event.target.value) })}
                      />
                    </Field>
                    <Field label="Respuestas posibles">
                      <textarea
                        className="textarea"
                        value={scenario.possibleReplies.join("\n")}
                        onChange={(event) => updateBotScenario(campaign.id, scenario.id, { possibleReplies: cleanList(event.target.value) })}
                      />
                    </Field>
                    <Field label="Preguntas de calificacion">
                      <textarea
                        className="textarea"
                        value={scenario.qualificationQuestions.join("\n")}
                        onChange={(event) =>
                          updateBotScenario(campaign.id, scenario.id, { qualificationQuestions: cleanList(event.target.value) })
                        }
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Siguiente accion">
                        <select
                          className="select"
                          value={scenario.nextAction}
                          onChange={(event) =>
                            updateBotScenario(campaign.id, scenario.id, { nextAction: event.target.value as BotScenario["nextAction"] })
                          }
                        >
                          {nextActions.map((action) => (
                            <option key={action.value} value={action.value}>
                              {action.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Riesgo">
                        <select
                          className="select"
                          value={scenario.riskLevel}
                          onChange={(event) =>
                            updateBotScenario(campaign.id, scenario.id, { riskLevel: event.target.value as BotScenario["riskLevel"] })
                          }
                        >
                          <option value="low">Bajo</option>
                          <option value="medium">Medio</option>
                          <option value="high">Alto</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Modo BOT" description="Controla si solo sugiere, responde como bot o queda apagado." />
            <div className="grid gap-4 p-4">
              <Field label="Modo">
                <select
                  className="select"
                  value={campaign.botMode}
                  onChange={(event) => updateCampaign({ botMode: event.target.value as OrganicCaptureCampaign["botMode"] })}
                >
                  <option value="off">Apagado</option>
                  <option value="assist">Asistido: sugiere respuesta</option>
                  <option value="bot">BOT: responde si el caso es seguro</option>
                </select>
              </Field>
              <div className="rounded-2xl border border-ink/10 bg-paper p-3 text-sm leading-6 text-ink/65">
                En modo BOT, los casos de riesgo alto siempre se escalan. WhatsApp sigue siendo handoff seguro; no se envia spam ni mensajes masivos.
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Bucle autonomo de captacion" description="El motor une paginas, contenido, metricas, competidores y recomendaciones." />
            <div className="grid gap-3 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-ink/10 bg-paper p-3">
                  <p className="text-xs text-ink/50">Paginas destino</p>
                  <p className="mt-1 text-xl font-semibold">{campaign.targetConnectionIds?.length ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper p-3">
                  <p className="text-xs text-ink/50">Creadores vigilados</p>
                  <p className="mt-1 text-xl font-semibold">{campaign.competitorProfileIds?.length ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-paper p-3">
                  <p className="text-xs text-ink/50">Insights</p>
                  <p className="mt-1 text-xl font-semibold">{state.researchInsights.length}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-paper p-3 text-sm leading-6 text-ink/65">
                Publica por API si el token esta configurado; si no, deja checklist manual. Despues mide alcance, clics y comentarios, compara contra creadores y devuelve recomendaciones al calendario.
              </div>
              <button className="btn-secondary" type="button" onClick={runResearchAnalysis}>
                <BrainCircuit className="h-4 w-4" />
                Ejecutar analisis competitivo
              </button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Vista conversacion" description="Simula como fluye el chat antes de activar el bot." />
            <form className="grid gap-4 p-4" onSubmit={testApiBot}>
              <Field label="Mensaje entrante">
                <textarea className="textarea" value={testMessage} onChange={(event) => setTestMessage(event.target.value)} />
              </Field>
              <WhatsappPreview
                businessName={state.business.name}
                phone={state.business.whatsappPhone}
                leadMessage={testMessage}
                reply={preview.reply}
                questions={preview.questions}
                status={preview.shouldEscalate ? "Escalar a humano" : campaign.botMode}
                attachmentTitle={campaignProduct ? `Oferta: ${campaignProduct.name}` : campaign.leadMagnet}
              />
              <div className="rounded-2xl border border-ink/10 bg-paper p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Preview local</p>
                  {preview.shouldEscalate ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-coral/12 px-2 py-1 text-xs font-semibold text-coral">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Escalar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2 py-1 text-xs font-semibold text-moss">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Seguro
                    </span>
                  )}
                </div>
                <p className="text-sm leading-6 text-ink/75">{preview.reply}</p>
                {preview.questions.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-normal text-ink/45">Preguntas</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/65">
                      {preview.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <button className="btn-secondary" type="submit" disabled={isRunningApi}>
                <FlaskConical className="h-4 w-4" />
                {isRunningApi ? "Probando..." : "Probar endpoint BOT"}
              </button>
              {apiResult ? (
                <pre className="max-h-72 overflow-auto rounded-2xl border border-ink/10 bg-paper p-3 text-xs leading-5 text-ink">{apiResult}</pre>
              ) : null}
            </form>
          </Panel>

          <Panel>
            <PanelHeader title="Ejecucion" description="Dispara flujo y revisa logs." />
            <div className="grid gap-3 p-4">
              {state.flows.map((flow) => (
                <button key={flow.id} className="btn-primary justify-between" onClick={() => runAutomation(flow.id)}>
                  <span className="inline-flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {flow.name}
                  </span>
                  <span className="text-xs opacity-80">{flow.triggerType}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Canales conectados" description="El motor usa estos estados para decidir API o checklist." />
            <div className="divide-y divide-ink/10 p-4">
              {activeConnections.length === 0 ? (
                <EmptyState title="Sin canales activos" description="Activa canales en Conexiones para que el motor pueda usarlos." />
              ) : (
                activeConnections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <RadioTower className="h-4 w-4 text-moss" />
                      <div>
                        <p className="text-sm font-semibold">{connection.label}</p>
                        <p className="text-xs text-ink/55">{connection.publishMode}</p>
                      </div>
                    </div>
                    <StatusBadge status={connection.tokenStatus === "configured" ? "approved" : "needs_review"} />
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Runs y logs" description="Trazabilidad basica de ejecuciones." />
            {state.runs.length === 0 ? (
              <EmptyState title="Sin ejecuciones" description="Ejecuta un workflow para ver logs aqui." />
            ) : (
              <div className="stagger-list divide-y divide-ink/10">
                {state.runs.map((run) => {
                  const flow = state.flows.find((item) => item.id === run.flowId);
                  return (
                    <article key={run.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{flow?.name ?? "Workflow"}</p>
                          <p className="mt-1 text-sm text-ink/55">{shortDate(run.startedAt)}</p>
                        </div>
                        <StatusBadge status={run.status === "success" ? "published" : run.status === "blocked" ? "failed" : "scheduled"} />
                      </div>
                      <ul className="mt-3 space-y-1 rounded-2xl bg-paper p-3 text-sm leading-6 text-ink/65">
                        {run.log.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
