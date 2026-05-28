import type { BrandProfile, Product, QaResult } from "@/lib/types";
import { clamp, formatMoney } from "@/lib/utils";

const riskyClaimWords = [
  "garantizado",
  "milagroso",
  "sin esfuerzo",
  "100%",
  "resultados inmediatos",
  "cura",
  "nunca falla"
];

export function evaluateAsset(input: {
  copy: string;
  hook?: string;
  cta?: string;
  product?: Product | null;
  priceText?: string;
  brand?: BrandProfile | null;
}): QaResult {
  const copy = input.copy.trim();
  const lower = copy.toLowerCase();
  const riskFlags: string[] = [];
  const qaNotes: string[] = [];
  const blockers: string[] = [];
  let score = 100;

  if (!copy) {
    blockers.push("La pieza no tiene texto.");
    score -= 45;
  }

  if (copy.length > 2200) {
    riskFlags.push("copy_largo");
    qaNotes.push("El copy supera una longitud práctica para revisión rápida.");
    score -= 8;
  }

  if (!/(whatsapp|mensaje|escr[ií]b|agenda|consulta|comenta|link)/i.test(copy)) {
    riskFlags.push("sin_cta");
    qaNotes.push("Falta una llamada a la acción clara.");
    score -= 12;
  }

  const riskyWords = riskyClaimWords.filter((word) => lower.includes(word));
  if (riskyWords.length > 0 && !input.product?.guarantee) {
    riskFlags.push("claim_riesgoso");
    blockers.push(`Revisar claims: ${riskyWords.join(", ")}.`);
    score -= 20;
  }

  if (input.product) {
    const benefitsUsed = input.product.benefits.some((benefit) =>
      lower.includes(benefit.toLowerCase().slice(0, Math.min(16, benefit.length)))
    );
    if (!benefitsUsed && input.product.benefits.length > 0) {
      qaNotes.push("El copy no aprovecha beneficios registrados del producto.");
      score -= 6;
    }
  }

  if (input.priceText && /\bs\/|\bpen|\$|\bprecio\b/i.test(copy) && !copy.includes(input.priceText)) {
    riskFlags.push("precio_revisar");
    qaNotes.push(`Si se menciona precio, debe coincidir con ${input.priceText}.`);
    score -= 10;
  }

  const forbidden = input.brand?.forbiddenWords.filter((word) => word && lower.includes(word.toLowerCase())) ?? [];
  if (forbidden.length > 0) {
    riskFlags.push("palabra_prohibida");
    blockers.push(`Evitar palabras prohibidas por marca: ${forbidden.join(", ")}.`);
    score -= 20;
  }

  if (input.hook && input.hook.length < 18) {
    qaNotes.push("El hook podría abrir mejor la brecha de curiosidad.");
    score -= 5;
  }

  if (!/[.?!]$/.test(copy.slice(-1))) {
    qaNotes.push("Revisar puntuación final antes de publicar.");
    score -= 3;
  }

  const finalScore = clamp(score, 0, 100);

  return {
    score: finalScore,
    riskFlags,
    qaNotes: qaNotes.length > 0 ? qaNotes : ["Pieza consistente con datos disponibles."],
    needsReview: blockers.length > 0 || finalScore < 78,
    blockers
  };
}

export function currentPriceText(product: Product | null | undefined, price?: { currency: string; regularPrice: number; promoPrice: number | null }): string {
  if (!product || !price) return "Precio por confirmar";
  return formatMoney(price.promoPrice ?? price.regularPrice, price.currency);
}
