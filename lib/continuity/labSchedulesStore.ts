import { randomUUID } from "crypto";
import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type LabScheduleType = "recurring" | "one_time";

export type LabScheduleEmailNotifications = "on_failure" | "all_runs" | "never";

export type LabScheduleRepoScope = "all" | "specific";

export type LabScheduleIntervalUnit = "hour" | "day" | "week";

export type LabScheduleFrequency = {
  timezone: string;
  hour: string;
  minute: string;
  interval: string;
  intervalUnit: LabScheduleIntervalUnit;
  repeatDays: string;
  rrule: string;
  cron: string;
};

export type LabScheduleRecord = {
  id: string;
  name: string;
  type: LabScheduleType;
  frequency: LabScheduleFrequency;
  oneTimeAt?: string;
  prompt: string;
  playbookId: string | null;
  autoApproveChildSessions: boolean;
  repoScope: LabScheduleRepoScope;
  repos: string[];
  emailNotifications: LabScheduleEmailNotifications;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type OrgSchedules = {
  schedules: LabScheduleRecord[];
};

const SETTINGS_SECTION = "lab-schedules";

const DEFAULT_FREQUENCY: LabScheduleFrequency = {
  timezone: "UTC",
  hour: "9",
  minute: "0",
  interval: "1",
  intervalUnit: "week",
  repeatDays: "MO",
  rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;BYHOUR=9;BYMINUTE=0",
  cron: "0 9 * * 1",
};

function isScheduleType(v: unknown): v is LabScheduleType {
  return v === "recurring" || v === "one_time";
}

function isEmailNotifications(v: unknown): v is LabScheduleEmailNotifications {
  return v === "on_failure" || v === "all_runs" || v === "never";
}

function isRepoScope(v: unknown): v is LabScheduleRepoScope {
  return v === "all" || v === "specific";
}

function isIntervalUnit(v: unknown): v is LabScheduleIntervalUnit {
  return v === "hour" || v === "day" || v === "week";
}

function coerceFrequency(raw: unknown): LabScheduleFrequency {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FREQUENCY };
  const row = raw as Partial<LabScheduleFrequency>;
  return {
    timezone: typeof row.timezone === "string" && row.timezone.trim() ? row.timezone.trim() : DEFAULT_FREQUENCY.timezone,
    hour: typeof row.hour === "string" ? row.hour : DEFAULT_FREQUENCY.hour,
    minute: typeof row.minute === "string" ? row.minute : DEFAULT_FREQUENCY.minute,
    interval: typeof row.interval === "string" ? row.interval : DEFAULT_FREQUENCY.interval,
    intervalUnit: isIntervalUnit(row.intervalUnit) ? row.intervalUnit : DEFAULT_FREQUENCY.intervalUnit,
    repeatDays: typeof row.repeatDays === "string" && row.repeatDays.trim() ? row.repeatDays.trim() : DEFAULT_FREQUENCY.repeatDays,
    rrule: typeof row.rrule === "string" && row.rrule.trim() ? row.rrule.trim() : DEFAULT_FREQUENCY.rrule,
    cron: typeof row.cron === "string" && row.cron.trim() ? row.cron.trim() : DEFAULT_FREQUENCY.cron,
  };
}

function coerceRepos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const repo = item.trim();
    if (!repo || seen.has(repo)) continue;
    seen.add(repo);
    out.push(repo);
  }
  return out;
}

function coerceRecord(raw: unknown, fallbackCreatedBy: string): LabScheduleRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<LabScheduleRecord>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name) return null;
  const type = isScheduleType(row.type) ? row.type : "recurring";
  const now = new Date().toISOString();
  return {
    id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : randomUUID(),
    name,
    type,
    frequency: coerceFrequency(row.frequency),
    oneTimeAt: typeof row.oneTimeAt === "string" && row.oneTimeAt.trim() ? row.oneTimeAt.trim() : undefined,
    prompt: typeof row.prompt === "string" ? row.prompt : "",
    playbookId:
      row.playbookId === null || row.playbookId === undefined
        ? null
        : typeof row.playbookId === "string"
          ? row.playbookId.trim() || null
          : null,
    autoApproveChildSessions: row.autoApproveChildSessions === true,
    repoScope: isRepoScope(row.repoScope) ? row.repoScope : "all",
    repos: coerceRepos(row.repos),
    emailNotifications: isEmailNotifications(row.emailNotifications)
      ? row.emailNotifications
      : "on_failure",
    createdBy:
      typeof row.createdBy === "string" && row.createdBy.trim()
        ? row.createdBy.trim()
        : fallbackCreatedBy,
    createdAt: typeof row.createdAt === "string" && row.createdAt.trim() ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === "string" && row.updatedAt.trim() ? row.updatedAt : now,
  };
}

function coerceBucket(raw: unknown): OrgSchedules {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Partial<OrgSchedules> : {};
  return {
    schedules: Array.isArray(value.schedules)
      ? value.schedules.flatMap((item) => {
          const record = coerceRecord(item, "unknown");
          return record ? [record] : [];
        })
      : [],
  };
}

async function readOrgBucket(orgId: string): Promise<OrgSchedules> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    coerceBucket,
  );
}

async function writeOrgBucket(orgId: string, bucket: OrgSchedules): Promise<void> {
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), bucket);
}

export type ListLabSchedulesOptions = {
  createdBy?: string;
};

export async function listLabSchedules(
  orgId: string,
  options?: ListLabSchedulesOptions,
): Promise<LabScheduleRecord[]> {
  const rows = (await readOrgBucket(orgId)).schedules;
  const filtered = options?.createdBy
    ? rows.filter((row) => row.createdBy === options.createdBy)
    : rows;
  return [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getLabSchedule(
  orgId: string,
  scheduleId: string,
): Promise<LabScheduleRecord | null> {
  return (await readOrgBucket(orgId)).schedules.find((row) => row.id === scheduleId) ?? null;
}

export type CreateLabScheduleInput = Omit<
  LabScheduleRecord,
  "id" | "createdBy" | "createdAt" | "updatedAt"
>;

export async function createLabSchedule(
  orgId: string,
  input: CreateLabScheduleInput,
  createdBy: string,
): Promise<LabScheduleRecord> {
  const bucket = await readOrgBucket(orgId);
  const now = new Date().toISOString();
  const record = coerceRecord(
    {
      ...input,
      id: randomUUID(),
      createdBy,
      createdAt: now,
      updatedAt: now,
    },
    createdBy,
  );
  if (!record) {
    throw new Error("invalid_schedule");
  }
  bucket.schedules.push(record);
  await writeOrgBucket(orgId, bucket);
  return record;
}

export type PatchLabScheduleInput = Partial<
  Omit<LabScheduleRecord, "id" | "createdBy" | "createdAt" | "updatedAt">
>;

export async function patchLabSchedule(
  orgId: string,
  scheduleId: string,
  partial: PatchLabScheduleInput,
): Promise<LabScheduleRecord | null> {
  const bucket = await readOrgBucket(orgId);
  const index = bucket.schedules.findIndex((row) => row.id === scheduleId);
  if (index < 0) return null;
  const existing = bucket.schedules[index];
  const merged = coerceRecord(
    {
      ...existing,
      ...partial,
      id: existing.id,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      frequency:
        partial.frequency !== undefined
          ? coerceFrequency({ ...existing.frequency, ...partial.frequency })
          : existing.frequency,
      repos: partial.repos !== undefined ? coerceRepos(partial.repos) : existing.repos,
      updatedAt: new Date().toISOString(),
    },
    existing.createdBy,
  );
  if (!merged) return null;
  bucket.schedules[index] = merged;
  await writeOrgBucket(orgId, bucket);
  return merged;
}

export async function deleteLabSchedule(orgId: string, scheduleId: string): Promise<boolean> {
  const bucket = await readOrgBucket(orgId);
  const before = bucket.schedules.length;
  bucket.schedules = bucket.schedules.filter((row) => row.id !== scheduleId);
  if (bucket.schedules.length === before) return false;
  await writeOrgBucket(orgId, bucket);
  return true;
}

export function defaultLabScheduleFrequency(): LabScheduleFrequency {
  return { ...DEFAULT_FREQUENCY };
}
