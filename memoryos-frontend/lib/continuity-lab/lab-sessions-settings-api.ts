import { consoleApiFetch } from "@/lib/console-api";
import {
  readLabSessionsSettings,
  writeLabSessionsSettings,
  type LabSessionsSettings,
} from "@/lib/continuity-lab/sessions-settings-storage";

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

export async function fetchLabSessionsSettingsFromApi(): Promise<LabSessionsSettings | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-sessions-settings");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ settings?: LabSessionsSettings }>(payload);
    if (!data?.settings) return null;
    writeLabSessionsSettings(data.settings);
    return data.settings;
  } catch {
    return null;
  }
}

export async function patchLabSessionsSettingsToApi(
  partial: Partial<LabSessionsSettings>,
): Promise<LabSessionsSettings | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-sessions-settings", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ settings?: LabSessionsSettings }>(payload);
    if (!data?.settings) return null;
    writeLabSessionsSettings(data.settings);
    return data.settings;
  } catch {
    return null;
  }
}

export async function loadLabSessionsSettingsHybrid(): Promise<LabSessionsSettings> {
  const remote = await fetchLabSessionsSettingsFromApi();
  if (remote) return remote;
  return readLabSessionsSettings();
}
