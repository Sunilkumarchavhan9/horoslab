import { describe, expect, it } from "vitest";
import { evaluateEpochTelemetry, telemetryMetricSummary } from "../lib/epoch/telemetryEvaluation";

describe("Epoch telemetry evaluation", () => {
  it("turns a measured regression into rediscovery", () => {
    const evaluation = evaluateEpochTelemetry({ source: "local-ollama", baseline: { p99Ms: 200, qualityScorePct: 100 }, current: { p99Ms: 280, qualityScorePct: 99 }, thresholdsPct: { p99Ms: 20, qualityScorePct: 5 } });
    expect(evaluation.action).toBe("REDISCOVER");
    expect(telemetryMetricSummary(evaluation)).toEqual(expect.arrayContaining([expect.objectContaining({ metric: "p99Ms", material: true })]));
  });

  it("marks missing comparisons for review", () => {
    expect(evaluateEpochTelemetry({ source: "local", baseline: { p99Ms: 200 }, current: { qualityScorePct: 99 } }).action).toBe("REVIEW");
  });
});
