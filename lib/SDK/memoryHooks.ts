import { runIngestFlowLangGraph } from "../workflows/ingestGraphLangGraph";
import { runResumeFlowLangGraph } from "../workflows/resumeGraphLangGraph";
import { runRetrieveFlowLangGraph } from "../workflows/retrieveGraphLangGraph";

export interface BeforeModelInput {
  userId: string;
  question: string;
  workspace?: string;
  project?: string;
  threadId?: string;
  mode?: "retrieve" | "resume";
  topK?: number;
  includeArchived?: boolean;
}

export interface BeforeModelResult {
  contextText: string;
  memories: Array<{
    id: string;
    content?: string;
    memoryType?: string;
    finalScore: number;
    updatedAt?: string;
  }>;
  source: "retrieve" | "resume";
}

export interface AfterModelInput {
  userId: string;
  message?: string;
  threadId?: string;
  modelResponse?: string;
  contract?: {
    goal?: string;
    constraints?: string[];
    decisions?: string[];
    open_risks?: string[];
    next_actions?: string[];
  };
  enforceContract?: boolean;
}

export interface AfterModelResult {
  acceptedCount: number;
  rejectedCount: number;
  contractFieldCount?: number;
}

function buildContextText(
  memories: Array<{
    id: string;
    memory?: string;
    content?: string;
    memoryType?: string;
  }>,
): string {
  if (memories.length === 0) {
    return "";
  }

  return memories
    .map((memory, index) => {
      const content = memory.memory ?? memory.content ?? "No content";
      const type = memory.memoryType ?? "general";
      return `${index + 1}. [${type}] ${content}`;
    })
    .join("\n");
}

export async function beforeModel(
  input: BeforeModelInput,
): Promise<BeforeModelResult> {
  if (input.mode === "resume" && input.project) {
    const result = await runResumeFlowLangGraph({
      userId: input.userId,
      project: input.project,
      question: input.question,
      topK: input.topK,
      includeArchived: input.includeArchived,
      ...(input.workspace ? { workspace: input.workspace } : {}),
      ...(input.threadId ? { threadId: input.threadId } : {}),
    });

    return {
      contextText: [result.summary, result.lastKnownState, ...result.openLoops]
        .filter(Boolean)
        .join("\n"),
      memories: result.usedMemories.map((memory) => ({
        id: memory.id,
        content: memory.content,
        memoryType: memory.memoryType,
        finalScore: memory.finalScore,
        updatedAt: memory.updatedAt,
      })),
      source: "resume",
    };
  }

  const result = await runRetrieveFlowLangGraph({
    userId: input.userId,
    question: input.question,
    topK: input.topK,
    includeArchived: input.includeArchived,
    ...(input.workspace ? { workspace: input.workspace } : {}),
    ...(input.project ? { project: input.project } : {}),
    ...(input.threadId ? { threadId: input.threadId } : {}),
  });

  return {
    contextText: buildContextText(result.memories),
    memories: result.memories.map((memory) => ({
      id: memory.id,
      content: memory.memory,
      memoryType: memory.memoryType,
      finalScore: memory.finalScore,
      updatedAt: memory.updatedAt,
    })),
    source: "retrieve",
  };
}

export async function afterModel(
  input: AfterModelInput,
): Promise<AfterModelResult> {
  const normalizedMessage = typeof input.message === "string" ? input.message.trim() : "";
  const hasMessage = normalizedMessage.length > 0;
  const hasContract = Boolean(input.contract);
  if (!hasMessage && !hasContract) {
    throw new Error("afterModel requires either a non-empty message or a memory contract.");
  }

  const combinedMessage = hasMessage
    ? input.modelResponse
      ? `User: ${normalizedMessage}\nAssistant: ${input.modelResponse}`
      : normalizedMessage
    : "";

  const result = await runIngestFlowLangGraph({
    userId: input.userId,
    threadId: input.threadId,
    message: combinedMessage || JSON.stringify(input.contract ?? {}),
  });

  const contract = input.contract;
  const contractFieldCount =
    (contract?.goal ? 1 : 0) +
    ((contract?.constraints?.length ?? 0) > 0 ? 1 : 0) +
    ((contract?.decisions?.length ?? 0) > 0 ? 1 : 0) +
    ((contract?.open_risks?.length ?? 0) > 0 ? 1 : 0) +
    ((contract?.next_actions?.length ?? 0) > 0 ? 1 : 0);

  return {
    acceptedCount: result.acceptedMemories.length,
    rejectedCount: result.rejectedMemories.length,
    contractFieldCount: contractFieldCount > 0 ? contractFieldCount : undefined,
  };
}
