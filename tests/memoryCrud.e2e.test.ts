import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";

const DATA_DIR = path.join(process.cwd(), "data");

const mem0Store: Array<{
  id: string;
  memory?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}> = [];

vi.mock("../lib/integrations/mem0", () => {
  return {
    saveMemoryToMem0: vi.fn(async ({ memory }) => {
      const existingIndex = mem0Store.findIndex(
        (item) => item.metadata?.memoryId === memory.id,
      );

      const nextItem = {
        id: memory.id,
        memory: memory.content,
        score: 1,
        metadata: {
          memoryId: memory.id,
          userId: memory.userId,
          type: memory.type,
          summary: memory.summary,
          importanceScore: String(memory.importanceScore),
          confidence: String(memory.confidence),
          source: memory.source,
          status: memory.status,
          createdAt: memory.createdAt,
          updatedAt: memory.updatedAt,
          evidenceCount: String(memory.evidenceCount),
        },
      };

      if (existingIndex !== -1) {
        mem0Store[existingIndex] = nextItem;
      } else {
        mem0Store.push(nextItem);
      }

      return { id: memory.id };
    }),

    searchMemoryFromMem0: vi.fn(async ({ userId }) => {
      return mem0Store.filter((item) => item.metadata?.userId === userId);
    }),

    getMemoryById: vi.fn(async ({ id }: { id: string }) => {
      return mem0Store.find((item) => item.id === id) ?? null;
    }),
  };
});

beforeEach(() => {
  mem0Store.length = 0;

  if (existsSync(DATA_DIR)) {
    rmSync(DATA_DIR, { recursive: true, force: true });
  }
  mkdirSync(DATA_DIR, { recursive: true });
});

describe("Memory CRUD catch-all E2E", () => {
  const app = createMemoryOsApp();

  const headersFor = (userId: string) => ({
    "content-type": "application/json",
    "x-user-id": userId,
  });

  it("returns 401 when x-user-id header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/process")
      .send({ message: "I am learning transformers" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("POST /api/memory/process works", async () => {
    const res = await request(app)
      .post("/api/memory/process")
      .set(headersFor("u_crud_e2e"))
      .send({
        userId: "fake_body_user",
        threadId: "t1",
        message: "I am learning transformers",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("acceptedMemories");
    expect(res.body).toHaveProperty("rejectedMemories");
    expect(res.body).toHaveProperty("timelineEvents");
    expect(res.body.acceptedMemories.length).toBeGreaterThan(0);
  });

  it("POST /api/memory/retrieve works", async () => {
    // seed one memory first
    await request(app)
      .post("/api/memory/process")
      .set(headersFor("u_crud_e2e_retrieve"))
      .send({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am building MemoryOS",
      });

    const res = await request(app)
      .post("/api/memory/retrieve")
      .set(headersFor("u_crud_e2e_retrieve"))
      .send({
        userId: "fake_body_user",
        question: "what should I build next?",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memories");
    expect(res.body).toHaveProperty("debug");
  });

  it("GET /api/memory/revisions and /timeline work", async () => {
    const first = await request(app)
      .post("/api/memory/process")
      .set(headersFor("u_crud_e2e_rev"))
      .send({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am learning transformers",
      });
    const memoryId = first.body.acceptedMemories[0]?.id as string;

    await request(app)
      .post("/api/memory/process")
      .set(headersFor("u_crud_e2e_rev"))
      .send({
          userId: "fake_body_user",
          threadId: "t2",
          message: "I trained a transformer model",
      });

    const revisionsRes = await request(app)
      .get(`/api/memory/revisions?memoryId=${memoryId}`)
      .set("x-user-id", "u_crud_e2e_rev");

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body).toHaveProperty("revisions");
    expect(revisionsRes.body).toHaveProperty("count");
    expect(revisionsRes.body.count).toBeGreaterThanOrEqual(1);

    const timelineRes = await request(app)
      .get("/api/memory/timeline?userId=u_crud_e2e_rev")
      .set("x-user-id", "u_crud_e2e_rev");

    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body).toHaveProperty("events");
    expect(timelineRes.body).toHaveProperty("count");
    expect(timelineRes.body.count).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/memory/explain without memoryId returns 400", async () => {
    const res = await request(app)
      .get("/api/memory/explain")
      .set("x-user-id", "u_crud_e2e_explain");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "memoryId is required");
  });

  it("GET /api/memory/explain returns memory + latestRevision + timeline + explanation", async () => {
    const first = await request(app)
      .post("/api/memory/process")
      .set(headersFor("u_crud_e2e_explain"))
      .send({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am learning transformers",
      });
    const memoryId = first.body.acceptedMemories[0]?.id as string;

    await request(app)
      .post("/api/memory/process")
      .set(headersFor("u_crud_e2e_explain"))
      .send({
          userId: "fake_body_user",
          threadId: "t2",
          message: "I trained a transformer model",
      });

    const res = await request(app)
      .get(`/api/memory/explain?memoryId=${memoryId}&userId=u_crud_e2e_explain`)
      .set("x-user-id", "u_crud_e2e_explain");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memory");
    expect(res.body).toHaveProperty("latestRevision");
    expect(res.body).toHaveProperty("timeline");
    expect(res.body).toHaveProperty("explanation");
  });

  it("unknown path returns 404", async () => {
    const res = await request(app)
      .post("/api/memory/not-supported")
      .set(headersFor("u_crud_unknown"))
      .send({});

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Route not found");
  });
});
