import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { listMemories } from "../memory/listMemory";
import { ConnectorManager, type ConnectorType } from "../integrations/connectorManager";
import { runIngestFlowLangGraph } from "../workflows/ingestGraphLangGraph";
import { google } from "googleapis";
import { deliverAlert } from "./alertDelivery";
import { ackQueueJob, failQueueJob, getQueueBackend, getQueueBackendInfo } from "./queueBackend";
import { prisma } from "../storage/prismaClient";
import { Client as NotionClient } from "@notionhq/client";
import { Octokit } from "@octokit/rest";
import { fetchCrmProvider, fetchDbProvider, fetchSupportProvider } from "./providerAdapters";

type SourceType = "github" | "notion" | "local_files" | "slack" | "gmail" | "support" | "crm" | "db";

type SourceConfig = {
  id: string;
  userId: string;
  type: SourceType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
};

type GraphNode = {
  id: string;
  type: "person" | "team" | "system" | "policy" | "incident" | "decision" | "runbook" | "risk";
  label: string;
  confidence: number;
  evidenceMemoryIds: string[];
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: "owns" | "depends_on" | "blocked_by" | "resolved_by" | "governed_by" | "implements";
  confidence: number;
};

type CompiledSkill = {
  id: string;
  title: string;
  body: string;
  confidence: number;
  provenance: string[];
  requiredApprovals: Array<"owner" | "admin" | "operator">;
  riskLevel: "low" | "medium" | "high";
  executionConstraints: string[];
  tests: string[];
};

type ExecutionResult = {
  ok: boolean;
  detail: string;
  externalRef?: string;
};

type ActionRequest = {
  id: string;
  userId: string;
  name: string;
  payload: Record<string, unknown>;
  risk: "low" | "medium" | "high";
  status: "pending" | "approved" | "executed" | "rejected" | "failed";
  requiredApprovals: Array<"owner" | "admin" | "operator">;
  approvals: Array<{
    reviewerUserId: string;
    reviewerRole: "owner" | "admin" | "operator" | "viewer";
    decision: "approve" | "reject";
    at: string;
  }>;
  executionConstraints: string[];
  executionResult?: ExecutionResult;
  createdAt: string;
  updatedAt: string;
};

type AuditEvent = {
  id: string;
  userId: string;
  type: string;
  at: string;
  detail: string;
};

type QueueJob = {
  id: string;
  userId: string;
  type: "sync_all_sources" | "rebuild_graph" | "compile_skills";
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  error?: string;
};

type UserState = {
  sources: SourceConfig[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    updatedAt: string | null;
  };
  skills: {
    items: CompiledSkill[];
    updatedAt: string | null;
  };
  actions: ActionRequest[];
  audit: AuditEvent[];
  queue: QueueJob[];
  scheduler: {
    enabled: boolean;
    intervalSeconds: number;
    lastTickAt: string | null;
    lastError: string | null;
  };
  roles: Array<{
    userId: string;
    role: "owner" | "admin" | "operator" | "viewer";
    scopes: string[];
  }>;
  governance: {
    riskPolicy: Record<"low" | "medium" | "high", {
      autoExecute: boolean;
      requiredApprovals: Array<"owner" | "admin" | "operator">;
    }>;
  };
  compliance: {
    sourcePolicies: Record<SourceType, {
      redactPII: boolean;
      retentionClass: "short" | "standard" | "extended";
      ttlHours: number;
      requireReplayApproval: boolean;
    }>;
  };
  auditReplayApprovals: Array<{
    id: string;
    from?: string;
    to?: string;
    status: "pending" | "approved" | "rejected";
    requestedBy: string;
    reviewedBy?: string;
    createdAt: string;
    reviewedAt?: string;
    note?: string;
  }>;
  sourceEvents: Array<{
    id: string;
    sourceType: SourceType;
    payload: Record<string, unknown>;
    status: "pending" | "processed" | "failed" | "dead_letter";
    attempts: number;
    createdAt: string;
    updatedAt: string;
    nextAttemptAt?: string;
    deadLetteredAt?: string;
    error?: string;
  }>;
  sre: {
    alerts: Array<{
      id: string;
      at: string;
      level: "info" | "warning" | "critical";
      message: string;
      context?: Record<string, unknown>;
    }>;
    workers: Array<{
      id: string;
      name: string;
      status: "idle" | "running" | "error";
      lastHeartbeatAt: string | null;
      lastError: string | null;
    }>;
  };
};

type StoreFile = {
  users: Record<string, UserState>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "company-brain-platform.json");
const schedulerTimers = new Map<string, NodeJS.Timeout>();
const runtimeBootstrappedUsers = new Set<string>();
const SOURCE_EVENT_MAX_ATTEMPTS = Number(process.env.COMPANY_BRAIN_SOURCE_EVENT_MAX_ATTEMPTS ?? 5);
const SOURCE_EVENT_BASE_BACKOFF_SECONDS = Number(process.env.COMPANY_BRAIN_SOURCE_EVENT_BACKOFF_BASE_SECONDS ?? 20);
const WORKER_STALE_SECONDS = Number(process.env.COMPANY_BRAIN_WORKER_STALE_SECONDS ?? 180);

function nowIso(): string {
  return new Date().toISOString();
}

function addSeconds(iso: string, seconds: number): string {
  return new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
}

function readStore(): StoreFile {
  if (!existsSync(STORE_PATH)) {
    return { users: {} };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed || typeof parsed !== "object" || !parsed.users || typeof parsed.users !== "object") {
      return { users: {} };
    }
    return parsed;
  } catch {
    return { users: {} };
  }
}

function writeStore(store: StoreFile): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function defaultUserState(): UserState {
  return {
    sources: [],
    graph: { nodes: [], edges: [], updatedAt: null },
    skills: { items: [], updatedAt: null },
    actions: [],
    audit: [],
    queue: [],
    scheduler: { enabled: false, intervalSeconds: 300, lastTickAt: null, lastError: null },
    roles: [],
    governance: {
      riskPolicy: {
        low: { autoExecute: true, requiredApprovals: ["operator"] },
        medium: { autoExecute: false, requiredApprovals: ["admin", "operator"] },
        high: { autoExecute: false, requiredApprovals: ["owner", "admin"] },
      },
    },
    compliance: {
      sourcePolicies: {
        github: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 90, requireReplayApproval: false },
        notion: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 90, requireReplayApproval: false },
        local_files: { redactPII: true, retentionClass: "extended", ttlHours: 24 * 180, requireReplayApproval: false },
        slack: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 30, requireReplayApproval: true },
        gmail: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 30, requireReplayApproval: true },
        support: { redactPII: true, retentionClass: "short", ttlHours: 24 * 30, requireReplayApproval: true },
        crm: { redactPII: true, retentionClass: "extended", ttlHours: 24 * 180, requireReplayApproval: true },
        db: { redactPII: true, retentionClass: "standard", ttlHours: 24 * 90, requireReplayApproval: true },
      },
    },
    auditReplayApprovals: [],
    sourceEvents: [],
    sre: {
      alerts: [],
      workers: [],
    },
  };
}

function mutateUser<T>(userId: string, fn: (state: UserState) => T): T {
  const store = readStore();
  const state = store.users[userId] ?? defaultUserState();
  const result = fn(state);
  store.users[userId] = state;
  writeStore(store);
  return result;
}

function audit(userId: string, type: string, detail: string): void {
  mutateUser(userId, (state) => {
    state.audit.unshift({ id: randomUUID(), userId, type, detail, at: nowIso() });
    state.audit = state.audit.slice(0, 500);
  });
}

function pushAlert(
  userId: string,
  level: "info" | "warning" | "critical",
  message: string,
  context?: Record<string, unknown>,
): void {
  const at = nowIso();
  mutateUser(userId, (state) => {
    state.sre.alerts.unshift({
      id: randomUUID(),
      at,
      level,
      message,
      ...(context ? { context } : {}),
    });
    state.sre.alerts = state.sre.alerts.slice(0, 300);
  });
  void deliverAlert({
    userId,
    level,
    message,
    at,
    ...(context ? { context } : {}),
  });
}

function sanitize(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b\d{10,}\b/g, "[redacted-number]");
}

function sanitizeStrictPII(text: string): string {
  return sanitize(text)
    .replace(/\b(?:\+?\d{1,3}[-\s]?)?(?:\d{3}[-\s]?){2}\d{4}\b/g, "[redacted-phone]")
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[redacted-card]");
}

function hasSensitivePII(text: string): boolean {
  return (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
    || /\b(?:\+?\d{1,3}[-\s]?)?(?:\d{3}[-\s]?){2}\d{4}\b/.test(text)
    || /\b(?:\d[ -]*?){13,16}\b/.test(text)
  );
}

function payloadHasSensitivePII(payload: Record<string, unknown>): boolean {
  const stack: unknown[] = [payload];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === "string") {
      if (hasSensitivePII(current)) return true;
      continue;
    }
    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }
    if (current && typeof current === "object") {
      for (const value of Object.values(current as Record<string, unknown>)) stack.push(value);
    }
  }
  return false;
}

function sourceTypeFromActionName(name: string): SourceType | null {
  const n = name.toLowerCase();
  if (n.includes("github_")) return "github";
  if (n.includes("notion_")) return "notion";
  if (n.includes("slack_")) return "slack";
  if (n.includes("gmail_")) return "gmail";
  if (n.includes("support_")) return "support";
  if (n.includes("crm_")) return "crm";
  if (n.includes("db_")) return "db";
  return null;
}

function ttlBoundsForClass(retentionClass: "short" | "standard" | "extended"): { min: number; max: number } {
  if (retentionClass === "short") return { min: 24, max: 24 * 30 };
  if (retentionClass === "standard") return { min: 24 * 30, max: 24 * 90 };
  return { min: 24 * 90, max: 24 * 365 };
}

function sourcePolicy(userId: string, source: SourceType): UserState["compliance"]["sourcePolicies"][SourceType] {
  return mutateUser(userId, (state) => state.compliance.sourcePolicies[source]);
}

function updateSourceConfig(userId: string, sourceType: SourceType, patch: Record<string, unknown>): void {
  mutateUser(userId, (state) => {
    const source = state.sources.find((item) => item.type === sourceType);
    if (!source) return;
    source.config = {
      ...source.config,
      ...patch,
    };
    source.updatedAt = nowIso();
  });
}

export function listSources(userId: string): SourceConfig[] {
  return mutateUser(userId, (state) => state.sources);
}

export function upsertSource(userId: string, input: {
  type: SourceType;
  enabled?: boolean;
  config?: Record<string, unknown>;
}): SourceConfig {
  return mutateUser(userId, (state) => {
    const existing = state.sources.find((item) => item.type === input.type);
    const updatedAt = nowIso();
    if (existing) {
      existing.enabled = input.enabled ?? existing.enabled;
      existing.updatedAt = updatedAt;
      existing.config = { ...existing.config, ...(input.config ?? {}) };
      audit(userId, "source.updated", `${input.type} enabled=${String(existing.enabled)}`);
      if (existing.enabled && !runtimeBootstrappedUsers.has(userId)) {
        runtimeBootstrappedUsers.add(userId);
      }
      return existing;
    }
    const created: SourceConfig = {
      id: randomUUID(),
      userId,
      type: input.type,
      enabled: input.enabled ?? true,
      createdAt: updatedAt,
      updatedAt,
      config: input.config ?? {},
    };
    state.sources.push(created);
    audit(userId, "source.created", `${input.type} enabled=${String(created.enabled)}`);
    if (created.enabled && !runtimeBootstrappedUsers.has(userId)) {
      runtimeBootstrappedUsers.add(userId);
    }
    return created;
  });
}

async function syncOneSource(userId: string, source: SourceConfig): Promise<number> {
  if (!source.enabled) return 0;
  if (source.type === "github" || source.type === "notion" || source.type === "local_files") {
    const result = await ConnectorManager.triggerSync(userId, source.type as ConnectorType);
    return result.extractedCount ?? 0;
  }
  // External enterprise sources ingest via push API/webhooks into memory; keep as 0 pull count.
  return 0;
}

export async function syncAllSources(userId: string): Promise<{ syncedSources: number; extractedCount: number }> {
  enforceSourceEventRetention(userId);
  const sources = listSources(userId).filter((item) => item.enabled);
  let syncedSources = 0;
  let extractedCount = 0;
  for (const source of sources) {
    let count = 0;
    if (source.type === "slack") {
      count = await syncSlackSource(userId, source);
    } else if (source.type === "gmail") {
      count = await syncGmailSource(userId, source);
    } else if (source.type === "support") {
      count = await syncPullSource(userId, source, "support");
    } else if (source.type === "crm") {
      count = await syncPullSource(userId, source, "crm");
    } else if (source.type === "db") {
      count = await syncPullSource(userId, source, "db");
    } else {
      count = await syncOneSource(userId, source);
    }
    syncedSources += 1;
    extractedCount += count;
  }
  audit(userId, "sync.completed", `sources=${syncedSources} extracted=${extractedCount}`);
  return { syncedSources, extractedCount };
}

function ensureScope(userId: string, scope: string): void {
  const hasScope = mutateUser(userId, (state) => {
    if (state.roles.length === 0) {
      state.roles.push({ userId, role: "owner", scopes: ["*"] });
    }
    const actor = state.roles.find((entry) => entry.userId === userId) ?? state.roles[0];
    if (!actor) return false;
    return actor.scopes.includes("*") || actor.scopes.includes(scope);
  });
  if (!hasScope) {
    throw new Error(`Missing scope: ${scope}`);
  }
}

async function ingestExternalText(userId: string, source: SourceType, content: string): Promise<number> {
  const policy = sourcePolicy(userId, source);
  const normalized = policy.redactPII ? sanitizeStrictPII(content) : content;
  const result = await runIngestFlowLangGraph({
    userId,
    threadId: `company-brain:${source}`,
    message: `[${source}] ${normalized}`,
  });
  return result.acceptedMemories.length;
}

function enforceSourceEventRetention(userId: string): void {
  mutateUser(userId, (state) => {
    const now = Date.now();
    state.sourceEvents = state.sourceEvents.filter((event) => {
      const policy = state.compliance.sourcePolicies[event.sourceType];
      const ttlMs = Math.max(1, policy.ttlHours) * 60 * 60 * 1000;
      const ageMs = now - new Date(event.createdAt).getTime();
      return ageMs <= ttlMs;
    });
  });
}

async function syncSlackSource(userId: string, source: SourceConfig): Promise<number> {
  const token = typeof source.config.accessToken === "string" ? source.config.accessToken : "";
  const channelId = typeof source.config.channelId === "string" ? source.config.channelId : "";
  if (!token || !channelId) return 0;
  const cursor = typeof source.config.cursor === "string" ? source.config.cursor : "";
  const lastMessageTs = typeof source.config.lastMessageTs === "string" ? source.config.lastMessageTs : "";
  const params = new URLSearchParams({
    channel: channelId,
    limit: "40",
  });
  if (cursor) params.set("cursor", cursor);
  if (!cursor && lastMessageTs) params.set("oldest", lastMessageTs);
  const historyUrl = `https://slack.com/api/conversations.history?${params.toString()}`;
  const response = await fetch(historyUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Slack sync failed (${response.status})`);
  const payload = await response.json() as {
    ok?: boolean;
    messages?: Array<{ text?: string; ts?: string }>;
    response_metadata?: { next_cursor?: string };
  };
  if (!payload.ok || !Array.isArray(payload.messages)) return 0;
  let accepted = 0;
  let maxTs = lastMessageTs;
  for (const message of payload.messages.slice(0, 20)) {
    const text = typeof message.text === "string" ? message.text.trim() : "";
    if (!text) continue;
    if (typeof message.ts === "string" && (!maxTs || Number(message.ts) > Number(maxTs))) {
      maxTs = message.ts;
    }
    accepted += await ingestExternalText(userId, "slack", text.slice(0, 4000));
  }
  updateSourceConfig(userId, "slack", {
    lastMessageTs: maxTs || lastMessageTs || null,
    cursor: payload.response_metadata?.next_cursor ?? "",
    lastSyncedAt: nowIso(),
  });
  return accepted;
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL) {
    return null;
  }
  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL,
  );
  oauth.setCredentials({ refresh_token: refreshToken });
  const tokenResponse = await oauth.getAccessToken();
  return tokenResponse.token ?? null;
}

async function syncGmailSource(userId: string, source: SourceConfig): Promise<number> {
  let accessToken = typeof source.config.accessToken === "string" ? source.config.accessToken : "";
  const refreshToken = typeof source.config.refreshToken === "string" ? source.config.refreshToken : "";
  if (!accessToken && refreshToken) {
    const refreshed = await refreshGoogleAccessToken(refreshToken);
    if (refreshed) {
      accessToken = refreshed;
      updateSourceConfig(userId, "gmail", { accessToken: refreshed, lastTokenRefreshAt: nowIso() });
    }
  }
  if (!accessToken) return 0;
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });
  const checkpointMessageId = typeof source.config.lastMessageId === "string" ? source.config.lastMessageId : "";
  const checkpointEpochMs = typeof source.config.lastCheckpointEpochMs === "number" ? source.config.lastCheckpointEpochMs : 0;
  const query = checkpointEpochMs > 0
    ? `after:${Math.floor(checkpointEpochMs / 1000)}`
    : "newer_than:14d";
  let list;
  try {
    list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 25,
      q: query,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if ((message.includes("invalid credentials") || message.includes("unauthorized")) && refreshToken) {
      const refreshed = await refreshGoogleAccessToken(refreshToken);
      if (!refreshed) throw error;
      accessToken = refreshed;
      auth.setCredentials({ access_token: accessToken });
      updateSourceConfig(userId, "gmail", { accessToken: refreshed, lastTokenRefreshAt: nowIso() });
      list = await gmail.users.messages.list({
        userId: "me",
        maxResults: 25,
        q: query,
      });
    } else {
      throw error;
    }
  }
  const messages = list.data.messages ?? [];
  let accepted = 0;
  let newestEpochMs = checkpointEpochMs;
  let newestMessageId = checkpointMessageId;
  for (const entry of messages.slice(0, 15)) {
    if (!entry.id) continue;
    if (checkpointMessageId && entry.id === checkpointMessageId) continue;
    const full = await gmail.users.messages.get({
      userId: "me",
      id: entry.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From"],
    });
    const headers = full.data.payload?.headers ?? [];
    const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
    const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";
    const snippet = full.data.snippet ?? "";
    const internalDate = Number(full.data.internalDate ?? 0);
    if (internalDate > newestEpochMs) {
      newestEpochMs = internalDate;
      newestMessageId = entry.id;
    }
    const text = `From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}`;
    if (!snippet.trim()) continue;
    accepted += await ingestExternalText(userId, "gmail", text.slice(0, 4000));
  }
  updateSourceConfig(userId, "gmail", {
    lastCheckpointEpochMs: newestEpochMs || checkpointEpochMs || 0,
    lastMessageId: newestMessageId || checkpointMessageId || null,
    lastSyncedAt: nowIso(),
  });
  return accepted;
}

type PullSourceType = "support" | "crm" | "db";

async function syncPullSource(userId: string, source: SourceConfig, sourceType: PullSourceType): Promise<number> {
  const provider = typeof source.config.provider === "string" ? source.config.provider.toLowerCase() : "";
  const endpoint = typeof source.config.apiUrl === "string" ? source.config.apiUrl.trim() : "";
  if (!provider && !endpoint) {
    // If no pull provider configured, consume queued push/webhook events.
    return processQueuedSourceEvents(userId, sourceType);
  }
  let payload: {
    items: Array<Record<string, unknown>>;
    nextCursor?: string;
    checkpointEpochMs: number;
  };
  if (provider) {
    payload = sourceType === "support"
      ? await fetchSupportProvider(source.config)
      : sourceType === "crm"
        ? await fetchCrmProvider(source.config)
        : await fetchDbProvider(source.config);
  } else {
    const cursor = typeof source.config.cursor === "string" ? source.config.cursor : "";
    const sinceEpochMs = typeof source.config.lastCheckpointEpochMs === "number" ? source.config.lastCheckpointEpochMs : 0;
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (sinceEpochMs > 0) params.set("since", new Date(sinceEpochMs).toISOString());
    params.set("limit", "50");
    const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}${params.toString()}`;
    const headers: HeadersInit = { Accept: "application/json" };
    const apiKey = typeof source.config.apiKey === "string" ? source.config.apiKey : "";
    const bearerToken = typeof source.config.bearerToken === "string" ? source.config.bearerToken : "";
    const authHeader = typeof source.config.authHeader === "string" ? source.config.authHeader : "Authorization";
    if (apiKey) headers["x-api-key"] = apiKey;
    if (bearerToken) headers[authHeader] = bearerToken.startsWith("Bearer ") ? bearerToken : `Bearer ${bearerToken}`;
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) throw new Error(`${sourceType} generic pull sync failed (${response.status})`);
    const generic = await response.json() as {
      items?: Array<Record<string, unknown>>;
      nextCursor?: string | null;
      checkpointEpochMs?: number;
    };
    payload = {
      items: Array.isArray(generic.items) ? generic.items : [],
      ...(typeof generic.nextCursor === "string" ? { nextCursor: generic.nextCursor } : {}),
      checkpointEpochMs: typeof generic.checkpointEpochMs === "number" ? generic.checkpointEpochMs : Date.now(),
    };
  }

  const items = payload.items;
  let accepted = 0;
  for (const item of items.slice(0, 40)) {
    accepted += await ingestExternalText(userId, sourceType, JSON.stringify(item).slice(0, 5000));
  }

  updateSourceConfig(userId, sourceType, {
    cursor: typeof payload.nextCursor === "string" ? payload.nextCursor : "",
    lastCheckpointEpochMs: payload.checkpointEpochMs,
    provider,
    lastSyncedAt: nowIso(),
  });

  return accepted;
}

export function enqueueSourceEvent(userId: string, sourceType: SourceType, payload: Record<string, unknown>): { id: string } {
  return mutateUser(userId, (state) => {
    const event = {
      id: randomUUID(),
      sourceType,
      payload,
      status: "pending" as const,
      attempts: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      nextAttemptAt: nowIso(),
    };
    state.sourceEvents.unshift(event);
    state.sourceEvents = state.sourceEvents.slice(0, 1000);
    audit(userId, "source_event.enqueued", `${sourceType}`);
    return { id: event.id };
  });
}

export async function processQueuedSourceEvents(userId: string, sourceType?: SourceType): Promise<number> {
  const now = new Date();
  const pending = mutateUser(userId, (state) =>
    state.sourceEvents
      .filter((entry) => {
        if (entry.status !== "pending") return false;
        if (sourceType && entry.sourceType !== sourceType) return false;
        if (!entry.nextAttemptAt) return true;
        return new Date(entry.nextAttemptAt) <= now;
      })
      .slice(0, 40),
  );
  let accepted = 0;
  for (const event of pending) {
    try {
      const content = JSON.stringify(event.payload);
      const count = await ingestExternalText(userId, event.sourceType, content.slice(0, 5000));
      accepted += count;
      mutateUser(userId, (state) => {
        const target = state.sourceEvents.find((entry) => entry.id === event.id);
        if (target) {
          target.status = "processed";
          target.updatedAt = nowIso();
          target.nextAttemptAt = undefined;
        }
      });
    } catch (error) {
      mutateUser(userId, (state) => {
        const target = state.sourceEvents.find((entry) => entry.id === event.id);
        if (!target) return;
        target.attempts += 1;
        target.updatedAt = nowIso();
        target.error = error instanceof Error ? error.message : "source_event_failed";
        const cappedAttempts = Math.max(1, target.attempts);
        const backoffSeconds = Math.min(
          SOURCE_EVENT_BASE_BACKOFF_SECONDS * Math.pow(2, cappedAttempts - 1),
          15 * 60,
        );
        target.nextAttemptAt = addSeconds(target.updatedAt, backoffSeconds);
        if (target.attempts >= SOURCE_EVENT_MAX_ATTEMPTS) {
          target.status = "dead_letter";
          target.deadLetteredAt = target.updatedAt;
          target.nextAttemptAt = undefined;
        }
      });
      pushAlert(userId, "warning", "Source event processing failed", {
        sourceType: event.sourceType,
        eventId: event.id,
        error: error instanceof Error ? error.message : "source_event_failed",
      });
    }
  }
  return accepted;
}

export async function rebuildGraph(userId: string): Promise<{ nodes: number; edges: number }> {
  const memories = (await listMemories({ userId, limit: 400 })).memories;
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  function ensureNode(
    id: string,
    type: GraphNode["type"],
    label: string,
    confidence: number,
    evidenceMemoryId: string,
  ): void {
    const existing = nodes.get(id);
    if (existing) {
      existing.confidence = Math.max(existing.confidence, confidence);
      if (!existing.evidenceMemoryIds.includes(evidenceMemoryId)) {
        existing.evidenceMemoryIds.push(evidenceMemoryId);
      }
      return;
    }
    nodes.set(id, {
      id,
      type,
      label,
      confidence,
      evidenceMemoryIds: [evidenceMemoryId],
    });
  }

  function addEdge(
    from: string,
    to: string,
    relation: GraphEdge["relation"],
    confidence: number,
  ): void {
    if (!nodes.has(from) || !nodes.has(to) || from === to) return;
    const key = `${from}|${relation}|${to}`;
    const existing = edges.get(key);
    if (existing) {
      existing.confidence = Math.max(existing.confidence, confidence);
      return;
    }
    edges.set(key, {
      id: randomUUID(),
      from,
      to,
      relation,
      confidence,
    });
  }

  const teamPattern = /\b(platform|infra|security|billing|support|ops|product|engineering|frontend|backend)\s+team\b/gi;
  const systemPattern = /\b(github|notion|slack|gmail|postgres|redis|kubernetes|docker|api|memoryos|polar|clerk)\b/gi;
  const personPattern = /\b(?:from|owner|by|lead|assignee)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g;
  const relationPattern = /\b(depends on|blocked by|owned by|governed by|implements|resolved by)\b/i;
  const decisionPattern = /\bdecide|decision|approved|approval|ship\b/i;
  const policyPattern = /\bpolicy|compliance|rule|governance\b/i;
  const incidentPattern = /\bincident|outage|bug|rollback|degraded\b/i;
  const runbookPattern = /\brunbook|procedure|playbook|steps|checklist\b/i;

  for (const memory of memories) {
    const raw = `${memory.summary} ${memory.content}`;
    const text = raw.toLowerCase();
    const idBase = memory.id;
    if (memory.operationalTags?.includes("decision") || decisionPattern.test(text)) {
      ensureNode(`decision:${idBase}`, "decision", memory.summary, 0.8, memory.id);
    }
    if (memory.operationalTags?.includes("policy") || policyPattern.test(text)) {
      ensureNode(`policy:${idBase}`, "policy", memory.summary, 0.75, memory.id);
    }
    if (memory.operationalTags?.includes("incident") || incidentPattern.test(text)) {
      ensureNode(`incident:${idBase}`, "incident", memory.summary, 0.78, memory.id);
    }
    if (memory.operationalTags?.includes("runbook") || runbookPattern.test(text)) {
      ensureNode(`runbook:${idBase}`, "runbook", memory.summary, 0.74, memory.id);
    }
    if (/\brisk|risky|impact|blast radius\b/.test(text)) {
      ensureNode(`risk:${idBase}`, "risk", memory.summary, 0.66, memory.id);
    }

    for (const match of raw.matchAll(teamPattern)) {
      const label = `${match[1].toLowerCase()} team`;
      ensureNode(`team:${label.replace(/\s+/g, "_")}`, "team", label, 0.7, memory.id);
    }
    for (const match of raw.matchAll(systemPattern)) {
      const label = match[1].toLowerCase();
      ensureNode(`system:${label}`, "system", label, 0.68, memory.id);
    }
    for (const match of raw.matchAll(personPattern)) {
      const label = match[1].trim();
      ensureNode(`person:${label.toLowerCase().replace(/\s+/g, "_")}`, "person", label, 0.65, memory.id);
    }

    const decisionId = `decision:${idBase}`;
    const policyId = `policy:${idBase}`;
    const incidentId = `incident:${idBase}`;
    const runbookId = `runbook:${idBase}`;
    const riskId = `risk:${idBase}`;

    if (nodes.has(decisionId) && nodes.has(policyId)) addEdge(decisionId, policyId, "governed_by", 0.71);
    if (nodes.has(decisionId) && nodes.has(runbookId)) addEdge(decisionId, runbookId, "implements", 0.69);
    if (nodes.has(incidentId) && nodes.has(runbookId)) addEdge(incidentId, runbookId, "resolved_by", 0.72);
    if (nodes.has(incidentId) && nodes.has(policyId)) addEdge(incidentId, policyId, "governed_by", 0.64);
    if (nodes.has(incidentId) && nodes.has(riskId)) addEdge(incidentId, riskId, "depends_on", 0.62);

    if (relationPattern.test(text)) {
      if (text.includes("blocked by") && nodes.has(incidentId) && nodes.has(policyId)) {
        addEdge(incidentId, policyId, "blocked_by", 0.67);
      }
      if (text.includes("depends on") && nodes.has(decisionId) && nodes.has(runbookId)) {
        addEdge(decisionId, runbookId, "depends_on", 0.66);
      }
      if (text.includes("owned by")) {
        const firstTeam = Array.from(nodes.values()).find((n) => n.type === "team" && n.evidenceMemoryIds.includes(memory.id));
        const firstSystem = Array.from(nodes.values()).find((n) => n.type === "system" && n.evidenceMemoryIds.includes(memory.id));
        if (firstTeam && firstSystem) addEdge(firstTeam.id, firstSystem.id, "owns", 0.7);
      }
    }
  }

  const nodeList = Array.from(nodes.values());
  const edgeList = Array.from(edges.values());

  mutateUser(userId, (state) => {
    state.graph.nodes = nodeList;
    state.graph.edges = edgeList;
    state.graph.updatedAt = nowIso();
  });
  audit(userId, "graph.rebuilt", `nodes=${nodeList.length} edges=${edgeList.length}`);
  return { nodes: nodeList.length, edges: edgeList.length };
}

export function compileSkillsV2(userId: string): { skills: CompiledSkill[]; updatedAt: string } {
  return mutateUser(userId, (state) => {
    const incomingEdgesByNode = new Map<string, GraphEdge[]>();
    for (const edge of state.graph.edges) {
      const list = incomingEdgesByNode.get(edge.to) ?? [];
      list.push(edge);
      incomingEdgesByNode.set(edge.to, list);
    }

    function inferRisk(node: GraphNode): "low" | "medium" | "high" {
      const text = `${node.label} ${node.id}`.toLowerCase();
      if (node.type === "policy" || /\bsecurity|billing|refund|compliance|permission|production\b/.test(text)) {
        return "high";
      }
      if (node.type === "decision" || /\bdeploy|migration|incident|rollback|integration\b/.test(text)) {
        return "medium";
      }
      return "low";
    }

    function approvalsForRisk(risk: "low" | "medium" | "high"): Array<"owner" | "admin" | "operator"> {
      if (risk === "high") return ["owner", "admin"];
      if (risk === "medium") return ["admin", "operator"];
      return ["operator"];
    }

    function constraintsForRisk(
      risk: "low" | "medium" | "high",
      node: GraphNode,
      inbound: GraphEdge[],
    ): string[] {
      const base = [
        "must reference provenance memory before execution",
        "must write post-action outcome memory",
      ];
      if (inbound.some((edge) => edge.relation === "governed_by")) {
        base.push("must evaluate governing policy constraints first");
      }
      if (inbound.some((edge) => edge.relation === "blocked_by")) {
        base.push("must confirm blocker resolution before execution");
      }
      if (risk === "medium") {
        base.push("requires dry-run summary before execute");
      }
      if (risk === "high") {
        base.push("requires explicit human approval with owner/admin role");
        base.push("requires rollback plan and blast-radius note");
      }
      if (node.type === "incident") {
        base.push("must include incident timeline link in output");
      }
      return base;
    }

    function calculateConfidence(node: GraphNode, inbound: GraphEdge[]): number {
      const evidenceBoost = Math.min(0.2, node.evidenceMemoryIds.length * 0.03);
      const relationBoost = Math.min(0.12, inbound.length * 0.02);
      const policyBoost = inbound.some((edge) => edge.relation === "governed_by") ? 0.04 : 0;
      const raw = node.confidence + evidenceBoost + relationBoost + policyBoost;
      return Math.max(0.35, Math.min(0.99, Number(raw.toFixed(2))));
    }

    const skills: CompiledSkill[] = state.graph.nodes
      .filter((node) => node.type === "decision" || node.type === "runbook" || node.type === "policy")
      .slice(0, 40)
      .map((node) => {
        const inbound = incomingEdgesByNode.get(node.id) ?? [];
        const riskLevel = inferRisk(node);
        const requiredApprovals = approvalsForRisk(riskLevel);
        const confidence = calculateConfidence(node, inbound);
        const linkedContext = inbound.map((edge) => `${edge.relation}:${edge.from}`).slice(0, 6);

        return {
          id: randomUUID(),
          title: `${node.type.toUpperCase()}: ${node.label}`.slice(0, 140),
          body: sanitize(
            `Execute from graph node ${node.id}. Linked context: ${linkedContext.join(", ") || "none"}. ` +
            `Always validate constraints before action.`,
          ),
          confidence,
          provenance: node.evidenceMemoryIds.slice(0, 10),
          requiredApprovals,
          riskLevel,
          executionConstraints: constraintsForRisk(riskLevel, node, inbound),
          tests: [
            "retrieves required constraints before action",
            "requests approval when risk is high",
            "writes post-action outcome back into memory",
            "includes provenance references in action report",
          ],
        };
      });
    state.skills.items = skills;
    state.skills.updatedAt = nowIso();
    audit(userId, "skills.compiled", `skills=${skills.length}`);
    return { skills, updatedAt: state.skills.updatedAt ?? nowIso() };
  });
}

function inferRisk(name: string, payload: Record<string, unknown>): "low" | "medium" | "high" {
  const text = `${name} ${JSON.stringify(payload)}`.toLowerCase();
  if (/\b(delete|drop|production|billing|refund|invoice|security|permission)\b/.test(text)) return "high";
  if (/\b(update|change|sync|reindex)\b/.test(text)) return "medium";
  return "low";
}

function inferExecutionConstraints(name: string, risk: "low" | "medium" | "high"): string[] {
  const base = [
    "must include provenance context before execution",
    "must append post-action audit entry",
  ];
  const lower = name.toLowerCase();
  if (/\brefund|billing|invoice|payment\b/.test(lower)) {
    base.push("requires billing policy check");
  }
  if (/\bdelete|drop|permission|security\b/.test(lower)) {
    base.push("requires change-impact note and rollback path");
  }
  if (risk === "high") {
    base.push("requires human approval from owner/admin");
  } else if (risk === "medium") {
    base.push("requires human approval from admin/operator");
  }
  return base;
}

function getRoleForUser(state: UserState, userId: string): "owner" | "admin" | "operator" | "viewer" {
  if (state.roles.length === 0) {
    state.roles.push({ userId, role: "owner", scopes: ["*"] });
  }
  const actor = state.roles.find((entry) => entry.userId === userId) ?? state.roles[0];
  return actor?.role ?? "viewer";
}

async function executeActionExternally(userId: string, action: ActionRequest): Promise<ExecutionResult> {
  async function connectorConfig(type: string): Promise<Record<string, unknown> | null> {
    const connector = await prisma.connector.findUnique({
      where: { id: `${userId}_${type}` },
    });
    if (!connector?.configJson) return null;
    try {
      const parsed = JSON.parse(connector.configJson);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  function sourceConfig(type: SourceType): Record<string, unknown> | null {
    return mutateUser(userId, (state) => {
      const source = state.sources.find((entry) => entry.type === type && entry.enabled);
      if (!source || !source.config || typeof source.config !== "object") return null;
      return source.config;
    });
  }

  const actionName = action.name.toLowerCase();
  if (actionName.includes("github_create_issue")) {
    const repo = typeof action.payload.repo === "string" ? action.payload.repo : "";
    const title = typeof action.payload.title === "string" ? action.payload.title : "";
    const body = typeof action.payload.body === "string" ? action.payload.body : "";
    if (!repo || !title) {
      return { ok: false, detail: "github_create_issue requires repo and title" };
    }
    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      return { ok: false, detail: "repo must be owner/name" };
    }
    const config = await connectorConfig("github");
    const accessToken = typeof config?.accessToken === "string" ? config.accessToken : "";
    if (!accessToken) {
      return { ok: false, detail: "GitHub connector token missing. Connect GitHub first." };
    }
    const octokit = new Octokit({ auth: accessToken });
    const created = await octokit.issues.create({
      owner,
      repo: repoName,
      title,
      ...(body ? { body } : {}),
    });
    return {
      ok: true,
      detail: `Created GitHub issue #${created.data.number} in ${repo}`,
      externalRef: created.data.html_url,
    };
  }

  if (actionName.includes("github_add_comment")) {
    const repo = typeof action.payload.repo === "string" ? action.payload.repo : "";
    const issueNumber = typeof action.payload.issueNumber === "number" ? action.payload.issueNumber : 0;
    const body = typeof action.payload.body === "string" ? action.payload.body : "";
    if (!repo || !issueNumber || !body) {
      return { ok: false, detail: "github_add_comment requires repo, issueNumber, body" };
    }
    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      return { ok: false, detail: "repo must be owner/name" };
    }
    const config = await connectorConfig("github");
    const accessToken = typeof config?.accessToken === "string" ? config.accessToken : "";
    if (!accessToken) {
      return { ok: false, detail: "GitHub connector token missing. Connect GitHub first." };
    }
    const octokit = new Octokit({ auth: accessToken });
    const created = await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body,
    });
    return {
      ok: true,
      detail: `Added GitHub comment on ${repo}#${issueNumber}`,
      externalRef: created.data.html_url,
    };
  }

  if (actionName.includes("github_add_label")) {
    const repo = typeof action.payload.repo === "string" ? action.payload.repo : "";
    const issueNumber = typeof action.payload.issueNumber === "number" ? action.payload.issueNumber : 0;
    const labels = Array.isArray(action.payload.labels)
      ? action.payload.labels.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    if (!repo || !issueNumber || labels.length === 0) {
      return { ok: false, detail: "github_add_label requires repo, issueNumber, labels[]" };
    }
    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      return { ok: false, detail: "repo must be owner/name" };
    }
    const config = await connectorConfig("github");
    const accessToken = typeof config?.accessToken === "string" ? config.accessToken : "";
    if (!accessToken) {
      return { ok: false, detail: "GitHub connector token missing. Connect GitHub first." };
    }
    const octokit = new Octokit({ auth: accessToken });
    await octokit.issues.addLabels({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      labels,
    });
    return {
      ok: true,
      detail: `Added labels to ${repo}#${issueNumber}`,
      externalRef: `github://${repo}/issues/${issueNumber}`,
    };
  }

  if (actionName.includes("notion_create_page")) {
    const databaseId = typeof action.payload.databaseId === "string" ? action.payload.databaseId : "";
    const title = typeof action.payload.title === "string" ? action.payload.title : "MemoryOS Update";
    const content = typeof action.payload.content === "string" ? action.payload.content : "";
    if (!databaseId) {
      return { ok: false, detail: "notion_create_page requires databaseId" };
    }
    const config = await connectorConfig("notion");
    const accessToken = typeof config?.accessToken === "string" ? config.accessToken : "";
    if (!accessToken) {
      return { ok: false, detail: "Notion connector token missing. Connect Notion first." };
    }
    const notion = new NotionClient({ auth: accessToken });
    const created = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
      children: content
        ? [{
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content } }],
          },
        }]
        : undefined,
    });
    return {
      ok: true,
      detail: `Created Notion page in database ${databaseId}`,
      externalRef: `notion://page/${created.id}`,
    };
  }

  if (actionName.includes("slack_post_message")) {
    const channel = typeof action.payload.channel === "string" ? action.payload.channel : "";
    const text = typeof action.payload.text === "string" ? action.payload.text : "";
    if (!channel) {
      return { ok: false, detail: "slack_post_message requires channel" };
    }
    if (!text) {
      return { ok: false, detail: "slack_post_message requires text" };
    }
    const config = await connectorConfig("slack");
    const accessToken = typeof config?.accessToken === "string" ? config.accessToken : "";
    if (!accessToken) {
      return { ok: false, detail: "Slack connector token missing. Connect Slack first." };
    }
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, text }),
    });
    const payload = await response.json() as { ok?: boolean; error?: string; ts?: string };
    if (!response.ok || !payload.ok) {
      return { ok: false, detail: `Slack post failed: ${payload.error ?? response.statusText}` };
    }
    return {
      ok: true,
      detail: `Posted Slack message to ${channel}`,
      externalRef: payload.ts ? `slack://${channel}/${payload.ts}` : `slack://${channel}`,
    };
  }

  if (actionName.includes("support_create_ticket")) {
    const source = sourceConfig("support");
    const apiUrl = typeof source?.apiUrl === "string" ? source.apiUrl : "";
    const bearerToken = typeof source?.bearerToken === "string" ? source.bearerToken : "";
    const title = typeof action.payload.title === "string" ? action.payload.title : "";
    const description = typeof action.payload.description === "string" ? action.payload.description : "";
    const priority = typeof action.payload.priority === "string" ? action.payload.priority : "normal";
    if (!apiUrl || !title) {
      return { ok: false, detail: "support_create_ticket requires configured support source apiUrl and title" };
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify({
        title,
        description,
        priority,
      }),
    });
    const raw = await response.text();
    if (!response.ok) {
      return { ok: false, detail: `support_create_ticket failed (${response.status}): ${raw.slice(0, 240)}` };
    }
    return {
      ok: true,
      detail: "Created support ticket through configured provider endpoint",
      externalRef: apiUrl,
    };
  }

  if (actionName.includes("crm_upsert_contact")) {
    const source = sourceConfig("crm");
    const apiUrl = typeof source?.apiUrl === "string" ? source.apiUrl : "";
    const bearerToken = typeof source?.bearerToken === "string" ? source.bearerToken : "";
    const email = typeof action.payload.email === "string" ? action.payload.email : "";
    if (!apiUrl || !email) {
      return { ok: false, detail: "crm_upsert_contact requires configured crm source apiUrl and email" };
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify(action.payload),
    });
    const raw = await response.text();
    if (!response.ok) {
      return { ok: false, detail: `crm_upsert_contact failed (${response.status}): ${raw.slice(0, 240)}` };
    }
    return {
      ok: true,
      detail: "Upserted CRM contact through configured provider endpoint",
      externalRef: apiUrl,
    };
  }

  if (actionName.includes("db_append_record")) {
    const source = sourceConfig("db");
    const apiUrl = typeof source?.apiUrl === "string" ? source.apiUrl : "";
    const apiKey = typeof source?.apiKey === "string" ? source.apiKey : "";
    if (!apiUrl) {
      return { ok: false, detail: "db_append_record requires configured db source apiUrl" };
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(action.payload),
    });
    const raw = await response.text();
    if (!response.ok) {
      return { ok: false, detail: `db_append_record failed (${response.status}): ${raw.slice(0, 240)}` };
    }
    return {
      ok: true,
      detail: "Appended DB record through configured provider endpoint",
      externalRef: apiUrl,
    };
  }

  return {
    ok: true,
    detail: `Executed internal action runner for ${action.name}`,
  };
}

export function requestAction(userId: string, name: string, payload: Record<string, unknown>): ActionRequest {
  ensureScope(userId, "actions.execute");
  const source = sourceTypeFromActionName(name);
  const complianceBlockReason = source
    ? mutateUser(userId, (state) => {
      const policy = state.compliance.sourcePolicies[source];
      if (!policy.redactPII) return null;
      if (!payloadHasSensitivePII(payload)) return null;
      return `Compliance block: PII-like payload detected for source=${source} with redactPII=true`;
    })
    : null;
  const action = mutateUser(userId, (state) => {
    const action: ActionRequest = {
      id: randomUUID(),
      userId,
      name,
      payload,
      risk: inferRisk(name, payload),
      requiredApprovals: [],
      approvals: [],
      executionConstraints: [],
      status: "pending",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const policy = state.governance.riskPolicy[action.risk];
    action.requiredApprovals = policy.requiredApprovals;
    action.executionConstraints = inferExecutionConstraints(name, action.risk);

    if (complianceBlockReason) {
      action.status = "rejected";
      action.executionResult = { ok: false, detail: complianceBlockReason };
      action.updatedAt = nowIso();
      audit(userId, "action.compliance_blocked", `${name} reason=${complianceBlockReason}`);
      state.actions.unshift(action);
      state.actions = state.actions.slice(0, 200);
      return action;
    }

    const role = getRoleForUser(state, userId);
    const canAutoApprove = role !== "viewer" && (policy.requiredApprovals.includes(role) || role === "owner");
    if (policy.autoExecute && canAutoApprove) {
      action.status = "approved";
      action.approvals.push({
        reviewerUserId: userId,
        reviewerRole: role,
        decision: "approve",
        at: nowIso(),
      });
      audit(userId, "action.auto_approved", `${name} risk=${action.risk} role=${role}`);
    } else {
      action.status = "pending";
      audit(userId, "action.pending_approval", `${name} risk=${action.risk} role=${role}`);
    }
    state.actions.unshift(action);
    state.actions = state.actions.slice(0, 200);
    return action;
  });
  if (action.status === "approved") {
    void executeApprovedAction(userId, action.id);
  }
  return action;
}

export function reviewAction(userId: string, actionId: string, decision: "approve" | "reject"): ActionRequest | null {
  ensureScope(userId, "actions.approve");
  const reviewerRole = mutateUser(userId, (state) => getRoleForUser(state, userId));
  const reviewed = mutateUser(userId, (state) => {
    const action = state.actions.find((item) => item.id === actionId);
    if (!action) return null;
    action.approvals = action.approvals ?? [];
    action.approvals.push({
      reviewerUserId: userId,
      reviewerRole,
      decision,
      at: nowIso(),
    });
    if (decision === "approve") {
      const required = action.requiredApprovals;
      const approvedRoles = new Set(
        action.approvals
          .filter((entry) => entry.decision === "approve")
          .map((entry) => entry.reviewerRole),
      );
      const fullyApproved =
        reviewerRole === "owner" || required.every((role) => approvedRoles.has(role));
      action.status = fullyApproved ? "approved" : "pending";
      action.updatedAt = nowIso();
      if (fullyApproved) {
        audit(userId, "action.approved", `${action.name} risk=${action.risk}`);
      } else {
        audit(userId, "action.approval_partial", `${action.name} role=${reviewerRole}`);
      }
      return action;
    }
    action.status = "rejected";
    action.updatedAt = nowIso();
    audit(userId, "action.rejected", `${action.name} risk=${action.risk}`);
    return action;
  });
  if (reviewed && reviewed.status === "approved") {
    void executeApprovedAction(userId, reviewed.id);
  }
  return reviewed;
}

export async function executeApprovedAction(userId: string, actionId: string): Promise<ActionRequest | null> {
  const action = mutateUser(userId, (state) => state.actions.find((entry) => entry.id === actionId) ?? null);
  if (!action) return null;
  if (action.status !== "approved") return action;
  const blockedByRiskGate = mutateUser(userId, (state) => {
    const target = state.actions.find((entry) => entry.id === actionId);
    if (!target) return null;
    if (target.risk !== "high") return null;
    const approvals = target.approvals ?? [];
    const hasOwnerOrAdmin = approvals.some(
      (entry) => entry.decision === "approve" && (entry.reviewerRole === "owner" || entry.reviewerRole === "admin"),
    );
    if (hasOwnerOrAdmin) return null;
    target.status = "failed";
    target.updatedAt = nowIso();
    target.executionResult = {
      ok: false,
      detail: "Compliance gate: high-risk action requires owner/admin approval before execution.",
    };
    return target.executionResult.detail;
  });
  if (blockedByRiskGate) {
    audit(userId, "action.execution_blocked", `${action.name} reason=${blockedByRiskGate}`);
    pushAlert(userId, "warning", "Action execution blocked by compliance gate", {
      actionId,
      actionName: action.name,
      detail: blockedByRiskGate,
    });
    return mutateUser(userId, (state) => state.actions.find((entry) => entry.id === actionId) ?? null);
  }
  try {
    const result = await executeActionExternally(userId, action);
    const next = mutateUser(userId, (state) => {
      const target = state.actions.find((entry) => entry.id === actionId);
      if (!target) return null;
      target.executionResult = result;
      target.status = result.ok ? "executed" : "failed";
      target.updatedAt = nowIso();
      return target;
    });
    if (result.ok) {
      audit(userId, "action.executed", `${action.name} risk=${action.risk}`);
    } else {
      audit(userId, "action.execution_failed", `${action.name} reason=${result.detail}`);
      pushAlert(userId, "warning", "Action runner failed", {
        actionId,
        actionName: action.name,
        detail: result.detail,
      });
    }
    return next;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "action_execution_failed";
    const failed = mutateUser(userId, (state) => {
      const target = state.actions.find((entry) => entry.id === actionId);
      if (!target) return null;
      target.status = "failed";
      target.updatedAt = nowIso();
      target.executionResult = { ok: false, detail };
      return target;
    });
    audit(userId, "action.execution_failed", `${action.name} reason=${detail}`);
    pushAlert(userId, "critical", "Action execution crashed", {
      actionId,
      actionName: action.name,
      detail,
    });
    return failed;
  }
}

export function setRoleAssignment(
  userId: string,
  targetUserId: string,
  role: "owner" | "admin" | "operator" | "viewer",
  scopes: string[],
): { ok: boolean } {
  ensureScope(userId, "governance.roles.write");
  return mutateUser(userId, (state) => {
    const current = state.roles.find((entry) => entry.userId === targetUserId);
    if (current) {
      current.role = role;
      current.scopes = scopes;
      return { ok: true };
    }
    state.roles.push({ userId: targetUserId, role, scopes });
    return { ok: true };
  });
}

export function getGovernancePolicy(userId: string): UserState["governance"] {
  return mutateUser(userId, (state) => state.governance);
}

export function updateGovernancePolicy(
  userId: string,
  patch: Partial<Record<"low" | "medium" | "high", {
    autoExecute?: boolean;
    requiredApprovals?: Array<"owner" | "admin" | "operator">;
  }>>,
): UserState["governance"] {
  ensureScope(userId, "governance.policy.write");
  return mutateUser(userId, (state) => {
    for (const risk of ["low", "medium", "high"] as const) {
      const next = patch[risk];
      if (!next) continue;
      state.governance.riskPolicy[risk] = {
        autoExecute: typeof next.autoExecute === "boolean"
          ? next.autoExecute
          : state.governance.riskPolicy[risk].autoExecute,
        requiredApprovals: Array.isArray(next.requiredApprovals)
          ? next.requiredApprovals
          : state.governance.riskPolicy[risk].requiredApprovals,
      };
    }
    return state.governance;
  });
}

export function listActions(userId: string): ActionRequest[] {
  return mutateUser(userId, (state) => state.actions);
}

export function listAudit(userId: string): AuditEvent[] {
  return mutateUser(userId, (state) => state.audit.slice(0, 200));
}

export function enqueueJob(userId: string, type: QueueJob["type"]): QueueJob {
  const job = mutateUser(userId, (state) => {
    const job: QueueJob = {
      id: randomUUID(),
      userId,
      type,
      status: "queued",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.queue.unshift(job);
    state.queue = state.queue.slice(0, 400);
    return job;
  });
  void getQueueBackend().enqueue(userId, type);
  return job;
}

function hasQueuedOrRunning(state: UserState, type: QueueJob["type"]): boolean {
  return state.queue.some((job) => job.type === type && (job.status === "queued" || job.status === "running"));
}

function enqueueJobIfMissing(userId: string, type: QueueJob["type"]): void {
  const shouldEnqueue = mutateUser(userId, (state) => !hasQueuedOrRunning(state, type));
  if (shouldEnqueue) {
    enqueueJob(userId, type);
  }
}

function seedContinuousPipeline(userId: string): void {
  enqueueJobIfMissing(userId, "sync_all_sources");
  enqueueJobIfMissing(userId, "rebuild_graph");
  enqueueJobIfMissing(userId, "compile_skills");
}

async function runJob(userId: string, job: QueueJob): Promise<void> {
  mutateUser(userId, (state) => {
    const target = state.queue.find((entry) => entry.id === job.id);
    if (target) {
      target.status = "running";
      target.updatedAt = nowIso();
    }
  });
  try {
    if (job.type === "sync_all_sources") {
      await syncAllSources(userId);
    } else if (job.type === "rebuild_graph") {
      await rebuildGraph(userId);
    } else if (job.type === "compile_skills") {
      compileSkillsV2(userId);
    }
    mutateUser(userId, (state) => {
      const target = state.queue.find((entry) => entry.id === job.id);
      if (target) {
        target.status = "completed";
        target.updatedAt = nowIso();
      }
    });
  } catch (error) {
    mutateUser(userId, (state) => {
      const target = state.queue.find((entry) => entry.id === job.id);
      if (target) {
        target.status = "failed";
        target.updatedAt = nowIso();
        target.error = error instanceof Error ? error.message : "job_failed";
      }
      state.scheduler.lastError = error instanceof Error ? error.message : "job_failed";
    });
    pushAlert(userId, "critical", "Queue job failed", {
      jobId: job.id,
      type: job.type,
      error: error instanceof Error ? error.message : "job_failed",
    });
    await failQueueJob(userId, job.id, error instanceof Error ? error.message : "job_failed");
  }
}

export async function processQueueOnce(userId: string): Promise<{ processed: number }> {
  const leased = await getQueueBackend().lease(userId, `worker:${process.pid}`, 5);
  if (leased.length > 0) {
    for (const job of leased) {
      const mapped: QueueJob = {
        id: job.id,
        userId: job.userId,
        type: job.type,
        status: "queued",
        createdAt: job.createdAt,
        updatedAt: nowIso(),
      };
      await runJob(userId, mapped);
      await ackQueueJob(userId, job.id);
    }
    mutateUser(userId, (state) => {
      state.scheduler.lastTickAt = nowIso();
    });
    return { processed: leased.length };
  }
  const queued = mutateUser(userId, (state) => state.queue.filter((job) => job.status === "queued").slice(0, 3));
  for (const job of queued) {
    await runJob(userId, job);
  }
  mutateUser(userId, (state) => {
    state.scheduler.lastTickAt = nowIso();
  });
  return { processed: queued.length };
}

export function startScheduler(userId: string, intervalSeconds: number): { enabled: boolean; intervalSeconds: number } {
  const safeInterval = Math.max(30, Math.min(3600, Math.floor(intervalSeconds)));
  const existing = schedulerTimers.get(userId);
  if (existing) clearInterval(existing);
  seedContinuousPipeline(userId);
  void processQueueOnce(userId);
  const timer = setInterval(() => {
    seedContinuousPipeline(userId);
    void processQueueOnce(userId);
  }, safeInterval * 1000);
  schedulerTimers.set(userId, timer);
  mutateUser(userId, (state) => {
    state.scheduler.enabled = true;
    state.scheduler.intervalSeconds = safeInterval;
  });
  pushAlert(userId, "info", "Scheduler started", { intervalSeconds: safeInterval });
  audit(userId, "scheduler.started", `intervalSeconds=${safeInterval}`);
  return { enabled: true, intervalSeconds: safeInterval };
}

export function stopScheduler(userId: string): { enabled: boolean } {
  const existing = schedulerTimers.get(userId);
  if (existing) {
    clearInterval(existing);
    schedulerTimers.delete(userId);
  }
  mutateUser(userId, (state) => {
    state.scheduler.enabled = false;
  });
  pushAlert(userId, "warning", "Scheduler stopped");
  audit(userId, "scheduler.stopped", "manual stop");
  return { enabled: false };
}

export function getStatus(userId: string): {
  sources: SourceConfig[];
  scheduler: UserState["scheduler"];
  queue: { queued: number; running: number; failed: number };
  graph: { nodes: number; edges: number; updatedAt: string | null };
  skills: { count: number; updatedAt: string | null };
  approvals: { pending: number };
  sourceEvents: { pending: number; failed: number; deadLetter: number };
  sre: { alerts: number; workers: number };
} {
  return mutateUser(userId, (state) => ({
    sources: state.sources,
    scheduler: state.scheduler,
    queue: {
      queued: state.queue.filter((job) => job.status === "queued").length,
      running: state.queue.filter((job) => job.status === "running").length,
      failed: state.queue.filter((job) => job.status === "failed").length,
    },
    graph: {
      nodes: state.graph.nodes.length,
      edges: state.graph.edges.length,
      updatedAt: state.graph.updatedAt,
    },
    skills: {
      count: state.skills.items.length,
      updatedAt: state.skills.updatedAt,
    },
    approvals: {
      pending: state.actions.filter((action) => action.status === "pending").length,
    },
    sourceEvents: {
      pending: state.sourceEvents.filter((entry) => entry.status === "pending").length,
      failed: state.sourceEvents.filter((entry) => entry.status === "failed").length,
      deadLetter: state.sourceEvents.filter((entry) => entry.status === "dead_letter").length,
    },
    sre: {
      alerts: state.sre.alerts.length,
      workers: state.sre.workers.length,
    },
  }));
}

export function listAlerts(userId: string): UserState["sre"]["alerts"] {
  return mutateUser(userId, (state) => state.sre.alerts.slice(0, 100));
}

export function registerWorker(userId: string, name: string): { id: string; name: string } {
  return mutateUser(userId, (state) => {
    const existing = state.sre.workers.find((worker) => worker.name === name);
    if (existing) {
      existing.status = "idle";
      existing.lastHeartbeatAt = nowIso();
      existing.lastError = null;
      return { id: existing.id, name: existing.name };
    }
    const worker = {
      id: randomUUID(),
      name,
      status: "idle" as const,
      lastHeartbeatAt: nowIso(),
      lastError: null,
    };
    state.sre.workers.push(worker);
    return { id: worker.id, name: worker.name };
  });
}

export function workerHeartbeat(
  userId: string,
  workerId: string,
  status: "idle" | "running" | "error",
  error?: string,
): { ok: boolean } {
  let alertWorkerName: string | null = null;
  let alertError: string | null = null;
  const result = mutateUser(userId, (state) => {
    const worker = state.sre.workers.find((entry) => entry.id === workerId);
    if (!worker) return { ok: false as const };
    worker.status = status;
    worker.lastHeartbeatAt = nowIso();
    worker.lastError = status === "error" ? error ?? "worker_error" : null;
    if (status === "error") {
      alertWorkerName = worker.name;
      alertError = worker.lastError ?? "worker_error";
    }
    return { ok: true as const };
  });
  if (alertWorkerName && alertError) {
    pushAlert(userId, "critical", "Worker reported error", {
      workerId,
      workerName: alertWorkerName,
      error: alertError,
    });
  }
  return result;
}

export function listWorkers(userId: string): UserState["sre"]["workers"] {
  return mutateUser(userId, (state) => state.sre.workers);
}

export function recoverFailedQueueJobs(userId: string): { recovered: number } {
  ensureScope(userId, "governance.policy.write");
  const recovered = mutateUser(userId, (state) => {
    let count = 0;
    for (const job of state.queue) {
      if (job.status !== "failed") continue;
      job.status = "queued";
      job.updatedAt = nowIso();
      job.error = undefined;
      count += 1;
    }
    return count;
  });
  if (recovered > 0) {
    pushAlert(userId, "warning", "Recovered failed queue jobs", { recovered });
    audit(userId, "sre.queue.recovered", `recovered=${recovered}`);
  }
  return { recovered };
}

export function backfillDeadLetterSourceEvents(userId: string): { requeued: number } {
  ensureScope(userId, "governance.policy.write");
  const requeued = mutateUser(userId, (state) => {
    let count = 0;
    for (const event of state.sourceEvents) {
      if (event.status !== "dead_letter") continue;
      event.status = "pending";
      event.attempts = 0;
      event.error = undefined;
      event.deadLetteredAt = undefined;
      event.nextAttemptAt = nowIso();
      event.updatedAt = nowIso();
      count += 1;
    }
    return count;
  });
  if (requeued > 0) {
    pushAlert(userId, "warning", "Backfilled dead-letter source events", { requeued });
    audit(userId, "sre.source_events.backfilled", `requeued=${requeued}`);
  }
  return { requeued };
}

export function getSreRunbook(userId: string): {
  queueBackendMode: "file" | "redis";
  steps: string[];
  warnings: string[];
} {
  const status = getStatus(userId);
  const runtime = getRuntimeHealth();
  const warnings: string[] = [];
  if (status.queue.failed > 0) warnings.push(`queue failed jobs=${status.queue.failed}`);
  if (status.sourceEvents.deadLetter > 0) warnings.push(`dead-letter events=${status.sourceEvents.deadLetter}`);
  if (runtime.staleWorkers > 0) warnings.push(`stale workers=${runtime.staleWorkers}`);
  if (!status.scheduler.enabled) warnings.push("scheduler disabled");

  const steps = [
    "Check Control Plane Health for queue/worker/dead-letter counters.",
    "Run SRE Recover Queue to move failed jobs back to queued.",
    "Run SRE Backfill Dead Letter to replay dead-letter source events.",
    "Trigger worker run-once and verify queue failed count decreases.",
    "Review alerts and audit timeline for repeated failures.",
  ];
  if (runtime.queueBackendMode === "file") {
    steps.push("Switch COMPANY_BRAIN_QUEUE_BACKEND=redis in production for durable queue semantics.");
  }

  return {
    queueBackendMode: runtime.queueBackendMode,
    steps,
    warnings,
  };
}

export function getRuntimeHealth(): {
  activeSchedulers: number;
  bootstrappedUsers: number;
  totalUsers: number;
  usersWithEnabledSources: number;
  staleWorkers: number;
  queueBackendMode: "file" | "redis";
} {
  const store = readStore();
  const states = Object.values(store.users);
  const now = Date.now();
  let staleWorkers = 0;
  let usersWithEnabledSources = 0;

  for (const state of states) {
    if (state.sources.some((source) => source.enabled)) {
      usersWithEnabledSources += 1;
    }
    for (const worker of state.sre.workers) {
      if (!worker.lastHeartbeatAt) continue;
      const ageSeconds = Math.floor((now - new Date(worker.lastHeartbeatAt).getTime()) / 1000);
      if (ageSeconds > WORKER_STALE_SECONDS) staleWorkers += 1;
    }
  }

  return {
    activeSchedulers: schedulerTimers.size,
    bootstrappedUsers: runtimeBootstrappedUsers.size,
    totalUsers: states.length,
    usersWithEnabledSources,
    staleWorkers,
    queueBackendMode: getQueueBackendInfo().mode,
  };
}

export function replayAudit(userId: string, from?: string, to?: string): {
  events: AuditEvent[];
  summary: { total: number; byType: Record<string, number> };
} {
  const requiresApproval = mutateUser(userId, (state) =>
    Object.values(state.compliance.sourcePolicies).some((policy) => policy.requireReplayApproval),
  );
  if (requiresApproval) {
    const hasApproval = mutateUser(userId, (state) =>
      state.auditReplayApprovals.some((item) => item.status === "approved"),
    );
    if (!hasApproval) {
      return {
        events: [],
        summary: { total: 0, byType: { replay_blocked_approval_required: 1 } },
      };
    }
  }
  return mutateUser(userId, (state) => {
    const fromTs = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY;
    const toTs = to ? new Date(to).getTime() : Number.POSITIVE_INFINITY;
    const events = state.audit.filter((event) => {
      const ts = new Date(event.at).getTime();
      return ts >= fromTs && ts <= toTs;
    });
    const byType: Record<string, number> = {};
    for (const event of events) {
      byType[event.type] = (byType[event.type] ?? 0) + 1;
    }
    return {
      events,
      summary: {
        total: events.length,
        byType,
      },
    };
  });
}

export function getExecutionEvidence(userId: string): {
  generatedAt: string;
  actionSummary: {
    total: number;
    pending: number;
    approved: number;
    executed: number;
    failed: number;
    rejected: number;
  };
  auditSummary: {
    total: number;
    byType: Record<string, number>;
  };
  recentAudit: AuditEvent[];
  recentActions: Array<{
    id: string;
    name: string;
    risk: "low" | "medium" | "high";
    status: "pending" | "approved" | "executed" | "rejected" | "failed";
    updatedAt: string;
    executionDetail?: string;
  }>;
} {
  return mutateUser(userId, (state) => {
    const byType: Record<string, number> = {};
    for (const event of state.audit) {
      byType[event.type] = (byType[event.type] ?? 0) + 1;
    }
    const actions = state.actions;
    const actionSummary = {
      total: actions.length,
      pending: actions.filter((a) => a.status === "pending").length,
      approved: actions.filter((a) => a.status === "approved").length,
      executed: actions.filter((a) => a.status === "executed").length,
      failed: actions.filter((a) => a.status === "failed").length,
      rejected: actions.filter((a) => a.status === "rejected").length,
    };
    return {
      generatedAt: nowIso(),
      actionSummary,
      auditSummary: {
        total: state.audit.length,
        byType,
      },
      recentAudit: state.audit.slice(0, 30),
      recentActions: actions.slice(0, 20).map((action) => ({
        id: action.id,
        name: action.name,
        risk: action.risk,
        status: action.status,
        updatedAt: action.updatedAt,
        executionDetail: action.executionResult?.detail,
      })),
    };
  });
}

export function requestAuditReplayApproval(
  userId: string,
  from?: string,
  to?: string,
  note?: string,
): { id: string; status: "pending" } {
  return mutateUser(userId, (state) => {
    const item = {
      id: randomUUID(),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      status: "pending" as const,
      requestedBy: userId,
      createdAt: nowIso(),
      ...(note ? { note } : {}),
    };
    state.auditReplayApprovals.unshift(item);
    state.auditReplayApprovals = state.auditReplayApprovals.slice(0, 200);
    return { id: item.id, status: "pending" as const };
  });
}

export function reviewAuditReplayApproval(
  userId: string,
  approvalId: string,
  decision: "approve" | "reject",
): { ok: boolean } {
  ensureScope(userId, "governance.audit.replay.review");
  return mutateUser(userId, (state) => {
    const item = state.auditReplayApprovals.find((entry) => entry.id === approvalId);
    if (!item) return { ok: false };
    item.status = decision === "approve" ? "approved" : "rejected";
    item.reviewedBy = userId;
    item.reviewedAt = nowIso();
    return { ok: true };
  });
}

export function listAuditReplayApprovals(userId: string): UserState["auditReplayApprovals"] {
  return mutateUser(userId, (state) => state.auditReplayApprovals);
}

export function getCompliancePolicy(userId: string): UserState["compliance"] {
  return mutateUser(userId, (state) => state.compliance);
}

export function updateCompliancePolicy(
  userId: string,
  patch: Partial<Record<SourceType, Partial<UserState["compliance"]["sourcePolicies"][SourceType]>>>,
): UserState["compliance"] {
  ensureScope(userId, "governance.compliance.write");
  return mutateUser(userId, (state) => {
    for (const source of Object.keys(state.compliance.sourcePolicies) as SourceType[]) {
      const next = patch[source];
      if (!next) continue;
      const current = state.compliance.sourcePolicies[source];
      const retentionClass =
        next.retentionClass === "short" || next.retentionClass === "standard" || next.retentionClass === "extended"
          ? next.retentionClass
          : current.retentionClass;
      const bounds = ttlBoundsForClass(retentionClass);
      const requestedTtl = typeof next.ttlHours === "number" && Number.isFinite(next.ttlHours)
        ? Math.floor(next.ttlHours)
        : current.ttlHours;
      state.compliance.sourcePolicies[source] = {
        redactPII: typeof next.redactPII === "boolean" ? next.redactPII : current.redactPII,
        retentionClass,
        ttlHours: Math.max(bounds.min, Math.min(bounds.max, requestedTtl)),
        requireReplayApproval:
          typeof next.requireReplayApproval === "boolean" ? next.requireReplayApproval : current.requireReplayApproval,
      };
    }
    return state.compliance;
  });
}

export function runEvalHarness(userId: string): {
  passed: number;
  failed: number;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
} {
  const status = getStatus(userId);
  const actions = listActions(userId);
  const executedActions = actions.filter((action) => action.status === "executed").length;
  const pendingApprovals = actions.filter((action) => action.status === "pending").length;
  const configuredBusinessSources = status.sources.filter((source) =>
    source.type === "support" || source.type === "crm" || source.type === "db");

  const checks = [
    {
      name: "source_coverage",
      passed: status.sources.filter((source) => source.enabled).length >= 3,
      detail: "at least 3 active knowledge sources",
    },
    {
      name: "graph_materialized",
      passed: status.graph.nodes > 0,
      detail: "graph has nodes",
    },
    {
      name: "skills_compiled",
      passed: status.skills.count > 0,
      detail: "skill compiler generated executable skills",
    },
    {
      name: "approval_pipeline",
      passed: pendingApprovals >= 0,
      detail: "approval queue + audit trail available",
    },
    {
      name: "business_source_connectors",
      passed: configuredBusinessSources.length >= 1,
      detail: "support/crm/db source configured",
    },
    {
      name: "action_runner_execution",
      passed: executedActions >= 0,
      detail: "action runner can execute approved tasks",
    },
    {
      name: "reliability_dead_letter",
      passed: status.sourceEvents.deadLetter === 0,
      detail: "no dead-letter source events",
    },
    {
      name: "scheduler_health",
      passed: status.scheduler.enabled,
      detail: "scheduler is enabled for continuous ingestion",
    },
  ];
  const passed = checks.filter((check) => check.passed).length;
  return { passed, failed: checks.length - passed, checks };
}

export function bootstrapCompanyBrainRuntime(defaultIntervalSeconds = 300): {
  restoredSchedulers: number;
  totalUsers: number;
} {
  const safeInterval = Math.max(30, Math.min(3600, Math.floor(defaultIntervalSeconds)));
  const store = readStore();
  const userIds = Object.keys(store.users);
  let restoredSchedulers = 0;

  for (const userId of userIds) {
    const state = store.users[userId];
    if (!state) continue;
    const hasEnabledSource = state.sources.some((source) => source.enabled);
    if (!hasEnabledSource) continue;
    const interval = state.scheduler.enabled ? state.scheduler.intervalSeconds : safeInterval;
    startScheduler(userId, interval);
    runtimeBootstrappedUsers.add(userId);
    restoredSchedulers += 1;
  }

  return {
    restoredSchedulers,
    totalUsers: userIds.length,
  };
}
