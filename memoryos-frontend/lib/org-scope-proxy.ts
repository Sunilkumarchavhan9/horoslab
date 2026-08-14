import type { NextRequest } from "next/server";
import {
  MEMORYOS_ORG_ID_COOKIE,
  MEMORYOS_ORG_ID_HEADER,
  normalizeOrgId,
} from "./org-scope-constants";

export { MEMORYOS_ORG_ID_COOKIE };

export function readOrgIdFromProxyCookie(request: NextRequest): string | undefined {
  return normalizeOrgId(request.cookies.get(MEMORYOS_ORG_ID_COOKIE)?.value);
}

export function readOrgIdFromProxyHeader(request: NextRequest): string | undefined {
  return normalizeOrgId(request.headers.get(MEMORYOS_ORG_ID_HEADER));
}

/**
 * Resolve tenant org for Next.js API proxies.
 *
 * Clerk's signed session org wins. Client headers/cookies are only a dev-console
 * fallback for local flows without Clerk org context and must never override Clerk.
 */
export function resolveProxyOrgId(
  request: NextRequest,
  clerkOrgId?: string | null,
): string | undefined {
  return (
    normalizeOrgId(clerkOrgId) ??
    readOrgIdFromProxyCookie(request) ??
    readOrgIdFromProxyHeader(request)
  );
}

export function applyProxyOrgIdHeader(
  headers: Headers,
  request: NextRequest,
  clerkOrgId?: string | null,
): void {
  if (headers.has(MEMORYOS_ORG_ID_HEADER)) return;
  const orgId = resolveProxyOrgId(request, clerkOrgId);
  if (orgId) {
    headers.set(MEMORYOS_ORG_ID_HEADER, orgId);
  }
}
