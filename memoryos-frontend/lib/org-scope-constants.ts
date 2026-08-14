/** Clerk / onboarding org forwarded as `x-memoryos-org-id`. */
export const MEMORYOS_ORG_ID_HEADER = "x-memoryos-org-id";

/** Cookie mirrored from onboarding org selection (EventSource cannot send custom headers). */
export const MEMORYOS_ORG_ID_COOKIE = "memoryos-org-id";

export function normalizeOrgId(orgId?: string | null): string | undefined {
  const trimmed = orgId?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
