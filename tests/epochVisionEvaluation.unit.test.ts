import { describe, expect, it } from "vitest";
import { evaluateEpochVision } from "../lib/epoch/visionEvaluation";

describe("Epoch vision/OCR evaluation", () => {
  it("scores exact and near-exact OCR observations", () => {
    const result = evaluateEpochVision({ cases: [{ id: "invoice", expectedText: "Total $42.00", observedText: "total 42 00" }, { id: "label", expectedText: "red apple", observedText: "red apple" }] });
    expect(result.status).toBe("PASS"); expect(result.tokenF1).toBeGreaterThan(0.8); expect(result.characterAccuracy).toBeGreaterThan(0.8);
  });
  it("rejects empty observations and records deterministic evidence", () => {
    const result = evaluateEpochVision({ cases: [{ id: "bad", expectedText: "hello", observedText: "" }] });
    expect(result.status).toBe("UNKNOWN"); expect(result.invalidCaseIds).toEqual(["bad"]); expect(result.datasetSha256).toHaveLength(64);
  });
});
