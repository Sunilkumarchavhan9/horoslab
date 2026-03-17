import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Memory, RevisionChange, RevisionEvent } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const REVISION_STORE_PATH = path.join(DATA_DIR, "revision-events.json");

function ensureRevisionStore(): void {
    if(!existsSync(DATA_DIR)){
        mkdirSync(DATA_DIR,{recursive: true});
    }

    if(!existsSync(REVISION_STORE_PATH)){
        writeFileSync(REVISION_STORE_PATH, "[]", "utf8");
    }
}

function readRevisionStore(): RevisionEvent[] {
    ensureRevisionStore();

    try{
        const raw = readFileSync(REVISION_STORE_PATH, "utf8");
        const parsed = JSON.parse(raw);

        return Array.isArray(parsed) ? (parsed as RevisionEvent[]) : [];
    }catch{
        return [];
    }
}

function writeRevisionStore(events: RevisionEvent[]): void {
    ensureRevisionStore();
    writeFileSync(REVISION_STORE_PATH, JSON.stringify(events, null, 2), "utf8");


}

function buildRevisionChanges(
  before: Memory,
  after: Memory,
): RevisionChange[] {
  const changes: RevisionChange[] = [];

  if (before.content !== after.content) {
    changes.push({
      field: "content",
      oldValue: before.content,
      newValue: after.content,
    });
  }

  if (before.summary !== after.summary) {
    changes.push({
      field: "summary",
      oldValue: before.summary,
      newValue: after.summary,
    });
  }

  if (before.importanceScore !== after.importanceScore) {
    changes.push({
      field: "importanceScore",
      oldValue: before.importanceScore,
      newValue: after.importanceScore,
    });
  }

  if (before.confidence !== after.confidence) {
    changes.push({
      field: "confidence",
      oldValue: before.confidence,
      newValue: after.confidence,
    });
  }

  if (before.status !== after.status) {
    changes.push({
      field: "status",
      oldValue: before.status,
      newValue: after.status,
    });
  }

  if (before.evidenceCount !== after.evidenceCount) {
    changes.push({
      field: "evidenceCount",
      oldValue: before.evidenceCount,
      newValue: after.evidenceCount,
    });
  }

  return changes;
}

export function recordRevisionEvent(input: {
  before: Memory;
  after: Memory;
  reason: string;
  changedBy?: "system" | "user";
}): RevisionEvent | null {
  const changes = buildRevisionChanges(input.before, input.after);

  if (changes.length === 0) {
    return null;
  }

  const currentEvents = readRevisionStore();

  const version =
    currentEvents.filter((event) => event.memoryId === input.after.id).length + 1;

  const event: RevisionEvent = {
    id: randomUUID(),
    userId: input.after.userId,
    memoryId: input.after.id,
    version,
    changedAt: new Date().toISOString(),
    changedBy: input.changedBy ?? "system",
    reason: input.reason,
    changes,
  };

  currentEvents.push(event);
  writeRevisionStore(currentEvents);

  return event;
}


export function listRevisionEvents(filters?: {
  userId?: string;
  memoryId?: string;
}): RevisionEvent[] {
  const events = readRevisionStore();

  if (filters?.memoryId) {
    return events.filter((event) => event.memoryId === filters.memoryId);
  }

  if (filters?.userId) {
    return events.filter((event) => event.userId === filters.userId);
  }

  return events;
}
