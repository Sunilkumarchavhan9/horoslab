import { ExecutionSchema } from "./contracts";
import { getCanonicalArtifact } from "./artifactStore";
import { executeEpochRuntimeAdapter, type EpochRuntimeExecution } from "../runtimeAdapters";
import { persistCanonicalEvidence } from "./learningRuntime";
import { transitionCanonicalExecution } from "./executionRuntime";

type RuntimeTarget = { runtimeTarget: "vllm" | "sglang" | "nvidia_nim"; endpointEnvVar: string; tokenEnvVar?: string; model: string; prompt: string; maxOutputTokens: number };

export async function executeCanonicalRuntimeAction(input: { workspaceId: string; missionId: string; executionId: string; correlationId: string; traceId: string }): Promise<{ execution: EpochRuntimeExecution; evidence: Awaited<ReturnType<typeof persistCanonicalEvidence>>; transition: unknown }> {
  const artifact = await getCanonicalArtifact(input.workspaceId, "Execution", input.executionId);
  if (!artifact || artifact.missionId !== input.missionId) throw new Error("EXECUTION_NOT_FOUND");
  const canonical = ExecutionSchema.parse(artifact.payload);
  if (canonical.state !== "approved") throw new Error(`RUNTIME_EXECUTION_REQUIRES_APPROVED_EXECUTION:${canonical.state}`);
  const target = canonical.target as RuntimeTarget;
  const required: Array<keyof RuntimeTarget> = ["runtimeTarget", "endpointEnvVar", "model", "prompt", "maxOutputTokens"];
  if (required.some((key) => target[key] === undefined || target[key] === null || target[key] === "")) throw new Error("RUNTIME_EXECUTION_TARGET_INCOMPLETE");
  await transitionCanonicalExecution({ ...input, nextState: "executing" });
  try {
    const execution = await executeEpochRuntimeAdapter({ target: target.runtimeTarget, endpointEnvVar: target.endpointEnvVar, ...(target.tokenEnvVar ? { tokenEnvVar: target.tokenEnvVar } : {}), model: target.model, prompt: target.prompt, maxOutputTokens: target.maxOutputTokens });
    const evidence = await persistCanonicalEvidence({ workspaceId: input.workspaceId, missionId: input.missionId, executionId: input.executionId, type: "metric", uri: `runtime://${target.runtimeTarget}/${input.executionId}`, summary: "Runtime adapter execution result", payload: execution, classification: "MEASURED", confidence: 1, correlationId: input.correlationId, traceId: input.traceId });
    const transition = await transitionCanonicalExecution({ ...input, nextState: "completed", evidenceIds: [evidence.id], reason: "runtime_adapter_completed" });
    return { execution, evidence, transition };
  } catch (error) {
    await transitionCanonicalExecution({ ...input, nextState: "failed", reason: error instanceof Error ? error.message : "runtime_adapter_failed" }).catch(() => undefined);
    throw error;
  }
}
