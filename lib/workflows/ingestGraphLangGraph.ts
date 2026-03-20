import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { extractMemory } from "../memory/extractMemory";
import {
  buildRepetitionMap,
  filterAcceptedMemories,
  scoreMemory,
  type ScoredMemoryCandidate,
} from "../memory/scoreMemory";
import type { Memory, MemoryCandidate, TimelineEvent } from "../memory/types";
import {
  type IngestInput,
  type IngestResult,
  type RejectedMemory,
} from "./ingestGraph";
import { persistAcceptedMemories } from "./ingestPersist";

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
