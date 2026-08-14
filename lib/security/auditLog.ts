import type { Prisma } from "@prisma/client";
import { prisma } from "../storage/prismaClient";

export type AuditLogStatus = "success" | "failed" | "blocked";
export type AuditLogRiskLevel = "low" | "medium" | "high" | "critical";

export type RecordAuditLogInput = {
  userId: string;
  orgId?: string;
  workspaceId?: string;
  actorType?: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status?: AuditLogStatus;
  riskLevel?: AuditLogRiskLevel;
  ipHash?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Prisma.InputJsonValue;
};

export type ListAuditLogsInput = {
  userId: string;
  orgId?: string;
  workspaceId?: string;
  action?: string;
  resourceType?: string;
  status?: string;
  limit?: number;
};

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return 100;
  return Math.max(1, Math.min(500, Math.floor(limit as number)));
}

export async function recordAuditLog(input: RecordAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      actorType: input.actorType ?? "user",
      actorId: input.actorId ?? input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      status: input.status ?? "success",
      riskLevel: input.riskLevel ?? "low",
      ipHash: input.ipHash,
      userAgent: input.userAgent,
      requestId: input.requestId,
      metadata: input.metadata ?? {},
    },
  });
}

export async function listAuditLogs(input: ListAuditLogsInput) {
  const where: Prisma.AuditLogWhereInput = {
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
    ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
    ...(input.action ? { action: input.action } : {}),
    ...(input.resourceType ? { resourceType: input.resourceType } : {}),
    ...(input.status ? { status: input.status } : {}),
  };

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: normalizeLimit(input.limit),
  });
}
