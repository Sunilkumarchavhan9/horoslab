import { describe, expect, it } from "vitest";
import { buildEpochAssuranceReport } from "../lib/epoch/assuranceReport";

const input = {
  missionId: "mission-1",
  decision: "UNKNOWN" as const,
  confidence: 62,
  checklist: ["Mission defined", "Evidence collected"],
  evidenceValidation: {
    pass: false,
    evidenceCount: 2,
    missingEvidenceIds: ["evidence-2"],
    tamperedEvidenceIds: [],
    legacyEvidenceIds: ["evidence-1"],
  },
  policyValidation: { pass: true, blocked: false, needsApproval: true },
  approval: "review" as const,
};

describe("Epoch assurance reports", () => {
  it("reports evidence coverage, uncertainty, and unresolved risk", () => {
    const report = buildEpochAssuranceReport(input);
    expect(report.version).toBe("epoch.assurance.v1");
    expect(report.evidenceCoverage).toBe(67);
    expect(report.uncertainty).toContain("Human approval remains unresolved.");
    expect(report.unresolvedRisks).toContain("Missing evidence: evidence-2");
  });

  it("is deterministic for the same verification inputs", () => {
    expect(buildEpochAssuranceReport(input)).toEqual(buildEpochAssuranceReport(input));
  });
});
