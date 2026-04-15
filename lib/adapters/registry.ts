import type { ContextAdapter, MemoryStoreAdapter } from "./adapters";
import * as mem0Compat from "../integrations/mem0";
import { SupermemoryContextAdapter } from "./supermemoryContextAdapter";

let memoryStoreAdapterOverride: MemoryStoreAdapter | null = null;
let contextAdapterOverride: ContextAdapter | null = null;
let defaultContextAdapterCache: ContextAdapter | null = null;

const compatibilityMemoryStoreAdapter: MemoryStoreAdapter = {
  saveMemory: async (input) => mem0Compat.saveMemoryToMem0(input),
  searchMemory: async (input) => mem0Compat.searchMemoryFromMem0(input),
  getMemoryById: async (input) => mem0Compat.getMemoryById(input),
};

const noopContextAdapter: ContextAdapter = {
  ingestContext: async () => {},
  searchContext: async () => [],
};

function buildDefaultContextAdapter(): ContextAdapter {
  const apiKey = process.env.SUPERMEMORY_API_KEY;

  if (!apiKey) {
    return noopContextAdapter;
  }

  return new SupermemoryContextAdapter({
    apiKey,
    apiOrigin: process.env.SUPERMEMORY_BASE_URL,
    namespace: process.env.SUPERMEMORY_PROJECT,
  });
}

export function setMemoryStoreAdapter(adapter: MemoryStoreAdapter): void {
  memoryStoreAdapterOverride = adapter;
}

export function resetMemoryStoreAdapter(): void {
  memoryStoreAdapterOverride = null;
}

export function getMemoryStoreAdapter(): MemoryStoreAdapter {
  return memoryStoreAdapterOverride ?? compatibilityMemoryStoreAdapter;
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
