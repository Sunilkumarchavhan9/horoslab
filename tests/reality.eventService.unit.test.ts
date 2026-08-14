import { describe, expect, it } from "vitest";
import { EventService } from "../lib/reality/events/EventService";

describe("EventService", () => {
  it("supports publish, replay, filters, subscriptions, and snapshots", () => {
    const service = new EventService();
    const observed: string[] = [];

    const unsubscribe = service.subscribe((event) => {
      observed.push(event.type);
    }, { nodeId: "reality-fabric" });

    const first = service.append({
      nodeId: "reality-fabric",
      type: "graph_refreshed",
      payload: { projection: "graph" },
      source: "system",
    });
    const second = service.append({
      nodeId: "mission-runtime",
      type: "mission_planned",
      payload: { missionId: "m-1" },
      source: "planner",
    });

    expect(observed).toEqual(["graph_refreshed"]);
    expect(service.replay({ type: "graph_refreshed" }).map((event) => event.id)).toEqual([first.id]);
    expect(service.replay({ source: "system" }).some((event) => event.id === first.id)).toBe(true);
    expect(service.snapshot()).toMatchObject({
      total: 3,
      countsByType: expect.objectContaining({
        reality_bootstrapped: 1,
        graph_refreshed: 1,
        mission_planned: 1,
      }),
    });

    unsubscribe();
    service.append({
      nodeId: "reality-fabric",
      type: "graph_compacted",
      source: "system",
    });

    expect(observed).toEqual(["graph_refreshed"]);
    expect(service.latest()?.id).not.toBe(second.id);
  });
});
