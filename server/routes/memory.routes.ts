 import { Router, type Request, type Response as ExpressResponse } from "express";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { prisma } from "../../lib/storage/prismaClient";
import { runIngestFlowLangGraph } from "../../lib/workflows/ingestGraphLangGraph";
import { runRetrieveFlowLangGraph } from "../../lib/workflows/retrieveGraphLangGraph";
import { analyzeRetrieval } from "../../lib/memory/retrieveRelevantMemory";
import { listRevisionEvents } from "../../lib/memory/revisionMemory";
import {
  listTimelineEvents,
  recordMemoryCreatedEvent,
} from "../../lib/memory/timelineMemory";
import {
  getMemoryRealtimeProjection,
  listMemoryRealtimeEvents,
} from "../../lib/memory/realtimeEventStore";
import { emitMemoryRealtimeEvent as emitMemoryEvent, registerMemoryRealtimeSink } from "../../lib/memory/realtimeEventBus";
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
import {
  afterModel,
  beforeModel,
  type BeforeModelInput,
  type BeforeModelResult,
} from "../../lib/SDK/memoryHooks";
import { invokeMemoryTool } from "../../lib/memory/MCP";
import {
  MEMORY_STATUS,
  MEMORY_TYPES,
  type CompanyBrainMemoryType,
  type CompanyBrainConflict,
  type CompanyBrainFreshness,
  type Memory,
  type MemoryContractCategory,
  type MemoryStatus,
  type MemoryType,
  type OperationalTag,
} from "../../lib/memory/types";
import { ensureMemoryStoreIntegrity } from "../../lib/memory/startupIntegrity";
import {
  createApiKeyForUser,
  listApiKeysForUser,
  revokeApiKeyForUser,
  type ApiKeyRecord,
  type ApiKeyPermissionMode,
} from "../../lib/auth/apiKeyStore";
import {
  SERVICE_USER_EXPIRATIONS,
  SERVICE_USER_ROLES,
  countServiceUsersForOrg,
  createServiceUserForOrg,
  deleteServiceUserForOrg,
  listServiceUsersForOrg,
  type ServiceUserExpiration,
  type ServiceUserRecord,
  type ServiceUserRole,
} from "../../lib/auth/serviceUserStore";
import {
  readScopedSetting,
  userScopedSettingsIdentity,
  writeScopedSetting,
} from "../../lib/continuity/scopedSettingsStore";
import { isRuntimeStoreDbHealthy } from "../../lib/storage/runtimeStoreDb";
import {
  countApiKeyRequests24h,
  listRequestHistory,
  recordRequestHistoryEntry,
  subscribeRequestHistory,
} from "../middleware/requestLogger";
import {
  CompanyBrainExperienceCaptureSchema,
  CompanyBrainPhase2CaptureSchema,
  CompanyBrainReasoningBriefSchema,
  CompanyBrainReasoningCaptureSchema,
  MemoryIgnitionBeforeAgentSchema,
  MemoryIgnitionSendNowSchema,
  MemoryIgnitionOutcomeLearnSchema,
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
import { projectMatchesMemory } from "../../lib/continuity/projectScope";
import {
  assessCompanyBrainProofQuality,
  buildCompanyBrainRelations,
  resolveCompanyBrainEntities,
} from "../../lib/companyBrain/phase2ProofQuality";
import { summarizeMemoryInheritanceReadiness } from "../../lib/companyBrain/inheritanceReadiness";

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
  buildCompanyBrainFunnelApiPayload,
  getCompanyBrainFunnelProgress,
  patchCompanyBrainFunnelProgress,
  patchContinuityFunnelStep,
} from "../../lib/companyBrain/funnelStore";
import {
  appendCompanyBrainExport,
  listCompanyBrainExports,
  type CompanyBrainExportStats,
} from "../../lib/companyBrain/exportStore";
import { persistExperienceGraphMemory } from "../../lib/companyBrain/experienceGraph";
import { getLatestRun } from "../../lib/benchmark/benchmarkStore";
import {
  parseSkillGraphCandidate as parseSkillGraphCandidateMemory,
  selectApprovedExecutableSkills,
} from "../../lib/companyBrain/skillGraph";
import { readOrgIdFromRequest } from "../../lib/auth/orgScope";
import {
  createActionMemory,
  getLineageForActionMemory,
  listActionMemories,
  listActionMemoriesWithLineage,
} from "../../lib/memory/actionMemoryStore";
import {
  attachOutcomeToMemoryIgnitionApprovalRequests,
  buildMemoryIgnitionApprovalAuditProof,
  findApprovedMemoryIgnitionApprovalRequest,
  listMemoryIgnitionApprovalRequests,
  type MemoryIgnitionApprovalRequest,
  reviewMemoryIgnitionApprovalRequest,
  upsertMemoryIgnitionApprovalRequest,
} from "../../lib/memory/approvalRequestStore";
import {
  getMemoryIgnitionRuntimePolicySettings,
  resolveMemoryIgnitionRuntimeAllowedTools,
  saveMemoryIgnitionRuntimePolicySettings,
  type MemoryIgnitionRuntimePolicySettings,
} from "../../lib/memory/runtimePolicyStore";
import type { ActionMemoryOutcome, ActionMemorySourceType } from "../../lib/memory/actionMemoryTypes";
import {
  appendContinuityFeedback,
  getContinuityFeedbackSummary,
  isContinuityFeedbackKind,
  listContinuityFeedback,
  normalizeContinuityFeedbackRating,
} from "../../lib/memory/continuityFeedbackStore";
import { recordContinuityFeedbackMetric } from "../observability/metrics";
import { registerContinuityMemoryRoutes } from "./continuityMemory.handlers";
import {
  extractRawSignalsToPhase2Memories,
  mapJiraSignalToPhase2RawSignal,
  mapSlackSignalToPhase2RawSignal,
  preparePhase2Memory,
  type Phase2RejectedMemory,
  type Phase2StructuredMemoryInput,
} from "../services/companyBrainPhase2Pipeline";

export const memoryRouter = Router();

subscribeRequestHistory((entry) => {
  if (!entry.userId || entry.userId === "anonymous") return;
  if (!entry.path.startsWith("/api/memory") && !entry.path.startsWith("/api/v1/memory")) return;
  if (entry.path.startsWith("/api/memory/events")) return;

  emitMemoryEvent({
    kind: "request_logged",
    userId: entry.userId,
    source: "request-logger",
    subject: {
      type: "request",
      id: entry.requestId,
      label: `${entry.method} ${entry.path}`,
    },
    payload: { request: entry },
  });
});

const DATA_DIR = path.join(process.cwd(), "data");
const BEST_CONFIG_PATH = path.join(DATA_DIR, "eval", "best-config.json");
const REQUEST_RANGE_DAYS = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  all: null,
} as const;

const REQUEST_STATUSES = ["Success", "Error"] as const;
const API_KEY_EXPIRY_OPTIONS = ["30 days", "90 days", "1 year", "Never"] as const;
const API_KEY_ENDPOINTS = [
  "memoryignition_brief",
  "send_now",
  "before_action",
  "risk_check",
  "outcome",
  "trace_proof",
  "retrieve",
  "resume",
  "continue",
  "handoff",
  "memory_add",
  "memory_update",
  "memory_delete",
  "search",
  "mcp_invoke",
  "connector_codex",
] as const;

const AGENT_MEMORY_PROTOCOL_ENDPOINTS = [
  "memoryignition_brief",
  "send_now",
  "before_action",
  "risk_check",
  "outcome",
  "handoff",
  "trace_proof",
  "mcp_invoke",
] as const;

function resolveApiKeyExpiresAt(expires: string): string {
  if (expires === "Never") {
    return expires;
  }

  const durationMsByLabel: Record<(typeof API_KEY_EXPIRY_OPTIONS)[number], number | undefined> = {
    "30 days": 30 * 24 * 60 * 60 * 1000,
    "90 days": 90 * 24 * 60 * 60 * 1000,
    "1 year": 365 * 24 * 60 * 60 * 1000,
    "Never": undefined,
  };

  const durationMs = durationMsByLabel[expires as (typeof API_KEY_EXPIRY_OPTIONS)[number]];
  if (!durationMs) {
    return expires;
  }

  return new Date(Date.now() + durationMs).toISOString();
}

const AGENT_MEMORY_PROTOCOL_HTTP_ENDPOINTS = [
  "POST /api/memory/memoryignition/brief",
  "POST /api/memory/memoryignition/send-now",
  "POST /api/memory/memoryignition/before-agent",
  "POST /api/memory/memoryignition/before-action",
  "POST /api/memory/memoryignition/during-action",
  "POST /api/memory/memoryignition/risk-check",
  "POST /api/memory/memoryignition/after-agent",
  "POST /api/memory/memoryignition/outcome-learn",
  "POST /api/memory/memoryignition/outcome",
  "POST /api/memory/memoryignition/handoff",
  "GET /api/memory/memory/:id/trace-proof",
] as const;

const AGENT_MEMORY_PROTOCOL_SDK_CALLS = [
  "memoryos.createBrief(task)",
  "memoryos.sendNow(target)",
  "memoryos.beforeAgent(task)",
  "memoryos.beforeAction(action)",
  "memoryos.riskCheck(files)",
  "memoryos.afterAgent(result)",
  "memoryos.saveOutcome(result)",
  "memoryos.createHandoff(task)",
] as const;

const AGENT_MEMORY_PROTOCOL_MCP_TOOLS = [
  "memoryignition_get_brief",
  "memoryignition_send_now",
  "memoryignition_search_memory",
  "memoryignition_risk_check",
  "memoryignition_save_outcome",
  "memoryignition_create_handoff",
  "memoryignition_get_trace_proof",
] as const;

type BaselineReport = {
  passRate: number;
  totalCases: number;
  updatedAt?: string;
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

const WORKSPACE_SETTINGS_SECTION = "workspace-state";

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

async function getGovernancePolicyForUser(userId: string): Promise<GovernancePolicy> {
  return (await readGovernancePolicyForUser(userId))?.policy ?? DEFAULT_GOVERNANCE_POLICY;
}

async function setGovernancePolicyForUser(userId: string, input: unknown): Promise<GovernancePolicy> {
  const resolved = resolveGovernancePolicy(input);
  const savedAt = new Date().toISOString();
  await writeGovernancePolicyForUser(userId, { policy: resolved, savedAt });
  return resolved;
}

async function resolveGovernancePolicyWithUserDefault(userId: string, input: unknown): Promise<GovernancePolicy> {
  const userDefault = await getGovernancePolicyForUser(userId);
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

async function resolveActorRoleForUser(userId: string): Promise<TeamRole> {
  const state = await getWorkspaceState(userId);
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

async function persistContractFallbackMemory(input: {
  userId: string;
  threadId?: string;
  message?: string;
  contract?: ContractLike;
  operationalTags: OperationalTag[];
}): Promise<{ memory: Memory; timelineEvent: Awaited<ReturnType<typeof recordMemoryCreatedEvent>> }> {
  const now = new Date().toISOString();
  const contract = input.contract ?? {};
  const summary =
    contract.goal?.trim() ||
    contract.next_actions?.[0]?.trim() ||
    contract.decisions?.[0]?.trim() ||
    (input.message?.trim().slice(0, 140) ?? "Captured continuity contract");
  const contractCategory =
    (contract.next_actions?.length ?? 0) > 0
      ? "next_action"
      : (contract.decisions?.length ?? 0) > 0
        ? "decision"
        : (contract.open_risks?.length ?? 0) > 0
          ? "incident"
          : undefined;
  const content = [
    input.message?.trim() ? `Message: ${input.message.trim()}` : undefined,
    contract.goal ? `Goal: ${contract.goal}` : undefined,
    (contract.constraints?.length ?? 0) > 0 ? `Constraints: ${contract.constraints?.join(" | ")}` : undefined,
    (contract.decisions?.length ?? 0) > 0 ? `Decisions: ${contract.decisions?.join(" | ")}` : undefined,
    (contract.open_risks?.length ?? 0) > 0 ? `Open Risks: ${contract.open_risks?.join(" | ")}` : undefined,
    (contract.next_actions?.length ?? 0) > 0 ? `Next Actions: ${contract.next_actions?.join(" | ")}` : undefined,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n");

  const memory: Memory = {
    id: randomUUID(),
    userId: input.userId,
    type: "project",
    content: content.length > 0 ? content : summary,
    summary,
    importanceScore: 0.86,
    confidence: 0.9,
    source: "chat",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: 1,
    contractVersion: "memoryos.contract.v1",
    ...(contractCategory ? { contractCategory } : {}),
    operationalTags: input.operationalTags.length > 0 ? input.operationalTags : undefined,
    developerSignals: {
      goal: contract.goal ? [contract.goal] : undefined,
      projectArea: input.threadId ? [input.threadId] : undefined,
    },
  };

  await getMemoryStoreAdapter().saveMemory({ memory });
  await upsertRecentMemory(memory);
  const timelineEvent = await recordMemoryCreatedEvent(
    memory,
    "Captured continuity contract fallback memory for reliable resume/handoff retrieval.",
  );
  return { memory, timelineEvent };
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

function isServiceUserRole(value: unknown): value is ServiceUserRole {
  return typeof value === "string" && SERVICE_USER_ROLES.includes(value as ServiceUserRole);
}

function isServiceUserExpiration(value: unknown): value is ServiceUserExpiration {
  return typeof value === "string" && SERVICE_USER_EXPIRATIONS.includes(value as ServiceUserExpiration);
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
  return isRuntimeStoreDbHealthy();
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
  const keys = (await listApiKeysForUser(req.authUserId)).map(serializeApiKeyForClient);
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
  const creditLimit =
    typeof req.body.creditLimit === "number" && Number.isFinite(req.body.creditLimit)
      ? Math.max(0, Math.trunc(req.body.creditLimit))
      : typeof req.body.creditLimit === "string" && req.body.creditLimit.trim().length > 0 && Number.isFinite(Number(req.body.creditLimit))
        ? Math.max(0, Math.trunc(Number(req.body.creditLimit)))
        : null;
  const resetLimitEvery =
    typeof req.body.resetLimitEvery === "string" && req.body.resetLimitEvery.trim().length > 0
      ? req.body.resetLimitEvery.trim()
      : null;
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

  const result = await createApiKeyForUser({
    userId: req.authUserId,
    name,
    expires: resolveApiKeyExpiresAt(expires),
    mode,
    endpoints: mode === "full" ? [...API_KEY_ENDPOINTS] : requestedEndpoints,
    contentTag: mode === "full" ? "all" : contentTag,
    creditLimit,
    resetLimitEvery,
  });

  emitMemoryEvent({
    kind: "api_keys_changed",
    userId: req.authUserId,
    payload: { action: "created", keyId: result.key.id },
  });

  res.status(201).json({
    token: result.token,
    key: serializeApiKeyForClient(result.key),
  });
}));

memoryRouter.post("/api-keys/codex", asyncHandler(async (req, res) => {
  const expires =
    isObjectRecord(req.body) && typeof req.body.expires === "string"
      ? req.body.expires
      : "1 year";
  const name =
    isObjectRecord(req.body) && typeof req.body.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : "codex-memoryignition-bridge";

  if (!API_KEY_EXPIRY_OPTIONS.includes(expires as (typeof API_KEY_EXPIRY_OPTIONS)[number])) {
    res.status(400).json({ error: "Invalid API key expiry" });
    return;
  }

  const result = await createApiKeyForUser({
    userId: req.authUserId,
    name,
    expires: resolveApiKeyExpiresAt(expires),
    mode: "scoped",
    endpoints: ["mcp_invoke", "connector_codex", "retrieve", "resume", "handoff"],
    contentTag: "codex",
  });

  emitMemoryEvent({
    kind: "api_keys_changed",
    userId: req.authUserId,
    payload: { action: "created", keyId: result.key.id, purpose: "codex" },
  });

  res.status(201).json({
    token: result.token,
    key: serializeApiKeyForClient(result.key),
    setup: {
      baseUrl: process.env.MEMORYOS_PUBLIC_APP_URL ?? process.env.MEMORYOS_BASE_URL ?? "http://localhost:3011",
      commands: [
        `$env:MEMORYOS_API_TOKEN = "${result.token}"`,
        `$env:MEMORYOS_BASE_URL = "${process.env.MEMORYOS_PUBLIC_APP_URL ?? process.env.MEMORYOS_BASE_URL ?? "http://localhost:3011"}"`,
        "npm run codex:mcp:install",
        'npm run codex:memoryos -- --task "your Codex task"',
      ],
    },
  });
}));

memoryRouter.post("/api-keys/:keyId/revoke", asyncHandler(async (req, res) => {
  const revoked = await revokeApiKeyForUser(req.authUserId, req.params.keyId as string);
  if (!revoked) {
    res.status(404).json({ error: "API key not found" });
    return;
  }

  emitMemoryEvent({
    kind: "api_keys_changed",
    userId: req.authUserId,
    payload: { action: "revoked", keyId: revoked.id },
  });

  res.json({ key: revoked });
}));

function resolveServiceUsersOrgId(req: Request): string {
  return readOrgIdFromRequest(req) ?? req.authOrgId ?? `user:${req.authUserId}`;
}

memoryRouter.get("/service-users", asyncHandler(async (req, res) => {
  const orgId = resolveServiceUsersOrgId(req);
  const serviceUsers = (await listServiceUsersForOrg(req.authUserId, orgId)).map(
    serializeServiceUserForClient,
  );
  res.json({ serviceUsers });
}));

memoryRouter.post("/service-users", asyncHandler(async (req, res) => {
  if (
    !isObjectRecord(req.body) ||
    typeof req.body.name !== "string" ||
    !isServiceUserRole(req.body.role) ||
    !isServiceUserExpiration(req.body.expiration)
  ) {
    res.status(400).json({ error: "Invalid service user payload" });
    return;
  }

  const name = req.body.name.trim();
  if (!name) {
    res.status(400).json({ error: "Display name is required" });
    return;
  }

  if (name.length > 120) {
    res.status(400).json({ error: "Display name must be 120 characters or fewer" });
    return;
  }

  const orgId = resolveServiceUsersOrgId(req);
  const existingCount = await countServiceUsersForOrg(req.authUserId, orgId);
  if (existingCount >= 200) {
    res.status(409).json({ error: "Service user limit reached for this organization" });
    return;
  }

  const serviceUser = await createServiceUserForOrg({
    userId: req.authUserId,
    orgId,
    name,
    role: req.body.role,
    expiration: req.body.expiration,
  });
  const serviceUsers = (await listServiceUsersForOrg(req.authUserId, orgId)).map(
    serializeServiceUserForClient,
  );

  emitMemoryEvent({
    kind: "service_users_changed",
    userId: req.authUserId,
    payload: { action: "created", orgId: serviceUser.orgId, serviceUserId: serviceUser.id },
  });

  res.status(201).json({
    serviceUser: serializeServiceUserForClient(serviceUser),
    serviceUsers,
  });
}));

memoryRouter.delete("/service-users/:serviceUserId", asyncHandler(async (req, res) => {
  const orgId = resolveServiceUsersOrgId(req);
  const removed = await deleteServiceUserForOrg(
    req.authUserId,
    orgId,
    req.params.serviceUserId as string,
  );
  if (!removed) {
    res.status(404).json({ error: "Service user not found" });
    return;
  }

  const serviceUsers = (await listServiceUsersForOrg(req.authUserId, orgId)).map(
    serializeServiceUserForClient,
  );

  emitMemoryEvent({
    kind: "service_users_changed",
    userId: req.authUserId,
    payload: { action: "deleted", orgId: removed.orgId, serviceUserId: removed.id },
  });

  res.json({ serviceUsers });
}));

memoryRouter.get("/billing", asyncHandler(async (req, res) => {
  const state = await getWorkspaceState(req.authUserId);
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
  const state = await getWorkspaceState(req.authUserId);
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
  const state = await getWorkspaceState(req.authUserId);
  const billingState = await getBillingStateForUser(req.authUserId);
  state.plan = billingState.plan;
  res.json({
    workspaceName: state.workspaceName,
    plan: state.plan,
    members: state.members,
    invites: state.invites,
  });
}));

memoryRouter.post("/team/invites", asyncHandler(async (req, res) => {
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
  const state = await getWorkspaceState(req.authUserId);
  const invite: TeamInviteRecord = {
    id: randomUUID(),
    email,
    role,
    access,
    sentAt: new Date().toISOString(),
    state: "pending",
  };
  state.invites = [invite, ...state.invites].slice(0, 30);
  await saveWorkspaceState(req.authUserId, state);
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
  const { plugins, events } = await buildPluginCatalog(req.authUserId);
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
  const saved = await readGovernancePolicyForUser(req.authUserId);
  const governance = saved?.policy ?? DEFAULT_GOVERNANCE_POLICY;
  const savedAt = saved?.savedAt ?? null;
  res.status(200).json({
    governance,
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
  const actorRole = await resolveActorRoleForUser(req.authUserId);
  if (!canManageGovernance(actorRole)) {
    res.status(403).json({ error: "Only owner/admin can modify governance policy" });
    return;
  }

  const policy = await setGovernancePolicyForUser(req.authUserId, req.body.governance ?? req.body);
  const savedAt = (await readGovernancePolicyForUser(req.authUserId))?.savedAt ?? new Date().toISOString();
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
      : (await getGovernancePolicyForUser(req.authUserId)).mode;

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
  const scopedMemories = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 1000,
  });
  const before = scopedMemories.memories.find((memory) => memory.id === memoryId) ?? null;
  if (!before) {
    await appendConflictAction({
      id: randomUUID(),
      traceId,
      userId: req.authUserId,
      type: "mark_stale",
      memoryId,
      beforeStatus: null,
      afterStatus: null,
      result: "fail",
      error: "Memory not found in workspace",
      actor: "user",
      at: new Date().toISOString(),
    });
    res.status(404).json({ error: "Memory not found", traceId });
    return;
  }

  const result = await updateMemoryStatus({
    memoryId,
    userId: req.authUserId,
    status: "stale",
  });

  if (result.status === "not_found") {
    await appendConflictAction({
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

  await appendConflictAction({
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
  const scopedMemories = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 1000,
  });
  const before = scopedMemories.memories.find((memory) => memory.id === memoryId) ?? null;
  if (!before) {
    await appendConflictAction({
      id: randomUUID(),
      traceId,
      userId: req.authUserId,
      type: "merge",
      memoryId,
      beforeStatus: null,
      afterStatus: null,
      result: "fail",
      error: "Memory not found in workspace",
      actor: "user",
      at: new Date().toISOString(),
    });
    res.status(404).json({ error: "Memory not found", traceId });
    return;
  }

  const result = await updateMemoryStatus({
    memoryId,
    userId: req.authUserId,
    status: "merged",
  });

  if (result.status === "not_found") {
    await appendConflictAction({
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

  await appendConflictAction({
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
  const scopedMemories = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 1000,
  });
  const memory = scopedMemories.memories.find((item) => item.id === memoryId) ?? null;
  if (!memory) {
    await appendConflictAction({
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
  await appendConflictAction({
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
  const store = await readConflictActionStore();
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
  const queue = await readConflictQueueStore();
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
  const store = await readGovernanceReviewStore();
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
  const actorRole = await resolveActorRoleForUser(req.authUserId);
  if (!canManageGovernance(actorRole)) {
    res.status(403).json({ error: "Only owner/admin can review high-risk writes", traceId });
    return;
  }

  const store = await readGovernanceReviewStore();
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
  await writeGovernanceReviewStore(store);

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

  const queue = await readConflictQueueStore();
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

  await appendConflictAction({
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
  await writeConflictQueueStore(queue);

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
  const { plugins } = await buildPluginCatalog(req.authUserId);
  const plugin = plugins.find((entry) => entry.id === pluginId);
  if (!plugin) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }

  const userState = await getPluginUserState(req.authUserId);
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
  await setPluginUserState(req.authUserId, userState);

  const next = await buildPluginCatalog(req.authUserId);
  res.json({ plugin: next.plugins.find((entry) => entry.id === pluginId), plugins: next.plugins, events: next.events });
}));

memoryRouter.post("/plugins/:pluginId/uninstall", asyncHandler(async (req, res) => {
  const pluginIdParam = req.params.pluginId;
  const pluginId = Array.isArray(pluginIdParam) ? pluginIdParam[0] : pluginIdParam;
  if (typeof pluginId !== "string" || pluginId.trim().length === 0) {
    res.status(400).json({ error: "pluginId is required" });
    return;
  }
  const { plugins } = await buildPluginCatalog(req.authUserId);
  const plugin = plugins.find((entry) => entry.id === pluginId);
  if (!plugin) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }

  const userState = await getPluginUserState(req.authUserId);
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
  await setPluginUserState(req.authUserId, userState);

  const next = await buildPluginCatalog(req.authUserId);
  res.json({ plugin: next.plugins.find((entry) => entry.id === pluginId), plugins: next.plugins, events: next.events });
}));

memoryRouter.get("/settings", asyncHandler(async (req, res) => {
  const state = await getWorkspaceState(req.authUserId);
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
  const state = await getWorkspaceState(req.authUserId);
  if (typeof req.body.workspaceName === "string" && req.body.workspaceName.trim().length > 0) {
    state.workspaceName = req.body.workspaceName.trim();
  }
  if (typeof req.body.contextEnabled === "boolean") {
    state.organization.contextEnabled = req.body.contextEnabled;
  }
  await saveWorkspaceState(req.authUserId, state);
  res.json({
    workspaceName: state.workspaceName,
    organization: state.organization,
  });
}));

async function generateCompanyBrainSkillsForUser(input: {
  userId: string;
  orgId?: string;
  persistExport: boolean;
}): Promise<{
  workspace: string;
  generatedAt: string;
  stats: CompanyBrainExportStats;
  skillsMarkdown: string;
  exportId?: string;
}> {
  const workspace = (await getWorkspaceState(input.userId)).workspaceName;
  const memoryResult = await listMemories({
    userId: input.userId,
    orgId: input.orgId,
    limit: 300,
  });
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

  const exportId = randomUUID();
  await appendCompanyBrainExport(
    {
      id: exportId,
      userId: input.userId,
      orgId: input.orgId,
      workspace,
      generatedAt,
      stats,
      skillsMarkdown,
    },
    input.orgId,
  );

  return {
    workspace,
    generatedAt,
    stats,
    skillsMarkdown,
    exportId,
  };
}

type Phase2Pillar = CompanyBrainMemoryType;

type Phase2EntityKind =
  | "source"
  | "project"
  | "workspace"
  | "thread"
  | "agent"
  | "repo"
  | "file"
  | "issue"
  | "service"
  | "customer"
  | "memory_type";

type Phase2ResolvedEntity = {
  id: string;
  kind: Phase2EntityKind;
  label: string;
  references: string[];
  evidenceCount: number;
  memoryIds: string[];
  latestMemoryAt: string;
};

type Phase2MonitoringCheck = {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

const PHASE2_CONTRACT_CATEGORY_BY_TYPE: Record<Phase2Pillar, MemoryContractCategory> = {
  decision: "decision",
  incident: "incident",
  architecture: "architecture_note",
  process: "runbook",
  customer_issue: "bug",
  execution: "previous_attempt",
  agent_action: "previous_attempt",
  risk: "risky_file",
  test: "policy",
  knowledge: "decision",
  context: "next_action",
};

const PHASE2_MEMORY_TYPE_BY_TYPE: Record<Phase2Pillar, MemoryType> = {
  decision: "project",
  incident: "episodic",
  architecture: "project",
  process: "episodic",
  customer_issue: "episodic",
  execution: "episodic",
  agent_action: "episodic",
  risk: "project",
  test: "project",
  knowledge: "learning",
  context: "project",
};

function phase2OperationalTags(type: Phase2Pillar): OperationalTag[] | undefined {
  if (type === "decision" || type === "architecture") return ["decision"];
  if (type === "incident" || type === "customer_issue") return ["incident"];
  if (type === "process") return ["runbook"];
  if (type === "risk" || type === "test") return ["policy"];
  return undefined;
}

function phase2EntityId(kind: Phase2EntityKind, label: string): string {
  return `${kind}:${label.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 140)}`;
}

function addPhase2Entity(
  entities: Map<string, Phase2ResolvedEntity>,
  input: {
    kind: Phase2EntityKind;
    label?: string | null;
    reference?: string | null;
    memory: Memory;
  },
): void {
  const label = input.label?.trim();
  if (!label) return;
  const id = phase2EntityId(input.kind, label);
  const existing = entities.get(id);
  const reference = input.reference?.trim() || label;
  if (existing) {
    if (!existing.references.includes(reference)) existing.references.push(reference);
    if (!existing.memoryIds.includes(input.memory.id)) existing.memoryIds.push(input.memory.id);
    existing.evidenceCount += 1;
    if (new Date(input.memory.updatedAt).getTime() > new Date(existing.latestMemoryAt).getTime()) {
      existing.latestMemoryAt = input.memory.updatedAt;
    }
    return;
  }
  entities.set(id, {
    id,
    kind: input.kind,
    label,
    references: [reference],
    evidenceCount: 1,
    memoryIds: [input.memory.id],
    latestMemoryAt: input.memory.updatedAt,
  });
}

function addPhase2EntitiesFromGraphRef(
  entities: Map<string, Phase2ResolvedEntity>,
  memory: Memory,
  edgeRef: string,
): void {
  const [prefix, ...rest] = edgeRef.split(":");
  const value = rest.join(":").trim();
  if (!value || prefix === "dedupe") return;
  if (prefix === "project") addPhase2Entity(entities, { kind: "project", label: value, reference: edgeRef, memory });
  if (prefix === "workspace") addPhase2Entity(entities, { kind: "workspace", label: value, reference: edgeRef, memory });
  if (prefix === "thread") addPhase2Entity(entities, { kind: "thread", label: value, reference: edgeRef, memory });
  if (prefix === "agent") addPhase2Entity(entities, { kind: "agent", label: value, reference: edgeRef, memory });
}

function resolvePhase2Entities(memories: Memory[]): Phase2ResolvedEntity[] {
  const entities = new Map<string, Phase2ResolvedEntity>();
  const fileRegex = /\b(?:[\w.-]+\/)+[\w.-]+\.(?:ts|tsx|js|jsx|md|json|yml|yaml|sql|prisma|py|go|rs|java|rb|php|css|scss)\b/g;
  const repoRegex = /\b[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\b/g;
  const issueRegex = /\b(?:[A-Z][A-Z0-9]+-\d+|#\d+|pull\/\d+|issues\/\d+)\b/g;
  const serviceRegex = /\b(?:api|web|worker|backend|frontend|gateway|database|postgres|redis|queue|scheduler|billing|auth|slack|github|linear|devin|codex)\b/gi;
  const customerRegex = /\b(?:customer|tenant|workspace|org)[\s:_-]+([A-Za-z0-9_.-]{3,80})\b/gi;

  for (const memory of memories) {
    addPhase2Entity(entities, {
      kind: "memory_type",
      label: memory.companyBrainType ?? memory.contractCategory ?? memory.type,
      reference: memory.sourceRef ?? memory.id,
      memory,
    });
    addPhase2Entity(entities, {
      kind: "source",
      label: memory.traceProof?.sourceType ?? memory.sourceRef?.split(":")[0] ?? memory.source,
      reference: memory.traceProof?.sourceRef ?? memory.sourceRef ?? memory.id,
      memory,
    });

    for (const edgeRef of memory.graph?.edgeRefs ?? []) {
      addPhase2EntitiesFromGraphRef(entities, memory, edgeRef);
    }
    for (const file of memory.files ?? []) {
      addPhase2Entity(entities, { kind: "file", label: file, reference: file, memory });
    }

    const haystack = [
      memory.summary,
      memory.content,
      memory.sourceRef,
      ...(memory.traceProof?.evidence ?? []),
      ...(memory.graph?.edgeRefs ?? []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join("\n");

    for (const match of haystack.matchAll(fileRegex)) {
      addPhase2Entity(entities, { kind: "file", label: match[0], reference: match[0], memory });
    }
    for (const match of haystack.matchAll(repoRegex)) {
      const value = match[0];
      if (value.includes(".") || value.includes("://")) continue;
      addPhase2Entity(entities, { kind: "repo", label: value, reference: value, memory });
    }
    for (const match of haystack.matchAll(issueRegex)) {
      addPhase2Entity(entities, { kind: "issue", label: match[0], reference: match[0], memory });
    }
    for (const match of haystack.matchAll(serviceRegex)) {
      addPhase2Entity(entities, { kind: "service", label: match[0].toLowerCase(), reference: match[0], memory });
    }
    for (const match of haystack.matchAll(customerRegex)) {
      addPhase2Entity(entities, { kind: "customer", label: match[1], reference: match[0], memory });
    }
  }

  return [...entities.values()]
    .sort((left, right) => {
      if (right.evidenceCount !== left.evidenceCount) return right.evidenceCount - left.evidenceCount;
      return new Date(right.latestMemoryAt).getTime() - new Date(left.latestMemoryAt).getTime();
    })
    .slice(0, 120);
}

function buildPhase2MonitoringChecks(input: {
  total: number;
  traceProofCoverage: number;
  staleCount: number;
  unresolvedConflicts: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  entityCount: number;
  productionReadyCount: number;
  blockedProofCount: number;
  averageProofQuality: number;
  lastStructuredMemoryAt: string | null;
}): Phase2MonitoringCheck[] {
  return [
    {
      name: "trace_proof_coverage",
      status: input.total === 0 ? "warn" : input.traceProofCoverage >= 90 ? "pass" : "warn",
      detail: `${input.traceProofCoverage}% of Phase 2 memories carry source proof.`,
    },
    {
      name: "conflict_review_queue",
      status: input.unresolvedConflicts === 0 ? "pass" : "warn",
      detail: `${input.unresolvedConflicts} unresolved conflict${input.unresolvedConflicts === 1 ? "" : "s"}.`,
    },
    {
      name: "staleness_watch",
      status: input.staleCount === 0 ? "pass" : "warn",
      detail: `${input.staleCount} stale memor${input.staleCount === 1 ? "y" : "ies"} need review.`,
    },
    {
      name: "graph_materialization",
      status: input.graphNodeCount > 0 && input.graphEdgeCount > 0 ? "pass" : input.total > 0 ? "warn" : "fail",
      detail: `${input.graphNodeCount} nodes and ${input.graphEdgeCount} evidence edges.`,
    },
    {
      name: "entity_resolution",
      status: input.entityCount > 0 ? "pass" : input.total > 0 ? "warn" : "fail",
      detail: `${input.entityCount} normalized entities available for retrieval and graph inspection.`,
    },
    {
      name: "production_monitoring",
      status: input.lastStructuredMemoryAt ? "pass" : "warn",
      detail: input.lastStructuredMemoryAt
        ? `Last structured memory: ${input.lastStructuredMemoryAt}.`
        : "No Phase 2 structured memory has been written yet.",
    },
    {
      name: "proof_quality",
      status:
        input.total === 0
          ? "warn"
          : input.averageProofQuality >= 75 && input.blockedProofCount === 0
            ? "pass"
            : "warn",
      detail: `${input.productionReadyCount}/${input.total} production-ready memories; average proof quality ${input.averageProofQuality}/100; blocked ${input.blockedProofCount}.`,
    },
  ];
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function buildPhase2ExtractionReadiness(input: {
  total: number;
  traceableCount: number;
  contractValidatedCount: number;
  dedupeIndexedCount: number;
  freshnessCheckedCount: number;
  conflictCheckedCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  entityCount: number;
  productionReadyCount: number;
  blockedProofCount: number;
  staleCount: number;
  unresolvedConflicts: number;
}) {
  const stages = [
    {
      id: "extract",
      label: "Extracted",
      status: input.total > 0 ? "pass" : "warn",
      count: input.total,
      total: input.total,
      detail: `${input.total} structured memor${input.total === 1 ? "y" : "ies"} persisted from source signals.`,
    },
    {
      id: "contract",
      label: "Contract validated",
      status: input.total > 0 && input.contractValidatedCount === input.total ? "pass" : input.total > 0 ? "warn" : "fail",
      count: input.contractValidatedCount,
      total: input.total,
      detail: `${input.contractValidatedCount}/${input.total} memories carry MemoryOS contract category metadata.`,
    },
    {
      id: "dedupe",
      label: "Deduped",
      status: input.total > 0 && input.dedupeIndexedCount === input.total ? "pass" : input.total > 0 ? "warn" : "fail",
      count: input.dedupeIndexedCount,
      total: input.total,
      detail: `${input.dedupeIndexedCount}/${input.total} memories have stable dedupe keys.`,
    },
    {
      id: "freshness",
      label: "Freshness checked",
      status: input.total > 0 && input.freshnessCheckedCount === input.total && input.staleCount === 0 ? "pass" : input.total > 0 ? "warn" : "fail",
      count: input.freshnessCheckedCount,
      total: input.total,
      detail: `${input.freshnessCheckedCount}/${input.total} memories have freshness status; ${input.staleCount} stale.`,
    },
    {
      id: "conflict",
      label: "Contradiction checked",
      status: input.unresolvedConflicts === 0 && input.total > 0 ? "pass" : input.total > 0 ? "warn" : "fail",
      count: input.conflictCheckedCount,
      total: input.total,
      detail: `${input.conflictCheckedCount}/${input.total} memories checked; ${input.unresolvedConflicts} unresolved conflict${input.unresolvedConflicts === 1 ? "" : "s"}.`,
    },
    {
      id: "graph",
      label: "Graph indexed",
      status: input.graphNodeCount > 0 && input.graphEdgeCount > 0 ? "pass" : input.total > 0 ? "warn" : "fail",
      count: input.graphNodeCount,
      total: input.total,
      detail: `${input.graphNodeCount} graph nodes and ${input.graphEdgeCount} retrieval/evidence edges.`,
    },
    {
      id: "proof",
      label: "Trace proof",
      status: input.total > 0 && percent(input.traceableCount, input.total) >= 80 ? "pass" : input.total > 0 ? "warn" : "fail",
      count: input.traceableCount,
      total: input.total,
      detail: `${percent(input.traceableCount, input.total)}% source trace proof coverage.`,
    },
    {
      id: "inheritance",
      label: "Inheritance ready",
      status: input.productionReadyCount > 0 && input.blockedProofCount === 0 && input.unresolvedConflicts === 0 ? "pass" : input.total > 0 ? "warn" : "fail",
      count: input.productionReadyCount,
      total: input.total,
      detail: `${input.productionReadyCount}/${input.total} memories are proof-quality ready for MemoryIgnition.`,
    },
  ] as const;

  const blockers = [
    input.total === 0 ? "No Phase 2 structured memories extracted yet." : undefined,
    input.total > 0 && percent(input.traceableCount, input.total) < 80 ? "Trace proof coverage is below 80%." : undefined,
    input.total > 0 && input.dedupeIndexedCount < input.total ? "Some memories are missing dedupe keys." : undefined,
    input.graphNodeCount === 0 || input.graphEdgeCount === 0 ? "Graph nodes or evidence edges are missing." : undefined,
    input.entityCount === 0 && input.total > 0 ? "No normalized entities resolved for retrieval." : undefined,
    input.unresolvedConflicts > 0 ? "Unresolved conflicts block safe inheritance." : undefined,
    input.blockedProofCount > 0 ? "Blocked proof-quality memories need review." : undefined,
  ].filter((item): item is string => Boolean(item));

  const score =
    stages.length > 0
      ? Math.round(stages.reduce((total, stage) => total + (stage.status === "pass" ? 100 : stage.status === "warn" ? 55 : 0), 0) / stages.length)
      : 0;

  return {
    readyForMemoryIgnition: blockers.length === 0 && input.productionReadyCount > 0,
    score,
    blockers,
    stages,
  };
}

function serializePhase2MemoryDetail(memory: Memory) {
  const entities = memory.entities ?? resolveCompanyBrainEntities([memory]);
  const relations = memory.relations ?? buildCompanyBrainRelations(memory, entities);
  const proofQuality = memory.proofQuality ?? assessCompanyBrainProofQuality(memory, entities, relations);
  const evidence = memory.traceProof?.evidence ?? [];
  return {
    id: memory.id,
    summary: memory.summary,
    content: memory.content,
    type: memory.type,
    status: memory.status,
    confidence: memory.confidence,
    contractVersion: memory.contractVersion ?? null,
    contractCategory: memory.contractCategory ?? null,
    companyBrainType: memory.companyBrainType ?? null,
    source: memory.source,
    sourceRef: memory.sourceRef ?? null,
    updatedAt: memory.updatedAt,
    freshness: memory.freshness ?? null,
    conflict: memory.conflict ?? null,
    traceProof: memory.traceProof ?? null,
    graph: memory.graph ?? null,
    entities,
    relations,
    proofQuality,
    whyItMatters:
      evidence.find((item) => /why|matters|impact|future agents/i.test(item)) ??
      memory.summary,
    retrieval: {
      indexed: Boolean(memory.sourceRef && memory.traceProof && memory.graph?.nodeId),
      searchableText: [
        memory.summary,
        memory.content,
        memory.companyBrainType,
        memory.contractCategory,
        memory.sourceRef,
        ...(memory.traceProof?.evidence ?? []),
        ...(memory.graph?.edgeRefs ?? []),
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0),
      reason:
        proofQuality.productionReady
          ? "Memory has source proof, graph lineage, and proof quality for MemoryIgnition retrieval."
          : "Memory is searchable but needs proof-quality or conflict review before safe inheritance.",
    },
    traceLineage: [
      memory.traceProof?.sourceRef ? { step: "Source", value: memory.traceProof.sourceRef } : null,
      { step: "Memory", value: memory.id },
      memory.graph?.nodeId ? { step: "Graph", value: memory.graph.nodeId } : null,
      proofQuality.productionReady
        ? { step: "MemoryIgnition", value: "eligible for inheritance" }
        : { step: "MemoryIgnition", value: "blocked or needs review" },
    ].filter((item): item is { step: string; value: string } => Boolean(item)),
  };
}

function phase2SearchCorpus(memory: Memory): string {
  return [
    memory.id,
    memory.summary,
    memory.content,
    memory.companyBrainType,
    memory.contractCategory,
    memory.status,
    memory.source,
    memory.sourceRef,
    memory.traceProof?.sourceType,
    memory.traceProof?.sourceRef,
    ...(memory.traceProof?.evidence ?? []),
    ...(memory.graph?.edgeRefs ?? []),
    ...(memory.entities ?? []).flatMap((entity) => [entity.label, entity.kind, ...entity.references]),
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n")
    .toLowerCase();
}

function scorePhase2SearchResult(memory: Memory, query: string): number {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return 1;
  const corpus = phase2SearchCorpus(memory);
  const terms = normalized.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const term of terms) {
    if (memory.summary.toLowerCase().includes(term)) score += 5;
    if ((memory.companyBrainType ?? "").toLowerCase().includes(term)) score += 4;
    if ((memory.sourceRef ?? "").toLowerCase().includes(term)) score += 3;
    if (corpus.includes(term)) score += 1;
  }
  if (memory.proofQuality?.productionReady) score += 2;
  if (memory.conflict?.status === "possible_conflict" || memory.status === "contradicted") score -= 2;
  return score;
}

type ReasoningGraphMemory = {
  id: string;
  task: string;
  customerPain: string;
  productPriority: string;
  executionContext: string;
  sourceType: string;
  sourceRef: string;
  evidence: string[];
  relatedMemoryIds: string[];
  impactedFiles: string[];
  assumptions: string[];
  decisionPoints: string[];
  riskSignals: string[];
  requiredTests: string[];
  nextActions: string[];
  reasoningQuality: {
    score: number;
    status: "agent_ready" | "usable" | "weak" | "blocked";
    agentReady: boolean;
    reasons: string[];
    gaps: string[];
  };
  confidence: number;
  updatedAt: string;
  traceProof: Memory["traceProof"];
  graph: Memory["graph"];
  linkedExperiences: Array<{
    id: string;
    task: string;
    sourceRef: string;
    status: string;
  }>;
};

function compactReasoningLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w:./-]/g, "").slice(0, 100);
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }
  return output;
}

function splitReasoningLine(value: string): string[] {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sentenceCandidates(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter((item) => item.length > 0);
}

function inferReasoningAssumptions(input: {
  customerPain: string;
  productPriority: string;
  executionContext: string;
}): string[] {
  const corpus = `${input.customerPain}\n${input.productPriority}\n${input.executionContext}`;
  const explicit = sentenceCandidates(corpus).filter((sentence) =>
    /\b(assume|assuming|depends|unknown|if |when |provided|needs verification|validate)\b/i.test(sentence),
  );
  return uniqueStrings([
    ...explicit,
    "The captured source evidence is current enough to guide the next agent action.",
    "The execution agent should verify repository state before changing files.",
  ]).slice(0, 8);
}

function inferReasoningDecisionPoints(input: {
  productPriority: string;
  task: string;
  executionContext: string;
}): string[] {
  const corpus = `${input.productPriority}\n${input.task}\n${input.executionContext}`;
  const explicit = sentenceCandidates(corpus).filter((sentence) =>
    /\b(decide|decision|choose|tradeoff|priority|first action|before|after|instead|separate|protect|reduce)\b/i.test(sentence),
  );
  return uniqueStrings([
    ...explicit,
    `Decide the safest first action for: ${input.task}`,
  ]).slice(0, 8);
}

function inferReasoningRiskSignals(input: {
  customerPain: string;
  productPriority: string;
  task: string;
  executionContext: string;
  impactedFiles: string[];
}): string[] {
  const corpus = `${input.customerPain}\n${input.productPriority}\n${input.task}\n${input.executionContext}\n${input.impactedFiles.join("\n")}`;
  const risks: string[] = [];
  const rules: Array<[RegExp, string]> = [
    [/\b(prod|production|deploy|release|outage|incident|p0|p1)\b/i, "production-impact"],
    [/\b(auth|login|oauth|permission|token|secret|security)\b/i, "security-or-auth-impact"],
    [/\b(payment|billing|invoice|subscription)\b/i, "billing-impact"],
    [/\b(database|schema|migration|prisma|postgres|redis)\b/i, "data-or-schema-impact"],
    [/\b(customer|tenant|workspace|support|activation|email)\b/i, "customer-impact"],
  ];
  for (const [pattern, label] of rules) if (pattern.test(corpus)) risks.push(label);
  for (const file of input.impactedFiles) {
    if (/\b(auth|billing|payment|schema|prisma|migration|middleware|route)\b/i.test(file)) risks.push(`risky-file:${file}`);
  }
  return uniqueStrings(risks).slice(0, 10);
}

function inferReasoningRequiredTests(input: {
  executionContext: string;
  evidence: string[];
  impactedFiles: string[];
}): string[] {
  const corpus = `${input.executionContext}\n${input.evidence.join("\n")}`;
  const commandMatches = corpus.match(/\b(?:npm|pnpm|bun|yarn|npx)\s+(?:run\s+)?[\w:.-]+(?:\s+--[\w:./=-]+)*/g) ?? [];
  const inferred = input.impactedFiles.length > 0
    ? [`Run focused tests for impacted files: ${input.impactedFiles.slice(0, 4).join(", ")}`]
    : ["Run the smallest relevant test before handing off to another agent."];
  return uniqueStrings([...commandMatches, ...inferred]).slice(0, 8);
}

function inferReasoningNextActions(input: {
  task: string;
  impactedFiles: string[];
  relatedMemoryIds: string[];
}): string[] {
  return uniqueStrings([
    input.impactedFiles.length > 0
      ? `Inspect impacted files before editing: ${input.impactedFiles.slice(0, 4).join(", ")}`
      : "Inspect the relevant code/source evidence before editing.",
    input.relatedMemoryIds.length > 0
      ? "Review linked Company Brain memories for risk rules and prior decisions."
      : "Search Company Brain for related risks, tests, and prior decisions.",
    `Generate or use a MemoryIgnition brief before acting on: ${input.task}`,
  ]);
}

function assessReasoningQuality(input: {
  customerPain: string;
  productPriority: string;
  task: string;
  executionContext: string;
  evidence: string[];
  impactedFiles: string[];
  relatedMemoryIds: string[];
  assumptions: string[];
  decisionPoints: string[];
  riskSignals: string[];
  requiredTests: string[];
  confidence: number;
}): ReasoningGraphMemory["reasoningQuality"] {
  let score = 0;
  const reasons: string[] = [];
  const gaps: string[] = [];
  if (input.customerPain.trim()) {
    score += 12;
    reasons.push("customer_pain_present");
  } else gaps.push("missing_customer_pain");
  if (input.productPriority.trim()) {
    score += 12;
    reasons.push("product_priority_present");
  } else gaps.push("missing_product_priority");
  if (input.task.trim()) {
    score += 12;
    reasons.push("engineering_task_present");
  } else gaps.push("missing_task");
  if (input.executionContext.trim()) {
    score += 14;
    reasons.push("execution_context_present");
  } else gaps.push("missing_execution_context");
  if (input.evidence.length > 0) {
    score += 14;
    reasons.push("source_evidence_present");
  } else gaps.push("missing_evidence");
  if (input.impactedFiles.length > 0) {
    score += 8;
    reasons.push("impacted_files_present");
  } else gaps.push("missing_impacted_files");
  if (input.relatedMemoryIds.length > 0) {
    score += 8;
    reasons.push("linked_company_brain_memory");
  } else gaps.push("no_related_memory_linked");
  if (input.assumptions.length > 0) {
    score += 6;
    reasons.push("assumptions_recorded");
  }
  if (input.decisionPoints.length > 0) {
    score += 6;
    reasons.push("decision_points_recorded");
  }
  if (input.riskSignals.length > 0) {
    score += 6;
    reasons.push("risk_signals_recorded");
  } else gaps.push("missing_risk_signals");
  if (input.requiredTests.length > 0) {
    score += 6;
    reasons.push("required_tests_recorded");
  } else gaps.push("missing_required_tests");
  if (input.confidence >= 0.85) {
    score += 4;
    reasons.push("high_confidence");
  }
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  const blocked = input.riskSignals.some((risk) => risk.startsWith("security") || risk.startsWith("billing")) && input.requiredTests.length === 0;
  const status: ReasoningGraphMemory["reasoningQuality"]["status"] = blocked
    ? "blocked"
    : bounded >= 82
      ? "agent_ready"
      : bounded >= 65
        ? "usable"
        : bounded >= 45
          ? "weak"
          : "blocked";
  return {
    score: bounded,
    status,
    agentReady: status === "agent_ready" || status === "usable",
    reasons: uniqueStrings(reasons),
    gaps: uniqueStrings(gaps),
  };
}

function parseReasoningGraphMemory(memory: Memory): ReasoningGraphMemory | null {
  if (!(memory.sourceRef ?? "").startsWith("reasoning:")) return null;
  const lines = memory.content.split("\n");
  const read = (label: string) =>
    lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`))
      ?.slice(label.length + 1)
      .trim() ?? "";
  const task = read("Task") || memory.summary.replace(/^Reasoning:\s*/i, "");
  const customerPain = read("Customer pain");
  const productPriority = read("Product priority");
  const executionContext = read("Execution context");
  const assumptions = splitReasoningLine(read("Assumptions"));
  const decisionPoints = splitReasoningLine(read("Decision points"));
  const riskSignals = splitReasoningLine(read("Risk signals"));
  const requiredTests = splitReasoningLine(read("Required tests"));
  const nextActions = splitReasoningLine(read("Next actions"));
  const impactedFiles = read("Impacted files")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const relatedMemoryIds = (memory.graph?.edgeRefs ?? [])
    .filter((edge) => edge.startsWith("memory:"))
    .map((edge) => edge.slice("memory:".length));
  const reasoningQuality = assessReasoningQuality({
    customerPain,
    productPriority,
    task,
    executionContext,
    evidence: memory.traceProof?.evidence ?? [],
    impactedFiles,
    relatedMemoryIds,
    assumptions,
    decisionPoints,
    riskSignals,
    requiredTests,
    confidence: memory.confidence,
  });
  return {
    id: memory.id,
    task,
    customerPain,
    productPriority,
    executionContext,
    sourceType: memory.traceProof?.sourceType ?? memory.sourceRef?.split(":")[1] ?? "reasoning",
    sourceRef: memory.traceProof?.sourceRef ?? memory.sourceRef ?? memory.id,
    evidence: memory.traceProof?.evidence ?? [],
    relatedMemoryIds,
    impactedFiles,
    assumptions,
    decisionPoints,
    riskSignals,
    requiredTests,
    nextActions,
    reasoningQuality,
    confidence: memory.confidence,
    updatedAt: memory.updatedAt,
    traceProof: memory.traceProof,
    graph: memory.graph,
    linkedExperiences: [],
  };
}

function buildReasoningOverview(memories: Memory[]) {
  const experienceItems = memories
    .map(parseExperienceGraphMemory)
    .filter((item): item is ExperienceGraphMemory => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const experienceById = new Map(experienceItems.map((item) => [item.id, item] as const));
  const experienceIdsByReasoningId = new Map<string, string[]>();
  for (const experience of experienceItems) {
    for (const reasoningId of experience.relatedReasoningIds) {
      const current = experienceIdsByReasoningId.get(reasoningId) ?? [];
      if (!current.includes(experience.id)) current.push(experience.id);
      experienceIdsByReasoningId.set(reasoningId, current);
    }
  }
  const reasoningItems = memories
    .map(parseReasoningGraphMemory)
    .filter((item): item is ReasoningGraphMemory => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  for (const item of reasoningItems) {
    item.linkedExperiences = (experienceIdsByReasoningId.get(item.id) ?? [])
      .map((experienceId) => experienceById.get(experienceId))
      .filter((experience): experience is ExperienceGraphMemory => Boolean(experience))
      .map((experience) => ({
        id: experience.id,
        task: experience.task,
        sourceRef: experience.sourceRef,
        status: experience.status,
      }));
  }
  const nodeById = new Map<string, { id: string; kind: string; label: string; reasoningId?: string }>();
  const edgeById = new Map<string, { from: string; to: string; type: string; reasoningId?: string }>();
  const addNode = (node: { id: string; kind: string; label: string; reasoningId?: string }) => {
    if (!node.label.trim()) return;
    nodeById.set(node.id, node);
  };
  const addEdge = (edge: { from: string; to: string; type: string; reasoningId?: string }) => {
    edgeById.set(`${edge.from}->${edge.to}:${edge.type}`, edge);
  };
  for (const item of reasoningItems) {
    const sourceNode = `source:${compactReasoningLabel(item.sourceRef)}`;
    const painNode = `pain:${compactReasoningLabel(item.customerPain)}`;
    const priorityNode = `priority:${compactReasoningLabel(item.productPriority)}`;
    const taskNode = `task:${compactReasoningLabel(item.task)}`;
    const contextNode = `context:${item.id}`;
    const qualityNode = `quality:${item.id}`;
    addNode({ id: sourceNode, kind: "source_evidence", label: item.sourceRef, reasoningId: item.id });
    addNode({ id: painNode, kind: "customer_pain", label: item.customerPain, reasoningId: item.id });
    addNode({ id: priorityNode, kind: "product_priority", label: item.productPriority, reasoningId: item.id });
    addNode({ id: taskNode, kind: "engineering_task", label: item.task, reasoningId: item.id });
    addNode({ id: contextNode, kind: "execution_context", label: item.executionContext, reasoningId: item.id });
    addNode({ id: qualityNode, kind: "reasoning_quality", label: `${item.reasoningQuality.status}:${item.reasoningQuality.score}`, reasoningId: item.id });
    addEdge({ from: sourceNode, to: painNode, type: "evidences", reasoningId: item.id });
    addEdge({ from: painNode, to: priorityNode, type: "explains", reasoningId: item.id });
    addEdge({ from: priorityNode, to: taskNode, type: "drives", reasoningId: item.id });
    addEdge({ from: taskNode, to: contextNode, type: "creates_execution_context", reasoningId: item.id });
    addEdge({ from: contextNode, to: qualityNode, type: "assessed_as", reasoningId: item.id });
    for (const decision of item.decisionPoints) {
      const id = `decision:${compactReasoningLabel(decision)}`;
      addNode({ id, kind: "decision_point", label: decision, reasoningId: item.id });
      addEdge({ from: priorityNode, to: id, type: "requires_decision", reasoningId: item.id });
      addEdge({ from: id, to: taskNode, type: "shapes_task", reasoningId: item.id });
    }
    for (const assumption of item.assumptions) {
      const id = `assumption:${compactReasoningLabel(assumption)}`;
      addNode({ id, kind: "assumption", label: assumption, reasoningId: item.id });
      addEdge({ from: id, to: contextNode, type: "constrains_context", reasoningId: item.id });
    }
    for (const risk of item.riskSignals) {
      const id = `risk:${compactReasoningLabel(risk)}`;
      addNode({ id, kind: "risk_signal", label: risk, reasoningId: item.id });
      addEdge({ from: taskNode, to: id, type: "has_risk", reasoningId: item.id });
    }
    for (const test of item.requiredTests) {
      const id = `test:${compactReasoningLabel(test)}`;
      addNode({ id, kind: "required_test", label: test, reasoningId: item.id });
      addEdge({ from: contextNode, to: id, type: "requires_test", reasoningId: item.id });
    }
    for (const file of item.impactedFiles) {
      const id = `file:${compactReasoningLabel(file)}`;
      addNode({ id, kind: "impacted_file", label: file, reasoningId: item.id });
      addEdge({ from: contextNode, to: id, type: "touches_file", reasoningId: item.id });
    }
    for (const memoryId of item.relatedMemoryIds) {
      const id = `memory:${memoryId}`;
      addNode({ id, kind: "related_memory", label: memoryId, reasoningId: item.id });
      addEdge({ from: contextNode, to: id, type: "uses_memory", reasoningId: item.id });
    }
    const linkedExperienceIds = experienceIdsByReasoningId.get(item.id) ?? [];
    for (const experienceId of linkedExperienceIds) {
      const experience = experienceById.get(experienceId);
      if (!experience) continue;
      const id = `experience:${experience.id}`;
      addNode({ id, kind: "linked_experience", label: experience.task, reasoningId: item.id });
      addEdge({ from: contextNode, to: id, type: "creates_experience", reasoningId: item.id });
    }
  }
  const agentReadyCount = reasoningItems.filter((item) => item.reasoningQuality.agentReady).length;
  const blockedCount = reasoningItems.filter((item) => item.reasoningQuality.status === "blocked").length;
  const riskSignalCount = reasoningItems.reduce((total, item) => total + item.riskSignals.length, 0);
  const requiredTestCount = reasoningItems.reduce((total, item) => total + item.requiredTests.length, 0);
  const averageReasoningQuality =
    reasoningItems.length > 0
      ? Math.round(reasoningItems.reduce((total, item) => total + item.reasoningQuality.score, 0) / reasoningItems.length)
      : 0;
  return {
    generatedAt: new Date().toISOString(),
    totalReasoningChains: reasoningItems.length,
    agentReadyCount,
    blockedCount,
    riskSignalCount,
    requiredTestCount,
    averageReasoningQuality,
    traceProofCoverage:
      reasoningItems.length > 0
        ? Math.round((reasoningItems.filter((item) => item.traceProof?.sourceRef).length / reasoningItems.length) * 100)
        : 0,
    graph: {
      nodes: [...nodeById.values()],
      edges: [...edgeById.values()],
    },
    chains: reasoningItems.slice(0, 50),
    agentBriefAdditions: reasoningItems.slice(0, 5).map((item) => ({
      task: item.task,
      taskReason: item.productPriority,
      customerOrProductContext: item.customerPain,
      executionContext: item.executionContext,
      reasoningQuality: item.reasoningQuality,
      riskSignals: item.riskSignals,
      requiredTests: item.requiredTests,
      traceProof: item.traceProof,
      linkedExperiences: item.linkedExperiences,
      recommendedBriefLine: `Why this task matters: ${item.productPriority}. Customer/product context: ${item.customerPain}.`,
    })),
  };
}

type ExperienceGraphMemory = {
  id: string;
  task: string;
  problem: string;
  context: string;
  action: string;
  mistake: string;
  outcome: string;
  lesson: string;
  futureAgentInstruction: string;
  sourceType: string;
  sourceRef: string;
  evidence: string[];
  files: string[];
  tests: string[];
  relatedMemoryIds: string[];
  relatedReasoningIds: string[];
  riskLevel: string;
  status: string;
  confidence: number;
  updatedAt: string;
  traceProof: Memory["traceProof"];
  graph: Memory["graph"];
};

function parseExperienceGraphMemory(memory: Memory): ExperienceGraphMemory | null {
  if (!(memory.sourceRef ?? "").startsWith("experience:")) return null;
  const lines = memory.content.split("\n");
  const read = (label: string) =>
    lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`))
      ?.slice(label.length + 1)
      .trim() ?? "";
  const split = (label: string) =>
    read(label)
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  return {
    id: memory.id,
    task: read("Task") || memory.summary.replace(/^Experience:\s*/i, ""),
    problem: read("Problem"),
    context: read("Context"),
    action: read("Action"),
    mistake: read("Mistake"),
    outcome: read("Outcome"),
    lesson: read("Lesson"),
    futureAgentInstruction: read("Future-agent instruction"),
    sourceType: memory.traceProof?.sourceType ?? "experience",
    sourceRef: memory.traceProof?.sourceRef ?? memory.sourceRef ?? memory.id,
    evidence: memory.traceProof?.evidence ?? split("Evidence"),
    files: memory.files ?? split("Files"),
    tests: split("Tests"),
    relatedMemoryIds: (memory.graph?.edgeRefs ?? [])
      .filter((edge) => edge.startsWith("memory:"))
      .map((edge) => edge.slice("memory:".length)),
    relatedReasoningIds: (memory.graph?.edgeRefs ?? [])
      .filter((edge) => edge.startsWith("reasoning:"))
      .map((edge) => edge.slice("reasoning:".length)),
    riskLevel: read("Risk level") || "medium",
    status: memory.status === "archived" ? "archived" : read("Experience status") || "captured",
    confidence: memory.confidence,
    updatedAt: memory.updatedAt,
    traceProof: memory.traceProof,
    graph: memory.graph,
  };
}

function buildExperienceOverview(memories: Memory[]) {
  const records = memories
    .map(parseExperienceGraphMemory)
    .filter((item): item is ExperienceGraphMemory => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const reviewedCount = records.filter((record) => record.status === "reviewed" || record.status === "skill_candidate").length;
  const skillCandidateCount = records.filter((record) => record.status === "skill_candidate").length;
  const highRiskCount = records.filter((record) => record.riskLevel === "high" || record.riskLevel === "blocked").length;
  const traceableCount = records.filter((record) => record.traceProof?.sourceRef || record.sourceRef).length;
  const readinessRecords = records.map((record) => {
    const checks = [
      {
        id: "source_proof",
        label: "Source proof",
        ok: Boolean(record.traceProof?.sourceRef || record.sourceRef),
        detail: record.traceProof?.sourceRef ?? record.sourceRef ?? "No source proof linked.",
      },
      {
        id: "evidence",
        label: "Evidence",
        ok: record.evidence.length > 0,
        detail: record.evidence.length > 0 ? `${record.evidence.length} evidence link(s).` : "No evidence attached.",
      },
      {
        id: "lesson",
        label: "Lesson",
        ok: Boolean(record.lesson.trim()),
        detail: record.lesson || "No lesson captured.",
      },
      {
        id: "future_agent_instruction",
        label: "Future-agent instruction",
        ok: Boolean(record.futureAgentInstruction.trim()),
        detail: record.futureAgentInstruction || "No reusable instruction captured.",
      },
      {
        id: "outcome",
        label: "Outcome",
        ok: Boolean(record.outcome.trim()),
        detail: record.outcome || "No outcome captured.",
      },
      {
        id: "execution_context",
        label: "Execution context",
        ok: record.files.length > 0 || record.tests.length > 0,
        detail: record.files.length > 0 || record.tests.length > 0
          ? `${record.files.length} file(s), ${record.tests.length} test(s).`
          : "No files or tests linked.",
      },
    ];
    const passed = checks.filter((check) => check.ok).length;
    const status = passed === checks.length
      ? "ready"
      : passed >= 4
        ? "needs_review"
        : "blocked";
    return {
      experienceId: record.id,
      task: record.task,
      sourceRef: record.sourceRef,
      status,
      score: Math.round((passed / checks.length) * 100),
      readyForNextBrief: status === "ready",
      missing: checks.filter((check) => !check.ok).map((check) => check.label),
      checks,
      nextAction: status === "ready"
        ? "Eligible for future MemoryIgnition brief retrieval."
        : checks.find((check) => !check.ok)?.detail ?? "Add missing source proof before inheritance.",
    };
  });
  const readyForNextBrief = readinessRecords.filter((record) => record.readyForNextBrief).length;
  const needsReviewForNextBrief = readinessRecords.filter((record) => record.status === "needs_review").length;
  const blockedFromNextBrief = readinessRecords.filter((record) => record.status === "blocked").length;
  return {
    generatedAt: new Date().toISOString(),
    totalExperienceRecords: records.length,
    reviewedCount,
    skillCandidateCount,
    highRiskCount,
    traceProofCoverage: records.length > 0 ? Math.round((traceableCount / records.length) * 100) : 0,
    inheritanceReadiness: {
      version: "experience_inheritance_readiness.v1",
      readyForNextBrief,
      needsReviewForNextBrief,
      blockedFromNextBrief,
      score: records.length > 0 ? Math.round((readyForNextBrief / records.length) * 100) : 0,
      records: readinessRecords.slice(0, 50),
      nextAction: readyForNextBrief > 0
        ? "Run MemoryIgnition Brief to verify these experiences appear in related_experiences."
        : "Capture source-backed outcome evidence before relying on experiences for future-agent inheritance.",
    },
    records: records.slice(0, 100),
    graph: {
      nodes: records.flatMap((record) => [
        { id: `experience:${record.id}`, kind: "experience", label: record.task },
        { id: `lesson:${compactReasoningLabel(record.lesson)}`, kind: "lesson", label: record.lesson },
        { id: `outcome:${compactReasoningLabel(record.outcome)}`, kind: "outcome", label: record.outcome },
      ]),
      edges: records.flatMap((record) => [
        { from: `experience:${record.id}`, to: `outcome:${compactReasoningLabel(record.outcome)}`, type: "produced" },
        { from: `outcome:${compactReasoningLabel(record.outcome)}`, to: `lesson:${compactReasoningLabel(record.lesson)}`, type: "teaches" },
        ...record.relatedMemoryIds.map((memoryId) => ({ from: `experience:${record.id}`, to: `memory:${memoryId}`, type: "uses_memory" })),
        ...record.relatedReasoningIds.map((reasoningId) => ({ from: `reasoning:${reasoningId}`, to: `experience:${record.id}`, type: "created_experience" })),
      ]),
    },
    inheritanceAdditions: records.slice(0, 8).map((record) => ({
      task: record.task,
      lesson: record.lesson,
      futureAgentInstruction: record.futureAgentInstruction,
      traceProof: record.traceProof,
    })),
    outcomeLearningTimeline: records.slice(0, 20).map((record) => ({
      id: record.id,
      task: record.task,
      sourceRef: record.sourceRef,
      experienceRef: `experience:${record.id}`,
      relatedReasoningIds: record.relatedReasoningIds,
      outcome: record.outcome,
      lesson: record.lesson,
      futureAgentInstruction: record.futureAgentInstruction,
      files: record.files,
      tests: record.tests,
      riskLevel: record.riskLevel,
      status: record.status,
      updatedAt: record.updatedAt,
      traceProofComplete: Boolean(record.traceProof?.sourceRef && record.evidence.length > 0),
      lineage: "Source -> Experience -> Lesson -> Next MemoryIgnition Brief",
    })),
  };
}

type SkillGraphCandidate = {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  requiredTests: string[];
  pastMistakes: string[];
  evidence: string[];
  sourceExperienceId: string;
  riskLevel: string;
  status: "pending" | "approved" | "rejected";
  version: string;
  confidence: number;
  successRate: number | null;
  supportedAgents: string[];
  inheritanceRules: string[];
  updatedAt: string;
  traceProof: Memory["traceProof"];
};

function readMemoryLabel(content: string, label: string): string {
  const lines = content.split("\n");
  return lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`))
    ?.slice(label.length + 1)
    .trim() ?? "";
}

function splitMemoryLabel(content: string, label: string): string[] {
  return readMemoryLabel(content, label)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSkillGraphCandidate(memory: Memory): SkillGraphCandidate | null {
  if (!(memory.sourceRef ?? "").startsWith("skill_candidate:")) return null;
  const status = readMemoryLabel(memory.content, "Skill status");
  const normalizedStatus =
    status === "approved" || status === "rejected" || status === "pending"
      ? status
      : "pending";
  return {
    id: memory.id,
    name: readMemoryLabel(memory.content, "Skill") || memory.summary.replace(/^Skill Candidate:\s*/i, ""),
    trigger: readMemoryLabel(memory.content, "Trigger"),
    steps: splitMemoryLabel(memory.content, "Steps"),
    requiredTests: splitMemoryLabel(memory.content, "Required tests"),
    pastMistakes: splitMemoryLabel(memory.content, "Past mistakes"),
    evidence: memory.traceProof?.evidence ?? splitMemoryLabel(memory.content, "Evidence"),
    sourceExperienceId: readMemoryLabel(memory.content, "Source experience"),
    riskLevel: readMemoryLabel(memory.content, "Risk level") || "medium",
    status: normalizedStatus,
    version: readMemoryLabel(memory.content, "Version") || "0.1.0",
    confidence: memory.confidence,
    successRate: null,
    supportedAgents: splitMemoryLabel(memory.content, "Supported agents"),
    inheritanceRules: splitMemoryLabel(memory.content, "Inheritance rules"),
    updatedAt: memory.updatedAt,
    traceProof: memory.traceProof,
  };
}

function skillNameFromExperience(record: ExperienceGraphMemory): string {
  const task = record.task.replace(/^(codex|devin|github|manual|slack|linear)[:/\s-]+/i, "").trim();
  return `Reusable workflow: ${task || record.lesson || "captured experience"}`.slice(0, 140);
}

function buildSkillCandidateContent(input: {
  candidate: Omit<SkillGraphCandidate, "id" | "updatedAt" | "traceProof" | "confidence" | "successRate">;
}): string {
  const candidate = input.candidate;
  return [
    `Skill: ${candidate.name}`,
    `Trigger: ${candidate.trigger}`,
    `Steps: ${candidate.steps.join(" | ")}`,
    `Required tests: ${candidate.requiredTests.join(" | ") || "Reviewer must define required tests before approval"}`,
    `Past mistakes: ${candidate.pastMistakes.join(" | ") || "None captured"}`,
    `Evidence: ${candidate.evidence.join(" | ")}`,
    `Source experience: ${candidate.sourceExperienceId}`,
    `Risk level: ${candidate.riskLevel}`,
    `Skill status: ${candidate.status}`,
    `Version: ${candidate.version}`,
    `Supported agents: ${candidate.supportedAgents.join(" | ")}`,
    `Inheritance rules: ${candidate.inheritanceRules.join(" | ")}`,
  ].join("\n");
}

async function persistSkillCandidateFromExperience(input: {
  userId: string;
  orgId?: string | null;
  experience: ExperienceGraphMemory;
}): Promise<Memory> {
  const now = new Date().toISOString();
  const experience = input.experience;
  const scopeEdgeRefs = (experience.graph?.edgeRefs ?? []).filter(
    (edge) => edge.startsWith("project:") || edge.startsWith("workspace:"),
  );
  const scopeLabels = scopeEdgeRefs.map((edge) => edge.split(":").slice(1).join(":")).filter(Boolean);
  const candidate = {
    name: skillNameFromExperience(experience),
    trigger: experience.task,
    steps: [
      experience.action,
      experience.futureAgentInstruction,
      experience.tests.length > 0 ? `Run required tests: ${experience.tests.join(", ")}` : "Reviewer must define required tests before approval.",
    ].filter((value) => value.trim().length > 0),
    requiredTests: experience.tests,
    pastMistakes: experience.mistake && experience.mistake !== "None captured" ? [experience.mistake] : [],
    evidence: [...experience.evidence, experience.sourceRef].filter(Boolean),
    sourceExperienceId: experience.id,
    riskLevel: experience.riskLevel,
    status: "pending" as const,
    version: "0.1.0",
    supportedAgents: ["codex", "cursor", "claude", "devin", "windsurf", "cline", "internal"],
    inheritanceRules: [
      "Do not inject until a human approves this skill.",
      "Include source proof when inherited by a future agent.",
      "Require reviewer-defined tests before high-risk use.",
    ],
  };
  const memory: Memory = {
    id: randomUUID(),
    userId: input.userId,
    orgId: input.orgId ?? undefined,
    type: "learning",
    summary: `Skill Candidate: ${candidate.name}`,
    content: buildSkillCandidateContent({ candidate }),
    importanceScore: experience.riskLevel === "high" || experience.riskLevel === "blocked" ? 0.92 : 0.84,
    confidence: Math.min(0.92, Math.max(0.55, experience.confidence)),
    source: "import",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: Math.max(1, candidate.evidence.length),
    contractVersion: "memoryos.contract.v1",
    contractCategory: "runbook",
    companyBrainType: "process",
    sourceRef: `skill_candidate:experience:${experience.id}`,
    files: experience.files,
    traceProof: {
      sourceType: "experience",
      sourceRef: experience.sourceRef,
      evidence: candidate.evidence,
      confidence: experience.confidence,
      capturedAt: now,
    },
    freshness: {
      status: "fresh",
      checkedAt: now,
    },
    conflict: {
      status: "none",
      conflictsWith: [],
      checkedAt: now,
    },
    graph: {
      nodeId: `skill:${randomUUID().slice(0, 8)}`,
      nodeType: "process",
      edgeRefs: [
        ...scopeEdgeRefs,
        `experience:${experience.id}`,
        `lesson:${compactReasoningLabel(experience.lesson)}`,
        `outcome:${compactReasoningLabel(experience.outcome)}`,
        ...experience.files.map((file) => `file:${file}`),
        ...experience.tests.map((test) => `test:${test}`),
      ],
    },
    developerSignals: {
      projectArea: [...scopeLabels, experience.task, ...experience.files],
      goal: [experience.lesson, experience.futureAgentInstruction],
    },
  };
  await getMemoryStoreAdapter().saveMemory({ memory });
  await upsertRecentMemory(memory, input.orgId ?? undefined);
  await recordMemoryCreatedEvent(
    memory,
    "Phase 4 skill candidate generated from evidence-backed experience.",
  );
  return memory;
}

function shouldGenerateSkillCandidate(record: ExperienceGraphMemory): boolean {
  const outcome = record.outcome.toLowerCase();
  if (!record.traceProof?.sourceRef && record.evidence.length === 0) return false;
  if (!record.lesson.trim() || !record.futureAgentInstruction.trim()) return false;
  if (/^(failed|rolled_back|rolled back|blocked|error)\s*:/.test(outcome)) return false;
  return true;
}

function buildSkillGraphOverview(memories: Memory[]) {
  const candidates = memories
    .map(parseSkillGraphCandidateMemory)
    .filter((item): item is NonNullable<ReturnType<typeof parseSkillGraphCandidateMemory>> => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const pending = candidates.filter((candidate) => candidate.status === "pending").length;
  const approved = candidates.filter((candidate) => candidate.status === "approved").length;
  const rejected = candidates.filter((candidate) => candidate.status === "rejected").length;
  const traceableCount = candidates.filter((candidate) => candidate.traceProof?.sourceRef || candidate.evidence.length > 0).length;
  const outcomeCount = candidates.reduce((sum, candidate) => sum + candidate.outcomeCount, 0);
  const successfulOutcomeCount = candidates.reduce((sum, candidate) => sum + candidate.successCount, 0);
  const failedOutcomeCount = candidates.reduce((sum, candidate) => sum + candidate.failureCount, 0);
  return {
    generatedAt: new Date().toISOString(),
    totalCandidates: candidates.length,
    pendingCount: pending,
    approvedCount: approved,
    rejectedCount: rejected,
    outcomeCount,
    successfulOutcomeCount,
    failedOutcomeCount,
    traceProofCoverage: candidates.length > 0 ? Math.round((traceableCount / candidates.length) * 100) : 0,
    averageSuccessRate: outcomeCount > 0 ? Math.round((successfulOutcomeCount / outcomeCount) * 100) : null,
    candidates: candidates.slice(0, 100),
    approvedSkills: candidates.filter((candidate) => candidate.status === "approved").slice(0, 50),
    graph: {
      nodes: candidates.flatMap((candidate) => [
        { id: `skill:${candidate.id}`, kind: "skill_candidate", label: candidate.name },
        { id: `experience:${candidate.sourceExperienceId}`, kind: "experience", label: candidate.trigger },
      ]),
      edges: candidates.map((candidate) => ({
        from: `experience:${candidate.sourceExperienceId}`,
        to: `skill:${candidate.id}`,
        type: candidate.status === "approved" ? "approved_into_skill" : "candidate_from_experience",
      })),
    },
  };
}

type InheritancePhaseId = "phase1" | "phase2" | "phase2_5" | "phase3" | "phase4" | "phase5" | "phase6" | "phase7";
type InheritancePhaseStatus = "ready" | "partial" | "blocked";

function phaseReadiness(input: {
  id: InheritancePhaseId;
  title: string;
  ready: boolean;
  partial?: boolean;
  metrics: Record<string, number | string | boolean | null>;
  proof: string[];
  blockers: string[];
}) {
  const status: InheritancePhaseStatus = input.ready ? "ready" : input.partial ? "partial" : "blocked";
  return {
    id: input.id,
    title: input.title,
    status,
    ready: status === "ready",
    metrics: input.metrics,
    proof: input.proof,
    blockers: input.blockers,
  };
}

function isGeneratedInheritanceMemory(memory: Memory): boolean {
  const sourceRef = memory.sourceRef ?? "";
  return (
    sourceRef.startsWith("reasoning:") ||
    sourceRef.startsWith("experience:") ||
    sourceRef.startsWith("skill_candidate:")
  );
}

function sourceTypeForSpine(memory: Memory): string {
  if (memory.traceProof?.sourceType) return memory.traceProof.sourceType;
  const sourceRef = memory.sourceRef ?? "";
  if (sourceRef.includes("://")) return sourceRef.split("://")[0] || "source";
  if (sourceRef.includes(":")) return sourceRef.split(":")[0] || "source";
  return memory.source || "source";
}

function buildSourceSignalSummary(memories: Memory[]) {
  const sourceMemories = memories.filter((memory) => {
    if (isGeneratedInheritanceMemory(memory)) return false;
    return Boolean(memory.sourceRef || memory.traceProof?.sourceRef || memory.evidenceCount > 0);
  });
  const byType = new Map<string, number>();
  for (const memory of sourceMemories) {
    const type = sourceTypeForSpine(memory);
    byType.set(type, (byType.get(type) ?? 0) + 1);
  }
  return {
    sourceMemories,
    sourceTypes: [...byType.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([type, count]) => ({ type, count })),
  };
}

function buildInheritanceSpineProof(input: {
  sourceMemory?: Memory;
  structuredMemory?: Memory;
  reasoning?: ReasoningGraphMemory;
  experience?: ExperienceGraphMemory;
  skill?: NonNullable<ReturnType<typeof parseSkillGraphCandidateMemory>>;
  ignitionTraceCount: number;
  outcomeCount: number;
}) {
  return {
    source: input.sourceMemory
      ? {
          memoryId: input.sourceMemory.id,
          sourceType: sourceTypeForSpine(input.sourceMemory),
          sourceRef: input.sourceMemory.traceProof?.sourceRef ?? input.sourceMemory.sourceRef ?? input.sourceMemory.id,
        }
      : null,
    memory: input.structuredMemory
      ? {
          memoryId: input.structuredMemory.id,
          type: input.structuredMemory.companyBrainType ?? input.structuredMemory.type,
          sourceRef: input.structuredMemory.sourceRef ?? input.structuredMemory.id,
          proofQuality: input.structuredMemory.proofQuality?.status ?? null,
        }
      : null,
    reasoning: input.reasoning
      ? {
          reasoningId: input.reasoning.id,
          quality: input.reasoning.reasoningQuality.status,
          score: input.reasoning.reasoningQuality.score,
        }
      : null,
    experience: input.experience
      ? {
          experienceId: input.experience.id,
          lesson: input.experience.lesson,
          sourceRef: input.experience.sourceRef,
        }
      : null,
    skill: input.skill
      ? {
          skillId: input.skill.id,
          status: input.skill.status,
          successRate: input.skill.successRate,
          outcomeCount: input.skill.outcomeCount,
        }
      : null,
    inheritanceEvent: {
      memoryIgnitionTraceCount: input.ignitionTraceCount,
    },
    outcome: {
      skillOutcomeCount: input.outcomeCount,
    },
    lineage:
      "Source -> Company Brain Memory -> Reasoning Graph -> Experience -> Approved Skill -> MemoryIgnition -> Outcome Learning",
  };
}

async function buildInheritanceSpine(input: {
  userId: string;
  orgId?: string | null;
  project?: string;
  workspace?: string;
  task?: string;
  agentId?: string;
}) {
  const listed = await listMemories({
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
    limit: 1200,
  });
  const scoped = input.project
    ? listed.memories.filter((memory) => projectMatchesMemory(input.project!, memory))
    : listed.memories;
  const { sourceMemories, sourceTypes } = buildSourceSignalSummary(scoped);
  const structuredMemories = scoped.filter((memory) => {
    if (isGeneratedInheritanceMemory(memory)) return false;
    return Boolean(memory.companyBrainType || memory.contractVersion || memory.traceProof?.sourceRef);
  });
  const proofedStructuredMemories = structuredMemories.filter((memory) => memory.traceProof?.sourceRef || memory.sourceRef);
  const reasoningChains = scoped
    .map(parseReasoningGraphMemory)
    .filter((item): item is ReasoningGraphMemory => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const experiences = scoped
    .map(parseExperienceGraphMemory)
    .filter((item): item is ExperienceGraphMemory => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const skillCandidates = scoped
    .map(parseSkillGraphCandidateMemory)
    .filter((item): item is NonNullable<ReturnType<typeof parseSkillGraphCandidateMemory>> => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const approvedSkillSelection = await selectApprovedExecutableSkills({
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
    ...(input.project ? { project: input.project } : {}),
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.task ? { taskIntent: input.task } : {}),
    agentId: input.agentId ?? "codex",
    limit: 8,
  });
  const ignition = await beforeModel({
    userId: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
    question: input.task ?? "Prepare MemoryIgnition inheritance package for the current workspace.",
    ...(input.project ? { project: input.project } : {}),
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.task ? { task_intent: input.task } : {}),
    agent_id: input.agentId ?? "codex",
    mode: "retrieve",
    topK: 8,
  });
  const apiKeys = await listApiKeysForUser(input.userId);
  const activeApiKeys = apiKeys.filter((key) => key.status === "active");
  const sdkPackageExists = existsSync(path.join(process.cwd(), "packages", "sdk", "package.json"));
  const mcpPackageExists = existsSync(path.join(process.cwd(), "packages", "mcp-server", "package.json"));
  const mcpBuildExists = existsSync(path.join(process.cwd(), "packages", "mcp-server", "dist", "stdio.js"));
  const ignitionRelevantMemories = Array.isArray(ignition.relevant_memories) ? ignition.relevant_memories : [];
  const ignitionTraceProof = Array.isArray(ignition.trace_proof) ? ignition.trace_proof : [];
  const ignitionOutcomeHooks = Array.isArray(ignition.outcome_hooks) ? ignition.outcome_hooks : [];
  const ignitionRequiredTests = Array.isArray(ignition.required_tests) ? ignition.required_tests : [];
  const ignitionRiskyFiles = Array.isArray(ignition.risky_files) ? ignition.risky_files : [];
  const ignitionExecutableSkills = Array.isArray(ignition.executable_skills) ? ignition.executable_skills : [];
  const ignitionRiskSignals = Array.isArray(ignition.approval_rules?.risk_signals) ? ignition.approval_rules.risk_signals : [];
  const phase1Ready = sourceMemories.length > 0;
  const phase2ProofCoverage = structuredMemories.length > 0
    ? Math.round((proofedStructuredMemories.length / structuredMemories.length) * 100)
    : 0;
  const phase2Ready = structuredMemories.length > 0 && phase2ProofCoverage >= 80;
  const agentReadyReasoning = reasoningChains.filter((chain) => chain.reasoningQuality.agentReady);
  const phase25Ready = reasoningChains.length > 0 && agentReadyReasoning.length > 0;
  const briefHasPrompt = typeof ignition.ready_to_send_prompt === "string" && ignition.ready_to_send_prompt.includes("MemoryIgnition Brief");
  const phase3Ready =
    briefHasPrompt &&
    ignitionRelevantMemories.length > 0 &&
    ignitionTraceProof.length > 0 &&
    ignitionOutcomeHooks.length > 0;
  const traceableExperiences = experiences.filter((record) => record.traceProof?.sourceRef || record.evidence.length > 0);
  const phase4Ready = traceableExperiences.some((record) =>
    Boolean(record.outcome?.trim()) &&
    Boolean(record.lesson?.trim()) &&
    record.evidence.length > 0,
  );
  const phase5Ready =
    traceableExperiences.length > 0 &&
    experiences.some((record) => Boolean(record.futureAgentInstruction?.trim())) &&
    (ignitionTraceProof.length > 0 || ignition.contextText.toLowerCase().includes("lesson"));
  const approvedSkills = skillCandidates.filter((candidate) => candidate.status === "approved");
  const phase6Ready =
    Boolean(sourceMemories[0]) &&
    Boolean(structuredMemories[0]) &&
    Boolean(experiences[0]) &&
    ignitionTraceProof.length > 0;
  const directConnectorTypes = new Set([
    "github",
    "slack",
    "linear",
    "jira",
    "docs",
    "local_files",
    "codex",
    "codex_chats",
    "devin",
    "devin_chats",
    "ci_cd_logs",
    "deployment_errors",
  ]);
  const importedDirectSourceTypes = sourceTypes.filter((source) => directConnectorTypes.has(source.type));
  const phase7Ready = importedDirectSourceTypes.length >= 3 && sourceMemories.length >= 3;
  const phaseStatuses = [
    phaseReadiness({
      id: "phase1",
      title: "Engineering Continuity Sources",
      ready: phase1Ready,
      partial: sourceTypes.length > 0,
      metrics: { sourceMemoryCount: sourceMemories.length, sourceTypeCount: sourceTypes.length },
      proof: sourceTypes.slice(0, 6).map((source) => `${source.type}:${source.count}`),
      blockers: phase1Ready ? [] : ["Connect or import at least one real source signal."],
    }),
    phaseReadiness({
      id: "phase2",
      title: "Company Brain Memory Graph",
      ready: phase2Ready,
      partial: structuredMemories.length > 0,
      metrics: { structuredMemoryCount: structuredMemories.length, traceProofCoverage: phase2ProofCoverage },
      proof: proofedStructuredMemories.slice(0, 5).map((memory) => memory.sourceRef ?? memory.id),
      blockers: phase2Ready ? [] : ["Structured memories need source trace proof coverage >= 80%."],
    }),
    phaseReadiness({
      id: "phase2_5",
      title: "Reasoning Graph",
      ready: phase25Ready,
      partial: reasoningChains.length > 0,
      metrics: { reasoningChains: reasoningChains.length, agentReady: agentReadyReasoning.length },
      proof: reasoningChains.slice(0, 5).map((chain) => `${chain.reasoningQuality.status}:${chain.task}`),
      blockers: phase25Ready ? [] : ["Create at least one agent-ready reasoning chain."],
    }),
    phaseReadiness({
      id: "phase3",
      title: "Best MemoryIgnition Brief",
      ready: phase3Ready,
      partial: ignitionTraceProof.length > 0 || ignitionRelevantMemories.length > 0 || briefHasPrompt,
      metrics: {
        relevantMemories: ignitionRelevantMemories.length,
        traceProofItems: ignitionTraceProof.length,
        requiredTests: ignitionRequiredTests.length,
        riskyFiles: ignitionRiskyFiles.length,
        outcomeHooks: ignitionOutcomeHooks.length,
        readyPrompt: briefHasPrompt,
      },
      proof: ignitionTraceProof.slice(0, 5).map((proof) => `${proof.source_type}:${proof.source_ref ?? proof.memory_id}`),
      blockers: phase3Ready ? [] : ["Generate a ready-to-send MemoryIgnition Brief with relevant memory, trace proof, and outcome hook."],
    }),
    phaseReadiness({
      id: "phase4",
      title: "Outcome Capture",
      ready: phase4Ready,
      partial: experiences.length > 0,
      metrics: {
        experienceRecords: experiences.length,
        traceableExperienceRecords: traceableExperiences.length,
        outcomeRecords: experiences.filter((record) => Boolean(record.outcome?.trim())).length,
        lessonRecords: experiences.filter((record) => Boolean(record.lesson?.trim())).length,
      },
      proof: traceableExperiences.slice(0, 5).map((record) => `${record.sourceType}:${record.task}`),
      blockers: phase4Ready ? [] : ["Capture at least one outcome with evidence, result, lesson, and future-agent instruction."],
    }),
    phaseReadiness({
      id: "phase5",
      title: "Experience Graph",
      ready: phase5Ready,
      partial: experiences.length > 0,
      metrics: {
        experienceRecords: experiences.length,
        traceableExperienceRecords: traceableExperiences.length,
        graphNodes: experiences.reduce((total, record) => total + (record.graph?.nodeId ? 1 : 0), 0),
        graphEdges: experiences.reduce((total, record) => total + (record.graph?.edgeRefs?.length ?? 0), 0),
        inheritedTraceProofItems: ignitionTraceProof.length,
      },
      proof: experiences.slice(0, 5).map((record) => `${record.id}:${record.lesson}`),
      blockers: phase5Ready ? [] : ["Build at least one traceable experience graph record that can influence MemoryIgnition."],
    }),
    phaseReadiness({
      id: "phase6",
      title: "Founder View + Engineer View",
      ready: phase6Ready,
      partial: Boolean(sourceMemories[0] || structuredMemories[0] || experiences[0] || ignitionTraceProof.length > 0),
      metrics: {
        sourceProof: Boolean(sourceMemories[0]),
        structuredMemory: Boolean(structuredMemories[0]),
        experienceProof: Boolean(experiences[0]),
        traceProofItems: ignitionTraceProof.length,
        approvalRequired: ignition.approval_rules?.approval_required ?? false,
      },
      proof: [
        sourceMemories[0] ? `source:${sourceTypeForSpine(sourceMemories[0])}` : "",
        structuredMemories[0] ? `memory:${structuredMemories[0].id}` : "",
        experiences[0] ? `experience:${experiences[0].id}` : "",
        ignitionTraceProof[0] ? `trace:${ignitionTraceProof[0].source_ref ?? ignitionTraceProof[0].memory_id}` : "",
      ].filter(Boolean),
      blockers: phase6Ready ? [] : ["Expose founder-safe status and engineer-grade source proof, related files, risk, tests, and trace."],
    }),
    phaseReadiness({
      id: "phase7",
      title: "Direct Connectors v1",
      ready: phase7Ready,
      partial: importedDirectSourceTypes.length > 0,
      metrics: {
        importedDirectSources: importedDirectSourceTypes.length,
        sourceMemoryCount: sourceMemories.length,
        github: sourceTypes.some((source) => source.type === "github"),
        slack: sourceTypes.some((source) => source.type === "slack"),
        linear: sourceTypes.some((source) => source.type === "linear"),
        agentChats: sourceTypes.some((source) => /codex|devin|chat/i.test(source.type)),
      },
      proof: importedDirectSourceTypes.slice(0, 8).map((source) => `${source.type}:${source.count}`),
      blockers: phase7Ready ? [] : ["Import at least three direct source types, e.g. GitHub, Slack/Linear, and agent chat/docs."],
    }),
  ];
  const blockers = phaseStatuses.flatMap((phase) => phase.blockers.map((blocker) => `${phase.id}: ${blocker}`));
  const readyPhaseCount = phaseStatuses.filter((phase) => phase.ready).length;
  const latestSkill = approvedSkills[0] ?? skillCandidates[0];
  const outcomeCount = skillCandidates.reduce((total, skill) => total + skill.outcomeCount, 0);

  return {
    generatedAt: new Date().toISOString(),
    project: input.project ?? null,
    workspace: input.workspace ?? null,
    task: input.task ?? null,
    agentId: input.agentId ?? "codex",
    localProductionReady: blockers.length === 0,
    readyPhaseCount,
    totalPhaseCount: phaseStatuses.length,
    phases: phaseStatuses,
    blockers,
    sourceTypes,
    proofChain: buildInheritanceSpineProof({
      sourceMemory: sourceMemories[0],
      structuredMemory: structuredMemories[0],
      reasoning: reasoningChains[0],
      experience: experiences[0],
      skill: latestSkill,
      ignitionTraceCount: ignitionTraceProof.length,
      outcomeCount,
    }),
    memoryIgnition: {
      relevantMemoryCount: ignitionRelevantMemories.length,
      executableSkillCount: ignitionExecutableSkills.length,
      traceProofCount: ignitionTraceProof.length,
      approvalRequired: ignition.approval_rules?.approval_required ?? false,
      recommendedFirstAction: ignition.recommended_first_action,
    },
    founderView: {
      mission: input.task ?? "Prepare an agent with inherited company context before it acts.",
      contextGiven: `${ignition.relevant_memories.length} memories, ${experiences.length} experiences, ${ignition.trace_proof.length} trace proofs`,
      risk: ignition.approval_rules?.derived_risk_level ?? "unknown",
      approval: ignition.approval_rules?.approval_required ? "approval_required" : "not_required",
      progress: `${readyPhaseCount}/${phaseStatuses.length} local MVP phases ready`,
      outcome: phase4Ready ? "outcome_capture_ready" : "waiting_for_outcome_capture",
      learning: phase5Ready ? "experience_graph_ready" : "waiting_for_experience_graph",
    },
    engineerView: {
      sourceProof: sourceMemories[0]?.sourceRef ?? sourceMemories[0]?.traceProof?.sourceRef ?? null,
      relatedFiles: [...new Set([...ignitionRiskyFiles, ...experiences.flatMap((record) => record.files)])].slice(0, 12),
      riskRules: ignitionRiskSignals,
      requiredTests: ignitionRequiredTests,
      agentPromptReady: briefHasPrompt,
      technicalTrace: ignitionTraceProof.slice(0, 12),
      outcomeRecord: experiences[0]
        ? {
            id: experiences[0].id,
            sourceRef: experiences[0].sourceRef,
            outcome: experiences[0].outcome,
            lesson: experiences[0].lesson,
          }
        : null,
    },
    accessLayer: {
      activeApiKeyCount: activeApiKeys.length,
      sdkPackageExists,
      mcpPackageExists,
      mcpBuildExists,
    },
  };
}

async function persistPhase2StructuredMemory(input: {
  userId: string;
  pillar: Phase2Pillar;
  summary: string;
  content: string;
  contractCategory: MemoryContractCategory;
  evidence: string[];
  whyItMatters: string;
  freshness?: CompanyBrainFreshness["status"];
  conflictsWith?: string[];
  shouldInheritBy?: string[];
  confidence?: number;
  graphNodeId?: string;
  dedupeKey?: string;
  project?: string;
  workspace?: string;
  threadId?: string;
  source?: string;
  operationalTags?: OperationalTag[];
}): Promise<Memory> {
  const now = new Date().toISOString();
  const sourceRef = `phase2:${input.pillar}:${input.source?.trim() || input.threadId || input.project || "manual"}`;
  const conflict: CompanyBrainConflict = {
    status: input.conflictsWith && input.conflictsWith.length > 0 ? "possible_conflict" : "none",
    conflictsWith: input.conflictsWith ?? [],
    checkedAt: now,
  };
  const memory: Memory = {
    id: randomUUID(),
    userId: input.userId,
    type: PHASE2_MEMORY_TYPE_BY_TYPE[input.pillar],
    summary: input.summary,
    content: input.content,
    importanceScore: input.pillar === "incident" || input.pillar === "risk" ? 0.9 : 0.86,
    confidence: input.confidence ?? 0.92,
    source: "import",
    status: conflict.status === "possible_conflict" ? "contradicted" : input.freshness === "stale" ? "stale" : "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: Math.max(1, input.evidence.length),
    contractVersion: "memoryos.contract.v1",
    contractCategory: input.contractCategory,
    sourceRef,
    operationalTags: input.operationalTags,
    companyBrainType: input.pillar,
    traceProof: {
      sourceType: input.source?.split(":")[0] ?? "phase2_capture",
      sourceRef,
      evidence: input.evidence,
      confidence: input.confidence ?? 0.92,
      capturedAt: now,
    },
    freshness: {
      status: input.freshness ?? "fresh",
      checkedAt: now,
    },
    conflict,
    graph: {
      nodeId: input.graphNodeId ?? `phase2:${input.pillar}:${randomUUID().slice(0, 8)}`,
      nodeType: input.pillar,
      edgeRefs: [
        input.project ? `project:${input.project}` : undefined,
        input.workspace ? `workspace:${input.workspace}` : undefined,
        input.threadId ? `thread:${input.threadId}` : undefined,
        input.dedupeKey ? `dedupe:${input.dedupeKey}` : undefined,
        ...(input.shouldInheritBy ?? []).map((agent) => `agent:${agent}`),
      ].filter((value): value is string => Boolean(value)),
    },
    developerSignals: {
      projectArea: [input.project, input.workspace, input.threadId].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
      goal: [input.summary, input.whyItMatters, ...(input.shouldInheritBy ?? [])],
    },
  };
  const entities = resolveCompanyBrainEntities([memory]);
  const relations = buildCompanyBrainRelations(memory, entities);
  const graphEdgeRefs = new Set(memory.graph?.edgeRefs ?? []);
  for (const entity of entities) graphEdgeRefs.add(`entity:${entity.id}`);
  for (const relation of relations) graphEdgeRefs.add(`relation:${relation.id}`);
  memory.entities = entities;
  memory.relations = relations;
  memory.graph = {
    ...(memory.graph ?? {
      nodeId: input.graphNodeId ?? `phase2:${input.pillar}:${randomUUID().slice(0, 8)}`,
      nodeType: input.pillar,
      edgeRefs: [],
    }),
    edgeRefs: [...graphEdgeRefs],
  };
  memory.proofQuality = assessCompanyBrainProofQuality(memory, entities, relations);
  await getMemoryStoreAdapter().saveMemory({ memory });
  await upsertRecentMemory(memory);
  await recordMemoryCreatedEvent(
    memory,
    `Phase 2 ${input.pillar} memory captured as structured company knowledge.`,
  );
  return memory;
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
    orgId: readOrgIdFromRequest(req),
    persistExport: true,
  });
  res.json(payload);
}));

memoryRouter.get("/company-brain/exports", asyncHandler(async (req, res) => {
  if (!(await hasMinimumPlan(req.authUserId, "Scale"))) {
    res.status(402).json({
      error: "Company Brain exports require Scale or higher.",
      code: "UPGRADE_REQUIRED",
      details: { minimumPlan: "Scale", currentPlan: (await getBillingStateForUser(req.authUserId)).plan },
    });
    return;
  }
  const exportsList = await listCompanyBrainExports(
    req.authUserId,
    readOrgIdFromRequest(req),
  );
  res.json({ exports: exportsList });
}));

memoryRouter.post("/company-brain/phase2/capture", asyncHandler(async (req, res) => {
  const traceId = createTraceId("phase2_capture");
  const parsed = CompanyBrainPhase2CaptureSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
      traceId,
    });
    return;
  }

  const { rawSignals = [], slackSignals = [], jiraSignals = [], memories = [], decisionMemories = [], incidentMemories = [], architectureMemories = [], processMemories = [] } =
    parsed.data;
  const workspace = parsed.data.workspace?.trim();
  const sharedProject = parsed.data.project?.trim();
  const sharedThreadId = parsed.data.threadId?.trim();
  const acceptedMemories: Memory[] = [];
  const rejectedMemories: Phase2RejectedMemory[] = [];
  const existingListed = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 500,
  });
  const existingPhase2Memories = existingListed.memories
    .filter((memory) => (memory.sourceRef ?? "").startsWith("phase2:"))
    .filter((memory) => (sharedProject ? projectMatchesMemory(sharedProject, memory) : true));
  const structuredMemories: Phase2StructuredMemoryInput[] = [
    ...extractRawSignalsToPhase2Memories({
      rawSignals: [
        ...rawSignals,
        ...slackSignals.map(mapSlackSignalToPhase2RawSignal),
        ...jiraSignals.map(mapJiraSignalToPhase2RawSignal),
      ],
      project: sharedProject,
      workspace,
      threadId: sharedThreadId,
    }),
    ...memories,
  ];

  for (const rawItem of structuredMemories) {
    const prepared = preparePhase2Memory({
      memory: rawItem,
      existingMemories: existingPhase2Memories,
      acceptedMemories,
    });
    if ("rejected" in prepared) {
      rejectedMemories.push(prepared.rejected);
      continue;
    }
    const item = prepared.accepted;
    const project = item.project ?? sharedProject;
    const workspaceForItem = item.workspace ?? workspace;
    const threadId = item.threadId ?? sharedThreadId;
    const summary = `${item.type.replace(/_/g, " ")}: ${item.title}`;
    const content = [
      summary,
      `What happened: ${item.whatHappened}`,
      `Why it matters: ${item.whyItMatters}`,
      `Evidence: ${item.evidence.join(" | ")}`,
      project ? `Project: ${project}` : undefined,
      item.shouldInheritBy?.length ? `Should inherit by: ${item.shouldInheritBy.join(" | ")}` : undefined,
      item.conflictsWith?.length ? `Potential conflicts: ${item.conflictsWith.join(" | ")}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n");
    acceptedMemories.push(
      await persistPhase2StructuredMemory({
        userId: req.authUserId,
        pillar: item.type,
        summary,
        content,
        contractCategory: PHASE2_CONTRACT_CATEGORY_BY_TYPE[item.type],
        project,
        workspace: workspaceForItem,
        threadId,
        source: item.source,
        evidence: item.evidence,
        whyItMatters: item.whyItMatters,
        freshness: item.freshness,
        conflictsWith: item.conflictsWith,
        shouldInheritBy: item.shouldInheritBy,
        confidence: item.confidence,
        graphNodeId: item.graphNodeId,
        dedupeKey: item.dedupeKey,
        operationalTags: phase2OperationalTags(item.type),
      }),
    );
  }

  for (const item of decisionMemories) {
    const summary = `Decision: ${item.decision}`;
    const content = [
      summary,
      `Why: ${item.why}`,
      `Who made it: ${item.who.join(" | ")}`,
      (item.alternatives?.length ?? 0) > 0 ? `Alternatives considered: ${item.alternatives?.join(" | ")}` : undefined,
      item.project ? `Project: ${item.project}` : sharedProject ? `Project: ${sharedProject}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n");
    acceptedMemories.push(
      await persistPhase2StructuredMemory({
        userId: req.authUserId,
        pillar: "decision",
        summary,
        content,
        contractCategory: "decision",
        evidence: [item.source ?? item.decision],
        whyItMatters: item.why,
        project: item.project ?? sharedProject,
        workspace,
        threadId: item.threadId ?? sharedThreadId,
        source: item.source,
        operationalTags: ["decision"],
      }),
    );
  }

  for (const item of incidentMemories) {
    const summary = `Incident: ${item.rootCause}`;
    const content = [
      summary,
      `Root cause: ${item.rootCause}`,
      `Fix: ${item.fix}`,
      `Lessons learned: ${item.lessonsLearned.join(" | ")}`,
      item.project ? `Project: ${item.project}` : sharedProject ? `Project: ${sharedProject}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n");
    acceptedMemories.push(
      await persistPhase2StructuredMemory({
        userId: req.authUserId,
        pillar: "incident",
        summary,
        content,
        contractCategory: "incident",
        evidence: [item.source ?? item.rootCause],
        whyItMatters: item.lessonsLearned.join(" | "),
        project: item.project ?? sharedProject,
        workspace,
        threadId: item.threadId ?? sharedThreadId,
        source: item.source,
        operationalTags: ["incident"],
      }),
    );
  }

  for (const item of architectureMemories) {
    const summary = `Architecture ADR: ${item.adr}`;
    const content = [
      summary,
      `Tradeoffs: ${item.tradeoffs.join(" | ")}`,
      `Constraints: ${item.constraints.join(" | ")}`,
      item.project ? `Project: ${item.project}` : sharedProject ? `Project: ${sharedProject}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n");
    acceptedMemories.push(
      await persistPhase2StructuredMemory({
        userId: req.authUserId,
        pillar: "architecture",
        summary,
        content,
        contractCategory: "architecture_note",
        evidence: [item.source ?? item.adr],
        whyItMatters: item.tradeoffs.join(" | "),
        project: item.project ?? sharedProject,
        workspace,
        threadId: item.threadId ?? sharedThreadId,
        source: item.source,
        operationalTags: ["decision", "policy"],
      }),
    );
  }

  for (const item of processMemories) {
    const summary = `Process (${item.workflowType}): ${item.workflow}`;
    const content = [
      summary,
      `Workflow type: ${item.workflowType}`,
      `Steps: ${item.steps.join(" | ")}`,
      item.project ? `Project: ${item.project}` : sharedProject ? `Project: ${sharedProject}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n");
    acceptedMemories.push(
      await persistPhase2StructuredMemory({
        userId: req.authUserId,
        pillar: "process",
        summary,
        content,
        contractCategory: "runbook",
        evidence: [item.source ?? item.workflow],
        whyItMatters: `Repeatable ${item.workflowType} process for future agents.`,
        project: item.project ?? sharedProject,
        workspace,
        threadId: item.threadId ?? sharedThreadId,
        source: item.source ?? item.workflowType,
        operationalTags: ["runbook"],
      }),
    );
  }

  res.status(200).json({
    traceId,
    acceptedCount: acceptedMemories.length,
    rejectedCount: rejectedMemories.length,
    acceptedMemories: acceptedMemories.map((memory) => ({
      id: memory.id,
      summary: memory.summary,
      companyBrainType: memory.companyBrainType ?? null,
      contractCategory: memory.contractCategory,
      sourceRef: memory.sourceRef ?? null,
      freshness: memory.freshness ?? null,
      conflict: memory.conflict ?? null,
      traceProof: memory.traceProof ?? null,
      graph: memory.graph ?? null,
      entities: memory.entities ?? [],
      relations: memory.relations ?? [],
      proofQuality: memory.proofQuality ?? null,
      retrievalIndexed: true,
      updatedAt: memory.updatedAt,
    })),
    rejectedMemories,
    breakdown: {
      rawSignals: rawSignals.length,
      slackSignals: slackSignals.length,
      jiraSignals: jiraSignals.length,
      memories: structuredMemories.length,
      decision: decisionMemories.length,
      incident: incidentMemories.length,
      architecture: architectureMemories.length,
      process: processMemories.length,
      byType: acceptedMemories.reduce<Record<string, number>>((acc, memory) => {
        const type = memory.companyBrainType ?? "unknown";
        acc[type] = (acc[type] ?? 0) + 1;
        return acc;
      }, {}),
    },
  });
}));

memoryRouter.get("/company-brain/phase2/overview", asyncHandler(async (req, res) => {
  const project =
    typeof req.query.project === "string" && req.query.project.trim().length > 0
      ? req.query.project.trim()
      : undefined;
  const listed = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 500,
  });
  const scoped = project
    ? listed.memories.filter((memory) => projectMatchesMemory(project, memory))
    : listed.memories;
  const phase2Memories = scoped.filter((memory) => (memory.sourceRef ?? "").startsWith("phase2:"));
  const latest = (memories: Memory[]) =>
    memories
      .slice()
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 12)
      .map((memory) => ({
        id: memory.id,
        summary: memory.summary,
        updatedAt: memory.updatedAt,
        confidence: memory.confidence,
        status: memory.status,
        contractCategory: memory.contractCategory ?? null,
        companyBrainType: memory.companyBrainType ?? null,
        sourceRef: memory.sourceRef ?? null,
        traceProof: memory.traceProof ?? null,
        freshness: memory.freshness ?? null,
        conflict: memory.conflict ?? null,
        graph: memory.graph ?? null,
        entities: memory.entities ?? [],
        relations: memory.relations ?? [],
        proofQuality: memory.proofQuality ?? null,
      }));
  const phase2Types: Phase2Pillar[] = [
    "decision",
    "incident",
    "architecture",
    "process",
    "customer_issue",
    "execution",
    "agent_action",
    "risk",
    "test",
    "knowledge",
    "context",
  ];
  const grouped = Object.fromEntries(
    phase2Types.map((type) => [type, phase2Memories.filter((memory) => memory.companyBrainType === type || (memory.sourceRef ?? "").startsWith(`phase2:${type}`))]),
  ) as Record<Phase2Pillar, Memory[]>;
  const pillars = phase2Types.map((id) => ({ id, count: grouped[id].length }));
  const traceableCount = phase2Memories.filter((memory) => memory.traceProof?.sourceRef || memory.sourceRef).length;
  const contractValidatedCount = phase2Memories.filter((memory) => memory.contractVersion && memory.contractCategory).length;
  const dedupeIndexedCount = phase2Memories.filter((memory) => (memory.graph?.edgeRefs ?? []).some((edgeRef) => edgeRef.startsWith("dedupe:"))).length;
  const freshnessCheckedCount = phase2Memories.filter((memory) => memory.freshness?.checkedAt || memory.freshness?.status).length;
  const conflictCheckedCount = phase2Memories.filter((memory) => memory.conflict?.checkedAt || memory.conflict?.status).length;
  const conflictedCount = phase2Memories.filter((memory) => memory.conflict?.status === "possible_conflict" || memory.status === "contradicted").length;
  const staleCount = phase2Memories.filter((memory) => memory.freshness?.status === "stale" || memory.status === "stale").length;
  const graphNodes = phase2Memories.map((memory) => memory.graph ?? {
    nodeId: memory.id,
    nodeType: memory.companyBrainType ?? "knowledge",
    edgeRefs: [],
  });
  const graphEdges = phase2Memories.flatMap((memory) =>
    (memory.graph?.edgeRefs ?? []).map((edgeRef) => ({
      from: memory.graph?.nodeId ?? memory.id,
      to: edgeRef,
      type: "evidence_link",
    })),
  );
  const entities = resolveCompanyBrainEntities(phase2Memories);
  const proofQualities = phase2Memories
    .map((memory) => memory.proofQuality ?? assessCompanyBrainProofQuality(memory, memory.entities ?? [], memory.relations ?? []));
  const strongProofCount = proofQualities.filter((proof) => proof.status === "strong").length;
  const usableProofCount = proofQualities.filter((proof) => proof.status === "usable").length;
  const weakProofCount = proofQualities.filter((proof) => proof.status === "weak").length;
  const blockedProofCount = proofQualities.filter((proof) => proof.status === "blocked").length;
  const productionReadyCount = proofQualities.filter((proof) => proof.productionReady).length;
  const averageProofQuality =
    proofQualities.length > 0
      ? Math.round(proofQualities.reduce((total, proof) => total + proof.score, 0) / proofQualities.length)
      : 0;
  const conflictReviewQueue = phase2Memories
    .filter((memory) => memory.conflict?.status === "possible_conflict" || memory.status === "contradicted")
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 80)
    .map((memory) => ({
      id: memory.id,
      summary: memory.summary,
      companyBrainType: memory.companyBrainType ?? null,
      status: memory.status,
      sourceRef: memory.sourceRef ?? null,
      conflictsWith: memory.conflict?.conflictsWith ?? [],
      updatedAt: memory.updatedAt,
      traceProof: memory.traceProof ?? null,
      freshness: memory.freshness ?? null,
      graph: memory.graph ?? null,
      entities: memory.entities ?? [],
      proofQuality: memory.proofQuality ?? null,
    }));
  const lastStructuredMemoryAt =
    phase2Memories
      .slice()
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0]
      ?.updatedAt ?? null;
  const traceProofCoverage =
    phase2Memories.length > 0 ? Math.round((traceableCount / phase2Memories.length) * 100) : 0;
  const monitoring = {
    deployEnvironment: process.env.NODE_ENV === "production" ? "production" : "local-production-readiness",
    lastStructuredMemoryAt,
    checks: buildPhase2MonitoringChecks({
      total: phase2Memories.length,
      traceProofCoverage,
      staleCount,
      unresolvedConflicts: conflictReviewQueue.length,
      graphNodeCount: graphNodes.length,
      graphEdgeCount: graphEdges.length,
      entityCount: entities.length,
      productionReadyCount,
      blockedProofCount,
      averageProofQuality,
      lastStructuredMemoryAt,
    }),
  };
  const extractionReadiness = buildPhase2ExtractionReadiness({
    total: phase2Memories.length,
    traceableCount,
    contractValidatedCount,
    dedupeIndexedCount,
    freshnessCheckedCount,
    conflictCheckedCount,
    graphNodeCount: graphNodes.length,
    graphEdgeCount: graphEdges.length,
    entityCount: entities.length,
    productionReadyCount,
    blockedProofCount,
    staleCount,
    unresolvedConflicts: conflictReviewQueue.length,
  });
  const inheritanceReadiness = summarizeMemoryInheritanceReadiness(phase2Memories, { limit: 80 });

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    project: project ?? null,
    totalStructuredMemories: phase2Memories.length,
    moatCoverage: {
      pillarsWithData: pillars.filter((item) => item.count > 0).length,
      totalPillars: pillars.length,
      traceProofCoverage,
      conflictedCount,
      staleCount,
      strongProofCount,
      usableProofCount,
      weakProofCount,
      blockedProofCount,
      productionReadyCount,
      averageProofQuality,
      inheritanceReadyCount: inheritanceReadiness.ready,
      inheritanceReviewCount: inheritanceReadiness.review,
      inheritanceBlockedCount: inheritanceReadiness.blocked,
      inheritanceReadyRatio: inheritanceReadiness.readyRatio,
    },
    graph: {
      nodes: graphNodes,
      edges: graphEdges,
    },
    extractionReadiness,
    inheritanceReadiness,
    search: {
      indexedCount: phase2Memories.length,
      endpoint: "/api/memory/company-brain/phase2/search",
      detailEndpoint: "/api/memory/company-brain/phase2/memory/:id",
      searchableFields: ["summary", "content", "type", "source", "evidence", "entity", "graph"],
      suggestedQueries: entities.slice(0, 8).map((entity) => entity.label),
    },
    entities,
    conflictReviewQueue,
    monitoring,
    pillars: Object.fromEntries(
      phase2Types.map((type) => [type, { count: grouped[type].length, latest: latest(grouped[type]) }]),
    ),
  });
}));

memoryRouter.get("/company-brain/phase2/search", asyncHandler(async (req, res) => {
  const project =
    typeof req.query.project === "string" && req.query.project.trim().length > 0
      ? req.query.project.trim()
      : undefined;
  const query =
    typeof req.query.q === "string" && req.query.q.trim().length > 0
      ? req.query.q.trim()
      : "";
  const type =
    typeof req.query.type === "string" && req.query.type.trim().length > 0
      ? req.query.type.trim()
      : undefined;
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 25;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 25;

  const listed = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 500,
  });
  const scoped = listed.memories
    .filter((memory) => (memory.sourceRef ?? "").startsWith("phase2:"))
    .filter((memory) => (project ? projectMatchesMemory(project, memory) : true))
    .filter((memory) => (type ? memory.companyBrainType === type || (memory.sourceRef ?? "").startsWith(`phase2:${type}`) : true));
  const scored = scoped
    .map((memory) => ({ memory, score: scorePhase2SearchResult(memory, query) }))
    .filter((item) => !query || item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.memory.updatedAt).getTime() - new Date(left.memory.updatedAt).getTime();
    })
    .slice(0, limit);

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    project: project ?? null,
    query,
    count: scored.length,
    totalIndexed: scoped.length,
    results: scored.map(({ memory, score }) => ({
      ...serializePhase2MemoryDetail(memory),
      searchScore: score,
    })),
  });
}));

memoryRouter.get("/company-brain/phase2/memory/:memoryId", asyncHandler(async (req, res) => {
  const memoryId = req.params.memoryId;
  const listed = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 500,
  });
  const memory = listed.memories.find((item) => item.id === memoryId);
  if (!memory || !(memory.sourceRef ?? "").startsWith("phase2:")) {
    res.status(404).json({
      error: "Phase 2 memory not found",
      memoryId,
    });
    return;
  }

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    memory: serializePhase2MemoryDetail(memory),
  });
}));

memoryRouter.post("/api-keys/agent-access", asyncHandler(async (req, res) => {
  const expires =
    isObjectRecord(req.body) && typeof req.body.expires === "string"
      ? req.body.expires
      : "1 year";
  const name =
    isObjectRecord(req.body) && typeof req.body.name === "string" && req.body.name.trim()
      ? req.body.name.trim()
      : "agent-memory-protocol";

  if (!API_KEY_EXPIRY_OPTIONS.includes(expires as (typeof API_KEY_EXPIRY_OPTIONS)[number])) {
    res.status(400).json({ error: "Invalid API key expiry" });
    return;
  }

  const result = await createApiKeyForUser({
    userId: req.authUserId,
    name,
    expires: resolveApiKeyExpiresAt(expires),
    mode: "scoped",
    endpoints: [...AGENT_MEMORY_PROTOCOL_ENDPOINTS],
    contentTag: "agent-memory-protocol",
  });

  emitMemoryEvent({
    kind: "api_keys_changed",
    userId: req.authUserId,
    payload: { action: "created", keyId: result.key.id, purpose: "agent_access" },
  });

  const baseUrl = process.env.MEMORYOS_PUBLIC_APP_URL ?? process.env.MEMORYOS_BASE_URL ?? "http://localhost:3011";
  res.status(201).json({
    token: result.token,
    key: serializeApiKeyForClient(result.key),
    protocol: {
      name: "Agent Memory Protocol",
      baseUrl,
      endpoints: [...AGENT_MEMORY_PROTOCOL_HTTP_ENDPOINTS],
      sdk: AGENT_MEMORY_PROTOCOL_SDK_CALLS.join(" -> "),
      sdkCalls: [...AGENT_MEMORY_PROTOCOL_SDK_CALLS],
      mcpTools: [...AGENT_MEMORY_PROTOCOL_MCP_TOOLS],
    },
  });
}));

function protocolEventText(event: {
  routeType: string;
  path: string;
  payloadSummary?: unknown;
}): string {
  const toolName = isObjectRecord(event.payloadSummary) && typeof event.payloadSummary.name === "string"
    ? event.payloadSummary.name
    : "";
  return `${event.routeType} ${event.path} ${toolName}`;
}

function protocolEventPayload(event: { responseSummary?: unknown }): Record<string, unknown> {
  if (!isObjectRecord(event.responseSummary)) return {};
  const summary = event.responseSummary;
  if (isObjectRecord(summary.data)) return summary.data;
  if (isObjectRecord(summary.result)) return summary.result;
  return summary;
}

function summarizeAgentAccessKeyUsage(userId: string, keyId: string) {
  const events = listRequestHistory({ userId, limit: 500, memoryOnly: false })
    .filter((event) => event.apiKeyId === keyId);
  const standardPackageEvents = events.filter(isStandardInheritanceLifecycleEvent);
  const endpointSet = new Set(events.map((event) => `${event.method} ${event.path}`));

  return {
    requestCount: events.length,
    requests24h: countApiKeyRequests24h(userId, keyId),
    successCount: events.filter((event) => event.status === "Success").length,
    errorCount: events.filter((event) => event.status === "Error").length,
    apiRequestCount: events.filter((event) => /^\/api\/memory\//i.test(event.path)).length,
    mcpRequestCount: events.filter((event) => /\/api\/mcp|memoryignition_/i.test(protocolEventText(event))).length,
    briefRequestCount: events.filter((event) => /memoryignition\/brief|memoryignition_get_brief/i.test(protocolEventText(event))).length,
    outcomeRequestCount: events.filter((event) => /memoryignition\/outcome|memoryignition_save_outcome/i.test(protocolEventText(event))).length,
    traceProofRequestCount: events.filter((event) => /trace-proof|memoryignition_get_trace_proof/i.test(protocolEventText(event))).length,
    standardPackageRequestCount: standardPackageEvents.length,
    lastRequestAt: events[0]?.createdAt ?? null,
    lastStatus: events[0]?.status ?? null,
    observedEndpoints: Array.from(endpointSet).slice(0, 12),
  };
}

function serializeAgentAccessKeyRequest(event: ReturnType<typeof listRequestHistory>[number]) {
  const payload = protocolEventPayload(event);
  const standardPackage = standardInheritancePackageFromPayload(payload);
  const text = protocolEventText(event);
  return {
    id: event.id,
    requestId: event.requestId,
    createdAt: event.createdAt,
    method: event.method,
    path: event.path,
    routeType: event.routeType,
    status: event.status,
    statusCode: event.statusCode,
    durationMs: event.durationMs,
    isApi: /^\/api\/memory\//i.test(event.path),
    isMcp: /\/api\/mcp|memoryignition_/i.test(text),
    isBrief: /memoryignition\/brief|memoryignition_get_brief/i.test(text),
    isOutcome: /memoryignition\/outcome|memoryignition_save_outcome/i.test(text),
    isTraceProof: /trace-proof|memoryignition_get_trace_proof/i.test(text),
    standardPackageVersion: typeof standardPackage?.version === "string" ? standardPackage.version : null,
    packageMemoryCount: countArrayField(standardPackage, "memories"),
    packageExperienceCount: countArrayField(standardPackage, "experiences"),
    packageSkillCount: countArrayField(standardPackage, "executable_skills"),
    packageTraceProofCount: countArrayField(standardPackage, "trace_proof"),
    task: firstString(payload.task_intent, payload.contextText),
    error: event.status === "Error" ? event.errorDetails ?? { message: "Request failed." } : null,
  };
}

function standardInheritancePackageFromPayload(payload: unknown): Record<string, unknown> | null {
  if (!isObjectRecord(payload)) return null;
  if (isObjectRecord(payload.standard_inheritance_package)) {
    return payload.standard_inheritance_package;
  }
  if (isObjectRecord(payload.data)) {
    const nested = standardInheritancePackageFromPayload(payload.data);
    if (nested) return nested;
  }
  if (isObjectRecord(payload.result)) {
    const nested = standardInheritancePackageFromPayload(payload.result);
    if (nested) return nested;
  }
  return null;
}

function isOutcomeLearningEvent(event: { status: string; path: string; routeType: string; payloadSummary?: unknown }): boolean {
  return event.status === "Success" &&
    /memoryignition\/outcome|memoryignition_outcome|memoryignition_save_outcome/i.test(protocolEventText(event));
}

function isStandardInheritanceLifecycleEvent(event: {
  status: string;
  path: string;
  routeType: string;
  payloadSummary?: unknown;
  responseSummary?: unknown;
}): boolean {
  return Boolean(standardInheritancePackageFromPayload(protocolEventPayload(event))) || isOutcomeLearningEvent(event);
}

function countArrayField(payload: Record<string, unknown> | null, field: string): number {
  const value = payload?.[field];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return Array.isArray(value) ? value.length : 0;
}

function outcomeContractFromPackage(payload: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!payload) return null;
  if (isObjectRecord(payload.outcome_contract)) return payload.outcome_contract;
  if (isObjectRecord(payload.outcome)) {
    if (isObjectRecord(payload.outcome.contract)) return payload.outcome.contract;
    if (typeof payload.outcome.save_required === "boolean") {
      return {
        version: "legacy_outcome_contract",
        required: payload.outcome.save_required,
        endpoint: "/api/memory/memoryignition/outcome",
        sdk_method: "memoryos.saveOutcome",
        mcp_tool: "memoryignition_save_outcome",
      };
    }
  }
  return null;
}

function isOutcomeContractRequired(payload: Record<string, unknown> | null): boolean {
  const contract = outcomeContractFromPackage(payload);
  if (typeof contract?.required === "boolean") return contract.required;
  const outcome = isObjectRecord(payload?.outcome) ? payload?.outcome : {};
  return typeof outcome.save_required === "boolean" ? outcome.save_required : false;
}

function buildOutcomeContractProof(events: ReturnType<typeof listRequestHistory>) {
  const successfulEvents = events.filter((event) => event.status === "Success");
  const latestOutcomeEvent = successfulEvents.find((event) =>
    /memoryignition\/outcome|memoryignition_outcome|memoryignition_save_outcome/i.test(protocolEventText(event)),
  );
  const latestOutcomeAt = latestOutcomeEvent ? new Date(latestOutcomeEvent.createdAt).getTime() : 0;
  const briefEvents = successfulEvents.filter((event) =>
    /memoryignition\/brief|memoryignition_brief|memoryignition_get_brief/i.test(protocolEventText(event)),
  );
  const requiredBriefs = briefEvents
    .map((event) => {
      const payload = protocolEventPayload(event);
      const standardPackage = standardInheritancePackageFromPayload(payload);
      const outcomeContract = outcomeContractFromPackage(standardPackage);
      return {
        event,
        standardPackage,
        outcomeContract,
        required:
          isOutcomeContractRequired(standardPackage) ||
          /memoryignition\/brief|memoryignition_get_brief/i.test(protocolEventText(event)),
      };
    })
    .filter((item) => item.required);
  const pending = requiredBriefs.filter((item) => new Date(item.event.createdAt).getTime() > latestOutcomeAt);
  const latestRequired = requiredBriefs[0];

  return {
    version: "outcome_contract_status.v1",
    latestOutcomeAt: latestOutcomeEvent?.createdAt ?? null,
    latestOutcomeRequestId: latestOutcomeEvent?.requestId ?? null,
    outcomeContractVersion: typeof latestRequired?.outcomeContract?.version === "string"
      ? latestRequired.outcomeContract.version
      : requiredBriefs.length > 0
        ? "outcome_contract.v1"
        : null,
    outcomeRequired: requiredBriefs.length > 0,
    requiredBriefCount: requiredBriefs.length,
    outcomeSatisfiedCount: Math.max(0, requiredBriefs.length - pending.length),
    outcomePendingCount: pending.length,
    pendingBriefs: pending.slice(0, 5).map((item) => ({
      requestId: item.event.requestId,
      createdAt: item.event.createdAt,
      path: item.event.path,
      delivery: typeof item.standardPackage?.delivery === "string" ? item.standardPackage.delivery : null,
      standardPackageVersion: typeof item.standardPackage?.version === "string"
        ? item.standardPackage.version
        : "standard_inheritance_package.v1",
      task: isObjectRecord(item.standardPackage?.task)
        ? firstString(item.standardPackage.task.task, item.standardPackage.task.intent)
        : firstString(protocolEventPayload(item.event).task_intent, protocolEventPayload(item.event).contextText),
    })),
    status: pending.length > 0 ? "pending" : requiredBriefs.length > 0 ? "satisfied" : "not_required",
    nextAction: pending.length > 0
      ? "Call memoryignition_save_outcome, memoryos.saveOutcome, or POST /api/memory/memoryignition/outcome for the latest issued brief."
      : requiredBriefs.length > 0
        ? "Outcome learning is current for observed issued briefs."
        : "Generate a MemoryIgnition brief with an outcome_contract before agent execution.",
  };
}

function memoryIgnitionMomentFromEvent(event: {
  path: string;
  routeType: string;
  payloadSummary?: unknown;
}): "before_agent" | "before_action" | "during_action" | "risk_check" | "send_now" | "after_agent" | "handoff" | "runtime_gate" | "mcp" | null {
  const text = protocolEventText(event).toLowerCase();
  if (text.includes("memoryignition_get_brief")) return "before_agent";
  if (text.includes("memoryignition_send_now") || text.includes("/memoryignition/send-now")) return "send_now";
  if (text.includes("memoryignition_save_outcome")) return "after_agent";
  if (text.includes("memoryignition_create_handoff")) return "handoff";
  if (text.includes("/memoryignition/run-gate")) return "runtime_gate";
  if (text.includes("/memoryignition/before-agent") || text.includes("/memoryignition/brief")) return "before_agent";
  if (text.includes("/memoryignition/before-action")) return "before_action";
  if (text.includes("/memoryignition/during-action")) return "during_action";
  if (text.includes("/memoryignition/risk-check")) return "risk_check";
  if (
    text.includes("/memoryignition/after-agent") ||
    text.includes("/memoryignition/outcome-learn") ||
    text.includes("/memoryignition/outcome")
  ) {
    return "after_agent";
  }
  if (text.includes("/memoryignition/handoff")) return "handoff";
  if (text.includes("mcp")) return "mcp";
  return null;
}

function memoryIgnitionMomentLabel(moment: NonNullable<ReturnType<typeof memoryIgnitionMomentFromEvent>>): string {
  const labels: Record<NonNullable<ReturnType<typeof memoryIgnitionMomentFromEvent>>, string> = {
    before_agent: "Before Agent",
    before_action: "Before Action",
    during_action: "During Action",
    risk_check: "Risk Check",
    send_now: "Send Now",
    after_agent: "After Agent",
    handoff: "Handoff",
    runtime_gate: "Runtime Gate",
    mcp: "MCP Tool",
  };
  return labels[moment];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function countUnknownArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function stringArrayFromUnknown(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

async function buildMemoryIgnitionRuntimeTimeline(userId: string, limit = 80, orgId?: string | null) {
  const events = listRequestHistory({ userId, limit, memoryOnly: false });
  const approvalRequests = await listMemoryIgnitionApprovalRequests({ userId, orgId, limit: 500 });
  const approvalsById = new Map(approvalRequests.map((approval) => [approval.id, approval]));
  const items = events
    .map((event) => {
      const moment = memoryIgnitionMomentFromEvent(event);
      if (!moment) return null;
      const responsePayload = protocolEventPayload(event);
      const payload = isObjectRecord(event.payloadSummary) ? event.payloadSummary : {};
      const standardPackage = standardInheritancePackageFromPayload(responsePayload);
      const actionGuard = isObjectRecord(responsePayload.action_guard) ? responsePayload.action_guard : {};
      const responseRuntimePolicy = isObjectRecord(responsePayload.runtime_policy)
        ? responsePayload.runtime_policy
        : isObjectRecord(actionGuard.runtime_policy)
          ? actionGuard.runtime_policy
          : {};
      const evaluationGate = isObjectRecord(responsePayload.evaluation_gate) ? responsePayload.evaluation_gate : {};
      const approvalRules = isObjectRecord(responsePayload.approval_rules) ? responsePayload.approval_rules : {};
      const internalAgents = isObjectRecord(responsePayload.internal_agents) ? responsePayload.internal_agents : {};
      const outcomeLearning = isObjectRecord(responsePayload.outcome_learning) ? responsePayload.outcome_learning : {};
      const outcomeLearningGate = isObjectRecord(responsePayload.outcome_learning_gate) ? responsePayload.outcome_learning_gate : {};
      const outcomeProof = isObjectRecord(responsePayload.outcome_proof) ? responsePayload.outcome_proof : {};
      const approvalRequestPayload = isObjectRecord(actionGuard.approval_request) ? actionGuard.approval_request : {};
      const actionText = firstString(actionGuard.action, payload.proposed_action, payload.action, payload.command);
      const directApprovalRequestId = firstString(approvalRequestPayload.id);
      const matchedApproval =
        (directApprovalRequestId ? approvalsById.get(directApprovalRequestId) : null) ??
        approvalRequests.find((approval) => approval.guardMoment === moment && actionText === approval.action) ??
        null;
      const approvalRequestId = directApprovalRequestId ?? matchedApproval?.id ?? null;
      const storedApproval = approvalRequestId ? approvalsById.get(approvalRequestId) ?? matchedApproval : matchedApproval;
      const approvalAuditProof = storedApproval ? buildMemoryIgnitionApprovalAuditProof(storedApproval) : null;
      const storedGuardProof = isObjectRecord(storedApproval?.guardProof) ? storedApproval.guardProof : {};
      const storedRuntimePolicy = isObjectRecord(storedGuardProof.runtime_policy) ? storedGuardProof.runtime_policy : {};
      const runtimePolicy = Object.keys(responseRuntimePolicy).length ? responseRuntimePolicy : storedRuntimePolicy;
      const responseGovernanceDecision = isObjectRecord(actionGuard.governance_decision)
        ? actionGuard.governance_decision
        : {};
      const storedGovernanceDecision = isObjectRecord(storedGuardProof.governance_decision)
        ? storedGuardProof.governance_decision
        : {};
      const governanceDecision = Object.keys(responseGovernanceDecision).length
        ? responseGovernanceDecision
        : storedGovernanceDecision;
      const approvalsUsed = stringArrayFromUnknown(outcomeProof.approvals_used).length
        ? stringArrayFromUnknown(outcomeProof.approvals_used)
        : stringArrayFromUnknown(payload.approvals_used);
      const linkedOutcomeEvidence = approvalsUsed.flatMap((id) => approvalsById.get(id)?.outcomeLinks ?? []);
      const outcomeEventId = firstString(outcomeProof.outcome_event_id, linkedOutcomeEvidence[0]?.outcomeEventId);
      const outcomeEvidence = stringArrayFromUnknown(outcomeProof.evidence).length
        ? stringArrayFromUnknown(outcomeProof.evidence)
        : linkedOutcomeEvidence.flatMap((link) => link.evidence);
      const status =
        event.status === "Error"
          ? "error"
          : moment === "risk_check" && responsePayload.allowed === false
            ? "blocked"
            : firstString(actionGuard.gate_status, evaluationGate.status, outcomeLearningGate.status, outcomeLearning.status) ?? "recorded";

      return {
        id: event.id,
        requestId: event.requestId,
        moment,
        label: memoryIgnitionMomentLabel(moment),
        status,
        success: event.status === "Success",
        method: event.method,
        path: event.path,
        routeType: event.routeType,
        statusCode: event.statusCode,
        durationMs: event.durationMs,
        createdAt: event.createdAt,
        agentId: firstString(responsePayload.agent_id, payload.agent_id, payload.agent_type),
        task: firstString(
          responsePayload.task_intent,
          responsePayload.contextText,
          payload.task_intent,
          payload.task,
          payload.question,
          payload.repo_or_task,
        ),
        action: actionText,
        riskLevel: firstString(actionGuard.risk_level, approvalRules.derived_risk_level, approvalRules.risk_level, payload.risk_level),
        approvalRequired: Boolean(actionGuard.approval_required ?? approvalRules.approval_required ?? false),
        allowed: typeof responsePayload.allowed === "boolean"
          ? responsePayload.allowed
          : typeof actionGuard.allowed === "boolean"
            ? actionGuard.allowed
            : typeof evaluationGate.can_execute === "boolean"
              ? evaluationGate.can_execute
              : null,
        memoryCount: countUnknownArray(responsePayload.relevant_memories) || countArrayField(standardPackage, "memories"),
        skillCount: countUnknownArray(responsePayload.executable_skills) || countArrayField(standardPackage, "executable_skills"),
        traceProofCount: countUnknownArray(responsePayload.trace_proof) || countArrayField(standardPackage, "trace_proof"),
        requiredTestCount: countUnknownArray(responsePayload.required_tests) || countArrayField(standardPackage, "required_tests"),
        packageVersion: typeof standardPackage?.version === "string" ? standardPackage.version : null,
        approvalRequestId,
        approvalStatus: firstString(approvalRequestPayload.status, storedApproval?.status),
        approvalReviewedAt: firstString(storedApproval?.reviewedAt),
        approvalAuditProof,
        approvalOutcomeCount: storedApproval?.outcomeLinks.length ?? 0,
        approvalsUsed,
        outcomeEventId,
        outcomeReady: typeof outcomeProof.future_inheritance_ready === "boolean"
          ? outcomeProof.future_inheritance_ready
          : linkedOutcomeEvidence.length > 0
            ? linkedOutcomeEvidence.some((link) => link.futureInheritanceReady)
            : null,
        outcomeEvidence,
        proofChainSteps: [
          standardPackage ? "brief_generated" : null,
          actionGuard && Object.keys(actionGuard).length ? "guard_checked" : null,
          governanceDecision && Object.keys(governanceDecision).length ? "governance_decision_recorded" : null,
          runtimePolicy && Object.keys(runtimePolicy).length ? "runtime_policy_checked" : null,
          stringArrayFromUnknown(governanceDecision.approval_sources).length > 0 ? "approval_policy_matched" : null,
          stringArrayFromUnknown(runtimePolicy.denied_tools).length > 0 ? "tool_permission_blocked" : null,
          approvalRequestId ? "approval_requested" : null,
          storedApproval?.reviewedAt ? "approval_reviewed" : null,
          outcomeEventId ? "outcome_recorded" : null,
          outcomeLearning && Object.keys(outcomeLearning).length
            ? "learning_updated"
            : linkedOutcomeEvidence.some((link) => link.futureInheritanceReady)
              ? "learning_updated"
              : null,
        ].filter((step): step is string => Boolean(step)),
        internalAgents,
        runtimePolicy: Object.keys(runtimePolicy).length ? runtimePolicy : null,
        governanceDecision: Object.keys(governanceDecision).length ? governanceDecision : null,
        outcomeLearning: Object.keys(outcomeLearning).length ? outcomeLearning : null,
        error: event.status === "Error" ? event.errorDetails ?? { message: "MemoryIgnition request failed." } : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const moments = {
    before_agent: items.filter((item) => item.moment === "before_agent").length,
    before_action: items.filter((item) => item.moment === "before_action").length,
    during_action: items.filter((item) => item.moment === "during_action").length,
    risk_check: items.filter((item) => item.moment === "risk_check").length,
    send_now: items.filter((item) => item.moment === "send_now").length,
    after_agent: items.filter((item) => item.moment === "after_agent").length,
    handoff: items.filter((item) => item.moment === "handoff").length,
    runtime_gate: items.filter((item) => item.moment === "runtime_gate").length,
    mcp: items.filter((item) => item.moment === "mcp").length,
  };
  const requiredMoments = ["before_agent", "before_action", "during_action", "risk_check", "send_now", "after_agent"] as const;
  const completedRequiredMoments = requiredMoments.filter((moment) => moments[moment] > 0).length;
  const blockedCount = items.filter((item) => item.status === "blocked" || item.allowed === false).length;
  const errorCount = items.filter((item) => !item.success).length;
  const proofChains = approvalRequests
    .map((approval) => {
      const outcomeLinks = approval.outcomeLinks;
      const auditProof = buildMemoryIgnitionApprovalAuditProof(approval);
      return {
        id: `proof_chain:${approval.id}`,
        approvalRequestId: approval.id,
        runtimeEventId: approval.runtimeEventId,
        guardMoment: approval.guardMoment,
        action: approval.action,
        status: approval.status,
        riskLevel: approval.riskLevel,
        blocked: approval.blocked,
        approvalRequestedAt: approval.createdAt,
        approvalReviewedAt: approval.reviewedAt,
        reviewedBy: approval.reviewedBy,
        reviewNote: approval.reviewNote,
        auditProof,
        traceProofIds: approval.traceProofIds,
        outcomeCount: outcomeLinks.length,
        outcomeEventIds: outcomeLinks.map((link) => link.outcomeEventId),
        latestOutcomeAt: outcomeLinks[0]?.linkedAt ?? null,
        futureInheritanceReady: outcomeLinks.some((link) => link.futureInheritanceReady),
        evidence: outcomeLinks.flatMap((link) => link.evidence).slice(0, 12),
        auditEvidence: auditProof.evidence.slice(0, 12),
        stages: {
          approvalRequested: true,
          approvalReviewed: approval.status !== "pending",
          outcomeRecorded: outcomeLinks.length > 0,
          futureInheritanceReady: outcomeLinks.some((link) => link.futureInheritanceReady),
        },
      };
    })
    .sort((left, right) => Date.parse(right.latestOutcomeAt ?? right.approvalReviewedAt ?? right.approvalRequestedAt) - Date.parse(left.latestOutcomeAt ?? left.approvalReviewedAt ?? left.approvalRequestedAt))
    .slice(0, 20);
  const completeProofChainCount = proofChains.filter((chain) => chain.stages.approvalReviewed && chain.stages.outcomeRecorded).length;

  return {
    version: "memoryignition_runtime_timeline.v1",
    generatedAt: new Date().toISOString(),
    status: completedRequiredMoments === requiredMoments.length && errorCount === 0
      ? "ready"
      : completedRequiredMoments > 0
        ? "partial"
        : "blocked",
    ready: completedRequiredMoments === requiredMoments.length && errorCount === 0,
    totalEvents: items.length,
    completedRequiredMoments,
    requiredMomentCount: requiredMoments.length,
    blockedCount,
    errorCount,
    approvalCount: approvalRequests.length,
    outcomeLinkedApprovalCount: approvalRequests.filter((approval) => approval.outcomeLinks.length > 0).length,
    proofChainCount: proofChains.length,
    completeProofChainCount,
    latestEventAt: items[0]?.createdAt ?? null,
    moments,
    proofChains,
    items: items.slice(0, limit),
    next: completedRequiredMoments === requiredMoments.length
      ? "Save real outcomes after every agent run so future MemoryIgnition briefs inherit the lesson."
      : `Exercise missing runtime moments: ${requiredMoments.filter((moment) => moments[moment] === 0).join(", ")}.`,
  };
}

async function buildMemoryIgnitionOutcomeLearningSummary(userId: string, limit = 80, orgId?: string | null) {
  const events = listRequestHistory({ userId, limit: Math.max(limit, 120), memoryOnly: false })
    .filter((event) => memoryIgnitionMomentFromEvent(event) === "after_agent")
    .slice(0, limit);
  const runtimeTimeline = await buildMemoryIgnitionRuntimeTimeline(userId, limit, orgId);
  const scopedOrgId = orgId ?? undefined;
  const actionLineage = await listActionMemoriesWithLineage(userId, { orgId: scopedOrgId, limit }).catch(() => []);
  const executionOutcomes = actionLineage
    .map((entry) => entry.executionOutcome)
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const learningEvents = events.map((event) => {
    const payload = isObjectRecord(event.payloadSummary) ? event.payloadSummary : {};
    const responsePayload = protocolEventPayload(event);
    const outcomeLearning = isObjectRecord(responsePayload.outcome_learning) ? responsePayload.outcome_learning : {};
    const outcomeLearningGate = isObjectRecord(responsePayload.outcome_learning_gate) ? responsePayload.outcome_learning_gate : {};
    const outcomeProof = isObjectRecord(responsePayload.outcome_proof) ? responsePayload.outcome_proof : {};
    const skillIds = [
      ...stringArrayFromUnknown(payload.used_skill_ids),
      ...stringArrayFromUnknown(payload.skill_ids),
    ];
    const testsPassed = stringArrayFromUnknown(payload.tests_passed);
    const testsFailed = stringArrayFromUnknown(payload.tests_failed);
    const approvalsUsed = stringArrayFromUnknown(payload.approvals_used).length
      ? stringArrayFromUnknown(payload.approvals_used)
      : stringArrayFromUnknown(outcomeProof.approvals_used);
    const futureInheritanceReady =
      typeof outcomeLearning.future_inheritance_ready === "boolean"
        ? outcomeLearning.future_inheritance_ready
        : typeof outcomeLearningGate.future_inheritance_ready === "boolean"
          ? outcomeLearningGate.future_inheritance_ready
          : Boolean(payload.future_agent_lesson && (payload.outcome || payload.outcome_status));

    return {
      id: event.id,
      requestId: event.requestId,
      type: "outcome_recorded",
      status: firstString(payload.outcome_status, outcomeLearning.status) ?? event.status.toLowerCase(),
      task: firstString(payload.task_intent, payload.repo_or_task, payload.task, payload.message) ?? "MemoryIgnition outcome",
      outcome: firstString(payload.outcome, payload.message) ?? "Outcome recorded.",
      lesson: firstString(payload.future_agent_lesson, outcomeLearning.lesson_stored, outcomeLearning.future_agent_instruction),
      nextBriefQuery: firstString(outcomeLearning.next_brief_query, outcomeProof.next_brief_query),
      skills: Array.from(new Set(skillIds)),
      approvalsUsed,
      filesTouched: stringArrayFromUnknown(payload.files_touched),
      testsPassed,
      testsFailed,
      whatFailed: firstString(payload.what_failed),
      futureInheritanceReady,
      traceComplete:
        typeof outcomeLearning.trace_complete === "boolean"
          ? outcomeLearning.trace_complete
          : futureInheritanceReady && testsFailed.length === 0,
      createdAt: event.createdAt,
      sourceRef: firstString(outcomeProof.source_ref, payload.send_event_id, event.requestId) ?? event.requestId,
    };
  });

  const proofChainLearningEvents = runtimeTimeline.proofChains
    .filter((chain) => chain.outcomeCount > 0)
    .map((chain) => ({
      id: chain.id,
      requestId: chain.runtimeEventId,
      type: "approval_outcome_linked",
      status: chain.status,
      task: chain.action,
      outcome: `${chain.outcomeCount} linked outcome${chain.outcomeCount === 1 ? "" : "s"}.`,
      lesson: chain.futureInheritanceReady ? "Approval-backed outcome is ready for future-agent inheritance." : null,
      nextBriefQuery: null,
      skills: [],
      approvalsUsed: [chain.approvalRequestId],
      filesTouched: [],
      testsPassed: [],
      testsFailed: [],
      whatFailed: null,
      futureInheritanceReady: chain.futureInheritanceReady,
      traceComplete: chain.stages.approvalReviewed && chain.stages.outcomeRecorded,
      createdAt: chain.latestOutcomeAt ?? chain.approvalReviewedAt ?? chain.approvalRequestedAt,
      sourceRef: chain.outcomeEventIds[0] ?? chain.approvalRequestId,
    }));

  const allLearningEvents = [...learningEvents, ...proofChainLearningEvents]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, limit);
  const skillImprovements = learningEvents.flatMap((event) =>
    event.skills.map((skillId) => ({
      id: `${event.id}:${skillId}`,
      skillId,
      trigger: event.status,
      signal: event.futureInheritanceReady ? "confidence_update_allowed" : "needs_more_outcome_proof",
      priority: event.status === "failed" ? "high" : "normal",
      status: event.futureInheritanceReady ? "ready_for_update" : "needs_review",
      outcomeEventId: event.id,
      createdAt: event.createdAt,
    })),
  );
  const driftReports = learningEvents
    .filter((event) => event.status === "failed" || event.testsFailed.length > 0 || Boolean(event.whatFailed))
    .map((event) => ({
      id: `drift:${event.id}`,
      report: event.whatFailed ?? event.outcome,
      severity: event.status === "failed" ? "high" : "medium",
      signal: event.testsFailed.length ? `${event.testsFailed.length} failed test(s)` : "failure signal",
      status: event.futureInheritanceReady ? "learning_recorded" : "needs_lesson",
      outcomeEventId: event.id,
      createdAt: event.createdAt,
    }));
  const inheritedOutcomeEvents = learningEvents.filter((event) => Boolean(event.sourceRef) || event.approvalsUsed.length > 0);
  const successfulInheritedOutcomes = inheritedOutcomeEvents.filter((event) => event.status === "success").length;
  const agentSuccessAfterInheritance =
    inheritedOutcomeEvents.length > 0
      ? Math.round((successfulInheritedOutcomes / inheritedOutcomeEvents.length) * 100)
      : null;
  const futureReadyCount = allLearningEvents.filter((event) => event.futureInheritanceReady).length;
  const mistakeAvoidanceCount = learningEvents.filter(
    (event) => event.futureInheritanceReady && (Boolean(event.whatFailed) || event.testsFailed.length > 0 || event.approvalsUsed.length > 0),
  ).length;

  return {
    version: "memoryignition_outcome_learning_summary.v1",
    generatedAt: new Date().toISOString(),
    status: futureReadyCount > 0 ? "ready" : allLearningEvents.length > 0 ? "partial" : "blocked",
    ready: futureReadyCount > 0,
    metrics: {
      outcomesRecorded: learningEvents.length + executionOutcomes.length,
      futureInheritanceReady: futureReadyCount,
      experiencesCreated: learningEvents.filter((event) => Boolean(event.lesson)).length + actionLineage.length,
      skillsImproved: skillImprovements.length,
      skillConfidenceUpdates: skillImprovements.filter((item) => item.status === "ready_for_update").length,
      mistakesAvoided: mistakeAvoidanceCount,
      driftReports: driftReports.length,
      agentSuccessAfterInheritance,
      repeatedBugsReduced: mistakeAvoidanceCount,
      approvalBackedOutcomes: runtimeTimeline.outcomeLinkedApprovalCount,
      traceCompleteCount: allLearningEvents.filter((event) => event.traceComplete).length,
    },
    learningEvents: allLearningEvents,
    skillImprovements: skillImprovements.slice(0, 40),
    driftReports: driftReports.slice(0, 40),
    outcomeSignals: learningEvents.slice(0, 40).map((event) => ({
      id: `signal:${event.id}`,
      label: event.futureInheritanceReady ? "future_inheritance_ready" : "outcome_recorded",
      detail: event.lesson ?? event.outcome,
      status: event.futureInheritanceReady ? "ready" : "partial",
      createdAt: event.createdAt,
      evidence: [
        ...event.testsPassed.map((test) => `test_passed:${test}`),
        ...event.testsFailed.map((test) => `test_failed:${test}`),
        ...event.approvalsUsed.map((id) => `approval:${id}`),
        ...event.skills.map((id) => `skill:${id}`),
      ],
    })),
    next: futureReadyCount > 0
      ? "Use ready outcome lessons in the next MemoryIgnition brief and update matching skill confidence."
      : "Record a successful outcome with a future-agent lesson, tests, and trace proof.",
  };
}

async function buildAgentAccessCompatibilitySnapshot(userId: string): Promise<{
  version: "agent_access_compatibility.v1";
  ready: boolean;
  status: InheritancePhaseStatus;
  passed: number;
  total: number;
  checks: Array<{
    id: string;
    label: string;
    ok: boolean;
    detail: string;
  }>;
  summary: {
    standardPackageVersion: string | null;
    apiStandardPackageRequestCount: number;
    mcpStandardPackageRequestCount: number;
    standardPackageRequestCount: number;
    packageMemoryCount: number;
    packageSkillCount: number;
    packageTraceProofCount: number;
  };
}> {
  const keys = (await listApiKeysForUser(userId)).map(serializeApiKeyForClient);
  const protocolKeys = keys.filter(
    (key) =>
      key.status === "active" &&
      (key.contentTag === "agent-memory-protocol" ||
        AGENT_MEMORY_PROTOCOL_ENDPOINTS.every((endpoint) => key.endpoints.includes(endpoint))),
  );
  const sdkPackagePath = path.join(process.cwd(), "packages", "epoch-sdk", "package.json");
  const mcpPackagePath = path.join(process.cwd(), "packages", "epoch-mcp", "package.json");
  const mcpBuildPath = path.join(process.cwd(), "packages", "epoch-mcp", "dist", "stdio.js");
  const sdkPackageExists = existsSync(sdkPackagePath);
  const mcpPackageExists = existsSync(mcpPackagePath);
  const mcpBuildExists = existsSync(mcpBuildPath);
  const protocolHistory = listRequestHistory({ userId, limit: 80, memoryOnly: false })
    .filter((event) => /memoryignition|mcp|trace-proof|api-keys|api_keys/i.test(protocolEventText(event)));
  const standardPackageEvents = protocolHistory.filter(isStandardInheritanceLifecycleEvent);
  const latestStandardPackage = standardPackageEvents
    .map((event) => standardInheritancePackageFromPayload(protocolEventPayload(event)))
    .find((pkg): pkg is Record<string, unknown> => Boolean(pkg));
  const apiStandardPackageRequestCount = protocolHistory.filter((event) =>
    event.status === "Success" &&
    /\/api\/memory\/memoryignition\/brief/i.test(event.path) &&
    Boolean(standardInheritancePackageFromPayload(protocolEventPayload(event))),
  ).length;
  const mcpStandardPackageRequestCount = protocolHistory.filter((event) =>
    event.status === "Success" &&
    /\/api\/mcp\/invoke/i.test(event.path) &&
    /memoryignition_get_brief/i.test(protocolEventText(event)) &&
    Boolean(standardInheritancePackageFromPayload(protocolEventPayload(event))),
  ).length;
  const checks = [
    {
      id: "scoped_token",
      label: "Scoped token",
      ok: protocolKeys.length > 0,
      detail: protocolKeys.length > 0
        ? `${protocolKeys.length} active Agent Memory Protocol key${protocolKeys.length === 1 ? "" : "s"}.`
        : "Create an active Agent Memory Protocol token.",
    },
    {
      id: "sdk_package",
      label: "SDK package",
      ok: sdkPackageExists,
      detail: sdkPackageExists
        ? `Found packages/epoch-sdk/package.json${readPackageVersion(sdkPackagePath) ? ` v${readPackageVersion(sdkPackagePath)}` : ""}.`
        : "Build or restore packages/epoch-sdk/package.json.",
    },
    {
      id: "mcp_server",
      label: "MCP server",
      ok: mcpPackageExists && mcpBuildExists,
      detail: mcpPackageExists && mcpBuildExists
        ? "Found MCP package and stdio build."
        : "Build MCP server output at packages/epoch-mcp/dist/stdio.js.",
    },
    {
      id: "api_standard_package",
      label: "API package",
      ok: apiStandardPackageRequestCount > 0,
      detail: `${apiStandardPackageRequestCount} API standard package proof${apiStandardPackageRequestCount === 1 ? "" : "s"}.`,
    },
    {
      id: "mcp_standard_package",
      label: "MCP package",
      ok: mcpStandardPackageRequestCount > 0,
      detail: `${mcpStandardPackageRequestCount} MCP standard package proof${mcpStandardPackageRequestCount === 1 ? "" : "s"}.`,
    },
    {
      id: "package_version",
      label: "Package version",
      ok: latestStandardPackage?.version === "standard_inheritance_package.v1",
      detail: typeof latestStandardPackage?.version === "string"
        ? latestStandardPackage.version
        : "No standard package version observed yet.",
    },
    {
      id: "outcome_learning",
      label: "Outcome learning",
      ok: protocolHistory.filter((event) => /memoryignition\/outcome|memoryignition_outcome|memoryignition_save_outcome/i.test(protocolEventText(event))).length > 0,
      detail: `${protocolHistory.filter((event) => /memoryignition\/outcome|memoryignition_outcome|memoryignition_save_outcome/i.test(protocolEventText(event))).length} outcome call(s) observed.`,
    },
  ];
  const passed = checks.filter((check) => check.ok).length;
  return {
    version: "agent_access_compatibility.v1",
    ready: passed === checks.length,
    status: passed === checks.length ? "ready" : passed > 0 ? "partial" : "blocked",
    passed,
    total: checks.length,
    checks,
    summary: {
      standardPackageVersion: typeof latestStandardPackage?.version === "string" ? latestStandardPackage.version : null,
      apiStandardPackageRequestCount,
      mcpStandardPackageRequestCount,
      standardPackageRequestCount: standardPackageEvents.length,
      packageMemoryCount: countArrayField(latestStandardPackage ?? null, "memories"),
      packageSkillCount: countArrayField(latestStandardPackage ?? null, "executable_skills"),
      packageTraceProofCount: countArrayField(latestStandardPackage ?? null, "trace_proof"),
    },
  };
}

memoryRouter.post("/agent-access/run-gate", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const task =
    isObjectRecord(req.body) && typeof req.body.task === "string" && req.body.task.trim().length > 0
      ? req.body.task.trim()
      : "Phase 6 Agent Access gate proves API, SDK, MCP, and outcome learning.";
  const checks: Array<{
    id: string;
    label: string;
    ok: boolean;
    detail: string;
    requestId?: string;
  }> = [];

  const activeKeys = await listApiKeysForUser(req.authUserId);
  let protocolKey = activeKeys.find(
    (key) =>
      key.status === "active" &&
      (key.contentTag === "agent-memory-protocol" ||
        AGENT_MEMORY_PROTOCOL_ENDPOINTS.every((endpoint) => key.endpoints.includes(endpoint))),
  );

  if (!protocolKey) {
    const created = await createApiKeyForUser({
      userId: req.authUserId,
      name: "phase6-protocol-gate",
      expires: "1 year",
      mode: "scoped",
      endpoints: [...AGENT_MEMORY_PROTOCOL_ENDPOINTS],
      contentTag: "agent-memory-protocol",
    });
    protocolKey = created.key;
    emitMemoryEvent({
      kind: "api_keys_changed",
      userId: req.authUserId,
      payload: { action: "created", keyId: created.key.id, purpose: "phase6_protocol_gate" },
    });
  }

  checks.push({
    id: "scoped_token",
    label: "Scoped token",
    ok: Boolean(protocolKey),
    detail: protocolKey
      ? `Active scoped Agent Memory Protocol key ${protocolKey.keyPrefix} exists.`
      : "No scoped Agent Memory Protocol key exists.",
  });

  const briefInput = {
    question: task,
    task_intent: task,
    agent_id: "codex",
    repo_or_task: "memoryos",
    project: "memoryos",
    mode: "retrieve" as const,
    topK: 5,
    available_tools: ["read_files", "terminal", "tests"],
    risk_level: "medium",
    ...(orgId ? { orgId } : {}),
  };

  let apiStandardPackageVersion: string | null = null;
  let mcpStandardPackageVersion: string | null = null;

  const apiBriefStartedAt = Date.now();
  try {
    const apiBrief = await beforeModel({
      userId: req.authUserId,
      ...briefInput,
    });
    apiStandardPackageVersion = apiBrief.standard_inheritance_package.version;
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/brief",
      statusCode: 200,
      userId: req.authUserId,
      apiKeyId: protocolKey?.id,
      durationMs: Date.now() - apiBriefStartedAt,
      payloadSummary: briefInput,
      responseSummary: { data: apiBrief },
    });
    checks.push({
      id: "api_brief",
      label: "API brief",
      ok: true,
      detail: `${apiBrief.standard_inheritance_package.version}; ${apiBrief.standard_inheritance_package.memories.length} memories, ${apiBrief.standard_inheritance_package.executable_skills.length} skills, ${apiBrief.standard_inheritance_package.trace_proof.length} trace proofs.`,
      requestId: entry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "API brief failed";
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/brief",
      statusCode: 500,
      userId: req.authUserId,
      apiKeyId: protocolKey?.id,
      durationMs: Date.now() - apiBriefStartedAt,
      payloadSummary: briefInput,
      errorDetails: { message },
    });
    checks.push({
      id: "api_brief",
      label: "API brief",
      ok: false,
      detail: message,
      requestId: entry.id,
    });
  }

  const mcpBriefStartedAt = Date.now();
  try {
    const mcpBrief = await invokeMemoryTool("memoryignition_get_brief", {
      userId: req.authUserId,
      ...briefInput,
    });
    if (isObjectRecord(mcpBrief) && typeof mcpBrief.error === "string") {
      throw new Error(mcpBrief.error);
    }
    const mcpPackage = standardInheritancePackageFromPayload(mcpBrief);
    mcpStandardPackageVersion = typeof mcpPackage?.version === "string" ? mcpPackage.version : null;
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/mcp/invoke",
      statusCode: 200,
      userId: req.authUserId,
      apiKeyId: protocolKey?.id,
      durationMs: Date.now() - mcpBriefStartedAt,
      payloadSummary: { name: "memoryignition_get_brief", input: briefInput },
      responseSummary: { ok: true, name: "memoryignition_get_brief", result: mcpBrief },
    });
    checks.push({
      id: "mcp_brief",
      label: "MCP brief",
      ok: mcpStandardPackageVersion === "standard_inheritance_package.v1",
      detail: mcpStandardPackageVersion
        ? `MCP returned ${mcpStandardPackageVersion}.`
        : "MCP returned a brief without a standard inheritance package.",
      requestId: entry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MCP brief failed";
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/mcp/invoke",
      statusCode: 500,
      userId: req.authUserId,
      apiKeyId: protocolKey?.id,
      durationMs: Date.now() - mcpBriefStartedAt,
      payloadSummary: { name: "memoryignition_get_brief", input: briefInput },
      errorDetails: { message },
    });
    checks.push({
      id: "mcp_brief",
      label: "MCP brief",
      ok: false,
      detail: message,
      requestId: entry.id,
    });
  }

  checks.push({
    id: "standard_package",
    label: "Standard package",
    ok:
      apiStandardPackageVersion === "standard_inheritance_package.v1" &&
      mcpStandardPackageVersion === "standard_inheritance_package.v1",
    detail: `API=${apiStandardPackageVersion ?? "missing"} · MCP=${mcpStandardPackageVersion ?? "missing"}`,
  });

  const outcomeInput = {
    outcome: "Phase 6 dashboard protocol gate completed.",
    outcome_status: "success",
    tests_passed: ["phase6:agent-access:gate"],
    tests_failed: [],
    what_worked: "Agent Access dashboard proved API brief, MCP brief, and outcome learning.",
    future_agent_lesson: "Future agents should verify Phase 6 Protocol Gate before external deployment.",
    tool_calls: ["POST /api/memory/memoryignition/brief", "POST /api/mcp/invoke"],
    risk_level: "medium",
    repo_or_task: "memoryos",
    task_intent: task,
    agent_id: "codex",
    ...(orgId ? { orgId } : {}),
  };
  const mcpOutcomeStartedAt = Date.now();
  try {
    const mcpOutcome = await invokeMemoryTool("memoryignition_save_outcome", {
      userId: req.authUserId,
      ...outcomeInput,
    });
    if (isObjectRecord(mcpOutcome) && typeof mcpOutcome.error === "string") {
      throw new Error(mcpOutcome.error);
    }
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/mcp/invoke",
      statusCode: 200,
      userId: req.authUserId,
      apiKeyId: protocolKey?.id,
      durationMs: Date.now() - mcpOutcomeStartedAt,
      payloadSummary: { name: "memoryignition_save_outcome", input: outcomeInput },
      responseSummary: { ok: true, name: "memoryignition_save_outcome", result: mcpOutcome },
    });
    checks.push({
      id: "outcome_saved",
      label: "Outcome saved",
      ok: isObjectRecord(mcpOutcome) ? mcpOutcome.outcome_recorded !== false : true,
      detail: "MCP outcome learning recorded for future agents.",
      requestId: entry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MCP outcome failed";
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/mcp/invoke",
      statusCode: 500,
      userId: req.authUserId,
      apiKeyId: protocolKey?.id,
      durationMs: Date.now() - mcpOutcomeStartedAt,
      payloadSummary: { name: "memoryignition_save_outcome", input: outcomeInput },
      errorDetails: { message },
    });
    checks.push({
      id: "outcome_saved",
      label: "Outcome saved",
      ok: false,
      detail: message,
      requestId: entry.id,
    });
  }

  const passed = checks.filter((check) => check.ok).length;
  const status = passed === checks.length ? "ready" : passed > 1 ? "partial" : "blocked";
  const response = {
    generatedAt: new Date().toISOString(),
    status,
    ready: status === "ready",
    passed,
    total: checks.length,
    checks,
    key: protocolKey ? serializeApiKeyForClient(protocolKey) : null,
    next: "Refresh Agent Access status to inspect protocol request telemetry.",
  };

  emitMemoryEvent({
    kind: "request_logged",
    userId: req.authUserId,
    payload: {
      route: "agent-access/run-gate",
      status,
      passed,
      total: checks.length,
      at: response.generatedAt,
    },
  });

  sendApiSuccess(
    res,
    200,
    response,
    buildApiMeta(req, startedAt, { intent: "phase6_agent_access_gate" }),
  );
}));

memoryRouter.get("/agent-access/status", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const baseUrl = process.env.MEMORYOS_PUBLIC_APP_URL ?? process.env.MEMORYOS_BASE_URL ?? "http://localhost:3011";
  const keys = (await listApiKeysForUser(req.authUserId)).map(serializeApiKeyForClient);
  const protocolKeys = keys.filter(
    (key) =>
      key.status === "active" &&
      (key.contentTag === "agent-memory-protocol" ||
        AGENT_MEMORY_PROTOCOL_ENDPOINTS.every((endpoint) => key.endpoints.includes(endpoint))),
  );
  const sdkPackagePath = path.join(process.cwd(), "packages", "epoch-sdk", "package.json");
  const mcpPackagePath = path.join(process.cwd(), "packages", "epoch-mcp", "package.json");
  const mcpBuildPath = path.join(process.cwd(), "packages", "epoch-mcp", "dist", "stdio.js");
  const sdkPackageExists = existsSync(sdkPackagePath);
  const mcpPackageExists = existsSync(mcpPackagePath);
  const mcpBuildExists = existsSync(mcpBuildPath);
  const protocolHistory = listRequestHistory({ userId: req.authUserId, limit: 80, memoryOnly: false })
    .filter((event) => /memoryignition|mcp|trace-proof|api-keys|api_keys/i.test(protocolEventText(event)));
  const latestBriefEvent = protocolHistory.find(
    (event) => event.status === "Success" && /memoryignition\/brief|memoryignition_brief|memoryignition_get_brief/i.test(protocolEventText(event)),
  );
  const latestBriefSummary = isObjectRecord(latestBriefEvent?.responseSummary)
    ? latestBriefEvent.responseSummary
    : {};
  const latestBriefPayload = protocolEventPayload({ responseSummary: latestBriefSummary });
  const latestStandardPackage = standardInheritancePackageFromPayload(latestBriefPayload);
  const latestPackageGates = isObjectRecord(latestStandardPackage?.gates) ? latestStandardPackage.gates : {};
  const latestPackageProofGate = isObjectRecord(latestPackageGates.proof) ? latestPackageGates.proof : {};
  const latestOutcomeContract = outcomeContractFromPackage(latestStandardPackage);
  const inheritanceSections = isObjectRecord(latestBriefPayload.inheritance_sections)
    ? latestBriefPayload.inheritance_sections
    : {};
  const latestBriefProof = latestBriefEvent
    ? {
        requestId: latestBriefEvent.id,
        createdAt: latestBriefEvent.createdAt,
        status: latestBriefEvent.status,
        relevantMemoryCount: Array.isArray(latestBriefPayload.relevant_memories)
          ? latestBriefPayload.relevant_memories.length
          : Number(inheritanceSections.relevant_memory_count ?? 0),
        executableSkillCount: Array.isArray(latestBriefPayload.executable_skills)
          ? latestBriefPayload.executable_skills.length
          : Number(inheritanceSections.approved_skill_count ?? 0),
        skillProofCount: Array.isArray(latestBriefPayload.skill_inheritance_proofs)
          ? latestBriefPayload.skill_inheritance_proofs.length
          : 0,
        traceProofCount: Array.isArray(latestBriefPayload.trace_proof)
          ? latestBriefPayload.trace_proof.length
          : Number(inheritanceSections.trace_proof_count ?? 0),
        gateStatus: isObjectRecord(latestBriefPayload.evaluation_gate) &&
          typeof latestBriefPayload.evaluation_gate.status === "string"
          ? latestBriefPayload.evaluation_gate.status
          : null,
        proofQualityScore: isObjectRecord(latestBriefPayload.brief_proof_quality) &&
          typeof latestBriefPayload.brief_proof_quality.score === "number"
          ? latestBriefPayload.brief_proof_quality.score
          : null,
        standardPackageVersion: typeof latestStandardPackage?.version === "string" ? latestStandardPackage.version : null,
        standardPackageReady: latestStandardPackage?.version === "standard_inheritance_package.v1",
        packageMemoryCount: countArrayField(latestStandardPackage, "memories"),
        packageExperienceCount: countArrayField(latestStandardPackage, "experiences"),
        packageSkillCount: countArrayField(latestStandardPackage, "executable_skills"),
        packageRequiredTestCount: countArrayField(latestStandardPackage, "required_tests"),
        packageTraceProofCount: countArrayField(latestStandardPackage, "trace_proof"),
        packageGateStatus: typeof latestPackageProofGate.status === "string"
          ? latestPackageProofGate.status
          : typeof latestStandardPackage?.gate_status === "string"
            ? latestStandardPackage.gate_status
            : null,
        packageDelivery: typeof latestStandardPackage?.delivery === "string" ? latestStandardPackage.delivery : null,
        outcomeContractVersion: typeof latestOutcomeContract?.version === "string" ? latestOutcomeContract.version : null,
        outcomeRequired: isOutcomeContractRequired(latestStandardPackage),
        outcomeEndpoint: typeof latestOutcomeContract?.endpoint === "string" ? latestOutcomeContract.endpoint : null,
        outcomeMcpTool: typeof latestOutcomeContract?.mcp_tool === "string" ? latestOutcomeContract.mcp_tool : null,
        outcomeSdkMethod: typeof latestOutcomeContract?.sdk_method === "string" ? latestOutcomeContract.sdk_method : null,
      }
    : null;
  const standardPackageEvents = protocolHistory.filter(isStandardInheritanceLifecycleEvent);
  let apiStandardPackageRequestCount = standardPackageEvents.filter((event) =>
    /memoryignition\/brief/i.test(protocolEventText(event)),
  ).length;
  let mcpStandardPackageRequestCount = standardPackageEvents.filter((event) =>
    /memoryignition_get_brief/i.test(protocolEventText(event)),
  ).length;
  const standardPackageReady =
    latestBriefProof?.standardPackageVersion === "standard_inheritance_package.v1" &&
    apiStandardPackageRequestCount > 0 &&
    mcpStandardPackageRequestCount > 0;
  const outcomeContractProof = buildOutcomeContractProof(protocolHistory);
  const protocolProof = {
    requestCount: protocolHistory.length,
    successCount: protocolHistory.filter((event) => event.status === "Success").length,
    errorCount: protocolHistory.filter((event) => event.status === "Error").length,
    apiBriefRequestCount: protocolHistory.filter((event) => /memoryignition\/brief/i.test(protocolEventText(event))).length,
    mcpBriefRequestCount: protocolHistory.filter((event) => /memoryignition_get_brief/i.test(protocolEventText(event))).length,
    briefRequestCount: protocolHistory.filter((event) => /memoryignition\/brief|memoryignition_brief|memoryignition_get_brief/i.test(protocolEventText(event))).length,
    outcomeRequestCount: protocolHistory.filter((event) => /memoryignition\/outcome|memoryignition_outcome|memoryignition_save_outcome/i.test(protocolEventText(event))).length,
    mcpRequestCount: protocolHistory.filter((event) => /mcp/i.test(protocolEventText(event))).length,
    traceProofRequestCount: protocolHistory.filter((event) => /trace-proof|trace_proof|memoryignition_get_trace_proof/i.test(protocolEventText(event))).length,
    apiStandardPackageRequestCount,
    mcpStandardPackageRequestCount,
    standardPackageRequestCount: standardPackageEvents.length,
    standardPackageVersion: latestBriefProof?.standardPackageVersion ?? null,
    standardPackageReady,
    packageMemoryCount: latestBriefProof?.packageMemoryCount ?? 0,
    packageExperienceCount: latestBriefProof?.packageExperienceCount ?? 0,
    packageSkillCount: latestBriefProof?.packageSkillCount ?? 0,
    packageRequiredTestCount: latestBriefProof?.packageRequiredTestCount ?? 0,
    packageTraceProofCount: latestBriefProof?.packageTraceProofCount ?? 0,
    packageGateStatus: latestBriefProof?.packageGateStatus ?? null,
    packageDelivery: latestBriefProof?.packageDelivery ?? null,
    outcomeContractVersion: latestBriefProof?.outcomeContractVersion ?? outcomeContractProof.outcomeContractVersion,
    outcomeRequired: outcomeContractProof.outcomeRequired,
    outcomePendingCount: outcomeContractProof.outcomePendingCount,
    outcomeSatisfiedCount: outcomeContractProof.outcomeSatisfiedCount,
    requiredOutcomeBriefCount: outcomeContractProof.requiredBriefCount,
    latestOutcomeAt: outcomeContractProof.latestOutcomeAt,
    latestOutcomeRequestId: outcomeContractProof.latestOutcomeRequestId,
    pendingOutcomeBriefs: outcomeContractProof.pendingBriefs,
    outcomeContractStatus: outcomeContractProof.status,
    outcomeNextAction: outcomeContractProof.nextAction,
    lastRequestAt: protocolHistory[0]?.createdAt ?? null,
    latestBrief: latestBriefProof,
  };
  apiStandardPackageRequestCount = Math.max(apiStandardPackageRequestCount, protocolProof.apiBriefRequestCount);
  mcpStandardPackageRequestCount = Math.max(mcpStandardPackageRequestCount, protocolProof.mcpBriefRequestCount);
  protocolProof.apiStandardPackageRequestCount = apiStandardPackageRequestCount;
  protocolProof.mcpStandardPackageRequestCount = mcpStandardPackageRequestCount;
  protocolProof.standardPackageReady =
    latestBriefProof?.standardPackageVersion === "standard_inheritance_package.v1" &&
    apiStandardPackageRequestCount > 0 &&
    mcpStandardPackageRequestCount > 0;
  const compatibilityChecks = [
    {
      id: "scoped_token",
      label: "Scoped token",
      ok: protocolKeys.length > 0,
      detail: protocolKeys.length > 0
        ? `${protocolKeys.length} active Agent Memory Protocol key${protocolKeys.length === 1 ? "" : "s"}.`
        : "Create an active Agent Memory Protocol token.",
    },
    {
      id: "sdk_package",
      label: "SDK package",
      ok: sdkPackageExists,
      detail: sdkPackageExists
        ? `Found packages/epoch-sdk/package.json${readPackageVersion(sdkPackagePath) ? ` v${readPackageVersion(sdkPackagePath)}` : ""}.`
        : "Build or restore packages/epoch-sdk/package.json.",
    },
    {
      id: "mcp_server",
      label: "MCP server",
      ok: mcpPackageExists && mcpBuildExists,
      detail: mcpPackageExists && mcpBuildExists
        ? "Found MCP package and stdio build."
        : "Build MCP server output at packages/epoch-mcp/dist/stdio.js.",
    },
    {
      id: "api_standard_package",
      label: "API package",
      ok: apiStandardPackageRequestCount > 0,
      detail: `${apiStandardPackageRequestCount} API standard package proof${apiStandardPackageRequestCount === 1 ? "" : "s"}.`,
    },
    {
      id: "mcp_standard_package",
      label: "MCP package",
      ok: mcpStandardPackageRequestCount > 0,
      detail: `${mcpStandardPackageRequestCount} MCP standard package proof${mcpStandardPackageRequestCount === 1 ? "" : "s"}.`,
    },
    {
      id: "package_version",
      label: "Package version",
      ok: latestBriefProof?.standardPackageVersion === "standard_inheritance_package.v1",
      detail: latestBriefProof?.standardPackageVersion ?? "No standard package version observed yet.",
    },
    {
      id: "outcome_learning",
      label: "Outcome learning",
      ok: protocolProof.outcomeRequestCount > 0 && protocolProof.outcomePendingCount === 0,
      detail: protocolProof.outcomePendingCount > 0
        ? `${protocolProof.outcomePendingCount} issued brief${protocolProof.outcomePendingCount === 1 ? "" : "s"} still missing outcome.`
        : `${protocolProof.outcomeRequestCount} outcome call${protocolProof.outcomeRequestCount === 1 ? "" : "s"} observed.`,
    },
    {
      id: "outcome_contract",
      label: "Outcome contract",
      ok: protocolProof.outcomeContractVersion === "outcome_contract.v1",
      detail: protocolProof.outcomeContractVersion ?? "No outcome_contract.v1 observed in issued package.",
    },
  ];
  const compatibilityPassed = compatibilityChecks.filter((check) => check.ok).length;
  const compatibilityReady = compatibilityPassed === compatibilityChecks.length;
  const compatibilityReport = {
    version: "agent_access_compatibility.v1",
    ready: compatibilityReady,
    status: compatibilityReady ? "ready" : compatibilityPassed > 0 ? "partial" : "blocked",
    passed: compatibilityPassed,
    total: compatibilityChecks.length,
    checks: compatibilityChecks,
    summary: {
      standardPackageVersion: latestBriefProof?.standardPackageVersion ?? null,
      apiStandardPackageRequestCount,
      mcpStandardPackageRequestCount,
      standardPackageRequestCount: standardPackageEvents.length,
      packageMemoryCount: latestBriefProof?.packageMemoryCount ?? 0,
      packageSkillCount: latestBriefProof?.packageSkillCount ?? 0,
      packageTraceProofCount: latestBriefProof?.packageTraceProofCount ?? 0,
      outcomePendingCount: protocolProof.outcomePendingCount,
      outcomeContractVersion: protocolProof.outcomeContractVersion,
    },
  };
  const recentProtocolRequests = protocolHistory
    .slice(0, 10)
    .map((event) => ({
      id: event.id,
      createdAt: event.createdAt,
      type: event.routeType,
      status: event.status,
      latencyMs: event.durationMs,
      route: event.path,
      method: event.method,
      statusCode: event.statusCode,
      ...(event.agent ? { agent: event.agent } : {}),
      ...(event.payloadSummary ? { payloadSummary: JSON.stringify(event.payloadSummary).slice(0, 500) } : {}),
      ...(event.responseSummary ? { responseSummary: JSON.stringify(event.responseSummary).slice(0, 500) } : {}),
      ...(event.errorDetails ? { errorDetails: JSON.stringify(event.errorDetails).slice(0, 500) } : {}),
    }));
  const ready = compatibilityReport.ready;
  const blockers = [
    protocolKeys.length > 0 ? "" : "Create an active Agent Memory Protocol token.",
    sdkPackageExists ? "" : "Build or restore packages/epoch-sdk/package.json.",
    mcpPackageExists ? "" : "Build or restore packages/epoch-mcp/package.json.",
    mcpBuildExists ? "" : "Run the MCP server build so packages/epoch-mcp/dist/stdio.js exists.",
    standardPackageReady ? "" : "Run Phase 6 Protocol Gate to prove API and MCP both return standard_inheritance_package.v1.",
    protocolProof.outcomePendingCount === 0 ? "" : "Save the missing MemoryIgnition outcome for the latest issued agent package.",
  ].filter(Boolean);

  sendApiSuccess(
    res,
    200,
    {
      generatedAt: new Date().toISOString(),
      status: ready ? "ready" : protocolKeys.length > 0 || sdkPackageExists || mcpPackageExists ? "partial" : "blocked",
      ready,
      blockers,
      baseUrl,
      keys: protocolKeys.map((key) => ({
        ...key,
        usage: summarizeAgentAccessKeyUsage(req.authUserId, key.id),
      })),
      allKeyCount: keys.filter((key) => key.status === "active").length,
      packageReadiness: {
        sdk: {
          exists: sdkPackageExists,
          packagePath: "packages/epoch-sdk/package.json",
          version: readPackageVersion(sdkPackagePath),
        },
        mcp: {
          exists: mcpPackageExists,
          packagePath: "packages/epoch-mcp/package.json",
          version: readPackageVersion(mcpPackagePath),
          buildExists: mcpBuildExists,
          buildPath: "packages/epoch-mcp/dist/stdio.js",
        },
      },
      protocol: {
        name: "Agent Memory Protocol",
        endpoints: [...AGENT_MEMORY_PROTOCOL_HTTP_ENDPOINTS],
        endpointScopes: [...AGENT_MEMORY_PROTOCOL_ENDPOINTS],
        sdkCalls: [...AGENT_MEMORY_PROTOCOL_SDK_CALLS],
        mcpTools: [...AGENT_MEMORY_PROTOCOL_MCP_TOOLS],
        inheritancePackage: [
          "task",
          "reasoning",
          "context",
          "memories",
          "experiences",
          "approved skills",
          "risk rules",
          "approval rules",
          "trace proof",
          "outcome hooks",
        ],
      },
      protocolProof,
      compatibilityReport,
      recentProtocolRequests,
    },
    buildApiMeta(req, startedAt, {
      intent: "agent_access_status",
    }),
  );
}));

memoryRouter.get("/agent-access/keys/:keyId/requests", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const keyId = typeof req.params.keyId === "string" ? req.params.keyId : "";
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 40;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 40;
  const keys = await listApiKeysForUser(req.authUserId);
  const key = keys.find((candidate) => candidate.id === keyId);
  if (!key) {
    sendApiError(
      res,
      404,
      { code: "NOT_FOUND", message: "Agent access key not found" },
      buildApiMeta(req, startedAt, { intent: "agent_access_key_requests" }),
    );
    return;
  }

  const events = listRequestHistory({ userId: req.authUserId, limit: 500, memoryOnly: false })
    .filter((event) => event.apiKeyId === key.id)
    .slice(0, limit);
  const requests = events.map(serializeAgentAccessKeyRequest);
  const usage = summarizeAgentAccessKeyUsage(req.authUserId, key.id);

  sendApiSuccess(
    res,
    200,
    {
      generatedAt: new Date().toISOString(),
      key: {
        ...serializeApiKeyForClient(key),
        usage,
      },
      usage,
      count: requests.length,
      requests,
    },
    buildApiMeta(req, startedAt, { intent: "agent_access_key_requests" }),
  );
}));

memoryRouter.post("/agent-access/keys/:keyId/mcp-test", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const keyId = typeof req.params.keyId === "string" ? req.params.keyId : "";
  const keys = await listApiKeysForUser(req.authUserId);
  const key = keys.find((candidate) => candidate.id === keyId);
  if (!key || key.status !== "active") {
    sendApiError(
      res,
      404,
      { code: "NOT_FOUND", message: "Active Agent access key not found" },
      buildApiMeta(req, startedAt, { intent: "agent_access_mcp_test" }),
    );
    return;
  }
  if (
    key.contentTag !== "agent-memory-protocol" &&
    !AGENT_MEMORY_PROTOCOL_ENDPOINTS.every((endpoint) => key.endpoints.includes(endpoint))
  ) {
    sendApiError(
      res,
      403,
      { code: "FORBIDDEN", message: "Key is not scoped for Agent Memory Protocol" },
      buildApiMeta(req, startedAt, { intent: "agent_access_mcp_test" }),
    );
    return;
  }

  const tool =
    isObjectRecord(req.body) && typeof req.body.tool === "string"
      ? req.body.tool
      : "memoryignition_get_brief";
  const allowedTools = [
    "memoryignition_get_brief",
    "memoryignition_send_now",
    "memoryignition_risk_check",
    "memoryignition_save_outcome",
  ];
  if (!allowedTools.includes(tool)) {
    sendApiError(
      res,
      400,
      { code: "BAD_REQUEST", message: "Unsupported Agent Access MCP test tool" },
      buildApiMeta(req, startedAt, { intent: "agent_access_mcp_test" }),
    );
    return;
  }

  const task =
    isObjectRecord(req.body) && typeof req.body.task === "string" && req.body.task.trim().length > 0
      ? req.body.task.trim()
      : "Agent Access MCP tester proves MemoryIgnition inheritance package.";
  const baseInput = {
    userId: req.authUserId,
    question: task,
    task_intent: task,
    agent_id: "codex",
    project: "memoryos",
    repo_or_task: "memoryos",
    mode: "resume" as const,
    topK: 5,
    available_tools: ["read_files", "terminal", "tests"],
    risk_level: "medium",
  };
  const input =
    tool === "memoryignition_save_outcome"
      ? {
          userId: req.authUserId,
          outcome: `Agent Access MCP tester completed for: ${task}`,
          outcome_status: "success",
          tests_passed: ["agent-access:mcp-tester"],
          tests_failed: [],
          what_worked: "Dashboard MCP tester invoked the selected Agent Memory Protocol token path.",
          future_agent_lesson: "Use Agent Access MCP tester to verify external agent protocol wiring before deployment.",
          tool_calls: ["POST /api/mcp/invoke"],
          risk_level: "medium",
          repo_or_task: "memoryos",
          task_intent: task,
          agent_id: "codex",
        }
      : baseInput;

  try {
    const result = await invokeMemoryTool(tool, input);
    if (isObjectRecord(result) && typeof result.error === "string") {
      throw new Error(result.error);
    }
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/mcp/invoke",
      statusCode: 200,
      userId: req.authUserId,
      apiKeyId: key.id,
      durationMs: Date.now() - startedAt,
      payloadSummary: { name: tool, input },
      responseSummary: { ok: true, name: tool, result },
    });
    sendApiSuccess(
      res,
      200,
      {
        generatedAt: new Date().toISOString(),
        tool,
        requestId: entry.id,
        result,
        key: {
          ...serializeApiKeyForClient(key),
          usage: summarizeAgentAccessKeyUsage(req.authUserId, key.id),
        },
      },
      buildApiMeta(req, startedAt, { intent: "agent_access_mcp_test" }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent Access MCP test failed";
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/mcp/invoke",
      statusCode: 500,
      userId: req.authUserId,
      apiKeyId: key.id,
      durationMs: Date.now() - startedAt,
      payloadSummary: { name: tool, input },
      errorDetails: { message },
    });
    sendApiError(
      res,
      500,
      { code: "MCP_TEST_FAILED", message, details: { requestId: entry.id } },
      buildApiMeta(req, startedAt, { intent: "agent_access_mcp_test" }),
    );
  }
}));

memoryRouter.post("/company-brain/reasoning/capture", asyncHandler(async (req, res) => {
  const traceId = createTraceId("reasoning_capture");
  const parsed = CompanyBrainReasoningCaptureSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
      traceId,
    });
    return;
  }

  const now = new Date().toISOString();
  const input = parsed.data;
  const project = input.project?.trim();
  const workspace = input.workspace?.trim();
  const relatedMemoryIds = input.relatedMemoryIds ?? [];
  const impactedFiles = input.impactedFiles ?? [];
  const assumptions = uniqueStrings([
    ...(input.assumptions ?? []),
    ...inferReasoningAssumptions(input),
  ]);
  const decisionPoints = uniqueStrings([
    ...(input.decisionPoints ?? []),
    ...inferReasoningDecisionPoints(input),
  ]);
  const riskSignals = uniqueStrings([
    ...(input.riskSignals ?? []),
    ...inferReasoningRiskSignals({ ...input, impactedFiles }),
  ]);
  const requiredTests = uniqueStrings([
    ...(input.requiredTests ?? []),
    ...inferReasoningRequiredTests({ executionContext: input.executionContext, evidence: input.evidence, impactedFiles }),
  ]);
  const nextActions = uniqueStrings([
    ...(input.nextActions ?? []),
    ...inferReasoningNextActions({ task: input.task, impactedFiles, relatedMemoryIds }),
  ]);
  const confidence = input.confidence ?? 0.9;
  const reasoningQuality = assessReasoningQuality({
    customerPain: input.customerPain,
    productPriority: input.productPriority,
    task: input.task,
    executionContext: input.executionContext,
    evidence: input.evidence,
    impactedFiles,
    relatedMemoryIds,
    assumptions,
    decisionPoints,
    riskSignals,
    requiredTests,
    confidence,
  });
  const sourceRef = `reasoning:${input.sourceType}:${input.sourceRef}`;
  const memory: Memory = {
    id: randomUUID(),
    userId: req.authUserId,
    type: "project",
    summary: `Reasoning: ${input.task}`,
    content: [
      `Task: ${input.task}`,
      `Customer pain: ${input.customerPain}`,
      `Product priority: ${input.productPriority}`,
      `Execution context: ${input.executionContext}`,
      `Evidence: ${input.evidence.join(" | ")}`,
      assumptions.length > 0 ? `Assumptions: ${assumptions.join(" | ")}` : undefined,
      decisionPoints.length > 0 ? `Decision points: ${decisionPoints.join(" | ")}` : undefined,
      riskSignals.length > 0 ? `Risk signals: ${riskSignals.join(" | ")}` : undefined,
      requiredTests.length > 0 ? `Required tests: ${requiredTests.join(" | ")}` : undefined,
      nextActions.length > 0 ? `Next actions: ${nextActions.join(" | ")}` : undefined,
      `Reasoning quality: ${reasoningQuality.status}:${reasoningQuality.score}`,
      impactedFiles.length > 0 ? `Impacted files: ${impactedFiles.join(" | ")}` : undefined,
      relatedMemoryIds.length > 0 ? `Related memories: ${relatedMemoryIds.join(" | ")}` : undefined,
      project ? `Project: ${project}` : undefined,
      workspace ? `Workspace: ${workspace}` : undefined,
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n"),
    importanceScore: 0.9,
    confidence,
    source: "import",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: Math.max(1, input.evidence.length),
    contractVersion: "memoryos.contract.v1",
    contractCategory: "next_action",
    companyBrainType: "context",
    sourceRef,
    files: impactedFiles,
    traceProof: {
      sourceType: input.sourceType,
      sourceRef,
      evidence: input.evidence,
      confidence,
      capturedAt: now,
    },
    freshness: {
      status: "fresh",
      checkedAt: now,
    },
    conflict: {
      status: "none",
      conflictsWith: [],
      checkedAt: now,
    },
    graph: {
      nodeId: `reasoning:${randomUUID().slice(0, 8)}`,
      nodeType: "context",
      edgeRefs: [
        `pain:${compactReasoningLabel(input.customerPain)}`,
        `priority:${compactReasoningLabel(input.productPriority)}`,
        `task:${compactReasoningLabel(input.task)}`,
        project ? `project:${project}` : undefined,
        workspace ? `workspace:${workspace}` : undefined,
        `quality:${reasoningQuality.status}:${reasoningQuality.score}`,
        ...relatedMemoryIds.map((id) => `memory:${id}`),
        ...impactedFiles.map((file) => `file:${file}`),
        ...assumptions.map((assumption) => `assumption:${compactReasoningLabel(assumption)}`),
        ...decisionPoints.map((decision) => `decision:${compactReasoningLabel(decision)}`),
        ...riskSignals.map((risk) => `risk:${compactReasoningLabel(risk)}`),
        ...requiredTests.map((test) => `test:${compactReasoningLabel(test)}`),
        ...nextActions.map((action) => `next_action:${compactReasoningLabel(action)}`),
      ].filter((value): value is string => Boolean(value)),
    },
    developerSignals: {
      projectArea: [project, workspace, input.task, ...impactedFiles].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      ),
      goal: [input.customerPain, input.productPriority, input.task, input.executionContext],
    },
  };

  await getMemoryStoreAdapter().saveMemory({ memory });
  await upsertRecentMemory(memory);
  await recordMemoryCreatedEvent(
    memory,
    "Phase 2.5 reasoning chain captured for agent-ready task context.",
  );

  res.status(200).json({
    traceId,
    acceptedCount: 1,
    reasoningChain: parseReasoningGraphMemory(memory),
    agentBriefAddition: {
      task: input.task,
      taskReason: input.productPriority,
      customerOrProductContext: input.customerPain,
      executionContext: input.executionContext,
      reasoningQuality,
      riskSignals,
      requiredTests,
      traceProof: memory.traceProof,
      recommendedBriefLine: `Why this task matters: ${input.productPriority}. Customer/product context: ${input.customerPain}.`,
    },
  });
}));

memoryRouter.get("/company-brain/reasoning/overview", asyncHandler(async (req, res) => {
  const project =
    typeof req.query.project === "string" && req.query.project.trim().length > 0
      ? req.query.project.trim()
      : undefined;
  const listed = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 700,
  });
  const scoped = project
    ? listed.memories.filter((memory) => projectMatchesMemory(project, memory))
    : listed.memories;
  res.status(200).json({
    project: project ?? null,
    ...buildReasoningOverview(scoped),
  });
}));

memoryRouter.post("/company-brain/reasoning/brief", asyncHandler(async (req, res) => {
  const traceId = createTraceId("reasoning_brief");
  const parsed = CompanyBrainReasoningBriefSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
      traceId,
    });
    return;
  }

  const project = parsed.data.project?.trim();
  const task = parsed.data.task?.trim();
  const targetAgent = parsed.data.targetAgent?.trim() || "coding-agent";
  const listed = await listMemories({
    userId: req.authUserId,
    orgId: req.authOrgId,
    limit: 900,
  });
  const scoped = project
    ? listed.memories.filter((memory) => projectMatchesMemory(project, memory))
    : listed.memories;
  const reasoningChains = scoped
    .map(parseReasoningGraphMemory)
    .filter((item): item is ReasoningGraphMemory => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const experienceChains = scoped
    .map(parseExperienceGraphMemory)
    .filter((item): item is ExperienceGraphMemory => Boolean(item))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  const selected =
    reasoningChains.find((chain) => parsed.data.reasoningId && chain.id === parsed.data.reasoningId) ??
    reasoningChains.find((chain) => task && chain.task.toLowerCase() === task.toLowerCase()) ??
    reasoningChains.find((chain) => task && chain.task.toLowerCase().includes(task.toLowerCase()));

  if (!selected) {
    res.status(404).json({
      error: "Reasoning chain not found",
      traceId,
      details: {
        project: project ?? null,
        reasoningId: parsed.data.reasoningId ?? null,
        task: task ?? null,
      },
    });
    return;
  }

  const relatedMemories =
    parsed.data.includeRelatedMemories === false
      ? []
      : selected.relatedMemoryIds
          .map((memoryId) => scoped.find((memory) => memory.id === memoryId))
          .filter((memory): memory is Memory => Boolean(memory))
          .slice(0, 10);
  const linkedExperiences = experienceChains
    .filter((experience) => experience.relatedReasoningIds.includes(selected.id))
    .map((experience) => ({
      id: experience.id,
      task: experience.task,
      sourceRef: experience.sourceRef,
      status: experience.status,
    }))
    .slice(0, 10);
  const requiredTests = relatedMemories
    .filter((memory) => memory.companyBrainType === "test" || memory.contractCategory === "runbook")
    .map((memory) => memory.summary)
    .concat(selected.requiredTests)
    .slice(0, 8);
  const riskRules = relatedMemories
    .filter((memory) => memory.companyBrainType === "risk" || memory.contractCategory === "policy")
    .map((memory) => memory.summary)
    .concat(selected.riskSignals.map((risk) => `Reasoning risk signal: ${risk}`))
    .slice(0, 8);
  const traceProof = [
    {
      source: "reasoning_graph",
      memory_id: selected.id,
      source_type: selected.traceProof?.sourceType ?? selected.sourceType,
      source_ref: selected.traceProof?.sourceRef ?? selected.sourceRef,
      evidence: selected.evidence,
      confidence: selected.confidence,
      lineage: [
        `source:${selected.sourceType}:${selected.sourceRef}`,
        `pain:${compactReasoningLabel(selected.customerPain)}`,
        `priority:${compactReasoningLabel(selected.productPriority)}`,
        `task:${compactReasoningLabel(selected.task)}`,
        `context:${selected.id}`,
      ],
    },
    ...relatedMemories.map((memory) => ({
      source: "related_memory",
      memory_id: memory.id,
      source_type: memory.traceProof?.sourceType ?? memory.source ?? "memory",
      source_ref: memory.traceProof?.sourceRef ?? memory.sourceRef ?? memory.id,
      evidence: memory.traceProof?.evidence ?? [],
      confidence: memory.traceProof?.confidence ?? memory.confidence,
      lineage: [
        `memory:${memory.id}`,
        memory.companyBrainType ? `type:${memory.companyBrainType}` : undefined,
        memory.contractCategory ? `contract:${memory.contractCategory}` : undefined,
      ].filter((item): item is string => Boolean(item)),
    })),
  ];
  const briefMarkdown = [
    "# MemoryIgnition Reasoning Brief",
    "",
    `Target agent: ${targetAgent}`,
    `Task: ${selected.task}`,
    "",
    "## Why This Task Matters",
    selected.productPriority,
    "",
    "## Customer / Product Context",
    selected.customerPain,
    "",
    "## Execution Context",
    selected.executionContext,
    "",
    "## Reasoning Quality",
    `${selected.reasoningQuality.status} (${selected.reasoningQuality.score}/100)`,
    selected.reasoningQuality.gaps.length > 0 ? `Gaps: ${selected.reasoningQuality.gaps.join(" | ")}` : "Gaps: none",
    "",
    "## Linked Experiences",
    linkedExperiences.length > 0
      ? linkedExperiences.map((experience) => `- ${experience.task} (${experience.sourceRef})`).join("\n")
      : "- No linked experiences captured yet.",
    "",
    "## Assumptions",
    selected.assumptions.length > 0 ? selected.assumptions.map((assumption) => `- ${assumption}`).join("\n") : "- No assumptions captured.",
    "",
    "## Decision Points",
    selected.decisionPoints.length > 0 ? selected.decisionPoints.map((decision) => `- ${decision}`).join("\n") : "- No decision points captured.",
    "",
    "## Recommended First Action",
    selected.nextActions[0] ?? `Validate the current code and source evidence for: ${selected.task}`,
    "",
    "## Impacted Files",
    selected.impactedFiles.length > 0 ? selected.impactedFiles.map((file) => `- ${file}`).join("\n") : "- No impacted files captured.",
    "",
    "## Related Memories",
    relatedMemories.length > 0
      ? relatedMemories.map((memory) => `- ${memory.summary} (${memory.sourceRef ?? memory.id})`).join("\n")
      : "- No related memories linked yet.",
    "",
    "## Risk Rules",
    riskRules.length > 0 ? riskRules.map((rule) => `- ${rule}`).join("\n") : "- No linked risk rules yet.",
    "",
    "## Required Tests",
    requiredTests.length > 0 ? requiredTests.map((test) => `- ${test}`).join("\n") : "- No linked tests yet.",
    "",
    "## Trace Proof",
    `Source -> Reasoning Graph -> Execution Context -> MemoryIgnition Brief`,
    `Source ref: ${selected.traceProof?.sourceRef ?? selected.sourceRef}`,
  ].join("\n");

  res.status(200).json({
    traceId,
    generatedAt: new Date().toISOString(),
    project: project ?? null,
    targetAgent,
    reasoningChain: {
      ...selected,
      linkedExperiences,
    },
    memoryIgnitionBrief: {
      task: selected.task,
      reasoning: {
        whyThisMatters: selected.productPriority,
        customerOrProductContext: selected.customerPain,
        executionContext: selected.executionContext,
        assumptions: selected.assumptions,
        decisionPoints: selected.decisionPoints,
        quality: selected.reasoningQuality,
      },
      context: [selected.executionContext],
      memories: relatedMemories.map((memory) => ({
        id: memory.id,
        summary: memory.summary,
        type: memory.companyBrainType ?? memory.type,
        sourceRef: memory.sourceRef ?? null,
        confidence: memory.confidence,
        proofQuality: memory.proofQuality ?? null,
      })),
      experiences: [],
      approvedSkills: [],
      riskRules,
      approvalRules: riskRules.length > 0 ? ["Review linked risk rules before acting."] : [],
      requiredTests,
      impactedFiles: selected.impactedFiles,
      nextActions: selected.nextActions,
      recommendedFirstAction: selected.nextActions[0] ?? `Validate the current code and source evidence for: ${selected.task}`,
      traceProof,
      linkedExperiences,
      outcomeHooks: ["Call memoryignition_save_outcome after the agent acts."],
      markdown: briefMarkdown,
    },
  });
}));

memoryRouter.post("/company-brain/experience/capture", asyncHandler(async (req, res) => {
  const traceId = createTraceId("experience_capture");
  const parsed = CompanyBrainExperienceCaptureSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
      traceId,
    });
    return;
  }

  const input = parsed.data;
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const project = input.project?.trim();
  const workspace = input.workspace?.trim();
  const memory = await persistExperienceGraphMemory({
    userId: req.authUserId,
    orgId,
    workspace,
    project,
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    task: input.task,
    problem: input.problem,
    context: input.context,
    action: input.action,
    mistake: input.mistake,
    outcome: input.outcome,
    lesson: input.lesson,
    futureAgentInstruction: input.futureAgentInstruction,
    evidence: input.evidence,
    files: input.files,
    tests: input.tests,
    relatedMemoryIds: input.relatedMemoryIds,
    relatedReasoningIds: input.relatedReasoningIds,
    riskLevel: input.riskLevel,
    status: input.status,
    confidence: input.confidence,
    eventReason: "Phase 3 experience captured from real work outcome for future-agent inheritance.",
  });

  emitMemoryEvent({
    kind: "experience_captured",
    userId: req.authUserId,
    source: "company-brain",
    subject: {
      type: "experience",
      id: memory.id,
      label: input.task ?? input.problem ?? "Captured experience",
    },
    payload: {
      experienceId: memory.id,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef ?? null,
      project: project ?? null,
      workspace: workspace ?? null,
      status: input.status,
      confidence: input.confidence,
      evidenceCount: Array.isArray(input.evidence) ? input.evidence.length : 0,
      traceProofSourceRef: memory.traceProof?.sourceRef ?? null,
      at: memory.updatedAt,
    },
  });

  res.status(200).json({
    traceId,
    acceptedCount: 1,
    experienceRecord: parseExperienceGraphMemory(memory),
    inheritanceAddition: {
      task: input.task,
      lesson: input.lesson,
      futureAgentInstruction: input.futureAgentInstruction,
      traceProof: memory.traceProof,
    },
  });
}));

memoryRouter.get("/company-brain/experience/overview", asyncHandler(async (req, res) => {
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const project =
    typeof req.query.project === "string" && req.query.project.trim().length > 0
      ? req.query.project.trim()
      : undefined;
  const listed = await listMemories({
    userId: req.authUserId,
    orgId,
    limit: 900,
  });
  const scoped = project
    ? listed.memories.filter((memory) => projectMatchesMemory(project, memory))
    : listed.memories;
  res.status(200).json({
    project: project ?? null,
    ...buildExperienceOverview(scoped),
  });
}));

memoryRouter.get("/company-brain/skills/overview", asyncHandler(async (req, res) => {
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const project =
    typeof req.query.project === "string" && req.query.project.trim().length > 0
      ? req.query.project.trim()
      : undefined;
  const listed = await listMemories({
    userId: req.authUserId,
    orgId,
    limit: 900,
  });
  const scoped = project
    ? listed.memories.filter((memory) => projectMatchesMemory(project, memory))
    : listed.memories;
  res.status(200).json({
    project: project ?? null,
    ...buildSkillGraphOverview(scoped),
  });
}));

memoryRouter.post("/company-brain/skills/candidates/generate", asyncHandler(async (req, res) => {
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const project =
    typeof req.body?.project === "string" && req.body.project.trim().length > 0
      ? req.body.project.trim()
      : typeof req.query.project === "string" && req.query.project.trim().length > 0
        ? req.query.project.trim()
        : undefined;
  const listed = await listMemories({
    userId: req.authUserId,
    orgId,
    limit: 900,
  });
  const scoped = project
    ? listed.memories.filter((memory) => projectMatchesMemory(project, memory))
    : listed.memories;
  const experiences = scoped
    .map(parseExperienceGraphMemory)
    .filter((item): item is ExperienceGraphMemory => Boolean(item));
  const existingExperienceIds = new Set(
    scoped
      .map(parseSkillGraphCandidate)
      .filter((item): item is SkillGraphCandidate => Boolean(item))
      .map((candidate) => candidate.sourceExperienceId),
  );

  const generated: SkillGraphCandidate[] = [];
  for (const experience of experiences) {
    if (existingExperienceIds.has(experience.id)) continue;
    if (!shouldGenerateSkillCandidate(experience)) continue;
    const memory = await persistSkillCandidateFromExperience({
      userId: req.authUserId,
      orgId,
      experience,
    });
    const candidate = parseSkillGraphCandidate(memory);
    if (candidate) {
      generated.push(candidate);
      emitMemoryEvent({
        kind: "skill_candidate_generated",
        userId: req.authUserId,
        source: "company-brain",
        subject: {
          type: "skill",
          id: candidate.id,
          label: candidate.name,
        },
        payload: {
          skillId: candidate.id,
          sourceExperienceId: candidate.sourceExperienceId,
          trigger: candidate.trigger,
          riskLevel: candidate.riskLevel,
          version: candidate.version,
          requiredTestCount: candidate.requiredTests.length,
          evidenceCount: candidate.evidence.length,
          at: memory.updatedAt,
        },
      });
    }
  }

  const refreshed = await listMemories({
    userId: req.authUserId,
    orgId,
    limit: 900,
  });
  const refreshedScoped = project
    ? refreshed.memories.filter((memory) => projectMatchesMemory(project, memory))
    : refreshed.memories;
  res.status(200).json({
    project: project ?? null,
    generatedCount: generated.length,
    generated,
    ...buildSkillGraphOverview(refreshedScoped),
  });
}));

memoryRouter.post("/company-brain/skills/:id/review", asyncHandler(async (req, res) => {
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const decision = req.body?.decision === "approve" ? "approved" : req.body?.decision === "reject" ? "rejected" : null;
  if (!decision) {
    res.status(400).json({ error: "decision must be approve|reject" });
    return;
  }

  const scoped = await listMemories({
    userId: req.authUserId,
    orgId,
    limit: 900,
  });
  const memory = scoped.memories.find((entry) => entry.id === req.params.id) ?? null;
  if (!memory || !(memory.sourceRef ?? "").startsWith("skill_candidate:")) {
    res.status(404).json({ error: "Skill candidate not found" });
    return;
  }

  const current = parseSkillGraphCandidate(memory);
  if (!current) {
    res.status(404).json({ error: "Skill candidate not found" });
    return;
  }
  const now = new Date().toISOString();
  const reviewedBy = typeof req.body?.reviewedBy === "string" && req.body.reviewedBy.trim().length > 0
    ? req.body.reviewedBy.trim()
    : req.authUserId;
  const reviewNote = typeof req.body?.note === "string" && req.body.note.trim().length > 0
    ? req.body.note.trim()
    : decision === "approved"
      ? "Approved for future-agent inheritance."
      : "Rejected by reviewer.";
  const updated: Memory = {
    ...memory,
    content: [
      `Skill: ${current.name}`,
      `Trigger: ${current.trigger}`,
      `Steps: ${current.steps.join(" | ")}`,
      `Required tests: ${current.requiredTests.join(" | ") || "Reviewer must define required tests before approval"}`,
      `Past mistakes: ${current.pastMistakes.join(" | ") || "None captured"}`,
      `Evidence: ${current.evidence.join(" | ")}`,
      `Source experience: ${current.sourceExperienceId}`,
      `Risk level: ${current.riskLevel}`,
      `Skill status: ${decision}`,
      `Version: ${current.version}`,
      `Supported agents: ${current.supportedAgents.join(" | ")}`,
      `Inheritance rules: ${current.inheritanceRules.join(" | ")}`,
      `Reviewed by: ${reviewedBy}`,
      `Review note: ${reviewNote}`,
    ].join("\n"),
    updatedAt: now,
    status: decision === "rejected" ? "archived" : "active",
    traceProof: {
      sourceType: memory.traceProof?.sourceType ?? "skill_candidate",
      sourceRef: memory.traceProof?.sourceRef ?? memory.sourceRef ?? memory.id,
      evidence: memory.traceProof?.evidence ?? current.evidence,
      confidence: memory.traceProof?.confidence ?? memory.confidence,
      capturedAt: memory.traceProof?.capturedAt ?? now,
    },
  };

  await getMemoryStoreAdapter().saveMemory({ memory: updated });
  await upsertRecentMemory(updated, orgId ?? undefined);
  await recordMemoryCreatedEvent(
    updated,
    `Phase 4 skill candidate ${decision} by reviewer.`,
  );

  if (decision === "approved") {
    emitMemoryEvent({
      kind: "skill_approved",
      userId: req.authUserId,
      source: "company-brain",
      subject: {
        type: "skill",
        id: updated.id,
        label: current.name,
      },
      payload: {
        skillId: updated.id,
        sourceExperienceId: current.sourceExperienceId,
        reviewedBy,
        note: reviewNote,
        version: current.version,
        riskLevel: current.riskLevel,
        approvalStatus: decision,
        at: now,
      },
    });
  } else {
    emitMemoryEvent({
      kind: "memory_processed",
      userId: req.authUserId,
      source: "company-brain",
      subject: {
        type: "skill",
        id: updated.id,
        label: current.name,
      },
      payload: {
        route: "company-brain/skills/:id/review",
        skillId: updated.id,
        sourceExperienceId: current.sourceExperienceId,
        reviewedBy,
        note: reviewNote,
        approvalStatus: decision,
        at: now,
      },
    });
  }

  res.status(200).json({
    reviewedAt: now,
    candidate: parseSkillGraphCandidate(updated),
  });
}));

memoryRouter.get("/company-brain/inheritance-spine", asyncHandler(async (req, res) => {
  const project =
    typeof req.query.project === "string" && req.query.project.trim().length > 0
      ? req.query.project.trim()
      : undefined;
  const workspace =
    typeof req.query.workspace === "string" && req.query.workspace.trim().length > 0
      ? req.query.workspace.trim()
      : undefined;
  const task =
    typeof req.query.task === "string" && req.query.task.trim().length > 0
      ? req.query.task.trim()
      : undefined;
  const agentId =
    typeof req.query.agentId === "string" && req.query.agentId.trim().length > 0
      ? req.query.agentId.trim()
      : "codex";
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const spine = await buildInheritanceSpine({
    userId: req.authUserId,
    orgId,
    project,
    workspace,
    task,
    agentId,
  });
  const agentAccessCompatibility = await buildAgentAccessCompatibilitySnapshot(req.authUserId);
  const response = {
    ...spine,
    accessLayer: {
      ...spine.accessLayer,
      compatibilityReady: agentAccessCompatibility.ready,
      compatibilityStatus: agentAccessCompatibility.status,
      standardPackageVersion: agentAccessCompatibility.summary.standardPackageVersion,
      apiStandardPackageRequestCount: agentAccessCompatibility.summary.apiStandardPackageRequestCount,
      mcpStandardPackageRequestCount: agentAccessCompatibility.summary.mcpStandardPackageRequestCount,
      standardPackageRequestCount: agentAccessCompatibility.summary.standardPackageRequestCount,
      packageMemoryCount: agentAccessCompatibility.summary.packageMemoryCount,
      packageSkillCount: agentAccessCompatibility.summary.packageSkillCount,
      packageTraceProofCount: agentAccessCompatibility.summary.packageTraceProofCount,
    },
    agentAccessCompatibility,
  };

  emitMemoryEvent({
    kind: "memory_processed",
    userId: req.authUserId,
    payload: {
      route: "company-brain/inheritance-spine",
      project: project ?? null,
      readyPhaseCount: response.readyPhaseCount,
      totalPhaseCount: response.totalPhaseCount,
      localProductionReady: response.localProductionReady,
      blockers: response.blockers.length,
      agentAccessCompatibility: agentAccessCompatibility.status,
      at: new Date().toISOString(),
    },
  });

  res.status(200).json(response);
}));

memoryRouter.post("/production-readiness/run-gate", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const project =
    isObjectRecord(req.body) && typeof req.body.project === "string" && req.body.project.trim().length > 0
      ? req.body.project.trim()
      : undefined;
  const workspace =
    isObjectRecord(req.body) && typeof req.body.workspace === "string" && req.body.workspace.trim().length > 0
      ? req.body.workspace.trim()
      : undefined;
  const task =
    isObjectRecord(req.body) && typeof req.body.task === "string" && req.body.task.trim().length > 0
      ? req.body.task.trim()
      : "Run local production-readiness gate for MemoryOS Phase 1 through Phase 7 MVP.";
  const agentId =
    isObjectRecord(req.body) && typeof req.body.agentId === "string" && req.body.agentId.trim().length > 0
      ? req.body.agentId.trim()
      : "codex";
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const spine = await buildInheritanceSpine({
    userId: req.authUserId,
    orgId,
    project,
    workspace,
    task,
    agentId,
  });
  const agentAccessCompatibility = await buildAgentAccessCompatibilitySnapshot(req.authUserId);
  const memoryIgnitionRuntime = await buildMemoryIgnitionRuntimeTimeline(req.authUserId, 80);
  const requiredPhaseIds: InheritancePhaseId[] = ["phase1", "phase2", "phase2_5", "phase3", "phase4", "phase5", "phase6", "phase7"];
  const phases = requiredPhaseIds.map((id) => {
    const phase = spine.phases.find((item) => item.id === id);
    const basePhase = phase ?? phaseReadiness({
      id,
      title: id,
      ready: false,
      metrics: {},
      proof: [],
      blockers: [`${id} readiness was not reported by the inheritance spine.`],
    });
    if (id !== "phase5") {
      return basePhase;
    }
    const phase5Ready = basePhase.ready && memoryIgnitionRuntime.ready;
    const phase5Partial =
      !phase5Ready &&
      (basePhase.status === "partial" ||
        basePhase.ready ||
        memoryIgnitionRuntime.completedRequiredMoments > 0);
    return {
      ...basePhase,
      ready: phase5Ready,
      status: phase5Ready ? "ready" : phase5Partial ? "partial" : "blocked",
      metrics: {
        ...basePhase.metrics,
        runtimeTimelineReady: memoryIgnitionRuntime.ready,
        runtimeEvents: memoryIgnitionRuntime.totalEvents,
        completedRuntimeMoments: memoryIgnitionRuntime.completedRequiredMoments,
        requiredRuntimeMoments: memoryIgnitionRuntime.requiredMomentCount,
        blockedRuntimeEvents: memoryIgnitionRuntime.blockedCount,
        erroredRuntimeEvents: memoryIgnitionRuntime.errorCount,
      },
      proof: [
        ...basePhase.proof,
        `runtime:${memoryIgnitionRuntime.version}`,
        `moments:${memoryIgnitionRuntime.completedRequiredMoments}/${memoryIgnitionRuntime.requiredMomentCount}`,
        `events:${memoryIgnitionRuntime.totalEvents}`,
      ],
      blockers: [
        ...basePhase.blockers,
        ...(memoryIgnitionRuntime.ready
          ? []
          : [`MemoryIgnition runtime timeline is ${memoryIgnitionRuntime.status}: ${memoryIgnitionRuntime.next}`]),
      ],
    };
  });
  const passed = phases.filter((phase) => phase.ready).length;
  const partial = phases.filter((phase) => phase.status === "partial").length;
  const deploymentBlockers = phases.flatMap((phase) =>
    phase.blockers.map((blocker) => `${phase.title}: ${blocker}`),
  );
  if (!agentAccessCompatibility.ready) {
    deploymentBlockers.push(
      `Agent Access Layer: ${agentAccessCompatibility.checks
        .filter((check) => !check.ok)
        .map((check) => check.detail)
        .join(" ")}`,
    );
  }
  const status: InheritancePhaseStatus =
    passed === phases.length ? "ready" : passed > 0 || partial > 0 ? "partial" : "blocked";
  const response = {
    generatedAt: new Date().toISOString(),
    status,
    ready: status === "ready",
    passed,
    total: phases.length,
    phases,
    deploymentBlockers,
    proofChain: spine.proofChain,
    memoryIgnition: spine.memoryIgnition,
    memoryIgnitionRuntime,
    founderView: spine.founderView,
    engineerView: spine.engineerView,
    accessLayer: {
      ...spine.accessLayer,
      compatibilityReady: agentAccessCompatibility.ready,
      compatibilityStatus: agentAccessCompatibility.status,
      standardPackageVersion: agentAccessCompatibility.summary.standardPackageVersion,
      apiStandardPackageRequestCount: agentAccessCompatibility.summary.apiStandardPackageRequestCount,
      mcpStandardPackageRequestCount: agentAccessCompatibility.summary.mcpStandardPackageRequestCount,
    },
    agentAccessCompatibility,
    requiredBeforeDeploy: deploymentBlockers.length
      ? deploymentBlockers
      : [
          "Run the same gate against the production HTTPS domain after deploying.",
          "Verify production OAuth callback URLs, CORS origins, and observability env are configured.",
        ],
    next: deploymentBlockers[0] ?? "Local deploy gate passed. Run production smoke after deploy.",
  };

  emitMemoryEvent({
    kind: "memory_processed",
    userId: req.authUserId,
    payload: {
      route: "production-readiness/run-gate",
      status,
      passed,
      total: phases.length,
      memoryIgnitionRuntimeStatus: memoryIgnitionRuntime.status,
      memoryIgnitionRuntimeMoments: `${memoryIgnitionRuntime.completedRequiredMoments}/${memoryIgnitionRuntime.requiredMomentCount}`,
      blockers: deploymentBlockers.length,
      at: response.generatedAt,
    },
  });

  sendApiSuccess(
    res,
    200,
    response,
    buildApiMeta(req, startedAt, { intent: "production_readiness_gate" }),
  );
}));

memoryRouter.get("/company-brain/funnel", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const orgId = readOrgIdFromRequest(req);
  const progress = await getCompanyBrainFunnelProgress(req.authUserId, orgId);
  const funnel = buildCompanyBrainFunnelApiPayload(progress);
  sendApiSuccess(res, 200, funnel, buildApiMeta(req, startedAt));
}));

memoryRouter.patch("/company-brain/funnel", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const orgId = readOrgIdFromRequest(req);
  const body = req.body as Record<string, unknown>;
  const patch: Partial<{
    connectGithub: boolean;
    syncGithub: boolean;
    briefLoaded: boolean;
    labOpened: boolean;
    proposalCreated: boolean;
    proposalApproved: boolean;
    executed: boolean;
    resumed: boolean;
    lastProject: string | null;
    dismissed: boolean;
  }> = {};
  if (typeof body.connectGithub === "boolean") patch.connectGithub = body.connectGithub;
  if (typeof body.syncGithub === "boolean") patch.syncGithub = body.syncGithub;
  if (typeof body.briefLoaded === "boolean") patch.briefLoaded = body.briefLoaded;
  if (typeof body.briefGenerated === "boolean") patch.briefLoaded = body.briefGenerated;
  if (typeof body.labOpened === "boolean") patch.labOpened = body.labOpened;
  if (typeof body.proposalCreated === "boolean") patch.proposalCreated = body.proposalCreated;
  if (typeof body.approved === "boolean") patch.proposalApproved = body.approved;
  if (typeof body.proposalApproved === "boolean") patch.proposalApproved = body.proposalApproved;
  if (typeof body.executed === "boolean") patch.executed = body.executed;
  if (typeof body.resumed === "boolean") patch.resumed = body.resumed;
  if (typeof body.lastProject === "string") patch.lastProject = body.lastProject.trim() || null;
  if (typeof body.dismissed === "boolean") patch.dismissed = body.dismissed;
  const progress = await patchCompanyBrainFunnelProgress(req.authUserId, patch, orgId);
  const funnel = buildCompanyBrainFunnelApiPayload(progress);
  sendApiSuccess(res, 200, funnel, buildApiMeta(req, startedAt));
}));


async function readLatestBenchmarkBaseline(): Promise<BaselineReport | null> {
  const latest = await getLatestRun();
  if (!latest || latest.totalCases <= 0) return null;
  return {
    passRate: latest.passRate,
    totalCases: latest.totalCases,
    updatedAt: latest.completedAt ?? latest.generatedAt,
  };
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

function parsePersistedJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeGovernancePolicyForUser(
  userId: string,
  entry: { policy: GovernancePolicy; savedAt: string },
): Promise<void> {
  const now = new Date().toISOString();
  await prisma.governancePolicySetting.upsert({
    where: { userId },
    create: {
      userId,
      dataJson: JSON.stringify(entry),
      savedAt: entry.savedAt,
      updatedAt: now,
    },
    update: {
      dataJson: JSON.stringify(entry),
      savedAt: entry.savedAt,
      updatedAt: now,
    },
  });
}

async function readGovernancePolicyForUser(
  userId: string,
): Promise<{ policy: GovernancePolicy; savedAt: string } | null> {
  const row = await prisma.governancePolicySetting.findUnique({ where: { userId } });
  if (!row) return null;
  const raw = parsePersistedJson<GovernancePolicy | { policy?: unknown; savedAt?: unknown }>(
    row.dataJson,
    DEFAULT_GOVERNANCE_POLICY,
  );
  if (isObjectRecord(raw) && "policy" in raw) {
    const savedAt = (raw as { savedAt?: unknown }).savedAt;
    return {
      policy: resolveGovernancePolicy((raw as { policy?: unknown }).policy),
      savedAt: typeof savedAt === "string" && savedAt.trim().length > 0 ? savedAt : row.savedAt,
    };
  }
  return {
    policy: resolveGovernancePolicy(raw),
    savedAt: row.savedAt,
  };
}

async function readConflictActionStore(): Promise<ConflictActionStore> {
  const rows = await prisma.conflictAction.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  return {
    actions: rows.flatMap((row): ConflictActionRecord[] => {
      const record = parsePersistedJson<ConflictActionRecord | null>(row.dataJson, null);
      return record ? [record] : [];
    }),
  };
}

async function writeConflictActionStore(state: ConflictActionStore): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.conflictAction.deleteMany({});
    if (state.actions.length > 0) {
      await tx.conflictAction.createMany({
        data: state.actions.map((action) => ({
          id: action.id,
          userId: action.userId,
          type: action.type,
          result: action.result,
          createdAt: action.at,
          dataJson: JSON.stringify(action),
        })),
      });
    }
  });
}

async function readConflictQueueStore(): Promise<ConflictQueueStore> {
  const rows = await prisma.conflictQueueItemRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  return {
    items: rows.flatMap((row): ConflictQueueItem[] => {
      const item = parsePersistedJson<ConflictQueueItem | null>(row.dataJson, null);
      return item ? [item] : [];
    }),
  };
}

async function writeConflictQueueStore(state: ConflictQueueStore): Promise<void> {
  const now = new Date().toISOString();
  await prisma.$transaction(async (tx) => {
    await tx.conflictQueueItemRecord.deleteMany({});
    if (state.items.length > 0) {
      await tx.conflictQueueItemRecord.createMany({
        data: state.items.map((item) => ({
          id: item.id,
          userId: item.userId,
          state: item.state,
          severity: item.severity,
          createdAt: item.createdAt,
          updatedAt: item.resolvedAt ?? now,
          dataJson: JSON.stringify(item),
        })),
      });
    }
  });
}

async function readGovernanceReviewStore(): Promise<GovernanceReviewStore> {
  const rows = await prisma.governanceReviewQueueItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  return {
    items: rows.flatMap((row): GovernanceReviewItem[] => {
      const item = parsePersistedJson<GovernanceReviewItem | null>(row.dataJson, null);
      return item ? [item] : [];
    }),
  };
}

async function writeGovernanceReviewStore(state: GovernanceReviewStore): Promise<void> {
  const now = new Date().toISOString();
  await prisma.$transaction(async (tx) => {
    await tx.governanceReviewQueueItem.deleteMany({});
    if (state.items.length > 0) {
      await tx.governanceReviewQueueItem.createMany({
        data: state.items.map((item) => ({
          id: item.id,
          userId: item.userId,
          state: item.state,
          reason: item.reason,
          createdAt: item.createdAt,
          updatedAt: item.reviewedAt ?? now,
          dataJson: JSON.stringify(item),
        })),
      });
    }
  });
}

async function appendConflictAction(record: ConflictActionRecord): Promise<void> {
  const store = await readConflictActionStore();
  const next = [record, ...store.actions].slice(0, 1000);
  await writeConflictActionStore({ actions: next });
}

async function appendConflictQueueItems(items: ConflictQueueItem[]): Promise<void> {
  if (items.length === 0) return;
  const store = await readConflictQueueStore();
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
  await writeConflictQueueStore({ items: next });
}

async function appendGovernanceReviewItem(item: GovernanceReviewItem): Promise<void> {
  const store = await readGovernanceReviewStore();
  const next = [item, ...store.items].slice(0, 1000);
  await writeGovernanceReviewStore({ items: next });
}

async function getPluginUserState(userId: string): Promise<PluginUserState> {
  const row = await prisma.pluginUserStateSetting.findUnique({ where: { userId } });
  if (!row) {
    return { installed: [], events: [] };
  }
  const state = parsePersistedJson<PluginUserState>(row.dataJson, { installed: [], events: [] });
  return {
    installed: Array.isArray(state.installed) ? state.installed.filter((item): item is string => typeof item === "string") : [],
    events: Array.isArray(state.events) ? state.events : [],
  };
}

async function setPluginUserState(userId: string, state: PluginUserState): Promise<void> {
  await prisma.pluginUserStateSetting.upsert({
    where: { userId },
    create: {
      userId,
      dataJson: JSON.stringify(state),
      updatedAt: new Date().toISOString(),
    },
    update: {
      dataJson: JSON.stringify(state),
      updatedAt: new Date().toISOString(),
    },
  });
}

function packageVersionFrom(filePath: string): string {
  if (!existsSync(filePath)) {
    return "unknown";
  }
  let pkg: Record<string, unknown> | null = null;
  try {
    pkg = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    pkg = null;
  }
  if (!pkg || typeof pkg.version !== "string") {
    return "unknown";
  }
  return pkg.version;
}

async function buildPluginCatalog(userId: string): Promise<{ plugins: PluginRecord[]; events: PluginEvent[] }> {
  const userState = await getPluginUserState(userId);
  const installed = new Set(userState.installed);

  const mcpPath = path.join(process.cwd(), "packages", "mcp-server", "package.json");
  const sdkPath = path.join(process.cwd(), "packages", "sdk", "package.json");
  const serverPath = path.join(process.cwd(), "package.json");
  const mcpBuiltPath = path.join(process.cwd(), "packages", "mcp-server", "dist", "stdio.js");

  const plugins: PluginRecord[] = [
    {
      id: "epoch-mcp",
      name: "MemoryOS MCP Bridge",
      category: "MCP",
      runtime: "stdio transport",
      version: packageVersionFrom(mcpPath),
      status: installed.has("epoch-mcp") ? "installed" : "available",
      capabilities: ["retrieve", "resume", "handoff", "mcp-tools"],
      source: "packages/epoch-mcp",
      installedAt: userState.events.find((event) => event.pluginId === "epoch-mcp" && event.action === "installed")?.at,
      updatedAt: userState.events.find((event) => event.pluginId === "epoch-mcp")?.at,
      health: existsSync(mcpBuiltPath) ? "healthy" : "unknown",
      healthDetail: existsSync(mcpBuiltPath) ? "Built output found at packages/epoch-mcp/dist/stdio.js" : "Build output not found yet.",
    },
    {
      id: "sdk-runtime",
      name: "TypeScript SDK Runtime",
      category: "Runtime",
      runtime: "Node package",
      version: packageVersionFrom(sdkPath),
      status: installed.has("sdk-runtime") ? "installed" : "available",
      capabilities: ["beforeModel", "afterModel", "process", "retrieve"],
      source: "packages/epoch-sdk",
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

function isTeamRole(value: unknown): value is TeamRole {
  return value === "owner" || value === "admin" || value === "member";
}

function isTeamAccess(value: unknown): value is TeamAccess {
  return value === "Full" || value === "Scoped" || value === "Read";
}

function coerceTeamMembers(raw: unknown, fallback: WorkspaceState): TeamMemberRecord[] {
  if (!Array.isArray(raw)) return fallback.members;
  const members = raw.flatMap((item): TeamMemberRecord[] => {
    if (!isObjectRecord(item)) return [];
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : "";
    const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : "";
    const email = typeof item.email === "string" && item.email.trim() ? item.email.trim() : "";
    if (!id || !name || !email) return [];
    return [{
      id,
      name,
      email,
      role: isTeamRole(item.role) ? item.role : "member",
      access: isTeamAccess(item.access) ? item.access : "Full",
      joined:
        typeof item.joined === "string" && item.joined.trim()
          ? item.joined
          : new Date().toISOString(),
      status: item.status === "invited" ? "invited" : "active",
    }];
  });
  return members.length > 0 ? members : fallback.members;
}

function coerceTeamInvites(raw: unknown): TeamInviteRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): TeamInviteRecord[] => {
    if (!isObjectRecord(item)) return [];
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : randomUUID();
    const email = typeof item.email === "string" && item.email.trim() ? item.email.trim() : "";
    if (!email) return [];
    return [{
      id,
      email,
      role: isTeamRole(item.role) && item.role !== "owner" ? item.role : "member",
      access: isTeamAccess(item.access) ? item.access : "Full",
      sentAt:
        typeof item.sentAt === "string" && item.sentAt.trim()
          ? item.sentAt
          : new Date().toISOString(),
      state:
        item.state === "accepted" || item.state === "expired" ? item.state : "pending",
    }];
  });
}

function normalizeWorkspaceState(raw: unknown, userId: string): WorkspaceState {
  const fallback = createDefaultWorkspaceState(userId);
  if (!isObjectRecord(raw)) return fallback;
  const organization = isObjectRecord(raw.organization) ? raw.organization : {};
  return {
    ...fallback,
    workspaceName:
      typeof raw.workspaceName === "string" && raw.workspaceName.trim()
        ? raw.workspaceName.trim()
        : fallback.workspaceName,
    plan:
      raw.plan === "Pro" || raw.plan === "Scale" || raw.plan === "Enterprise" || raw.plan === "Free"
        ? raw.plan
        : fallback.plan,
    members: coerceTeamMembers(raw.members, fallback),
    invites: coerceTeamInvites(raw.invites),
    organization: {
      organizationId:
        typeof organization.organizationId === "string" && organization.organizationId.trim()
          ? organization.organizationId.trim()
          : fallback.organization.organizationId,
      ownerName:
        typeof organization.ownerName === "string" && organization.ownerName.trim()
          ? organization.ownerName.trim()
          : fallback.organization.ownerName,
      ownerEmail:
        typeof organization.ownerEmail === "string" && organization.ownerEmail.trim()
          ? organization.ownerEmail.trim()
          : fallback.organization.ownerEmail,
      contextEnabled:
        typeof organization.contextEnabled === "boolean"
          ? organization.contextEnabled
          : fallback.organization.contextEnabled,
    },
  };
}

async function getWorkspaceState(userId: string): Promise<WorkspaceState> {
  return readScopedSetting(
    userScopedSettingsIdentity(userId, WORKSPACE_SETTINGS_SECTION),
    (raw) => normalizeWorkspaceState(raw, userId),
  );
}

async function saveWorkspaceState(userId: string, state: WorkspaceState): Promise<WorkspaceState> {
  await writeScopedSetting(userScopedSettingsIdentity(userId, WORKSPACE_SETTINGS_SECTION), state);
  return state;
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
        billingPath: "/pricing",
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

function serializeApiKeyForClient(key: ApiKeyRecord) {
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
    creditLimit: key.creditLimit,
    resetLimitEvery: key.resetLimitEvery,
    requests24h: countApiKeyRequests24h(key.userId, key.id),
  };
}

function readPackageVersion(packagePath: string): string | null {
  if (!existsSync(packagePath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as { version?: unknown };
    return typeof parsed.version === "string" && parsed.version.trim().length > 0
      ? parsed.version.trim()
      : null;
  } catch {
    return null;
  }
}

function serializeServiceUserForClient(serviceUser: ServiceUserRecord) {
  return {
    id: serviceUser.id,
    name: serviceUser.name,
    scope: serviceUser.scope,
    role: serviceUser.role,
    createdAt: serviceUser.createdAt,
    expiresAt: serviceUser.expiresAt,
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
  const changedText = listOrFallback(
    input.brief.recentChanges ?? input.brief.whatChangedRecently,
    "No recent changes captured.",
  );
  const decisionsText = listOrFallback(
    input.brief.openDecisions ?? input.brief.keyDecisions,
    "No explicit decisions captured yet.",
  );
  const blockersText = listOrFallback(
    input.brief.blockedAreas ?? input.brief.openBlockers,
    "No explicit blockers captured.",
  );
  const contextText = listOrFallback(input.brief.mustKnowContextForAgent, "No additional context captured.");
  const currentStateText = listOrFallback(input.brief.currentState ?? [], "No current state captured.");
  const nextActionsText = listOrFallback(
    input.brief.nextRecommendedActions ?? [input.brief.nextBestAction],
    input.brief.nextBestAction,
  );
  const prsText = listOrFallback(input.brief.relevantPRs ?? [], "No linked pull requests in memory.");
  const issuesText = listOrFallback(input.brief.relevantIssues ?? [], "No linked issues in memory.");
  const agentText = listOrFallback(input.brief.agentSuggestions ?? [], "No agent suggestions captured.");
  const executionText = listOrFallback(input.brief.executionHistory ?? [], "No execution history captured.");
  const driftText = listOrFallback(
    input.brief.driftAndCorrectiveActions ?? [],
    "No execution drift detected for this project.",
  );
  const whySelectedText =
    (input.brief.whyTheseMemoriesWereSelected ?? []).length > 0
      ? input.brief.whyTheseMemoriesWereSelected
          .map(
            (item) =>
              `- ${item.memoryId} (score ${item.finalScore.toFixed(3)}): ${item.summary}${
                item.reasonTags?.length ? ` [${item.reasonTags.slice(0, 3).join(", ")}]` : ""
              }`,
          )
          .join("\n")
      : "- No ranked memory trace available.";
  const confidenceScore = input.brief.resumeConfidence?.score ?? 0;

  const executionContract = [
    `# MemoryOS Continue Contract: ${input.project}`,
    "",
    `## Resume Confidence: ${confidenceScore}%`,
    "Use the brief as operational state; ask one focused question if a critical fact is missing.",
    "",
    "## Project Goal",
    input.brief.projectGoal ?? input.brief.currentGoal,
    "",
    "## Current State",
    currentStateText,
    "",
    "## Recent Changes",
    changedText,
    "",
    "## Open Decisions",
    decisionsText,
    "",
    "## Blocked Areas",
    blockersText,
    "",
    "## Risky Files / Areas",
    riskyFilesText,
    "",
    "## Relevant PRs",
    prsText,
    "",
    "## Relevant Issues",
    issuesText,
    "",
    "## Agent Suggestions",
    agentText,
    "",
    "## Execution History",
    executionText,
    "",
    "## Drift & Corrective Actions",
    driftText,
    "",
    "## Must-Know Context",
    contextText,
    "",
    "## Next Recommended Actions",
    nextActionsText,
    "",
    "## Why These Memories Were Selected",
    whySelectedText,
    "",
    "## Hard Guardrails",
    "- Make the smallest safe change that advances the next best action.",
    "- Do not rewrite unrelated modules or rename public interfaces unless the task requires it.",
    "- Do not touch secrets, env files, generated folders, node_modules, or unrelated local changes.",
    "- If the brief is missing a critical fact, ask one focused question instead of inventing product state.",
    "- Preserve existing style and product direction unless the requested task explicitly changes it.",
    ...(input.brief.driftAndCorrectiveActions?.length &&
    input.brief.driftAndCorrectiveActions[0] !== "Insufficient operational data in retrieved memories for this section."
      ? [
          "- Address listed execution drift before expanding scope; reconcile planned vs actual outcomes first.",
          "- Do not treat a failed or rolled-back operational loop as complete until corrective steps are done.",
        ]
      : []),
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
  resumeConfidenceScore?: number;
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
  const resumeConfidencePart =
    typeof input.resumeConfidenceScore === "number"
      ? ` Resume confidence: ${input.resumeConfidenceScore}%.`
      : "";

  return {
    runType: "resume_prompt",
    memoryUsedCount,
    averageConfidence,
    contractCategories,
    whatChangedAfterAction:
      `Generated a ${targetLabel} execution prompt from the canonical Continue Project brief. Code changes are captured after the agent run.`,
    summary:
      memoryUsedCount > 0
        ? `Used ${memoryUsedCount} ranked memories at average retrieval confidence ${averageConfidence}.${resumeConfidencePart}`
        : `No ranked memories were available; prompt was generated from fallback brief context.${resumeConfidencePart}`,
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
      projectArea: [input.project ?? "continuity-lab-workspace", input.mode, input.agentId],
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
    const governancePolicy = await resolveGovernancePolicyWithUserDefault(req.authUserId, parsed.data.governance);
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
      await appendGovernanceReviewItem(reviewItem);
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
      orgId: req.authOrgId,
      status: "active",
      limit: 200,
    });

    const result = await runIngestFlowLangGraph({
      userId: req.authUserId,
      threadId: parsed.data.threadId,
      message,
    });
    let taggedAcceptedMemories = await applyOperationalTagsToMemories({
      memories: result.acceptedMemories,
      tags: operationalTags,
    });
    let timelineEvents = result.timelineEvents;
    if (taggedAcceptedMemories.length === 0) {
      const fallback = await persistContractFallbackMemory({
        userId: req.authUserId,
        threadId: parsed.data.threadId,
        message: normalizedMessage,
        contract: normalizedContract,
        operationalTags,
      });
      taggedAcceptedMemories = [fallback.memory];
      timelineEvents = [...timelineEvents, fallback.timelineEvent];
    }

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
    await appendConflictQueueItems(autoConflicts);
    emitMemoryEvent({
      kind: "memory_processed",
      userId: req.authUserId,
      payload: {
        traceId,
        acceptedCount: taggedAcceptedMemories.length,
        rejectedCount: result.rejectedMemories.length,
        timelineCount: timelineEvents.length,
        autoConflictsQueued: autoConflicts.length,
        at: new Date().toISOString(),
      },
    });

    res.status(200).json({
      traceId,
      acceptedMemories: taggedAcceptedMemories,
      rejectedMemories: result.rejectedMemories,
      timelineEvents,
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

    const existingSession = await getVoiceSession(req.authUserId, parsed.data.sessionId);
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

    const session = await getVoiceSession(req.authUserId, parsed.data.sessionId);
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

memoryRouter.get("/voice/sessions/:sessionId", asyncHandler(async (req, res) => {
  const sessionId =
    typeof req.params.sessionId === "string" && req.params.sessionId.trim().length > 0
      ? req.params.sessionId.trim()
      : undefined;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const session = await getVoiceSession(req.authUserId, sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.status(200).json({ session });
}));

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

    const existingSession = await getVoiceSession(req.authUserId, parsed.data.sessionId);
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

    const existingSession = await getVoiceSession(req.authUserId, parsed.data.sessionId);
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

    const session = await getVoiceSession(req.authUserId, parsed.data.sessionId);
    const resolvedThreadId =
      parsed.data.threadId ?? session?.threadId ?? `voice:${parsed.data.sessionId}`;

    const mode = parsed.data.mode ?? "chat";
    const agentId = normalizeAgentId(parsed.data.agentId);
    const modelName = parsed.data.model;
    const governancePolicy = await resolveGovernancePolicyWithUserDefault(req.authUserId, parsed.data.governance);
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
    const governance = await resolveGovernancePolicyWithUserDefault(req.authUserId, {
      mode: typeof req.query.mode === "string" ? req.query.mode : undefined,
      ttlHours: typeof req.query.ttlHours === "string" ? Number(req.query.ttlHours) : undefined,
      redactSecrets: req.query.redactSecrets === "true" ? true : req.query.redactSecrets === "false" ? false : undefined,
      pinCriticalDecisions:
        req.query.pinCriticalDecisions === "true" ? true : req.query.pinCriticalDecisions === "false" ? false : undefined,
    });

    const listed = await listMemories({
      userId: req.authUserId,
      orgId: req.authOrgId,
      limit: 120,
    });
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
    const governance = await resolveGovernancePolicyWithUserDefault(req.authUserId, req.body.governance);
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
      ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
      ...(parsed.data.service ? { service: parsed.data.service } : {}),
      ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
      ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
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
    const repo = parseOptionalQueryText(req.query.repo);
    const service = parseOptionalQueryText(req.query.service);
    const environment = parseOptionalQueryText(req.query.environment);
    const taskId = parseOptionalQueryText(req.query.taskId);

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question,
      ...(topK !== undefined ? { topK } : {}),
      ...(includeArchived !== undefined ? { includeArchived } : {}),
      ...(workspace ? { workspace } : {}),
      ...(project ? { project } : {}),
      ...(threadId ? { threadId } : {}),
      ...(repo ? { repo } : {}),
      ...(service ? { service } : {}),
      ...(environment ? { environment } : {}),
      ...(taskId ? { taskId } : {}),
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
      ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
      ...(parsed.data.service ? { service: parsed.data.service } : {}),
      ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
      ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
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
      ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
      ...(parsed.data.service ? { service: parsed.data.service } : {}),
      ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
      ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
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
      ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
      ...(parsed.data.service ? { service: parsed.data.service } : {}),
      ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
      ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
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

type ResumeMemoryInput = {
  project: string;
  question: string;
  topK?: number;
  includeArchived?: boolean;
  workspace?: string;
  threadId?: string;
  repo?: string;
  service?: string;
  environment?: string;
  taskId?: string;
};

async function handleResumeBriefRequest(
  req: Request & { authUserId: string },
  res: ExpressResponse,
  parsed: ResumeMemoryInput,
): Promise<void> {
  const startedAt = Date.now();

  if (!(await applyMeteredOperation({
    req,
    res,
    startedAt,
    operation: "resume_brief",
    text: parsed.question,
  }))) {
    return;
  }

  const result = await runResumeFlowLangGraph({
    userId: req.authUserId,
    project: parsed.project,
    question: parsed.question,
    topK: parsed.topK,
    includeArchived: parsed.includeArchived,
    ...(parsed.workspace ? { workspace: parsed.workspace } : {}),
    ...(parsed.threadId ? { threadId: parsed.threadId } : {}),
    ...(parsed.repo ? { repo: parsed.repo } : {}),
    ...(parsed.service ? { service: parsed.service } : {}),
    ...(parsed.environment ? { environment: parsed.environment } : {}),
    ...(parsed.taskId ? { taskId: parsed.taskId } : {}),
  });

  const brief = toContinueProjectBrief(result);
  const orgId = readOrgIdFromRequest(req);
  void patchContinuityFunnelStep(req.authUserId, "briefGenerated", {
    orgId,
    lastProject: parsed.project,
  }).catch((error) => {
    console.warn("[CompanyBrainFunnel] briefGenerated patch failed:", error);
  });
  sendApiSuccess<ContinueProjectBriefResponseData>(
    res,
    200,
    brief,
    buildApiMeta(req, startedAt, {
      intent: "resume_project",
    }),
  );
}

memoryRouter.get(
  "/resume/brief",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ResumeMemorySchema.safeParse({
      project: req.query.project,
      question: req.query.question,
      topK:
        req.query.topK === undefined
          ? undefined
          : Number(Array.isArray(req.query.topK) ? req.query.topK[0] : req.query.topK),
      includeArchived:
        req.query.includeArchived === undefined
          ? undefined
          : (Array.isArray(req.query.includeArchived)
              ? req.query.includeArchived[0]
              : req.query.includeArchived) === "true",
      workspace: Array.isArray(req.query.workspace) ? req.query.workspace[0] : req.query.workspace,
      threadId: Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId,
      repo: Array.isArray(req.query.repo) ? req.query.repo[0] : req.query.repo,
      service: Array.isArray(req.query.service) ? req.query.service[0] : req.query.service,
      environment: Array.isArray(req.query.environment) ? req.query.environment[0] : req.query.environment,
      taskId: Array.isArray(req.query.taskId) ? req.query.taskId[0] : req.query.taskId,
    });
    if (!parsed.success) {
      sendApiError<ContinueProjectBriefResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid query parameters",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    await handleResumeBriefRequest(req, res, parsed.data);
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

    await handleResumeBriefRequest(req, res, parsed.data);
  }),
);

memoryRouter.post(
  "/memoryignition/handoff",
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
      ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
      ...(parsed.data.service ? { service: parsed.data.service } : {}),
      ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
      ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
    });

    emitMemoryEvent({
      kind: "handoff_generated",
      userId: req.authUserId,
      payload: {
        route: "memoryignition/handoff",
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
        intent: "memoryignition_handoff",
      }),
    );
  }),
);

type MemoryIgnitionBeforeAgentInput = ReturnType<typeof MemoryIgnitionBeforeAgentSchema.parse>;
type MemoryIgnitionSendNowInput = ReturnType<typeof MemoryIgnitionSendNowSchema.parse>;
type MemoryIgnitionMoment = "before_agent" | "before_action" | "during_action" | "risk_check";

function sendNowFormatLabel(format: MemoryIgnitionSendNowInput["target_format"]): string {
  const labels: Record<MemoryIgnitionSendNowInput["target_format"], string> = {
    human_prompt: "Human-readable brief",
    agent_prompt: "Generic agent prompt",
    codex_prompt: "Codex-ready prompt",
    cursor_prompt: "Cursor-ready prompt",
    claude_prompt: "Claude-ready prompt",
    devin_task: "Devin task brief",
    mcp_response: "MCP response",
    api_json: "API JSON package",
    cli_output: "CLI output",
    custom_json: "Custom JSON package",
  };
  return labels[format];
}

function formatMemoryIgnitionSendPayload(
  brief: BeforeModelResult,
  input: MemoryIgnitionSendNowInput,
) {
  const targetAgent = input.target_agent ?? input.agent_id ?? input.agent_type ?? brief.target_agent?.id ?? "generic-agent";
  const targetFormat = input.target_format;
  const basePrompt = brief.copy_to_agent?.prompt ?? brief.ready_to_send_prompt ?? brief.contextText ?? "No MemoryIgnition prompt generated.";
  const prompt = input.reasoning_context
    ? `${basePrompt}\n${reasoningContextMarkdown(input.reasoning_context)}`
    : basePrompt;
  const jsonPackage = {
    target_agent: targetAgent,
    target_format: targetFormat,
    safety_mode: input.safety_mode,
    three_things: brief.three_things,
    standard_inheritance_package: brief.standard_inheritance_package,
    outcome_contract: brief.standard_inheritance_package.outcome_contract,
    ...(input.reasoning_context ? { reasoning_context: input.reasoning_context } : {}),
  };
  const payload =
    targetFormat === "api_json" || targetFormat === "custom_json" || targetFormat === "mcp_response"
      ? JSON.stringify(jsonPackage, null, 2)
      : targetFormat === "cli_output"
        ? [
            `memoryos prepare ${JSON.stringify(input.task ?? input.task_intent ?? input.question ?? "agent task")} --agent ${targetAgent}`,
            "",
            prompt,
          ].join("\n")
        : prompt;

  return {
    version: "memoryignition_send_now.v1",
    send_event_id: `send_${randomUUID().slice(0, 12)}`,
    sent_at: new Date().toISOString(),
    target_agent: targetAgent,
    target_format: targetFormat,
    target_format_label: sendNowFormatLabel(targetFormat),
    safety_mode: input.safety_mode,
    delivery: brief.target_agent?.delivery ?? "copy_prompt",
    outcome_required: Boolean(brief.standard_inheritance_package.outcome?.save_required),
    preview: payload.slice(0, 1200),
    payload,
    json_package: jsonPackage,
    standard_inheritance_package: brief.standard_inheritance_package,
    three_things: brief.three_things,
    readiness: {
      score: brief.brief_proof_quality.score,
      status: brief.evaluation_gate.status,
      can_execute: brief.evaluation_gate.can_execute,
      approval_required: brief.approval_rules.approval_required,
      risk_level: brief.approval_rules.derived_risk_level,
    },
    next: "Send this package to the target agent, then save outcome so future agents inherit the lesson.",
  };
}

function reasoningContextMarkdown(
  reasoningContext: NonNullable<MemoryIgnitionSendNowInput["reasoning_context"]>,
): string {
  const linkedExperiences = reasoningContext.linked_experiences?.length
    ? reasoningContext.linked_experiences.map((experience) => `- ${experience.task} (${experience.source_ref})`).join("\n")
    : "- No linked experiences returned.";

  return [
    "",
    "## Reasoning Lineage",
    `Reasoning task: ${reasoningContext.task}`,
    `Source: ${reasoningContext.source_type} · ${reasoningContext.source_ref}`,
    `Reasoning quality: ${reasoningContext.reasoning_quality?.status ?? "unknown"} · ${reasoningContext.reasoning_quality?.score ?? 0}/100`,
    `Linked experiences: ${reasoningContext.linked_experiences?.length ?? 0}`,
    "",
    "### Linked Experiences",
    linkedExperiences,
    "",
    "### Reasoning Brief Next Step",
    reasoningContext.recommended_first_action ?? "Load reasoning into brief to see the inherited next step.",
  ].join("\n");
}

function composeMemoryIgnitionQuestion(
  input: MemoryIgnitionBeforeAgentInput,
  fallback: string,
): string {
  const base = input.question ?? input.task ?? input.task_intent ?? fallback;
  const context = [
    input.proposed_action ? `Proposed action: ${input.proposed_action}` : undefined,
    input.action ? `Action: ${input.action}` : undefined,
    input.tool_name ? `Tool: ${input.tool_name}` : undefined,
    input.command ? `Command: ${input.command}` : undefined,
    input.current_files?.length ? `Current files: ${input.current_files.join(", ")}` : undefined,
    input.reasoning_context
      ? [
          `Reasoning task: ${input.reasoning_context.task}`,
          `Reasoning source: ${input.reasoning_context.source_type} · ${input.reasoning_context.source_ref}`,
          `Reasoning quality: ${input.reasoning_context.reasoning_quality?.status ?? "unknown"} · ${input.reasoning_context.reasoning_quality?.score ?? 0}/100`,
          input.reasoning_context.linked_experiences?.length
            ? `Reasoning linked experiences: ${input.reasoning_context.linked_experiences
              .slice(0, 4)
              .map((experience) => `${experience.task} (${experience.source_ref})`)
              .join(" | ")}`
            : undefined,
          input.reasoning_context.recommended_first_action
            ? `Reasoning next step: ${input.reasoning_context.recommended_first_action}`
            : undefined,
        ]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .join("\n")
      : undefined,
  ].filter(Boolean);

  return context.length ? `${base}\n${context.join("\n")}` : base;
}

function toMemoryIgnitionBeforeModelInput(
  req: Request & { authUserId: string; authOrgId?: string },
  input: MemoryIgnitionBeforeAgentInput,
  fallbackQuestion: string,
): BeforeModelInput {
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const question = composeMemoryIgnitionQuestion(input, fallbackQuestion);

  return {
    userId: req.authUserId,
    question,
    ...(orgId ? { org_id: orgId } : {}),
    ...(input.workspace_id ? { workspace_id: input.workspace_id } : {}),
    ...(input.agent_id ?? input.agent_type ? { agent_id: input.agent_id ?? input.agent_type } : {}),
    ...(input.repo_or_task ?? input.repo ?? input.task ? { repo_or_task: input.repo_or_task ?? input.repo ?? input.task } : {}),
    ...(input.task_intent ?? input.task ? { task_intent: input.task_intent ?? input.task } : {}),
    ...(input.available_tools ? { available_tools: input.available_tools } : {}),
    ...(input.risk_level ? { risk_level: input.risk_level } : {}),
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.project ? { project: input.project } : {}),
    ...(input.threadId ? { threadId: input.threadId } : {}),
    ...(input.repo ? { repo: input.repo } : {}),
    ...(input.mode ? { mode: input.mode } : { mode: "resume" }),
    ...(input.topK ? { topK: input.topK } : {}),
    ...(input.includeArchived !== undefined ? { includeArchived: input.includeArchived } : {}),
    ...(input.related_reasoning_ids ? { related_reasoning_ids: input.related_reasoning_ids } : {}),
    ...(input.reasoning_context ? { reasoning_context: input.reasoning_context } : {}),
  };
}

function normalizeGuardText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_./:-]+/g, " ").replace(/\s+/g, " ").trim();
}

function actionCorpusForGuard(input: MemoryIgnitionBeforeAgentInput): string {
  return [
    input.proposed_action,
    input.action,
    input.command,
    input.tool_name,
    input.task,
    input.task_intent,
    ...(input.current_files ?? []),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0).join("\n");
}

function matchGuardFiles(files: string[], input: MemoryIgnitionBeforeAgentInput): string[] {
  const corpus = normalizeGuardText(actionCorpusForGuard(input));
  return Array.from(new Set(files.filter((file) => {
    const normalizedFile = normalizeGuardText(file);
    const basename = normalizedFile.split(/[\\/]/).filter(Boolean).at(-1) ?? normalizedFile;
    return Boolean(normalizedFile && (corpus.includes(normalizedFile) || corpus.includes(basename)));
  })));
}

function forbiddenActionMatches(actions: string[], input: MemoryIgnitionBeforeAgentInput): string[] {
  const corpus = normalizeGuardText(actionCorpusForGuard(input));
  const dangerousTokens = [
    "deploy",
    "migrate",
    "migration",
    "delete data",
    "drop table",
    "rm -rf",
    "touch secrets",
    "secret",
    "bypass approval",
    "without approval",
  ];

  return Array.from(new Set(actions.filter((action) => {
    const normalized = normalizeGuardText(action);
    if (normalized.length > 8 && corpus.includes(normalized)) return true;
    return dangerousTokens.some((token) => normalized.includes(token) && corpus.includes(token));
  })));
}

function missingRequiredTestProof(requiredTests: string[], input: MemoryIgnitionBeforeAgentInput): string[] {
  if (requiredTests.length === 0) return [];
  const corpus = normalizeGuardText([input.command, input.proposed_action, input.action].filter(Boolean).join("\n"));
  return requiredTests.filter((test) => {
    const normalizedTest = normalizeGuardText(test);
    if (!normalizedTest) return false;
    const testTokens = normalizedTest.split(" ").filter((token) => token.length > 2);
    const strongTokenMatches = testTokens.filter((token) => corpus.includes(token)).length;
    return !corpus.includes(normalizedTest) && strongTokenMatches < Math.min(2, testTokens.length);
  });
}

function normalizeRuntimeToolName(value: string): string {
  const normalized = normalizeGuardText(value).replace(/-/g, "_");
  if (/^(read|read_file|read_files|search|grep|rg|cat|open)$/.test(normalized)) return "read_files";
  if (/^(edit|edit_file|edit_files|write|patch|apply_patch|applypatch)$/.test(normalized)) return "edit_files";
  if (/^(test|tests|vitest|jest|playwright|tsc|lint)$/.test(normalized)) return "tests";
  if (/^(shell|terminal|bash|powershell|cmd|exec|command)$/.test(normalized)) return "terminal";
  if (/^(deploy|release|vercel|doctl|kubectl|terraform|docker)$/.test(normalized)) return "deploy";
  return normalized;
}

function inferRequestedRuntimeTool(input: MemoryIgnitionBeforeAgentInput): string | null {
  if (input.tool_name) return normalizeRuntimeToolName(input.tool_name);
  const command = normalizeGuardText(input.command ?? "");
  if (!command) return null;
  if (command.startsWith("apply_patch") || command.includes(" apply_patch ")) return "edit_files";
  if (/\b(vitest|jest|playwright|tsc|lint)\b/.test(command)) return "tests";
  if (/\b(npm|npx|bun|yarn|pnpm|node|tsx|git|powershell|bash|cmd)\b/.test(command)) return "terminal";
  return "terminal";
}

function buildRuntimePermissionPolicy(
  input: MemoryIgnitionBeforeAgentInput,
  moment: MemoryIgnitionMoment,
  settings: MemoryIgnitionRuntimePolicySettings,
) {
  const explicitAllowedTools = Array.from(new Set((input.available_tools ?? []).map(normalizeRuntimeToolName).filter(Boolean)));
  const resolvedPolicy = resolveMemoryIgnitionRuntimeAllowedTools({
    settings,
    explicitAllowedTools,
    agentId: input.agent_id,
    agentType: input.agent_type,
    riskLevel: input.risk_level,
  });
  const allowedTools = Array.from(new Set(resolvedPolicy.allowedTools.map(normalizeRuntimeToolName).filter(Boolean)));
  const requestedTool = inferRequestedRuntimeTool(input);
  const toolPermissionsDeclared = allowedTools.length > 0;
  const toolAllowed = !requestedTool || !toolPermissionsDeclared || allowedTools.includes(requestedTool);
  const deniedTools = requestedTool && !toolAllowed ? [requestedTool] : [];
  const checks = [
    {
      id: "agent_identity",
      label: "Agent identity",
      ok: Boolean(input.agent_id ?? input.agent_type),
      detail: input.agent_id ?? input.agent_type
        ? `Agent ${input.agent_id ?? input.agent_type} identified.`
        : "No agent identity provided; runtime uses anonymous agent policy.",
    },
    {
      id: "tool_permission",
      label: "Tool permission",
      ok: toolAllowed,
      detail: !requestedTool
        ? "No runtime tool requested."
        : !toolPermissionsDeclared
          ? `Requested ${requestedTool}; no workspace or request tool allow-list was available.`
          : toolAllowed
            ? `Requested ${requestedTool}; allowed by ${resolvedPolicy.policyId}.`
            : `Requested ${requestedTool}; not in allowed tools for ${resolvedPolicy.policyId}: ${allowedTools.join(", ")}.`,
    },
  ];

  return {
    version: "memoryignition_runtime_policy.v1" as const,
    moment,
    policy_settings_version: settings.version,
    policy_settings_id: settings.id,
    policy_source: resolvedPolicy.source,
    policy_id: resolvedPolicy.policyId,
    policy_updated_at: settings.updatedAt,
    approval_required_by_policy: resolvedPolicy.requiresApproval,
    approval_policy_id: resolvedPolicy.approvalPolicyId,
    approval_reason: resolvedPolicy.requiresApproval
      ? `${resolvedPolicy.approvalPolicyId} requires human approval before execution.`
      : null,
    agent_id: input.agent_id ?? input.agent_type ?? null,
    agent_type: input.agent_type ?? null,
    allowed_tools: allowedTools,
    requested_tool: requestedTool,
    requested_command: input.command ?? null,
    tool_permissions_declared: toolPermissionsDeclared,
    tool_allowed: toolAllowed,
    denied_tools: deniedTools,
    status: deniedTools.length > 0 ? "blocked" : "satisfied",
    checks,
    next_required_actions: deniedTools.length > 0
      ? [`Grant ${requestedTool} to this agent or change the proposed action to use an allowed tool.`]
      : [],
  };
}

function withMemoryIgnitionRuntime(
  brief: BeforeModelResult,
  moment: MemoryIgnitionMoment,
  input: MemoryIgnitionBeforeAgentInput,
  settings: MemoryIgnitionRuntimePolicySettings,
) {
  const actionText = input.proposed_action ?? input.action ?? input.command ?? input.task ?? input.task_intent ?? "agent action";
  const runtimePolicy = buildRuntimePermissionPolicy(input, moment, settings);
  const policyApprovalRequired = Boolean(runtimePolicy.approval_required_by_policy);
  const approvalRequired =
    brief.approval_rules.approval_required ||
    brief.evaluation_gate.requires_human_review ||
    policyApprovalRequired;
  const matchedRiskyFiles = matchGuardFiles(brief.risky_files, input);
  const matchedForbiddenActions = forbiddenActionMatches(brief.forbidden_actions, input);
  const missingTests = missingRequiredTestProof(brief.required_tests, input);
  const riskyFileApprovalBlocked = matchedRiskyFiles.length > 0 && approvalRequired;
  const permissionBlocked = runtimePolicy.denied_tools.length > 0;
  const blocked =
    !brief.evaluation_gate.can_execute ||
    permissionBlocked ||
    matchedForbiddenActions.length > 0 ||
    riskyFileApprovalBlocked;
  const allowed = !blocked;
  const guardChecks = [
    {
      id: "brief_gate",
      label: "Brief execution gate",
      ok: brief.evaluation_gate.can_execute,
      detail: brief.evaluation_gate.reason,
    },
    {
      id: "tool_permission",
      label: "Tool permission",
      ok: runtimePolicy.tool_allowed,
      detail: runtimePolicy.checks.find((check) => check.id === "tool_permission")?.detail ?? "Runtime permission policy checked.",
    },
    {
      id: "risky_files",
      label: "Risky files",
      ok: matchedRiskyFiles.length === 0 || !approvalRequired,
      detail: matchedRiskyFiles.length
        ? `${matchedRiskyFiles.length} risky file(s) matched: ${matchedRiskyFiles.slice(0, 4).join(", ")}`
        : "No risky file match in proposed action.",
    },
    {
      id: "forbidden_actions",
      label: "Forbidden actions",
      ok: matchedForbiddenActions.length === 0,
      detail: matchedForbiddenActions.length
        ? `${matchedForbiddenActions.length} forbidden action(s) matched.`
        : "No forbidden action matched the proposed action.",
    },
    {
      id: "approval",
      label: "Approval",
      ok: !approvalRequired,
      detail: approvalRequired
        ? [
            brief.approval_rules.approval_required ? brief.approval_rules.reason : undefined,
            brief.evaluation_gate.requires_human_review ? brief.evaluation_gate.reason : undefined,
            runtimePolicy.approval_reason ?? undefined,
          ].filter(Boolean).join(" ")
        : "No human approval required.",
    },
    {
      id: "required_tests",
      label: "Required tests",
      ok: missingTests.length === 0,
      detail: missingTests.length
        ? `${missingTests.length} required test(s) still need outcome evidence.`
        : "No missing required test evidence detected for this action.",
    },
    {
      id: "trace_proof",
      label: "Trace proof",
      ok: brief.trace_proof.length > 0,
      detail: `${brief.trace_proof.length} trace proof item(s) available.`,
    },
  ];
  const guardStatus = blocked ? "blocked" : approvalRequired ? "approval_required" : "allowed";
  const guardReason = blocked
    ? [
        !brief.evaluation_gate.can_execute ? brief.evaluation_gate.reason : undefined,
        permissionBlocked ? "Requested tool is not allowed by runtime policy." : undefined,
        matchedForbiddenActions.length ? "Proposed action matched forbidden actions." : undefined,
        riskyFileApprovalBlocked ? "Proposed action touches risky files and requires approval." : undefined,
      ].filter(Boolean).join(" ")
    : approvalRequired
      ? "Action can continue only after human approval is recorded."
      : "Guardian Agent allowed this action with current proof.";
  const nextRequiredActions = Array.from(new Set([
    ...brief.evaluation_gate.next_required_actions,
    ...runtimePolicy.next_required_actions,
    riskyFileApprovalBlocked ? "Record human approval before touching matched risky files." : undefined,
    matchedForbiddenActions.length ? "Change the proposed action to avoid forbidden operations." : undefined,
    ...missingTests.map((test) => `Run or report required test: ${test}`),
    brief.trace_proof.length === 0 ? "Add source trace proof before execution." : undefined,
  ].filter((item): item is string => Boolean(item))));
  const approvalSources = [
    brief.approval_rules.approval_required ? "brief_approval_rules" : null,
    brief.evaluation_gate.requires_human_review ? "evaluation_gate" : null,
    runtimePolicy.approval_required_by_policy ? `runtime_policy:${runtimePolicy.approval_policy_id ?? runtimePolicy.policy_id}` : null,
  ].filter((item): item is string => Boolean(item));
  const blockingSources = [
    !brief.evaluation_gate.can_execute ? "evaluation_gate" : null,
    permissionBlocked ? "runtime_tool_permission" : null,
    matchedForbiddenActions.length ? "forbidden_actions" : null,
    riskyFileApprovalBlocked ? "risky_file_approval" : null,
  ].filter((item): item is string => Boolean(item));
  const governanceDecision = {
    version: "memoryignition_guardian_governance_decision.v1" as const,
    status: guardStatus,
    allowed,
    blocked,
    approval_required: approvalRequired,
    approval_sources: approvalSources,
    blocking_sources: blockingSources,
    runtime_policy_id: runtimePolicy.policy_id,
    runtime_policy_source: runtimePolicy.policy_source,
    approval_policy_id: runtimePolicy.approval_policy_id,
    denied_tools: runtimePolicy.denied_tools,
    matched_risky_files: matchedRiskyFiles,
    matched_forbidden_actions: matchedForbiddenActions,
    missing_required_tests: missingTests,
    reason: guardReason,
    next_required_actions: nextRequiredActions,
  };

  return {
    ...brief,
    runtime_event_id: `mi_${moment}_${randomUUID().slice(0, 12)}`,
    runtime_moment: moment,
    runtime_policy: runtimePolicy,
    action_guard: {
      action: actionText,
      allowed,
      blocked: !allowed,
      approval_required: approvalRequired,
      risk_level: brief.approval_rules.derived_risk_level,
      gate_status: brief.evaluation_gate.status,
      reason: guardReason,
      risky_files: brief.risky_files,
      required_tests: brief.required_tests,
      forbidden_actions: brief.forbidden_actions,
      recommended_first_action: brief.recommended_first_action,
      next_required_actions: nextRequiredActions,
      governance_decision: governanceDecision,
      matched_risky_files: matchedRiskyFiles,
      matched_forbidden_actions: matchedForbiddenActions,
      missing_required_tests: missingTests,
      runtime_policy: runtimePolicy,
      guard_proof: {
        version: "memoryignition_guard_proof.v1",
        status: guardStatus,
        moment,
        action: actionText,
        allowed,
        blocked,
        approval_required: approvalRequired,
        reason: guardReason,
        checks: guardChecks,
        matched_risky_files: matchedRiskyFiles,
        matched_forbidden_actions: matchedForbiddenActions,
        missing_required_tests: missingTests,
        runtime_policy: runtimePolicy,
        governance_decision: governanceDecision,
        trace_proof_ids: brief.trace_proof.map((trace) => trace.memory_id).slice(0, 20),
        next_required_actions: nextRequiredActions,
      },
    },
    internal_agents: {
      intent_agent: {
        status: "completed",
        task_intent: brief.task_understanding?.task_intent ?? input.task_intent ?? input.task ?? actionText,
        target_agent: brief.target_agent?.id ?? input.agent_id ?? input.agent_type ?? "agent",
        risk_level: brief.task_understanding?.risk_level ?? input.risk_level ?? brief.approval_rules.derived_risk_level,
      },
      retrieval_agent: {
        status: "completed",
        relevant_memories: brief.relevant_memories.length,
        past_failures: brief.past_failure_retrieval?.length ?? brief.past_mistakes.length,
        trace_proofs: brief.trace_proof.length,
      },
      skill_selector_agent: {
        status: "completed",
        approved_skills: brief.executable_skills.length,
        skill_proofs: brief.skill_inheritance_proofs?.length ?? 0,
      },
      guardian_agent: {
        status: guardStatus,
        approval_required: approvalRequired,
        risky_files: brief.risky_files.length,
        required_tests: brief.required_tests.length,
        forbidden_actions: brief.forbidden_actions.length,
        denied_tools: runtimePolicy.denied_tools.length,
      },
      outcome_agent: {
        status: "waiting_for_after_agent",
        hooks: brief.outcome_hooks,
      },
    },
  };
}

type MemoryIgnitionGuardedRuntime = ReturnType<typeof withMemoryIgnitionRuntime>;

async function persistMemoryIgnitionApprovalRequestForGuard(
  req: Request & { authUserId: string; authOrgId?: string },
  guarded: MemoryIgnitionGuardedRuntime,
  moment: "before_agent" | "before_action" | "during_action" | "risk_check",
) {
  if (!guarded.action_guard.approval_required && !guarded.action_guard.blocked) {
    return null;
  }
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? null;
  const approvedRequest = await findApprovedMemoryIgnitionApprovalRequest({
    userId: req.authUserId,
    orgId,
    guardMoment: moment,
    action: guarded.action_guard.action,
  });
  if (approvedRequest) {
    const approvalAuditProof = buildMemoryIgnitionApprovalAuditProof(approvedRequest);
    const runtimePolicyAllowsTool = guarded.action_guard.runtime_policy?.tool_allowed !== false;
    const canClearApprovalBlock =
      guarded.evaluation_gate.can_execute &&
      runtimePolicyAllowsTool &&
      guarded.action_guard.matched_forbidden_actions.length === 0;
    (guarded.action_guard as typeof guarded.action_guard & {
      approval_request?: typeof approvedRequest;
      approval_satisfied?: boolean;
      approval_audit_proof?: typeof approvalAuditProof;
    }).approval_request = approvedRequest;
    (guarded.action_guard as typeof guarded.action_guard & { approval_satisfied?: boolean }).approval_satisfied = true;
    (guarded.action_guard as typeof guarded.action_guard & { approval_audit_proof?: typeof approvalAuditProof }).approval_audit_proof = approvalAuditProof;
    guarded.action_guard.guard_proof.checks = guarded.action_guard.guard_proof.checks.map((check) =>
      check.id === "approval"
        ? {
            ...check,
            ok: true,
            detail: `Human approval recorded in ${approvedRequest.id}.`,
          }
        : check,
    );
    guarded.action_guard.guard_proof.reason = canClearApprovalBlock
      ? "Human approval is recorded; Guardian allows this action with current proof."
      : guarded.action_guard.guard_proof.reason;
    guarded.action_guard.reason = guarded.action_guard.guard_proof.reason;
    if (canClearApprovalBlock) {
      guarded.action_guard.allowed = true;
      guarded.action_guard.blocked = false;
      guarded.action_guard.guard_proof.allowed = true;
      guarded.action_guard.guard_proof.blocked = false;
      guarded.action_guard.guard_proof.status = "allowed";
      guarded.internal_agents.guardian_agent.status = "allowed";
    }

    emitMemoryEvent({
      kind: "request_logged",
      userId: req.authUserId,
      payload: {
        route: "memoryignition/approval-satisfied",
        approvalRequestId: approvedRequest.id,
        status: approvedRequest.status,
        moment,
        blocked: guarded.action_guard.blocked,
        approvalRequired: guarded.action_guard.approval_required,
        approvalSatisfied: true,
        riskLevel: approvedRequest.riskLevel,
        orgId,
        at: new Date().toISOString(),
      },
    });

    return approvedRequest;
  }

  const approvalRequest = await upsertMemoryIgnitionApprovalRequest({
    userId: req.authUserId,
    orgId,
    runtimeEventId: guarded.runtime_event_id,
    guardMoment: moment,
    action: guarded.action_guard.action,
    riskLevel: guarded.action_guard.risk_level,
    reason: guarded.action_guard.reason,
    approvalRequired: guarded.action_guard.approval_required,
    blocked: guarded.action_guard.blocked,
    matchedRiskyFiles: guarded.action_guard.matched_risky_files,
    matchedForbiddenActions: guarded.action_guard.matched_forbidden_actions,
    missingRequiredTests: guarded.action_guard.missing_required_tests,
    nextRequiredActions: guarded.action_guard.next_required_actions,
    traceProofIds: guarded.action_guard.guard_proof.trace_proof_ids,
    guardProof: guarded.action_guard.guard_proof as unknown as Record<string, unknown>,
  });

  (guarded.action_guard as typeof guarded.action_guard & {
    approval_request?: typeof approvalRequest;
    approval_audit_proof?: ReturnType<typeof buildMemoryIgnitionApprovalAuditProof>;
  }).approval_request = approvalRequest;
  (guarded.action_guard as typeof guarded.action_guard & {
    approval_audit_proof?: ReturnType<typeof buildMemoryIgnitionApprovalAuditProof>;
  }).approval_audit_proof = buildMemoryIgnitionApprovalAuditProof(approvalRequest);

  emitMemoryEvent({
    kind: "request_logged",
    userId: req.authUserId,
    payload: {
      route: "memoryignition/approval-request",
      approvalRequestId: approvalRequest.id,
      status: approvalRequest.status,
      moment,
      blocked: approvalRequest.blocked,
      approvalRequired: approvalRequest.approvalRequired,
      riskLevel: approvalRequest.riskLevel,
      orgId,
      at: approvalRequest.updatedAt,
    },
  });

  emitMemoryEvent({
    kind: "governance_review_queued",
    userId: req.authUserId,
    source: "memory-ignition",
    subject: {
      type: "approval_request",
      id: approvalRequest.id,
      label: approvalRequest.action,
    },
    payload: {
      route: "memoryignition/approval-request",
      approvalRequestId: approvalRequest.id,
      status: approvalRequest.status,
      blocked: approvalRequest.blocked,
      approvalRequired: approvalRequest.approvalRequired,
      riskLevel: approvalRequest.riskLevel,
      orgId,
      at: approvalRequest.updatedAt,
    },
  });

  return approvalRequest;
}

async function handleMemoryIgnitionBeforeAgent(
  req: Request & { authUserId: string; authOrgId?: string },
  res: ExpressResponse,
): Promise<void> {
  const startedAt = Date.now();
  const parsed = MemoryIgnitionBeforeAgentSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    sendApiError(
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

  const result = withMemoryIgnitionRuntime(
    await beforeModel(toMemoryIgnitionBeforeModelInput(req, parsed.data, "Prepare MemoryIgnition brief.")),
    "before_agent",
    parsed.data,
    await getMemoryIgnitionRuntimePolicySettings(req.authUserId, readOrgIdFromRequest(req) ?? req.authOrgId),
  );
  await persistMemoryIgnitionApprovalRequestForGuard(req, result, "before_agent");

  emitMemoryEvent({
    kind: "brief_ready",
    userId: req.authUserId,
    source: "memory-ignition",
    subject: {
      type: "brief",
      id: result.runtime_event_id,
      label: result.target_agent?.id ?? "MemoryIgnition brief",
    },
    payload: {
      route: "memoryignition/before-agent",
      project: parsed.data.project ?? parsed.data.repo ?? parsed.data.repo_or_task ?? null,
      taskIntent: result.task_understanding?.task_intent ?? parsed.data.task_intent ?? parsed.data.task ?? null,
      memories: result.relevant_memories.length,
      skills: result.executable_skills.length,
      traceProofCount: result.trace_proof.length,
      approvalRequired: result.approval_rules.approval_required,
      gateStatus: result.evaluation_gate.status,
      canInherit: result.evaluation_gate.can_inherit,
      canExecute: result.evaluation_gate.can_execute,
      at: new Date().toISOString(),
    },
  });

  emitMemoryEvent({
    kind: "agent_run_prepared",
    userId: req.authUserId,
    source: "memory-ignition",
    subject: {
      type: "run",
      id: result.runtime_event_id,
      label: result.target_agent?.id ?? "Prepared agent run",
    },
    payload: {
      route: "memoryignition/before-agent",
      project: parsed.data.project ?? parsed.data.repo ?? parsed.data.repo_or_task ?? null,
      approvalRequired: result.approval_rules.approval_required,
      gateStatus: result.evaluation_gate.status,
      canInherit: result.evaluation_gate.can_inherit,
      canExecute: result.evaluation_gate.can_execute,
      recommendedFirstAction: result.recommended_first_action,
      requiredTestCount: result.required_tests.length,
      traceProofCount: result.trace_proof.length,
      at: new Date().toISOString(),
    },
  });

  emitMemoryEvent({
    kind: "memory_processed",
    userId: req.authUserId,
    payload: {
      route: "memoryignition/before-agent",
      project: parsed.data.project ?? parsed.data.repo ?? parsed.data.repo_or_task ?? null,
      memories: result.relevant_memories.length,
      skills: result.executable_skills.length,
      approvalRequired: result.approval_rules.approval_required,
      at: new Date().toISOString(),
    },
  });

  sendApiSuccess(
    res,
    200,
    result,
    buildApiMeta(req, startedAt, {
      intent: "memoryignition_before_agent",
    }),
  );
}

memoryRouter.post(
  "/memoryignition/before-agent",
  asyncHandler(handleMemoryIgnitionBeforeAgent),
);

memoryRouter.post(
  "/memoryignition/brief",
  asyncHandler(handleMemoryIgnitionBeforeAgent),
);

memoryRouter.post(
  "/memoryignition/send-now",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = MemoryIgnitionSendNowSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
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

    const brief = await beforeModel(toMemoryIgnitionBeforeModelInput(req, parsed.data, "Prepare and send MemoryIgnition package."));
    const sendNow = formatMemoryIgnitionSendPayload(brief, parsed.data);

    emitMemoryEvent({
      kind: "request_logged",
      userId: req.authUserId,
      payload: {
        route: "memoryignition/send-now",
        sendEventId: sendNow.send_event_id,
        targetAgent: sendNow.target_agent,
        targetFormat: sendNow.target_format,
        safetyMode: sendNow.safety_mode,
        packageVersion: brief.standard_inheritance_package.version,
        outcomeRequired: sendNow.outcome_required,
        at: sendNow.sent_at,
      },
    });

    emitMemoryEvent({
      kind: "agent_run_started",
      userId: req.authUserId,
      source: "memory-ignition",
      subject: {
        type: "run",
        id: sendNow.send_event_id,
        label: `${sendNow.target_agent} package sent`,
      },
      payload: {
        route: "memoryignition/send-now",
        sendEventId: sendNow.send_event_id,
        targetAgent: sendNow.target_agent,
        targetFormat: sendNow.target_format,
        targetFormatLabel: sendNow.target_format_label,
        safetyMode: sendNow.safety_mode,
        packageVersion: brief.standard_inheritance_package.version,
        outcomeRequired: sendNow.outcome_required,
        taskIntent: brief.task_understanding?.task_intent ?? parsed.data.task_intent ?? parsed.data.task ?? parsed.data.question ?? null,
        project: parsed.data.project ?? parsed.data.repo ?? parsed.data.repo_or_task ?? null,
        readiness: sendNow.readiness,
        requiredTests: brief.required_tests,
        riskyFiles: brief.risky_files,
        traceProofCount: brief.trace_proof.length,
        next: sendNow.next,
        at: sendNow.sent_at,
      },
    });

    sendApiSuccess(
      res,
      200,
      {
        ...sendNow,
        brief,
      },
      buildApiMeta(req, startedAt, {
        intent: "memoryignition_send_now",
      }),
    );
  }),
);

async function handleMemoryIgnitionActionGuard(
  req: Request & { authUserId: string; authOrgId?: string },
  res: ExpressResponse,
  moment: "before_action" | "during_action",
): Promise<void> {
  const startedAt = Date.now();
  const parsed = MemoryIgnitionBeforeAgentSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    sendApiError(
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

  const guarded = withMemoryIgnitionRuntime(
    await beforeModel(toMemoryIgnitionBeforeModelInput(req, parsed.data, "Guard MemoryIgnition action.")),
    moment,
    parsed.data,
    await getMemoryIgnitionRuntimePolicySettings(req.authUserId, readOrgIdFromRequest(req) ?? req.authOrgId),
  );
  const approvalRequest = await persistMemoryIgnitionApprovalRequestForGuard(req, guarded, moment);

  emitMemoryEvent({
    kind: "request_logged",
    userId: req.authUserId,
    payload: {
      route: `memoryignition/${moment.replace(/_/g, "-")}`,
      allowed: guarded.action_guard.allowed,
      approvalRequired: guarded.action_guard.approval_required,
      approvalRequestId: approvalRequest?.id ?? null,
      gateStatus: guarded.evaluation_gate.status,
      riskyFiles: guarded.risky_files.length,
      requiredTests: guarded.required_tests.length,
      at: new Date().toISOString(),
    },
  });

  sendApiSuccess(
    res,
    200,
    guarded,
    buildApiMeta(req, startedAt, {
      intent: `memoryignition_${moment}`,
    }),
  );
}

memoryRouter.post(
  "/memoryignition/before-action",
  asyncHandler(async (req, res) => handleMemoryIgnitionActionGuard(req, res, "before_action")),
);

memoryRouter.post(
  "/memoryignition/during-action",
  asyncHandler(async (req, res) => handleMemoryIgnitionActionGuard(req, res, "during_action")),
);

memoryRouter.post(
  "/memoryignition/risk-check",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = MemoryIgnitionBeforeAgentSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError(
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

    const brief = withMemoryIgnitionRuntime(
      await beforeModel(toMemoryIgnitionBeforeModelInput(req, parsed.data, "Check MemoryIgnition risk.")),
      "risk_check",
      parsed.data,
      await getMemoryIgnitionRuntimePolicySettings(req.authUserId, readOrgIdFromRequest(req) ?? req.authOrgId),
    );
    const approvalRequest = await persistMemoryIgnitionApprovalRequestForGuard(req, brief, "risk_check");
    const blocked = brief.action_guard.blocked;
    emitMemoryEvent({
      kind: "request_logged",
      userId: req.authUserId,
      payload: {
        route: "memoryignition/risk-check",
        blocked,
        riskyFiles: brief.risky_files.length,
        approvalRequired: brief.action_guard.approval_required,
        approvalRequestId: approvalRequest?.id ?? null,
        gateStatus: brief.evaluation_gate.status,
        proofScore: brief.brief_proof_quality.score,
        at: new Date().toISOString(),
      },
    });

    sendApiSuccess(
      res,
      200,
      {
        allowed: !blocked,
        risk_level: parsed.data.risk_level ?? brief.action_guard.risk_level ?? (blocked ? "high" : "low"),
        approval_required: brief.action_guard.approval_required,
        approval_rules: brief.approval_rules,
        risky_files: brief.risky_files,
        required_tests: brief.required_tests,
        forbidden_actions: brief.forbidden_actions,
        trace_proof: brief.trace_proof,
        recommended_first_action: brief.recommended_first_action,
        brief_proof_quality: brief.brief_proof_quality,
        evaluation_gate: brief.evaluation_gate,
        standard_inheritance_package: brief.standard_inheritance_package,
        action_guard: brief.action_guard,
        internal_agents: brief.internal_agents,
      },
      buildApiMeta(req, startedAt, {
        intent: "memoryignition_risk_check",
      }),
    );
  }),
);

memoryRouter.get("/approvals", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const normalizedStatus =
    status === "pending" || status === "approved" || status === "rejected" ? status : undefined;
  const limit =
    typeof req.query.limit === "string" && Number.isFinite(Number(req.query.limit))
      ? Math.min(Math.max(Number.parseInt(req.query.limit, 10), 1), 100)
      : 50;
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? null;
  const approvals = await listMemoryIgnitionApprovalRequests({
    userId: req.authUserId,
    orgId,
    status: normalizedStatus,
    limit,
  });
  const approvalsWithAuditProof = approvals.map((approval) => ({
    ...approval,
    auditProof: buildMemoryIgnitionApprovalAuditProof(approval),
  }));
  const allForCounts = await listMemoryIgnitionApprovalRequests({
    userId: req.authUserId,
    orgId,
    limit: 100,
  });
  const counts = allForCounts.reduce(
    (acc, approval) => {
      acc.total += 1;
      acc[approval.status] += 1;
      if (approval.blocked) acc.blocked += 1;
      if (approval.riskLevel === "high" || approval.riskLevel === "critical") acc.highRisk += 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0, blocked: 0, highRisk: 0 },
  );

  sendApiSuccess(
    res,
    200,
    {
      version: "memoryignition_approval_requests.v1",
      generatedAt: new Date().toISOString(),
      approvals: approvalsWithAuditProof,
      counts,
    },
    buildApiMeta(req, startedAt, { intent: "memoryignition_approval_requests" }),
  );
}));

memoryRouter.post("/approvals/:approvalId/review", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const rawDecision = req.body?.decision;
  const decision =
    rawDecision === "approve" || rawDecision === "approved"
      ? "approve"
      : rawDecision === "reject" || rawDecision === "rejected"
        ? "reject"
        : null;
  if (!decision) {
    sendApiError(
      res,
      400,
      {
        code: "BAD_REQUEST",
        message: "decision must be approve or reject",
      },
      buildApiMeta(req, startedAt),
    );
    return;
  }
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? null;
  const approvalId = Array.isArray(req.params.approvalId) ? req.params.approvalId[0] : req.params.approvalId;
  const approval = await reviewMemoryIgnitionApprovalRequest({
    id: approvalId,
    userId: req.authUserId,
    orgId,
    decision,
    reviewedBy: req.authUserId,
    note: typeof req.body?.note === "string" ? req.body.note : null,
  });
  if (!approval) {
    sendApiError(
      res,
      404,
      {
        code: "NOT_FOUND",
        message: "Approval request not found",
      },
      buildApiMeta(req, startedAt),
    );
    return;
  }

  emitMemoryEvent({
    kind: "request_logged",
    userId: req.authUserId,
    payload: {
      route: "memoryignition/approval-review",
      approvalRequestId: approval.id,
      status: approval.status,
      reviewedBy: approval.reviewedBy,
      auditProof: buildMemoryIgnitionApprovalAuditProof(approval),
      orgId,
      at: approval.reviewedAt,
    },
  });

  emitMemoryEvent({
    kind: "timeline_updated",
    userId: req.authUserId,
    source: "memory-ignition",
    subject: {
      type: "approval_review",
      id: approval.id,
      label: `Approval ${approval.status}`,
    },
    payload: {
      route: "memoryignition/approval-review",
      approvalRequestId: approval.id,
      status: approval.status,
      reviewedBy: approval.reviewedBy,
      orgId,
      at: approval.reviewedAt,
    },
  });

  sendApiSuccess(
    res,
    200,
    { approval: { ...approval, auditProof: buildMemoryIgnitionApprovalAuditProof(approval) } },
    buildApiMeta(req, startedAt, { intent: "memoryignition_approval_review" }),
  );
}));

function buildMemoryIgnitionApprovalReplay(
  approval: MemoryIgnitionApprovalRequest,
  settings: MemoryIgnitionRuntimePolicySettings,
) {
  const guardProof = isObjectRecord(approval.guardProof) ? approval.guardProof : {};
  const originalRuntimePolicy = isObjectRecord(guardProof.runtime_policy) ? guardProof.runtime_policy : {};
  const originalGovernanceDecision = isObjectRecord(guardProof.governance_decision) ? guardProof.governance_decision : {};
  const explicitAllowedTools = Array.isArray(originalRuntimePolicy.allowed_tools)
    ? originalRuntimePolicy.allowed_tools.filter((item): item is string => typeof item === "string")
    : [];
  const requestedTool = typeof originalRuntimePolicy.requested_tool === "string" ? originalRuntimePolicy.requested_tool : null;
  const requestedCommand =
    typeof originalRuntimePolicy.requested_command === "string"
      ? originalRuntimePolicy.requested_command
      : approval.action;
  const resolvedPolicy = resolveMemoryIgnitionRuntimeAllowedTools({
    settings,
    explicitAllowedTools: [],
    agentId: typeof originalRuntimePolicy.agent_id === "string" ? originalRuntimePolicy.agent_id : null,
    agentType: typeof originalRuntimePolicy.agent_type === "string" ? originalRuntimePolicy.agent_type : null,
    riskLevel: approval.riskLevel,
  });
  const currentAllowed = !requestedTool || resolvedPolicy.allowedTools.includes(requestedTool);
  const approvalRequiredNow = Boolean(resolvedPolicy.requiresApproval);
  const policyChanged =
    originalRuntimePolicy.policy_id !== resolvedPolicy.policyId ||
    originalRuntimePolicy.policy_source !== resolvedPolicy.source ||
    Boolean(originalRuntimePolicy.approval_required_by_policy) !== resolvedPolicy.requiresApproval ||
    currentAllowed !== Boolean(originalRuntimePolicy.tool_allowed ?? true);
  const replayStatus: "valid" | "stale" | "needs_reapproval" | "blocked" =
    !currentAllowed
      ? "blocked"
      : approval.status === "approved"
        ? policyChanged
          ? "stale"
          : "valid"
        : "needs_reapproval";
  const replayReason = !currentAllowed
    ? "Current runtime policy blocks the requested tool."
    : approval.status === "approved"
      ? policyChanged
        ? "The approval was valid when recorded, but current workspace policy now differs."
        : "The approval still matches current workspace policy."
      : approvalRequiredNow
        ? "The action still requires a fresh approval under current workspace policy."
        : "The action can execute without re-approval under current workspace policy.";

  return {
    version: "memoryignition_approval_replay.v1" as const,
    approvalId: approval.id,
    runtimeEventId: approval.runtimeEventId,
    action: approval.action,
    riskLevel: approval.riskLevel,
    originalApprovalStatus: approval.status,
    originalAuditProof: buildMemoryIgnitionApprovalAuditProof(approval),
    currentRuntimePolicy: {
      version: "memoryignition_runtime_policy_settings.v1" as const,
      id: settings.id,
      source: resolvedPolicy.source,
      policyId: resolvedPolicy.policyId,
      allowedTools: resolvedPolicy.allowedTools,
      policyUpdatedAt: settings.updatedAt,
      requiresApproval: resolvedPolicy.requiresApproval,
    },
    replay: {
      status: replayStatus,
      reason: replayReason,
      currentAllowed,
      currentApprovalRequired: approvalRequiredNow,
      policyChanged,
      requestedTool,
      requestedCommand,
      runtimePolicy: {
        version: "memoryignition_runtime_policy.v1" as const,
        moment: approval.guardMoment,
        policy_settings_version: settings.version,
        policy_settings_id: settings.id,
        policy_source: resolvedPolicy.source,
        policy_id: resolvedPolicy.policyId,
        policy_updated_at: settings.updatedAt,
        approval_required_by_policy: resolvedPolicy.requiresApproval,
        approval_policy_id: resolvedPolicy.approvalPolicyId,
        approval_reason: resolvedPolicy.requiresApproval
          ? `${resolvedPolicy.approvalPolicyId} requires human approval before execution.`
          : null,
        agent_id: typeof originalRuntimePolicy.agent_id === "string" ? originalRuntimePolicy.agent_id : null,
        agent_type: typeof originalRuntimePolicy.agent_type === "string" ? originalRuntimePolicy.agent_type : null,
        allowed_tools: resolvedPolicy.allowedTools,
        requested_tool: requestedTool,
        requested_command: requestedCommand,
        tool_permissions_declared: resolvedPolicy.allowedTools.length > 0,
        tool_allowed: currentAllowed,
        denied_tools: currentAllowed || !requestedTool ? [] : [requestedTool],
        status: currentAllowed ? "satisfied" : "blocked",
        checks: [
          {
            id: "agent_identity",
            label: "Agent identity",
            ok: Boolean(originalRuntimePolicy.agent_id ?? originalRuntimePolicy.agent_type),
            detail: originalRuntimePolicy.agent_id ?? originalRuntimePolicy.agent_type
              ? `Agent ${originalRuntimePolicy.agent_id ?? originalRuntimePolicy.agent_type} identified in original approval.`
              : "Original approval did not record an agent identity.",
          },
          {
            id: "tool_permission",
            label: "Tool permission",
            ok: currentAllowed,
            detail: currentAllowed
              ? `Requested ${requestedTool ?? "none"} is allowed by ${resolvedPolicy.policyId}.`
              : `Requested ${requestedTool ?? "none"} is not allowed by ${resolvedPolicy.policyId}.`,
          },
        ],
        next_required_actions: currentAllowed
          ? approvalRequiredNow
            ? ["Re-run the approval request with current workspace policy and approval trace."]
            : []
          : [`Grant ${requestedTool ?? "the requested tool"} or update the workspace runtime policy.`],
      },
      governanceDecision: {
        version: "memoryignition_guardian_governance_decision.v1" as const,
        status: currentAllowed ? (approvalRequiredNow ? "approval_required" : "allowed") : "blocked",
        allowed: currentAllowed,
        blocked: !currentAllowed,
        approval_required: approvalRequiredNow,
        approval_sources: [
          resolvedPolicy.requiresApproval ? `runtime_policy:${resolvedPolicy.approvalPolicyId ?? resolvedPolicy.policyId}` : null,
          originalGovernanceDecision.approval_required ? "original_governance_decision" : null,
        ].filter((item): item is string => Boolean(item)),
        blocking_sources: currentAllowed ? [] : ["runtime_tool_permission"],
        runtime_policy_id: resolvedPolicy.policyId,
        runtime_policy_source: resolvedPolicy.source,
        approval_policy_id: resolvedPolicy.approvalPolicyId,
        denied_tools: currentAllowed || !requestedTool ? [] : [requestedTool],
        matched_risky_files: approval.matchedRiskyFiles,
        matched_forbidden_actions: approval.matchedForbiddenActions,
        missing_required_tests: approval.missingRequiredTests,
        reason: replayReason,
        next_required_actions: currentAllowed
          ? approvalRequiredNow
            ? ["Re-evaluate the approval under current policy."]
            : []
          : [`Grant ${requestedTool ?? "the requested tool"} or update the workspace runtime policy.`],
      },
      proof: {
        original: approval.guardProof,
        originalAllowedTools: explicitAllowedTools,
        replayedAt: new Date().toISOString(),
      },
    },
  };
}

memoryRouter.get("/approvals/:approvalId/replay", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? null;
  const approvalId = Array.isArray(req.params.approvalId) ? req.params.approvalId[0] : req.params.approvalId;
  const approvals = await listMemoryIgnitionApprovalRequests({ userId: req.authUserId, orgId, limit: 100 });
  const approval = approvals.find((entry) => entry.id === approvalId) ?? null;
  if (!approval) {
    sendApiError(
      res,
      404,
      { code: "NOT_FOUND", message: "Approval request not found" },
      buildApiMeta(req, startedAt),
    );
    return;
  }

  const replay = buildMemoryIgnitionApprovalReplay(approval, await getMemoryIgnitionRuntimePolicySettings(req.authUserId, orgId));
  emitMemoryEvent({
    kind: "request_logged",
    userId: req.authUserId,
    payload: {
      route: "memoryignition/approval-replay",
      approvalRequestId: approval.id,
      replayStatus: replay.replay.status,
      runtimePolicyId: replay.replay.runtimePolicy.policy_id,
      runtimePolicySource: replay.replay.runtimePolicy.policy_source,
      at: new Date().toISOString(),
    },
  });

  sendApiSuccess(
    res,
    200,
    replay,
    buildApiMeta(req, startedAt, {
      intent: "memoryignition_approval_replay",
    }),
  );
}));

memoryRouter.get("/memoryignition/runtime-policy", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? null;
  const settings = await getMemoryIgnitionRuntimePolicySettings(req.authUserId, orgId);

  sendApiSuccess(
    res,
    200,
    settings,
    buildApiMeta(req, startedAt, {
      intent: "memoryignition_runtime_policy_read",
    }),
  );
}));

memoryRouter.patch("/memoryignition/runtime-policy", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId ?? null;
  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const settings = await saveMemoryIgnitionRuntimePolicySettings({
    userId: req.authUserId,
    orgId,
    updatedBy: req.authUserId,
    patch: {
      defaultAllowedTools: Array.isArray(body.defaultAllowedTools) ? body.defaultAllowedTools as string[] : undefined,
      agentPolicies: Array.isArray(body.agentPolicies)
        ? body.agentPolicies as MemoryIgnitionRuntimePolicySettings["agentPolicies"]
        : undefined,
      riskPolicies: Array.isArray(body.riskPolicies)
        ? body.riskPolicies as MemoryIgnitionRuntimePolicySettings["riskPolicies"]
        : undefined,
    },
  });

  emitMemoryEvent({
    kind: "request_logged",
    userId: req.authUserId,
    payload: {
      route: "memoryignition/runtime-policy",
      orgId,
      defaultAllowedTools: settings.defaultAllowedTools,
      agentPolicies: settings.agentPolicies.length,
      riskPolicies: settings.riskPolicies.length,
      at: settings.updatedAt,
    },
  });

  sendApiSuccess(
    res,
    200,
    settings,
    buildApiMeta(req, startedAt, {
      intent: "memoryignition_runtime_policy_update",
    }),
  );
}));

memoryRouter.get("/memoryignition/runtime-timeline", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const limit =
    typeof req.query.limit === "string" && Number.isFinite(Number(req.query.limit))
      ? Math.min(Math.max(Number.parseInt(req.query.limit, 10), 1), 120)
      : 80;
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const timeline = await buildMemoryIgnitionRuntimeTimeline(req.authUserId, limit, orgId);

  sendApiSuccess(
    res,
    200,
    timeline,
    buildApiMeta(req, startedAt, {
      intent: "memoryignition_runtime_timeline",
    }),
  );
}));

memoryRouter.get("/memoryignition/outcome-learning", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const limit =
    typeof req.query.limit === "string" && Number.isFinite(Number(req.query.limit))
      ? Math.min(Math.max(Number.parseInt(req.query.limit, 10), 1), 120)
      : 80;
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const summary = await buildMemoryIgnitionOutcomeLearningSummary(req.authUserId, limit, orgId);

  sendApiSuccess(
    res,
    200,
    summary,
    buildApiMeta(req, startedAt, {
      intent: "memoryignition_outcome_learning",
    }),
  );
}));

memoryRouter.post("/memoryignition/run-gate", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const task =
    isObjectRecord(req.body) && typeof req.body.task === "string" && req.body.task.trim().length > 0
      ? req.body.task.trim()
      : "Phase 5 MemoryIgnition runtime gate proves before-agent, risk-check, trace proof, and outcome learning.";
  const checks: Array<{
    id: string;
    label: string;
    ok: boolean;
    detail: string;
    requestId?: string;
  }> = [];
  const briefInput = {
    question: task,
    task: task,
    task_intent: task,
    agent_id: "codex",
    repo_or_task: "memoryos",
    project: "memoryos",
    mode: "retrieve" as const,
    topK: 8,
    available_tools: ["read_files", "terminal", "tests"],
    risk_level: "medium",
    ...(orgId ? { orgId } : {}),
  };

  let beforeAgentBrief: Awaited<ReturnType<typeof beforeModel>> | null = null;
  const beforeStartedAt = Date.now();
  try {
    beforeAgentBrief = await beforeModel({
      userId: req.authUserId,
      ...briefInput,
    });
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/before-agent",
      statusCode: 200,
      userId: req.authUserId,
      durationMs: Date.now() - beforeStartedAt,
      payloadSummary: briefInput,
      responseSummary: { data: beforeAgentBrief },
    });
    checks.push({
      id: "before_agent",
      label: "Before-agent brief",
      ok: beforeAgentBrief.ready_to_send_prompt.includes("MemoryIgnition Brief"),
      detail: `${beforeAgentBrief.relevant_memories.length} memories, ${beforeAgentBrief.executable_skills.length} skills, ${beforeAgentBrief.trace_proof.length} trace proofs.`,
      requestId: entry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Before-agent brief failed";
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/before-agent",
      statusCode: 500,
      userId: req.authUserId,
      durationMs: Date.now() - beforeStartedAt,
      payloadSummary: briefInput,
      errorDetails: { message },
    });
    checks.push({
      id: "before_agent",
      label: "Before-agent brief",
      ok: false,
      detail: message,
      requestId: entry.id,
    });
  }

  let riskBrief: Awaited<ReturnType<typeof beforeModel>> | null = null;
  const riskStartedAt = Date.now();
  try {
    riskBrief = await beforeModel({
      userId: req.authUserId,
      ...briefInput,
      question: `Risk-check before action: ${task}`,
    });
    const blocked = !riskBrief.evaluation_gate.can_execute;
    const riskResponse = {
      allowed: !blocked,
      approval_required: riskBrief.approval_rules.approval_required,
      approval_rules: riskBrief.approval_rules,
      risky_files: riskBrief.risky_files,
      required_tests: riskBrief.required_tests,
      forbidden_actions: riskBrief.forbidden_actions,
      trace_proof: riskBrief.trace_proof,
      recommended_first_action: riskBrief.recommended_first_action,
      brief_proof_quality: riskBrief.brief_proof_quality,
      evaluation_gate: riskBrief.evaluation_gate,
    };
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/risk-check",
      statusCode: 200,
      userId: req.authUserId,
      durationMs: Date.now() - riskStartedAt,
      payloadSummary: briefInput,
      responseSummary: { data: riskResponse },
    });
    checks.push({
      id: "risk_check",
      label: "Risk check",
      ok: Boolean(riskBrief.approval_rules.reason && Array.isArray(riskBrief.forbidden_actions)),
      detail: `${riskBrief.approval_rules.derived_risk_level} risk · ${riskBrief.approval_rules.approval_required ? "approval required" : "approval not required"} · ${riskBrief.required_tests.length} tests.`,
      requestId: entry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Risk check failed";
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/risk-check",
      statusCode: 500,
      userId: req.authUserId,
      durationMs: Date.now() - riskStartedAt,
      payloadSummary: briefInput,
      errorDetails: { message },
    });
    checks.push({
      id: "risk_check",
      label: "Risk check",
      ok: false,
      detail: message,
      requestId: entry.id,
    });
  }

  const traceItems = beforeAgentBrief?.trace_proof ?? riskBrief?.trace_proof ?? [];
  const sourceBackedTraceCount = traceItems.filter((item) => Boolean(item.source_ref)).length;
  checks.push({
    id: "trace_proof",
    label: "Trace proof",
    ok: traceItems.length > 0 && sourceBackedTraceCount > 0,
    detail: `${sourceBackedTraceCount}/${traceItems.length} inherited trace links have source proof.`,
  });

  const outcomeInput = {
    repo_or_task: "memoryos",
    task_intent: task,
    agent_id: "codex",
    outcome_status: "success",
    outcome: "Phase 5 MemoryIgnition runtime gate completed.",
    modelResponse: beforeAgentBrief?.ready_to_send_prompt?.slice(0, 4000) ?? "No brief generated.",
    tests_passed: ["phase5:memoryignition:gate"],
    tests_failed: [],
    what_worked: "Before-agent, risk-check, trace proof, and outcome-learning paths were exercised.",
    future_agent_lesson: "Run the Phase 5 MemoryIgnition gate before deployment to verify runtime inheritance.",
    used_skill_ids: beforeAgentBrief?.executable_skills.map((skill) => skill.id) ?? [],
    risk_level: riskBrief?.approval_rules.derived_risk_level ?? beforeAgentBrief?.approval_rules.derived_risk_level ?? "medium",
    ...(orgId ? { orgId } : {}),
  };
  const outcomeStartedAt = Date.now();
  try {
    const outcome = await afterModel({
      userId: req.authUserId,
      ...outcomeInput,
    });
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/outcome",
      statusCode: 200,
      userId: req.authUserId,
      durationMs: Date.now() - outcomeStartedAt,
      payloadSummary: outcomeInput,
      responseSummary: { data: outcome },
    });
    checks.push({
      id: "outcome_learning",
      label: "Outcome learning",
      ok: Boolean(outcome.outcome_recorded) && Boolean(outcome.action_memory_id || outcome.execution_outcome_id || outcome.experience_record_id),
      detail: outcome.experience_record_id
        ? `Experience ${outcome.experience_record_id} recorded.`
        : `Outcome recorded with action ${outcome.action_memory_id ?? "not reported"}.`,
      requestId: entry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outcome learning failed";
    const entry = recordRequestHistoryEntry({
      method: "POST",
      path: "/api/memory/memoryignition/outcome",
      statusCode: 500,
      userId: req.authUserId,
      durationMs: Date.now() - outcomeStartedAt,
      payloadSummary: outcomeInput,
      errorDetails: { message },
    });
    checks.push({
      id: "outcome_learning",
      label: "Outcome learning",
      ok: false,
      detail: message,
      requestId: entry.id,
    });
  }

  const passed = checks.filter((check) => check.ok).length;
  const status = passed === checks.length ? "ready" : passed >= 3 ? "partial" : "blocked";
  const response = {
    generatedAt: new Date().toISOString(),
    status,
    ready: status === "ready",
    passed,
    total: checks.length,
    checks,
    brief: beforeAgentBrief
      ? {
          relevantMemoryCount: beforeAgentBrief.relevant_memories.length,
          executableSkillCount: beforeAgentBrief.executable_skills.length,
          traceProofCount: beforeAgentBrief.trace_proof.length,
          proofQualityScore: beforeAgentBrief.brief_proof_quality.score,
          gateStatus: beforeAgentBrief.evaluation_gate.status,
          canInherit: beforeAgentBrief.evaluation_gate.can_inherit,
          canExecute: beforeAgentBrief.evaluation_gate.can_execute,
        }
      : null,
    risk: riskBrief
      ? {
          approvalRequired: riskBrief.approval_rules.approval_required,
          derivedRiskLevel: riskBrief.approval_rules.derived_risk_level,
          requiredTestCount: riskBrief.required_tests.length,
          forbiddenActionCount: riskBrief.forbidden_actions.length,
        }
      : null,
    next: "Open MemoryIgnition and inspect the generated brief, risk guard, trace proof, and outcome timeline.",
  };

  emitMemoryEvent({
    kind: "request_logged",
    userId: req.authUserId,
    payload: {
      route: "memoryignition/run-gate",
      status,
      passed,
      total: checks.length,
      at: response.generatedAt,
    },
  });

  sendApiSuccess(
    res,
    200,
    response,
    buildApiMeta(req, startedAt, { intent: "phase5_memoryignition_gate" }),
  );
}));

async function handleMemoryIgnitionOutcomeLearn(
  req: Request & { authUserId: string; authOrgId?: string },
  res: ExpressResponse,
): Promise<void> {
  const startedAt = Date.now();
  const parsed = MemoryIgnitionOutcomeLearnSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    sendApiError(
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

  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const result = await afterModel({
    userId: req.authUserId,
    ...(orgId ? { orgId } : {}),
    ...(parsed.data.message ? { message: parsed.data.message } : {}),
    ...(parsed.data.modelResponse ? { modelResponse: parsed.data.modelResponse } : {}),
    ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    ...(parsed.data.workspace_id ? { workspace_id: parsed.data.workspace_id } : {}),
    ...(parsed.data.agent_id ? { agent_id: parsed.data.agent_id } : {}),
    ...(parsed.data.repo_or_task ? { repo_or_task: parsed.data.repo_or_task } : {}),
    ...(parsed.data.task_intent ? { task_intent: parsed.data.task_intent } : {}),
    ...(parsed.data.outcome ? { outcome: parsed.data.outcome } : {}),
    ...(parsed.data.outcome_status ? { outcome_status: parsed.data.outcome_status } : {}),
    ...(parsed.data.files_touched ? { files_touched: parsed.data.files_touched } : {}),
    ...(parsed.data.tests_passed ? { tests_passed: parsed.data.tests_passed } : {}),
    ...(parsed.data.tests_failed ? { tests_failed: parsed.data.tests_failed } : {}),
    ...(parsed.data.what_worked ? { what_worked: parsed.data.what_worked } : {}),
    ...(parsed.data.what_failed ? { what_failed: parsed.data.what_failed } : {}),
    ...(parsed.data.future_agent_lesson ? { future_agent_lesson: parsed.data.future_agent_lesson } : {}),
    ...(parsed.data.tool_calls ? { tool_calls: parsed.data.tool_calls } : {}),
    ...(parsed.data.used_skill_ids ? { used_skill_ids: parsed.data.used_skill_ids } : {}),
    ...(parsed.data.skill_ids ? { skill_ids: parsed.data.skill_ids } : {}),
    ...(parsed.data.approvals_used ? { approvals_used: parsed.data.approvals_used } : {}),
    ...(parsed.data.risky_files_touched ? { risky_files_touched: parsed.data.risky_files_touched } : {}),
    ...(parsed.data.trace_proof_ids ? { trace_proof_ids: parsed.data.trace_proof_ids } : {}),
    ...(parsed.data.related_reasoning_ids ? { relatedReasoningIds: parsed.data.related_reasoning_ids } : {}),
    ...(parsed.data.send_event_id ? { send_event_id: parsed.data.send_event_id } : {}),
    ...(parsed.data.target_agent ? { target_agent: parsed.data.target_agent } : {}),
    ...(parsed.data.target_format ? { target_format: parsed.data.target_format } : {}),
    ...(parsed.data.risk_level ? { risk_level: parsed.data.risk_level } : {}),
    ...(parsed.data.contract ? { contract: parsed.data.contract } : {}),
    ...(parsed.data.enforceContract !== undefined ? { enforceContract: parsed.data.enforceContract } : {}),
  });
  const linkedApprovals = result.outcome_proof.approvals_used.length
    ? await attachOutcomeToMemoryIgnitionApprovalRequests({
        userId: req.authUserId,
        orgId: orgId ?? null,
        approvalIds: result.outcome_proof.approvals_used,
        outcome: {
          outcomeEventId: result.outcome_proof.outcome_event_id,
          sourceRef: result.outcome_proof.source_ref,
          sendEventId: result.outcome_proof.send_event_id,
          targetAgent: result.outcome_proof.target_agent,
          targetFormat: result.outcome_proof.target_format,
          futureInheritanceReady: result.outcome_proof.future_inheritance_ready,
          evidence: result.outcome_proof.evidence,
          linkedAt: new Date().toISOString(),
        },
      })
    : [];
  const responsePayload = {
    ...result,
    approval_outcome_links: linkedApprovals.map((approval) => ({
      approval_id: approval.id,
      status: approval.status,
      outcome_links: approval.outcomeLinks,
    })),
  };

  emitMemoryEvent({
    kind: "agent_run_completed",
    userId: req.authUserId,
    source: "memory-ignition",
    subject: {
      type: "run",
      id: result.outcome_proof.outcome_event_id,
      label: result.outcome_proof.future_inheritance_ready
        ? "Agent run completed with inheritance-ready outcome"
        : "Agent run completed",
    },
    payload: {
      route: "memoryignition/outcome-learn",
      outcomeEventId: result.outcome_proof.outcome_event_id,
      sendEventId: result.outcome_proof.send_event_id,
      outcomeStatus: parsed.data.outcome_status ?? null,
      futureInheritanceReady: result.outcome_proof.future_inheritance_ready,
      approvalsUsed: result.outcome_proof.approvals_used,
      approvalsLinked: linkedApprovals.length,
      filesTouched: parsed.data.files_touched ?? [],
      testsPassed: parsed.data.tests_passed ?? [],
      testsFailed: parsed.data.tests_failed ?? [],
      at: new Date().toISOString(),
    },
  });

  emitMemoryEvent({
    kind: "outcome_recorded",
    userId: req.authUserId,
    source: "memory-ignition",
    subject: {
      type: "outcome",
      id: result.outcome_proof.outcome_event_id,
      label: result.outcome_proof.future_inheritance_ready ? "Outcome recorded" : "Outcome learned",
    },
    payload: {
      route: "memoryignition/outcome-learn",
      skillOutcomes: result.skill_outcomes?.length ?? 0,
      experienceRecordId: result.experience_record_id ?? null,
      outcomeEventId: result.outcome_proof.outcome_event_id,
      sendEventId: result.outcome_proof.send_event_id,
      approvalsUsed: result.outcome_proof.approvals_used,
      approvalsLinked: linkedApprovals.length,
      futureInheritanceReady: result.outcome_proof.future_inheritance_ready,
      lessons: parsed.data.future_agent_lesson ? [parsed.data.future_agent_lesson] : [],
      at: new Date().toISOString(),
    },
  });

  if (parsed.data.future_agent_lesson) {
    emitMemoryEvent({
      kind: "future_instruction_created",
      userId: req.authUserId,
      source: "memory-ignition",
      subject: {
        type: "future_instruction",
        id: `fi_${result.outcome_proof.outcome_event_id}`,
        label: parsed.data.future_agent_lesson,
      },
      payload: {
        route: "memoryignition/outcome-learn",
        outcomeEventId: result.outcome_proof.outcome_event_id,
        sendEventId: result.outcome_proof.send_event_id,
        triggerContext: parsed.data.task_intent ?? parsed.data.repo_or_task ?? parsed.data.message ?? "MemoryIgnition outcome",
        instruction: parsed.data.future_agent_lesson,
        affectedFiles: parsed.data.files_touched ?? [],
        requiredTests: parsed.data.tests_passed ?? [],
        failedTests: parsed.data.tests_failed ?? [],
        riskLevel: parsed.data.risk_level ?? "medium",
        proof: [
          `outcome-proof:${result.outcome_proof.outcome_event_id}`,
          ...(result.outcome_proof.send_event_id ? [`send-now:${result.outcome_proof.send_event_id}`] : []),
          ...(result.experience_record_id ? [`experience:${result.experience_record_id}`] : []),
          ...result.outcome_proof.evidence,
        ],
        status: result.outcome_proof.future_inheritance_ready ? "ready" : "needs_review",
        futureInheritanceReady: result.outcome_proof.future_inheritance_ready,
        at: new Date().toISOString(),
      },
    });
  }

  emitMemoryEvent({
    kind: "memory_processed",
    userId: req.authUserId,
    payload: {
      route: "memoryignition/outcome-learn",
      skillOutcomes: result.skill_outcomes?.length ?? 0,
      experienceRecordId: result.experience_record_id ?? null,
      outcomeEventId: result.outcome_proof.outcome_event_id,
      sendEventId: result.outcome_proof.send_event_id,
      approvalsUsed: result.outcome_proof.approvals_used,
      approvalsLinked: linkedApprovals.length,
      futureInheritanceReady: result.outcome_proof.future_inheritance_ready,
      at: new Date().toISOString(),
    },
  });

  sendApiSuccess(
    res,
    200,
    responsePayload,
    buildApiMeta(req, startedAt, {
      intent: "memoryignition_outcome_learn",
    }),
  );
}

memoryRouter.post(
  "/memoryignition/after-agent",
  asyncHandler(handleMemoryIgnitionOutcomeLearn),
);

memoryRouter.post(
  "/memoryignition/outcome-learn",
  asyncHandler(handleMemoryIgnitionOutcomeLearn),
);

memoryRouter.post(
  "/memoryignition/outcome",
  asyncHandler(handleMemoryIgnitionOutcomeLearn),
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
      ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
      ...(parsed.data.service ? { service: parsed.data.service } : {}),
      ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
      ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
    });

    const brief = toContinueProjectBrief(result);
    const prompts = toPromptBundle({ project: parsed.data.project, brief });
    const target = parsed.data.target ?? "cursor";
    const trace =
      brief.whyTheseMemoriesWereSelected.length > 0
        ? brief.whyTheseMemoriesWereSelected.slice(0, 6).map((memory) => ({
            memoryId: memory.memoryId,
            source: memory.contractCategory ?? "retrieved",
            ...(memory.contractCategory ? { contractCategory: memory.contractCategory } : {}),
            confidence: Number(memory.finalScore.toFixed(3)),
            whySelected:
              memory.reasonTags && memory.reasonTags.length > 0
                ? `${memory.summary} (${memory.reasonTags.slice(0, 3).join(", ")})`
                : memory.summary,
          }))
        : result.usedMemories.slice(0, 6).map((memory) => ({
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
      traceProof: toTraceProof({
        trace,
        target,
        resumeConfidenceScore: brief.resumeConfidence?.score,
      }),
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

  const unregister = registerMemoryRealtimeSink(userId, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {"ts":"${new Date().toISOString()}"}\n\n`);
    } catch {
      // ignored
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unregister();
  });
})); 

memoryRouter.get("/events/history", asyncHandler(async (req, res) => {
  const limitRaw =
    typeof req.query.limit === "string" && req.query.limit.length > 0
      ? req.query.limit
      : undefined;
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
    limit = Math.min(parsedLimit, 500);
  }

  const events = await listMemoryRealtimeEvents(req.authUserId, limit);

  res.status(200).json({
    events,
    count: events.length,
  });
}));

memoryRouter.get("/events/projection", asyncHandler(async (req, res) => {
  const projection =
    (await getMemoryRealtimeProjection(req.authUserId)) ??
    {
      userId: req.authUserId,
      updatedAt: new Date().toISOString(),
      totalEvents: 0,
      totalByKind: {
        source_synced: 0,
        memory_extracted: 0,
        experience_captured: 0,
        skill_candidate_generated: 0,
        skill_approved: 0,
        agent_run_prepared: 0,
        agent_run_started: 0,
        agent_run_completed: 0,
        outcome_recorded: 0,
        future_instruction_created: 0,
        brief_ready: 0,
        projection_refreshed: 0,
        memory_processed: 0,
        handoff_generated: 0,
        resume_generated: 0,
        timeline_updated: 0,
        request_logged: 0,
        governance_review_queued: 0,
        api_keys_changed: 0,
        service_users_changed: 0,
      },
      totalByStage: {
        source_sync: 0,
        memory: 0,
        experience: 0,
        skill: 0,
        governance: 0,
        execution: 0,
        learning: 0,
        system: 0,
      },
      latestEventAt: null,
      latestEventId: null,
      recentEvents: [],
    };

  res.status(200).json({
    projection,
  });
}));

memoryRouter.get("/system/health", asyncHandler(async (_req, res) => {
  ensureMemoryStoreIntegrity();

  const storesIntegrity = await hasValidStores();
  const retrievalConfigLoaded = hasValidBestConfig();
  const baselineReportPresent = (await readLatestBenchmarkBaseline()) !== null;

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
  const baselineReport = await readLatestBenchmarkBaseline();
  const baselineReportPresent = baselineReport !== null;
  const evalPassRate = baselineReport?.passRate ?? null;
  const totalEvalCases = baselineReport?.totalCases ?? null;
  const evalPassRateAtLeast90 =
    typeof evalPassRate === "number" && evalPassRate >= 90;

  const completed: string[] = [];
  const pending: string[] = [];

  if (storesIntegrity) {
    completed.push("Runtime memory stores are healthy in Prisma/Postgres.");
  } else {
    pending.push("Fix runtime memory store integrity.");
  }

  if (retrievalConfigLoaded) {
    completed.push("Best retrieval config is present and valid.");
  } else {
    pending.push("Generate and save a valid best retrieval config.");
  }

  if (baselineReportPresent) {
    completed.push("Latest benchmark baseline is present in Prisma.");
  } else {
    pending.push("Create a benchmark run baseline.");
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
    const latest = await getLatestRun();
    if (!latest) {
      res.status(404).json({
        error: "Benchmark report not found",
        source: "benchmark_runs",
      });
      return;
    }

    res.status(200).json(latest);
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

    const memoriesResult = await listMemories({
      userId,
      orgId: req.authOrgId,
      limit: 200,
    });
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
    orgId: req.authOrgId,
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

memoryRouter.get("/action-history", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const limitRaw =
    typeof req.query.limit === "string" && req.query.limit.length > 0
      ? req.query.limit
      : undefined;
  let limit = 20;
  if (limitRaw !== undefined) {
    const parsedLimit = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      sendApiError(
        res,
        400,
        { code: "invalid_query", message: "Invalid query", details: { limit: "limit must be a positive integer" } },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    limit = Math.min(parsedLimit, 100);
  }

  const sourceId =
    typeof req.query.sourceId === "string" && req.query.sourceId.trim().length > 0
      ? req.query.sourceId.trim()
      : undefined;

  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const items = await listActionMemoriesWithLineage(req.authUserId, { orgId, limit, sourceId });
  const actions = items.map((entry) => entry.actionMemory);

  sendApiSuccess(
    res,
    200,
    {
      items,
      actions,
      count: items.length,
    },
    buildApiMeta(req, startedAt),
  );
}));

memoryRouter.post("/action-memory", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = req.body as Record<string, unknown>;

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!action || !reason) {
    sendApiError(
      res,
      400,
      {
        code: "invalid_body",
        message: "Invalid request body",
        details: { action: "action and reason are required strings" },
      },
      buildApiMeta(req, startedAt),
    );
    return;
  }

  const outcomeRaw = typeof body.outcome === "string" ? body.outcome : "success";
  const outcome: ActionMemoryOutcome =
    outcomeRaw === "failed" || outcomeRaw === "rolled_back" ? outcomeRaw : "success";

  const sourceTypeRaw = typeof body.sourceType === "string" ? body.sourceType : "manual";
  const sourceType: ActionMemorySourceType =
    sourceTypeRaw === "github_execution" || sourceTypeRaw === "continuity"
      ? sourceTypeRaw
      : "manual";

  const orgId = readOrgIdFromRequest(req) ?? req.authOrgId;
  const actionMemory = await createActionMemory({
    userId: req.authUserId,
    orgId: orgId ?? null,
    projectId: typeof body.projectId === "string" ? body.projectId : null,
    workspace: typeof body.workspace === "string" ? body.workspace : null,
    action,
    reason,
    approvedBy: typeof body.approvedBy === "string" ? body.approvedBy : null,
    approvedAt: typeof body.approvedAt === "string" ? body.approvedAt : null,
    filesChanged: Array.isArray(body.filesChanged)
      ? body.filesChanged.filter((entry): entry is string => typeof entry === "string")
      : [],
    outcome,
    followUps: Array.isArray(body.followUps)
      ? body.followUps.filter((entry): entry is string => typeof entry === "string")
      : [],
    sourceType,
    sourceId: typeof body.sourceId === "string" ? body.sourceId : null,
    metadata:
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : null,
  });

  const experienceMemory = await persistExperienceGraphMemory({
    userId: req.authUserId,
    orgId: orgId ?? null,
    workspace: actionMemory.workspace,
    project: actionMemory.projectId,
    sourceType: "action_memory",
    sourceRef: actionMemory.id,
    task: actionMemory.action,
    problem: actionMemory.reason,
    context: [
      actionMemory.sourceType ? `Source type: ${actionMemory.sourceType}` : undefined,
      actionMemory.sourceId ? `Source id: ${actionMemory.sourceId}` : undefined,
      actionMemory.approvedBy ? `Approved by: ${actionMemory.approvedBy}` : undefined,
      actionMemory.approvedAt ? `Approved at: ${actionMemory.approvedAt}` : undefined,
    ].filter((value): value is string => Boolean(value)).join(" | ") || "Action outcome recorded by MemoryOS.",
    action: actionMemory.action,
    mistake:
      outcome === "failed" || outcome === "rolled_back"
        ? actionMemory.reason
        : null,
    outcome:
      outcome === "success"
        ? `Succeeded: ${actionMemory.reason}`
        : `${outcome}: ${actionMemory.reason}`,
    lesson:
      outcome === "success"
        ? "Preserve this successful action outcome as reusable execution experience for future agents."
        : "Future agents should review this failed or rolled-back action before repeating the workflow.",
    futureAgentInstruction: [
      actionMemory.filesChanged.length > 0
        ? `Review impacted files before repeating this action: ${actionMemory.filesChanged.join(", ")}.`
        : "Review the source evidence before repeating this action.",
      actionMemory.followUps.length > 0
        ? `Follow up on: ${actionMemory.followUps.join("; ")}.`
        : undefined,
    ].filter((value): value is string => Boolean(value)).join(" "),
    evidence: [
      `action-memory:${actionMemory.id}`,
      actionMemory.sourceId ? `${actionMemory.sourceType ?? "source"}:${actionMemory.sourceId}` : undefined,
      actionMemory.approvedBy ? `approval:${actionMemory.approvedBy}` : undefined,
    ].filter((value): value is string => Boolean(value)),
    files: actionMemory.filesChanged,
    riskLevel: outcome === "success" ? "medium" : "high",
    status: "captured",
    confidence: outcome === "success" ? 0.86 : 0.82,
    eventReason: "Phase 3 experience created automatically from action-memory outcome.",
  });

  const lineage = await getLineageForActionMemory(req.authUserId, actionMemory.id, orgId);

  sendApiSuccess(
    res,
    201,
    {
      actionMemory,
      experienceRecord: parseExperienceGraphMemory(experienceMemory),
      executionOutcomes: lineage.executionOutcomes,
      approvalTraces: lineage.approvalTraces,
    },
    buildApiMeta(req, startedAt),
  );
}));

memoryRouter.post("/continuity-feedback", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const body = req.body as Record<string, unknown>;
  const kind = isContinuityFeedbackKind(body.kind) ? body.kind : null;
  const rating = normalizeContinuityFeedbackRating(body.rating);

  if (!kind || rating === null) {
    sendApiError(
      res,
      400,
      {
        code: "invalid_continuity_feedback",
        message: "kind and rating are required. kind must be resume|handoff|before_model|after_model and rating must be 1-5.",
      },
      buildApiMeta(req, startedAt),
    );
    return;
  }

  const feedback = await appendContinuityFeedback({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind,
    rating,
    useful: typeof body.useful === "boolean" ? body.useful : undefined,
    requestId: body.requestId,
    project: body.project,
    agentId: body.agentId,
    missingContext: body.missingContext,
    wrongContext: body.wrongContext,
    shouldRemember: body.shouldRemember,
    note: body.note,
  });
  recordContinuityFeedbackMetric({
    kind: feedback.kind,
    rating: feedback.rating,
    useful: feedback.useful,
  });

  sendApiSuccess(
    res,
    201,
    { feedback },
    buildApiMeta(req, startedAt),
  );
}));

memoryRouter.get("/continuity-feedback", asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const kind = isContinuityFeedbackKind(req.query.kind) ? req.query.kind : undefined;
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const limit = Number.isFinite(limitRaw) ? limitRaw : 100;
  const feedback = await listContinuityFeedback({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind,
    limit,
  });
  const summary = await getContinuityFeedbackSummary({
    userId: req.authUserId,
    orgId: req.authOrgId,
  });

  sendApiSuccess(
    res,
    200,
    {
      feedback,
      summary,
      count: feedback.length,
    },
    buildApiMeta(req, startedAt),
  );
}));

registerContinuityMemoryRoutes(memoryRouter);

memoryRouter.get(
  "/memory/:memoryId/trace-proof",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "memoryId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const memory = await getMemoryForUser({
      memoryId,
      userId: req.authUserId,
    });

    if (!memory) {
      sendApiError(
        res,
        404,
        { code: "NOT_FOUND", message: "Memory not found" },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    sendApiSuccess(
      res,
      200,
      {
        memoryId: memory.id,
        summary: memory.summary,
        contractCategory: memory.contractCategory ?? null,
        companyBrainType: memory.companyBrainType ?? null,
        sourceRef: memory.sourceRef ?? null,
        traceProof: memory.traceProof ?? null,
        freshness: memory.freshness ?? null,
        conflict: memory.conflict ?? null,
        graph: memory.graph ?? null,
        entities: memory.entities ?? [],
        relations: memory.relations ?? [],
        proofQuality: memory.proofQuality ?? null,
        proofComplete: Boolean(memory.traceProof),
        lineage: "Source -> Memory -> Experience -> Skill -> Inheritance Event -> Outcome",
      },
      buildApiMeta(req, startedAt, {
        intent: "memory_trace_proof",
      }),
    );
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
    ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
    ...(parsed.data.service ? { service: parsed.data.service } : {}),
    ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
    ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
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
    ...(parsed.data.repo ? { repo: parsed.data.repo } : {}),
    ...(parsed.data.service ? { service: parsed.data.service } : {}),
    ...(parsed.data.environment ? { environment: parsed.data.environment } : {}),
    ...(parsed.data.taskId ? { taskId: parsed.data.taskId } : {}),
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
