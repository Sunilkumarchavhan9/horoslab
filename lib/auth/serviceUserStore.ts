import { randomUUID } from "crypto";
import { normalizeOrgId as normalizeRequestOrgId } from "./orgScope";
import { prisma } from "../storage/prismaClient";

export const SERVICE_USER_ROLES = ["Admin", "Member", "DeepWiki Only"] as const;
export const SERVICE_USER_EXPIRATIONS = ["7 days", "30 days", "90 days", "Never"] as const;

export type ServiceUserRole = (typeof SERVICE_USER_ROLES)[number];
export type ServiceUserExpiration = (typeof SERVICE_USER_EXPIRATIONS)[number];

export type ServiceUserRecord = {
  id: string;
  userId: string;
  orgId: string;
  name: string;
  scope: "Organization";
  role: ServiceUserRole;
  createdAt: string;
  expiresAt: string | null;
};

type ServiceUserRow = {
  id: string;
  userId: string;
  orgId: string;
  name: string;
  scope: string;
  role: string;
  createdAt: string;
  expiresAt: string | null;
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function expirationToDate(expiration: ServiceUserExpiration): string | null {
  const now = new Date();
  if (expiration === "7 days") return addDays(now, 7).toISOString();
  if (expiration === "30 days") return addDays(now, 30).toISOString();
  if (expiration === "90 days") return addDays(now, 90).toISOString();
  return null;
}

function isServiceUserRole(value: unknown): value is ServiceUserRole {
  return SERVICE_USER_ROLES.includes(value as ServiceUserRole);
}

function normalizeOrgScope(orgId?: string): string {
  return normalizeRequestOrgId(orgId) ?? "";
}

function toServiceUserRecord(row: ServiceUserRow): ServiceUserRecord {
  return {
    id: row.id,
    userId: row.userId,
    orgId: normalizeOrgScope(row.orgId),
    name: row.name,
    scope: "Organization",
    role: isServiceUserRole(row.role) ? row.role : "Member",
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

function buildServiceUserRecord(input: {
  userId: string;
  orgId?: string;
  name: string;
  role: ServiceUserRole;
  expiration: ServiceUserExpiration;
}): ServiceUserRecord {
  const now = new Date().toISOString();
  return {
    id: `svc_${randomUUID().slice(0, 12)}`,
    userId: input.userId,
    orgId: normalizeOrgScope(input.orgId),
    name: input.name,
    scope: "Organization",
    role: input.role,
    createdAt: now,
    expiresAt: expirationToDate(input.expiration),
  };
}

export async function listServiceUsersForOrg(
  userId: string,
  orgId?: string,
): Promise<ServiceUserRecord[]> {
  const targetOrgId = normalizeOrgScope(orgId);
  const rows = await prisma.serviceUser.findMany({
    where: { userId, orgId: targetOrgId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toServiceUserRecord);
}

export async function countServiceUsersForOrg(userId: string, orgId?: string): Promise<number> {
  const targetOrgId = normalizeOrgScope(orgId);
  return prisma.serviceUser.count({ where: { userId, orgId: targetOrgId } });
}

export async function createServiceUserForOrg(input: {
  userId: string;
  orgId?: string;
  name: string;
  role: ServiceUserRole;
  expiration: ServiceUserExpiration;
}): Promise<ServiceUserRecord> {
  const serviceUser = buildServiceUserRecord(input);
  const row = await prisma.serviceUser.create({
    data: serviceUser,
  });
  return toServiceUserRecord(row);
}

export async function deleteServiceUserForOrg(
  userId: string,
  orgId: string | undefined,
  serviceUserId: string,
): Promise<ServiceUserRecord | null> {
  const targetOrgId = normalizeOrgScope(orgId);
  const target = await prisma.serviceUser.findFirst({
    where: { id: serviceUserId, userId, orgId: targetOrgId },
  });
  if (!target) {
    return null;
  }

  await prisma.serviceUser.delete({ where: { id: target.id } });
  return toServiceUserRecord(target);
}
