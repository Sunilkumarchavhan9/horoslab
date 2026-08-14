import {
  readScopedSetting,
  userScopedSettingsIdentity,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type ThemePreference = "light" | "dark" | "system";
export type ReviewTriggerPreference = "manual" | "on_pr_open" | "on_push";

export type LabPreferencesRecord = {
  theme: ThemePreference;
  displayName: string;
  inAppNotifications: boolean;
  playSound: boolean;
  browserNotificationsEnabled: boolean;
  slackNotifications: boolean;
  newsletter: boolean;
  gitCommitAuthor: string;
  gitCommitEmail: string;
  openPullRequestsAsDrafts: boolean;
  reviewTrigger: ReviewTriggerPreference;
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-preferences";

const DEFAULTS: Omit<LabPreferencesRecord, "updatedAt"> = {
  theme: "system",
  displayName: "",
  inAppNotifications: true,
  playSound: true,
  browserNotificationsEnabled: false,
  slackNotifications: false,
  newsletter: false,
  gitCommitAuthor: "",
  gitCommitEmail: "",
  openPullRequestsAsDrafts: false,
  reviewTrigger: "manual",
};

function coerceTheme(value: unknown): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") return value;
  return DEFAULTS.theme;
}

function coerceReviewTrigger(value: unknown): ReviewTriggerPreference {
  if (value === "manual" || value === "on_pr_open" || value === "on_push") return value;
  return DEFAULTS.reviewTrigger;
}

function mergeRecord(
  existing: LabPreferencesRecord | undefined,
  partial: Partial<LabPreferencesRecord>,
): LabPreferencesRecord {
  const base = existing ?? { ...DEFAULTS, updatedAt: new Date().toISOString() };
  return {
    theme: partial.theme !== undefined ? coerceTheme(partial.theme) : base.theme,
    displayName:
      partial.displayName !== undefined && typeof partial.displayName === "string"
        ? partial.displayName
        : base.displayName,
    inAppNotifications:
      typeof partial.inAppNotifications === "boolean"
        ? partial.inAppNotifications
        : base.inAppNotifications,
    playSound: typeof partial.playSound === "boolean" ? partial.playSound : base.playSound,
    browserNotificationsEnabled:
      typeof partial.browserNotificationsEnabled === "boolean"
        ? partial.browserNotificationsEnabled
        : base.browserNotificationsEnabled,
    slackNotifications:
      typeof partial.slackNotifications === "boolean"
        ? partial.slackNotifications
        : base.slackNotifications,
    newsletter:
      typeof partial.newsletter === "boolean" ? partial.newsletter : base.newsletter,
    gitCommitAuthor:
      typeof partial.gitCommitAuthor === "string"
        ? partial.gitCommitAuthor
        : base.gitCommitAuthor,
    gitCommitEmail:
      typeof partial.gitCommitEmail === "string" ? partial.gitCommitEmail : base.gitCommitEmail,
    openPullRequestsAsDrafts:
      typeof partial.openPullRequestsAsDrafts === "boolean"
        ? partial.openPullRequestsAsDrafts
        : base.openPullRequestsAsDrafts,
    reviewTrigger:
      partial.reviewTrigger !== undefined
        ? coerceReviewTrigger(partial.reviewTrigger)
        : base.reviewTrigger,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLabPreferences(userId: string): Promise<LabPreferencesRecord> {
  return readScopedSetting(
    userScopedSettingsIdentity(userId, SETTINGS_SECTION),
    (raw) => mergeRecord(raw as LabPreferencesRecord | undefined, {}),
  );
}

export async function patchLabPreferences(
  userId: string,
  partial: Partial<LabPreferencesRecord>,
): Promise<LabPreferencesRecord> {
  const current = await getLabPreferences(userId);
  const next = mergeRecord(current, partial);
  await writeScopedSetting(userScopedSettingsIdentity(userId, SETTINGS_SECTION), next);
  return next;
}
