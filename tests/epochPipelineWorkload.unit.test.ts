import { describe, expect, it } from "vitest";
import { compileEpochPipeline } from "../lib/epoch/pipelineCompiler";
import { normalizeEpochWorkload } from "../lib/epoch/workloadModel";

describe("Epoch pipeline compiler and workload model", () => {
  it("compiles a multi-node pipeline with contracts and order", () => {
    const result = compileEpochPipeline({ nodes: [{ id: "stt", kind: "stt", input: ["audio"], output: ["text"], latencyBudgetMs: 100 }, { id: "llm", kind: "llm", input: ["text"], output: ["answer"], latencyBudgetMs: 200, failureBehavior: "retry", retryLimit: 2 }], edges: [{ from: "stt", to: "llm", contract: "text" }] });
    expect(result.status).toBe("COMPILED");
    expect(result.executionOrder).toEqual(["stt", "llm"]);
    expect(result.totalLatencyBudgetMs).toBe(300);
    expect(result.requiredCapabilities).toEqual(["stt", "llm"]);
  });

  it("rejects cyclic pipelines", () => {
    expect(compileEpochPipeline({ nodes: [{ id: "a", kind: "llm", input: [], output: [] }, { id: "b", kind: "tool", input: [], output: [] }], edges: [{ from: "a", to: "b", contract: "x" }, { from: "b", to: "a", contract: "x" }] }).status).toBe("INVALID");
  });

  it("normalizes workload distributions and warns about missing dimensions", () => {
    const result = normalizeEpochWorkload({ modality: "llm", requestRatePerSecond: 10, peakRequestRatePerSecond: 20, concurrency: 8, inputTokens: { p50: 100, p95: 200, p99: 300 }, outputTokens: { p50: 50, p95: 100, p99: 150 }, p99: 300, quality: 97 });
    expect(result.version).toBe("epoch_workload.v1");
    expect(result.peakRequestRatePerSecond).toBe(20);
    expect(result.warnings).toEqual([]);
  });
});
