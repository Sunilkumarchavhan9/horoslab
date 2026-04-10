import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  planResume,
  type ResumePlannerInput,
  type ResumePlannerResult,
} from "../memory/resumePlanner";

const ResumeGraphStateAnnotation = Annotation.Root({
  input: Annotation<ResumePlannerInput>,
  result: Annotation<ResumePlannerResult | null>,
});

type ResumeGraphState = typeof ResumeGraphStateAnnotation.State;

async function runPlannerNode(
  state: ResumeGraphState,
): Promise<Partial<ResumeGraphState>> {
  const result = await planResume(state.input);
  return { result };
}

const resumeGraph = new StateGraph(ResumeGraphStateAnnotation)
  .addNode("runPlanner", runPlannerNode)
  .addEdge(START, "runPlanner")
  .addEdge("runPlanner", END);

const compiledResumeGraph = resumeGraph.compile();

export async function runResumeFlowLangGraph(
  input: ResumePlannerInput,
): Promise<ResumePlannerResult> {
  const result = await compiledResumeGraph.invoke({
    input,
    result: null,
  });

  if (!result.result) {
    throw new Error("Resume graph returned no result");
  }

  return result.result;
}
