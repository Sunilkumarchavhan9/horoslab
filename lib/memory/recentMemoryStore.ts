 import type { Memory } from "./types";

const recentMemoryStore = new Map<string, Memory[]>();
const MAX_RECENT_MEMORIES_PER_USER = 20;

export function getRecentMemories(userId: string): Memory[] {
  // TODO:
  // return that user's memories or []
  return recentMemoryStore.get(userId) ?? [];
}

export function upsertRecentMemory(memory: Memory): void {
  // TODO:
  // 1. get current list
  // 2. find same id
  // 3. replace if found
  // 4. append if not found
  // 5. keep last MAX_RECENT_MEMORIES_PER_USER
  // 6. save back to map

  const current = recentMemoryStore.get(memory.userId) ?? [];
  const existingIndex = current.findIndex((item) =>  item.id === memory.id)
  
  let next: Memory[];

  if(existingIndex !== -1){
    next = [...current];
    next[existingIndex] = memory;
  }else{
    next = [...current, memory];
  }
  const trimmed = next.slice(-MAX_RECENT_MEMORIES_PER_USER);
  recentMemoryStore.set(memory.userId, trimmed);
}


export function listRecentMemories(): Memory[] {
  // TODO:
  // flatten all map values
 return Array.from(recentMemoryStore.values()).flat();
}
