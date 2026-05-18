import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  listMemories: vi.fn(),
  listTimelineEvents: vi.fn(),
}));

vi.mock("../lib/memory/listMemory", () => ({
  listMemories: mocks.listMemories,
  getMemoryForUser: vi.fn(),
}));

vi.mock("../lib/memory/timelineMemory", async () => {
  const actual = await vi.importActual<typeof import("../lib/memory/timelineMemory")>(
    "../lib/memory/timelineMemory",
  );
  return {
    ...actual,
    listTimelineEvents: mocks.listTimelineEvents,
  };
});

import { createMemoryOsApp } from "../server/app";

describe("Memory list/timeline route contracts", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_list_timeline_contract";
  let authHeader = "";

  beforeEach(async () => {
    authHeader = `Bearer ${await makeToken(authUserId)}`;
    mocks.listMemories.mockReset();
    mocks.listTimelineEvents.mockReset();
    mocks.listMemories.mockResolvedValue({ memories: [], count: 0 });
    mocks.listTimelineEvents.mockResolvedValue([]);
  });

  it("returns 400 for invalid list limit", async () => {
    const res = await request(app)
      .get("/api/memory/list?limit=0")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid query");
    expect(res.body).toHaveProperty("details.limit");
  });

  it("caps list limit through downstream listMemories", async () => {
    const res = await request(app)
      .get("/api/memory/list?limit=999")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(mocks.listMemories).toHaveBeenCalledWith({
      userId: authUserId,
      limit: 999,
    });
  });

  it("returns 400 for invalid timeline limit", async () => {
    const res = await request(app)
      .get("/api/memory/timeline?limit=-3")
      .set("authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid query");
    expect(res.body).toHaveProperty("details.limit");
  });

  it("caps timeline limit to 500", async () => {
    const res = await request(app)
      .get("/api/memory/timeline?limit=999")
      .set("authorization", authHeader);

    expect(res.status).toBe(200);
    expect(mocks.listTimelineEvents).toHaveBeenCalledWith(authUserId, 500);
  });
});

