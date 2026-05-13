/**
 * Memory Doctor Route Contract Tests
 *
 * These tests guard against a specific class of regression: the memory-doctor
 * router being shadowed by the more generic `/api/memory` router due to mount
 * order in `server/app.ts`. When that happens, every doctor endpoint returns
 * 404 with no error stack, which is invisible in unit tests of the doctor
 * router itself.
 *
 * Each test asserts the route is REACHED (status !== 404) under valid auth.
 * The downstream agent / store dependencies are mocked or overridden so this
 * test exercises routing and request/response shape only — not agent or
 * store behavior.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { makeToken } from "./helpers/authToken";

const mocks = vi.hoisted(() => ({
  invokeAgentJson: vi.fn(),
  explainMemory: vi.fn(),
  listMemories: vi.fn(),
}));

// Mock only the leaf modules that the memory-doctor router calls directly.
// Do NOT mock `@/lib/adapters/registry` — many other modules in the app
// graph (retrieve, list, archive, etc.) need its full surface at import time.
vi.mock("@/lib/ai/agentRouter", () => ({
  invokeAgentJson: mocks.invokeAgentJson,
}));

vi.mock("@/lib/memory/explainMemory", () => ({
  explainMemory: mocks.explainMemory,
}));

vi.mock("@/lib/memory/listMemory", () => ({
  listMemories: mocks.listMemories,
}));

import { createMemoryOsApp } from "../server/app";
import {
  resetMemoryStoreAdapter,
  setMemoryStoreAdapter,
} from "../lib/adapters/registry";
import type { MemoryStoreAdapter } from "../lib/adapters/adapters";

describe("Memory Doctor Route Contracts", () => {
  const app = createMemoryOsApp();
  const authUserId = "u_doctor_contract";
  let authHeader = "";

  // Stub adapter used only by /promote/:id. Tests override `getMemoryById` /
  // `saveMemory` per-test by reassigning the spies.
  const adapterStub = {
    getMemoryById: vi.fn(),
    saveMemory: vi.fn(),
    searchMemory: vi.fn(async () => []),
  } as unknown as MemoryStoreAdapter & {
    getMemoryById: ReturnType<typeof vi.fn>;
    saveMemory: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mocks.invokeAgentJson.mockReset();
    mocks.explainMemory.mockReset();
    mocks.listMemories.mockReset();
    (adapterStub.getMemoryById as ReturnType<typeof vi.fn>).mockReset();
    (adapterStub.saveMemory as ReturnType<typeof vi.fn>).mockReset();
    setMemoryStoreAdapter(adapterStub);
    authHeader = `Bearer ${await makeToken(authUserId)}`;
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
  });

  describe("Route registration (regression guard for mount-order bug)", () => {
    it("POST /api/memory/doctor/autopilot is reachable (not shadowed by /api/memory)", async () => {
      mocks.listMemories.mockResolvedValue({ memories: [] });

      const res = await request(app)
        .post("/api/memory/doctor/autopilot")
        .set("authorization", authHeader)
        .send({});

      expect(res.status).not.toBe(404);
      expect(res.status).toBe(200);
    });

    it("POST /api/memory/doctor/compile is reachable", async () => {
      mocks.listMemories.mockResolvedValue({ memories: [] });

      const res = await request(app)
        .post("/api/memory/doctor/compile")
        .set("authorization", authHeader)
        .send({});

      expect(res.status).not.toBe(404);
      expect(res.status).toBe(200);
    });

    it("POST /api/memory/doctor/explain/:id is reachable (returns domain 404, not routing 404)", async () => {
      mocks.explainMemory.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/memory/doctor/explain/some-memory-id")
        .set("authorization", authHeader)
        .send({});

      // The route is reached and runs the handler. The handler returns 404
      // with a structured error envelope when the memory does not exist.
      // That's distinct from a routing 404 (a bare object without
      // `ok: false / error.code`).
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        ok: false,
        error: { code: "NOT_FOUND" },
      });
      expect(mocks.explainMemory).toHaveBeenCalledWith({
        memoryId: "some-memory-id",
        userId: authUserId,
      });
    });

    it("POST /api/memory/doctor/promote/:id is reachable", async () => {
      (adapterStub.getMemoryById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/memory/doctor/promote/some-memory-id")
        .set("authorization", authHeader)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        ok: false,
        error: { code: "NOT_FOUND" },
      });
      expect(adapterStub.getMemoryById).toHaveBeenCalledWith({ id: "some-memory-id" });
    });
  });

  describe("Authentication", () => {
    it("returns 401 when auth header is missing on /autopilot", async () => {
      const res = await request(app).post("/api/memory/doctor/autopilot").send({});
      expect(res.status).toBe(401);
    });

    it("returns 401 when auth header is missing on /compile", async () => {
      const res = await request(app).post("/api/memory/doctor/compile").send({});
      expect(res.status).toBe(401);
    });

    it("returns 401 when auth header is missing on /explain/:id", async () => {
      const res = await request(app).post("/api/memory/doctor/explain/x").send({});
      expect(res.status).toBe(401);
    });

    it("returns 401 when auth header is missing on /promote/:id", async () => {
      const res = await request(app).post("/api/memory/doctor/promote/x").send({});
      expect(res.status).toBe(401);
    });
  });

  describe("Happy-path response shape (with mocked agent)", () => {
    it("/explain returns agent payload merged with localExplanation", async () => {
      mocks.explainMemory.mockResolvedValue({
        memory: {
          id: "m1",
          userId: authUserId,
          type: "project",
          content: "Building MemoryOS",
          summary: "Working on MemoryOS",
          status: "active",
          confidence: 0.9,
          importanceScore: 0.8,
          evidenceCount: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        explanation: {
          whySaved: "User explicitly stated this",
          stalenessBucket: "fresh",
          stalenessDays: 1,
        },
      });
      mocks.invokeAgentJson.mockResolvedValue({
        summary: "Working on MemoryOS",
        reason: "Direct user statement",
        category: "project",
        recommendation: "keep",
        confidence: 0.95,
      });

      const res = await request(app)
        .post("/api/memory/doctor/explain/m1")
        .set("authorization", authHeader)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.summary", "Working on MemoryOS");
      expect(res.body).toHaveProperty("data.recommendation", "keep");
      expect(res.body).toHaveProperty("data.localExplanation");
      expect(res.body).toHaveProperty("data.memory.id", "m1");
    });

    it("/autopilot returns issues + suggestedActions arrays", async () => {
      mocks.listMemories.mockResolvedValue({
        memories: [
          {
            id: "m1",
            type: "project",
            summary: "MemoryOS",
            content: "Building MemoryOS",
            status: "active",
            confidence: 0.9,
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });
      mocks.invokeAgentJson.mockResolvedValue({
        issues: [],
        suggestedActions: [],
      });

      const res = await request(app)
        .post("/api/memory/doctor/autopilot")
        .set("authorization", authHeader)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data.issues");
      expect(res.body).toHaveProperty("data.suggestedActions");
      expect(Array.isArray(res.body.data.issues)).toBe(true);
      expect(Array.isArray(res.body.data.suggestedActions)).toBe(true);
    });
  });
});
