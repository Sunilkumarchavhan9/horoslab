import { retrieveRelevantMemory, type RankedMemory } from "./retrieveRelevantMemory";
import type { ContinuityScope } from "../adapters/adapters";
import { getRecentMemories } from "./recentMemoryStore";
import type { Memory, MemoryContractCategory, MemoryType } from "./types";

export type ContinueProjectBrief = {
  whatChangedRecently: string[];
  currentGoal: string;
  keyDecisions: string[];
  openBlockers: string[];
  riskyFiles: string[];
  nextBestAction: string;
  mustKnowContextForAgent: string[];
};

export interface ResumePlannerInput {
  userId: string;
  project: string;
  question: string;
  topK?: number;
  includeArchived?: boolean;
  previousCheckpoint?: Record<string, unknown> | null;
}

export interface ResumePlannerScopedInput
  extends ResumePlannerInput,
    Pick<ContinuityScope, "workspace" | "threadId"> {}

export interface ResumeUsedMemory {
  id: string;
  content: string;
  memoryType?: MemoryType;
  contractCategory?: MemoryContractCategory;
  summary?: string;
  finalScore: number;
  importanceScore: number;
  updatedAt?: string;
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
    retrieval: Array<{
      id: string;
      semanticScore: number;
      typeRelevanceScore: number;
      importanceScore: number;
      recencyScore: number;
      continuityBoost: number;
      intent: string;
      weightsUsed: {
        semantic: number;
        typeRelevance: number;
        importance: number;
        recency: number;
      };
      finalScore: number;
    }>;
  };
}

type PreviousResumeContext = {
  previousSummary?: string;
  previousLastKnownState?: string;
};

function getMetadataSummary(memory: RankedMemory): string | undefined {
  const metadata = memory.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const raw = (metadata as Record<string, unknown>).summary;
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function toUsedMemory(memory: RankedMemory): ResumeUsedMemory {
  const fallbackSummary = getMetadataSummary(memory);

  return {
    id: memory.id,
    content: memory.memory ?? fallbackSummary ?? "No memory content",
    memoryType: memory.memoryType,
    contractCategory: memory.contractCategory,
    summary: fallbackSummary,
    finalScore: memory.finalScore,
    importanceScore: memory.importanceScore,
    updatedAt: memory.updatedAt,
  };
}

function toUsedMemoryFromRecent(memory: Memory): ResumeUsedMemory {
  return {
    id: memory.id,
    content: memory.content,
    memoryType: memory.type,
    contractCategory: memory.contractCategory,
    summary: memory.summary,
    finalScore: memory.importanceScore,
    importanceScore: memory.importanceScore,
    updatedAt: memory.updatedAt,
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
      return haystack.includes(projectName);
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
  return cleanText(memory.summary ?? memory.content) ?? "No memory content";
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
  return Array.from(
    new Set(
      memories.flatMap((memory) => {
        const text = `${memory.summary ?? ""} ${memory.content ?? ""}`;
        return text.match(/[A-Za-z0-9_/.-]+\.(ts|tsx|js|jsx|py|go|rs|java|rb|json|yaml|yml|md|mdx)/g) ?? [];
      }),
    ),
  ).slice(0, 5);
}

function buildContinueProjectBrief(input: {
  project: string;
  summary: string;
  lastKnownState: string;
  openLoops: string[];
  recommendedNextStep: string;
  usedMemories: ResumeUsedMemory[];
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

  const whatChangedRecently = uniqueNonEmpty(memories.slice(0, 4).map(memoryText), 4);
  const keyDecisions = uniqueNonEmpty(decisionMemories.map(memoryText), 5);
  const openBlockers = uniqueNonEmpty([
    ...blockerMemories.map(memoryText),
    ...input.openLoops.filter((loop) => /\b(block|risk|issue|debug|fix|failed)\b/i.test(loop)),
  ], 5);
  const mustKnowContextForAgent = uniqueNonEmpty([
    ...memories.slice(0, 6).map(memoryText),
    input.lastKnownState,
  ], 6);
  const nextActions = uniqueNonEmpty([
    ...nextActionMemories.map(memoryText),
    input.recommendedNextStep,
  ], 2);

  return {
    whatChangedRecently: whatChangedRecently.length > 0 ? whatChangedRecently : [input.lastKnownState],
    currentGoal: cleanText(input.summary) ?? `Continue ${input.project} using the latest retrieved memory.`,
    keyDecisions,
    openBlockers,
    riskyFiles: buildRiskyFiles(memories),
    nextBestAction: nextActions[0] ?? input.recommendedNextStep,
    mustKnowContextForAgent,
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
      typeof result.summary === "string" ? result.summary : undefined,
    previousLastKnownState:
      typeof result.lastKnownState === "string"
        ? result.lastKnownState
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
  });

  const openLoopRetrieval = await retrieveRelevantMemory({
    userId: input.userId,
    question: `${input.project} what needs to be finished next`,
    project: input.project,
    topK: input.topK ?? 5,
    includeArchived: input.includeArchived ?? false,
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.threadId ? { threadId: input.threadId } : {}),
  });

  const combinedRankedMemories = Array.from(
    new Map(
      [...retrieval.memories, ...openLoopRetrieval.memories].map((memory) => [
        memory.id,
        memory,
      ]),
    ).values(),
  ).sort((a, b) => b.finalScore - a.finalScore);

  const recentOpenLoops = await buildProjectRecentOpenLoops(
    input.userId,
    input.project,
  );

  const primaryUsedMemories = combinedRankedMemories.map(toUsedMemory);
  const usedMemories = Array.from(
    new Map(
      [primaryUsedMemories[0], ...recentOpenLoops, ...primaryUsedMemories]
        .filter((memory): memory is ResumeUsedMemory => Boolean(memory))
        .map((memory) => [memory.id, memory]),
    ).values(),
  );

  if (usedMemories.length === 0) {
    return buildFallbackResult(input, previousContext);
  }

  const top = usedMemories[0];
  const topAnchor = top.summary ?? top.content;
  const topUpdatedAt = top.updatedAt ?? "unknown time";
  const secondaryAnchors = usedMemories
    .slice(1, 3)
    .map((memory) => memory.summary ?? memory.content)
    .filter((anchor) => anchor && anchor !== topAnchor);
  const secondaryContext =
    secondaryAnchors.length > 0
      ? ` Supporting context: ${secondaryAnchors.join("; ")}.`
      : "";
  const summary = previousContext.previousSummary
    ? `${previousContext.previousSummary} Latest retrieved context: ${topAnchor}.${secondaryContext}`
    : `You last worked on ${input.project} around this context: ${topAnchor}.${secondaryContext}`;
  const lastKnownState = previousContext.previousLastKnownState
    ? `${previousContext.previousLastKnownState} Refreshed with top memory ${top.memoryType ?? "general"} scored ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`
    : `Top memory is ${top.memoryType ?? "general"} with score ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`;
  const openLoops = buildOpenLoopsFromUsedMemories(input.project, usedMemories);
  const recommendedNextStep =
    secondaryAnchors.length > 0
      ? `Resume by executing one concrete task from: ${topAnchor}. Then validate progress against: ${secondaryAnchors.join("; ")}.`
      : `Resume by executing one concrete task from: ${topAnchor}.`;

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
    }),
    usedMemories,
    debug: {
      project: input.project,
      retrieval: [...retrieval.debug, ...openLoopRetrieval.debug],
    },
  };
}
