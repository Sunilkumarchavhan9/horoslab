"use client";

export type ProfileLanguagePreference = "en" | "es" | "fr";

export type ProfileTimezonePreference = "UTC" | "America/New_York" | "Asia/Kolkata";

export type ProfilePreferences = {
  language: ProfileLanguagePreference;
  timezone: ProfileTimezonePreference;
};

const STORAGE_KEY = "memoryos-profile-preferences";
const LANGUAGE_EVENT = "memoryos:profile-language";
const TIMEZONE_EVENT = "memoryos:profile-timezone";

const DEFAULTS: ProfilePreferences = {
  language: "en",
  timezone: "UTC",
};

function coerceLanguage(value: unknown): ProfileLanguagePreference {
  if (value === "en" || value === "es" || value === "fr") return value;
  return DEFAULTS.language;
}

function coerceTimezone(value: unknown): ProfileTimezonePreference {
  if (value === "UTC" || value === "America/New_York" || value === "Asia/Kolkata") return value;
  return DEFAULTS.timezone;
}

function parse(raw: string): Partial<ProfilePreferences> | null {
  try {
    return JSON.parse(raw) as Partial<ProfilePreferences>;
  } catch {
    return null;
  }
}

export function applyProfilePreferencesToDocument(preferences: ProfilePreferences) {
  if (typeof window === "undefined") return;
  document.documentElement.lang = preferences.language;
  document.documentElement.dataset.locale = preferences.language;
  document.documentElement.dataset.timezone = preferences.timezone;
}

export function readProfilePreferences(): ProfilePreferences {
  if (typeof window === "undefined") return { ...DEFAULTS };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULTS };
  const parsed = parse(raw);
  if (!parsed) return { ...DEFAULTS };
  return {
    language: coerceLanguage(parsed.language),
    timezone: coerceTimezone(parsed.timezone),
  };
}

export const PROFILE_LANGUAGE_EVENT = LANGUAGE_EVENT;
export const PROFILE_TIMEZONE_EVENT = TIMEZONE_EVENT;

let profilePreferenceRevision = 0;

export function getProfilePreferencesRevision(): number {
  return profilePreferenceRevision;
}

export function saveProfilePreferences(partial: Partial<ProfilePreferences>): ProfilePreferences {
  const current = readProfilePreferences();
  const next = { ...current, ...partial };
  const languageChanged = partial.language !== undefined && partial.language !== current.language;
  const timezoneChanged = partial.timezone !== undefined && partial.timezone !== current.timezone;
  if (typeof window !== "undefined") {
    if (languageChanged || timezoneChanged) {
      profilePreferenceRevision += 1;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyProfilePreferencesToDocument(next);
    if (languageChanged) {
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: next.language }));
    }
    if (timezoneChanged) {
      window.dispatchEvent(new CustomEvent(TIMEZONE_EVENT, { detail: next.timezone }));
    }
  }
  return next;
}
