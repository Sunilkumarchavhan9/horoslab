import type { Memory } from "../memory/types";
import { Mem0MemoryStoreAdapter } from "../adapters/mem0MemoryStoreAdapter";
import type { MemoryStoreSearchResult } from "../adapters/adapters";

export type Mem0SearchResult = MemoryStoreSearchResult;

export interface SaveMemoryInput {
  memory: Memory;
}

export interface SearchMemoryInput {
  userId: string;
  query: string;
  topK?: number;
}

export interface GetMemoryInput {
  id: string;
}

const adapter = new Mem0MemoryStoreAdapter();

export async function saveMemoryToMem0(
  input: SaveMemoryInput,
): Promise<{ id: string }> {
  return adapter.saveMemory(input);
}

export async function searchMemoryFromMem0(
  input: SearchMemoryInput,
): Promise<Mem0SearchResult[]> {
  return adapter.searchMemory(input);
}

export async function getMemoryById(
  input: GetMemoryInput,
): Promise<Mem0SearchResult | null> {
  return adapter.getMemoryById(input);
}
