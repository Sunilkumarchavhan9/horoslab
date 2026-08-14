import { describe, expect, it } from "vitest";
import { planEpochDiscovery } from "../lib/epoch/discoveryLoop";

describe("Epoch discovery loop", () => {
  it("prioritizes unknowns and creates safe discovery actions", () => {
    const plan = planEpochDiscovery({ unknowns: [{ id: "quality", statement: "production quality is unknown", importance: "high", impact: "high", uncertainty: 1, costToResolve: 2, status: "OPEN" }, { id: "license", statement: "model license approval is unknown", importance: "medium", impact: "high", uncertainty: 1, costToResolve: 1, status: "OPEN" }], capabilityGaps: [{ id: "gpu", capability: "GPU capacity", reason: "No available GPU capacity fact", severity: "high", status: "OPEN" }] });
    expect(plan.actions[0].target).toContain("license");
    expect(plan.actions.find((action) => action.target === "GPU capacity")?.kind).toBe("experiment");
    expect(plan.actions.find((action) => action.kind === "benchmark")?.target).toContain("quality");
    expect(plan.actions.find((action) => action.kind === "ask_user")?.target).toContain("license");
  });

  it("forces rediscovery after drift or verification failure", () => {
    const plan = planEpochDiscovery({ trigger: "verification_failure", failedStage: "verification", failureReason: "quality target missed" });
    expect(plan.rediscoveryRequired).toBe(true);
    expect(plan.actions[0].resolvesUnknownIds).toContain("unknown-verification");
  });
});
