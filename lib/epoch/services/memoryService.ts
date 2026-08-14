import { getEpochMemoryRecord, listEpochMemoryRecords, recordEpochMemory } from "../epochStore";

export async function summarizeMemoryService(workspaceId: string) {
  const memories = await listEpochMemoryRecords({ workspaceId });
  return {
    workspaceId,
    counts: {
      memories: memories.length,
    },
    recent: memories.slice(0, 10),
  };
}

export async function getMemoryRecord(workspaceId: string, memoryRecordId: string) {
  return getEpochMemoryRecord(workspaceId, memoryRecordId);
}

export async function recordMemory(input: Parameters<typeof recordEpochMemory>[0]) {
  return recordEpochMemory(input);
}
