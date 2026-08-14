import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { resetRuntimeDataStoresForTests } from "./helpers/resetDataDir";
import { setMemoryStoreAdapter } from "../lib/adapters/registry";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";

const testMemoryStore = new TestMemoryStoreAdapter();


beforeEach(async () => {
  testMemoryStore.clear();
  setMemoryStoreAdapter(testMemoryStore);
  await resetRuntimeDataStoresForTests();
});

describe("Memory Insights E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("seeds learning/preference/project and returns valid insights counts", async () => {
    const userId = "u_insights_e2e";
    const headers = await headersFor(userId);

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t1",
      message: "I am learning transformers",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t2",
      message: "I prefer TypeScript",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t3",
      message: "I am building MemoryOS",
    });

    const insightsRes = await request(app)
      .get("/api/memory/insights")
      .set(await headersFor(userId));

    expect(insightsRes.status).toBe(200);
    expect(insightsRes.body).toHaveProperty("totalsByType");
    expect(insightsRes.body).toHaveProperty("activeProjects");
    expect(insightsRes.body).toHaveProperty("recentMilestones");

    expect(insightsRes.body.totalsByType.learning).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.totalsByType.preference).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.totalsByType.project).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.activeProjects.length).toBeGreaterThanOrEqual(1);
    expect(insightsRes.body.recentMilestones.length).toBeGreaterThanOrEqual(1);
  });
});
