import type { LabContinuityLabSettings, LabSlashCommand } from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";

export const LAB_CONTINUITY_LAB_SETTINGS_CHANGED_EVENT =
  "memoryos:lab-continuity-lab-settings-changed";

export type LabContinuityLabSettingsChangedDetail = {
  settings: LabContinuityLabSettings;
  commands: LabSlashCommand[];
  orgId?: string;
  updatedAt?: string;
};

export function broadcastLabContinuityLabSettingsChanged(
  detail: LabContinuityLabSettingsChangedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LabContinuityLabSettingsChangedDetail>(
      LAB_CONTINUITY_LAB_SETTINGS_CHANGED_EVENT,
      { detail },
    ),
  );
}
