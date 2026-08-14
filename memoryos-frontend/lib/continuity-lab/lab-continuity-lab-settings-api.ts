import { consoleApiFetch } from "@/lib/console-api";
import { broadcastLabContinuityLabSettingsChanged } from "@/lib/continuity-lab/lab-continuity-lab-settings-events";
import {
  listAllSlashCommands,
  readLabContinuityLabSettings,
  saveLabContinuityLabSettings,
  type LabContinuityLabSettings,
  type LabSlashCommand,
} from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";
import {
  syncOrgSandboxOsFromSettings,
  syncOrgSettingsToOpenHandsRuntime,
} from "@/lib/continuity-lab/lab-continuity-lab-settings-runtime";

export type LabContinuityLabSettingsResponse = {
  orgId: string;
  settings: LabContinuityLabSettings;
  commands: LabSlashCommand[];
  updatedAt?: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toSettings(
  record: LabContinuityLabSettings & { updatedAt?: string },
): LabContinuityLabSettings {
  const { updatedAt: _updatedAt, ...settings } = record as LabContinuityLabSettings & {
    updatedAt?: string;
  };
  return settings;
}

function applyRemoteSettings(
  response: LabContinuityLabSettingsResponse,
  options?: { syncRuntime?: boolean },
): LabContinuityLabSettingsResponse {
  saveLabContinuityLabSettings(response.settings, { broadcast: false });
  syncOrgSandboxOsFromSettings(response.settings);
  broadcastLabContinuityLabSettingsChanged({
    settings: response.settings,
    commands: response.commands,
    orgId: response.orgId,
    updatedAt: response.updatedAt,
  });
  if (options?.syncRuntime !== false) {
    void syncOrgSettingsToOpenHandsRuntime({
      defaultAgent: response.settings.defaultAgent,
      secureMode: response.settings.secureMode,
      computerUse: response.settings.computerUse,
      defaultPlatform: response.settings.defaultPlatform,
    });
  }
  return response;
}

export async function fetchLabContinuityLabSettingsFromApi(): Promise<LabContinuityLabSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-continuity-lab-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabContinuityLabSettings;
      commands?: LabSlashCommand[];
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabContinuityLabSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      commands: data.commands ?? listAllSlashCommands(settings),
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function patchLabContinuityLabSettingsToApi(
  partial: Partial<LabContinuityLabSettings>,
): Promise<LabContinuityLabSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-continuity-lab-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabContinuityLabSettings;
      commands?: LabSlashCommand[];
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabContinuityLabSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      commands: data.commands ?? listAllSlashCommands(settings),
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function loadLabContinuityLabSettingsHybrid(): Promise<LabContinuityLabSettingsResponse | null> {
  const remote = await fetchLabContinuityLabSettingsFromApi();
  if (remote) return remote;
  const local = readLabContinuityLabSettings();
  return {
    orgId: "",
    settings: local,
    commands: listAllSlashCommands(local),
  };
}

export function loadLabContinuityLabSettingsLocalFallback(orgId: string | null): {
  orgId: string;
  settings: LabContinuityLabSettings;
} {
  return {
    orgId: orgId ?? "",
    settings: readLabContinuityLabSettings(),
  };
}

export async function resetLabContinuityLabCommandsViaApi(): Promise<LabContinuityLabSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-continuity-lab-settings", {
      method: "PATCH",
      body: JSON.stringify({ action: "reset_commands" }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabContinuityLabSettings;
      commands?: LabSlashCommand[];
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabContinuityLabSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      commands: data.commands ?? listAllSlashCommands(settings),
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function addLabContinuityLabCommandViaApi(input: {
  name: string;
  description: string;
  prompt: string;
}): Promise<{ response: LabContinuityLabSettingsResponse | null; error: string | null }> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-continuity-lab-settings", {
      method: "PATCH",
      body: JSON.stringify({ action: "add_command", command: input }),
    });
    const payload = await res.json();
    if (!res.ok) {
      const errPayload = payload as { error?: { message?: string } };
      return {
        response: null,
        error: errPayload.error?.message ?? "Could not create command",
      };
    }
    const data = unwrapData<{
      orgId?: string;
      settings?: LabContinuityLabSettings;
      commands?: LabSlashCommand[];
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) {
      return { response: null, error: "Could not create command" };
    }
    const settings = toSettings(data.settings as LabContinuityLabSettings & { updatedAt?: string });
    return {
      response: applyRemoteSettings({
        orgId: data.orgId,
        settings,
        commands: data.commands ?? listAllSlashCommands(settings),
        updatedAt: data.updatedAt,
      }),
      error: null,
    };
  } catch {
    return { response: null, error: "Could not create command" };
  }
}
