import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  planResume,
  type ResumePlannerInput,
  type ResumePlannerResult,
} from "../memory/resumePlanner";
import { getWorkflowStateAdapter } from "../adapters/workflowStateAdapter";

type ResumeFlowInput = ResumePlannerInput & {
  workspace?: string;
  threadId?: string;
};

const ResumeGraphStateAnnotation = Annotation.Root({
  input: Annotation<ResumeFlowInput>,
  previousCheckpoint: Annotation<Record<string, unknown> | null>,
  result: Annotation<ResumePlannerResult | null>,
});


type ResumeGraphState = typeof ResumeGraphStateAnnotation.State;

async function runPlannerNode(
  state: ResumeGraphState,
): Promise<Partial<ResumeGraphState>> {
  const result = await planResume({
    ...state.input,
    previousCheckpoint: state.previousCheckpoint
  });
  return { result };
}

const resumeGraph = new StateGraph(ResumeGraphStateAnnotation)
  .addNode("runPlanner", runPlannerNode)
  .addEdge(START, "runPlanner")
  .addEdge("runPlanner", END);

const compiledResumeGraph = resumeGraph.compile();

function buildWorkflowKey(input: ResumeFlowInput): string {
  const workspace = input.workspace ?? "default";
  const thread = input.threadId ?? "default";
  return `resume:${input.userId}:${workspace}:${input.project}:${thread}`;
}

export async function runResumeFlowLangGraph(
  input: ResumeFlowInput,
): Promise<ResumePlannerResult> {
  const stateAdapter = getWorkflowStateAdapter();
  const workflowKey = buildWorkflowKey(input);
  const previousCheckpoint = await stateAdapter.loadCheckpoint({ key: workflowKey });

  const result = await compiledResumeGraph.invoke({
    input,
    previousCheckpoint,
    result: null,
  });

  if (!result.result) {
    throw new Error("Resume graph returned no result");
  }

  await stateAdapter.saveCheckpoint({
    key: workflowKey,
    state: {
      updatedAt: new Date().toISOString(),
      input,
      previousCheckpoint,
      result: result.result,
    },
  });

  return result.result;
}