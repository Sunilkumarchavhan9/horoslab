import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";
import { resetRetrievalWeights } from "../lib/config/retrievalWeights";
import { resetRuntimeDataStoresForTests } from "./helpers/resetDataDir";
import { setMemoryStoreAdapter } from "../lib/adapters/registry";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";

const testMemoryStore = new TestMemoryStoreAdapter();

describe("Memory retrieval weight config contract", () => {
  const app = createMemoryOsApp();

  beforeEach(async () => {
    testMemoryStore.clear();
    setMemoryStoreAdapter(testMemoryStore);
    resetRetrievalWeights();
    await resetRuntimeDataStoresForTests();
  });

  it("returns 400 for invalid retrieval weight payload", async () => {
    const token = await makeToken("u_cfg_contract");
    const res = await request(app)
      .patch("/api/memory/config/retrieval-weights")
      .set("authorization", `Bearer ${token}`)
      .send({
        semantic: 2,
        typeRelevance: 0.2,
        importance: 0.3,
        recency: 0.1,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when retrieval weights sum is zero", async () => {
    const token = await makeToken("u_cfg_contract");
    const res = await request(app)
      .patch("/api/memory/config/retrieval-weights")
      .set("authorization", `Bearer ${token}`)
      .send({
        semantic: 0,
        typeRelevance: 0,
        importance: 0,
        recency: 0,
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "weights sum must be greater than 0");
  });

  it("changes retrieval order after patching runtime retrieval weights", async () => {
    const token = await makeToken("u_cfg_contract");
    const now = new Date().toISOString();

    testMemoryStore.seed([
      {
        id: "sem-high",
        memory: "High semantic but low importance",
        score: 0.95,
        metadata: {
          memoryId: "sem-high",
          userId: "u_cfg_contract",
          type: "learning",
          summary: "High semantic but low importance",
          importanceScore: "0.2",
          source: "chat",
          status: "active",
          createdAt: now,
          updatedAt: now,
          evidenceCount: "1",
        },
      },
      {
        id: "imp-high",
        memory: "Low semantic but high importance",
        score: 0.2,
        metadata: {
          memoryId: "imp-high",
          userId: "u_cfg_contract",
          type: "learning",
          summary: "Low semantic but high importance",
          importanceScore: "0.95",
          source: "chat",
          status: "active",
          createdAt: now,
          updatedAt: now,
          evidenceCount: "1",
        },
      },
    ]);

    const baseline = await request(app)
      .post("/api/memory/retrieve")
      .set("authorization", `Bearer ${token}`)
      .send({
        question: "general memory question",
        topK: 2,
      });

    expect(baseline.status).toBe(200);
    expect(baseline.body).toHaveProperty("ok", true);
    expect(baseline.body.data.memories[0]?.id).toBe("sem-high");

    const patchRes = await request(app)
      .patch("/api/memory/config/retrieval-weights")
      .set("authorization", `Bearer ${token}`)
      .send({
        semantic: 0.1,
        typeRelevance: 0.15,
        importance: 0.6,
        recency: 0.15,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toHaveProperty("weights");
    expect(patchRes.body.weights).toEqual({
      semantic: 0.1,
      typeRelevance: 0.15,
      importance: 0.6,
      recency: 0.15,
    });

    const weighted = await request(app)
      .post("/api/memory/retrieve")
      .set("authorization", `Bearer ${token}`)
      .send({
        question: "general memory question",
        topK: 2,
      });

    expect(weighted.status).toBe(200);
    expect(weighted.body).toHaveProperty("ok", true);
    expect(weighted.body.data.memories[0]?.id).toBe("imp-high");
  });
});
