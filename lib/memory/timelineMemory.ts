import { randomUUID } from "crypto";
import type { Memory, TimelineEvent } from "./types";
import {
  insertTimelineEventInDb,
  listTimelineEventsFromDb,
} from "../storage/runtimeStoreDb";

const LIFECYCLE_EVENT_TYPES = [
  "memory_stale",
  "memory_contradicted",
  "memory_archived",
  "memory_merged",
] as const;

export type LifecycleEventType = (typeof LIFECYCLE_EVENT_TYPES)[number];

export type LifecycleSnapshot = {
  eventType: LifecycleEventType;
  reason: string;
  changedAt: string;
};

async function createTimelineEvent(
  memory: Memory,
  eventType: TimelineEvent["eventType"],
  reason: string,
): Promise<TimelineEvent> {
  const event: TimelineEvent = {
    id: randomUUID(),
    userId: memory.userId,
    memoryId: memory.id,
    eventType,
    reason,
    timestamp: new Date().toISOString(),
    metadata: {
      type: memory.type,
      importanceScore: memory.importanceScore,
      confidence: memory.confidence,
    },
  };

  await insertTimelineEventInDb(event);
  return event;
}

export function recordMemoryCreatedEvent(memory: Memory, reason: string): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_created", reason);
}

export function recordMemoryMergedEvent(memory: Memory, reason: string): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_merged", reason);
}

export function recordMemoryStaleEvent(
  memory: Memory,
  reason: string,
): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_stale", reason);
}

export function recordMemoryContradictedEvent(
  memory: Memory,
  reason: string,
): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_contradicted", reason);
}

export function recordMemoryEvolvedEvent(memory: Memory, reason: string): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_evolved", reason);
}

export function recordMemoryArchivedEvent(
  memory: Memory,
  reason: string,
): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_archived", reason);
}

export function recordMemoryUpdatedEvent(
  memory: Memory,
  reason: string,
): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_updated", reason);
}

export async function listTimelineEvents(
  userId?: string,
  limit?: number,
): Promise<TimelineEvent[]> {
  const normalizedLimit =
    typeof limit === "number" && Number.isFinite(limit)
      ? Math.max(1, Math.floor(limit))
      : undefined;
  const events = await listTimelineEventsFromDb(userId);
  return normalizedLimit ? events.slice(0, normalizedLimit) : events;
}

export function getLatestLifecycleSnapshot(
  events: TimelineEvent[],
): LifecycleSnapshot | null {
  const latest = events
    .filter((event): event is TimelineEvent & { eventType: LifecycleEventType } =>
      (LIFECYCLE_EVENT_TYPES as readonly string[]).includes(event.eventType),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];

  if (!latest) {
    return null;
  }

  return {
    eventType: latest.eventType,
    reason: latest.reason,
    changedAt: latest.timestamp,
  };
}
