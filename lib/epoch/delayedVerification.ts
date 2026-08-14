export type EpochVerificationWindow = { missionId: string; evidenceStableAt: string; verifyAfter: string; status: "scheduled" | "due" | "completed" | "held" };

export function scheduleEpochDelayedVerification(input: { missionId: string; evidenceStableAt?: Date | string; delayMs?: number; now?: Date }): EpochVerificationWindow {
  const stableAt = new Date(input.evidenceStableAt ?? input.now ?? new Date());
  const verifyAfter = new Date(stableAt.getTime() + Math.max(0, input.delayMs ?? 60_000));
  return { missionId: input.missionId, evidenceStableAt: stableAt.toISOString(), verifyAfter: verifyAfter.toISOString(), status: (input.now ?? new Date()) >= verifyAfter ? "due" : "scheduled" };
}

export function advanceEpochVerificationWindow(input: { window: EpochVerificationWindow; now?: Date; evidenceComplete: boolean; decision?: "PASS" | "FAIL" | "UNKNOWN" }): EpochVerificationWindow {
  const now = input.now ?? new Date();
  if (input.window.status === "completed") return input.window;
  if (now < new Date(input.window.verifyAfter)) return input.window;
  if (!input.evidenceComplete) return { ...input.window, status: "held" };
  if (input.decision) return { ...input.window, status: "completed" };
  return { ...input.window, status: "due" };
}
