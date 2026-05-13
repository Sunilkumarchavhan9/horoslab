import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getContextAdapter,
  getMemoryStoreAdapter,
  resetContextAdapter,
  resetMemoryStoreAdapter,
  setContextAdapter,
  setMemoryStoreAdapter,
} from "../lib/adapters/registry";
import {
  getWorkflowStateAdapter,
  resetWorkflowStateAdapter,
  setWorkflowStateAdapter,
} from "../lib/adapters/workflowStateAdapter";
import type {
  ContextAdapter,
  MemoryStoreAdapter,
  WorkflowStateAdapter,
} from "../lib/adapters/adapters";

describe("Adapter contract registry", () => {
  afterEach(() => {
    resetMemoryStoreAdapter();
    resetContextAdapter();
    resetWorkflowStateAdapter();
  });

  it("uses overridden MemoryStoreAdapter contract implementation", async () => {
    const saveMemory = vi.fn<MemoryStoreAdapter["saveMemory"]>().mockResolvedValue({
      id: "m1",
    });
    const searchMemory = vi
      .fn<MemoryStoreAdapter["searchMemory"]>()
      .mockResolvedValue([]);
    const getMemoryById = vi
      .fn<MemoryStoreAdapter["getMemoryById"]>()
      .mockResolvedValue(null);

    const adapter: MemoryStoreAdapter = {
      saveMemory,
      searchMemory,
      getMemoryById,
    };

    setMemoryStoreAdapter(adapter);
    await getMemoryStoreAdapter().saveMemory({
      memory: {
        id: "m1",
        userId: "u1",
        type: "project",
        content: "User is building MemoryOS",
        summary: "Building MemoryOS",
        importanceScore: 0.9,
        confidence: 0.8,
        source: "chat",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidenceCount: 1,
      },
    });

    expect(saveMemory).toHaveBeenCalledTimes(1);
  });

  it("provides a no-op default ContextAdapter and supports override", async () => {
    const originalApiKey = process.env.SUPERMEMORY_API_KEY;
    delete process.env.SUPERMEMORY_API_KEY;
    resetContextAdapter();
    
    const defaultAdapter = getContextAdapter();
    await expect(
      defaultAdapter.ingestContext({
        userId: "u1",
        source: "test",
        payload: { ok: true },
      }),
    ).resolves.toBeUndefined();
    await expect(
      defaultAdapter.searchContext({
        userId: "u1",
        query: "memory context",
      }),
    ).resolves.toEqual([]);

    const ingestContext = vi
      .fn<ContextAdapter["ingestContext"]>()
      .mockResolvedValue(undefined);
    const searchContext = vi
      .fn<ContextAdapter["searchContext"]>()
      .mockResolvedValue([{ id: "ctx-1" }]);

    const override: ContextAdapter = {
      ingestContext,
      searchContext,
    };

    setContextAdapter(override);

    const results = await getContextAdapter().searchContext({
      userId: "u1",
      query: "debug history",
      topK: 3,
    });

    expect(results).toEqual([{ id: "ctx-1" }]);
    expect(searchContext).toHaveBeenCalledWith({
      userId: "u1",
      query: "debug history",
      topK: 3,
    });
    
    if (originalApiKey) {
      process.env.SUPERMEMORY_API_KEY = originalApiKey;
    }
  });

  it("uses overridden WorkflowStateAdapter contract implementation", async () => {
    const saveCheckpoint = vi
      .fn<WorkflowStateAdapter["saveCheckpoint"]>()
      .mockResolvedValue(undefined);
    const loadCheckpoint = vi
      .fn<WorkflowStateAdapter["loadCheckpoint"]>()
      .mockResolvedValue({ step: "retrieval" });

    const adapter: WorkflowStateAdapter = {
      saveCheckpoint,
      loadCheckpoint,
    };

    setWorkflowStateAdapter(adapter);

    const checkpoint = await getWorkflowStateAdapter().loadCheckpoint({
      key: "resume:u1:default:memoryos:t1",
    });

    expect(checkpoint).toEqual({ step: "retrieval" });
    expect(loadCheckpoint).toHaveBeenCalledTimes(1);
  });
});

