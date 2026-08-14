export type EpochWorkloadProfile = {
  version: "epoch_workload.v1";
  modality: "llm" | "embedding" | "reranker" | "stt" | "tts" | "image" | "video" | "custom";
  requestRatePerSecond: number;
  peakRequestRatePerSecond: number;
  concurrency: number;
  inputTokens: { p50: number; p95: number; p99: number } | null;
  outputTokens: { p50: number; p95: number; p99: number } | null;
  contextLength: number | null;
  latencySloMs: number | null;
  qualitySloPct: number | null;
  availabilitySloPct: number | null;
  monthlyRequests: number | null;
  batchable: boolean;
  source: "user" | "observed" | "inferred";
  warnings: string[];
};

function nonnegative(value: unknown): number | null { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; }
function distribution(value: unknown): EpochWorkloadProfile["inputTokens"] { if (!value || typeof value !== "object") return null; const record = value as Record<string, unknown>; const p50 = nonnegative(record.p50); const p95 = nonnegative(record.p95); const p99 = nonnegative(record.p99); return p50 !== null && p95 !== null && p99 !== null && p50 <= p95 && p95 <= p99 ? { p50, p95, p99 } : null; }

export function normalizeEpochWorkload(input: Record<string, unknown>, source: EpochWorkloadProfile["source"] = "user"): EpochWorkloadProfile {
  const warnings: string[] = [];
  const requestRatePerSecond = nonnegative(input.requestRatePerSecond ?? input.requestRate) ?? 0;
  const peakRequestRatePerSecond = nonnegative(input.peakRequestRatePerSecond ?? input.peakRequestRate) ?? requestRatePerSecond;
  const concurrency = nonnegative(input.concurrency) ?? 1;
  const modality = ["llm", "embedding", "reranker", "stt", "tts", "image", "video", "custom"].includes(String(input.modality)) ? String(input.modality) as EpochWorkloadProfile["modality"] : "custom";
  const inputTokens = distribution(input.inputTokens);
  const outputTokens = distribution(input.outputTokens);
  if (modality === "llm" && !inputTokens) warnings.push("LLM workload is missing input token distribution");
  if (modality === "llm" && !outputTokens) warnings.push("LLM workload is missing output token distribution");
  if (peakRequestRatePerSecond < requestRatePerSecond) warnings.push("peak request rate is below steady-state request rate");
  return { version: "epoch_workload.v1", modality, requestRatePerSecond, peakRequestRatePerSecond: Math.max(requestRatePerSecond, peakRequestRatePerSecond), concurrency, inputTokens, outputTokens, contextLength: nonnegative(input.contextLength), latencySloMs: nonnegative(input.latencySloMs ?? input.p99), qualitySloPct: nonnegative(input.qualitySloPct ?? input.quality), availabilitySloPct: nonnegative(input.availabilitySloPct ?? input.availability), monthlyRequests: nonnegative(input.monthlyRequests), batchable: input.batchable !== false, source, warnings };
}
