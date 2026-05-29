export type ContentStatus =
  | "draft"
  | "idea_generated"
  | "idea_approved"
  | "script_generated"
  | "copy_generated"
  | "design_generated"
  | "needs_review"
  | "approved"
  | "pending_recording"
  | "pending_file"
  | "ready_to_publish"
  | "scheduled"
  | "published"
  | "measured"
  | "reusable"
  | "archived"
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
export type VideoAspect = "9:16" | "16:9" | "1:1";
export type VideoSource = "pexels" | "pixabay" | "local" | "manual";
export type VideoTaskStatus = "draft" | "queued" | "processing" | "completed" | "failed";
export type HookCategory =
  | "curiosidad"
  | "dolor"
  | "autoridad"
  | "prueba_social"
  | "controversia"
  | "historia"
  | "educativo"
  | "oferta"
  | "pregunta"
  | "desconocido";
export type DetectedFormat =
  | "reel"
  | "short"
  | "carrusel"
  | "imagen"
  | "story"
  | "live"
  | "texto"
  | "ad"
  | "desconocido";
export type SocialDataProvider =
  | "meta_business_sdk"
  | "tiktok_business_sdk"
  | "instaloader"
  | "tiktok_api"
  | "facebook_scraper"
  | "crawlee"
  | "manual_csv"
  | "ocr"
  | "whisper";
export type GoalType =
  | "followers_growth"
  | "lead_generation"
  | "course_sales"
  | "brand_positioning"
  | "community_engagement"
  | "audience_reactivation";
export type GoalStatus = "draft" | "active" | "paused" | "completed" | "archived";
export type GoalDeadlineMode = "this_month" | "15_days" | "30_days" | "specific_campaign";
export type GoalPriority = "high" | "medium" | "low";
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
  pageSlot?: string;
  contentRole?: "principal" | "prueba" | "nicho" | "soporte";
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
  targetConnectionIds?: string[];
  competitorProfileIds?: string[];
  researchMode?: "off" | "manual_links" | "internet_watch";
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
  goalId?: string | null;
  productId: string | null;
  pillarId: string | null;
  title: string;
  angle: string;
  hook: string;
  format: string;
  objective: ContentObjective;
  viralScore: number;
  salesScore?: number;
  priority?: GoalPriority;
  productionDifficulty?: "low" | "medium" | "high";
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
  goalId?: string | null;
  productId: string | null;
  assetType: "copy" | "script" | "design" | "visual_prompt" | "video";
  channel: Channel;
  title: string;
  copy: string;
  script: string;
  designTemplateId: string;
  designSvg: string;
  prompt: string;
  targetConnectionIds?: string[];
  referenceImageUrls?: string[];
  videoConfig?: VideoGenerationSettings;
  videoTask?: VideoGenerationTask;
  recordingChecklist?: string[];
  suggestedScenes?: string[];
  suggestedTakes?: string[];
  qa: QaResult;
  status: ContentStatus;
  createdAt: string;
}

export interface Publication {
  id: string;
  assetId: string;
  channel: Channel;
  connectionId?: string | null;
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

export interface CompetitorProfile {
  id: string;
  businessId: string;
  platform: SocialPlatform;
  type?: "creator" | "educational_brand" | "direct_competitor" | "aspirational" | "health_influencer" | "trend_account";
  name: string;
  handle: string;
  profileUrl: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  niche: string;
  country?: string;
  audience?: string;
  relevanceLevel?: "high" | "medium" | "low";
  analysisStatus?: "pending" | "saved" | "analyzing" | "analyzed" | "archived";
  notes: string;
  trackedFormats: string[];
  isActive: boolean;
  metricsSnapshot: {
    postsAnalyzed: number;
    avgLikes: number;
    avgComments: number;
    topFormat: string;
    topHook: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StrategicGoal {
  id: string;
  businessId: string;
  name: string;
  type: GoalType;
  targetNumber: number;
  currentNumber: number;
  startDate: string;
  endDate: string;
  deadlineMode: GoalDeadlineMode;
  channels: Channel[];
  productId: string | null;
  audience: string;
  restrictions: string[];
  mainStrategy: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalPlan {
  goalId: string;
  diagnostic: string;
  gap: number;
  recommendedStrategy: string;
  contentPillars: Array<{ name: string; weight: number; objective: ContentObjective }>;
  monthlyProduction: {
    reels: number;
    carousels: number;
    flyers: number;
    proofPosts: number;
    communityPosts: number;
    softSalesPosts: number;
  };
  priorityIdeas: string[];
  scriptsToRecord: string[];
  suggestedCalendar: string[];
  kpis: string[];
  risks: string[];
  updatedAt: string;
}

export interface SocialPostMetric {
  id: string;
  businessId: string;
  competitorProfileId: string | null;
  redSocial: SocialPlatform;
  cuenta: string;
  urlPost: string;
  fechaPublicacion: string;
  tipoContenido: string;
  duracionVideo: number;
  likes: number;
  comentarios: number;
  shares: number;
  views: number;
  engagementRate: number;
  hookTextual: string;
  hookVerbal: string;
  hookVisual: string;
  categoriaHook: HookCategory;
  formatoDetectado: DetectedFormat;
  tema: string;
  cta: string;
  scoreViralidad: number;
  provider: SocialDataProvider;
  raw: Record<string, unknown>;
  createdAt: string;
}

export interface SocialMetricSummary {
  comentariosPromedio: number;
  likesPromedio: number;
  formatoGanador: string;
  hookDominante: HookCategory;
  formatosVigilar: string[];
  topPostIds: string[];
  updatedAt: string;
}

export interface ResearchInsight {
  id: string;
  businessId: string;
  source: "own_content" | "competitor" | "internet" | "erex";
  title: string;
  summary: string;
  recommendation: string;
  confidence: number;
  createdAt: string;
}

export interface VideoGenerationSettings {
  subject: string;
  script: string;
  searchTerms: string[];
  aspect: VideoAspect;
  source: VideoSource;
  voiceName: string;
  voiceRate: number;
  voiceVolume: number;
  bgmType: "random" | "none" | "custom";
  bgmVolume: number;
  subtitleEnabled: boolean;
  subtitlePosition: "top" | "center" | "bottom" | "custom";
  fontSize: number;
  clipDuration: number;
  videoCount: number;
  materialUrls: string[];
}

export interface VideoGenerationTask {
  taskId: string;
  provider: "moneyprinter" | "local_blueprint";
  status: VideoTaskStatus;
  progress: number;
  videos: string[];
  combinedVideos: string[];
  endpoint: string;
  logs: string[];
  createdAt: string;
  updatedAt: string;
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
  goals: StrategicGoal[];
  goalPlans: GoalPlan[];
  activeGoalId: string | null;
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
  competitorProfiles: CompetitorProfile[];
  socialPostMetrics: SocialPostMetric[];
  socialMetricSummary: SocialMetricSummary;
  researchInsights: ResearchInsight[];
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
