import { broadcastLabEnvironmentSettingsChanged } from "@/lib/continuity-lab/lab-environment-settings-events";

export type LabEnvironmentEnrolledRepo = {
  repo: string;
  addedAt: string;
  included: boolean;
};

export type LabEnvironmentSnapshotLogSection = {
  id: string;
  label: string;
  kind: "organization" | "repo" | "health";
  status: "success" | "failed" | "running";
  durationMs: number;
  log: string;
};

export type LabEnvironmentSnapshot = {
  id: string;
  builtAt: string;
  status: "success" | "failed" | "building";
  repoCount: number;
  blueprintSummary: string | null;
  active: boolean;
  buildLog: string | null;
  trigger?: "manual" | "auto";
  triggeredBy?: string | null;
  durationMs?: number;
  enrolledRepoNames?: string[];
  logSections?: LabEnvironmentSnapshotLogSection[];
};

export type LabEnvironmentBlueprintVersion = {
  id: string;
  savedAt: string;
  savedBy: string | null;
  content: string;
};

export type LabEnvironmentBlueprintFile = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  content: string;
};

export type LabEnvironmentBlueprintSecretType = "key-value" | "cookie" | "totp";

export type LabEnvironmentBlueprintSecret = {
  id: string;
  type: LabEnvironmentBlueprintSecretType;
  name: string;
  note: string | null;
  redacted: boolean;
  createdAt: string;
  value?: string;
};

export type LabEnvironmentRepoBlueprint = {
  content: string | null;
  versions: LabEnvironmentBlueprintVersion[];
  files: LabEnvironmentBlueprintFile[];
  secrets: LabEnvironmentBlueprintSecret[];
};

export type LabEnvironmentSettings = {
  blueprintMarkdown: string | null;
  blueprintVersions: LabEnvironmentBlueprintVersion[];
  blueprintFiles: LabEnvironmentBlueprintFile[];
  blueprintSecrets: LabEnvironmentBlueprintSecret[];
  repoBlueprints: Record<string, LabEnvironmentRepoBlueprint>;
  enrolledRepos: LabEnvironmentEnrolledRepo[];
  autoBuildSnapshots: boolean;
  snapshots: LabEnvironmentSnapshot[];
  migrationCompletedAt: string | null;
};

export const DEFAULT_REPO_BLUEPRINT_YAML = `# https://docs.devin.ai/onboard-devin/environment-yaml
# Remove the comments below and add commands for your repository setup.

initialize: |
  # e.g. curl -LsSf https://astral.sh/uv/install.sh | sh

maintenance: |
  # e.g. npm install

knowledge:
  - name: lint
    contents: |
      # npm run lint
  - name: test
    contents: |
      # npm run test
  - name: build
    contents: |
      # npm run build
`;

export const DEFAULT_BLUEPRINT_YAML = `# Organization blueprint - runs before any per-repo configuration.
# One-time setup (e.g., install system tools, global CLIs).
initialize: |
  # e.g. nvm install 22 && nvm alias default 22
# Install shared dependencies (runs during builds, surfaced to agent at session start).
maintenance: |
  # e.g. npm install -g shared-cli-tool
knowledge:
  - name: org-conventions
    contents: |
      # Organization-wide conventions or notes for MemoryOS
`;

const STORAGE_KEY = "memoryos-lab-environment-settings";

export const ENVIRONMENT_SNAPSHOT_BUILD_NOTE =
  "Records your org environment definition. OpenHands sandbox image rebuild is planned — sessions use enrolled repos and blueprint text today.";

const DEFAULTS: LabEnvironmentSettings = {
  blueprintMarkdown: null,
  blueprintVersions: [],
  blueprintFiles: [],
  blueprintSecrets: [],
  repoBlueprints: {},
  enrolledRepos: [],
  autoBuildSnapshots: true,
  snapshots: [],
  migrationCompletedAt: null,
};

function coerceRepoBlueprints(
  raw: unknown,
): Record<string, LabEnvironmentRepoBlueprint> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, LabEnvironmentRepoBlueprint> = {};
  for (const [repo, value] of Object.entries(raw)) {
    const key = repo.trim();
    if (!key || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Partial<LabEnvironmentRepoBlueprint>;
    out[key] = {
      content:
        row.content === null || typeof row.content === "string" ? (row.content ?? null) : null,
      versions: Array.isArray(row.versions) ? row.versions : [],
      files: Array.isArray(row.files) ? row.files : [],
      secrets: Array.isArray(row.secrets) ? row.secrets : [],
    };
  }
  return out;
}

export function getRepoBlueprintFromSettings(
  settings: LabEnvironmentSettings,
  repo: string,
): LabEnvironmentRepoBlueprint {
  return (
    settings.repoBlueprints[repo] ?? {
      content: null,
      versions: [],
      files: [],
      secrets: [],
    }
  );
}

export function repoBlueprintSettingsPath(repo: string): string {
  const segments = repo
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(encodeURIComponent);
  return `/continuity-lab/settings/environment/repo/${segments.join("/")}`;
}

export function environmentSnapshotPath(snapshotId: string): string {
  return `/continuity-lab/settings/environment/snapshot/${encodeURIComponent(snapshotId)}`;
}

export function parseRepoFromBlueprintPath(slug: string[]): string | null {
  if (!slug.length) return null;
  const decoded = slug.map((part) => decodeURIComponent(part)).join("/");
  return decoded.includes("/") ? decoded : null;
}

export function buildRepoGeneratePrompt(repo: string): string {
  return `Set up the ${repo} repository from scratch: Install dependencies, get the build and tests working. Then capture the working setup steps in the .yaml environment configuration. Should we get the app running: \`{YES_NO}\``;
}

/** Opens Continuity Lab home (Sessions) with the setup prompt prefilled — Devin-style. */
export function buildGenerateWithDevinAskUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `/continuity-lab?prefill=${encoded}&prompt=${encoded}`;
}

export function normalizeLabEnvironmentSettings(
  partial: Partial<LabEnvironmentSettings> | null | undefined,
): LabEnvironmentSettings {
  const parsed = partial ?? {};
  return {
    blueprintMarkdown:
      parsed.blueprintMarkdown === null || typeof parsed.blueprintMarkdown === "string"
        ? (parsed.blueprintMarkdown ?? null)
        : null,
    blueprintVersions: Array.isArray(parsed.blueprintVersions) ? parsed.blueprintVersions : [],
    blueprintFiles: Array.isArray(parsed.blueprintFiles) ? parsed.blueprintFiles : [],
    blueprintSecrets: Array.isArray(parsed.blueprintSecrets) ? parsed.blueprintSecrets : [],
    repoBlueprints: coerceRepoBlueprints(parsed.repoBlueprints),
    enrolledRepos: Array.isArray(parsed.enrolledRepos)
      ? parsed.enrolledRepos.filter(
          (row): row is LabEnvironmentEnrolledRepo =>
            Boolean(row && typeof row === "object" && typeof row.repo === "string"),
        )
      : [],
    autoBuildSnapshots: parsed.autoBuildSnapshots !== false,
    snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
    migrationCompletedAt:
      typeof parsed.migrationCompletedAt === "string" ? parsed.migrationCompletedAt : null,
  };
}

function readRaw(): LabEnvironmentSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<LabEnvironmentSettings>;
    return normalizeLabEnvironmentSettings(parsed);
  } catch {
    return { ...DEFAULTS };
  }
}

export function readLabEnvironmentSettings(): LabEnvironmentSettings {
  return readRaw();
}

export function saveLabEnvironmentSettings(
  partial: Partial<LabEnvironmentSettings>,
  options?: { broadcast?: boolean },
): LabEnvironmentSettings {
  const next = normalizeLabEnvironmentSettings({ ...readRaw(), ...partial });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  if (options?.broadcast !== false) {
    broadcastLabEnvironmentSettingsChanged({ settings: next });
  }
  return next;
}
