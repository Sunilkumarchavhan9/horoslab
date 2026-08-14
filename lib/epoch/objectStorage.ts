import { getEpochArtifactById, saveEpochArtifact, type EpochArtifactData, type EpochArtifactRecord } from "./epochArtifacts";

export type EpochObjectStorage = {
  put(input: { workspaceId: string; missionId?: string; name: string; category: EpochArtifactData["category"]; payload: Record<string, unknown>; expiresAt?: string }): Promise<EpochArtifactRecord>;
  get(input: { workspaceId: string; artifactId: string }): Promise<EpochArtifactRecord | null>;
};

/** Storage boundary over the canonical Epoch artifact store; implementations must not create a second evidence store. */
export const epochObjectStorage: EpochObjectStorage = {
  put: (input) => saveEpochArtifact({ ...input, proof: { storage: "epoch_artifact_store.v1" } }),
  get: getEpochArtifactById,
};
