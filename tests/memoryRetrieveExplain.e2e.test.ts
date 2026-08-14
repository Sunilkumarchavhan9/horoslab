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

describe("Memory Retrieve Explain E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("returns explainable ranked retrieval with whyTop1 and score breakdown", async () => {
    const userId = "u_retrieve_explain_e2e";
    const headers = await headersFor(userId);

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t1",
      message: "I am building MemoryOS",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t2",
      message: "I am learning transformers",
    });

    await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t3",
      message: "I prefer TypeScript",
    });

    const res = await request(app)
      .get("/api/memory/retrieve/explain?question=what%20should%20i%20build%20next&topK=5")
      .set(await headersFor(userId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.intent");
    expect(res.body).toHaveProperty("data.weightsUsed");
    expect(res.body).toHaveProperty("data.ranked");
    expect(res.body).toHaveProperty("data.whyTop1");
    expect(typeof res.body.data.whyTop1).toBe("string");
    expect((res.body.data.whyTop1 as string).length).toBeGreaterThan(0);

    expect(Array.isArray(res.body.data.ranked)).toBe(true);
    expect(res.body.data.ranked.length).toBeGreaterThan(0);
    expect(res.body.data.ranked[0]).toHaveProperty("finalScore");
    expect(typeof res.body.data.ranked[0].finalScore).toBe("number");
  });
});
