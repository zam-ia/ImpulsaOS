export type ContentStatus =
  | "draft"
  | "needs_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "failed";

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "won"
  | "lost"
  | "nurture";

export type ContentObjective =
  | "viralidad"
  | "valor"
  | "autoridad"
  | "prueba_social"
  | "venta"
  | "comunidad"
  | "reciclaje";

export type Channel =
  | "facebook"
  | "instagram_post"
  | "instagram_reel"
  | "instagram_story"
  | "tiktok"
  | "whatsapp"
  | "manual";

export type SocialPlatform = "facebook" | "instagram" | "tiktok" | "whatsapp";
export type ThemePreference = "system" | "light" | "dark";
export type ModuleKey =
  | "dashboard"
  | "business"
  | "products"
  | "content"
  | "calendar"
  | "designs"
  | "leads"
  | "connections"
  | "analytics"
  | "automations";

export interface AppSettings {
  theme: ThemePreference;
  sidebarCollapsed: boolean;
  moduleLabels: Record<ModuleKey, string>;
  updatedAt: string;
}

export interface SocialConnection {
  id: string;
  businessId: string;
  platform: SocialPlatform;
  label: string;
  handle: string;
  profileUrl: string;
  externalId: string;
  publishMode: "api" | "manual" | "handoff";
  tokenStatus: "missing" | "configured" | "expired" | "manual";
  isActive: boolean;
  lastCheckedAt: string | null;
  notes: string;
}

export type AiOperationMode = "api" | "manual" | "hybrid";
export type BotMode = "off" | "assist" | "bot";

export interface AiIntegrationConfig {
  mode: AiOperationMode;
  provider: "gemini" | "openai" | "custom" | "none";
  model: string;
  apiKeyEnvName: string;
  endpointUrl: string;
  temperature: number;
  dailyLimit: number;
  fallbackToManual: boolean;
  systemPrompt: string;
}

export interface BotScenario {
  id: string;
  name: string;
  intent: string;
  triggerPhrases: string[];
  possibleReplies: string[];
  qualificationQuestions: string[];
  nextAction: "suggest_reply" | "create_lead" | "send_whatsapp_link" | "escalate_human";
  riskLevel: "low" | "medium" | "high";
  isActive: boolean;
}

export interface OrganicCaptureCampaign {
  id: string;
  businessId: string;
  name: string;
  objective: "captar_leads" | "agendar" | "vender" | "nutrir";
  productId: string | null;
  channels: Channel[];
  cadence: "daily" | "weekly" | "manual";
  botMode: BotMode;
  aiConfig: AiIntegrationConfig;
  scenarios: BotScenario[];
  leadMagnet: string;
  trackedKeyword: string;
  whatsappCta: string;
  status: "draft" | "active" | "paused";
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  niche: string;
  description: string;
  promise: string;
  differentiator: string;
  serviceZones: string;
  openingHours: string;
  website: string;
  timezone: string;
  status: "active" | "paused";
  whatsappPhone: string;
  createdAt: string;
}

export interface BrandProfile {
  id: string;
  businessId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  neutralColor: string;
  fontHeadline: string;
  fontBody: string;
  tone: string;
  visualStyle: string;
  forbiddenWords: string[];
  logoUrl: string;
  referenceAssets: string[];
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  targetAudience: string;
  guarantee: string;
  availability: string;
  status: "active" | "paused" | "archived";
  createdAt: string;
}

export interface PricePlan {
  id: string;
  productId: string;
  currency: string;
  regularPrice: number;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  terms: string;
  createdAt: string;
}

export interface Audience {
  id: string;
  businessId: string;
  name: string;
  pains: string[];
  desires: string[];
  objections: string[];
  languageStyle: string;
  awarenessLevel: string;
}

export interface ContentPillar {
  id: string;
  businessId: string;
  name: string;
  objective: ContentObjective;
  frequency: number;
  examples: string[];
}

export interface ContentIdea {
  id: string;
  businessId: string;
  productId: string | null;
  pillarId: string | null;
  title: string;
  angle: string;
  hook: string;
  format: string;
  objective: ContentObjective;
  viralScore: number;
  status: ContentStatus;
  scheduledDay: string;
  createdAt: string;
}

export interface QaResult {
  score: number;
  riskFlags: string[];
  qaNotes: string[];
  needsReview: boolean;
  blockers: string[];
}

export interface ContentAsset {
  id: string;
  ideaId: string;
  productId: string | null;
  assetType: "copy" | "script" | "design" | "visual_prompt";
  channel: Channel;
  title: string;
  copy: string;
  script: string;
  designTemplateId: string;
  designSvg: string;
  prompt: string;
  qa: QaResult;
  status: ContentStatus;
  createdAt: string;
}

export interface Publication {
  id: string;
  assetId: string;
  channel: Channel;
  scheduledAt: string;
  publishedAt: string | null;
  platformPostId: string | null;
  status: ContentStatus;
  metrics: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
  };
}

export interface Lead {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  channel: string;
  source: string;
  sourcePostId: string | null;
  interest: string;
  interestLevel: number;
  stage: LeadStage;
  assignedTo: string;
  createdAt: string;
}

export interface LeadEvent {
  id: string;
  leadId: string | null;
  businessId: string;
  eventType: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface AutomationNode {
  id: string;
  type: "trigger" | "condition" | "ai" | "qa" | "design" | "publish" | "lead" | "notify";
  label: string;
  config: Record<string, string | number | boolean>;
}

export interface AutomationFlow {
  id: string;
  businessId: string;
  name: string;
  triggerType: "manual" | "daily" | "weekly" | "webhook";
  nodes: AutomationNode[];
  edges: Array<{ from: string; to: string }>;
  isActive: boolean;
}

export interface AutomationRun {
  id: string;
  flowId: string;
  status: "queued" | "running" | "success" | "failed" | "blocked";
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  tokensUsed: number;
  log: string[];
}

export interface AiRun {
  id: string;
  businessId: string;
  provider: "gemini" | "mock" | "manual";
  model: string;
  promptType: string;
  inputHash: string;
  output: unknown;
  costEstimate: number;
  qualityScore: number;
  createdAt: string;
}

export interface WorkspaceState {
  settings: AppSettings;
  business: Business;
  brand: BrandProfile;
  products: Product[];
  pricePlans: PricePlan[];
  audiences: Audience[];
  pillars: ContentPillar[];
  ideas: ContentIdea[];
  assets: ContentAsset[];
  publications: Publication[];
  leads: Lead[];
  leadEvents: LeadEvent[];
  connections: SocialConnection[];
  captureCampaigns: OrganicCaptureCampaign[];
  flows: AutomationFlow[];
  runs: AutomationRun[];
  aiRuns: AiRun[];
}

export interface WeeklyPlanResult {
  ideas: ContentIdea[];
  assets: ContentAsset[];
  publications: Publication[];
  aiRuns: AiRun[];
}
