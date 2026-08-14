import { retrieveRelevantMemory, type RankedMemory } from "./retrieveRelevantMemory";
import { listActionMemories } from "./actionMemoryStore";
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
    Omit<ContinuityScope, "project"> {}

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

const MAX_MEMORY_OUTPUT_CHARS = 900;
const MAX_STATE_OUTPUT_CHARS = 1_400;

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

function toUsedMemory(memory: RankedMemory): HandoffUsedMemory {
  const fallbackSummary = getMetadataSummary(memory);

  return {
    id: memory.id,
    content: truncateText(memory.memory ?? fallbackSummary, MAX_MEMORY_OUTPUT_CHARS) ?? "No memory content",
    memoryType: memory.memoryType,
    summary: truncateText(fallbackSummary, 360),
    finalScore: memory.finalScore,
    importanceScore: memory.importanceScore,
    updatedAt: memory.updatedAt,
  };
}

async function loadMythicHandoffMemories(
  input: HandoffPlannerScopedInput,
): Promise<HandoffUsedMemory[]> {
  const projectKey = input.project.trim().toLowerCase();
  const actions = await listActionMemories(input.userId, { limit: 30 });

  return actions
    .filter((entry) => entry.outcome === "success" && entry.sourceType === "continuity")
    .filter((entry) => {
      const metadata = entry.metadata;
      const tags = Array.isArray(metadata?.provenanceTags)
        ? metadata.provenanceTags.filter((value): value is string => typeof value === "string")
        : [];
      if (!tags.includes("mythic_handoff")) {
        return false;
      }
      const haystack = `${entry.projectId ?? ""} ${entry.workspace ?? ""} ${entry.action} ${entry.reason}`.toLowerCase();
      return haystack.includes(projectKey);
    })
    .slice(0, 2)
    .map((entry, index) => ({
      id: entry.id,
      content:
        truncateText(
          `Mythic lineage (${entry.updatedAt.slice(0, 10)}): ${entry.action}. ${entry.reason}`,
          MAX_MEMORY_OUTPUT_CHARS,
        ) ?? "Mythic lineage memory",
      memoryType: "episodic",
      summary: truncateText("Successful Mythic execution lineage reused for handoff.", 360),
      finalScore: Math.max(0.6, 0.9 - index * 0.05),
      importanceScore: 0.85,
      updatedAt: entry.updatedAt,
    }));
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
      typeof result.summary === "string"
        ? truncateText(result.summary, MAX_STATE_OUTPUT_CHARS)
        : undefined,
    previousCurrentState:
      typeof result.currentState === "string"
        ? truncateText(result.currentState, MAX_STATE_OUTPUT_CHARS)
        : undefined,
    previousOpenLoops: Array.isArray(result.openLoops)
      ? result.openLoops.filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        ).map((value) => truncateText(value, 420))
          .filter((value): value is string => Boolean(value))
      : undefined,
    previousRecommendedNextActions: Array.isArray(result.recommendedNextActions)
      ? result.recommendedNextActions.filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        ).map((value) => truncateText(value, 420))
          .filter((value): value is string => Boolean(value))
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
    const anchor = truncateText(memory.summary ?? memory.content, 420) ?? "No memory content";
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
    const anchor = truncateText(memory.summary ?? memory.content, 420) ?? "No memory content";
    return `Continue from this context: ${anchor}`;
  });

  const mythic = memories.find((memory) =>
    (memory.summary ?? memory.content).toLowerCase().includes("mythic"),
  );
  if (mythic) {
    actions.unshift(
      `Reuse this Mythic execution lineage in the handoff: ${
        truncateText(mythic.content, 420) ?? "Mythic lineage available"
      }`,
    );
  }

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
  const [retrieval, mythicMemories] = await Promise.all([
    retrieveRelevantMemory({
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
    }),
    loadMythicHandoffMemories(input),
  ]);

  const keyMemories = Array.from(
    new Map(
      [...mythicMemories, ...retrieval.memories.map(toUsedMemory)].map((memory) => [
        memory.id,
        memory,
      ]),
    ).values(),
  );

  if (keyMemories.length === 0) {
    return buildFallbackResult(input, previousContext);
  }

  const top = keyMemories[0];
  const topAnchor = truncateText(top.summary ?? top.content, MAX_MEMORY_OUTPUT_CHARS) ?? "No memory content";
  const topUpdatedAt = top.updatedAt ?? "unknown time";
  const currentOpenLoops = buildOpenLoops(input.project, keyMemories);
  const currentRecommendedNextActions = buildRecommendedNextActions(
    input.project,
    keyMemories,
  );

  return {
    summary: truncateText(previousContext.previousSummary
      ? `${previousContext.previousSummary} Latest handoff context: ${topAnchor}.`
      : `Handoff for ${input.project}: ${topAnchor}.`, MAX_STATE_OUTPUT_CHARS) ??
      `Handoff for ${input.project}.`,
    currentState: truncateText(previousContext.previousCurrentState
      ? `${previousContext.previousCurrentState} Refreshed with top ${top.memoryType ?? "general"} memory scored ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`
      : `Top current state comes from ${top.memoryType ?? "general"} memory scored ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`, MAX_STATE_OUTPUT_CHARS) ??
      "Top current state loaded.",
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
