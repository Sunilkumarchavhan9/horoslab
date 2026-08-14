import { consoleApiFetch } from "@/lib/console-api";

export type LabShellIntegrationEnabledShells = {
  bash: boolean;
  zsh: boolean;
  fish: boolean;
};

export type LabShellIntegrationSettings = {
  enabled: boolean;
  keybindingTrigger: string;
  enableComments: boolean;
  enabledShells: LabShellIntegrationEnabledShells;
  installCommand: string;
  configPath: string;
  hooksPath: string;
};

export type LabShellIntegrationSettingsResponse = {
  orgId: string;
  settings: LabShellIntegrationSettings;
  updatedAt?: string;
};

export type PatchLabShellIntegrationSettingsInput = Partial<LabShellIntegrationSettings>;

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

export function defaultLabShellIntegrationSettings(): LabShellIntegrationSettings {
  return {
    enabled: false,
    keybindingTrigger: "C-g",
    enableComments: true,
    enabledShells: { bash: true, zsh: true, fish: true },
    installCommand: "npm run memoryostm:shell:install -- --shell bash",
    configPath: ".memoryostm/config.json",
    hooksPath: ".memoryostm/hooks.v1.json",
  };
}

function normalizeSettings(
  settings: Partial<LabShellIntegrationSettings> | undefined,
): LabShellIntegrationSettings {
  const defaults = defaultLabShellIntegrationSettings();
  return {
    enabled: typeof settings?.enabled === "boolean" ? settings.enabled : defaults.enabled,
    keybindingTrigger:
      typeof settings?.keybindingTrigger === "string" && settings.keybindingTrigger.trim()
        ? settings.keybindingTrigger.trim()
        : defaults.keybindingTrigger,
    enableComments:
      typeof settings?.enableComments === "boolean" ? settings.enableComments : defaults.enableComments,
    enabledShells: {
      bash:
        typeof settings?.enabledShells?.bash === "boolean"
          ? settings.enabledShells.bash
          : defaults.enabledShells.bash,
      zsh:
        typeof settings?.enabledShells?.zsh === "boolean"
          ? settings.enabledShells.zsh
          : defaults.enabledShells.zsh,
      fish:
        typeof settings?.enabledShells?.fish === "boolean"
          ? settings.enabledShells.fish
          : defaults.enabledShells.fish,
    },
    installCommand:
      typeof settings?.installCommand === "string" && settings.installCommand.trim()
        ? settings.installCommand.trim()
        : defaults.installCommand,
    configPath:
      typeof settings?.configPath === "string" && settings.configPath.trim()
        ? settings.configPath.trim()
        : defaults.configPath,
    hooksPath:
      typeof settings?.hooksPath === "string" && settings.hooksPath.trim()
        ? settings.hooksPath.trim()
        : defaults.hooksPath,
  };
}

export async function fetchLabShellIntegrationSettingsFromApi(): Promise<LabShellIntegrationSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-shell-integration-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: Partial<LabShellIntegrationSettings>;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    return {
      orgId: data.orgId,
      settings: normalizeSettings(data.settings),
      updatedAt: data.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function patchLabShellIntegrationSettingsToApi(
  partial: PatchLabShellIntegrationSettingsInput,
): Promise<LabShellIntegrationSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-shell-integration-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: Partial<LabShellIntegrationSettings>;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    return {
      orgId: data.orgId,
      settings: normalizeSettings(data.settings),
      updatedAt: data.updatedAt,
    };
  } catch {
    return null;
  }
}
