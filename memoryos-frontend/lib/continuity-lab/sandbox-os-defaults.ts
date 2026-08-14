import type { AskOsId } from "@/lib/continuity-lab/ask-os-preference";

/** Unified local defaults for sandbox OS (user + org scopes). */
export const SANDBOX_OS_DEFAULT_KEY = "memoryos.continuity-lab.sandboxOs.default";

/** @deprecated Migrated into {@link SANDBOX_OS_DEFAULT_KEY}. */
const LEGACY_USER_DEFAULT_KEY = "memoryos.continuity-lab.defaultSandboxOs";
/** @deprecated Migrated into {@link SANDBOX_OS_DEFAULT_KEY}. */
const LEGACY_ORG_DEFAULT_KEY = "memoryos.continuity-lab.orgDefaultSandboxOs";

export type SandboxOsDefaultScope = "user" | "org";

type SandboxOsDefaultsBlob = {
  user?: AskOsId;
  org?: AskOsId;
};

function parseOsId(value: string | null | undefined): AskOsId | null {
  if (value === "windows") return "windows";
  if (value === "ubuntu") return "ubuntu";
  return null;
}

function readBlob(): SandboxOsDefaultsBlob {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(SANDBOX_OS_DEFAULT_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const blob = parsed as SandboxOsDefaultsBlob;
        return {
          user: parseOsId(blob.user) ?? undefined,
          org: parseOsId(blob.org) ?? undefined,
        };
      }
      const legacySingle = parseOsId(raw);
      if (legacySingle) return { user: legacySingle };
    } catch {
      const legacySingle = parseOsId(raw);
      if (legacySingle) return { user: legacySingle };
    }
  }

  const migrated: SandboxOsDefaultsBlob = {};
  const legacyUser = parseOsId(window.localStorage.getItem(LEGACY_USER_DEFAULT_KEY));
  const legacyOrg = parseOsId(window.localStorage.getItem(LEGACY_ORG_DEFAULT_KEY));
  if (legacyUser) migrated.user = legacyUser;
  if (legacyOrg) migrated.org = legacyOrg;
  if (migrated.user || migrated.org) {
    writeBlob(migrated);
    window.localStorage.removeItem(LEGACY_USER_DEFAULT_KEY);
    window.localStorage.removeItem(LEGACY_ORG_DEFAULT_KEY);
  }
  return migrated;
}

function writeBlob(blob: SandboxOsDefaultsBlob): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SANDBOX_OS_DEFAULT_KEY, JSON.stringify(blob));
}

export function readUserDefaultSandboxOs(): AskOsId {
  return readBlob().user ?? "ubuntu";
}

export function saveUserDefaultSandboxOs(os: AskOsId): void {
  const blob = readBlob();
  writeBlob({ ...blob, user: os });
}

export function readOrgDefaultSandboxOs(): AskOsId | null {
  return readBlob().org ?? null;
}

export function saveOrgDefaultSandboxOs(os: AskOsId): void {
  const blob = readBlob();
  writeBlob({ ...blob, org: os });
}

/** @deprecated Use {@link SANDBOX_OS_DEFAULT_KEY}. */
export const USER_DEFAULT_SANDBOX_OS_KEY = LEGACY_USER_DEFAULT_KEY;
/** @deprecated Use {@link SANDBOX_OS_DEFAULT_KEY}. */
export const ORG_DEFAULT_SANDBOX_OS_KEY = LEGACY_ORG_DEFAULT_KEY;
