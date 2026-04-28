import { getMemoryStoreAdapter } from "../adapters/registry";
import { evolveMemory, type EvolveResult } from "../memory/evolveMemory";
import { mergeMemory, type MergeResult } from "../memory/mergeMemory";
import { getRecentMemories, upsertRecentMemory } from "../memory/recentMemoryStore";
import { recordRevisionEvent } from "../memory/revisionMemory";
import {
  recordMemoryContradictedEvent,
  recordMemoryCreatedEvent,
  recordMemoryEvolvedEvent,
  recordMemoryMergedEvent,
  recordMemoryStaleEvent,
} from "../memory/timelineMemory";
import type { Memory, TimelineEvent } from "../memory/types";
import type { ScoredMemoryCandidate } from "../memory/scoreMemory";
import { toInternalMemory, toMemory } from "./ingestShared";
import { resolveLifecycleTransition } from "../memory/contradictionResolver";

export interface PersistAcceptedResult {
  acceptedMemories: Memory[];
  timelineEvents: TimelineEvent[];
}

export async function persistAcceptedMemories( accepted: ScoredMemoryCandidate[], threshold: number ): Promise<PersistAcceptedResult> {
  const acceptedMemories: Memory[] = [];
  const timelineEvents: TimelineEvent[] = [];
  const memoryStore = getMemoryStoreAdapter();

  for (const candidate of accepted) {
    const memory = toMemory(candidate);
    const recentMemories = await getRecentMemories(memory.userId);

    const searchResults = await memoryStore.searchMemory({
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
      const transition = resolveLifecycleTransition(existing, memory);
      if (transition.status !== "none") {
        const transitionedMemory: Memory = {
          ...existing,
          status: transition.status,
          updatedAt: new Date().toISOString(),
        };

        await memoryStore.saveMemory({ memory: transitionedMemory });
        await upsertRecentMemory(transitionedMemory);
        await recordRevisionEvent({
          before: existing,
          after: transitionedMemory,
          reason: transition.reason,
        });
        const lifecycleEvent =
          transition.status === "contradicted"
            ? await recordMemoryContradictedEvent(
                transitionedMemory,
                transition.reason,
              )
            : await recordMemoryStaleEvent(transitionedMemory, transition.reason);
        timelineEvents.push(lifecycleEvent);
        continue;
      }

      const mergeResult = mergeMemory(existing, memory);

      if(mergeResult.shouldMerge){
        if(!bestMerge || mergeResult.similarity > bestMerge.similarity){
            bestMerge = mergeResult;
        }
        continue;
      }

      const evolveResult = evolveMemory(existing, memory);

      if(!evolveResult.shouldEvolve){
        continue;
      }

      if(!bestEvolve){
        bestEvolve = evolveResult;
        continue;
      }

      const current = evolveResult.evolvedMemory;
      const best = bestEvolve.evolvedMemory;

      if(!current || !best){
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

    await memoryStore.saveMemory({ memory: memoryToPersist });

    
    if (bestMerge?.baseMemory) {
        await recordRevisionEvent({
            before: bestMerge.baseMemory,
            after: memoryToPersist,
            reason: timelineReason,
        });
    } else if (bestEvolve?.baseMemory) {
        await recordRevisionEvent({
            before: bestEvolve.baseMemory,
            after: memoryToPersist,
            reason: timelineReason,
        });
    }


    acceptedMemories.push(memoryToPersist);
    await upsertRecentMemory(memoryToPersist);

    const timelineEvent =  await (bestMerge
      ? recordMemoryMergedEvent(memoryToPersist, timelineReason)
      : bestEvolve
        ? recordMemoryEvolvedEvent(memoryToPersist, timelineReason)
        : recordMemoryCreatedEvent(memoryToPersist, timelineReason));

    timelineEvents.push(timelineEvent);
  }

  return {
    acceptedMemories,
    timelineEvents,
  };
}

