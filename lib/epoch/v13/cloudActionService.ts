import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "../../storage/prismaClient";
import { emitEpochRuntimeEvent } from "../epochEvents";
import { toWorldStateV1 } from "./controlPlane";
import { resolveSoftwareWorldStateScope, WorldStateBoundaryError, type WorldStateScope } from "./softwareWorldStateService";

export class CloudActionBoundaryError extends Error {
  constructor(public readonly code: "policy_denied" | "approval_required" | "configuration" | "execution", message: string) {
    super(message);
    this.name = "CloudActionBoundaryError";
  }
}

type CloudActionInput = {
  projectId: string;
  environmentId: string;
  provider: "aws" | "azure" | "gcp" | "digitalocean" | "custom";
  policyId: string;
  endpointEnvVar: string;
  tokenEnvVar?: string;
  resourceType: "cloud" | "compute" | "containers" | "databases" | "queues" | "deployments";
  action: "read" | "simulate" | "stage" | "execute" | "rollback";
  method: "GET" | "POST" | "PUT" | "DELETE";
  dryRun: boolean;
  approvalToken?: string;
  idempotencyKey: string;
  body?: Record<string, unknown>;
};

function configuredUrl(envVar: string): URL {
  if (!/^EPOCH_V13_CLOUD_URL_[A-Z0-9_]+$/.test(envVar)) {
    throw new CloudActionBoundaryError("configuration", "Cloud endpoint must use an EPOCH_V13_CLOUD_URL_* environment variable");
  }
  const raw = process.env[envVar]?.trim();
  if (!raw) throw new CloudActionBoundaryError("configuration", `Cloud endpoint variable ${envVar} is not configured`);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CloudActionBoundaryError("configuration", "Cloud endpoint URL is invalid");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new CloudActionBoundaryError("configuration", "Cloud endpoint must be an HTTP(S) URL without credentials");
  }
  return url;
}

function authHeaders(tokenEnvVar?: string): Record<string, string> {
  if (!tokenEnvVar) return {};
  if (!/^EPOCH_V13_CLOUD_TOKEN_[A-Z0-9_]+$/.test(tokenEnvVar)) {
    throw new CloudActionBoundaryError("configuration", "Cloud token must use an EPOCH_V13_CLOUD_TOKEN_* environment variable");
  }
  const token = process.env[tokenEnvVar]?.trim();
  if (!token) throw new CloudActionBoundaryError("configuration", `Cloud token variable ${tokenEnvVar} is not configured`);
  return { authorization: `Bearer ${token}` };
}

function hasApprovalToken(provided: string | undefined): boolean {
  const expected = process.env.EPOCH_V13_CLOUD_APPROVAL_SECRET?.trim();
  if (!expected || !provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}

function allowedPermission(input: CloudActionInput): string[] {
  return [
    "cloud.action",
    `cloud:${input.resourceType}`,
    `cloud:${input.action}`,
    `cloud:${input.resourceType}:${input.action}`,
  ];
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function executeEpochCloudAction(scope: WorldStateScope, input: CloudActionInput) {
  const { organizationId } = await resolveSoftwareWorldStateScope(scope, input.projectId, input.environmentId, "cloud");
  const policy = await prisma.epochAuthorityPolicy.findFirst({
    where: {
      id: input.policyId,
      workspaceId: scope.workspaceId,
      status: "active",
      OR: [{ orgId: organizationId }, { orgId: null }],
    },
    select: { id: true, name: true, canExecute: true, needsApproval: true, blocked: true, permissions: true },
  });
  if (!policy) throw new CloudActionBoundaryError("policy_denied", "Active cloud action policy was not found in this organization");

  const permissions = Array.isArray(policy.permissions) ? policy.permissions.filter((value): value is string => typeof value === "string") : [];
  const mutating = input.action !== "read" && input.action !== "simulate";
  const permissionGranted = allowedPermission(input).some((permission) => permissions.includes(permission));
  const decision = policy.blocked || !policy.canExecute || !permissionGranted ? "deny" : mutating && policy.needsApproval ? "approval" : "allow";
  if (decision === "deny") {
    throw new CloudActionBoundaryError("policy_denied", `Cloud action denied by policy ${policy.name}`);
  }
  if (input.action === "simulate" && (input.method !== "GET" || !input.dryRun)) {
    throw new CloudActionBoundaryError("configuration", "Simulation actions must be read-only GET requests with dryRun enabled");
  }
  if (mutating && input.dryRun) {
    throw new CloudActionBoundaryError("configuration", "Mutating cloud actions must set dryRun to false");
  }
  if (decision === "approval" && !hasApprovalToken(input.approvalToken)) {
    throw new CloudActionBoundaryError("approval_required", "This cloud action requires an approved EPOCH_V13_CLOUD_APPROVAL_SECRET");
  }

  const endpoint = configuredUrl(input.endpointEnvVar);
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  let responseBytes = 0;
  let responseSha256: string | null = null;
  try {
    response = await fetch(endpoint, {
      method: input.method,
      redirect: "error",
      headers: { accept: "application/json", ...authHeaders(input.tokenEnvVar), ...(input.body ? { "content-type": "application/json" } : {}), "idempotency-key": input.idempotencyKey },
      body: input.body ? JSON.stringify(input.body) : undefined,
      signal: controller.signal,
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    responseBytes = bytes.byteLength;
    responseSha256 = createHash("sha256").update(bytes).digest("hex");
  } catch (error) {
    throw new CloudActionBoundaryError("execution", error instanceof Error ? `Cloud action request failed: ${error.message}` : "Cloud action request failed");
  } finally {
    clearTimeout(timeout);
  }

  const observedAt = new Date();
  const result = {
    adapter: "cloud_action",
    provider: input.provider,
    resourceType: input.resourceType,
    action: input.action,
    method: input.method,
    endpoint: endpoint.origin + endpoint.pathname,
    policyId: policy.id,
    policyDecision: decision,
    dryRun: input.dryRun,
    response: { ok: response.ok, status: response.status, latencyMs: Date.now() - startedAt, responseBytes, responseSha256 },
    idempotencyKey: input.idempotencyKey,
    observedAt: observedAt.toISOString(),
  };
  const latest = await prisma.epochWorldState.findFirst({ where: { workspaceId: scope.workspaceId, projectId: input.projectId, environmentId: input.environmentId }, orderBy: { version: "desc" }, select: { version: true } });
  const record = await prisma.epochWorldState.create({
    data: {
      workspaceId: scope.workspaceId,
      projectId: input.projectId,
      environmentId: input.environmentId,
      version: (latest?.version ?? 0) + 1,
      snapshot: JSON.parse(JSON.stringify(result)),
      sourceIds: [],
      freshness: "fresh",
      correlationId: scope.correlationId,
      traceId: scope.traceId,
      observedAt,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: scope.userId,
      orgId: scope.orgId,
      workspaceId: scope.workspaceId,
      actorType: "user",
      actorId: scope.userId,
      action: `epoch.cloud_action.${input.action}`,
      resourceType: "cloud_action",
      resourceId: record.id,
      status: response.ok ? "success" : "failed",
      riskLevel: mutating ? "high" : "low",
      requestId: scope.correlationId,
      metadata: JSON.parse(JSON.stringify({ provider: input.provider, resourceType: input.resourceType, policyId: policy.id, responseStatus: response.status, responseSha256 })),
    },
  });
  emitEpochRuntimeEvent({ userId: scope.userId, orgId: scope.orgId, workspaceId: scope.workspaceId, kind: "epoch.cloud.action", label: "Cloud action completed", subjectId: record.id, correlationId: scope.correlationId, traceId: scope.traceId, payload: { provider: input.provider, resourceType: input.resourceType, action: input.action, policyId: policy.id, status: response.status, responseSha256 } });
  return toWorldStateV1({ id: record.id, workspaceId: record.workspaceId, environment: "cloud", version: record.version, snapshot: result, sourceIds: [], freshness: "fresh", observedAt: record.observedAt, createdAt: record.createdAt, updatedAt: record.updatedAt, correlation: { correlationId: scope.correlationId, traceId: scope.traceId } });
}
