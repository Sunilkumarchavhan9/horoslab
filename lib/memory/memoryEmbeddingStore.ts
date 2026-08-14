import { resolveRequestOrgId } from "../auth/orgScope";
import {
  deleteMemoryEmbeddingFromDb,
  getMemoryEmbeddingFromDb,
  listMemoryEmbeddingsFromDb,
  upsertMemoryEmbeddingInDb,
} from "../storage/runtimeStoreDb";
import { getEmbeddingModel } from "./embeddings";

export interface StoredMemoryEmbedding {
  userId: string;
  memoryId: string;
  model: string;
  embedding: number[];
  updatedAt: string;
}

function toStoredEmbedding(input: {
  userId: string;
  memoryId: string;
  embedding: number[];
  model?: string;
  updatedAt?: string;
}): StoredMemoryEmbedding {
  return {
    userId: input.userId,
    memoryId: input.memoryId,
    model: input.model ?? getEmbeddingModel(),
    embedding: input.embedding,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export async function upsertMemoryEmbedding(input: {
  userId: string;
  memoryId: string;
  embedding: number[];
  orgId?: string;
  model?: string;
}): Promise<void> {
  if (input.embedding.length === 0) {
    return;
  }

  const scopedOrgId = resolveRequestOrgId(input.orgId);
  await upsertMemoryEmbeddingInDb(toStoredEmbedding(input), scopedOrgId);
}

export async function getMemoryEmbedding(input: {
  userId: string;
  memoryId: string;
  orgId?: string;
}): Promise<StoredMemoryEmbedding | null> {
  const scopedOrgId = resolveRequestOrgId(input.orgId);
  return getMemoryEmbeddingFromDb(input.userId, input.memoryId, scopedOrgId);
}

export async function listMemoryEmbeddings(
  userId: string,
  orgId?: string,
): Promise<StoredMemoryEmbedding[]> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  return listMemoryEmbeddingsFromDb(userId, scopedOrgId);
}

export async function deleteMemoryEmbedding(input: {
  userId: string;
  memoryId: string;
  orgId?: string;
}): Promise<void> {
  const scopedOrgId = resolveRequestOrgId(input.orgId);
  await deleteMemoryEmbeddingFromDb(input.userId, input.memoryId, scopedOrgId);
}
