import { describe, expect, it } from "vitest";
import { buildCanonicalBenchmark, buildCanonicalExperiment } from "../lib/epoch/canonical";

const common = {
  workspaceId: "workspace-1",
  missionId: "mission-1",
  correlationId: "correlation-1",
  traceId: "trace-1",
  now: new Date("2026-08-17T00:00:00.000Z"),
};

describe("Epoch canonical experiment runtime", () => {
  it("requires a candidate-linked experiment plan", () => {
    const experiment = buildCanonicalExperiment({
      ...common,
      candidateId: "candidate-1",
      type: "benchmark",
      baseline: { p99: 240, quality: 95 },
      intervention: { runtime: "vllm", batching: "continuous" },
      metrics: ["p99_latency", "quality", "cost_per_request"],
      durationSeconds: 900,
      rollback: { action: "destroy_sandbox" },
    });
    expect(experiment.candidateId).toBe("candidate-1");
    expect(experiment.status).toBe("planned");
    expect(experiment.evidenceRequirements).toContain("independent_verification");
  });

  it("records the complete reproducibility context in a benchmark", () => {
    const benchmark = buildCanonicalBenchmark({
      ...common,
      experimentId: "experiment-1",
      modelRevision: "Qwen/Qwen3-32B@abc1234",
      artifactDigest: "sha256:model",
      runtimeVersion: "vllm@0.10.0",
      hardware: { name: "H100", count: 8 },
      driver: { cuda: "12.8" },
      kernel: "6.8",
      container: "ghcr.io/epoch/vllm:test",
      configuration: { maxNumSeqs: 128 },
      workload: { requestRate: 100, inputTokens: 500, outputTokens: 200 },
      dataset: { id: "quality-set-v1", digest: "sha256:dataset" },
      randomSeeds: [7, 11],
      environment: { cluster: "prod-like", region: "local" },
      measurementMethod: "OpenTelemetry + request-level timer",
      results: { p99_latency: 180, quality: 95.4, costPerRequest: 0.0001 },
    });
    expect(benchmark.reproducibilityHash).toMatch(/^[a-f0-9]{64}$/);
    expect(benchmark.randomSeeds).toEqual([7, 11]);
    expect(benchmark.results).toMatchObject({ p99_latency: 180 });
  });
});
