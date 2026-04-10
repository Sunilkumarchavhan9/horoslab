import type { MemoryStoreAdapter } from "./adapters";
import * as mem0Compat from "../integrations/mem0";

let memoryStoreAdapterOverride: MemoryStoreAdapter | null = null;

const compatibilityMemoryStoreAdapter: MemoryStoreAdapter = {
  saveMemory: async (input) => mem0Compat.saveMemoryToMem0(input),
  searchMemory: async (input) => mem0Compat.searchMemoryFromMem0(input),
  getMemoryById: async (input) => mem0Compat.getMemoryById(input),
};

export function setMemoryStoreAdapter(adapter: MemoryStoreAdapter): void {
  memoryStoreAdapterOverride = adapter;
}

export function resetMemoryStoreAdapter(): void {
  memoryStoreAdapterOverride = null;
}

export function getMemoryStoreAdapter(): MemoryStoreAdapter {
  return memoryStoreAdapterOverride ?? compatibilityMemoryStoreAdapter;
}
