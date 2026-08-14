import type { ContextAdapter, MemoryStoreAdapter } from "./adapters";
import { SupermemoryContextAdapter } from "./supermemoryContextAdapter";
import { PrismaRuntimeMemoryStoreAdapter } from "./prismaRuntimeMemoryStoreAdapter";

let memoryStoreAdapterOverride: MemoryStoreAdapter | null = null;
let contextAdapterOverride: ContextAdapter | null = null;
let defaultContextAdapterCache: ContextAdapter | null = null;
let defaultMemoryStoreAdapterCache: MemoryStoreAdapter | null = null;

const prismaRuntimeMemoryStoreAdapter = new PrismaRuntimeMemoryStoreAdapter();

const noopContextAdapter: ContextAdapter = {
  ingestContext: async () => {},
  searchContext: async () => [],
};

function buildDefaultContextAdapter(): ContextAdapter {
  const embeddingsEnabled =
    process.env.MEMORYOS_EMBEDDINGS_ENABLED?.trim().toLowerCase() === "true";

  if (embeddingsEnabled) {
    return noopContextAdapter;
  }

  const apiKey = process.env.SUPERMEMORY_API_KEY?.trim();

  if (!apiKey) {
    return noopContextAdapter;
  }

  return new SupermemoryContextAdapter({
    apiKey,
    apiOrigin: process.env.SUPERMEMORY_BASE_URL,
    namespace: process.env.SUPERMEMORY_PROJECT,
  });
}

function buildDefaultMemoryStoreAdapter(): MemoryStoreAdapter {
  return prismaRuntimeMemoryStoreAdapter;
}

export function setMemoryStoreAdapter(adapter: MemoryStoreAdapter): void {
  memoryStoreAdapterOverride = adapter;
}

export function resetMemoryStoreAdapter(): void {
  memoryStoreAdapterOverride = null;
  defaultMemoryStoreAdapterCache = null;
}

export function getMemoryStoreAdapter(): MemoryStoreAdapter {
  if (memoryStoreAdapterOverride) {
    return memoryStoreAdapterOverride;
  }

  if (!defaultMemoryStoreAdapterCache) {
    defaultMemoryStoreAdapterCache = buildDefaultMemoryStoreAdapter();
  }

  return defaultMemoryStoreAdapterCache;
}

export function setContextAdapter(adapter: ContextAdapter): void {
  contextAdapterOverride = adapter;
}

export function resetContextAdapter(): void {
  contextAdapterOverride = null;
  defaultContextAdapterCache = null;
}

export function getContextAdapter(): ContextAdapter {
  if (contextAdapterOverride) {
    return contextAdapterOverride;
  }

  if (!defaultContextAdapterCache) {
    defaultContextAdapterCache = buildDefaultContextAdapter();
  }

  return defaultContextAdapterCache;
}
