import { getMemoryStoreAdapter } from "../adapters/registry";
import { toInternalMemory } from "../workflows/ingestShared";
import { upsertRecentMemory } from "./recentMemoryStore";
import { recordRevisionEvent } from "./revisionMemory";
import {
  recordMemoryArchivedEvent,
  recordMemoryContradictedEvent,
  recordMemoryMergedEvent,
  recordMemoryStaleEvent,
  recordMemoryUpdatedEvent,
} from "./timelineMemory";
import type { Memory, MemoryStatus, RevisionEvent, TimelineEvent } from "./types";

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

export type UpdateMemoryStatusResultStatus =
  | "not_found"
  | "already_in_status"
  | "updated";

export interface UpdateMemoryStatusResult {
  status: UpdateMemoryStatusResultStatus;
  memory?: Memory;
  revisionEvent?: RevisionEvent | null;
  timelineEvent?: TimelineEvent;
}

async function loadOwnedMemory(input: {
  memoryId: string;
  userId: string;
}): Promise<Memory | null> {
  const raw = await getMemoryStoreAdapter().getMemoryById({ id: input.memoryId });
  if (!raw) {
    return null;
  }

  const owner =
    raw.metadata &&
    typeof raw.metadata === "object" &&
    typeof raw.metadata.userId === "string"
      ? raw.metadata.userId
      : raw.metadata &&
          typeof raw.metadata === "object" &&
          typeof raw.metadata.user_id === "string"
        ? raw.metadata.user_id
      : undefined;

  if (owner && owner !== input.userId) {
    return null;
  }

  return toInternalMemory(raw, input.userId);
}

async function createStatusTimelineEvent(input: {
  memory: Memory;
  reason: string;
  nextStatus: MemoryStatus;
}): Promise<TimelineEvent> {
  if (input.nextStatus === "archived") {
    return recordMemoryArchivedEvent(input.memory, input.reason);
  }

  if (input.nextStatus === "merged") {
    return recordMemoryMergedEvent(input.memory, input.reason);
  }

  if (input.nextStatus === "stale") {
    return recordMemoryStaleEvent(input.memory, input.reason);
  }

  if (input.nextStatus === "contradicted") {
    return recordMemoryContradictedEvent(input.memory, input.reason);
  }

  return recordMemoryUpdatedEvent(input.memory, input.reason);
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

  await getMemoryStoreAdapter().saveMemory({ memory: archivedMemory });
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

  await getMemoryStoreAdapter().saveMemory({ memory: activeMemory });
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

export async function updateMemoryStatus(input: {
  memoryId: string;
  userId: string;
  status: MemoryStatus;
}): Promise<UpdateMemoryStatusResult> {
  const current = await loadOwnedMemory(input);
  if (!current) {
    return { status: "not_found" };
  }

  if (current.status === input.status) {
    return {
      status: "already_in_status",
      memory: current,
    };
  }

  const nextMemory: Memory = {
    ...current,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };

  await getMemoryStoreAdapter().saveMemory({ memory: nextMemory });
  await upsertRecentMemory(nextMemory);

  const reason = `memory status updated to ${input.status} by user`;
  const revisionEvent = await recordRevisionEvent({
    before: current,
    after: nextMemory,
    reason,
    changedBy: "user",
  });
  const timelineEvent = await createStatusTimelineEvent({
    memory: nextMemory,
    reason,
    nextStatus: input.status,
  });

  return {
    status: "updated",
    memory: nextMemory,
    revisionEvent,
    timelineEvent,
  };
}
