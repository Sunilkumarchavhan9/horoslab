    import { consoleApiFetch } from "@/lib/console-api";
import { broadcastLabEnvironmentSettingsChanged } from "@/lib/continuity-lab/lab-environment-settings-events";
import {
  normalizeLabEnvironmentSettings,
  readLabEnvironmentSettings,
  saveLabEnvironmentSettings,
  type LabEnvironmentSettings,
} from "@/lib/continuity-lab/lab-environment-settings-storage";

export type LabEnvironmentSettingsResponse = {
  orgId: string;
  settings: LabEnvironmentSettings;
  updatedAt?: string;
  snapshotBuildNote?: string;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toSettings(
  record: LabEnvironmentSettings & { updatedAt?: string },
): LabEnvironmentSettings {
  const settings = { ...record };
  delete settings.updatedAt;
  return normalizeLabEnvironmentSettings(settings);
}

function applyRemoteSettings(
  response: LabEnvironmentSettingsResponse,
): LabEnvironmentSettingsResponse {
  saveLabEnvironmentSettings(response.settings, { broadcast: false });
  broadcastLabEnvironmentSettingsChanged({
    settings: response.settings,
    orgId: response.orgId,
    updatedAt: response.updatedAt,
  });
  return response;
}

export async function fetchLabEnvironmentSettingsFromApi(): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
      snapshotBuildNote?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
      snapshotBuildNote: data.snapshotBuildNote,
    });
  } catch {
    return null;
  }
}

export async function patchLabEnvironmentSettingsToApi(
  partial: Partial<LabEnvironmentSettings>,
): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
      snapshotBuildNote?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
      snapshotBuildNote: data.snapshotBuildNote,
    });
  } catch {
    return null;
  }
}

export async function buildLabEnvironmentSnapshot(input?: {
  triggeredBy?: string | null;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/build-snapshot", {
      method: "POST",
      body: JSON.stringify(input ?? {}),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
      snapshotBuildNote?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({
      orgId: data.orgId,
      settings,
      updatedAt: data.updatedAt,
      snapshotBuildNote: data.snapshotBuildNote,
    });
  } catch {
    return null;
  }
}

export async function activateLabEnvironmentSnapshotToApi(
  snapshotId: string,
): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/snapshot/activate", {
      method: "POST",
      body: JSON.stringify({ snapshotId }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function deleteLabEnvironmentSnapshotFromApi(
  snapshotId: string,
): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/snapshot", {
      method: "DELETE",
      body: JSON.stringify({ snapshotId }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function loadLabEnvironmentSettingsHybrid(): Promise<LabEnvironmentSettingsResponse | null> {
  return fetchLabEnvironmentSettingsFromApi();
}

export function loadLabEnvironmentSettingsLocalFallback(orgId: string | null): {
  orgId: string;
  settings: LabEnvironmentSettings;
} {
  return {
    orgId: orgId ?? "",
    settings: readLabEnvironmentSettings(),
  };
}

export async function fetchEnvironmentContext(
  repo?: string | null,
): Promise<string | null> {
  try {
    const params = repo?.trim() ? `?repo=${encodeURIComponent(repo.trim())}` : "";
    const res = await consoleApiFetch(`/api/memory/lab-environment-settings/context${params}`);
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ context?: string | null }>(payload);
    return typeof data?.context === "string" ? data.context : null;
  } catch {
    return null;
  }
}

export async function saveLabEnvironmentBlueprintToApi(input: {
  content: string;
  savedBy?: string | null;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/save-blueprint", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function deleteLabEnvironmentBlueprintFromApi(): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/blueprint", {
      method: "DELETE",
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function addLabEnvironmentBlueprintSecretToApi(input: {
  type?: "key-value" | "cookie" | "totp";
  name: string;
  value: string;
  note?: string | null;
  redacted?: boolean;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/blueprint-secrets", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function importLabEnvironmentBlueprintSecretsToApi(input: {
  text: string;
  redacted?: boolean;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch(
      "/api/memory/lab-environment-settings/blueprint-secrets/import",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function uploadLabEnvironmentBlueprintFileToApi(input: {
  name: string;
  content: string;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/blueprint-files", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function saveLabEnvironmentRepoBlueprintToApi(input: {
  repo: string;
  content: string;
  savedBy?: string | null;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/save-repo-blueprint", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function removeEnrolledRepoFromApi(
  repo: string,
): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/enrolled-repo", {
      method: "DELETE",
      body: JSON.stringify({ repo }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function addLabEnvironmentRepoBlueprintSecretToApi(input: {
  repo: string;
  name: string;
  value: string;
  note?: string | null;
  redacted?: boolean;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/repo-blueprint-secrets", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function importLabEnvironmentRepoBlueprintSecretsToApi(input: {
  repo: string;
  text: string;
  redacted?: boolean;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch(
      "/api/memory/lab-environment-settings/repo-blueprint-secrets/import",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}

export async function uploadLabEnvironmentRepoBlueprintFileToApi(input: {
  repo: string;
  name: string;
  content: string;
}): Promise<LabEnvironmentSettingsResponse | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-environment-settings/repo-blueprint-files", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{
      orgId?: string;
      settings?: LabEnvironmentSettings;
      updatedAt?: string;
    }>(payload);
    if (!data?.orgId || !data.settings) return null;
    const settings = toSettings(data.settings as LabEnvironmentSettings & { updatedAt?: string });
    return applyRemoteSettings({ orgId: data.orgId, settings, updatedAt: data.updatedAt });
  } catch {
    return null;
  }
}
