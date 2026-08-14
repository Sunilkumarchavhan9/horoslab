"use client";

import {
  DEFAULT_SESSIONS_DISPLAY_PREFS,
  type SessionsDisplayPrefs,
  type SessionsDisplayProperty,
  type SessionsGrouping,
  type SessionsSortBy,
  type SessionsSortDirection,
  type SessionsViewMode,
} from "@/lib/continuity-lab/sessions-display-prefs";

export const LAB_SESSIONS_SETTINGS_STORAGE_KEY = "memoryos-lab-sessions-settings";

/** @deprecated — migrated into {@link LAB_SESSIONS_SETTINGS_STORAGE_KEY}. */
const LEGACY_DISPLAY_KEY = "continuity-lab-sessions-display";

export type SessionsArchivedFilter = "all" | "archived" | "not_archived";

export type SessionsFilterPrefs = {
  creators: string[];
  archivedStatus: SessionsArchivedFilter;
  /** ISO date `YYYY-MM-DD` — session updated on or after this day (local). */
  updatedAfter: string | null;
  /** ISO date `YYYY-MM-DD` — session updated on or before this day (local). */
  updatedBefore: string | null;
};

export type LabSessionsSettings = {
  display: SessionsDisplayPrefs;
  filters: SessionsFilterPrefs;
  defaultFilters: SessionsFilterPrefs | null;
  focusModeByDefault: boolean;
};

export const DEFAULT_SESSIONS_FILTERS: SessionsFilterPrefs = {
  creators: [],
  archivedStatus: "all",
  updatedAfter: null,
  updatedBefore: null,
};

export const DEFAULT_LAB_SESSIONS_SETTINGS: LabSessionsSettings = {
  display: DEFAULT_SESSIONS_DISPLAY_PREFS,
  filters: DEFAULT_SESSIONS_FILTERS,
  defaultFilters: null,
  focusModeByDefault: false,
};

const ALL_PROPERTIES: SessionsDisplayProperty[] = [
  "prs",
  "created",
  "updated",
  "user",
  "tags",
  "playbook",
];

function isSortBy(v: unknown): v is SessionsSortBy {
  return v === "updated" || v === "created";
}

function isDirection(v: unknown): v is SessionsSortDirection {
  return v === "newest" || v === "oldest";
}

function isGrouping(v: unknown): v is SessionsGrouping {
  return v === "by_status" || v === "none";
}

function isView(v: unknown): v is SessionsViewMode {
  return v === "flat" || v === "tree";
}

function isArchivedFilter(v: unknown): v is SessionsArchivedFilter {
  return v === "all" || v === "archived" || v === "not_archived";
}

function parseDisplay(raw: unknown): SessionsDisplayPrefs {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<SessionsDisplayPrefs>;
  const props = Array.isArray(parsed.displayProperties)
    ? parsed.displayProperties.filter((p): p is SessionsDisplayProperty =>
        ALL_PROPERTIES.includes(p as SessionsDisplayProperty),
      )
    : DEFAULT_SESSIONS_DISPLAY_PREFS.displayProperties;
  return {
    sortBy: isSortBy(parsed.sortBy) ? parsed.sortBy : DEFAULT_SESSIONS_DISPLAY_PREFS.sortBy,
    direction: isDirection(parsed.direction)
      ? parsed.direction
      : DEFAULT_SESSIONS_DISPLAY_PREFS.direction,
    grouping: isGrouping(parsed.grouping)
      ? parsed.grouping
      : DEFAULT_SESSIONS_DISPLAY_PREFS.grouping,
    view: isView(parsed.view) ? parsed.view : DEFAULT_SESSIONS_DISPLAY_PREFS.view,
    displayProperties:
      props.length > 0 ? props : DEFAULT_SESSIONS_DISPLAY_PREFS.displayProperties,
  };
}

function parseFilters(raw: unknown): SessionsFilterPrefs {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<SessionsFilterPrefs>;
  const creators = Array.isArray(parsed.creators)
    ? parsed.creators.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];
  return {
    creators,
    archivedStatus: isArchivedFilter(parsed.archivedStatus)
      ? parsed.archivedStatus
      : DEFAULT_SESSIONS_FILTERS.archivedStatus,
    updatedAfter:
      typeof parsed.updatedAfter === "string" && parsed.updatedAfter.trim()
        ? parsed.updatedAfter.trim()
        : null,
    updatedBefore:
      typeof parsed.updatedBefore === "string" && parsed.updatedBefore.trim()
        ? parsed.updatedBefore.trim()
        : null,
  };
}

function readLegacyDisplay(): SessionsDisplayPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_DISPLAY_KEY);
    if (!raw) return null;
    return parseDisplay(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function readLabSessionsSettings(): LabSessionsSettings {
  if (typeof window === "undefined") return DEFAULT_LAB_SESSIONS_SETTINGS;
  try {
    const raw = window.localStorage.getItem(LAB_SESSIONS_SETTINGS_STORAGE_KEY);
    if (!raw) {
      const legacyDisplay = readLegacyDisplay();
      if (!legacyDisplay) return DEFAULT_LAB_SESSIONS_SETTINGS;
      return {
        display: legacyDisplay,
        filters: DEFAULT_SESSIONS_FILTERS,
        defaultFilters: null,
        focusModeByDefault: DEFAULT_LAB_SESSIONS_SETTINGS.focusModeByDefault,
      };
    }
    const parsed = JSON.parse(raw) as Partial<LabSessionsSettings>;
    return {
      display: parseDisplay(parsed.display),
      filters: parseFilters(parsed.filters),
      defaultFilters: parsed.defaultFilters ? parseFilters(parsed.defaultFilters) : null,
      focusModeByDefault:
        typeof parsed.focusModeByDefault === "boolean"
          ? parsed.focusModeByDefault
          : DEFAULT_LAB_SESSIONS_SETTINGS.focusModeByDefault,
    };
  } catch {
    return DEFAULT_LAB_SESSIONS_SETTINGS;
  }
}

export function writeLabSessionsSettings(settings: LabSessionsSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAB_SESSIONS_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function patchLabSessionsSettings(
  patch: Partial<Pick<LabSessionsSettings, "display" | "filters" | "defaultFilters" | "focusModeByDefault">>,
): LabSessionsSettings {
  const current = readLabSessionsSettings();
  const next: LabSessionsSettings = {
    display: patch.display ?? current.display,
    filters: patch.filters ?? current.filters,
    defaultFilters:
      patch.defaultFilters !== undefined ? patch.defaultFilters : current.defaultFilters,
    focusModeByDefault:
      typeof patch.focusModeByDefault === "boolean"
        ? patch.focusModeByDefault
        : current.focusModeByDefault,
  };
  writeLabSessionsSettings(next);
  return next;
}

export function readSessionsDisplayPrefs(): SessionsDisplayPrefs {
  return readLabSessionsSettings().display;
}

export function writeSessionsDisplayPrefs(prefs: SessionsDisplayPrefs): void {
  patchLabSessionsSettings({ display: prefs });
}
