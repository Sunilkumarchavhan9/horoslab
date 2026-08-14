"use client";

import {
  ONBOARDING_STORAGE_KEY,
  readClerkOrganizationId,
  readDevConsoleOrganizationId,
} from "@/lib/org-scope-client";

type StoredOrganization = { id?: string; name?: string };

type OnboardingSnapshot = {
  orgName?: string;
  organizations?: StoredOrganization[];
  currentOrganizationId?: string;
};

function readOnboardingSnapshot(): OnboardingSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingSnapshot;
  } catch {
    return null;
  }
}

export function readActiveOrganizationId(): string | null {
  return readClerkOrganizationId() ?? readDevConsoleOrganizationId();
}

export function readDevConsoleOrgDisplayName(): string | null {
  const parsed = readOnboardingSnapshot();
  if (!parsed) return null;
  const orgId = parsed.currentOrganizationId;
  const fromList = parsed.organizations?.find((o) => o.id === orgId)?.name;
  const name = (fromList ?? parsed.orgName)?.trim();
  return name && name.length > 0 ? name : null;
}

/** Sync org display name into onboarding storage. */
export function writeDevConsoleOrgDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (!trimmed) return;

  try {
    const parsed = readOnboardingSnapshot() ?? {};
    const orgId = parsed.currentOrganizationId;
    const organizations = [...(parsed.organizations ?? [])];
    if (orgId) {
      const index = organizations.findIndex((o) => o.id === orgId);
      if (index >= 0) {
        organizations[index] = { ...organizations[index], name: trimmed };
      } else {
        organizations.push({ id: orgId, name: trimmed });
      }
    }
    const next: OnboardingSnapshot = {
      ...parsed,
      orgName: trimmed,
      organizations,
    };
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
