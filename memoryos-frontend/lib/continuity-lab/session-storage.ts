/**
 * Client-side session metadata (archive, pin, rename, tags, network) for Continuity Lab.
 * Persisted in localStorage (migrated once from legacy sessionStorage keys).
 */

const META_KEY = "memoryos.continuity-lab.session-meta";
const ARCHIVED_KEY = "memoryos.continuity-lab.archived-session-ids";
const TERMINATED_KEY = "memoryos.continuity-lab.terminated-session-ids";

const LEGACY_META_KEY = META_KEY;
const LEGACY_ARCHIVED_KEY = ARCHIVED_KEY;
const LEGACY_TERMINATED_KEY = TERMINATED_KEY;

export type LabSessionMeta = {
  title?: string;
  pinned?: boolean;
  archived?: boolean;
  tags?: string[];
  category?: string;
  networkControlsEnabled?: boolean;
  hiddenFromTeam?: boolean;
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function migrateLegacySessionStorage(): void {
  if (typeof window === "undefined") return;
  const ls = window.localStorage;
  const ss = window.sessionStorage;
  if (!ls.getItem(META_KEY) && ss.getItem(LEGACY_META_KEY)) {
    ls.setItem(META_KEY, ss.getItem(LEGACY_META_KEY)!);
  }
  if (!ls.getItem(ARCHIVED_KEY) && ss.getItem(LEGACY_ARCHIVED_KEY)) {
    ls.setItem(ARCHIVED_KEY, ss.getItem(LEGACY_ARCHIVED_KEY)!);
  }
  if (!ls.getItem(TERMINATED_KEY) && ss.getItem(LEGACY_TERMINATED_KEY)) {
    ls.setItem(TERMINATED_KEY, ss.getItem(LEGACY_TERMINATED_KEY)!);
  }
}

function readMetaMap(): Record<string, LabSessionMeta> {
  migrateLegacySessionStorage();
  const store = storage();
  if (!store) return {};
  try {
    const raw = store.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LabSessionMeta>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMetaMap(map: Record<string, LabSessionMeta>): void {
  const store = storage();
  if (!store) return;
  store.setItem(META_KEY, JSON.stringify(map));
}

function readIdSet(key: string): Set<string> {
  migrateLegacySessionStorage();
  const store = storage();
  if (!store) return new Set();
  try {
    const raw = store.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeIdSet(key: string, ids: Set<string>): void {
  const store = storage();
  if (!store) return;
  store.setItem(key, JSON.stringify([...ids]));
}

export function getLabSessionMeta(sessionId: string): LabSessionMeta {
  return readMetaMap()[sessionId] ?? {};
}

export function setLabSessionTitle(sessionId: string, title: string): void {
  const map = readMetaMap();
  map[sessionId] = { ...map[sessionId], title: title.trim() || undefined };
  writeMetaMap(map);
}

export function setLabSessionPinned(sessionId: string, pinned: boolean): void {
  const map = readMetaMap();
  map[sessionId] = { ...map[sessionId], pinned };
  writeMetaMap(map);
}

export function setLabSessionTags(sessionId: string, tags: string[]): void {
  const map = readMetaMap();
  const cleaned = tags.map((t) => t.trim()).filter(Boolean);
  map[sessionId] = {
    ...map[sessionId],
    tags: cleaned.length > 0 ? cleaned : undefined,
  };
  writeMetaMap(map);
}

export function setLabSessionCategory(sessionId: string, category: string | undefined): void {
  const map = readMetaMap();
  map[sessionId] = {
    ...map[sessionId],
    category: category?.trim() || undefined,
  };
  writeMetaMap(map);
}

export function setLabSessionNetworkControls(
  sessionId: string,
  enabled: boolean,
): void {
  const map = readMetaMap();
  map[sessionId] = {
    ...map[sessionId],
    networkControlsEnabled: enabled,
  };
  writeMetaMap(map);
}

export function isLabSessionNetworkControlsEnabled(sessionId: string): boolean {
  return Boolean(getLabSessionMeta(sessionId).networkControlsEnabled);
}

export function toggleLabSessionPin(sessionId: string): boolean {
  const next = !isLabSessionPinned(sessionId);
  setLabSessionPinned(sessionId, next);
  return next;
}

export function isLabSessionArchived(sessionId: string): boolean {
  if (readIdSet(ARCHIVED_KEY).has(sessionId)) return true;
  return Boolean(getLabSessionMeta(sessionId).archived);
}

export function archiveLabSession(sessionId: string): void {
  const ids = readIdSet(ARCHIVED_KEY);
  ids.add(sessionId);
  writeIdSet(ARCHIVED_KEY, ids);
  const map = readMetaMap();
  map[sessionId] = { ...map[sessionId], archived: true };
  writeMetaMap(map);
}

export function unarchiveLabSession(sessionId: string): void {
  const ids = readIdSet(ARCHIVED_KEY);
  ids.delete(sessionId);
  writeIdSet(ARCHIVED_KEY, ids);
  const map = readMetaMap();
  map[sessionId] = { ...map[sessionId], archived: false };
  writeMetaMap(map);
}

export function isLabSessionTerminated(sessionId: string): boolean {
  return readIdSet(TERMINATED_KEY).has(sessionId);
}

export function terminateLabSession(sessionId: string): void {
  const ids = readIdSet(TERMINATED_KEY);
  ids.add(sessionId);
  writeIdSet(TERMINATED_KEY, ids);
}

export function displaySessionTitle(
  sessionId: string,
  fallback: string,
): string {
  return getLabSessionMeta(sessionId).title?.trim() || fallback;
}

export function isLabSessionPinned(sessionId: string): boolean {
  return Boolean(getLabSessionMeta(sessionId).pinned);
}

/** Suggested tags for quick pick in the Edit Tags modal. */
export const LAB_SESSION_QUICK_TAGS = [
  "continuity",
  "review",
  "bugfix",
  "feature",
  "ops",
  "experiment",
  "docs",
  "security",
] as const;

export const LAB_SESSION_STORAGE_EVENT = "memoryos:continuity-lab-session-storage";

export function notifyLabSessionStorageChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LAB_SESSION_STORAGE_EVENT));
}
