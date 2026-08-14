import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type LabOrgSettingsRecord = {
  organizationName: string;
  shareDataForEvaluation: boolean;
  shareDataForTraining: boolean;
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-org-settings";

const DEFAULTS: Omit<LabOrgSettingsRecord, "updatedAt"> = {
  organizationName: "",
  shareDataForEvaluation: true,
  shareDataForTraining: false,
};

function mergeRecord(
  existing: LabOrgSettingsRecord | undefined,
  partial: Partial<LabOrgSettingsRecord>,
): LabOrgSettingsRecord {
  const base = existing ?? { ...DEFAULTS, updatedAt: new Date().toISOString() };
  return {
    organizationName:
      partial.organizationName !== undefined && typeof partial.organizationName === "string"
        ? partial.organizationName
        : base.organizationName,
    shareDataForEvaluation:
      typeof partial.shareDataForEvaluation === "boolean"
        ? partial.shareDataForEvaluation
        : base.shareDataForEvaluation,
    shareDataForTraining:
      typeof partial.shareDataForTraining === "boolean"
        ? partial.shareDataForTraining
        : base.shareDataForTraining,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLabOrgSettings(orgId: string): Promise<LabOrgSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => mergeRecord(raw as LabOrgSettingsRecord | undefined, {}),
  );
}

export async function patchLabOrgSettings(
  orgId: string,
  partial: Partial<LabOrgSettingsRecord>,
): Promise<LabOrgSettingsRecord> {
  const current = await getLabOrgSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}
