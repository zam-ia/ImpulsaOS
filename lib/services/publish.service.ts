import type { PublishInput } from "@/lib/validators/publish.schemas";

export async function publishToChannel(input: PublishInput) {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if ((input.channel === "facebook_page" || input.channel === "facebook") && pageToken && pageId) {
    const params = new URLSearchParams({
      message: input.caption,
      access_token: pageToken
    });
    if (input.image_url) params.set("url", input.image_url);

    const endpoint = input.image_url
      ? `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v21.0"}/${pageId}/photos`
      : `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v21.0"}/${pageId}/feed`;
    const response = await fetch(endpoint, { method: "POST", body: params });
    const result = await response.json();
    return { mode: "api", status: response.ok ? "published" : "failed", result };
  }

  return {
    mode: "manual",
    status: "needs_review",
    reason: "Faltan credenciales o permisos del canal. Se genera checklist manual.",
    checklist: ["Descargar pieza final", "Copiar caption aprobado", "Publicar en canal", "Marcar publicado en calendario"],
    payload: input
  };
}
