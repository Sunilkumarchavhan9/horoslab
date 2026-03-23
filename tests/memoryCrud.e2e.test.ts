import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import request from "supertest";
import { createMemoryOsApp } from "../server/app";
import { makeToken } from "./helpers/authToken";

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

  const headersFor = async (userId: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${await makeToken(userId)}`,
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/api/memory/process")
      .send({ message: "I am learning transformers" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("POST /api/memory/process works", async () => {
    const res = await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_crud_e2e"))
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
      .set(await headersFor("u_crud_e2e_retrieve"))
      .send({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am building MemoryOS",
      });

    const res = await request(app)
      .post("/api/memory/retrieve")
      .set(await headersFor("u_crud_e2e_retrieve"))
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
      .set(await headersFor("u_crud_e2e_rev"))
      .send({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am learning transformers",
      });
    const memoryId = first.body.acceptedMemories[0]?.id as string;

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_crud_e2e_rev"))
      .send({
          userId: "fake_body_user",
          threadId: "t2",
          message: "I trained a transformer model",
      });

    const revisionsRes = await request(app)
      .get(`/api/memory/revisions?memoryId=${memoryId}`)
      .set(await headersFor("u_crud_e2e_rev"));

    expect(revisionsRes.status).toBe(200);
    expect(revisionsRes.body).toHaveProperty("revisions");
    expect(revisionsRes.body).toHaveProperty("count");
    expect(revisionsRes.body.count).toBeGreaterThanOrEqual(1);

    const timelineRes = await request(app)
      .get("/api/memory/timeline?userId=u_crud_e2e_rev")
      .set(await headersFor("u_crud_e2e_rev"));

    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body).toHaveProperty("events");
    expect(timelineRes.body).toHaveProperty("count");
    expect(timelineRes.body.count).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/memory/explain without memoryId returns 400", async () => {
    const res = await request(app)
      .get("/api/memory/explain")
      .set(await headersFor("u_crud_e2e_explain"));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "memoryId is required");
  });

  it("GET /api/memory/explain returns memory + latestRevision + timeline + explanation", async () => {
    const first = await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_crud_e2e_explain"))
      .send({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am learning transformers",
      });
    const memoryId = first.body.acceptedMemories[0]?.id as string;

    await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_crud_e2e_explain"))
      .send({
          userId: "fake_body_user",
          threadId: "t2",
          message: "I trained a transformer model",
      });

    const res = await request(app)
      .get(`/api/memory/explain?memoryId=${memoryId}&userId=u_crud_e2e_explain`)
      .set(await headersFor("u_crud_e2e_explain"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("memory");
    expect(res.body).toHaveProperty("latestRevision");
    expect(res.body).toHaveProperty("timeline");
    expect(res.body).toHaveProperty("explanation");
  });

  it("PATCH /api/memory/:memoryId/archive archives memory and blocks duplicate archive", async () => {
    const first = await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_crud_e2e_archive"))
      .send({
        userId: "fake_body_user",
        threadId: "t1",
        message: "I am building MemoryOS backend",
      });

    const memoryId = first.body.acceptedMemories[0]?.id as string;
    expect(memoryId).toBeTruthy();

    const archiveRes = await request(app)
      .patch(`/api/memory/${memoryId}/archive`)
      .set(await headersFor("u_crud_e2e_archive"))
      .send({});

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body).toHaveProperty("memory");
    expect(archiveRes.body.memory).toHaveProperty("status", "archived");
    expect(archiveRes.body).toHaveProperty("timelineEvent");
    expect(archiveRes.body.timelineEvent).toHaveProperty("eventType", "memory_archived");

    const archiveAgainRes = await request(app)
      .patch(`/api/memory/${memoryId}/archive`)
      .set(await headersFor("u_crud_e2e_archive"))
      .send({});

    expect(archiveAgainRes.status).toBe(400);
    expect(archiveAgainRes.body).toHaveProperty("error", "Memory is already archived");
  });

  it("PATCH /api/memory/:memoryId/unarchive restores archived memory and blocks duplicate unarchive", async () => {
    const first = await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_crud_e2e_unarchive"))
      .send({
        userId: "fake_body_user",
        threadId: "t1",
        message: "I am building MemoryOS backend",
      });

    const memoryId = first.body.acceptedMemories[0]?.id as string;
    expect(memoryId).toBeTruthy();

    const archiveRes = await request(app)
      .patch(`/api/memory/${memoryId}/archive`)
      .set(await headersFor("u_crud_e2e_unarchive"))
      .send({});

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.memory).toHaveProperty("status", "archived");

    const unarchiveRes = await request(app)
      .patch(`/api/memory/${memoryId}/unarchive`)
      .set(await headersFor("u_crud_e2e_unarchive"))
      .send({});

    expect(unarchiveRes.status).toBe(200);
    expect(unarchiveRes.body).toHaveProperty("memory");
    expect(unarchiveRes.body.memory).toHaveProperty("status", "active");
    expect(unarchiveRes.body).toHaveProperty("timelineEvent");
    expect(unarchiveRes.body.timelineEvent).toHaveProperty("eventType", "memory_updated");

    const unarchiveAgainRes = await request(app)
      .patch(`/api/memory/${memoryId}/unarchive`)
      .set(await headersFor("u_crud_e2e_unarchive"))
      .send({});

    expect(unarchiveAgainRes.status).toBe(400);
    expect(unarchiveAgainRes.body).toHaveProperty("error", "Memory is already active");
  });

  it("POST /api/memory/retrieve excludes archived by default and includes with includeArchived=true", async () => {
    const first = await request(app)
      .post("/api/memory/process")
      .set(await headersFor("u_crud_e2e_retrieve_archived"))
      .send({
        userId: "fake_body_user",
        threadId: "t1",
        message: "I am building MemoryOS archive retrieval test",
      });

    const memoryId = first.body.acceptedMemories[0]?.id as string;
    expect(memoryId).toBeTruthy();

    const archiveRes = await request(app)
      .patch(`/api/memory/${memoryId}/archive`)
      .set(await headersFor("u_crud_e2e_retrieve_archived"))
      .send({});

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.memory).toHaveProperty("status", "archived");

    const defaultRetrieve = await request(app)
      .post("/api/memory/retrieve")
      .set(await headersFor("u_crud_e2e_retrieve_archived"))
      .send({
        question: "what should I build next?",
        topK: 10,
      });

    expect(defaultRetrieve.status).toBe(200);
    const defaultIds = new Set(
      (defaultRetrieve.body.memories ?? []).map((memory: { id: string }) => memory.id),
    );
    expect(defaultIds.has(memoryId)).toBe(false);

    const includeArchivedRetrieve = await request(app)
      .post("/api/memory/retrieve")
      .set(await headersFor("u_crud_e2e_retrieve_archived"))
      .send({
        question: "what should I build next?",
        topK: 10,
        includeArchived: true,
      });

    expect(includeArchivedRetrieve.status).toBe(200);
    const includeArchivedIds = new Set(
      (includeArchivedRetrieve.body.memories ?? []).map((memory: { id: string }) => memory.id),
    );
    expect(includeArchivedIds.has(memoryId)).toBe(true);
  });

  it("unknown path returns 404", async () => {
    const res = await request(app)
      .post("/api/memory/not-supported")
      .set(await headersFor("u_crud_unknown"))
      .send({});

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Route not found");
  });
});
