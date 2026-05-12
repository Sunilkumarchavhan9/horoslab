import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  planContinuity,
  type ContinuityPlannerInput,
  type ContinuityPlannerResult,
} from "../memory/continuityPlanner";
import { getWorkflowStateAdapter } from "../adapters/workflowStateAdapter";

type ContinueFlowInput = ContinuityPlannerInput & {
  workspace?: string;
  project?: string;
  threadId?: string;
  omitNullPreviousCheckpoint?: boolean;
};

const ContinueGraphStateAnnotation = Annotation.Root({
  input: Annotation<ContinueFlowInput>,
  previousCheckpoint: Annotation<Record<string, unknown> | null>,
  result: Annotation<ContinuityPlannerResult | null>,
});

type ContinueGraphState = typeof ContinueGraphStateAnnotation.State;

async function runPlannerNode(
  state: ContinueGraphState,
): Promise<Partial<ContinueGraphState>> {
  const shouldOmitNullCheckpoint =
    state.input.omitNullPreviousCheckpoint === true &&
    state.previousCheckpoint === null;

  const result = await planContinuity({
    ...state.input,
    ...(shouldOmitNullCheckpoint
      ? {}
      : { previousCheckpoint: state.previousCheckpoint }),
  });
  return { result };
}

const continueGraph = new StateGraph(ContinueGraphStateAnnotation)
  .addNode("runPlanner", runPlannerNode)
  .addEdge(START, "runPlanner")
  .addEdge("runPlanner", END);

const compiledContinueGraph = continueGraph.compile();

function buildWorkflowKey(input: ContinueFlowInput): string {
  const workspace = input.workspace ?? "default";
  const project = input.project ?? "default";
  const thread = input.threadId ?? "default";
  return `continue:${input.userId}:${workspace}:${project}:${thread}`;
}

export async function runContinueFlowLangGraph(
  input: ContinueFlowInput,
): Promise<ContinuityPlannerResult> {
  const stateAdapter = getWorkflowStateAdapter();
  const workflowKey = buildWorkflowKey(input);
  const previousCheckpoint = await stateAdapter.loadCheckpoint({ key: workflowKey });

  const result = await compiledContinueGraph.invoke({
    input,
    previousCheckpoint,
    result: null,
  });

  if (!result.result) {
    throw new Error("Continue graph returned no result");
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
