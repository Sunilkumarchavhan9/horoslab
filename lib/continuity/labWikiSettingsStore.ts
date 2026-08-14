import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type LabWikiEffort = "low" | "medium" | "high" | "max";

export type LabWikiFrequency = "daily" | "weekly" | "monthly" | "never";

export type LabWikiLanguageCode =
  | "en"
  | "es"
  | "pt"
  | "ja"
  | "zh"
  | "ko"
  | "fr"
  | "de"
  | "ru"
  | "ar"
  | "he"
  | "id";

export type LabWikiEnrolledRepo = {
  repo: string;
  branchesIndexed?: number;
  indexedBranches?: string[];
};

export type LabWikiRepoOverride = {
  effort?: LabWikiEffort | null;
  frequency?: LabWikiFrequency | null;
};

export type LabWikiSettingsRecord = {
  effort: LabWikiEffort;
  frequency: LabWikiFrequency;
  languages: LabWikiLanguageCode[];
  enrolledRepos: LabWikiEnrolledRepo[];
  repoOverrides: Record<string, LabWikiRepoOverride>;
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-wiki-settings";

const ALL_LANGUAGE_CODES: LabWikiLanguageCode[] = [
  "en",
  "es",
  "pt",
  "ja",
  "zh",
  "ko",
  "fr",
  "de",
  "ru",
  "ar",
  "he",
  "id",
];

const DEFAULTS: Omit<LabWikiSettingsRecord, "updatedAt"> = {
  effort: "low",
  frequency: "weekly",
  languages: ["en"],
  enrolledRepos: [],
  repoOverrides: {},
};

function isEffort(v: unknown): v is LabWikiEffort {
  return v === "low" || v === "medium" || v === "high" || v === "max";
}

function isFrequency(v: unknown): v is LabWikiFrequency {
  return v === "daily" || v === "weekly" || v === "monthly" || v === "never";
}

function isLanguageCode(v: unknown): v is LabWikiLanguageCode {
  return typeof v === "string" && (ALL_LANGUAGE_CODES as string[]).includes(v);
}

function coerceLanguages(raw: unknown): LabWikiLanguageCode[] {
  if (!Array.isArray(raw)) return [...DEFAULTS.languages];
  const out: LabWikiLanguageCode[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isLanguageCode(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  if (!out.includes("en")) out.unshift("en");
  return out.length ? out : ["en"];
}

function coerceEnrolledRepos(raw: unknown): LabWikiEnrolledRepo[] {
  if (!Array.isArray(raw)) return [];
  const out: LabWikiEnrolledRepo[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabWikiEnrolledRepo>;
    const repo = typeof row.repo === "string" ? row.repo.trim() : "";
    if (!repo || seen.has(repo)) continue;
    seen.add(repo);
    const branchesIndexed =
      typeof row.branchesIndexed === "number" &&
      Number.isFinite(row.branchesIndexed) &&
      row.branchesIndexed >= 0
        ? Math.floor(row.branchesIndexed)
        : undefined;
    const indexedBranches = Array.isArray(row.indexedBranches)
      ? row.indexedBranches
          .filter((branch): branch is string => typeof branch === "string")
          .map((branch) => branch.trim())
          .filter(Boolean)
      : undefined;
    const uniqueBranches = indexedBranches ? [...new Set(indexedBranches)] : undefined;
    out.push({
      repo,
      ...(branchesIndexed !== undefined ? { branchesIndexed } : {}),
      ...(uniqueBranches !== undefined ? { indexedBranches: uniqueBranches } : {}),
    });
  }
  return out;
}

function coerceRepoOverrides(raw: unknown): Record<string, LabWikiRepoOverride> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, LabWikiRepoOverride> = {};
  for (const [repo, value] of Object.entries(raw)) {
    const key = repo.trim();
    if (!key || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const row = value as Partial<LabWikiRepoOverride>;
    out[key] = {
      effort: row.effort === null || isEffort(row.effort) ? row.effort : null,
      frequency: row.frequency === null || isFrequency(row.frequency) ? row.frequency : null,
    };
  }
  return out;
}

function mergeRecord(
  existing: Omit<LabWikiSettingsRecord, "updatedAt"> | undefined,
  partial: Partial<Omit<LabWikiSettingsRecord, "updatedAt">>,
): LabWikiSettingsRecord {
  const base = existing ?? DEFAULTS;
  return {
    effort: isEffort(partial.effort) ? partial.effort : base.effort,
    frequency: isFrequency(partial.frequency) ? partial.frequency : base.frequency,
    languages:
      partial.languages !== undefined ? coerceLanguages(partial.languages) : base.languages,
    enrolledRepos:
      partial.enrolledRepos !== undefined
        ? coerceEnrolledRepos(partial.enrolledRepos)
        : base.enrolledRepos,
    repoOverrides:
      partial.repoOverrides !== undefined
        ? coerceRepoOverrides(partial.repoOverrides)
        : coerceRepoOverrides(base.repoOverrides),
    updatedAt: new Date().toISOString(),
  };
}

export async function getLabWikiSettings(orgId: string): Promise<LabWikiSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => mergeRecord(raw as Omit<LabWikiSettingsRecord, "updatedAt"> | undefined, {}),
  );
}

export async function patchLabWikiSettings(
  orgId: string,
  partial: Partial<Omit<LabWikiSettingsRecord, "updatedAt">>,
): Promise<LabWikiSettingsRecord> {
  const current = await getLabWikiSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}
