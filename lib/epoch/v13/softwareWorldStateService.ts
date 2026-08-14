import { prisma } from "../../storage/prismaClient";
import { listGitHubRepoBranches, listGitHubRepoContents } from "../../integrations/githubRepoBrowser";
import { toWorldStateV1 } from "./controlPlane";
import type { WorldStateV1 } from "./contracts";
import { createHash } from "node:crypto";

export class WorldStateBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorldStateBoundaryError";
  }
}

export type WorldStateScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

function correlation(scope: WorldStateScope) {
  return { correlationId: scope.correlationId, traceId: scope.traceId };
}

async function resolveOrganization(scope: WorldStateScope): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: scope.workspaceId,
      userId: scope.userId,
      ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}),
    },
    select: { orgId: true },
  });
  if (!workspace) throw new WorldStateBoundaryError("Workspace not found");
  const organizationId = workspace.orgId ?? scope.orgId;
  if (!organizationId) throw new WorldStateBoundaryError("Workspace has no organization boundary");
  return organizationId;
}

export async function resolveSoftwareWorldStateScope(scope: WorldStateScope, projectId: string, environmentId: string, requiredKind: "software" | "cloud" | "data_center" = "software") {
  const organizationId = await resolveOrganization(scope);
  const project = await prisma.epochProject.findFirst({
    where: { id: projectId, workspaceId: scope.workspaceId, orgId: organizationId },
    select: { id: true },
  });
  if (!project) throw new WorldStateBoundaryError("Project not found in workspace organization boundary");

  const environment = await prisma.epochEnvironment.findFirst({
    where: {
      id: environmentId,
      workspaceId: scope.workspaceId,
      projectId,
      OR: [{ orgId: organizationId }, { orgId: null }],
    },
    select: { id: true, kind: true },
  });
  if (!environment) throw new WorldStateBoundaryError("Environment not found for project in workspace organization boundary");
  if (environment.kind !== requiredKind) {
    throw new WorldStateBoundaryError(`World State discovery requires a ${requiredKind} environment`);
  }
  return { organizationId, environment };
}

function freshness(observedAt: Date): WorldStateV1["freshness"] {
  return Date.now() - observedAt.getTime() <= 15 * 60 * 1000 ? "fresh" : "stale";
}

function toContract(
  record: {
    id: string;
    workspaceId: string;
    version: number;
    snapshot: unknown;
    sourceIds: unknown;
    freshness: string;
    observedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  },
  scope: WorldStateScope,
  environment: WorldStateV1["environment"],
): WorldStateV1 {
  return toWorldStateV1({
    id: record.id,
    workspaceId: record.workspaceId,
    environment,
    version: record.version,
    snapshot: (record.snapshot && typeof record.snapshot === "object" ? record.snapshot : {}) as Record<string, unknown>,
    sourceIds: Array.isArray(record.sourceIds) ? record.sourceIds.filter((value): value is string => typeof value === "string") : [],
    freshness: record.freshness === "fresh" ? "fresh" : record.freshness === "stale" ? "stale" : "unknown",
    observedAt: record.observedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    correlation: correlation(scope),
  });
}

export async function discoverEpochSoftwareWorldState(
  scope: WorldStateScope,
  input: {
    projectId: string;
    environmentId: string;
    owner: string;
    repo: string;
    ref?: string;
    limit?: number;
  },
) {
  const { environment } = await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId);
  const [branches, contents] = await Promise.all([
    listGitHubRepoBranches({
      userId: scope.userId,
      orgId: scope.orgId,
      owner: input.owner,
      repo: input.repo,
      limit: input.limit,
    }),
    listGitHubRepoContents({
      userId: scope.userId,
      orgId: scope.orgId,
      owner: input.owner,
      repo: input.repo,
      ref: input.ref,
    }),
  ]);
  const observedAt = new Date();
  const source = await prisma.epochIntegrationConnection.findFirst({
    where: {
      workspaceId: scope.workspaceId,
      environmentId: input.environmentId,
      provider: "github",
      status: { in: ["connected", "syncing", "error"] },
    },
    select: { id: true },
  });
  const latest = await prisma.epochWorldState.findFirst({
    where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const snapshot = {
    adapter: "github",
    repository: `${input.owner.trim()}/${input.repo.trim()}`,
    ref: contents.ref,
    defaultBranch: branches.defaultBranch,
    branches: branches.branches,
    root: contents.entries,
    capturedAt: observedAt.toISOString(),
  };
  const record = await prisma.epochWorldState.create({
    data: {
      workspaceId: scope.workspaceId,
      projectId: input.projectId,
      environmentId: input.environmentId,
      version: (latest?.version ?? 0) + 1,
      snapshot,
      sourceIds: source ? [source.id] : [],
      freshness: "fresh",
      correlationId: scope.correlationId,
      traceId: scope.traceId,
      observedAt,
    },
  });
  return toContract(record, scope, "software");
}

export async function getLatestEpochSoftwareWorldState(
  scope: WorldStateScope,
  projectId: string,
  environmentId: string,
) {
  await resolveSoftwareWorldStateScope(scope, projectId, environmentId);
  const record = await prisma.epochWorldState.findFirst({
    where: { workspaceId: scope.workspaceId, projectId, environmentId },
    orderBy: { version: "desc" },
  });
  if (!record) return null;
  return toContract({ ...record, freshness: freshness(record.observedAt) }, scope, "software");
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" ||
    host.endsWith(".localhost") || host.startsWith("10.") || host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

export async function discoverEpochHttpWorldState(
  scope: WorldStateScope,
  input: { projectId: string; environmentId: string; url: string; allowPrivateNetwork?: boolean },
) {
  await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId);
  const target = new URL(input.url);
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new WorldStateBoundaryError("HTTP discovery only supports http and https URLs");
  }
  if (!input.allowPrivateNetwork && isPrivateHost(target.hostname)) {
    throw new WorldStateBoundaryError("Private-network HTTP discovery requires explicit approval");
  }

  const startedAt = Date.now();
  const response = await fetch(target, { method: "GET", redirect: "error", signal: AbortSignal.timeout(10_000) });
  const body = await response.arrayBuffer();
  const observedAt = new Date();
  const headers = Object.fromEntries([...response.headers.entries()].filter(([key]) =>
    ["content-type", "content-length", "etag", "last-modified", "cache-control"].includes(key.toLowerCase()),
  ));
  const snapshot = {
    adapter: "http",
    url: target.toString(),
    method: "GET",
    status: response.status,
    ok: response.ok,
    latencyMs: Date.now() - startedAt,
    headers,
    bodyBytes: body.byteLength,
    bodySha256: createHash("sha256").update(Buffer.from(body)).digest("hex"),
    capturedAt: observedAt.toISOString(),
  };
  const source = await prisma.epochIntegrationConnection.findFirst({
    where: { workspaceId: scope.workspaceId, environmentId: input.environmentId, provider: "http", status: { in: ["connected", "syncing", "error"] } },
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
      snapshot,
      sourceIds: source ? [source.id] : [],
      freshness: "fresh",
      correlationId: scope.correlationId,
      traceId: scope.traceId,
      observedAt,
    },
  });
  return toContract(record, scope, "software");
}
