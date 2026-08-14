import { prisma } from "../../../lib/storage/prismaClient";
import { listMemoryTools, type MemoryToolDescriptor } from "../../../lib/memory/MCP";

type JsonRecord = Record<string, unknown>;

export type McpClientView = {
  id: string;
  name: string;
  client: string;
  status: string;
  healthy: boolean;
  lastTestAt: string | null;
  createdAt: string;
  updatedAt: string;
  proof: JsonRecord;
};

export type McpToolView = MemoryToolDescriptor & {
  category: string;
  callsToday: number;
  lastUsedAt: string | null;
  status: string;
};

export type McpResourceView = {
  id: string;
  name: string;
  kind: string;
  route: string;
  status: string;
  count: number;
  description: string;
};

export type McpRequestView = {
  id: string;
  createdAt: string;
  method: string;
  route: string;
  status: string;
  statusCode: number | null;
  latencyMs: number | null;
  requestId: string | null;
  agent: string | null;
  type: string;
  payload: JsonRecord;
};

export type McpLogView = McpRequestView & {
  source: string;
  level: "info" | "warn" | "error";
  note: string;
};

export type McpSessionView = {
  id: string;
  createdAt: string;
  agent: string | null;
  route: string;
  status: string;
  requestId: string | null;
  summary: string;
  source: string;
};

export type McpStatusResponse = {
  workspaceId: string;
  server: {
    transport: string;
    version: string;
    status: string;
  };
  counts: {
    sessions: number;
    clients: number;
    connectedClients: number;
    tools: number;
    resources: number;
    requests: number;
    logs: number;
  };
  latest: {
    protocolGate: {
      id: string;
      status: string;
      ready: boolean;
      passed: number;
      total: number;
      createdAt: string;
    } | null;
    runtimeProof: {
      id: string;
      version: string;
      status: string;
      ready: boolean;
      totalEvents: number;
      createdAt: string;
      updatedAt: string;
    } | null;
  };
  clients: McpClientView[];
  tools: McpToolView[];
  resources: McpResourceView[];
  sessions: McpSessionView[];
  requests: McpRequestView[];
  logs: McpLogView[];
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseToolName(event: { route: string; type: string; payload: unknown }, toolNames: Set<string>): string | null {
  const payload = toRecord(event.payload);
  const candidates = [
    payload.tool,
    payload.name,
    payload.action,
    payload.method,
    payload.route,
    payload.intent,
    payload.resource,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.trim().length === 0) {
      continue;
    }
    const normalized = candidate.trim();
    if (toolNames.has(normalized)) {
      return normalized;
    }
  }
  return null;
}

function categorizeTool(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("memory")) return "Memory";
  if (lower.includes("brief") || lower.includes("outcome") || lower.includes("handoff")) return "Memory";
  if (lower.includes("verify") || lower.includes("proof")) return "Verification";
  if (lower.includes("mission")) return "Mission";
  if (lower.includes("policy") || lower.includes("approval") || lower.includes("gate")) return "Governance";
  if (lower.includes("webhook")) return "Integration";
  if (lower.includes("session") || lower.includes("client")) return "Runtime";
  return "Core";
}

function summarizePayload(payload: JsonRecord): string {
  const keyOrder = ["tool", "task", "route", "status", "message", "eventType", "client", "name"];
  for (const key of keyOrder) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  const preview = JSON.stringify(payload);
  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function isMcpRoute(route: string): boolean {
  const lower = route.toLowerCase();
  return lower.includes("/mcp") || lower.includes("mcp_") || lower.includes("mcp");
}

function isSessionEvent(event: { type: string; route: string }): boolean {
  const type = event.type.toLowerCase();
  return type.includes("session") || type.includes("connect") || isMcpRoute(event.route);
}

function isRequestEvent(event: { type: string; route: string; payload: unknown }): boolean {
  if (isMcpRoute(event.route)) return true;
  if (event.type.toLowerCase().includes("mcp")) return true;
  const payload = toRecord(event.payload);
  return typeof payload.tool === "string" || typeof payload.request === "string";
}

function toClientView(connection: {
  id: string;
  name: string;
  client: string;
  status: string;
  lastTestAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  proof: unknown;
}): McpClientView {
  return {
    id: connection.id,
    name: connection.name,
    client: connection.client,
    status: connection.status,
    healthy: connection.status.toLowerCase() === "connected",
    lastTestAt: connection.lastTestAt?.toISOString() ?? null,
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
    proof: toRecord(connection.proof),
  };
}

function toRequestView(event: {
  id: string;
  createdAt: Date;
  method: string;
  route: string;
  status: string;
  statusCode: number | null;
  latencyMs: number | null;
  requestId: string | null;
  agent: string | null;
  type: string;
  payload: unknown;
}): McpRequestView {
  return {
    id: event.id,
    createdAt: event.createdAt.toISOString(),
    method: event.method,
    route: event.route,
    status: event.status,
    statusCode: event.statusCode,
    latencyMs: event.latencyMs,
    requestId: event.requestId,
    agent: event.agent,
    type: event.type,
    payload: toRecord(event.payload),
  };
}

function toLogView(event: {
  id: string;
  createdAt: Date;
  method: string;
  route: string;
  status: string;
  statusCode: number | null;
  latencyMs: number | null;
  requestId: string | null;
  agent: string | null;
  type: string;
  payload: unknown;
}): McpLogView {
  const payload = toRecord(event.payload);
  const route = event.route.toLowerCase();
  const status = event.status.toLowerCase();
  const level: McpLogView["level"] =
    status.includes("error") || (event.statusCode !== null && event.statusCode >= 500)
      ? "error"
      : status.includes("warn") || (event.statusCode !== null && event.statusCode >= 400)
        ? "warn"
        : "info";

  return {
    ...toRequestView(event),
    source: route.includes("/mcp") ? "mcp" : event.type.toLowerCase().includes("protocol") ? "protocol" : "runtime",
    level,
    note: summarizePayload(payload),
  };
}

function toSessionView(event: {
  id: string;
  createdAt: Date;
  agent: string | null;
  route: string;
  status: string;
  requestId: string | null;
  payload: unknown;
}): McpSessionView {
  const payload = toRecord(event.payload);
  return {
    id: event.id,
    createdAt: event.createdAt.toISOString(),
    agent: event.agent,
    route: event.route,
    status: event.status,
    requestId: event.requestId,
    summary: summarizePayload(payload),
    source: isMcpRoute(event.route) ? "mcp" : "runtime",
  };
}

function buildToolUsage(
  events: Array<{ payload: unknown; createdAt: Date }>,
  toolNames: Set<string>,
): Map<string, { callsToday: number; lastUsedAt: string | null }> {
  const usage = new Map<string, { callsToday: number; lastUsedAt: string | null }>();
  for (const event of events) {
    const payload = toRecord(event.payload);
    const tool = parseToolName({ route: "mcp", type: "mcp_event", payload }, toolNames);
    if (!tool) continue;
    const current = usage.get(tool) ?? { callsToday: 0, lastUsedAt: null };
    current.callsToday += 1;
    current.lastUsedAt = event.createdAt.toISOString();
    usage.set(tool, current);
  }
  return usage;
}

export async function buildMcpWorkspaceSnapshot(workspaceId: string): Promise<McpStatusResponse> {
  const [connections, events, latestGate, latestProof, activeApiKeys, webhookEndpoints] = await Promise.all([
    prisma.mCPConnection.findMany({
      where: { workspaceId },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.agentAccessEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.protocolGateRun.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.runtimeProof.findFirst({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.agentAccessKey.count({ where: { workspaceId, status: "active" } }),
    prisma.webhookEndpoint.count({ where: { workspaceId, status: "active" } }),
  ]);

  const allTools = listMemoryTools();
  const toolUsage = buildToolUsage(events, new Set(allTools.map((tool) => tool.name)));
  const requestRows = events.filter(isRequestEvent).map(toRequestView);
  const logRows = [
    ...events.slice(0, 80).map(toLogView),
    ...(latestGate
      ? [{
          id: `protocol-gate:${latestGate.id}`,
          createdAt: latestGate.createdAt.toISOString(),
          method: "SYSTEM",
          route: "/api/agent-access/protocol-gate",
          status: latestGate.ready ? "Passed" : "Review",
          statusCode: latestGate.ready ? 200 : 202,
          latencyMs: null,
          requestId: latestGate.id,
          agent: null,
          type: "protocol_gate_run",
          payload: {
            status: latestGate.status,
            ready: latestGate.ready,
            passed: latestGate.passed,
            total: latestGate.total,
          },
          source: "protocol",
          level: latestGate.ready ? "info" : "warn",
          note: `Protocol gate ${latestGate.status} (${latestGate.passed}/${latestGate.total})`,
        } satisfies McpLogView] : []),
    ...(latestProof
      ? [{
          id: `runtime-proof:${latestProof.id}`,
          createdAt: latestProof.updatedAt.toISOString(),
          method: "SYSTEM",
          route: "/api/agent-access/runtime-proof",
          status: latestProof.ready ? "Ready" : "Waiting",
          statusCode: latestProof.ready ? 200 : 202,
          latencyMs: null,
          requestId: latestProof.id,
          agent: null,
          type: "runtime_proof",
          payload: {
            version: latestProof.version,
            status: latestProof.status,
            ready: latestProof.ready,
            totalEvents: latestProof.totalEvents,
          },
          source: "runtime",
          level: latestProof.ready ? "info" : "warn",
          note: `Runtime proof ${latestProof.status} with ${latestProof.totalEvents} events`,
        } satisfies McpLogView] : []),
  ];

  const connectedClients = connections.filter((connection: { status: string }) => connection.status.toLowerCase() === "connected").length;
  const sessionRows = events.filter(isSessionEvent).slice(0, 50).map(toSessionView);
  const resourceRows: McpResourceView[] = [
    {
      id: "mcp_sessions",
      name: "MCP Sessions",
      kind: "table",
      route: "/api/mcp/sessions",
      status: sessionRows.length > 0 ? "ready" : "empty",
      count: sessionRows.length,
      description: "Live session and handshake rows captured from runtime events.",
    },
    {
      id: "mcp_clients",
      name: "MCP Clients",
      kind: "table",
      route: "/api/mcp/clients",
      status: connections.length > 0 ? "ready" : "empty",
      count: connections.length,
      description: "Connected MCP clients and connection proofs.",
    },
    {
      id: "mcp_tools",
      name: "MCP Tools",
      kind: "catalog",
      route: "/api/mcp/tools",
      status: allTools.length > 0 ? "ready" : "empty",
      count: allTools.length,
      description: "Available memory and runtime tools exposed through the MCP surface.",
    },
    {
      id: "mcp_resources",
      name: "MCP Resources",
      kind: "catalog",
      route: "/api/mcp/resources",
      status: "ready",
      count: 7,
      description: "Workspace-backed product resources surfaced to agents and developers.",
    },
    {
      id: "mcp_requests",
      name: "MCP Requests",
      kind: "table",
      route: "/api/mcp/requests",
      status: requestRows.length > 0 ? "ready" : "empty",
      count: requestRows.length,
      description: "Recorded MCP and protocol requests for this workspace.",
    },
    {
      id: "mcp_logs",
      name: "MCP Logs",
      kind: "timeline",
      route: "/api/mcp/logs",
      status: logRows.length > 0 ? "ready" : "empty",
      count: logRows.length,
      description: "Unified MCP logs, protocol proof, and runtime proof events.",
    },
    {
      id: "runtime_proof",
      name: "Runtime Proof",
      kind: "proof",
      route: "/api/agent-access/runtime-proof",
      status: latestProof?.ready ? "ready" : latestProof ? "waiting" : "missing",
      count: latestProof ? 1 : 0,
      description: "Most recent runtime proof snapshot for the workspace.",
    },
    {
      id: "protocol_gate",
      name: "Protocol Gate",
      kind: "proof",
      route: "/api/agent-access/protocol-gate",
      status: latestGate?.ready ? "ready" : latestGate ? "review" : "missing",
      count: latestGate ? 1 : 0,
      description: "Latest protocol gate verdict for agent access readiness.",
    },
    {
      id: "api_keys",
      name: "Runtime API Keys",
      kind: "security",
      route: "/api/agent-access/api-keys",
      status: activeApiKeys > 0 ? "ready" : "empty",
      count: activeApiKeys,
      description: "Active runtime API keys that can authenticate to MCP and Epoch routes.",
    },
    {
      id: "webhooks",
      name: "Webhooks",
      kind: "integration",
      route: "/api/epoch/workspaces/:workspaceId/developer/webhooks",
      status: webhookEndpoints > 0 ? "ready" : "empty",
      count: webhookEndpoints,
      description: "Active outbound notifications wired to the workspace.",
    },
  ];

  return {
    workspaceId,
    server: {
      transport: "HTTP",
      version: "MCP 0.1.3",
      status: connectedClients > 0 || requestRows.length > 0 ? "running" : "idle",
    },
    counts: {
      sessions: sessionRows.length,
      clients: connections.length,
      connectedClients,
      tools: allTools.length,
      resources: resourceRows.length,
      requests: requestRows.length,
      logs: logRows.length,
    },
    latest: {
      protocolGate: latestGate
        ? {
            id: latestGate.id,
            status: latestGate.status,
            ready: latestGate.ready,
            passed: latestGate.passed,
            total: latestGate.total,
            createdAt: latestGate.createdAt.toISOString(),
          }
        : null,
      runtimeProof: latestProof
        ? {
            id: latestProof.id,
            version: latestProof.version,
            status: latestProof.status,
            ready: latestProof.ready,
            totalEvents: latestProof.totalEvents,
            createdAt: latestProof.createdAt.toISOString(),
            updatedAt: latestProof.updatedAt.toISOString(),
          }
        : null,
    },
    clients: connections.map(toClientView),
    tools: allTools.map((tool) => {
      const usage = toolUsage.get(tool.name);
      return {
        ...tool,
        category: categorizeTool(tool.name),
        callsToday: usage?.callsToday ?? 0,
        lastUsedAt: usage?.lastUsedAt ?? null,
        status: (usage?.callsToday ?? 0) > 0 ? "active" : "available",
      };
    }),
    resources: resourceRows,
    sessions: sessionRows,
    requests: requestRows,
    logs: logRows,
  };
}
