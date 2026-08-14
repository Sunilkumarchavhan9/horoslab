import { randomUUID } from "crypto";
import {
  orgScopedSettingsIdentity,
  readScopedSetting,
  writeScopedSetting,
} from "./scopedSettingsStore";

export type LabAutomationInstructionKind =
  | "start_session"
  | "message_session"
  | "email_notification";

export type LabAutomationInstructionEmailWhen = "always" | "on_failure" | "on_success";

export type LabAutomationInstruction =
  | { id: string; kind: "start_session" }
  | {
      id: string;
      kind: "email_notification";
      emailRecipient: string;
      emailWhen: LabAutomationInstructionEmailWhen;
    }
  | {
      id: string;
      kind: "message_session";
      messageSessionId?: string;
      messageSessionTitle?: string;
      messagePrompt: string;
    };

export type LabAutomationTriggerType =
  | "ci_failure"
  | "slack_message"
  | "github_issue_comment"
  | "github_issue"
  | "github_pull_request"
  | "github_pr_review"
  | "github_pr_review_comment"
  | "github_check_run"
  | "github_push"
  | "slack_reaction_added"
  | "slack_message_advanced"
  | "linear_issue_event"
  | "schedule_hourly"
  | "schedule_daily"
  | "schedule_weekly"
  | "webhook"
  | "jira_issue_event"
  | "memoryos_handoff"
  | "schedule"
  | "manual";

export type LabAutomationConnectorId =
  | "github"
  | "slack"
  | "jira"
  | "notion"
  | "stripe"
  | "datadog"
  | "sentry"
  | "circleci"
  | "cloudflare"
  | "metabase"
  | "hubspot"
  | "jam"
  | "asana"
  | "figma"
  | "sonarqube"
  | "pagerduty"
  | "linear";
export type LabAutomationAgentMode = "normal" | "plan" | "debug";

export type LabAutomationTrigger = {
  id: string;
  type: LabAutomationTriggerType;
  label: string;
  config: Record<string, string>;
};

export type LabAutomationMemoryFeatures = {
  injectResumeBrief: boolean;
  writeActionMemoryOnComplete: boolean;
  requireGovernanceApproval: boolean;
  attachOperationalWiki: boolean;
  continuityHandoffOnComplete: boolean;
  useCompanyBrainContext: boolean;
};

export type LabAutomationSessionOptions = {
  slackNotificationOnComplete: boolean;
  autoStartChildSessions: boolean;
  emailNotification: boolean;
  notificationEmail: string;
};

export type LabAutomationLimits = {
  costLimitEnabled: boolean;
  costLimitUsd: number;
  invocationLimitEnabled: boolean;
  invocationLimit: number;
  invocationWindowHours: number;
};

export type LabAutomationNetworkPolicy = {
  enabled: boolean;
  allowedDomains: string[];
};

export type LabAutomationRecord = {
  id: string;
  name: string;
  triggers: LabAutomationTrigger[];
  instructions: string;
  instructionsV2: LabAutomationInstruction[];
  connectors: LabAutomationConnectorId[];
  memoryFeatures: LabAutomationMemoryFeatures;
  sessionOptions: LabAutomationSessionOptions;
  agentMode: LabAutomationAgentMode;
  limits: LabAutomationLimits;
  networkPolicy: LabAutomationNetworkPolicy;
  sharedScratchpad: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  goal?: string;
  templateId?: string;
  emailNotification?: boolean;
  notificationEmail?: string;
};

export type LabAutomationRecent = {
  id: string;
  name: string;
  visitedAt: string;
};

export type LabAutomationRunStatus = "queued" | "running" | "completed" | "failed";

export type LabAutomationRunRecord = {
  id: string;
  automationId: string;
  status: LabAutomationRunStatus;
  triggerType: "manual" | "schedule" | "webhook" | "github" | "slack" | "linear";
  startedBy: string;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  sessionPath?: string;
  error?: string;
  metadata: Record<string, unknown>;
};

type OrgAutomations = {
  automations: LabAutomationRecord[];
  recentAutomations: LabAutomationRecent[];
  runs: LabAutomationRunRecord[];
  updatedAt?: string;
};

export type CreateLabAutomationInput = Omit<
  LabAutomationRecord,
  "id" | "createdBy" | "createdAt" | "updatedAt"
>;

export type PatchLabAutomationInput = Partial<
  Omit<LabAutomationRecord, "id" | "createdBy" | "createdAt" | "updatedAt">
>;

export type CreateLabAutomationRunInput = {
  status?: LabAutomationRunStatus;
  triggerType?: LabAutomationRunRecord["triggerType"];
  sessionPath?: string;
  error?: string;
  metadata?: Record<string, unknown>;
};

const SETTINGS_SECTION = "lab-automations";
const MAX_AUTOMATIONS_PER_ORG = 1_000;
const MAX_RECENT = 20;
const MAX_RUNS_PER_ORG = 2_000;
const MAX_AUTOMATION_NAME_LENGTH = 160;
const MAX_AUTOMATION_GOAL_LENGTH = 500;
const MAX_AUTOMATION_INSTRUCTIONS_LENGTH = 12_000;
const MAX_AUTOMATION_SCRATCHPAD_LENGTH = 12_000;
const MAX_TRIGGER_CONFIG_KEYS = 40;
const MAX_TRIGGER_CONFIG_VALUE_LENGTH = 1_000;
const MAX_ALLOWED_DOMAINS = 100;
const MAX_ALLOWED_DOMAIN_LENGTH = 253;
const MAX_RUN_ERROR_LENGTH = 1_000;
const MAX_RUN_METADATA_BYTES = 16_000;

const DEFAULT_MEMORY_FEATURES: LabAutomationMemoryFeatures = {
  injectResumeBrief: true,
  writeActionMemoryOnComplete: true,
  requireGovernanceApproval: false,
  attachOperationalWiki: true,
  continuityHandoffOnComplete: false,
  useCompanyBrainContext: true,
};

const DEFAULT_SESSION_OPTIONS: LabAutomationSessionOptions = {
  slackNotificationOnComplete: false,
  autoStartChildSessions: false,
  emailNotification: false,
  notificationEmail: "",
};

const DEFAULT_LIMITS: LabAutomationLimits = {
  costLimitEnabled: false,
  costLimitUsd: 10,
  invocationLimitEnabled: true,
  invocationLimit: 50,
  invocationWindowHours: 1,
};

const DEFAULT_NETWORK: LabAutomationNetworkPolicy = {
  enabled: false,
  allowedDomains: [],
};

const TRIGGER_TYPES = new Set<LabAutomationTriggerType>([
  "ci_failure",
  "slack_message",
  "github_issue_comment",
  "github_issue",
  "github_pull_request",
  "github_pr_review",
  "github_pr_review_comment",
  "github_check_run",
  "github_push",
  "slack_reaction_added",
  "slack_message_advanced",
  "linear_issue_event",
  "schedule_hourly",
  "schedule_daily",
  "schedule_weekly",
  "webhook",
  "jira_issue_event",
  "memoryos_handoff",
  "schedule",
  "manual",
]);

const CONNECTOR_IDS = new Set<LabAutomationConnectorId>([
  "github",
  "slack",
  "jira",
  "notion",
  "stripe",
  "datadog",
  "sentry",
  "circleci",
  "cloudflare",
  "metabase",
  "hubspot",
  "jam",
  "asana",
  "figma",
  "sonarqube",
  "pagerduty",
  "linear",
]);

function nowIso(): string {
  return new Date().toISOString();
}

function clampString(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function safeString(value: unknown, fallback = "", maxLength = 1_000): string {
  return typeof value === "string" ? clampString(value.trim(), maxLength) : fallback;
}

function safeNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function safeStringArray(value: unknown, options?: { maxItems?: number; maxLength?: number }): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (options?.maxItems && out.length >= options.maxItems) break;
    const text = safeString(item, "", options?.maxLength ?? 1_000);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function safeConfig(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_TRIGGER_CONFIG_KEYS) break;
    const safeKey = safeString(key, "", 80);
    if (!safeKey) continue;
    if (typeof raw === "string") out[safeKey] = clampString(raw, MAX_TRIGGER_CONFIG_VALUE_LENGTH);
    else if (raw !== null && raw !== undefined) {
      out[safeKey] = clampString(String(raw), MAX_TRIGGER_CONFIG_VALUE_LENGTH);
    }
  }
  return out;
}

function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    const json = JSON.stringify(value);
    if (json.length > MAX_RUN_METADATA_BYTES) {
      return {
        truncated: true,
        originalBytes: json.length,
      };
    }
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function coerceTrigger(raw: unknown): LabAutomationTrigger | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Partial<LabAutomationTrigger>;
  const type = row.type;
  if (!type || !TRIGGER_TYPES.has(type)) return null;
  const label = safeString(row.label, "", 120) || type.replace(/_/g, " ");
  return {
    id: safeString(row.id, "", 80) || `trg_${randomUUID()}`,
    type,
    label,
    config: safeConfig(row.config),
  };
}

function coerceConnectors(raw: unknown): LabAutomationConnectorId[] {
  if (!Array.isArray(raw)) return [];
  const out: LabAutomationConnectorId[] = [];
  const seen = new Set<LabAutomationConnectorId>();
  for (const item of raw) {
    if (!CONNECTOR_IDS.has(item as LabAutomationConnectorId)) continue;
    const id = item as LabAutomationConnectorId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function coerceMemoryFeatures(raw: unknown): LabAutomationMemoryFeatures {
  const row = raw && typeof raw === "object" ? raw as Partial<LabAutomationMemoryFeatures> : {};
  return {
    injectResumeBrief: row.injectResumeBrief ?? DEFAULT_MEMORY_FEATURES.injectResumeBrief,
    writeActionMemoryOnComplete:
      row.writeActionMemoryOnComplete ?? DEFAULT_MEMORY_FEATURES.writeActionMemoryOnComplete,
    requireGovernanceApproval:
      row.requireGovernanceApproval ?? DEFAULT_MEMORY_FEATURES.requireGovernanceApproval,
    attachOperationalWiki: row.attachOperationalWiki ?? DEFAULT_MEMORY_FEATURES.attachOperationalWiki,
    continuityHandoffOnComplete:
      row.continuityHandoffOnComplete ?? DEFAULT_MEMORY_FEATURES.continuityHandoffOnComplete,
    useCompanyBrainContext:
      row.useCompanyBrainContext ?? DEFAULT_MEMORY_FEATURES.useCompanyBrainContext,
  };
}

function coerceSessionOptions(
  raw: unknown,
  legacy?: Partial<Pick<LabAutomationRecord, "emailNotification" | "notificationEmail">>,
): LabAutomationSessionOptions {
  const row = raw && typeof raw === "object" ? raw as Partial<LabAutomationSessionOptions> : {};
  return {
    slackNotificationOnComplete:
      row.slackNotificationOnComplete ?? DEFAULT_SESSION_OPTIONS.slackNotificationOnComplete,
    autoStartChildSessions:
      row.autoStartChildSessions ?? DEFAULT_SESSION_OPTIONS.autoStartChildSessions,
    emailNotification:
      row.emailNotification ?? legacy?.emailNotification ?? DEFAULT_SESSION_OPTIONS.emailNotification,
    notificationEmail:
      safeString(row.notificationEmail, "", 320) ||
      safeString(legacy?.notificationEmail, "", 320) ||
      DEFAULT_SESSION_OPTIONS.notificationEmail,
  };
}

function coerceLimits(raw: unknown): LabAutomationLimits {
  const row = raw && typeof raw === "object" ? raw as Partial<LabAutomationLimits> : {};
  return {
    costLimitEnabled: row.costLimitEnabled ?? DEFAULT_LIMITS.costLimitEnabled,
    costLimitUsd: Math.max(1, safeNumber(row.costLimitUsd, DEFAULT_LIMITS.costLimitUsd)),
    invocationLimitEnabled: row.invocationLimitEnabled ?? DEFAULT_LIMITS.invocationLimitEnabled,
    invocationLimit: Math.max(1, safeNumber(row.invocationLimit, DEFAULT_LIMITS.invocationLimit)),
    invocationWindowHours: Math.max(
      1,
      safeNumber(row.invocationWindowHours, DEFAULT_LIMITS.invocationWindowHours),
    ),
  };
}

function coerceNetworkPolicy(raw: unknown): LabAutomationNetworkPolicy {
  const row = raw && typeof raw === "object" ? raw as Partial<LabAutomationNetworkPolicy> : {};
  return {
    enabled: row.enabled ?? DEFAULT_NETWORK.enabled,
    allowedDomains: safeStringArray(row.allowedDomains, {
      maxItems: MAX_ALLOWED_DOMAINS,
      maxLength: MAX_ALLOWED_DOMAIN_LENGTH,
    }),
  };
}

function coerceInstruction(raw: unknown): LabAutomationInstruction | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Partial<LabAutomationInstruction>;
  const id = safeString(row.id, "", 80) || `inst_${randomUUID()}`;
  if (row.kind === "start_session") return { id, kind: "start_session" };
  if (row.kind === "email_notification") {
    const emailWhen =
      row.emailWhen === "on_failure" || row.emailWhen === "on_success"
        ? row.emailWhen
        : "always";
    return {
      id,
      kind: "email_notification",
      emailRecipient: safeString(row.emailRecipient, "", 320) || "owner",
      emailWhen,
    };
  }
  if (row.kind === "message_session") {
    return {
      id,
      kind: "message_session",
      messageSessionId: safeString(row.messageSessionId, "", 120) || undefined,
      messageSessionTitle: safeString(row.messageSessionTitle, "", 200) || undefined,
      messagePrompt: safeString(row.messagePrompt, "", MAX_AUTOMATION_INSTRUCTIONS_LENGTH),
    };
  }
  return null;
}

function coerceInstructions(raw: unknown): LabAutomationInstruction[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const instruction = coerceInstruction(item);
    return instruction ? [instruction] : [];
  });
}

function coerceAgentMode(value: unknown): LabAutomationAgentMode {
  return value === "plan" || value === "debug" ? value : "normal";
}

function coerceRecord(raw: unknown, fallbackCreatedBy: string): LabAutomationRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Partial<LabAutomationRecord>;
  const name = safeString(row.name, "", MAX_AUTOMATION_NAME_LENGTH);
  if (!name) return null;
  const now = nowIso();
  const sessionOptions = coerceSessionOptions(row.sessionOptions, row);
  return {
    id: safeString(row.id, "", 80) || `auto_${randomUUID()}`,
    name,
    triggers: Array.isArray(row.triggers) ? row.triggers.flatMap((item) => {
      const trigger = coerceTrigger(item);
      return trigger ? [trigger] : [];
    }) : [],
    instructions: typeof row.instructions === "string"
      ? clampString(row.instructions, MAX_AUTOMATION_INSTRUCTIONS_LENGTH)
      : "",
    instructionsV2: coerceInstructions(row.instructionsV2),
    connectors: coerceConnectors(row.connectors),
    memoryFeatures: coerceMemoryFeatures(row.memoryFeatures),
    sessionOptions,
    agentMode: coerceAgentMode(row.agentMode),
    limits: coerceLimits(row.limits),
    networkPolicy: coerceNetworkPolicy(row.networkPolicy),
    sharedScratchpad: typeof row.sharedScratchpad === "string"
      ? clampString(row.sharedScratchpad, MAX_AUTOMATION_SCRATCHPAD_LENGTH)
      : "",
    createdBy: safeString(row.createdBy, "", 160) || fallbackCreatedBy,
    createdAt: safeString(row.createdAt, "", 40) || now,
    updatedAt: safeString(row.updatedAt, "", 40) || now,
    goal: safeString(row.goal, "", MAX_AUTOMATION_GOAL_LENGTH) || undefined,
    templateId: safeString(row.templateId, "", 120) || undefined,
    emailNotification: sessionOptions.emailNotification,
    notificationEmail: sessionOptions.notificationEmail || undefined,
  };
}

function coerceRecent(raw: unknown): LabAutomationRecent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Partial<LabAutomationRecent>;
  const id = safeString(row.id, "", 80);
  const name = safeString(row.name, "", MAX_AUTOMATION_NAME_LENGTH);
  if (!id || !name) return null;
  return {
    id,
    name,
    visitedAt: safeString(row.visitedAt, "", 40) || nowIso(),
  };
}

function coerceRun(raw: unknown): LabAutomationRunRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Partial<LabAutomationRunRecord>;
  const automationId = safeString(row.automationId, "", 80);
  if (!automationId) return null;
  const status =
    row.status === "running" || row.status === "completed" || row.status === "failed"
      ? row.status
      : "queued";
  const triggerType =
    row.triggerType === "schedule" ||
    row.triggerType === "webhook" ||
    row.triggerType === "github" ||
    row.triggerType === "slack" ||
    row.triggerType === "linear"
      ? row.triggerType
      : "manual";
  const metadata = safeMetadata(row.metadata);
  const now = nowIso();
  return {
    id: safeString(row.id, "", 80) || `run_${randomUUID()}`,
    automationId,
    status,
    triggerType,
    startedBy: safeString(row.startedBy, "", 160) || "unknown",
    startedAt: safeString(row.startedAt, "", 40) || now,
    updatedAt: safeString(row.updatedAt, "", 40) || now,
    finishedAt: safeString(row.finishedAt, "", 40) || undefined,
    sessionPath: safeString(row.sessionPath, "", 400) || undefined,
    error: safeString(row.error, "", MAX_RUN_ERROR_LENGTH) || undefined,
    metadata,
  };
}

function coerceBucket(raw: unknown): OrgAutomations {
  const value =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? raw as Partial<OrgAutomations>
      : {};
  return {
    automations: Array.isArray(value.automations)
      ? value.automations.flatMap((item) => {
          const record = coerceRecord(item, "unknown");
          return record ? [record] : [];
        }).slice(0, MAX_AUTOMATIONS_PER_ORG)
      : [],
    recentAutomations: Array.isArray(value.recentAutomations)
      ? value.recentAutomations.flatMap((item) => {
          const record = coerceRecent(item);
          return record ? [record] : [];
        }).slice(0, MAX_RECENT)
      : [],
    runs: Array.isArray(value.runs)
      ? value.runs.flatMap((item) => {
          const record = coerceRun(item);
          return record ? [record] : [];
        }).slice(0, MAX_RUNS_PER_ORG)
      : [],
    updatedAt: safeString(value.updatedAt) || undefined,
  };
}

async function readOrgBucket(orgId: string): Promise<OrgAutomations> {
  return readScopedSetting(
    orgScopedSettingsIdentity(orgId, SETTINGS_SECTION),
    coerceBucket,
  );
}

async function writeOrgBucket(orgId: string, bucket: OrgAutomations): Promise<void> {
  const normalized = {
    ...bucket,
    automations: bucket.automations.slice(0, MAX_AUTOMATIONS_PER_ORG),
    recentAutomations: bucket.recentAutomations.slice(0, MAX_RECENT),
    runs: bucket.runs.slice(0, MAX_RUNS_PER_ORG),
    updatedAt: nowIso(),
  };
  await writeScopedSetting(orgScopedSettingsIdentity(orgId, SETTINGS_SECTION), normalized);
}

function sortByUpdated<T extends { updatedAt: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export type ListLabAutomationsOptions = {
  createdBy?: string;
};

export async function listLabAutomations(
  orgId: string,
  options?: ListLabAutomationsOptions,
): Promise<LabAutomationRecord[]> {
  const rows = (await readOrgBucket(orgId)).automations;
  const filtered = options?.createdBy
    ? rows.filter((row) => row.createdBy === options.createdBy)
    : rows;
  return sortByUpdated(filtered);
}

export async function getLabAutomation(
  orgId: string,
  automationId: string,
): Promise<LabAutomationRecord | null> {
  return (await readOrgBucket(orgId)).automations.find((row) => row.id === automationId) ?? null;
}

export async function listRecentLabAutomations(orgId: string): Promise<LabAutomationRecent[]> {
  return [...(await readOrgBucket(orgId)).recentAutomations].sort(
    (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime(),
  );
}

export async function createLabAutomation(
  orgId: string,
  input: CreateLabAutomationInput,
  createdBy: string,
): Promise<LabAutomationRecord> {
  const bucket = await readOrgBucket(orgId);
  const now = nowIso();
  const record = coerceRecord(
    {
      ...input,
      id: `auto_${randomUUID()}`,
      createdBy,
      createdAt: now,
      updatedAt: now,
    },
    createdBy,
  );
  if (!record) throw new Error("invalid_automation");
  bucket.automations = [record, ...bucket.automations.filter((row) => row.id !== record.id)];
  await writeOrgBucket(orgId, bucket);
  return record;
}

export async function patchLabAutomation(
  orgId: string,
  automationId: string,
  partial: PatchLabAutomationInput,
): Promise<LabAutomationRecord | null> {
  const bucket = await readOrgBucket(orgId);
  const index = bucket.automations.findIndex((row) => row.id === automationId);
  if (index < 0) return null;
  const existing = bucket.automations[index];
  const merged = coerceRecord(
    {
      ...existing,
      ...partial,
      id: existing.id,
      createdBy: existing.createdBy,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    },
    existing.createdBy,
  );
  if (!merged) return null;
  bucket.automations[index] = merged;
  await writeOrgBucket(orgId, bucket);
  return merged;
}

export async function deleteLabAutomation(
  orgId: string,
  automationId: string,
): Promise<boolean> {
  const bucket = await readOrgBucket(orgId);
  const before = bucket.automations.length;
  bucket.automations = bucket.automations.filter((row) => row.id !== automationId);
  bucket.recentAutomations = bucket.recentAutomations.filter((row) => row.id !== automationId);
  bucket.runs = bucket.runs.filter((row) => row.automationId !== automationId);
  if (bucket.automations.length === before) return false;
  await writeOrgBucket(orgId, bucket);
  return true;
}

export async function touchRecentLabAutomation(
  orgId: string,
  automation: Pick<LabAutomationRecent, "id" | "name">,
): Promise<LabAutomationRecent[]> {
  const bucket = await readOrgBucket(orgId);
  const recent: LabAutomationRecent = {
    id: safeString(automation.id, "", 80),
    name: safeString(automation.name, "", MAX_AUTOMATION_NAME_LENGTH),
    visitedAt: nowIso(),
  };
  bucket.recentAutomations = [
    recent,
    ...bucket.recentAutomations.filter((row) => row.id !== automation.id),
  ].slice(0, MAX_RECENT);
  await writeOrgBucket(orgId, bucket);
  return bucket.recentAutomations;
}

export async function createLabAutomationRun(
  orgId: string,
  automationId: string,
  startedBy: string,
  input?: CreateLabAutomationRunInput,
): Promise<LabAutomationRunRecord | null> {
  const bucket = await readOrgBucket(orgId);
  if (!bucket.automations.some((row) => row.id === automationId)) return null;
  const now = nowIso();
  const status = input?.status ?? "queued";
  const run: LabAutomationRunRecord = {
    id: `run_${randomUUID()}`,
    automationId,
    status,
    triggerType: input?.triggerType ?? "manual",
    startedBy,
    startedAt: now,
    updatedAt: now,
    finishedAt: status === "completed" || status === "failed" ? now : undefined,
    sessionPath: safeString(input?.sessionPath, "", 400) || undefined,
    error: safeString(input?.error, "", MAX_RUN_ERROR_LENGTH) || undefined,
    metadata: safeMetadata(input?.metadata),
  };
  bucket.runs = [run, ...bucket.runs].slice(0, MAX_RUNS_PER_ORG);
  await writeOrgBucket(orgId, bucket);
  return run;
}

export async function listLabAutomationRuns(
  orgId: string,
  automationId?: string,
): Promise<LabAutomationRunRecord[]> {
  const rows = (await readOrgBucket(orgId)).runs;
  const filtered = automationId ? rows.filter((row) => row.automationId === automationId) : rows;
  return sortByUpdated(filtered);
}
