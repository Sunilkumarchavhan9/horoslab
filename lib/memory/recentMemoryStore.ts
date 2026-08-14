import type { Memory } from "./types";
import { resolveRequestOrgId } from "../auth/orgScope";
import {
  listRecentMemoriesFromDb,
  upsertRecentMemoryInDb,
} from "../storage/runtimeStoreDb";

const MAX_RECENT_MEMORIES_PER_USER = 1000;

export async function getRecentMemories(
  userId: string,
  orgId?: string,
): Promise<Memory[]> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  return listRecentMemoriesFromDb(userId, scopedOrgId);
}

export async function upsertRecentMemory(
  memory: Memory,
  orgId?: string,
): Promise<void> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  await upsertRecentMemoryInDb(
    memory,
    MAX_RECENT_MEMORIES_PER_USER,
    scopedOrgId,
  );
}

export async function listRecentMemories(
  userId?: string,
  orgId?: string,
): Promise<Memory[]> {
  const scopedOrgId = resolveRequestOrgId(orgId);
  return listRecentMemoriesFromDb(userId, scopedOrgId);
}
