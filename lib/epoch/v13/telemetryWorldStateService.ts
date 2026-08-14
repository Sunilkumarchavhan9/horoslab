import { createHash } from "node:crypto";
import { prisma } from "../../storage/prismaClient";
import { toWorldStateV1 } from "./controlPlane";
import { resolveSoftwareWorldStateScope, WorldStateBoundaryError, type WorldStateScope } from "./softwareWorldStateService";

type TelemetryInput = {
  projectId: string;
  environmentId: string;
  logsUrlEnvVar?: string;
  metricsUrlEnvVar?: string;
  tracesUrlEnvVar?: string;
  ciUrlEnvVar?: string;
};

type SourceKind = "logs" | "metrics" | "traces" | "cicd";
type SourceConfig = { kind: SourceKind; envVar?: string };

const sourceConfigs: Array<[keyof TelemetryInput, SourceKind]> = [
  ["logsUrlEnvVar", "logs"],
  ["metricsUrlEnvVar", "metrics"],
  ["tracesUrlEnvVar", "traces"],
  ["ciUrlEnvVar", "cicd"],
];

function validateUrl(kind: SourceKind, envVar: string) {
  const prefix = kind === "cicd" ? "EPOCH_V13_CI_URL_" : `EPOCH_V13_${kind.toUpperCase()}_URL_`;
  if (!envVar.startsWith(prefix)) throw new WorldStateBoundaryError(`${kind} source must use an ${prefix}* environment variable`);
  const raw = process.env[envVar]?.trim();
  if (!raw) throw new WorldStateBoundaryError(`${kind} source variable ${envVar} is not configured`);
  let url: URL;
  try { url = new URL(raw); } catch { throw new WorldStateBoundaryError(`${kind} source URL is invalid`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new WorldStateBoundaryError(`${kind} source URL must be an HTTP(S) URL without credentials`);
  }
  return url;
}

async function probe(kind: SourceKind, envVar: string) {
  const url = validateUrl(kind, envVar);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "error",
      headers: { accept: "application/json, text/plain;q=0.5" },
      signal: controller.signal,
    });
    const body = await response.arrayBuffer();
    const bytes = Buffer.from(body);
    return {
      kind,
      url: url.origin + url.pathname,
      reachable: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      contentLength: bytes.byteLength,
      bodySha256: createHash("sha256").update(bytes).digest("hex"),
      capturedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      kind,
      url: url.origin + url.pathname,
      reachable: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.name : "probe_failed",
      capturedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverEpochTelemetryWorldState(scope: WorldStateScope, input: TelemetryInput) {
  await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId);
  const sources: SourceConfig[] = sourceConfigs.flatMap(([key, kind]) => input[key] ? [{ kind, envVar: input[key] }] : []);
  const observations = await Promise.all(sources.map((source) => probe(source.kind, source.envVar!)));
  const observedAt = new Date();
  const snapshot = { adapter: "telemetry", observations, capturedAt: observedAt.toISOString() };
  const source = await prisma.epochIntegrationConnection.findFirst({
    where: { workspaceId: scope.workspaceId, environmentId: input.environmentId, provider: { in: ["logs", "metrics", "traces", "cicd", "github"] }, status: { in: ["connected", "syncing", "error"] } },
    select: { id: true },
  });
  const latest = await prisma.epochWorldState.findFirst({
    where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const record = await prisma.epochWorldState.create({
    data: {
      workspaceId: scope.workspaceId,
      projectId: input.projectId,
      environmentId: input.environmentId,
      version: (latest?.version ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      sourceIds: source ? [source.id] : [],
      freshness: "fresh",
      correlationId: scope.correlationId,
      traceId: scope.traceId,
      observedAt,
    },
  });
  return toWorldStateV1({
    id: record.id,
    workspaceId: record.workspaceId,
    environment: "software",
    version: record.version,
    snapshot,
    sourceIds: source ? [source.id] : [],
    freshness: "fresh",
    observedAt: record.observedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    correlation: { correlationId: scope.correlationId, traceId: scope.traceId },
  });
}
