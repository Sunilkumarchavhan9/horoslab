"use client";

import { broadcastLabReviewSettingsChanged } from "@/lib/continuity-lab/lab-review-settings-events";

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

export type LabReviewSettings = {
  addReviewLinkInPrDescription: boolean;
  postCommentsBugs: boolean;
  postCommentsFlagsInvestigate: boolean;
  postCommentsFlagsNote: boolean;
  postGithubCiChecks: boolean;
  enrolledRepos: LabReviewEnrolledRepo[];
  enrolledUsers: LabReviewEnrolledUser[];
  ruleFiles: LabReviewRuleFile[];
};

const STORAGE_KEY = "memoryos-lab-review-settings";

export const DEFAULT_REVIEW_RULE_FILE: LabReviewRuleFile = {
  id: "default-review-md",
  glob: "/REVIEW.md",
  isDefault: true,
};

const DEFAULTS: LabReviewSettings = {
  addReviewLinkInPrDescription: true,
  postCommentsBugs: true,
  postCommentsFlagsInvestigate: false,
  postCommentsFlagsNote: false,
  postGithubCiChecks: false,
  enrolledRepos: [],
  enrolledUsers: [],
  ruleFiles: [DEFAULT_REVIEW_RULE_FILE],
};

function mergeParsed(parsed: Partial<LabReviewSettings>): LabReviewSettings {
  const ruleFiles = Array.isArray(parsed.ruleFiles)
    ? [
        DEFAULT_REVIEW_RULE_FILE,
        ...parsed.ruleFiles.filter((f) => f && !f.isDefault && f.glob !== DEFAULT_REVIEW_RULE_FILE.glob),
      ]
    : DEFAULTS.ruleFiles;
  return {
    addReviewLinkInPrDescription:
      typeof parsed.addReviewLinkInPrDescription === "boolean"
        ? parsed.addReviewLinkInPrDescription
        : DEFAULTS.addReviewLinkInPrDescription,
    postCommentsBugs:
      typeof parsed.postCommentsBugs === "boolean"
        ? parsed.postCommentsBugs
        : DEFAULTS.postCommentsBugs,
    postCommentsFlagsInvestigate:
      typeof parsed.postCommentsFlagsInvestigate === "boolean"
        ? parsed.postCommentsFlagsInvestigate
        : DEFAULTS.postCommentsFlagsInvestigate,
    postCommentsFlagsNote:
      typeof parsed.postCommentsFlagsNote === "boolean"
        ? parsed.postCommentsFlagsNote
        : DEFAULTS.postCommentsFlagsNote,
    postGithubCiChecks:
      typeof parsed.postGithubCiChecks === "boolean"
        ? parsed.postGithubCiChecks
        : DEFAULTS.postGithubCiChecks,
    enrolledRepos: Array.isArray(parsed.enrolledRepos) ? parsed.enrolledRepos : [],
    enrolledUsers: Array.isArray(parsed.enrolledUsers) ? parsed.enrolledUsers : [],
    ruleFiles,
  };
}

export function readLabReviewSettings(): LabReviewSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return mergeParsed(JSON.parse(raw) as Partial<LabReviewSettings>);
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveLabReviewSettings(
  partial: Partial<LabReviewSettings>,
  options?: { broadcast?: boolean },
): LabReviewSettings {
  const next = mergeParsed({ ...readLabReviewSettings(), ...partial });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (options?.broadcast !== false) {
      broadcastLabReviewSettingsChanged({ settings: next });
    }
  }
  return next;
}
