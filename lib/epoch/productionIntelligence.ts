import { createHash } from "node:crypto";

const SECRET_PATTERNS: readonly RegExp[] = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:api[_ -]?key|secret|password|token)\s*[:=]\s*[^\s,;]+/gi,
  /\bsk-[A-Za-z0-9_-]{12,}/g,
  /\b(?:AKIA|ASIA)[A-Z0-9]{12,}/g,
];

export function redactEpochProductionText(value: string): string {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), value).slice(0, 100_000);
}

export type EpochProductionSignal = "exception" | "retry_burst" | "user_correction" | "abandonment" | "long_conversation" | "negative_feedback" | "human_intervention" | "repeated_question" | "setup_friction" | "support_escalation" | "churn_risk" | "conversion_dropoff" | "human_edit";
export type EpochProductionInteraction = {
  id: string;
  workspaceId: string;
  missionId: string;
  executionId?: string;
  workerId?: string;
  input: string;
  output: string;
  latencyMs: number;
  toolFailures: number;
  retries: number;
  userFeedback?: "positive" | "negative";
  turns: number;
  abandoned: boolean;
  repeatedQuestionCount?: number;
  setupStep?: string;
  supportEscalated?: boolean;
  conversionDropped?: boolean;
  humanEdited?: boolean;
  capturedAt: string;
  failureScore: number;
  signals: EpochProductionSignal[];
  fingerprint: string;
};
export type EpochFailureCluster = { id: string; workspaceId: string; fingerprint: string; interactionIds: string[]; count: number; averageFailureScore: number; likelyCause?: string; status: "open" | "reviewed" | "resolved" };
export type EpochRegressionDraft = { id: string; workspaceId: string; clusterId: string; input: string; expected: string; verification: string; status: "draft" | "approved" | "rejected"; createdAt: string };
export type EpochFailureSignal = { id: string; workspaceId: string; interactionId: string; missionId: string; kind: EpochProductionSignal; severity: "low" | "medium" | "high"; score: number; evidence: Record<string, unknown>; createdAt: string };
export type EpochRootCauseRecord = { id: string; workspaceId: string; clusterId: string; hypothesis: string; confidence: number; evidence: Record<string, unknown>; status: "draft" | "reviewed" | "rejected"; createdAt: string; reviewedAt?: string; reviewedBy?: string };
export type EpochRegressionEvaluation = EpochRegressionDraft & { approvedBy?: string; approvedAt?: string };
export type EpochReplaySession = { id: string; workspaceId: string; missionId: string; sourceRunId?: string; variant: Record<string, unknown>; status: "created" | "running" | "completed" | "failed"; createdAt: string; completedAt?: string };
export type EpochReplayResult = { id: string; workspaceId: string; replaySessionId: string; baseline: Record<string, unknown>; candidate: Record<string, unknown>; comparison: Record<string, unknown>; status: "pass" | "fail" | "unknown"; createdAt: string };
export type EpochFixProposal = { id: string; workspaceId: string; clusterId: string; proposedBy?: string; kind: "prompt" | "tool" | "memory" | "policy" | "recovery"; proposal: string; risk: "low" | "medium" | "high"; rollback: string; status: "draft" | "approved" | "rejected"; createdAt: string; approvedAt?: string; approvedBy?: string };
export type EpochReliabilityMetric = { id: string; workspaceId: string; workerId?: string; windowStart: string; windowEnd: string; sampleSize: number; successRate: number; failureRate: number; recoveryRate: number; humanInterventionRate: number; confidence: number; createdAt: string };
export type EpochImprovementMetric = { id: string; workspaceId: string; clusterId: string; baseline: Record<string, number>; after: Record<string, number>; delta: Record<string, number>; verified: boolean; createdAt: string };

function signalFor(input: Omit<EpochProductionInteraction, "failureScore" | "signals" | "fingerprint" | "capturedAt">): EpochProductionSignal[] {
  const signals: EpochProductionSignal[] = [];
  if (input.toolFailures > 0) signals.push("exception");
  if (input.retries >= 3) signals.push("retry_burst");
  if (input.userFeedback === "negative") signals.push("negative_feedback");
  if (input.turns >= 20) signals.push("long_conversation");
  if (input.abandoned) signals.push("abandonment");
  if (input.userFeedback === "negative" && input.output !== input.input) signals.push("user_correction");
  if (input.workerId && input.toolFailures > 0) signals.push("human_intervention");
  if ((input.repeatedQuestionCount ?? 0) >= 2) signals.push("repeated_question");
  if (input.setupStep && (input.abandoned || input.retries >= 2 || input.turns >= 8)) signals.push("setup_friction");
  if (input.supportEscalated) signals.push("support_escalation");
  if (input.abandoned || input.conversionDropped) signals.push("churn_risk");
  if (input.conversionDropped) signals.push("conversion_dropoff");
  if (input.humanEdited) signals.push("human_edit");
  return [...new Set(signals)];
}

export function captureEpochProductionInteraction(input: Omit<EpochProductionInteraction, "failureScore" | "signals" | "fingerprint" | "capturedAt"> & { capturedAt?: string }): EpochProductionInteraction {
  if (!input.id || !input.workspaceId || !input.missionId) throw new Error("epoch_production_interaction_scope_required");
  const sanitized = { ...input, input: redactEpochProductionText(input.input), output: redactEpochProductionText(input.output) };
  const signals = signalFor(sanitized);
  const failureScore = Math.min(100, signals.length * 12 + Math.min(25, input.toolFailures * 10) + Math.min(20, input.retries * 5) + (input.latencyMs > 10_000 ? 10 : 0) + (input.conversionDropped ? 10 : 0));
  const fingerprint = createHash("sha256").update(JSON.stringify({ signals, workerId: sanitized.workerId ?? "unknown", input: sanitized.input.trim().toLowerCase() })).digest("hex").slice(0, 24);
  return { ...sanitized, capturedAt: input.capturedAt ?? new Date().toISOString(), failureScore, signals, fingerprint };
}

export function clusterEpochProductionFailures(interactions: EpochProductionInteraction[], workspaceId: string): EpochFailureCluster[] {
  const groups = new Map<string, EpochProductionInteraction[]>();
  for (const interaction of interactions.filter((item) => item.workspaceId === workspaceId && item.failureScore > 0)) groups.set(interaction.fingerprint, [...(groups.get(interaction.fingerprint) ?? []), interaction]);
  return [...groups.entries()].map(([fingerprint, items]) => ({ id: `cluster_${fingerprint}`, workspaceId, fingerprint, interactionIds: items.map((item) => item.id), count: items.length, averageFailureScore: Math.round(items.reduce((sum, item) => sum + item.failureScore, 0) / items.length), status: "open" as const }));
}

export function createEpochRegressionDraft(input: { id: string; workspaceId: string; clusterId: string; interaction: EpochProductionInteraction; expected: string; verification: string; now?: Date }): EpochRegressionDraft {
  if (input.interaction.workspaceId !== input.workspaceId) throw new Error("epoch_regression_workspace_mismatch");
  return { id: input.id, workspaceId: input.workspaceId, clusterId: input.clusterId, input: input.interaction.input, expected: input.expected, verification: input.verification, status: "draft", createdAt: (input.now ?? new Date()).toISOString() };
}

export function buildEpochFailureSignals(interaction: EpochProductionInteraction, now = new Date()): EpochFailureSignal[] {
  return interaction.signals.map((kind, index) => ({ id: `${interaction.id}_signal_${index + 1}`, workspaceId: interaction.workspaceId, interactionId: interaction.id, missionId: interaction.missionId, kind, severity: interaction.failureScore >= 70 ? "high" : interaction.failureScore >= 35 ? "medium" : "low", score: Math.max(1, Math.round(interaction.failureScore / Math.max(1, interaction.signals.length))), evidence: { latencyMs: interaction.latencyMs, retries: interaction.retries, toolFailures: interaction.toolFailures, turns: interaction.turns }, createdAt: now.toISOString() }));
}

export function buildEpochRootCauseRecord(input: { id: string; workspaceId: string; cluster: EpochFailureCluster; signals: EpochFailureSignal[]; now?: Date }): EpochRootCauseRecord {
  const dominant = input.signals[0]?.kind ?? "exception";
  const hypothesis = dominant === "exception" ? "The worker or tool boundary produced an unsuccessful production result." : `The interaction shows a recurring ${dominant.replace(/_/g, " ")} pattern.`;
  return { id: input.id, workspaceId: input.workspaceId, clusterId: input.cluster.id, hypothesis, confidence: Math.min(95, 50 + Math.min(40, input.cluster.count * 5)), evidence: { signalCount: input.signals.length, interactionIds: input.cluster.interactionIds }, status: "draft", createdAt: (input.now ?? new Date()).toISOString() };
}

export function createEpochReplaySession(input: { id: string; workspaceId: string; missionId: string; sourceRunId?: string; variant: Record<string, unknown>; now?: Date }): EpochReplaySession {
  if (!input.id || !input.workspaceId || !input.missionId) throw new Error("epoch_replay_scope_required");
  return { id: input.id, workspaceId: input.workspaceId, missionId: input.missionId, sourceRunId: input.sourceRunId, variant: structuredClone(input.variant), status: "created", createdAt: (input.now ?? new Date()).toISOString() };
}

export function compareEpochReplay(input: { id: string; workspaceId: string; replaySessionId: string; baseline: Record<string, unknown>; candidate: Record<string, unknown>; now?: Date }): EpochReplayResult {
  const baselineScore = typeof input.baseline.score === "number" ? input.baseline.score : 0;
  const candidateScore = typeof input.candidate.score === "number" ? input.candidate.score : 0;
  return { id: input.id, workspaceId: input.workspaceId, replaySessionId: input.replaySessionId, baseline: structuredClone(input.baseline), candidate: structuredClone(input.candidate), comparison: { scoreDelta: candidateScore - baselineScore, improved: candidateScore > baselineScore }, status: candidateScore > baselineScore ? "pass" : candidateScore < baselineScore ? "fail" : "unknown", createdAt: (input.now ?? new Date()).toISOString() };
}

export function createEpochFixProposal(input: { id: string; workspaceId: string; clusterId: string; proposedBy?: string; kind: EpochFixProposal["kind"]; proposal: string; risk: EpochFixProposal["risk"]; rollback: string; now?: Date }): EpochFixProposal {
  if (!input.proposal || !input.rollback) throw new Error("epoch_fix_proposal_rollback_required");
  return { ...input, status: "draft", createdAt: (input.now ?? new Date()).toISOString() };
}

export function computeEpochReliabilityMetric(input: { id: string; workspaceId: string; workerId?: string; windowStart: Date; windowEnd: Date; sampleSize: number; successes: number; failures: number; recoveries: number; humanInterventions: number; now?: Date }): EpochReliabilityMetric {
  if (input.sampleSize <= 0) throw new Error("epoch_reliability_sample_required");
  const rate = (value: number) => Math.max(0, Math.min(1, value / input.sampleSize));
  return { id: input.id, workspaceId: input.workspaceId, workerId: input.workerId, windowStart: input.windowStart.toISOString(), windowEnd: input.windowEnd.toISOString(), sampleSize: input.sampleSize, successRate: rate(input.successes), failureRate: rate(input.failures), recoveryRate: rate(input.recoveries), humanInterventionRate: rate(input.humanInterventions), confidence: Math.min(0.99, 0.5 + Math.sqrt(input.sampleSize) / 20), createdAt: (input.now ?? new Date()).toISOString() };
}

export function verifyEpochImprovement(input: { id: string; workspaceId: string; clusterId: string; baseline: Record<string, number>; after: Record<string, number>; now?: Date }): EpochImprovementMetric {
  const keys = new Set([...Object.keys(input.baseline), ...Object.keys(input.after)]);
  const delta = Object.fromEntries([...keys].map((key) => [key, (input.after[key] ?? 0) - (input.baseline[key] ?? 0)]));
  return { id: input.id, workspaceId: input.workspaceId, clusterId: input.clusterId, baseline: { ...input.baseline }, after: { ...input.after }, delta, verified: typeof delta.failureRate !== "number" || delta.failureRate <= 0, createdAt: (input.now ?? new Date()).toISOString() };
}
