import { prisma } from "../../storage/prismaClient";
import { toProjectV1, type ProjectRecordInput } from "./controlPlane";
import type { ProjectV1 } from "./contracts";

export class ProjectBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectBoundaryError";
  }
}

export type ProjectScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

function correlation(scope: ProjectScope) {
  return { correlationId: scope.correlationId, traceId: scope.traceId };
}

async function resolveOrganization(scope: ProjectScope): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: scope.workspaceId,
      userId: scope.userId,
      ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}),
    },
    select: { orgId: true },
  });
  if (!workspace) throw new ProjectBoundaryError("Workspace not found");
  const organizationId = workspace.orgId ?? scope.orgId;
  if (!organizationId) throw new ProjectBoundaryError("Workspace has no organization boundary");
  return organizationId;
}

function scopedWhere(scope: ProjectScope, organizationId: string) {
  return {
    workspaceId: scope.workspaceId,
    orgId: organizationId,
  };
}

function toContract(project: ProjectRecordInput, scope: ProjectScope): ProjectV1 {
  return toProjectV1({ ...project, status: project.status as ProjectV1["status"], correlation: correlation(scope) });
}

export async function listEpochV13Projects(scope: ProjectScope) {
  const organizationId = await resolveOrganization(scope);
  const projects = await prisma.epochProject.findMany({
    where: scopedWhere(scope, organizationId),
    orderBy: { updatedAt: "desc" },
  });
  return projects.map((project) => toContract(project, scope));
}

export async function createEpochV13Project(
  scope: ProjectScope,
  input: { name: string; status?: ProjectV1["status"]; metadata?: Record<string, unknown> },
) {
  const organizationId = await resolveOrganization(scope);
  try {
    const project = await prisma.epochProject.create({
      data: {
        workspaceId: scope.workspaceId,
        orgId: organizationId,
        name: input.name,
        status: input.status ?? "active",
        metadata: input.metadata ?? {},
      } as any,
    });
    return toContract(project, scope);
  } catch (error) {
    if (error instanceof Error && error.message.includes("uq_epoch_projects_workspace_name")) {
      throw new ProjectBoundaryError("A project with this name already exists in the workspace");
    }
    throw error;
  }
}

export async function updateEpochV13Project(
  scope: ProjectScope,
  projectId: string,
  input: { name?: string; status?: ProjectV1["status"]; metadata?: Record<string, unknown> },
) {
  const organizationId = await resolveOrganization(scope);
  const current = await prisma.epochProject.findFirst({
    where: { id: projectId, ...scopedWhere(scope, organizationId) },
  });
  if (!current) return null;
  const project = await prisma.epochProject.update({
    where: { id: current.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    } as any,
  });
  return toContract(project, scope);
}

export async function getEpochV13Project(scope: ProjectScope, projectId: string) {
  const organizationId = await resolveOrganization(scope);
  const project = await prisma.epochProject.findFirst({
    where: { id: projectId, ...scopedWhere(scope, organizationId) },
  });
  return project ? toContract(project, scope) : null;
}
