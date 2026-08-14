import { describe, expect, it } from "vitest";
import { verifyEpochOutcome } from "../lib/epoch/verificationEngine";

describe("Epoch verification window", () => {
  const constraints = [{ metric: "p99", operator: "<=" as const, target: 300, hard: true, source: "explicit" as const }];

  it("achieves an outcome only with evidence, time, and passing measurements", () => {
    const result = verifyEpochOutcome({ measurements: { p99: 250 }, constraints, evidenceIds: ["ev-1"], requiredWindowSeconds: 60, observedWindowSeconds: 60 });
    expect(result.status).toBe("ACHIEVED");
    expect(result.nextAction).toBe("SETTLE");
  });

  it("remains unknown when the verification window is incomplete", () => {
    const result = verifyEpochOutcome({ measurements: { p99: 250 }, constraints, evidenceIds: ["ev-1"], requiredWindowSeconds: 60, observedWindowSeconds: 30 });
    expect(result.status).toBe("UNKNOWN");
    expect(result.nextAction).toBe("OBSERVE_OR_REDISCOVER");
  });
});
