"use client";

import { broadcastLabWikiSettingsChanged } from "@/lib/continuity-lab/lab-wiki-settings-events";

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

export type LabWikiSettings = {
  effort: LabWikiEffort;
  frequency: LabWikiFrequency;
  languages: LabWikiLanguageCode[];
  enrolledRepos: LabWikiEnrolledRepo[];
  repoOverrides: Record<string, LabWikiRepoOverride>;
};

const STORAGE_KEY = "memoryos-lab-wiki-settings";

export const WIKI_LANGUAGE_OPTIONS: Array<{ code: LabWikiLanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ru", label: "Russian" },
  { code: "ar", label: "Arabic" },
  { code: "he", label: "Hebrew" },
  { code: "id", label: "Indonesian" },
];

export const WIKI_EFFORT_OPTIONS: Array<{ value: LabWikiEffort; label: string; hint: string }> = [
  { value: "low", label: "Low", hint: "Free / fast" },
  { value: "medium", label: "Medium", hint: "$10–20" },
  { value: "high", label: "High", hint: "$40–80" },
  { value: "max", label: "Max", hint: "Contact team" },
];

export const WIKI_FREQUENCY_OPTIONS: Array<{ value: LabWikiFrequency; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "never", label: "Never" },
];

const ALL_LANGUAGE_CODES = WIKI_LANGUAGE_OPTIONS.map((o) => o.code);

const DEFAULTS: LabWikiSettings = {
  effort: "low",
  frequency: "weekly",
  languages: ["en"],
  enrolledRepos: [],
  repoOverrides: {},
};

export function defaultLabWikiSettings(): LabWikiSettings {
  return {
    effort: DEFAULTS.effort,
    frequency: DEFAULTS.frequency,
    languages: [...DEFAULTS.languages],
    enrolledRepos: [],
    repoOverrides: {},
  };
}

function isEffort(v: unknown): v is LabWikiEffort {
  return v === "low" || v === "medium" || v === "high" || v === "max";
}

function isFrequency(v: unknown): v is LabWikiFrequency {
  return v === "daily" || v === "weekly" || v === "monthly" || v === "never";
}

function coerceLanguages(raw: unknown): LabWikiLanguageCode[] {
  if (!Array.isArray(raw)) return [...DEFAULTS.languages];
  const out: LabWikiLanguageCode[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string" || !ALL_LANGUAGE_CODES.includes(item as LabWikiLanguageCode)) {
      continue;
    }
    const code = item as LabWikiLanguageCode;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
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

function mergeParsed(parsed: Partial<LabWikiSettings>): LabWikiSettings {
  return {
    effort: isEffort(parsed.effort) ? parsed.effort : DEFAULTS.effort,
    frequency: isFrequency(parsed.frequency) ? parsed.frequency : DEFAULTS.frequency,
    languages: coerceLanguages(parsed.languages),
    enrolledRepos: coerceEnrolledRepos(parsed.enrolledRepos),
    repoOverrides: coerceRepoOverrides(parsed.repoOverrides),
  };
}

export function readLabWikiSettings(): LabWikiSettings {
  if (typeof window === "undefined") return defaultLabWikiSettings();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLabWikiSettings();
    return mergeParsed(JSON.parse(raw) as Partial<LabWikiSettings>);
  } catch {
    return defaultLabWikiSettings();
  }
}

export function saveLabWikiSettings(
  partial: Partial<LabWikiSettings>,
  options?: { broadcast?: boolean },
): LabWikiSettings {
  const next = mergeParsed({ ...readLabWikiSettings(), ...partial });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (options?.broadcast !== false) {
      broadcastLabWikiSettingsChanged({ settings: next });
    }
  }
  return next;
}
