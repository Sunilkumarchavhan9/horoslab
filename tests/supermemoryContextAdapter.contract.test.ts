import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SupermemoryContextAdapter,
  type SupermemoryContextClient,
} from "../lib/adapters/supermemoryContextAdapter";

describe("SupermemoryContextAdapter", () => {
  let client: SupermemoryContextClient;

  beforeEach(() => {
    client = {
      addDocument: vi.fn().mockResolvedValue({ id: "doc-1", status: "queued" }),
      search: vi.fn().mockResolvedValue({ results: [] }),
    };
  });

  it("normalizes ingested context into a Supermemory document payload", async () => {
    const adapter = new SupermemoryContextAdapter({
      client,
      namespace: "memoryos",
    });

    await adapter.ingestContext({
      userId: "u_ctx",
      source: "cursor",
      payload: {
        summary: "Retrieval refactor handoff",
        type: "project",
        severity: "high",
      },
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-7",
    });

    expect(client.addDocument).toHaveBeenCalledTimes(1);
    expect(client.addDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        containerTag: "memoryos:ctx:memoryos:u_ctx",
        metadata: expect.objectContaining({
          user_id: "u_ctx",
          source: "cursor",
          payload_kind: "json",
          workspace: "ws-alpha",
          project: "memoryos",
          thread_id: "thread-7",
          summary: "Retrieval refactor handoff",
          type: "project",
          severity: "high",
        }),
      }),
    );
  });

  it("maps provider search results and filters them by scope metadata", async () => {
    (client.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      results: [
        {
          documentId: "doc-1",
          score: 0.92,
          metadata: {
            source: "supermemory",
            workspace: "ws-alpha",
            project: "memoryos",
            thread_id: "thread-7",
            type: "project",
            status: "active",
          },
          updatedAt: "2026-04-12T00:00:00.000Z",
          chunks: [
            {
              id: "chunk-1",
              content: "Handoff notes for the retrieval refactor",
              score: 0.92,
            },
          ],
        },
        {
          documentId: "doc-2",
          score: 0.88,
          metadata: {
            workspace: "ws-beta",
            project: "memoryos",
          },
          chunk: "Other workspace note",
        },
      ],
    });

    const adapter = new SupermemoryContextAdapter({
      client,
      namespace: "memoryos",
    });

    const results = await adapter.searchContext({
      userId: "u_ctx",
      query: "retrieval handoff",
      topK: 5,
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-7",
    });

    expect(client.search).toHaveBeenCalledWith({
      q: "retrieval handoff",
      limit: 5,
      containerTag: "memoryos:ctx:memoryos:u_ctx",
      searchMode: "hybrid",
      rerank: true,
      rewriteQuery: false,
    });

    expect(results).toEqual([
      {
        id: "doc-1",
        score: 0.92,
        content: "Handoff notes for the retrieval refactor",
        metadata: expect.objectContaining({
          workspace: "ws-alpha",
          project: "memoryos",
          thread_id: "thread-7",
          updatedAt: "2026-04-12T00:00:00.000Z",
        }),
        source: "supermemory",
      },
    ]);
  });

  it("throws when ingest payload is empty after normalization", async () => {
    const adapter = new SupermemoryContextAdapter({
      client,
    });

    await expect(
      adapter.ingestContext({
        userId: "u_ctx",
        source: "cursor",
        payload: "",
      }),
    ).rejects.toThrow("Supermemory context ingest requires non-empty payload");
  });
});
