import { consoleApiFetch } from "@/lib/console-api";
import {
  readLabOrgSettings,
  saveLabOrgSettings,
  type LabOrgSettings,
} from "@/lib/continuity-lab/lab-org-settings-storage";

export type LabOrgSettingsResponse = {
  orgId: string;
  settings: LabOrgSettings;
  updatedAt?: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toLabOrgSettings(
  record: LabOrgSettings & { updatedAt?: string },
): LabOrgSettings {
  const { updatedAt: _updatedAt, ...settings } = record;
  return settings;
}

export async function fetchLabOrgSettingsFromApi(): Promise<LabOrgSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-org-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabOrgSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toLabOrgSettings(data.settings as LabOrgSettings & { updatedAt?: string });
    saveLabOrgSettings(settings);
    return { orgId: data.orgId, settings, updatedAt: data.updatedAt };
  } catch {
    return null;
  }
}

export async function patchLabOrgSettingsToApi(
  partial: Partial<LabOrgSettings>,
): Promise<LabOrgSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-org-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabOrgSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toLabOrgSettings(data.settings as LabOrgSettings & { updatedAt?: string });
    saveLabOrgSettings(settings);
    return { orgId: data.orgId, settings, updatedAt: data.updatedAt };
  } catch {
    return null;
  }
}

/** Load from API when possible; fall back to local cache. */
export async function loadLabOrgSettingsHybrid(): Promise<LabOrgSettingsResponse | null> {
  const remote = await fetchLabOrgSettingsFromApi();
  if (remote) return remote;
  return null;
}

export function loadLabOrgSettingsLocalFallback(orgId: string | null): {
  orgId: string;
  settings: LabOrgSettings;
} {
  return {
    orgId: orgId ?? "",
    settings: readLabOrgSettings(),
  };
}
