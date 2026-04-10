import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {planContinuity, type ContinuityPlannerInput, type ContinuityPlannerResult} from "../memory/continuityPlanner";

const ContinueGraphStateAnnotation = Annotation.Root({
  input: Annotation<ContinuityPlannerInput>,
  result: Annotation<ContinuityPlannerResult | null>,
});

type ContinueGraphState = typeof ContinueGraphStateAnnotation.State;

async function runPlannerNode( state: ContinueGraphState): Promise<Partial<ContinueGraphState>> {
  const result = await planContinuity(state.input);
  return { result };
}

const continueGraph = new StateGraph(ContinueGraphStateAnnotation)
  .addNode("runPlanner", runPlannerNode)
  .addEdge(START, "runPlanner")
  .addEdge("runPlanner", END);

const compiledContinueGraph = continueGraph.compile();

export async function runContinueFlowLangGraph( input: ContinuityPlannerInput): Promise<ContinuityPlannerResult> {
  const result = await compiledContinueGraph.invoke({
    input,
    result: null,
  });

  if (!result.result) {
    throw new Error("Continue graph returned no result");
  }

  return result.result;
}
