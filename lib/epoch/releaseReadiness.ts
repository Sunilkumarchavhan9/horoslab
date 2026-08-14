export type EpochReleaseCheck = { id: string; ok: boolean; blocking: boolean; detail: string };
export type EpochReleaseReadiness = { status: "ready" | "blocked"; deployable: boolean; checks: EpochReleaseCheck[]; blockers: string[] };

export function evaluateEpochReleaseReadiness(input: {
  migrationsApplied: boolean;
  authenticatedMissionFlow: boolean;
  fullTestSuitePassed: boolean;
  storageConfigured: boolean;
  kmsConfigured: boolean;
  backupRestoreVerified: boolean;
  realProviderVerified: boolean;
  realWorkerVerified: boolean;
}): EpochReleaseReadiness {
  const checks: EpochReleaseCheck[] = [
    { id: "migrations", ok: input.migrationsApplied, blocking: true, detail: input.migrationsApplied ? "Database migrations are applied." : "Database migrations are not fully applied." },
    { id: "authenticated_mission_flow", ok: input.authenticatedMissionFlow, blocking: true, detail: input.authenticatedMissionFlow ? "Authenticated mission flow is proven." : "Authenticated mission flow proof is missing." },
    { id: "full_test_suite", ok: input.fullTestSuitePassed, blocking: true, detail: input.fullTestSuitePassed ? "Full backend test suite passed." : "Full backend test suite has not passed." },
    { id: "object_storage", ok: input.storageConfigured, blocking: true, detail: input.storageConfigured ? "Object storage is configured." : "Production object storage is not configured." },
    { id: "kms", ok: input.kmsConfigured, blocking: true, detail: input.kmsConfigured ? "KMS configuration is present." : "Production KMS configuration is not present." },
    { id: "backup_restore", ok: input.backupRestoreVerified, blocking: true, detail: input.backupRestoreVerified ? "Backup and restore drill is verified." : "Backup and restore drill is not verified." },
    { id: "real_provider", ok: input.realProviderVerified, blocking: true, detail: input.realProviderVerified ? "Real AI provider execution is verified." : "Real AI provider execution is not verified." },
    { id: "real_worker", ok: input.realWorkerVerified, blocking: true, detail: input.realWorkerVerified ? "Real worker execution is verified." : "Real worker execution is not verified." },
  ];
  const blockers = checks.filter((check) => check.blocking && !check.ok).map((check) => `${check.id}:${check.detail}`);
  return { status: blockers.length ? "blocked" : "ready", deployable: blockers.length === 0, checks, blockers };
}
