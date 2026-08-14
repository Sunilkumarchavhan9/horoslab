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

describe("Memory Status E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("updates status to archived, rejects duplicate, then restores active", async () => {
    const created = await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_status_e2e"))
      .send({
        threadId: "t1",
        message: "I am building MemoryOS backend",
      });

    const memoryId = created.body.acceptedMemories[0]?.id as string;
    expect(memoryId).toBeTruthy();

    const archiveRes = await request(app)
      .patch(`/api/memory/${memoryId}/status`)
      .set(await headersFor("u_status_e2e"))
      .send({ status: "archived" });

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body).toHaveProperty("memory");
    expect(archiveRes.body.memory).toHaveProperty("status", "archived");

    const archiveAgainRes = await request(app)
      .patch(`/api/memory/${memoryId}/status`)
      .set(await headersFor("u_status_e2e"))
      .send({ status: "archived" });

    expect(archiveAgainRes.status).toBe(400);
    expect(archiveAgainRes.body).toHaveProperty(
      "error",
      "Memory is already archived",
    );

    const unarchiveRes = await request(app)
      .patch(`/api/memory/${memoryId}/status`)
      .set(await headersFor("u_status_e2e"))
      .send({ status: "active" });

    expect(unarchiveRes.status).toBe(200);
    expect(unarchiveRes.body).toHaveProperty("memory");
    expect(unarchiveRes.body.memory).toHaveProperty("status", "active");
  });
});
