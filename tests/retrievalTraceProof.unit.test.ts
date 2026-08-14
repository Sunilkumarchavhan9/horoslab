import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";
import { upsertRecentMemory } from "../lib/memory/recentMemoryStore";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";

vi.mock("../lib/adapters/registry", () => ({
  getMemoryStoreAdapter: () => ({
    saveMemory: vi.fn(),
    searchMemory: vi.fn(async () => []),
    getMemoryById: vi.fn(async () => null),
  }),
  getContextAdapter: () => ({
    ingestContext: vi.fn(),
    searchContext: vi.fn(async () => []),
  }),
}));

beforeEach(() => {
  process.env.MEMORY_STORE_BACKEND = "postgres";
  resetRuntimeDataStores();
});

describe("retrieval source proof", () => {
  it("preserves sourceRef and traceProof for source-backed memories", async () => {
    const now = new Date().toISOString();

    await upsertRecentMemory({
      id: "github-repo-memory",
      userId: "u_trace",
      type: "project",
      content: "GitHub repository memoryos/app is connected to MemoryOS for future agents.",
      summary: "GitHub repository memoryos/app imported as an engineering source.",
      source: "import",
      status: "active",
      createdAt: now,
      updatedAt: now,
      importanceScore: 0.9,
      confidence: 0.92,
      evidenceCount: 2,
      sourceRef: "github://memoryos/app",
      traceProof: {
        sourceType: "github",
        sourceRef: "github://memoryos/app",
        evidence: ["Repository: memoryos/app", "https://github.com/memoryos/app"],
        confidence: 0.92,
        capturedAt: now,
      },
    });

    const result = await retrieveRelevantMemory({
      userId: "u_trace",
      question: "What GitHub repositories should future agents inherit?",
      topK: 5,
    });

    const githubMemory = result.memories.find((memory) => memory.sourceRef === "github://memoryos/app");
    expect(githubMemory).toBeDefined();
    expect(githubMemory?.traceProof).toMatchObject({
      sourceType: "github",
      sourceRef: "github://memoryos/app",
    });
    expect(githubMemory?.metadata?.sourceRef).toBe("github://memoryos/app");
    expect(githubMemory?.metadata?.traceProof).toMatchObject({
      sourceType: "github",
      sourceRef: "github://memoryos/app",
    });
  });
});
