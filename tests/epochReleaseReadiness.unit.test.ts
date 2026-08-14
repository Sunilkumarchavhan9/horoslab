import { describe, expect, it } from "vitest";
import { evaluateEpochReleaseReadiness } from "../lib/epoch/releaseReadiness";

describe("V12 release hardening", () => {
  it("fails closed when production proof is incomplete", () => {
    const result = evaluateEpochReleaseReadiness({ migrationsApplied: true, authenticatedMissionFlow: true, fullTestSuitePassed: true, storageConfigured: false, kmsConfigured: false, backupRestoreVerified: false, realProviderVerified: false, realWorkerVerified: false });
    expect(result.deployable).toBe(false);
    expect(result.blockers).toEqual(expect.arrayContaining([expect.stringContaining("object_storage"), expect.stringContaining("backup_restore")]));
  });

  it("allows deployment only when every blocking proof exists", () => {
    const result = evaluateEpochReleaseReadiness({ migrationsApplied: true, authenticatedMissionFlow: true, fullTestSuitePassed: true, storageConfigured: true, kmsConfigured: true, backupRestoreVerified: true, realProviderVerified: true, realWorkerVerified: true });
    expect(result).toMatchObject({ status: "ready", deployable: true, blockers: [] });
  });
});
