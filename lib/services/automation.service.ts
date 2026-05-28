import { generateWeeklyPlan } from "@/lib/ai";
import { initialWorkspace } from "@/lib/seed";

export async function runWeeklyAutomation() {
  const plan = generateWeeklyPlan({
    business: initialWorkspace.business,
    brand: initialWorkspace.brand,
    products: initialWorkspace.products,
    pricePlans: initialWorkspace.pricePlans,
    pillars: initialWorkspace.pillars
  });

  return {
    status: "ok",
    plan,
    nextActions: ["Revisar assets needs_review", "Renderizar disenos aprobados", "Publicar por canal conectado o checklist manual"]
  };
}
