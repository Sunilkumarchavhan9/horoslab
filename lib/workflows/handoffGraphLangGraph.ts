import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  planHandoff,
  type HandoffPlannerInput,
  type HandoffPlannerResult,
} from "../memory/handoffPlanner";
import { getWorkflowStateAdapter } from "../adapters/workflowStateAdapter";

type HandoffFlowInput = HandoffPlannerInput & {
  workspace?: string;
  threadId?: string;
};

const HandoffGraphStateAnnotation = Annotation.Root({
  input: Annotation<HandoffFlowInput>,
  previousCheckpoint: Annotation<Record<string, unknown> | null>,
  result: Annotation<HandoffPlannerResult | null>,
});

type HandoffGraphState = typeof HandoffGraphStateAnnotation.State;

function pruneCheckpoint(
  checkpoint: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!checkpoint) return null;
  const result = checkpoint.result;
  if (!result || typeof result !== "object") return null;
  return { result };
}

async function runPlannerNode(
  state: HandoffGraphState,
): Promise<Partial<HandoffGraphState>> {
  const result = await planHandoff({
    ...state.input,
    previousCheckpoint: state.previousCheckpoint,
  });

  return { result };
}

const handoffGraph = new StateGraph(HandoffGraphStateAnnotation)
  .addNode("runPlanner", runPlannerNode)
  .addEdge(START, "runPlanner")
  .addEdge("runPlanner", END);

const compiledHandoffGraph = handoffGraph.compile();

function buildWorkflowKey(input: HandoffFlowInput): string {
  const workspace = input.workspace ?? "default";
  const thread = input.threadId ?? "default";
  return `handoff:${input.userId}:${workspace}:${input.project}:${thread}`;
}

export async function runHandoffFlowLangGraph(
  input: HandoffFlowInput,
): Promise<HandoffPlannerResult> {
  const stateAdapter = getWorkflowStateAdapter();
  const workflowKey = buildWorkflowKey(input);
  const previousCheckpoint = pruneCheckpoint(
    await stateAdapter.loadCheckpoint({ key: workflowKey }),
  );

  const result = await compiledHandoffGraph.invoke({
    input,
    previousCheckpoint,
    result: null,
  });

  if (!result.result) {
    throw new Error("Handoff graph returned no result");
  }

  await stateAdapter.saveCheckpoint({
    key: workflowKey,
    state: {
      updatedAt: new Date().toISOString(),
      input,
      result: result.result,
    },
  });

  return result.result;
}
