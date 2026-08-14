import { describe, expect, it } from "vitest";
import { buildEpochExecutionPlan } from "../lib/epoch/executionPlan";

describe("Epoch execution plan", () => {
  it("requires authority, fresh preflight, rollback, and observation", () => {
    const plan = buildEpochExecutionPlan({ candidateId: "candidate-1", previousState: { version: "old" }, observationWindowSeconds: 0 });
    expect(plan.status).toBe("AWAITING_AUTHORITY");
    expect(plan.authority.required).toBe(true);
    expect(plan.preflight).toContain("planned_world_state_fresh");
    expect(plan.rollback.previousState).toEqual({ version: "old" });
    expect(plan.observation.required).toBe(true);
    expect(plan.observation.windowSeconds).toBe(1);
  });
});
