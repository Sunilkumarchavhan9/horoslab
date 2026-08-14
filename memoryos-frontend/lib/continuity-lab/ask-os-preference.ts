import { readOrgDefaultSandboxOs, readUserDefaultSandboxOs } from "@/lib/continuity-lab/sandbox-os-defaults";

export type AskOsId = "ubuntu" | "windows";

const STORAGE_KEY = "memoryos.continuity-lab.ask-os";

export function readAskOsPreference(): AskOsId {
  if (typeof window === "undefined") return "ubuntu";
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  if (value === "windows" || value === "ubuntu") return value;
  return readOrgDefaultSandboxOs() ?? readUserDefaultSandboxOs();
}

export function saveAskOsPreference(os: AskOsId): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, os);
}
