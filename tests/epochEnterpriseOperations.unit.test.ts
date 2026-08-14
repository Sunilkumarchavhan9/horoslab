import { describe, expect, it } from "vitest";
import { buildEpochBackupSchedule, evaluateEpochDisasterRecovery, verifyEpochRestoreDrill } from "../lib/epoch/enterpriseOperations";

describe("Phase J enterprise operations", () => {
  it("builds bounded backup schedules", () => {
    expect(buildEpochBackupSchedule({ workspaceId: "w1", region: "eu", intervalHours: 12, retentionDays: 14 }).enabled).toBe(true);
    expect(() => buildEpochBackupSchedule({ workspaceId: "w1", region: "eu", intervalHours: 0 })).toThrow("epoch_backup_schedule_invalid");
  });

  it("verifies restore checksum and RTO", () => {
    expect(verifyEpochRestoreDrill({ backupId: "b1", restoredPayload: "data", expectedPayload: "data", durationMs: 100, rtoMs: 200 }).passed).toBe(true);
    expect(verifyEpochRestoreDrill({ backupId: "b1", restoredPayload: "bad", expectedPayload: "data", durationMs: 300, rtoMs: 200 }).errors).toEqual(["restore_checksum_mismatch", "restore_rto_exceeded"]);
  });

  it("reports disaster-recovery readiness", () => {
    expect(evaluateEpochDisasterRecovery({ lastBackupAgeMs: 10, maxBackupAgeMs: 100, lastRestoreDrillAt: "2026-01-01T00:00:00.000Z", maxDrillAgeMs: 2_000, now: new Date("2026-01-01T00:00:01.000Z") }).ready).toBe(true);
    expect(evaluateEpochDisasterRecovery({ lastBackupAgeMs: 101, maxBackupAgeMs: 100, lastRestoreDrillAt: null, maxDrillAgeMs: 100 }).reasons).toEqual(["backup_stale", "restore_drill_stale"]);
  });
});
