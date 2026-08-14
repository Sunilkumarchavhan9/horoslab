/**
 * Session aggregation for MemoryOS-native continuity lab.
 */

import { consoleApiFetch } from "@/lib/console-api";
import { readUserPreferences } from "@/lib/continuity-lab/user-preferences-storage";
import { searchLabSessions, type LabSessionSummary } from "@/lib/continuity-lab/sessions";
import { searchAppConversations } from "@/lib/continuity-lab/openhands-api";

export type LabSessionsFetchSources = {
  memoryos: number;
  productAgent: number;
  continuityThreads: number;
};

export type LabSessionsFetchResult = {
  sessions: LabSessionSummary[];
  sources: LabSessionsFetchSources;
  openhandsError: string | null;
  runtimeReachable: boolean;
};

function defaultCreator(): string {
  const name = readUserPreferences().displayName.trim();
  return name || "You";
}

type ProductAgentSessionRecord = {
  id: string;
  goal?: string | null;
  projectId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: string | null;
};

type ContinuityThreadRecord = {
  id: string;
  title?: string | null;
  project?: string | null;
  repoPath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: string | null;
  linkedPrs?: string[];
};

type OpenHandsConversationRecord = {
  id: string;
  title?: string | null;
  selected_repository?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  execution_status?: string | null;
  sandbox_status?: string | null;
};

async function fetchProductAgentSessions(limit: number): Promise<LabSessionSummary[]> {
  try {
    const res = await consoleApiFetch(`/api/agent/sessions?limit=${limit}`);
    if (!res.ok) return [];
    const payload = await res.json().catch(() => null);
    const sessions = Array.isArray(payload?.sessions) ? (payload.sessions as ProductAgentSessionRecord[]) : [];
    return sessions.slice(0, limit).map((session) => ({
      id: session.id,
      title: session.goal?.trim() || "Product agent session",
      repo: session.projectId ?? null,
      createdAt: session.createdAt ?? new Date().toISOString(),
      updatedAt: session.updatedAt ?? session.createdAt ?? new Date().toISOString(),
      source: "product_agent",
      status: session.status,
      creator: "MemoryOS Agent",
      navigable: false,
    }));
  } catch {
    return [];
  }
}

async function fetchContinuityThreads(limit: number): Promise<LabSessionSummary[]> {
  try {
    const res = await consoleApiFetch(`/api/runtime/threads?limit=${limit}`);
    if (!res.ok) return [];
    const payload = await res.json().catch(() => null);
    const threads = Array.isArray(payload?.threads) ? (payload.threads as ContinuityThreadRecord[]) : [];
    return threads.slice(0, limit).map((thread) => ({
      id: thread.id,
      title: thread.title?.trim() || thread.project || "Continuity thread",
      repo: thread.repoPath ?? null,
      createdAt: thread.createdAt ?? new Date().toISOString(),
      updatedAt: thread.updatedAt ?? thread.createdAt ?? new Date().toISOString(),
      source: "continuity_thread",
      status: thread.status,
      creator: defaultCreator(),
      prUrls: thread.linkedPrs,
      navigable: false,
    }));
  } catch {
    return [];
  }
}

async function fetchOpenHandsSessions(limit: number): Promise<LabSessionSummary[]> {
  const conversations = await searchAppConversations(limit);
  return (conversations as OpenHandsConversationRecord[]).map((conversation) => ({
    id: conversation.id,
    title:
      conversation.title?.trim() ||
      (conversation.id?.trim() ? `Session ${conversation.id.slice(0, 8)}` : "Session"),
    repo: conversation.selected_repository ?? null,
    createdAt: conversation.created_at ?? new Date().toISOString(),
    updatedAt: conversation.updated_at ?? conversation.created_at ?? new Date().toISOString(),
    source: "memoryos",
    status: conversation.execution_status ?? conversation.sandbox_status,
    creator: defaultCreator(),
    sandboxStatus: conversation.sandbox_status,
    executionStatus: conversation.execution_status,
    navigable: true,
  }));
}

function mergeSessionLists(lists: LabSessionSummary[]): LabSessionSummary[] {
  const byId = new Map<string, LabSessionSummary>();
  for (const session of lists) {
    const existing = byId.get(session.id);
    if (!existing || session.updatedAt > existing.updatedAt) {
      byId.set(session.id, session);
    }
  }
  return [...byId.values()];
}

export async function fetchLabSessions(
  input: number | { limit?: number; signal?: AbortSignal } = 20,
): Promise<LabSessionsFetchResult> {
  const limit = typeof input === "number" ? input : input.limit ?? 20;
  const signal = typeof input === "number" ? undefined : input.signal;
  const [memoryos, openhands, productAgent, continuityThreads] = await Promise.all([
    searchLabSessions(limit),
    fetchOpenHandsSessions(limit),
    fetchProductAgentSessions(limit),
    fetchContinuityThreads(limit),
  ]);
  if (signal?.aborted) {
    return {
      sessions: [],
      sources: { memoryos: 0, productAgent: 0, continuityThreads: 0 },
      openhandsError: null,
      runtimeReachable: true,
    };
  }
  return {
    sessions: mergeSessionLists([...openhands, ...memoryos, ...productAgent, ...continuityThreads]).slice(0, limit),
    sources: {
      memoryos: mergeSessionLists([...openhands, ...memoryos]).length,
      productAgent: productAgent.length,
      continuityThreads: continuityThreads.length,
    },
    openhandsError: null,
    runtimeReachable: true,
  };
}

export async function fetchLabSessionsList(
  input: number | { limit?: number; signal?: AbortSignal } = 20,
): Promise<LabSessionsFetchResult> {
  return fetchLabSessions(input);
}
