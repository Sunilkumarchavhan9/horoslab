import { describe, expect, it, vi } from "vitest";
import { runEpochLocalBenchmark } from "../lib/epoch/localBenchmarkRunner";

describe("Epoch local benchmark runner", () => {
  it("runs repeated Ollama-compatible requests and aggregates metrics", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify({ message: { content: "answer" }, prompt_eval_count: 10, eval_count: 5 }), { status: 200 }));
    const result = await runEpochLocalBenchmark({ model: "qwen2.5:3b", prompts: ["one", "two"], repetitions: 2, warmup: 1, maxOutputTokens: 16, fetch: fetcher, gpuTelemetryReader: async () => ({ name: "RTX 4050", utilizationPct: 40, memoryUsedMb: 2000, memoryTotalMb: 6144, temperatureC: 60 }) });
    expect(result.status).toBe("completed");
    expect(result.warmupRuns).toBe(1);
    expect(result.requestedRuns).toBe(4);
    expect(result.completedRuns).toBe(4);
    expect(result.errorRatePct).toBe(0);
    expect(result.latencyMs.p95).not.toBeNull();
    expect(result.throughput.measuredOutputTokens).toBe(20);
    expect(fetcher).toHaveBeenCalledTimes(5);
  });
});
