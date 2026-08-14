import { createHash } from "node:crypto";
import { evaluateEpochQuality, type EpochQualityCase, type EpochQualityEvaluation, type EpochQualityOutput } from "./evaluationEngine";
import type { EpochTaskExecutionResult } from "./taskExecutionAdapters";

function percentile(values: number[], percentileValue: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1)];
}

export function buildEpochRuntimeBenchmark(input: { executions: EpochTaskExecutionResult[]; capturedAt?: Date }) {
  const latencies = input.executions.filter((item) => item.status === "OBSERVED").map((item) => item.latencyMs).filter((value) => Number.isFinite(value) && value >= 0);
  const observed = input.executions.filter((item) => item.status === "OBSERVED").length;
  const completedAt = (input.capturedAt ?? new Date()).toISOString();
  const payload = { version: "epoch_runtime_benchmark.v1" as const, status: observed ? "completed" as const : "failed" as const, samples: input.executions.length, observedSamples: observed, successRatePct: input.executions.length ? Number((observed / input.executions.length * 100).toFixed(2)) : 0, latencyMs: { p50: percentile(latencies, 0.5), p95: percentile(latencies, 0.95), p99: percentile(latencies, 0.99), min: latencies.length ? Math.min(...latencies) : null, max: latencies.length ? Math.max(...latencies) : null, mean: latencies.length ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(2)) : null }, completedAt };
  return { ...payload, evidenceSha256: createHash("sha256").update(JSON.stringify(payload)).digest("hex") };
}

export function evaluateEpochRuntimeQuality(input: { cases: EpochQualityCase[]; outputs: EpochQualityOutput[]; minimumScorePct?: number }): EpochQualityEvaluation {
  return evaluateEpochQuality(input);
}
