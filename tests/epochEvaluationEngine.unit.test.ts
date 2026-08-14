import { describe, expect, it } from "vitest";
import { evaluateEpochEconomics, evaluateEpochQuality } from "../lib/epoch/evaluationEngine";

describe("Epoch quality and economics evaluation", () => {
  it("evaluates observed outputs against weighted quality cases", () => {
    const result = evaluateEpochQuality({ cases: [{ id: "a", input: "a", expectedContains: "yes", weight: 2 }, { id: "b", input: "b", expectedJson: { ok: true } }], outputs: [{ caseId: "a", output: "yes" }, { caseId: "b", output: '{"ok":true}' }], minimumScorePct: 95 });
    expect(result.status).toBe("PASS");
    expect(result.scorePct).toBe(100);
    expect(result.evidenceStatus).toBe("OBSERVED");
  });

  it("calculates measured request and monthly economics", () => {
    const result = evaluateEpochEconomics({ costPerHour: 1, requestsPerHour: 1000, tokensPerHour: 50_000, monthlyRequests: 10_000, budgetPerMonth: 20 });
    expect(result.status).toBe("PASS");
    expect(result.costPerRequest).toBe(0.001);
    expect(result.costPer1kTokens).toBe(0.02);
    expect(result.monthlyProjection).toBe(10);
  });

  it("refuses to invent economics without measured runtime inputs", () => {
    expect(evaluateEpochEconomics({ monthlyRequests: 1000 }).status).toBe("UNKNOWN");
  });
});
