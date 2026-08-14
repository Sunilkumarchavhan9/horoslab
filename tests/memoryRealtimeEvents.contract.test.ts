import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";
import { createMemoryOsApp } from "../server/app";
import {
  appendMemoryRealtimeEvent,
  resetMemoryRealtimeStoreForTests,
} from "../lib/memory/realtimeEventStore";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

describe("Memory realtime event routes", () => {
  const app = createMemoryOsApp();
  let authHeader = "";

  beforeEach(async () => {
    resetRuntimeDataStores();
    await resetMemoryRealtimeStoreForTests();
    authHeader = `Bearer ${await makeToken("u_realtime_routes")}`;
  });

  it("returns the live realtime history and projection for the signed-in user", async () => {
    await appendMemoryRealtimeEvent({
      userId: "u_realtime_routes",
      kind: "memory_extracted",
      source: "company-brain",
      subject: { type: "memory", id: "mem-1", label: "Structured memory ready" },
      payload: { summary: "Structured memory ready" },
      occurredAt: "2026-06-30T10:00:00.000Z",
    });
    await appendMemoryRealtimeEvent({
      userId: "u_realtime_routes",
      kind: "outcome_recorded",
      source: "memory-ignition",
      subject: { type: "outcome", id: "out-1", label: "Outcome learned" },
      payload: { summary: "Outcome learned" },
      occurredAt: "2026-06-30T10:01:00.000Z",
    });
    await appendMemoryRealtimeEvent({
      userId: "u_realtime_routes",
      kind: "future_instruction_created",
      source: "memory-ignition",
      subject: { type: "future_instruction", id: "fi-1", label: "Remember outcome" },
      payload: { instruction: "Remember outcome" },
      occurredAt: "2026-06-30T10:02:00.000Z",
    });

    const history = await request(app)
      .get("/api/memory/events/history?limit=10")
      .set("authorization", authHeader);

    expect(history.status).toBe(200);
    expect(history.body.count).toBe(3);
    expect(history.body.events[0]).toMatchObject({
      kind: "future_instruction_created",
      stage: "learning",
    });

    const projection = await request(app)
      .get("/api/memory/events/projection")
      .set("authorization", authHeader);

    expect(projection.status).toBe(200);
    expect(projection.body.projection).toMatchObject({
      userId: "u_realtime_routes",
      totalEvents: 3,
      totalByKind: {
        memory_extracted: 1,
        outcome_recorded: 1,
        future_instruction_created: 1,
      },
      totalByStage: {
        memory: 1,
        learning: 2,
      },
    });
    expect(projection.body.projection.recentEvents[0]).toMatchObject({
      kind: "future_instruction_created",
      summary: "Remember outcome",
    });
  });
});
