import type { LabReviewSettings } from "@/lib/continuity-lab/lab-review-settings-storage";

export const LAB_REVIEW_SETTINGS_CHANGED_EVENT = "memoryos:lab-review-settings-changed";

export type LabReviewSettingsChangedDetail = {
  settings: LabReviewSettings;
  orgId?: string;
  updatedAt?: string;
};

export function broadcastLabReviewSettingsChanged(
  detail: LabReviewSettingsChangedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LabReviewSettingsChangedDetail>(LAB_REVIEW_SETTINGS_CHANGED_EVENT, {
      detail,
    }),
  );
}
