import { randomUUID } from "crypto";
import type { Memory, RevisionChange, RevisionEvent } from "./types";
import {
  countRevisionEventsForMemoryInDb,
  insertRevisionEventInDb,
  listRevisionEventsFromDb,
} from "../storage/runtimeStoreDb";

function buildRevisionChanges(before: Memory, after: Memory): RevisionChange[] {
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

export async function recordRevisionEvent(input: {
  before: Memory;
  after: Memory;
  reason: string;
  changedBy?: "system" | "user";
}): Promise<RevisionEvent | null> {
  const changes = buildRevisionChanges(input.before, input.after);
  if (changes.length === 0) {
    return null;
  }

  const version = (await countRevisionEventsForMemoryInDb(input.after.id)) + 1;
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

  await insertRevisionEventInDb(event);
  return event;
}

export async function listRevisionEvents(filters?: {
  userId?: string;
  memoryId?: string;
}): Promise<RevisionEvent[]> {
  return listRevisionEventsFromDb(filters);
}
