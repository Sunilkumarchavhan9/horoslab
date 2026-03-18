import { randomUUID } from "crypto";
import { saveMemoryToMem0, searchMemoryFromMem0, type Mem0SearchResult} from "../integrations/mem0";
import { extractMemory } from "../memory/extractMemory";
import { evolveMemory, type EvolveResult } from "../memory/evolveMemory";
import { mergeMemory, type MergeResult } from "../memory/mergeMemory";
import { buildRepetitionMap, filterAcceptedMemories, scoreMemory, type ScoredMemoryCandidate} from "../memory/scoreMemory";
import { recordMemoryCreatedEvent, recordMemoryEvolvedEvent, recordMemoryMergedEvent } from "../memory/timelineMemory";
import type { Memory, MemorySource, MemoryStatus, MemoryType, TimelineEvent } from "../memory/types";
import { getRecentMemories, upsertRecentMemory } from "../memory/recentMemoryStore";
import { recordRevisionEvent } from "../memory/revisionMemory";


export interface IngestInput {
  userId: string;
  threadId?: string;
  message: string;
}

export interface RejectedMemory {
  candidate: ScoredMemoryCandidate;
  reason: string;
}

export interface IngestResult {
  acceptedMemories: Memory[];
  rejectedMemories: RejectedMemory[];
  timelineEvents: TimelineEvent[];
}

const ALLOWED_TYPES: MemoryType[] = [
  "profile",
  "preference",
  "learning",
  "project",
  "episodic",
];

const ALLOWED_SOURCES: MemorySource[] = ["chat", "system", "import"];
const ALLOWED_STATUSES: MemoryStatus[] = ["active", "archived", "merged"];

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

export function toMemory(candidate: ScoredMemoryCandidate): Memory {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    userId: candidate.userId,
    type: candidate.type,
    content: candidate.content,
    summary: candidate.summary,
    importanceScore: candidate.importanceScore,
    confidence: candidate.confidence,
    source: candidate.source,
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: 1,
  };
}

export function toInternalMemory(
  result: Mem0SearchResult,
  userId: string,
): Memory | null {
  const metadata = result.metadata;
  const content = result.memory;

  if (!content) return null;
  if (!metadata || typeof metadata !== "object") return null;

  const rawType = typeof metadata.type === "string" ? metadata.type : undefined;
  const summary = typeof metadata.summary === "string" ? metadata.summary : undefined;
  const source =  typeof metadata.source === "string" ? metadata.source : undefined;
  const status =  typeof metadata.status === "string" ? metadata.status : undefined;
  const createdAt = typeof metadata.createdAt === "string" ? metadata.createdAt : undefined;
  const updatedAt = typeof metadata.updatedAt === "string" ? metadata.updatedAt : undefined;

  if (!rawType || !ALLOWED_TYPES.includes(rawType as MemoryType)) {
    return null;
  }

  if (!source || !ALLOWED_SOURCES.includes(source as MemorySource)) {
    return null;
  }

  if (!status || !ALLOWED_STATUSES.includes(status as MemoryStatus)) {
    return null;
  }

  const importanceScore = parseNumericMetadataValue(metadata.importanceScore, 0.5);
  const confidence = parseNumericMetadataValue(metadata.confidence, 0.5);
  const evidenceCount = Math.max(1, Math.round(parseNumericMetadataValue(metadata.evidenceCount, 1)),);

  if (!summary || !createdAt || !updatedAt) {
    return null;
  }

  return {
    id: result.id,
    userId,
    type: rawType as MemoryType,
    content,
    summary,
    importanceScore,
    confidence,
    source: source as MemorySource,
    status: status as MemoryStatus,
    createdAt,
    updatedAt,
    evidenceCount,
  };
}

export async function runIngestFlow(input: IngestInput): Promise<IngestResult> {
  const candidates = extractMemory({
    userId: input.userId,
    threadId: input.threadId,
    message: input.message,
  });

  const repetitionMap = buildRepetitionMap(candidates);
  const scoredCandidates = candidates.map((candidate) =>
    scoreMemory(candidate, repetitionMap),
  );
  const { accepted, rejected, threshold } = filterAcceptedMemories(
    scoredCandidates,
  );

  const acceptedMemories: Memory[] = [];
  const timelineEvents: TimelineEvent[] = [];

  for (const candidate of accepted) {
    const memory = toMemory(candidate);
    const recentMemoryStore = getRecentMemories(memory.userId);

    const searchResults = await searchMemoryFromMem0({
      userId: memory.userId,
      query: memory.content,
      topK: 5,
    });

    const mem0Memoires = searchResults
      .map((result) => toInternalMemory(result, memory.userId))
      .filter((item): item is Memory => item !== null);
    
    const existingMemories = [...recentMemoryStore, ...mem0Memoires];
    const uniqueExstingMemories = Array.from(
      new Map(existingMemories.map((item) => [item.id, item])).values(),
    )

    let bestMerge: MergeResult | null = null;
    let bestEvolve: EvolveResult | null = null;

    for (const existing of  uniqueExstingMemories) {
      const mergeResult = mergeMemory(existing, memory);

      if (mergeResult.shouldMerge) {
        if (!bestMerge || mergeResult.similarity > bestMerge.similarity) {
          bestMerge = mergeResult;
        }
        continue;
      }

      const evolveResult = evolveMemory(existing, memory);
      if (!evolveResult.shouldEvolve) {
        continue;
      }

      if (!bestEvolve) {
        bestEvolve = evolveResult;
        continue;
      }

      const current = evolveResult.evolvedMemory;
      const best = bestEvolve.evolvedMemory;

      if (!current || !best) {
        continue;
      }

      if (
        current.importanceScore > best.importanceScore ||
        (current.importanceScore === best.importanceScore &&
          current.confidence > best.confidence)
      ) {
        bestEvolve = evolveResult;
      }
    }

    const memoryToPersist =
      bestMerge?.mergedMemory ?? bestEvolve?.evolvedMemory ?? memory;
    const timelineReason = bestMerge
      ? `merged with existing memory (${bestMerge.reason})`
      : bestEvolve
        ? `evolved existing memory (${bestEvolve.reason})`
        : `passed score threshold ${threshold.toFixed(2)}`;

    await saveMemoryToMem0({ memory: memoryToPersist });
      if (bestMerge?.baseMemory) {
        recordRevisionEvent({
          before: bestMerge.baseMemory,
          after: memoryToPersist,
          reason: timelineReason,
        });
      } else if (bestEvolve?.baseMemory) {
        recordRevisionEvent({
          before: bestEvolve.baseMemory,
          after: memoryToPersist,
          reason: timelineReason,
        });
      }
        acceptedMemories.push(memoryToPersist);
        upsertRecentMemory(memoryToPersist);


      const timelineEvent = bestMerge
      ? recordMemoryMergedEvent(memoryToPersist, timelineReason)
      : bestEvolve
        ? recordMemoryEvolvedEvent(memoryToPersist, timelineReason)
        : recordMemoryCreatedEvent(memoryToPersist, timelineReason);

      timelineEvents.push(timelineEvent);
  

  }

  const rejectedMemories: RejectedMemory[] = rejected.map((candidate) => ({
    candidate,
    reason: candidate.scoreReasons.join(", ") || `did not meet score threshold ${threshold.toFixed(2)}`,

  }));

    return {
      acceptedMemories,
      rejectedMemories,
      timelineEvents,
    };
}
