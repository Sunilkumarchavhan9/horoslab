import { describe, expect, it } from "vitest";
import { detectEpochDrift } from "../lib/epoch/driftEngine";

describe("Epoch drift engine", () => {
  it("detects material drift and requests rediscovery", () => {
    const report = detectEpochDrift({ baseline: { p99: 200, quality: 100 }, current: { p99: 260, quality: 99 }, thresholdsPct: { p99: 20, quality: 5 } });
    expect(report.status).toBe("MATERIAL_DRIFT");
    expect(report.action).toBe("REDISCOVER");
    expect(report.metrics.find((metric) => metric.metric === "p99")?.material).toBe(true);
  });

  it("does not rediscover when measurements remain within threshold", () => {
    const report = detectEpochDrift({ baseline: { p99: 200 }, current: { p99: 205 }, thresholdsPct: { p99: 10 } });
    expect(report.status).toBe("WITHIN_THRESHOLD");
    expect(report.action).toBe("CONTINUE");
  });
});
