import { describe, expect, it } from "vitest";
import { rankEpochCandidates } from "../lib/epoch/decisionEngine";

describe("Epoch decision engine", () => {
  it("selects the highest-scoring eligible candidate and explains rejected candidates", () => {
    const decision = rankEpochCandidates({
      evaluations: [
        { candidateId: "fast", status: "PASS", measurements: { p99: 200 }, quality: { retentionPct: 98 }, economics: { costPerRequest: 0.03 }, constraintResults: [{ passed: true }] },
        { candidateId: "cheap", status: "PASS", measurements: { p99: 280 }, quality: { retentionPct: 98 }, economics: { costPerRequest: 0.01 }, constraintResults: [{ passed: true }] },
        { candidateId: "failed", status: "FAIL", measurements: { p99: 100 }, constraintResults: [{ passed: false }] },
        { candidateId: "unknown", status: "UNKNOWN", measurements: {} },
      ],
      objectives: [{ metric: "p99", direction: "minimize", weight: 1 }],
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(decision.status).toBe("DECIDED");
    expect(decision.winner?.candidateId).toBe("fast");
    expect(decision.rejected).toEqual(expect.arrayContaining([
      { candidateId: "failed", reason: "candidate failed one or more hard constraints" },
      { candidateId: "unknown", reason: "candidate evidence is incomplete" },
    ]));
  });
});
