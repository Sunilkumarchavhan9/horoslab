import { createHash } from "node:crypto";
import { prisma } from "../../storage/prismaClient";
import { toWorldStateV1 } from "./controlPlane";
import { resolveSoftwareWorldStateScope, WorldStateBoundaryError, type WorldStateScope } from "./softwareWorldStateService";

type ResourceType = "cloud" | "compute" | "containers" | "databases" | "queues" | "deployments";
type CloudInput = {
  projectId: string;
  environmentId: string;
  provider: "aws" | "azure" | "gcp" | "digitalocean" | "custom";
  endpointEnvVar: string;
  tokenEnvVar?: string;
  resourceUrlEnvVars?: Partial<Record<Exclude<ResourceType, "cloud">, string>>;
};

function configuredUrl(envVar: string) {
  if (!/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/.test(envVar)) throw new WorldStateBoundaryError("Cloud endpoint must use an EPOCH_V13_CLOUD_URL_* environment variable");
  const raw = process.env[envVar]?.trim();
  if (!raw) throw new WorldStateBoundaryError(`Cloud endpoint variable ${envVar} is not configured`);
  let url: URL;
  try { url = new URL(raw); } catch { throw new WorldStateBoundaryError("Cloud endpoint URL is invalid"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new WorldStateBoundaryError("Cloud endpoint must be an HTTP(S) URL without credentials");
  return url;
}

function tokenHeader(tokenEnvVar?: string) {
  if (!tokenEnvVar) return {} as Record<string, string>;
  if (!/^EPOCH_V13_CLOUD_TOKEN_[A-Z0-9_]+$/.test(tokenEnvVar)) throw new WorldStateBoundaryError("Cloud token must use an EPOCH_V13_CLOUD_TOKEN_* environment variable");
  const token = process.env[tokenEnvVar]?.trim();
  if (!token) throw new WorldStateBoundaryError(`Cloud token variable ${tokenEnvVar} is not configured`);
  return { authorization: `Bearer ${token}` };
}

async function probe(resourceType: ResourceType, envVar: string, tokenEnvVar?: string) {
  const url = configuredUrl(envVar);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { method: "GET", redirect: "error", headers: { accept: "application/json", ...tokenHeader(tokenEnvVar) }, signal: controller.signal });
    const bytes = Buffer.from(await response.arrayBuffer());
    return { resourceType, endpoint: url.origin + url.pathname, reachable: response.ok, status: response.status, latencyMs: Date.now() - startedAt, responseBytes: bytes.byteLength, responseSha256: createHash("sha256").update(bytes).digest("hex"), capturedAt: new Date().toISOString() };
  } catch (error) {
    return { resourceType, endpoint: url.origin + url.pathname, reachable: false, status: null, latencyMs: Date.now() - startedAt, error: error instanceof Error ? error.name : "cloud_probe_failed", capturedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverEpochCloudWorldState(scope: WorldStateScope, input: CloudInput) {
  await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId, "cloud");
  const sources: Array<{ resourceType: ResourceType; envVar: string }> = [{ resourceType: "cloud", envVar: input.endpointEnvVar }];
  for (const [resourceType, envVar] of Object.entries(input.resourceUrlEnvVars ?? {})) {
    if (envVar) sources.push({ resourceType: resourceType as Exclude<ResourceType, "cloud">, envVar });
  }
  const resources = await Promise.all(sources.map((source) => probe(source.resourceType, source.envVar, input.tokenEnvVar)));
  const observedAt = new Date();
  const snapshot = { adapter: "cloud", provider: input.provider, resources, capturedAt: observedAt.toISOString() };
  const source = await prisma.epochIntegrationConnection.findFirst({ where: { workspaceId: scope.workspaceId, environmentId: input.environmentId, provider: { in: [input.provider, "cloud"] }, status: { in: ["connected", "syncing", "error"] } }, select: { id: true } });
  const latest = await prisma.epochWorldState.findFirst({ where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId }, orderBy: { version: "desc" }, select: { version: true } });
  const record = await prisma.epochWorldState.create({ data: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId, version: (latest?.version ?? 0) + 1, snapshot: JSON.parse(JSON.stringify(snapshot)), sourceIds: source ? [source.id] : [], freshness: "fresh", correlationId: scope.correlationId, traceId: scope.traceId, observedAt } });
  return toWorldStateV1({ id: record.id, workspaceId: record.workspaceId, environment: "cloud", version: record.version, snapshot, sourceIds: source ? [source.id] : [], freshness: "fresh", observedAt: record.observedAt, createdAt: record.createdAt, updatedAt: record.updatedAt, correlation: { correlationId: scope.correlationId, traceId: scope.traceId } });
}
