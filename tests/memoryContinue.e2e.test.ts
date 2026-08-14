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

describe("Memory Continue E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("returns mode-based build_next actions", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_build"))
      .send({
        threadId: "t1",
        message: "I am building MemoryOS",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_build"))
      .send({
        threadId: "t2",
        message: "I am learning transformers",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_build"))
      .send({
        question: "what should I build next?",
        mode: "build_next",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("data.nextActions");
    expect(res.body).toHaveProperty("data.usedMemories");
    expect(res.body).toHaveProperty("data.debug");
    expect(Array.isArray(res.body.data.nextActions)).toBe(true);
    expect(res.body.data.nextActions.length).toBeGreaterThan(0);
    expect(res.body.data.debug.mode).toBe("build_next");
    expect(
      (res.body.data.nextActions as string[]).some((action) =>
        action.includes("project thread"),
      ),
    ).toBe(true);
  });

  it("returns mode-based debug_next actions", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_debug"))
      .send({
        threadId: "t1",
        message: "I solved a Redis locking bug",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_debug"))
      .send({
        threadId: "t2",
        message: "I deployed backend",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_debug"))
      .send({
        question: "did I solve a similar bug before?",
        mode: "debug_next",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body.data.debug.mode).toBe("debug_next");
    expect(
      (res.body.data.nextActions as string[]).some((action) =>
        action.toLowerCase().includes("bug"),
      ),
    ).toBe(true);
  });

  it("returns mode-based learn_next actions", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_learn"))
      .send({
        threadId: "t1",
        message: "I am learning transformers",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_learn"))
      .send({
        threadId: "t2",
        message: "I am building MemoryOS",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_learn"))
      .send({
        question: "what should I learn next?",
        mode: "learn_next",
        topK: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body.data.debug.mode).toBe("learn_next");
    expect(
      (res.body.data.nextActions as string[]).some((action) =>
        action.toLowerCase().includes("study this next"),
      ),
    ).toBe(true);
  });

  it("dedupes same logical memory id in continue output", async () => {
    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_dedupe"))
      .send({
        threadId: "t1",
        message: "I am building MemoryOS",
      });

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_continue_dedupe"))
      .send({
        threadId: "t2",
        message: "I am building MemoryOS backend",
      });

    const res = await request(app)
      .post("/api/memory/continue")
      .set(await headersFor("u_continue_dedupe"))
      .send({
        question: "where did I leave off on MemoryOS?",
        mode: "build_next",
        topK: 10,
      });

    expect(res.status).toBe(200);

    const ids = (res.body.data.usedMemories as Array<{ id: string }>).map(
      (memory) => memory.id,
    );
    const uniqueCount = new Set(ids).size;
    expect(uniqueCount).toBe(ids.length);
  });
});
