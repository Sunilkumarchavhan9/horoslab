import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  planContinuity,
  type ContinuityPlannerInput,
  type ContinuityPlannerResult,
} from "../memory/continuityPlanner";
import { getWorkflowStateAdapter } from "../adapters/workflowStateAdapter";
import type { ContinuityScope } from "../adapters/adapters";

type ContinueFlowInput = ContinuityPlannerInput & {
  workspace?: string;
  project?: string;
  threadId?: string;
  repo?: ContinuityScope["repo"];
  service?: ContinuityScope["service"];
  environment?: ContinuityScope["environment"];
  taskId?: ContinuityScope["taskId"];
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
  const { omitNullPreviousCheckpoint: _omitNullPreviousCheckpoint, ...plannerInput } =
    state.input;
  const shouldOmitNullCheckpoint =
    state.input.omitNullPreviousCheckpoint === true &&
    state.previousCheckpoint === null;

  const result = await planContinuity({
    ...plannerInput,
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
  const repo = input.repo ?? "default";
  const service = input.service ?? "default";
  const environment = input.environment ?? "default";
  const taskId = input.taskId ?? "default";
  return `continue:${input.userId}:${workspace}:${project}:${thread}:${repo}:${service}:${environment}:${taskId}`;
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
