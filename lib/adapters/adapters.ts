import type { Memory } from "../memory/types";

export interface MemoryStoreSearchResult {
  id: string;
  score?: number;
  memory?: string;
  metadata?: Record<string, unknown>;
}

export interface ContinuityScope {
  workspace?: string;
  project?: string;
  threadId?: string;
}

export interface MemoryStoreAdapter {
  saveMemory(input: { memory: Memory }): Promise<{ id: string }>;
  searchMemory(input: {
    userId: string;
    query: string;
    topK?: number;
  }): Promise<MemoryStoreSearchResult[]>;
  getMemoryById(input: { id: string }): Promise<MemoryStoreSearchResult | null>;
}

export interface ContextAdapter {
  ingestContext(input: {
    userId: string;
    source: string;
    payload: unknown;
  } & ContinuityScope): Promise<void>;
  searchContext(input: {
    userId: string;
    query: string;
    topK?: number;
  } & ContinuityScope): Promise<ContextSearchResult[]>;
}

export interface ContextSearchResult {
  id: string;
  score?: number;
  content?: string;
  metadata?: Record<string, unknown>;
  source?: string;
}

export interface WorkflowStateAdapter {
  saveCheckpoint(input: {
    key: string;
    state: Record<string, unknown>;
  }): Promise<void>;
  loadCheckpoint(input: { key: string }): Promise<Record<string, unknown> | null>;
}
