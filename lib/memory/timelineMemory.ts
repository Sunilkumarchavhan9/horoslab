import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Memory, TimelineEvent } from "./types";
import { withFileLock } from "./jsonStoreLock";

const DATA_DIR = path.join(process.cwd(), "data");
const TIMELINE_STORE_PATH = path.join(DATA_DIR, "timeline-events.json");

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

export function recordMemoryEvolvedEvent( memory: Memory, reason: string ): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_evolved", reason);
}

export function recordMemoryArchivedEvent( memory: Memory, reason: string ): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_archived", reason);
}

export function recordMemoryUpdatedEvent( memory: Memory, reason: string ): Promise<TimelineEvent> {
  return createTimelineEvent(memory, "memory_updated", reason);
}

export function listTimelineEvents(userId?: string): TimelineEvent[] {
  const timelineStore = readTimelineStore();

  if (!userId) {
    return [...timelineStore];
  }

  return timelineStore.filter((event) => event.userId === userId);
}
