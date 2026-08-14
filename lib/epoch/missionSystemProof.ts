import { appendEpochEvidence, type EpochEvidenceInput } from "./epochStore";
import { buildEpochSystemEvidence, compileEpochExecutionPlan, type EpochCompiledExecutionPlan } from "./executionCompiler";
import type { EpochModelIntelligenceProfile } from "./modelIntelligence";
import type { EpochHardwareProfile, EpochRuntimeCompatibility, EpochRuntimeProfile } from "./runtimeIntelligence";

export type EpochMissionSystemInput = {
  profile: EpochModelIntelligenceProfile;
  runtime: EpochRuntimeProfile;
  hardware: EpochHardwareProfile;
  compatibility: EpochRuntimeCompatibility;
  executionProvider?: string;
  precision?: string;
  quantization?: string;
  batching?: number;
  concurrency?: number;
  timeoutMs?: number;
};

export function compileEpochMissionSystem(input: EpochMissionSystemInput): EpochCompiledExecutionPlan {
  return compileEpochExecutionPlan(input);
}

export function buildEpochMissionSystemEvidence(plan: EpochCompiledExecutionPlan, observed?: Record<string, unknown>): EpochEvidenceInput[] {
  const compatibility = buildEpochSystemEvidence({ plan, kind: "system_compatibility", observed });
  const execution = buildEpochSystemEvidence({ plan, kind: "system_execution", observed });
  const verification = buildEpochSystemEvidence({ plan, kind: "system_verification", observed });
  return [compatibility, execution, verification].map((item) => ({ kind: item.kind, summary: item.summary, payload: item.payload, proof: item.proof }));
}

export async function persistEpochMissionSystemProof(input: { workspaceId: string; missionId: string; userId: string; executionRunId?: string; plan: EpochCompiledExecutionPlan; observed?: Record<string, unknown> }) {
  return appendEpochEvidence({ workspaceId: input.workspaceId, missionId: input.missionId, userId: input.userId, executionRunId: input.executionRunId, evidence: buildEpochMissionSystemEvidence(input.plan, input.observed) });
}
