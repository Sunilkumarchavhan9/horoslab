import { describe, expect, it } from "vitest";
import { simulateEpochCandidate } from "../lib/epoch/simulationEngine";

describe("Epoch simulation engine", () => {
  it("predicts capacity, latency, replicas, and economics without claiming observation", () => {
    const result = simulateEpochCandidate({ candidate: { id: "candidate-1", model: { requiredVramGb: 4 }, runtime: { name: "ollama", throughputTokensPerSecond: 100, baseLatencyMs: 100, costPerHour: 1 }, hardware: { name: "RTX 4050", vramGb: 6 }, workload: { requestRatePerSecond: 0.5, concurrency: 4, outputTokens: { p50: 50 }, monthlyRequests: 1000 }, compatibility: { status: "COMPATIBLE", reasons: [], checkedAt: "now" } }, workload: { requestRatePerSecond: 0.5, concurrency: 4, outputTokens: { p50: 50 }, monthlyRequests: 1000 } });
    expect(result.status).toBe("PREDICTED");
    expect(result.evidenceStatus).toBe("PREDICTED_NOT_OBSERVED");
    expect(result.predicted.replicas).toBe(1);
    expect(result.predicted.throughputRequestsPerSecond).toBe(2);
    expect(result.predicted.costPerRequest).toBeCloseTo(0.00013889, 8);
  });

  it("blocks incompatible candidates", () => {
    const result = simulateEpochCandidate({ candidate: { id: "blocked", model: {}, runtime: {}, hardware: {}, workload: {}, compatibility: { status: "INCOMPATIBLE", reasons: ["no VRAM"], checkedAt: "now" } } });
    expect(result.status).toBe("BLOCKED");
    expect(result.warnings).toContain("candidate is incompatible and cannot be simulated");
  });
});
