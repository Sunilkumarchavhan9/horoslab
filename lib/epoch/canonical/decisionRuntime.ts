import { randomUUID } from "node:crypto";
import { DecisionSchema, type Decision, type OutcomeContract } from "./contracts";
import { persistCanonicalArtifact } from "./artifactStore";

export type CandidateEvaluation = {
  candidateId: string;
  measurements: Record<string, unknown>;
  evidenceIds?: string[];
  risk?: Decision["risk"];
  score?: number;
};

export type ConstraintResult = {
  metric: string;
  operator: string;
  target?: number;
  actual: number | null;
  passed: boolean | null;
  reason: string;
};

export type EvaluatedCandidate = CandidateEvaluation & {
  hardConstraints: ConstraintResult[];
  eligible: boolean;
  score: number;
};

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function evaluateConstraint(input: {
  metric: OutcomeContract["targetMetrics"][number];
  measurements: Record<string, unknown>;
  baseline: Record<string, unknown>;
}): ConstraintResult {
  const { metric, measurements, baseline } = input;
  const direct = numeric(measurements[metric.metric]);
  const baselineValue = numeric(baseline[metric.metric]);
  let actual = direct;
  let passed: boolean | null = null;
  let reason = "";
  if (metric.operator === "decrease" || metric.operator === "increase") {
    const explicit = numeric(measurements[`${metric.metric}ReductionPct`]) ?? numeric(measurements[`${metric.metric}ChangePct`]);
    const derived = explicit ?? (direct !== null && baselineValue !== null && baselineValue !== 0 ? ((baselineValue - direct) / baselineValue) * 100 : null);
    actual = derived;
    passed = derived === null || metric.target === undefined ? null : metric.operator === "decrease" ? derived >= metric.target : derived <= -metric.target;
    reason = derived === null ? "baseline or measurement is unknown" : `${metric.operator} target evaluated from percentage change`;
  } else if (metric.operator === "non_regression") {
    actual = direct;
    passed = direct === null || baselineValue === null ? null : direct >= baselineValue;
    reason = passed === null ? "baseline or measurement is unknown" : "measurement must not regress from baseline";
  } else {
    passed = direct === null || metric.target === undefined ? null : metric.operator === "lt" ? direct < metric.target : metric.operator === "lte" ? direct <= metric.target : metric.operator === "gte" ? direct >= metric.target : metric.operator === "gt" ? direct > metric.target : direct === metric.target;
    reason = direct === null ? "measurement is unknown" : "direct metric comparison";
  }
  return { metric: metric.metric, operator: metric.operator, ...(metric.target === undefined ? {} : { target: metric.target }), actual, passed, reason };
}

export function evaluateCanonicalCandidates(input: {
  outcome: OutcomeContract;
  candidates: CandidateEvaluation[];
}): EvaluatedCandidate[] {
  return input.candidates.map((candidate) => {
    const hardConstraints = input.outcome.targetMetrics.filter((metric) => metric.hard).map((metric) => evaluateConstraint({ metric, measurements: candidate.measurements, baseline: input.outcome.baseline }));
    const knownPasses = hardConstraints.filter((constraint) => constraint.passed === true).length;
    const unknowns = hardConstraints.filter((constraint) => constraint.passed === null).length;
    const failed = hardConstraints.some((constraint) => constraint.passed === false);
    return {
      ...candidate,
      hardConstraints,
      eligible: !failed && unknowns === 0,
      score: candidate.score ?? (knownPasses * 100) - (unknowns * 10) - (candidate.risk === "critical" ? 40 : candidate.risk === "high" ? 20 : candidate.risk === "medium" ? 5 : 0),
    };
  });
}

export function buildCanonicalDecision(input: {
  workspaceId: string;
  missionId: string;
  outcome: OutcomeContract;
  candidates: CandidateEvaluation[];
  assumptions?: string[];
  uncertainties?: string[];
  correlationId: string;
  traceId: string;
  now?: Date;
}): Decision {
  const evaluated = evaluateCanonicalCandidates({ outcome: input.outcome, candidates: input.candidates });
  const ordered = [...evaluated].sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId));
  const selected = ordered.find((candidate) => candidate.eligible);
  const alternatives = ordered.filter((candidate) => candidate.candidateId !== selected?.candidateId);
  const timestamp = (input.now ?? new Date()).toISOString();
  return DecisionSchema.parse({
    contractVersion: "epoch.canonical.v1",
    id: `decision_${randomUUID()}`,
    workspaceId: input.workspaceId,
    createdAt: timestamp,
    updatedAt: timestamp,
    correlation: { correlationId: input.correlationId, traceId: input.traceId },
    missionId: input.missionId,
    ...(selected ? { selectedCandidateId: selected.candidateId } : {}),
    alternativeCandidateIds: alternatives.map((candidate) => candidate.candidateId),
    whyAlternativesLost: alternatives.map((candidate) => ({
      candidateId: candidate.candidateId,
      reasons: candidate.eligible ? [`lower deterministic score (${candidate.score})`] : candidate.hardConstraints.filter((constraint) => constraint.passed !== true).map((constraint) => `${constraint.metric}: ${constraint.reason}`),
    })),
    assumptions: input.assumptions ?? [],
    uncertainties: input.uncertainties ?? evaluated.filter((candidate) => candidate.hardConstraints.some((constraint) => constraint.passed === null)).map((candidate) => candidate.candidateId),
    expectedOutcome: selected ? { candidateId: selected.candidateId, measurements: selected.measurements, score: selected.score } : { reason: "no eligible candidate" },
    risk: selected?.risk ?? "high",
    evidenceIds: evaluated.flatMap((candidate) => candidate.evidenceIds ?? []),
    status: "draft",
  });
}

export async function persistCanonicalDecision(input: Parameters<typeof buildCanonicalDecision>[0]) {
  const decision = buildCanonicalDecision(input);
  await persistCanonicalArtifact({
    workspaceId: input.workspaceId,
    objectType: "Decision",
    objectId: decision.id,
    missionId: input.missionId,
    parentId: decision.selectedCandidateId,
    payload: decision,
    provenance: { classification: "INFERRED", source: "canonical-decision-engine", candidateCount: input.candidates.length },
    correlationId: input.correlationId,
    traceId: input.traceId,
  });
  return decision;
}
