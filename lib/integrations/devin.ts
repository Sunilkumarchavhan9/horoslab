import { randomUUID } from "crypto";
import { extractMemory } from "../memory/extractMemory";
import { upsertRecentMemory } from "../memory/recentMemoryStore";

export interface DevinSyncOptions {
  userId: string;
  accessToken: string;
  orgId: string;
  baseUrl?: string;
  since?: string;
  recentItemKeys?: string[];
  limit?: number;
}

export type DevinSyncDiagnostics = {
  sessionsListed: number;
  sessionsSynced: number;
  sessionsSkipped: number;
};

type DevinSession = {
  id?: string;
  session_id?: string;
  title?: string | null;
  name?: string | null;
  task?: string | null;
  prompt?: string | null;
  summary?: string | null;
  result?: string | null;
  outcome?: string | null;
  status?: string | null;
  url?: string | null;
  app_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created?: string | number | null;
  updated?: string | number | null;
  created_at_ms?: number | null;
  updated_at_ms?: number | null;
};

type DevinSessionsResponse = {
  sessions?: DevinSession[];
  items?: DevinSession[];
  data?: DevinSession[] | { sessions?: DevinSession[]; items?: DevinSession[] };
};

const DEVIN_DEFAULT_BASE_URL = "https://api.devin.ai";
const DEVIN_SESSION_LIMIT = Math.max(1, Math.min(100, Number(process.env.DEVIN_SYNC_SESSION_LIMIT ?? 25)));
const DEVIN_REQUEST_TIMEOUT_MS = Math.max(3_000, Number(process.env.DEVIN_REQUEST_TIMEOUT_MS ?? 15_000));

function normalizeBaseUrl(value: string | undefined): string {
  return (value?.trim() || DEVIN_DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function sessionId(session: DevinSession): string {
  return session.id || session.session_id || "";
}

function sessionTitle(session: DevinSession): string {
  return session.title || session.name || session.task || session.prompt || sessionId(session) || "Untitled Devin session";
}

function toIsoTimestamp(value: string | number | null | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 10_000_000_000 ? value * 1000 : value;
    return new Date(millis).toISOString();
  }
  if (typeof value !== "string" || value.trim().length === 0) return "";
  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      const millis = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
      return new Date(millis).toISOString();
    }
  }
  const millis = new Date(trimmed).getTime();
  return Number.isFinite(millis) ? new Date(millis).toISOString() : "";
}

function sessionUpdatedAt(session: DevinSession): string {
  return (
    toIsoTimestamp(session.updated_at_ms)
    || toIsoTimestamp(session.updated_at)
    || toIsoTimestamp(session.updatedAt)
    || toIsoTimestamp(session.updated)
    || toIsoTimestamp(session.created_at_ms)
    || toIsoTimestamp(session.created_at)
    || toIsoTimestamp(session.createdAt)
    || toIsoTimestamp(session.created)
  );
}

function sessionUrl(session: DevinSession): string | undefined {
  return session.url || session.app_url || undefined;
}

function listSessions(payload: DevinSessionsResponse): DevinSession[] {
  if (Array.isArray(payload.sessions)) return payload.sessions;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.sessions)) return payload.data.sessions;
    if (Array.isArray(payload.data.items)) return payload.data.items;
  }
  return [];
}

function buildSessionMemoryText(session: DevinSession): string {
  const pieces = [
    `Devin agent session: ${sessionTitle(session)}`,
    session.status ? `Status: ${session.status}` : "",
    session.task ? `Task: ${session.task}` : "",
    session.prompt ? `Prompt: ${session.prompt}` : "",
    session.summary ? `Summary: ${session.summary}` : "",
    session.result ? `Result: ${session.result}` : "",
    session.outcome ? `Outcome: ${session.outcome}` : "",
    sessionUrl(session) ? `URL: ${sessionUrl(session)}` : "",
  ];
  return pieces.filter(Boolean).join("\n");
}

async function fetchDevinSessions(options: DevinSyncOptions): Promise<DevinSession[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEVIN_REQUEST_TIMEOUT_MS);
  const url = new URL(
    `${normalizeBaseUrl(options.baseUrl)}/v3/organizations/${encodeURIComponent(options.orgId)}/sessions`,
  );
  url.searchParams.set("limit", String(options.limit ?? DEVIN_SESSION_LIMIT));

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        Accept: "application/json",
      },
    });
    const payload = (await response.json().catch(() => ({}))) as DevinSessionsResponse & {
      error?: unknown;
      message?: unknown;
    };
    if (!response.ok) {
      const message =
        typeof payload.message === "string"
          ? payload.message
          : typeof payload.error === "string"
            ? payload.error
            : `HTTP ${response.status}`;
      throw new Error(`Devin sessions sync failed: ${message}`);
    }
    return listSessions(payload);
  } finally {
    clearTimeout(timeout);
  }
}

export const DevinClient = {
  async sync(options: DevinSyncOptions) {
    const sessions = await fetchDevinSessions(options);
    const diagnostics: DevinSyncDiagnostics = {
      sessionsListed: sessions.length,
      sessionsSynced: 0,
      sessionsSkipped: 0,
    };
    const seen = new Set(options.recentItemKeys ?? []);
    const dedupeKeys: string[] = [];
    const contractCounts: Record<string, number> = {};
    let extractedCount = 0;
    let newestCheckpointMs = options.since ? new Date(options.since).getTime() : 0;
    const sinceMs = options.since ? new Date(options.since).getTime() : 0;
    const now = new Date().toISOString();

    for (const session of sessions) {
      const id = sessionId(session);
      if (!id) {
        diagnostics.sessionsSkipped += 1;
        continue;
      }
      const updatedAt = sessionUpdatedAt(session);
      const updatedMs = updatedAt ? new Date(updatedAt).getTime() : 0;
      if (updatedMs > newestCheckpointMs) newestCheckpointMs = updatedMs;
      if (sinceMs > 0 && updatedMs > 0 && updatedMs <= sinceMs) {
        diagnostics.sessionsSkipped += 1;
        continue;
      }

      const dedupeKey = `devin:session:${id}:${updatedAt || session.status || sessionTitle(session)}`;
      if (seen.has(dedupeKey)) {
        diagnostics.sessionsSkipped += 1;
        continue;
      }

      const sourceRef = `devin-session://${encodeURIComponent(id)}`;
      const evidence = [id, sessionTitle(session), sessionUrl(session)].filter((item): item is string => Boolean(item));
      const content = buildSessionMemoryText(session);
      await upsertRecentMemory({
        id: randomUUID(),
        userId: options.userId,
        type: "project",
        content,
        summary: `Devin session ${sessionTitle(session)} imported as Phase 1 agent-action context.`,
        source: "import",
        status: "active",
        createdAt: now,
        updatedAt: now,
        importanceScore: 0.82,
        confidence: 0.9,
        evidenceCount: evidence.length,
        contractVersion: "memoryos.contract.v1",
        contractCategory: "previous_attempt",
        companyBrainType: "agent_action",
        developerSignals: {
          projectArea: [sessionTitle(session)],
          goal: ["agent handoff", "coding context", "devin session"],
        },
        sourceRef,
        traceProof: {
          sourceType: "devin",
          sourceRef,
          evidence,
          confidence: 0.9,
          capturedAt: now,
        },
      });
      extractedCount += 1;
      contractCounts.previous_attempt = (contractCounts.previous_attempt ?? 0) + 1;

      const candidates = extractMemory({ userId: options.userId, message: content });
      for (const candidate of candidates) {
        await upsertRecentMemory({
          ...candidate,
          id: randomUUID(),
          source: "import",
          status: "active",
          createdAt: now,
          updatedAt: now,
          importanceScore: 0.8,
          confidence: 0.88,
          evidenceCount: Math.max(1, evidence.length),
          developerSignals: {
            ...candidate.developerSignals,
            projectArea: Array.from(
              new Set([...(candidate.developerSignals?.projectArea ?? []), sessionTitle(session)]),
            ),
            goal: Array.from(
              new Set([...(candidate.developerSignals?.goal ?? []), "agent handoff", "coding context"]),
            ),
          },
          sourceRef: candidate.sourceRef ?? sourceRef,
          traceProof: {
            sourceType: "devin",
            sourceRef: candidate.sourceRef ?? sourceRef,
            evidence,
            confidence: 0.88,
            capturedAt: now,
          },
        });
        extractedCount += 1;
        if (candidate.contractCategory) {
          contractCounts[candidate.contractCategory] = (contractCounts[candidate.contractCategory] ?? 0) + 1;
        }
      }

      dedupeKeys.push(dedupeKey);
      diagnostics.sessionsSynced += 1;
    }

    return {
      success: true,
      extractedCount,
      checkpoint: newestCheckpointMs > 0 ? new Date(newestCheckpointMs).toISOString() : now,
      dedupeKeys,
      contractCounts,
      diagnostics,
    };
  },
};
