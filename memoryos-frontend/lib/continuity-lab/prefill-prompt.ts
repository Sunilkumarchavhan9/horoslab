const PREFILL_KEY = "memoryos.continuity-lab.prefill-prompt";

export function savePrefillPrompt(prompt: string): void {
  if (typeof window === "undefined") return;
  const trimmed = prompt.trim();
  if (!trimmed) return;
  window.sessionStorage.setItem(PREFILL_KEY, trimmed);
}

export function readPrefillPrompt(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(PREFILL_KEY);
  if (!value?.trim()) return null;
  window.sessionStorage.removeItem(PREFILL_KEY);
  return value.trim();
}
