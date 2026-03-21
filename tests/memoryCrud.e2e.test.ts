import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync } from "fs";
import path from "path";
import {
  GET as memoryRouteGet,
  POST as memoryRoutePost,
} from "../app/api/memory/[...slug]/route";

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
  const headersFor = (userId: string) => ({
    "content-type": "application/json",
    "x-user-id": userId,
  });

  it("returns 401 when x-user-id header is missing", async () => {
    const req = new Request("http://localhost/api/memory/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "I am learning transformers",
      }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toHaveProperty("error", "Unauthorized");
  });

  it("POST /api/memory/process works", async () => {
    const req = new Request("http://localhost/api/memory/process", {
      method: "POST",
      headers: headersFor("u_crud_e2e"),
      body: JSON.stringify({
        userId: "fake_body_user",
        threadId: "t1",
        message: "I am learning transformers",
      }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("acceptedMemories");
    expect(body).toHaveProperty("rejectedMemories");
    expect(body).toHaveProperty("timelineEvents");
    expect(body.acceptedMemories.length).toBeGreaterThan(0);
  });

  it("POST /api/memory/retrieve works", async () => {
    // seed one memory first
    await memoryRoutePost(
      new Request("http://localhost/api/memory/process", {
        method: "POST",
        headers: headersFor("u_crud_e2e_retrieve"),
        body: JSON.stringify({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am building MemoryOS",
        }),
      }),
    );

    const req = new Request("http://localhost/api/memory/retrieve", {
      method: "POST",
      headers: headersFor("u_crud_e2e_retrieve"),
      body: JSON.stringify({
        userId: "fake_body_user",
        question: "what should I build next?",
      }),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("memories");
    expect(body).toHaveProperty("debug");
  });

  it("GET /api/memory/revisions and /timeline work", async () => {
    const first = await memoryRoutePost(
      new Request("http://localhost/api/memory/process", {
        method: "POST",
        headers: headersFor("u_crud_e2e_rev"),
        body: JSON.stringify({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am learning transformers",
        }),
      }),
    );
    const firstBody = await first.json();
    const memoryId = firstBody.acceptedMemories[0]?.id as string;

    await memoryRoutePost(
      new Request("http://localhost/api/memory/process", {
        method: "POST",
        headers: headersFor("u_crud_e2e_rev"),
        body: JSON.stringify({
          userId: "fake_body_user",
          threadId: "t2",
          message: "I trained a transformer model",
        }),
      }),
    );

    const revisionsRes = await memoryRouteGet(
      new Request(
        `http://localhost/api/memory/revisions?memoryId=${memoryId}`,
        {
          method: "GET",
          headers: { "x-user-id": "u_crud_e2e_rev" },
        },
      ),
    );
    const revisionsBody = await revisionsRes.json();

    expect(revisionsRes.status).toBe(200);
    expect(revisionsBody).toHaveProperty("revisions");
    expect(revisionsBody).toHaveProperty("count");
    expect(revisionsBody.count).toBeGreaterThanOrEqual(1);

    const timelineRes = await memoryRouteGet(
      new Request("http://localhost/api/memory/timeline?userId=u_crud_e2e_rev", {
        method: "GET",
        headers: { "x-user-id": "u_crud_e2e_rev" },
      }),
    );
    const timelineBody = await timelineRes.json();

    expect(timelineRes.status).toBe(200);
    expect(timelineBody).toHaveProperty("events");
    expect(timelineBody).toHaveProperty("count");
    expect(timelineBody.count).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/memory/explain without memoryId returns 400", async () => {
    const res = await memoryRouteGet(
      new Request("http://localhost/api/memory/explain", {
        method: "GET",
        headers: { "x-user-id": "u_crud_e2e_explain" },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toHaveProperty("error", "memoryId is required");
  });

  it("GET /api/memory/explain returns memory + latestRevision + timeline + explanation", async () => {
    const first = await memoryRoutePost(
      new Request("http://localhost/api/memory/process", {
        method: "POST",
        headers: headersFor("u_crud_e2e_explain"),
        body: JSON.stringify({
          userId: "fake_body_user",
          threadId: "t1",
          message: "I am learning transformers",
        }),
      }),
    );
    const firstBody = await first.json();
    const memoryId = firstBody.acceptedMemories[0]?.id as string;

    await memoryRoutePost(
      new Request("http://localhost/api/memory/process", {
        method: "POST",
        headers: headersFor("u_crud_e2e_explain"),
        body: JSON.stringify({
          userId: "fake_body_user",
          threadId: "t2",
          message: "I trained a transformer model",
        }),
      }),
    );

    const res = await memoryRouteGet(
      new Request(
        `http://localhost/api/memory/explain?memoryId=${memoryId}&userId=u_crud_e2e_explain`,
        {
          method: "GET",
          headers: { "x-user-id": "u_crud_e2e_explain" },
        },
      ),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("memory");
    expect(body).toHaveProperty("latestRevision");
    expect(body).toHaveProperty("timeline");
    expect(body).toHaveProperty("explanation");
  });

  it("unknown path returns 404", async () => {
    const req = new Request("http://localhost/api/memory/not-supported", {
      method: "POST",
      headers: headersFor("u_crud_unknown"),
      body: JSON.stringify({}),
    });

    const res = await memoryRoutePost(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toHaveProperty("error", "Route not found");
  });
});
