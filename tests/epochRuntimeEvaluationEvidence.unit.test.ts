import { describe, expect, it } from "vitest";
import { buildEpochRuntimeEvaluationEvidence } from "../lib/epoch/runtimeEvaluationEvidence";

describe("Epoch runtime evaluation evidence", () => {
  it("records benchmark measurements without pretending runtime validity is quality", () => {
    const evidence = buildEpochRuntimeEvaluationEvidence({
      task: "text-generation",
      model: "model-a",
      execution: { status: "OBSERVED", task: "text-generation", model: "model-a", output: "ok", endpoint: "http://runtime.test", httpStatus: 200, latencyMs: 42, responseSha256: "a".repeat(64), validation: { valid: true, reasons: [] }, observedAt: new Date().toISOString() },
    });
    expect(evidence.benchmark.latencyMs).toBe(42);
    expect(evidence.quality.status).toBe("PENDING_DATASET_EVALUATION");
  });
});
