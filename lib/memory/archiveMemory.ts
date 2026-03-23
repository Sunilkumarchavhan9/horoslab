import { getMemoryById, saveMemoryToMem0 } from "../integrations/mem0";
import { toInternalMemory } from "../workflows/ingestShared";
import { upsertRecentMemory } from "./recentMemoryStore";
import { recordRevisionEvent } from "./revisionMemory";
import { recordMemoryArchivedEvent, recordMemoryUpdatedEvent } from "./timelineMemory";
import type { Memory, RevisionEvent, TimelineEvent } from "./types";

export type ArchiveMemoryStatus = "not_found" | "already_archived" | "archived";
export type UnarchiveMemoryStatus = "not_found" | "already_active" | "unarchived";

export interface ArchiveMemoryResult {
  status: ArchiveMemoryStatus;
  memory?: Memory;
  revisionEvent?: RevisionEvent | null;
  timelineEvent?: TimelineEvent;
}

export interface UnarchiveMemoryResult {
  status: UnarchiveMemoryStatus;
  memory?: Memory;
  revisionEvent?: RevisionEvent | null;
  timelineEvent?: TimelineEvent;
}

async function loadOwnedMemory(input: {
  memoryId: string;
  userId: string;
}): Promise<Memory | null> {
  const raw = await getMemoryById({ id: input.memoryId });
  if (!raw) {
    return null;
  }

  const owner =
    raw.metadata &&
    typeof raw.metadata === "object" &&
    typeof raw.metadata.userId === "string"
      ? raw.metadata.userId
      : undefined;

  if (owner && owner !== input.userId) {
    return null;
  }

  return toInternalMemory(raw, input.userId);
}

export async function archiveMemory(input: {
  memoryId: string;
  userId: string;
}): Promise<ArchiveMemoryResult> {
  const current = await loadOwnedMemory(input);
  if (!current) {
    return { status: "not_found" };
  }

  if (current.status === "archived") {
    return {
      status: "already_archived",
      memory: current,
    };
  }

  const archivedMemory: Memory = {
    ...current,
    status: "archived",
    updatedAt: new Date().toISOString(),
  };

  await saveMemoryToMem0({ memory: archivedMemory });
  await upsertRecentMemory(archivedMemory);

  const reason = "memory archived by user";
  const revisionEvent = await recordRevisionEvent({
    before: current,
    after: archivedMemory,
    reason,
    changedBy: "user",
  });
  const timelineEvent = await recordMemoryArchivedEvent(archivedMemory, reason);

  return {
    status: "archived",
    memory: archivedMemory,
    revisionEvent,
    timelineEvent,
  };
}

export async function unarchiveMemory(input: {
  memoryId: string;
  userId: string;
}): Promise<UnarchiveMemoryResult> {
  const current = await loadOwnedMemory(input);
  if (!current) {
    return { status: "not_found" };
  }

  if (current.status === "active") {
    return {
      status: "already_active",
      memory: current,
    };
  }

  const activeMemory: Memory = {
    ...current,
    status: "active",
    updatedAt: new Date().toISOString(),
  };

  await saveMemoryToMem0({ memory: activeMemory });
  await upsertRecentMemory(activeMemory);

  const reason = "memory unarchived by user";
  const revisionEvent = await recordRevisionEvent({
    before: current,
    after: activeMemory,
    reason,
    changedBy: "user",
  });
  const timelineEvent = await recordMemoryUpdatedEvent(activeMemory, reason);

  return {
    status: "unarchived",
    memory: activeMemory,
    revisionEvent,
    timelineEvent,
  };
}
