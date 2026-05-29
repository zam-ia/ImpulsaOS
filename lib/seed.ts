import type { WorkspaceState } from "@/lib/types";
import { summarizeSocialMetrics } from "@/lib/social-intelligence";
import { addDaysIso, todayIso } from "@/lib/utils";

const businessId = "biz_demo";
const productA = "prod_consultoria";
const productB = "prod_pack";
const pillarValue = "pillar_valor";
const pillarAuthority = "pillar_autoridad";
const pillarSales = "pillar_venta";

const initialSocialPostMetrics: WorkspaceState["socialPostMetrics"] = [];

export const initialWorkspace: WorkspaceState = {
  settings: {
    theme: "system",
    sidebarCollapsed: false,
    moduleLabels: {
      dashboard: "Panel",
      business: "Configuracion",
      products: "Productos",
      content: "Contenido",
      calendar: "Calendario",
      designs: "Creacion",
      leads: "Leads",
      connections: "Conexiones",
      analytics: "Analitica",
      automations: "Automatizaciones"
    },
    updatedAt: todayIso()
  },
  goals: [],
  goalPlans: [],
  activeGoalId: null,
  business: {
    id: businessId,
    ownerId: "owner_demo",
    name: "GrowthBrain Local",
    niche: "Servicios y ventas por WhatsApp",
    description:
      "Negocio local que quiere atraer prospectos con contenido orgánico, ordenar leads y cerrar por WhatsApp sin depender de tareas repetitivas.",
    promise: "Convertir conocimiento comercial en contenido, piezas visuales y conversaciones de venta.",
    differentiator: "Marketing orgánico con QA comercial, piezas por plantilla y handoff seguro a WhatsApp.",
    serviceZones: "Perú, atención remota",
    openingHours: "Lunes a viernes de 9:00 a 18:00",
    website: "",
    timezone: "America/Lima",
    status: "active",
    whatsappPhone: "51999999999",
    createdAt: todayIso()
  },
  brand: {
    id: "brand_demo",
    businessId,
    primaryColor: "#2f6f5f",
    secondaryColor: "#17212b",
    accentColor: "#de6b48",
    neutralColor: "#f7f5f0",
    fontHeadline: "Aptos Display",
    fontBody: "Aptos",
    tone: "Directo, útil, cercano y comercial sin presión.",
    visualStyle: "Limpio, editorial, con alto contraste, bloques de color y fotos reales cuando existan.",
    forbiddenWords: ["milagroso", "garantizado sin prueba", "hazte rico"],
    logoUrl: "",
    referenceAssets: [],
    updatedAt: todayIso()
  },
  products: [
    {
      id: productA,
      businessId,
      name: "Diagnóstico de marketing orgánico",
      category: "Consultoría",
      description:
        "Sesión para detectar por qué el contenido no atrae prospectos y convertirlo en un plan de 7 días.",
      benefits: ["claridad comercial", "plan accionable", "ideas listas para publicar"],
      targetAudience: "Emprendedoras y negocios locales con poco tiempo para producir contenido.",
      guarantee: "",
      availability: "Disponible con agenda previa",
      status: "active",
      createdAt: todayIso()
    },
    {
      id: productB,
      businessId,
      name: "Pack semanal de contenido",
      category: "Producción",
      description:
        "Plan de ideas, copies, guiones y piezas visuales base para una semana de contenido orgánico.",
      benefits: ["ahorro de tiempo", "consistencia visual", "CTA a WhatsApp"],
      targetAudience: "Negocios que ya tienen oferta y necesitan publicar con orden.",
      guarantee: "",
      availability: "Cupos limitados por semana",
      status: "active",
      createdAt: todayIso()
    }
  ],
  pricePlans: [
    {
      id: "price_diag",
      productId: productA,
      currency: "PEN",
      regularPrice: 150,
      promoPrice: 99,
      promoStart: null,
      promoEnd: null,
      terms: "Incluye una sesión y resumen accionable.",
      createdAt: todayIso()
    },
    {
      id: "price_pack",
      productId: productB,
      currency: "PEN",
      regularPrice: 420,
      promoPrice: null,
      promoStart: null,
      promoEnd: null,
      terms: "Entrega semanal con una ronda de ajustes.",
      createdAt: todayIso()
    }
  ],
  audiences: [
    {
      id: "aud_emprendedora",
      businessId,
      name: "Dueña ocupada",
      pains: ["no tiene tiempo", "publica sin estrategia", "no sabe qué decir para vender"],
      desires: ["atraer clientes", "verse profesional", "vender sin perseguir"],
      objections: ["no tengo presupuesto", "ya probé publicar y no funcionó", "me da miedo verme vendedora"],
      languageStyle: "Simple, directo y con ejemplos cotidianos.",
      awarenessLevel: "Consciente del problema, poco clara sobre la solución."
    }
  ],
  pillars: [
    {
      id: pillarValue,
      businessId,
      name: "Valor práctico",
      objective: "valor",
      frequency: 2,
      examples: ["errores comunes", "checklists", "pasos rápidos"]
    },
    {
      id: pillarAuthority,
      businessId,
      name: "Autoridad y prueba",
      objective: "autoridad",
      frequency: 2,
      examples: ["mitos", "casos", "análisis de publicaciones"]
    },
    {
      id: pillarSales,
      businessId,
      name: "Venta suave",
      objective: "venta",
      frequency: 2,
      examples: ["oferta clara", "objeciones", "CTA a WhatsApp"]
    }
  ],
  ideas: [
    {
      id: "idea_demo_1",
      businessId,
      productId: productA,
      pillarId: pillarValue,
      title: "5 señales de que tu contenido no está vendiendo",
      angle: "Diagnóstico rápido para negocios que publican sin respuesta.",
      hook: "Publicar más no siempre te trae más clientes.",
      format: "Carrusel",
      objective: "valor",
      viralScore: 84,
      status: "needs_review",
      scheduledDay: addDaysIso(1, 10),
      createdAt: todayIso()
    }
  ],
  assets: [],
  publications: [],
  leads: [
    {
      id: "lead_demo",
      businessId,
      name: "María Ramos",
      phone: "51988776655",
      channel: "instagram",
      source: "semana_demo",
      sourcePostId: null,
      interest: "Pack semanal de contenido",
      interestLevel: 82,
      stage: "new",
      assignedTo: "Usuaria",
      createdAt: todayIso()
    }
  ],
  leadEvents: [
    {
      id: "lead_event_demo",
      leadId: "lead_demo",
      businessId,
      eventType: "whatsapp_click",
      metadata: { channel: "instagram", campaign: "semana_demo" },
      createdAt: todayIso()
    }
  ],
  connections: [
    {
      id: "conn_facebook",
      businessId,
      platform: "facebook",
      label: "Fan page principal",
      handle: "",
      profileUrl: "",
      externalId: "",
      publishMode: "manual",
      tokenStatus: "missing",
      isActive: false,
      lastCheckedAt: null,
      notes: "Conecta tu página y completa META_PAGE_ID + META_PAGE_ACCESS_TOKEN para publicación automática."
    },
    {
      id: "conn_facebook_2",
      businessId,
      platform: "facebook",
      label: "Fan page secundaria",
      handle: "",
      profileUrl: "",
      externalId: "",
      publishMode: "manual",
      tokenStatus: "missing",
      isActive: false,
      lastCheckedAt: null,
      notes: "Pagina para probar angulos, reciclar contenido y publicar variaciones por nicho.",
      pageSlot: "Pagina 2",
      contentRole: "prueba"
    },
    {
      id: "conn_facebook_3",
      businessId,
      platform: "facebook",
      label: "Fan page nicho",
      handle: "",
      profileUrl: "",
      externalId: "",
      publishMode: "manual",
      tokenStatus: "missing",
      isActive: false,
      lastCheckedAt: null,
      notes: "Pagina dedicada a una audiencia o zona especifica para medir demanda organica.",
      pageSlot: "Pagina 3",
      contentRole: "nicho"
    },
    {
      id: "conn_instagram",
      businessId,
      platform: "instagram",
      label: "Instagram Business",
      handle: "",
      profileUrl: "",
      externalId: "",
      publishMode: "manual",
      tokenStatus: "missing",
      isActive: false,
      lastCheckedAt: null,
      notes: "Requiere cuenta profesional conectada a una página de Facebook y META_IG_USER_ID."
    },
    {
      id: "conn_tiktok",
      businessId,
      platform: "tiktok",
      label: "TikTok",
      handle: "",
      profileUrl: "",
      externalId: "",
      publishMode: "manual",
      tokenStatus: "manual",
      isActive: false,
      lastCheckedAt: null,
      notes: "MVP: exporta pieza + copy. API de TikTok se puede agregar después con OAuth y permisos."
    },
    {
      id: "conn_whatsapp",
      businessId,
      platform: "whatsapp",
      label: "WhatsApp Business",
      handle: "+51 999 999 999",
      profileUrl: "https://wa.me/51999999999",
      externalId: "51999999999",
      publishMode: "handoff",
      tokenStatus: "configured",
      isActive: true,
      lastCheckedAt: todayIso(),
      notes: "El MVP usa links trackeados wa.me y respuestas sugeridas para proteger el número."
    }
  ],
  competitorProfiles: [],
  socialPostMetrics: initialSocialPostMetrics,
  socialMetricSummary: summarizeSocialMetrics(initialSocialPostMetrics),
  researchInsights: [],
  captureCampaigns: [
    {
      id: "capture_weekly_demo",
      businessId,
      name: "Automatizacion semanal de captacion",
      objective: "captar_leads",
      productId: productB,
      channels: ["instagram_post", "instagram_reel", "facebook", "tiktok", "whatsapp"],
      targetConnectionIds: ["conn_facebook", "conn_facebook_2", "conn_facebook_3", "conn_instagram", "conn_whatsapp"],
      competitorProfileIds: [],
      researchMode: "manual_links",
      cadence: "weekly",
      botMode: "assist",
      aiConfig: {
        mode: "hybrid",
        provider: "gemini",
        model: "gemini-1.5-flash",
        apiKeyEnvName: "GEMINI_API_KEY",
        endpointUrl: "",
        temperature: 0.7,
        dailyLimit: 40,
        fallbackToManual: true,
        systemPrompt:
          "Responde como asistente comercial del negocio. Usa solo datos registrados, no inventes precios ni promesas, califica interes y propone siguiente paso por WhatsApp."
      },
      scenarios: [
        {
          id: "scenario_precio",
          name: "Pregunta por precio",
          intent: "price_inquiry",
          triggerPhrases: ["precio", "cuanto cuesta", "info", "tarifa", "valor"],
          possibleReplies: [
            "Claro. Te paso el precio vigente y que incluye para que evalues sin presion.",
            "Te comparto la opcion actual y primero valido si encaja con lo que necesitas.",
            "El precio depende del paquete. Te hago dos preguntas rapidas y te digo cual corresponde."
          ],
          qualificationQuestions: ["Que objetivo quieres lograr?", "Para cuando necesitas empezar?"],
          nextAction: "create_lead",
          riskLevel: "medium",
          isActive: true
        },
        {
          id: "scenario_objecion_tiempo",
          name: "No tengo tiempo",
          intent: "time_objection",
          triggerPhrases: ["no tengo tiempo", "estoy ocupada", "no puedo ahora"],
          possibleReplies: [
            "Justamente la idea es quitarte carga repetitiva. Puedo resumirte el flujo en 3 pasos.",
            "Te entiendo. Por eso el sistema trabaja por bloques: genera, revisas y apruebas.",
            "Podemos empezar con una version ligera de una semana para que no te consuma tiempo."
          ],
          qualificationQuestions: ["Cuantos dias a la semana puedes revisar contenido?", "Que canal te trae mas consultas hoy?"],
          nextAction: "suggest_reply",
          riskLevel: "low",
          isActive: true
        },
        {
          id: "scenario_claim_riesgo",
          name: "Pide garantia o resultado",
          intent: "guarantee_request",
          triggerPhrases: ["garantizas", "resultado seguro", "voy a vender", "funciona siempre"],
          possibleReplies: [
            "No seria correcto prometer un resultado garantizado. Si puedo mostrarte el proceso y como medimos avances.",
            "Depende de oferta, consistencia y seguimiento. Te explico que si controla el sistema y que queda en decision comercial.",
            "Prefiero darte una expectativa realista: orden, claridad y seguimiento; la venta final depende de varios factores."
          ],
          qualificationQuestions: ["Cual es tu oferta actual?", "Ya tienes mensajes o leads llegando por algun canal?"],
          nextAction: "escalate_human",
          riskLevel: "high",
          isActive: true
        }
      ],
      leadMagnet: "Checklist de 7 dias para ordenar contenido y llevar consultas a WhatsApp",
      trackedKeyword: "INFO",
      whatsappCta: "Escribeme INFO por WhatsApp y te paso la guia",
      status: "active",
      createdAt: todayIso(),
      updatedAt: todayIso()
    }
  ],
  flows: [
    {
      id: "flow_weekly",
      businessId,
      name: "Generación semanal con revisión humana",
      triggerType: "weekly",
      isActive: true,
      nodes: [
        { id: "n1", type: "trigger", label: "Domingo 18:00", config: { cadence: "weekly" } },
        { id: "n2", type: "ai", label: "Generar 7 ideas", config: { prompt: "content-plan" } },
        { id: "n3", type: "qa", label: "Validar precios y claims", config: { minScore: 78 } },
        { id: "n4", type: "design", label: "Preparar flyers", config: { template: "auto" } },
        { id: "n5", type: "notify", label: "Enviar a bandeja de revisión", config: { channel: "dashboard" } }
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n3", to: "n4" },
        { from: "n4", to: "n5" }
      ]
    },
    {
      id: "flow_lead",
      businessId,
      name: "Lead por WhatsApp trackeado",
      triggerType: "webhook",
      isActive: true,
      nodes: [
        { id: "l1", type: "trigger", label: "Clic en link", config: { source: "wa.me" } },
        { id: "l2", type: "lead", label: "Registrar evento", config: { stage: "new" } },
        { id: "l3", type: "notify", label: "Mostrar lead caliente", config: { priority: true } }
      ],
      edges: [
        { from: "l1", to: "l2" },
        { from: "l2", to: "l3" }
      ]
    }
  ],
  runs: [],
  aiRuns: []
};
