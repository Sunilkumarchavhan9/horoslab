import { prisma } from "../../storage/prismaClient";
import {
  toConnectionV1,
  toEnvironmentV1,
  toMissionControlStateV1,
  toOrganizationV1,
  toProjectV1,
} from "./controlPlane";
import type { ConnectionV1, EnvironmentV1 } from "./contracts";

export class ControlPlaneBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ControlPlaneBoundaryError";
  }
}

type ControlPlaneRequest = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function connectionStatus(value: string): ConnectionV1["status"] {
  if (value === "connected") return "connected";
  if (value === "paused") return "paused";
  if (value === "error" || value === "failed") return "error";
  return "disconnected";
}

function environmentStatus(value: string): EnvironmentV1["status"] {
  if (value === "connected") return "connected";
  if (value === "degraded") return "degraded";
  if (value === "disconnected") return "disconnected";
  return "unknown";
}

export async function buildEpochV13ControlPlane(input: ControlPlaneRequest) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: input.workspaceId,
      userId: input.userId,
      ...(input.orgId ? { OR: [{ orgId: input.orgId }, { orgId: null }] } : {}),
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!workspace) {
    throw new ControlPlaneBoundaryError("Workspace not found");
  }

  const organizationId = workspace.orgId ?? input.orgId;
  if (!organizationId) {
    throw new ControlPlaneBoundaryError(
      "Workspace has no organization boundary; associate it with an organization before using the V13 control plane",
    );
  }

  const [projects, environments, connections, activeMissionCount, runningExecutionCount, pendingApprovalCount, workerCount, evidenceCount, verificationCount] = await Promise.all([
    prisma.epochProject.findMany({
      where: { workspaceId: workspace.id, orgId: organizationId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.epochEnvironment.findMany({
      where: { workspaceId: workspace.id, OR: [{ orgId: organizationId }, { orgId: null }], projectId: { not: null } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.epochIntegrationConnection.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [{ orgId: organizationId }, { orgId: null }],
        environmentId: { not: null },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.epochMission.count({
      where: { workspaceId: workspace.id, state: { notIn: ["completed", "failed", "cancelled"] } },
    }),
    prisma.epochExecutionRun.count({
      where: { workspaceId: workspace.id, status: { in: ["running", "leased", "executing"] } },
    }),
    prisma.epochAuthorityPolicy.count({
      where: { workspaceId: workspace.id, status: "active", needsApproval: true },
    }),
    prisma.epochWorker.count({ where: { workspaceId: workspace.id, retiredAt: null } }),
    prisma.epochEvidence.count({ where: { workspaceId: workspace.id } }),
    prisma.epochVerificationRun.count({ where: { workspaceId: workspace.id } }),
  ]);

  const correlation = { correlationId: input.correlationId, traceId: input.traceId };
  const project = projects[0]
    ? toProjectV1({
        id: projects[0].id,
        orgId: projects[0].orgId,
        workspaceId: projects[0].workspaceId,
        name: projects[0].name,
        status: projects[0].status as "active" | "archived",
        createdAt: projects[0].createdAt,
        updatedAt: projects[0].updatedAt,
        correlation,
      })
    : null;
  const organization = toOrganizationV1({
    id: organizationId,
    orgId: organizationId,
    name: workspace.name,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    correlation,
  });
  const environmentRecords = environments.map((environment) =>
    toEnvironmentV1({
      id: environment.id,
      projectId: environment.projectId as string,
      kind: environment.kind as EnvironmentV1["kind"],
      name: environment.name,
      status: environmentStatus(environment.status),
      ...(environment.region ? { region: environment.region } : {}),
      createdAt: environment.createdAt,
      updatedAt: environment.updatedAt,
      correlation,
    }),
  );
  const connectionRecords = connections.map((connection) => {
    const config = connection.config;
    const proof = connection.proof;
    return toConnectionV1({
      id: connection.id,
      environmentId: connection.environmentId as string,
      provider: connection.provider,
      status: connectionStatus(connection.status),
      scopes: stringArray(typeof config === "object" && config !== null ? (config as { scopes?: unknown }).scopes : undefined),
      capabilities: stringArray(typeof proof === "object" && proof !== null ? (proof as { capabilities?: unknown }).capabilities : undefined),
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      correlation,
    });
  });
  const missionControl = toMissionControlStateV1({
    id: `mission-control:${workspace.id}`,
    ...(project ? { projectId: project.id } : {}),
    environmentIds: environmentRecords.map((environment) => environment.id),
    activeMissionCount,
    runningExecutionCount,
    pendingApprovalCount,
    workerCount,
    evidenceCount,
    verificationCount,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    correlation,
  });

  const unboundConnectionCount = await prisma.epochIntegrationConnection.count({
    where: {
      workspaceId: workspace.id,
      OR: [{ orgId: organizationId }, { orgId: null }],
      environmentId: null,
    },
  });

  return {
    contractVersion: "epoch.runtime.v13" as const,
    organization,
    project,
    projects: projects.map((record) =>
      toProjectV1({
        id: record.id,
        orgId: record.orgId,
        workspaceId: record.workspaceId,
        name: record.name,
        status: record.status as "active" | "archived",
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        correlation,
      }),
    ),
    environments: environmentRecords,
    connections: connectionRecords,
    unboundConnectionCount,
    missionControl,
  };
}
