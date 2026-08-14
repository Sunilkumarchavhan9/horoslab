import { describe, expect, it } from "vitest";
import { checkpointEpochAgent, createEpochAgentSession, resumeEpochAgent } from "../lib/epoch/agentRuntime";
import { buildEpochRecoveryPlan, decideEpochToolCall } from "../lib/epoch/recoveryActions";
import { decideEpochRecovery, evaluateEpochMissionLimits } from "../lib/epoch/recoveryPolicy";

describe("Phase D recovery and policy acceptance gate", () => {
  it("selects governed fallbacks for worker and provider loss", () => {
    expect(decideEpochRecovery({ error: "worker_lost", attempt: 0 }).action).toBe("fallback_worker");
    expect(decideEpochRecovery({ error: "provider_unavailable", attempt: 0 }).action).toBe("fallback_provider");
    expect(decideEpochRecovery({ error: "provider_unavailable", attempt: 0, policy: { allowFallbackProvider: false } }).action).toBe("fail");
  });

  it("resumes an agent from its declared checkpoint", () => {
    const session = createEpochAgentSession({ id: "session-1", missionId: "mission-1", workerId: "worker-1", framework: "custom_worker" });
    const saved = checkpointEpochAgent({ session, state: { step: "execute", attempt: 1 }, toolCallIds: ["tool-1"] });
    const resumed = resumeEpochAgent({ session: saved.session, checkpoint: saved.checkpoint });
    expect(resumed.session.status).toBe("active");
    expect(resumed.state).toEqual({ step: "execute", attempt: 1 });
  });

  it("denies privileged or blocked tools before execution", () => {
    expect(decideEpochToolCall({ tool: "repo.write", permissions: ["tool.repo.write"] }).decision).toBe("review");
    expect(decideEpochToolCall({ tool: "repo.write", permissions: ["tool.repo.write"], approvalGranted: true }).decision).toBe("allow");
    expect(decideEpochToolCall({ tool: "shell.execute", permissions: ["tool.shell.execute"], blockedTools: ["shell.execute"], approvalGranted: true }).decision).toBe("deny");
  });

  it("stops recovery at attempt, time, and budget boundaries", () => {
    expect(decideEpochRecovery({ error: "temporary network failure", attempt: 3, policy: { maxAttempts: 3 } }).retryable).toBe(false);
    expect(decideEpochRecovery({ error: "temporary network failure", attempt: 0, elapsedMs: 100, policy: { maxElapsedMs: 100 } }).reason).toBe("time_budget_exhausted");
    expect(decideEpochRecovery({ error: "temporary network failure", attempt: 0, spentCents: 50, policy: { maxBudgetCents: 50 } }).reason).toBe("cost_budget_exhausted");
    expect(evaluateEpochMissionLimits({ budgetCents: 10, spentCents: 10 }).allowed).toBe(false);
  });

  it("requires human escalation when rollback or compensation is unauthorized", () => {
    const plan = buildEpochRecoveryPlan({
      strategy: "fallback_worker",
      reason: "worker lost",
      rollback: ["restore checkpoint"],
      compensation: ["reconcile external side effect"],
      permissions: ["mission.rollback"],
    });
    expect(plan.requiresHuman).toBe(true);
    expect(plan.actions.map((action) => action.kind)).toEqual(["rollback"]);
    expect(plan.reason).toContain("mission.compensate");
  });
});
