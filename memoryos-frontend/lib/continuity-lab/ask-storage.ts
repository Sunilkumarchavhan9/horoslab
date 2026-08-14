/**
 * Session persistence for Continuity Lab Ask page (repo, branch, mode).
 */

export type AskMode = "auto" | "qa" | "plan";

export type AskStorageState = {
  repos: string[];
  branch: string;
  mode: AskMode;
  deep: boolean;
};

const STORAGE_KEY = "memoryos.continuity-lab.ask";

const DEFAULT_STATE: AskStorageState = {
  repos: [],
  branch: "main",
  mode: "auto",
  deep: false,
};

export function readAskStorage(): AskStorageState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<AskStorageState>;
    return {
      repos: Array.isArray(parsed.repos)
        ? parsed.repos.filter((r): r is string => typeof r === "string" && r.includes("/"))
        : [],
      branch: typeof parsed.branch === "string" && parsed.branch.trim() ? parsed.branch.trim() : "main",
      mode:
        parsed.mode === "qa" || parsed.mode === "plan" || parsed.mode === "auto"
          ? parsed.mode
          : "auto",
      deep: parsed.deep === true,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveAskStorage(partial: Partial<AskStorageState>): AskStorageState {
  const next = { ...readAskStorage(), ...partial };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
