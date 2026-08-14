import { prisma } from "../../storage/prismaClient";
import { PolicyV1Schema, type PolicyV1 } from "./contracts";

export class GovernanceBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GovernanceBoundaryError";
  }
}

export type GovernanceScope = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
};

function correlation(scope: GovernanceScope) {
  return { correlationId: scope.correlationId, traceId: scope.traceId };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

async function resolveOrganization(scope: GovernanceScope): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: scope.workspaceId,
      userId: scope.userId,
      ...(scope.orgId ? { OR: [{ orgId: scope.orgId }, { orgId: null }] } : {}),
    },
    select: { orgId: true },
  });
  if (!workspace) throw new GovernanceBoundaryError("Workspace not found");
  const organizationId = workspace.orgId ?? scope.orgId;
  if (!organizationId) throw new GovernanceBoundaryError("Workspace has no organization boundary");
  return organizationId;
}

function policyScope(policy: { missionId: string | null }): PolicyV1["scope"] {
  return policy.missionId ? "mission" : "organization";
}

function toPolicyV1(
  policy: {
    id: string;
    workspaceId: string;
    missionId: string | null;
    name: string;
    canExecute: boolean;
    needsApproval: boolean;
    blocked: boolean;
    permissions: unknown;
    checks: unknown;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  },
  scope: GovernanceScope,
): PolicyV1 {
  const decision = policy.blocked ? "deny" : policy.needsApproval ? "approval" : "allow";
  const restrictions = [
    ...asStringArray(policy.checks),
    ...(policy.canExecute ? [] : ["execution_not_granted"]),
  ];
  return PolicyV1Schema.parse({
    contractVersion: "epoch.runtime.v13",
    id: policy.id,
    workspaceId: policy.workspaceId,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
    correlation: correlation(scope),
    name: policy.name,
    scope: policyScope(policy),
    decision,
    permissions: asStringArray(policy.permissions),
    restrictions,
  });
}

export async function listEpochV13Policies(
  scope: GovernanceScope,
  filters: { missionId?: string; institutionId?: string } = {},
) {
  const organizationId = await resolveOrganization(scope);
  const policies = await prisma.epochAuthorityPolicy.findMany({
    where: {
      workspaceId: scope.workspaceId,
      OR: [{ orgId: organizationId }, { orgId: null }],
      ...(filters.missionId ? { missionId: filters.missionId } : {}),
      ...(filters.institutionId ? { institutionId: filters.institutionId } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
  return policies.map((policy) => toPolicyV1(policy, scope));
}

export async function getEpochV13Governance(scope: GovernanceScope) {
  const policies = await listEpochV13Policies(scope);
  return {
    workspaceId: scope.workspaceId,
    organizationId: await resolveOrganization(scope),
    policies,
    counts: {
      policies: policies.length,
      allowed: policies.filter((policy) => policy.decision === "allow").length,
      approvalRequired: policies.filter((policy) => policy.decision === "approval").length,
      denied: policies.filter((policy) => policy.decision === "deny").length,
    },
  };
}
