
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

describe("Memory Resume E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("returns fallback response when no memories exist", async () => {
    const res = await request(app)
      .post("/api/memory/resume")
      .set(await headersFor("u_resume_empty"))
      .send({
        project: "MemoryOS",
        question: "where did I leave off?",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body.data.usedMemories).toEqual([]);
    expect(res.body).toHaveProperty("data.summary");
    expect(res.body).toHaveProperty("data.recommendedNextStep");
    expect(res.body.data.debug).toHaveProperty("project", "MemoryOS");
  });

  it("returns project continuity response from seeded memories", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_resume_seeded"))
      .send({
        threadId: "t1",
        message: "I am building MemoryOS",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_resume_seeded"))
      .send({
        threadId: "t2",
        message: "I am learning transformers",
      });

    const res = await request(app)
      .post("/api/memory/resume")
      .set(await headersFor("u_resume_seeded"))
      .send({
        project: "MemoryOS",
        question: "where did I leave off?",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(Array.isArray(res.body.data.usedMemories)).toBe(true);
    expect(res.body.data.usedMemories.length).toBeGreaterThan(0);
    expect(typeof res.body.data.summary).toBe("string");
    expect(typeof res.body.data.lastKnownState).toBe("string");
    expect(Array.isArray(res.body.data.openLoops)).toBe(true);
    expect(typeof res.body.data.recommendedNextStep).toBe("string");
    expect(res.body.data.debug).toHaveProperty("project", "MemoryOS");
    expect(Array.isArray(res.body.data.debug.retrieval)).toBe(true);
  });
});
