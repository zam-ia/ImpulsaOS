"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { generateSingleCopy, generateWeeklyPlan } from "@/lib/ai";
import { computeAnalytics } from "@/lib/analytics";
import { renderDesignSvg } from "@/lib/design";
import { initialWorkspace } from "@/lib/seed";
import type {
  AutomationRun,
  BrandProfile,
  Business,
  Channel,
  ContentAsset,
  ContentIdea,
  ContentObjective,
  ContentStatus,
  Lead,
  LeadStage,
  AppSettings,
  OrganicCaptureCampaign,
  PricePlan,
  Product,
  Publication,
  SocialConnection,
  WorkspaceState
} from "@/lib/types";
import { addDaysIso, makeId, todayIso } from "@/lib/utils";

const STORAGE_KEY = "growthbrain-local-state-v1";

interface WorkspaceContextValue {
  state: WorkspaceState;
  analytics: ReturnType<typeof computeAnalytics>;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateBusiness: (business: Partial<Business>) => void;
  updateBrand: (brand: Partial<BrandProfile>) => void;
  addProduct: (product: Omit<Product, "id" | "businessId" | "createdAt">, price: Omit<PricePlan, "id" | "productId" | "createdAt">) => void;
  updateProduct: (productId: string, product: Partial<Product>, price?: Partial<PricePlan>) => void;
  addDesignAsset: (input: {
    title: string;
    productId: string | null;
    channel: Channel;
    templateId: string;
    prompt: string;
    copy: string;
  }) => string;
  generateWeek: () => void;
  generateContent: (input: { productId: string; objective: ContentObjective; channel: Channel }) => void;
  updateIdeaStatus: (ideaId: string, status: ContentStatus) => void;
  updateAsset: (assetId: string, asset: Partial<ContentAsset>) => void;
  updateAssetStatus: (assetId: string, status: ContentStatus) => void;
  addPublication: (publication: Omit<Publication, "id" | "metrics">) => void;
  updatePublication: (publicationId: string, publication: Partial<Publication>) => void;
  updateConnection: (connectionId: string, connection: Partial<SocialConnection>) => void;
  updateCaptureCampaign: (campaignId: string, campaign: Partial<OrganicCaptureCampaign>) => void;
  addBotScenario: (campaignId: string) => void;
  updateBotScenario: (
    campaignId: string,
    scenarioId: string,
    scenario: Partial<OrganicCaptureCampaign["scenarios"][number]>
  ) => void;
  renderAsset: (assetId: string, templateId?: string) => void;
  addLead: (lead: Omit<Lead, "id" | "businessId" | "createdAt">) => void;
  updateLead: (leadId: string, lead: Partial<Lead>) => void;
  updateLeadStage: (leadId: string, stage: LeadStage) => void;
  runAutomation: (flowId: string) => void;
  resetDemo: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function readStoredState(): WorkspaceState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      ...initialWorkspace,
      ...parsed,
      settings: {
        ...initialWorkspace.settings,
        ...parsed.settings,
        moduleLabels: {
          ...initialWorkspace.settings.moduleLabels,
          ...parsed.settings?.moduleLabels
        }
      },
      connections: parsed.connections ?? initialWorkspace.connections,
      captureCampaigns: parsed.captureCampaigns ?? initialWorkspace.captureCampaigns
    } as WorkspaceState;
  } catch {
    return null;
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(initialWorkspace);

  useEffect(() => {
    const stored = readStoredState();
    if (stored) setState(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...settings,
        moduleLabels: {
          ...current.settings.moduleLabels,
          ...settings.moduleLabels
        },
        updatedAt: todayIso()
      }
    }));
  }, []);

  const updateBusiness = useCallback((business: Partial<Business>) => {
    setState((current) => ({
      ...current,
      business: { ...current.business, ...business }
    }));
  }, []);

  const updateBrand = useCallback((brand: Partial<BrandProfile>) => {
    setState((current) => ({
      ...current,
      brand: { ...current.brand, ...brand, updatedAt: todayIso() }
    }));
  }, []);

  const addProduct = useCallback<WorkspaceContextValue["addProduct"]>((product, price) => {
    setState((current) => {
      const productId = makeId("prod");
      return {
        ...current,
        products: [
          ...current.products,
          {
            ...product,
            id: productId,
            businessId: current.business.id,
            createdAt: todayIso()
          }
        ],
        pricePlans: [
          ...current.pricePlans,
          {
            ...price,
            id: makeId("price"),
            productId,
            createdAt: todayIso()
          }
        ]
      };
    });
  }, []);

  const updateProduct = useCallback<WorkspaceContextValue["updateProduct"]>((productId, product, price) => {
    setState((current) => ({
      ...current,
      products: current.products.map((item) => (item.id === productId ? { ...item, ...product } : item)),
      pricePlans: price
        ? current.pricePlans.map((item) => (item.productId === productId ? { ...item, ...price } : item))
        : current.pricePlans
    }));
  }, []);

  const addDesignAsset = useCallback<WorkspaceContextValue["addDesignAsset"]>((input) => {
    const assetId = makeId("asset");
    setState((current) => {
      const ideaId = makeId("idea");
      const product = input.productId ? current.products.find((item) => item.id === input.productId) ?? null : null;
      const idea: ContentIdea = {
        id: ideaId,
        businessId: current.business.id,
        productId: input.productId,
        pillarId: null,
        title: input.title,
        angle: "Diseño creado manualmente desde el módulo de diseños.",
        hook: input.copy.split("\n").find(Boolean) ?? input.prompt,
        format: input.templateId === "story_v1" ? "Story" : "Post",
        objective: "valor",
        viralScore: 76,
        status: "needs_review",
        scheduledDay: addDaysIso(1, 10),
        createdAt: todayIso()
      };
      const baseAsset: ContentAsset = {
        id: assetId,
        ideaId,
        productId: input.productId,
        assetType: "design",
        channel: input.channel,
        title: input.title,
        copy: input.copy,
        script: "",
        designTemplateId: input.templateId,
        designSvg: "",
        prompt: input.prompt,
        qa: {
          score: 82,
          riskFlags: [],
          qaNotes: ["Diseño creado desde prompt/manual."],
          needsReview: true,
          blockers: []
        },
        status: "needs_review",
        createdAt: todayIso()
      };
      const designSvg = renderDesignSvg({
        business: current.business,
        brand: current.brand,
        asset: baseAsset,
        idea,
        product,
        templateId: input.templateId
      });

      return {
        ...current,
        ideas: [idea, ...current.ideas],
        assets: [{ ...baseAsset, designSvg }, ...current.assets]
      };
    });
    return assetId;
  }, []);

  const generateWeek = useCallback(() => {
    setState((current) => {
      const result = generateWeeklyPlan({
        business: current.business,
        brand: current.brand,
        products: current.products,
        pricePlans: current.pricePlans,
        pillars: current.pillars
      });

      return {
        ...current,
        ideas: [...result.ideas, ...current.ideas],
        assets: [...result.assets, ...current.assets],
        publications: [...result.publications, ...current.publications],
        aiRuns: [...result.aiRuns, ...current.aiRuns]
      };
    });
  }, []);

  const generateContent = useCallback<WorkspaceContextValue["generateContent"]>((input) => {
    setState((current) => {
      const product = current.products.find((item) => item.id === input.productId);
      if (!product) return current;

      const price = current.pricePlans.find((item) => item.productId === product.id);
      const generated = generateSingleCopy({
        business: current.business,
        brand: current.brand,
        product,
        price,
        objective: input.objective,
        channel: input.channel
      });
      const ideaId = makeId("idea");
      const assetId = makeId("asset");
      const idea: ContentIdea = {
        id: ideaId,
        businessId: current.business.id,
        productId: product.id,
        pillarId: current.pillars.find((pillar) => pillar.objective === input.objective)?.id ?? null,
        title: generated.idea.title ?? "Idea generada",
        angle: generated.idea.angle ?? "Contenido generado",
        hook: generated.idea.hook ?? "",
        format: generated.idea.format ?? "Post",
        objective: input.objective,
        viralScore: generated.idea.viralScore ?? 80,
        status: "needs_review",
        scheduledDay: addDaysIso(1, 10),
        createdAt: todayIso()
      };
      const asset: ContentAsset = {
        id: assetId,
        ideaId,
        productId: product.id,
        assetType: "copy",
        channel: input.channel,
        title: idea.title,
        copy: generated.asset.copy ?? "",
        script: "",
        designTemplateId: input.channel === "instagram_story" ? "story_v1" : "post_square_clean_v1",
        designSvg: "",
        prompt: generated.asset.prompt ?? "",
        qa: generated.asset.qa ?? {
          score: 0,
          riskFlags: [],
          qaNotes: ["Sin QA."],
          needsReview: true,
          blockers: ["Sin QA."]
        },
        status: "needs_review",
        createdAt: todayIso()
      };
      const publication: Publication = {
        id: makeId("pub"),
        assetId,
        channel: input.channel,
        scheduledAt: idea.scheduledDay,
        publishedAt: null,
        platformPostId: null,
        status: "needs_review",
        metrics: {
          impressions: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          clicks: 0
        }
      };

      return {
        ...current,
        ideas: [idea, ...current.ideas],
        assets: [asset, ...current.assets],
        publications: [publication, ...current.publications],
        aiRuns: [
          {
            id: makeId("ai"),
            businessId: current.business.id,
            provider: "mock",
            model: "local-deterministic",
            promptType: "copy",
            inputHash: `${product.id}:${input.objective}:${input.channel}`,
            output: generated,
            costEstimate: 0,
            qualityScore: asset.qa.score,
            createdAt: todayIso()
          },
          ...current.aiRuns
        ]
      };
    });
  }, []);

  const updateIdeaStatus = useCallback((ideaId: string, status: ContentStatus) => {
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) => (idea.id === ideaId ? { ...idea, status } : idea))
    }));
  }, []);

  const updateAsset = useCallback((assetId: string, asset: Partial<ContentAsset>) => {
    setState((current) => ({
      ...current,
      assets: current.assets.map((item) => (item.id === assetId ? { ...item, ...asset } : item)),
      publications:
        asset.status !== undefined
          ? current.publications.map((publication) =>
              publication.assetId === assetId ? { ...publication, status: asset.status as ContentStatus } : publication
            )
          : current.publications
    }));
  }, []);

  const updateAssetStatus = useCallback((assetId: string, status: ContentStatus) => {
    setState((current) => ({
      ...current,
      assets: current.assets.map((asset) => (asset.id === assetId ? { ...asset, status } : asset)),
      publications: current.publications.map((publication) =>
        publication.assetId === assetId ? { ...publication, status } : publication
      )
    }));
  }, []);

  const addPublication = useCallback<WorkspaceContextValue["addPublication"]>((publication) => {
    setState((current) => ({
      ...current,
      publications: [
        {
          ...publication,
          id: makeId("pub"),
          metrics: {
            impressions: 0,
            reach: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saves: 0,
            clicks: 0
          }
        },
        ...current.publications
      ],
      assets: current.assets.map((asset) =>
        asset.id === publication.assetId ? { ...asset, status: publication.status, channel: publication.channel } : asset
      )
    }));
  }, []);

  const updatePublication = useCallback((publicationId: string, publication: Partial<Publication>) => {
    setState((current) => ({
      ...current,
      publications: current.publications.map((item) =>
        item.id === publicationId ? { ...item, ...publication } : item
      )
    }));
  }, []);

  const updateConnection = useCallback((connectionId: string, connection: Partial<SocialConnection>) => {
    setState((current) => ({
      ...current,
      connections: current.connections.map((item) =>
        item.id === connectionId
          ? {
              ...item,
              ...connection,
              lastCheckedAt: new Date().toISOString()
            }
          : item
      )
    }));
  }, []);

  const updateCaptureCampaign = useCallback((campaignId: string, campaign: Partial<OrganicCaptureCampaign>) => {
    setState((current) => ({
      ...current,
      captureCampaigns: current.captureCampaigns.map((item) =>
        item.id === campaignId
          ? {
              ...item,
              ...campaign,
              updatedAt: todayIso()
            }
          : item
      )
    }));
  }, []);

  const addBotScenario = useCallback((campaignId: string) => {
    setState((current) => ({
      ...current,
      captureCampaigns: current.captureCampaigns.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              updatedAt: todayIso(),
              scenarios: [
                ...campaign.scenarios,
                {
                  id: makeId("scenario"),
                  name: "Nuevo caso hipotetico",
                  intent: "custom_intent",
                  triggerPhrases: ["info"],
                  possibleReplies: ["Gracias por escribirme. Te hago una pregunta rapida para orientarte mejor."],
                  qualificationQuestions: ["Que estas buscando resolver?"],
                  nextAction: "suggest_reply",
                  riskLevel: "low",
                  isActive: true
                }
              ]
            }
          : campaign
      )
    }));
  }, []);

  const updateBotScenario = useCallback<WorkspaceContextValue["updateBotScenario"]>((campaignId, scenarioId, scenario) => {
    setState((current) => ({
      ...current,
      captureCampaigns: current.captureCampaigns.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              updatedAt: todayIso(),
              scenarios: campaign.scenarios.map((item) => (item.id === scenarioId ? { ...item, ...scenario } : item))
            }
          : campaign
      )
    }));
  }, []);

  const renderAsset = useCallback((assetId: string, templateId?: string) => {
    setState((current) => ({
      ...current,
      assets: current.assets.map((asset) => {
        if (asset.id !== assetId) return asset;
        const idea = current.ideas.find((item) => item.id === asset.ideaId) ?? null;
        const product = current.products.find((item) => item.id === asset.productId) ?? null;
        const designTemplateId = templateId ?? asset.designTemplateId;
        return {
          ...asset,
          assetType: "design",
          designTemplateId,
          designSvg: renderDesignSvg({
            business: current.business,
            brand: current.brand,
            asset: { ...asset, designTemplateId },
            idea,
            product,
            templateId: designTemplateId
          })
        };
      })
    }));
  }, []);

  const addLead = useCallback<WorkspaceContextValue["addLead"]>((lead) => {
    setState((current) => {
      const leadId = makeId("lead");
      return {
        ...current,
        leads: [
          {
            ...lead,
            id: leadId,
            businessId: current.business.id,
            createdAt: todayIso()
          },
          ...current.leads
        ],
        leadEvents: [
          {
            id: makeId("evt"),
            leadId,
            businessId: current.business.id,
            eventType: "manual_capture",
            metadata: { channel: lead.channel, source: lead.source },
            createdAt: todayIso()
          },
          ...current.leadEvents
        ]
      };
    });
  }, []);

  const updateLead = useCallback((leadId: string, lead: Partial<Lead>) => {
    setState((current) => ({
      ...current,
      leads: current.leads.map((item) => (item.id === leadId ? { ...item, ...lead } : item)),
      leadEvents:
        lead.stage !== undefined
          ? [
              {
                id: makeId("evt"),
                leadId,
                businessId: current.business.id,
                eventType: "lead_updated",
                metadata: { stage: lead.stage, source: "modal" },
                createdAt: todayIso()
              },
              ...current.leadEvents
            ]
          : current.leadEvents
    }));
  }, []);

  const updateLeadStage = useCallback((leadId: string, stage: LeadStage) => {
    setState((current) => ({
      ...current,
      leads: current.leads.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)),
      leadEvents: [
        {
          id: makeId("evt"),
          leadId,
          businessId: current.business.id,
          eventType: "stage_changed",
          metadata: { stage },
          createdAt: todayIso()
        },
        ...current.leadEvents
      ]
    }));
  }, []);

  const runAutomation = useCallback((flowId: string) => {
    setState((current) => {
      const flow = current.flows.find((item) => item.id === flowId);
      if (!flow) return current;

      const run: AutomationRun = {
        id: makeId("run"),
        flowId,
        status: flow.isActive ? "success" : "blocked",
        startedAt: todayIso(),
        finishedAt: todayIso(),
        errorMessage: flow.isActive ? null : "El flujo está inactivo.",
        tokensUsed: flow.nodes.some((node) => node.type === "ai") ? 740 : 0,
        log: flow.nodes.map((node) => `OK ${node.type}: ${node.label}`)
      };

      return {
        ...current,
        runs: [run, ...current.runs]
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    setState(initialWorkspace);
  }, []);

  const analytics = useMemo(() => computeAnalytics(state), [state]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      analytics,
      updateSettings,
      updateBusiness,
      updateBrand,
      addProduct,
      updateProduct,
      addDesignAsset,
      generateWeek,
      generateContent,
      updateIdeaStatus,
      updateAsset,
      updateAssetStatus,
      addPublication,
      updatePublication,
      updateConnection,
      updateCaptureCampaign,
      addBotScenario,
      updateBotScenario,
      renderAsset,
      addLead,
      updateLead,
      updateLeadStage,
      runAutomation,
      resetDemo
    }),
    [
      state,
      analytics,
      updateSettings,
      updateBusiness,
      updateBrand,
      addProduct,
      updateProduct,
      addDesignAsset,
      generateWeek,
      generateContent,
      updateIdeaStatus,
      updateAsset,
      updateAssetStatus,
      addPublication,
      updatePublication,
      updateConnection,
      updateCaptureCampaign,
      addBotScenario,
      updateBotScenario,
      renderAsset,
      addLead,
      updateLead,
      updateLeadStage,
      runAutomation,
      resetDemo
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }

  return context;
}
