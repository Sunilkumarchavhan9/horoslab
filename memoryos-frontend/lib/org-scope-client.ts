"use client";

/**
 * Org isolation Phase 2 (frontend): dev-console + Clerk org → `x-memoryos-org-id`.
 *
 * Remaining gap: Connector Prisma models are still userId-scoped only (no orgId column).
 * Backend connector routes do not yet enforce tenant isolation at persistence layer.
 */

import {
  MEMORYOS_ORG_ID_COOKIE,
  MEMORYOS_ORG_ID_HEADER,
} from "@/lib/org-scope-constants";

export const ONBOARDING_STORAGE_KEY = "memoryos.onboarding";

export function readDevConsoleOrganizationId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { currentOrganizationId?: unknown };
    const orgId = parsed.currentOrganizationId;
    if (typeof orgId !== "string") return null;
    const trimmed = orgId.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function readClerkOrganizationId(): string | null {
  if (typeof window === "undefined") return null;

  const clerk = (
    window as unknown as {
      Clerk?: { organization?: { id?: string } };
    }
  ).Clerk;
  const orgId = clerk?.organization?.id;
  if (typeof orgId !== "string") return null;
  const trimmed = orgId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Client-side org header for `/api/*` proxies (Clerk active org or dev-console selection). */
export function getMemoryOSOrgHeaders(): Record<string, string> {
  const orgId = readClerkOrganizationId() ?? readDevConsoleOrganizationId();
  if (!orgId) return {};
  return { [MEMORYOS_ORG_ID_HEADER]: orgId };
}

export function mergeMemoryOSOrgHeaders(
  headers?: HeadersInit,
): HeadersInit {
  const merged = new Headers(headers ?? undefined);
  const orgHeaders = getMemoryOSOrgHeaders();
  for (const [key, value] of Object.entries(orgHeaders)) {
    if (!merged.has(key)) {
      merged.set(key, value);
    }
  }
  return merged;
}

/** Keeps SSE/EventSource org context when custom headers are unavailable. */
export function syncMemoryOSOrgCookie(orgId: string | null | undefined): void {
  if (typeof document === "undefined") return;

  if (orgId && orgId.trim().length > 0) {
    const value = encodeURIComponent(orgId.trim());
    document.cookie = `${MEMORYOS_ORG_ID_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
    return;
  }

  document.cookie = `${MEMORYOS_ORG_ID_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
