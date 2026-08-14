import type {
  ContextSearchResult,
  MemoryStoreSearchResult,
} from "../adapters/adapters";
import { getContextAdapter, getMemoryStoreAdapter } from "../adapters/registry";
import { getRecentMemories } from "./recentMemoryStore";
import type { DeveloperSignals, Memory, MemoryContractCategory, MemoryStatus, MemoryType } from "./types";
import { MEMORY_CONTRACT_CATEGORIES } from "./types";
import { MEMORY_RULES, type RetrievalIntent } from "../config/memoryRules";
import { getRetrievalWeights } from "../config/retrievalWeights";
import {
  getLatestLifecycleSnapshot,
  listTimelineEvents,
  type LifecycleSnapshot,
} from "./timelineMemory";

export interface RetrieveRelevantMemoryInput {
  userId: string;
  question: string;
  topK?: number; // how many final memories to return
  includeArchived?: boolean;
  workspace?: string;
  project?: string;
  threadId?: string;
  repo?: string;
  service?: string;
  environment?: string;
  taskId?: string;
  strictThreadId?: boolean;
}

export interface RankedMemory extends MemoryStoreSearchResult {
  memoryType?: MemoryType;
  contractCategory?: MemoryContractCategory;
  importanceScore: number; // 0..1
  recencyScore: number; // 0..1
  typeRelevanceScore: number; // 0..1
  semanticScore: number; // 0..1 (from memory store semantic score)
  continuityBoost: number;
  finalScore: number; // weighted score
  updatedAt?: string;
}

export interface RetrieveRelevantMemoryResult {
  memories: RankedMemory[];
  debug: RetrievalDebugItem[];
}

export interface ScoreContributions {
  semantic: number;
  typeRelevance: number;
  importance: number;
  recency: number;
  continuity: number;
  total: number;
}

export interface RetrievalDebugItem {
  id: string;
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
  continuityBoost: number;
  intent: RetrievalIntent;
  weightsUsed: {
    semantic: number;
    typeRelevance: number;
    importance: number;
    recency: number;
  };
  reasonTags: string[];
  contributions: ScoreContributions;
  finalScore: number;
  lifecycle: {
    latestEventType: LifecycleSnapshot["eventType"] | null;
    latestReason: string | null;
    latestChangedAt: string | null;
  };
}

export interface RetrievalDiagnosticCandidate extends RetrievalDebugItem {
  memory?: string;
  memoryType?: MemoryType;
  status?: MemoryStatus;
  updatedAt?: string;
  filteredOut: boolean;
  filterReason?: string;
}

export interface RetrievalAnalysisResult {
  intent: RetrievalIntent;
  weightsUsed: RetrievalDebugItem["weightsUsed"];
  selected: RankedMemory[];
  debug: RetrievalDebugItem[];
  rejected: RetrievalDiagnosticCandidate[];
  allCandidates: RetrievalDiagnosticCandidate[];
}

interface RankedMemoryInternal extends RankedMemory {
  logicalKey: string;
  reasonTags: string[];
  contributions: ScoreContributions;
  lifecycle: LifecycleSnapshot | null;
}

type ParsedCandidateMetadata = {
  memoryType?: MemoryType;
  contractCategory?: MemoryContractCategory;
  status?: MemoryStatus;
  importanceScore: number;
  updatedAt?: string;
  evidenceCount: number;
  developerSignals?: DeveloperSignals;
};

const DEFAULT_MEMORY_TYPES: MemoryType[] = [
  "project",
  "learning",
  "preference",
  "profile",
  "episodic",
];

const INTENT_MEMORY_TYPES = {
  build_next: ["project", "learning", "profile", "preference", "episodic"],
  stack_fit: ["preference", "project", "learning", "profile", "episodic"],
  study_next: ["learning", "project", "profile", "preference", "episodic"],
  resume_project: ["project", "episodic", "profile", "learning", "preference"],
  handoff: ["project", "episodic", "profile", "learning", "preference"],
  decision_recall: ["preference", "project", "episodic", "learning", "profile"],
  bug_recall: ["episodic", "project", "preference", "learning", "profile"],
  backend_fit: ["episodic", "project", "preference", "learning", "profile"],
  general: DEFAULT_MEMORY_TYPES,
} as const satisfies Record<string, readonly MemoryType[]>;

function detectQuestionIntent(question: string): RetrievalIntent {
  const q = question.toLowerCase();

  if (
    q.includes("resume") ||
    q.includes("left off") ||
    q.includes("leave off") ||
    q.includes("pick up")
  ) {
    return "resume_project";
  }

  if (
    q.includes("handoff") ||
    q.includes("hand off") ||
    q.includes("handover") ||
    q.includes("another agent") ||
    q.includes("new agent") ||
    q.includes("teammate takeover") ||
    q.includes("take over this project")
  ) {
    return "handoff";
  }

  if (
    q.includes("why did i choose") ||
    q.includes("why did we choose") ||
    q.includes("decision") ||
    q.includes("tradeoff") ||
    q.includes("chose this")
  ) {
    return "decision_recall";
  }

  if (
    ((q.includes("solved") || q.includes("solve") || q.includes("fixed")) &&
      q.includes("before")) ||
    q.includes("similar bug") ||
    q.includes("similar issue") ||
    q.includes("like this bug")
  ) {
    return "bug_recall";
  }

  if (
    q.includes("backend work") ||
    q.includes("backend role") ||
    q.includes("kind of backend")
  ) {
    return "backend_fit";
  }

  if (q.includes("stack") || q.includes("language") || q.includes("tech")) {
    return "stack_fit";
  }

  if (
    q.includes("study") ||
    q.includes("learn this week") ||
    q.includes("learn next")
  ) {
    return "study_next";
  }

  if (
    q.includes("build next") ||
    q.includes("what should i build") ||
    (q.includes("build") && q.includes("next")) ||
    q.includes("next project")
  ) {
    return "build_next";
  }

  return "general";
}

function inferPreferredTypes(intent: RetrievalIntent): MemoryType[] {
  return [...INTENT_MEMORY_TYPES[intent]];
}

const VALID_MEMORY_TYPES: MemoryType[] = [
  "project",
  "learning",
  "preference",
  "profile",
  "episodic",
];

const VALID_MEMORY_STATUSES: MemoryStatus[] = [
  "active",
  "stale",
  "contradicted",
  "archived",
  "merged",
];
const PROJECT_MILESTONE_REGEX =
  /\b(shipped|deployed|implemented|completed|added)\b/i;
const MEMORY_STORE_SEARCH_TIMEOUT_MS = 1200;
const CONTEXT_SEARCH_TIMEOUT_MS = 1200;
const TIMELINE_LOOKUP_LIMIT = 500;
const RETRIEVAL_WARNING_DEDUPE_MS = Math.max(
  5_000,
  Number(process.env.RETRIEVAL_WARNING_DEDUPE_MS ?? 60_000),
);
const retrievalWarningLastLoggedAt = new Map<string, number>();

function warnRetrievalOnce(key: string, message: string): void {
  const now = Date.now();
  const lastLoggedAt = retrievalWarningLastLoggedAt.get(key) ?? 0;
  if (now - lastLoggedAt < RETRIEVAL_WARNING_DEDUPE_MS) {
    return;
  }
  retrievalWarningLastLoggedAt.set(key, now);
  console.warn(message);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error("timeout"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function parseNumericMetadataValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function getLogicalMemoryKey(result: MemoryStoreSearchResult): string {
  const metadata = result.metadata;
  if (metadata && typeof metadata === "object") {
    const memoryId = (metadata as Record<string, unknown>).memoryId;
    if (typeof memoryId === "string" && memoryId.length > 0) {
      return memoryId;
    }

    const memoryIdSnake = (metadata as Record<string, unknown>).memory_id;
    if (typeof memoryIdSnake === "string" && memoryIdSnake.length > 0) {
      return memoryIdSnake;
    }
  }

  return result.id;
}

function tokenize(text: string): Set<string> {
  const normalizeToken = (token: string): string => {
    let normalized = token.toLowerCase().trim();

    if (normalized.endsWith("ing") && normalized.length > 5) {
      normalized = normalized.slice(0, -3);
    } else if (normalized.endsWith("ed") && normalized.length > 4) {
      normalized = normalized.slice(0, -2);
    } else if (normalized.endsWith("s") && normalized.length > 3) {
      normalized = normalized.slice(0, -1);
    }

    if (normalized.endsWith("ic") && normalized.length > 4) {
      normalized = normalized.slice(0, -2);
    }

    return normalized;
  };

  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map((token) => normalizeToken(token))
      .filter(Boolean),
  );
}

function computeLexicalSimilarity(a: string, b: string): number {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0.5;
  }

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0.5 : intersection / union;
}

function memoryToSearchResult(
  memory: Memory,
  question: string,
): MemoryStoreSearchResult {
  return {
    id: memory.id,
    memory: memory.content,
    score: computeLexicalSimilarity(question, memory.content),
    ...(memory.sourceRef ? { sourceRef: memory.sourceRef } : {}),
    ...(memory.traceProof ? { traceProof: memory.traceProof } : {}),
    metadata: {
      memoryId: memory.id,
      type: memory.type,
      summary: memory.summary,
      importanceScore: String(memory.importanceScore),
      confidence: String(memory.confidence),
      source: memory.source,
      status: memory.status,
      createdAt: memory.createdAt,
      updatedAt: memory.updatedAt,
      evidenceCount: String(memory.evidenceCount),
      contractVersion: memory.contractVersion,
      contractCategory: memory.contractCategory,
      developerSignals: memory.developerSignals,
      operationalTags: memory.operationalTags,
      companyBrainType: memory.companyBrainType,
      sourceRef: memory.sourceRef,
      traceProof: memory.traceProof,
      freshness: memory.freshness,
      conflict: memory.conflict,
      graph: memory.graph,
      entities: memory.entities,
      relations: memory.relations,
      proofQuality: memory.proofQuality,
      files: memory.files,
    },
  };
}

function contextToSearchResult(
  result: ContextSearchResult,
): MemoryStoreSearchResult | null {
  const memory =
    result.content ??
    (typeof result.metadata?.memory === "string" ? result.metadata.memory : undefined);

  if (!memory) {
    return null;
  }

  return {
    id: result.id,
    score: result.score,
    memory,
    metadata: result.metadata,
  };
}

function candidateMatchesThreadScope(candidate: MemoryStoreSearchResult, threadId: string): boolean {
  const metadata = candidate.metadata;
  if (metadata && typeof metadata === "object") {
    const metadataThread =
      typeof metadata.threadId === "string"
        ? metadata.threadId
        : typeof metadata.thread_id === "string"
          ? metadata.thread_id
          : undefined;
    if (metadataThread === threadId) {
      return true;
    }
  }

  if (!candidate.memory) {
    return false;
  }

  return candidate.memory.includes(`threadId=${threadId}`) || candidate.memory.includes(`thread=${threadId}`);
}

function normalizeScopeToken(value: string): string {
  return value.trim().toLowerCase();
}

function collectMetadataScopeTokens(metadata: Record<string, unknown>): string[] {
  const keys = [
    "workspace",
    "project",
    "threadId",
    "thread_id",
    "repo",
    "repository",
    "selected_repository",
    "service",
    "environment",
    "env",
    "taskId",
    "task_id",
    "task",
  ] as const;

  const values: string[] = [];
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      values.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim().length > 0) {
          values.push(item);
        }
      }
    }
  }
  return values.map(normalizeScopeToken);
}

function candidateMatchesScopedField(candidate: MemoryStoreSearchResult, value?: string): boolean {
  if (!value || value.trim().length === 0) {
    return true;
  }
  const needle = normalizeScopeToken(value);
  const metadata = candidate.metadata && typeof candidate.metadata === "object"
    ? (candidate.metadata as Record<string, unknown>)
    : null;
  const metadataTokens = metadata ? collectMetadataScopeTokens(metadata) : [];
  const memoryText = typeof candidate.memory === "string" ? normalizeScopeToken(candidate.memory) : "";

  if (metadataTokens.some((token) => token.includes(needle) || needle.includes(token))) {
    return true;
  }

  if (memoryText.length > 0 && memoryText.includes(needle)) {
    return true;
  }

  return false;
}

function candidateMatchesScope(
  candidate: MemoryStoreSearchResult,
  scope: {
    workspace?: string;
    project?: string;
    threadId?: string;
    repo?: string;
    service?: string;
    environment?: string;
    taskId?: string;
  },
): boolean {
  if (!candidateMatchesScopedField(candidate, scope.workspace)) return false;
  if (!candidateMatchesScopedField(candidate, scope.project)) return false;
  if (!candidateMatchesScopedField(candidate, scope.repo)) return false;
  if (!candidateMatchesScopedField(candidate, scope.service)) return false;
  if (!candidateMatchesScopedField(candidate, scope.environment)) return false;
  if (!candidateMatchesScopedField(candidate, scope.taskId)) return false;
  if (scope.threadId && !candidateMatchesThreadScope(candidate, scope.threadId)) return false;
  return true;
}

function parseMetadata(result: MemoryStoreSearchResult): ParsedCandidateMetadata {
  const metadata = result?.metadata;

  let memoryType: MemoryType | undefined = undefined;
  let contractCategory: MemoryContractCategory | undefined = undefined;
  let status: MemoryStatus | undefined = undefined;
  let importanceScore = 0.5;
  let updatedAt: string | undefined = undefined;
  let evidenceCount = 1;
  let developerSignals: DeveloperSignals | undefined = undefined;

  if (!metadata || typeof metadata !== "object") {
    return {
      memoryType,
      contractCategory,
      status,
      importanceScore,
      updatedAt,
      evidenceCount,
      developerSignals,
    };
  }

  if (
    typeof metadata.type === "string" &&
    VALID_MEMORY_TYPES.includes(metadata.type as MemoryType)
  ) {
    memoryType = metadata.type as MemoryType;
  }

  if (
    typeof metadata.contractCategory === "string" &&
    MEMORY_CONTRACT_CATEGORIES.includes(metadata.contractCategory as MemoryContractCategory)
  ) {
    contractCategory = metadata.contractCategory as MemoryContractCategory;
  }

  if (
    typeof metadata.status === "string" &&
    VALID_MEMORY_STATUSES.includes(metadata.status as MemoryStatus)
  ) {
    status = metadata.status as MemoryStatus;
  }

  if (
    "importanceScore" in metadata
  ) {
    importanceScore = parseNumericMetadataValue(metadata.importanceScore, 0.5);
  }

  if (typeof metadata.updatedAt === "string") {
    updatedAt = metadata.updatedAt;
  }

  if ("evidenceCount" in metadata) {
    evidenceCount = Math.max(
      1,
      Math.round(parseNumericMetadataValue(metadata.evidenceCount, 1)),
    );
  }

  developerSignals = parseDeveloperSignals(metadata.developerSignals);

  return {
    memoryType,
    contractCategory,
    status,
    importanceScore,
    updatedAt,
    evidenceCount,
    developerSignals,
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseDeveloperSignals(value: unknown): DeveloperSignals | undefined {
  let raw = value;

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }

  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const record = raw as Record<string, unknown>;

  const signals: DeveloperSignals = {
    stack: toStringArray(record.stack),
    framework: toStringArray(record.framework),
    bugType: toStringArray(record.bugType),
    goal: toStringArray(record.goal),
    projectArea: toStringArray(record.projectArea),
  };

  const hasAny =
    (signals.stack?.length ?? 0) > 0 ||
    (signals.framework?.length ?? 0) > 0 ||
    (signals.bugType?.length ?? 0) > 0 ||
    (signals.goal?.length ?? 0) > 0 ||
    (signals.projectArea?.length ?? 0) > 0;

  return hasAny ? signals : undefined;
}

function normalizeSemanticScore(rawScore?: number): number {
  if (typeof rawScore !== "number" || Number.isNaN(rawScore)) {
    return 0.5;
  }

  if (rawScore < 0) return 0;
  if (rawScore > 1) return 1;

  return rawScore;
}

function getRecencyScore(updatedAt?: string): number {
  if (!updatedAt) {
    return 0.5;
  }

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return 0.5;
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) return 1.0;
  if (diffDays <= 30) return 0.8;
  if (diffDays <= 90) return 0.6;

  return 0.4;
}

function getTypeRelevanceScore(
  memoryType: MemoryType | undefined,
  preferredTypes: MemoryType[],
): number {
  if (!memoryType) {
    return 0.4;
  }

  const index = preferredTypes.indexOf(memoryType);

  if (index === -1) return 0.4;
  if (index === 0) return 1.0;
  if (index === 1) return 0.8;
  if (index === 2) return 0.6;

  return 0.4;
}

function getIntentTypeBoost(
  intent: RetrievalIntent,
  memoryType: MemoryType | undefined,
): number {
  if (!memoryType) {
    return 0;
  }

  return MEMORY_RULES.retrieval.intentTypeBoosts[intent][memoryType] ?? 0;
}

function resolveEffectiveMemoryType(input: {
  baseType: MemoryType | undefined;
  memoryText: string | undefined;
  intent: RetrievalIntent;
}): MemoryType | undefined {
  if (input.baseType !== "project") {
    return input.baseType;
  }

  if (!input.memoryText || !PROJECT_MILESTONE_REGEX.test(input.memoryText)) {
    return input.baseType;
  }

  if (input.intent === "resume_project") {
    return "episodic";
  }

  return input.baseType;
}

function getContinuityBoost(input: {
  intent: RetrievalIntent;
  question: string;
  memoryType: MemoryType | undefined;
  evidenceCount: number;
  recencyScore: number;
  developerSignals?: DeveloperSignals;
}): number {
  const intentTypeBoost = getIntentTypeBoost(input.intent, input.memoryType);
  const evidenceBoost = Math.min(
    MEMORY_RULES.retrieval.evidenceBoostMax,
    Math.max(0, input.evidenceCount - 1) *
      MEMORY_RULES.retrieval.evidenceBoostPerHit,
  );
  const freshnessBoost =
    input.recencyScore >= MEMORY_RULES.retrieval.freshnessBoostThreshold
      ? MEMORY_RULES.retrieval.freshnessBoostValue
      : 0;
  const resumeBoost =
    input.intent === "resume_project" && input.memoryType === "project"
      ? MEMORY_RULES.retrieval.resumeProjectBoost
      : 0;
  const developerSignalBoost = getDeveloperSignalBoost({
    intent: input.intent,
    question: input.question,
    developerSignals: input.developerSignals,
  });

  return (
    intentTypeBoost +
    evidenceBoost +
    freshnessBoost +
    resumeBoost +
    developerSignalBoost
  );
}

function getDeveloperSignalBoost(input: {
  intent: RetrievalIntent;
  question: string;
  developerSignals?: DeveloperSignals;
}): number {
  const signals = input.developerSignals;
  if (!signals) {
    return 0;
  }

  let boost = 0;

  if (
    input.intent === "stack_fit" &&
    ((signals.stack?.length ?? 0) > 0 || (signals.framework?.length ?? 0) > 0)
  ) {
    boost += 0.08;
  }

  if (
    input.intent === "build_next" &&
    ((signals.projectArea?.length ?? 0) > 0 || (signals.goal?.length ?? 0) > 0)
  ) {
    boost += 0.06;
  }

  if (
    input.intent === "handoff" &&
    ((signals.projectArea?.length ?? 0) > 0 || (signals.goal?.length ?? 0) > 0)
  ) {
    boost += 0.06;
  }

  if (
    input.intent === "decision_recall" &&
    ((signals.stack?.length ?? 0) > 0 ||
      (signals.framework?.length ?? 0) > 0 ||
      (signals.goal?.length ?? 0) > 0)
  ) {
    boost += 0.07;
  }

  if (
    (input.intent === "bug_recall" || input.intent === "backend_fit") &&
    (signals.bugType?.length ?? 0) > 0
  ) {
    boost += 0.1;
  }

  const questionTokens = tokenize(input.question);
  const signalTokens = new Set<string>();

  for (const value of [
    ...(signals.stack ?? []),
    ...(signals.framework ?? []),
    ...(signals.bugType ?? []),
    ...(signals.goal ?? []),
    ...(signals.projectArea ?? []),
  ]) {
    for (const token of tokenize(value)) {
      signalTokens.add(token);
    }
  }

  let overlap = 0;
  for (const token of questionTokens) {
    if (signalTokens.has(token)) {
      overlap += 1;
    }
  }

  boost += Math.min(0.08, overlap * 0.02);

  return boost;
}

function computeScoreContributions(input: {
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
  continuityBoost: number;
  weights: {
    semantic: number;
    typeRelevance: number;
    importance: number;
    recency: number;
  };
}): ScoreContributions {
  const semantic = input.semanticScore * input.weights.semantic;
  const typeRelevance = input.typeRelevanceScore * input.weights.typeRelevance;
  const importance = input.importanceScore * input.weights.importance;
  const recency = input.recencyScore * input.weights.recency;
  const continuity = input.continuityBoost;
  const total =
    semantic + typeRelevance + importance + recency + continuity;

  return {
    semantic,
    typeRelevance,
    importance,
    recency,
    continuity,
    total,
  };
}

function buildReasonTags(input: {
  memoryType: MemoryType | undefined;
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
  continuityBoost: number;
  contributions: ScoreContributions;
}): string[] {
  const reasons: string[] = [];

  if (input.memoryType) {
    reasons.push(`type:${input.memoryType}`);
  } else {
    reasons.push("type:unknown");
  }

  if (input.semanticScore >= 0.75) {
    reasons.push("semantic:strong-match");
  } else if (input.semanticScore >= 0.55) {
    reasons.push("semantic:medium-match");
  }

  if (input.typeRelevanceScore >= 0.8) {
    reasons.push("intent:high-type-fit");
  } else if (input.typeRelevanceScore >= 0.6) {
    reasons.push("intent:medium-type-fit");
  }

  if (input.importanceScore >= 0.8) {
    reasons.push("importance:high");
  } else if (input.importanceScore >= 0.65) {
    reasons.push("importance:solid");
  }

  if (input.recencyScore >= 0.8) {
    reasons.push("recency:fresh");
  }

  if (input.continuityBoost >= 0.08) {
    reasons.push("continuity:strong");
  } else if (input.continuityBoost > 0) {
    reasons.push("continuity:present");
  }

  const weighted = [
    { key: "contrib:semantic", value: input.contributions.semantic },
    { key: "contrib:type-fit", value: input.contributions.typeRelevance },
    { key: "contrib:importance", value: input.contributions.importance },
    { key: "contrib:recency", value: input.contributions.recency },
    { key: "contrib:continuity", value: input.contributions.continuity },
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((item) => item.key);

  reasons.push(...weighted);

  return reasons;
}

async function fetchCandidatePool(
  input: RetrieveRelevantMemoryInput,
): Promise<MemoryStoreSearchResult[]> {
  const candidateTopK = Math.max(input.topK ?? 10, 10);
  const memoryStoreSearchPromise = withTimeout(
    getMemoryStoreAdapter().searchMemory({
      userId: input.userId,
      query: input.question,
      topK: candidateTopK,
    }),
    MEMORY_STORE_SEARCH_TIMEOUT_MS,
  ).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown memory store error";
    warnRetrievalOnce(
      `memory-store:${input.userId}:${message}`,
      `[memory.retrieval] Memory store search failed for user=${input.userId}; continuing with fallback candidates. ${message}`,
    );
    return [] as MemoryStoreSearchResult[];
  });
  const contextSearchPromise = withTimeout(
    getContextAdapter().searchContext({
      userId: input.userId,
      query: input.question,
      topK: candidateTopK,
      ...(input.workspace ? { workspace: input.workspace } : {}),
      ...(input.project ? { project: input.project } : {}),
      ...(input.threadId ? { threadId: input.threadId } : {}),
      ...(input.repo ? { repo: input.repo } : {}),
      ...(input.service ? { service: input.service } : {}),
      ...(input.environment ? { environment: input.environment } : {}),
      ...(input.taskId ? { taskId: input.taskId } : {}),
    }),
    CONTEXT_SEARCH_TIMEOUT_MS,
  )
    .catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unknown context adapter error";
      warnRetrievalOnce(
        `context:${input.userId}:${message}`,
        `[memory.retrieval] Context search failed for user=${input.userId}; continuing without context adapter results. ${message}`,
      );
      return [] as ContextSearchResult[];
    });
  const [memoryStoreCandidates, contextCandidatesRaw] = await Promise.all([
    memoryStoreSearchPromise,
    contextSearchPromise,
  ]);

  const contextCandidates = contextCandidatesRaw
    .map((item) => contextToSearchResult(item))
    .filter((item): item is MemoryStoreSearchResult => item !== null);
  const recentMemories = await getRecentMemories(input.userId);
  const recentCandidates = recentMemories.map((memory) =>
    memoryToSearchResult(memory, input.question),
  );

  const mergedCandidates = Array.from(
    new Map(
      [...recentCandidates, ...contextCandidates, ...memoryStoreCandidates].map((item) => [
        getLogicalMemoryKey(item),
        item,
      ]),
    ).values(),
  );

  if (input.strictThreadId) {
    if (!input.threadId) {
      return [];
    }
    return mergedCandidates.filter((candidate) => candidateMatchesThreadScope(candidate, input.threadId as string));
  }

  const hasScopedContext = Boolean(
    input.workspace ||
      input.project ||
      input.threadId ||
      input.repo ||
      input.service ||
      input.environment ||
      input.taskId,
  );

  if (hasScopedContext) {
    const scopedCandidates = mergedCandidates.filter((candidate) =>
      candidateMatchesScope(candidate, {
        workspace: input.workspace,
        project: input.project,
        threadId: input.threadId,
        repo: input.repo,
        service: input.service,
        environment: input.environment,
        taskId: input.taskId,
      }),
    );
    // If scoped metadata is missing on stored memories, prefer recall over hard-empty results.
    return scopedCandidates.length > 0 ? scopedCandidates : mergedCandidates;
  }

  return mergedCandidates;
}

function toDebugItem(
  input: RankedMemoryInternal,
  intent: RetrievalIntent,
  weightsUsed: RetrievalDebugItem["weightsUsed"],
): RetrievalDebugItem {
  return {
    id: input.id,
    semanticScore: input.semanticScore,
    typeRelevanceScore: input.typeRelevanceScore,
    importanceScore: input.importanceScore,
    recencyScore: input.recencyScore,
    continuityBoost: input.continuityBoost,
    intent,
    weightsUsed,
    reasonTags: input.reasonTags,
    contributions: input.contributions,
    finalScore: input.finalScore,
    lifecycle: {
      latestEventType: input.lifecycle?.eventType ?? null,
      latestReason: input.lifecycle?.reason ?? null,
      latestChangedAt: input.lifecycle?.changedAt ?? null,
    },
  };
}

function toRankedMemory(input: RankedMemoryInternal): RankedMemory {
  const { logicalKey, reasonTags, contributions, lifecycle, ...memory } = input;
  void logicalKey;
  void reasonTags;
  void contributions;
  void lifecycle;
  return memory;
}

function toDiagnosticCandidate(
  input: RankedMemoryInternal,
  intent: RetrievalIntent,
  weightsUsed: RetrievalDebugItem["weightsUsed"],
  filteredOut: boolean,
  filterReason?: string,
): RetrievalDiagnosticCandidate {
  return {
    memory: input.memory,
    memoryType: input.memoryType,
    updatedAt: input.updatedAt,
    filteredOut,
    ...(filterReason ? { filterReason } : {}),
    ...toDebugItem(input, intent, weightsUsed),
  };
}

function buildRankedCandidate(input: {
  item: MemoryStoreSearchResult;
  question: string;
  intent: RetrievalIntent;
  preferredTypes: MemoryType[];
  weightsUsed: RetrievalDebugItem["weightsUsed"];
  lifecycle: LifecycleSnapshot | null;
}): {
  rankedItem: RankedMemoryInternal;
  meta: ParsedCandidateMetadata;
} {
  const meta = parseMetadata(input.item);
  const effectiveMemoryType = resolveEffectiveMemoryType({
    baseType: meta.memoryType,
    memoryText: input.item.memory,
    intent: input.intent,
  });

  const semanticScore = normalizeSemanticScore(input.item.score);
  const typeRelevanceScore = getTypeRelevanceScore(
    effectiveMemoryType,
    input.preferredTypes,
  );
  const recencyScore = getRecencyScore(meta.updatedAt);
  const continuityBoost = getContinuityBoost({
    intent: input.intent,
    question: input.question,
    memoryType: effectiveMemoryType,
    evidenceCount: meta.evidenceCount,
    recencyScore,
    developerSignals: meta.developerSignals,
  }) + (meta.status === "stale" ? -0.06 : 0);
  const contributions = computeScoreContributions({
    semanticScore,
    typeRelevanceScore,
    importanceScore: meta.importanceScore,
    recencyScore,
    continuityBoost,
    weights: input.weightsUsed,
  });
  const finalScore = contributions.total;
  const reasonTags = buildReasonTags({
    memoryType: effectiveMemoryType,
    semanticScore,
    typeRelevanceScore,
    importanceScore: meta.importanceScore,
    recencyScore,
    continuityBoost,
    contributions,
  });

  return {
    meta,
    rankedItem: {
      ...input.item,
      logicalKey: getLogicalMemoryKey(input.item),
      memoryType: effectiveMemoryType,
      contractCategory: meta.contractCategory,
      importanceScore: meta.importanceScore,
      recencyScore,
      typeRelevanceScore,
      semanticScore,
      continuityBoost,
      finalScore,
      updatedAt: meta.updatedAt,
      reasonTags,
      contributions,
      lifecycle: input.lifecycle,
    },
  };
}

export async function analyzeRetrieval(
  input: RetrieveRelevantMemoryInput,
): Promise<RetrievalAnalysisResult> {
  const candidates = await fetchCandidatePool(input);
  const lifecycleEvents = await listTimelineEvents(input.userId, TIMELINE_LOOKUP_LIMIT);
  const timelineByMemoryId = new Map<string, typeof lifecycleEvents>();

  for (const event of lifecycleEvents) {
    const current = timelineByMemoryId.get(event.memoryId);
    if (current) {
      current.push(event);
    } else {
      timelineByMemoryId.set(event.memoryId, [event]);
    }
  }

  const lifecycleByMemoryId = new Map<string, LifecycleSnapshot>();

  for (const [memoryId, events] of timelineByMemoryId.entries()) {
    const latest = getLatestLifecycleSnapshot(events);
    if (latest) {
      lifecycleByMemoryId.set(memoryId, latest);
    }
  }

  const intent = detectQuestionIntent(input.question);
  const preferredTypes = inferPreferredTypes(intent);
  const weightsUsed = getRetrievalWeights();
  const includeArchived = input.includeArchived === true;
  const filteredByStatus: RetrievalDiagnosticCandidate[] = [];

  const ranked: RankedMemoryInternal[] = candidates.flatMap((item) => {
    const { meta, rankedItem } = buildRankedCandidate({
      item,
      question: input.question,
      intent,
      preferredTypes,
      weightsUsed,
      lifecycle: lifecycleByMemoryId.get(getLogicalMemoryKey(item)) ?? null,
    });

    if (
      !includeArchived &&
      (meta.status === "archived" ||
        meta.status === "contradicted" ||
        meta.status === "merged")
    ) {
      filteredByStatus.push({
        status: meta.status,
        memory: rankedItem.memory,
        memoryType: rankedItem.memoryType,
        updatedAt: rankedItem.updatedAt,
        filteredOut: true,
        filterReason: `status_${meta.status}`,
        ...toDebugItem(rankedItem, intent, weightsUsed),
      });
      return [];
    }

    return [rankedItem];
  });

  ranked.sort((a, b) => {
    // Typed memories carry contract semantics; keep untyped context records from
    // displacing them when the final result set is bounded by topK.
    if (Boolean(a.memoryType) !== Boolean(b.memoryType)) {
      return a.memoryType ? -1 : 1;
    }

    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }

    return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
  });

  const uniqueRanked = Array.from(
    new Map(
      ranked.map((item) => [item.logicalKey, item]),
    ).values(),
  );

  const finalTopK = input.topK ?? 5;
  const top = uniqueRanked.slice(0, finalTopK);
  const selected = top.map((item) => toRankedMemory(item));
  const debug = top.map((item) => toDebugItem(item, intent, weightsUsed));
  const belowTopK = uniqueRanked
    .slice(finalTopK)
    .map((item) =>
      toDiagnosticCandidate(
        item,
        intent,
        weightsUsed,
        true,
        "below_topk_cutoff",
      ),
    );
  const selectedDiagnostics = top.map((item) =>
    toDiagnosticCandidate(item, intent, weightsUsed, false),
  );

  return {
    intent,
    weightsUsed,
    selected,
    debug,
    rejected: [...filteredByStatus, ...belowTopK],
    allCandidates: [...selectedDiagnostics, ...filteredByStatus, ...belowTopK],
  };
}

export async function retrieveRelevantMemory(
  input: RetrieveRelevantMemoryInput,
): Promise<RetrieveRelevantMemoryResult> {
  const analysis = await analyzeRetrieval(input);
  return {
    memories: analysis.selected,
    debug: analysis.debug,
  };
}
