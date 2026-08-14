import { detectEpochDrift, type EpochDriftMetric } from "./driftEngine";

export type EpochTelemetryEvaluation = { version: "epoch_telemetry_evaluation.v1"; source: string; observedAt: string; measurements: Record<string, number>; drift: ReturnType<typeof detectEpochDrift>; action: "CONTINUE" | "REDISCOVER" | "REVIEW" };

export function evaluateEpochTelemetry(input: { source: string; observedAt?: string; baseline: Record<string, unknown>; current: Record<string, unknown>; thresholdsPct?: Record<string, number> }): EpochTelemetryEvaluation {
  const measurements: Record<string, number> = {};
  for (const [key, value] of Object.entries(input.current)) if (typeof value === "number" && Number.isFinite(value)) measurements[key] = value;
  const drift = detectEpochDrift({ baseline: input.baseline, current: input.current, thresholdsPct: input.thresholdsPct });
  return { version: "epoch_telemetry_evaluation.v1", source: input.source, observedAt: input.observedAt ?? new Date().toISOString(), measurements, drift, action: drift.material ? "REDISCOVER" : drift.status === "UNKNOWN" ? "REVIEW" : "CONTINUE" };
}

export function telemetryMetricSummary(evaluation: EpochTelemetryEvaluation): Array<Pick<EpochDriftMetric, "metric" | "deltaPct" | "thresholdPct" | "material">> { return evaluation.drift.metrics.map(({ metric, deltaPct, thresholdPct, material }) => ({ metric, deltaPct, thresholdPct, material })); }
