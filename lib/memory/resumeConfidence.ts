import type { RetrievalDebugItem } from "./retrieveRelevantMemory";

export type ResumeConfidenceMemorySignal = {
  finalScore: number;
  recencyScore?: number;
  updatedAt?: string;
};

export type ResumeConfidenceFactor = {
  label: string;
  weight: number;
  contribution: number;
};

export type ResumeConfidenceScore = {
  score: number;
  factors: ResumeConfidenceFactor[];
};

export type ResumeConfidenceInput = {
  usedMemories: ResumeConfidenceMemorySignal[];
  retrievalDebug: RetrievalDebugItem[];
  populatedSectionCount: number;
  totalSectionCount: number;
  githubSignalCount: number;
  executionTraceCount: number;
  /** Recent operational loop completions (P2.1) boost continuity confidence. */
  recentLoopCompletions?: number;
  /** Unresolved high-severity execution drift (P2.2) lowers resume confidence. */
  unresolvedHighDrift?: boolean;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ageFreshnessScore(updatedAt: string | undefined): number {
  if (!updatedAt) return 0;
  const ms = Date.parse(updatedAt);
  if (!Number.isFinite(ms)) return 0;
  const ageHours = (Date.now() - ms) / (1000 * 60 * 60);
  if (ageHours <= 24) return 1;
  if (ageHours <= 72) return 0.75;
  if (ageHours <= 168) return 0.5;
  if (ageHours <= 720) return 0.25;
  return 0.1;
}

export function computeResumeConfidence(input: ResumeConfidenceInput): ResumeConfidenceScore {
  const factors: ResumeConfidenceFactor[] = [];

  const retrievalScores = input.usedMemories.map((memory) => memory.finalScore);
  const retrievalQuality = average(retrievalScores);
  const retrievalWeight = 30;
  factors.push({
    label: "Retrieval match quality",
    weight: retrievalWeight,
    contribution: Number((retrievalQuality * retrievalWeight).toFixed(2)),
  });

  const recencyFromDebug = input.retrievalDebug.map((item) => item.recencyScore);
  const recencyFromMemories = input.usedMemories.map((memory) => memory.recencyScore ?? 0);
  const recencyFromAge = input.usedMemories.map((memory) => ageFreshnessScore(memory.updatedAt));
  const memoryFreshness = average([
    ...recencyFromDebug,
    ...recencyFromMemories,
    ...recencyFromAge,
  ]);
  const freshnessWeight = 25;
  factors.push({
    label: "Memory freshness",
    weight: freshnessWeight,
    contribution: Number((memoryFreshness * freshnessWeight).toFixed(2)),
  });

  const continuityBoosts = input.retrievalDebug.map((item) => item.continuityBoost);
  const continuityMatch = average(continuityBoosts);
  const continuityWeight = 20;
  factors.push({
    label: "Continuity scope match",
    weight: continuityWeight,
    contribution: Number((continuityMatch * continuityWeight).toFixed(2)),
  });

  const coverageRatio =
    input.totalSectionCount > 0
      ? input.populatedSectionCount / input.totalSectionCount
      : 0;
  const operationalWeight = 15;
  factors.push({
    label: "Operational section coverage",
    weight: operationalWeight,
    contribution: Number((coverageRatio * operationalWeight).toFixed(2)),
  });

  const githubActivity =
    input.githubSignalCount > 0 ? Math.min(1, input.githubSignalCount / 3) : 0;
  const executionActivity =
    input.executionTraceCount > 0 ? Math.min(1, input.executionTraceCount / 2) : 0;
  const loopCompletionActivity =
    (input.recentLoopCompletions ?? 0) > 0
      ? Math.min(1, (input.recentLoopCompletions ?? 0) / 2)
      : 0;
  const activityBlend = Math.max(
    githubActivity,
    executionActivity * 0.85,
    loopCompletionActivity * 0.9,
  );
  const activityWeight = 10;
  factors.push({
    label: "GitHub / execution activity",
    weight: activityWeight,
    contribution: Number((activityBlend * activityWeight).toFixed(2)),
  });

  const rawScore = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  const memoryPenalty = input.usedMemories.length === 0 ? 0.35 : 1;
  let score = rawScore * memoryPenalty;

  if (input.unresolvedHighDrift) {
    const driftPenalty = 18;
    factors.push({
      label: "Unresolved execution drift",
      weight: driftPenalty,
      contribution: -driftPenalty,
    });
    score -= driftPenalty;
  }

  return {
    score: clampScore(score),
    factors,
  };
}
