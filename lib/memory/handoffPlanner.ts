import { retrieveRelevantMemory, type RankedMemory } from "./retrieveRelevantMemory";
import type { ContinuityScope } from "../adapters/adapters";
import type { MemoryType } from "./types";

export interface HandoffPlannerInput {
  userId: string;
  project: string;
  question: string;
  topK?: number;
  includeArchived?: boolean;
  previousCheckpoint?: Record<string, unknown> | null;
}

export interface HandoffPlannerScopedInput
  extends HandoffPlannerInput,
    Pick<ContinuityScope, "workspace" | "threadId"> {}

export interface HandoffUsedMemory {
  id: string;
  content: string;
  memoryType?: MemoryType;
  summary?: string;
  finalScore: number;
  importanceScore: number;
  updatedAt?: string;
}

export interface HandoffPlannerResult {
  summary: string;
  currentState: string;
  openLoops: string[];
  recommendedNextActions: string[];
  keyMemories: HandoffUsedMemory[];
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

type PreviousHandoffContext = {
  previousSummary?: string;
  previousCurrentState?: string;
  previousOpenLoops?: string[];
  previousRecommendedNextActions?: string[];
};

function getMetadataSummary(memory: RankedMemory): string | undefined {
  const metadata = memory.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const raw = (metadata as Record<string, unknown>).summary;
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function toUsedMemory(memory: RankedMemory): HandoffUsedMemory {
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

function getPreviousHandoffContext(
  previousCheckpoint: Record<string, unknown> | null | undefined,
): PreviousHandoffContext {
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
    previousCurrentState:
      typeof result.currentState === "string"
        ? result.currentState
        : undefined,
    previousOpenLoops: Array.isArray(result.openLoops)
      ? result.openLoops.filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        )
      : undefined,
    previousRecommendedNextActions: Array.isArray(result.recommendedNextActions)
      ? result.recommendedNextActions.filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        )
      : undefined,
  };
}

function mergeUniqueItems(
  currentItems: string[],
  previousItems?: string[],
): string[] {
  return [...currentItems, ...(previousItems ?? [])]
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 4);
}

function buildFallbackResult(
  input: HandoffPlannerInput,
  previousContext?: PreviousHandoffContext,
): HandoffPlannerResult {
  return {
    summary:
      previousContext?.previousSummary ??
      `No strong handoff context found for ${input.project} yet.`,
    currentState:
      previousContext?.previousCurrentState ??
      "No prior project state was retrieved.",
    openLoops:
      previousContext?.previousOpenLoops && previousContext.previousOpenLoops.length > 0
        ? previousContext.previousOpenLoops
        : [
            "Capture the current milestone.",
            "Record any blocker or unresolved question.",
          ],
    recommendedNextActions:
      previousContext?.previousRecommendedNextActions &&
      previousContext.previousRecommendedNextActions.length > 0
        ? previousContext.previousRecommendedNextActions
        : [
            `Write a fresh project update for ${input.project}.`,
            "List the next concrete task.",
          ],
    keyMemories: [],
    debug: {
      project: input.project,
      retrieval: [],
    },
  };
}

function buildOpenLoops(
  project: string,
  memories: HandoffUsedMemory[],
): string[] {
  const loops = memories.slice(0, 2).map((memory) => {
    const anchor = memory.summary ?? memory.content;
    return `Open loop to confirm: ${anchor}`;
  });

  loops.push(`Confirm the next shippable milestone for ${project}.`);
  return loops.slice(0, 3);
}

function buildRecommendedNextActions(
  project: string,
  memories: HandoffUsedMemory[],
): string[] {
  const actions = memories.slice(0, 3).map((memory) => {
    const anchor = memory.summary ?? memory.content;
    return `Continue from this context: ${anchor}`;
  });

  if (actions.length === 0) {
    actions.push(`Write a fresh project update for ${project}.`);
    actions.push("List the next concrete task.");
  } else {
    actions.push(`Choose the next concrete task for ${project}.`);
  }

  return actions.slice(0, 3);
}

export async function planHandoff(
  input: HandoffPlannerScopedInput,
): Promise<HandoffPlannerResult> {
  const previousContext = getPreviousHandoffContext(input.previousCheckpoint);
  const retrieval = await retrieveRelevantMemory({
    userId: input.userId,
    question: `${input.project} ${input.question}`.trim(),
    project: input.project,
    topK: input.topK ?? 5,
    includeArchived: input.includeArchived ?? false,
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.threadId ? { threadId: input.threadId } : {}),
  });

  const keyMemories = retrieval.memories.map(toUsedMemory);

  if (keyMemories.length === 0) {
    return buildFallbackResult(input, previousContext);
  }

  const top = keyMemories[0];
  const topAnchor = top.summary ?? top.content;
  const topUpdatedAt = top.updatedAt ?? "unknown time";
  const currentOpenLoops = buildOpenLoops(input.project, keyMemories);
  const currentRecommendedNextActions = buildRecommendedNextActions(
    input.project,
    keyMemories,
  );

  return {
    summary: previousContext.previousSummary
      ? `${previousContext.previousSummary} Latest handoff context: ${topAnchor}.`
      : `Handoff for ${input.project}: ${topAnchor}.`,
    currentState: previousContext.previousCurrentState
      ? `${previousContext.previousCurrentState} Refreshed with top ${top.memoryType ?? "general"} memory scored ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`
      : `Top current state comes from ${top.memoryType ?? "general"} memory scored ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`,
    openLoops: mergeUniqueItems(
      currentOpenLoops,
      previousContext.previousOpenLoops,
    ),
    recommendedNextActions: mergeUniqueItems(
      currentRecommendedNextActions,
      previousContext.previousRecommendedNextActions,
    ),
    keyMemories,
    debug: {
      project: input.project,
      retrieval: retrieval.debug,
    },
  };
}
