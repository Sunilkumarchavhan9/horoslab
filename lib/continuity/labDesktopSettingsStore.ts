import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type ModelProviderKeyId = "anthropic" | "openrouter";

type ModelProviderKeysStored = Partial<Record<ModelProviderKeyId, string>>;

export type ModelProviderKeysPatch = Partial<Record<ModelProviderKeyId, string | null>>;

export type LabDesktopSettingsRecord = {
  disableTelemetry: boolean;
  modelProviderKeys: ModelProviderKeysStored;
  updatedAt: string;
};

export type ModelProviderKeyStatus = {
  configured: boolean;
  masked?: string;
};

export type LabDesktopSettingsPublic = {
  disableTelemetry: boolean;
  modelProviderKeys: Partial<Record<ModelProviderKeyId, ModelProviderKeyStatus>>;
};

const SETTINGS_SECTION = "lab-desktop-settings";

const DEFAULTS: Omit<LabDesktopSettingsRecord, "updatedAt"> = {
  disableTelemetry: false,
  modelProviderKeys: {},
};

export function maskSecretKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 12) return "••••••••";
  return `${trimmed.slice(0, 7)}...${trimmed.slice(-4)}`;
}

function parseStoredKeys(raw: unknown): ModelProviderKeysStored {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const record = raw as Record<string, unknown>;
  const keys: ModelProviderKeysStored = {};
  for (const id of ["anthropic", "openrouter"] as const) {
    const value = record[id];
    if (typeof value === "string" && value.trim().length > 0) {
      keys[id] = value.trim();
    }
  }
  return keys;
}

function mergeRecord(
  existing: LabDesktopSettingsRecord | undefined,
  partial: LabDesktopSettingsPatch,
): LabDesktopSettingsRecord {
  const base = existing ?? { ...DEFAULTS, updatedAt: new Date().toISOString() };
  const nextKeys = { ...base.modelProviderKeys };

  if (partial.modelProviderKeys && typeof partial.modelProviderKeys === "object") {
    for (const id of ["anthropic", "openrouter"] as const) {
      if (!(id in partial.modelProviderKeys)) continue;
      const value = partial.modelProviderKeys[id];
      if (value === null || value === "") {
        delete nextKeys[id];
      } else if (typeof value === "string" && value.trim().length > 0) {
        nextKeys[id] = value.trim();
      }
    }
  }

  return {
    disableTelemetry:
      typeof partial.disableTelemetry === "boolean"
        ? partial.disableTelemetry
        : base.disableTelemetry,
    modelProviderKeys: nextKeys,
    updatedAt: new Date().toISOString(),
  };
}

export function toPublicDesktopSettings(
  record: LabDesktopSettingsRecord,
): LabDesktopSettingsPublic {
  const modelProviderKeys: LabDesktopSettingsPublic["modelProviderKeys"] = {};
  for (const id of ["anthropic", "openrouter"] as const) {
    const stored = record.modelProviderKeys[id];
    if (stored) {
      modelProviderKeys[id] = {
        configured: true,
        masked: maskSecretKey(stored),
      };
    } else {
      modelProviderKeys[id] = { configured: false };
    }
  }
  return {
    disableTelemetry: record.disableTelemetry,
    modelProviderKeys,
  };
}

export async function getLabDesktopSettings(orgId: string): Promise<LabDesktopSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => {
      const record = raw as LabDesktopSettingsRecord | undefined;
      return mergeRecord(
        record
          ? { ...record, modelProviderKeys: parseStoredKeys(record.modelProviderKeys) }
          : undefined,
        {},
      );
    },
  );
}

export type LabDesktopSettingsPatch = Partial<
  Omit<LabDesktopSettingsRecord, "updatedAt" | "modelProviderKeys">
> & {
  modelProviderKeys?: ModelProviderKeysPatch;
};

export async function patchLabDesktopSettings(
  orgId: string,
  partial: LabDesktopSettingsPatch,
): Promise<LabDesktopSettingsRecord> {
  const current = await getLabDesktopSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}
