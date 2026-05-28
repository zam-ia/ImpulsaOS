import { renderDesignSvg } from "@/lib/design";
import { initialWorkspace } from "@/lib/seed";
import type { ContentAsset, ContentIdea, Product } from "@/lib/types";
import type { RenderInput } from "@/lib/validators/design.schemas";

export function renderDesign(input: RenderInput) {
  const fallbackAsset: ContentAsset = {
    id: input.assetId ?? "asset_preview",
    ideaId: "idea_preview",
    productId: initialWorkspace.products[0]?.id ?? null,
    assetType: "design",
    channel: "instagram_post",
    title: input.slots?.headline ?? "Contenido listo",
    copy: `${input.slots?.subtitle ?? ""}\n${input.slots?.cta ?? "Escribeme por WhatsApp"}`,
    script: "",
    designTemplateId: input.templateId === "post_square_v1" ? "post_square_clean_v1" : input.templateId,
    designSvg: "",
    prompt: "",
    qa: { score: 86, riskFlags: [], qaNotes: [], needsReview: false, blockers: [] },
    status: "needs_review",
    createdAt: new Date().toISOString()
  };

  const asset = (input.asset as ContentAsset | undefined) ?? fallbackAsset;
  const svg = renderDesignSvg({
    business: initialWorkspace.business,
    brand: initialWorkspace.brand,
    asset,
    idea: (input.idea as ContentIdea | undefined) ?? null,
    product: (input.product as Product | undefined) ?? initialWorkspace.products[0] ?? null,
    templateId: input.templateId === "post_square_v1" ? "post_square_clean_v1" : input.templateId
  });

  return {
    svg,
    storagePath: `demo/${asset.id}.svg`,
    publicUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width: input.format === "1080x1920" ? 1080 : 1080,
    height: input.format === "1080x1920" ? 1920 : 1080
  };
}
