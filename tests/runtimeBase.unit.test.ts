import { describe, expect, it } from "vitest";
import { RuntimeBase } from "../lib/runtime/RuntimeBase";
import type { RuntimeEvent } from "../lib/runtime/RuntimeBus";

class TestRuntime extends RuntimeBase<RuntimeEvent> {
  constructor() {
    super({
      runtimeName: "test-runtime",
      runtimeContext: {
        institutionId: "inst-test",
        workspaceId: "workspace-test",
      },
    });
  }

  publishTestEvent() {
    return this.runtimeBus.publish({
      id: "event-1",
      type: "test.event",
      runtime: this.runtimeName,
      timestamp: new Date("2026-07-27T00:00:00.000Z"),
      version: 1,
      payload: { ok: true },
    });
  }

  inspect() {
    return {
      runtimeName: this.runtimeName,
      context: this.runtimeContext,
      metrics: this.metrics.snapshot(),
      lifecycleCount: this.lifecycle.count(),
      loggerType: typeof this.logger.info,
      busCount: this.runtimeBus.count(),
    };
  }
}

describe("RuntimeBase", () => {
  it("wires shared infrastructure and preserves the default runtime context", () => {
    const runtime = new TestRuntime();

    const event = runtime.publishTestEvent();
    const snapshot = runtime.inspect();

    expect(snapshot.runtimeName).toBe("test-runtime");
    expect(snapshot.context.institutionId).toBe("inst-test");
    expect(snapshot.context.workspaceId).toBe("workspace-test");
    expect(snapshot.metrics.publishedEvents).toBe(1);
    expect(snapshot.busCount).toBe(1);
    expect(snapshot.lifecycleCount).toBe(0);
    expect(snapshot.loggerType).toBe("function");
    expect(event.context.institutionId).toBe("inst-test");
  });
});
