/**
 * Notion-style "confirm understanding before work" preference for Continuity Lab.
 */

export const CONFIRM_BEFORE_WORK_KEY = "memoryos.continuity-lab.confirmBeforeWork";

export const CONFIRM_BEFORE_WORK_CHANGED = "memoryos:confirm-before-work-changed";

export function readConfirmBeforeWork(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONFIRM_BEFORE_WORK_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveConfirmBeforeWork(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONFIRM_BEFORE_WORK_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new Event(CONFIRM_BEFORE_WORK_CHANGED));
}
