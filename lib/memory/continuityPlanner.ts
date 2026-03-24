import { retrieveRelevantMemory, type RankedMemory } from "./retrieveRelevantMemory";
import type { MemoryType } from "./types";

export type ContinuityMode = "build_next" | "debug_next" | "learn_next";

export interface ContinuityPlannerInput {
  userId: string;
  question: string;
  mode?: ContinuityMode;
  topK?: number;
  includeArchived?: boolean;
}

export interface ContinuityUsedMemory {
  id: string;
  content: string;
  memoryType?: MemoryType;
  summary?: string;
  finalScore: number;
  importanceScore: number;
  updatedAt?: string;
}

export interface ContinuityPlannerResult {
  nextActions: string[];
  usedMemories: ContinuityUsedMemory[];
  debug: {
    mode: ContinuityMode;
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

function getMetadataSummary(memory: RankedMemory): string | undefined {
  const metadata = memory.metadata;
  if (!metadata || typeof metadata !== "object") return undefined;
  const raw = (metadata as Record<string, unknown>).summary;
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

function toUsedMemory(memory: RankedMemory): ContinuityUsedMemory {
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

function pickFirstByType(
  memories: ContinuityUsedMemory[],
  type: MemoryType,
): ContinuityUsedMemory | undefined {
  return memories.find((m) => m.memoryType === type);
}

function buildActions(
  mode: ContinuityMode,
  question: string,
  used: ContinuityUsedMemory[],
): string[] {
  const project = pickFirstByType(used, "project");
  const learning = pickFirstByType(used, "learning");
  const preference = pickFirstByType(used, "preference");
  const episodic = pickFirstByType(used, "episodic");

  const actions: string[] = [];

  if (mode === "build_next") {
    if (project) actions.push(`Continue this project thread: ${project.content}`);
    if (preference) actions.push(`Use preferred stack/style: ${preference.content}`);
    if (learning) actions.push(`Add one feature that uses your learning focus: ${learning.content}`);
  }

  if (mode === "debug_next") {
    if (episodic) actions.push(`Re-check similar bug pattern: ${episodic.content}`);
    if (project) actions.push(`Reproduce inside current project flow: ${project.content}`);
    if (preference) actions.push(`Apply your known technical preference while fixing: ${preference.content}`);
  }

  if (mode === "learn_next") {
    if (learning) actions.push(`Study this next: ${learning.content}`);
    if (project) actions.push(`Practice learning directly in project work: ${project.content}`);
    if (preference) actions.push(`Use your preferred tools while learning: ${preference.content}`);
  }

  if (actions.length === 0) {
    actions.push(`Break this question into one concrete next task: ${question}`);
    actions.push("Define success criteria for that task in one sentence.");
    actions.push("Execute the smallest testable step and record outcome.");
  }

  return actions.slice(0, 3);
}

export async function planContinuity(
  input: ContinuityPlannerInput,
): Promise<ContinuityPlannerResult> {
  const mode: ContinuityMode = input.mode ?? "build_next";

  const retrieval = await retrieveRelevantMemory({
    userId: input.userId,
    question: input.question,
    topK: input.topK ?? 5,
    includeArchived: input.includeArchived ?? false,
  });

  const usedMemories = retrieval.memories.map(toUsedMemory);
  const nextActions = buildActions(mode, input.question, usedMemories);

  return {
    nextActions,
    usedMemories,
    debug: {
      mode,
      retrieval: retrieval.debug,
    },
  };
}

