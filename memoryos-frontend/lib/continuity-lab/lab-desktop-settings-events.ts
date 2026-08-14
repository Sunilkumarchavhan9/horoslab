import type { LabDesktopSettings } from "@/lib/continuity-lab/lab-desktop-settings-storage";

export const LAB_DESKTOP_SETTINGS_CHANGED_EVENT = "memoryos:lab-desktop-settings-changed";

export type LabDesktopSettingsChangedDetail = {
  settings: LabDesktopSettings;
  orgId?: string;
  updatedAt?: string;
};

export function broadcastLabDesktopSettingsChanged(
  detail: LabDesktopSettingsChangedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LabDesktopSettingsChangedDetail>(LAB_DESKTOP_SETTINGS_CHANGED_EVENT, {
      detail,
    }),
  );
}
