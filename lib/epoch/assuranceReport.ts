export type EpochAssuranceReport = {
  version: "epoch.assurance.v1";
  missionId: string;
  decision: "PASS" | "FAIL" | "UNKNOWN";
  confidence: number;
  evidenceCoverage: number;
  checks: Array<{ id: string; status: "passed" | "failed" | "unknown"; detail: string }>;
  uncertainty: string[];
  unresolvedRisks: string[];
};

export function buildEpochAssuranceReport(input: {
  missionId: string;
  decision: "PASS" | "FAIL" | "UNKNOWN";
  confidence: number;
  checklist: string[];
  evidenceValidation: {
    pass: boolean;
    evidenceCount: number;
    missingEvidenceIds: string[];
    tamperedEvidenceIds: string[];
    legacyEvidenceIds: string[];
  };
  policyValidation: { pass: boolean; blocked: boolean; needsApproval: boolean };
  approval: "approved" | "rejected" | "review";
}): EpochAssuranceReport {
  const evidence = input.evidenceValidation;
  const usableEvidence = Math.max(0, evidence.evidenceCount - evidence.tamperedEvidenceIds.length);
  const expectedEvidence = evidence.evidenceCount + evidence.missingEvidenceIds.length;
  const evidenceCoverage = expectedEvidence === 0 ? 0 : Math.round((usableEvidence / expectedEvidence) * 100);
  const checks = input.checklist.map((check, index) => ({
    id: `check_${index + 1}`,
    status: input.decision === "PASS" ? "passed" as const : input.decision === "FAIL" ? "failed" as const : "unknown" as const,
    detail: check,
  }));
  const uncertainty: string[] = [];
  const unresolvedRisks: string[] = [];
  if (input.approval === "review") uncertainty.push("Human approval remains unresolved.");
  if (evidence.legacyEvidenceIds.length > 0) uncertainty.push("Some evidence predates content-hash integrity and is marked legacy.");
  if (evidence.missingEvidenceIds.length > 0) unresolvedRisks.push(`Missing evidence: ${evidence.missingEvidenceIds.join(", ")}`);
  if (evidence.tamperedEvidenceIds.length > 0) unresolvedRisks.push(`Tampered evidence: ${evidence.tamperedEvidenceIds.join(", ")}`);
  if (input.policyValidation.blocked) unresolvedRisks.push("Execution is blocked by policy.");
  if (!input.policyValidation.pass) unresolvedRisks.push("Policy validation did not pass.");
  if (input.decision === "UNKNOWN" && uncertainty.length === 0) uncertainty.push("Verification did not establish sufficient certainty.");
  return {
    version: "epoch.assurance.v1",
    missionId: input.missionId,
    decision: input.decision,
    confidence: input.confidence,
    evidenceCoverage,
    checks,
    uncertainty,
    unresolvedRisks,
  };
}
