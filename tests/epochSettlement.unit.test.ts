import { describe, expect, it } from "vitest";
import { buildEpochLearningHandoff } from "../lib/epoch/learningHandoff";
import { buildEpochSettlement } from "../lib/epoch/settlement";

describe("Phase E settlement and learning handoff", () => {
  it("settles an approved high-confidence PASS and emits learning", () => {
    const settlement = buildEpochSettlement({ decision: "PASS", evidenceHash: "sha256:ok", assuranceConfidence: 95, humanApproval: "approved", unresolvedRisks: [] });
    expect(settlement.status).toBe("settled");
    expect(settlement.learningEligible).toBe(true);
    expect(buildEpochLearningHandoff({ missionId: "m1", settlement, summary: "completed", lessons: ["keep tests"] })?.approved).toBe(true);
  });

  it("holds UNKNOWN or unresolved results and never creates learning", () => {
    const settlement = buildEpochSettlement({ decision: "UNKNOWN", evidenceHash: "sha256:unknown", assuranceConfidence: 90, humanApproval: "review", unresolvedRisks: ["missing evidence"] });
    expect(settlement.status).toBe("held");
    expect(settlement.learningEligible).toBe(false);
    expect(buildEpochLearningHandoff({ missionId: "m2", settlement, summary: "uncertain", lessons: [] })).toBeNull();
  });
});
