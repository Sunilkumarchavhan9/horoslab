import { describe, expect, it } from "vitest";
import { evaluateEpochModelVerificationGate } from "../lib/epoch/modelVerificationGate";

describe("Epoch model verification gate", () => {
  it("promotes only a runtime-verified model with quality, benchmark, and economics evidence", () => {
    const gate = evaluateEpochModelVerificationGate({ runtimeLoadStatus: "VERIFIED_COMPATIBLE", qualityStatus: "PASS", qualityScorePct: 96, benchmarkStatus: "completed", p99Ms: 240, maximumP99Ms: 500, economicsStatus: "PASS", requireEconomics: true });
    expect(gate.status).toBe("PASS"); expect(gate.eligible).toBe(true); expect(gate.gateSha256).toHaveLength(64);
  });
  it("holds incomplete evidence for review and fails unverified runtime", () => {
    const review = evaluateEpochModelVerificationGate({ runtimeLoadStatus: "VERIFIED_COMPATIBLE", qualityStatus: "PASS", qualityScorePct: 90 });
    expect(review.status).toBe("REVIEW"); expect(review.eligible).toBe(false);
    const failed = evaluateEpochModelVerificationGate({ runtimeLoadStatus: "FAILED", qualityStatus: "PASS", qualityScorePct: 99, benchmarkStatus: "completed", p99Ms: 10, economicsStatus: "PASS" });
    expect(failed.status).toBe("FAIL"); expect(failed.reasons).toContain("runtime_load_not_verified");
  });
});
