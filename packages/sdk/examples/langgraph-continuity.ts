import { createMemoryOSClient } from "@memoryostm/sdk";

type GraphState = {
  threadId: string;
  project: string;
  userMessage: string;
  modelResponse?: string;
  memoryContext?: string;
};

const memory = createMemoryOSClient({
  apiKey: process.env.MEMORYOS_API_KEY!,
  baseUrl: process.env.MEMORYOS_BASE_URL ?? "http://localhost:3001",
});

export async function loadContinuity(state: GraphState): Promise<Partial<GraphState>> {
  const context = await memory.beforeModel({
    mode: "resume",
    project: state.project,
    threadId: state.threadId,
    question: state.userMessage,
    topK: 5,
  });

  return {
    memoryContext: context.contextText,
  };
}

export async function persistTurn(state: GraphState): Promise<Partial<GraphState>> {
  await memory.afterModel({
    threadId: state.threadId,
    message: state.userMessage,
    modelResponse: state.modelResponse,
  });

  return {};
}

async function demo() {
  const state: GraphState = {
    threadId: "week2-langgraph-demo",
    project: "MemoryOS",
    userMessage: "What should this graph node do next?",
  };

  const continuity = await loadContinuity(state);
  console.log("Loaded continuity:", continuity.memoryContext || "(none yet)");

  await persistTurn({
    ...state,
    modelResponse: "Use MemoryOS before model calls and persist useful context after model calls.",
  });
}

demo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
