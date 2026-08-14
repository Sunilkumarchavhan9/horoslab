export type PlaygroundSettings = {
  apiOrigin: string;
  workspace: string;
  project: string;
  threadId: string;
  /** P2.3 product agent preset */
  productAgentId?: string;
  productAgentSessionId?: string;
};

const STORAGE_KEY = "memoryos.playground.settings";

export function readPlaygroundSettings(): Partial<PlaygroundSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PlaygroundSettings>;
  } catch {
    return null;
  }
}

export function writePlaygroundSettings(settings: PlaygroundSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearPlaygroundSettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
