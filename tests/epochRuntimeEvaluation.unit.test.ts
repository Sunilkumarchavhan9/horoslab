import { describe, expect, it } from "vitest";
import { buildEpochRuntimeBenchmark, evaluateEpochRuntimeQuality } from "../lib/epoch/runtimeEvaluation";

describe("Epoch runtime benchmark and quality workers", () => {
  it("calculates measured latency percentiles from exact executions", () => {
    const executions = [10, 20, 30].map((latencyMs) => ({ status: "OBSERVED" as const, task: "text-generation" as const, model: "model", output: "ok", endpoint: "http://runtime", httpStatus: 200, latencyMs, responseSha256: "a".repeat(64), validation: { valid: true, reasons: [] }, observedAt: new Date().toISOString() }));
    const benchmark = buildEpochRuntimeBenchmark({ executions });
    expect(benchmark.observedSamples).toBe(3);
    expect(benchmark.latencyMs.p99).toBe(30);
    expect(benchmark.evidenceSha256).toHaveLength(64);
  });

  it("evaluates recorded outputs against a real quality contract", () => {
    const evaluation = evaluateEpochRuntimeQuality({ cases: [{ id: "case-1", input: "say ready", expectedContains: "READY" }], outputs: [{ caseId: "case-1", output: "READY" }], minimumScorePct: 80 });
    expect(evaluation.status).toBe("PASS");
    expect(evaluation.evidenceStatus).toBe("OBSERVED");
  });
});
