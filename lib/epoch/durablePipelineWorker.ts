import { executeEpochPipeline, type EpochPipelineValue } from "./pipelineExecution";
import type { EpochPipelineNode } from "./pipelineCompiler";
import { executeEpochTask, type EpochTaskFamily } from "./taskExecutionAdapters";
import { buildEpochPipelineCheckpoint, persistEpochPipelineCheckpoint, createEpochPipelinePersistenceHandler, loadEpochPipelineCheckpoint } from "./pipelineExecutionPersistence";
import type { EpochQueueJob } from "./epochQueue";
import { isEpochFailureInjected } from "./failureInjection";

const TASKS = new Set<EpochTaskFamily>(["text-generation", "embedding", "reranking", "vision", "ocr", "speech", "text-to-speech", "image-generation", "video"]);
function taskFor(node: EpochPipelineNode, requested: unknown): EpochTaskFamily {
  const value = typeof requested === "string" && TASKS.has(requested as EpochTaskFamily) ? requested as EpochTaskFamily : node.kind as EpochTaskFamily;
  if (!TASKS.has(value)) throw new Error(`pipeline_unsupported_task:${node.kind}`);
  return value;
}
function payloadRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }

/** Executes a serialized pipeline job with durable event checkpoints. */
export async function processEpochPipelineJob(input: { workspaceId: string; missionId: string; job: EpochQueueJob }) {
  const payload = payloadRecord(input.job.payload);
  const pipeline = payload.pipeline && typeof payload.pipeline === "object" ? payload.pipeline as { nodes?: EpochPipelineNode[]; edges?: unknown[]; inputs?: string[]; outputs?: string[] } : null;
  if (!pipeline || !Array.isArray(pipeline.nodes) || !Array.isArray(pipeline.edges)) throw new Error("epoch_pipeline_job_missing_pipeline");
  const model = typeof payload.model === "string" ? payload.model : "";
  if (!model) throw new Error("epoch_pipeline_job_missing_model");
  const target = typeof payload.target === "string" ? payload.target : "vllm";
  const endpointEnvVar = typeof payload.endpointEnvVar === "string" ? payload.endpointEnvVar : `EPOCH_RUNTIME_${target.toUpperCase()}_ENDPOINT`;
  const runId = typeof payload.runId === "string" ? payload.runId : input.job.id;
  const prior = await loadEpochPipelineCheckpoint({ workspaceId: input.workspaceId, missionId: input.missionId, runId });
  const completed: Record<string, EpochPipelineValue> = {};
  for (const event of prior?.events ?? []) {
    if (event.type === "node_completed" && event.nodeId && event.payload.output && typeof event.payload.output === "object" && !Array.isArray(event.payload.output)) completed[event.nodeId] = event.payload.output as EpochPipelineValue;
  }
  const persistence = createEpochPipelinePersistenceHandler({ workspaceId: input.workspaceId, missionId: input.missionId, runId, startingSequence: prior?.events?.length ?? 0 });
  const executors: Record<string, (context: any) => Promise<{ output: EpochPipelineValue }>> = {};
  for (const node of pipeline.nodes) {
    executors[node.id] = async (context) => {
      const injected = typeof payload.failureInjection === "string" ? payload.failureInjection : undefined;
      if (injected === "pipeline_runtime_crash" || isEpochFailureInjected("pipeline_runtime_crash")) throw new Error("worker_lost:injected_runtime_crash");
      if (injected === "pipeline_oom" || isEpochFailureInjected("pipeline_oom")) throw new Error("out_of_memory:injected_oom");
      if (injected === "pipeline_timeout" || isEpochFailureInjected("pipeline_timeout")) throw new Error("timeout:injected_timeout");
      if (injected === "pipeline_sandbox_failure" || isEpochFailureInjected("pipeline_sandbox_failure")) throw new Error("sandbox_failure:injected_sandbox_failure");
      const task = taskFor(node, payload.task);
      const values = Object.values(context.input);
      const taskInput = values.length === 1 ? values[0] : context.input;
      const result = await executeEpochTask({ target: target as any, endpointEnvVar, task, model, input: taskInput, maxOutputTokens: typeof payload.maxOutputTokens === "number" ? payload.maxOutputTokens : 128, signal: context.signal });
      if (result.status !== "OBSERVED") throw new Error(result.validation.reasons.join(",") || `pipeline_runtime_${result.status.toLowerCase()}`);
      const outputKey = node.output[0] ?? "output";
      return { output: { [outputKey]: result.output, ...(node.output.slice(1).length ? { metadata: { latencyMs: result.latencyMs, endpoint: result.endpoint } } : {}) } };
    };
  }
  const execution = await executeEpochPipeline({ pipeline: pipeline as any, input: payload.input && typeof payload.input === "object" ? payload.input as EpochPipelineValue : {}, executors, timeoutMs: typeof payload.timeoutMs === "number" ? payload.timeoutMs : undefined, runId, resume: { completed }, onEvent: persistence });
  await persistEpochPipelineCheckpoint({ workspaceId: input.workspaceId, missionId: input.missionId, checkpoint: buildEpochPipelineCheckpoint({ runId, sequence: execution.events.length + 1, execution, status: execution.status }) });
  return execution;
}
