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

