export type EpochUnknown = { id: string; statement: string; importance: "low" | "medium" | "high"; impact: "low" | "medium" | "high"; uncertainty: number; costToResolve: number; status: "OPEN" | "RESOLVED" | "IGNORED" };
export type EpochHypothesis = { id: string; statement: string; priorConfidence: number; supportingEvidenceIds: string[]; contradictingEvidenceIds: string[]; status: "UNTESTED" | "SUPPORTED" | "REJECTED" | "UNCERTAIN" | "CONFIRMED" };
export type EpochCapabilityGap = { id: string; capability: string; reason: string; severity: "low" | "medium" | "high"; status: "OPEN" | "CLOSED" };
export type EpochDiscoveryAction = { id: string; kind: "observe" | "benchmark" | "experiment" | "ask_user" | "rediscover"; target: string; priority: number; rationale: string; resolvesUnknownIds: string[]; risk: "low" | "medium" | "high" };

export type EpochDiscoveryPlan = { version: "epoch_discovery_plan.v1"; trigger: "initial" | "drift" | "verification_failure" | "missing_evidence" | "runtime_failure"; unknowns: EpochUnknown[]; hypotheses: EpochHypothesis[]; capabilityGaps: EpochCapabilityGap[]; actions: EpochDiscoveryAction[]; rediscoveryRequired: boolean; createdAt: string };

function rank(importance: string, impact: string, uncertainty: number, cost: number): number { const weight = (value: string) => value === "high" ? 3 : value === "medium" ? 2 : 1; return Number((weight(importance) * weight(impact) * Math.max(0, Math.min(1, uncertainty)) / Math.max(1, cost)).toFixed(4)); }

export function planEpochDiscovery(input: { trigger?: EpochDiscoveryPlan["trigger"]; unknowns?: EpochUnknown[]; hypotheses?: EpochHypothesis[]; capabilityGaps?: EpochCapabilityGap[]; failedStage?: string; failureReason?: string; now?: Date }): EpochDiscoveryPlan {
  const trigger = input.trigger ?? "initial";
  const unknowns = [...(input.unknowns ?? [])];
  if (input.failedStage && input.failureReason) unknowns.push({ id: `unknown-${input.failedStage}`, statement: `${input.failedStage}: ${input.failureReason}`, importance: "high", impact: "high", uncertainty: 1, costToResolve: 1, status: "OPEN" });
  const hypotheses = [...(input.hypotheses ?? [])];
  if (!hypotheses.length) hypotheses.push({ id: "hypothesis-runtime-fit", statement: "The selected runtime and hardware can meet the outcome under the measured workload.", priorConfidence: 0.5, supportingEvidenceIds: [], contradictingEvidenceIds: [], status: "UNTESTED" });
  const capabilityGaps = [...(input.capabilityGaps ?? [])];
  const actions: EpochDiscoveryAction[] = [];
  for (const unknown of unknowns.filter((item) => item.status === "OPEN")) {
    const priority = rank(unknown.importance, unknown.impact, unknown.uncertainty, unknown.costToResolve);
    const kind: EpochDiscoveryAction["kind"] = trigger === "drift" || trigger === "runtime_failure" ? "rediscover" : unknown.statement.toLowerCase().includes("quality") ? "benchmark" : unknown.statement.toLowerCase().includes("approval") || unknown.statement.toLowerCase().includes("license") ? "ask_user" : "observe";
    actions.push({ id: `action-${unknown.id}`, kind, target: unknown.statement, priority, rationale: `Resolve ${unknown.importance}-importance uncertainty with the lowest-risk available evidence`, resolvesUnknownIds: [unknown.id], risk: kind === "ask_user" ? "low" : kind === "benchmark" ? "medium" : "low" });
  }
  for (const gap of capabilityGaps.filter((item) => item.status === "OPEN")) actions.push({ id: `action-gap-${gap.id}`, kind: "experiment", target: gap.capability, priority: gap.severity === "high" ? 3 : gap.severity === "medium" ? 2 : 1, rationale: gap.reason, resolvesUnknownIds: [], risk: "medium" });
  if (!actions.length && trigger !== "initial") actions.push({ id: `action-rediscover-${trigger}`, kind: "rediscover", target: "world-model", priority: 3, rationale: `Start a fresh discovery cycle after ${trigger}`, resolvesUnknownIds: [], risk: "low" });
  actions.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  return { version: "epoch_discovery_plan.v1", trigger, unknowns, hypotheses, capabilityGaps, actions, rediscoveryRequired: trigger !== "initial" || actions.some((action) => action.kind === "rediscover"), createdAt: (input.now ?? new Date()).toISOString() };
}
