import { retrieveRelevantMemory, type RankedMemory } from "./retrieveRelevantMemory";
import type { MemoryType } from "./types";

export interface ResumePlannerInput {
  userId: string;
  project: string;
  question: string;
  topK?: number;
  includeArchived?: boolean;
}

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

function buildFallbackResult(input: ResumePlannerInput): ResumePlannerResult {
  return {
    summary: `No strong saved context found for ${input.project} yet.`,
    lastKnownState: "No prior project progress memory was retrieved.",
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
  const topTwo = usedMemories.slice(0, 2);
  const loops = topTwo.map((memory) => {
    const anchor = memory.summary ?? memory.content;
    return `Continue from: ${anchor}`;
  });

  loops.push(`Confirm the next shippable milestone for ${project}.`);
  return loops.slice(0, 3);
}

export async function planResume(
  input: ResumePlannerInput,
): Promise<ResumePlannerResult> {
  const retrieval = await retrieveRelevantMemory({
    userId: input.userId,
    question: `${input.project} ${input.question}`.trim(),
    topK: input.topK ?? 5,
    includeArchived: input.includeArchived ?? false,
  });

  const usedMemories = retrieval.memories.map(toUsedMemory);
  if (usedMemories.length === 0) {
    return buildFallbackResult(input);
  }

  const top = usedMemories[0];
  const topAnchor = top.summary ?? top.content;
  const topUpdatedAt = top.updatedAt ?? "unknown time";

  return {
    summary: `You last worked on ${input.project} around this context: ${topAnchor}.`,
    lastKnownState: `Top memory is ${top.memoryType ?? "general"} with score ${top.finalScore.toFixed(3)} (updated ${topUpdatedAt}).`,
    openLoops: buildOpenLoopsFromUsedMemories(input.project, usedMemories),
    recommendedNextStep: `Resume by executing one concrete task from: ${topAnchor}.`,
    usedMemories,
    debug: {
      project: input.project,
      retrieval: retrieval.debug,
    },
  };
}

