import { describe, expect, it } from "vitest";
import { RuntimeBus } from "../lib/runtime/RuntimeBus";

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("RuntimeBus", () => {
  it("propagates correlation, causation, and context through nested publishes", async () => {
    const bus = new RuntimeBus({
      defaultContext: {
        institutionId: "inst-a",
        workspaceId: "workspace-a",
        traceId: "trace-a",
      },
    });
    const seen: Array<{
      type: string;
      correlationId: string;
      causationId?: string;
      context: { institutionId: string; workspaceId?: string; traceId?: string };
    }> = [];

    bus.subscribe((event) => {
      seen.push({
        type: event.type,
        correlationId: event.correlationId,
        causationId: event.causationId,
        context: {
          institutionId: event.context.institutionId,
          workspaceId: event.context.workspaceId,
          traceId: event.context.traceId,
        },
      });

      if (event.type === "source.synced") {
        bus.publish({
          id: "decision-1",
          type: "decision.created",
          runtime: "Reality",
          timestamp: new Date("2026-07-27T00:00:01.000Z"),
          correlationId: "different-correlation",
          causationId: "manual",
          context: {
            institutionId: "wrong-institution",
            workspaceId: "wrong-workspace",
            traceId: "wrong-trace",
          },
          version: 1,
          payload: { subjectId: "mission-runtime" },
        });
      } else if (event.type === "decision.created") {
        bus.publish({
          id: "impact-1",
          type: "impact.calculated",
          runtime: "Reality",
          timestamp: new Date("2026-07-27T00:00:02.000Z"),
          correlationId: "another-correlation",
          context: {
            institutionId: "different-institution",
            workspaceId: "different-workspace",
            traceId: "different-trace",
          },
          version: 1,
          payload: { impactId: "impact-1" },
        });
      }
    }, { type: ["source.synced", "decision.created", "impact.calculated"] });

    bus.publish({
      id: "source-1",
      type: "source.synced",
      runtime: "Reality",
      timestamp: new Date("2026-07-27T00:00:00.000Z"),
      correlationId: "correlation-a",
      version: 1,
      payload: { sourceId: "github" },
    });

    await tick();
    await tick();

    expect(seen).toEqual([
      {
        type: "source.synced",
        correlationId: "correlation-a",
        causationId: undefined,
        context: {
          institutionId: "inst-a",
          workspaceId: "workspace-a",
          traceId: "trace-a",
        },
      },
      {
        type: "decision.created",
        correlationId: "correlation-a",
        causationId: "source-1",
        context: {
          institutionId: "inst-a",
          workspaceId: "workspace-a",
          traceId: "trace-a",
        },
      },
      {
        type: "impact.calculated",
        correlationId: "correlation-a",
        causationId: "decision-1",
        context: {
          institutionId: "inst-a",
          workspaceId: "workspace-a",
          traceId: "trace-a",
        },
      },
    ]);
  });

  it("runs middleware before subscribers in publish order and preserves context", async () => {
    const bus = new RuntimeBus({
      defaultContext: {
        institutionId: "inst-b",
        missionId: "mission-b",
      },
    });
    const order: string[] = [];

    bus.use(async (event, next) => {
      order.push(`mw-1:${event.context.institutionId}`);
      await next();
      order.push(`mw-1-after:${event.context.institutionId}`);
    });
    bus.use(async (event, next) => {
      order.push(`mw-2:${event.context.institutionId}`);
      await next();
      order.push(`mw-2-after:${event.context.institutionId}`);
    });
    bus.subscribe((event) => {
      order.push(`sub:${event.context.institutionId}`);
      expect(event.context.missionId).toBe("mission-b");
    }, { type: "kernel.tick" });

    bus.publish({
      id: "tick-1",
      type: "kernel.tick",
      runtime: "Reality",
      timestamp: new Date("2026-07-27T00:00:00.000Z"),
      correlationId: "correlation-b",
      version: 1,
      payload: {},
    });

    await tick();

    expect(order).toEqual([
      "mw-1:inst-b",
      "mw-2:inst-b",
      "sub:inst-b",
      "mw-2-after:inst-b",
      "mw-1-after:inst-b",
    ]);
  });

  it("dispatches asynchronously and isolates subscriber failures", async () => {
    const bus = new RuntimeBus({
      defaultContext: {
        institutionId: "inst-c",
      },
    });
    const order: string[] = [];

    bus.subscribe(() => {
      order.push("first");
      throw new Error("boom");
    }, { type: "kernel.async" });
    bus.subscribe(() => {
      order.push("second");
    }, { type: "kernel.async" });

    bus.publish({
      id: "async-1",
      type: "kernel.async",
      runtime: "Reality",
      timestamp: new Date("2026-07-27T00:00:00.000Z"),
      correlationId: "correlation-c",
      version: 1,
      payload: {},
    });

    expect(order).toEqual([]);
    await tick();

    expect(order).toEqual(["first", "second"]);
    expect(bus.metrics().failedSubscribers).toBe(1);
    expect(bus.metrics().deliveredEvents).toBe(1);
    expect(bus.metrics().publishedEvents).toBe(1);
  });

  it("tracks metrics and filters replay by type, runtime, correlation, and context", async () => {
    const bus = new RuntimeBus({
      defaultContext: {
        institutionId: "inst-d",
        workspaceId: "workspace-d",
      },
    });
    bus.subscribe(() => undefined, { type: ["alpha", "beta"] });
    bus.use(async (_event, next) => {
      await next();
    });

    bus.publish({
      id: "alpha-1",
      type: "alpha",
      runtime: "Reality",
      timestamp: new Date("2026-07-27T00:00:00.000Z"),
      correlationId: "corr-1",
      version: 1,
      context: {
        institutionId: "inst-d",
        workspaceId: "workspace-d",
      },
      payload: { value: 1 },
    });
    bus.publish({
      id: "beta-1",
      type: "beta",
      runtime: "Mission",
      timestamp: new Date("2026-07-27T00:00:01.000Z"),
      correlationId: "corr-2",
      version: 1,
      context: {
        institutionId: "inst-e",
        workspaceId: "workspace-e",
        missionId: "mission-e",
      },
      payload: { value: 2 },
    });

    await tick();
    await tick();

    const metrics = bus.metrics();
    expect(metrics.publishedEvents).toBe(2);
    expect(metrics.subscriberCount).toBe(1);
    expect(metrics.middlewareCount).toBe(1);
    expect(metrics.averageDispatchTimeMs).toBeGreaterThanOrEqual(0);
    expect(bus.replay({ type: "alpha" }).map((event) => event.id)).toEqual(["alpha-1"]);
    expect(bus.replay({ runtime: "Mission" }).map((event) => event.id)).toEqual(["beta-1"]);
    expect(bus.replay({ correlationId: "corr-1" }).map((event) => event.id)).toEqual(["alpha-1"]);
    expect(bus.replay({ context: { workspaceId: "workspace-d" } }).map((event) => event.id)).toEqual(["alpha-1"]);
    expect(bus.replay({ context: { missionId: "mission-e" } }).map((event) => event.id)).toEqual(["beta-1"]);
  });
});
