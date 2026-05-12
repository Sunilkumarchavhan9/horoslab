type ChatCompletionInput = {
  userId: string;
  message: string;
  sessionId?: string;
  threadId?: string;
  workspace?: string;
  project?: string;
  agentId?: string;
  modelName?: string;
  mode?: string;
  injectedProjectState?: {
    systemGoal?: string;
    activeConstraints?: string[];
    preferences?: string[];
    executionPlan?: string[];
    missingInfo?: string[];
  };
};

type ProjectState = {
  systemGoal?: string;
  activeConstraints: string[];
  preferences: string[];
  executionPlan: string[];
  missingInfo: string[];
};

type ChatCompletionResult = {
  reply: string;
  projectState: ProjectState;
  mutations: string[];
};

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function generateMemoryAwareResponse(
  input: ChatCompletionInput,
): Promise<ChatCompletionResult> {
  const projectState: ProjectState = {
    systemGoal: input.injectedProjectState?.systemGoal,
    activeConstraints: toStringList(input.injectedProjectState?.activeConstraints),
    preferences: toStringList(input.injectedProjectState?.preferences),
    executionPlan: toStringList(input.injectedProjectState?.executionPlan),
    missingInfo: toStringList(input.injectedProjectState?.missingInfo),
  };

  const fallbackReply =
    input.message.trim().length > 0
      ? `Acknowledged: ${input.message.trim()}`
      : "Acknowledged.";

  return {
    reply: fallbackReply,
    projectState,
    mutations: [],
  };
}
