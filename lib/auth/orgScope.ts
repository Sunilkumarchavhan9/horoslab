import { AsyncLocalStorage } from "node:async_hooks";

/** Clerk org forwarded as `x-memoryos-org-id`. */
export const MEMORYOS_ORG_ID_HEADER = "x-memoryos-org-id";

export type TenantScope = {
  userId: string;
  orgId?: string;
};

type OrgRequestContext = {
  orgId?: string;
};

export const orgRequestContext = new AsyncLocalStorage<OrgRequestContext>();

export function normalizeOrgId(orgId?: string | null): string | undefined {
  const trimmed = orgId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function readOrgIdFromRequest(req: {
  header(name: string): string | undefined;
}): string | undefined {
  return normalizeOrgId(req.header(MEMORYOS_ORG_ID_HEADER));
}

/** Explicit org wins; otherwise use org bound on the current Express request. */
export function resolveRequestOrgId(explicitOrgId?: string): string | undefined {
  return normalizeOrgId(explicitOrgId) ?? normalizeOrgId(orgRequestContext.getStore()?.orgId);
}

/** Stable storage key for Company Brain platform state. */
export function companyBrainPlatformKey(userId: string, orgId?: string): string {
  const scoped = normalizeOrgId(orgId);
  return scoped ? `${userId}::${scoped}` : userId;
}

export function companyBrainPlatformOrgId(orgId?: string): string {
  return normalizeOrgId(orgId) ?? "";
}

export type ContinuityRowFilter = {
  userId: string;
  orgId?: string;
};

/** Prisma/file filter: strict org match when org context is present. */
export function continuityUserFilter(scope: ContinuityRowFilter): {
  userId: string;
  orgId?: string;
} {
  const orgId = normalizeOrgId(scope.orgId);
  if (orgId) {
    return { userId: scope.userId, orgId };
  }
  return { userId: scope.userId };
}

/** Connector row id: legacy `${userId}_${type}` or org-scoped `${userId}::${orgId}::${type}`. */
export function connectorStorageId(userId: string, type: string, orgId?: string): string {
  const scoped = normalizeOrgId(orgId);
  return scoped ? `${userId}::${scoped}::${type}` : `${userId}_${type}`;
}

/** Prisma where for connector list/get (same rules as continuity). */
export function connectorUserFilter(scope: ContinuityRowFilter): {
  userId: string;
  orgId?: string;
} {
  return continuityUserFilter(scope);
}

/** Prisma/file filter for recent memory list/get (same rules as continuity). */
export function recentMemoryUserFilter(scope: ContinuityRowFilter): {
  userId: string;
  orgId?: string;
} {
  return continuityUserFilter(scope);
}

/** JSON file-store bucket key for recent memories. */
export function recentMemoryStoreKey(userId: string, orgId?: string): string {
  const scoped = normalizeOrgId(orgId);
  return scoped ? `${userId}::${scoped}` : userId;
}
