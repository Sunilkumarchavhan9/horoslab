/**
 * Local preferences for MemoryOS memory injection on Ask / Sessions home.
 */

export type AskMemoryPreferences = {
  injectResumeBrief: boolean;
  useCompanyMemory: boolean;
};

const STORAGE_KEY = "memoryos.continuity-lab.ask-memory";

const DEFAULTS: AskMemoryPreferences = {
  injectResumeBrief: true,
  useCompanyMemory: true,
};

export function readAskMemoryPreferences(): AskMemoryPreferences {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AskMemoryPreferences>;
    return {
      injectResumeBrief: parsed.injectResumeBrief !== false,
      useCompanyMemory: parsed.useCompanyMemory !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAskMemoryPreferences(partial: Partial<AskMemoryPreferences>): AskMemoryPreferences {
  const next = { ...readAskMemoryPreferences(), ...partial };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
