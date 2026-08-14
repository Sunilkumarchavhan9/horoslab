import type { LabEnvironmentSettings } from "@/lib/continuity-lab/lab-environment-settings-storage";

export const LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT =
  "memoryos:lab-environment-settings-changed";

export type LabEnvironmentSettingsChangedDetail = {
  settings: LabEnvironmentSettings;
  orgId?: string;
  updatedAt?: string;
};

export function broadcastLabEnvironmentSettingsChanged(
  detail: LabEnvironmentSettingsChangedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LAB_ENVIRONMENT_SETTINGS_CHANGED_EVENT, { detail }),
  );
}
