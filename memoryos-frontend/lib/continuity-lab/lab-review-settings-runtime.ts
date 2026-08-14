import type { LabPreferences, ReviewTriggerPreference } from "@/lib/continuity-lab/lab-preferences-storage";
import { readLabPreferences } from "@/lib/continuity-lab/lab-preferences-storage";
import {
  mergeLabPreferencesWithOrgPrSettings,
  readOrgContinuityLabSettingsSnapshot,
} from "@/lib/continuity-lab/lab-continuity-lab-settings-runtime";
import {
  readLabReviewSettings,
  type LabReviewEnrollMode,
  type LabReviewSettings,
} from "@/lib/continuity-lab/lab-review-settings-storage";

export function readOrgReviewSettingsSnapshot(): LabReviewSettings {
  return readLabReviewSettings();
}

/**
 * Combines org enrollment mode with per-user lab preferences (and org PR bot gate).
 */
export function resolveReviewTriggerForEnrollment(
  enrollMode: LabReviewEnrollMode,
  userPrefs?: LabPreferences,
): ReviewTriggerPreference {
  const prefs =
    userPrefs ??
    mergeLabPreferencesWithOrgPrSettings(
      readLabPreferences(),
      readOrgContinuityLabSettingsSnapshot(),
    );
  if (enrollMode === "on_pr_creation") return "on_pr_open";
  if (enrollMode === "auto_review") {
    return prefs.reviewTrigger === "manual" ? "on_push" : prefs.reviewTrigger;
  }
  return prefs.reviewTrigger;
}

export function buildReviewExecutionHints(settings: LabReviewSettings): string[] {
  const hints: string[] = [];
  if (!settings.postCommentsBugs) {
    hints.push("Do not post bug-class findings as PR comments.");
  }
  if (!settings.postCommentsFlagsInvestigate) {
    hints.push("Do not post investigate flags as PR comments.");
  }
  if (!settings.postCommentsFlagsNote) {
    hints.push("Do not post informational flags as PR comments.");
  }
  if (settings.addReviewLinkInPrDescription) {
    hints.push("Include a MemoryOS Review control-plane link in the PR description when applicable.");
  }
  if (settings.postGithubCiChecks) {
    hints.push("Publish a GitHub commit status check summarizing review results when possible.");
  }
  const globs = settings.ruleFiles.map((f) => f.glob).filter(Boolean);
  if (globs.length > 0) {
    hints.push(`Consult rule files matching: ${globs.join(", ")}`);
  }
  return hints;
}
