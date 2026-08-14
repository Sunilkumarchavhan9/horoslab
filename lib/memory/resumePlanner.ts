import { retrieveRelevantMemory, type RankedMemory, type RetrievalDebugItem } from "./retrieveRelevantMemory";
import type { ContinuityScope } from "../adapters/adapters";
import {
  countRecentCompletedLoops,
  loadOperationalLoopHistoryForProject,
  loadProjectDriftBriefLines,
} from "../companyBrain/operationalLoopService";
import { listActionMemories } from "./actionMemoryStore";
import { getRecentMemories } from "./recentMemoryStore";
import type { Memory, MemoryContractCategory, MemoryType } from "./types";
import { computeResumeConfidence, type ResumeConfidenceScore } from "./resumeConfidence";

export const BRIEF_INSUFFICIENT_DATA =
  "Insufficient operational data in retrieved memories for this section.";

export type WhySelectedMemory = {
  memoryId: string;
  summary: string;
  contractCategory?: MemoryContractCategory;
  finalScore: number;
  reasonTags?: string[];
};

export type ContinueProjectBrief = {
  whatChangedRecently: string[];
  currentGoal: string;
  keyDecisions: string[];
  openBlockers: string[];
  riskyFiles: string[];
  nextBestAction: string;
  mustKnowContextForAgent: string[];
  projectGoal: string;
  currentState: string[];
  recentChanges: string[];
  blockedAreas: string[];
  openDecisions: string[];
  nextRecommendedActions: string[];
  relevantPRs: string[];
  relevantIssues: string[];
  agentSuggestions: string[];
  executionHistory: string[];
  driftAndCorrectiveActions: string[];
  whyTheseMemoriesWereSelected: WhySelectedMemory[];
  resumeConfidence: ResumeConfidenceScore;
};

export interface ResumePlannerInput {
  userId: string;
  project: string;
  question: string;
  orgId?: string;
  topK?: number;
  includeArchived?: boolean;
  previousCheckpoint?: Record<string, unknown> | null;
}

export interface ResumePlannerScopedInput
  extends ResumePlannerInput,
    Omit<ContinuityScope, "project"> {}

export interface ResumeUsedMemory {
  id: string;
  content: string;
  memoryType?: MemoryType;
  contractCategory?: MemoryContractCategory;
  summary?: string;
  source?: string;
  finalScore: number;
  importanceScore: number;
  recencyScore?: number;
  semanticScore?: number;
  continuityBoost?: number;
  reasonTags?: string[];
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ResumePlannerResult {
  summary: string;
  lastKnownState: string;
  openLoops: string[];
  recommendedNextStep: string;
  brief: ContinueProjectBrief;
  usedMemories: ResumeUsedMemory[];
  debug: {
    project: string;
    retrieval: RetrievalDebugItem[];
  };
}

type PreviousResumeContext = {
  previousSummary?: string;
  previousLastKnownState?: string;
};

const MAX_MEMORY_OUTPUT_CHARS = 900;
const MAX_STATE_OUTPUT_CHARS = 1_400;
const OPERATIONAL_SECTION_COUNT = 12;

const PR_URL_REGEX = /github\.com\/[^\s/]+\/[^\s/]+\/pull\/(\d+)/gi;
const ISSUE_URL_REGEX = /github\.com\/[^\s/]+\/[^\s/]+\/issues\/(\d+)/gi;
const PR_REF_REGEX = /\b(?:PR|pull request)\s*#?(\d+)\b/gi;
const ISSUE_REF_REGEX = /\b(?:issue|ticket)\s*#(\d+)\b/gi;

function truncateText(value: string | undefined, limit: number): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.length > limit ? `${normalized.slice(0, limit - 3)}...` : normalized;
}

function getMetadataSummary(memory: RankedMemory): string | undefined {
  const metadata = memory.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const raw = (metadata as Record<string, unknown>).summary;
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function getDebugForMemory(
  memoryId: string,
  retrievalDebug: RetrievalDebugItem[],
): RetrievalDebugItem | undefined {
  return retrievalDebug.find((item) => item.id === memoryId);
}

function toUsedMemory(memory: RankedMemory, retrievalDebug: RetrievalDebugItem[]): ResumeUsedMemory {
  const fallbackSummary = getMetadataSummary(memory);
  const debug = getDebugForMemory(memory.id, retrievalDebug);

  return {
    id: memory.id,
    content: truncateText(memory.memory ?? fallbackSummary, MAX_MEMORY_OUTPUT_CHARS) ?? "No memory content",
    memoryType: memory.memoryType,
    contractCategory: memory.contractCategory,
    summary: truncateText(fallbackSummary, 360),
    source:
      memory.metadata && typeof memory.metadata.source === "string"
        ? memory.metadata.source
        : undefined,
    finalScore: memory.finalScore,
    importanceScore: memory.importanceScore,
    recencyScore: memory.recencyScore,
    semanticScore: memory.semanticScore,
    continuityBoost: memory.continuityBoost,
    reasonTags: debug?.reasonTags,
    updatedAt: memory.updatedAt,
    metadata: memory.metadata,
  };
}

function toUsedMemoryFromRecent(memory: Memory): ResumeUsedMemory {
  return {
    id: memory.id,
    content: truncateText(memory.content, MAX_MEMORY_OUTPUT_CHARS) ?? "No memory content",
    memoryType: memory.type,
    contractCategory: memory.contractCategory,
    summary: truncateText(memory.summary, 360),
    finalScore: memory.importanceScore,
    importanceScore: memory.importanceScore,
    updatedAt: memory.updatedAt,
  };
}

function toUsedMemoryFromActionMemory(input: {
  id: string;
  action: string;
  reason: string;
  updatedAt: string;
  sourceId?: string | null;
  provenanceTags?: string[];
}): ResumeUsedMemory {
  const summary = truncateText(`${input.action}: ${input.reason}`, 360) ?? input.action;
  const source = `mythic_execution:${input.sourceId ?? input.id}`;
  return {
    id: input.id,
    content: truncateText(summary, MAX_MEMORY_OUTPUT_CHARS) ?? summary,
    memoryType: "episodic",
    contractCategory: "previous_attempt",
    summary,
    source,
    finalScore: 0.9,
    importanceScore: 0.85,
    reasonTags: Array.from(
      new Set([
        "mythic_execution",
        ...(input.provenanceTags?.filter((tag) => tag.startsWith("mythic_")) ?? []),
      ]),
    ),
    updatedAt: input.updatedAt,
    metadata: {
      source,
      summary,
    },
  };
}

async function buildProjectRecentOpenLoops(
  userId: string,
  project: string,
): Promise<ResumeUsedMemory[]> {
  const projectName = project.toLowerCase();
  const recent = await getRecentMemories(userId);

  return recent
    .filter((memory) => {
      const haystack = `${memory.content} ${memory.summary}`.toLowerCase();
      // Extracted workstream memories may omit the project name even though
      // they belong to the same user's active project context.
      return (
        haystack.includes(projectName) ||
        memory.type === "project" ||
        memory.type === "episodic"
      );
    })
    .filter((memory) => {
      const haystack = `${memory.content} ${memory.summary}`.toLowerCase();
      return (
        /\b(need to finish|need to complete|still need to|debugging|fixing|working on)\b/i.test(
          haystack,
        ) || memory.type === "episodic"
      );
    })
    .map(toUsedMemoryFromRecent);
}

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  return trimmed.length > 260 ? `${trimmed.slice(0, 257)}...` : trimmed;
}

function memoryText(memory: ResumeUsedMemory): string {
  return cleanText(memory.content ?? memory.summary) ?? "No memory content";
}

function uniqueNonEmpty(values: Array<string | undefined>, limit: number): string[] {
  return Array.from(
    new Set(values.map(cleanText).filter((value): value is string => Boolean(value))),
  ).slice(0, limit);
}

function textMatches(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function getMemoriesByCategory(
  memories: ResumeUsedMemory[],
  categories: MemoryContractCategory[],
): ResumeUsedMemory[] {
  const wanted = new Set<MemoryContractCategory>(categories);
  return memories.filter((memory) => memory.contractCategory && wanted.has(memory.contractCategory));
}

function buildRiskyFiles(memories: ResumeUsedMemory[]): string[] {
  const fromCategory = getMemoriesByCategory(memories, ["risky_file"]).map(memoryText);
  const fromPaths = Array.from(
    new Set(
      memories.flatMap((memory) => {
        const text = `${memory.summary ?? ""} ${memory.content ?? ""}`;
        return text.match(/[A-Za-z0-9_/.-]+\.(ts|tsx|js|jsx|py|go|rs|java|rb|json|yaml|yml|md|mdx)/g) ?? [];
      }),
    ),
  );
  return uniqueNonEmpty([...fromCategory, ...fromPaths], 5);
}

function collectRegexMatches(text: string, pattern: RegExp, formatter: (match: string) => string): string[] {
  const matches: string[] = [];
  for (const match of text.matchAll(pattern)) {
    const formatted = formatter(match[0]);
    if (formatted) matches.push(formatted);
  }
  return matches;
}

function extractRelevantPRs(memories: ResumeUsedMemory[]): string[] {
  const refs = memories.flatMap((memory) => {
    const text = `${memory.summary ?? ""} ${memory.content ?? ""}`;
    const urlRefs = collectRegexMatches(text, PR_URL_REGEX, (value) => value.trim());
    const hashRefs = collectRegexMatches(text, PR_REF_REGEX, (value) => value.trim());
    return [...urlRefs, ...hashRefs];
  });
  return uniqueNonEmpty(refs, 6);
}

function extractRelevantIssues(memories: ResumeUsedMemory[]): string[] {
  const refs = memories.flatMap((memory) => {
    const text = `${memory.summary ?? ""} ${memory.content ?? ""}`;
    const urlRefs = collectRegexMatches(text, ISSUE_URL_REGEX, (value) => value.trim());
    const hashRefs = collectRegexMatches(text, ISSUE_REF_REGEX, (value) => value.trim());
    const metadataIssue =
      memory.metadata && typeof memory.metadata.issueNumber === "number"
        ? `Issue #${memory.metadata.issueNumber}`
        : memory.metadata && typeof memory.metadata.issue_number === "number"
          ? `Issue #${memory.metadata.issue_number}`
          : undefined;
    return [...urlRefs, ...hashRefs, metadataIssue];
  });
  return uniqueNonEmpty(refs, 6);
}

function buildWhyTheseMemoriesWereSelected(
  memories: ResumeUsedMemory[],
  retrievalDebug: RetrievalDebugItem[],
): WhySelectedMemory[] {
  return memories.slice(0, 8).map((memory) => {
    const debug = getDebugForMemory(memory.id, retrievalDebug);
    const reasonTags = memory.reasonTags ?? debug?.reasonTags ?? [];
    const categoryLabel = memory.contractCategory ? `category=${memory.contractCategory}` : "category=unknown";
    const tagLabel = reasonTags.length > 0 ? `tags=${reasonTags.slice(0, 3).join(",")}` : "tags=none";
    const scoreLabel = `finalScore=${memory.finalScore.toFixed(3)}`;
    const sourceLabel =
      typeof memory.source === "string" && memory.source.length > 0
        ? `source=${memory.source}`
        : "source=memory";

    return {
      memoryId: memory.id,
      summary: truncateText(memory.summary ?? memory.content, 320) ?? memory.id,
      ...(memory.contractCategory ? { contractCategory: memory.contractCategory } : {}),
      finalScore: memory.finalScore,
      reasonTags:
        reasonTags.length > 0
          ? Array.from(new Set([...reasonTags, sourceLabel]))
          : [categoryLabel, tagLabel, scoreLabel, sourceLabel],
    };
  });
}

function withInsufficientFallback(items: string[]): string[] {
  return items.length > 0 ? items : [BRIEF_INSUFFICIENT_DATA];
}

function countPopulatedSections(sections: Array<string | string[]>): number {
  return sections.filter((section) => {
    if (typeof section === "string") {
      return section.trim().length > 0 && section !== BRIEF_INSUFFICIENT_DATA;
    }
    return section.length > 0 && section[0] !== BRIEF_INSUFFICIENT_DATA;
  }).length;
}

function formatActionMemoryLine(action: {
  action: string;
  reason: string;
  outcome: string;
  createdAt: string;
}): string {
  const when = action.createdAt ? action.createdAt.slice(0, 10) : "unknown date";
  return `${action.action} (${action.outcome}, ${when}): ${action.reason}`;
}

async function loadExecutionHistoryFromActionMemory(
  userId: string,
  project: string,
  orgId?: string,
): Promise<string[]> {
  const actions = await listActionMemories(userId, {
    ...(orgId ? { orgId } : {}),
    limit: 40,
  });
  const projectKey = project.trim().toLowerCase();
  const filtered = actions.filter((entry) => {
    if (entry.sourceType !== "github_execution" && entry.sourceType !== "continuity") {
      return false;
    }
    if (entry.projectId && entry.projectId.trim().toLowerCase() === projectKey) {
      return true;
    }
    const blob = `${entry.action} ${entry.reason}`.toLowerCase();
    return projectKey.length > 0 && blob.includes(projectKey);
  });
  return uniqueNonEmpty(
    filtered.slice(0, 8).map((entry) =>
      formatActionMemoryLine({
        action: entry.action,
        reason: entry.reason,
        outcome: entry.outcome,
        createdAt: entry.createdAt,
      }),
    ),
    6,
  );
}

async function loadMythicResumeMemories(input: {
  userId: string;
  orgId?: string;
  project: string;
  repo?: string;
}): Promise<ResumeUsedMemory[]> {
  const actions = await listActionMemories(input.userId, {
    ...(input.orgId ? { orgId: input.orgId } : {}),
    limit: 40,
  });
  const projectKey = input.project.trim().toLowerCase();
  const repoKey = input.repo?.trim().toLowerCase() ?? "";

  return actions
    .filter((entry) => entry.outcome === "success")
    .filter((entry) => entry.sourceType === "github_execution" || entry.sourceType === "continuity")
    .filter((entry) => {
      const tags = Array.isArray(entry.metadata?.provenanceTags)
        ? entry.metadata.provenanceTags.filter((value): value is string => typeof value === "string")
        : [];
      if (!tags.some((tag) => tag.startsWith("mythic_"))) {
        return false;
      }

      const haystack = [
        entry.projectId,
        entry.workspace,
        entry.action,
        entry.reason,
        typeof entry.metadata?.repo === "string" ? entry.metadata.repo : undefined,
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();

      return (
        (projectKey.length > 0 && haystack.includes(projectKey)) ||
        (repoKey.length > 0 && haystack.includes(repoKey))
      );
    })
    .slice(0, 4)
    .map((entry) =>
      toUsedMemoryFromActionMemory({
        id: entry.id,
        action: entry.action,
        reason: entry.reason,
        updatedAt: entry.updatedAt,
        sourceId: entry.sourceId,
        provenanceTags: Array.isArray(entry.metadata?.provenanceTags)
          ? entry.metadata.provenanceTags.filter((value): value is string => typeof value === "string")
          : [],
      }),
    );
}

function buildContinueProjectBrief(input: {
  project: string;
  summary: string;
  lastKnownState: string;
  openLoops: string[];
  recommendedNextStep: string;
  usedMemories: ResumeUsedMemory[];
  retrievalDebug: RetrievalDebugItem[];
  actionMemoryExecutionHistory?: string[];
  operationalLoopHistory?: string[];
  recentLoopCompletions?: number;
  driftAndCorrectiveActions?: string[];
  unresolvedHighDrift?: boolean;
}): ContinueProjectBrief {
  const memories = input.usedMemories;
  const byText = (pattern: RegExp) =>
    memories.filter((memory) => textMatches(`${memory.summary ?? ""} ${memory.content ?? ""}`, pattern));

  const decisionMemories = [
    ...getMemoriesByCategory(memories, ["decision", "architecture_note", "policy"]),
    ...byText(/\b(decision|decided|we chose|chosen|approved|architecture|policy)\b/i),
  ];
  const blockerMemories = [
    ...getMemoriesByCategory(memories, ["blocker", "bug", "incident"]),
    ...byText(/\b(blocked|blocker|bug|incident|risk|issue|debug|fix|failed)\b/i),
  ];
  const nextActionMemories = [
    ...getMemoriesByCategory(memories, ["next_action"]),
    ...byText(/\b(next action|next step|todo|need to|ship|finish|validate)\b/i),
  ];
  const executionMemories = [
    ...getMemoriesByCategory(memories, ["previous_attempt", "runbook", "incident"]),
    ...byText(/\b(executed|attempted|deployed|validated|ran|tested|shipped)\b/i),
  ];
  const agentMemories = [
    ...getMemoriesByCategory(memories, ["model_tool_update"]),
    ...byText(/\b(agent|cursor|codex|claude|openhands|automation)\b/i),
  ];

  const recentChanges = uniqueNonEmpty(memories.slice(0, 4).map(memoryText), 4);
  const openDecisions = uniqueNonEmpty(decisionMemories.map(memoryText), 5);
  const blockedAreas = uniqueNonEmpty([
    ...blockerMemories.map(memoryText),
    ...input.openLoops.filter((loop) => /\b(block|risk|issue|debug|fix|failed)\b/i.test(loop)),
  ], 5);
  const nextRecommendedActions = uniqueNonEmpty([
    ...nextActionMemories.map(memoryText),
    input.recommendedNextStep,
  ], 3);
  const currentState = uniqueNonEmpty([input.lastKnownState, ...memories.slice(0, 3).map(memoryText)], 4);
  const projectGoal =
    cleanText(input.summary) ?? `Continue ${input.project} using the latest retrieved operational memory.`;
  const riskyFiles = buildRiskyFiles(memories);
  const relevantPRs = extractRelevantPRs(memories);
  const relevantIssues = extractRelevantIssues(memories);
  const agentSuggestions = uniqueNonEmpty(agentMemories.map(memoryText), 4);
  const executionHistory = uniqueNonEmpty(
    [
      ...(input.operationalLoopHistory ?? []),
      ...(input.actionMemoryExecutionHistory ?? []),
      ...executionMemories.map(memoryText),
    ],
    6,
  );
  const whyTheseMemoriesWereSelected = buildWhyTheseMemoriesWereSelected(memories, input.retrievalDebug);
  const mustKnowContextForAgent = uniqueNonEmpty([
    ...memories.slice(0, 6).map(memoryText),
    input.lastKnownState,
  ], 6);

  const driftAndCorrectiveActions = withInsufficientFallback(
    input.driftAndCorrectiveActions ?? [],
  );

  const populatedSectionCount = countPopulatedSections([
    projectGoal,
    currentState,
    recentChanges,
    blockedAreas,
    riskyFiles,
    openDecisions,
    nextRecommendedActions,
    relevantPRs,
    relevantIssues,
    agentSuggestions,
    executionHistory,
    driftAndCorrectiveActions,
  ]);

  const resumeConfidence = computeResumeConfidence({
    usedMemories: memories,
    retrievalDebug: input.retrievalDebug,
    populatedSectionCount,
    totalSectionCount: OPERATIONAL_SECTION_COUNT,
    githubSignalCount: relevantPRs.length + relevantIssues.length,
    executionTraceCount: executionHistory.length,
    recentLoopCompletions: input.recentLoopCompletions ?? 0,
    unresolvedHighDrift: input.unresolvedHighDrift === true,
  });

  const whatChangedRecently =
    recentChanges.length > 0 ? recentChanges : [input.lastKnownState || BRIEF_INSUFFICIENT_DATA];
  const normalizedRecentChanges = withInsufficientFallback(
    recentChanges.length > 0 ? recentChanges : whatChangedRecently,
  );
  const normalizedBlockedAreas = withInsufficientFallback(blockedAreas);
  const normalizedOpenDecisions = withInsufficientFallback(openDecisions);
  const normalizedNextActions = withInsufficientFallback(nextRecommendedActions);

  return {
    whatChangedRecently: normalizedRecentChanges,
    currentGoal: projectGoal,
    keyDecisions: normalizedOpenDecisions,
    openBlockers: normalizedBlockedAreas,
    riskyFiles: withInsufficientFallback(riskyFiles),
    nextBestAction: nextRecommendedActions[0] ?? input.recommendedNextStep,
    mustKnowContextForAgent: withInsufficientFallback(mustKnowContextForAgent),
    projectGoal,
    currentState: withInsufficientFallback(currentState),
    recentChanges: normalizedRecentChanges,
    blockedAreas: normalizedBlockedAreas,
    openDecisions: normalizedOpenDecisions,
    nextRecommendedActions: normalizedNextActions,
    relevantPRs: withInsufficientFallback(relevantPRs),
    relevantIssues: withInsufficientFallback(relevantIssues),
    agentSuggestions: withInsufficientFallback(agentSuggestions),
    executionHistory: withInsufficientFallback(executionHistory),
    driftAndCorrectiveActions,
    whyTheseMemoriesWereSelected,
    resumeConfidence,
  };
}

function buildFallbackResult(
  input: ResumePlannerInput,
  previousContext?: PreviousResumeContext,
): ResumePlannerResult {
  const summary =
    previousContext?.previousSummary ??
    `No strong saved context found for ${input.project} yet.`;
  const lastKnownState =
    previousContext?.previousLastKnownState ??
    "No prior project progress memory was retrieved.";
  const openLoops = [
    `Capture your latest ${input.project} progress as a memory update.`,
    "Add one concrete milestone and one blocker.",
  ];
  const recommendedNextStep = `Post a fresh update like: "I am building ${input.project} and currently working on ...".`;
  return {
    summary,
    lastKnownState,
    openLoops,
    recommendedNextStep,
    brief: buildContinueProjectBrief({
      project: input.project,
      summary,
      lastKnownState,
      openLoops,
      recommendedNextStep,
      usedMemories: [],
      retrievalDebug: [],
    }),
    usedMemories: [],
    debug: {
      project: input.project,
      retrieval: [],
    },
  };
}

function buildOpenLoopsFromUsedMemories(
  project: string,
  usedMemories: ResumeUsedMemory[],
): string[] {
  const topThree = usedMemories.slice(0, 3);
  const loops = topThree.map((memory) => {
    const anchor = memory.summary ?? memory.content;
    return `Continue from: ${anchor}`;
  });

  loops.push(`Confirm the next shippable milestone for ${project}.`);
  return loops.slice(0, 4);
}

function getPreviousResumeContext(
  previousCheckpoint: Record<string, unknown> | null | undefined,
): PreviousResumeContext {
  if (!previousCheckpoint) {
    return {};
  }

  const rawResult = previousCheckpoint.result;
  if (!rawResult || typeof rawResult !== "object") {
    return {};
  }

  const result = rawResult as Record<string, unknown>;

  return {
    previousSummary:
      typeof result.summary === "string"
        ? truncateText(result.summary, MAX_STATE_OUTPUT_CHARS)
        : undefined,
    previousLastKnownState:
      typeof result.lastKnownState === "string"
        ? truncateText(result.lastKnownState, MAX_STATE_OUTPUT_CHARS)
        : undefined,
  };
}

export async function planResume(
  input: ResumePlannerScopedInput,
): Promise<ResumePlannerResult> {
  const previousContext = getPreviousResumeContext(input.previousCheckpoint);
  const retrieval = await retrieveRelevantMemory({
    userId: input.userId,
    question: `${input.project} ${input.question}`.trim(),
    project: input.project,
    topK: input.topK ?? 5,
    includeArchived: input.includeArchived ?? false,
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.threadId ? { threadId: input.threadId } : {}),
    ...(input.repo ? { repo: input.repo } : {}),
    ...(input.service ? { service: input.service } : {}),
    ...(input.environment ? { environment: input.environment } : {}),
    ...(input.taskId ? { taskId: input.taskId } : {}),
  });

  const openLoopRetrieval = await retrieveRelevantMemory({
    userId: input.userId,
    question: `${input.project} what needs to be finished next`,
    project: input.project,
    topK: input.topK ?? 5,
    includeArchived: input.includeArchived ?? false,
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.threadId ? { threadId: input.threadId } : {}),
    ...(input.repo ? { repo: input.repo } : {}),
    ...(input.service ? { service: input.service } : {}),
    ...(input.environment ? { environment: input.environment } : {}),
    ...(input.taskId ? { taskId: input.taskId } : {}),
  });

  const combinedRetrievalDebug = [...retrieval.debug, ...openLoopRetrieval.debug];

  const combinedRankedMemories = Array.from(
    new Map(
      [...retrieval.memories, ...openLoopRetrieval.memories].map((memory) => [
        memory.id,
        memory,
      ]),
    ).values(),
  ).sort((a, b) => b.finalScore - a.finalScore);

  const [recentOpenLoops, mythicResumeMemories] = await Promise.all([
    buildProjectRecentOpenLoops(
      input.userId,
      input.project,
    ),
    loadMythicResumeMemories({
      userId: input.userId,
      orgId: input.orgId,
      project: input.project,
      repo: input.repo,
    }),
  ]);

  const primaryUsedMemories = combinedRankedMemories.map((memory) =>
    toUsedMemory(memory, combinedRetrievalDebug),
  );
  const usedMemories = Array.from(
    new Map(
      [primaryUsedMemories[0], ...mythicResumeMemories, ...recentOpenLoops, ...primaryUsedMemories]
        .filter((memory): memory is ResumeUsedMemory => Boolean(memory))
        .map((memory) => [memory.id, memory]),
    ).values(),
  );

  if (usedMemories.length === 0) {
    return buildFallbackResult(input, previousContext);
  }

  const top = usedMemories[0];
  const topAnchor = truncateText(top.content ?? top.summary, MAX_MEMORY_OUTPUT_CHARS) ?? "No memory content";
  const topUpdatedAt = top.updatedAt ?? "unknown time";
  const secondaryAnchors = usedMemories
    .slice(1, 3)
    .map((memory) => truncateText(memory.content ?? memory.summary, 420))
    .filter((anchor) => anchor && anchor !== topAnchor);
  const secondaryContext =
    secondaryAnchors.length > 0
      ? ` Supporting context: ${secondaryAnchors.join("; ")}.`
      : "";
  const summary = truncateText(previousContext.previousSummary
    ? `${previousContext.previousSummary} Latest retrieved context: ${topAnchor}.${secondaryContext}`
    : `You last worked on ${input.project} around this context: ${topAnchor}.${secondaryContext}`, MAX_STATE_OUTPUT_CHARS) ??
    `You last worked on ${input.project}.`;
  const lastKnownState = truncateText(previousContext.previousLastKnownState
    ? `${previousContext.previousLastKnownState} Refreshed with top memory ${top.memoryType ?? "general"} scored ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`
    : `Top memory is ${top.memoryType ?? "general"} with score ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`, MAX_STATE_OUTPUT_CHARS) ??
    "Top memory loaded.";
  const openLoops = buildOpenLoopsFromUsedMemories(input.project, usedMemories);
  const recommendedNextStep =
    secondaryAnchors.length > 0
      ? `Resume by executing one concrete task from: ${topAnchor}. Then validate progress against: ${secondaryAnchors.join("; ")}.`
      : `Resume by executing one concrete task from: ${topAnchor}.`;

  const scope = { userId: input.userId, orgId: input.orgId };
  const [actionMemoryExecutionHistory, operationalLoopHistory, recentLoopCompletions, driftBrief] =
    await Promise.all([
      loadExecutionHistoryFromActionMemory(input.userId, input.project, input.orgId),
      loadOperationalLoopHistoryForProject(scope, input.project, 6),
      countRecentCompletedLoops(scope, input.project),
      loadProjectDriftBriefLines(scope, input.project, 6),
    ]);

  return {
    summary,
    lastKnownState,
    openLoops,
    recommendedNextStep,
    brief: buildContinueProjectBrief({
      project: input.project,
      summary,
      lastKnownState,
      openLoops,
      recommendedNextStep,
      usedMemories,
      retrievalDebug: combinedRetrievalDebug,
      actionMemoryExecutionHistory,
      operationalLoopHistory,
      recentLoopCompletions,
      driftAndCorrectiveActions: driftBrief.lines,
      unresolvedHighDrift: driftBrief.hasUnresolvedHighDrift,
    }),
    usedMemories,
    debug: {
      project: input.project,
      retrieval: combinedRetrievalDebug,
    },
  };
}
