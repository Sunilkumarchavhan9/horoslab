import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type EpochKeyDescriptor = { keyId: string; purpose: "tenant_data" | "audit_export" | "webhook"; version: number; algorithm: "HMAC-SHA256"; active: boolean };
export type EpochBackupManifest = { version: "epoch.backup-manifest.v1"; backupId: string; workspaceId: string; region: string; createdAt: string; tables: string[]; checksum: string; signature: string };

export function deriveEpochKeyDescriptor(input: { workspaceId: string; purpose: EpochKeyDescriptor["purpose"]; version?: number }): EpochKeyDescriptor {
  return { keyId: `epoch/${input.workspaceId}/${input.purpose}/v${input.version ?? 1}`, purpose: input.purpose, version: input.version ?? 1, algorithm: "HMAC-SHA256", active: true };
}

export function authorizeEpochResidency(input: { workspaceRegion: string; requestedRegion: string; allowedRegions: string[] }): { allowed: boolean; reason: string } {
  if (!input.allowedRegions.includes(input.requestedRegion)) return { allowed: false, reason: "region_not_allowed" };
  if (input.workspaceRegion !== input.requestedRegion) return { allowed: false, reason: "workspace_residency_mismatch" };
  return { allowed: true, reason: "region_allowed" };
}

export function createEpochBackupManifest(input: { backupId: string; workspaceId: string; region: string; tables: string[]; payload: string; secret: string; createdAt?: string }): EpochBackupManifest {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const checksum = createHash("sha256").update(input.payload).digest("hex");
  const unsigned = { version: "epoch.backup-manifest.v1" as const, backupId: input.backupId, workspaceId: input.workspaceId, region: input.region, createdAt, tables: [...input.tables].sort(), checksum };
  const signature = createHmac("sha256", input.secret).update(JSON.stringify(unsigned)).digest("hex");
  return { ...unsigned, signature };
}

export function verifyEpochBackupManifest(manifest: EpochBackupManifest, payload: string, secret: string): boolean {
  const checksum = createHash("sha256").update(payload).digest("hex");
  const unsigned = { version: manifest.version, backupId: manifest.backupId, workspaceId: manifest.workspaceId, region: manifest.region, createdAt: manifest.createdAt, tables: [...manifest.tables].sort(), checksum: manifest.checksum };
  const expected = Buffer.from(createHmac("sha256", secret).update(JSON.stringify(unsigned)).digest("hex"), "hex");
  const actual = Buffer.from(manifest.signature, "hex");
  return checksum === manifest.checksum && actual.length === expected.length && timingSafeEqual(actual, expected);
}
