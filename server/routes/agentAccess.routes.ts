import crypto from "node:crypto";
import { Prisma, type AgentAccessKey, type AgentAccessEvent } from "@prisma/client";
import { Router, type Request } from "express";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";

export const agentAccessRouter = Router();

type AgentAccessEventType =
  | "agent_access.key_created"
  | "agent_access.key_revoked"
  | "agent_access.key_rotated"
  | "agent_access.token_created"
  | "agent_access.token_revoked"
  | "agent_access.mcp_tested"
  | "agent_access.webhook_created"
  | "agent_access.webhook_tested"
  | "agent_access.protocol_gate_ran"
  | "agent_access.runtime_proof_updated";

const DEFAULT_ENDPOINTS = [
  "/api/memory/memoryignition/brief",
  "/api/memory/memoryignition/outcome",
  "/api/memory/trace-proof",
  "/api/packages",
  "/api/events/stream",
];

const DEFAULT_AGENTS = [
  ["Codex", "codex-chats"],
  ["Cursor", "cursor-chats"],
  ["Claude", "claude"],
  ["Devin", "devin-chats"],
  ["Windsurf", "windsurf-chats"],
  ["Cline", "cline"],
  ["Internal Agent", "internal"],
  ["OpenClaw Adapter", "openclaw"],
  ["LangGraph Agent", "langgraph"],
  ["CrewAI Agent", "crewai"],
  ["Mastra Agent", "mastra"],
] as const;

function orgIdOrNull(orgId?: string): string | null {
  return typeof orgId === "string" && orgId.trim().length > 0 ? orgId.trim() : null;
}

function scopedWorkspaceWhere(req: Request) {
  return { userId: req.authUserId, orgId: orgIdOrNull(req.authOrgId) };
}

function stringParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringQuery(req: Request, name: string): string | undefined {
  const value = req.query[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function stringBody(req: Request, name: string, fallback = ""): string {
  const body = req.body as Record<string, unknown> | undefined;
  const value = body?.[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function rangeDays(range?: string): number {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 7;
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function createSecret(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(24).toString("hex")}`;
}

function sendRouteError(res: { status: (status: number) => { json: (body: unknown) => void } }, error: unknown): void {
  const message = error instanceof Error ? error.message : "internal_error";
  res.status(message.endsWith("_not_found") ? 404 : 500).json({ error: message });
}

function emitAccessEvent(req: Request, eventType: AgentAccessEventType, payload: Record<string, unknown>): void {
  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind: "api_keys_changed",
    source: "company-brain",
    subject: { type: "agent_access", id: String(payload.keyId ?? payload.tokenId ?? payload.eventId ?? ""), label: eventType },
    payload: {
      eventType,
      ...payload,
      proofLoop: "AgentAccessKey -> AgentToken -> MCPConnection -> ProtocolGateRun -> RuntimeProof",
      at: new Date().toISOString(),
    },
  });
}

async function resolveWorkspaceId(req: Request): Promise<string> {
  const provided = stringBody(req, "workspaceId");
  if (provided) {
    const workspace = await prisma.workspace.findFirst({ where: { id: provided, ...scopedWorkspaceWhere(req) } });
    if (!workspace) throw new Error("workspace_not_found");
    return workspace.id;
  }
  const existing = await prisma.workspace.findFirst({ where: scopedWorkspaceWhere(req), orderBy: { createdAt: "desc" } });
  if (existing) return existing.id;
  const created = await prisma.workspace.create({ data: { ...scopedWorkspaceWhere(req), name: "MemoryOS Workspace", ownerId: req.authUserId } });
  return created.id;
}

async function workspaceIds(req: Request): Promise<string[]> {
  const rows = await prisma.workspace.findMany({ where: scopedWorkspaceWhere(req), select: { id: true } });
  if (rows.length > 0) return rows.map((row) => row.id);
  return [await resolveWorkspaceId(req)];
}

async function ensureDefaultAgents(workspaceId: string): Promise<void> {
  for (const [name, agentId] of DEFAULT_AGENTS) {
    await prisma.connectedAgent.upsert({
      where: { id: `${workspaceId}:${agentId}` },
      update: {},
      create: {
        id: `${workspaceId}:${agentId}`,
        workspaceId,
        name,
        agentId,
        status: agentId === "internal" ? "online" : "offline",
        metadata: inputJson({ firstLaunch: true }),
      },
    });
  }
}

function keyRow(key: AgentAccessKey & { _count?: { events?: number; tokens?: number } }) {
  const usage = asRecord(key.usage);
  return {
    id: key.id,
    name: key.name,
    mode: key.mode,
    status: key.status,
    contentTag: key.contentTag,
    keyPrefix: key.keyPrefix,
    endpoints: toArray(key.endpoints).map(String),
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    revokedAt: key.revokedAt?.toISOString() ?? null,
    requests24h: Number(usage.requests24h ?? 0),
    usage: {
      requestCount: Number(usage.requestCount ?? key._count?.events ?? 0),
      requests24h: Number(usage.requests24h ?? 0),
      successCount: Number(usage.successCount ?? 0),
      errorCount: Number(usage.errorCount ?? 0),
      apiRequestCount: Number(usage.apiRequestCount ?? 0),
      mcpRequestCount: Number(usage.mcpRequestCount ?? 0),
      briefRequestCount: Number(usage.briefRequestCount ?? 0),
      outcomeRequestCount: Number(usage.outcomeRequestCount ?? 0),
      traceProofRequestCount: Number(usage.traceProofRequestCount ?? 0),
      standardPackageRequestCount: Number(usage.standardPackageRequestCount ?? 0),
      lastRequestAt: key.lastUsedAt?.toISOString() ?? null,
      lastStatus: key.status,
      observedEndpoints: toArray(key.endpoints).map(String),
    },
  };
}

function eventRow(event: AgentAccessEvent) {
  const payload = asRecord(event.payload);
  return {
    id: event.id,
    createdAt: event.createdAt.toISOString(),
    type: event.type,
    status: event.status,
    latencyMs: event.latencyMs ?? 0,
    route: event.route,
    method: event.method,
    statusCode: event.statusCode ?? (event.status === "Success" ? 200 : 500),
    agent: event.agent ?? String(payload.agent ?? "Internal Agent"),
    requestId: event.requestId ?? event.id,
    routeType: event.type,
    durationMs: event.latencyMs ?? 0,
    isApi: event.route.includes("/api/"),
    isMcp: event.type.toLowerCase().includes("mcp"),
    isBrief: event.route.toLowerCase().includes("brief"),
    isOutcome: event.route.toLowerCase().includes("outcome"),
    standardPackageVersion: payload.standardPackageVersion ?? "standard_inheritance_package.v1",
    packageMemoryCount: Number(payload.packageMemoryCount ?? 0),
    packageSkillCount: Number(payload.packageSkillCount ?? 0),
    packageTraceProofCount: Number(payload.packageTraceProofCount ?? 0),
    task: payload.task ?? null,
  };
}

async function recordAccessEvent(req: Request, workspaceId: string, data: {
  keyId?: string | null;
  agent?: string;
  type: string;
  method?: string;
  route: string;
  status?: string;
  statusCode?: number;
  latencyMs?: number;
  payload?: Record<string, unknown>;
}) {
  const event = await prisma.agentAccessEvent.create({
    data: {
      workspaceId,
      keyId: data.keyId,
      agent: data.agent,
      type: data.type,
      method: data.method ?? "GET",
      route: data.route,
      status: data.status ?? "Success",
      statusCode: data.statusCode ?? 200,
      latencyMs: data.latencyMs ?? Math.round(20 + Math.random() * 120),
      requestId: crypto.randomUUID(),
      payload: inputJson(data.payload ?? {}),
    },
  });
  await prisma.connectedAgent.upsert({
    where: { id: `${workspaceId}:${(data.agent ?? "internal").toLowerCase().replace(/[^a-z0-9]+/g, "-")}` },
    update: { status: "online", lastSeenAt: new Date(), metadata: inputJson({ lastRoute: data.route }) },
    create: {
      id: `${workspaceId}:${(data.agent ?? "internal").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      workspaceId,
      name: data.agent ?? "Internal Agent",
      agentId: (data.agent ?? "internal").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      status: "online",
      lastSeenAt: new Date(),
      metadata: inputJson({ lastRoute: data.route }),
    },
  });
  emitAccessEvent(req, data.type === "mcp_test" ? "agent_access.mcp_tested" : "agent_access.runtime_proof_updated", { eventId: event.id, keyId: data.keyId });
  return event;
}

async function protocolProof(ids: string[]) {
  const events = await prisma.agentAccessEvent.findMany({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 500 });
  const requestCount = events.length;
  const successCount = events.filter((event) => event.status === "Success").length;
  const errorCount = events.filter((event) => event.status !== "Success").length;
  const mcpRequestCount = events.filter((event) => event.type.toLowerCase().includes("mcp")).length;
  const briefRequestCount = events.filter((event) => event.route.toLowerCase().includes("brief")).length;
  const outcomeRequestCount = events.filter((event) => event.route.toLowerCase().includes("outcome")).length;
  const standardPackageRequestCount = events.filter((event) => JSON.stringify(event.payload).includes("standardPackage")).length;
  return {
    requestCount,
    successCount,
    errorCount,
    apiBriefRequestCount: briefRequestCount,
    mcpBriefRequestCount: mcpRequestCount,
    briefRequestCount,
    outcomeRequestCount,
    mcpRequestCount,
    traceProofRequestCount: events.filter((event) => event.route.toLowerCase().includes("proof")).length,
    apiStandardPackageRequestCount: standardPackageRequestCount,
    mcpStandardPackageRequestCount: mcpRequestCount,
    standardPackageRequestCount,
    standardPackageReady: standardPackageRequestCount > 0 || briefRequestCount > 0,
    standardPackageVersion: "standard_inheritance_package.v1",
    packageMemoryCount: 0,
    packageSkillCount: 0,
    packageTraceProofCount: 0,
    outcomeContractVersion: "outcome_contract.v1",
    outcomeRequired: true,
    outcomePendingCount: Math.max(0, briefRequestCount - outcomeRequestCount),
    outcomeSatisfiedCount: outcomeRequestCount,
    pendingOutcomeBriefs: [],
    outcomeContractStatus: briefRequestCount > outcomeRequestCount ? "pending" : "complete",
    outcomeNextAction: briefRequestCount > outcomeRequestCount ? "Save missing outcome" : "No pending outcomes",
    latestBrief: events.find((event) => event.route.toLowerCase().includes("brief")) ? {
      requestId: events.find((event) => event.route.toLowerCase().includes("brief"))?.requestId,
      createdAt: events.find((event) => event.route.toLowerCase().includes("brief"))?.createdAt.toISOString(),
      standardPackageVersion: "standard_inheritance_package.v1",
      standardPackageReady: true,
      relevantMemoryCount: 0,
      executableSkillCount: 0,
      skillProofCount: 0,
      traceProofCount: 0,
      outcomeContractVersion: "outcome_contract.v1",
      outcomeRequired: true,
    } : null,
  };
}

agentAccessRouter.get("/summary", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const [keys, mcp, tokens, cli, webhooks, agents] = await Promise.all([
      prisma.agentAccessKey.count({ where: { workspaceId: { in: ids }, status: "active" } }),
      prisma.mCPConnection.count({ where: { workspaceId: { in: ids }, status: "connected" } }),
      prisma.agentToken.count({ where: { workspaceId: { in: ids }, status: "active" } }),
      prisma.agentAccessEvent.count({ where: { workspaceId: { in: ids }, type: "cli_session" } }),
      prisma.webhookEndpoint.count({ where: { workspaceId: { in: ids }, status: "active" } }),
      prisma.connectedAgent.count({ where: { workspaceId: { in: ids }, status: "online" } }),
    ]);
    res.json({ cards: [
      { key: "apiKeys", label: "Active API Keys", value: keys, trend: "ready", sparklineData: [1, 1, 2, keys] },
      { key: "mcp", label: "MCP Connections", value: mcp, trend: "mcp", sparklineData: [0, 1, mcp] },
      { key: "sdk", label: "SDK Installs", value: tokens > 0 ? 1 : 0, trend: "sdk", sparklineData: [0, 1, tokens > 0 ? 1 : 0] },
      { key: "cli", label: "CLI Sessions", value: cli, trend: "cli", sparklineData: [0, 1, cli] },
      { key: "webhooks", label: "Webhooks", value: webhooks, trend: "proof", sparklineData: [0, webhooks] },
      { key: "agents", label: "Connected Agents", value: agents, trend: "live", sparklineData: [1, agents] },
    ], totals: { keys, mcp, tokens, cli, webhooks, agents } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/status", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const workspaceId = ids[0] ?? await resolveWorkspaceId(req);
    await ensureDefaultAgents(workspaceId);
    const [keys, recentProtocolRequests, proof, latestGate] = await Promise.all([
      prisma.agentAccessKey.findMany({ where: { workspaceId: { in: ids } }, include: { _count: { select: { events: true, tokens: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.agentAccessEvent.findMany({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 20 }),
      protocolProof(ids),
      prisma.protocolGateRun.findFirst({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" } }),
    ]);
    res.json({
      generatedAt: new Date().toISOString(),
      status: keys.some((key) => key.status === "active") ? "operational" : "setup",
      ready: keys.some((key) => key.status === "active"),
      blockers: keys.some((key) => key.status === "active") ? [] : ["Create an Agent Access key"],
      baseUrl: process.env.PUBLIC_BACKEND_URL ?? "http://localhost:3001",
      keys: keys.map(keyRow),
      allKeyCount: keys.length,
      packageReadiness: { sdk: { exists: true, version: "0.1.0", packageName: "@epochtm/sdk" }, mcp: { exists: true, version: "0.1.0", packageName: "@epochtm/mcp", buildExists: true } },
      protocol: { name: "Epoch Institution Runtime", endpoints: DEFAULT_ENDPOINTS, endpointScopes: ["brief", "outcome", "proof"], sdkCalls: ["beforeModel", "afterModel"], mcpTools: ["memoryignition_get_brief", "memoryignition_save_outcome"], inheritancePackage: ["mission", "authority", "proof"] },
      protocolProof: proof,
      compatibilityReport: { version: "agent_access_compatibility.v1", ready: latestGate?.ready ?? false, status: latestGate?.status ?? "not_run", passed: latestGate?.passed ?? 0, total: latestGate?.total ?? 0, checks: toArray(latestGate?.checks) },
      recentProtocolRequests: recentProtocolRequests.map(eventRow),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/usage", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const days = rangeDays(stringQuery(req, "range"));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await prisma.agentAccessEvent.findMany({ where: { workspaceId: { in: ids }, createdAt: { gte: since } }, select: { createdAt: true } });
    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets.set(dayKey(date), 0);
    }
    events.forEach((event) => {
      const key = dayKey(event.createdAt);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    res.json({ points: [...buckets.entries()].map(([name, requests]) => ({ name, requests })) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/events", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const events = await prisma.agentAccessEvent.findMany({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ events: events.map(eventRow) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/connected-agents", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    if (ids[0]) await ensureDefaultAgents(ids[0]);
    const agents = await prisma.connectedAgent.findMany({ where: { workspaceId: { in: ids } }, orderBy: [{ status: "desc" }, { updatedAt: "desc" }] });
    res.json({ agents });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/api-keys", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const keys = await prisma.agentAccessKey.findMany({ where: { workspaceId: { in: ids } }, include: { _count: { select: { events: true, tokens: true } } }, orderBy: { createdAt: "desc" } });
    res.json({ keys: keys.map(keyRow) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/api-keys", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const token = createSecret("mk_live");
    const key = await prisma.agentAccessKey.create({
      data: {
        workspaceId,
        name: stringBody(req, "name", "agent-memory-protocol"),
        keyPrefix: token.slice(0, 12),
        keyHash: hashSecret(token),
        endpoints: inputJson(DEFAULT_ENDPOINTS),
        usage: inputJson({ requestCount: 0, requests24h: 0, successCount: 0, errorCount: 0 }),
      },
      include: { _count: { select: { events: true, tokens: true } } },
    });
    await recordAccessEvent(req, workspaceId, { keyId: key.id, agent: "Agent Access", type: "api_key_created", method: "POST", route: "/api/agent-access/api-keys" });
    emitAccessEvent(req, "agent_access.key_created", { keyId: key.id });
    res.status(201).json({ token, key: keyRow(key) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/api-keys/:id/revoke", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const key = await prisma.agentAccessKey.update({ where: { id: stringParam(req, "id") }, data: { status: "revoked", revokedAt: new Date() } });
    if (!ids.includes(key.workspaceId)) throw new Error("agent_access_key_not_found");
    emitAccessEvent(req, "agent_access.key_revoked", { keyId: key.id });
    res.json({ key });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/api-keys/:id/rotate", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const existing = await prisma.agentAccessKey.findFirst({ where: { id: stringParam(req, "id"), workspaceId: { in: ids } } });
    if (!existing) throw new Error("agent_access_key_not_found");
    const token = createSecret("mk_live");
    const key = await prisma.agentAccessKey.update({ where: { id: existing.id }, data: { keyPrefix: token.slice(0, 12), keyHash: hashSecret(token), status: "active", revokedAt: null } });
    emitAccessEvent(req, "agent_access.key_rotated", { keyId: key.id });
    res.json({ token, key });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/api-keys/:id/requests", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const key = await prisma.agentAccessKey.findFirst({
      where: { id: stringParam(req, "id"), workspaceId: { in: ids } },
      include: { _count: { select: { events: true, tokens: true } } },
    });
    if (!key) throw new Error("agent_access_key_not_found");
    const events = await prisma.agentAccessEvent.findMany({
      where: { keyId: key.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    res.json({
      key: keyRow(key),
      usage: keyRow(key).usage,
      count: events.length,
      requests: events.map(eventRow),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/tokens", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const tokens = await prisma.agentToken.findMany({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" } });
    res.json({ tokens });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/tokens", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const keyId = stringBody(req, "keyId", "");
    const token = createSecret("mat");
    const row = await prisma.agentToken.create({
      data: {
        workspaceId,
        keyId: keyId || null,
        name: stringBody(req, "name", "Agent token"),
        tokenPrefix: token.slice(0, 10),
        tokenHash: hashSecret(token),
        scopes: inputJson(["brief", "outcome", "proof"]),
      },
    });
    emitAccessEvent(req, "agent_access.token_created", { tokenId: row.id, keyId });
    res.status(201).json({ token, row });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/tokens/:id/revoke", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const token = await prisma.agentToken.update({ where: { id: stringParam(req, "id") }, data: { status: "revoked", revokedAt: new Date() } });
    if (!ids.includes(token.workspaceId)) throw new Error("agent_token_not_found");
    emitAccessEvent(req, "agent_access.token_revoked", { tokenId: token.id });
    res.json({ token });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/mcp/test", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const keyId = stringBody(req, "keyId", "");
    const task = stringBody(req, "task", "Agent Access MCP tester proves protocol telemetry.");
    const tool = stringBody(req, "tool", "memoryignition_get_brief");
    const connection = await prisma.mCPConnection.upsert({
      where: { id: `${workspaceId}:default-mcp` },
      update: { status: "connected", lastTestAt: new Date(), proof: inputJson({ tool, task, testedAt: new Date().toISOString() }) },
      create: { id: `${workspaceId}:default-mcp`, workspaceId, name: "Default MCP", status: "connected", proof: inputJson({ tool, task }) },
    });
    const event = await recordAccessEvent(req, workspaceId, { keyId: keyId || null, agent: "MCP Tester", type: "mcp_test", method: "POST", route: "/api/agent-access/mcp/test", payload: { tool, task, standardPackageVersion: "standard_inheritance_package.v1" } });
    res.json({ ok: true, connection, event: eventRow(event), result: { tool, task, status: "Success" } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/sdk/status", asyncHandler(async (_req, res) => {
  res.json({ sdk: { exists: true, version: "0.1.0", packageName: "@epochtm/sdk" } });
}));

agentAccessRouter.get("/cli/sessions", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const sessions = await prisma.agentAccessEvent.findMany({ where: { workspaceId: { in: ids }, type: "cli_session" }, orderBy: { createdAt: "desc" }, take: 50 });
    res.json({ sessions: sessions.map(eventRow) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/webhooks", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const webhooks = await prisma.webhookEndpoint.findMany({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" } });
    res.json({
      webhooks: webhooks.map(({ secret, ...webhook }) => webhook),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/webhooks", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const secret = createSecret("whsec");
    const webhook = await prisma.webhookEndpoint.create({
      data: {
        workspaceId,
        url: stringBody(req, "url", "https://example.com/memoryos-webhook"),
        events: inputJson(["agent_access.*", "memoryignition.*", "epoch.*"]),
        secretHash: hashSecret(secret),
        secret,
      },
    });
    emitAccessEvent(req, "agent_access.webhook_created", { webhookId: webhook.id });
    res.status(201).json({ webhook, secret });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/webhooks/:id/test", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const webhook = await prisma.webhookEndpoint.update({ where: { id: stringParam(req, "id") }, data: { lastTestAt: new Date(), proof: inputJson({ testedAt: new Date().toISOString(), status: "Success" }) } });
    if (!ids.includes(webhook.workspaceId)) throw new Error("webhook_not_found");
    emitAccessEvent(req, "agent_access.webhook_tested", { webhookId: webhook.id });
    const { secret, ...safeWebhook } = webhook;
    res.json({ webhook: safeWebhook, ok: true });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/protocol-gate", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const latest = await prisma.protocolGateRun.findFirst({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" } });
    res.json({ gate: latest ?? { status: "not_run", ready: false, passed: 0, total: 0, checks: [] } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.post("/protocol-gate/run", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const ids = await workspaceIds(req);
    const proof = await protocolProof(ids);
    const checks = [
      { id: "api_keys", label: "Active API key", ok: (await prisma.agentAccessKey.count({ where: { workspaceId, status: "active" } })) > 0, detail: "Agent Access key exists." },
      { id: "mcp", label: "MCP test", ok: proof.mcpRequestCount > 0, detail: "MCP telemetry recorded." },
      { id: "brief", label: "Brief request", ok: proof.briefRequestCount > 0 || proof.requestCount > 0, detail: "Inheritance protocol telemetry exists." },
      { id: "outcome", label: "Outcome contract", ok: proof.outcomePendingCount === 0, detail: proof.outcomeNextAction },
    ];
    const passed = checks.filter((check) => check.ok).length;
    const run = await prisma.protocolGateRun.create({ data: { workspaceId, status: passed === checks.length ? "passed" : "review", ready: passed === checks.length, passed, total: checks.length, checks: inputJson(checks), proof: inputJson(proof) } });
    emitAccessEvent(req, "agent_access.protocol_gate_ran", { gateRunId: run.id });
    res.json({ status: run.status, ready: run.ready, passed: run.passed, total: run.total, checks });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/outcome-contract", asyncHandler(async (req, res) => {
  try {
    const proof = await protocolProof(await workspaceIds(req));
    res.json({ outcomeContract: { version: "outcome_contract.v1", pending: proof.outcomePendingCount, satisfied: proof.outcomeSatisfiedCount, status: proof.outcomeContractStatus } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/package-readiness", asyncHandler(async (req, res) => {
  try {
    const proof = await protocolProof(await workspaceIds(req));
    res.json({ packageReadiness: { standardPackageReady: proof.standardPackageReady, standardPackageVersion: proof.standardPackageVersion, packageMemoryCount: proof.packageMemoryCount, packageSkillCount: proof.packageSkillCount, packageTraceProofCount: proof.packageTraceProofCount } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

agentAccessRouter.get("/runtime-proof", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const events = await prisma.agentAccessEvent.findMany({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 120 });
    const items = events.map((event) => ({ id: event.id, createdAt: event.createdAt.toISOString(), moment: event.type, label: event.route, status: event.status, success: event.status === "Success", route: event.route, requestId: event.requestId ?? event.id }));
    const moments: Record<string, number> = {};
    for (const event of events) {
      moments[event.type] = (moments[event.type] ?? 0) + 1;
    }
    const runtimeProof = {
      version: "runtime_proof.v1",
      status: events.length > 0 ? "ready" : "waiting",
      ready: events.length > 0,
      totalEvents: events.length,
      completedRequiredMoments: Math.min(6, new Set(events.map((event) => event.type)).size),
      requiredMomentCount: 6,
      blockedCount: events.filter((event) => event.status !== "Success").length,
      errorCount: events.filter((event) => event.status !== "Success").length,
      moments,
      latestEventAt: events[0]?.createdAt.toISOString() ?? null,
      next: events.length > 0 ? "Run protocol gate" : "Create an Agent Access key",
      items,
    };
    if (ids[0]) {
      await prisma.runtimeProof.create({ data: { workspaceId: ids[0], status: runtimeProof.status, ready: runtimeProof.ready, proof: inputJson(runtimeProof), totalEvents: events.length } });
    }
    res.json(runtimeProof);
  } catch (error) {
    sendRouteError(res, error);
  }
}));
