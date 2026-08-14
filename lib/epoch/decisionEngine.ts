export type EpochDecisionObjective = { metric: string; direction: "minimize" | "maximize"; weight: number };

export type EpochCandidateDecision = {
  candidateId: string;
  status: "PASS" | "FAIL" | "UNKNOWN";
  measurements: Record<string, unknown>;
  constraintResults?: Array<{ metric?: string; passed?: boolean; actual?: number | null; target?: number }>;
  quality?: { retentionPct?: number | null };
  economics?: { costPerRequest?: number | null };
};

export function rankEpochCandidates(input: {
  evaluations: EpochCandidateDecision[];
  objectives?: EpochDecisionObjective[];
  now?: Date;
}) {
  const objectives = (input.objectives ?? [
    { metric: "quality", direction: "maximize" as const, weight: 0.5 },
    { metric: "p99", direction: "minimize" as const, weight: 0.3 },
    { metric: "costPerRequest", direction: "minimize" as const, weight: 0.2 },
  ]).filter((objective) => Number.isFinite(objective.weight) && objective.weight > 0);
  const totalWeight = objectives.reduce((sum, objective) => sum + objective.weight, 0) || 1;
  const eligible = input.evaluations.filter((evaluation) => evaluation.status === "PASS" && (evaluation.constraintResults ?? []).every((constraint) => constraint.passed === true));
  const values = (evaluation: EpochCandidateDecision, metric: string): number | null => {
    if (metric === "quality") return typeof evaluation.quality?.retentionPct === "number" ? evaluation.quality.retentionPct : null;
    if (metric === "costPerRequest") return typeof evaluation.economics?.costPerRequest === "number" ? evaluation.economics.costPerRequest : null;
    const value = evaluation.measurements[metric];
    return typeof value === "number" ? value : Number(value);
  };
  const ranked = eligible.map((evaluation) => {
    let score = 0;
    const reasons: string[] = [];
    for (const objective of objectives) {
      const actual = values(evaluation, objective.metric);
      const peerValues = eligible.map((peer) => values(peer, objective.metric)).filter((value): value is number => value !== null && Number.isFinite(value));
      if (actual === null || peerValues.length === 0) continue;
      const best = objective.direction === "maximize" ? Math.max(...peerValues) : Math.min(...peerValues);
      const worst = objective.direction === "maximize" ? Math.min(...peerValues) : Math.max(...peerValues);
      const normalized = best === worst ? 1 : objective.direction === "maximize" ? (actual - worst) / (best - worst) : (worst - actual) / (worst - best);
      score += (normalized * objective.weight) / totalWeight;
      reasons.push(`${objective.metric}=${actual}`);
    }
    return { candidateId: evaluation.candidateId, score, reasons, status: evaluation.status };
  }).sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId));
  const winner = ranked[0] ?? null;
  const rejected = input.evaluations.filter((evaluation) => !eligible.includes(evaluation)).map((evaluation) => ({
    candidateId: evaluation.candidateId,
    reason: evaluation.status === "UNKNOWN" ? "candidate evidence is incomplete" : "candidate failed one or more hard constraints",
  }));
  return {
    version: "epoch_decision.v1",
    status: winner ? "DECIDED" : input.evaluations.some((evaluation) => evaluation.status === "UNKNOWN") ? "UNCERTAIN" : "NO_ELIGIBLE_CANDIDATE",
    winner,
    ranked,
    rejected,
    objectives,
    explanation: winner ? `Candidate ${winner.candidateId} won with the highest weighted score among measured candidates that passed all hard constraints.` : "No candidate can be selected until a measured candidate passes all hard constraints.",
    decidedAt: (input.now ?? new Date()).toISOString(),
  };
}
