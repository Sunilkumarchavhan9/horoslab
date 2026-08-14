import type { LabSchedule } from "@/lib/continuity-lab/lab-schedules-types";

export const LAB_SCHEDULES_CHANGED_EVENT = "memoryos:lab-schedules-changed";

export type LabSchedulesChangedDetail = {
  orgId: string;
  schedules?: LabSchedule[];
  updatedAt?: string;
};

export function broadcastLabSchedulesChanged(detail: LabSchedulesChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LabSchedulesChangedDetail>(LAB_SCHEDULES_CHANGED_EVENT, { detail }),
  );
}
