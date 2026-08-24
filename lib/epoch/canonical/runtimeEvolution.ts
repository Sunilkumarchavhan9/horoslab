import { randomUUID } from "node:crypto";
import {
  AgentPolicyRevisionSchema,
  ModelRevisionSchema,
  SkillRevisionSchema,
  WorldModelSchema,
  type AgentPolicyRevision,
  type ModelRevision,
  type SkillRevision,
  type WorldModel,
} from "./contracts";
import { getCanonicalArtifact, persistCanonicalArtifact } from "./artifactStore";

type Base = { workspaceId: string; missionId?: string; correlationId: string; traceId: string; now?: Date };
function metadata(input: Base, id: string) {
  const timestamp = (input.now ?? new Date()).toISOString();
  return { contractVersion: "epoch.canonical.v1" as const, id, workspaceId: input.workspaceId, createdAt: timestamp, updatedAt: timestamp, correlation: { correlationId: input.correlationId, traceId: input.traceId } };
}
async function requireArtifact(workspaceId: string, type: string, id: string, code: string) {
  const artifact = await getCanonicalArtifact(workspaceId, type, id);
  if (!artifact) throw new Error(code);
  return artifact;
}
async function persist(input: Base, type: string, id: string, payload: Record<string, unknown>, parentId?: string) {
  return persistCanonicalArtifact({ workspaceId: input.workspaceId, objectType: type, objectId: id, missionId: input.missionId, parentId, payload, provenance: { classification: "INFERRED", source: "canonical-evolution", derivation: parentId ? [parentId] : [] }, correlationId: input.correlationId, traceId: input.traceId });
}

export async function buildModelRevision(input: Base & { modelProfileId: string; revision: string; artifactDigest: string; teachingDatasetIds?: string[]; evaluatorIds?: string[]; benchmarkIds?: string[]; lifecycle: ModelRevision["lifecycle"]; lineage?: string[] }): Promise<ModelRevision> {
  return ModelRevisionSchema.parse({ ...metadata(input, `model_revision_${randomUUID()}`), modelProfileId: input.modelProfileId, revision: input.revision, artifactDigest: input.artifactDigest, teachingDatasetIds: input.teachingDatasetIds ?? [], evaluatorIds: input.evaluatorIds ?? [], benchmarkIds: input.benchmarkIds ?? [], lifecycle: input.lifecycle, lineage: input.lineage ?? [input.modelProfileId] });
}
export async function persistModelRevision(input: Parameters<typeof buildModelRevision>[0]) {
  await requireArtifact(input.workspaceId, "ModelProfile", input.modelProfileId, "MODEL_PROFILE_NOT_FOUND");
  const value = await buildModelRevision(input); await persist(input, "ModelRevision", value.id, value, input.modelProfileId); return value;
}

export async function buildSkillRevision(input: Base & { skillId: string; version: string; teachingDatasetIds?: string[]; benchmarkIds?: string[]; lifecycle: SkillRevision["lifecycle"]; lineage?: string[] }): Promise<SkillRevision> {
  return SkillRevisionSchema.parse({ ...metadata(input, `skill_revision_${randomUUID()}`), skillId: input.skillId, version: input.version, teachingDatasetIds: input.teachingDatasetIds ?? [], benchmarkIds: input.benchmarkIds ?? [], lifecycle: input.lifecycle, lineage: input.lineage ?? [input.skillId] });
}
export async function persistSkillRevision(input: Parameters<typeof buildSkillRevision>[0]) {
  const value = await buildSkillRevision(input); await persist(input, "SkillRevision", value.id, value, input.skillId); return value;
}

export async function buildAgentPolicyRevision(input: Base & { agentId: string; version: string; teachingDatasetIds?: string[]; benchmarkIds?: string[]; lifecycle: AgentPolicyRevision["lifecycle"]; lineage?: string[] }): Promise<AgentPolicyRevision> {
  return AgentPolicyRevisionSchema.parse({ ...metadata(input, `agent_policy_revision_${randomUUID()}`), agentId: input.agentId, version: input.version, teachingDatasetIds: input.teachingDatasetIds ?? [], benchmarkIds: input.benchmarkIds ?? [], lifecycle: input.lifecycle, lineage: input.lineage ?? [input.agentId] });
}
export async function persistAgentPolicyRevision(input: Parameters<typeof buildAgentPolicyRevision>[0]) {
  const value = await buildAgentPolicyRevision(input); await persist(input, "AgentPolicyRevision", value.id, value, input.agentId); return value;
}

export async function buildWorldModel(input: Base & { environmentId: string; version: string; entityIds: string[]; observationIds: string[]; dynamics: Record<string, unknown>; predictionHorizonSeconds?: number; lifecycle: WorldModel["lifecycle"]; lineage?: string[] }): Promise<WorldModel> {
  return WorldModelSchema.parse({ ...metadata(input, `world_model_${randomUUID()}`), environmentId: input.environmentId, version: input.version, entityIds: input.entityIds, observationIds: input.observationIds, dynamics: input.dynamics, predictionHorizonSeconds: input.predictionHorizonSeconds, lifecycle: input.lifecycle, lineage: input.lineage ?? [input.environmentId, ...input.observationIds] });
}
export async function persistWorldModel(input: Parameters<typeof buildWorldModel>[0]) {
  const value = await buildWorldModel(input); await persist(input, "WorldModel", value.id, value, input.environmentId); return value;
}
