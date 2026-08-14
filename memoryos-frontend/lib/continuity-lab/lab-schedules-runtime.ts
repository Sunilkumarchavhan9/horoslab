import {
  buildRruleFromVisual,
  formatGmtOffset,
  formatTimePill,
  getBrowserTimezone,
  scheduleDisplayLabel,
  weekdayLabelFromConfig,
} from "@/lib/continuity-lab/schedule-trigger";
import type {
  LabSchedule,
  LabScheduleDraft,
  LabScheduleFrequency,
  LabScheduleType,
} from "@/lib/continuity-lab/lab-schedules-types";

/** API/dev metadata only — do not surface in Continuity Lab UI copy. */
export const SCHEDULE_EXECUTION_NOTE =
  "Saved schedules are stored for your organization. Automatic session execution from cron is not wired yet — use Automations for the supported scheduling path.";

export const STUB_PLAYBOOK_OPTIONS = [
  { id: "general-session", label: "General agent session" },
  { id: "continuity-handoff", label: "Continuity handoff" },
  { id: "wiki-refresh", label: "Wiki knowledge refresh" },
  { id: "pr-review", label: "Pull request review" },
] as const;

export function defaultLabScheduleFrequency(): LabScheduleFrequency {
  const timezone = getBrowserTimezone();
  const config = {
    timezone,
    hour: "9",
    minute: "0",
    interval: "1",
    intervalUnit: "week",
    repeatDays: "MO",
    dayOfWeek: "MO",
  };
  const rrule = buildRruleFromVisual(config);
  return {
    timezone,
    hour: "9",
    minute: "0",
    interval: "1",
    intervalUnit: "week",
    repeatDays: "MO",
    rrule,
    cron: "0 9 * * 1",
  };
}

export function defaultLabScheduleDraft(): LabScheduleDraft {
  return {
    name: "",
    type: "recurring",
    frequency: defaultLabScheduleFrequency(),
    prompt: "",
    playbookId: null,
    autoApproveChildSessions: false,
    repoScope: "all",
    repos: [],
    emailNotifications: "on_failure",
  };
}

export function frequencyConfigRecord(frequency: LabScheduleFrequency): Record<string, string> {
  return {
    timezone: frequency.timezone,
    hour: frequency.hour,
    minute: frequency.minute,
    interval: frequency.interval,
    intervalUnit: frequency.intervalUnit,
    repeatDays: frequency.repeatDays,
    dayOfWeek: frequency.repeatDays.split(",")[0]?.trim() || "MO",
    rrule: frequency.rrule,
    cron: frequency.cron,
  };
}

export function frequencySummary(schedule: Pick<LabSchedule, "type" | "frequency" | "oneTimeAt">): string {
  if (schedule.type === "one_time") {
    if (!schedule.oneTimeAt) return "One-time (date not set)";
    try {
      return `Once · ${new Date(schedule.oneTimeAt).toLocaleString()}`;
    } catch {
      return "One-time";
    }
  }
  return scheduleDisplayLabel("schedule", frequencyConfigRecord(schedule.frequency));
}

export function formatNextRunLabel(
  schedule: Pick<LabSchedule, "type" | "frequency" | "oneTimeAt">,
): string {
  if (schedule.type === "one_time") {
    if (!schedule.oneTimeAt) return "—";
    const at = new Date(schedule.oneTimeAt).getTime();
    if (!Number.isFinite(at)) return "—";
    if (at < Date.now()) return "Past";
    return new Date(at).toLocaleString();
  }

  const freq = schedule.frequency;
  const hour = Number.parseInt(freq.hour, 10);
  const minute = Number.parseInt(freq.minute, 10);
  const tz = formatGmtOffset(freq.timezone);
  const time = formatTimePill(Number.isFinite(hour) ? hour : 9, Number.isFinite(minute) ? minute : 0);

  if (freq.intervalUnit === "hour") {
    const n = Number.parseInt(freq.interval, 10);
    return n > 1 ? `Next · every ${n} hours` : "Next · hourly";
  }
  if (freq.intervalUnit === "day") {
    return `Next · ${time} ${tz}`;
  }
  const days = freq.repeatDays
    .split(",")
    .map((code) => weekdayLabelFromConfig({ dayOfWeek: code.trim() }, "short"))
    .join(", ");
  return `Next · ${days || "weekly"} ${time} ${tz}`;
}

export function isLabScheduleDraftValid(draft: LabScheduleDraft): boolean {
  if (!draft.name.trim()) return false;
  if (!draft.prompt.trim()) return false;
  if (draft.type === "one_time" && !draft.oneTimeAt?.trim()) return false;
  if (draft.repoScope === "specific" && draft.repos.length === 0) return false;
  return true;
}

export function scheduleTypeLabel(type: LabScheduleType): string {
  return type === "one_time" ? "One-time" : "Recurring";
}
