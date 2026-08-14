export type SourceProvider = {
  id: string;
  name: string;
  category: string;
  firstLaunch: boolean;
  status: "available" | "later";
  icon: string;
  description: string;
};

export type CompanySource = {
  id: string;
  workspaceId: string;
  provider: string;
  providerName?: string;
  category?: string;
  icon?: string;
  type: string;
  status: "connected" | "not_connected" | "syncing" | "synced" | "error" | "disconnected";
  permissions: Record<string, unknown>;
  lastSyncedAt?: string | null;
  createdAt: string;
  itemCount?: number;
  memoryCount?: number;
  syncError?: string | null;
  health?: number | null;
  firstLaunch?: boolean;
};

const STICKY_STORAGE_PREFIX = "memoryos.company-sources.sticky.v1";

function getStickyWorkspaceKey(workspaceId: string): string {
  return `${STICKY_STORAGE_PREFIX}:${workspaceId}`;
}

function getCompanySourceIdentity(source: Pick<CompanySource, "id" | "provider" | "providerName" | "type">): string {
  const identity = [
    source.provider?.trim().toLowerCase(),
    source.providerName?.trim().toLowerCase(),
    source.type?.trim().toLowerCase(),
    source.id?.trim().toLowerCase(),
  ]
    .filter((value): value is string => Boolean(value))
    .join("::");

  return identity || source.id.trim().toLowerCase();
}

function isBrowserStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function isLiveCompanySource(source?: Pick<CompanySource, "status"> | null): boolean {
  return ["connected", "syncing", "synced"].includes((source?.status ?? "").toLowerCase());
}

export function findCompanySourceForProvider(
  sources: CompanySource[],
  providerId: string,
  providerName?: string,
): CompanySource | null {
  const id = providerId.trim().toLowerCase();
  const name = providerName?.trim().toLowerCase();
  const matches = sources.filter((source) =>
    source.provider?.trim().toLowerCase() === id ||
    source.type?.trim().toLowerCase() === id ||
    (name && source.providerName?.trim().toLowerCase() === name),
  );
  return matches.find((source) => isLiveCompanySource(source)) ?? matches[0] ?? null;
}

function readStickyCompanySources(workspaceId: string): CompanySource[] {
  if (!isBrowserStorageAvailable()) {
    return [];
  }

  const raw = window.localStorage.getItem(getStickyWorkspaceKey(workspaceId));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is CompanySource => Boolean(item) && typeof item === "object") as CompanySource[];
  } catch {
    return [];
  }
}

function writeStickyCompanySources(workspaceId: string, sources: CompanySource[]): void {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  if (sources.length === 0) {
    window.localStorage.removeItem(getStickyWorkspaceKey(workspaceId));
    return;
  }

  window.localStorage.setItem(getStickyWorkspaceKey(workspaceId), JSON.stringify(sources));
}

export function rememberStickyCompanySource(workspaceId: string, source: CompanySource): void {
  if (!workspaceId || !isLiveCompanySource(source)) {
    return;
  }

  const current = readStickyCompanySources(workspaceId);
  const identity = getCompanySourceIdentity(source);
  const next = [...current.filter((item) => getCompanySourceIdentity(item) !== identity), source];
  writeStickyCompanySources(workspaceId, next);
}

export function clearStickyCompanySource(
  workspaceId: string,
  source: Pick<CompanySource, "id" | "provider" | "providerName" | "type"> | string,
): void {
  if (!workspaceId) {
    return;
  }

  const identity =
    typeof source === "string"
      ? source.trim().toLowerCase()
      : getCompanySourceIdentity(source);

  const current = readStickyCompanySources(workspaceId);
  const next = current.filter((item) => getCompanySourceIdentity(item) !== identity);
  writeStickyCompanySources(workspaceId, next);
}

function mergeCompanySourceByIdentity(previous: CompanySource | undefined, next: CompanySource): CompanySource {
  if (!previous) {
    return next;
  }

  const previousLive = isLiveCompanySource(previous);
  const nextLive = isLiveCompanySource(next);

  if (previousLive && !nextLive) {
    return previous;
  }

  if (!previousLive && nextLive) {
    return next;
  }

  return next;
}

export function mergeCompanySourcesWithSticky(
  workspaceId: string,
  fetched: CompanySource[],
  previous: CompanySource[] = [],
): CompanySource[] {
  const stickySources = workspaceId ? readStickyCompanySources(workspaceId) : [];
  const map = new Map<string, CompanySource>();

  for (const source of [...previous, ...stickySources, ...fetched]) {
    const identity = getCompanySourceIdentity(source);
    const existing = map.get(identity);
    map.set(identity, mergeCompanySourceByIdentity(existing, source));
  }

  const merged = Array.from(map.values());

  if (workspaceId) {
    writeStickyCompanySources(
      workspaceId,
      merged.filter((source) => isLiveCompanySource(source)),
    );
  }

  return merged;
}

export function dedupeCompanySourcesForDisplay(sources: CompanySource[]): CompanySource[] {
  const byId = new Map<string, CompanySource>();

  for (const source of sources) {
    const key = source.id.trim().toLowerCase();
    const existing = byId.get(key);

    if (!existing) {
      byId.set(key, source);
      continue;
    }

    const existingLive = isLiveCompanySource(existing);
    const nextLive = isLiveCompanySource(source);

    if (nextLive && !existingLive) {
      byId.set(key, source);
      continue;
    }

    if (nextLive === existingLive) {
      const existingStamp = existing.lastSyncedAt ?? existing.createdAt ?? "";
      const nextStamp = source.lastSyncedAt ?? source.createdAt ?? "";
      if (nextStamp.localeCompare(existingStamp) >= 0) {
        byId.set(key, source);
      }
    }
  }

  return Array.from(byId.values());
}

export function mergeCompanySourceWithSticky(
  workspaceId: string,
  fetched: CompanySource | null | undefined,
  previous?: CompanySource | null,
): CompanySource | null {
  if (!fetched && !previous) {
    return null;
  }

  const merged = mergeCompanySourcesWithSticky(
    workspaceId,
    fetched ? [fetched] : [],
    previous ? [previous] : [],
  );

  return merged[0] ?? fetched ?? previous ?? null;
}

export type SourceSummary = {
  connectedSources: number;
  totalSources: number;
  itemsImported: number;
  memoriesExtracted: number;
  syncHealth: number;
  syncErrors: number;
  lastSyncAt?: string | null;
};

export type SourceItem = {
  id: string;
  sourceId: string;
  type: string;
  title: string;
  content: string;
  url?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SourceMemory = {
  id: string;
  title: string;
  type: string;
  summary: string;
  qualityScore: number;
  riskLevel: string;
  status: string;
  createdAt: string;
};

export type SourceEvent = {
  id: string;
  eventType?: string;
  kind?: string;
  occurredAt: string;
  sourceId?: string;
  itemId?: string;
  jobId?: string;
  error?: string;
  itemCount?: number;
  memoryCount?: number;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

async function sourceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/sources${path}`, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...getMemoryOSOrgHeaders(),
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  return readJson<T>(response);
}

export async function getSourcesSummary(): Promise<SourceSummary> {
  const payload = await sourceFetch<{ summary: SourceSummary }>("/summary");
  return payload.summary;
}

export async function listSources(category?: string): Promise<CompanySource[]> {
  const suffix = category && category !== "All Sources" ? `?category=${encodeURIComponent(category)}` : "";
  const payload = await sourceFetch<{ sources: CompanySource[] }>(suffix);
  return payload.sources;
}

export async function listSourceProviders(): Promise<SourceProvider[]> {
  const payload = await sourceFetch<{ providers: SourceProvider[] }>("/providers");
  return payload.providers;
}

export async function getSource(id: string): Promise<CompanySource> {
  const payload = await sourceFetch<{ source: CompanySource }>(`/${encodeURIComponent(id)}`);
  return payload.source;
}

export async function connectSource(provider: string): Promise<CompanySource> {
  const payload = await sourceFetch<{ source: CompanySource }>("/connect", {
    method: "POST",
    body: JSON.stringify({ provider }),
  });
  return payload.source;
}

export async function syncSourceNow(id: string): Promise<{ source: CompanySource; job: Record<string, unknown> }> {
  return sourceFetch<{ source: CompanySource; job: Record<string, unknown> }>(`/${encodeURIComponent(id)}/sync`, {
    method: "POST",
  });
}

export async function disconnectSource(id: string): Promise<CompanySource> {
  const payload = await sourceFetch<{ source: CompanySource }>(`/${encodeURIComponent(id)}/disconnect`, {
    method: "POST",
  });
  return payload.source;
}

export async function reconnectSource(id: string): Promise<CompanySource> {
  const payload = await sourceFetch<{ source: CompanySource }>(`/${encodeURIComponent(id)}/reconnect`, {
    method: "POST",
  });
  return payload.source;
}

export async function getSourceItems(id: string): Promise<SourceItem[]> {
  const payload = await sourceFetch<{ items: SourceItem[] }>(`/${encodeURIComponent(id)}/items`);
  return payload.items;
}

export async function getSourceMemories(id: string): Promise<SourceMemory[]> {
  const payload = await sourceFetch<{ memories: SourceMemory[] }>(`/${encodeURIComponent(id)}/memories`);
  return payload.memories;
}

export async function getSourceErrors(id: string): Promise<SourceEvent[]> {
  const payload = await sourceFetch<{ errors: SourceEvent[] }>(`/${encodeURIComponent(id)}/errors`);
  return payload.errors;
}

export async function getSourceSyncEvents(id: string): Promise<SourceEvent[]> {
  const payload = await sourceFetch<{ events: SourceEvent[] }>(`/${encodeURIComponent(id)}/sync-events`);
  return payload.events;
}

export async function manualImport(input: {
  title?: string;
  content?: string;
  files?: Array<{ name: string; content: string }>;
}): Promise<{ source: CompanySource; items: SourceItem[] }> {
  return sourceFetch<{ source: CompanySource; items: SourceItem[] }>("/manual-import", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function pasteAgentChat(input: {
  title?: string;
  agent?: string;
  content: string;
}): Promise<{ source: CompanySource; item: SourceItem }> {
  return sourceFetch<{ source: CompanySource; item: SourceItem }>("/agent-chat-paste", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
import { getMemoryOSOrgHeaders } from "@/lib/org-scope-client";
