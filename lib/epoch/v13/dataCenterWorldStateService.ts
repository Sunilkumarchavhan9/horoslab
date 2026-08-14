import { createHash } from "node:crypto";
import { prisma } from "../../storage/prismaClient";
import { toWorldStateV1 } from "./controlPlane";
import { createEpochV13Id } from "./ids";
import { resolveSoftwareWorldStateScope, WorldStateBoundaryError, type WorldStateScope } from "./softwareWorldStateService";

type DataCenterResource = "data_center" | "compute" | "storage" | "network" | "power";
type DataCenterInput = {
  projectId: string;
  environmentId: string;
  provider: string;
  endpointEnvVar: string;
  tokenEnvVar?: string;
  resourceUrlEnvVars?: Partial<Record<Exclude<DataCenterResource, "data_center">, string>>;
};

function configuredUrl(envVar: string) {
  if (!/^EPOCH_V13_DATACENTER_URL_[A-Z0-9_]+$/.test(envVar)) throw new WorldStateBoundaryError("Data-center endpoint must use an EPOCH_V13_DATACENTER_URL_* environment variable");
  const raw = process.env[envVar]?.trim();
  if (!raw) throw new WorldStateBoundaryError(`Data-center endpoint variable ${envVar} is not configured`);
  let url: URL;
  try { url = new URL(raw); } catch { throw new WorldStateBoundaryError("Data-center endpoint URL is invalid"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new WorldStateBoundaryError("Data-center endpoint must be an HTTP(S) URL without credentials");
  return url;
}

function tokenHeader(tokenEnvVar?: string): Record<string, string> {
  if (!tokenEnvVar) return {};
  if (!/^EPOCH_V13_DATACENTER_TOKEN_[A-Z0-9_]+$/.test(tokenEnvVar)) throw new WorldStateBoundaryError("Data-center token must use an EPOCH_V13_DATACENTER_TOKEN_* environment variable");
  const token = process.env[tokenEnvVar]?.trim();
  if (!token) throw new WorldStateBoundaryError(`Data-center token variable ${tokenEnvVar} is not configured`);
  return { authorization: `Bearer ${token}` };
}

async function probe(resourceType: DataCenterResource, envVar: string, tokenEnvVar?: string) {
  const url = configuredUrl(envVar);
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { method: "GET", redirect: "error", headers: { accept: "application/json", ...tokenHeader(tokenEnvVar) }, signal: controller.signal });
    const bytes = Buffer.from(await response.arrayBuffer());
    return { resourceType, endpoint: url.origin + url.pathname, reachable: response.ok, status: response.status, latencyMs: Date.now() - startedAt, responseBytes: bytes.byteLength, responseSha256: createHash("sha256").update(bytes).digest("hex"), capturedAt: new Date().toISOString() };
  } catch (error) {
    return { resourceType, endpoint: url.origin + url.pathname, reachable: false, status: null, latencyMs: Date.now() - startedAt, error: error instanceof Error ? error.name : "data_center_probe_failed", capturedAt: new Date().toISOString() };
  } finally { clearTimeout(timeout); }
}

export async function discoverEpochDataCenterWorldState(scope: WorldStateScope, input: DataCenterInput) {
  await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId, "data_center");
  const sources: Array<{ resourceType: DataCenterResource; envVar: string }> = [{ resourceType: "data_center", envVar: input.endpointEnvVar }];
  for (const [resourceType, envVar] of Object.entries(input.resourceUrlEnvVars ?? {})) if (envVar) sources.push({ resourceType: resourceType as Exclude<DataCenterResource, "data_center">, envVar });
  const resources = await Promise.all(sources.map((source) => probe(source.resourceType, source.envVar, input.tokenEnvVar)));
  const observedAt = new Date();
  const snapshot = { adapter: "data_center", provider: input.provider, resources, capturedAt: observedAt.toISOString() };
  const source = await prisma.epochIntegrationConnection.findFirst({ where: { workspaceId: scope.workspaceId, environmentId: input.environmentId, provider: { in: [input.provider, "data_center"] }, status: { in: ["connected", "syncing", "error"] } }, select: { id: true } });
  const latest = await prisma.epochWorldState.findFirst({ where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId }, orderBy: { version: "desc" }, select: { version: true } });
  const version = (latest?.version ?? 0) + 1;
  const record = await prisma.$transaction(async (tx) => {
    const worldState = await tx.epochWorldState.create({ data: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId, version, snapshot, sourceIds: source ? [source.id] : [], freshness: "fresh", correlationId: scope.correlationId, traceId: scope.traceId, observedAt } });
    await tx.epochDataCenterObservation.create({ data: { id: createEpochV13Id(), workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId, provider: input.provider, status: resources.every((resource) => resource.reachable) ? "reachable" : "degraded", snapshot, sourceIds: source ? [source.id] : [], correlationId: scope.correlationId, traceId: scope.traceId, observedAt } });
    return worldState;
  });
  return toWorldStateV1({ id: record.id, workspaceId: record.workspaceId, environment: "data_center", version: record.version, snapshot, sourceIds: source ? [source.id] : [], freshness: "fresh", observedAt: record.observedAt, createdAt: record.createdAt, updatedAt: record.updatedAt, correlation: { correlationId: scope.correlationId, traceId: scope.traceId } });
}

export async function listEpochDataCenterObservations(scope: WorldStateScope, limit = 100) {
  return prisma.epochDataCenterObservation.findMany({ where: { workspaceId: scope.workspaceId }, orderBy: { observedAt: "desc" }, take: Math.min(Math.max(limit, 1), 200) });
}
