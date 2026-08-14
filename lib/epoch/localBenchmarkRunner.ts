import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { completeEpochAi, readEpochAiProviderConfig, type EpochAiProviderConfig } from "./aiProviders";

const execFileAsync = promisify(execFile);

export type EpochLocalBenchmarkInput = {
  model: string;
  prompts: string[];
  repetitions?: number;
  warmup?: number;
  maxOutputTokens?: number;
  endpoint?: string;
  fetch?: typeof fetch;
  gpuTelemetryReader?: () => Promise<EpochLocalGpuTelemetry | null>;
};

export type EpochLocalGpuTelemetry = {
  name: string;
  utilizationPct: number | null;
  memoryUsedMb: number | null;
  memoryTotalMb: number | null;
  temperatureC: number | null;
};

export type EpochLocalBenchmarkResult = {
  provider: "ollama";
  model: string;
  status: "completed" | "partial";
  startedAt: string;
  completedAt: string;
  warmupRuns: number;
  requestedRuns: number;
  completedRuns: number;
  failedRuns: number;
  errorRatePct: number;
  latencyMs: { p50: number | null; p95: number | null; p99: number | null; average: number | null };
  throughput: { outputTokensPerSecond: number | null; measuredOutputTokens: number };
  samples: Array<{ promptIndex: number; repetition: number; status: "ok" | "error"; latencyMs: number; inputTokens?: number; outputTokens?: number; error?: string }>;
  gpuBefore: EpochLocalGpuTelemetry | null;
  gpuAfter: EpochLocalGpuTelemetry | null;
};

function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

export async function readEpochLocalGpuTelemetry(): Promise<EpochLocalGpuTelemetry | null> {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", ["--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits"], { windowsHide: true, timeout: 5_000 });
    const first = stdout.trim().split(/\r?\n/)[0];
    if (!first) return null;
    const [name, utilization, memoryUsed, memoryTotal, temperature] = first.split(",").map((part) => part.trim());
    const numberOrNull = (value: string | undefined) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; };
    return { name, utilizationPct: numberOrNull(utilization), memoryUsedMb: numberOrNull(memoryUsed), memoryTotalMb: numberOrNull(memoryTotal), temperatureC: numberOrNull(temperature) };
  } catch {
    return null;
  }
}

export async function runEpochLocalBenchmark(input: EpochLocalBenchmarkInput): Promise<EpochLocalBenchmarkResult> {
  if (!input.model.trim() || !input.prompts.length) throw new Error("epoch_local_benchmark_requires_model_and_prompts");
  const repetitions = Math.max(1, Math.min(20, Math.floor(input.repetitions ?? 1)));
  const warmup = Math.max(0, Math.min(3, Math.floor(input.warmup ?? 1)));
  const maxOutputTokens = Math.max(1, Math.min(4096, Math.floor(input.maxOutputTokens ?? 128)));
  const config: EpochAiProviderConfig = { ...readEpochAiProviderConfig("ollama"), ...(input.endpoint ? { endpoint: input.endpoint } : {}), ...(input.fetch ? { fetch: input.fetch } : {}) };
  const gpuReader = input.gpuTelemetryReader ?? readEpochLocalGpuTelemetry;
  const startedAt = new Date().toISOString();
  const gpuBefore = await gpuReader();
  for (let index = 0; index < warmup; index += 1) {
    await completeEpochAi({ model: input.model, prompt: input.prompts[index % input.prompts.length], maxOutputTokens }, config).catch(() => undefined);
  }
  const samples: EpochLocalBenchmarkResult["samples"] = [];
  for (let promptIndex = 0; promptIndex < input.prompts.length; promptIndex += 1) {
    for (let repetition = 0; repetition < repetitions; repetition += 1) {
      const start = Date.now();
      try {
        const response = await completeEpochAi({ model: input.model, prompt: input.prompts[promptIndex], maxOutputTokens }, config);
        samples.push({ promptIndex, repetition, status: "ok", latencyMs: Date.now() - start, inputTokens: response.evidence.inputTokens, outputTokens: response.evidence.outputTokens });
      } catch (error) {
        samples.push({ promptIndex, repetition, status: "error", latencyMs: Date.now() - start, error: error instanceof Error ? error.message : "benchmark_request_failed" });
      }
    }
  }
  const completedAt = new Date().toISOString();
  const successful = samples.filter((sample) => sample.status === "ok");
  const latencies = successful.map((sample) => sample.latencyMs);
  const measuredOutputTokens = successful.reduce((sum, sample) => sum + (sample.outputTokens ?? 0), 0);
  const totalSeconds = latencies.reduce((sum, latency) => sum + latency, 0) / 1000;
  return {
    provider: "ollama", model: input.model, status: successful.length === samples.length ? "completed" : "partial", startedAt, completedAt,
    warmupRuns: warmup, requestedRuns: input.prompts.length * repetitions, completedRuns: successful.length, failedRuns: samples.length - successful.length,
    errorRatePct: samples.length ? Number(((samples.length - successful.length) / samples.length * 100).toFixed(2)) : 100,
    latencyMs: { p50: percentile(latencies, 0.5), p95: percentile(latencies, 0.95), p99: percentile(latencies, 0.99), average: latencies.length ? Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)) : null },
    throughput: { outputTokensPerSecond: totalSeconds > 0 ? Number((measuredOutputTokens / totalSeconds).toFixed(2)) : null, measuredOutputTokens },
    samples, gpuBefore, gpuAfter: await gpuReader(),
  };
}
