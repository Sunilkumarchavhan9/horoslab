import { beforeEach, describe, expect, it } from "vitest";
import {
  appendMemoryRealtimeEvent,
  buildMemoryRealtimeProjection,
  listMemoryRealtimeEvents,
  normalizeMemoryRealtimeEvent,
  resetMemoryRealtimeStoreForTests,
} from "../lib/memory/realtimeEventStore";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

describe("Memory realtime event store", () => {
  beforeEach(async () => {
    resetRuntimeDataStores();
    await resetMemoryRealtimeStoreForTests();
  });

  it("normalizes and appends live events into a replayable projection", async () => {
    const first = await appendMemoryRealtimeEvent({
      userId: "u_realtime",
      kind: "memory_extracted",
      source: "company-brain",
      subject: { type: "memory", id: "mem-1", label: "Decision captured" },
      payload: { summary: "Decision captured" },
    });
    const second = await appendMemoryRealtimeEvent({
      userId: "u_realtime",
      kind: "agent_run_completed",
      source: "memory-ignition",
      subject: { type: "agent_run", id: "run-1", label: "Agent run completed" },
      payload: { summary: "Agent run completed" },
    });

    expect(first.id).toBeDefined();
    expect(first.stage).toBe("memory");
    expect(second.stage).toBe("execution");

    const events = await listMemoryRealtimeEvents("u_realtime");
    expect(events).toHaveLength(2);
    expect(events[0]?.kind).toBe("agent_run_completed");
    expect(events[1]?.kind).toBe("memory_extracted");

    const projection = buildMemoryRealtimeProjection(events);
    expect(projection.totalEvents).toBe(2);
    expect(projection.totalByKind.memory_extracted).toBe(1);
    expect(projection.totalByKind.agent_run_completed).toBe(1);
    expect(projection.totalByStage.memory).toBe(1);
    expect(projection.totalByStage.execution).toBe(1);
    expect(projection.recentEvents[0]?.summary).toBe("Agent run completed");
  });

  it("preserves canonical defaults when subject data is omitted", () => {
    const normalized = normalizeMemoryRealtimeEvent({
      userId: "u_realtime",
      kind: "request_logged",
      payload: {},
    });

    expect(normalized.source).toBe("memory-router");
    expect(normalized.stage).toBe("source_sync");
    expect(normalized.id).toBeDefined();
    expect(normalized.occurredAt).toBeDefined();
  });
});
