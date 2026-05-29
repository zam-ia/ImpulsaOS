import type { VideoAspect, VideoGenerationSettings, VideoGenerationTask, VideoSource } from "@/lib/types";
import type { CreateVideoInput } from "@/lib/validators/video.schemas";

function now() {
  return new Date().toISOString();
}

export function moneyPrinterAspect(aspect: VideoAspect) {
  if (aspect === "16:9") return "16:9";
  if (aspect === "1:1") return "1:1";
  return "9:16";
}

export function generateLocalScript(subject: string) {
  return [
    `Si estas intentando mejorar ${subject}, este error puede estar frenandote.`,
    "Primero identifica el problema real, no solo el sintoma visible.",
    "Luego convierte ese problema en una accion simple que tu audiencia pueda aplicar hoy.",
    "Finalmente muestra una prueba, ejemplo o comparacion para que el mensaje se sienta concreto.",
    "Si quieres que lo adaptemos a tu negocio, escribe INFO por WhatsApp."
  ].join("\n");
}

export function generateLocalTerms(subject: string, script: string) {
  const words = `${subject} ${script}`
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4);
  return Array.from(new Set([subject, ...words])).slice(0, 5);
}

export function toVideoSettings(input: CreateVideoInput): VideoGenerationSettings {
  const script = input.script.trim() || generateLocalScript(input.subject);
  const searchTerms = input.searchTerms.length > 0 ? input.searchTerms : generateLocalTerms(input.subject, script);

  return {
    subject: input.subject,
    script,
    searchTerms,
    aspect: input.aspect,
    source: input.source,
    voiceName: input.voiceName,
    voiceRate: input.voiceRate,
    voiceVolume: input.voiceVolume,
    bgmType: input.bgmType,
    bgmVolume: input.bgmVolume,
    subtitleEnabled: input.subtitleEnabled,
    subtitlePosition: input.subtitlePosition,
    fontSize: input.fontSize,
    clipDuration: input.clipDuration,
    videoCount: input.videoCount,
    materialUrls: input.materialUrls
  };
}

export function toMoneyPrinterPayload(settings: VideoGenerationSettings) {
  return {
    video_subject: settings.subject,
    video_script: settings.script,
    video_terms: settings.searchTerms,
    video_aspect: moneyPrinterAspect(settings.aspect),
    video_concat_mode: "random",
    video_transition_mode: "Shuffle",
    video_clip_duration: settings.clipDuration,
    video_count: settings.videoCount,
    video_source: settings.source === "manual" ? "local" : settings.source,
    video_materials:
      settings.source === "local" || settings.source === "manual"
        ? settings.materialUrls.map((url) => ({ provider: "local", url, duration: 0 }))
        : undefined,
    video_language: "es",
    voice_name: settings.voiceName,
    voice_volume: settings.voiceVolume,
    voice_rate: settings.voiceRate,
    bgm_type: settings.bgmType,
    bgm_volume: settings.bgmVolume,
    subtitle_enabled: settings.subtitleEnabled,
    subtitle_position: settings.subtitlePosition,
    font_size: settings.fontSize,
    text_fore_color: "#FFFFFF",
    stroke_color: "#000000",
    stroke_width: 1.5,
    n_threads: 2,
    paragraph_number: 1
  };
}

export function createLocalVideoTask(settings: VideoGenerationSettings): VideoGenerationTask {
  const timestamp = now();
  return {
    taskId: `local-video-${Date.now()}`,
    provider: "local_blueprint",
    status: "queued",
    progress: 18,
    videos: [],
    combinedVideos: [],
    endpoint: "local-blueprint",
    logs: [
      "Guion preparado",
      `Terminos visuales: ${settings.searchTerms.join(", ")}`,
      `Formato ${settings.aspect}, fuente ${settings.source}`,
      "Listo para enviar a MoneyPrinterTurbo cuando MONEYPRINTER_API_URL este configurado"
    ],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function normalizeMoneyPrinterTask(raw: unknown, endpoint: string): VideoGenerationTask {
  const data = typeof raw === "object" && raw !== null && "data" in raw ? (raw as { data?: unknown }).data : raw;
  const source = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  const state = Number(source.state ?? 0);
  const progress = Number(source.progress ?? 0);
  const timestamp = now();
  const videos = Array.isArray(source.videos) ? source.videos.filter((item): item is string => typeof item === "string") : [];
  const combinedVideos = Array.isArray(source.combined_videos)
    ? source.combined_videos.filter((item): item is string => typeof item === "string")
    : [];

  return {
    taskId: String(source.task_id ?? source.request_id ?? `moneyprinter-${Date.now()}`),
    provider: "moneyprinter",
    status: progress >= 100 || videos.length > 0 ? "completed" : state < 0 ? "failed" : "processing",
    progress,
    videos,
    combinedVideos,
    endpoint,
    logs: ["Respuesta recibida desde MoneyPrinterTurbo"],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function createMoneyPrinterVideo(input: CreateVideoInput): Promise<{
  settings: VideoGenerationSettings;
  task: VideoGenerationTask;
  payload: ReturnType<typeof toMoneyPrinterPayload>;
  mode: "moneyprinter" | "local_blueprint";
}> {
  const settings = toVideoSettings(input);
  const payload = toMoneyPrinterPayload(settings);
  const endpoint = process.env.MONEYPRINTER_API_URL?.replace(/\/$/, "");

  if (!endpoint) {
    return {
      settings,
      task: createLocalVideoTask(settings),
      payload,
      mode: "local_blueprint"
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-task-id": input.assetId ?? `impulsaos-${Date.now()}`
  };
  if (process.env.MONEYPRINTER_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.MONEYPRINTER_API_TOKEN}`;
  }

  const response = await fetch(`${endpoint}/api/v1/videos`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MoneyPrinterTurbo ${response.status}: ${text}`);
  }

  const result = await response.json();
  return {
    settings,
    task: normalizeMoneyPrinterTask(result, endpoint),
    payload,
    mode: "moneyprinter"
  };
}

export async function queryMoneyPrinterTask(taskId: string) {
  const endpoint = process.env.MONEYPRINTER_API_URL?.replace(/\/$/, "");
  if (!endpoint) {
    return {
      task: {
        taskId,
        provider: "local_blueprint",
        status: "queued",
        progress: 18,
        videos: [],
        combinedVideos: [],
        endpoint: "local-blueprint",
        logs: ["Sin MONEYPRINTER_API_URL; tarea en modo blueprint local"],
        createdAt: now(),
        updatedAt: now()
      } satisfies VideoGenerationTask
    };
  }

  const response = await fetch(`${endpoint}/api/v1/tasks/${encodeURIComponent(taskId)}`, {
    headers: process.env.MONEYPRINTER_API_TOKEN ? { Authorization: `Bearer ${process.env.MONEYPRINTER_API_TOKEN}` } : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MoneyPrinterTurbo task ${response.status}: ${text}`);
  }

  const result = await response.json();
  return { task: normalizeMoneyPrinterTask(result, endpoint) };
}

export const videoPipelineStages = [
  "Guion",
  "Terminos de busqueda",
  "Voz TTS",
  "Subtitulos",
  "Materiales",
  "Composicion",
  "Render HD",
  "Publicacion"
];
