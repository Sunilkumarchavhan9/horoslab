export type EpochExecutionPlan = {
  version: "epoch_execution_plan.v1";
  candidateId: string;
  authority: { required: true; status: "PENDING" };
  preflight: string[];
  rollback: { required: true; previousState: Record<string, unknown>; strategy: "restore_previous_configuration" };
  observation: { required: true; metrics: string[]; windowSeconds: number };
  status: "AWAITING_AUTHORITY";
  plannedAt: string;
};

export function buildEpochExecutionPlan(input: {
  candidateId: string;
  previousState?: Record<string, unknown>;
  observationMetrics?: string[];
  observationWindowSeconds?: number;
  now?: Date;
}): EpochExecutionPlan {
  return {
    version: "epoch_execution_plan.v1",
    candidateId: input.candidateId,
    authority: { required: true, status: "PENDING" },
    preflight: ["authority_policy", "planned_world_state_fresh", "candidate_compatibility", "budget", "rollback_available"],
    rollback: { required: true, previousState: { ...(input.previousState ?? {}) }, strategy: "restore_previous_configuration" },
    observation: {
      required: true,
      metrics: input.observationMetrics?.length ? [...new Set(input.observationMetrics)] : ["quality", "p95", "p99", "costPerRequest", "errorRate"],
      windowSeconds: Math.max(1, Math.min(2_592_000, Math.floor(input.observationWindowSeconds ?? 900))),
    },
    status: "AWAITING_AUTHORITY",
    plannedAt: (input.now ?? new Date()).toISOString(),
  };
}
