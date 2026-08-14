import { describe, expect, it } from "vitest";
import { authorizeEpochResidency, createEpochBackupManifest, deriveEpochKeyDescriptor, verifyEpochBackupManifest } from "../lib/epoch/enterpriseResilience";

describe("Phase J enterprise resilience", () => {
  it("derives purpose-specific tenant key descriptors and enforces residency", () => {
    expect(deriveEpochKeyDescriptor({ workspaceId: "w1", purpose: "tenant_data" }).keyId).toContain("tenant_data");
    expect(authorizeEpochResidency({ workspaceRegion: "eu", requestedRegion: "eu", allowedRegions: ["eu", "us"] }).allowed).toBe(true);
    expect(authorizeEpochResidency({ workspaceRegion: "eu", requestedRegion: "us", allowedRegions: ["eu", "us"] }).reason).toBe("workspace_residency_mismatch");
  });

  it("creates and verifies an integrity-protected backup manifest", () => {
    const manifest = createEpochBackupManifest({ backupId: "b1", workspaceId: "w1", region: "eu", tables: ["epoch_missions", "epoch_evidence"], payload: "backup", secret: "secret", createdAt: "2026-01-01T00:00:00.000Z" });
    expect(verifyEpochBackupManifest(manifest, "backup", "secret")).toBe(true);
    expect(verifyEpochBackupManifest(manifest, "tampered", "secret")).toBe(false);
  });
});
