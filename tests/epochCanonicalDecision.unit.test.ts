import { describe, expect, it } from "vitest";
import { buildCanonicalDecision, evaluateCanonicalCandidates } from "../lib/epoch/canonical";
import type { OutcomeContract } from "../lib/epoch/canonical";

const outcome: OutcomeContract = {
  contractVersion: "epoch.canonical.v1",
  id: "outcome-1",
  workspaceId: "workspace-1",
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
  correlation: { correlationId: "c-1", traceId: "t-1" },
  objective: "Reduce cost without regression",
  baseline: { inference_cost: 100, quality: 95 },
  targetMetrics: [
    { metric: "inference_cost", operator: "decrease", target: 30, unit: "%", hard: true },
    { metric: "quality", operator: "non_regression", hard: true },
  ],
  hardConstraints: [],
  softObjectives: [],
  prohibitedTradeoffs: [],
  observationWindow: { durationSeconds: 86400 },
  successCriteria: ["cost decrease >= 30%", "quality non-regression"],
  verificationMethod: "independent verifier",
  authorityRequirements: ["mission.execute"],
};

describe("Epoch canonical decision engine", () => {
  it("rejects failed and unknown candidates before ranking", () => {
    const evaluated = evaluateCanonicalCandidates({ outcome, candidates: [
      { candidateId: "good", measurements: { inference_cost: 60, quality: 95 }, score: 10 },
      { candidateId: "bad", measurements: { inference_cost: 90, quality: 95 } },
      { candidateId: "unknown", measurements: { quality: 95 } },
    ] });
    expect(evaluated.find((candidate) => candidate.candidateId === "good")?.eligible).toBe(true);
    expect(evaluated.find((candidate) => candidate.candidateId === "bad")?.eligible).toBe(false);
    expect(evaluated.find((candidate) => candidate.candidateId === "unknown")?.hardConstraints.some((constraint) => constraint.passed === null)).toBe(true);
  });

  it("records selected candidate and why alternatives lost", () => {
    const decision = buildCanonicalDecision({
      workspaceId: "workspace-1",
      missionId: "mission-1",
      outcome,
      candidates: [
        { candidateId: "candidate-a", measurements: { inference_cost: 60, quality: 95 }, risk: "low", score: 20, evidenceIds: ["evidence-a"] },
        { candidateId: "candidate-b", measurements: { inference_cost: 65, quality: 95 }, risk: "medium", score: 10, evidenceIds: ["evidence-b"] },
      ],
      correlationId: "c-1",
      traceId: "t-1",
      now: new Date("2026-08-17T00:00:00.000Z"),
    });
    expect(decision.selectedCandidateId).toBe("candidate-a");
    expect(decision.alternativeCandidateIds).toEqual(["candidate-b"]);
    expect(decision.whyAlternativesLost[0]?.reasons[0]).toContain("lower deterministic score");
    expect(decision.evidenceIds).toEqual(["evidence-a", "evidence-b"]);
  });
});
