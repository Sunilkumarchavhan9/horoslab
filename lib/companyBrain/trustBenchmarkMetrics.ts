import { getLatestRun } from "../benchmark/benchmarkStore";

export type TrustBenchmarkMetricSource =
  | "benchmark-runs"
  | "run eval:benchmark";

export type TrustBenchmarkMetrics = {
  retrievalPrecisionPercent: number | null;
  resumeSuccessRatePercent: number | null;
  generatedAt: string | null;
  source: TrustBenchmarkMetricSource;
  evalScript: "eval:benchmark";
};

/** Last offline benchmark scores for trust KPIs (not live retrieval). */
export async function getTrustBenchmarkMetrics(): Promise<TrustBenchmarkMetrics> {
  const latestRun = await getLatestRun();
  if (latestRun) {
    return {
      retrievalPrecisionPercent: Number.isFinite(latestRun.top3RetrievalPrecision)
        ? Math.round(latestRun.top3RetrievalPrecision * 10) / 10
        : null,
      resumeSuccessRatePercent: Number.isFinite(latestRun.resumeSuccessRate)
        ? Math.round(latestRun.resumeSuccessRate * 10) / 10
        : null,
      generatedAt: latestRun.completedAt ?? latestRun.generatedAt,
      source: "benchmark-runs",
      evalScript: "eval:benchmark",
    };
  }

  return {
    retrievalPrecisionPercent: null,
    resumeSuccessRatePercent: null,
    generatedAt: null,
    source: "run eval:benchmark",
    evalScript: "eval:benchmark",
  };
}
