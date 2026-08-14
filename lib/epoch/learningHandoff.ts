export function buildEpochLearningHandoff(input: { missionId: string; settlement: { decision: "PASS" | "FAIL" | "UNKNOWN"; learningEligible: boolean; evidenceHash: string }; summary: string; lessons: string[]; risks?: string[] }) {
  if (!input.settlement.learningEligible || input.settlement.decision !== "PASS") return null;
  return { version: "epoch.learning-handoff.v1", missionId: input.missionId, source: "verified_epoch_mission", summary: input.summary, lessons: input.lessons, risks: input.risks ?? [], evidenceHash: input.settlement.evidenceHash, approved: true };
}
