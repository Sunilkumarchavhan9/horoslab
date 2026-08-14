import { evaluateEpochConstraints, type EpochMetricConstraint } from "./outcomeCompiler";

export function verifyEpochOutcome(input: {
  measurements: Record<string, unknown>;
  constraints: EpochMetricConstraint[];
  evidenceIds: string[];
  requiredWindowSeconds: number;
  observedWindowSeconds: number;
}) {
  const results = evaluateEpochConstraints(input.constraints, input.measurements);
  const missingMeasurements = results.filter((result) => result.actual === null).map((result) => result.metric);
  const windowSatisfied = input.observedWindowSeconds >= input.requiredWindowSeconds;
  const evidenceSatisfied = input.evidenceIds.length > 0;
  const constraintsSatisfied = results.length > 0 && results.every((result) => result.passed);
  const unknown = missingMeasurements.length > 0 || !windowSatisfied || !evidenceSatisfied || input.constraints.length === 0;
  const status = unknown ? "UNKNOWN" : constraintsSatisfied ? "ACHIEVED" : "NOT_ACHIEVED";
  return {
    version: "epoch_outcome_verification.v1",
    status,
    verified: status === "ACHIEVED",
    constraints: results,
    missingMeasurements,
    evidenceSatisfied,
    windowSatisfied,
    requiredWindowSeconds: input.requiredWindowSeconds,
    observedWindowSeconds: input.observedWindowSeconds,
    evidenceIds: [...input.evidenceIds],
    nextAction: status === "ACHIEVED" ? "SETTLE" : status === "UNKNOWN" ? "OBSERVE_OR_REDISCOVER" : "REPLAN",
  } as const;
}
