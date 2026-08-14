"use client";

import {
  readLabPreferences,
  saveLabPreferences,
  type LabPreferences,
  type ThemePreference,
} from "@/lib/continuity-lab/lab-preferences-storage";

export type { ThemePreference };

/** @deprecated Use LabPreferences — kept for older call sites. */
export type UserPreferences = {
  theme: ThemePreference;
  emailNotifications: boolean;
  sessionReminders: boolean;
  displayName: string;
};

function toUserPreferences(lab: LabPreferences): UserPreferences {
  return {
    theme: lab.theme,
    displayName: lab.displayName,
    emailNotifications: lab.newsletter,
    sessionReminders: lab.inAppNotifications,
  };
}

export function readUserPreferences(): UserPreferences {
  return toUserPreferences(readLabPreferences());
}

export function saveUserPreferences(partial: Partial<UserPreferences>): UserPreferences {
  const labPartial: Partial<LabPreferences> = {};
  if (partial.theme !== undefined) labPartial.theme = partial.theme;
  if (partial.displayName !== undefined) labPartial.displayName = partial.displayName;
  if (partial.emailNotifications !== undefined) labPartial.newsletter = partial.emailNotifications;
  if (partial.sessionReminders !== undefined) labPartial.inAppNotifications = partial.sessionReminders;
  return toUserPreferences(saveLabPreferences(labPartial));
}
