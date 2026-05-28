import { generateWeeklyPlan } from "@/lib/ai";
import { initialWorkspace } from "@/lib/seed";
import type { BotScenario, OrganicCaptureCampaign, WorkspaceState } from "@/lib/types";
import type { BotReplyInput, CaptureRunInput } from "@/lib/validators/automation.schemas";

function findCampaign(workspace: WorkspaceState, campaignId: string): OrganicCaptureCampaign {
  return workspace.captureCampaigns.find((campaign) => campaign.id === campaignId) ?? workspace.captureCampaigns[0];
}

function scoreScenario(message: string, scenario: BotScenario): number {
  const lower = message.toLowerCase();
  return scenario.triggerPhrases.reduce((score, phrase) => {
    return lower.includes(phrase.toLowerCase()) ? score + 1 : score;
  }, 0);
}

function selectReply(scenario: BotScenario, message: string): string {
  const index = Math.abs(message.length + scenario.intent.length) % Math.max(1, scenario.possibleReplies.length);
  return scenario.possibleReplies[index] ?? "Gracias por escribirme. Te respondo con mas detalle por WhatsApp.";
}

function riskPriority(risk: BotScenario["riskLevel"]): number {
  if (risk === "high") return 3;
  if (risk === "medium") return 2;
  return 1;
}

type AiReply = {
  reply?: string;
  nextAction?: string;
  riskLevel?: string;
  qualificationQuestions?: string[];
};

async function callAiForReply(campaign: OrganicCaptureCampaign, input: BotReplyInput): Promise<AiReply | null> {
  const canUseGemini = campaign.aiConfig.provider === "gemini" && process.env[campaign.aiConfig.apiKeyEnvName];
  if (!canUseGemini) return null;

  const apiKey = process.env[campaign.aiConfig.apiKeyEnvName];
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${campaign.aiConfig.model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${campaign.aiConfig.systemPrompt}\n\nMensaje del lead: ${input.incomingMessage}\nDevuelve JSON con reply, nextAction, riskLevel y qualificationQuestions.`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: campaign.aiConfig.temperature,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text) as AiReply;
  } catch {
    return { reply: text };
  }
}

export async function suggestBotReply(input: BotReplyInput, workspace: WorkspaceState = initialWorkspace) {
  const campaign = findCampaign(workspace, input.campaignId);
  const apiAllowed = input.useApi ?? campaign.aiConfig.mode !== "manual";

  if (apiAllowed && campaign.aiConfig.mode !== "manual") {
    const aiReply = await callAiForReply(campaign, input);
    if (aiReply?.reply) {
      return {
        mode: "api",
        campaignId: campaign.id,
        matchedScenario: null,
        reply: aiReply.reply,
        nextAction: aiReply.nextAction ?? "suggest_reply",
        riskLevel: aiReply.riskLevel ?? "medium",
        qualificationQuestions: aiReply.qualificationQuestions ?? [],
        shouldEscalate: aiReply.riskLevel === "high"
      };
    }
  }

  const activeScenarios = campaign.scenarios.filter((scenario) => scenario.isActive);
  const best = activeScenarios
    .map((scenario) => ({ scenario, score: scoreScenario(input.incomingMessage, scenario) }))
    .sort((a, b) => b.score - a.score || riskPriority(b.scenario.riskLevel) - riskPriority(a.scenario.riskLevel))[0];
  const scenario = best?.score > 0 ? best.scenario : activeScenarios[0];

  return {
    mode: "manual_scenarios",
    campaignId: campaign.id,
    matchedScenario: scenario?.id ?? null,
    reply: scenario ? selectReply(scenario, input.incomingMessage) : "Gracias por escribirme. Te hago una pregunta rapida para orientarte mejor.",
    nextAction: scenario?.nextAction ?? "suggest_reply",
    riskLevel: scenario?.riskLevel ?? "low",
    qualificationQuestions: scenario?.qualificationQuestions ?? ["Que objetivo quieres lograr?"],
    shouldEscalate: scenario?.riskLevel === "high" || scenario?.nextAction === "escalate_human"
  };
}

export function runCaptureAction(input: CaptureRunInput, workspace: WorkspaceState = initialWorkspace) {
  const campaign = findCampaign(workspace, input.campaignId);
  const plan = generateWeeklyPlan({
    business: workspace.business,
    brand: workspace.brand,
    products: workspace.products,
    pricePlans: workspace.pricePlans,
    pillars: workspace.pillars
  });

  return {
    ok: true,
    campaignId: campaign.id,
    action: input.action,
    generatedIdeas: plan.ideas.length,
    generatedAssets: plan.assets.length,
    botMode: campaign.botMode,
    aiMode: campaign.aiConfig.mode,
    channels: campaign.channels,
    checklist: [
      "Generar ideas y copies por canal activo",
      "Pasar QA comercial",
      "Renderizar piezas aprobadas",
      "Publicar por API si el canal esta conectado",
      "Usar link WhatsApp trackeado para captar leads",
      "Responder con BOT asistido o escenarios manuales segun configuracion"
    ]
  };
}
