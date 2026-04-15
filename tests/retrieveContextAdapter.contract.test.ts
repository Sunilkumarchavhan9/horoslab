import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetContextAdapter,
  resetMemoryStoreAdapter,
  setContextAdapter,
  setMemoryStoreAdapter,
} from "../lib/adapters/registry";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import type {
  ContextAdapter,
  MemoryStoreAdapter,
} from "../lib/adapters/adapters";

describe("Retrieve context adapter contract", () => {
  beforeEach(() => {
    setMemoryStoreAdapter({
      saveMemory: vi
        .fn<MemoryStoreAdapter["saveMemory"]>()
        .mockResolvedValue({ id: "m-store" }),
      searchMemory: vi
        .fn<MemoryStoreAdapter["searchMemory"]>()
        .mockResolvedValue([]),
      getMemoryById: vi
        .fn<MemoryStoreAdapter["getMemoryById"]>()
        .mockResolvedValue(null),
    });
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
    resetContextAdapter();
  });

  it("merges scoped context adapter results into retrieval candidates", async () => {
    const searchContext = vi
      .fn<ContextAdapter["searchContext"]>()
      .mockResolvedValue([
        {
          id: "ctx-1",
          content: "MemoryOS handoff notes for the retrieval refactor",
          score: 0.97,
          metadata: {
            type: "project",
            status: "active",
            summary: "Handoff notes for retrieval refactor",
            importanceScore: 0.88,
            updatedAt: "2026-04-10T00:00:00.000Z",
            evidenceCount: 2,
          },
        },
      ]);

    setContextAdapter({
      ingestContext: vi
        .fn<ContextAdapter["ingestContext"]>()
        .mockResolvedValue(undefined),
      searchContext,
    });

    const result = await retrieveRelevantMemory({
      userId: "u_ctx",
      question: "what should I build next for MemoryOS?",
      topK: 3,
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-7",
    });

    expect(searchContext).toHaveBeenCalledWith({
      userId: "u_ctx",
      query: "what should I build next for MemoryOS?",
      topK: 10,
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-7",
    });

    expect(result.memories).toHaveLength(1);
    expect(result.memories[0]).toMatchObject({
      id: "ctx-1",
      memory: "MemoryOS handoff notes for the retrieval refactor",
      memoryType: "project",
    });
    expect(result.debug[0]?.reasonTags).toContain("type:project");
  });
});
