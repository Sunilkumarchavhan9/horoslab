import { retrieveRelevantMemory, type RankedMemory } from "./retrieveRelevantMemory";
import type { ContinuityScope } from "../adapters/adapters";
import { getRecentMemories } from "./recentMemoryStore";
import type { Memory, MemoryType } from "./types";

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
    summary: memory.summary,
    finalScore: memory.importanceScore,
    importanceScore: memory.importanceScore,
    updatedAt: memory.updatedAt,
  };
}

function buildProjectRecentOpenLoops(
  userId: string,
  project: string,
): ResumeUsedMemory[] {
  const projectName = project.toLowerCase();

  return getRecentMemories(userId)
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

function buildFallbackResult(
  input: ResumePlannerInput,
  previousContext?: PreviousResumeContext,
): ResumePlannerResult {
  return {
    summary:
      previousContext?.previousSummary ??
      `No strong saved context found for ${input.project} yet.`,
    lastKnownState:
      previousContext?.previousLastKnownState ??
      "No prior project progress memory was retrieved.",
    openLoops: [
      `Capture your latest ${input.project} progress as a memory update.`,
      "Add one concrete milestone and one blocker.",
    ],
    recommendedNextStep: `Post a fresh update like: "I am building ${input.project} and currently working on ...".`,
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

  const recentOpenLoops = buildProjectRecentOpenLoops(
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

  return {
    summary: previousContext.previousSummary
      ? `${previousContext.previousSummary} Latest retrieved context: ${topAnchor}.${secondaryContext}`
      : `You last worked on ${input.project} around this context: ${topAnchor}.${secondaryContext}`,
    lastKnownState: previousContext.previousLastKnownState
      ? `${previousContext.previousLastKnownState} Refreshed with top memory ${top.memoryType ?? "general"} scored ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`
      : `Top memory is ${top.memoryType ?? "general"} with score ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`,
    openLoops: buildOpenLoopsFromUsedMemories(input.project, usedMemories),
    recommendedNextStep:
      secondaryAnchors.length > 0
        ? `Resume by executing one concrete task from: ${topAnchor}. Then validate progress against: ${secondaryAnchors.join("; ")}.`
        : `Resume by executing one concrete task from: ${topAnchor}.`,
    usedMemories,
    debug: {
      project: input.project,
      retrieval: [...retrieval.debug, ...openLoopRetrieval.debug],
    },
  };
}
