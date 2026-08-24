import { randomUUID } from "node:crypto";
import { assertFreshState, type AuthorityGrant, type Execution, type Policy, type StateSnapshot } from "./contracts";

export type ExecutionGuardInput = {
  action: string;
  targetResourceId: string;
  policy: Pick<Policy, "decision" | "permissions" | "restrictions" | "budgetCents">;
  authority: Pick<AuthorityGrant, "id" | "actionTypes" | "resourceIds" | "expiresAt" | "status">;
  state: Pick<StateSnapshot, "freshness">;
  now?: Date;
};

export type ExecutionGuardResult = {
  status: "allowed" | "approval_required" | "blocked";
  reasons: string[];
};

export function evaluateExecutionGuard(input: ExecutionGuardInput): ExecutionGuardResult {
  const reasons: string[] = [];
  try {
    assertFreshState(input.state);
  } catch {
    reasons.push("state is stale or unknown");
  }
  if (input.policy.decision === "deny") reasons.push("policy denies this action");
  if (!input.policy.permissions.includes(input.action) && !input.policy.permissions.includes("*")) reasons.push("policy does not grant this action");
  if (input.authority.status !== "active") reasons.push("authority grant is not active");
  if (!input.authority.actionTypes.includes(input.action) && !input.authority.actionTypes.includes("*")) reasons.push("authority grant does not cover this action");
  if (!input.authority.resourceIds.includes(input.targetResourceId) && !input.authority.resourceIds.includes("*")) reasons.push("authority grant does not cover this target");
  if (input.authority.expiresAt && Date.parse(input.authority.expiresAt) <= (input.now ?? new Date()).getTime()) reasons.push("authority grant has expired");
  if (input.policy.restrictions.some((restriction) => restriction === input.action || restriction === "*")) reasons.push("policy restriction blocks this action");
  if (reasons.length) return { status: "blocked", reasons };
  if (input.policy.decision === "approval") return { status: "approval_required", reasons: ["policy requires human approval"] };
  return { status: "allowed", reasons: [] };
}

export function prepareCanonicalExecution(input: {
  workspaceId: string;
  missionId: string;
  action: string;
  target: Record<string, unknown>;
  authorityGrant: AuthorityGrant;
  policy: Policy;
  state: StateSnapshot;
  preconditions?: Array<Record<string, unknown>>;
  expectedPostconditions?: Array<Record<string, unknown>>;
  rollback?: Record<string, unknown>;
  timeoutSeconds?: number;
  evidenceRequirements?: string[];
  risk?: Execution["risk"];
  correlationId: string;
  traceId: string;
  now?: Date;
}): { execution: Execution | null; guard: ExecutionGuardResult } {
  const targetResourceId = typeof input.target.resourceId === "string" ? input.target.resourceId : "*";
  const guard = evaluateExecutionGuard({ action: input.action, targetResourceId, policy: input.policy, authority: input.authorityGrant, state: input.state, now: input.now });
  if (guard.status === "blocked") return { execution: null, guard };
  const timestamp = (input.now ?? new Date()).toISOString();
  const execution: Execution = {
    contractVersion: "epoch.canonical.v1",
    id: `execution_${randomUUID()}`,
    workspaceId: input.workspaceId,
    createdAt: timestamp,
    updatedAt: timestamp,
    correlation: { correlationId: input.correlationId, traceId: input.traceId },
    missionId: input.missionId,
    action: input.action,
    target: input.target,
    authorityGrantId: input.authorityGrant.id,
    preconditions: input.preconditions ?? [],
    expectedPostconditions: input.expectedPostconditions ?? [],
    rollback: input.rollback ?? {},
    timeoutSeconds: Math.max(1, Math.min(86_400, Math.floor(input.timeoutSeconds ?? 900))),
    evidenceRequirements: input.evidenceRequirements ?? ["execution_record", "postcondition_observation", "independent_verification"],
    risk: input.risk ?? "medium",
    state: guard.status === "approval_required" ? "prepared" : "approved",
  };
  return { execution, guard };
}
