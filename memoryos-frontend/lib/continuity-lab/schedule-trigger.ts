/**
 * Schedule trigger config helpers — Devin Cognition parity (RRULE + visual fields).
 */

import type { AutomationTriggerType } from "@/lib/continuity-lab/automation-storage";

export type ScheduleIntervalUnit = "hour" | "day" | "week";

export const WEEKDAY_OPTIONS = [
  { code: "MO", label: "Mon", fullLabel: "Monday", circle: "M", cron: 1 },
  { code: "TU", label: "Tue", fullLabel: "Tuesday", circle: "T", cron: 2 },
  { code: "WE", label: "Wed", fullLabel: "Wednesday", circle: "W", cron: 3 },
  { code: "TH", label: "Thu", fullLabel: "Thursday", circle: "T", cron: 4 },
  { code: "FR", label: "Fri", fullLabel: "Friday", circle: "F", cron: 5 },
  { code: "SA", label: "Sat", fullLabel: "Saturday", circle: "S", cron: 6 },
  { code: "SU", label: "Sun", fullLabel: "Sunday", circle: "S", cron: 0 },
] as const;

export type WeekdayCode = (typeof WEEKDAY_OPTIONS)[number]["code"];

const CIRCLE_DAYS = [
  { code: "SU", circle: "S" },
  { code: "MO", circle: "M" },
  { code: "TU", circle: "T" },
  { code: "WE", circle: "W" },
  { code: "TH", circle: "T" },
  { code: "FR", circle: "F" },
  { code: "SA", circle: "S" },
] as const;

export function getBrowserTimezone(): string {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** e.g. GMT+5:30 */
/** IANA label for popover copy, e.g. Asia/Calcutta */
export function formatTimezoneLabel(timezone?: string): string {
  return timezone?.trim() || getBrowserTimezone();
}

export function formatGmtOffset(timezone?: string): string {
  const tz = timezone?.trim() || getBrowserTimezone();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value;
    if (offset) return offset.replace("UTC", "GMT");
  } catch {
    /* fall through */
  }
  return "GMT+0:00";
}

export function formatTimePill(hour: number, minute: number): string {
  const h = Math.min(23, Math.max(0, hour));
  const m = Math.min(59, Math.max(0, minute));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseIntSafe(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export function weekdayLabelFromConfig(
  config: Record<string, string>,
  style: "short" | "full" = "short",
): string {
  const code = config.dayOfWeek?.trim().toUpperCase();
  const byCode = WEEKDAY_OPTIONS.find((d) => d.code === code);
  if (byCode) return style === "full" ? byCode.fullLabel : byCode.label;
  const cron = parseIntSafe(config.dayOfWeek, 1);
  const match = WEEKDAY_OPTIONS.find((d) => d.cron === cron);
  if (match) return style === "full" ? match.fullLabel : match.label;
  return style === "full" ? "Monday" : "Mon";
}

export function weekdayCodeFromConfig(config: Record<string, string>): WeekdayCode {
  const code = config.dayOfWeek?.trim().toUpperCase() as WeekdayCode | undefined;
  if (code && WEEKDAY_OPTIONS.some((d) => d.code === code)) return code;
  const cron = parseIntSafe(config.dayOfWeek, 1);
  return WEEKDAY_OPTIONS.find((d) => d.cron === cron)?.code ?? "MO";
}

export function defaultScheduleConfig(type: AutomationTriggerType): Record<string, string> {
  const timezone = getBrowserTimezone();
  const base = {
    timezone,
    hour: "9",
    minute: "0",
    interval: "1",
    intervalUnit: "week",
    repeatDays: "MO",
  };

  if (type === "schedule_hourly") {
    return {
      cron: "0 * * * *",
      intervalLabel: "Every hour",
      timezone,
      hour: "0",
      minute: "0",
      rrule: "FREQ=HOURLY;INTERVAL=1",
    };
  }
  if (type === "schedule_daily") {
    return {
      ...base,
      cron: "0 9 * * *",
      intervalLabel: "Every day",
      rrule: "FREQ=DAILY;BYHOUR=9;BYMINUTE=0",
    };
  }
  if (type === "schedule_weekly") {
    return {
      ...base,
      dayOfWeek: "MO",
      cron: "0 9 * * 1",
      intervalLabel: "Every week",
      rrule: "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0",
    };
  }
  if (type === "schedule") {
    return {
      ...base,
      dayOfWeek: "MO",
      cron: "0 9 * * 1",
      intervalLabel: "Custom schedule",
      rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;BYHOUR=9;BYMINUTE=0",
    };
  }
  return {};
}

export function cronFromScheduleConfig(
  type: AutomationTriggerType,
  config: Record<string, string>,
): string {
  const hour = parseIntSafe(config.hour, 9);
  const minute = parseIntSafe(config.minute, 0);
  if (type === "schedule_hourly") return `${minute} * * * *`;
  if (type === "schedule_daily") return `${minute} ${hour} * * *`;
  if (type === "schedule_weekly" || type === "schedule") {
    const code = weekdayCodeFromConfig(config);
    const cronDay = WEEKDAY_OPTIONS.find((d) => d.code === code)?.cron ?? 1;
    return `${minute} ${hour} * * ${cronDay}`;
  }
  return config.cron ?? "0 9 * * 1";
}

function rruleFreq(unit: ScheduleIntervalUnit): string {
  if (unit === "hour") return "HOURLY";
  if (unit === "day") return "DAILY";
  return "WEEKLY";
}

export function buildRruleFromVisual(config: Record<string, string>): string {
  const unit = (config.intervalUnit ?? "week") as ScheduleIntervalUnit;
  const interval = Math.max(1, parseIntSafe(config.interval, 1));
  const hour = parseIntSafe(config.hour, 9);
  const minute = parseIntSafe(config.minute, 0);
  const parts = [`FREQ=${rruleFreq(unit)}`, `INTERVAL=${interval}`];

  if (unit === "week") {
    const days =
      config.repeatDays?.trim() ||
      weekdayCodeFromConfig(config);
    const byday = days
      .split(",")
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean)
      .join(",");
    if (byday) parts.push(`BYDAY=${byday}`);
  }

  if (unit !== "hour") {
    parts.push(`BYHOUR=${hour}`, `BYMINUTE=${minute}`);
  }

  return parts.join(";");
}

export function parseRruleToVisual(rrule: string): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {};
  const upper = rrule.trim().toUpperCase();
  if (!upper) return out;

  const segments = upper.split(";").map((s) => s.trim());
  for (const segment of segments) {
    const [key, rawValue] = segment.split("=");
    const value = rawValue?.trim();
    if (!key || !value) continue;

    if (key === "FREQ") {
      const freq = value.toLowerCase();
      if (freq === "HOURLY") out.intervalUnit = "hour";
      else if (freq === "DAILY") out.intervalUnit = "day";
      else if (freq === "WEEKLY") out.intervalUnit = "week";
    }
    if (key === "INTERVAL") out.interval = String(parseIntSafe(value, 1));
    if (key === "BYDAY") {
      out.repeatDays = value;
      const first = value.split(",")[0]?.trim();
      if (first) out.dayOfWeek = first;
    }
    if (key === "BYHOUR") out.hour = String(parseIntSafe(value, 9));
    if (key === "BYMINUTE") out.minute = String(parseIntSafe(value, 0));
  }
  return out;
}

export function mergeScheduleConfig(
  type: AutomationTriggerType,
  prev: Record<string, string>,
  patch: Record<string, string>,
): Record<string, string> {
  const merged = { ...prev, ...patch };
  if (!merged.timezone) merged.timezone = getBrowserTimezone();
  merged.cron = cronFromScheduleConfig(type, merged);
  if (patch.rrule !== undefined && patch.rrule.trim().length > 0) {
    merged.rrule = patch.rrule.trim().toUpperCase();
  } else {
    merged.rrule = buildRruleFromVisual(merged);
  }
  merged.intervalLabel = scheduleDisplayLabel(type, merged);
  return merged;
}

export function scheduleDisplayLabel(
  type: AutomationTriggerType,
  config: Record<string, string>,
): string {
  const hour = parseIntSafe(config.hour, 9);
  const minute = parseIntSafe(config.minute, 0);
  const time = formatTimePill(hour, minute);
  const tz = formatGmtOffset(config.timezone);

  if (type === "schedule_hourly") return "Every hour";
  if (type === "schedule_daily") return `Every day at ${time} ${tz}`;
  if (type === "schedule_weekly") {
    const day = weekdayLabelFromConfig(config, "full");
    return `Every week on ${day} ${time} ${tz}`;
  }
  if (type === "schedule") {
    const unit = config.intervalUnit ?? "week";
    const interval = parseIntSafe(config.interval, 1);
    const days = (config.repeatDays ?? "MO")
      .split(",")
      .map((d) => WEEKDAY_OPTIONS.find((w) => w.code === d.trim().toUpperCase())?.label ?? d)
      .join(", ");
    if (unit === "hour") {
      return interval > 1 ? `Every ${interval} hours` : "Every hour";
    }
    if (unit === "day") {
      return interval > 1
        ? `Every ${interval} days at ${time} ${tz}`
        : `Every day at ${time} ${tz}`;
    }
    return `Weekly on ${days} at ${time}`;
  }
  return config.intervalLabel ?? "Schedule";
}

export function scheduleChipSummary(type: AutomationTriggerType, config: Record<string, string>): string {
  return scheduleDisplayLabel(type, config);
}

export { CIRCLE_DAYS };
