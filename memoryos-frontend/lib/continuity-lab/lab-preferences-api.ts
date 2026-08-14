import { consoleApiFetch } from "@/lib/console-api";
import { LAB_PREFERENCES_STORAGE_KEY } from "@/lib/continuity-lab/lab-preference-keys";
import {
  getThemePreferenceRevision,
  readLabPreferences,
  saveLabPreferences,
  type LabPreferences,
} from "@/lib/continuity-lab/lab-preferences-storage";

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean };
  if (record.ok === false) return null;
  return (record.data ?? payload) as T;
}

function toLabPreferences(record: LabPreferences & { updatedAt?: string }): LabPreferences {
  const { updatedAt: _updatedAt, ...prefs } = record;
  return prefs;
}

function hasLocalLabPreferencesCache(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LAB_PREFERENCES_STORAGE_KEY) != null;
}

function mergeRemoteLabPreferences(remote: LabPreferences, revisionAtFetch: number): LabPreferences {
  const local = readLabPreferences();
  const themeChangedDuringFetch = getThemePreferenceRevision() !== revisionAtFetch;
  const keepLocalTheme = hasLocalLabPreferencesCache() || themeChangedDuringFetch;
  const merged = keepLocalTheme ? { ...remote, theme: local.theme } : remote;
  saveLabPreferences(merged);
  return merged;
}

export async function fetchLabPreferencesFromApi(): Promise<LabPreferences | null> {
  const revisionAtFetch = getThemePreferenceRevision();
  try {
    const res = await consoleApiFetch("/api/memory/lab-preferences");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ preferences?: LabPreferences }>(payload);
    if (!data?.preferences) return null;
    const prefs = toLabPreferences(data.preferences as LabPreferences & { updatedAt?: string });
    return mergeRemoteLabPreferences(prefs, revisionAtFetch);
  } catch {
    return null;
  }
}

export async function patchLabPreferencesToApi(
  partial: Partial<LabPreferences>,
): Promise<LabPreferences | null> {
  try {
    const res = await consoleApiFetch("/api/memory/lab-preferences", {
      method: "PATCH",
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<{ preferences?: LabPreferences }>(payload);
    if (!data?.preferences) return null;
    const prefs = toLabPreferences(data.preferences as LabPreferences & { updatedAt?: string });
    if (partial.theme !== undefined) {
      saveLabPreferences(prefs);
      return prefs;
    }
    return mergeRemoteLabPreferences(prefs, getThemePreferenceRevision());
  } catch {
    return null;
  }
}

/** Load from API when possible; fall back to local cache. */
export async function loadLabPreferencesHybrid(): Promise<LabPreferences> {
  const remote = await fetchLabPreferencesFromApi();
  if (remote) return remote;
  return readLabPreferences();
}
