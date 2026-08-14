import { prisma } from "../../storage/prismaClient";
import { toEnvironmentV1 } from "./controlPlane";
import type { EnvironmentV1 } from "./contracts";

export class EnvironmentBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentBoundaryError";
  }
}

export type EnvironmentScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

function environmentStatus(value: string): EnvironmentV1["status"] {
  if (value === "connected") return "connected";
  if (value === "degraded") return "degraded";
  if (value === "disconnected") return "disconnected";
  return "unknown";
}

function correlation(scope: EnvironmentScope) {
  return { correlationId: scope.correlationId, traceId: scope.traceId };
}

function toContract(environment: {
  id: string;
  workspaceId: string;
  projectId: string | null;
  kind: string;
  name: string;
  status: string;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
}, scope: EnvironmentScope): EnvironmentV1 {
  return toEnvironmentV1({
    id: environment.id,
    projectId: environment.projectId ?? "",
    kind: environment.kind as EnvironmentV1["kind"],
    name: environment.name,
    status: environmentStatus(environment.status),
    ...(environment.region ? { region: environment.region } : {}),
    createdAt: environment.createdAt,
    updatedAt: environment.updatedAt,
    correlation: correlation(scope),
  });
}

async function resolveOrganization(scope: EnvironmentScope): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: scope.workspaceId,
      userId: scope.userId,
      ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}),
    },
    select: { orgId: true },
  });
  if (!workspace) {
    const institution = await prisma.epochInstitution.findFirst({
      where: {
        workspaceId: scope.workspaceId,
        userId: scope.userId,
        ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}),
      },
      select: { orgId: true },
    });
    if (!institution) throw new EnvironmentBoundaryError("Workspace not found");
    const organizationId = institution.orgId ?? scope.orgId;
    if (!organizationId) throw new EnvironmentBoundaryError("Workspace has no organization boundary");
    return organizationId;
  }
  const organizationId = workspace.orgId ?? scope.orgId;
  if (!organizationId) throw new EnvironmentBoundaryError("Workspace has no organization boundary");
  return organizationId;
}

function scopedWhere(scope: EnvironmentScope, organizationId: string) {
  return {
    workspaceId: scope.workspaceId,
    OR: [{ orgId: organizationId }, { orgId: null }],
  };
}

async function assertProject(scope: EnvironmentScope, organizationId: string, projectId: string) {
  const project = await prisma.epochProject.findFirst({
    where: { id: projectId, workspaceId: scope.workspaceId, orgId: organizationId },
    select: { id: true },
  });
  if (!project) throw new EnvironmentBoundaryError("Project not found in workspace organization boundary");
}

export async function listEpochV13Environments(scope: EnvironmentScope) {
  const organizationId = await resolveOrganization(scope);
  const environments = await prisma.epochEnvironment.findMany({
    where: { ...scopedWhere(scope, organizationId), projectId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  return environments.map((environment) => toContract(environment, scope));
}

export async function createEpochV13Environment(
  scope: EnvironmentScope,
  input: {
    projectId: string;
    kind: EnvironmentV1["kind"];
    name: string;
    status?: EnvironmentV1["status"];
    region?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const organizationId = await resolveOrganization(scope);
  await assertProject(scope, organizationId, input.projectId);
  const environment = await prisma.epochEnvironment.create({
    data: {
      workspaceId: scope.workspaceId,
      projectId: input.projectId,
      orgId: organizationId,
      kind: input.kind,
      name: input.name,
      status: input.status ?? "unknown",
      region: input.region,
      metadata: input.metadata ?? {},
    } as any,
  });
  return toContract(environment, scope);
}

export async function updateEpochV13Environment(
  scope: EnvironmentScope,
  environmentId: string,
  input: {
    projectId?: string;
    kind?: EnvironmentV1["kind"];
    name?: string;
    status?: EnvironmentV1["status"];
    region?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const organizationId = await resolveOrganization(scope);
  if (input.projectId !== undefined) await assertProject(scope, organizationId, input.projectId);
  const current = await prisma.epochEnvironment.findFirst({
    where: { id: environmentId, ...scopedWhere(scope, organizationId) },
  });
  if (!current) return null;
  const environment = await prisma.epochEnvironment.update({
    where: { id: current.id },
    data: {
      ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    } as any,
  });
  return toContract(environment, scope);
}

export async function assertEpochV13Environment(
  scope: EnvironmentScope,
  environmentId: string,
) {
  const organizationId = await resolveOrganization(scope);
  return prisma.epochEnvironment.findFirst({
    where: { id: environmentId, ...scopedWhere(scope, organizationId) },
    select: { id: true, projectId: true },
  });
}
