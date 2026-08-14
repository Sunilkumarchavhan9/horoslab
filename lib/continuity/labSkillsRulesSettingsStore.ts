import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type SkillsRulesRepoCompileStats = {
  lastCompiledAt: string;
  memoryCount: number;
};

export type LabSkillsRulesSettingsRecord = {
  enrolledRepos: string[];
  autoCompileEnabled: boolean;
  lastCompiledAt: string | null;
  compileStatsByRepo: Record<string, SkillsRulesRepoCompileStats>;
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-skills-rules-settings";

const DEFAULTS: Omit<LabSkillsRulesSettingsRecord, "updatedAt"> = {
  enrolledRepos: [],
  autoCompileEnabled: true,
  lastCompiledAt: null,
  compileStatsByRepo: {},
};

function coerceEnrolledRepos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const repo = typeof item === "string" ? item.trim() : "";
    if (!repo || seen.has(repo)) continue;
    seen.add(repo);
    out.push(repo);
  }
  return out;
}

function coerceCompileStatsByRepo(raw: unknown): Record<string, SkillsRulesRepoCompileStats> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, SkillsRulesRepoCompileStats> = {};
  for (const [repo, value] of Object.entries(raw)) {
    if (!repo.trim() || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Partial<SkillsRulesRepoCompileStats>;
    if (typeof row.lastCompiledAt !== "string" || typeof row.memoryCount !== "number") continue;
    out[repo] = {
      lastCompiledAt: row.lastCompiledAt,
      memoryCount: row.memoryCount,
    };
  }
  return out;
}

function mergeRecord(
  existing: Omit<LabSkillsRulesSettingsRecord, "updatedAt"> | undefined,
  partial: Partial<Omit<LabSkillsRulesSettingsRecord, "updatedAt">>,
): LabSkillsRulesSettingsRecord {
  const base = { ...DEFAULTS, ...(existing ?? {}) };
  return {
    enrolledRepos:
      partial.enrolledRepos !== undefined
        ? coerceEnrolledRepos(partial.enrolledRepos)
        : base.enrolledRepos,
    autoCompileEnabled:
      partial.autoCompileEnabled !== undefined
        ? Boolean(partial.autoCompileEnabled)
        : base.autoCompileEnabled,
    lastCompiledAt:
      partial.lastCompiledAt !== undefined ? partial.lastCompiledAt : base.lastCompiledAt,
    compileStatsByRepo:
      partial.compileStatsByRepo !== undefined
        ? coerceCompileStatsByRepo(partial.compileStatsByRepo)
        : base.compileStatsByRepo,
    updatedAt: new Date().toISOString(),
  };
}

export async function recordSkillsRulesCompileStats(
  orgId: string,
  stats: Record<string, SkillsRulesRepoCompileStats>,
): Promise<LabSkillsRulesSettingsRecord> {
  const current = await getLabSkillsRulesSettings(orgId);
  const compileStatsByRepo = { ...current.compileStatsByRepo, ...stats };
  const next = mergeRecord(current, {
    compileStatsByRepo,
    lastCompiledAt: new Date().toISOString(),
  });
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}

export async function getLabSkillsRulesSettings(orgId: string): Promise<LabSkillsRulesSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => mergeRecord(raw as Omit<LabSkillsRulesSettingsRecord, "updatedAt"> | undefined, {}),
  );
}

export async function patchLabSkillsRulesSettings(
  orgId: string,
  partial: Partial<Omit<LabSkillsRulesSettingsRecord, "updatedAt">>,
): Promise<LabSkillsRulesSettingsRecord> {
  const current = await getLabSkillsRulesSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}
