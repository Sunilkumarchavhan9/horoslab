export type EpochSettlementDecision = "PASS" | "FAIL" | "UNKNOWN";
export type EpochSettlement = { version: "epoch.settlement.v1"; decision: EpochSettlementDecision; status: "settled" | "held"; reason: string; evidenceHash: string; learningEligible: boolean };

export function buildEpochSettlement(input: { decision: EpochSettlementDecision; evidenceHash: string; assuranceConfidence: number; humanApproval: "approved" | "rejected" | "review"; unresolvedRisks: string[] }): EpochSettlement {
  const eligible = input.decision === "PASS" && input.humanApproval === "approved" && input.assuranceConfidence >= 70 && input.unresolvedRisks.length === 0;
  return { version: "epoch.settlement.v1", decision: input.decision, status: eligible || input.decision === "FAIL" ? "settled" : "held", reason: eligible ? "verified_pass" : input.decision === "FAIL" ? "verified_fail" : "verification_requires_review", evidenceHash: input.evidenceHash, learningEligible: eligible };
}
