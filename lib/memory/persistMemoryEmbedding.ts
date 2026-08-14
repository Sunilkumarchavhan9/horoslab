import { embedText, getEmbeddingModel, isEmbeddingsEnabled } from "./embeddings";
import { upsertMemoryEmbedding } from "./memoryEmbeddingStore";
import type { Memory } from "./types";

export function scheduleMemoryEmbedding(memory: Memory, orgId?: string): void {
  if (!isEmbeddingsEnabled()) {
    return;
  }

  const text = memory.content?.trim();
  if (!text) {
    return;
  }

  void persistMemoryEmbedding(memory, orgId).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(
      `[memory.embeddings] failed to persist embedding for memory=${memory.id} user=${memory.userId}: ${message}`,
    );
  });
}

export async function persistMemoryEmbedding(
  memory: Memory,
  orgId?: string,
): Promise<void> {
  if (!isEmbeddingsEnabled()) {
    return;
  }

  const text = memory.content?.trim();
  if (!text) {
    return;
  }

  const embedding = await embedText(text);
  if (!embedding || embedding.length === 0) {
    return;
  }

  await upsertMemoryEmbedding({
    userId: memory.userId,
    memoryId: memory.id,
    embedding,
    orgId,
    model: getEmbeddingModel(),
  });
}
