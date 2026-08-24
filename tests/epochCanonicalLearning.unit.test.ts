import { describe, expect, it } from "vitest";
import { buildCanonicalEvidence, buildCanonicalVerification, evaluateTeachingEligibility } from "../lib/epoch/canonical";

const common = { workspaceId: "workspace-1", missionId: "mission-1", correlationId: "c-1", traceId: "t-1", now: new Date("2026-08-17T00:00:00.000Z") };

describe("Epoch canonical evidence and learning", () => {
  it("creates integrity-bound evidence and refuses self-verification", () => {
    const evidence = buildCanonicalEvidence({ ...common, executionId: "execution-1", type: "benchmark", uri: "s3://evidence/run.json", summary: "Measured benchmark", payload: { p99: 180 } });
    expect(evidence.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.provenance.classification).toBe("MEASURED");
    expect(() => buildCanonicalVerification({ ...common, evidenceIds: [evidence.id], verifierId: "same", executorId: "same", method: "independent", observationWindow: { start: common.now.toISOString(), end: "2026-08-18T00:00:00.000Z" }, verdict: "VERIFIED" })).toThrow("INDEPENDENT_VERIFIER_MUST_DIFFER_FROM_EXECUTOR");
  });

  it("makes teaching eligibility depend on verification, privacy, license, and safety", () => {
    expect(evaluateTeachingEligibility({ verdict: "VERIFIED", privacy: "approved", license: "approved", safety: "approved" })).toBe("eligible");
    expect(evaluateTeachingEligibility({ verdict: "UNCERTAIN", privacy: "approved", license: "approved", safety: "approved" })).toBe("requires_review");
    expect(evaluateTeachingEligibility({ verdict: "VERIFIED", privacy: "restricted", license: "approved", safety: "approved" })).toBe("requires_review");
    expect(evaluateTeachingEligibility({ verdict: "VERIFIED", privacy: "rejected", license: "approved", safety: "approved" })).toBe("rejected");
  });
});
