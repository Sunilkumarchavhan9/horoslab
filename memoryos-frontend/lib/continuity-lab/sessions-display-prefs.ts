export type SessionsSortBy = "updated" | "created";
export type SessionsSortDirection = "newest" | "oldest";
export type SessionsGrouping = "by_status" | "none";
export type SessionsViewMode = "flat" | "tree";

export type SessionsDisplayProperty =
  | "prs"
  | "created"
  | "updated"
  | "user"
  | "tags"
  | "playbook";

export type SessionsDisplayPrefs = {
  sortBy: SessionsSortBy;
  direction: SessionsSortDirection;
  grouping: SessionsGrouping;
  view: SessionsViewMode;
  displayProperties: SessionsDisplayProperty[];
};

export const DEFAULT_SESSIONS_DISPLAY_PREFS: SessionsDisplayPrefs = {
  sortBy: "updated",
  direction: "newest",
  grouping: "by_status",
  view: "tree",
  displayProperties: ["prs", "created", "updated", "user", "tags", "playbook"],
};

/** @deprecated Use {@link LAB_SESSIONS_SETTINGS_STORAGE_KEY} in sessions-settings-storage. */
export const SESSIONS_DISPLAY_STORAGE_KEY = "continuity-lab-sessions-display";

export function buildSessionsListHref(automationName?: string | null): string {
  const name = automationName?.trim();
  if (!name) return "/continuity-lab/sessions";
  return `/continuity-lab/sessions?automation=${encodeURIComponent(name)}`;
}

/** Match automation runs — same needle as automation create run history chart. */
export function sessionMatchesAutomation(
  session: { title: string },
  automationName: string,
): boolean {
  const name = automationName.trim();
  if (!name) return true;
  const title = session.title.toLowerCase();
  const needle = `automation: ${name.toLowerCase()}`;
  return title.includes(needle);
}
