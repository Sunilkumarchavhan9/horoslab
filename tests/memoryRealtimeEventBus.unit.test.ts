import { beforeEach, describe, expect, it, vi } from "vitest";
import { emitMemoryRealtimeEvent, registerMemoryRealtimeSink } from "../lib/memory/realtimeEventBus";
import { listMemoryRealtimeEvents, resetMemoryRealtimeStoreForTests } from "../lib/memory/realtimeEventStore";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

describe("memory realtime event bus", () => {
  beforeEach(async () => {
    resetRuntimeDataStores();
    await resetMemoryRealtimeStoreForTests();
  });

  it("broadcasts realtime events to registered sinks and stores them durably", async () => {
    const write = vi.fn();
    const unregister = registerMemoryRealtimeSink("u_bus", { write } as never);

    emitMemoryRealtimeEvent({
      userId: "u_bus",
      kind: "source_synced",
      source: "continuity",
      subject: { type: "source", id: "github", label: "GitHub sync" },
      payload: { extractedCount: 4, status: "success" },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    unregister();

    expect(write).toHaveBeenCalledTimes(1);
    expect(String(write.mock.calls[0][0])).toContain('"kind":"source_synced"');
    const events = await listMemoryRealtimeEvents("u_bus", 10);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "source_synced",
      stage: "source_sync",
      subject: { type: "source", id: "github" },
    });
  });
});
