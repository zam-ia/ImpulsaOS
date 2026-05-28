import { evaluateAsset } from "@/lib/qa";
import type { QaInput } from "@/lib/validators/qa.schemas";

export function runQa(input: QaInput) {
  const qa = evaluateAsset({
    copy: [input.content.title, input.content.body, input.content.cta].filter(Boolean).join("\n")
  });

  return {
    score: qa.score,
    status: qa.blockers.length > 0 ? "blocked" : qa.needsReview ? "needs_review" : "approved",
    flags: [
      ...qa.riskFlags.map((code) => ({
        code: code === "sin_cta" ? "MISSING_CTA" : code === "precio_revisar" ? "PRICE_MISMATCH" : "RISKY_CLAIM",
        severity: code === "precio_revisar" || code === "claim_riesgoso" ? "high" : "medium",
        message: code
      })),
      ...qa.blockers.map((message) => ({ code: "RISKY_CLAIM", severity: "high", message }))
    ],
    raw: qa
  };
}
