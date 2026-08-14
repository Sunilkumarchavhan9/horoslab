"use client";

import { broadcastLabSkillsRulesSettingsChanged } from "@/lib/continuity-lab/lab-skills-rules-settings-events";

export type SkillsRulesRepoCompileStats = {
  lastCompiledAt: string;
  memoryCount: number;
};

export type LabSkillsRulesSettings = {
  enrolledRepos: string[];
  autoCompileEnabled?: boolean;
  lastCompiledAt?: string | null;
  compileStatsByRepo?: Record<string, SkillsRulesRepoCompileStats>;
};

export type SkillsRulesCompileResult = {
  orgId: string;
  repos: string[];
  compiledAt: string;
  memoryCount: number;
  skipped: number;
  errors: Array<{ repo: string; path: string; error: string }>;
  statsByRepo: Record<string, SkillsRulesRepoCompileStats>;
};

const STORAGE_KEY = "memoryos-lab-skills-rules-settings";

const DEFAULTS: LabSkillsRulesSettings = {
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

function mergeParsed(parsed: Partial<LabSkillsRulesSettings>): LabSkillsRulesSettings {
  return {
    enrolledRepos:
      parsed.enrolledRepos !== undefined
        ? coerceEnrolledRepos(parsed.enrolledRepos)
        : DEFAULTS.enrolledRepos,
    autoCompileEnabled:
      parsed.autoCompileEnabled !== undefined
        ? Boolean(parsed.autoCompileEnabled)
        : DEFAULTS.autoCompileEnabled,
    lastCompiledAt:
      parsed.lastCompiledAt !== undefined ? parsed.lastCompiledAt : DEFAULTS.lastCompiledAt,
    compileStatsByRepo:
      parsed.compileStatsByRepo !== undefined
        ? parsed.compileStatsByRepo
        : DEFAULTS.compileStatsByRepo,
  };
}

export function readLabSkillsRulesSettings(): LabSkillsRulesSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return mergeParsed(JSON.parse(raw) as Partial<LabSkillsRulesSettings>);
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveLabSkillsRulesSettings(
  partial: Partial<LabSkillsRulesSettings>,
  options?: { broadcast?: boolean },
): LabSkillsRulesSettings {
  const next = mergeParsed({ ...readLabSkillsRulesSettings(), ...partial });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (options?.broadcast !== false) {
      broadcastLabSkillsRulesSettingsChanged({ settings: next });
    }
  }
  return next;
}
