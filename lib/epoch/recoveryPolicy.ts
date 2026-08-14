import { z } from "zod";

export const EpochRuntimeErrorKindSchema = z.enum([
  "transient",
  "rate_limited",
  "worker_lost",
  "provider_unavailable",
  "timeout",
  "policy_denied",
  "cancelled",
  "invalid_input",
  "not_found",
  "evidence_failed",
  "budget_exhausted",
  "deadline_exceeded",
  "unknown",
]);

export const EpochRecoveryActionSchema = z.enum([
  "retry",
  "resume",
  "fallback_worker",
  "fallback_provider",
  "escalate",
  "fail",
]);

export type EpochRuntimeErrorKind = z.infer<typeof EpochRuntimeErrorKindSchema>;
export type EpochRecoveryAction = z.infer<typeof EpochRecoveryActionSchema>;

export type EpochRecoveryPolicy = {
  maxAttempts: number;
  maxElapsedMs?: number;
  maxBudgetCents?: number;
  allowFallbackWorker: boolean;
  allowFallbackProvider: boolean;
  allowHumanEscalation: boolean;
};

export type EpochRecoveryDecision = {
  action: EpochRecoveryAction;
  kind: EpochRuntimeErrorKind;
  retryable: boolean;
  reason: string;
};

const ERROR_PATTERNS: Array<{ kind: EpochRuntimeErrorKind; patterns: string[] }> = [
  { kind: "policy_denied", patterns: ["blocked_by_policy", "authority", "approval_required", "policy_denied"] },
  { kind: "cancelled", patterns: ["cancelled", "canceled", "mission_cancelled"] },
  { kind: "budget_exhausted", patterns: ["budget_exhausted", "cost_budget_exhausted"] },
  { kind: "deadline_exceeded", patterns: ["deadline_exceeded", "time_budget_exhausted"] },
  { kind: "invalid_input", patterns: ["invalid", "malformed", "missing_mission"] },
  { kind: "not_found", patterns: ["not_found", "not found"] },
  { kind: "rate_limited", patterns: ["rate_limit", "rate limited", "429"] },
  { kind: "provider_unavailable", patterns: ["provider_unavailable", "provider_failed", "upstream", "503"] },
  { kind: "worker_lost", patterns: ["worker_lost", "worker_offline", "stale_fencing", "lease_expired"] },
  { kind: "timeout", patterns: ["timeout", "timed_out", "deadline"] },
  { kind: "evidence_failed", patterns: ["evidence_failed", "verification_failed", "certificate_failed"] },
  { kind: "transient", patterns: ["temporarily", "connection", "network", "busy", "deadlock"] },
];

export function classifyEpochRuntimeError(error: string): EpochRuntimeErrorKind {
  const normalized = error.trim().toLowerCase();
  return ERROR_PATTERNS.find(({ patterns }) => patterns.some((pattern) => normalized.includes(pattern)))?.kind ?? "unknown";
}

export function decideEpochRecovery(input: {
  error: string;
  attempt: number;
  elapsedMs?: number;
  spentCents?: number;
  policy?: Partial<EpochRecoveryPolicy>;
}): EpochRecoveryDecision {
  const policy: EpochRecoveryPolicy = {
    maxAttempts: Math.max(0, Math.floor(input.policy?.maxAttempts ?? 3)),
    maxElapsedMs: input.policy?.maxElapsedMs,
    maxBudgetCents: input.policy?.maxBudgetCents,
    allowFallbackWorker: input.policy?.allowFallbackWorker ?? true,
    allowFallbackProvider: input.policy?.allowFallbackProvider ?? true,
    allowHumanEscalation: input.policy?.allowHumanEscalation ?? true,
  };
  const kind = classifyEpochRuntimeError(input.error);
  const exhaustedAttempts = input.attempt >= policy.maxAttempts;
  const exhaustedTime = policy.maxElapsedMs !== undefined && (input.elapsedMs ?? 0) >= policy.maxElapsedMs;
  const exhaustedBudget = policy.maxBudgetCents !== undefined && (input.spentCents ?? 0) >= policy.maxBudgetCents;

  if (kind === "policy_denied" || kind === "cancelled" || kind === "invalid_input" || kind === "not_found" || kind === "budget_exhausted" || kind === "deadline_exceeded") {
    return { action: kind === "policy_denied" && policy.allowHumanEscalation ? "escalate" : "fail", kind, retryable: false, reason: `${kind}_is_not_retryable` };
  }
  if (exhaustedAttempts || exhaustedTime || exhaustedBudget) {
    return { action: policy.allowHumanEscalation ? "escalate" : "fail", kind, retryable: false, reason: exhaustedAttempts ? "attempt_budget_exhausted" : exhaustedTime ? "time_budget_exhausted" : "cost_budget_exhausted" };
  }
  if (kind === "worker_lost" && policy.allowFallbackWorker) return { action: "fallback_worker", kind, retryable: true, reason: "worker_failure_requires_alternative_worker" };
  if ((kind === "provider_unavailable" || kind === "rate_limited") && policy.allowFallbackProvider) return { action: "fallback_provider", kind, retryable: true, reason: "provider_failure_requires_allowed_fallback" };
  if (kind === "timeout" || kind === "transient" || kind === "evidence_failed" || kind === "unknown") return { action: "retry", kind, retryable: true, reason: `${kind}_may_be_recoverable` };
  return { action: "fail", kind, retryable: false, reason: "recovery_not_permitted" };
}

export function evaluateEpochMissionLimits(input: {
  budgetCents: number;
  spentCents: number;
  deadlineAt?: Date | string | null;
  now?: Date;
}): { allowed: boolean; reason?: "budget_exhausted" | "deadline_exceeded" } {
  if (input.budgetCents > 0 && input.spentCents >= input.budgetCents) return { allowed: false, reason: "budget_exhausted" };
  if (input.deadlineAt && (input.now ?? new Date()).getTime() >= new Date(input.deadlineAt).getTime()) return { allowed: false, reason: "deadline_exceeded" };
  return { allowed: true };
}
