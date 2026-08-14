/**
 * Session-scoped pending understanding check (shown as amber bar on session page).
 */

const PENDING_KEY = "memoryos.continuity-lab.pending-understanding";

export type PendingUnderstanding = {
  sessionId: string;
  text: string;
};

export function setPendingUnderstanding(pending: PendingUnderstanding): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function readPendingUnderstanding(sessionId: string): PendingUnderstanding | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingUnderstanding;
    if (parsed?.sessionId !== sessionId || !parsed.text?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingUnderstanding(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_KEY);
}
