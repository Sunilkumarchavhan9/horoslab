"use client";

import { ContinuityLabScheduleForm } from "@/components/continuity-lab/settings/continuity-lab-schedule-form";

export function ContinuityLabScheduleEditor({
  scheduleId,
  mode,
}: {
  scheduleId?: string;
  mode: "create" | "edit";
}) {
  return <ContinuityLabScheduleForm scheduleId={scheduleId} mode={mode} />;
}
