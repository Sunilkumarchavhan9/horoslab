import { describe, expect, it } from "vitest";
import { advanceEpochVerificationWindow, scheduleEpochDelayedVerification } from "../lib/epoch/delayedVerification";

describe("Phase E delayed verification", () => {
  it("does not verify before the evidence stabilization window", () => {
    const window = scheduleEpochDelayedVerification({ missionId: "m1", evidenceStableAt: "2026-01-01T00:00:00.000Z", delayMs: 60_000, now: new Date("2026-01-01T00:00:10.000Z") });
    expect(window.status).toBe("scheduled");
    expect(advanceEpochVerificationWindow({ window, now: new Date("2026-01-01T00:00:30.000Z"), evidenceComplete: true }).status).toBe("scheduled");
  });

  it("holds incomplete evidence and completes only after a decision", () => {
    const window = scheduleEpochDelayedVerification({ missionId: "m2", evidenceStableAt: "2026-01-01T00:00:00.000Z", delayMs: 0, now: new Date("2026-01-01T00:00:01.000Z") });
    expect(advanceEpochVerificationWindow({ window, now: new Date("2026-01-01T00:00:02.000Z"), evidenceComplete: false }).status).toBe("held");
    expect(advanceEpochVerificationWindow({ window: { ...window, status: "due" }, now: new Date("2026-01-01T00:00:02.000Z"), evidenceComplete: true, decision: "PASS" }).status).toBe("completed");
  });
});
