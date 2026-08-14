import { prisma } from "../storage/prismaClient";
import { emitEpochRuntimeEvent } from "./epochEvents";
import { streamEpochAi, type EpochAiCompletionInput, type EpochAiProviderConfig } from "./aiProviders";
import type { EpochAiResponse } from "./aiRuntime";

export type EpochStreamDeltaLog = { index: number; text: string; at: string; correlationId: string; traceId: string };

export async function streamEpochAiToExecution(input: {
  workspaceId: string;
  missionId: string;
  executionId: string;
  userId: string;
  orgId?: string;
  correlationId: string;
  traceId: string;
  request: EpochAiCompletionInput;
  provider: EpochAiProviderConfig;
  signal?: AbortSignal;
  onDelta?: (delta: EpochStreamDeltaLog) => void | Promise<void>;
}): Promise<{ response: EpochAiResponse; deltas: EpochStreamDeltaLog[] }> {
  const execution = await prisma.epochExecutionRun.findFirst({ where: { id: input.executionId, workspaceId: input.workspaceId, missionId: input.missionId }, select: { id: true, logs: true } });
  if (!execution) throw new Error("epoch_stream_execution_not_found");
  const deltas: EpochStreamDeltaLog[] = [];
  const response = await streamEpochAi({ ...input.request, signal: input.signal, onDelta: (text) => {
    const delta = { index: deltas.length, text, at: new Date().toISOString(), correlationId: input.correlationId, traceId: input.traceId };
    deltas.push(delta);
    emitEpochRuntimeEvent({ userId: input.userId, orgId: input.orgId, workspaceId: input.workspaceId, kind: "epoch.execution.stream_delta", label: "AI stream delta", subjectId: input.executionId, correlationId: input.correlationId, traceId: input.traceId, payload: { missionId: input.missionId, index: delta.index, textLength: text.length } });
    return input.onDelta?.(delta);
  } }, input.provider);
  const priorLogs = Array.isArray(execution.logs) ? execution.logs : [];
  await prisma.epochExecutionRun.update({ where: { id: execution.id }, data: { logs: [...priorLogs, ...deltas.map((delta) => ({ type: "ai_stream_delta", ...delta }))] } });
  return { response, deltas };
}
