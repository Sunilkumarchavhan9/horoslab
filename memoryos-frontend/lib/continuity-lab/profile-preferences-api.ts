import {
  getProfilePreferencesRevision,
  readProfilePreferences,
  saveProfilePreferences,
  type ProfilePreferences,
} from "@/lib/continuity-lab/profile-preferences-storage";

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown; ok?: boolean; preferences?: unknown; error?: unknown };
  if (record.error) return null;
  return (record.preferences ?? record.data ?? payload) as T;
}

function hasLocalProfilePreferencesCache(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("memoryos-profile-preferences") != null;
}

function mergeRemoteProfilePreferences(remote: ProfilePreferences, revisionAtFetch: number): ProfilePreferences {
  const local = readProfilePreferences();
  const changedDuringFetch = getProfilePreferencesRevision() !== revisionAtFetch;
  
  // If the user modified preferences locally while we were fetching, we shouldn't fully overwrite.
  // We'll merge local state on top of remote, but if no changes occurred, remote wins.
  const merged = changedDuringFetch ? { ...remote, ...local } : remote;
  
  saveProfilePreferences(merged);
  return merged;
}

export async function fetchProfilePreferencesFromApi(): Promise<ProfilePreferences | null> {
  const revisionAtFetch = getProfilePreferencesRevision();
  try {
    const res = await fetch("/api/profile-preferences");
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<Partial<ProfilePreferences>>(payload);
    if (!data) return null;
    
    // Fallbacks for any missing properties since it's a partial from the backend
    const defaultPrefs = readProfilePreferences(); 
    const prefs = { ...defaultPrefs, ...data } as ProfilePreferences;
    
    return mergeRemoteProfilePreferences(prefs, revisionAtFetch);
  } catch {
    return null;
  }
}

export async function patchProfilePreferencesToApi(
  partial: Partial<ProfilePreferences>,
): Promise<ProfilePreferences | null> {
  try {
    const res = await fetch("/api/profile-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const data = unwrapData<Partial<ProfilePreferences>>(payload);
    if (!data) return null;

    const defaultPrefs = readProfilePreferences();
    const prefs = { ...defaultPrefs, ...data } as ProfilePreferences;
    
    saveProfilePreferences(prefs);
    return prefs;
  } catch {
    return null;
  }
}

/** Load from API when possible; fall back to local cache. */
export async function loadProfilePreferencesHybrid(): Promise<ProfilePreferences> {
  const remote = await fetchProfilePreferencesFromApi();
  if (remote) return remote;
  return readProfilePreferences();
}
