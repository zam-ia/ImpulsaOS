import { generateSingleCopy, generateWeeklyPlan } from "@/lib/ai";
import { initialWorkspace } from "@/lib/seed";
import type { Channel, ContentObjective, WorkspaceState } from "@/lib/types";
import type { GenerateInput } from "@/lib/validators/ai.schemas";

export async function generateMarketingContent(input: GenerateInput & { workspace?: WorkspaceState }) {
  const workspace = input.workspace ?? initialWorkspace;
  const product = workspace.products.find((item) => item.id === input.productId) ?? workspace.products[0];
  const price = workspace.pricePlans.find((item) => item.productId === product?.id);

  if (input.promptType === "weekly_plan" || input.promptType === "content-plan") {
    return {
      provider: "mock",
      result: generateWeeklyPlan({
        business: workspace.business,
        brand: workspace.brand,
        products: workspace.products,
        pricePlans: workspace.pricePlans,
        pillars: workspace.pillars
      })
    };
  }

  if (!product) {
    return { provider: "mock", result: { items: [] } };
  }

  return {
    provider: "mock",
    result: generateSingleCopy({
      business: workspace.business,
      brand: workspace.brand,
      product,
      price,
      objective: (input.objective as ContentObjective) || "valor",
      channel: ((input.channel === "instagram_feed" ? "instagram_post" : input.channel) as Channel) || "instagram_post"
    })
  };
}
