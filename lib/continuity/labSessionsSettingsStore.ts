import {
  companyBrainPlatformOrgId,
  resolveRequestOrgId,
} from "../auth/orgScope";
import { prisma } from "../storage/prismaClient";

export type LabSessionsSortBy = "updated" | "created";
export type LabSessionsSortDirection = "newest" | "oldest";
export type LabSessionsGrouping = "by_status" | "none";
export type LabSessionsViewMode = "flat" | "tree";
export type LabSessionsDisplayProperty =
  | "prs"
  | "created"
  | "updated"
  | "user"
  | "tags"
  | "playbook";

export type LabSessionsArchivedFilter = "all" | "archived" | "not_archived";

export type LabSessionsDisplayPrefs = {
  sortBy: LabSessionsSortBy;
  direction: LabSessionsSortDirection;
  grouping: LabSessionsGrouping;
  view: LabSessionsViewMode;
  displayProperties: LabSessionsDisplayProperty[];
};

export type LabSessionsFilterPrefs = {
  creators: string[];
  archivedStatus: LabSessionsArchivedFilter;
  updatedAfter: string | null;
  updatedBefore: string | null;
};

export type LabSessionsSettingsRecord = {
  display: LabSessionsDisplayPrefs;
  filters: LabSessionsFilterPrefs;
  defaultFilters: LabSessionsFilterPrefs | null;
  focusModeByDefault: boolean;
  updatedAt: string;
};

const SETTINGS_SECTION = "lab-sessions-settings";

const ALL_PROPERTIES: LabSessionsDisplayProperty[] = [
  "prs",
  "created",
  "updated",
  "user",
  "tags",
  "playbook",
];

export const DEFAULT_LAB_SESSIONS_DISPLAY: LabSessionsDisplayPrefs = {
  sortBy: "updated",
  direction: "newest",
  grouping: "by_status",
  view: "tree",
  displayProperties: ["prs", "created", "updated", "user", "tags", "playbook"],
};

export const DEFAULT_LAB_SESSIONS_FILTERS: LabSessionsFilterPrefs = {
  creators: [],
  archivedStatus: "all",
  updatedAfter: null,
  updatedBefore: null,
};

function defaultRecord(): LabSessionsSettingsRecord {
  return {
    display: { ...DEFAULT_LAB_SESSIONS_DISPLAY },
    filters: { ...DEFAULT_LAB_SESSIONS_FILTERS },
    defaultFilters: null,
    focusModeByDefault: false,
    updatedAt: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSortBy(v: unknown): v is LabSessionsSortBy {
  return v === "updated" || v === "created";
}

function isDirection(v: unknown): v is LabSessionsSortDirection {
  return v === "newest" || v === "oldest";
}

function isGrouping(v: unknown): v is LabSessionsGrouping {
  return v === "by_status" || v === "none";
}

function isView(v: unknown): v is LabSessionsViewMode {
  return v === "flat" || v === "tree";
}

function isArchivedFilter(v: unknown): v is LabSessionsArchivedFilter {
  return v === "all" || v === "archived" || v === "not_archived";
}

function coerceDisplay(raw: unknown): LabSessionsDisplayPrefs {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<LabSessionsDisplayPrefs>;
  const props = Array.isArray(parsed.displayProperties)
    ? parsed.displayProperties.filter((p): p is LabSessionsDisplayProperty =>
        ALL_PROPERTIES.includes(p as LabSessionsDisplayProperty),
      )
    : DEFAULT_LAB_SESSIONS_DISPLAY.displayProperties;
  return {
    sortBy: isSortBy(parsed.sortBy) ? parsed.sortBy : DEFAULT_LAB_SESSIONS_DISPLAY.sortBy,
    direction: isDirection(parsed.direction)
      ? parsed.direction
      : DEFAULT_LAB_SESSIONS_DISPLAY.direction,
    grouping: isGrouping(parsed.grouping)
      ? parsed.grouping
      : DEFAULT_LAB_SESSIONS_DISPLAY.grouping,
    view: isView(parsed.view) ? parsed.view : DEFAULT_LAB_SESSIONS_DISPLAY.view,
    displayProperties:
      props.length > 0 ? props : DEFAULT_LAB_SESSIONS_DISPLAY.displayProperties,
  };
}

function coerceFilters(raw: unknown): LabSessionsFilterPrefs {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Partial<LabSessionsFilterPrefs>;
  const creators = Array.isArray(parsed.creators)
    ? parsed.creators.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];
  return {
    creators,
    archivedStatus: isArchivedFilter(parsed.archivedStatus)
      ? parsed.archivedStatus
      : DEFAULT_LAB_SESSIONS_FILTERS.archivedStatus,
    updatedAfter:
      typeof parsed.updatedAfter === "string" && parsed.updatedAfter.trim()
        ? parsed.updatedAfter.trim()
        : null,
    updatedBefore:
      typeof parsed.updatedBefore === "string" && parsed.updatedBefore.trim()
        ? parsed.updatedBefore.trim()
        : null,
  };
}

function mergeRecord(
  existing: LabSessionsSettingsRecord | undefined,
  partial: Partial<Omit<LabSessionsSettingsRecord, "updatedAt">>,
): LabSessionsSettingsRecord {
  const base = existing ?? defaultRecord();
  return {
    display: partial.display !== undefined ? coerceDisplay(partial.display) : base.display,
    filters: partial.filters !== undefined ? coerceFilters(partial.filters) : base.filters,
    defaultFilters:
      partial.defaultFilters !== undefined
        ? partial.defaultFilters === null
          ? null
          : coerceFilters(partial.defaultFilters)
        : base.defaultFilters,
    focusModeByDefault:
      typeof partial.focusModeByDefault === "boolean"
        ? partial.focusModeByDefault
        : base.focusModeByDefault,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeRecord(raw: unknown): LabSessionsSettingsRecord {
  const record = isRecord(raw) ? raw : {};
  return {
    display: coerceDisplay(record.display),
    filters: coerceFilters(record.filters),
    defaultFilters:
      record.defaultFilters === null
        ? null
        : record.defaultFilters !== undefined
          ? coerceFilters(record.defaultFilters)
          : null,
    focusModeByDefault:
      typeof record.focusModeByDefault === "boolean" ? record.focusModeByDefault : false,
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim().length > 0
        ? record.updatedAt
        : new Date().toISOString(),
  };
}

function parseRecordJson(dataJson: string): LabSessionsSettingsRecord | null {
  try {
    return normalizeRecord(JSON.parse(dataJson) as unknown);
  } catch {
    return null;
  }
}

function resolveSettingsScope(orgId?: string): { dbOrgId: string } {
  const scopedOrg = resolveRequestOrgId(orgId);
  return {
    dbOrgId: companyBrainPlatformOrgId(scopedOrg),
  };
}

async function readRecordFromPostgres(
  userId: string,
  dbOrgId: string,
): Promise<LabSessionsSettingsRecord | null> {
  const row = await prisma.scopedSetting.findUnique({
    where: {
      userId_orgId_section: {
        userId,
        orgId: dbOrgId,
        section: SETTINGS_SECTION,
      },
    },
  });
  return row ? parseRecordJson(row.dataJson) : null;
}

async function writeRecordToPostgres(
  userId: string,
  dbOrgId: string,
  record: LabSessionsSettingsRecord,
): Promise<void> {
  await prisma.scopedSetting.upsert({
    where: {
      userId_orgId_section: {
        userId,
        orgId: dbOrgId,
        section: SETTINGS_SECTION,
      },
    },
    create: {
      userId,
      orgId: dbOrgId,
      section: SETTINGS_SECTION,
      updatedAt: record.updatedAt,
      dataJson: JSON.stringify(record),
    },
    update: {
      updatedAt: record.updatedAt,
      dataJson: JSON.stringify(record),
    },
  });
}

export async function getLabSessionsSettings(
  userId: string,
  orgId?: string,
): Promise<LabSessionsSettingsRecord> {
  const { dbOrgId } = resolveSettingsScope(orgId);
  return (await readRecordFromPostgres(userId, dbOrgId)) ?? defaultRecord();
}

export async function patchLabSessionsSettings(
  userId: string,
  partial: Partial<Omit<LabSessionsSettingsRecord, "updatedAt">>,
  orgId?: string,
): Promise<LabSessionsSettingsRecord> {
  const { dbOrgId } = resolveSettingsScope(orgId);
  const current = await getLabSessionsSettings(userId, orgId);
  const next = mergeRecord(current, partial);
  await writeRecordToPostgres(userId, dbOrgId, next);
  return next;
}
