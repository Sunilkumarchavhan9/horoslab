import { describe, expect, it } from "vitest";
import { evaluateEpochModelVerificationGate } from "../lib/epoch/modelVerificationGate";

describe("Epoch evidence freshness", () => {
  it("blocks promotion when required evidence is expired", () => {
    const gate = evaluateEpochModelVerificationGate({ runtimeLoadStatus: "VERIFIED_COMPATIBLE", qualityStatus: "PASS", qualityScorePct: 99, benchmarkStatus: "completed", p99Ms: 100, economicsStatus: "PASS", evidenceTimestamps: { runtimeLoad: "2020-01-01T00:00:00.000Z", quality: "2020-01-01T00:00:00.000Z", benchmark: "2020-01-01T00:00:00.000Z", economics: "2020-01-01T00:00:00.000Z" }, now: new Date("2026-01-01T00:00:00.000Z"), maxEvidenceAgeMs: 60_000 });
    expect(gate.status).toBe("FAIL");
    expect(gate.reasons).toContain("evidence_expired_or_missing_timestamp");
  });
});
