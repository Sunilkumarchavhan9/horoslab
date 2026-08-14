import { describe, expect, it } from "vitest";
import { classifyEpochRuntimeError, decideEpochRecovery, evaluateEpochMissionLimits } from "../lib/epoch/recoveryPolicy";

describe("Epoch recovery policy", () => {
  it("never retries policy denial or cancellation", () => {
    expect(decideEpochRecovery({ error: "blocked_by_policy", attempt: 0 }).retryable).toBe(false);
    expect(decideEpochRecovery({ error: "epoch_mission_cancelled", attempt: 0 }).action).toBe("fail");
  });

  it("selects governed fallback actions", () => {
    expect(decideEpochRecovery({ error: "provider_unavailable", attempt: 0 }).action).toBe("fallback_provider");
    expect(decideEpochRecovery({ error: "worker_lost", attempt: 0 }).action).toBe("fallback_worker");
  });

  it("stops when the attempt budget is exhausted", () => {
    const result = decideEpochRecovery({ error: "temporary network failure", attempt: 3, policy: { maxAttempts: 3 } });
    expect(result.retryable).toBe(false);
    expect(result.reason).toBe("attempt_budget_exhausted");
  });

  it("normalizes unknown errors into a typed kind", () => {
    expect(classifyEpochRuntimeError("some new runtime condition")).toBe("unknown");
  });

  it("blocks work after a mission budget or deadline is exhausted", () => {
    expect(evaluateEpochMissionLimits({ budgetCents: 100, spentCents: 100 }).reason).toBe("budget_exhausted");
    expect(evaluateEpochMissionLimits({ budgetCents: 0, spentCents: 999, deadlineAt: "2026-01-01T00:00:00.000Z", now: new Date("2026-01-01T00:00:01.000Z") }).reason).toBe("deadline_exceeded");
    expect(decideEpochRecovery({ error: "budget_exhausted", attempt: 0 }).retryable).toBe(false);
  });
});
