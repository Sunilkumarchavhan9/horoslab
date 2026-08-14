export type EpochDriftMetric = {
  metric: string;
  baseline: number | null;
  current: number | null;
  delta: number | null;
  deltaPct: number | null;
  thresholdPct: number;
  material: boolean;
};

export function detectEpochDrift(input: {
  baseline: Record<string, unknown>;
  current: Record<string, unknown>;
  thresholdsPct?: Record<string, number>;
}) {
  const metrics = new Set([...Object.keys(input.baseline), ...Object.keys(input.current)]);
  const results: EpochDriftMetric[] = [...metrics].map((metric) => {
    const baseline = Number(input.baseline[metric]);
    const current = Number(input.current[metric]);
    const safeBaseline = Number.isFinite(baseline) ? baseline : null;
    const safeCurrent = Number.isFinite(current) ? current : null;
    const delta = safeBaseline !== null && safeCurrent !== null ? safeCurrent - safeBaseline : null;
    const deltaPct = delta !== null && safeBaseline !== null && safeBaseline !== 0 ? (Math.abs(delta) / Math.abs(safeBaseline)) * 100 : null;
    const thresholdPct = typeof input.thresholdsPct?.[metric] === "number" && input.thresholdsPct[metric] >= 0 ? input.thresholdsPct[metric] : 10;
    return { metric, baseline: safeBaseline, current: safeCurrent, delta, deltaPct, thresholdPct, material: deltaPct !== null && deltaPct >= thresholdPct };
  });
  const material = results.some((result) => result.material);
  return {
    version: "epoch_drift_report.v1",
    status: material ? "MATERIAL_DRIFT" : results.some((result) => result.deltaPct === null) ? "UNKNOWN" : "WITHIN_THRESHOLD",
    material,
    metrics: results,
    action: material ? "REDISCOVER" : "CONTINUE",
  } as const;
}
