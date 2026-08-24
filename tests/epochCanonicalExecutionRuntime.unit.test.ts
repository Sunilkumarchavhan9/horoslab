import { describe, expect, it } from "vitest";
import { ExecutionSchema } from "../lib/epoch/canonical/contracts";

describe("Epoch canonical execution lifecycle", () => {
  it("keeps completion evidence-gated and state transitions explicit", () => {
    const execution = ExecutionSchema.parse({ contractVersion: "epoch.canonical.v1", id: "execution-1", workspaceId: "ws-1", createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z", correlation: { correlationId: "c", traceId: "t" }, missionId: "mission-1", action: "run_model", target: { model: "m" }, authorityGrantId: "grant-1", preconditions: [], expectedPostconditions: [], rollback: {}, timeoutSeconds: 60, evidenceRequirements: ["metric"], risk: "low", state: "executing" });
    expect(execution.state).toBe("executing");
    expect(() => ExecutionSchema.parse({ ...execution, state: "verified" })).toThrow();
  });
});
