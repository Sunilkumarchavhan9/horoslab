import { consoleApiFetch } from "@/lib/console-api";
import { broadcastLabWikiSettingsChanged } from "@/lib/continuity-lab/lab-wiki-settings-events";
import {
  readLabWikiSettings,
  saveLabWikiSettings,
  type LabWikiSettings,
} from "@/lib/continuity-lab/lab-wiki-settings-storage";

export type LabWikiSettingsResponse = {
  orgId: string;
  settings: LabWikiSettings;
  updatedAt?: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toSettings(record: LabWikiSettings & { updatedAt?: string }): LabWikiSettings {
  const settings = { ...record };
  delete settings.updatedAt;
  return settings;
}

function applyRemoteSettings(response: LabWikiSettingsResponse): LabWikiSettingsResponse {
  saveLabWikiSettings(response.settings, { broadcast: false });
  broadcastLabWikiSettingsChanged({
    settings: response.settings,
    orgId: response.orgId,
    updatedAt: response.updatedAt,
  });
  return response;
}

export async function fetchLabWikiSettingsFromApi(): Promise<LabWikiSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-wiki-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabWikiSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabWikiSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function patchLabWikiSettingsToApi(
  partial: Partial<LabWikiSettings>,
): Promise<LabWikiSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-wiki-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabWikiSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabWikiSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
    });
  } catch {
    return null;
  }
}

export async function loadLabWikiSettingsHybrid(): Promise<LabWikiSettingsResponse | null> {
  const remote = await fetchLabWikiSettingsFromApi();
  if (remote) return remote;
  return null;
}

export function loadLabWikiSettingsLocalFallback(orgId: string | null): {
  orgId: string;
  settings: LabWikiSettings;
} {
  return {
    orgId: orgId ?? "",
    settings: readLabWikiSettings(),
  };
}
