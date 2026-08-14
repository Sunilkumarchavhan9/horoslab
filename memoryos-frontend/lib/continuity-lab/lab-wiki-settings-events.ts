import type { LabWikiSettings } from "@/lib/continuity-lab/lab-wiki-settings-storage";

export const LAB_WIKI_SETTINGS_CHANGED_EVENT = "memoryos:lab-wiki-settings-changed";

export type LabWikiSettingsChangedDetail = {
  settings: LabWikiSettings;
  orgId?: string;
  updatedAt?: string;
};

export function broadcastLabWikiSettingsChanged(detail: LabWikiSettingsChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LabWikiSettingsChangedDetail>(LAB_WIKI_SETTINGS_CHANGED_EVENT, { detail }),
  );
}
