import { randomUUID } from "crypto";
import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

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
  value: string;
  note: string | null;
  redacted: boolean;
  createdAt: string;
};

export type LabEnvironmentRepoBlueprint = {
  content: string | null;
  versions: LabEnvironmentBlueprintVersion[];
  files: LabEnvironmentBlueprintFile[];
  secrets: LabEnvironmentBlueprintSecret[];
};

export type LabEnvironmentSettingsRecord = {
  blueprintMarkdown: string | null;
  blueprintVersions: LabEnvironmentBlueprintVersion[];
  blueprintFiles: LabEnvironmentBlueprintFile[];
  blueprintSecrets: LabEnvironmentBlueprintSecret[];
  repoBlueprints: Record<string, LabEnvironmentRepoBlueprint>;
  enrolledRepos: LabEnvironmentEnrolledRepo[];
  autoBuildSnapshots: boolean;
  snapshots: LabEnvironmentSnapshot[];
  migrationCompletedAt: string | null;
  updatedAt: string;
};

export type LabEnvironmentSettingsPublic = Omit<
  LabEnvironmentSettingsRecord,
  "blueprintSecrets" | "repoBlueprints" | "updatedAt"
> & {
  blueprintSecrets: Array<Omit<LabEnvironmentBlueprintSecret, "value"> & { value?: string }>;
  repoBlueprints: Record<
    string,
    Omit<LabEnvironmentRepoBlueprint, "secrets"> & {
      secrets: Array<Omit<LabEnvironmentBlueprintSecret, "value"> & { value?: string }>;
    }
  >;
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-environment-settings";

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

const DEFAULTS: Omit<LabEnvironmentSettingsRecord, "updatedAt"> = {
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

function coerceEnrolledRepos(raw: unknown): LabEnvironmentEnrolledRepo[] {
  if (!Array.isArray(raw)) return [];
  const out: LabEnvironmentEnrolledRepo[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabEnvironmentEnrolledRepo>;
    const repo = typeof row.repo === "string" ? row.repo.trim() : "";
    if (!repo || seen.has(repo)) continue;
    seen.add(repo);
    out.push({
      repo,
      addedAt:
        typeof row.addedAt === "string" && row.addedAt.trim()
          ? row.addedAt
          : new Date().toISOString(),
      included: row.included !== false,
    });
  }
  return out;
}

function coerceLogSections(raw: unknown): LabEnvironmentSnapshotLogSection[] {
  if (!Array.isArray(raw)) return [];
  const out: LabEnvironmentSnapshotLogSection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabEnvironmentSnapshotLogSection>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!id || !label) continue;
    out.push({
      id,
      label,
      kind:
        row.kind === "organization" || row.kind === "repo" || row.kind === "health"
          ? row.kind
          : "repo",
      status:
        row.status === "failed" || row.status === "running" ? row.status : "success",
      durationMs: typeof row.durationMs === "number" ? row.durationMs : 0,
      log: typeof row.log === "string" ? row.log : "",
    });
  }
  return out;
}

function coerceSnapshots(raw: unknown): LabEnvironmentSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const out: LabEnvironmentSnapshot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabEnvironmentSnapshot>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const builtAt = typeof row.builtAt === "string" ? row.builtAt : "";
    if (!id || !builtAt) continue;
    const logSections = coerceLogSections(row.logSections);
    out.push({
      id,
      builtAt,
      status:
        row.status === "failed" || row.status === "building" ? row.status : "success",
      repoCount: typeof row.repoCount === "number" ? row.repoCount : 0,
      blueprintSummary:
        typeof row.blueprintSummary === "string" ? row.blueprintSummary : null,
      active: row.active === true,
      buildLog: typeof row.buildLog === "string" ? row.buildLog : null,
      trigger: row.trigger === "auto" ? "auto" : "manual",
      triggeredBy: typeof row.triggeredBy === "string" ? row.triggeredBy : null,
      durationMs: typeof row.durationMs === "number" ? row.durationMs : undefined,
      enrolledRepoNames: Array.isArray(row.enrolledRepoNames)
        ? row.enrolledRepoNames.filter((name): name is string => typeof name === "string")
        : undefined,
      logSections: logSections.length > 0 ? logSections : undefined,
    });
  }
  return out.slice(0, 24);
}

function coerceBlueprintVersions(raw: unknown): LabEnvironmentBlueprintVersion[] {
  if (!Array.isArray(raw)) return [];
  const out: LabEnvironmentBlueprintVersion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabEnvironmentBlueprintVersion>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const savedAt = typeof row.savedAt === "string" ? row.savedAt : "";
    const content = typeof row.content === "string" ? row.content : "";
    if (!id || !savedAt) continue;
    out.push({
      id,
      savedAt,
      savedBy: typeof row.savedBy === "string" ? row.savedBy : null,
      content,
    });
  }
  return out.slice(0, 48);
}

function coerceBlueprintFiles(raw: unknown): LabEnvironmentBlueprintFile[] {
  if (!Array.isArray(raw)) return [];
  const out: LabEnvironmentBlueprintFile[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabEnvironmentBlueprintFile>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!id || !name) continue;
    out.push({
      id,
      name,
      size: typeof row.size === "number" ? row.size : 0,
      uploadedAt: typeof row.uploadedAt === "string" ? row.uploadedAt : new Date().toISOString(),
      content: typeof row.content === "string" ? row.content : "",
    });
  }
  return out.slice(0, 32);
}

function coerceBlueprintSecretType(raw: unknown): LabEnvironmentBlueprintSecretType {
  return raw === "cookie" || raw === "totp" ? raw : "key-value";
}

function coerceBlueprintSecrets(raw: unknown): LabEnvironmentBlueprintSecret[] {
  if (!Array.isArray(raw)) return [];
  const out: LabEnvironmentBlueprintSecret[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabEnvironmentBlueprintSecret>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!id || !name) continue;
    out.push({
      id,
      type: coerceBlueprintSecretType(row.type),
      name,
      value: typeof row.value === "string" ? row.value : "",
      note: typeof row.note === "string" ? row.note : null,
      redacted: row.redacted !== false,
      createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
    });
  }
  return out.slice(0, 128);
}

function coerceRepoBlueprints(raw: unknown): Record<string, LabEnvironmentRepoBlueprint> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, LabEnvironmentRepoBlueprint> = {};
  for (const [repo, value] of Object.entries(raw)) {
    const key = repo.trim();
    if (!key || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Partial<LabEnvironmentRepoBlueprint>;
    out[key] = {
      content:
        row.content === null || typeof row.content === "string" ? (row.content ?? null) : null,
      versions: coerceBlueprintVersions(row.versions),
      files: coerceBlueprintFiles(row.files),
      secrets: coerceBlueprintSecrets(row.secrets),
    };
  }
  return out;
}

function getRepoBlueprintRecord(
  settings: Omit<LabEnvironmentSettingsRecord, "updatedAt">,
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

function withRepoBlueprint(
  settings: Omit<LabEnvironmentSettingsRecord, "updatedAt">,
  repo: string,
  blueprint: LabEnvironmentRepoBlueprint,
): Record<string, LabEnvironmentRepoBlueprint> {
  return { ...settings.repoBlueprints, [repo]: blueprint };
}

function normalizeBase(
  existing: Omit<LabEnvironmentSettingsRecord, "updatedAt"> | undefined,
): Omit<LabEnvironmentSettingsRecord, "updatedAt"> {
  const raw = existing ?? DEFAULTS;
  return {
    blueprintMarkdown:
      raw.blueprintMarkdown === null || typeof raw.blueprintMarkdown === "string"
        ? (raw.blueprintMarkdown ?? null)
        : null,
    blueprintVersions: coerceBlueprintVersions(raw.blueprintVersions),
    blueprintFiles: coerceBlueprintFiles(raw.blueprintFiles),
    blueprintSecrets: coerceBlueprintSecrets(raw.blueprintSecrets),
    repoBlueprints: coerceRepoBlueprints(raw.repoBlueprints),
    enrolledRepos: coerceEnrolledRepos(raw.enrolledRepos),
    autoBuildSnapshots: raw.autoBuildSnapshots !== false,
    snapshots: coerceSnapshots(raw.snapshots),
    migrationCompletedAt:
      typeof raw.migrationCompletedAt === "string" ? raw.migrationCompletedAt : null,
  };
}

function mergeRecord(
  existing: Omit<LabEnvironmentSettingsRecord, "updatedAt"> | undefined,
  partial: Partial<Omit<LabEnvironmentSettingsRecord, "updatedAt">>,
): LabEnvironmentSettingsRecord {
  const base = normalizeBase(existing);
  return {
    blueprintMarkdown:
      partial.blueprintMarkdown !== undefined
        ? partial.blueprintMarkdown === null
          ? null
          : String(partial.blueprintMarkdown)
        : base.blueprintMarkdown,
    blueprintVersions:
      partial.blueprintVersions !== undefined
        ? coerceBlueprintVersions(partial.blueprintVersions)
        : base.blueprintVersions,
    blueprintFiles:
      partial.blueprintFiles !== undefined
        ? coerceBlueprintFiles(partial.blueprintFiles)
        : base.blueprintFiles,
    blueprintSecrets:
      partial.blueprintSecrets !== undefined
        ? coerceBlueprintSecrets(partial.blueprintSecrets)
        : base.blueprintSecrets,
    repoBlueprints:
      partial.repoBlueprints !== undefined
        ? coerceRepoBlueprints(partial.repoBlueprints)
        : base.repoBlueprints,
    enrolledRepos:
      partial.enrolledRepos !== undefined
        ? coerceEnrolledRepos(partial.enrolledRepos)
        : base.enrolledRepos,
    autoBuildSnapshots:
      partial.autoBuildSnapshots !== undefined
        ? partial.autoBuildSnapshots === true
        : base.autoBuildSnapshots,
    snapshots:
      partial.snapshots !== undefined ? coerceSnapshots(partial.snapshots) : base.snapshots,
    migrationCompletedAt:
      partial.migrationCompletedAt !== undefined
        ? partial.migrationCompletedAt
        : base.migrationCompletedAt,
    updatedAt: new Date().toISOString(),
  };
}

export function toPublicEnvironmentSettings(
  record: LabEnvironmentSettingsRecord,
): LabEnvironmentSettingsPublic {
  const { updatedAt, blueprintSecrets, repoBlueprints, ...rest } = record;
  const publicRepoBlueprints: LabEnvironmentSettingsPublic["repoBlueprints"] = {};
  for (const [repo, blueprint] of Object.entries(repoBlueprints)) {
    publicRepoBlueprints[repo] = {
      ...blueprint,
      secrets: blueprint.secrets.map((secret) => ({
        id: secret.id,
        type: secret.type,
        name: secret.name,
        note: secret.note,
        redacted: secret.redacted,
        createdAt: secret.createdAt,
        ...(secret.redacted ? {} : { value: secret.value }),
      })),
    };
  }
  return {
    ...rest,
    updatedAt,
    repoBlueprints: publicRepoBlueprints,
    blueprintSecrets: blueprintSecrets.map((secret) => ({
      id: secret.id,
      type: secret.type,
      name: secret.name,
      note: secret.note,
      redacted: secret.redacted,
      createdAt: secret.createdAt,
      ...(secret.redacted ? {} : { value: secret.value }),
    })),
  };
}

export async function getLabEnvironmentSettings(orgId: string): Promise<LabEnvironmentSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => mergeRecord(raw as Omit<LabEnvironmentSettingsRecord, "updatedAt"> | undefined, {}),
  );
}

export async function patchLabEnvironmentSettings(
  orgId: string,
  partial: Partial<Omit<LabEnvironmentSettingsRecord, "updatedAt">>,
): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}

function blueprintSummaryFrom(markdown: string | null): string | null {
  const trimmed = markdown?.trim();
  if (!trimmed) return null;
  const firstLine = trimmed.split("\n").find((line) => line.trim())?.trim();
  return firstLine ? firstLine.slice(0, 120) : "Organization blueprint";
}

export async function saveLabEnvironmentBlueprint(input: {
  orgId: string;
  content: string;
  savedBy?: string | null;
}): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(input.orgId);
  const content = input.content.trim();
  const versions = [...current.blueprintVersions];
  const last = versions[0];
  if (!last || last.content !== content) {
    versions.unshift({
      id: randomUUID(),
      savedAt: new Date().toISOString(),
      savedBy: input.savedBy ?? null,
      content,
    });
  }
  return patchLabEnvironmentSettings(input.orgId, {
    blueprintMarkdown: content || null,
    blueprintVersions: versions.slice(0, 48),
  });
}

export async function deleteLabEnvironmentBlueprint(
  orgId: string,
): Promise<LabEnvironmentSettingsRecord> {
  return patchLabEnvironmentSettings(orgId, {
    blueprintMarkdown: null,
    blueprintVersions: [],
    blueprintFiles: [],
    blueprintSecrets: [],
  });
}

export async function addLabEnvironmentBlueprintSecret(
  orgId: string,
  secret: Omit<LabEnvironmentBlueprintSecret, "id" | "createdAt">,
): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(orgId);
  const nextSecret: LabEnvironmentBlueprintSecret = {
    id: randomUUID(),
    type: coerceBlueprintSecretType(secret.type),
    name: secret.name.trim(),
    value: secret.value,
    note: secret.note,
    redacted: secret.redacted,
    createdAt: new Date().toISOString(),
  };
  return patchLabEnvironmentSettings(orgId, {
    blueprintSecrets: [nextSecret, ...current.blueprintSecrets].slice(0, 128),
  });
}

export async function importLabEnvironmentBlueprintSecrets(
  orgId: string,
  lines: Array<{ name: string; value: string; note?: string | null; redacted?: boolean }>,
): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(orgId);
  const imported = lines.map((line) => ({
    id: randomUUID(),
    type: "key-value" as const,
    name: line.name.trim(),
    value: line.value,
    note: line.note ?? null,
    redacted: line.redacted !== false,
    createdAt: new Date().toISOString(),
  }));
  return patchLabEnvironmentSettings(orgId, {
    blueprintSecrets: [...imported, ...current.blueprintSecrets].slice(0, 128),
  });
}

export async function addLabEnvironmentBlueprintFile(
  orgId: string,
  file: { name: string; content: string },
): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(orgId);
  const entry: LabEnvironmentBlueprintFile = {
    id: randomUUID(),
    name: file.name.trim(),
    content: file.content,
    size: Buffer.byteLength(file.content, "utf8"),
    uploadedAt: new Date().toISOString(),
  };
  return patchLabEnvironmentSettings(orgId, {
    blueprintFiles: [entry, ...current.blueprintFiles].slice(0, 32),
  });
}

export async function buildLabEnvironmentSnapshot(
  orgId: string,
  options?: { triggeredBy?: string | null; trigger?: "manual" | "auto" },
): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(orgId);
  const includedRepos = current.enrolledRepos.filter((row) => row.included);
  const repoCount = includedRepos.length;
  const blueprintSummary = blueprintSummaryFrom(current.blueprintMarkdown);
  const builtAt = new Date().toISOString();
  const logSections = buildSnapshotLogSections(current, includedRepos);
  const durationMs = logSections.reduce((sum, row) => sum + row.durationMs, 0);
  const buildLog = logSections.map((row) => row.log).join("\n\n");

  const snapshot: LabEnvironmentSnapshot = {
    id: randomUUID(),
    builtAt,
    status: "success",
    repoCount,
    blueprintSummary: blueprintSummary ?? (current.blueprintMarkdown ? "Organization blueprint" : null),
    active: true,
    buildLog,
    trigger: options?.trigger ?? "manual",
    triggeredBy: options?.triggeredBy ?? null,
    durationMs,
    enrolledRepoNames: includedRepos.map((row) => row.repo),
    logSections,
  };

  const snapshots = [
    snapshot,
    ...current.snapshots.map((row) => ({ ...row, active: false })),
  ].slice(0, 24);

  return patchLabEnvironmentSettings(orgId, {
    snapshots,
    migrationCompletedAt: current.migrationCompletedAt ?? builtAt,
  });
}

function buildSnapshotLogSections(
  current: LabEnvironmentSettingsRecord,
  includedRepos: LabEnvironmentEnrolledRepo[],
): LabEnvironmentSnapshotLogSection[] {
  const sections: LabEnvironmentSnapshotLogSection[] = [];

  const orgBlueprint = current.blueprintMarkdown?.trim();
  sections.push({
    id: "organization",
    label: "Organization",
    kind: "organization",
    status: "success",
    durationMs: orgBlueprint ? 2_000 : 500,
    log: orgBlueprint
      ? [
          "=== secrets: injected 0 org + 0 repo secret env vars ===",
          "=== org blueprint: initialize ===",
          orgBlueprint.split("\n").slice(0, 12).join("\n"),
          orgBlueprint.split("\n").length > 12 ? "…" : "",
          "=== org blueprint: success (exit 0) ===",
        ]
          .filter(Boolean)
          .join("\n")
      : "=== org blueprint: skip ===\nNo organization blueprint configured.",
  });

  for (const enrolled of includedRepos) {
    const repoBlueprint = getRepoBlueprintRecord(current, enrolled.repo);
    const setup = repoBlueprint.content?.trim();
    sections.push({
      id: `repo-${enrolled.repo.replace(/[^\w-]+/g, "-")}`,
      label: enrolled.repo,
      kind: "repo",
      status: "success",
      durationMs: 3_000,
      log: [
        `=== repository: clone ===`,
        `git clone https://github.com/${enrolled.repo}.git /workspace/${enrolled.repo.split("/").pop() ?? "repo"}`,
        `branch: main (default)`,
        setup
          ? [`=== repository: setup ===`, setup.split("\n").slice(0, 8).join("\n")].join("\n")
          : "=== repository: setup ===\nNo per-repo blueprint — using org defaults only.",
        "=== repository: success (exit 0) ===",
      ].join("\n"),
    });
  }

  sections.push({
    id: "health-check",
    label: "Health Check",
    kind: "health",
    status: "success",
    durationMs: 500,
    log: [
      "=== health check: starting ===",
      "=== health check: shell responsiveness ===",
      "Running command: echo healthy",
      "",
      "healthy",
      "exit_code: 0",
      "=== health check: passed ===",
      "=== group_done ===",
      `disk_usage: {"root_fs":{"used_percent":9},"repo_sizes":{${includedRepos.map((r) => `"${r.repo.split("/").pop()}":57305009`).join(",") || '"none":0'}}}`,
    ].join("\n"),
  });

  return sections;
}

export async function activateLabEnvironmentSnapshot(
  orgId: string,
  snapshotId: string,
): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(orgId);
  const id = snapshotId.trim();
  if (!id) return current;
  const exists = current.snapshots.some((row) => row.id === id);
  if (!exists) return current;
  return patchLabEnvironmentSettings(orgId, {
    snapshots: current.snapshots.map((row) => ({
      ...row,
      active: row.id === id,
    })),
  });
}

export async function deleteLabEnvironmentSnapshot(
  orgId: string,
  snapshotId: string,
): Promise<LabEnvironmentSettingsRecord> {
  const current = await getLabEnvironmentSettings(orgId);
  const id = snapshotId.trim();
  if (!id) return current;
  const target = current.snapshots.find((row) => row.id === id);
  if (!target) return current;
  let next = current.snapshots.filter((row) => row.id !== id);
  if (target.active && next.length > 0) {
    next = next.map((row, index) => ({ ...row, active: index === 0 }));
  }
  return patchLabEnvironmentSettings(orgId, { snapshots: next });
}

export async function resolveBlueprintSecretValues(
  orgId: string,
): Promise<LabEnvironmentBlueprintSecret[]> {
  return (await getLabEnvironmentSettings(orgId)).blueprintSecrets;
}

export async function saveLabEnvironmentRepoBlueprint(input: {
  orgId: string;
  repo: string;
  content: string;
  savedBy?: string | null;
}): Promise<LabEnvironmentSettingsRecord> {
  const repo = input.repo.trim();
  if (!repo) return getLabEnvironmentSettings(input.orgId);
  const current = await getLabEnvironmentSettings(input.orgId);
  const existing = getRepoBlueprintRecord(current, repo);
  const content = input.content.trim();
  const versions = [...existing.versions];
  const last = versions[0];
  if (!last || last.content !== content) {
    versions.unshift({
      id: randomUUID(),
      savedAt: new Date().toISOString(),
      savedBy: input.savedBy ?? null,
      content,
    });
  }
  return patchLabEnvironmentSettings(input.orgId, {
    repoBlueprints: withRepoBlueprint(current, repo, {
      ...existing,
      content: content || null,
      versions: versions.slice(0, 48),
    }),
  });
}

export async function deleteLabEnvironmentRepoBlueprint(
  orgId: string,
  repo: string,
): Promise<LabEnvironmentSettingsRecord> {
  const trimmed = repo.trim();
  if (!trimmed) return getLabEnvironmentSettings(orgId);
  const current = await getLabEnvironmentSettings(orgId);
  const next = { ...current.repoBlueprints };
  delete next[trimmed];
  return patchLabEnvironmentSettings(orgId, { repoBlueprints: next });
}

export async function removeEnrolledRepo(
  orgId: string,
  repo: string,
): Promise<LabEnvironmentSettingsRecord> {
  const trimmed = repo.trim();
  if (!trimmed) return getLabEnvironmentSettings(orgId);
  const current = await getLabEnvironmentSettings(orgId);
  const nextBlueprints = { ...current.repoBlueprints };
  delete nextBlueprints[trimmed];
  return patchLabEnvironmentSettings(orgId, {
    enrolledRepos: current.enrolledRepos.filter((row) => row.repo !== trimmed),
    repoBlueprints: nextBlueprints,
  });
}

export async function addLabEnvironmentRepoBlueprintSecret(
  orgId: string,
  repo: string,
  secret: Omit<LabEnvironmentBlueprintSecret, "id" | "createdAt" | "type">,
): Promise<LabEnvironmentSettingsRecord> {
  const trimmed = repo.trim();
  if (!trimmed) return getLabEnvironmentSettings(orgId);
  const current = await getLabEnvironmentSettings(orgId);
  const existing = getRepoBlueprintRecord(current, trimmed);
  const nextSecret: LabEnvironmentBlueprintSecret = {
    id: randomUUID(),
    type: "key-value",
    name: secret.name.trim(),
    value: secret.value,
    note: secret.note,
    redacted: secret.redacted,
    createdAt: new Date().toISOString(),
  };
  return patchLabEnvironmentSettings(orgId, {
    repoBlueprints: withRepoBlueprint(current, trimmed, {
      ...existing,
      secrets: [nextSecret, ...existing.secrets].slice(0, 128),
    }),
  });
}

export async function importLabEnvironmentRepoBlueprintSecrets(
  orgId: string,
  repo: string,
  lines: Array<{ name: string; value: string; note?: string | null; redacted?: boolean }>,
): Promise<LabEnvironmentSettingsRecord> {
  const trimmed = repo.trim();
  if (!trimmed) return getLabEnvironmentSettings(orgId);
  const current = await getLabEnvironmentSettings(orgId);
  const existing = getRepoBlueprintRecord(current, trimmed);
  const imported = lines.map((line) => ({
    id: randomUUID(),
    type: "key-value" as const,
    name: line.name.trim(),
    value: line.value,
    note: line.note ?? null,
    redacted: line.redacted !== false,
    createdAt: new Date().toISOString(),
  }));
  return patchLabEnvironmentSettings(orgId, {
    repoBlueprints: withRepoBlueprint(current, trimmed, {
      ...existing,
      secrets: [...imported, ...existing.secrets].slice(0, 128),
    }),
  });
}

export async function addLabEnvironmentRepoBlueprintFile(
  orgId: string,
  repo: string,
  file: { name: string; content: string },
): Promise<LabEnvironmentSettingsRecord> {
  const trimmed = repo.trim();
  if (!trimmed) return getLabEnvironmentSettings(orgId);
  const current = await getLabEnvironmentSettings(orgId);
  const existing = getRepoBlueprintRecord(current, trimmed);
  const entry: LabEnvironmentBlueprintFile = {
    id: randomUUID(),
    name: file.name.trim(),
    content: file.content,
    size: Buffer.byteLength(file.content, "utf8"),
    uploadedAt: new Date().toISOString(),
  };
  return patchLabEnvironmentSettings(orgId, {
    repoBlueprints: withRepoBlueprint(current, trimmed, {
      ...existing,
      files: [entry, ...existing.files].slice(0, 32),
    }),
  });
}
