import type { ContextAdapter, MemoryStoreAdapter } from "./adapters";
import * as mem0Compat from "../integrations/mem0";
import { SupermemoryContextAdapter } from "./supermemoryContextAdapter";
import { LocalMemoryStoreAdapter } from "./localMemoryStoreAdapter";

let memoryStoreAdapterOverride: MemoryStoreAdapter | null = null;
let contextAdapterOverride: ContextAdapter | null = null;
let defaultContextAdapterCache: ContextAdapter | null = null;
let defaultMemoryStoreAdapterCache: MemoryStoreAdapter | null = null;

const compatibilityMemoryStoreAdapter: MemoryStoreAdapter = {
  saveMemory: async (input) => mem0Compat.saveMemoryToMem0(input),
  searchMemory: async (input) => mem0Compat.searchMemoryFromMem0(input),
  getMemoryById: async (input) => mem0Compat.getMemoryById(input),
};

const localMemoryStoreAdapter = new LocalMemoryStoreAdapter();

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

function buildDefaultMemoryStoreAdapter(): MemoryStoreAdapter {
  const preferred = process.env.MEMORY_STORE_PROVIDER?.trim().toLowerCase();

  if (preferred === "local") {
    return localMemoryStoreAdapter;
  }

  if (preferred === "mem0") {
    return compatibilityMemoryStoreAdapter;
  }

  // Default to Mem0 when key is configured.
  if (process.env.MEM0_API_KEY) {
    return compatibilityMemoryStoreAdapter;
  }

  // Fallback to local adapter when Mem0 is not configured.
  return localMemoryStoreAdapter;
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
