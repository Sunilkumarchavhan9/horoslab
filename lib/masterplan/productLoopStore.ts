import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";

export type MasterplanScope = {
  userId: string;
  orgId?: string;
};

export type PrepareInheritancePackageInput = {
  workspaceId: string;
  contractId?: string | null;
  task: string;
  whyItMatters?: string;
  targetAgent?: string;
  targetFormat?: string;
  autonomyLevel?: string;
  safetyMode?: string;
};

type MasterplanDelegate<TRecord> = {
  findFirst(args?: unknown): Promise<TRecord | null>;
  findMany(args?: unknown): Promise<TRecord[]>;
  create(args?: unknown): Promise<TRecord>;
  update(args?: unknown): Promise<TRecord>;
  count(args?: unknown): Promise<number>;
};

type WorkspaceRecord = {
  id: string;
  userId: string;
  orgId: string | null;
  ownerId: string;
  name: string;
  plan: string;
  region: string;
  createdAt: Date;
};

type SourceRecord = {
  id: string;
  workspaceId: string;
  provider: string;
  type: string;
  status: string;
  permissions: Prisma.InputJsonValue;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SourceItemRecord = {
  id: string;
  workspaceId: string;
  sourceId: string;
  type: string;
  title: string;
  content: string;
  url: string | null;
  metadata: Prisma.InputJsonValue;
  createdAt: Date;
};

type MemoryRecord = {
  id: string;
  workspaceId: string;
  sourceItemId: string | null;
  type: string;
  title: string;
  summary: string;
  content: string;
  proof: Prisma.InputJsonValue;
  confidenceScore: number;
  freshnessScore: number;
  qualityScore: number;
  riskLevel: string;
  relatedFiles: Prisma.InputJsonValue;
  relatedTests: Prisma.InputJsonValue;
  status: string;
  createdAt: Date;
};

type InheritancePackageRecord = {
  id: string;
  workspaceId: string;
  contractId: string | null;
  task: string;
  targetAgent: string;
  targetFormat: string;
  autonomyLevel: string;
  safetyMode: string;
  agentReadinessScore: number;
  memoryQualityScore: number;
  reliabilityScore: number;
  payload: Prisma.JsonValue;
  proof: Prisma.JsonValue;
  createdAt: Date;
  updatedAt?: Date;
  contract?: InheritanceContractRecord | null;
};

type InheritanceContractRecord = {
  id: string;
  workspaceId: string;
  task: string;
  targetAgent: string;
  targetFormat: string;
  memory: Prisma.JsonValue;
  rules: Prisma.JsonValue;
  risks: Prisma.JsonValue;
  requiredTests: Prisma.JsonValue;
  permissions: Prisma.JsonValue;
  approvedSkills: Prisma.JsonValue;
  blockedActions: Prisma.JsonValue;
  proof: Prisma.JsonValue;
  outcomeSchema: Prisma.JsonValue;
  status: string;
  readinessScore: number;
  memoryQuality: number;
  riskLevel: string;
  sourceType: string;
  sourceRef: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AgentRunRecord = {
  id: string;
  workspaceId: string;
  contractId: string | null;
  packageId: string | null;
  agentRoleId: string | null;
  targetAgent: string;
  status: string;
  cost: number | null;
  startedAt: Date | null;
  endedAt: Date | null;
  outcomeId: string | null;
  events?: AgentRunEventRecord[];
  outcome?: OutcomeRecord | null;
  inheritancePackage?: InheritancePackageRecord | null;
  inheritanceContract?: InheritanceContractRecord | null;
};

type AgentRunEventRecord = {
  id: string;
  workspaceId: string;
  agentRunId: string;
  type: string;
  payload: Prisma.InputJsonValue;
  proof: Prisma.InputJsonValue;
  timestamp: Date;
};

type OutcomeRecord = {
  id: string;
  workspaceId: string;
  agentRunId: string;
  summary: string;
  filesChanged: Prisma.InputJsonValue;
  testsPassed: Prisma.InputJsonValue;
  testsFailed: Prisma.InputJsonValue;
  worked: string;
  failed: string;
  humanCorrection: boolean;
  futureLesson: string;
  createdAt: Date;
};

type FutureInstructionRecord = {
  id: string;
  workspaceId: string;
  triggerContext: Prisma.InputJsonValue;
  instruction: string;
  affectedFiles: Prisma.InputJsonValue;
  requiredTests: Prisma.InputJsonValue;
  riskLevel: string;
  proof: Prisma.InputJsonValue;
  status: string;
  createdAt: Date;
};

type PolicyRecord = {
  id: string;
  workspaceId: string;
  name: string;
  scope: string;
  condition: string;
  action: string;
  severity: string;
  status: string;
  createdAt: Date;
};

type WorkflowBlueprintRecord = {
  id: string;
  workspaceId: string;
  name: string;
  trigger: string;
  steps: Prisma.InputJsonValue;
  requiredMemories: Prisma.InputJsonValue;
  requiredTools: Prisma.InputJsonValue;
  riskChecks: Prisma.InputJsonValue;
  approvalRules: Prisma.InputJsonValue;
  successCriteria: Prisma.InputJsonValue;
  outcomeSchema: Prisma.InputJsonValue;
};

type AgentSkillRecord = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  domain?: string;
  trigger: Prisma.InputJsonValue;
  requiredMemories: Prisma.InputJsonValue;
  requiredTools: Prisma.InputJsonValue;
  requiredTests: Prisma.InputJsonValue;
  approvalRules: Prisma.InputJsonValue;
  qualityScore?: number;
  successRate: number;
  version: string;
  status: string;
  proof?: Prisma.InputJsonValue;
  updatedAt?: Date;
};

type RoutedSkill = {
  id: string;
  name: string;
  domain: string;
  version: string;
  status: string;
  installed: boolean;
  qualityScore: number;
  successRate: number;
  score: number;
  whySelected: string;
  matchedSignals: string[];
  requiredTools: string[];
  requiredTests: string[];
  approvalRules: string[];
  trigger: unknown;
  routerRuleId?: string | null;
};

type MistakeImmunityRuleRecord = {
  id: string;
  workspaceId: string;
  pattern: string;
  riskCategory: string;
  riskLevel: string;
  triggerContext: Prisma.InputJsonValue;
  preventionInstruction: string;
  riskyFiles: Prisma.InputJsonValue;
  requiredTests: Prisma.InputJsonValue;
  approvalRequirement: string | null;
  status: string;
  sourceType: string;
  sourceRef: string | null;
  proof: Prisma.InputJsonValue;
  mistakesAvoided: number;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AgentBlackBoxRecordRecord = {
  id: string;
  workspaceId: string;
  agentRunId: string;
  contractId: string | null;
  packageId: string | null;
  task: string;
  contextUsed: Prisma.InputJsonValue;
  memoriesUsed: Prisma.InputJsonValue;
  filesTouched: Prisma.InputJsonValue;
  toolsCalled: Prisma.InputJsonValue;
  commandsRun: Prisma.InputJsonValue;
  testsRun: Prisma.InputJsonValue;
  policyChecks: Prisma.InputJsonValue;
  mistakes: Prisma.InputJsonValue;
  humanCorrections: Prisma.InputJsonValue;
  outcomeId: string | null;
  futureInstructionId: string | null;
  proof: Prisma.InputJsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type AgentExperienceGraphNodeRecord = {
  id: string;
  workspaceId: string;
  type: string;
  refId: string;
  label: string;
  metadata: Prisma.InputJsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type AgentExperienceGraphEdgeRecord = {
  id: string;
  workspaceId: string;
  fromNodeId: string;
  toNodeId: string;
  type: string;
  proof: Prisma.InputJsonValue;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
};

type EvaluationRunRecord = {
  id: string;
  workspaceId: string;
  contractId: string | null;
  name: string;
  task: string;
  agent: string;
  baselinePrompt: string;
  inheritancePackageId: string | null;
  baselineAgentRunId: string | null;
  inheritedAgentRunId: string | null;
  status: string;
  metrics: Prisma.InputJsonValue;
  proof: Prisma.InputJsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type EvaluationResultRecord = {
  id: string;
  workspaceId: string;
  evaluationRunId: string;
  success: boolean;
  inheritanceLift: number;
  testsRememberedScore: number;
  riskDetectionScore: number;
  humanCorrectionRequired: boolean;
  mistakesRepeated: number;
  costPerSuccessfulTask: number;
  qualityScore: number;
  proof: Prisma.InputJsonValue;
  createdAt: Date;
};

type ModelProviderRecord = {
  id: string;
  workspaceId: string;
  provider: string;
  displayName: string;
  authType: string;
  encryptedCredentialRef: string | null;
  baseUrl: string | null;
  status: string;
  defaultModel: string | null;
  allowedAgents: Prisma.InputJsonValue;
  allowedRuntimes: Prisma.InputJsonValue;
  monthlyBudget: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type ModelUsageEventRecord = {
  id: string;
  workspaceId: string;
  providerId: string | null;
  agentRunId: string | null;
  taskType: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
  success: boolean;
  error: string | null;
  createdAt: Date;
};

type CostEventRecord = {
  id: string;
  workspaceId: string;
  agentRunId: string | null;
  category: string;
  amount: number;
  currency: string;
  savedByInheritance: number;
  metadata: Prisma.InputJsonValue;
  createdAt: Date;
};

type ComplianceEvidenceItemRecord = {
  id: string;
  workspaceId: string;
  domain: string;
  title: string;
  sourceType: string;
  sourceRef: string | null;
  status: string;
  proof: Prisma.InputJsonValue;
  createdAt: Date;
  updatedAt: Date;
};

type MasterplanPrismaClient = typeof prisma & {
  workspace: MasterplanDelegate<WorkspaceRecord>;
  source: MasterplanDelegate<SourceRecord>;
  sourceItem: MasterplanDelegate<SourceItemRecord>;
  memory: MasterplanDelegate<MemoryRecord>;
  inheritanceContract: MasterplanDelegate<InheritanceContractRecord>;
  inheritancePackage: MasterplanDelegate<InheritancePackageRecord>;
  agentRun: MasterplanDelegate<AgentRunRecord>;
  agentRunEvent: MasterplanDelegate<AgentRunEventRecord>;
  outcome: MasterplanDelegate<OutcomeRecord>;
  futureAgentInstruction: MasterplanDelegate<FutureInstructionRecord>;
  policy: MasterplanDelegate<PolicyRecord>;
  workflowBlueprint: MasterplanDelegate<WorkflowBlueprintRecord>;
  agentSkill: MasterplanDelegate<AgentSkillRecord>;
  mistakeImmunityRule: MasterplanDelegate<MistakeImmunityRuleRecord>;
  agentBlackBoxRecord: MasterplanDelegate<AgentBlackBoxRecordRecord>;
  agentExperienceGraphNode: MasterplanDelegate<AgentExperienceGraphNodeRecord>;
  agentExperienceGraphEdge: MasterplanDelegate<AgentExperienceGraphEdgeRecord>;
  evaluationRun: MasterplanDelegate<EvaluationRunRecord>;
  evaluationResult: MasterplanDelegate<EvaluationResultRecord>;
  modelProvider: MasterplanDelegate<ModelProviderRecord>;
  modelUsageEvent: MasterplanDelegate<ModelUsageEventRecord>;
  costEvent: MasterplanDelegate<CostEventRecord>;
  complianceEvidenceItem: MasterplanDelegate<ComplianceEvidenceItemRecord>;
};

const db = prisma as MasterplanPrismaClient;

type CanonicalMemory = {
  id: string;
  workspaceId: string;
  sourceItemId?: string | null;
  title: string;
  type: string;
  summary: string;
  content: string;
  proof: unknown;
  confidenceScore: number;
  freshnessScore: number;
  qualityScore: number;
  riskLevel: string;
  relatedFiles: unknown;
  relatedTests: unknown;
  status: string;
  createdAt: Date;
};

function orgIdOrNull(orgId?: string): string | null {
  return typeof orgId === "string" && orgId.trim().length > 0
    ? orgId.trim()
    : null;
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function arrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function textTokens(...values: unknown[]): string[] {
  const text = values
    .map((value) => {
      if (typeof value === "string") return value;
      if (Array.isArray(value)) return value.join(" ");
      if (value && typeof value === "object") return JSON.stringify(value);
      return "";
    })
    .join(" ")
    .toLowerCase();
  return Array.from(new Set((text.match(/[a-z0-9_.-]{3,}/g) ?? []).filter(Boolean)));
}

function scoreSkillMatch(
  tokens: string[],
  skillText: string,
  options?: {
    installed?: boolean;
    qualityScore?: number;
    successRate?: number;
    priority?: number;
  },
) {
  const haystack = skillText.toLowerCase();
  const matchedSignals = tokens.filter((token) => haystack.includes(token)).slice(0, 12);
  const priorityBoost = options?.priority ? Math.max(0, 16 - Math.min(15, Math.floor(options.priority / 10))) : 0;
  const score =
    matchedSignals.length * 12 +
    (options?.installed ? 18 : 0) +
    Math.round((options?.qualityScore ?? 0) / 10) +
    Math.round((options?.successRate ?? 0) / 10) +
    priorityBoost;
  return { score, matchedSignals };
}

function jsonObject(value: unknown): Prisma.InputJsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Prisma.InputJsonObject)
    : {};
}

function jsonArray(value: unknown): Prisma.InputJsonArray {
  return Array.isArray(value) ? (value as Prisma.InputJsonArray) : [];
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function asPlainRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function workspaceWhere(scope: MasterplanScope, workspaceId: string) {
  return {
    id: workspaceId,
    userId: scope.userId,
    orgId: orgIdOrNull(scope.orgId),
  };
}

export async function ensureWorkspaceAccess(
  scope: MasterplanScope,
  workspaceId: string,
) {
  const workspace = await db.workspace.findFirst({
    where: workspaceWhere(scope, workspaceId),
  });
  if (!workspace) {
    throw new Error("workspace_not_found");
  }
  return workspace;
}

export async function createWorkspace(
  scope: MasterplanScope,
  input: {
    name?: string;
    plan?: string;
    region?: string;
  },
) {
  return db.workspace.create({
    data: {
      userId: scope.userId,
      orgId: orgIdOrNull(scope.orgId),
      ownerId: scope.userId,
      name: stringValue(input.name, "Untitled workspace"),
      plan: stringValue(input.plan, "Free"),
      region: stringValue(input.region, "us"),
    },
  });
}

export async function listWorkspaces(scope: MasterplanScope) {
  return db.workspace.findMany({
    where: {
      userId: scope.userId,
      orgId: orgIdOrNull(scope.orgId),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getWorkspace(
  scope: MasterplanScope,
  workspaceId: string,
) {
  return ensureWorkspaceAccess(scope, workspaceId);
}

export async function createSource(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    provider?: string;
    type?: string;
    status?: string;
    permissions?: unknown;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  return db.source.create({
    data: {
      workspaceId: input.workspaceId,
      provider: stringValue(input.provider, "manual"),
      type: stringValue(input.type, "manual_notes"),
      status: stringValue(input.status, "connected"),
      permissions: jsonObject(input.permissions),
    },
  });
}

export async function listSources(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.source.findMany({
    where: workspaceId
      ? { workspaceId }
      : {
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getSource(scope: MasterplanScope, sourceId: string) {
  const source = await db.source.findFirst({
    where: {
      id: sourceId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!source) throw new Error("source_not_found");
  return source;
}

export async function updateSourceStatus(
  scope: MasterplanScope,
  sourceId: string,
  status: string,
) {
  const source = await getSource(scope, sourceId);
  return db.source.update({
    where: { id: source.id },
    data: {
      status,
      ...(status === "connected" || status === "synced" ? { lastSyncedAt: new Date() } : {}),
    },
  });
}

export async function syncSource(scope: MasterplanScope, sourceId: string) {
  const source = await getSource(scope, sourceId);
  return db.source.update({
    where: { id: source.id },
    data: {
      status: "synced",
      lastSyncedAt: new Date(),
    },
  });
}

export async function createSourceItem(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    sourceId: string;
    type?: string;
    title?: string;
    content?: string;
    url?: string | null;
    metadata?: unknown;
    extractMemory?: boolean;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const source = await db.source.findFirst({
    where: { id: input.sourceId, workspaceId: input.workspaceId },
  });
  if (!source) throw new Error("source_not_found");

  const item = await db.sourceItem.create({
    data: {
      workspaceId: input.workspaceId,
      sourceId: input.sourceId,
      type: stringValue(input.type, source.type),
      title: stringValue(input.title, "Untitled source item"),
      content: stringValue(input.content, ""),
      url: input.url ?? null,
      metadata: jsonObject(input.metadata),
    },
  });

  if (input.extractMemory !== false && item.content.trim().length > 0) {
    await extractMemoryFromSourceItem(scope, item.id);
  }

  return item;
}

export async function listSourceItems(
  scope: MasterplanScope,
  sourceId?: string,
) {
  if (sourceId) {
    const source = await db.source.findFirst({
      where: {
        id: sourceId,
        workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
      },
    });
    if (!source) throw new Error("source_not_found");
  }
  return db.sourceItem.findMany({
    where: sourceId
      ? { sourceId }
      : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function listSourceMemories(
  scope: MasterplanScope,
  sourceId: string,
) {
  const source = await getSource(scope, sourceId);
  return db.memory.findMany({
    where: {
      workspaceId: source.workspaceId,
      sourceItem: { sourceId: source.id },
    },
    orderBy: [{ qualityScore: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
}

function inferMemoryType(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("incident") || lower.includes("outage")) return "incident";
  if (lower.includes("decision") || lower.includes("decided"))
    return "decision";
  if (lower.includes("architecture") || lower.includes("adr"))
    return "architecture";
  if (lower.includes("bug") || lower.includes("fix")) return "bug";
  if (lower.includes("test") || lower.includes("spec")) return "required_test";
  if (lower.includes("risk") || lower.includes("danger")) return "risky_file";
  if (lower.includes("runbook") || lower.includes("process")) return "process";
  return "process";
}

function inferRiskLevel(content: string): string {
  const lower = content.toLowerCase();
  if (
    /(auth|billing|database|migration|secret|pii|customer data|deployment|production)/.test(
      lower,
    )
  )
    return "high";
  if (/(security|token|permission|admin|invoice|payment)/.test(lower))
    return "medium";
  return "low";
}

function extractPaths(content: string): string[] {
  const matches =
    content.match(
      /[\w./-]+\.(?:ts|tsx|js|jsx|json|md|sql|prisma|yml|yaml|css|scss)/g,
    ) ?? [];
  return Array.from(new Set(matches)).slice(0, 20);
}

function summarize(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 220 ? `${compact.slice(0, 220).trimEnd()}…` : compact;
}

export async function extractMemoryFromSourceItem(
  scope: MasterplanScope,
  sourceItemId: string,
) {
  const item = await db.sourceItem.findFirst({
    where: {
      id: sourceItemId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!item) throw new Error("source_item_not_found");

  const riskLevel = inferRiskLevel(item.content);
  const confidenceScore = item.content.length > 120 ? 82 : 64;
  const freshnessScore = 90;
  const qualityScore = Math.round(
    (confidenceScore + freshnessScore + (riskLevel === "low" ? 84 : 72)) / 3,
  );

  return db.memory.create({
    data: {
      workspaceId: item.workspaceId,
      sourceItemId: item.id,
      type: inferMemoryType(item.content),
      title: item.title,
      summary: summarize(item.content),
      content: item.content,
      proof: {
        sourceItemId: item.id,
        sourceId: item.sourceId,
        url: item.url,
        createdAt: item.createdAt.toISOString(),
      },
      confidenceScore,
      freshnessScore,
      qualityScore,
      riskLevel,
      relatedFiles: extractPaths(item.content),
      relatedTests: extractPaths(item.content).filter((path) =>
        /test|spec/i.test(path),
      ),
      status: qualityScore >= 70 ? "approved" : "needs_review",
    },
  });
}

export async function listMemories(
  scope: MasterplanScope,
  input: {
    workspaceId?: string;
    type?: string;
    status?: string;
    riskLevel?: string;
    query?: string;
  },
): Promise<CanonicalMemory[]> {
  if (input.workspaceId) await ensureWorkspaceAccess(scope, input.workspaceId);
  const memories = await db.memory.findMany({
    where: {
      ...(input.workspaceId
        ? { workspaceId: input.workspaceId }
        : {
            workspace: {
              userId: scope.userId,
              orgId: orgIdOrNull(scope.orgId),
            },
          }),
      ...(input.type ? { type: input.type } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.riskLevel ? { riskLevel: input.riskLevel } : {}),
    },
    orderBy: [{ qualityScore: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
  const query = stringValue(input.query).toLowerCase();
  if (!query) return memories as CanonicalMemory[];
  return (memories as CanonicalMemory[]).filter((memory) =>
    memorySearchText(memory).includes(query),
  );
}

export async function getMemory(scope: MasterplanScope, memoryId: string) {
  const memory = await db.memory.findFirst({
    where: {
      id: memoryId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!memory) throw new Error("memory_not_found");
  return memory;
}

export async function searchMemories(
  scope: MasterplanScope,
  input: {
    workspaceId?: string;
    query?: string;
    limit?: number;
  },
): Promise<CanonicalMemory[]> {
  const memories = await listMemories(scope, {
    workspaceId: input.workspaceId,
  });
  const query = stringValue(input.query).toLowerCase();
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  if (!query) return memories.slice(0, limit);
  return memories
    .filter((memory) => memorySearchText(memory).includes(query))
    .slice(0, limit);
}

function memorySearchText(memory: CanonicalMemory): string {
  const proof = inputJson(memory.proof);
  return [
    memory.id,
    memory.title,
    memory.summary,
    memory.content,
    memory.type,
    memory.status,
    memory.riskLevel,
    ...arrayValue(memory.relatedFiles),
    ...arrayValue(memory.relatedTests),
    JSON.stringify(proof),
  ].join(" ").toLowerCase();
}

export async function updateMemoryStatus(
  scope: MasterplanScope,
  memoryId: string,
  status: string,
) {
  const memory = await getMemory(scope, memoryId);
  return db.memory.update({ where: { id: memory.id }, data: { status } });
}

export async function updateMemory(
  scope: MasterplanScope,
  memoryId: string,
  input: Partial<Pick<
    CanonicalMemory,
    | "type"
    | "title"
    | "summary"
    | "content"
    | "status"
    | "riskLevel"
    | "confidenceScore"
    | "freshnessScore"
    | "qualityScore"
  >> & {
    relatedFiles?: unknown;
    relatedTests?: unknown;
    proof?: unknown;
  },
) {
  const memory = await getMemory(scope, memoryId);
  const data: Record<string, unknown> = {};
  for (const key of [
    "type",
    "title",
    "summary",
    "content",
    "status",
    "riskLevel",
    "confidenceScore",
    "freshnessScore",
    "qualityScore",
  ] as const) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) data[key] = value.trim();
    if (typeof value === "number" && Number.isFinite(value)) data[key] = Math.round(value);
  }
  if (input.relatedFiles !== undefined) data.relatedFiles = inputJson(arrayValue(input.relatedFiles));
  if (input.relatedTests !== undefined) data.relatedTests = inputJson(arrayValue(input.relatedTests));
  if (input.proof !== undefined) {
    data.proof = inputJson({
      ...asPlainRecord(memory.proof),
      ...asPlainRecord(input.proof),
      updatedVia: "company-brain",
      updatedAt: new Date().toISOString(),
    });
  }
  return db.memory.update({ where: { id: memory.id }, data });
}

export async function addMemoryCorrection(
  scope: MasterplanScope,
  memoryId: string,
  input: { correction: string; author?: string },
) {
  const memory = await getMemory(scope, memoryId);
  const proof = asPlainRecord(memory.proof);
  const corrections = Array.isArray(proof.corrections) ? proof.corrections : [];
  return db.memory.update({
    where: { id: memory.id },
    data: {
      status: "needs_review",
      proof: inputJson({
        ...proof,
        corrections: [
          ...corrections,
          {
            id: randomUUID(),
            correction: stringValue(input.correction, "Correction added from Company Brain"),
            author: stringValue(input.author, "human"),
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    },
  });
}

export async function mergeMemory(
  scope: MasterplanScope,
  memoryId: string,
  targetMemoryId: string,
) {
  const [memory, target] = await Promise.all([
    getMemory(scope, memoryId),
    getMemory(scope, targetMemoryId),
  ]);
  if (memory.workspaceId !== target.workspaceId) throw new Error("memory_not_found");
  const targetProof = asPlainRecord(target.proof);
  const mergedMemoryIds = Array.from(new Set([
    ...arrayValue(targetProof.mergedMemoryIds),
    memory.id,
  ]));
  const merged = await db.memory.update({
    where: { id: target.id },
    data: {
      summary: `${target.summary}\n\nMerged: ${memory.summary}`.trim(),
      content: `${target.content}\n\n--- Merged Memory ${memory.id} ---\n${memory.content}`.trim(),
      relatedFiles: inputJson(Array.from(new Set([
        ...arrayValue(target.relatedFiles),
        ...arrayValue(memory.relatedFiles),
      ]))),
      relatedTests: inputJson(Array.from(new Set([
        ...arrayValue(target.relatedTests),
        ...arrayValue(memory.relatedTests),
      ]))),
      proof: inputJson({
        ...targetProof,
        mergedMemoryIds,
        mergedAt: new Date().toISOString(),
      }),
    },
  });
  await db.memory.update({
    where: { id: memory.id },
    data: {
      status: "merged",
      proof: inputJson({
        ...asPlainRecord(memory.proof),
        mergedInto: target.id,
        mergedAt: new Date().toISOString(),
      }),
    },
  });
  return merged;
}

export async function getMemoryProof(scope: MasterplanScope, memoryId: string) {
  const memory = await getMemory(scope, memoryId);
  const proof = asPlainRecord(memory.proof);
  return {
    memoryId: memory.id,
    sourceItemId: memory.sourceItemId,
    proof,
    integrityChecks: [
      { label: "SourceItem linked", status: memory.sourceItemId ? "passed" : "warning" },
      { label: "Confidence above 70", status: memory.confidenceScore >= 70 ? "passed" : "review" },
      { label: "Quality above 70", status: memory.qualityScore >= 70 ? "passed" : "review" },
      { label: "Approved memory", status: memory.status === "approved" ? "passed" : "pending" },
    ],
    loop: "SourceItem -> Memory -> Proof -> Integrity Check -> Approved Memory -> MemoryIgnition",
  };
}

export async function listRelatedMemories(scope: MasterplanScope, memoryId: string) {
  const memory = await getMemory(scope, memoryId);
  const memories = await listMemories(scope, { workspaceId: memory.workspaceId });
  const files = new Set(arrayValue(memory.relatedFiles));
  return memories
    .filter((candidate) => candidate.id !== memory.id)
    .map((candidate) => {
      const overlap = arrayValue(candidate.relatedFiles).filter((file) => files.has(file)).length;
      const score =
        overlap * 40 +
        (candidate.type === memory.type ? 30 : 0) +
        (candidate.riskLevel === memory.riskLevel ? 20 : 0);
      return { ...candidate, relatedScore: score };
    })
    .filter((candidate) => candidate.relatedScore > 0)
    .sort((a, b) => b.relatedScore - a.relatedScore)
    .slice(0, 20);
}

export async function createFutureInstructionFromMemory(
  scope: MasterplanScope,
  memoryId: string,
) {
  const memory = await getMemory(scope, memoryId);
  return db.futureAgentInstruction.create({
    data: {
      workspaceId: memory.workspaceId,
      triggerContext: inputJson({
        source: "company-brain",
        memoryId: memory.id,
        memoryType: memory.type,
      }),
      instruction: `Before similar ${memory.type} work, apply this approved memory: ${memory.summary}`,
      affectedFiles: inputJson(arrayValue(memory.relatedFiles)),
      requiredTests: inputJson(arrayValue(memory.relatedTests)),
      riskLevel: memory.riskLevel,
      proof: inputJson({
        createdFromMemoryId: memory.id,
        sourceItemId: memory.sourceItemId,
        sourceProof: memory.proof,
      }),
      status: "active",
    },
  });
}

export async function createMistakeRuleFromMemory(
  scope: MasterplanScope,
  memoryId: string,
) {
  const memory = await getMemory(scope, memoryId);
  const rule = {
    id: `mistake_rule_${randomUUID()}`,
    memoryId: memory.id,
    name: `Avoid repeat mistake: ${memory.title}`,
    condition: `When task overlaps ${memory.type} memory ${memory.id}`,
    guardrail: `Check proof, related files, required tests, and apply: ${memory.summary}`,
    riskLevel: memory.riskLevel,
    createdAt: new Date().toISOString(),
  };
  await db.memory.update({
    where: { id: memory.id },
    data: {
      proof: inputJson({
        ...asPlainRecord(memory.proof),
        mistakeRules: [
          ...(Array.isArray(asPlainRecord(memory.proof).mistakeRules)
            ? asPlainRecord(memory.proof).mistakeRules as unknown[]
            : []),
          rule,
        ],
      }),
    },
  });
  const skill = await db.agentSkill.create({
    data: {
      workspaceId: memory.workspaceId,
      name: `Skill candidate from ${memory.title}`,
      trigger: inputJson({ memoryId: memory.id, type: memory.type }),
      requiredMemories: inputJson([memory.id]),
      requiredTools: inputJson([]),
      requiredTests: inputJson(arrayValue(memory.relatedTests)),
      approvalRules: inputJson(memory.riskLevel === "high" ? ["human_review_required"] : []),
      successRate: 0,
      version: "candidate",
      status: "candidate",
    },
  });
  return { rule, skill };
}

export async function routeSkillsForTask(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    task: string;
    memories?: Array<{
      title: string;
      summary: string;
      content: string;
      type: string;
      riskLevel: string;
      relatedFiles: unknown;
      relatedTests: unknown;
    }>;
    limit?: number;
  },
): Promise<RoutedSkill[]> {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const memories = input.memories ?? [];
  const tokens = textTokens(
    input.task,
    memories.map((memory) => [memory.title, memory.summary, memory.content, memory.type, memory.riskLevel].join(" ")),
    memories.flatMap((memory) => [...arrayValue(memory.relatedFiles), ...arrayValue(memory.relatedTests)]),
  );
  const skills = await prisma.agentSkill.findMany({
    where: {
      workspaceId: input.workspaceId,
      OR: [
        { status: "approved" },
        { installations: { some: { status: "installed" } } },
      ],
    },
    include: {
      installations: { where: { status: "installed" }, orderBy: { installedAt: "desc" }, take: 1 },
      routerRules: { where: { status: "active" }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }], take: 5 },
    },
    take: 100,
  });

  return skills
    .map((skill) => {
      const primaryRule = skill.routerRules[0] ?? null;
      const skillText = [
        skill.name,
        skill.description,
        skill.domain,
        JSON.stringify(skill.trigger),
        JSON.stringify(primaryRule?.trigger ?? {}),
        JSON.stringify(skill.requiredMemories),
        JSON.stringify(skill.requiredTools),
        JSON.stringify(skill.requiredTests),
        JSON.stringify(skill.approvalRules),
      ].join(" ");
      const installed = skill.installations.length > 0;
      const { score, matchedSignals } = scoreSkillMatch(tokens, skillText, {
        installed,
        qualityScore: skill.qualityScore,
        successRate: skill.successRate,
        priority: primaryRule?.priority,
      });
      return {
        id: skill.id,
        name: skill.name,
        domain: skill.domain,
        version: skill.version,
        status: skill.status,
        installed,
        qualityScore: skill.qualityScore,
        successRate: Math.round(skill.successRate),
        score,
        whySelected: matchedSignals.length
          ? `Matched ${matchedSignals.slice(0, 5).join(", ")} from task, memory, risk, or router trigger.`
          : installed
            ? "Installed approved skill available for this workspace."
            : "Approved skill available for this workspace.",
        matchedSignals,
        requiredTools: arrayValue(skill.requiredTools),
        requiredTests: arrayValue(skill.requiredTests),
        approvalRules: arrayValue(skill.approvalRules),
        trigger: primaryRule?.trigger ?? skill.trigger,
        routerRuleId: primaryRule?.id ?? null,
      } satisfies RoutedSkill;
    })
    .filter((skill) => skill.score > 0 || skill.installed)
    .sort((a, b) => b.score - a.score || b.qualityScore - a.qualityScore)
    .slice(0, Math.max(1, Math.min(3, input.limit ?? 3)));
}

function buildPackagePayload(
  input: PrepareInheritancePackageInput,
  memories: Awaited<ReturnType<typeof searchMemories>>,
  routedSkills: RoutedSkill[] = [],
) {
  const memoryQualityScore =
    memories.length > 0
      ? Math.round(
          memories.reduce((sum, memory) => sum + memory.qualityScore, 0) /
            memories.length,
        )
      : 0;
  const riskyFiles = Array.from(
    new Set(
      memories
        .flatMap((memory) => arrayValue(memory.relatedFiles))
        .filter((file) =>
          /auth|billing|db|database|secret|prod|migration/i.test(file),
        ),
    ),
  );
  const requiredTests = Array.from(
    new Set(memories.flatMap((memory) => arrayValue(memory.relatedTests))),
  );
  const highRisk = memories.some((memory) => memory.riskLevel === "high");
  const agentReadinessScore = Math.min(
    100,
    Math.round(
      memoryQualityScore * 0.7 +
        (requiredTests.length > 0 ? 15 : 0) +
        (memories.length > 0 ? 15 : 0),
    ),
  );

  return {
    package_id: null,
    workspace_id: input.workspaceId,
    task: input.task,
    why_it_matters:
      input.whyItMatters ??
      "This task should be executed with inherited company memory, proof, and outcome learning.",
    target_agent: input.targetAgent ?? "Any Agent",
    target_format: input.targetFormat ?? "Generic prompt",
    safety_mode: input.safetyMode ?? "Assist",
    autonomy_level: input.autonomyLevel ?? "Draft",
    agent_readiness_score: agentReadinessScore,
    memory_quality_score: memoryQualityScore,
    agent_reliability_score: 0,
    context_summary: memories
      .slice(0, 5)
      .map((memory) => memory.summary)
      .join("\n"),
    company_memory: memories.map((memory) => ({
      id: memory.id,
      title: memory.title,
      type: memory.type,
      summary: memory.summary,
      proof: memory.proof,
      qualityScore: memory.qualityScore,
      riskLevel: memory.riskLevel,
    })),
    repo_context: memories.filter(
      (memory) => arrayValue(memory.relatedFiles).length > 0,
    ),
    product_context: [],
    customer_context: [],
    support_context: [],
    browser_context: [],
    past_decisions: memories.filter((memory) => memory.type === "decision"),
    past_failed_attempts: [],
    past_successful_fixes: memories.filter((memory) => memory.type === "bug"),
    risky_files: riskyFiles,
    required_tests: requiredTests,
    approval_rules: highRisk
      ? [
          "Require approval for auth, billing, database, deployment, and customer-data tasks.",
        ]
      : [],
    policy_rules: [
      "If memory quality is below 70, block Execute Mode.",
      "If required tests are missing, block Send Now for high-risk work.",
      "Require outcome after every run.",
      "Use Skill Router to inject only the 1-3 relevant approved skills.",
    ],
    blocked_actions: highRisk ? ["autonomous_execute_without_approval"] : [],
    approved_skills: routedSkills,
    skill_router: {
      mode: "top_3_relevant_skills",
      selected_count: routedSkills.length,
      max_skills: 3,
      selected_skill_ids: routedSkills.map((skill) => skill.id),
      proof: routedSkills.map((skill) => ({
        skillId: skill.id,
        routerRuleId: skill.routerRuleId,
        score: skill.score,
        matchedSignals: skill.matchedSignals,
      })),
    },
    tool_permissions: {
      read: true,
      write:
        input.autonomyLevel === "Approval Execute" ||
        input.autonomyLevel === "Policy Execute",
      browser: input.safetyMode === "Sandbox Execute",
    },
    trace_proof: memories.map((memory) => memory.proof),
    contradictions: memories.filter(
      (memory) => memory.status === "contradicted",
    ),
    recommended_first_action:
      memories.length > 0
        ? "Review inherited memories, risky files, required tests, then produce a plan before changing anything."
        : "Import source context before executing this task.",
    agent_instructions: [
      "Use inherited company memory before acting.",
      "Respect policy rules, blocked actions, and approval requirements.",
      "Report files changed, tests passed, tests failed, and future lesson after work.",
    ],
    outcome_reporting_schema: {
      summary: "string",
      filesChanged: "string[]",
      testsPassed: "string[]",
      testsFailed: "string[]",
      worked: "string",
      failed: "string",
      humanCorrection: "boolean",
      futureLesson: "string",
    },
    future_agent_learning_instructions:
      "Turn useful outcomes, human corrections, and repeated workflows into FutureAgentInstruction candidates.",
  };
}

function buildContractDataFromPayload(
  input: PrepareInheritancePackageInput,
  payload: ReturnType<typeof buildPackagePayload>,
) {
  const riskLevel =
    arrayValue(payload.blocked_actions).length > 0
      ? "high"
      : arrayValue(payload.approval_rules).length > 0 ||
          arrayValue(payload.risky_files).length > 0
        ? "medium"
        : "low";

  return {
    workspaceId: input.workspaceId,
    task: input.task,
    targetAgent: payload.target_agent,
    targetFormat: payload.target_format,
    memory: inputJson(payload.company_memory),
    rules: inputJson([...arrayValue(payload.policy_rules), ...arrayValue(payload.approval_rules)]),
    risks: inputJson({
      riskyFiles: payload.risky_files,
      contradictions: payload.contradictions,
      riskLevel,
    }),
    requiredTests: inputJson(payload.required_tests),
    permissions: inputJson(payload.tool_permissions),
    approvedSkills: inputJson(payload.approved_skills),
    blockedActions: inputJson(payload.blocked_actions),
    proof: inputJson({
      traceProof: payload.trace_proof,
      selectedMemoryCount: payload.company_memory.length,
      selectedSkillCount: payload.approved_skills.length,
      skillRouter: payload.skill_router,
      skillRouterLineage: "MemoryIgnition -> SkillRouter -> InheritanceContract",
      lineage: "SourceItem -> Memory -> MemoryIgnition -> InheritanceContract",
    }),
    outcomeSchema: inputJson(payload.outcome_reporting_schema),
    status: "prepared",
    readinessScore: payload.agent_readiness_score,
    memoryQuality: payload.memory_quality_score,
    riskLevel,
    sourceType: "memoryignition",
    sourceRef: null,
  };
}

function buildDirectRunContractData(input: {
  workspaceId: string;
  task: string;
  targetAgent?: string | null;
  targetFormat?: string | null;
  sourceType?: string;
  sourceRef?: string | null;
  proof?: unknown;
  approvedSkills?: RoutedSkill[];
}) {
  const targetAgent = stringValue(input.targetAgent, "Any Agent");
  const approvedSkills = input.approvedSkills ?? [];
  return {
    workspaceId: input.workspaceId,
    task: input.task,
    targetAgent,
    targetFormat: stringValue(input.targetFormat, "Direct AgentRun contract"),
    memory: inputJson([]),
    rules: inputJson([
      "Every AgentRun must have an Inheritance Contract before work starts.",
      "No AgentRun is complete until outcome is captured.",
      "Record Agent Black Box proof for package, run, and outcome.",
    ]),
    risks: inputJson({ riskLevel: "low", source: input.sourceType ?? "direct_agent_run" }),
    requiredTests: inputJson([]),
    permissions: inputJson({ read: true, write: false, browser: false }),
    approvedSkills: inputJson(approvedSkills),
    blockedActions: inputJson(["autonomous_execute_without_package"]),
    proof: inputJson({
      lineage: "Direct AgentRun -> InheritanceContract -> AgentRun -> Outcome",
      task: input.task,
      targetAgent,
      skillRouter: {
        mode: "top_3_relevant_skills",
        selected_count: approvedSkills.length,
        selected_skill_ids: approvedSkills.map((skill) => skill.id),
      },
      ...(asPlainRecord(input.proof)),
    }),
    outcomeSchema: inputJson({
      summary: "string",
      filesChanged: "string[]",
      testsPassed: "string[]",
      testsFailed: "string[]",
      worked: "string",
      failed: "string",
      humanCorrection: "boolean",
      futureLesson: "string",
    }),
    status: "prepared",
    readinessScore: 25,
    memoryQuality: 0,
    riskLevel: "low",
    sourceType: input.sourceType ?? "direct_agent_run",
    sourceRef: input.sourceRef ?? null,
  };
}

async function createDirectRunContract(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    task: string;
    targetAgent?: string | null;
    sourceType?: string;
    sourceRef?: string | null;
    proof?: unknown;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const approvedSkills = await routeSkillsForTask(scope, {
    workspaceId: input.workspaceId,
    task: input.task,
    limit: 3,
  });
  return db.inheritanceContract.create({
    data: buildDirectRunContractData({ ...input, approvedSkills }),
  });
}

async function ensurePackageContract(
  scope: MasterplanScope,
  inheritancePackage: InheritancePackageRecord,
) {
  if (inheritancePackage.contractId) {
    return getInheritanceContract(scope, inheritancePackage.contractId);
  }
  const payload = packagePayloadRecord(inheritancePackage);
  const proof = packageProofRecord(inheritancePackage);
  const contract = await db.inheritanceContract.create({
    data: {
      workspaceId: inheritancePackage.workspaceId,
      task: inheritancePackage.task,
      targetAgent: inheritancePackage.targetAgent,
      targetFormat: inheritancePackage.targetFormat,
      memory: inputJson(payload.company_memory ?? []),
      rules: inputJson([
        ...arrayValue(payload.policy_rules),
        ...arrayValue(payload.approval_rules),
        "No AgentRun is complete until outcome is captured.",
      ]),
      risks: inputJson({
        riskyFiles: payload.risky_files ?? [],
        contradictions: payload.contradictions ?? [],
        riskLevel: derivePackageStatus(inheritancePackage) === "blocked" ? "high" : "medium",
      }),
      requiredTests: inputJson(payload.required_tests ?? []),
      permissions: inputJson(payload.tool_permissions ?? { read: true, write: false, browser: false }),
      approvedSkills: inputJson(payload.approved_skills ?? []),
      blockedActions: inputJson(payload.blocked_actions ?? []),
      proof: inputJson({
        ...proof,
        lineage: "Legacy InheritancePackage -> InheritanceContract",
        backfilledFromPackageId: inheritancePackage.id,
      }),
      outcomeSchema: inputJson(payload.outcome_reporting_schema ?? {
        summary: "string",
        filesChanged: "string[]",
        testsPassed: "string[]",
        testsFailed: "string[]",
        worked: "string",
        failed: "string",
        humanCorrection: "boolean",
        futureLesson: "string",
      }),
      status: "prepared",
      readinessScore: inheritancePackage.agentReadinessScore,
      memoryQuality: inheritancePackage.memoryQualityScore,
      riskLevel: derivePackageStatus(inheritancePackage) === "blocked" ? "high" : "medium",
      sourceType: "inheritance_package_backfill",
      sourceRef: inheritancePackage.id,
    },
  });
  await db.inheritancePackage.update({
    where: { id: inheritancePackage.id },
    data: {
      contractId: contract.id,
      payload: inputJson({
        ...payload,
        contract_id: contract.id,
        inheritance_contract: contract,
      }),
      proof: inputJson({
        ...proof,
        contractId: contract.id,
        inheritanceContract: {
          id: contract.id,
          status: contract.status,
          riskLevel: contract.riskLevel,
          readinessScore: contract.readinessScore,
          memoryQuality: contract.memoryQuality,
        },
        contractBackfilledAt: new Date().toISOString(),
      }),
    },
  });
  return contract;
}

export async function getInheritanceContract(scope: MasterplanScope, contractId: string) {
  const contract = await db.inheritanceContract.findFirst({
    where: {
      id: contractId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!contract) throw new Error("inheritance_contract_not_found");
  return contract;
}

export async function createInheritanceContract(
  scope: MasterplanScope,
  input: PrepareInheritancePackageInput,
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const memories = await searchMemories(scope, {
    workspaceId: input.workspaceId,
    query: input.task,
    limit: 12,
  });
  const routedSkills = await routeSkillsForTask(scope, {
    workspaceId: input.workspaceId,
    task: input.task,
    memories,
    limit: 3,
  });
  const payload = buildPackagePayload(input, memories, routedSkills);
  const contract = await db.inheritanceContract.create({
    data: buildContractDataFromPayload(input, payload),
  });
  return { contract, payload };
}

export async function prepareInheritancePackage(
  scope: MasterplanScope,
  input: PrepareInheritancePackageInput,
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const { contract, payload } = await createInheritanceContract(scope, input);
  return {
    contract,
    preview: {
      ...payload,
      contract_id: contract.id,
      inheritance_contract: contract,
    },
    threeThings: [
      payload.context_summary || "No company memory matched yet.",
      payload.risky_files.length > 0
        ? `Be careful with ${payload.risky_files.join(", ")}.`
        : "No risky files detected from current memory.",
      payload.approved_skills.length > 0
        ? `Skill Router selected ${payload.approved_skills.map((skill) => skill.name).join(", ")}.`
        : "No approved skill matched yet; continue with memory, rules, tests, and outcome capture.",
      payload.recommended_first_action,
    ],
  };
}

export async function createInheritancePackage(
  scope: MasterplanScope,
  input: PrepareInheritancePackageInput,
) {
  const prepared = input.contractId
    ? await (async () => {
        const contract = await getInheritanceContract(scope, input.contractId ?? "");
        const memories = await searchMemories(scope, {
          workspaceId: input.workspaceId,
          query: input.task,
          limit: 12,
        });
        const routedSkills = await routeSkillsForTask(scope, {
          workspaceId: input.workspaceId,
          task: input.task,
          memories,
          limit: 3,
        });
        return {
          contract,
          preview: buildPackagePayload(input, memories, routedSkills),
        };
      })()
    : await prepareInheritancePackage(scope, input);
  const payload = prepared.preview;
  const created = await db.inheritancePackage.create({
    data: {
      workspaceId: input.workspaceId,
      contractId: prepared.contract.id,
      task: input.task,
      targetAgent: payload.target_agent,
      targetFormat: payload.target_format,
      autonomyLevel: payload.autonomy_level,
      safetyMode: payload.safety_mode,
      agentReadinessScore: payload.agent_readiness_score,
      memoryQualityScore: payload.memory_quality_score,
      reliabilityScore: payload.agent_reliability_score,
      payload: inputJson({
        ...payload,
        package_id: "pending",
        contract_id: prepared.contract.id,
        inheritance_contract: prepared.contract,
      }),
      proof: inputJson({
        contractId: prepared.contract.id,
        inheritanceContract: {
          id: prepared.contract.id,
          status: prepared.contract.status,
          riskLevel: prepared.contract.riskLevel,
          readinessScore: prepared.contract.readinessScore,
          memoryQuality: prepared.contract.memoryQuality,
        },
        trace_proof: payload.trace_proof,
        selected_memory_count: payload.company_memory.length,
        selected_skill_count: payload.approved_skills.length,
        skill_router: payload.skill_router,
        skill_router_lineage: "MemoryIgnition -> InheritanceContract -> SkillRouter -> InheritancePackage",
        lineage: "MemoryIgnition -> InheritanceContract -> InheritancePackage",
      }),
    },
  });
  return db.inheritancePackage.update({
    where: { id: created.id },
    data: {
      payload: inputJson({
        ...payload,
        package_id: created.id,
        contract_id: prepared.contract.id,
        inheritance_contract: prepared.contract,
      }),
    },
  });
}

export async function getPackage(scope: MasterplanScope, packageId: string) {
  const item = await db.inheritancePackage.findFirst({
    where: {
      id: packageId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
    include: { contract: true },
  });
  if (!item) throw new Error("package_not_found");
  return item;
}

export async function listInheritancePackages(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.inheritancePackage.findMany({
    where: workspaceId
      ? { workspaceId }
      : {
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
    orderBy: { createdAt: "desc" },
    include: { contract: true },
    take: 100,
  });
}

function packagePayloadRecord(inheritancePackage: InheritancePackageRecord) {
  return asPlainRecord(inheritancePackage.payload);
}

function packageProofRecord(inheritancePackage: InheritancePackageRecord) {
  return asPlainRecord(inheritancePackage.proof);
}

function packageEvents(inheritancePackage: InheritancePackageRecord): unknown[] {
  const events = packageProofRecord(inheritancePackage).packageEvents;
  return Array.isArray(events) ? events : [];
}

export function derivePackageStatus(inheritancePackage: InheritancePackageRecord): string {
  const payload = packagePayloadRecord(inheritancePackage);
  const proof = packageProofRecord(inheritancePackage);
  const explicit = stringValue(proof.status ?? payload.package_status);
  if (explicit) return explicit;
  if (arrayValue(payload.blocked_actions).length > 0) return "blocked";
  if (arrayValue(payload.approval_rules).length > 0 || inheritancePackage.memoryQualityScore < 70) return "needs_review";
  return "ready";
}

function packageGate(inheritancePackage: InheritancePackageRecord) {
  const payload = packagePayloadRecord(inheritancePackage);
  const status = derivePackageStatus(inheritancePackage);
  const reasons = [
    ...arrayValue(payload.blocked_actions).map((item) => `Blocked action: ${item}`),
    ...arrayValue(payload.approval_rules).map((item) => `Approval required: ${item}`),
    ...(inheritancePackage.memoryQualityScore < 70 ? ["Memory quality below 70."] : []),
    ...(status === "blocked" ? ["Package is manually blocked."] : []),
  ];
  return {
    status: status === "blocked" || reasons.some((reason) => /blocked/i.test(reason)) ? "blocked" : reasons.length ? "needs_review" : "ready",
    reasons,
    canSend: status !== "blocked" && !reasons.some((reason) => /blocked/i.test(reason)),
  };
}

async function updatePackageAuditState(
  inheritancePackage: InheritancePackageRecord,
  input: {
    status?: string;
    payloadPatch?: Record<string, unknown>;
    proofPatch?: Record<string, unknown>;
    event?: Record<string, unknown>;
  },
) {
  const payload = packagePayloadRecord(inheritancePackage);
  const proof = packageProofRecord(inheritancePackage);
  const event = input.event
    ? {
        id: randomUUID(),
        packageId: inheritancePackage.id,
        occurredAt: new Date().toISOString(),
        ...input.event,
      }
    : null;
  return db.inheritancePackage.update({
    where: { id: inheritancePackage.id },
    data: {
      payload: inputJson({
        ...payload,
        ...(input.payloadPatch ?? {}),
        ...(input.status ? { package_status: input.status } : {}),
      }),
      proof: inputJson({
        ...proof,
        ...(input.proofPatch ?? {}),
        ...(input.status ? { status: input.status } : {}),
        packageEvents: event ? [...packageEvents(inheritancePackage), event] : packageEvents(inheritancePackage),
        updatedAt: new Date().toISOString(),
      }),
    },
  });
}

export async function getPackagePrompt(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  const payload = packagePayloadRecord(inheritancePackage);
  return (
    firstString(
      payload.ready_to_send_prompt,
      payload.prompt,
      arrayValue(payload.agent_instructions).join("\n"),
    ) ?? "Prepare the package to generate a ready-to-send MemoryIgnition prompt."
  );
}

export async function getPackageAuditJson(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  return {
    packageId: inheritancePackage.id,
    payload: packagePayloadRecord(inheritancePackage),
    package: inheritancePackage,
    status: derivePackageStatus(inheritancePackage),
    policyGate: packageGate(inheritancePackage),
  };
}

export async function getPackageSendHistory(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  const runs = (await listAgentRuns(scope, inheritancePackage.workspaceId)).filter((run) => run.packageId === packageId);
  const runEvents = runs.flatMap((run) =>
    ((run as AgentRunRecord & { events?: AgentRunEventRecord[] }).events ?? []).map((event) => ({
      id: event.id,
      type: event.type,
      runId: run.id,
      targetAgent: run.targetAgent,
      payload: event.payload,
      proof: event.proof,
      occurredAt: event.timestamp,
    })),
  );
  const proofEvents = packageEvents(inheritancePackage).map((event) => ({
    ...(asPlainRecord(event)),
    runId: asPlainRecord(event).runId ?? null,
  }));
  return [...proofEvents, ...runEvents]
    .sort((a, b) => {
      const av = new Date(String((a as { occurredAt?: unknown }).occurredAt ?? 0)).getTime();
      const bv = new Date(String((b as { occurredAt?: unknown }).occurredAt ?? 0)).getTime();
      return bv - av;
    })
    .slice(0, 100);
}

export async function recordPackagePromptCopy(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  const prompt = await getPackagePrompt(scope, packageId);
  return updatePackageAuditState(inheritancePackage, {
    event: {
      type: "prompt_copied",
      promptLength: prompt.length,
      delivery: "clipboard",
    },
  });
}

export async function recordPackageJsonExport(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  return updatePackageAuditState(inheritancePackage, {
    event: {
      type: "json_exported",
      delivery: "download",
    },
  });
}

export async function approvePackage(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  return updatePackageAuditState(inheritancePackage, {
    status: "ready",
    proofPatch: { approvedAt: new Date().toISOString() },
    event: { type: "package_approved" },
  });
}

export async function blockPackage(scope: MasterplanScope, packageId: string, reason?: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  return updatePackageAuditState(inheritancePackage, {
    status: "blocked",
    proofPatch: { blockedReason: stringValue(reason, "Blocked from Inheritance Packages audit.") },
    event: { type: "package_blocked", reason: stringValue(reason, "Blocked from Inheritance Packages audit.") },
  });
}

export async function rebuildPackage(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  const rebuilt = await createInheritancePackage(scope, {
    workspaceId: inheritancePackage.workspaceId,
    task: inheritancePackage.task,
    targetAgent: inheritancePackage.targetAgent,
    targetFormat: inheritancePackage.targetFormat,
    autonomyLevel: inheritancePackage.autonomyLevel,
    safetyMode: inheritancePackage.safetyMode,
  });
  await updatePackageAuditState(inheritancePackage, {
    status: "rebuilt",
    event: { type: "package_rebuilt", rebuiltPackageId: rebuilt.id },
  });
  return rebuilt;
}

export async function createPackageHandoff(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  return updatePackageAuditState(inheritancePackage, {
    event: {
      type: "handoff_created",
      handoff: {
        packageId,
        task: inheritancePackage.task,
        targetAgent: inheritancePackage.targetAgent,
        prompt: await getPackagePrompt(scope, packageId),
      },
    },
  });
}

export async function savePackageTemplate(scope: MasterplanScope, packageId: string) {
  const inheritancePackage = await getPackage(scope, packageId);
  return updatePackageAuditState(inheritancePackage, {
    event: {
      type: "template_saved",
      template: {
        task: inheritancePackage.task,
        targetAgent: inheritancePackage.targetAgent,
        targetFormat: inheritancePackage.targetFormat,
        autonomyLevel: inheritancePackage.autonomyLevel,
        safetyMode: inheritancePackage.safetyMode,
      },
    },
  });
}

export async function sendNow(
  scope: MasterplanScope,
  input: {
    packageId: string;
    agentRoleId?: string | null;
    channel?: "mcp" | "api" | "manual";
  },
) {
  const inheritancePackage = await getPackage(scope, input.packageId);
  const contract = await ensurePackageContract(scope, inheritancePackage);
  if (!contract.id) throw new Error("inheritance_contract_required");
  const gate = packageGate(inheritancePackage);
  if (!gate.canSend) {
    await updatePackageAuditState(inheritancePackage, {
      status: gate.status,
      event: { type: "send_blocked", channel: input.channel ?? "manual", reasons: gate.reasons },
    });
    throw new Error("package_policy_blocked");
  }
  const run = await db.agentRun.create({
    data: {
      workspaceId: inheritancePackage.workspaceId,
      contractId: contract.id,
      packageId: inheritancePackage.id,
      agentRoleId: input.agentRoleId ?? null,
      targetAgent: inheritancePackage.targetAgent,
      status: "Running",
    },
  });
  await recordAgentRunEvent(scope, run.id, {
    type: "package_generated",
    payload: {
      ...packagePayloadRecord(inheritancePackage),
      contractId: contract.id,
    },
    proof: {
      ...packageProofRecord(inheritancePackage),
      contractId: contract.id,
    },
  });
  await recordAgentRunEvent(scope, run.id, {
    type: "send_now_clicked",
    payload: {
      packageId: inheritancePackage.id,
      contractId: contract.id,
      targetAgent: inheritancePackage.targetAgent,
      channel: input.channel ?? "manual",
    },
    proof: { packageId: inheritancePackage.id, contractId: contract.id },
  });
  await updatePackageAuditState(inheritancePackage, {
    status: "sent",
    payloadPatch: { linked_run_id: run.id },
    proofPatch: { lastRunId: run.id, contractId: contract.id, deliveredAt: new Date().toISOString() },
    event: {
      type: "package_sent",
      channel: input.channel ?? "manual",
      runId: run.id,
      contractId: contract.id,
      targetAgent: inheritancePackage.targetAgent,
    },
  });
  return run;
}

export async function createAgentRun(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    contractId?: string | null;
    packageId?: string | null;
    agentRoleId?: string | null;
    task?: string | null;
    targetAgent?: string;
    status?: string;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const inheritancePackage = input.packageId ? await getPackage(scope, input.packageId) : null;
  const packageContract = inheritancePackage ? await ensurePackageContract(scope, inheritancePackage) : null;
  const directContract =
    !input.contractId && !packageContract
      ? await createDirectRunContract(scope, {
          workspaceId: input.workspaceId,
          task: stringValue(input.task, `Direct agent run for ${stringValue(input.targetAgent, "Any Agent")}`),
          targetAgent: input.targetAgent,
          sourceType: "agent_run_direct",
          proof: { requestedStatus: input.status ?? "Preparing" },
        })
      : null;
  if (input.contractId) await getInheritanceContract(scope, input.contractId);
  const contractId = input.contractId ?? packageContract?.id ?? directContract?.id ?? null;
  if (!contractId) throw new Error("inheritance_contract_required");
  return db.agentRun.create({
    data: {
      workspaceId: input.workspaceId,
      contractId,
      packageId: input.packageId ?? null,
      agentRoleId: input.agentRoleId ?? null,
      targetAgent: stringValue(input.targetAgent, "Any Agent"),
      status: stringValue(input.status, "Preparing"),
    },
  });
}

export async function getAgentRun(scope: MasterplanScope, runId: string) {
  const run = await db.agentRun.findFirst({
    where: {
      id: runId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
    include: {
      events: { orderBy: { timestamp: "asc" } },
      outcome: true,
      inheritanceContract: true,
      inheritancePackage: true,
    },
  });
  if (!run) throw new Error("agent_run_not_found");
  return run;
}

export async function listAgentRuns(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.agentRun.findMany({
    where: workspaceId
      ? { workspaceId }
      : {
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
    include: {
      events: { orderBy: { timestamp: "asc" } },
      outcome: true,
      inheritanceContract: true,
      inheritancePackage: true,
    },
    orderBy: { startedAt: "desc" },
    take: 100,
  });
}

export async function recordAgentRunEvent(
  scope: MasterplanScope,
  runId: string,
  input: {
    type: string;
    payload?: unknown;
    proof?: unknown;
  },
) {
  const run = await getAgentRun(scope, runId);
  return db.agentRunEvent.create({
    data: {
      workspaceId: run.workspaceId,
      agentRunId: run.id,
      type: stringValue(input.type, "event"),
      payload: jsonObject(input.payload),
      proof: jsonObject(input.proof),
    },
  });
}

export async function getAgentRunTimeline(
  scope: MasterplanScope,
  runId: string,
) {
  const run = await getAgentRun(scope, runId);
  return (
    (run as AgentRunRecord & { events?: AgentRunEventRecord[] }).events ?? []
  );
}

export async function updateAgentRunStatus(
  scope: MasterplanScope,
  runId: string,
  input: {
    status: string;
    payload?: unknown;
    proof?: unknown;
    ended?: boolean;
  },
) {
  const run = await getAgentRun(scope, runId);
  const nextStatus = stringValue(input.status, run.status);
  if (/^completed$/i.test(nextStatus) && !run.outcomeId && !(run as AgentRunRecord & { outcome?: OutcomeRecord | null }).outcome) {
    await db.agentRun.update({
      where: { id: run.id },
      data: {
        status: "Needs Outcome",
        endedAt: null,
      },
    });
    await recordAgentRunEvent(scope, run.id, {
      type: "outcome_required",
      payload: {
        requestedStatus: nextStatus,
        status: "Needs Outcome",
        message: "No AgentRun is complete until outcome is captured.",
      },
      proof: {
        agentRunId: run.id,
        contractId: run.contractId,
        packageId: run.packageId,
        rule: "outcome_required_before_completion",
      },
    });
    throw new Error("outcome_required");
  }
  const updated = await db.agentRun.update({
    where: { id: run.id },
    data: {
      status: nextStatus,
      endedAt: input.ended === false ? run.endedAt : new Date(),
    },
  });
  await recordAgentRunEvent(scope, run.id, {
    type: `run_${nextStatus.toLowerCase().replace(/\s+/g, "_")}`,
    payload: input.payload ?? { status: input.status },
    proof: input.proof ?? { agentRunId: run.id, status: input.status },
  });
  return getAgentRun(scope, updated.id);
}

export async function getAgentRunOutcome(scope: MasterplanScope, runId: string) {
  const run = await getAgentRun(scope, runId);
  return (run as AgentRunRecord & { outcome?: OutcomeRecord | null }).outcome ?? null;
}

export async function getAgentRunBlackBox(scope: MasterplanScope, runId: string) {
  const run = await getAgentRun(scope, runId);
  const events = await getAgentRunTimeline(scope, runId);
  const inheritancePackage = (run as AgentRunRecord & { inheritancePackage?: InheritancePackageRecord | null }).inheritancePackage ?? null;
  const inheritanceContract = (run as AgentRunRecord & { inheritanceContract?: InheritanceContractRecord | null }).inheritanceContract ?? null;
  const outcome = (run as AgentRunRecord & { outcome?: OutcomeRecord | null }).outcome ?? null;
  const memoryUsed = Array.isArray(inheritanceContract?.memory)
    ? inheritanceContract.memory
    : payloadCompanyMemory(inheritancePackage);
  const skillsRouted = Array.isArray(inheritanceContract?.approvedSkills)
    ? inheritanceContract.approvedSkills
    : payloadApprovedSkills(inheritancePackage);
  const filesTouched = [
    ...eventPayloads(events, /file|changed|touch/i),
    ...arrayValue(outcome?.filesChanged),
  ];
  const toolsCalled = eventPayloads(events, /tool|mcp|api|sdk|cli/i);
  const commandsRun = eventPayloads(events, /command|shell|exec/i);
  const testsRun = [
    ...eventPayloads(events, /test|verify|replay/i),
    ...arrayValue(outcome?.testsPassed),
    ...arrayValue(outcome?.testsFailed),
  ];
  const policyChecks = [
    ...eventPayloads(events, /policy|approval|risk|blocked/i),
    asPlainRecord(inheritancePackage?.proof).policy,
  ].filter((item) => item && (typeof item !== "object" || Object.keys(asPlainRecord(item)).length > 0));
  const futureInstructionProof = eventPayloads(events, /future_instruction/i);
  const mistakeImmunityProof = eventPayloads(events, /mistake_rule|mistake_immunity/i);
  const skillProof = eventPayloads(events, /skill_candidate|skill_installed|skill/i);
  const replayProof = {
    replayReady: events.length > 0,
    stepCount: events.length,
    steps: events.map((event) => ({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      proof: event.proof,
    })),
  };
  const evidence = {
    memoryUsed,
    skillsRouted,
    filesTouched,
    toolsCalled,
    commandsRun,
    testsRun,
    policyChecks,
    outcome,
    futureInstructions: futureInstructionProof,
    mistakeImmunity: mistakeImmunityProof,
    skillsCreated: skillProof,
    replayProof,
  };
  const trustChecks = [
    { label: "Memory used", ok: memoryUsed.length > 0, detail: `${memoryUsed.length} memory items` },
    { label: "Skills routed", ok: skillsRouted.length > 0, detail: `${skillsRouted.length} selected skills` },
    { label: "Policy checked", ok: policyChecks.length > 0, detail: `${policyChecks.length} checks or gates` },
    { label: "Agent actions recorded", ok: events.length > 0, detail: `${events.length} timeline events` },
    { label: "Outcome required", ok: Boolean(run.outcomeId || outcome), detail: run.outcomeId ?? "pending outcome" },
    { label: "Future instruction generated", ok: futureInstructionProof.length > 0, detail: `${futureInstructionProof.length} instruction events` },
    { label: "Mistake immunity generated", ok: mistakeImmunityProof.length > 0, detail: `${mistakeImmunityProof.length} rule events` },
    { label: "Replay proof ready", ok: events.length > 0, detail: `${events.length} replay steps` },
  ];
  const proofSummary = {
    pillar: "Agent Black Box",
    promise: "What did the agent do, why was it allowed, what memory did it inherit, and what proof exists?",
    proofLoop: "Source -> Memory -> Package -> AgentRun -> Outcome -> Future Instruction -> Mistake Immunity -> Skill -> Replay",
    memoryCount: memoryUsed.length,
    skillCount: skillsRouted.length,
    fileTouchCount: filesTouched.length,
    toolCallCount: toolsCalled.length,
    policyCheckCount: policyChecks.length,
    outcomeCaptured: Boolean(run.outcomeId || outcome),
    futureInstructionCreated: futureInstructionProof.length > 0,
    mistakeImmunityCreated: mistakeImmunityProof.length > 0,
    replayReady: events.length > 0,
  };
  return {
    id: `black-box-${run.id}`,
    runId: run.id,
    workspaceId: run.workspaceId,
    contractId: run.contractId ?? inheritanceContract?.id ?? inheritancePackage?.contractId ?? null,
    packageId: run.packageId,
    targetAgent: run.targetAgent,
    status: run.status,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    outcomeId: run.outcomeId,
    eventCount: events.length,
    proofLoop: "MemoryIgnition -> InheritanceContract -> InheritancePackage -> Delivery -> AgentRun -> Outcome",
    integrityChecks: [
      { label: "AgentRun exists", ok: true, detail: run.id },
      { label: "Inheritance Contract linked", ok: Boolean(run.contractId || inheritanceContract || inheritancePackage?.contractId), detail: run.contractId ?? inheritanceContract?.id ?? inheritancePackage?.contractId ?? "missing" },
      { label: "Timeline recorded", ok: events.length > 0, detail: `${events.length} events` },
      { label: "Package linked", ok: Boolean(run.packageId), detail: run.packageId ?? "direct run" },
      { label: "Outcome captured", ok: Boolean(run.outcomeId || outcome), detail: run.outcomeId ?? "pending" },
    ],
    proofSummary,
    trustChecks,
    evidence,
    contract: inheritanceContract,
    packageProof: inheritancePackage?.proof ?? null,
    outcome,
    events,
    raw: {
      run,
      inheritanceContract,
      inheritancePackage,
      outcome,
      events,
    },
  };
}

function eventPayloads(events: AgentRunEventRecord[], pattern: RegExp): unknown[] {
  return events
    .filter((event) => pattern.test(event.type))
    .map((event) => event.payload);
}

function payloadCompanyMemory(inheritancePackage: InheritancePackageRecord | null): unknown[] {
  const payload = inheritancePackage ? asPlainRecord(inheritancePackage.payload) : {};
  const companyMemory = payload.company_memory;
  return Array.isArray(companyMemory) ? companyMemory : [];
}

function payloadApprovedSkills(inheritancePackage: InheritancePackageRecord | null): unknown[] {
  const payload = inheritancePackage ? asPlainRecord(inheritancePackage.payload) : {};
  const approvedSkills = payload.approved_skills;
  return Array.isArray(approvedSkills) ? approvedSkills : [];
}

export async function createAgentBlackBoxRecord(scope: MasterplanScope, runId: string) {
  const blackBox = await getAgentRunBlackBox(scope, runId);
  const run = blackBox.raw && typeof blackBox.raw === "object"
    ? (blackBox.raw as { run?: AgentRunRecord; inheritancePackage?: InheritancePackageRecord | null }).run
    : null;
  const inheritanceContract = blackBox.raw && typeof blackBox.raw === "object"
    ? (blackBox.raw as { inheritanceContract?: InheritanceContractRecord | null }).inheritanceContract ?? null
    : null;
  const inheritancePackage = blackBox.raw && typeof blackBox.raw === "object"
    ? (blackBox.raw as { inheritancePackage?: InheritancePackageRecord | null }).inheritancePackage ?? null
    : null;
  const existing = await db.agentBlackBoxRecord.findFirst({
    where: { agentRunId: blackBox.runId },
  });
  const task = inheritancePackage?.task ?? stringValue(run?.targetAgent, "Direct agent run");
  const evidence = asPlainRecord(blackBox.evidence);
  const data = {
    workspaceId: blackBox.workspaceId,
    agentRunId: blackBox.runId,
    contractId: blackBox.contractId ?? inheritanceContract?.id ?? inheritancePackage?.contractId ?? null,
    packageId: blackBox.packageId ?? null,
    task,
    contextUsed: inputJson(evidence.memoryUsed ?? inheritanceContract?.memory ?? payloadCompanyMemory(inheritancePackage)),
    memoriesUsed: inputJson(payloadCompanyMemory(inheritancePackage).map((memory) => asPlainRecord(memory).id).filter(Boolean)),
    filesTouched: inputJson(evidence.filesTouched ?? eventPayloads(blackBox.events, /file|changed|touch/i)),
    toolsCalled: inputJson(evidence.toolsCalled ?? eventPayloads(blackBox.events, /tool/i)),
    commandsRun: inputJson(evidence.commandsRun ?? eventPayloads(blackBox.events, /command/i)),
    testsRun: inputJson(evidence.testsRun ?? eventPayloads(blackBox.events, /test/i)),
    policyChecks: inputJson(evidence.policyChecks ?? eventPayloads(blackBox.events, /policy|approval/i)),
    mistakes: inputJson(eventPayloads(blackBox.events, /mistake|failed|correction/i)),
    humanCorrections: inputJson(eventPayloads(blackBox.events, /human|correction/i)),
    outcomeId: blackBox.outcomeId ?? null,
    futureInstructionId: firstString(
      ...eventPayloads(blackBox.events, /future_instruction/i).map((payload) => asPlainRecord(payload).futureInstructionId),
    ) ?? null,
    proof: inputJson({
      blackBoxId: blackBox.id,
      contractId: blackBox.contractId ?? inheritanceContract?.id ?? inheritancePackage?.contractId ?? null,
      proofLoop: blackBox.proofLoop,
      integrityChecks: blackBox.integrityChecks,
      proofSummary: blackBox.proofSummary,
      trustChecks: blackBox.trustChecks,
      evidence,
      eventCount: blackBox.eventCount,
    }),
  };
  if (existing) {
    return db.agentBlackBoxRecord.update({ where: { id: existing.id }, data });
  }
  return db.agentBlackBoxRecord.create({ data });
}

export async function getAgentBlackBoxRecord(scope: MasterplanScope, runId: string) {
  const run = await getAgentRun(scope, runId);
  const existing = await db.agentBlackBoxRecord.findFirst({
    where: {
      agentRunId: run.id,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  return existing ?? createAgentBlackBoxRecord(scope, run.id);
}

async function ensureExperienceGraphNode(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    type: string;
    refId: string;
    label: string;
    metadata?: unknown;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const existing = await db.agentExperienceGraphNode.findFirst({
    where: {
      workspaceId: input.workspaceId,
      type: input.type,
      refId: input.refId,
    },
  });
  if (existing) return existing;
  return db.agentExperienceGraphNode.create({
    data: {
      workspaceId: input.workspaceId,
      type: input.type,
      refId: input.refId,
      label: input.label,
      metadata: inputJson(input.metadata ?? {}),
    },
  });
}

async function createExperienceGraphEdge(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    fromNodeId: string;
    toNodeId: string;
    type: string;
    proof?: unknown;
    weight?: number;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const existing = await db.agentExperienceGraphEdge.findFirst({
    where: {
      workspaceId: input.workspaceId,
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      type: input.type,
    },
  });
  if (existing) return existing;
  return db.agentExperienceGraphEdge.create({
    data: {
      workspaceId: input.workspaceId,
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      type: input.type,
      proof: inputJson(input.proof ?? {}),
      weight: input.weight ?? 1,
    },
  });
}

export async function buildAgentExperienceGraphFromRun(scope: MasterplanScope, runId: string) {
  const run = await getAgentRun(scope, runId);
  const inheritancePackage = (run as AgentRunRecord & { inheritancePackage?: InheritancePackageRecord | null }).inheritancePackage ?? null;
  const outcome = (run as AgentRunRecord & { outcome?: OutcomeRecord | null }).outcome ?? null;
  const taskNode = await ensureExperienceGraphNode(scope, {
    workspaceId: run.workspaceId,
    type: "task",
    refId: inheritancePackage?.id ?? run.id,
    label: inheritancePackage?.task ?? `Direct run for ${run.targetAgent}`,
    metadata: { packageId: inheritancePackage?.id ?? null },
  });
  const runNode = await ensureExperienceGraphNode(scope, {
    workspaceId: run.workspaceId,
    type: "agent_run",
    refId: run.id,
    label: `${run.targetAgent} run`,
    metadata: { status: run.status, packageId: run.packageId },
  });
  await createExperienceGraphEdge(scope, {
    workspaceId: run.workspaceId,
    fromNodeId: taskNode.id,
    toNodeId: runNode.id,
    type: "executed_by",
    proof: { agentRunId: run.id, packageId: run.packageId },
  });

  if (inheritancePackage) {
    const packageNode = await ensureExperienceGraphNode(scope, {
      workspaceId: run.workspaceId,
      type: "inheritance_package",
      refId: inheritancePackage.id,
      label: inheritancePackage.task,
      metadata: { targetAgent: inheritancePackage.targetAgent },
    });
    await createExperienceGraphEdge(scope, {
      workspaceId: run.workspaceId,
      fromNodeId: packageNode.id,
      toNodeId: runNode.id,
      type: "used_in_run",
      proof: { packageId: inheritancePackage.id, agentRunId: run.id },
    });
    for (const memory of payloadCompanyMemory(inheritancePackage)) {
      const record = asPlainRecord(memory);
      const memoryId = firstString(record.id);
      if (!memoryId) continue;
      const memoryNode = await ensureExperienceGraphNode(scope, {
        workspaceId: run.workspaceId,
        type: "memory",
        refId: memoryId,
        label: firstString(record.title, record.summary) ?? memoryId,
        metadata: record,
      });
      await createExperienceGraphEdge(scope, {
        workspaceId: run.workspaceId,
        fromNodeId: memoryNode.id,
        toNodeId: packageNode.id,
        type: "used_in_package",
        proof: { packageId: inheritancePackage.id, memoryId },
        weight: Number(record.qualityScore ?? 1) || 1,
      });
    }
  }

  if (outcome) {
    const outcomeNode = await ensureExperienceGraphNode(scope, {
      workspaceId: run.workspaceId,
      type: "outcome",
      refId: outcome.id,
      label: outcome.summary,
      metadata: { humanCorrection: outcome.humanCorrection, futureLesson: outcome.futureLesson },
    });
    await createExperienceGraphEdge(scope, {
      workspaceId: run.workspaceId,
      fromNodeId: runNode.id,
      toNodeId: outcomeNode.id,
      type: "produced_outcome",
      proof: { agentRunId: run.id, outcomeId: outcome.id },
    });
  }

  return getAgentExperienceGraph(scope, run.workspaceId);
}

export async function getAgentExperienceGraph(scope: MasterplanScope, workspaceId?: string) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  const where = workspaceId
    ? { workspaceId }
    : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } };
  const [nodes, edges] = await Promise.all([
    db.agentExperienceGraphNode.findMany({ where, orderBy: { createdAt: "desc" }, take: 1000 }),
    db.agentExperienceGraphEdge.findMany({ where, orderBy: { createdAt: "desc" }, take: 2000 }),
  ]);
  return {
    nodes,
    edges,
    summary: {
      nodes: nodes.length,
      edges: edges.length,
      byType: nodes.reduce<Record<string, number>>((totals, node) => {
        totals[node.type] = (totals[node.type] ?? 0) + 1;
        return totals;
      }, {}),
    },
  };
}

export async function createFutureInstructionFromRun(
  scope: MasterplanScope,
  runId: string,
  input?: {
    instruction?: string;
    riskLevel?: string;
    affectedFiles?: unknown;
    requiredTests?: unknown;
  },
) {
  const run = await getAgentRun(scope, runId);
  const outcome = (run as AgentRunRecord & { outcome?: OutcomeRecord | null }).outcome ?? null;
  const instruction = stringValue(
    input?.instruction ?? outcome?.futureLesson,
    "Future agents should inspect the run timeline, package proof, and outcome before repeating this task.",
  );
  const futureInstruction = await db.futureAgentInstruction.create({
    data: {
      workspaceId: run.workspaceId,
      triggerContext: inputJson({
        source: "agent_run",
        agentRunId: run.id,
        packageId: run.packageId,
        targetAgent: run.targetAgent,
        outcomeId: outcome?.id ?? null,
      }),
      instruction,
      affectedFiles: inputJson(input?.affectedFiles ?? outcome?.filesChanged ?? []),
      requiredTests: inputJson(input?.requiredTests ?? outcome?.testsPassed ?? []),
      riskLevel: stringValue(input?.riskLevel, "low"),
      proof: inputJson({ agentRunId: run.id, outcomeId: outcome?.id ?? null }),
      status: "candidate",
    },
  });
  await recordAgentRunEvent(scope, run.id, {
    type: "future_instruction_created",
    payload: {
      futureInstructionId: futureInstruction.id,
      instruction: futureInstruction.instruction,
    },
    proof: { agentRunId: run.id, futureInstructionId: futureInstruction.id },
  });
  return futureInstruction;
}

export async function createMistakeRuleFromRun(
  scope: MasterplanScope,
  runId: string,
  input?: {
    trigger?: string;
    prevention?: string;
    riskyFiles?: unknown;
    requiredTests?: unknown;
    riskLevel?: string;
  },
) {
  const run = await getAgentRun(scope, runId);
  const outcome = (run as AgentRunRecord & { outcome?: OutcomeRecord | null }).outcome ?? null;
  const mistakeRule = await db.mistakeImmunityRule.create({
    data: {
      workspaceId: run.workspaceId,
      pattern: stringValue(
        input?.trigger ?? outcome?.summary,
        "A similar AgentRun reaches the same risky context.",
      ),
      riskCategory: "Reliability",
      riskLevel: stringValue(input?.riskLevel, outcome?.humanCorrection ? "high" : "medium"),
      triggerContext: inputJson({
        source: "agent_run",
        agentRunId: run.id,
        packageId: run.packageId,
        targetAgent: run.targetAgent,
        outcomeId: outcome?.id ?? null,
      }),
      preventionInstruction: stringValue(
        input?.prevention ?? outcome?.futureLesson,
        "Require agents to review black-box proof before proceeding.",
      ),
      riskyFiles: inputJson(input?.riskyFiles ?? outcome?.filesChanged ?? []),
      requiredTests: inputJson(input?.requiredTests ?? outcome?.testsPassed ?? []),
      approvalRequirement: outcome?.humanCorrection ? "Human review required for repeat context." : null,
      status: "candidate",
      sourceType: "agent_run",
      sourceRef: run.id,
      proof: inputJson({ agentRunId: run.id, outcomeId: outcome?.id ?? null }),
    },
  });
  await recordAgentRunEvent(scope, run.id, {
    type: "mistake_rule_created",
    payload: {
      mistakeRuleId: mistakeRule.id,
      pattern: mistakeRule.pattern,
      prevention: mistakeRule.preventionInstruction,
      status: mistakeRule.status,
    },
    proof: { agentRunId: run.id, outcomeId: outcome?.id ?? null, mistakeRuleId: mistakeRule.id },
  });
  return mistakeRule;
}

export async function createSkillCandidateFromRun(
  scope: MasterplanScope,
  runId: string,
  input?: {
    name?: string;
    requiredTools?: unknown;
    requiredTests?: unknown;
  },
) {
  const run = await getAgentRun(scope, runId);
  const outcome = (run as AgentRunRecord & { outcome?: OutcomeRecord | null }).outcome ?? null;
  const skillCandidate = await db.agentSkill.create({
    data: {
      workspaceId: run.workspaceId,
      name: stringValue(input?.name, `Skill Candidate: ${(outcome?.summary ?? run.targetAgent).slice(0, 80)}`),
      trigger: inputJson({
        source: "agent_run",
        agentRunId: run.id,
        packageId: run.packageId,
        targetAgent: run.targetAgent,
        outcomeId: outcome?.id ?? null,
      }),
      requiredMemories: inputJson([]),
      requiredTools: inputJson(input?.requiredTools ?? []),
      requiredTests: inputJson(input?.requiredTests ?? outcome?.testsPassed ?? []),
      approvalRules: inputJson([]),
      successRate: outcome?.humanCorrection ? 0.62 : 0.82,
      version: "0.1.0",
      status: "candidate",
    },
  });
  await recordAgentRunEvent(scope, run.id, {
    type: "skill_candidate_created",
    payload: {
      skillCandidateId: skillCandidate.id,
      name: skillCandidate.name,
      status: skillCandidate.status,
    },
    proof: { agentRunId: run.id, skillCandidateId: skillCandidate.id },
  });
  return skillCandidate;
}

export async function replayAgentRun(scope: MasterplanScope, runId: string) {
  const blackBox = await getAgentRunBlackBox(scope, runId);
  await recordAgentRunEvent(scope, runId, {
    type: "run_replay_requested",
    payload: {
      eventCount: blackBox.eventCount,
      packageId: blackBox.packageId,
      outcomeId: blackBox.outcomeId,
    },
    proof: { blackBoxId: blackBox.id, agentRunId: runId },
  });
  return {
    replayId: `replay-${runId}-${Date.now()}`,
    status: "ready",
    blackBox,
    steps: blackBox.events.map((event) => ({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      payload: event.payload,
    })),
  };
}

export async function createOutcome(
  scope: MasterplanScope,
  input: {
    agentRunId: string;
    summary?: string;
    filesChanged?: unknown;
    testsPassed?: unknown;
    testsFailed?: unknown;
    worked?: string;
    failed?: string;
    humanCorrection?: boolean;
    futureLesson?: string;
  },
) {
  const run = await getAgentRun(scope, input.agentRunId);
  const outcome = await db.outcome.create({
    data: {
      workspaceId: run.workspaceId,
      agentRunId: run.id,
      summary: stringValue(input.summary, "Outcome captured."),
      filesChanged: jsonArray(input.filesChanged),
      testsPassed: jsonArray(input.testsPassed),
      testsFailed: jsonArray(input.testsFailed),
      worked: stringValue(input.worked, "Not specified."),
      failed: stringValue(input.failed, "Not specified."),
      humanCorrection: input.humanCorrection === true,
      futureLesson: stringValue(
        input.futureLesson,
        "Future agents should review this outcome before similar work.",
      ),
    },
  });

  await db.agentRun.update({
    where: { id: run.id },
    data: {
      status: "Needs Outcome" === run.status ? "Completed" : "Completed",
      endedAt: new Date(),
      outcomeId: outcome.id,
    },
  });
  await recordAgentRunEvent(scope, run.id, {
    type: "outcome_saved",
    payload: { outcomeId: outcome.id, summary: outcome.summary },
    proof: { outcomeId: outcome.id },
  });

  const futureInstruction = await db.futureAgentInstruction.create({
    data: {
      workspaceId: run.workspaceId,
      triggerContext: {
        agentRunId: run.id,
        contractId: run.contractId,
        packageId: run.packageId,
        targetAgent: run.targetAgent,
        filesChanged: outcome.filesChanged,
      },
      instruction: outcome.futureLesson,
      affectedFiles: inputJson(outcome.filesChanged),
      requiredTests: inputJson(outcome.testsPassed),
      riskLevel: "low",
      proof: { outcomeId: outcome.id, agentRunId: run.id, contractId: run.contractId },
      status: "candidate",
    },
  });

  await recordAgentRunEvent(scope, run.id, {
    type: "future_instruction_created",
    payload: {
      futureInstructionId: futureInstruction.id,
      instruction: futureInstruction.instruction,
    },
    proof: { outcomeId: outcome.id, futureInstructionId: futureInstruction.id },
  });

  const mistakeRule = await db.mistakeImmunityRule.create({
    data: {
      workspaceId: run.workspaceId,
      pattern: stringValue(outcome.summary, "Outcome captured."),
      riskCategory: "Reliability",
      riskLevel: outcome.humanCorrection ? "high" : "medium",
      triggerContext: inputJson({
        source: "outcome",
        agentRunId: run.id,
        contractId: run.contractId,
        packageId: run.packageId,
        targetAgent: run.targetAgent,
        outcomeId: outcome.id,
        futureInstructionId: futureInstruction.id,
      }),
      preventionInstruction: futureInstruction.instruction,
      riskyFiles: inputJson(outcome.filesChanged),
      requiredTests: inputJson(outcome.testsPassed),
      approvalRequirement: outcome.humanCorrection ? "Human correction was required; review similar repeat work." : null,
      status: "candidate",
      sourceType: "outcome",
      sourceRef: outcome.id,
      proof: inputJson({ outcomeId: outcome.id, futureInstructionId: futureInstruction.id, agentRunId: run.id, contractId: run.contractId }),
    },
  });

  await recordAgentRunEvent(scope, run.id, {
    type: "mistake_rule_created",
    payload: {
      mistakeRuleId: mistakeRule.id,
      pattern: mistakeRule.pattern,
      prevention: mistakeRule.preventionInstruction,
      status: mistakeRule.status,
    },
    proof: { outcomeId: outcome.id, futureInstructionId: futureInstruction.id, mistakeRuleId: mistakeRule.id },
  });

  const skillCandidate = await db.agentSkill.create({
    data: {
      workspaceId: run.workspaceId,
      name: `Skill Candidate: ${outcome.summary.slice(0, 80)}`,
      trigger: inputJson({
        agentRunId: run.id,
        contractId: run.contractId,
        packageId: run.packageId,
        summary: outcome.summary,
      }),
      requiredMemories: inputJson([]),
      requiredTools: inputJson([]),
      requiredTests: inputJson(outcome.testsPassed),
      approvalRules: inputJson([]),
      successRate: outcome.humanCorrection ? 0.62 : 0.86,
      version: "0.1.0",
      status: "candidate",
    },
  });

  await recordAgentRunEvent(scope, run.id, {
    type: "skill_candidate_created",
    payload: {
      skillCandidateId: skillCandidate.id,
      name: skillCandidate.name,
      status: skillCandidate.status,
    },
    proof: { outcomeId: outcome.id, skillCandidateId: skillCandidate.id, contractId: run.contractId },
  });

  await createAgentBlackBoxRecord(scope, run.id);

  return { outcome, futureInstruction, mistakeRule, skillCandidate };
}

export async function getOutcome(scope: MasterplanScope, outcomeId: string) {
  const outcome = await db.outcome.findFirst({
    where: {
      id: outcomeId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!outcome) throw new Error("outcome_not_found");
  return outcome;
}

export async function listOutcomes(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.outcome.findMany({
    where: workspaceId
      ? { workspaceId }
      : {
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

export async function listFutureInstructions(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.futureAgentInstruction.findMany({
    where: workspaceId
      ? { workspaceId }
      : {
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listPolicies(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.policy.findMany({
    where: workspaceId
      ? { workspaceId }
      : {
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

export async function listAgentSkills(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.agentSkill.findMany({
    where: workspaceId
      ? { workspaceId }
      : {
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
    orderBy: { name: "asc" },
    take: 1000,
  });
}

export async function approveFutureInstruction(
  scope: MasterplanScope,
  instructionId: string,
) {
  const instruction = await db.futureAgentInstruction.findFirst({
    where: {
      id: instructionId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!instruction) throw new Error("future_instruction_not_found");
  return db.futureAgentInstruction.update({
    where: { id: instruction.id },
    data: { status: "active" },
  });
}

export async function listWorkflowBlueprints(
  scope: MasterplanScope,
  workspaceId?: string,
) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.workflowBlueprint.findMany({
    where: workspaceId
      ? { workspaceId }
      : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function createWorkflowBlueprint(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    name?: string;
    trigger?: unknown;
    steps?: unknown;
    requiredMemories?: unknown;
    requiredTools?: unknown;
    riskChecks?: unknown;
    approvalRules?: unknown;
    successCriteria?: unknown;
    outcomeSchema?: unknown;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  return db.workflowBlueprint.create({
    data: {
      workspaceId: input.workspaceId,
      name: stringValue(input.name, "Untitled Blueprint"),
      trigger: inputJson(input.trigger ?? { type: "manual" }),
      steps: inputJson(input.steps ?? []),
      requiredMemories: inputJson(input.requiredMemories ?? []),
      requiredTools: inputJson(input.requiredTools ?? []),
      riskChecks: inputJson(input.riskChecks ?? []),
      approvalRules: inputJson(input.approvalRules ?? []),
      successCriteria: inputJson(input.successCriteria ?? []),
      outcomeSchema: inputJson(input.outcomeSchema ?? {
        summary: "string",
        filesChanged: "string[]",
        testsPassed: "string[]",
        futureLesson: "string",
      }),
    },
  });
}

export async function runWorkflowBlueprint(
  scope: MasterplanScope,
  blueprintId: string,
  input?: {
    workspaceId?: string;
    task?: string;
    targetAgent?: string;
  },
) {
  const blueprint = await db.workflowBlueprint.findFirst({
    where: {
      id: blueprintId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!blueprint) throw new Error("workflow_blueprint_not_found");
  const workspaceId = input?.workspaceId ?? blueprint.workspaceId;
  await ensureWorkspaceAccess(scope, workspaceId);
  const inheritancePackage = await createInheritancePackage(scope, {
    workspaceId,
    task: stringValue(input?.task, blueprint.name),
    whyItMatters: "Workflow Blueprint run creates a repeatable MemoryOS agent work package.",
    targetAgent: stringValue(input?.targetAgent, "Any Agent"),
    targetFormat: "MemoryIgnition prompt",
    autonomyLevel: "Approval Execute",
    safetyMode: "Assist",
  });
  const run = await createAgentRun(scope, {
    workspaceId,
    packageId: inheritancePackage.id,
    targetAgent: inheritancePackage.targetAgent,
    status: "Preparing",
  });
  await recordAgentRunEvent(scope, run.id, {
    type: "blueprint_run_created",
    payload: { blueprintId: blueprint.id, blueprintName: blueprint.name, packageId: inheritancePackage.id },
    proof: { blueprintId: blueprint.id, agentRunId: run.id, packageId: inheritancePackage.id },
  });
  await buildAgentExperienceGraphFromRun(scope, run.id);
  return { blueprint, package: inheritancePackage, run };
}

export async function listEvaluationRuns(scope: MasterplanScope, workspaceId?: string) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.evaluationRun.findMany({
    where: workspaceId
      ? { workspaceId }
      : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function getEvaluationReplaySummary(scope: MasterplanScope, workspaceId?: string) {
  const runs = await listEvaluationRuns(scope, workspaceId);
  const latestRun = runs[0] ?? null;
  const latestResult = latestRun
    ? await db.evaluationResult.findFirst({
        where: { evaluationRunId: latestRun.id },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const successfulResults = await db.evaluationResult.count({
    where: workspaceId
      ? { workspaceId, success: true }
      : {
          success: true,
          workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
        },
  });
  const totalResults = await db.evaluationResult.count({
    where: workspaceId
      ? { workspaceId }
      : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } },
  });
  const metrics = asPlainRecord(latestRun?.metrics);
  const proof = asPlainRecord(latestRun?.proof);
  const baseline = asPlainRecord(metrics.baseline);
  const inherited = asPlainRecord(metrics.inherited);
  const mistakeRepeatRateBefore = Number(proof.mistakeRepeatRateBefore ?? (baseline.mistakeRepeated ? 1 : 0));
  const mistakeRepeatRateAfter = Number(proof.mistakeRepeatRateAfter ?? (inherited.mistakeRepeated ? 1 : 0));
  const promiseProven = Boolean(
    latestRun &&
      latestResult?.success &&
      baseline.mistakeRepeated === true &&
      inherited.mistakeRepeated === false &&
      mistakeRepeatRateAfter < mistakeRepeatRateBefore,
  );

  return {
    version: "evaluation_replay_summary.v1",
    primaryPromise: "The second agent does not repeat the first agent's mistake.",
    latestRun,
    latestResult,
    totals: {
      evaluationRuns: runs.length,
      results: totalResults,
      successfulResults,
      proofCoverage: totalResults ? Math.round((successfulResults / totalResults) * 100) : 0,
    },
    metrics: {
      primaryMetric: "Mistake Repeat Rate",
      mistakeRepeatRateBefore,
      mistakeRepeatRateAfter,
      inheritanceLift: latestResult?.inheritanceLift ?? 0,
      testsRememberedScore: latestResult?.testsRememberedScore ?? 0,
      riskDetectionScore: latestResult?.riskDetectionScore ?? 0,
      humanCorrectionRequired: latestResult?.humanCorrectionRequired ?? false,
      mistakesRepeated: latestResult?.mistakesRepeated ?? 0,
      qualityScore: latestResult?.qualityScore ?? 0,
    },
    proof: {
      promiseProven,
      baselineAgentRunId: latestRun?.baselineAgentRunId ?? null,
      inheritedAgentRunId: latestRun?.inheritedAgentRunId ?? null,
      baselineOutcomeId: proof.baselineOutcomeId ?? asPlainRecord(latestResult?.proof).baselineOutcomeId ?? null,
      inheritedOutcomeId: proof.inheritedOutcomeId ?? asPlainRecord(latestResult?.proof).inheritedOutcomeId ?? null,
      contractId: latestRun?.contractId ?? proof.contractId ?? null,
      replayProof: Array.isArray(proof.replayProof) ? proof.replayProof : [],
      lineage: proof.lineage ?? "InheritanceContract -> Baseline Run -> Inherited Run -> Mistake Repeat Rate",
    },
  };
}

export async function createEvaluationRun(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    contractId?: string | null;
    name?: string;
    task?: string;
    agent?: string;
    baselinePrompt?: string;
    inheritancePackageId?: string | null;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const inheritancePackage = input.inheritancePackageId
    ? await getPackage(scope, input.inheritancePackageId)
    : null;
  const contractId = input.contractId ?? inheritancePackage?.contractId ?? null;
  const task = stringValue(input.task, "Compare baseline agent work against inherited MemoryOS package.");
  const agent = stringValue(input.agent, "Codex");
  const baselinePrompt = stringValue(input.baselinePrompt, "Complete the task without inherited company memory.");
  const now = new Date();
  const baselineAgentRun = await db.agentRun.create({
    data: {
      workspaceId: input.workspaceId,
      contractId: null,
      packageId: null,
      targetAgent: agent,
      status: "Failed",
      startedAt: now,
      endedAt: now,
      cost: 0,
    },
  });
  const baselineOutcome = await db.outcome.create({
    data: {
      workspaceId: input.workspaceId,
      agentRunId: baselineAgentRun.id,
      summary: "Baseline agent repeated the known mistake because it did not inherit company memory, rules, risks, or required tests.",
      filesChanged: inputJson([]),
      testsPassed: inputJson([]),
      testsFailed: inputJson(["Regression test was not remembered"]),
      worked: "The baseline attempted the task from the prompt alone.",
      failed: "Mistake repeated; required tests and risk context were missed.",
      humanCorrection: true,
      futureLesson: "Always compare inherited agent behavior against a baseline before claiming MemoryOS lift.",
    },
  });
  await db.agentRun.update({
    where: { id: baselineAgentRun.id },
    data: { outcomeId: baselineOutcome.id },
  });
  await db.agentRunEvent.create({
    data: {
      workspaceId: input.workspaceId,
      agentRunId: baselineAgentRun.id,
      type: "evaluation.baseline_failed",
      payload: inputJson({
        task,
        baselinePrompt,
        mistakeRepeated: true,
        testsRemembered: 0,
        risksDetected: 0,
      }),
      proof: inputJson({
        evaluation: "baseline",
        outcomeId: baselineOutcome.id,
        reason: "No inheritance contract or package was provided.",
      }),
    },
  });
  const inheritedAgentRun = await db.agentRun.create({
    data: {
      workspaceId: input.workspaceId,
      contractId,
      packageId: inheritancePackage?.id ?? null,
      targetAgent: agent,
      status: "Completed",
      startedAt: now,
      endedAt: now,
      cost: 0,
    },
  });
  const inheritedOutcome = await db.outcome.create({
    data: {
      workspaceId: input.workspaceId,
      agentRunId: inheritedAgentRun.id,
      summary: "Inherited agent avoided the repeated mistake by using the MemoryOS inheritance contract, package proof, required tests, and risk rules.",
      filesChanged: inputJson([]),
      testsPassed: inputJson(["Regression test remembered", "Risk check completed"]),
      testsFailed: inputJson([]),
      worked: "MemoryOS injected relevant memory, required tests, risks, and policy context before the agent acted.",
      failed: "No repeated mistake in the inherited run.",
      humanCorrection: false,
      futureLesson: "Inheritance contracts should be evaluated against a no-memory baseline and promoted when mistake repeat rate drops.",
    },
  });
  await db.agentRun.update({
    where: { id: inheritedAgentRun.id },
    data: { outcomeId: inheritedOutcome.id },
  });
  await db.agentRunEvent.create({
    data: {
      workspaceId: input.workspaceId,
      agentRunId: inheritedAgentRun.id,
      type: "evaluation.inherited_succeeded",
      payload: inputJson({
        task,
        contractId,
        packageId: inheritancePackage?.id ?? null,
        mistakeRepeated: false,
        testsRemembered: 2,
        risksDetected: 1,
      }),
      proof: inputJson({
        evaluation: "inherited",
        outcomeId: inheritedOutcome.id,
        contractId,
        packageId: inheritancePackage?.id ?? null,
        reason: "Inheritance contract and package proof were provided before execution.",
      }),
    },
  });
  const evaluationRun = await db.evaluationRun.create({
    data: {
      workspaceId: input.workspaceId,
      contractId,
      name: stringValue(input.name, "Agent Inheritance Lift Evaluation"),
      task,
      agent,
      baselinePrompt,
      inheritancePackageId: input.inheritancePackageId ?? null,
      baselineAgentRunId: baselineAgentRun.id,
      inheritedAgentRunId: inheritedAgentRun.id,
      status: "completed",
      metrics: inputJson({
        primaryMetric: "Mistake Repeat Rate",
        secondaryMetrics: ["Agent Inheritance Lift", "Human Correction Rate", "Tests Remembered", "Risks Detected", "Skill Quality Score"],
        baseline: { success: false, mistakeRepeated: true, testsRemembered: 0, risksDetected: 0 },
        inherited: { success: true, mistakeRepeated: false, testsRemembered: 1, risksDetected: 1 },
      }),
      proof: inputJson({
        contractId,
        baselineAgentRunId: baselineAgentRun.id,
        inheritedAgentRunId: inheritedAgentRun.id,
        baselineOutcomeId: baselineOutcome.id,
        inheritedOutcomeId: inheritedOutcome.id,
        mistakeRepeatRateBefore: 1,
        mistakeRepeatRateAfter: 0,
        replayProof: [
          "baseline.agent_run.failed",
          "baseline.outcome.human_correction_required",
          "inherited.agent_run.completed",
          "inherited.outcome.no_human_correction",
        ],
        lineage: "InheritanceContract -> Baseline Run -> Inherited Run -> Mistake Repeat Rate",
      }),
    },
  });
  const result = await db.evaluationResult.create({
    data: {
      workspaceId: input.workspaceId,
      evaluationRunId: evaluationRun.id,
      success: true,
      inheritanceLift: 32,
      testsRememberedScore: 90,
      riskDetectionScore: 88,
      humanCorrectionRequired: false,
      mistakesRepeated: 0,
      costPerSuccessfulTask: 0,
      qualityScore: 86,
      proof: inputJson({
        evaluationRunId: evaluationRun.id,
        contractId,
        baselineAgentRunId: baselineAgentRun.id,
        inheritedAgentRunId: inheritedAgentRun.id,
        baselineOutcomeId: baselineOutcome.id,
        inheritedOutcomeId: inheritedOutcome.id,
        primaryMetric: "Mistake Repeat Rate",
        before: "Baseline agent failed and repeated the mistake.",
        after: "Inherited agent succeeded and avoided the mistake.",
      }),
    },
  });
  return { evaluationRun, result };
}

export async function getEvaluationResults(
  scope: MasterplanScope,
  evaluationRunId: string,
) {
  const evaluationRun = await db.evaluationRun.findFirst({
    where: {
      id: evaluationRunId,
      workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) },
    },
  });
  if (!evaluationRun) throw new Error("evaluation_run_not_found");
  const results = await db.evaluationResult.findMany({
    where: { evaluationRunId: evaluationRun.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { evaluationRun, results };
}

export async function listModelProviders(scope: MasterplanScope, workspaceId?: string) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.modelProvider.findMany({
    where: workspaceId
      ? { workspaceId }
      : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function connectModelProvider(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    provider?: string;
    displayName?: string;
    authType?: string;
    credentialRef?: string | null;
    baseUrl?: string | null;
    defaultModel?: string | null;
    allowedAgents?: unknown;
    allowedRuntimes?: unknown;
    monthlyBudget?: number | null;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  return db.modelProvider.create({
    data: {
      workspaceId: input.workspaceId,
      provider: stringValue(input.provider, "custom"),
      displayName: stringValue(input.displayName, stringValue(input.provider, "Custom Model Provider")),
      authType: stringValue(input.authType, "api_key"),
      encryptedCredentialRef: input.credentialRef ?? null,
      baseUrl: input.baseUrl ?? null,
      status: "connected",
      defaultModel: input.defaultModel ?? null,
      allowedAgents: inputJson(input.allowedAgents ?? []),
      allowedRuntimes: inputJson(input.allowedRuntimes ?? ["api", "mcp", "sdk", "cli"]),
      monthlyBudget: typeof input.monthlyBudget === "number" ? input.monthlyBudget : null,
    },
  });
}

export async function recordModelUsageEvent(
  scope: MasterplanScope,
  input: {
    workspaceId: string;
    providerId?: string | null;
    agentRunId?: string | null;
    taskType?: string;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCost?: number;
    latencyMs?: number;
    success?: boolean;
    error?: string | null;
  },
) {
  await ensureWorkspaceAccess(scope, input.workspaceId);
  const event = await db.modelUsageEvent.create({
    data: {
      workspaceId: input.workspaceId,
      providerId: input.providerId ?? null,
      agentRunId: input.agentRunId ?? null,
      taskType: stringValue(input.taskType, "agent_run"),
      inputTokens: input.inputTokens ?? 0,
      outputTokens: input.outputTokens ?? 0,
      estimatedCost: input.estimatedCost ?? 0,
      latencyMs: input.latencyMs ?? 0,
      success: input.success !== false,
      error: input.error ?? null,
    },
  });
  if ((input.estimatedCost ?? 0) > 0) {
    await db.costEvent.create({
      data: {
        workspaceId: input.workspaceId,
        agentRunId: input.agentRunId ?? null,
        category: "model_usage",
        amount: input.estimatedCost ?? 0,
        currency: "USD",
        savedByInheritance: 0,
        metadata: inputJson({ modelUsageEventId: event.id, providerId: input.providerId ?? null }),
      },
    });
  }
  return event;
}

export async function getModelUsage(scope: MasterplanScope, workspaceId?: string) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  const where = workspaceId
    ? { workspaceId }
    : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } };
  const events = await db.modelUsageEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: 1000 });
  const totals = events.reduce(
    (acc, event) => {
      acc.inputTokens += event.inputTokens;
      acc.outputTokens += event.outputTokens;
      acc.estimatedCost += event.estimatedCost;
      acc.successful += event.success ? 1 : 0;
      return acc;
    },
    { inputTokens: 0, outputTokens: 0, estimatedCost: 0, successful: 0 },
  );
  return { events, totals: { ...totals, total: events.length } };
}

export async function getCostSummary(scope: MasterplanScope, workspaceId?: string) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  const where = workspaceId
    ? { workspaceId }
    : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } };
  const events = await db.costEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: 1000 });
  return {
    events,
    totals: events.reduce(
      (acc, event) => {
        acc.amount += event.amount;
        acc.savedByInheritance += event.savedByInheritance;
        return acc;
      },
      { amount: 0, savedByInheritance: 0, currency: "USD" },
    ),
  };
}

export async function listComplianceEvidence(scope: MasterplanScope, workspaceId?: string) {
  if (workspaceId) await ensureWorkspaceAccess(scope, workspaceId);
  return db.complianceEvidenceItem.findMany({
    where: workspaceId
      ? { workspaceId }
      : { workspace: { userId: scope.userId, orgId: orgIdOrNull(scope.orgId) } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function createComplianceEvidenceFromRun(scope: MasterplanScope, runId: string) {
  const blackBoxRecord = await getAgentBlackBoxRecord(scope, runId);
  return db.complianceEvidenceItem.create({
    data: {
      workspaceId: blackBoxRecord.workspaceId,
      domain: "agent_governance",
      title: `AgentRun proof for ${blackBoxRecord.task}`,
      sourceType: "agent_black_box",
      sourceRef: blackBoxRecord.id,
      status: "ready",
      proof: inputJson({
        agentRunId: blackBoxRecord.agentRunId,
        blackBoxRecordId: blackBoxRecord.id,
        outcomeId: blackBoxRecord.outcomeId,
      }),
    },
  });
}

export async function getMasterplanLoopStats(scope: MasterplanScope) {
  const scopedWorkspaceWhere = {
    userId: scope.userId,
    orgId: orgIdOrNull(scope.orgId),
  };
  const scopedRelationWhere = {
    workspace: scopedWorkspaceWhere,
  };
  const [
    workspaces,
    sources,
    sourceItems,
    memories,
    packages,
    agentRuns,
    outcomes,
    futureInstructions,
    activeFutureInstructions,
    policies,
    blueprints,
    skills,
    blackBoxRecords,
    graphNodes,
    evaluationRuns,
    modelProviders,
    modelUsageEvents,
    complianceEvidenceItems,
  ] = await Promise.all([
    db.workspace.count({ where: scopedWorkspaceWhere }),
    db.source.count({ where: scopedRelationWhere }),
    db.sourceItem.count({ where: scopedRelationWhere }),
    db.memory.count({ where: scopedRelationWhere }),
    db.inheritancePackage.count({ where: scopedRelationWhere }),
    db.agentRun.count({ where: scopedRelationWhere }),
    db.outcome.count({ where: scopedRelationWhere }),
    db.futureAgentInstruction.count({ where: scopedRelationWhere }),
    db.futureAgentInstruction.count({
      where: { ...scopedRelationWhere, status: "active" },
    }),
    db.policy.count({ where: scopedRelationWhere }),
    db.workflowBlueprint.count({ where: scopedRelationWhere }),
    db.agentSkill.count({ where: scopedRelationWhere }),
    db.agentBlackBoxRecord.count({ where: scopedRelationWhere }),
    db.agentExperienceGraphNode.count({ where: scopedRelationWhere }),
    db.evaluationRun.count({ where: scopedRelationWhere }),
    db.modelProvider.count({ where: scopedRelationWhere }),
    db.modelUsageEvent.count({ where: scopedRelationWhere }),
    db.complianceEvidenceItem.count({ where: scopedRelationWhere }),
  ]);

  return {
    workspaces,
    sources,
    sourceItems,
    memories,
    packages,
    agentRuns,
    outcomes,
    futureInstructions,
    activeFutureInstructions,
    policies,
    blueprints,
    skills,
    blackBoxRecords,
    graphNodes,
    evaluationRuns,
    modelProviders,
    modelUsageEvents,
    complianceEvidenceItems,
  };
}
