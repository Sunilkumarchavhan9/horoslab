/**
 * Devin-style "Auto-approve child sessions" — UI preference until runtime wiring exists.
 */

const STORAGE_KEY = "memoryos.continuity-lab.auto-approve-child-sessions";

export function readAutoApproveChildSessions(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAutoApproveChildSessions(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}
