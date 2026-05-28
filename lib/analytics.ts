import type { WorkspaceState } from "@/lib/types";

export function computeAnalytics(state: WorkspaceState) {
  const published = state.publications.filter((publication) => publication.status === "published");
  const scheduled = state.publications.filter((publication) => publication.status === "scheduled");
  const review = state.assets.filter((asset) => asset.status === "needs_review");
  const won = state.leads.filter((lead) => lead.stage === "won");
  const hotLeads = state.leads.filter((lead) => lead.interestLevel >= 75 && !["won", "lost"].includes(lead.stage));
  const totalClicks = state.publications.reduce((sum, publication) => sum + publication.metrics.clicks, 0);
  const totalReach = state.publications.reduce((sum, publication) => sum + publication.metrics.reach, 0);
  const conversion = state.leads.length > 0 ? Math.round((won.length / state.leads.length) * 100) : 0;

  const objectiveScores = state.ideas.reduce<Record<string, { count: number; score: number }>>((acc, idea) => {
    const current = acc[idea.objective] ?? { count: 0, score: 0 };
    current.count += 1;
    current.score += idea.viralScore;
    acc[idea.objective] = current;
    return acc;
  }, {});

  const rankedObjectives = Object.entries(objectiveScores)
    .map(([objective, value]) => ({
      objective,
      count: value.count,
      score: Math.round(value.score / value.count)
    }))
    .sort((a, b) => b.score - a.score);

  return {
    published: published.length,
    scheduled: scheduled.length,
    review: review.length,
    leadCount: state.leads.length,
    hotLeadCount: hotLeads.length,
    wonCount: won.length,
    totalClicks,
    totalReach,
    conversion,
    rankedObjectives
  };
}
