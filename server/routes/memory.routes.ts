import { Router, type Response as ExpressResponse } from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { runIngestFlowLangGraph } from "../../lib/workflows/ingestGraphLangGraph";
import { runRetrieveFlowLangGraph } from "../../lib/workflows/retrieveGraphLangGraph";
import { analyzeRetrieval } from "../../lib/memory/retrieveRelevantMemory";
import { listRevisionEvents } from "../../lib/memory/revisionMemory";
import {
  listTimelineEvents,
  recordMemoryCreatedEvent,
} from "../../lib/memory/timelineMemory";
import { explainMemory } from "../../lib/memory/explainMemory";
import {
  archiveMemory,
  unarchiveMemory,
  updateMemoryStatus,
} from "../../lib/memory/archiveMemory";
import { getRetrievalWeights, setRetrievalWeights } from "../../lib/config/retrievalWeights";
import { listMemories, getMemoryForUser } from "../../lib/memory/listMemory";
import { runContinueFlowLangGraph } from "../../lib/workflows/continueGraphLangGraph";
import { runHandoffFlowLangGraph } from "../../lib/workflows/handoffGraphLangGraph";
import { runResumeFlowLangGraph } from "../../lib/workflows/resumeGraphLangGraph";
import { MEMORY_STATUS, MEMORY_TYPES, type Memory, type MemoryStatus, type MemoryType, type OperationalTag } from "../../lib/memory/types";
import { ensureMemoryStoreIntegrity } from "../../lib/memory/startupIntegrity";
import {
  createApiKeyForUser,
  listApiKeysForUser,
  revokeApiKeyForUser,
  type ApiKeyPermissionMode,
} from "../../lib/auth/apiKeyStore";
import { isRelationalRuntimeStore } from "../../lib/storage/runtimeStoreBackend";
import { isRuntimeStoreDbHealthy } from "../../lib/storage/runtimeStoreDb";
import { countApiKeyRequests24h, listRequestHistory, subscribeRequestHistory } from "../middleware/requestLogger";
import {
  ContinueMemorySchema,
  HandoffMemorySchema,
  ProcessMemorySchema,
  VoiceChatSchema,
  VoiceChunkIngestSchema,
  VoiceSessionEndSchema,
  VoiceSessionStartSchema,
  ResumeMemorySchema,
  ResumePromptSchema,
  MemoryContractSchema,
  MemoryStatusPatchSchema,
  RetrievalWeightsSchema,
  RetrieveMemorySchema,
} from "../schemas/memory.schema";

type AgentId = "agent-a" | "agent-b";

function normalizeAgentId(value: unknown): AgentId {
  return value === "agent-b" ? "agent-b" : "agent-a";
}
import { asyncHandler } from "../middleware/asyncHandler";
import {
  type ContinueResponseData,
  type ContinueProjectBriefResponseData,
  type HandoffResponseData,
  type ResumePromptResponseData,
  type ResumeResponseData,
  type RetrieveExplainResponseData,
  type RetrieveResponseData,
} from "../types/api-contracts";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import {
  endVoiceSession,
  getVoiceSession,
  recordVoiceChunk,
  startVoiceSession,
} from "../../lib/voice/sessionStore";
import { generateMemoryAwareResponse } from "../../lib/memory/chatCompletion";
import { getMemoryStoreAdapter } from "../../lib/adapters/registry";
import { upsertRecentMemory } from "../../lib/memory/recentMemoryStore";
import { randomUUID } from "crypto";
import { PLAN_CATALOG, type BillingPlan } from "../../shared/planCatalog";
import { getBillingStateForUser, listBillingEventsForUser, tryConsumeUsage, type UsageSnapshot } from "../../lib/billing/store";
import {
  type MemoryMeterOperation,
  getMeteringCatalog,
  resolveUsageCost,
} from "../../lib/billing/metering";
import {
  getCompanyBrainFunnelProgress,
  patchCompanyBrainFunnelProgress,
} from "../../lib/integrations/companyBrainFunnelStore";

export const memoryRouter = Router();

type MemoryRealtimeEvent = {
  kind:
    | "memory_processed"
    | "handoff_generated"
    | "resume_generated"
    | "timeline_updated"
    | "request_logged"
    | "governance_review_queued";
  userId: string;
  payload: Record<string, unknown>;
};

const MEMORY_STREAMS = new Map<string, Set<ExpressResponse>>();

function emitMemoryEvent(event: MemoryRealtimeEvent): void {
  const sinks = MEMORY_STREAMS.get(event.userId);
  if (!sinks || sinks.size === 0) return;
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sinks) {
    try {
      res.write(line);
    } catch {
      // Stale connections are removed by the close handler.
    }
  }
}

subscribeRequestHistory((entry) => {
  if (!entry.userId || entry.userId === "anonymous") return;
  if (!entry.path.startsWith("/api/memory") && !entry.path.startsWith("/api/v1/memory")) return;
  if (entry.path.startsWith("/api/memory/events")) return;

  emitMemoryEvent({
    kind: "request_logged",
    userId: entry.userId,
    payload: { request: entry },
  });
});

const DATA_DIR = path.join(process.cwd(), "data");
const RECENT_MEMORY_STORE_PATH = path.join(DATA_DIR, "recent-memories.json");
const TIMELINE_STORE_PATH = path.join(DATA_DIR, "timeline-events.json");
const REVISION_STORE_PATH = path.join(DATA_DIR, "revision-events.json");
const BEST_CONFIG_PATH = path.join(DATA_DIR, "eval", "best-config.json");
const BASELINE_REPORT_PATH = path.join(DATA_DIR, "eval", "baseline-report.json");
const BENCHMARK_REPORT_PATH = path.join(DATA_DIR, "eval", "benchmark-report.json");
const COMPANY_BRAIN_EXPORTS_PATH = path.join(DATA_DIR, "company-brain-exports.json");

const REQUEST_RANGE_DAYS = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  all: null,
} as const;

const REQUEST_STATUSES = ["Success", "Error"] as const;
const API_KEY_EXPIRY_OPTIONS = ["30 days", "90 days", "1 year", "Never"] as const;
const API_KEY_ENDPOINTS = [
  "retrieve",
  "resume",
  "continue",
  "handoff",
  "memory_add",
  "memory_update",
  "memory_delete",
  "search",
] as const;

type BaselineReport = {
  passRate: number;
  totalCases: number;
  updatedAt?: string;
};

type CompanyBrainExportRecord = {
  id: string;
  workspace: string;
  generatedAt: string;
  stats: {
    activeMemoryCount: number;
    totalTimelineEvents: number;
    decisions: number;
    constraints: number;
    incidents: number;
    runbooks: number;
    openRisks: number;
  };
  skillsMarkdown: string;
};

type RequestRange = keyof typeof REQUEST_RANGE_DAYS;
type TeamRole = "owner" | "admin" | "member";
type TeamAccess = "Full" | "Scoped" | "Read";
type PluginStatus = "available" | "installed" | "degraded";

type BillingInvoice = {
  id: string;
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void";
  issuedAt: string;
  hostedInvoiceUrl: string | null;
};

type TeamMemberRecord = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  access: TeamAccess;
  joined: string;
  status: "active" | "invited";
};

type TeamInviteRecord = {
  id: string;
  email: string;
  role: TeamRole;
  access: TeamAccess;
  sentAt: string;
  state: "pending" | "accepted" | "expired";
};

type PluginRecord = {
  id: string;
  name: string;
  category: string;
  runtime: string;
  version: string;
  status: PluginStatus;
  capabilities: string[];
  source: string;
  installedAt?: string;
  updatedAt?: string;
  health: "healthy" | "unknown" | "error";
  healthDetail?: string;
};

type PluginEvent = {
  id: string;
  pluginId: string;
  action: "installed" | "uninstalled";
  at: string;
};

type PluginUserState = {
  installed: string[];
  events: PluginEvent[];
};

type PluginStoreState = {
  users: Record<string, PluginUserState>;
};

type GovernancePolicyStore = {
  users: Record<string, GovernancePolicy | { policy: GovernancePolicy; savedAt: string }>;
};

type ConflictActionRecord = {
  id: string;
  traceId: string;
  userId: string;
  type: "mark_stale" | "pin" | "merge";
  memoryId: string;
  beforeStatus: string | null;
  afterStatus: string | null;
  result: "success" | "fail";
  error: string | null;
  actor: "user";
  at: string;
};

type ConflictActionStore = {
  actions: ConflictActionRecord[];
};

type ConflictQueueItem = {
  id: string;
  traceId: string;
  userId: string;
  memoryId: string;
  conflictingWithMemoryId: string;
  severity: "low" | "medium" | "high";
  reason: string;
  suggestedAction: "replace" | "merge" | "pin_old" | "deprecate";
  confidence: number;
  state: "open" | "resolved";
  createdAt: string;
  resolvedAt?: string;
  resolution?: "replace" | "merge" | "pin_old" | "deprecate";
};

type ConflictQueueStore = {
  items: ConflictQueueItem[];
};

type GovernanceReviewItem = {
  id: string;
  traceId: string;
  userId: string;
  reason: string;
  payload: {
    threadId?: string;
    message?: string;
    contract?: unknown;
    governance: GovernancePolicy;
    operationalTags?: string[];
  };
  state: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedByRole?: TeamRole;
  reviewNote?: string;
};

type GovernanceReviewStore = {
  items: GovernanceReviewItem[];
};

type WorkspaceState = {
  workspaceName: string;
  plan: BillingPlan;
  usage: {
    tokenLimit: number;
    tokenUsed: number;
    searchLimit: number;
    searchUsed: number;
    resetInDays: number;
  };
  invoices: BillingInvoice[];
  members: TeamMemberRecord[];
  invites: TeamInviteRecord[];
  organization: {
    organizationId: string;
    ownerName: string;
    ownerEmail: string;
    contextEnabled: boolean;
  };
};

type CheckoutProvider = "polar" | "custom";
type PlanTier = "Free" | "Pro" | "Scale" | "Enterprise";
const PLAN_RANK: Record<PlanTier, number> = {
  Free: 0,
  Pro: 1,
  Scale: 2,
  Enterprise: 3,
};

const WORKSPACE_STATE_BY_USER = new Map<string, WorkspaceState>();
const PLUGIN_STORE_PATH = path.join(DATA_DIR, "plugins-state.json");
const GOVERNANCE_POLICY_STORE_PATH = path.join(DATA_DIR, "governance-policies.json");
const CONFLICT_ACTIONS_STORE_PATH = path.join(DATA_DIR, "conflict-actions.json");
const CONFLICT_QUEUE_STORE_PATH = path.join(DATA_DIR, "conflict-queue.json");
const GOVERNANCE_REVIEW_STORE_PATH = path.join(DATA_DIR, "governance-review-queue.json");
const GOVERNANCE_POLICY_BY_USER = new Map<string, GovernancePolicy>();
const GOVERNANCE_POLICY_SAVED_AT_BY_USER = new Map<string, string>();
let GOVERNANCE_POLICY_STORE_LOADED = false;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type GovernancePolicy = {
  ttlHours: number;
  retentionClass: "short" | "standard" | "long";
  pinCriticalDecisions: boolean;
  redactSecrets: boolean;
  requireManualReviewForHighRisk: boolean;
  mode: "balanced" | "strict" | "enterprise";
};

const DEFAULT_GOVERNANCE_POLICY: GovernancePolicy = {
  ttlHours: 168,
  retentionClass: "standard",
  pinCriticalDecisions: true,
  redactSecrets: true,
  requireManualReviewForHighRisk: false,
  mode: "balanced",
};

const SECRET_KEY_PATTERN = /(api[-_]?key|token|password|secret|authorization|bearer|private[-_]?key)/i;

function applySecretRedaction(input: string): string {
  return input
    .split("\n")
    .map((line) => {
      if (!SECRET_KEY_PATTERN.test(line)) return line;
      const [key] = line.split(/[:=]/, 1);
      return key ? `${key}: [REDACTED]` : "[REDACTED]";
    })
    .join("\n");
}

function sanitizeStringList(values: string[] | undefined, redactSecrets: boolean): string[] | undefined {
  if (!values || values.length === 0) return undefined;
  return values.map((value) => (redactSecrets ? applySecretRedaction(value) : value));
}

function resolveGovernancePolicy(input: unknown): GovernancePolicy {
  if (!isObjectRecord(input)) return DEFAULT_GOVERNANCE_POLICY;

  const retentionClass =
    input.retentionClass === "short" || input.retentionClass === "standard" || input.retentionClass === "long"
      ? input.retentionClass
      : DEFAULT_GOVERNANCE_POLICY.retentionClass;
  const retentionTtl = retentionClass === "short" ? 24 : retentionClass === "long" ? 720 : 168;

  const ttlHours =
    typeof input.ttlHours === "number" && Number.isFinite(input.ttlHours)
      ? Math.max(1, Math.min(720, Math.round(input.ttlHours)))
      : retentionTtl;
  const pinCriticalDecisions =
    typeof input.pinCriticalDecisions === "boolean"
      ? input.pinCriticalDecisions
      : DEFAULT_GOVERNANCE_POLICY.pinCriticalDecisions;
  const redactSecrets =
    typeof input.redactSecrets === "boolean"
      ? input.redactSecrets
      : DEFAULT_GOVERNANCE_POLICY.redactSecrets;
  const requireManualReviewForHighRisk =
    typeof input.requireManualReviewForHighRisk === "boolean"
      ? input.requireManualReviewForHighRisk
      : DEFAULT_GOVERNANCE_POLICY.requireManualReviewForHighRisk;
  const mode =
    input.mode === "strict" || input.mode === "enterprise" || input.mode === "balanced"
      ? input.mode
      : DEFAULT_GOVERNANCE_POLICY.mode;

  return { ttlHours, retentionClass, pinCriticalDecisions, redactSecrets, requireManualReviewForHighRisk, mode };
}

function getGovernancePolicyForUser(userId: string): GovernancePolicy {
  ensureGovernancePolicyStoreLoaded();
  return GOVERNANCE_POLICY_BY_USER.get(userId) ?? DEFAULT_GOVERNANCE_POLICY;
}

function setGovernancePolicyForUser(userId: string, input: unknown): GovernancePolicy {
  ensureGovernancePolicyStoreLoaded();
  const resolved = resolveGovernancePolicy(input);
  const savedAt = new Date().toISOString();
  GOVERNANCE_POLICY_BY_USER.set(userId, resolved);
  GOVERNANCE_POLICY_SAVED_AT_BY_USER.set(userId, savedAt);
  const users: Record<string, { policy: GovernancePolicy; savedAt: string }> = {};
  for (const [storedUserId, policy] of GOVERNANCE_POLICY_BY_USER.entries()) {
    users[storedUserId] = {
      policy,
      savedAt: GOVERNANCE_POLICY_SAVED_AT_BY_USER.get(storedUserId) ?? savedAt,
    };
  }
  writeGovernancePolicyStore({ users });
  return resolved;
}

function resolveGovernancePolicyWithUserDefault(userId: string, input: unknown): GovernancePolicy {
  const userDefault = getGovernancePolicyForUser(userId);
  if (!isObjectRecord(input)) return userDefault;
  return resolveGovernancePolicy({
    retentionClass:
      input.retentionClass === "short" || input.retentionClass === "standard" || input.retentionClass === "long"
        ? input.retentionClass
        : userDefault.retentionClass,
    ttlHours:
      typeof input.ttlHours === "number" && Number.isFinite(input.ttlHours)
        ? input.ttlHours
        : userDefault.ttlHours,
    pinCriticalDecisions:
      typeof input.pinCriticalDecisions === "boolean"
        ? input.pinCriticalDecisions
        : userDefault.pinCriticalDecisions,
    redactSecrets:
      typeof input.redactSecrets === "boolean"
        ? input.redactSecrets
        : userDefault.redactSecrets,
    requireManualReviewForHighRisk:
      typeof input.requireManualReviewForHighRisk === "boolean"
        ? input.requireManualReviewForHighRisk
        : userDefault.requireManualReviewForHighRisk,
    mode:
      input.mode === "balanced" || input.mode === "strict" || input.mode === "enterprise"
        ? input.mode
        : userDefault.mode,
  });
}

function inferActorRole(reqBody: unknown): TeamRole {
  if (isObjectRecord(reqBody)) {
    const role = reqBody.actorRole;
    if (role === "owner" || role === "admin" || role === "member") {
      return role;
    }
  }
  return "owner";
}

function canManageGovernance(role: TeamRole): boolean {
  return role === "owner" || role === "admin";
}

function resolveActorRoleForUser(userId: string): TeamRole {
  const state = getWorkspaceState(userId);
  const owner = state.members.find((member) => member.role === "owner");
  if (!owner) return "owner";
  return owner.email.startsWith(userId) ? "owner" : "member";
}

function isHighRiskWrite(input: {
  message?: string;
  contract?: unknown;
  governance: GovernancePolicy;
}): { highRisk: boolean; reason: string } {
  const text = `${input.message ?? ""}\n${JSON.stringify(input.contract ?? {})}`.toLowerCase();
  const hasSensitiveSignals =
    /(ssn|passport|credit card|private key|bearer|token|password|api key|phi|pii)/i.test(text);
  const hasLargeContract =
    isObjectRecord(input.contract) &&
    JSON.stringify(input.contract).length > 1500;
  const highRisk = hasSensitiveSignals || hasLargeContract || input.governance.mode === "enterprise";
  if (!highRisk) {
    return { highRisk: false, reason: "not_high_risk" };
  }
  if (hasSensitiveSignals) return { highRisk: true, reason: "sensitive_data_signal" };
  if (hasLargeContract) return { highRisk: true, reason: "large_contract_payload" };
  return { highRisk: true, reason: "enterprise_policy_guardrail" };
}

function classifyOperationalTags(input: {
  message?: string;
  contract?: {
    goal?: string;
    constraints?: string[];
    decisions?: string[];
    open_risks?: string[];
    next_actions?: string[];
  };
}): OperationalTag[] {
  const tags = new Set<OperationalTag>();
  const text = `${input.message ?? ""}\n${JSON.stringify(input.contract ?? {})}`.toLowerCase();
  if (/\b(decision|decide|selected|approved|choice|pricing exception)\b/i.test(text)) tags.add("decision");
  if (/\b(policy|compliance|legal|security|approval|required|guardrail)\b/i.test(text)) tags.add("policy");
  if (/\b(incident|outage|sev|postmortem|rollback|failed deploy|production issue|bug)\b/i.test(text)) tags.add("incident");
  if (/\b(runbook|playbook|procedure|step-by-step|checklist)\b/i.test(text)) tags.add("runbook");
  if ((input.contract?.decisions?.length ?? 0) > 0) tags.add("decision");
  if ((input.contract?.constraints?.length ?? 0) > 0) tags.add("policy");
  if ((input.contract?.open_risks?.length ?? 0) > 0) tags.add("incident");
  if ((input.contract?.next_actions?.length ?? 0) > 0) tags.add("runbook");
  return Array.from(tags);
}

async function applyOperationalTagsToMemories(input: {
  memories: Memory[];
  tags: OperationalTag[];
}): Promise<Memory[]> {
  if (input.tags.length === 0 || input.memories.length === 0) return input.memories;
  const memoryStore = getMemoryStoreAdapter();
  const updated: Memory[] = [];
  for (const memory of input.memories) {
    const mergedTags = Array.from(new Set([...(memory.operationalTags ?? []), ...input.tags]));
    const nextMemory: Memory = {
      ...memory,
      operationalTags: mergedTags,
      updatedAt: new Date().toISOString(),
    };
    await memoryStore.saveMemory({ memory: nextMemory });
    await upsertRecentMemory(nextMemory);
    updated.push(nextMemory);
  }
  return updated;
}

function minimumContractFieldsForMode(mode: GovernancePolicy["mode"]): number {
  if (mode === "enterprise") return 4;
  if (mode === "strict") return 3;
  return 2;
}

type ContractLike = {
  goal?: string;
  constraints?: string[];
  decisions?: string[];
  open_risks?: string[];
  next_actions?: string[];
};

function computeContractQuality(contract: ContractLike): {
  score: number;
  grade: "A" | "B" | "C" | "D";
  presentFields: string[];
  missingFields: string[];
  reasons: string[];
} {
  const checks = [
    { key: "goal", ok: typeof contract.goal === "string" && contract.goal.trim().length > 0, weight: 28 },
    { key: "constraints", ok: (contract.constraints?.length ?? 0) > 0, weight: 18 },
    { key: "decisions", ok: (contract.decisions?.length ?? 0) > 0, weight: 18 },
    { key: "open_risks", ok: (contract.open_risks?.length ?? 0) > 0, weight: 18 },
    { key: "next_actions", ok: (contract.next_actions?.length ?? 0) > 0, weight: 18 },
  ] as const;
  const presentFields = checks.filter((check) => check.ok).map((check) => check.key);
  const missingFields = checks.filter((check) => !check.ok).map((check) => check.key);
  const score = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
  const grade: "A" | "B" | "C" | "D" =
    score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
  const reasons = [
    missingFields.includes("goal") ? "Missing explicit goal blocks execution continuity." : undefined,
    missingFields.includes("constraints") ? "Missing constraints increases drift risk." : undefined,
    missingFields.includes("decisions") ? "Missing decisions weakens handoff fidelity." : undefined,
    missingFields.includes("open_risks") ? "Missing risks hides blockers and uncertainty." : undefined,
    missingFields.includes("next_actions") ? "Missing next actions prevents reliable continuation." : undefined,
  ].filter((item): item is string => Boolean(item));
  return { score, grade, presentFields, missingFields, reasons };
}

function extractGoalIntakeFromMessage(message: string): {
  goal?: string;
  owner?: string;
  deadline?: string;
} {
  const goalMatch = message.match(/\bgoal\s*:\s*(.+)$/im) ?? message.match(/\bmy goal is to\s+(.+?)(?:[.!?]|$)/i);
  const ownerMatch = message.match(/\bowner\s*:\s*(.+)$/im);
  const deadlineMatch =
    message.match(/\bdeadline\s*:\s*(.+)$/im) ??
    message.match(/\bdue(?:\s+date)?\s*:\s*(.+)$/im);
  return {
    goal: goalMatch?.[1]?.trim(),
    owner: ownerMatch?.[1]?.trim(),
    deadline: deadlineMatch?.[1]?.trim(),
  };
}

function buildAgentsMdExport(input: {
  workspace: string;
  project: string;
  governance: GovernancePolicy;
  sampleContract: {
    goal?: string;
    constraints: string[];
    decisions: string[];
    open_risks: string[];
    next_actions: string[];
  };
}): string {
  return [
    "# AGENTS.md",
    "",
    `workspace: ${input.workspace}`,
    `project: ${input.project}`,
    "schema: memoryos.contract.v1",
    "",
    "## Memory Contract",
    `- goal: ${input.sampleContract.goal ?? "not_set"}`,
    `- constraints: ${input.sampleContract.constraints.length > 0 ? input.sampleContract.constraints.join(" | ") : "none"}`,
    `- decisions: ${input.sampleContract.decisions.length > 0 ? input.sampleContract.decisions.join(" | ") : "none"}`,
    `- open_risks: ${input.sampleContract.open_risks.length > 0 ? input.sampleContract.open_risks.join(" | ") : "none"}`,
    `- next_actions: ${input.sampleContract.next_actions.length > 0 ? input.sampleContract.next_actions.join(" | ") : "none"}`,
    "",
    "## Governance",
    `- mode: ${input.governance.mode}`,
    `- retention_class: ${input.governance.retentionClass}`,
    `- ttl_hours: ${input.governance.ttlHours}`,
    `- redact_secrets: ${input.governance.redactSecrets ? "true" : "false"}`,
    `- pin_critical_decisions: ${input.governance.pinCriticalDecisions ? "true" : "false"}`,
    `- manual_review_high_risk: ${input.governance.requireManualReviewForHighRisk ? "true" : "false"}`,
    "",
    "## Execution",
    "- context_injection: required",
    "- continuity_benchmark: enabled",
    "- conflict_staleness_checks: enabled",
  ].join("\n");
}

function createTraceId(prefix: string): string {
  return `${prefix}_${randomUUID().slice(0, 12)}`;
}

function normalizeConflictText(input: string): string {
  return input.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function inferConflictSeverity(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
}

function detectAutoConflicts(params: {
  userId: string;
  traceId: string;
  acceptedMemories: Memory[];
  existingMemories: Memory[];
}): ConflictQueueItem[] {
  const items: ConflictQueueItem[] = [];
  for (const accepted of params.acceptedMemories) {
    const acceptedText = normalizeConflictText(`${accepted.summary} ${accepted.content}`);
    for (const existing of params.existingMemories) {
      if (existing.id === accepted.id) continue;
      if (existing.type !== accepted.type) continue;
      if (existing.status !== "active") continue;

      const existingText = normalizeConflictText(`${existing.summary} ${existing.content}`);
      const hasDirectNegationPair =
        (acceptedText.includes(" not ") && existingText.includes(" prefer ")) ||
        (existingText.includes(" not ") && acceptedText.includes(" prefer ")) ||
        (acceptedText.includes(" no longer ") || existingText.includes(" no longer "));
      const containsSameAnchor =
        acceptedText.includes("memoryos") && existingText.includes("memoryos");
      const candidateConflict = hasDirectNegationPair || containsSameAnchor;
      if (!candidateConflict) continue;

      const confidence = Math.min(
        0.95,
        0.55 +
          (accepted.type === "preference" ? 0.2 : 0.1) +
          (accepted.evidenceCount >= 2 ? 0.1 : 0) +
          (existing.evidenceCount >= 2 ? 0.1 : 0),
      );
      items.push({
        id: `cq_${randomUUID().slice(0, 10)}`,
        traceId: params.traceId,
        userId: params.userId,
        memoryId: accepted.id,
        conflictingWithMemoryId: existing.id,
        severity: inferConflictSeverity(confidence),
        reason: "Auto-detected contradictory or stale continuity signals between active memories.",
        suggestedAction: accepted.type === "preference" ? "replace" : "merge",
        confidence,
        state: "open",
        createdAt: new Date().toISOString(),
      });
    }
  }
  return items;
}

function isApiKeyPermissionMode(value: unknown): value is ApiKeyPermissionMode {
  return value === "full" || value === "scoped";
}

function isAllowedApiKeyEndpoint(value: unknown): value is (typeof API_KEY_ENDPOINTS)[number] {
  return typeof value === "string" && API_KEY_ENDPOINTS.includes(value as (typeof API_KEY_ENDPOINTS)[number]);
}

function hasValidJsonFile(
  filePath: string,
  isValid: (value: unknown) => boolean,
): boolean {
  if (!existsSync(filePath)) {
    return false;
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return isValid(parsed);
  } catch {
    return false;
  }
}

async function hasValidStores(): Promise<boolean> {
  if (isRelationalRuntimeStore()) {
    return isRuntimeStoreDbHealthy();
  }

  const recentOk = hasValidJsonFile(RECENT_MEMORY_STORE_PATH, (value) => {
    if (!isObjectRecord(value)) {
      return false;
    }
    return Object.values(value).every((entry) => Array.isArray(entry));
  });

  const timelineOk = hasValidJsonFile(TIMELINE_STORE_PATH, Array.isArray);
  const revisionOk = hasValidJsonFile(REVISION_STORE_PATH, Array.isArray);

  return recentOk && timelineOk && revisionOk;
}

function hasValidBestConfig(): boolean {
  return hasValidJsonFile(BEST_CONFIG_PATH, (value) => {
    if (!isObjectRecord(value)) {
      return false;
    }

    const threshold = value.threshold;
    const weights = value.weights;

    if (
      typeof threshold !== "number" ||
      Number.isNaN(threshold) ||
      threshold < 0 ||
      threshold > 1
    ) {
      return false;
    }

    if (!isObjectRecord(weights)) {
      return false;
    }

    const semantic = weights.semantic;
    const typeRelevance = weights.typeRelevance;
    const importance = weights.importance;
    const recency = weights.recency;

    const values = [semantic, typeRelevance, importance, recency];

    if (
      values.some(
        (item) =>
          typeof item !== "number" ||
          Number.isNaN(item) ||
          item < 0 ||
          item > 1,
      )
    ) {
      return false;
    }

    const sum =
      (semantic as number) +
      (typeRelevance as number) +
      (importance as number) +
      (recency as number);
    return Math.abs(sum - 1) <= 1e-6;
  });
}

memoryRouter.get("/api-keys", asyncHandler(async (req, res) => {
  const keys = listApiKeysForUser(req.authUserId).map((key) => serializeApiKeyForClient(key));
  res.json({ keys });
}));

memoryRouter.post("/api-keys", asyncHandler(async (req, res) => {
  if (!isObjectRecord(req.body)) {
    res.status(400).json({ error: "Invalid API key payload" });
    return;
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const expires = typeof req.body.expires === "string" ? req.body.expires : "1 year";
  const mode = req.body.mode;
  const contentTag =
    typeof req.body.contentTag === "string" && req.body.contentTag.trim().length > 0
      ? req.body.contentTag.trim()
      : "all";
  const requestedEndpoints = Array.isArray(req.body.endpoints)
    ? req.body.endpoints.filter(isAllowedApiKeyEndpoint)
    : [];

  if (name.length === 0) {
    res.status(400).json({ error: "API key name is required" });
    return;
  }

  if (!API_KEY_EXPIRY_OPTIONS.includes(expires as (typeof API_KEY_EXPIRY_OPTIONS)[number])) {
    res.status(400).json({ error: "Invalid API key expiry" });
    return;
  }

  if (!isApiKeyPermissionMode(mode)) {
    res.status(400).json({ error: "Invalid API key permission mode" });
    return;
  }

  if (mode === "scoped" && requestedEndpoints.length === 0) {
    res.status(400).json({ error: "Scoped keys require at least one endpoint" });
    return;
  }

  const result = createApiKeyForUser({
    userId: req.authUserId,
    name,
    expires,
    mode,
    endpoints: mode === "full" ? [...API_KEY_ENDPOINTS] : requestedEndpoints,
    contentTag: mode === "full" ? "all" : contentTag,
  });

  res.status(201).json({
    token: result.token,
    key: serializeApiKeyForClient(result.key),
  });
}));

memoryRouter.post("/api-keys/:keyId/revoke", asyncHandler(async (req, res) => {
  const revoked = revokeApiKeyForUser(req.authUserId, req.params.keyId as string);
  if (!revoked) {
    res.status(404).json({ error: "API key not found" });
    return;
  }

  res.json({ key: revoked });
}));

memoryRouter.get("/billing", asyncHandler(async (req, res) => {
  const state = getWorkspaceState(req.authUserId);
  const billingState = await getBillingStateForUser(req.authUserId);
  state.plan = billingState.plan;
  const checkoutConfigured = Boolean(
    process.env.CHECKOUT_URL_PRO?.trim() ||
      process.env.CHECKOUT_URL_SCALE?.trim() ||
      process.env.CHECKOUT_URL_ENTERPRISE?.trim() ||
      process.env.POLAR_CHECKOUT_URL_PRO?.trim() ||
      process.env.POLAR_CHECKOUT_URL_SCALE?.trim() ||
      process.env.POLAR_CHECKOUT_URL_ENTERPRISE?.trim(),
  );
  res.json({
    workspaceName: state.workspaceName,
    currentPlan: billingState.plan,
    usage: billingState.usage,
    seats: {
      activeMembers: state.members.filter((member) => member.status === "active").length,
      pendingInvites: state.invites.filter((invite) => invite.state === "pending").length,
      seatLimit: PLAN_CATALOG[billingState.plan].seatLimit,
    },
    connectorSyncUsage: {
      used: billingState.connectorSyncUsed ?? 0,
      limit: PLAN_CATALOG[billingState.plan].connectorSyncRecordLimit,
    },
    invoices: billingState.invoices,
    events: await listBillingEventsForUser(req.authUserId, 30),
    checkout: {
      configured: checkoutConfigured,
      provider: resolveCheckoutProvider(),
      portalUrl: toBillingPortalUrl(),
    },
  });
}));

memoryRouter.get("/billing/events", asyncHandler(async (req, res) => {
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 40;
  const limit = Number.isFinite(limitRaw) ? limitRaw : 40;
  res.json({ events: await listBillingEventsForUser(req.authUserId, limit) });
}));

memoryRouter.get("/billing/metering", asyncHandler(async (_req, res) => {
  res.json(getMeteringCatalog());
}));

memoryRouter.post("/billing/checkout", asyncHandler(async (req, res) => {
  if (!isObjectRecord(req.body) || typeof req.body.plan !== "string") {
    res.status(400).json({ error: "plan is required" });
    return;
  }
  const requestedPlan = req.body.plan as BillingPlan;
  const allowedPlans: BillingPlan[] = ["Pro", "Scale", "Enterprise"];
  if (!allowedPlans.includes(requestedPlan)) {
    res.status(400).json({ error: "Invalid plan for checkout" });
    return;
  }
  const checkoutBase = toConfiguredCheckoutUrl(requestedPlan);
  if (!checkoutBase) {
    res.status(500).json({
      error: `Checkout URL is not configured for ${requestedPlan}`,
      requiredEnv: `CHECKOUT_URL_${requestedPlan.toUpperCase()}`,
    });
    return;
  }
  const checkoutUrl = appendCheckoutMetadata(checkoutBase, req.authUserId, requestedPlan);
  const state = getWorkspaceState(req.authUserId);
  const billingState = await getBillingStateForUser(req.authUserId);
  res.json({
    checkoutUrl,
    portalUrl: toBillingPortalUrl(),
    pendingPlan: requestedPlan,
    pendingActivation: true,
    currentPlan: billingState.plan ?? state.plan,
  });
}));

memoryRouter.get("/team", asyncHandler(async (req, res) => {
  const state = getWorkspaceState(req.authUserId);
  res.json({
    workspaceName: state.workspaceName,
    plan: state.plan,
    members: state.members,
    invites: state.invites,
  });
}));

memoryRouter.post("/team/invites", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Pro"))) {
    res.status(402).json({
      error: "Team invites require Pro or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Pro", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  if (
    !isObjectRecord(req.body) ||
    typeof req.body.email !== "string" ||
    typeof req.body.role !== "string" ||
    typeof req.body.access !== "string"
  ) {
    res.status(400).json({ error: "Invalid invite payload" });
    return;
  }
  const role = req.body.role as TeamRole;
  const access = req.body.access as TeamAccess;
  const email = req.body.email.trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Invite email is required" });
    return;
  }
  if (!["owner", "admin", "member"].includes(role)) {
    res.status(400).json({ error: "Invalid invite role" });
    return;
  }
  if (!["Full", "Scoped", "Read"].includes(access)) {
    res.status(400).json({ error: "Invalid invite access" });
    return;
  }
  const state = getWorkspaceState(req.authUserId);
  const currentPlan = (await getBillingStateForUser(req.authUserId)).plan;
  const seatLimit = PLAN_CATALOG[currentPlan].seatLimit;
  const activeMembers = state.members.filter((member) => member.status === "active").length;
  const pendingInvites = state.invites.filter((invite) => invite.state === "pending").length;
  if (seatLimit !== null && activeMembers + pendingInvites >= seatLimit) {
    res.status(402).json({
      error: `Seat limit reached for ${currentPlan}.`,
      code: "SEAT_LIMIT_REACHED",
      details: {
        plan: currentPlan,
        seatLimit,
        activeMembers,
        pendingInvites,
      },
    });
    return;
  }
  const invite: TeamInviteRecord = {
    id: randomUUID(),
    email,
    role,
    access,
    sentAt: new Date().toISOString(),
    state: "pending",
  };
  state.invites = [invite, ...state.invites].slice(0, 30);
  res.status(201).json({ invite, invites: state.invites });
}));

memoryRouter.get("/plugins", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Pro"))) {
    res.status(402).json({
      error: "Plugin catalog requires Pro or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Pro", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  const { plugins, events } = buildPluginCatalog(req.authUserId);
  res.json({ plugins, events });
}));

memoryRouter.get("/governance-policy", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Scale"))) {
    res.status(402).json({
      error: "Governance policy requires Scale or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Scale", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  const savedAt = GOVERNANCE_POLICY_SAVED_AT_BY_USER.get(req.authUserId) ?? null;
  res.status(200).json({
    governance: getGovernancePolicyForUser(req.authUserId),
    savedAt,
  });
}));

memoryRouter.post("/governance-policy", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Scale"))) {
    res.status(402).json({
      error: "Governance policy requires Scale or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Scale", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  if (!isObjectRecord(req.body)) {
    res.status(400).json({ error: "Invalid governance payload" });
    return;
  }
  const actorRole = resolveActorRoleForUser(req.authUserId);
  if (!canManageGovernance(actorRole)) {
    res.status(403).json({ error: "Only owner/admin can modify governance policy" });
    return;
  }

  const policy = setGovernancePolicyForUser(req.authUserId, req.body.governance ?? req.body);
  const savedAt = GOVERNANCE_POLICY_SAVED_AT_BY_USER.get(req.authUserId) ?? new Date().toISOString();
  res.status(200).json({
    governance: policy,
    savedAt,
  });
}));

memoryRouter.post("/contract/validate", asyncHandler(async (req, res) => {
  const traceId = createTraceId("contract_validate");
  if (!isObjectRecord(req.body)) {
    res.status(400).json({ error: "Invalid contract payload", traceId });
    return;
  }

  const contractCandidate = isObjectRecord(req.body.contract) ? req.body.contract : req.body;
  const parsedContract = MemoryContractSchema.safeParse(contractCandidate);
  if (!parsedContract.success) {
    res.status(400).json({
      error: "Invalid contract fields",
      details: parsedContract.error.flatten(),
      traceId,
    });
    return;
  }

  const governanceModeRaw = req.body.governanceMode;
  const governanceMode: GovernancePolicy["mode"] =
    governanceModeRaw === "strict" || governanceModeRaw === "enterprise" || governanceModeRaw === "balanced"
      ? governanceModeRaw
      : getGovernancePolicyForUser(req.authUserId).mode;

  const contract = parsedContract.data;
  const checks = [
    { key: "goal", label: "goal", ok: typeof contract.goal === "string" && contract.goal.trim().length > 0 },
    { key: "constraints", label: "constraints", ok: (contract.constraints?.length ?? 0) > 0 },
    { key: "decisions", label: "decisions", ok: (contract.decisions?.length ?? 0) > 0 },
    { key: "open_risks", label: "open_risks", ok: (contract.open_risks?.length ?? 0) > 0 },
    { key: "next_actions", label: "next_actions", ok: (contract.next_actions?.length ?? 0) > 0 },
  ];
  const presentFields = checks.filter((item) => item.ok).map((item) => item.label);
  const missingFields = checks.filter((item) => !item.ok).map((item) => item.label);
  const minimumRequired = minimumContractFieldsForMode(governanceMode);
  const completenessScore = Math.round((presentFields.length / checks.length) * 100);
  const pass = presentFields.length >= minimumRequired;
  const quality = computeContractQuality(contract);

  const suggestions = [
    missingFields.includes("goal") ? "Add one explicit goal sentence that defines success." : undefined,
    missingFields.includes("constraints") ? "Add at least one hard constraint (time, stack, policy, budget)." : undefined,
    missingFields.includes("decisions") ? "Capture at least one decision already made to avoid agent drift." : undefined,
    missingFields.includes("open_risks") ? "List unresolved risks/blockers so handoffs preserve uncertainty." : undefined,
    missingFields.includes("next_actions") ? "Add concrete next actions with owner/order." : undefined,
  ].filter((item): item is string => Boolean(item));

  res.status(200).json({
    traceId,
    governanceMode,
    completenessScore,
    minimumRequiredFields: minimumRequired,
    presentFields,
    missingFields,
    pass,
    readyToWrite: pass,
    suggestions,
    qualityScore: quality.score,
    qualityGrade: quality.grade,
    qualityReasons: quality.reasons,
    normalizedContract: contract,
  });
}));

memoryRouter.post("/conflicts/mark-stale", asyncHandler(async (req, res) => {
  const traceId = createTraceId("conflict_stale");
  if (!isObjectRecord(req.body) || typeof req.body.memoryId !== "string" || req.body.memoryId.trim().length === 0) {
    res.status(400).json({ error: "memoryId is required", traceId });
    return;
  }
  const memoryId = req.body.memoryId.trim();
  const before = await getMemoryForUser({ memoryId, userId: req.authUserId });

  const result = await updateMemoryStatus({
    memoryId,
    userId: req.authUserId,
    status: "stale",
  });

  if (result.status === "not_found") {
    appendConflictAction({
      id: randomUUID(),
      traceId,
      userId: req.authUserId,
      type: "mark_stale",
      memoryId,
      beforeStatus: before?.status ?? null,
      afterStatus: null,
      result: "fail",
      error: "Memory not found",
      actor: "user",
      at: new Date().toISOString(),
    });
    res.status(404).json({ error: "Memory not found", traceId });
    return;
  }

  appendConflictAction({
    id: randomUUID(),
    traceId,
    userId: req.authUserId,
    type: "mark_stale",
    memoryId,
    beforeStatus: before?.status ?? null,
    afterStatus: result.memory?.status ?? "stale",
    result: "success",
    error: null,
    actor: "user",
    at: new Date().toISOString(),
  });

  res.status(200).json({
    traceId,
    memory: result.memory ?? null,
    status: result.status,
    timelineEvent: result.timelineEvent ?? null,
  });
}));

memoryRouter.post("/conflicts/merge", asyncHandler(async (req, res) => {
  const traceId = createTraceId("conflict_merge");
  if (!isObjectRecord(req.body) || typeof req.body.memoryId !== "string" || req.body.memoryId.trim().length === 0) {
    res.status(400).json({ error: "memoryId is required", traceId });
    return;
  }
  const memoryId = req.body.memoryId.trim();
  const before = await getMemoryForUser({ memoryId, userId: req.authUserId });

  const result = await updateMemoryStatus({
    memoryId,
    userId: req.authUserId,
    status: "merged",
  });

  if (result.status === "not_found") {
    appendConflictAction({
      id: randomUUID(),
      traceId,
      userId: req.authUserId,
      type: "merge",
      memoryId,
      beforeStatus: before?.status ?? null,
      afterStatus: null,
      result: "fail",
      error: "Memory not found",
      actor: "user",
      at: new Date().toISOString(),
    });
    res.status(404).json({ error: "Memory not found", traceId });
    return;
  }

  appendConflictAction({
    id: randomUUID(),
    traceId,
    userId: req.authUserId,
    type: "merge",
    memoryId,
    beforeStatus: before?.status ?? null,
    afterStatus: result.memory?.status ?? "merged",
    result: "success",
    error: null,
    actor: "user",
    at: new Date().toISOString(),
  });

  res.status(200).json({
    traceId,
    memory: result.memory ?? null,
    status: result.status,
    timelineEvent: result.timelineEvent ?? null,
  });
}));

memoryRouter.post("/conflicts/pin", asyncHandler(async (req, res) => {
  const traceId = createTraceId("conflict_pin");
  if (!isObjectRecord(req.body) || typeof req.body.memoryId !== "string" || req.body.memoryId.trim().length === 0) {
    res.status(400).json({ error: "memoryId is required", traceId });
    return;
  }
  const memoryId = req.body.memoryId.trim();
  const memory = await getMemoryForUser({
    memoryId,
    userId: req.authUserId,
  });
  if (!memory) {
    appendConflictAction({
      id: randomUUID(),
      traceId,
      userId: req.authUserId,
      type: "pin",
      memoryId,
      beforeStatus: null,
      afterStatus: null,
      result: "fail",
      error: "Memory not found",
      actor: "user",
      at: new Date().toISOString(),
    });
    res.status(404).json({ error: "Memory not found", traceId });
    return;
  }

  const nextSummary = memory.summary.startsWith("[PINNED] ")
    ? memory.summary
    : `[PINNED] ${memory.summary}`;
  const pinnedMemory: Memory = {
    ...memory,
    summary: nextSummary,
    updatedAt: new Date().toISOString(),
  };
  await getMemoryStoreAdapter().saveMemory({ memory: pinnedMemory });
  await upsertRecentMemory(pinnedMemory);
  appendConflictAction({
    id: randomUUID(),
    traceId,
    userId: req.authUserId,
    type: "pin",
    memoryId,
    beforeStatus: memory.status,
    afterStatus: pinnedMemory.status,
    result: "success",
    error: null,
    actor: "user",
    at: new Date().toISOString(),
  });

  res.status(200).json({
    traceId,
    memory: pinnedMemory,
    status: "updated",
  });
}));

memoryRouter.get("/conflicts/actions", asyncHandler(async (req, res) => {
  const traceId = createTraceId("conflict_actions");
  const store = readConflictActionStore();
  const actions = store.actions
    .filter((action) => action.userId === req.authUserId)
    .slice(0, 200);
  res.status(200).json({
    traceId,
    actions,
    count: actions.length,
  });
}));

memoryRouter.get("/conflicts/queue", asyncHandler(async (req, res) => {
  const traceId = createTraceId("conflict_queue");
  const queue = readConflictQueueStore();
  const state = req.query.state === "resolved" ? "resolved" : "open";
  const items = queue.items
    .filter((item) => item.userId === req.authUserId && item.state === state)
    .slice(0, 200);
  res.status(200).json({
    traceId,
    state,
    items,
    count: items.length,
  });
}));

memoryRouter.get("/governance/review-queue", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Scale"))) {
    res.status(402).json({
      error: "Governance review queue requires Scale or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Scale", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  const traceId = createTraceId("governance_review_queue");
  const state = req.query.state === "approved" || req.query.state === "rejected" ? req.query.state : "pending";
  const store = readGovernanceReviewStore();
  const items = store.items
    .filter((item) => item.userId === req.authUserId && item.state === state)
    .slice(0, 200);
  res.status(200).json({
    traceId,
    state,
    items,
    count: items.length,
  });
}));

memoryRouter.post("/governance/review", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Scale"))) {
    res.status(402).json({
      error: "Governance review actions require Scale or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Scale", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  const traceId = createTraceId("governance_review");
  const startedAt = Date.now();
  if (
    !isObjectRecord(req.body) ||
    typeof req.body.reviewItemId !== "string" ||
    req.body.reviewItemId.trim().length === 0
  ) {
    res.status(400).json({ error: "reviewItemId is required", traceId });
    return;
  }
  const decision = req.body.decision === "approve" || req.body.decision === "reject" ? req.body.decision : null;
  if (!decision) {
    res.status(400).json({ error: "decision must be approve|reject", traceId });
    return;
  }
  const actorRole = resolveActorRoleForUser(req.authUserId);
  if (!canManageGovernance(actorRole)) {
    res.status(403).json({ error: "Only owner/admin can review high-risk writes", traceId });
    return;
  }

  const store = readGovernanceReviewStore();
  const item = store.items.find((entry) => entry.id === req.body.reviewItemId && entry.userId === req.authUserId);
  if (!item) {
    res.status(404).json({ error: "Review item not found", traceId });
    return;
  }
  if (item.state !== "pending") {
    res.status(400).json({ error: "Review item already finalized", traceId });
    return;
  }

  item.state = decision === "approve" ? "approved" : "rejected";
  item.reviewedAt = new Date().toISOString();
  item.reviewedByRole = actorRole;
  item.reviewNote = typeof req.body.note === "string" ? req.body.note : undefined;
  writeGovernanceReviewStore(store);

  let appliedResult: {
    acceptedCount: number;
    rejectedCount: number;
    timelineCount: number;
    operationalTags: OperationalTag[];
  } | null = null;

  if (decision === "approve" && item.payload) {
    const contract = isObjectRecord(item.payload.contract) ? item.payload.contract as {
      goal?: string;
      constraints?: string[];
      decisions?: string[];
      open_risks?: string[];
      next_actions?: string[];
    } : undefined;
    const contractMessage = contract
      ? [
          typeof contract.goal === "string" && contract.goal.trim().length > 0 ? `Goal: ${contract.goal}` : undefined,
          (contract.constraints?.length ?? 0) > 0 ? `Constraints: ${contract.constraints?.join(" | ")}` : undefined,
          (contract.decisions?.length ?? 0) > 0 ? `Decisions: ${contract.decisions?.join(" | ")}` : undefined,
          (contract.open_risks?.length ?? 0) > 0 ? `Open Risks: ${contract.open_risks?.join(" | ")}` : undefined,
          (contract.next_actions?.length ?? 0) > 0 ? `Next Actions: ${contract.next_actions?.join(" | ")}` : undefined,
        ]
          .filter((part): part is string => Boolean(part))
          .join("\n")
      : "";
    const tags = Array.isArray(item.payload.operationalTags)
      ? item.payload.operationalTags.filter((tag): tag is OperationalTag =>
          tag === "decision" || tag === "policy" || tag === "incident" || tag === "runbook",
        )
      : classifyOperationalTags({
          message: item.payload.message,
          contract: contract,
        });
    const message = [
      tags.length > 0 ? `Operational Tags: ${tags.join(", ")}` : undefined,
      item.payload.message,
      contractMessage,
    ]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join("\n");

    if (message.trim().length > 0) {
      if (!(await applyMeteredOperation({
        req,
        res,
        startedAt,
        operation: "process_ingest",
        text: message,
      }))) {
        return;
      }
      const result = await runIngestFlowLangGraph({
        userId: req.authUserId,
        threadId: item.payload.threadId,
        message,
      });
      const taggedAcceptedMemories = await applyOperationalTagsToMemories({
        memories: result.acceptedMemories,
        tags,
      });
      appliedResult = {
        acceptedCount: taggedAcceptedMemories.length,
        rejectedCount: result.rejectedMemories.length,
        timelineCount: result.timelineEvents.length,
        operationalTags: tags,
      };
    }
  }

  res.status(200).json({
    traceId,
    item,   
    status: item.state,
    appliedResult,
  });
}));

memoryRouter.post("/conflicts/resolve", asyncHandler(async (req, res) => {
  const traceId = createTraceId("conflict_resolve");
  if (
    !isObjectRecord(req.body) ||
    typeof req.body.queueItemId !== "string" ||
    req.body.queueItemId.trim().length === 0
  ) {
    res.status(400).json({ error: "queueItemId is required", traceId });
    return;
  }
  const actionRaw = req.body.action;
  const action =
    actionRaw === "replace" || actionRaw === "merge" || actionRaw === "pin_old" || actionRaw === "deprecate"
      ? actionRaw
      : null;
  if (!action) {
    res.status(400).json({ error: "action must be one of replace|merge|pin_old|deprecate", traceId });
    return;
  }

  const queue = readConflictQueueStore();
  const queueItem = queue.items.find(
    (item) => item.id === req.body.queueItemId && item.userId === req.authUserId,
  );
  if (!queueItem) {
    res.status(404).json({ error: "Conflict queue item not found", traceId });
    return;
  }
  if (queueItem.state === "resolved") {
    res.status(400).json({ error: "Conflict queue item already resolved", traceId });
    return;
  }

  const target = await getMemoryForUser({
    memoryId: queueItem.memoryId,
    userId: req.authUserId,
  });
  const conflicting = await getMemoryForUser({
    memoryId: queueItem.conflictingWithMemoryId,
    userId: req.authUserId,
  });
  if (!target || !conflicting) {
    res.status(404).json({ error: "Related memories not found", traceId });
    return;
  }

  const updatedTarget: Memory = target;
  let updatedConflicting: Memory = conflicting;
  const nowIso = new Date().toISOString();
  if (action === "replace") {
    const staleResult = await updateMemoryStatus({
      memoryId: conflicting.id,
      userId: req.authUserId,
      status: "stale",
    });
    if (staleResult.memory) {
      updatedConflicting = staleResult.memory;
    }
  } else if (action === "merge") {
    const mergedResult = await updateMemoryStatus({
      memoryId: conflicting.id,
      userId: req.authUserId,
      status: "merged",
    });
    if (mergedResult.memory) {
      updatedConflicting = mergedResult.memory;
    }
  } else if (action === "pin_old") {
    updatedConflicting = {
      ...conflicting,
      summary: conflicting.summary.startsWith("[PINNED] ")
        ? conflicting.summary
        : `[PINNED] ${conflicting.summary}`,
      updatedAt: nowIso,
    };
    await getMemoryStoreAdapter().saveMemory({ memory: updatedConflicting });
    await upsertRecentMemory(updatedConflicting);
  } else if (action === "deprecate") {
    const contradictedResult = await updateMemoryStatus({
      memoryId: conflicting.id,
      userId: req.authUserId,
      status: "contradicted",
    });
    if (contradictedResult.memory) {
      updatedConflicting = contradictedResult.memory;
    }
  }

  appendConflictAction({
    id: randomUUID(),
    traceId,
    userId: req.authUserId,
    type: action === "merge" ? "merge" : action === "pin_old" ? "pin" : "mark_stale",
    memoryId: queueItem.memoryId,
    beforeStatus: target.status,
    afterStatus: updatedTarget.status,
    result: "success",
    error: null,
    actor: "user",
    at: nowIso,
  });

  queueItem.state = "resolved";
  queueItem.resolvedAt = nowIso;
  queueItem.resolution = action;
  writeConflictQueueStore(queue);

  res.status(200).json({
    traceId,
    queueItem,
    target: updatedTarget,
    conflicting: updatedConflicting,
    status: "resolved",
  });
}));

memoryRouter.post("/plugins/:pluginId/install", asyncHandler(async (req, res) => {
  const pluginIdParam = req.params.pluginId;
  const pluginId = Array.isArray(pluginIdParam) ? pluginIdParam[0] : pluginIdParam;
  if (typeof pluginId !== "string" || pluginId.trim().length === 0) {
    res.status(400).json({ error: "pluginId is required" });
    return;
  }
  const { plugins } = buildPluginCatalog(req.authUserId);
  const plugin = plugins.find((entry) => entry.id === pluginId);
  if (!plugin) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }

  const userState = getPluginUserState(req.authUserId);
  if (!userState.installed.includes(pluginId)) {
    userState.installed.push(pluginId);
  }
  const installEvent: PluginEvent = {
    id: randomUUID(),
    pluginId,
    action: "installed",
    at: new Date().toISOString(),
  };
  userState.events = [
    installEvent,
    ...userState.events,
  ].slice(0, 100);
  setPluginUserState(req.authUserId, userState);

  const next = buildPluginCatalog(req.authUserId);
  res.json({ plugin: next.plugins.find((entry) => entry.id === pluginId), plugins: next.plugins, events: next.events });
}));

memoryRouter.post("/plugins/:pluginId/uninstall", asyncHandler(async (req, res) => {
  const pluginIdParam = req.params.pluginId;
  const pluginId = Array.isArray(pluginIdParam) ? pluginIdParam[0] : pluginIdParam;
  if (typeof pluginId !== "string" || pluginId.trim().length === 0) {
    res.status(400).json({ error: "pluginId is required" });
    return;
  }
  const { plugins } = buildPluginCatalog(req.authUserId);
  const plugin = plugins.find((entry) => entry.id === pluginId);
  if (!plugin) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }

  const userState = getPluginUserState(req.authUserId);
  userState.installed = userState.installed.filter((entry) => entry !== pluginId);
  const uninstallEvent: PluginEvent = {
    id: randomUUID(),
    pluginId,
    action: "uninstalled",
    at: new Date().toISOString(),
  };
  userState.events = [
    uninstallEvent,
    ...userState.events,
  ].slice(0, 100);
  setPluginUserState(req.authUserId, userState);

  const next = buildPluginCatalog(req.authUserId);
  res.json({ plugin: next.plugins.find((entry) => entry.id === pluginId), plugins: next.plugins, events: next.events });
}));

memoryRouter.get("/settings", asyncHandler(async (req, res) => {
  const state = getWorkspaceState(req.authUserId);
  res.json({
    workspaceName: state.workspaceName,
    organization: state.organization,
    connectorStatuses: {
      github: "connected",
      notion: "available",
      googleDrive: "available",
      oneDrive: "available",
      gmail: "available",
      zendesk: "available",
      jira: "available",
      s3: "available",
      webCrawler: "available",
    },
  });
}));

memoryRouter.patch("/settings", asyncHandler(async (req, res) => {
  if (!isObjectRecord(req.body)) {
    res.status(400).json({ error: "Invalid settings payload" });
    return;
  }
  const state = getWorkspaceState(req.authUserId);
  if (typeof req.body.workspaceName === "string" && req.body.workspaceName.trim().length > 0) {
    state.workspaceName = req.body.workspaceName.trim();
  }
  if (typeof req.body.contextEnabled === "boolean") {
    state.organization.contextEnabled = req.body.contextEnabled;
  }
  res.json({
    workspaceName: state.workspaceName,
    organization: state.organization,
  });
}));

async function generateCompanyBrainSkillsForUser(input: {
  userId: string;
  persistExport: boolean;
}): Promise<{
  workspace: string;
  generatedAt: string;
  stats: CompanyBrainExportRecord["stats"];
  skillsMarkdown: string;
  exportId?: string;
}> {
  const workspace = getWorkspaceState(input.userId).workspaceName;
  const memoryResult = await listMemories({ userId: input.userId, limit: 300 });
  const timeline = await listTimelineEvents(input.userId);
  const activeMemories = memoryResult.memories.filter((entry) => entry.status === "active");

  const topByType = (type: MemoryType, limit = 5) =>
    activeMemories
      .filter((entry) => entry.type === type)
      .slice(0, limit)
      .map((entry) => entry.summary || entry.content);

  const constraints = topByType("learning", 5);
  const decisions = topByType("project", 6);
  const incidents = activeMemories
    .filter((entry) => /\b(incident|outage|bug|failure|rollback|postmortem)\b/i.test(`${entry.summary} ${entry.content}`))
    .slice(0, 6)
    .map((entry) => entry.summary || entry.content);
  const runbooks = activeMemories
    .filter((entry) => /\b(runbook|playbook|how to|procedure|steps)\b/i.test(`${entry.summary} ${entry.content}`))
    .slice(0, 6)
    .map((entry) => entry.summary || entry.content);
  const openRisks = topByType("episodic", 5);
  const recentSignals = timeline
    .slice(-20)
    .reverse()
    .slice(0, 8)
    .map((event) => `${event.eventType}: ${event.reason}`);

  const skillsMarkdown = [
    "# COMPANY_BRAIN.md",
    "",
    `workspace: ${workspace}`,
    "schema: memoryos.company_brain.v1",
    `generated_at: ${new Date().toISOString()}`,
    "",
    "## Operating Model",
    "- purpose: turn fragmented company knowledge into executable agent skills",
    "- default_mode: contract-first execution",
    "- escalation: high-risk changes require human approval",
    "",
    "## Decisions",
    ...(decisions.length > 0 ? decisions.map((item) => `- ${item}`) : ["- none captured yet"]),
    "",
    "## Constraints",
    ...(constraints.length > 0 ? constraints.map((item) => `- ${item}`) : ["- none captured yet"]),
    "",
    "## Incident Memory",
    ...(incidents.length > 0 ? incidents.map((item) => `- ${item}`) : ["- none captured yet"]),
    "",
    "## Runbooks",
    ...(runbooks.length > 0 ? runbooks.map((item) => `- ${item}`) : ["- none captured yet"]),
    "",
    "## Open Risks",
    ...(openRisks.length > 0 ? openRisks.map((item) => `- ${item}`) : ["- none captured yet"]),
    "",
    "## Recent Signals",
    ...(recentSignals.length > 0 ? recentSignals.map((item) => `- ${item}`) : ["- no timeline signals yet"]),
    "",
    "## Agent Execution Rules",
    "- always retrieve latest contract + decisions before acting",
    "- if policy/compliance uncertainty exists, ask for approval before execution",
    "- write outcomes back to memory after each meaningful step",
  ].join("\n");

  const generatedAt = new Date().toISOString();
  const stats = {
    activeMemoryCount: activeMemories.length,
    totalTimelineEvents: timeline.length,
    decisions: decisions.length,
    constraints: constraints.length,
    incidents: incidents.length,
    runbooks: runbooks.length,
    openRisks: openRisks.length,
  };

  if (!input.persistExport) {
    return {
      workspace,
      generatedAt,
      stats,
      skillsMarkdown,
    };
  }

  const exportRecord: CompanyBrainExportRecord = {
    id: randomUUID(),
    workspace,
    generatedAt,
    stats,
    skillsMarkdown,
  };
  const existingExports = readCompanyBrainExports();
  const nextExports = [exportRecord, ...existingExports].slice(0, 25);
  writeCompanyBrainExports(nextExports);

  return {
    workspace,
    generatedAt,
    stats,
    skillsMarkdown,
    exportId: exportRecord.id,
  };
}

memoryRouter.get("/company-brain/skills", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Pro"))) {
    res.status(402).json({
      error: "Company Brain skills require Pro or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Pro", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  const payload = await generateCompanyBrainSkillsForUser({
    userId: req.authUserId,
    persistExport: true,
  });
  res.json(payload);
}));

memoryRouter.get("/company-brain/exports", asyncHandler(async (_req, res) => {
  if (!(await hasMinimumPlan(_req.authUserId, "Scale"))) {
    res.status(402).json({
      error: "Company Brain exports require Scale or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Scale", currentPlan: (await getBillingStateForUser(_req.authUserId)).plan },
    });
    return;
  }
  const exportsList = readCompanyBrainExports().map((entry) => ({
    id: entry.id,
    workspace: entry.workspace,
    generatedAt: entry.generatedAt,
    stats: entry.stats,
  }));
  res.json({ exports: exportsList });
}));

memoryRouter.get("/company-brain/funnel", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const progress = getCompanyBrainFunnelProgress(req.authUserId);
  sendApiSuccess(res, 200, { progress }, buildApiMeta(req, startedAt));
}));

memoryRouter.patch("/company-brain/funnel", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = req.body as Record<string, unknown>;
  const patch: Record<string, boolean> = {};
  if (typeof body.connectGithub === "boolean") patch.connectGithub = body.connectGithub;
  if (typeof body.syncGithub === "boolean") patch.syncGithub = body.syncGithub;
  if (typeof body.briefLoaded === "boolean") patch.briefLoaded = body.briefLoaded;
  if (typeof body.labOpened === "boolean") patch.labOpened = body.labOpened;
  if (typeof body.dismissed === "boolean") patch.dismissed = body.dismissed;
  const progress = patchCompanyBrainFunnelProgress(req.authUserId, patch);
  sendApiSuccess(res, 200, { progress }, buildApiMeta(req, startedAt));
}));


function hasValidBaselineReport(): boolean {
  return hasValidJsonFile(BASELINE_REPORT_PATH, (value) => {
    if (!isObjectRecord(value)) {
      return false;
    }

    const passRate = value.passRate;
    const totalCases = value.totalCases;

    return (
      typeof passRate === "number" &&
      !Number.isNaN(passRate) &&
      passRate >= 0 &&
      passRate <= 100 &&
      typeof totalCases === "number" &&
      Number.isInteger(totalCases) &&
      totalCases > 0
    );
  });
}

function readBaselineReport(): BaselineReport | null {
  if (!existsSync(BASELINE_REPORT_PATH)) {
    return null;
  }

  try {
    const raw = readFileSync(BASELINE_REPORT_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return null;
    }

    const passRate = parsed.passRate;
    const totalCases = parsed.totalCases;
    const updatedAt = parsed.updatedAt;

    if (
      typeof passRate !== "number" ||
      Number.isNaN(passRate) ||
      passRate < 0 ||
      passRate > 100
    ) {
      return null;
    }

    if (
      typeof totalCases !== "number" ||
      !Number.isInteger(totalCases) ||
      totalCases <= 0
    ) {
      return null;
    }

    if (updatedAt !== undefined && typeof updatedAt !== "string") {
      return null;
    }

    return {
      passRate,
      totalCases,
      ...(typeof updatedAt === "string" ? { updatedAt } : {}),
    };
  } catch {
    return null;
  }
}

function parseQueryTopK(raw: unknown): number | undefined {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 20) {
    return undefined;
  }

  return parsed;
}

function parseQueryIncludeArchived(raw: unknown): boolean | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }

  const lowered = raw.toLowerCase();
  if (lowered === "true") {
    return true;
  }

  if (lowered === "false") {
    return false;
  }

  return undefined;
}

function parseOptionalQueryText(raw: unknown): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRequestRange(raw: unknown): RequestRange {
  if (typeof raw !== "string") {
    return "30d";
  }

  const lowered = raw.toLowerCase() as RequestRange;
  if (lowered in REQUEST_RANGE_DAYS) {
    return lowered;
  }

  return "30d";
}

function parseRequestStatus(raw: unknown): (typeof REQUEST_STATUSES)[number] | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "success") return "Success";
  if (normalized === "error") return "Error";
  return undefined;
}

function toTimestampMs(raw: unknown): number {
  if (typeof raw !== "string") {
    return 0;
  }
  const value = new Date(raw).getTime();
  return Number.isFinite(value) ? value : 0;
}

function compactRequestField(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  try {
    const raw = JSON.stringify(value);
    if (raw.length <= 2_000) return value;
    return {
      truncated: true,
      preview: raw.slice(0, 2_000),
      originalChars: raw.length,
    };
  } catch {
    const text = String(value);
    return text.length > 2_000
      ? { truncated: true, preview: text.slice(0, 2_000), originalChars: text.length }
      : text;
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) {
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function readCompanyBrainExports(): CompanyBrainExportRecord[] {
  if (!existsSync(COMPANY_BRAIN_EXPORTS_PATH)) {
    return [];
  }
  try {
    const raw = readFileSync(COMPANY_BRAIN_EXPORTS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is CompanyBrainExportRecord => {
      if (!isObjectRecord(entry)) return false;
      return (
        typeof entry.id === "string" &&
        typeof entry.workspace === "string" &&
        typeof entry.generatedAt === "string" &&
        isObjectRecord(entry.stats) &&
        typeof entry.skillsMarkdown === "string"
      );
    });
  } catch {
    return [];
  }
}

function writeCompanyBrainExports(records: CompanyBrainExportRecord[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(COMPANY_BRAIN_EXPORTS_PATH, JSON.stringify(records, null, 2), "utf8");
}

function writeJsonFile(filePath: string, data: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function readGovernancePolicyStore(): GovernancePolicyStore {
  return readJsonFile<GovernancePolicyStore>(GOVERNANCE_POLICY_STORE_PATH, { users: {} });
}

function writeGovernancePolicyStore(state: GovernancePolicyStore): void {
  writeJsonFile(GOVERNANCE_POLICY_STORE_PATH, state);
}

function readConflictActionStore(): ConflictActionStore {
  return readJsonFile<ConflictActionStore>(CONFLICT_ACTIONS_STORE_PATH, { actions: [] });
}

function writeConflictActionStore(state: ConflictActionStore): void {
  writeJsonFile(CONFLICT_ACTIONS_STORE_PATH, state);
}

function readConflictQueueStore(): ConflictQueueStore {
  return readJsonFile<ConflictQueueStore>(CONFLICT_QUEUE_STORE_PATH, { items: [] });
}

function writeConflictQueueStore(state: ConflictQueueStore): void {
  writeJsonFile(CONFLICT_QUEUE_STORE_PATH, state);
}

function readGovernanceReviewStore(): GovernanceReviewStore {
  return readJsonFile<GovernanceReviewStore>(GOVERNANCE_REVIEW_STORE_PATH, { items: [] });
}

function writeGovernanceReviewStore(state: GovernanceReviewStore): void {
  writeJsonFile(GOVERNANCE_REVIEW_STORE_PATH, state);
}

function appendConflictAction(record: ConflictActionRecord): void {
  const store = readConflictActionStore();
  const next = [record, ...store.actions].slice(0, 1000);
  writeConflictActionStore({ actions: next });
}

function appendConflictQueueItems(items: ConflictQueueItem[]): void {
  if (items.length === 0) return;
  const store = readConflictQueueStore();
  const dedupedIncoming = items.filter((item) =>
    !store.items.some(
      (existing) =>
        existing.userId === item.userId &&
        existing.memoryId === item.memoryId &&
        existing.conflictingWithMemoryId === item.conflictingWithMemoryId &&
        existing.state === "open",
    ),
  );
  if (dedupedIncoming.length === 0) return;
  const next = [...dedupedIncoming, ...store.items].slice(0, 1000);
  writeConflictQueueStore({ items: next });
}

function appendGovernanceReviewItem(item: GovernanceReviewItem): void {
  const store = readGovernanceReviewStore();
  const next = [item, ...store.items].slice(0, 1000);
  writeGovernanceReviewStore({ items: next });
}

function ensureGovernancePolicyStoreLoaded(): void {
  if (GOVERNANCE_POLICY_STORE_LOADED) return;
  GOVERNANCE_POLICY_STORE_LOADED = true;

  const store = readGovernancePolicyStore();
  const entries = Object.entries(store.users);
  for (const [userId, raw] of entries) {
    if (isObjectRecord(raw) && "policy" in raw) {
      const policy = resolveGovernancePolicy((raw as { policy?: unknown }).policy);
      GOVERNANCE_POLICY_BY_USER.set(userId, policy);
      const savedAt = (raw as { savedAt?: unknown }).savedAt;
      if (typeof savedAt === "string" && savedAt.trim().length > 0) {
        GOVERNANCE_POLICY_SAVED_AT_BY_USER.set(userId, savedAt);
      }
      continue;
    }
    GOVERNANCE_POLICY_BY_USER.set(userId, resolveGovernancePolicy(raw));
  }
}

function readPluginStore(): PluginStoreState {
  return readJsonFile<PluginStoreState>(PLUGIN_STORE_PATH, { users: {} });
}

function writePluginStore(state: PluginStoreState): void {
  writeJsonFile(PLUGIN_STORE_PATH, state);
}

function getPluginUserState(userId: string): PluginUserState {
  const store = readPluginStore();
  const existing = store.users[userId];
  if (existing) {
    return existing;
  }
  const created: PluginUserState = { installed: [], events: [] };
  store.users[userId] = created;
  writePluginStore(store);
  return created;
}

function setPluginUserState(userId: string, state: PluginUserState): void {
  const store = readPluginStore();
  store.users[userId] = state;
  writePluginStore(store);
}

function packageVersionFrom(filePath: string): string {
  const pkg = readJsonFile<Record<string, unknown> | null>(filePath, null);
  if (!pkg || typeof pkg.version !== "string") {
    return "unknown";
  }
  return pkg.version;
}

function buildPluginCatalog(userId: string): { plugins: PluginRecord[]; events: PluginEvent[] } {
  const userState = getPluginUserState(userId);
  const installed = new Set(userState.installed);

  const mcpPath = path.join(process.cwd(), "packages", "mcp-server", "package.json");
  const sdkPath = path.join(process.cwd(), "packages", "sdk", "package.json");
  const serverPath = path.join(process.cwd(), "package.json");
  const mcpBuiltPath = path.join(process.cwd(), "packages", "mcp-server", "dist", "stdio.js");

  const plugins: PluginRecord[] = [
    {
      id: "memoryos-mcp",
      name: "MemoryOS MCP Bridge",
      category: "MCP",
      runtime: "stdio transport",
      version: packageVersionFrom(mcpPath),
      status: installed.has("memoryos-mcp") ? "installed" : "available",
      capabilities: ["retrieve", "resume", "handoff", "mcp-tools"],
      source: "packages/mcp-server",
      installedAt: userState.events.find((event) => event.pluginId === "memoryos-mcp" && event.action === "installed")?.at,
      updatedAt: userState.events.find((event) => event.pluginId === "memoryos-mcp")?.at,
      health: existsSync(mcpBuiltPath) ? "healthy" : "unknown",
      healthDetail: existsSync(mcpBuiltPath) ? "Built output found at packages/mcp-server/dist/stdio.js" : "Build output not found yet.",
    },
    {
      id: "sdk-runtime",
      name: "TypeScript SDK Runtime",
      category: "Runtime",
      runtime: "Node package",
      version: packageVersionFrom(sdkPath),
      status: installed.has("sdk-runtime") ? "installed" : "available",
      capabilities: ["beforeModel", "afterModel", "process", "retrieve"],
      source: "packages/sdk",
      installedAt: userState.events.find((event) => event.pluginId === "sdk-runtime" && event.action === "installed")?.at,
      updatedAt: userState.events.find((event) => event.pluginId === "sdk-runtime")?.at,
      health: existsSync(sdkPath) ? "healthy" : "error",
      healthDetail: existsSync(sdkPath) ? "SDK package manifest found." : "SDK package manifest missing.",
    },
    {
      id: "http-runtime",
      name: "HTTP Agent Runtime",
      category: "Runtime",
      runtime: "REST API",
      version: packageVersionFrom(serverPath),
      status: installed.has("http-runtime") ? "installed" : "available",
      capabilities: ["process", "retrieve", "resume", "handoff"],
      source: "server/api/memory",
      installedAt: userState.events.find((event) => event.pluginId === "http-runtime" && event.action === "installed")?.at,
      updatedAt: userState.events.find((event) => event.pluginId === "http-runtime")?.at,
      health: "healthy",
      healthDetail: "Memory API routes are available on /api/memory/*.",
    },
  ];

  return {
    plugins,
    events: [...userState.events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40),
  };
}

function createDefaultWorkspaceState(userId: string): WorkspaceState {
  const normalizedUser = userId.trim() || "memoryos-user";
  return {
    workspaceName: "MemoryOS",
    plan: "Free",
    usage: {
      tokenLimit: PLAN_CATALOG.Free.tokenLimit ?? 1_000_000,
      tokenUsed: 0,
      searchLimit: PLAN_CATALOG.Free.searchLimit ?? 10_000,
      searchUsed: 0,
      resetInDays: 20,
    },
    invoices: [],
    members: [
      {
        id: "owner",
        name: "Workspace Owner",
        email: `${normalizedUser}@memoryos.local`,
        role: "owner",
        access: "Full",
        joined: new Date().toISOString(),
        status: "active",
      },
    ],
    invites: [],
    organization: {
      organizationId: `org_${normalizedUser.slice(0, 10)}`,
      ownerName: "Workspace Owner",
      ownerEmail: `${normalizedUser}@memoryos.local`,
      contextEnabled: false,
    },
  };
}

function getWorkspaceState(userId: string): WorkspaceState {
  const existing = WORKSPACE_STATE_BY_USER.get(userId);
  if (existing) {
    return existing;
  }
  const created = createDefaultWorkspaceState(userId);
  WORKSPACE_STATE_BY_USER.set(userId, created);
  return created;
}

function toBillingPortalUrl(): string {
  const dashboard = process.env.CHECKOUT_DASHBOARD_URL?.trim();
  if (dashboard) {
    return dashboard;
  }
  const provider = resolveCheckoutProvider();
  if (provider === "polar") {
    return "https://dashboard.polar.sh";
  }
  return "";
}

async function hasMinimumPlan(userId: string, minimum: PlanTier): Promise<boolean> {
  const plan = (await getBillingStateForUser(userId)).plan;
  return PLAN_RANK[plan] >= PLAN_RANK[minimum];
}

type UsageMeter = "tokens" | "searches";

function sendUpgradeRequired(
  res: Parameters<typeof sendApiError>[0],
  startedAt: number,
  req: { authUserId: string },
  meter: UsageMeter,
  plan: BillingPlan,
  usage: UsageSnapshot,
): void {
  const used = meter === "tokens" ? usage.tokenUsed : usage.searchUsed;
  const limit = meter === "tokens" ? usage.tokenLimit : usage.searchLimit;
  const unit = meter === "tokens" ? "tokens" : "search queries";
  sendApiError(
    res,
    402,
    {
      code: "UPGRADE_REQUIRED",
      message: `Your ${unit} limit for the ${plan} plan has been reached.`,
      details: {
        meter,
        plan,
        used,
        limit,
        upgradePlans: ["Pro", "Scale"],
        action: "Open Billing and upgrade plan.",
        billingPath: "/developer-console",
      },
    },
    buildApiMeta(req as never, startedAt),
  );
}

async function applyUsageOrReject(params: {
  req: { authUserId: string };
  res: Parameters<typeof sendApiError>[0];
  startedAt: number;
  tokenCost?: number;
  searchCost?: number;
}): Promise<boolean> {
  const usageResult = await tryConsumeUsage({
    userId: params.req.authUserId,
    tokenCost: params.tokenCost,
    searchCost: params.searchCost,
  });
  if (!usageResult.allowed) {
    sendUpgradeRequired(
      params.res,
      params.startedAt,
      params.req,
      usageResult.meter ?? "tokens",
      usageResult.plan,
      usageResult.usage,
    );
    return false;
  }
  return true;
}

async function applyMeteredOperation(params: {
  req: { authUserId: string };
  res: Parameters<typeof sendApiError>[0];
  startedAt: number;
  operation: MemoryMeterOperation;
  text?: string;
}): Promise<boolean> {
  const cost = resolveUsageCost(params.operation, params.text ?? "");
  return applyUsageOrReject({
    req: params.req,
    res: params.res,
    startedAt: params.startedAt,
    tokenCost: cost.tokenCost,
    searchCost: cost.searchCost,
  });
}

function serializeApiKeyForClient(key: ReturnType<typeof listApiKeysForUser>[number]) {
  return {
    id: key.id,
    name: key.name,
    prefix: key.keyPrefix,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expires,
    mode: key.mode,
    status: key.status,
    endpoints: key.endpoints,
    contentTag: key.contentTag,
    requests24h: countApiKeyRequests24h(key.userId, key.id),
  };
}

function appendCheckoutMetadata(baseUrl: string, userId: string, plan: BillingPlan): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("metadata[userId]", userId);
    url.searchParams.set("metadata[plan]", plan);
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}metadata%5BuserId%5D=${encodeURIComponent(userId)}&metadata%5Bplan%5D=${encodeURIComponent(plan)}`;
  }
}

function toConfiguredCheckoutUrl(plan: BillingPlan): string | null {
  const byPlanEnv: Record<Exclude<BillingPlan, "Free">, string | undefined> = {
    Pro:
      process.env.CHECKOUT_URL_PRO ??
      process.env.POLAR_CHECKOUT_URL_PRO,
    Scale:
      process.env.CHECKOUT_URL_SCALE ??
      process.env.POLAR_CHECKOUT_URL_SCALE,
    Enterprise:
      process.env.CHECKOUT_URL_ENTERPRISE ??
      process.env.POLAR_CHECKOUT_URL_ENTERPRISE,
  };
  const raw = byPlanEnv[plan as Exclude<BillingPlan, "Free">];
  return raw?.trim() ? raw.trim() : null;
}

function resolveCheckoutProvider(): CheckoutProvider {
  const raw = process.env.CHECKOUT_PROVIDER?.trim().toLowerCase();
  if (raw === "polar") return "polar";
  return "custom";
}

function buildWhyTop1(top?: {
  memoryType?: string;
  finalScore: number;
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
  continuityBoost: number;
  reasonTags?: string[];
}): string {
  if (!top) {
    return "No ranked memories found for this question.";
  }

  const reasonPart =
    top.reasonTags && top.reasonTags.length > 0
      ? ` Key reasons: ${top.reasonTags.slice(0, 3).join(", ")}.`
      : "";

  return `Top memory ranked highest because it matched intent/type (${top.memoryType ?? "unknown"}), had semantic relevance ${top.semanticScore.toFixed(2)}, and reached final score ${top.finalScore.toFixed(2)} with continuity boost ${top.continuityBoost.toFixed(2)}.${reasonPart}`;
}

function toContinueProjectBrief(result: ResumeResponseData): ContinueProjectBriefResponseData {
  return result.brief;
}

function toPromptBundle(input: {
  project: string;
  brief: ContinueProjectBriefResponseData;
}): ResumePromptResponseData["prompts"] {
  const listOrFallback = (items: string[], fallback: string) =>
    items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : `- ${fallback}`;

  const riskyFilesText = listOrFallback(input.brief.riskyFiles, "No risky files explicitly identified.");
  const changedText = listOrFallback(input.brief.whatChangedRecently, "No recent changes captured.");
  const decisionsText = listOrFallback(input.brief.keyDecisions, "No explicit decisions captured yet.");
  const blockersText = listOrFallback(input.brief.openBlockers, "No explicit blockers captured.");
  const contextText = listOrFallback(input.brief.mustKnowContextForAgent, "No additional context captured.");

  const executionContract = [
    `# MemoryOS Continue Contract: ${input.project}`,
    "",
    "## Current Goal",
    input.brief.currentGoal,
    "",
    "## What Changed Recently",
    changedText,
    "",
    "## Decisions To Preserve",
    decisionsText,
    "",
    "## Open Blockers",
    blockersText,
    "",
    "## Risky Files / Areas",
    riskyFilesText,
    "",
    "## Must-Know Context",
    contextText,
    "",
    "## Next Best Action",
    input.brief.nextBestAction,
    "",
    "## Hard Guardrails",
    "- Make the smallest safe change that advances the next best action.",
    "- Do not rewrite unrelated modules or rename public interfaces unless the task requires it.",
    "- Do not touch secrets, env files, generated folders, node_modules, or unrelated local changes.",
    "- If the brief is missing a critical fact, ask one focused question instead of inventing product state.",
    "- Preserve existing style and product direction unless the requested task explicitly changes it.",
    "",
    "## Required Output After Work",
    "- Files changed and why.",
    "- Validation run, or why validation could not run.",
    "- Memory/brief items used, including any assumptions.",
    "- Suggested next step only if one naturally follows.",
  ].join("\n");

  return {
    cursor: [
      executionContract,
      "",
      "## Cursor Execution Mode",
      "1. Briefly inspect the relevant files before editing.",
      "2. Apply focused edits directly.",
      "3. Keep the chat summary short and include validation.",
    ].join("\n"),
    codex: [
      executionContract,
      "",
      "## Codex Execution Mode",
      "1. Work inside the existing repo and respect dirty files.",
      "2. Prefer small patches and command-based verification.",
      "3. Do not commit or push unless explicitly asked.",
    ].join("\n"),
    claudeCode: [
      executionContract,
      "",
      "## Claude Code Execution Mode",
      "1. State assumptions before changing behavior.",
      "2. Prioritize patch safety, tests, and readable diffs.",
      "3. Surface any mismatch between the brief and code reality.",
    ].join("\n"),
  };
}

function toTraceProof(input: {
  trace: ResumePromptResponseData["trace"];
  target: ResumePromptResponseData["target"];
}): ResumePromptResponseData["traceProof"] {
  const memoryUsedCount = input.trace.length;
  const averageConfidence =
    memoryUsedCount > 0
      ? Number((input.trace.reduce((sum, item) => sum + item.confidence, 0) / memoryUsedCount).toFixed(3))
      : 0;
  const contractCategories = Array.from(
    new Set(input.trace.map((item) => item.contractCategory).filter((item): item is string => Boolean(item))),
  );
  const targetLabel =
    input.target === "claude_code" ? "Claude Code" : input.target === "codex" ? "Codex" : "Cursor";

  return {
    runType: "resume_prompt",
    memoryUsedCount,
    averageConfidence,
    contractCategories,
    whatChangedAfterAction:
      `Generated a ${targetLabel} execution prompt from the canonical Continue Project brief. Code changes are captured after the agent run.`,
    summary:
      memoryUsedCount > 0
        ? `Used ${memoryUsedCount} ranked memories at average confidence ${averageConfidence}.`
        : "No ranked memories were available; prompt was generated from fallback brief context.",
  };
}

function labelForVoiceSpeaker(
  speaker: "user" | "assistant" | "system" | undefined,
): string | null {
  if (!speaker) {
    return null;
  }

  if (speaker === "user") {
    return "User";
  }

  if (speaker === "assistant") {
    return "Assistant";
  }

  return "System";
}

function formatVoiceChunkMessage(input: {
  chunk: string;
  speaker?: "user" | "assistant" | "system";
  chunkIndex?: number;
  tags?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}): string {
  const speakerLabel = labelForVoiceSpeaker(input.speaker);
  const core = speakerLabel ? `${speakerLabel}: ${input.chunk}` : input.chunk;
  const metadata: string[] = [];

  if (typeof input.chunkIndex === "number") {
    metadata.push(`chunkIndex=${input.chunkIndex}`);
  }

  if (input.sentiment) {
    metadata.push(`sentiment=${input.sentiment}`);
  }

  if (input.tags && input.tags.length > 0) {
    metadata.push(`tags=${input.tags.join(",")}`);
  }

  if (metadata.length === 0) {
    return core;
  }

  return `${core}\n[voice_meta ${metadata.join(" ")}]`;
}

function formatAgentChatMemory(input: {
  speaker: "user" | "assistant";
  message: string;
  sessionId: string;
  threadId: string;
  workspace?: string;
  project?: string;
  agentId?: string;
  model?: string;
  mode?: string;
  governance?: GovernancePolicy;
}): string {
  const speakerLabel = input.speaker === "assistant" ? "Assistant" : "User";
  const effectiveMessage = input.governance?.redactSecrets ? applySecretRedaction(input.message) : input.message;
  const metadata = [
    `sessionId=${input.sessionId}`,
    `threadId=${input.threadId}`,
    input.workspace ? `workspace=${input.workspace}` : undefined,
    input.project ? `project=${input.project}` : undefined,
    input.agentId ? `agent=${input.agentId}` : undefined,
    input.model ? `model=${input.model}` : undefined,
    input.mode ? `mode=${input.mode}` : undefined,
    input.governance ? `ttlHours=${input.governance.ttlHours}` : undefined,
    input.governance ? `policyMode=${input.governance.mode}` : undefined,
    input.governance?.pinCriticalDecisions ? "pinCriticalDecisions=true" : undefined,
    input.governance?.redactSecrets ? "redaction=enabled" : undefined,
  ].filter((item): item is string => Boolean(item));

  return `${speakerLabel}: ${effectiveMessage}\n[agent_chat_meta ${metadata.join(" ")}]`;
}

async function persistAgentTurnMemory(input: {
  userId: string;
  sessionId: string;
  threadId: string;
  workspace?: string;
  project?: string;
  agentId: string;
  model?: string;
  mode: string;
  userMessage: string;
  assistantReply: string;
  projectState?: unknown;
  governance: GovernancePolicy;
}): Promise<{ memory: Memory; timelineEvent: Awaited<ReturnType<typeof recordMemoryCreatedEvent>> }> {
  const now = new Date().toISOString();
  const userMessage = input.governance.redactSecrets ? applySecretRedaction(input.userMessage) : input.userMessage;
  const assistantReply = input.governance.redactSecrets ? applySecretRedaction(input.assistantReply) : input.assistantReply;
  const shouldPin =
    input.governance.pinCriticalDecisions &&
    /\b(decision|decide|chosen|we will|selected)\b/i.test(`${userMessage}\n${assistantReply}`);
  const memory: Memory = {
    id: randomUUID(),
    userId: input.userId,
    type: "episodic",
    content: [
      `User: ${userMessage}`,
      `Assistant: ${assistantReply}`,
      `Agent turn metadata: session=${input.sessionId}; thread=${input.threadId}; agent=${input.agentId}; model=${input.model ?? "default"}; mode=${input.mode}; workspace=${input.workspace ?? "default"}; project=${input.project ?? "default"}`,
      `Governance: mode=${input.governance.mode}; ttlHours=${input.governance.ttlHours}; redaction=${input.governance.redactSecrets ? "on" : "off"}; pinning=${input.governance.pinCriticalDecisions ? "on" : "off"}`,
      shouldPin ? "Pinned decision signal: critical decision preserved for future handoffs." : undefined,
      input.projectState
        ? `Updated project state: ${JSON.stringify(input.projectState)}`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n"),
    summary: `${input.agentId} ${input.mode} turn stored for ${input.project ?? "MemoryOS project"} using ${input.model ?? "configured model"}.`,
    importanceScore: shouldPin ? 0.95 : 0.82,
    confidence: 0.96,
    source: "chat",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: 1,
    developerSignals: {
      projectArea: [input.project ?? "run-demo", input.mode, input.agentId],
    },
  };

  await getMemoryStoreAdapter().saveMemory({ memory });
  await upsertRecentMemory(memory);
  const timelineEvent = await recordMemoryCreatedEvent(
    memory,
    `${input.agentId} ${input.mode} turn stored with ${input.model ?? "configured model"}; user input, model reply, and project state are now recoverable.`,
  );

  return { memory, timelineEvent };
}

memoryRouter.post(
  "/process",
  asyncHandler(async (req, res) => {
    const traceId = createTraceId("memory_process");
    const startedAt = Date.now();
    const parsed = ProcessMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
        traceId,
      });
      return;
    }

    const contract = parsed.data.contract;
    const governancePolicy = resolveGovernancePolicyWithUserDefault(req.authUserId, parsed.data.governance);
    const contractFieldsCount =
      (contract?.goal ? 1 : 0) +
      ((contract?.constraints?.length ?? 0) > 0 ? 1 : 0) +
      ((contract?.decisions?.length ?? 0) > 0 ? 1 : 0) +
      ((contract?.open_risks?.length ?? 0) > 0 ? 1 : 0) +
      ((contract?.next_actions?.length ?? 0) > 0 ? 1 : 0);

    const minimumRequiredFields =
      parsed.data.enforceContract || governancePolicy.mode !== "balanced"
        ? minimumContractFieldsForMode(governancePolicy.mode)
        : 2;

    if (parsed.data.enforceContract && contractFieldsCount < minimumRequiredFields) {
      res.status(422).json({
        error: "Weak memory contract",
        details: {
          message:
            `contract must include at least ${minimumRequiredFields} non-empty fields among goal, constraints, decisions, open_risks, next_actions`,
          receivedFieldCount: contractFieldsCount,
          governanceMode: governancePolicy.mode,
        },
        traceId,
      });
      return;
    }

    if (!parsed.data.enforceContract && governancePolicy.mode !== "balanced" && contractFieldsCount < minimumRequiredFields) {
      res.status(422).json({
        error: "Governance contract threshold not met",
        details: {
          message: `${governancePolicy.mode} mode requires at least ${minimumRequiredFields} contract fields`,
          receivedFieldCount: contractFieldsCount,
          governanceMode: governancePolicy.mode,
        },
        traceId,
      });
      return;
    }

    const normalizedContract = contract
      ? {
          goal:
            typeof contract.goal === "string"
              ? (governancePolicy.redactSecrets ? applySecretRedaction(contract.goal) : contract.goal)
              : undefined,
          constraints: sanitizeStringList(contract.constraints, governancePolicy.redactSecrets),
          decisions: sanitizeStringList(contract.decisions, governancePolicy.redactSecrets),
          open_risks: sanitizeStringList(contract.open_risks, governancePolicy.redactSecrets),
          next_actions: sanitizeStringList(contract.next_actions, governancePolicy.redactSecrets),
        }
      : undefined;

    const contractMessage =
      contractFieldsCount > 0
        ? [
            normalizedContract?.goal ? `Goal: ${normalizedContract.goal}` : undefined,
            (normalizedContract?.constraints?.length ?? 0) > 0
              ? `Constraints: ${normalizedContract?.constraints?.join(" | ")}`
              : undefined,
            (normalizedContract?.decisions?.length ?? 0) > 0
              ? `Decisions: ${normalizedContract?.decisions?.join(" | ")}`
              : undefined,
            (normalizedContract?.open_risks?.length ?? 0) > 0
              ? `Open Risks: ${normalizedContract?.open_risks?.join(" | ")}`
              : undefined,
            (normalizedContract?.next_actions?.length ?? 0) > 0
              ? `Next Actions: ${normalizedContract?.next_actions?.join(" | ")}`
              : undefined,
            `Governance: mode=${governancePolicy.mode}; ttlHours=${governancePolicy.ttlHours}; redaction=${governancePolicy.redactSecrets ? "on" : "off"}; pinning=${governancePolicy.pinCriticalDecisions ? "on" : "off"}`,
          ]
            .filter(Boolean)
            .join("\n")
        : "";

    const normalizedMessage =
      typeof parsed.data.message === "string"
        ? (governancePolicy.redactSecrets ? applySecretRedaction(parsed.data.message) : parsed.data.message)
        : undefined;

    const risk = isHighRiskWrite({
      message: normalizedMessage,
      contract: normalizedContract,
      governance: governancePolicy,
    });
    const operationalTags = classifyOperationalTags({
      message: normalizedMessage,
      contract: normalizedContract,
    });
    if (governancePolicy.requireManualReviewForHighRisk && risk.highRisk) {
      const reviewItem: GovernanceReviewItem = {
        id: `gr_${randomUUID().slice(0, 10)}`,
        traceId,
        userId: req.authUserId,
        reason: risk.reason,
        payload: {
          threadId: parsed.data.threadId,
          message: normalizedMessage,
          contract: normalizedContract,
          governance: governancePolicy,
          operationalTags,
        },
        state: "pending",
        createdAt: new Date().toISOString(),
      };
      appendGovernanceReviewItem(reviewItem);
      emitMemoryEvent({
        kind: "governance_review_queued",
        userId: req.authUserId,
        payload: {
          traceId,
          reviewItemId: reviewItem.id,
          reason: reviewItem.reason,
          at: reviewItem.createdAt,
        },
      });
      res.status(202).json({
        traceId,
        status: "pending_review",
        reviewItemId: reviewItem.id,
        reason: reviewItem.reason,
      });
      return;
    }

    const message = [
      operationalTags.length > 0 ? `Operational Tags: ${operationalTags.join(", ")}` : undefined,
      normalizedMessage,
      contractMessage,
    ]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join("\n");
    if (message.trim().length === 0) {
      res.status(422).json({
        error: "Weak memory input",
        details: {
          message:
            "Provide a non-empty message or a contract with meaningful fields (goal, constraints, decisions, open_risks, next_actions).",
        },
        traceId,
      });
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "process_ingest",
      text: message,
    }))) {
      return;
    }

    const existingBefore = await listMemories({
      userId: req.authUserId,
      status: "active",
      limit: 200,
    });

    const result = await runIngestFlowLangGraph({
      userId: req.authUserId,
      threadId: parsed.data.threadId,
      message,
    });
    const taggedAcceptedMemories = await applyOperationalTagsToMemories({
      memories: result.acceptedMemories,
      tags: operationalTags,
    });

    const existingBeforeIds = new Set(existingBefore.memories.map((memory) => memory.id));
    const acceptedMemories = taggedAcceptedMemories.filter(
      (memory) => !existingBeforeIds.has(memory.id),
    );
    const autoConflicts = detectAutoConflicts({
      userId: req.authUserId,
      traceId,
      acceptedMemories,
      existingMemories: existingBefore.memories,
    });
    appendConflictQueueItems(autoConflicts);
    emitMemoryEvent({
      kind: "memory_processed",
      userId: req.authUserId,
      payload: {
        traceId,
        acceptedCount: taggedAcceptedMemories.length,
        rejectedCount: result.rejectedMemories.length,
        timelineCount: result.timelineEvents.length,
        autoConflictsQueued: autoConflicts.length,
        at: new Date().toISOString(),
      },
    });

    res.status(200).json({
      traceId,
      acceptedMemories: taggedAcceptedMemories,
      rejectedMemories: result.rejectedMemories,
      timelineEvents: result.timelineEvents,
      contract: normalizedContract ?? null,
      contractFieldCount: contractFieldsCount,
      governance: governancePolicy,
      operationalTags,
      autoConflictsQueued: autoConflicts.length,
    });
  }),
);

memoryRouter.post(
  "/voice/sessions/start",
  asyncHandler(async (req, res) => {
    const parsed = VoiceSessionStartSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const session = await startVoiceSession({
      sessionId: parsed.data.sessionId,
      userId: req.authUserId,
      source: parsed.data.source,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      ...(parsed.data.metadata ? { metadata: parsed.data.metadata } : {}),
    });

    res.status(200).json({
      session,
    });
  }),
);

memoryRouter.post(
  "/voice/chunk",
  asyncHandler(async (req, res) => {
    const parsed = VoiceChunkIngestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const existingSession = getVoiceSession(req.authUserId, parsed.data.sessionId);
    if (!existingSession) {
      await startVoiceSession({
        sessionId: parsed.data.sessionId,
        userId: req.authUserId,
        source: "pipecat",
        ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
        ...(parsed.data.project ? { project: parsed.data.project } : {}),
        ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      });
    }

    const session = getVoiceSession(req.authUserId, parsed.data.sessionId);
    const resolvedThreadId =
      parsed.data.threadId ?? session?.threadId ?? `voice:${parsed.data.sessionId}`;

    const chunkMessage = formatVoiceChunkMessage({
      chunk: parsed.data.chunk,
      speaker: parsed.data.speaker,
      chunkIndex: parsed.data.chunkIndex,
      tags: parsed.data.tags,
      sentiment: parsed.data.sentiment,
    });

    const startedAt = Date.now();
    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "voice_ingest",
      text: chunkMessage,
    }))) {
      return;
    }

    const ingestResult = await runIngestFlowLangGraph({
      userId: req.authUserId,
      threadId: resolvedThreadId,
      message: chunkMessage,
    });

    const updatedSession = await recordVoiceChunk({
      sessionId: parsed.data.sessionId,
      userId: req.authUserId,
      chunkCharacters: parsed.data.chunk.length,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      threadId: resolvedThreadId,
    });

    res.status(200).json({
      session: updatedSession,
      acceptedMemories: ingestResult.acceptedMemories,
      rejectedMemories: ingestResult.rejectedMemories,
      timelineEvents: ingestResult.timelineEvents,
    });
  }),
);

memoryRouter.get("/voice/sessions/:sessionId", (req, res) => {
  const sessionId =
    typeof req.params.sessionId === "string" && req.params.sessionId.trim().length > 0
      ? req.params.sessionId.trim()
      : undefined;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const session = getVoiceSession(req.authUserId, sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.status(200).json({ session });
});

memoryRouter.post(
  "/voice/sessions/end",
  asyncHandler(async (req, res) => {
    const parsed = VoiceSessionEndSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const existingSession = getVoiceSession(req.authUserId, parsed.data.sessionId);
    if (!existingSession) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    let summaryIngestResult:
      | {
        acceptedMemories: unknown[];
        rejectedMemories: unknown[];
        timelineEvents: unknown[];
      }
      | undefined;

    if (parsed.data.finalSummary) {
      const threadId = existingSession.threadId ?? `voice:${parsed.data.sessionId}`;
      const result = await runIngestFlowLangGraph({
        userId: req.authUserId,
        threadId,
        message: `Voice session summary: ${parsed.data.finalSummary}`,
      });

      summaryIngestResult = {
        acceptedMemories: result.acceptedMemories,
        rejectedMemories: result.rejectedMemories,
        timelineEvents: result.timelineEvents,
      };
    }

    const session = await endVoiceSession({
      userId: req.authUserId,
      sessionId: parsed.data.sessionId,
    });

    res.status(200).json({
      session,
      ...(summaryIngestResult ? { summaryIngestResult } : {}),
    });
  }),
);

memoryRouter.post(
  "/voice/chat",
  asyncHandler(async (req, res) => {
    const parsed = VoiceChatSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const existingSession = getVoiceSession(req.authUserId, parsed.data.sessionId);
    if (!existingSession) {
      await startVoiceSession({
        sessionId: parsed.data.sessionId,
        userId: req.authUserId,
        source: "pipecat",
        ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
        ...(parsed.data.project ? { project: parsed.data.project } : {}),
        ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      });
    }

    const session = getVoiceSession(req.authUserId, parsed.data.sessionId);
    const resolvedThreadId =
      parsed.data.threadId ?? session?.threadId ?? `voice:${parsed.data.sessionId}`;

    const mode = parsed.data.mode ?? "chat";
    const agentId = normalizeAgentId(parsed.data.agentId);
    const modelName = parsed.data.model;
    const governancePolicy = resolveGovernancePolicyWithUserDefault(req.authUserId, parsed.data.governance);
    const intakeFromMessage = extractGoalIntakeFromMessage(parsed.data.message);

    const hasGoal = Boolean(parsed.data.injectedProjectState?.systemGoal || intakeFromMessage.goal);
    const hasOwner =
      Boolean(intakeFromMessage.owner) ||
      Boolean((parsed.data.injectedProjectState?.activeConstraints ?? []).some((item) => /\bowner\b/i.test(item)));
    const hasDeadline =
      Boolean(intakeFromMessage.deadline) ||
      Boolean((parsed.data.injectedProjectState?.activeConstraints ?? []).some((item) => /\bdeadline\b|\bdue\b/i.test(item)));
    const missingIntakeFields = [
      hasGoal ? null : "goal",
      hasOwner ? null : "owner",
      hasDeadline ? null : "deadline",
    ].filter((item): item is string => Boolean(item));

    if (missingIntakeFields.length > 0) {
      res.status(422).json({
        error: "Goal intake required before agent execution",
        code: "goal_intake_required",
        details: {
          missingFields: missingIntakeFields,
          requiredTemplate:
            "Goal: <what success looks like>; Owner: <name or team>; Deadline: <date/timeframe>",
        },
      });
      return;
    }

    if (governancePolicy.mode !== "balanced") {
      const requiredProjectSignals = [
        parsed.data.injectedProjectState?.systemGoal ? 1 : 0,
        (parsed.data.injectedProjectState?.activeConstraints?.length ?? 0) > 0 ? 1 : 0,
        (parsed.data.injectedProjectState?.preferences?.length ?? 0) > 0 ? 1 : 0,
        (parsed.data.injectedProjectState?.executionPlan?.length ?? 0) > 0 ? 1 : 0,
      ].reduce((sum, value) => sum + value, 0);
      const required = governancePolicy.mode === "enterprise" ? 3 : 2;
      if (requiredProjectSignals < required) {
        res.status(422).json({
          error: "Governance context threshold not met",
          details: {
            message: `${governancePolicy.mode} mode requires richer injected project state before write`,
            requiredSignals: required,
            receivedSignals: requiredProjectSignals,
          },
        });
        return;
      }
    }

    const sanitizedUserMessage = governancePolicy.redactSecrets
      ? applySecretRedaction(parsed.data.message)
      : parsed.data.message;
    const useCompanyBrain = parsed.data.useCompanyBrain !== false;
    let companyBrainSkillsMarkdown = "";
    if (useCompanyBrain) {
      const companyBrain = await generateCompanyBrainSkillsForUser({
        userId: req.authUserId,
        persistExport: false,
      });
      companyBrainSkillsMarkdown = companyBrain.skillsMarkdown.slice(0, 4000);
    }
    const modelInputMessage = companyBrainSkillsMarkdown
      ? `${sanitizedUserMessage}\n\n[COMPANY_BRAIN_SKILLS]\n${companyBrainSkillsMarkdown}\n[/COMPANY_BRAIN_SKILLS]`
      : sanitizedUserMessage;

    const enrichedInjectedProjectState = {
      ...(parsed.data.injectedProjectState ?? {}),
      systemGoal:
        parsed.data.injectedProjectState?.systemGoal ?? intakeFromMessage.goal,
      activeConstraints: Array.from(
        new Set([
          ...(parsed.data.injectedProjectState?.activeConstraints ?? []),
          ...(intakeFromMessage.owner ? [`Owner: ${intakeFromMessage.owner}`] : []),
          ...(intakeFromMessage.deadline ? [`Deadline: ${intakeFromMessage.deadline}`] : []),
        ]),
      ),
    };

    // 1. Ingest user message into MemoryOS with agent/mode metadata.
    const ingestResult = await runIngestFlowLangGraph({
      userId: req.authUserId,
      threadId: resolvedThreadId,
        message: formatAgentChatMemory({
          speaker: "user",
          message: modelInputMessage,
        sessionId: parsed.data.sessionId,
        threadId: resolvedThreadId,
        workspace: parsed.data.workspace,
        project: parsed.data.project,
        agentId,
        model: modelName,
        mode,
        governance: governancePolicy,
      }),
    });

    // 2. Generate memory-aware response + structured project state
    const chatResult = await generateMemoryAwareResponse({
      userId: req.authUserId,
      message: modelInputMessage,
      sessionId: parsed.data.sessionId,
      threadId: resolvedThreadId,
      workspace: parsed.data.workspace,
      project: parsed.data.project,
      agentId,
      modelName,
      mode,
      injectedProjectState: enrichedInjectedProjectState,
    });

    const contractQuality = computeContractQuality({
      goal: chatResult.projectState.systemGoal,
      constraints: chatResult.projectState.activeConstraints ?? [],
      decisions: chatResult.projectState.preferences ?? [],
      open_risks: chatResult.projectState.missingInfo ?? [],
      next_actions: chatResult.projectState.executionPlan ?? [],
    });

    // 3. Store the assistant/model reply too, so handoffs can recover what the
    // agent actually said, which model said it, and which mode produced it.
    const assistantIngestResult = await runIngestFlowLangGraph({
      userId: req.authUserId,
      threadId: resolvedThreadId,
      message: formatAgentChatMemory({
        speaker: "assistant",
        message: chatResult.reply,
        sessionId: parsed.data.sessionId,
        threadId: resolvedThreadId,
        workspace: parsed.data.workspace,
        project: parsed.data.project,
        agentId,
        model: modelName,
        mode,
        governance: governancePolicy,
      }),
    });

    const guaranteedTurnMemory = await persistAgentTurnMemory({
      userId: req.authUserId,
      sessionId: parsed.data.sessionId,
      threadId: resolvedThreadId,
      workspace: parsed.data.workspace,
      project: parsed.data.project,
      agentId,
      model: modelName,
      mode,
      userMessage: sanitizedUserMessage,
      assistantReply: chatResult.reply,
      projectState: chatResult.projectState,
      governance: governancePolicy,
    });

    // 4. Update session character count
    const updatedSession = await recordVoiceChunk({
      sessionId: parsed.data.sessionId,
      userId: req.authUserId,
      chunkCharacters: parsed.data.message.length + chatResult.reply.length,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      threadId: resolvedThreadId,
    });

    res.status(200).json({
      session: updatedSession,
      reply: chatResult.reply,
      projectState: chatResult.projectState,
      mutations: chatResult.mutations,
      acceptedMemories: [
        ...ingestResult.acceptedMemories,
        ...assistantIngestResult.acceptedMemories,
        guaranteedTurnMemory.memory,
      ],
      timelineEvents: [
        ...ingestResult.timelineEvents,
        ...assistantIngestResult.timelineEvents,
        guaranteedTurnMemory.timelineEvent,
      ],
      governance: governancePolicy,
      companyBrain: {
        applied: useCompanyBrain,
      },
      contractQuality,
    });
  }),
);

memoryRouter.get(
  "/portability/export",
  asyncHandler(async (req, res) => {
    const traceId = createTraceId("portability_export");
    const workspace =
      typeof req.query.workspace === "string" && req.query.workspace.trim().length > 0
        ? req.query.workspace.trim()
        : "memoryos";
    const project =
      typeof req.query.project === "string" && req.query.project.trim().length > 0
        ? req.query.project.trim()
        : "company-brain";
    const governance = resolveGovernancePolicyWithUserDefault(req.authUserId, {
      mode: typeof req.query.mode === "string" ? req.query.mode : undefined,
      ttlHours: typeof req.query.ttlHours === "string" ? Number(req.query.ttlHours) : undefined,
      redactSecrets: req.query.redactSecrets === "true" ? true : req.query.redactSecrets === "false" ? false : undefined,
      pinCriticalDecisions:
        req.query.pinCriticalDecisions === "true" ? true : req.query.pinCriticalDecisions === "false" ? false : undefined,
    });

    const listed = await listMemories({ userId: req.authUserId, limit: 120 });
    const memories = listed.memories;

    const sampleContract = {
      goal: memories.find((memory) => memory.content.toLowerCase().includes("goal:"))?.summary,
      constraints: memories
        .filter((memory) => /constraint/i.test(memory.content))
        .slice(0, 5)
        .map((memory) => memory.summary),
      decisions: memories
        .filter((memory) => /decision|decide|selected/i.test(memory.content))
        .slice(0, 8)
        .map((memory) => memory.summary),
      open_risks: memories
        .filter((memory) => /risk|blocker|unknown/i.test(memory.content))
        .slice(0, 8)
        .map((memory) => memory.summary),
      next_actions: memories
        .filter((memory) => /next action|next step|todo|ship/i.test(memory.content))
        .slice(0, 8)
        .map((memory) => memory.summary),
    };

    const agentsMd = buildAgentsMdExport({
      workspace,
      project,
      governance,
      sampleContract,
    });

    res.status(200).json({
      traceId,
      workspace,
      project,
      exportedAt: new Date().toISOString(),
      governance,
      agentsMd,
      snapshot: {
        schema: "memoryos.snapshot.v1",
        workspace,
        project,
        exportedAt: new Date().toISOString(),
        contract: sampleContract,
        memories: memories.map((memory) => ({
          id: memory.id,
          type: memory.type,
          status: memory.status,
          summary: memory.summary,
          updatedAt: memory.updatedAt,
        })),
      },
    });
  }),
);

memoryRouter.post(
  "/portability/import",
  asyncHandler(async (req, res) => {
    const traceId = createTraceId("portability_import");
    if (!isObjectRecord(req.body)) {
      res.status(400).json({ error: "Invalid request body", traceId });
      return;
    }

    const workspace =
      typeof req.body.workspace === "string" && req.body.workspace.trim().length > 0
        ? req.body.workspace.trim()
        : "memoryos";
    const project =
      typeof req.body.project === "string" && req.body.project.trim().length > 0
        ? req.body.project.trim()
        : "company-brain";
    const governance = resolveGovernancePolicyWithUserDefault(req.authUserId, req.body.governance);
    const snapshot = isObjectRecord(req.body.snapshot) ? req.body.snapshot : null;
    const dryRun = req.body.dryRun === true;

    if (!snapshot) {
      res.status(400).json({ error: "snapshot is required", traceId });
      return;
    }

    const importedMessages: string[] = [];
    const contract = isObjectRecord(snapshot.contract) ? snapshot.contract : {};
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];
    const schema =
      typeof snapshot.schema === "string" && snapshot.schema.trim().length > 0
        ? snapshot.schema.trim()
        : null;
    if (!schema) {
      validationErrors.push("snapshot.schema is required");
    } else if (schema !== "memoryos.snapshot.v1") {
      validationWarnings.push(`unexpected schema '${schema}', expected 'memoryos.snapshot.v1'`);
    }

    if (!isObjectRecord(contract)) {
      validationErrors.push("snapshot.contract must be an object");
    }
    const contractLines = [
      typeof contract.goal === "string" ? `Goal: ${contract.goal}` : undefined,
      Array.isArray(contract.constraints) ? `Constraints: ${contract.constraints.join(" | ")}` : undefined,
      Array.isArray(contract.decisions) ? `Decisions: ${contract.decisions.join(" | ")}` : undefined,
      Array.isArray(contract.open_risks) ? `Open Risks: ${contract.open_risks.join(" | ")}` : undefined,
      Array.isArray(contract.next_actions) ? `Next Actions: ${contract.next_actions.join(" | ")}` : undefined,
    ].filter((line): line is string => Boolean(line));

    if (contractLines.length > 0) {
      importedMessages.push(contractLines.join("\n"));
    } else {
      validationWarnings.push("snapshot.contract has no populated continuity fields");
    }

    if (Array.isArray(snapshot.memories)) {
      for (const item of snapshot.memories.slice(0, 25)) {
        if (!isObjectRecord(item)) continue;
        if (typeof item.summary !== "string" || item.summary.trim().length === 0) continue;
        importedMessages.push(`Imported memory summary: ${item.summary}`);
      }
    } else {
      validationErrors.push("snapshot.memories must be an array");
    }

    if (importedMessages.length === 0) {
      res.status(422).json({
        error: "No importable memory content found in snapshot",
        traceId,
        validation: {
          valid: false,
          dryRun,
          errors: validationErrors.length > 0 ? validationErrors : ["No contract lines or memory summaries found"],
          warnings: validationWarnings,
          stats: {
            importedCandidateCount: 0,
            contractFieldCount: contractLines.length,
            memorySummaryCount: 0,
          },
        },
      });
      return;
    }

    const validation = {
      valid: validationErrors.length === 0,
      dryRun,
      errors: validationErrors,
      warnings: validationWarnings,
      stats: {
        importedCandidateCount: importedMessages.length,
        contractFieldCount: contractLines.length,
        memorySummaryCount: Math.max(0, importedMessages.length - (contractLines.length > 0 ? 1 : 0)),
      },
    };

    if (!validation.valid) {
      res.status(422).json({
        error: "Snapshot schema validation failed",
        traceId,
        validation,
      });
      return;
    }

    if (dryRun) {
      res.status(200).json({
        traceId,
        importedCount: importedMessages.length,
        acceptedMemories: [],
        rejectedMemories: [],
        timelineEvents: [],
        governance,
        validation,
      });
      return;
    }

    const acceptedMemories: unknown[] = [];
    const rejectedMemories: unknown[] = [];
    const timelineEvents: unknown[] = [];

    for (const chunk of importedMessages.slice(0, 15)) {
      const message = governance.redactSecrets ? applySecretRedaction(chunk) : chunk;
      const result = await runIngestFlowLangGraph({
        userId: req.authUserId,
        threadId: `portability-import:${project}`,
        message: `[Portability Import]\nworkspace=${workspace}; project=${project}\n${message}`,
      });
      acceptedMemories.push(...result.acceptedMemories);
      rejectedMemories.push(...result.rejectedMemories);
      timelineEvents.push(...result.timelineEvents);
    }

    res.status(200).json({
      traceId,
      importedCount: importedMessages.length,
      acceptedMemories,
      rejectedMemories,
      timelineEvents,
      governance,
      validation,
    });
  }),
);

memoryRouter.post(
  "/retrieve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = RetrieveMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<RetrieveResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "retrieve",
      text: parsed.data.question,
    }))) {
      return;
    }

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      topK: parsed.data.topK,
      ...(parsed.data.includeArchived !== undefined
        ? { includeArchived: parsed.data.includeArchived }
        : {}),
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    sendApiSuccess<RetrieveResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: result.debug[0]?.intent,
      }),
    );
  }),
);

memoryRouter.get(
  "/retrieve/explain",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const question =
      typeof req.query.question === "string" && req.query.question.trim().length > 0
        ? req.query.question
        : undefined;

    if (!question) {
      sendApiError<RetrieveExplainResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "question is required",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "retrieve_explain",
      text: question,
    }))) {
      return;
    }

    const topK = parseQueryTopK(req.query.topK);
    if (req.query.topK !== undefined && topK === undefined) {
      sendApiError<RetrieveExplainResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "topK must be a positive integer <= 20",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const includeArchived = parseQueryIncludeArchived(req.query.includeArchived);
    if (req.query.includeArchived !== undefined && includeArchived === undefined) {
      sendApiError<RetrieveExplainResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "includeArchived must be true or false",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const workspace = parseOptionalQueryText(req.query.workspace);
    const project = parseOptionalQueryText(req.query.project);
    const threadId = parseOptionalQueryText(req.query.threadId);

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question,
      ...(topK !== undefined ? { topK } : {}),
      ...(includeArchived !== undefined ? { includeArchived } : {}),
      ...(workspace ? { workspace } : {}),
      ...(project ? { project } : {}),
      ...(threadId ? { threadId } : {}),
    });

    const debugById = new Map(result.debug.map((item) => [item.id, item]));
    const ranked = result.memories.map((memory) => {
      const debug = debugById.get(memory.id);
      return {
        id: memory.id,
        memory: memory.memory,
        memoryType: memory.memoryType,
        finalScore: memory.finalScore,
        semanticScore: memory.semanticScore,
        typeRelevanceScore: memory.typeRelevanceScore,
        importanceScore: memory.importanceScore,
        recencyScore: memory.recencyScore,
        continuityBoost: memory.continuityBoost,
        updatedAt: memory.updatedAt,
        intent: debug?.intent,
        weightsUsed: debug?.weightsUsed,
        reasonTags: debug?.reasonTags ?? [],
        contributions: debug?.contributions ?? {
          semantic: 0,
          typeRelevance: 0,
          importance: 0,
          recency: 0,
          continuity: 0,
          total: memory.finalScore,
        },
        lifecycle: debug?.lifecycle ?? {
          latestEventType: null,
          latestReason: null,
          latestChangedAt: null,
        },
      };
    });

    const firstDebug = result.debug[0];

    const responseData: RetrieveExplainResponseData = {
      intent: firstDebug?.intent ?? "general",
      weightsUsed: firstDebug?.weightsUsed ?? getRetrievalWeights(),
      ranked,
      whyTop1: buildWhyTop1(ranked[0]),
    };

    sendApiSuccess<RetrieveExplainResponseData>(
      res,
      200,
      responseData,
      buildApiMeta(req, startedAt, {
        intent: responseData.intent,
      }),
    );
  }),
);

memoryRouter.post(
  "/continue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ContinueMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<ContinueResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "continue",
      text: parsed.data.question,
    }))) {
      return;
    }

    const result = await runContinueFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      mode: parsed.data.mode,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      omitNullPreviousCheckpoint: true,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    sendApiSuccess<ContinueResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: result.debug.mode,
      }),
    );
  }),
);

memoryRouter.post(
  "/handoff",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = HandoffMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<HandoffResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "handoff",
      text: parsed.data.question,
    }))) {
      return;
    }

    const result = await runHandoffFlowLangGraph({
      userId: req.authUserId,
      project: parsed.data.project,
      question: parsed.data.question,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });
    emitMemoryEvent({
      kind: "handoff_generated",
      userId: req.authUserId,
      payload: {
        project: parsed.data.project,
        openLoopCount: result.openLoops?.length ?? 0,
        at: new Date().toISOString(),
      },
    });

    sendApiSuccess<HandoffResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: "handoff",
      }),
    );
  }),
);

memoryRouter.post(
  "/resume",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ResumeMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<ResumeResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "resume",
      text: parsed.data.question,
    }))) {
      return;
    }

    const result = await runResumeFlowLangGraph({
      userId: req.authUserId,
      project: parsed.data.project,
      question: parsed.data.question,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });
    emitMemoryEvent({
      kind: "resume_generated",
      userId: req.authUserId,
      payload: {
        project: parsed.data.project,
        openLoopCount: result.openLoops?.length ?? 0,
        at: new Date().toISOString(),
      },
    });

    sendApiSuccess<ResumeResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: "resume_project",
      }),
    );
  }),
);

memoryRouter.post(
  "/resume/brief",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ResumeMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<ContinueProjectBriefResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "resume_brief",
      text: parsed.data.question,
    }))) {
      return;
    }

    const result = await runResumeFlowLangGraph({
      userId: req.authUserId,
      project: parsed.data.project,
      question: parsed.data.question,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    const brief = toContinueProjectBrief(result);
    sendApiSuccess<ContinueProjectBriefResponseData>(
      res,
      200,
      brief,
      buildApiMeta(req, startedAt, {
        intent: "resume_project",
      }),
    );
  }),
);

memoryRouter.post(
  "/resume/prompt",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ResumePromptSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<ResumePromptResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    if (!(await applyMeteredOperation({
      req,
      res,
      startedAt,
      operation: "resume_prompt",
      text: parsed.data.question,
    }))) {
      return;
    }

    const result = await runResumeFlowLangGraph({
      userId: req.authUserId,
      project: parsed.data.project,
      question: parsed.data.question,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    const brief = toContinueProjectBrief(result);
    const prompts = toPromptBundle({ project: parsed.data.project, brief });
    const target = parsed.data.target ?? "cursor";
    const trace = result.usedMemories.slice(0, 6).map((memory) => ({
      memoryId: memory.id,
      source: memory.memoryType ?? "general",
      ...(memory.contractCategory ? { contractCategory: memory.contractCategory } : {}),
      confidence: Number(memory.finalScore.toFixed(3)),
      whySelected: memory.summary ?? memory.content,
    }));

    const response: ResumePromptResponseData = {
      target,
      brief,
      prompts,
      traceProof: toTraceProof({ trace, target }),
      trace,
    };
    sendApiSuccess<ResumePromptResponseData>(
      res,
      200,
      response,
      buildApiMeta(req, startedAt, {
        intent: "resume_project",
      }),
    );
  }),
);

memoryRouter.patch("/config/retrieval-weights", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Retrieval weight config is disabled in production" });
    return;
  }

  const parsed = RetrievalWeightsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  const result = setRetrievalWeights(parsed.data);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(200).json({
    weights: getRetrievalWeights(),
  });
});

memoryRouter.patch(
  "/:memoryId/archive",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const result = await archiveMemory({
      memoryId,
      userId: req.authUserId,
    });

    if (result.status === "not_found") {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    if (result.status === "already_archived") {
      res.status(400).json({ error: "Memory is already archived" });
      return;
    }

    res.status(200).json({
      memory: result.memory,
      revisionEvent: result.revisionEvent ?? null,
      timelineEvent: result.timelineEvent,
    });
  }),
);

memoryRouter.patch(
  "/:memoryId/unarchive",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const result = await unarchiveMemory({
      memoryId,
      userId: req.authUserId,
    });

    if (result.status === "not_found") {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    if (result.status === "already_active") {
      res.status(400).json({ error: "Memory is already active" });
      return;
    }

    res.status(200).json({
      memory: result.memory,
      revisionEvent: result.revisionEvent ?? null,
      timelineEvent: result.timelineEvent,
    });
  }),
);

memoryRouter.patch("/:memoryId/status", asyncHandler(async (req, res) => {
  const memoryId =
    typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
      ? req.params.memoryId
      : undefined;

  if (!memoryId) {
    res.status(400).json({ error: "memoryId is required" });
    return;
  }

  const parsed = MemoryStatusPatchSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  const result = await updateMemoryStatus({
    memoryId,
    userId: req.authUserId,
    status: parsed.data.status,
  });

  if (result.status === "not_found") {
    res.status(404).json({ error: "Memory not found" });
    return;
  }

  if (result.status === "already_in_status") {
    res.status(400).json({
      error: `Memory is already ${parsed.data.status}`,
    });
    return;
  }

  res.status(200).json({
    memory: result.memory,
    revisionEvent: result.revisionEvent ?? null,
    timelineEvent: result.timelineEvent ?? null,
  });
}),
);

memoryRouter.get("/revisions", asyncHandler(async (req, res) => {
  const memoryId =
    typeof req.query.memoryId === "string" && req.query.memoryId.length > 0
      ? req.query.memoryId
      : undefined;

  const revisions = (await listRevisionEvents(
    memoryId ? { memoryId } : { userId: req.authUserId },
  )).filter((event) => event.userId === req.authUserId);

  res.status(200).json({
    revisions,
    count: revisions.length,
  });
}));

memoryRouter.get("/timeline", asyncHandler(async (req, res) => {
  const limitRaw =
    typeof req.query.limit === "string" && req.query.limit.length > 0
      ? req.query.limit
      : undefined;
  let limit = 200;
  if (limitRaw !== undefined) {
    const parsedLimit = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      res.status(400).json({
        error: "Invalid query",
        details: { limit: "limit must be a positive integer" },
      });
      return;
    }
    limit = Math.min(parsedLimit, 500);
  }

  const events = await listTimelineEvents(req.authUserId, limit);

  res.status(200).json({
    events,
    count: events.length,
  });
}));

memoryRouter.get("/events", asyncHandler(async (req, res) => {
  const userId = req.authUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, userId })}\n\n`);

  const existingSinks = MEMORY_STREAMS.get(userId);
  const sinks = existingSinks ?? new Set<ExpressResponse>();
  if (!existingSinks) {
    MEMORY_STREAMS.set(userId, sinks);
  }
  sinks.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {"ts":"${new Date().toISOString()}"}\n\n`);
    } catch {
      // ignored
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const current = MEMORY_STREAMS.get(userId);
    if (!current) return;
    current.delete(res);
    if (current.size === 0) MEMORY_STREAMS.delete(userId);
  });
}));

memoryRouter.get("/system/health", asyncHandler(async (_req, res) => {
  ensureMemoryStoreIntegrity();

  const storesIntegrity = await hasValidStores();
  const retrievalConfigLoaded = hasValidBestConfig();
  const baselineReportPresent = hasValidBaselineReport();

  const status =
    storesIntegrity && retrievalConfigLoaded && baselineReportPresent
      ? "ok"
      : "degraded";

  res.status(200).json({
    status,
    checkedAt: new Date().toISOString(),
    checks: {
      storesIntegrity,
      retrievalConfigLoaded,
      baselineReportPresent,
    },
  });
}));

memoryRouter.get("/mvp/status", asyncHandler(async (_req, res) => {
  ensureMemoryStoreIntegrity();

  const storesIntegrity = await hasValidStores();
  const retrievalConfigLoaded = hasValidBestConfig();
  const baselineReport = readBaselineReport();
  const baselineReportPresent = baselineReport !== null;
  const evalPassRate = baselineReport?.passRate ?? null;
  const totalEvalCases = baselineReport?.totalCases ?? null;
  const evalPassRateAtLeast90 =
    typeof evalPassRate === "number" && evalPassRate >= 90;

  const completed: string[] = [];
  const pending: string[] = [];

  if (storesIntegrity) {
    completed.push("Runtime memory stores are valid JSON.");
  } else {
    pending.push("Fix runtime memory store integrity.");
  }

  if (retrievalConfigLoaded) {
    completed.push("Best retrieval config is present and valid.");
  } else {
    pending.push("Generate and save a valid best retrieval config.");
  }

  if (baselineReportPresent) {
    completed.push("Retrieval baseline report is present.");
  } else {
    pending.push("Create retrieval baseline report.");
  }

  if (evalPassRateAtLeast90) {
    completed.push("Retrieval eval pass rate is at least 90%.");
  } else {
    pending.push("Improve retrieval quality to at least 90% pass rate.");
  }

  const status = pending.length === 0 ? "on_track" : "at_risk";

  res.status(200).json({
    status,
    checkedAt: new Date().toISOString(),
    checks: {
      storesIntegrity,
      retrievalConfigLoaded,
      baselineReportPresent,
      evalPassRateAtLeast90,
    },
    metrics: {
      evalPassRate,
      totalEvalCases,
    },
    completed,
    pending,
  });
}));

memoryRouter.get(
  "/benchmark/report",
  asyncHandler(async (_req, res) => {
    if (!existsSync(BENCHMARK_REPORT_PATH)) {
      res.status(404).json({
        error: "Benchmark report not found",
        path: BENCHMARK_REPORT_PATH,
      });
      return;
    }

    try {
      const raw = readFileSync(BENCHMARK_REPORT_PATH, "utf8");
      const parsed = JSON.parse(raw);

      if (!isObjectRecord(parsed)) {
        res.status(500).json({
          error: "Benchmark report is invalid",
        });
        return;
      }

      res.status(200).json(parsed);
    } catch {
      res.status(500).json({
        error: "Failed to read benchmark report",
      });
    }
  }),
);

memoryRouter.get(
  "/explain",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.query.memoryId === "string" && req.query.memoryId.length > 0
        ? req.query.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const result = await explainMemory({
      memoryId,
      userId: req.authUserId,
    });

    if (!result) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    const ownerFromMetadata =
      typeof result.memory.rawMetadata.userId === "string"
        ? result.memory.rawMetadata.userId
        : undefined;
    const ownerFromRevision = result.latestRevision?.userId;
    const ownerFromTimeline = result.timeline[0]?.userId;
    const owner = ownerFromMetadata ?? ownerFromRevision ?? ownerFromTimeline;

    if (owner && owner !== req.authUserId) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    res.status(200).json(result);
  }),
);
memoryRouter.get(
  "/insights",
  asyncHandler(async (req, res) => {
    const userId = req.authUserId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const memoriesResult = await listMemories({ userId, limit: 200 });
    const memories = memoriesResult.memories;
    const events = await listTimelineEvents(userId);

    const totalsByType = {
      profile: 0,
      preference: 0,
      learning: 0,
      project: 0,
      episodic: 0,
    };

    const totalsByStatus = {
      active: 0,
      stale: 0,
      contradicted: 0,
      archived: 0,
      merged: 0,
    };

    const wordCount = new Map<string, number>();

    for (const memory of memories) {
      totalsByType[memory.type] += 1;
      totalsByStatus[memory.status] += 1;

      if (
        memory.type === "learning" ||
        memory.type === "profile" ||
        memory.type === "preference"
      ) {
        const text = `${memory.content} ${memory.summary}`.toLowerCase();
        const words = text.split(/[^a-z0-9+#.]+/).filter(Boolean);

        for (const word of words) {
          if (word.length < 3) {
            continue;
          }

          if (
            ["user", "using", "with", "and", "for", "the", "is", "are"].includes(
              word,
            )
          ) {
            continue;
          }

          wordCount.set(word, (wordCount.get(word) ?? 0) + 1);
        }
      }
    }

    const activeProjects = Array.from(
      new Set(
        memories
          .filter((memory) => memory.type === "project" && memory.status === "active")
          .map((memory) => memory.summary),
      ),
    );

    const topSkills = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const recentMilestones = [...events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map((event) => `${event.eventType}: ${event.reason}`);

    res.status(200).json({
      totalsByType,
      totalsByStatus,
      topSkills,
      activeProjects,
      recentMilestones,
    });
    return;
  }),
);
memoryRouter.get("/list", asyncHandler(async (req, res) => {
  const status =
    typeof req.query.status === "string" && req.query.status.length > 0
      ? req.query.status
      : undefined;
  const type =
    typeof req.query.type === "string" && req.query.type.length > 0
      ? req.query.type
      : undefined;
  const limitRaw =
    typeof req.query.limit === "string" && req.query.limit.length > 0
      ? req.query.limit
      : undefined;

  if (status && !MEMORY_STATUS.includes(status as MemoryStatus)) {
    res.status(400).json({
      error: "Invalid query",
      details: { status: `status must be one of: ${MEMORY_STATUS.join(", ")}` },
    });
    return;
  }

  if (type && !MEMORY_TYPES.includes(type as MemoryType)) {
    res.status(400).json({
      error: "Invalid query",
      details: { type: `type must be one of: ${MEMORY_TYPES.join(", ")}` },
    });
    return;
  }

  let limit: number | undefined;
  if (limitRaw !== undefined) {
    const parsedLimit = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      res.status(400).json({
        error: "Invalid query",
        details: { limit: "limit must be a positive integer" },
      });
      return;
    }
    limit = parsedLimit;
  }

  const result = await listMemories({
    userId: req.authUserId,
    ...(status ? { status: status as MemoryStatus } : {}),
    ...(type ? { type: type as MemoryType } : {}),
    ...(limit !== undefined ? { limit } : {}),
  });

  res.status(200).json({
    memories: result.memories,
    count: result.count,
  });
}),
);

memoryRouter.get(
  "/requests",
  asyncHandler(async (req, res) => {
    const limitRaw =
      typeof req.query.limit === "string" && req.query.limit.length > 0
        ? req.query.limit
        : undefined;
    const typeFilter =
      typeof req.query.type === "string" && req.query.type.length > 0
        ? req.query.type.trim()
        : undefined;
    const statusRaw =
      typeof req.query.status === "string" && req.query.status.length > 0
        ? req.query.status
        : undefined;
    const rangeFilter = parseRequestRange(req.query.range);

    let limit = 100;
    if (limitRaw !== undefined) {
      const parsedLimit = Number.parseInt(limitRaw, 10);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        res.status(400).json({
          error: "Invalid query",
          details: { limit: "limit must be a positive integer" },
        });
        return;
      }
      limit = Math.min(parsedLimit, 400);
    }

    const statusFilter = parseRequestStatus(statusRaw);
    if (statusRaw !== undefined && !statusFilter) {
      res.status(400).json({
        error: "Invalid query",
        details: { status: "status must be Success or Error" },
      });
      return;
    }

    const requestHistory = listRequestHistory({
      userId: req.authUserId,
      limit: 400,
      memoryOnly: true,
    });

    const rangeDays = REQUEST_RANGE_DAYS[rangeFilter];
    const rangeThresholdMs =
      rangeDays === null ? null : Date.now() - rangeDays * 24 * 60 * 60 * 1000;

    const filtered = requestHistory
      .filter((entry) => {
        if (typeFilter && entry.routeType !== typeFilter) {
          return false;
        }
        if (statusFilter && entry.status !== statusFilter) {
          return false;
        }
        if (rangeThresholdMs !== null) {
          const createdAtMs = toTimestampMs(entry.createdAt);
          if (createdAtMs <= 0 || createdAtMs < rangeThresholdMs) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt))
      .slice(0, limit)
      .map((entry) => ({
        ...entry,
        path: entry.path.length > 240 ? `${entry.path.slice(0, 240)}...[TRUNCATED]` : entry.path,
        payloadSummary: compactRequestField(entry.payloadSummary),
        responseSummary: compactRequestField(entry.responseSummary),
        errorDetails: compactRequestField(entry.errorDetails),
      }));

    res.status(200).json({
      requests: filtered,
      count: filtered.length,
      filters: {
        type: typeFilter ?? "all",
        status: statusFilter ?? "All",
        range: rangeFilter,
        limit,
      },
    });
  }),
);

memoryRouter.get(
  "/:memoryId",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const memory = await getMemoryForUser({
      memoryId,
      userId: req.authUserId,
    });

    if (!memory) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    res.status(200).json({ memory });
  }),
);
memoryRouter.post("/retrieve/debug", asyncHandler(async (req, res) => {
  const parsed = RetrieveMemorySchema.safeParse(req.body ?? {});
  const startedAt = Date.now();
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  if (!(await applyMeteredOperation({
    req,
    res,
    startedAt,
    operation: "retrieve_debug",
    text: parsed.data.question,
  }))) {
    return;
  }

  const requestedTopK = parsed.data.topK ?? 5;
  const debugTopK = 100;

  const result = await runRetrieveFlowLangGraph({
    userId: req.authUserId,
    question: parsed.data.question,
    topK: debugTopK,
    ...(parsed.data.includeArchived !== undefined
      ? { includeArchived: parsed.data.includeArchived }
      : {}),
    ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
    ...(parsed.data.project ? { project: parsed.data.project } : {}),
    ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
  });

  res.status(200).json({
    memories: result.memories,
    debug: result.debug,
    meta: {
      requestedTopK,
      debugTopK,
      returnedCount: result.memories.length,
    },
  });
}),
);

memoryRouter.post("/retrieve/why-not", asyncHandler(async (req, res) => {
  const parsed = RetrieveMemorySchema.safeParse(req.body ?? {});
  const startedAt = Date.now();
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  if (!(await applyMeteredOperation({
    req,
    res,
    startedAt,
    operation: "retrieve_why_not",
    text: parsed.data.question,
  }))) {
    return;
  }

  const requestedTopK = parsed.data.topK ?? 5;
  const analysis = await analyzeRetrieval({
    userId: req.authUserId,
    question: parsed.data.question,
    topK: requestedTopK,
    ...(parsed.data.includeArchived !== undefined
      ? { includeArchived: parsed.data.includeArchived }
      : {}),
    ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
    ...(parsed.data.project ? { project: parsed.data.project } : {}),
    ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
  });

  res.status(200).json({
    intent: analysis.intent,
    weightsUsed: analysis.weightsUsed,
    selected: analysis.allCandidates.filter((candidate) => !candidate.filteredOut),
    rejected: analysis.rejected,
    meta: {
      requestedTopK,
      totalCandidates: analysis.allCandidates.length,
      selectedCount: analysis.selected.length,
      rejectedCount: analysis.rejected.length,
    },
  });
}),
);

memoryRouter.all("/*splat", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
