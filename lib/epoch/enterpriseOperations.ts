import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EpochKmsProvider = { name: "kms" | "hsm" | "local_dev"; keyReference: string; encrypt: (plaintext: string) => Promise<string>; decrypt: (ciphertext: string) => Promise<string> };
export type EpochBackupSchedule = { workspaceId: string; region: string; intervalHours: number; retentionDays: number; nextRunAt: string; enabled: boolean };
export type EpochRestoreDrillResult = { passed: boolean; backupId: string; restoredChecksum: string; expectedChecksum: string; durationMs: number; errors: string[] };

export function createEpochLocalKmsProvider(secret: string): EpochKmsProvider {
  const key = createHash("sha256").update(secret).digest();
  return {
    name: "local_dev",
    keyReference: "env:EPOCH_KMS_SECRET",
    async encrypt(plaintext) {
      const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key, iv); const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
    },
    async decrypt(ciphertext) {
      const [ivEncoded, tagEncoded, dataEncoded] = ciphertext.split(".");
      if (!ivEncoded || !tagEncoded || !dataEncoded) throw new Error("epoch_kms_ciphertext_invalid");
      const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivEncoded, "base64url")); decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(dataEncoded, "base64url")), decipher.final()]).toString("utf8");
    },
  };
}

export function buildEpochBackupSchedule(input: { workspaceId: string; region: string; intervalHours?: number; retentionDays?: number; now?: Date }): EpochBackupSchedule {
  const intervalHours = input.intervalHours ?? 24; const retentionDays = input.retentionDays ?? 30;
  if (intervalHours < 1 || intervalHours > 168 || retentionDays < 1) throw new Error("epoch_backup_schedule_invalid");
  const now = input.now ?? new Date();
  return { workspaceId: input.workspaceId, region: input.region, intervalHours, retentionDays, nextRunAt: new Date(now.getTime() + intervalHours * 3_600_000).toISOString(), enabled: true };
}

export function verifyEpochRestoreDrill(input: { backupId: string; restoredPayload: string; expectedPayload: string; durationMs: number; rtoMs: number }): EpochRestoreDrillResult {
  const restoredChecksum = createHash("sha256").update(input.restoredPayload).digest("hex");
  const expectedChecksum = createHash("sha256").update(input.expectedPayload).digest("hex");
  const errors: string[] = [];
  if (restoredChecksum !== expectedChecksum) errors.push("restore_checksum_mismatch");
  if (input.durationMs > input.rtoMs) errors.push("restore_rto_exceeded");
  return { passed: errors.length === 0, backupId: input.backupId, restoredChecksum, expectedChecksum, durationMs: input.durationMs, errors };
}

export function evaluateEpochDisasterRecovery(input: { lastBackupAgeMs: number; maxBackupAgeMs: number; lastRestoreDrillAt: Date | string | null; maxDrillAgeMs: number; now?: Date }): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (input.lastBackupAgeMs > input.maxBackupAgeMs) reasons.push("backup_stale");
  if (!input.lastRestoreDrillAt || (input.now ?? new Date()).getTime() - new Date(input.lastRestoreDrillAt).getTime() > input.maxDrillAgeMs) reasons.push("restore_drill_stale");
  return { ready: reasons.length === 0, reasons };
}
