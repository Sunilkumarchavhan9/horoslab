export type AskAgentType = "agent" | "continuity";

const STORAGE_KEY = "memoryos.continuity-lab.ask-agent";

export function readAskAgentType(): AskAgentType {
  if (typeof window === "undefined") return "agent";
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  return value === "continuity" ? "continuity" : "agent";
}

export function saveAskAgentType(type: AskAgentType): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, type);
}
