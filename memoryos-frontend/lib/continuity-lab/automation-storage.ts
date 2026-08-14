/**
 * Client cache and fallback persistence for Continuity Lab Automations.
 * Maps to operational loop shape: goal (name) → triggers → instructions → memory features.
 */

import {
  defaultScheduleConfig,
  scheduleDisplayLabel,
} from "@/lib/continuity-lab/schedule-trigger";
import { broadcastAutomationsChanged } from "@/lib/continuity-lab/automation-events";

export type AutomationInstructionKind = "start_session" | "message_session" | "email_notification";

export type AutomationInstructionBase = {
  id: string;
  kind: AutomationInstructionKind;
};

export type AutomationInstructionEmailWhen = "always" | "on_failure" | "on_success";

export type AutomationInstructionEmail = AutomationInstructionBase & {
  kind: "email_notification";
  emailRecipient: string;
  emailWhen: AutomationInstructionEmailWhen;
};

export type AutomationInstructionMessage = AutomationInstructionBase & {
  kind: "message_session";
  messageSessionId?: string;
  messageSessionTitle?: string;
  messagePrompt: string;
};

export type AutomationInstruction =
  | (AutomationInstructionBase & { kind: "start_session" })
  | AutomationInstructionEmail
  | AutomationInstructionMessage;

export type AutomationTriggerType =
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

export type AutomationTrigger = {
  id: string;
  type: AutomationTriggerType;
  label: string;
  config: Record<string, string>;
};

export type AutomationConnectorId =
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

/** MemoryOS continuity capabilities — honest product surface, not third-party fakes. */
export type AutomationMemoryFeatures = {
  injectResumeBrief: boolean;
  writeActionMemoryOnComplete: boolean;
  requireGovernanceApproval: boolean;
  attachOperationalWiki: boolean;
  continuityHandoffOnComplete: boolean;
  useCompanyBrainContext: boolean;
};

export type AutomationAgentMode = "normal" | "plan" | "debug";

export type AutomationLimits = {
  costLimitEnabled: boolean;
  costLimitUsd: number;
  invocationLimitEnabled: boolean;
  invocationLimit: number;
  invocationWindowHours: number;
};

export type AutomationNetworkPolicy = {
  enabled: boolean;
  allowedDomains: string[];
};

export type AutomationSessionOptions = {
  slackNotificationOnComplete: boolean;
  autoStartChildSessions: boolean;
  emailNotification: boolean;
  notificationEmail: string;
};

export type SavedAutomation = {
  id: string;
  name: string;
  triggers: AutomationTrigger[];
  instructions: string;
  /** Structured instruction rows (email notifications, message sessions, etc). */
  instructionsV2?: AutomationInstruction[];
  connectors: AutomationConnectorId[];
  memoryFeatures: AutomationMemoryFeatures;
  sessionOptions: AutomationSessionOptions;
  agentMode: AutomationAgentMode;
  limits: AutomationLimits;
  networkPolicy: AutomationNetworkPolicy;
  sharedScratchpad: string;
  createdAt: string;
  updatedAt: string;
  goal?: string;
  templateId?: string;
  /** @deprecated Prefer sessionOptions.emailNotification */
  emailNotification?: boolean;
  /** @deprecated Prefer sessionOptions.notificationEmail */
  notificationEmail?: string;
};

export type RecentAutomation = {
  id: string;
  name: string;
  visitedAt: string;
};

export type AutomationDraft = Partial<
  Pick<
    SavedAutomation,
    | "name"
    | "triggers"
    | "instructions"
    | "instructionsV2"
    | "connectors"
    | "memoryFeatures"
    | "sessionOptions"
    | "agentMode"
    | "limits"
    | "networkPolicy"
    | "sharedScratchpad"
    | "goal"
    | "templateId"
    | "emailNotification"
    | "notificationEmail"
  >
>;

export type AutomationStorageState = {
  automations: SavedAutomation[];
  recentAutomations: RecentAutomation[];
  draft: AutomationDraft | null;
};

export type AutomationStorageSaveOptions = {
  broadcast?: boolean;
  orgId?: string;
  reason?: string;
};

const STORAGE_KEY = "memoryos.continuity-lab.automations";
const DRAFT_KEY = "memoryos.continuity-lab.automation-draft";

export const DEFAULT_MEMORY_FEATURES: AutomationMemoryFeatures = {
  injectResumeBrief: true,
  writeActionMemoryOnComplete: true,
  requireGovernanceApproval: false,
  attachOperationalWiki: true,
  continuityHandoffOnComplete: false,
  useCompanyBrainContext: true,
};

export const DEFAULT_SESSION_OPTIONS: AutomationSessionOptions = {
  slackNotificationOnComplete: false,
  autoStartChildSessions: false,
  emailNotification: false,
  notificationEmail: "",
};

const DEFAULT_LIMITS: AutomationLimits = {
  costLimitEnabled: false,
  costLimitUsd: 10,
  invocationLimitEnabled: true,
  invocationLimit: 50,
  invocationWindowHours: 1,
};

const DEFAULT_NETWORK: AutomationNetworkPolicy = {
  enabled: false,
  allowedDomains: [],
};

const DEFAULT_STATE: AutomationStorageState = {
  automations: [],
  recentAutomations: [],
  draft: null,
};

function newId(): string {
  return `auto_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMemoryFeatures(
  input?: Partial<AutomationMemoryFeatures> | null,
): AutomationMemoryFeatures {
  return { ...DEFAULT_MEMORY_FEATURES, ...input };
}

function normalizeSessionOptions(
  input?: Partial<AutomationSessionOptions> | null,
  legacy?: Pick<SavedAutomation, "emailNotification" | "notificationEmail">,
): AutomationSessionOptions {
  const base = { ...DEFAULT_SESSION_OPTIONS, ...input };
  if (legacy?.emailNotification !== undefined) {
    base.emailNotification = legacy.emailNotification;
  }
  if (legacy?.notificationEmail) {
    base.notificationEmail = legacy.notificationEmail;
  }
  return base;
}

function isSavedAutomation(value: unknown): value is SavedAutomation {
  if (!value || typeof value !== "object") return false;
  const a = value as SavedAutomation;
  return (
    typeof a.id === "string" &&
    typeof a.name === "string" &&
    Array.isArray(a.triggers) &&
    typeof a.instructions === "string" &&
    Array.isArray(a.connectors) &&
    typeof a.createdAt === "string" &&
    typeof a.updatedAt === "string"
  );
}

function migrateAutomation(raw: SavedAutomation): SavedAutomation {
  return {
    ...raw,
    memoryFeatures: normalizeMemoryFeatures(raw.memoryFeatures),
    sessionOptions: normalizeSessionOptions(raw.sessionOptions, raw),
    limits: raw.limits ?? { ...DEFAULT_LIMITS },
    networkPolicy: raw.networkPolicy ?? { ...DEFAULT_NETWORK },
    sharedScratchpad: typeof raw.sharedScratchpad === "string" ? raw.sharedScratchpad : "",
    instructionsV2: Array.isArray(raw.instructionsV2) ? raw.instructionsV2 : [],
  };
}

export function readAutomationStorage(): AutomationStorageState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<AutomationStorageState>;
    return {
      automations: Array.isArray(parsed.automations)
        ? parsed.automations.filter(isSavedAutomation).map(migrateAutomation).slice(0, 50)
        : [],
      recentAutomations: Array.isArray(parsed.recentAutomations)
        ? parsed.recentAutomations
            .filter(
              (entry): entry is RecentAutomation =>
                Boolean(entry) &&
                typeof entry === "object" &&
                typeof (entry as RecentAutomation).id === "string" &&
                typeof (entry as RecentAutomation).name === "string",
            )
            .slice(0, 12)
        : [],
      draft: null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveAutomationStorage(
  partial: Partial<AutomationStorageState>,
  options?: AutomationStorageSaveOptions,
): AutomationStorageState {
  const current = readAutomationStorage();
  const next: AutomationStorageState = {
    ...current,
    ...partial,
    draft: null,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        automations: next.automations,
        recentAutomations: next.recentAutomations,
      }),
    );
    if (options?.broadcast !== false) {
      broadcastAutomationsChanged({
        orgId: options?.orgId,
        automations: next.automations,
        recentAutomations: next.recentAutomations,
        updatedAt: new Date().toISOString(),
        reason: options?.reason,
      });
    }
  }
  return next;
}

export function saveAutomationDraft(draft: AutomationDraft): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readAutomationDraft(): AutomationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutomationDraft;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAutomationDraft(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(DRAFT_KEY);
  }
}

export function createAutomation(
  input: Omit<SavedAutomation, "id" | "createdAt" | "updatedAt">,
): SavedAutomation {
  const now = new Date().toISOString();
  const automation: SavedAutomation = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    memoryFeatures: normalizeMemoryFeatures(input.memoryFeatures),
    sessionOptions: normalizeSessionOptions(input.sessionOptions, input),
    limits: input.limits ?? { ...DEFAULT_LIMITS },
    networkPolicy: input.networkPolicy ?? { ...DEFAULT_NETWORK },
  };
  const prev = readAutomationStorage().automations;
  saveAutomationStorage({ automations: [automation, ...prev] }, { reason: "created" });
  touchRecentAutomation({ id: automation.id, name: automation.name });
  return automation;
}

export function updateAutomation(
  id: string,
  partial: Partial<Omit<SavedAutomation, "id" | "createdAt">>,
): SavedAutomation | null {
  const state = readAutomationStorage();
  const idx = state.automations.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const updated: SavedAutomation = migrateAutomation({
    ...state.automations[idx],
    ...partial,
    updatedAt: new Date().toISOString(),
  });
  const automations = [...state.automations];
  automations[idx] = updated;
  saveAutomationStorage({ automations }, { reason: "updated" });
  touchRecentAutomation({ id: updated.id, name: updated.name });
  return updated;
}

export function deleteAutomation(id: string): void {
  const state = readAutomationStorage();
  const automations = state.automations.filter((a) => a.id !== id);
  const recentAutomations = state.recentAutomations.filter((entry) => entry.id !== id);
  saveAutomationStorage({ automations, recentAutomations }, { reason: "deleted" });
}

export function touchRecentAutomation(entry: Omit<RecentAutomation, "visitedAt">): RecentAutomation[] {
  const normalized: RecentAutomation = {
    ...entry,
    visitedAt: new Date().toISOString(),
  };
  const prev = readAutomationStorage().recentAutomations.filter((item) => item.id !== normalized.id);
  const next = [normalized, ...prev].slice(0, 12);
  saveAutomationStorage({ recentAutomations: next }, { reason: "recent" });
  return next;
}

export function defaultAutomationForm(): Omit<SavedAutomation, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    triggers: [],
    instructions: "",
    instructionsV2: [],
    connectors: [],
    memoryFeatures: { ...DEFAULT_MEMORY_FEATURES },
    sessionOptions: { ...DEFAULT_SESSION_OPTIONS },
    agentMode: "normal",
    limits: { ...DEFAULT_LIMITS },
    networkPolicy: { ...DEFAULT_NETWORK },
    sharedScratchpad: "",
    goal: "",
    emailNotification: false,
    notificationEmail: "",
  };
}

export function triggerDisplayLabel(type: AutomationTriggerType, config: Record<string, string>): string {
  if (type === "ci_failure") {
    const repo = config.repo?.trim();
    return repo
      ? `GitHub check run failed · ${repo}`
      : "GitHub check run completed with failure";
  }
  if (type === "slack_message") {
    const ch = config.channel?.trim();
    const adv = config.matchMode === "advanced" ? " (advanced)" : "";
    return ch ? `Slack message in ${ch}${adv}` : "Slack channel message";
  }
  if (type === "github_issue_comment") {
    const cmd = config.command?.trim() || "/memoryos";
    return `GitHub issue comment · ${cmd}`;
  }
  if (type === "github_issue") {
    return "GitHub issue";
  }
  if (type === "github_pull_request") {
    return "GitHub pull request";
  }
  if (type === "github_pr_review") {
    return "GitHub pull request review";
  }
  if (type === "github_pr_review_comment") {
    return "GitHub pull request review comment";
  }
  if (type === "github_check_run") {
    const repo = config.repo?.trim();
    return repo ? `GitHub check run · ${repo}` : "GitHub check run";
  }
  if (type === "github_push") {
    const branch = config.branch?.trim();
    return branch ? `GitHub push · ${branch}` : "GitHub push";
  }
  if (type === "slack_reaction_added") {
    return "Slack reaction added";
  }
  if (type === "slack_message_advanced") {
    return "Slack message (advanced)";
  }
  if (type === "linear_issue_event") {
    const team = config.teamKey?.trim();
    return team ? `Linear issue event · ${team}` : "Linear issue created or updated";
  }
  if (
    type === "schedule_hourly" ||
    type === "schedule_daily" ||
    type === "schedule_weekly" ||
    type === "schedule"
  ) {
    return scheduleDisplayLabel(type, config);
  }
  if (type === "webhook") {
    return "Webhook trigger";
  }
  if (type === "jira_issue_event") {
    const project = config.projectKey?.trim();
    return project ? `Jira issue event · ${project}` : "Jira issue created or updated";
  }
  if (type === "memoryos_handoff") {
    return "MemoryOS continuity handoff";
  }
  const labels: Record<AutomationTriggerType, string> = {
    ci_failure: "CI workflow fails on a pull request",
    slack_message: "New message in Slack channel",
    github_issue_comment: "Comment on GitHub issue",
    github_issue: "GitHub issue event",
    github_pull_request: "GitHub pull request event",
    github_pr_review: "GitHub pull request review",
    github_pr_review_comment: "GitHub pull request review comment",
    github_check_run: "GitHub check run",
    github_push: "GitHub push",
    slack_reaction_added: "Slack reaction added",
    slack_message_advanced: "Slack message advanced",
    linear_issue_event: "Linear issue event",
    schedule_hourly: "Schedule every hour",
    schedule_daily: "Schedule every day",
    schedule_weekly: "Schedule every week",
    webhook: "Webhook",
    jira_issue_event: "Jira issue event",
    memoryos_handoff: "Continuity handoff queued",
    schedule: "Scheduled interval",
    manual: "Manual run",
  };
  return labels[type];
}

export { defaultScheduleConfig };

export function newTrigger(type: AutomationTriggerType, config: Record<string, string> = {}): AutomationTrigger {
  const labels: Record<AutomationTriggerType, string> = {
    ci_failure: "GitHub check run",
    slack_message: "Slack channel",
    github_issue_comment: "GitHub issue comment",
    github_issue: "GitHub issue",
    github_pull_request: "GitHub pull request",
    github_pr_review: "GitHub PR review",
    github_pr_review_comment: "GitHub PR review comment",
    github_check_run: "GitHub check run",
    github_push: "GitHub push",
    slack_reaction_added: "Slack reaction added",
    slack_message_advanced: "Slack message advanced",
    linear_issue_event: "Linear issue",
    schedule_hourly: "Schedule every hour",
    schedule_daily: "Schedule every day",
    schedule_weekly: "Schedule every week",
    webhook: "Webhook",
    jira_issue_event: "Jira issue",
    memoryos_handoff: "MemoryOS handoff",
    schedule: "Scheduled interval",
    manual: "Manual run",
  };
  return {
    id: `trg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: triggerDisplayLabel(type, config) || labels[type],
    config,
  };
}
