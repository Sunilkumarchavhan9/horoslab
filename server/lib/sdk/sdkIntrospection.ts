import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../../lib/storage/prismaClient";

type JsonRecord = Record<string, unknown>;

export type SdkVersionView = {
  packageName: string;
  description: string;
  version: string;
  status: string;
  surface: string;
  publishedAt: string;
  packagePath: string;
};

export type SdkMethodView = {
  name: string;
  callsToday: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  averageLatencyMs: number | null;
  lastUsedAt: string | null;
  category: string;
};

export type SdkReleaseView = {
  packageName: string;
  version: string;
  status: string;
  publishedAt: string;
  channel: string;
  notes: string;
  surface: string;
};

export type SdkStatsResponse = {
  workspaceId: string;
  generatedAt: string;
  stats: {
    sdkDownloads: number;
    activeSdkClients: number;
    apiRequestsToday: number;
    sdkVersion: string;
    availability: number;
    averageLatencyMs: number | null;
    errorRate: number;
    rateLimited: number;
  };
  versions: SdkVersionView[];
  methods: SdkMethodView[];
  releases: SdkReleaseView[];
  metrics: {
    requestSeries: Array<{ day: string; requests: number }>;
    latencySeries: Array<{ day: string; avgLatencyMs: number | null }>;
  };
};

const SDK_PACKAGES = [
  {
    packageName: "@epochtm/sdk",
    packagePath: "packages/epoch-sdk/package.json",
    surface: "TypeScript SDK",
  },
  {
    packageName: "@epochtm/api",
    packagePath: "packages/epoch-api/package.json",
    surface: "HTTP API",
  },
  {
    packageName: "@epochtm/mcp",
    packagePath: "packages/epoch-mcp/package.json",
    surface: "MCP Adapter",
  },
] as const;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function categorizeMethod(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("mission")) return "Mission";
  if (lower.includes("verify") || lower.includes("verification")) return "Verification";
  if (lower.includes("memory") || lower.includes("search")) return "Memory";
  if (lower.includes("certificate")) return "Certificate";
  if (lower.includes("policy") || lower.includes("authority") || lower.includes("approval")) return "Governance";
  if (lower.includes("webhook") || lower.includes("integration")) return "Integration";
  if (lower.includes("sdk") || lower.includes("api")) return "Developer";
  return "Core";
}

function normalizeMethod(event: {
  method: string;
  route: string;
  payload: unknown;
}): string | null {
  const payload = toRecord(event.payload);
  const candidates = [
    payload.method,
    payload.tool,
    payload.action,
    payload.name,
    payload.operation,
    payload.eventType,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  const route = event.route.toLowerCase();
  if (route.includes("/missions") && event.method === "POST") return "createMission";
  if (route.includes("/missions") && event.method === "GET") return "listMissions";
  if (route.includes("/verify")) return "verifyMission";
  if (route.includes("/memory-records")) return "searchMemory";
  if (route.includes("/certificate")) return "getCertificate";
  if (route.includes("/developer/runtime-api-keys")) return "createRuntimeApiKey";
  if (route.includes("/developer/webhooks")) return "listWebhooks";
  if (route.includes("/developer/mcp")) return "listMcpConnections";
  if (route.includes("/api-keys")) return "manageApiKeys";
  return null;
}

function methodCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("create")) return "Creation";
  if (lower.includes("list") || lower.includes("get")) return "Read";
  if (lower.includes("verify") || lower.includes("check")) return "Verification";
  if (lower.includes("search")) return "Search";
  if (lower.includes("connect") || lower.includes("webhook")) return "Integration";
  return categorizeMethod(name);
}

async function readPackageVersion(packagePath: string): Promise<{ version: string; description: string; publishedAt: string }> {
  const fullPath = path.resolve(process.cwd(), packagePath);
  const [raw, stats] = await Promise.all([readFile(fullPath, "utf8"), stat(fullPath)]);
  const manifest = JSON.parse(raw) as { version?: string; description?: string };
  return {
    version: manifest.version ?? "0.0.0",
    description: manifest.description ?? "",
    publishedAt: stats.mtime.toISOString(),
  };
}

function buildDailySeries(events: Array<{ createdAt: Date; latencyMs: number | null }>, days = 7): {
  requestSeries: Array<{ day: string; requests: number }>;
  latencySeries: Array<{ day: string; avgLatencyMs: number | null }>;
} {
  const requestBuckets = new Map<string, number>();
  const latencyBuckets = new Map<string, { total: number; count: number }>();
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = dayKey(day);
    requestBuckets.set(key, 0);
    latencyBuckets.set(key, { total: 0, count: 0 });
  }

  for (const event of events) {
    const key = dayKey(event.createdAt);
    if (!requestBuckets.has(key)) continue;
    requestBuckets.set(key, (requestBuckets.get(key) ?? 0) + 1);
    if (typeof event.latencyMs === "number" && Number.isFinite(event.latencyMs)) {
      const bucket = latencyBuckets.get(key);
      if (bucket) {
        bucket.total += event.latencyMs;
        bucket.count += 1;
      }
    }
  }

  return {
    requestSeries: [...requestBuckets.entries()].map(([day, requests]) => ({ day, requests })),
    latencySeries: [...latencyBuckets.entries()].map(([day, bucket]) => ({
      day,
      avgLatencyMs: bucket.count > 0 ? Math.round(bucket.total / bucket.count) : null,
    })),
  };
}

function buildMethodViews(events: Array<{
  createdAt: Date;
  method: string;
  route: string;
  status: string;
  statusCode: number | null;
  latencyMs: number | null;
  payload: unknown;
}>) {
  const byMethod = new Map<
    string,
    { callsToday: number; successCount: number; errorCount: number; totalLatency: number; latencyCount: number; lastUsedAt: string | null }
  >();

  for (const event of events) {
    const method = normalizeMethod(event);
    if (!method) continue;
    const current = byMethod.get(method) ?? {
      callsToday: 0,
      successCount: 0,
      errorCount: 0,
      totalLatency: 0,
      latencyCount: 0,
      lastUsedAt: null,
    };
    current.callsToday += 1;
    const success =
      event.status.toLowerCase().includes("success") ||
      event.status.toLowerCase().includes("ok") ||
      event.statusCode === null ||
      event.statusCode < 400;
    if (success) current.successCount += 1;
    else current.errorCount += 1;
    if (typeof event.latencyMs === "number" && Number.isFinite(event.latencyMs)) {
      current.totalLatency += event.latencyMs;
      current.latencyCount += 1;
    }
    const createdAt = event.createdAt.toISOString();
    current.lastUsedAt = current.lastUsedAt && current.lastUsedAt > createdAt ? current.lastUsedAt : createdAt;
    byMethod.set(method, current);
  }

  return [...byMethod.entries()]
    .map(([name, value]) => ({
      name,
      callsToday: value.callsToday,
      successCount: value.successCount,
      errorCount: value.errorCount,
      successRate: value.callsToday > 0 ? Math.round((value.successCount / value.callsToday) * 1000) / 10 : 0,
      averageLatencyMs: value.latencyCount > 0 ? Math.round(value.totalLatency / value.latencyCount) : null,
      lastUsedAt: value.lastUsedAt,
      category: methodCategory(name),
    }))
    .sort((a, b) => b.callsToday - a.callsToday || a.name.localeCompare(b.name))
    .slice(0, 8);
}

export async function buildSdkWorkspaceSnapshot(workspaceId: string): Promise<SdkStatsResponse> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [events, activeKeys, activeTokens, versions] = await Promise.all([
    prisma.agentAccessEvent.findMany({
      where: { workspaceId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        createdAt: true,
        method: true,
        route: true,
        status: true,
        statusCode: true,
        latencyMs: true,
        payload: true,
      },
    }),
    prisma.agentAccessKey.count({ where: { workspaceId, status: "active" } }),
    prisma.agentToken.count({ where: { workspaceId, status: "active" } }),
    Promise.all(SDK_PACKAGES.map(async (entry) => ({ entry, ...(await readPackageVersion(entry.packagePath)) }))),
  ]);

  const totalRequests = events.length;
  const successfulRequests = events.filter((event) => {
    const status = event.status.toLowerCase();
    return status.includes("success") || status.includes("ok") || event.statusCode === null || event.statusCode < 400;
  }).length;
  const failedRequests = totalRequests - successfulRequests;
  const avgLatency =
    events.filter((event) => typeof event.latencyMs === "number" && Number.isFinite(event.latencyMs)).length > 0
      ? Math.round(
          events
            .filter((event) => typeof event.latencyMs === "number" && Number.isFinite(event.latencyMs))
            .reduce((sum, event) => sum + (event.latencyMs ?? 0), 0) /
            events.filter((event) => typeof event.latencyMs === "number" && Number.isFinite(event.latencyMs)).length,
        )
      : null;

  const methodViews = buildMethodViews(events);
  const { requestSeries, latencySeries } = buildDailySeries(events);

  return {
    workspaceId,
    generatedAt: new Date().toISOString(),
    stats: {
      sdkDownloads: activeTokens,
      activeSdkClients: activeKeys + activeTokens,
      apiRequestsToday: totalRequests,
      sdkVersion: versions[0]?.version ?? "0.0.0",
      availability: totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 1000) / 10 : 100,
      averageLatencyMs: avgLatency,
      errorRate: totalRequests > 0 ? Math.round((failedRequests / totalRequests) * 1000) / 10 : 0,
      rateLimited: events.filter((event) => event.statusCode === 429).length,
    },
    versions: versions.map(({ entry, version, description, publishedAt }) => ({
      packageName: entry.packageName,
      description,
      version,
      status: entry.packageName === "@epochtm/sdk" ? "stable" : "published",
      surface: entry.surface,
      publishedAt,
      packagePath: entry.packagePath,
    })),
    methods: methodViews,
    releases: versions.map(({ entry, version, description, publishedAt }) => ({
      packageName: entry.packageName,
      version,
      status: "published",
      publishedAt,
      channel: "latest",
      notes: description,
      surface: entry.surface,
    })),
    metrics: {
      requestSeries,
      latencySeries,
    },
  };
}
