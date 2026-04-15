import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMemoryById: vi.fn(),
  listRevisionEvents: vi.fn(),
  listTimelineEvents: vi.fn(),
}));

vi.mock("../lib/integrations/mem0", () => ({
  getMemoryById: mocks.getMemoryById,
}));

vi.mock("../lib/memory/revisionMemory", () => ({
  listRevisionEvents: mocks.listRevisionEvents,
}));

vi.mock("../lib/memory/timelineMemory", () => ({
  listTimelineEvents: mocks.listTimelineEvents,
  getLatestLifecycleSnapshot: (events: Array<{
    eventType: string;
    reason: string;
    timestamp: string;
  }>) => {
    const lifecycleEvents = events
      .filter((event) =>
        [
          "memory_stale",
          "memory_contradicted",
          "memory_archived",
          "memory_merged",
        ].includes(event.eventType),
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    const latest = lifecycleEvents[0];
    if (!latest) {
      return null;
    }

    return {
      eventType: latest.eventType as
        | "memory_stale"
        | "memory_contradicted"
        | "memory_archived"
        | "memory_merged",
      reason: latest.reason,
      changedAt: latest.timestamp,
    };
  },
}));

import { explainMemory } from "../lib/memory/explainMemory";

const NOW_ISO = "2026-03-23T00:00:00.000Z";

function makeMem0Memory(updatedAt: string) {
  return {
    id: "m_explain_1",
    memory: "User is learning transformers",
    metadata: {
      userId: "u_explain_service",
      type: "learning",
      summary: "Learning transformers",
      source: "chat",
      status: "active",
      importanceScore: "0.78",
      confidence: "0.86",
      evidenceCount: "2",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt,
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_ISO));
  mocks.getMemoryById.mockReset();
  mocks.listRevisionEvents.mockReset();
  mocks.listTimelineEvents.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("explainMemory service", () => {
  it("includes trust counters and status in explanation", async () => {
    mocks.getMemoryById.mockResolvedValue(
      makeMem0Memory("2026-03-20T00:00:00.000Z"),
    );
    mocks.listRevisionEvents.mockReturnValue([
      {
        id: "r1",
        userId: "u_explain_service",
        memoryId: "m_explain_1",
        version: 1,
        changedAt: "2026-03-20T00:01:00.000Z",
        changedBy: "system",
        reason: "test",
        changes: [],
      },
      {
        id: "r2",
        userId: "u_explain_service",
        memoryId: "m_explain_1",
        version: 2,
        changedAt: "2026-03-21T00:01:00.000Z",
        changedBy: "system",
        reason: "test-2",
        changes: [],
      },
    ]);
    mocks.listTimelineEvents.mockReturnValue([
      {
        id: "t1",
        userId: "u_explain_service",
        memoryId: "m_explain_1",
        eventType: "memory_created",
        reason: "created",
        timestamp: "2026-03-20T00:00:00.000Z",
      },
      {
        id: "t2",
        userId: "u_explain_service",
        memoryId: "m_explain_1",
        eventType: "memory_stale",
        reason: "Superseded by shipped milestone",
        timestamp: "2026-03-21T00:00:00.000Z",
      },
      {
        id: "t_other",
        userId: "u_explain_service",
        memoryId: "m_other",
        eventType: "memory_created",
        reason: "other",
        timestamp: "2026-03-20T00:00:00.000Z",
      },
    ]);

    const result = await explainMemory({
      memoryId: "m_explain_1",
      userId: "u_explain_service",
    });

    expect(result).not.toBeNull();
    expect(result?.explanation.status).toBe("active");
    expect(result?.explanation.timelineCount).toBe(2);
    expect(result?.explanation.revisionCount).toBe(2);
    expect(result?.explanation.stalenessDays).toBe(3);
    expect(result?.explanation.stalenessBucket).toBe("fresh");
    expect(result?.explanation.lifecycle.latestEventType).toBe("memory_stale");
    expect(result?.explanation.lifecycle.latestReason).toBe(
      "Superseded by shipped milestone",
    );
    expect(result?.explanation.lifecycle.latestChangedAt).toBe(
      "2026-03-21T00:00:00.000Z",
    );
  });

  it.each([
    {
      updatedAt: "2026-03-22T00:00:00.000Z",
      expectedDays: 1,
      expectedBucket: "fresh",
    },
    {
      updatedAt: "2026-03-15T00:00:00.000Z",
      expectedDays: 8,
      expectedBucket: "aging",
    },
    {
      updatedAt: "2026-02-10T00:00:00.000Z",
      expectedDays: 41,
      expectedBucket: "stale",
    },
  ])(
    "computes staleness bucket for updatedAt=$updatedAt",
    async ({ updatedAt, expectedDays, expectedBucket }) => {
      mocks.getMemoryById.mockResolvedValue(makeMem0Memory(updatedAt));
      mocks.listRevisionEvents.mockReturnValue([]);
      mocks.listTimelineEvents.mockReturnValue([]);

      const result = await explainMemory({
        memoryId: "m_explain_1",
        userId: "u_explain_service",
      });

      expect(result).not.toBeNull();
      expect(result?.explanation.stalenessDays).toBe(expectedDays);
      expect(result?.explanation.stalenessBucket).toBe(expectedBucket);
    },
  );
});
