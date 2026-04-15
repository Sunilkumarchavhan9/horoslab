import { extractMemory } from "../memory/extractMemory";
import { buildRepetitionMap, filterAcceptedMemories, scoreMemory, type ScoredMemoryCandidate} from "../memory/scoreMemory";
import type { Memory, TimelineEvent } from "../memory/types";
import { persistAcceptedMemories } from "./ingestPersist";


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
  const { acceptedMemories, timelineEvents } = await persistAcceptedMemories(
    accepted,
    threshold,
  );

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
