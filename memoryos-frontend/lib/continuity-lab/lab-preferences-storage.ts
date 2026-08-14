"use client";

export type ThemePreference = "light" | "dark" | "system";

export type ReviewTriggerPreference = "manual" | "on_pr_open" | "on_push";

export type LabPreferences = {
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
};

import {
  LAB_PREFERENCES_STORAGE_KEY,
  THEME_PREFERENCE_STORAGE_KEY,
} from "@/lib/continuity-lab/lab-preference-keys";

const STORAGE_KEY = LAB_PREFERENCES_STORAGE_KEY;
const LEGACY_STORAGE_KEY = "memoryos.continuity-lab.user-preferences";
const THEME_STORAGE_KEY = THEME_PREFERENCE_STORAGE_KEY;

const DEFAULTS: LabPreferences = {
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

function readThemeFromLegacy(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

function parsePartial(raw: string): Partial<LabPreferences> | null {
  try {
    return JSON.parse(raw) as Partial<LabPreferences>;
  } catch {
    return null;
  }
}

function coerceTheme(value: unknown): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") return value;
  return readThemeFromLegacy();
}

function coerceReviewTrigger(value: unknown): ReviewTriggerPreference {
  if (value === "manual" || value === "on_pr_open" || value === "on_push") return value;
  return "manual";
}

function mergeParsed(parsed: Partial<LabPreferences>): LabPreferences {
  return {
    theme: coerceTheme(parsed.theme),
    displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
    inAppNotifications:
      typeof parsed.inAppNotifications === "boolean"
        ? parsed.inAppNotifications
        : typeof (parsed as { sessionReminders?: boolean }).sessionReminders === "boolean"
          ? (parsed as { sessionReminders: boolean }).sessionReminders
          : DEFAULTS.inAppNotifications,
    playSound: typeof parsed.playSound === "boolean" ? parsed.playSound : DEFAULTS.playSound,
    browserNotificationsEnabled:
      typeof parsed.browserNotificationsEnabled === "boolean"
        ? parsed.browserNotificationsEnabled
        : DEFAULTS.browserNotificationsEnabled,
    slackNotifications:
      typeof parsed.slackNotifications === "boolean"
        ? parsed.slackNotifications
        : DEFAULTS.slackNotifications,
    newsletter:
      typeof parsed.newsletter === "boolean"
        ? parsed.newsletter
        : typeof (parsed as { emailNotifications?: boolean }).emailNotifications === "boolean"
          ? (parsed as { emailNotifications: boolean }).emailNotifications
          : DEFAULTS.newsletter,
    gitCommitAuthor:
      typeof parsed.gitCommitAuthor === "string" ? parsed.gitCommitAuthor : "",
    gitCommitEmail: typeof parsed.gitCommitEmail === "string" ? parsed.gitCommitEmail : "",
    openPullRequestsAsDrafts: Boolean(parsed.openPullRequestsAsDrafts),
    reviewTrigger: coerceReviewTrigger(parsed.reviewTrigger),
  };
}

export function readLabPreferences(): LabPreferences {
  if (typeof window === "undefined") return { ...DEFAULTS };

  const primary = window.localStorage.getItem(STORAGE_KEY);
  if (primary) {
    const parsed = parsePartial(primary);
    if (parsed) return mergeParsed(parsed);
  }

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) {
    const parsed = parsePartial(legacy);
    if (parsed) return mergeParsed(parsed);
  }

  return { ...DEFAULTS, theme: readThemeFromLegacy() };
}

export function resolveThemePreference(theme: ThemePreference): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function applyThemeToDocument(theme: ThemePreference) {
  if (typeof window === "undefined") return;
  const resolved = resolveThemePreference(theme);
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export const THEME_PREFERENCE_EVENT = "memoryos:theme-preference";

/** Incremented when the user changes theme locally — stale API merges must not overwrite. */
let themePreferenceRevision = 0;

export function getThemePreferenceRevision(): number {
  return themePreferenceRevision;
}

export function saveLabPreferences(partial: Partial<LabPreferences>): LabPreferences {
  const current = readLabPreferences();
  const next = { ...current, ...partial };
  const themeChanged = partial.theme !== undefined && partial.theme !== current.theme;
  if (typeof window !== "undefined") {
    if (themeChanged) {
      themePreferenceRevision += 1;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.localStorage.setItem(THEME_STORAGE_KEY, next.theme);
    applyThemeToDocument(next.theme);
    if (themeChanged) {
      window.dispatchEvent(
        new CustomEvent<ThemePreference>(THEME_PREFERENCE_EVENT, { detail: next.theme }),
      );
    }
  }
  return next;
}
