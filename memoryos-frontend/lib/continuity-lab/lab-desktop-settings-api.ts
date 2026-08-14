import { consoleApiFetch } from "@/lib/console-api";
import { broadcastLabDesktopSettingsChanged } from "@/lib/continuity-lab/lab-desktop-settings-events";
import {
  readLabDesktopSettings,
  saveLabDesktopSettings,
  type LabDesktopSettings,
  type ModelProviderKeyId,
} from "@/lib/continuity-lab/lab-desktop-settings-storage";

export type LabDesktopSettingsResponse = {
  orgId: string;
  settings: LabDesktopSettings;
  updatedAt?: string;
};

export type PatchLabDesktopSettingsInput = Partial<{
  disableTelemetry: boolean;
  modelProviderKeys: Partial<Record<ModelProviderKeyId, string | null>>;
}>;

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toSettings(record: LabDesktopSettings & { updatedAt?: string }): LabDesktopSettings {
  const { updatedAt: _updatedAt, ...settings } = record;
  return settings;
}

function applyRemoteSettings(response: LabDesktopSettingsResponse): LabDesktopSettingsResponse {
  saveLabDesktopSettings(response.settings, { broadcast: false });
  broadcastLabDesktopSettingsChanged({
    settings: response.settings,
    orgId: response.orgId,
    updatedAt: response.updatedAt,
  });
  return response;
}

export async function fetchLabDesktopSettingsFromApi(): Promise<LabDesktopSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-desktop-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabDesktopSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabDesktopSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function saveLabDesktopProviderKeyToApi(
  provider: ModelProviderKeyId,
  apiKey: string,
): Promise<LabDesktopSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-desktop-settings/provider-keys", {
      method: "POST",
      body: JSON.stringify({ provider, apiKey }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabDesktopSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabDesktopSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function patchLabDesktopSettingsToApi(
  partial: PatchLabDesktopSettingsInput,
): Promise<LabDesktopSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-desktop-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabDesktopSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabDesktopSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function loadLabDesktopSettingsHybrid(): Promise<LabDesktopSettingsResponse | null> {
  const remote = await fetchLabDesktopSettingsFromApi();
  if (remote) return remote;
  return null;
}

export function loadLabDesktopSettingsLocalFallback(orgId: string | null): {
  orgId: string;
  settings: LabDesktopSettings;
} {
  return {
    orgId: orgId ?? "",
    settings: readLabDesktopSettings(),
  };
}
