import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  listMemories: vi.fn(),
  listTimelineEvents: vi.fn(),
}));

vi.mock("../lib/memory/listMemory", () => ({
  listMemories: mocks.listMemories,
}));

vi.mock("../lib/memory/timelineMemory", async () => {
  const actual =
    await vi.importActual<typeof import("../lib/memory/timelineMemory")>(
      "../lib/memory/timelineMemory",
    );

  return {
    ...actual,
    listTimelineEvents: mocks.listTimelineEvents,
  };
});

describe("Memory Insights Route Contract", () => {
  const app = createMemoryOsApp();

  beforeEach(() => {
    mocks.listMemories.mockReset();
    mocks.listTimelineEvents.mockReset();
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app).get("/api/memory/insights");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("returns 200 with expected insights keys", async () => {
    mocks.listMemories.mockResolvedValue({
      memories: [],
      count: 0,
    });
    mocks.listTimelineEvents.mockReturnValue([]);

    const token = await makeToken("u_insights_contract");

    const res = await request(app)
      .get("/api/memory/insights")
      .set("authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalsByType");
    expect(res.body).toHaveProperty("totalsByStatus");
    expect(res.body).toHaveProperty("topSkills");
    expect(res.body).toHaveProperty("activeProjects");
    expect(res.body).toHaveProperty("recentMilestones");
  });
});
