import { describe, expect, it } from "vitest";
import { buildEpochRecoveryPlan, decideEpochToolCall } from "../lib/epoch/recoveryActions";

describe("Phase D recovery actions and tool policy", () => {
  it("removes unauthorized compensation and escalates for human review", () => {
    const plan = buildEpochRecoveryPlan({ strategy: "fallback_worker", reason: "worker lost", rollback: ["restore checkpoint"], compensation: ["reconcile external side effect"], permissions: ["mission.rollback"] });
    expect(plan.actions.map((action) => action.kind)).toEqual(["rollback"]);
    expect(plan.requiresHuman).toBe(true);
    expect(plan.reason).toContain("mission.compensate");
  });

  it("requires approval for privileged tools and denies blocked tools", () => {
    expect(decideEpochToolCall({ tool: "repo.write", permissions: ["tool.repo.write"] }).decision).toBe("review");
    expect(decideEpochToolCall({ tool: "repo.write", permissions: ["tool.repo.write"], approvalGranted: true }).decision).toBe("allow");
    expect(decideEpochToolCall({ tool: "repo.read", permissions: ["tool.repo.read"], blockedTools: ["repo.read"] }).decision).toBe("deny");
  });

  it("removes every unauthorized recovery action", () => {
    const plan = buildEpochRecoveryPlan({
      strategy: "escalate",
      reason: "provider failure",
      rollback: ["restore checkpoint"],
      compensation: ["reconcile external side effect"],
      permissions: [],
    });
    expect(plan.actions).toEqual([]);
    expect(plan.requiresHuman).toBe(true);
    expect(plan.reason).toBe("missing_permission:mission.rollback");
  });
});
