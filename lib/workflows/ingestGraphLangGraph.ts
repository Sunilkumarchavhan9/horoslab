import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { saveMemoryToMem0, searchMemoryFromMem0 } from "../integrations/mem0";
import { extractMemory } from "../memory/extractMemory";
import { evolveMemory, type EvolveResult } from "../memory/evolveMemory";
import { mergeMemory, type MergeResult } from "../memory/mergeMemory";
import { getRecentMemories, upsertRecentMemory } from "../memory/recentMemoryStore";
import { recordRevisionEvent } from "../memory/revisionMemory";
import {
  buildRepetitionMap,
  filterAcceptedMemories,
  scoreMemory,
  type ScoredMemoryCandidate,
} from "../memory/scoreMemory";
import {
  recordMemoryCreatedEvent,
  recordMemoryEvolvedEvent,
  recordMemoryMergedEvent,
} from "../memory/timelineMemory";
import type { Memory, MemoryCandidate, TimelineEvent } from "../memory/types";
import {
  toInternalMemory,
  toMemory,
  type IngestInput,
  type IngestResult,
  type RejectedMemory,
} from "./ingestGraph";

const IngestGraphStateAnnotation = Annotation.Root({
  input: Annotation<IngestInput>,
  candidates: Annotation<MemoryCandidate[]>,
  scoredCandidates: Annotation<ScoredMemoryCandidate[]>,
  accepted: Annotation<ScoredMemoryCandidate[]>,
  rejected: Annotation<RejectedMemory[]>,
  acceptedMemories: Annotation<Memory[]>,
  timelineEvents: Annotation<TimelineEvent[]>,
  threshold: Annotation<number>,
});

type IngestGraphState = typeof IngestGraphStateAnnotation.State;

function extractNode(state: IngestGraphState): Partial<IngestGraphState> {
  const candidates = extractMemory({
    userId: state.input.userId,
    threadId: state.input.threadId,
    message: state.input.message,
  });

  return { candidates };
}

function scoreNode(state: IngestGraphState): Partial<IngestGraphState> {
  const repetitionMap = buildRepetitionMap(state.candidates);
  const scoredCandidates = state.candidates.map((candidate) =>
    scoreMemory(candidate, repetitionMap),
  );
  const { accepted, rejected, threshold } = filterAcceptedMemories(
    scoredCandidates,
  );

  const rejectedMemories: RejectedMemory[] = rejected.map((candidate) => ({
    candidate,
    reason:
      candidate.scoreReasons.join(", ") ||
      `did not meet score threshold ${threshold.toFixed(2)}`,
  }));

  return {
    scoredCandidates,
    accepted,
    rejected: rejectedMemories,
    threshold,
  };
}

async function persistAcceptedMemories(
  accepted: ScoredMemoryCandidate[],
  threshold: number,
): Promise<{
  acceptedMemories: Memory[];
  timelineEvents: TimelineEvent[];
}> {
  const acceptedMemories: Memory[] = [];
  const timelineEvents: TimelineEvent[] = [];

  for (const candidate of accepted) {
    const memory = toMemory(candidate);
    const recentMemories = getRecentMemories(memory.userId);

    const searchResults = await searchMemoryFromMem0({
      userId: memory.userId,
      query: memory.content,
      topK: 5,
    });

    const mem0Memories = searchResults
      .map((result) => toInternalMemory(result, memory.userId))
      .filter((item): item is Memory => item !== null);

    const existingMemories = [...recentMemories, ...mem0Memories];
    const uniqueExistingMemories = Array.from(
      new Map(existingMemories.map((item) => [item.id, item])).values(),
    );

    let bestMerge: MergeResult | null = null;
    let bestEvolve: EvolveResult | null = null;


    for (const existing of uniqueExistingMemories) {
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

  return {
    acceptedMemories,
    timelineEvents,
  };
}

async function persistNode(
  state: IngestGraphState,
): Promise<Partial<IngestGraphState>> {
  const { acceptedMemories, timelineEvents } = await persistAcceptedMemories(
    state.accepted,
    state.threshold,
  );

  return {
    acceptedMemories,
    timelineEvents,
  };
}

const ingestGraph = new StateGraph(IngestGraphStateAnnotation)
  .addNode("extract", extractNode)
  .addNode("score", scoreNode)
  .addNode("persist", persistNode)
  .addEdge(START, "extract")
  .addEdge("extract", "score")
  .addEdge("score", "persist")
  .addEdge("persist", END);

  
const compiledIngestGraph = ingestGraph.compile();
export async function runIngestFlowLangGraph(
  input: IngestInput,
): Promise<IngestResult> {
  const result = await compiledIngestGraph.invoke({
    input,
    candidates: [],
    scoredCandidates: [],
    accepted: [],
    rejected: [],
    acceptedMemories: [],
    timelineEvents: [],
    threshold: 0,
  });


  return {
    acceptedMemories: result.acceptedMemories,
    rejectedMemories: result.rejected,
    timelineEvents: result.timelineEvents,
  };
}
