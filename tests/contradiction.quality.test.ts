import { beforeEach, describe, expect, it } from "vitest";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import { resetRuntimeDataStoresForTests } from "./helpers/resetDataDir";
import { setMemoryStoreAdapter } from "../lib/adapters/registry";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";

const testMemoryStore = new TestMemoryStoreAdapter();


describe("Contradiction diagnostics retrieval", () => {
  beforeEach(async () => {
    testMemoryStore.clear();
    setMemoryStoreAdapter(testMemoryStore);
    await resetRuntimeDataStoresForTests();
  });

  it("default retrieval excludes contradicted memories, includeArchived=true can return them", async () => {
    const userId = "u_diag_contra";

    await runIngestFlowLangGraph({
      userId,
      threadId: "t1",
      message: "I prefer TypeScript over Python",
    });

    await runIngestFlowLangGraph({
      userId,
      threadId: "t2",
      message: "I prefer Python over TypeScript",
    });

    const defaultRes = await retrieveRelevantMemory({
      userId,
      question: "what stack should I use?",
      topK: 10,
    });

    const defaultHasContradicted = defaultRes.memories.some((m) => {
      const status = (m.metadata as Record<string, unknown> | undefined)?.status;
      return status === "contradicted";
    });

    expect(defaultHasContradicted).toBe(false);

    const diagRes = await retrieveRelevantMemory({
      userId,
      question: "what stack should I use?",
      topK: 10,
      includeArchived: true,
    });

    const diagHasContradicted = diagRes.memories.some((m) => {
      const status = (m.metadata as Record<string, unknown> | undefined)?.status;
      return status === "contradicted";
    });

    expect(diagHasContradicted).toBe(true);
  });
});

