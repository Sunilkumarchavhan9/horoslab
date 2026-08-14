import { randomUUID } from "crypto";
import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type LabReviewEnrollMode = "auto_review" | "on_pr_creation";

export type LabReviewEnrolledRepo = {
  repo: string;
  mode: LabReviewEnrollMode;
};

export type LabReviewEnrolledUser = {
  id: string;
  displayName?: string;
  email?: string;
};

export type LabReviewRuleFile = {
  id: string;
  glob: string;
  isDefault?: boolean;
};

export type LabReviewSettingsRecord = {
  addReviewLinkInPrDescription: boolean;
  postCommentsBugs: boolean;
  postCommentsFlagsInvestigate: boolean;
  postCommentsFlagsNote: boolean;
  postGithubCiChecks: boolean;
  enrolledRepos: LabReviewEnrolledRepo[];
  enrolledUsers: LabReviewEnrolledUser[];
  ruleFiles: LabReviewRuleFile[];
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-review-settings";

export const DEFAULT_REVIEW_RULE_FILE: LabReviewRuleFile = {
  id: "default-review-md",
  glob: "/REVIEW.md",
  isDefault: true,
};

const DEFAULTS: Omit<LabReviewSettingsRecord, "updatedAt"> = {
  addReviewLinkInPrDescription: true,
  postCommentsBugs: true,
  postCommentsFlagsInvestigate: false,
  postCommentsFlagsNote: false,
  postGithubCiChecks: false,
  enrolledRepos: [],
  enrolledUsers: [],
  ruleFiles: [DEFAULT_REVIEW_RULE_FILE],
};

function isEnrollMode(v: unknown): v is LabReviewEnrollMode {
  return v === "auto_review" || v === "on_pr_creation";
}

function coerceEnrolledRepos(raw: unknown): LabReviewEnrolledRepo[] {
  if (!Array.isArray(raw)) return [];
  const out: LabReviewEnrolledRepo[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabReviewEnrolledRepo>;
    const repo = typeof row.repo === "string" ? row.repo.trim() : "";
    if (!repo || seen.has(repo)) continue;
    seen.add(repo);
    out.push({
      repo,
      mode: isEnrollMode(row.mode) ? row.mode : "auto_review",
    });
  }
  return out;
}

function coerceEnrolledUsers(raw: unknown): LabReviewEnrolledUser[] {
  if (!Array.isArray(raw)) return [];
  const out: LabReviewEnrolledUser[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LabReviewEnrolledUser>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      displayName:
        typeof row.displayName === "string" && row.displayName.trim()
          ? row.displayName.trim()
          : undefined,
      email:
        typeof row.email === "string" && row.email.trim() ? row.email.trim() : undefined,
    });
  }
  return out;
}

function coerceRuleFiles(raw: unknown): LabReviewRuleFile[] {
  const custom: LabReviewRuleFile[] = [];
  if (Array.isArray(raw)) {
    const seen = new Set<string>();
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Partial<LabReviewRuleFile>;
      const glob = typeof row.glob === "string" ? row.glob.trim() : "";
      if (!glob || row.isDefault === true || glob === DEFAULT_REVIEW_RULE_FILE.glob) continue;
      if (seen.has(glob)) continue;
      seen.add(glob);
      custom.push({
        id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : randomUUID(),
        glob,
      });
    }
  }
  return [DEFAULT_REVIEW_RULE_FILE, ...custom];
}

function mergeRecord(
  existing: Omit<LabReviewSettingsRecord, "updatedAt"> | undefined,
  partial: Partial<Omit<LabReviewSettingsRecord, "updatedAt">>,
): LabReviewSettingsRecord {
  const base = existing ?? DEFAULTS;
  return {
    addReviewLinkInPrDescription:
      typeof partial.addReviewLinkInPrDescription === "boolean"
        ? partial.addReviewLinkInPrDescription
        : base.addReviewLinkInPrDescription,
    postCommentsBugs:
      typeof partial.postCommentsBugs === "boolean"
        ? partial.postCommentsBugs
        : base.postCommentsBugs,
    postCommentsFlagsInvestigate:
      typeof partial.postCommentsFlagsInvestigate === "boolean"
        ? partial.postCommentsFlagsInvestigate
        : base.postCommentsFlagsInvestigate,
    postCommentsFlagsNote:
      typeof partial.postCommentsFlagsNote === "boolean"
        ? partial.postCommentsFlagsNote
        : base.postCommentsFlagsNote,
    postGithubCiChecks:
      typeof partial.postGithubCiChecks === "boolean"
        ? partial.postGithubCiChecks
        : base.postGithubCiChecks,
    enrolledRepos:
      partial.enrolledRepos !== undefined
        ? coerceEnrolledRepos(partial.enrolledRepos)
        : base.enrolledRepos,
    enrolledUsers:
      partial.enrolledUsers !== undefined
        ? coerceEnrolledUsers(partial.enrolledUsers)
        : base.enrolledUsers,
    ruleFiles:
      partial.ruleFiles !== undefined ? coerceRuleFiles(partial.ruleFiles) : base.ruleFiles,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLabReviewSettings(orgId: string): Promise<LabReviewSettingsRecord> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    (raw) => mergeRecord(raw as Omit<LabReviewSettingsRecord, "updatedAt"> | undefined, {}),
  );
}

export async function patchLabReviewSettings(
  orgId: string,
  partial: Partial<Omit<LabReviewSettingsRecord, "updatedAt">>,
): Promise<LabReviewSettingsRecord> {
  const current = await getLabReviewSettings(orgId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), next);
  return next;
}
