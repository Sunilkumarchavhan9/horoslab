import { beforeEach, describe, expect, it } from "vitest";
import { getRecentMemories, upsertRecentMemory } from "../lib/memory/recentMemoryStore";
import { listTimelineEvents, recordMemoryCreatedEvent } from "../lib/memory/timelineMemory";
import { listRevisionEvents, recordRevisionEvent } from "../lib/memory/revisionMemory";
import type { Memory } from "../lib/memory/types";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

function makeMemory(
  userId: string,
  id: string,
  overrides: Partial<Memory> = {},
): Memory {
  const now = new Date().toISOString();

  return {
    id,
    userId,
    type: "learning",
    content: `Memory content ${id}`,
    summary: `Memory summary ${id}`,
    importanceScore: 0.8,
    confidence: 0.85,
    source: "chat",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: 1,
    ...overrides,
  };
}

beforeEach(() => {
  resetRuntimeDataStores();
});

describe("JSON store concurrency safety", () => {
  it("handles concurrent upserts in recent memory store", async () => {
    const userId = "u_concurrent_recent";

    await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        upsertRecentMemory(makeMemory(userId, `recent-${i}`)),
      ),
    );

    const recent = await getRecentMemories(userId);
    expect(recent).toHaveLength(20); // capped by MAX_RECENT_MEMORIES_PER_USER
    expect(new Set(recent.map((m) => m.id)).size).toBe(20);
  });

  it("handles concurrent timeline event writes", async () => {
    const memory = makeMemory("u_concurrent_timeline", "timeline-memory");

    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        recordMemoryCreatedEvent(memory, `reason-${i}`),
      ),
    );

    const events = await listTimelineEvents(memory.userId);
    expect(events).toHaveLength(25);
    expect(events.every((e) => e.eventType === "memory_created")).toBe(true);
    expect(new Set(events.map((e) => e.id)).size).toBe(25);
  });

  it("handles concurrent revision writes with unique sequential versions", async () => {
    const base = makeMemory("u_concurrent_revision", "revision-memory", {
      content: "User is learning TypeScript",
      summary: "Learning TypeScript",
      evidenceCount: 1,
    });

    const results = await Promise.all(
      Array.from({ length: 15 }, (_, i) => {
        const after: Memory = {
          ...base,
          content: `User is learning TypeScript level ${i}`,
          summary: `Learning TypeScript level ${i}`,
          evidenceCount: i + 2,
          updatedAt: new Date(Date.now() + i).toISOString(),
        };

        return recordRevisionEvent({
          before: base,
          after,
          reason: `concurrent-update-${i}`,
        });
      }),
    );

    expect(results.filter(Boolean)).toHaveLength(15);

    const revisions = await listRevisionEvents({ memoryId: base.id });
    expect(revisions).toHaveLength(15);

    const versions = revisions.map((r) => r.version).sort((a, b) => a - b);
    expect(versions).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(new Set(versions).size).toBe(15);
  });
});
