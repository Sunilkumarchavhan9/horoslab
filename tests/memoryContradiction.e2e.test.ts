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

describe("Memory contradiction lifecycle E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("marks reversed preference as contradicted and excludes it from default retrieval", async () => {
    const userId = "u_contradiction_e2e";
    const headers = await headersFor(userId);

    const first = await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t1",
      message: "I prefer TypeScript over Python",
    });

    expect(first.status).toBe(200);
    const oldMemoryId = first.body.acceptedMemories[0]?.id as string;
    expect(oldMemoryId).toBeTruthy();

    const second = await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t2",
      message: "I prefer Python over TypeScript",
    });

    expect(second.status).toBe(200);
    const newMemoryId = second.body.acceptedMemories[0]?.id as string;
    expect(newMemoryId).toBeTruthy();

    const listRes = await request(app)
      .get("/api/memory/list?type=preference&limit=10")
      .set(headers);

    expect(listRes.status).toBe(200);
    const oldMemory = (listRes.body.memories as Array<{ id: string; status: string }>).find(
      (memory) => memory.id === oldMemoryId,
    );
    const currentMemory = (listRes.body.memories as Array<{ id: string; status: string }>).find(
      (memory) => memory.id === newMemoryId,
    );

    expect(oldMemory?.status).toBe("contradicted");
    expect(currentMemory?.status).toBe("active");

    const defaultRetrieve = await request(app)
      .post("/api/memory/retrieve")
      .set(headers)
      .send({
        question: "what stack should I use?",
        topK: 10,
      });

    expect(defaultRetrieve.status).toBe(200);
    expect(defaultRetrieve.body).toHaveProperty("ok", true);
    const defaultIds = new Set(
      (defaultRetrieve.body.data.memories as Array<{ id: string }>).map(
        (memory) => memory.id,
      ),
    );
    expect(defaultIds.has(oldMemoryId)).toBe(false);
    expect(defaultIds.has(newMemoryId)).toBe(true);

    const includeArchivedRetrieve = await request(app)
      .post("/api/memory/retrieve")
      .set(headers)
      .send({
        question: "what stack should I use?",
        topK: 10,
        includeArchived: true,
      });

    expect(includeArchivedRetrieve.status).toBe(200);
    expect(includeArchivedRetrieve.body).toHaveProperty("ok", true);
    const includeIds = new Set(
      (includeArchivedRetrieve.body.data.memories as Array<{ id: string }>).map(
        (memory) => memory.id,
      ),
    );
    expect(includeIds.has(oldMemoryId)).toBe(true);
    expect(includeIds.has(newMemoryId)).toBe(true);
  });

  it("marks older project-progress memory as stale after a shipped update", async () => {
    const userId = "u_project_state_e2e";
    const headers = await headersFor(userId);

    const first = await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t3",
      message: "I am building MemoryOS handoff workflow",
    });

    expect(first.status).toBe(200);
    const oldMemoryId = first.body.acceptedMemories[0]?.id as string;
    expect(oldMemoryId).toBeTruthy();

    const second = await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t4",
      message: "I shipped MemoryOS handoff workflow",
    });

    expect(second.status).toBe(200);
    const newMemoryId = second.body.acceptedMemories[0]?.id as string;
    expect(newMemoryId).toBeTruthy();

    const listRes = await request(app)
      .get("/api/memory/list?type=project&limit=10")
      .set(headers);

    expect(listRes.status).toBe(200);
    const oldMemory = (listRes.body.memories as Array<{ id: string; status: string }>).find(
      (memory) => memory.id === oldMemoryId,
    );
    const currentMemory = (listRes.body.memories as Array<{ id: string; status: string }>).find(
      (memory) => memory.id === newMemoryId,
    );

    expect(oldMemory?.status).toBe("stale");
    expect(currentMemory?.status).toBe("active");
  });

  it("marks older active bug work as stale after a fixed update", async () => {
    const userId = "u_bug_state_e2e";
    const headers = await headersFor(userId);

    const first = await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t5",
      message: "I am debugging checkout timeout bug",
    });

    expect(first.status).toBe(200);
    const oldMemoryId = first.body.acceptedMemories[0]?.id as string;
    expect(oldMemoryId).toBeTruthy();

    const second = await request(app).post("/api/memory/process").set(headers).send({
      threadId: "t6",
      message: "I fixed checkout timeout bug",
    });

    expect(second.status).toBe(200);
    const newMemoryId = second.body.acceptedMemories[0]?.id as string;
    expect(newMemoryId).toBeTruthy();

    const listRes = await request(app)
      .get("/api/memory/list?type=episodic&limit=10")
      .set(headers);

    expect(listRes.status).toBe(200);
    const oldMemory = (listRes.body.memories as Array<{ id: string; status: string }>).find(
      (memory) => memory.id === oldMemoryId,
    );
    const currentMemory = (listRes.body.memories as Array<{ id: string; status: string }>).find(
      (memory) => memory.id === newMemoryId,
    );

    expect(oldMemory?.status).toBe("stale");
    expect(currentMemory?.status).toBe("active");
  });
});
