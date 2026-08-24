import { ExecutionSchema, type Execution } from "./contracts";
import { getCanonicalArtifact, persistCanonicalArtifact } from "./artifactStore";

const transitions: Record<Execution["state"], Execution["state"][]> = {
  prepared: ["approved", "blocked"], approved: ["executing", "blocked"], executing: ["completed", "failed", "compensating"],
  completed: [], failed: ["compensating", "rolled_back"], compensating: ["rolled_back", "failed"], rolled_back: [], blocked: ["approved"],
};

export async function transitionCanonicalExecution(input: { workspaceId: string; missionId: string; executionId: string; nextState: Execution["state"]; correlationId: string; traceId: string; evidenceIds?: string[]; reason?: string }) {
  const current = await getCanonicalArtifact(input.workspaceId, "Execution", input.executionId);
  if (!current || current.missionId !== input.missionId) throw new Error("EXECUTION_NOT_FOUND");
  const execution = ExecutionSchema.parse(current.payload);
  if (!transitions[execution.state].includes(input.nextState)) throw new Error(`INVALID_EXECUTION_TRANSITION:${execution.state}->${input.nextState}`);
  if (input.nextState === "completed" && (!input.evidenceIds || input.evidenceIds.length === 0)) throw new Error("COMPLETION_EVIDENCE_REQUIRED");
  if (input.evidenceIds?.length) {
    const evidence = await Promise.all(input.evidenceIds.map((id) => getCanonicalArtifact(input.workspaceId, "Evidence", id)));
    if (evidence.some((item) => !item || item.missionId !== input.missionId)) throw new Error("EXECUTION_EVIDENCE_NOT_FOUND");
  }
  const version = current.version + 1;
  const updated = ExecutionSchema.parse({ ...execution, updatedAt: new Date().toISOString(), state: input.nextState, evidenceRequirements: input.evidenceIds ?? execution.evidenceRequirements });
  const artifact = await persistCanonicalArtifact({ workspaceId: input.workspaceId, objectType: "Execution", objectId: execution.id, missionId: input.missionId, parentId: current.id, version, payload: updated, provenance: { classification: input.nextState === "completed" ? "OBSERVED" : "INFERRED", source: "canonical-execution-runtime", derivation: [current.id, ...(input.evidenceIds ?? [])], reason: input.reason ?? null }, correlationId: input.correlationId, traceId: input.traceId, causationId: current.id });
  return { execution: updated, artifact, previousState: execution.state, nextState: input.nextState };
}
