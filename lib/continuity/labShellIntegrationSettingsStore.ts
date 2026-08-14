import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type LabShellIntegrationSettingsRecord = {
  enabled: boolean;
  keybindingTrigger: string;
  enableComments: boolean;
  enabledShells: {
    bash: boolean;
    zsh: boolean;
    fish: boolean;
  };
  installCommand: string;
  configPath: string;
  hooksPath: string;
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-shell-integration-settings";

const DEFAULTS: Omit<LabShellIntegrationSettingsRecord, "updatedAt"> = {
  enabled: false,
  keybindingTrigger: "C-g",
  enableComments: true,
  enabledShells: {
    bash: true,
    zsh: true,
    fish: true,
  },
  installCommand: "npm run memoryostm:shell:install -- --shell bash",
  configPath: ".memoryostm/config.json",
  hooksPath: ".memoryostm/hooks.v1.json",
};

function coerceEnabledShells(raw: unknown): LabShellIntegrationSettingsRecord["enabledShells"] {
  const defaults = { ...DEFAULTS.enabledShells };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const record = raw as Record<string, unknown>;
  return {
    bash: typeof record.bash === "boolean" ? record.bash : defaults.bash,
    zsh: typeof record.zsh === "boolean" ? record.zsh : defaults.zsh,
    fish: typeof record.fish === "boolean" ? record.fish : defaults.fish,
  };
}

function mergeRecord(
  existing: Omit<LabShellIntegrationSettingsRecord, "updatedAt"> | undefined,
  partial: Partial<Omit<LabShellIntegrationSettingsRecord, "updatedAt">>,
): LabShellIntegrationSettingsRecord {
  const base = existing ?? DEFAULTS;
  return {
    enabled: typeof partial.enabled === "boolean" ? partial.enabled : base.enabled,
    keybindingTrigger:
      typeof partial.keybindingTrigger === "string" && partial.keybindingTrigger.trim()
        ? partial.keybindingTrigger.trim()
        : base.keybindingTrigger,
    enableComments:
      typeof partial.enableComments === "boolean" ? partial.enableComments : base.enableComments,
    enabledShells:
      partial.enabledShells !== undefined
        ? coerceEnabledShells(partial.enabledShells)
        : base.enabledShells,
    installCommand:
      typeof partial.installCommand === "string" && partial.installCommand.trim()
        ? partial.installCommand.trim()
        : base.installCommand,
    configPath:
      typeof partial.configPath === "string" && partial.configPath.trim()
        ? partial.configPath.trim()
        : base.configPath,
    hooksPath:
      typeof partial.hooksPath === "string" && partial.hooksPath.trim()
        ? partial.hooksPath.trim()
        : base.hooksPath,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLabShellIntegrationSettings(
  orgId: string,
): Promise<LabShellIntegrationSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) =>
      mergeRecord(raw as Omit<LabShellIntegrationSettingsRecord, "updatedAt"> | undefined, {}),
  );
}

export async function patchLabShellIntegrationSettings(
  orgId: string,
  partial: Partial<Omit<LabShellIntegrationSettingsRecord, "updatedAt">>,
): Promise<LabShellIntegrationSettingsRecord> {
  const current = await getLabShellIntegrationSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}
