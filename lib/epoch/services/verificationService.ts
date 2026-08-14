import { getEpochVerificationRun, listEpochVerificationRuns, runEpochVerification } from "../epochStore";

export async function summarizeVerificationService(workspaceId: string) {
  const verifications = await listEpochVerificationRuns({ workspaceId });
  return {
    workspaceId,
    counts: {
      verifications: verifications.length,
      pass: verifications.filter((run) => run.finalDecision === "PASS").length,
      fail: verifications.filter((run) => run.finalDecision === "FAIL").length,
      review: verifications.filter((run) => run.finalDecision === "REVIEW").length,
    },
    recent: verifications.slice(0, 10),
  };
}

export async function getVerificationRun(workspaceId: string, verificationRunId: string) {
  return getEpochVerificationRun(workspaceId, verificationRunId);
}

export async function verifyMission(input: Parameters<typeof runEpochVerification>[0]) {
  return runEpochVerification(input);
}
