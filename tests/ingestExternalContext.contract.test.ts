import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import {
  resetContextAdapter,
  resetMemoryStoreAdapter,
  setContextAdapter,
  setMemoryStoreAdapter,
} from "../lib/adapters/registry";
import type {
  ContextAdapter,
  MemoryStoreAdapter,
} from "../lib/adapters/adapters";
import { resetRuntimeDataStores } from "./helpers/resetDataDir";

describe("Ingest external context contract", () => {
  beforeEach(() => {
    resetRuntimeDataStores();
  });

  afterEach(() => {
    resetMemoryStoreAdapter();
    resetContextAdapter();
  });

  it("ingests accepted memory context after persistence", async () => {
    const ingestContext = vi
      .fn<ContextAdapter["ingestContext"]>()
      .mockResolvedValue(undefined);

    setContextAdapter({
      ingestContext,
      searchContext: vi.fn<ContextAdapter["searchContext"]>().mockResolvedValue([]),
    });

    setMemoryStoreAdapter({
      saveMemory: vi
        .fn<MemoryStoreAdapter["saveMemory"]>()
        .mockImplementation(async ({ memory }) => ({ id: memory.id })),
      searchMemory: vi
        .fn<MemoryStoreAdapter["searchMemory"]>()
        .mockResolvedValue([]),
      getMemoryById: vi
        .fn<MemoryStoreAdapter["getMemoryById"]>()
        .mockResolvedValue(null),
    });

    await runIngestFlowLangGraph({
      userId: "u_ingest_ctx",
      threadId: "thread-1",
      message: "I am building MemoryOS retrieval trust layer",
    });

    expect(ingestContext).toHaveBeenCalledTimes(1);
    expect(ingestContext).toHaveBeenCalledWith({
      userId: "u_ingest_ctx",
      source: "memoryos_ingest",
      threadId: "thread-1",
      payload: expect.objectContaining({
        message: "I am building MemoryOS retrieval trust layer",
        acceptedMemories: [
          expect.objectContaining({
            type: "project",
            summary: "Building MemoryOS retrieval trust layer",
            status: "active",
          }),
        ],
      }),
    });
  });

  it("skips external context ingest when no memories are accepted", async () => {
    const ingestContext = vi
      .fn<ContextAdapter["ingestContext"]>()
      .mockResolvedValue(undefined);

    setContextAdapter({
      ingestContext,
      searchContext: vi.fn<ContextAdapter["searchContext"]>().mockResolvedValue([]),
    });

    setMemoryStoreAdapter({
      saveMemory: vi
        .fn<MemoryStoreAdapter["saveMemory"]>()
        .mockImplementation(async ({ memory }) => ({ id: memory.id })),
      searchMemory: vi
        .fn<MemoryStoreAdapter["searchMemory"]>()
        .mockResolvedValue([]),
      getMemoryById: vi
        .fn<MemoryStoreAdapter["getMemoryById"]>()
        .mockResolvedValue(null),
    });

    await runIngestFlowLangGraph({
      userId: "u_ingest_ctx_none",
      threadId: "thread-2",
      message: "hello",
    });

    expect(ingestContext).not.toHaveBeenCalled();
  });
});
