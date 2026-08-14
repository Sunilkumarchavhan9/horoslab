import { describe, expect, it } from "vitest";
import { buildEpochExperimentPlans, buildEpochSandboxPolicy, evaluateEpochCandidate } from "../lib/epoch/experimentEngine";

describe("Epoch experiment engine", () => {
  it("builds a bounded sandbox policy and staged experiment plan", () => {
    const policy = buildEpochSandboxPolicy({ maxDurationSeconds: 0, maxSpendCents: 20, network: "allowlisted" });
    expect(policy.network).toBe("allowlisted");
    expect(policy.maxDurationSeconds).toBe(1);
    expect(policy.cleanupRequired).toBe(true);
    const plans = buildEpochExperimentPlans({ candidates: [{ id: "compatible", model: {}, runtime: {}, hardware: {}, workload: {}, compatibility: { status: "COMPATIBLE", reasons: [], checkedAt: "now" } }, { id: "blocked", model: {}, runtime: {}, hardware: {}, workload: {}, compatibility: { status: "INCOMPATIBLE", reasons: ["no VRAM"], checkedAt: "now" } }] });
    expect(plans).toHaveLength(1);
    expect(plans[0].phases).toContain("benchmark");
  });

  it("evaluates measured quality, economics, and hard constraints", () => {
    const result = evaluateEpochCandidate({
      candidateId: "candidate-1",
      baseline: { quality: 100 },
      measurements: { quality: 98, p99: 250, costPerRequest: 0.02 },
      hardConstraints: [{ metric: "quality", operator: ">=", target: 97, hard: true, source: "explicit" }, { metric: "p99", operator: "<=", target: 300, hard: true, source: "explicit" }],
      monthlyRequests: 1000,
    });
    expect(result.status).toBe("PASS");
    expect(result.quality.retentionPct).toBe(98);
    expect(result.economics.monthlyProjection).toBe(20);
    expect(result.evidenceStatus).toBe("OBSERVED");
  });
});
