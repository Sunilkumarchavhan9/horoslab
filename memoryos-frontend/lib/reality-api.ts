import { getMemoryOSOrgHeaders } from "@/lib/org-scope-client";

const REALITY_BASE = "/api/reality";

type ApiEnvelope<T> =
  | { ok: true; data: T; meta?: unknown }
  | { ok: false; error?: { code?: string; message?: string }; meta?: unknown };

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload ? payload.error?.message : null;
    throw new Error(message || `Reality request failed (${response.status}).`);
  }

  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok) return payload.data;
    throw new Error(payload.error?.message || "Reality request failed.");
  }

  return payload as T;
}

async function realityFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${REALITY_BASE}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...getMemoryOSOrgHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  return readJson<T>(response);
}

export type RealityNode = {
  id: string;
  type: string;
  name: string;
  state?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  sourceConnector?: string;
  sourceId?: string;
  timestamp?: string;
  author?: string;
  workspace?: string;
  confidence?: number;
  evidenceIds?: string[];
};

export type RealityEdge = {
  id: string;
  from: string;
  to: string;
  relationship: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type RealityGraphSnapshot = {
  nodes: RealityNode[];
  edges: RealityEdge[];
  events?: Array<{ id: string; type: string; timestamp?: string; payload?: Record<string, unknown> }>;
};

export type RealityConnection = {
  id: string;
  system: string;
  state: "connected" | "disconnected" | "syncing" | "error";
  lastSyncedAt: string | null;
  healthy: boolean;
  metadata: Record<string, unknown>;
};

export type RealitySource = {
  id: string;
  system: string;
  state: "registered" | "syncing" | "indexed" | "error" | "archived";
  indexedAt: string | null;
  lastSyncedAt: string | null;
  documentsIndexed: number;
  metadata: Record<string, unknown>;
};

export type RealityStatus = {
  backend: string;
  version: string;
  nodes: number;
  edges: number;
  events: number;
  countsByType: Record<string, number>;
  latestEvent: unknown;
  seededAt: string;
  validation: { valid: boolean; errors: string[] };
};

export type RealityQueryResult = {
  answer: string;
  nodes: RealityNode[];
  edges: RealityEdge[];
  evidence: RealityEvidence[];
  totalNodes: number;
  totalEdges: number;
  totalEvidence: number;
};

export type RealityEvidence = {
  id: string;
  nodeId: string;
  title: string;
  summary: string;
  sourceConnector: string;
  sourceId: string;
  timestamp: string;
  author: string;
  workspace: string;
  confidence: number;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
};

export async function getRealityStatus(): Promise<RealityStatus> {
  const payload = await realityFetch<{ status: RealityStatus }>("/status");
  return payload.status;
}

export async function getRealityGraph(): Promise<RealityGraphSnapshot> {
  return realityFetch<RealityGraphSnapshot>("/graph");
}

export async function listRealityConnections(): Promise<{ connections: RealityConnection[]; summary: Record<string, number> }> {
  return realityFetch<{ connections: RealityConnection[]; summary: Record<string, number> }>("/connections");
}

export async function connectRealitySystem(system: string, metadata: Record<string, unknown> = {}): Promise<{ connection: RealityConnection }> {
  return realityFetch<{ connection: RealityConnection }>("/connections", {
    method: "POST",
    body: JSON.stringify({ system, metadata }),
  });
}

export async function getRealityConnection(connectionId: string): Promise<{ connection: RealityConnection }> {
  return realityFetch<{ connection: RealityConnection }>(`/connections/${encodeURIComponent(connectionId)}`);
}

export async function syncRealityConnection(connectionId: string): Promise<{ connection: RealityConnection }> {
  return realityFetch<{ connection: RealityConnection }>(`/connections/${encodeURIComponent(connectionId)}/sync`, {
    method: "POST",
  });
}

export async function listRealitySources(): Promise<{ sources: RealitySource[]; summary: Record<string, number> }> {
  return realityFetch<{ sources: RealitySource[]; summary: Record<string, number> }>("/sources");
}

export async function registerRealitySource(system: string, metadata: Record<string, unknown> = {}): Promise<{ source: RealitySource }> {
  return realityFetch<{ source: RealitySource }>("/sources", {
    method: "POST",
    body: JSON.stringify({ system, metadata }),
  });
}

export async function getRealitySource(sourceId: string): Promise<{ source: RealitySource }> {
  return realityFetch<{ source: RealitySource }>(`/sources/${encodeURIComponent(sourceId)}`);
}

export async function syncRealitySource(sourceId: string): Promise<{ source: RealitySource }> {
  return realityFetch<{ source: RealitySource }>(`/sources/${encodeURIComponent(sourceId)}/sync`, {
    method: "POST",
  });
}

export async function indexRealitySource(sourceId: string, documentsIndexed = 1): Promise<{ source: RealitySource }> {
  return realityFetch<{ source: RealitySource }>(`/sources/${encodeURIComponent(sourceId)}/index`, {
    method: "POST",
    body: JSON.stringify({ documentsIndexed }),
  });
}

export async function queryRealityGraph(input: {
  question?: string;
  search?: string;
  connectedTo?: string;
  relationship?: string;
  direction?: "incoming" | "outgoing" | "any";
  limit?: number;
}): Promise<{ result: RealityQueryResult }> {
  return realityFetch<{ result: RealityQueryResult }>("/query", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getRealityEvidence(evidenceId: string): Promise<{ evidence: RealityEvidence }> {
  return realityFetch<{ evidence: RealityEvidence }>(`/evidence/${encodeURIComponent(evidenceId)}`);
}
