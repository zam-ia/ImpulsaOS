import type {
  Channel,
  ContentAsset,
  ContentIdea,
  ContentObjective,
  GoalPlan,
  GoalType,
  Publication,
  StrategicGoal,
  WorkspaceState
} from "@/lib/types";
import { addDaysIso, makeId, todayIso } from "@/lib/utils";

export type GoalInput = Omit<StrategicGoal, "id" | "businessId" | "mainStrategy" | "status" | "createdAt" | "updatedAt">;

const goalLabels: Record<GoalType, string> = {
  followers_growth: "Crecimiento de seguidores",
  lead_generation: "Generacion de leads",
  course_sales: "Venta de curso/diplomado",
  brand_positioning: "Posicionamiento de marca",
  community_engagement: "Comunidad / engagement",
  audience_reactivation: "Reactivacion de audiencia"
};

const defaultMix: Record<GoalType, GoalPlan["contentPillars"]> = {
  followers_growth: [
    { name: "Viral educativo", weight: 50, objective: "viralidad" },
    { name: "Autoridad simple", weight: 25, objective: "autoridad" },
    { name: "Comunidad", weight: 15, objective: "comunidad" },
    { name: "Venta suave", weight: 10, objective: "venta" }
  ],
  lead_generation: [
    { name: "Problema-solucion", weight: 35, objective: "valor" },
    { name: "Objeciones", weight: 25, objective: "autoridad" },
    { name: "Prueba social", weight: 20, objective: "prueba_social" },
    { name: "CTA WhatsApp", weight: 20, objective: "venta" }
  ],
  course_sales: [
    { name: "Oferta", weight: 30, objective: "venta" },
    { name: "Beneficios", weight: 25, objective: "valor" },
    { name: "Prueba social", weight: 25, objective: "prueba_social" },
    { name: "Urgencia real", weight: 20, objective: "autoridad" }
  ],
  brand_positioning: [
    { name: "Autoridad", weight: 40, objective: "autoridad" },
    { name: "Educacion", weight: 30, objective: "valor" },
    { name: "Prueba", weight: 20, objective: "prueba_social" },
    { name: "Comunidad", weight: 10, objective: "comunidad" }
  ],
  community_engagement: [
    { name: "Conversacion", weight: 40, objective: "comunidad" },
    { name: "Identificacion", weight: 30, objective: "viralidad" },
    { name: "Valor simple", weight: 20, objective: "valor" },
    { name: "Marca cercana", weight: 10, objective: "autoridad" }
  ],
  audience_reactivation: [
    { name: "Dolor actual", weight: 30, objective: "viralidad" },
    { name: "Nuevo valor", weight: 30, objective: "valor" },
    { name: "Oferta de retorno", weight: 25, objective: "venta" },
    { name: "Comunidad", weight: 15, objective: "comunidad" }
  ]
};

export function buildGoalName(type: GoalType, targetNumber: number) {
  return `${goalLabels[type]}: ${targetNumber.toLocaleString("es-PE")}`;
}

export function buildMainStrategy(type: GoalType) {
  if (type === "followers_growth") {
    return "Priorizar alcance y retencion: reels educativos simples, hooks de identificacion, contenido compartible y series repetibles.";
  }
  if (type === "lead_generation") {
    return "Priorizar consultas: problema-solucion, objeciones, testimonios, eventos gratuitos y CTA medible a WhatsApp.";
  }
  if (type === "course_sales") {
    return "Priorizar conversion: oferta clara, beneficios, prueba social, objeciones frecuentes, urgencia real y CTA a WhatsApp.";
  }
  return "Construir confianza con contenido educativo, autoridad, comunidad y llamados medibles.";
}

export function createStrategicGoal(businessId: string, input: GoalInput): StrategicGoal {
  return {
    ...input,
    id: makeId("goal"),
    businessId,
    name: input.name || buildGoalName(input.type, input.targetNumber),
    mainStrategy: buildMainStrategy(input.type),
    status: "active",
    createdAt: todayIso(),
    updatedAt: todayIso()
  };
}

export function generateGoalPlan(goal: StrategicGoal): GoalPlan {
  const gap = Math.max(goal.targetNumber - goal.currentNumber, 0);
  const days = Math.max(
    Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24)),
    1
  );
  const dailyNeed = Math.ceil(gap / days);
  const isGrowth = goal.type === "followers_growth";
  const isLeads = goal.type === "lead_generation";
  const isSales = goal.type === "course_sales";

  return {
    goalId: goal.id,
    diagnostic: `Punto de partida: ${goal.currentNumber.toLocaleString("es-PE")}. Meta: ${goal.targetNumber.toLocaleString("es-PE")} en ${days} dias.`,
    gap,
    recommendedStrategy: `${goal.mainStrategy} Necesitas avanzar aproximadamente ${dailyNeed.toLocaleString("es-PE")} unidades por dia.`,
    contentPillars: defaultMix[goal.type],
    monthlyProduction: {
      reels: isGrowth ? 20 : isLeads ? 12 : 8,
      carousels: isGrowth ? 12 : 10,
      flyers: isGrowth ? 8 : isSales ? 12 : 6,
      proofPosts: isSales ? 8 : 4,
      communityPosts: isGrowth ? 4 : 3,
      softSalesPosts: isSales ? 10 : 4
    },
    priorityIdeas: buildPriorityIdeas(goal),
    scriptsToRecord: [
      "Que no te pase: error comun del publico objetivo",
      "3 consejos rapidos para avanzar sin confundirse",
      "Historia corta: de duda a decision informada"
    ],
    suggestedCalendar: [
      "Lunes: reel de alcance",
      "Martes: carrusel educativo",
      "Miercoles: prueba/autoridad",
      "Jueves: reel de identificacion",
      "Viernes: CTA suave",
      "Sabado: comunidad",
      "Domingo: reporte y reciclaje"
    ],
    kpis: isGrowth
      ? ["seguidores ganados", "alcance", "retencion", "compartidos", "comentarios"]
      : isLeads
        ? ["leads", "clics WhatsApp", "comentarios con palabra clave", "conversion por canal"]
        : ["ventas", "leads calificados", "clics WhatsApp", "objeciones resueltas", "conversion"],
    risks: [
      "Exceso de venta directa si la meta es crecimiento.",
      "Hooks agresivos sin adaptacion al tono de marca.",
      "Piezas visuales saturadas con demasiado texto.",
      "Aprobar contenido sin precio, CTA o canal verificado."
    ],
    updatedAt: todayIso()
  };
}

function buildPriorityIdeas(goal: StrategicGoal) {
  if (goal.type === "followers_growth") {
    return [
      "3 errores que comete un profesional al elegir una capacitacion",
      "Que no te pase: esperar el ultimo momento para actualizarte",
      "Si trabajas en salud, guarda este checklist"
    ];
  }
  if (goal.type === "lead_generation") {
    return [
      "Checklist gratuito para elegir una capacitacion sin perder tiempo",
      "Como saber si este diplomado encaja contigo",
      "Responde INFO y te enviamos la guia"
    ];
  }
  if (goal.type === "course_sales") {
    return [
      "Beneficios reales de inscribirte antes del cierre",
      "Preguntas frecuentes antes de matricularte",
      "Caso de alumno: por que actualizarse cambia oportunidades"
    ];
  }
  return [
    "Lo que nadie te explica antes de decidir",
    "Mitos y verdades del sector",
    "Guia simple para avanzar esta semana"
  ];
}

function channelFor(goal: StrategicGoal, index: number): Channel {
  return goal.channels[index % Math.max(goal.channels.length, 1)] ?? "instagram_reel";
}

function formatFor(goal: StrategicGoal, index: number) {
  if (goal.type === "followers_growth") return index % 3 === 0 ? "Reel talking head" : index % 3 === 1 ? "Carrusel educativo" : "Flyer de valor";
  if (goal.type === "lead_generation") return index % 2 === 0 ? "Carrusel problema-solucion" : "Reel objecion";
  if (goal.type === "course_sales") return index % 2 === 0 ? "Post de beneficios" : "Video de venta suave";
  return index % 2 === 0 ? "Reel educativo" : "Post comunidad";
}

function objectiveFor(goal: StrategicGoal, index: number): ContentObjective {
  return defaultMix[goal.type][index % defaultMix[goal.type].length]?.objective ?? "valor";
}

export function generateGoalContentPackage(workspace: WorkspaceState, goalId: string) {
  const goal = workspace.goals.find((item) => item.id === goalId);
  if (!goal) return null;
  const plan = generateGoalPlan(goal);
  const product = goal.productId ? workspace.products.find((item) => item.id === goal.productId) ?? null : null;
  const ideas: ContentIdea[] = plan.priorityIdeas.concat(plan.scriptsToRecord).slice(0, 6).map((title, index) => {
    const objective = objectiveFor(goal, index);
    return {
      id: makeId("idea"),
      businessId: workspace.business.id,
      goalId: goal.id,
      productId: goal.productId,
      pillarId: null,
      title,
      angle: `${goalLabels[goal.type]} para ${goal.audience || workspace.business.niche}`,
      hook: title.startsWith("Que no te pase") ? title : `Si esto te interesa, ${title.toLowerCase()}`,
      format: formatFor(goal, index),
      objective,
      viralScore: objective === "viralidad" ? 88 : objective === "comunidad" ? 82 : 76,
      salesScore: objective === "venta" ? 88 : objective === "prueba_social" ? 78 : 58,
      priority: index < 3 ? "high" : "medium",
      productionDifficulty: index % 3 === 0 ? "medium" : "low",
      status: "idea_generated",
      scheduledDay: addDaysIso(index + 1, 10),
      createdAt: todayIso()
    };
  });

  const assets: ContentAsset[] = ideas.map((idea, index) => {
    const isVideo = idea.format.toLowerCase().includes("reel") || idea.format.toLowerCase().includes("video");
    const channel = channelFor(goal, index);
    return {
      id: makeId("asset"),
      ideaId: idea.id,
      goalId: goal.id,
      productId: goal.productId,
      assetType: isVideo ? "video" : index % 2 === 0 ? "copy" : "design",
      channel,
      title: idea.title,
      copy: buildCopy(goal, idea.title, product?.name),
      script: isVideo ? buildScript(goal, idea.title) : "",
      designTemplateId: channel === "instagram_story" ? "story_v1" : "post_square_clean_v1",
      designSvg: "",
      prompt: `Crear pieza para ${goal.name}. Formato: ${idea.format}. Estilo: claro, profesional, con jerarquia visual y CTA alineado a la meta.`,
      targetConnectionIds: workspace.captureCampaigns[0]?.targetConnectionIds ?? [],
      referenceImageUrls: workspace.brand.referenceAssets.slice(0, 4),
      recordingChecklist: isVideo ? ["Verificar luz", "Grabar hook en los primeros 3 segundos", "Tomar plano hablando a camara", "Cerrar con CTA"] : [],
      suggestedScenes: isVideo ? ["Hook a camara", "Problema visible", "3 consejos", "CTA"] : [],
      suggestedTakes: isVideo ? ["Plano medio", "B-roll de pantalla o cuaderno", "Cierre mirando a camara"] : [],
      qa: {
        score: 84,
        riskFlags: [],
        qaNotes: [`Alineado a meta: ${goal.name}`, `Canal sugerido: ${channel.replaceAll("_", " ")}`],
        needsReview: true,
        blockers: []
      },
      status: isVideo ? "pending_recording" : "needs_review",
      createdAt: todayIso()
    };
  });

  const publications: Publication[] = assets
    .filter((asset) => asset.status !== "pending_recording")
    .map((asset, index) => ({
      id: makeId("pub"),
      assetId: asset.id,
      channel: asset.channel,
      connectionId: workspace.captureCampaigns[0]?.targetConnectionIds?.[0] ?? null,
      scheduledAt: addDaysIso(index + 1, 11),
      publishedAt: null,
      platformPostId: null,
      status: "needs_review",
      metrics: { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0 }
    }));

  return { goal, plan, ideas, assets, publications };
}

function buildCopy(goal: StrategicGoal, title: string, productName?: string) {
  const cta =
    goal.type === "followers_growth"
      ? "Sigue la pagina para mas consejos utiles."
      : goal.type === "lead_generation"
        ? "Escribe INFO por WhatsApp y te enviamos la guia."
        : "Escribenos por WhatsApp para revisar si este programa encaja contigo.";
  return `${title}\n\nIdea clave: ${goal.mainStrategy}\n\n${productName ? `Relacionado: ${productName}\n\n` : ""}${cta}`;
}

function buildScript(goal: StrategicGoal, title: string) {
  return `Hook: ${title}\n\nEscena 1: presentar el problema en una frase.\nEscena 2: explicar por que importa para ${goal.audience || "el publico objetivo"}.\nEscena 3: entregar 3 puntos accionables.\nCierre: CTA alineado a la meta.`;
}
