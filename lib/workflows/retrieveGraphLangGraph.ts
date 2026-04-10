import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  retrieveRelevantMemory,
  type RankedMemory,
  type RetrieveRelevantMemoryInput,
  type RetrieveRelevantMemoryResult,
} from "../memory/retrieveRelevantMemory";

const RetrieveGraphStateAnnotation = Annotation.Root({
  input: Annotation<RetrieveRelevantMemoryInput>,
  retrieval: Annotation<RetrieveRelevantMemoryResult | null>,
  ranked: Annotation<RankedMemory[]>,
  debug: Annotation<RetrieveRelevantMemoryResult["debug"]>,
});

type RetrieveGraphState = typeof RetrieveGraphStateAnnotation.State;

async function fetchCandidatesNode(
  state: RetrieveGraphState,
): Promise<Partial<RetrieveGraphState>> {
  const retrieval = await retrieveRelevantMemory(state.input);
  return { retrieval };
}

function rankAndRerankNode(
  state: RetrieveGraphState,
): Partial<RetrieveGraphState> {
  return {
    ranked: state.retrieval?.memories ?? [],
  };
}

function buildDebugPayloadNode(
  state: RetrieveGraphState,
): Partial<RetrieveGraphState> {
  return {
    debug: state.retrieval?.debug ?? [],
  };
}

const retrieveGraph = new StateGraph(RetrieveGraphStateAnnotation)
  .addNode("fetchCandidates", fetchCandidatesNode)
  .addNode("rankAndRerank", rankAndRerankNode)
  .addNode("buildDebugPayload", buildDebugPayloadNode)
  .addEdge(START, "fetchCandidates")
  .addEdge("fetchCandidates", "rankAndRerank")
  .addEdge("rankAndRerank", "buildDebugPayload")
  .addEdge("buildDebugPayload", END);

const compiledRetrieveGraph = retrieveGraph.compile();

export async function runRetrieveFlowLangGraph(
  input: RetrieveRelevantMemoryInput,
): Promise<RetrieveRelevantMemoryResult> {
  const result = await compiledRetrieveGraph.invoke({
    input,
    retrieval: null,
    ranked: [],
    debug: [],
  });

  return {
    memories: result.ranked,
    debug: result.debug,
  };
}
