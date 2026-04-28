import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Memory, TimelineEvent } from "./types";
import { withFileLock } from "./jsonStoreLock";
import { isRelationalRuntimeStore } from "../storage/runtimeStoreBackend";
import {
  insertTimelineEventInDb,
  listTimelineEventsFromDb,
} from "../storage/runtimeStoreDb";

const DATA_DIR = path.join(process.cwd(), "data");
const TIMELINE_STORE_PATH = path.join(DATA_DIR, "timeline-events.json");
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

function ensureTimelineStore(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(TIMELINE_STORE_PATH)) {
    writeFileSync(TIMELINE_STORE_PATH, "[]", "utf8");
  }
}

function readTimelineStore(): TimelineEvent[] {
  ensureTimelineStore();

  try {
    const raw = readFileSync(TIMELINE_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as TimelineEvent[]) : [];
  } catch {
    return [];
  }
}

function writeTimelineStore(events: TimelineEvent[]): void {
  ensureTimelineStore();
  writeFileSync(TIMELINE_STORE_PATH, JSON.stringify(events, null, 2), "utf8");
}

async function createTimelineEvent(
  memory: Memory,
  eventType: TimelineEvent["eventType"],
  reason: string,
): Promise<TimelineEvent> {
  if (isRelationalRuntimeStore()) {
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

  return withFileLock(TIMELINE_STORE_PATH, async() => {
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

    const timelineStore = readTimelineStore();
    timelineStore.push(event);
    writeTimelineStore(timelineStore);

    return event;

  });
}

export function recordMemoryCreatedEvent( memory: Memory, reason: string ): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_created", reason);
}

export function recordMemoryMergedEvent( memory: Memory, reason: string ): Promise<TimelineEvent> {
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

export function recordMemoryEvolvedEvent( memory: Memory, reason: string ): Promise<TimelineEvent> {
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

export async function listTimelineEvents(userId?: string): Promise<TimelineEvent[]> {
  if (isRelationalRuntimeStore()) {
    return listTimelineEventsFromDb(userId);
  }

  const timelineStore = readTimelineStore();

  if (!userId) {
    return [...timelineStore];
  }

  return timelineStore.filter((event) => event.userId === userId);
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
