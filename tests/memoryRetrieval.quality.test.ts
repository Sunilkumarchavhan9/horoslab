import { beforeEach, describe, expect, it } from "vitest";
import { runIngestFlowLangGraph } from "../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";
import { resetRuntimeDataStoresForTests } from "./helpers/resetDataDir";
import { setMemoryStoreAdapter } from "../lib/adapters/registry";
import { TestMemoryStoreAdapter } from "./helpers/testMemoryStoreAdapter";

const testMemoryStore = new TestMemoryStoreAdapter();


beforeEach(async () => {
  testMemoryStore.clear();
  setMemoryStoreAdapter(testMemoryStore);
  await resetRuntimeDataStoresForTests();
});

describe("Memory retrieval quality guardrails", () => {
  it("resume-project-1 regression: keeps project as top result and includes episodic context", async () => {
    await runIngestFlowLangGraph({
      userId: "u_quality_resume_1",
      threadId: "t1",
      message: "I am building MemoryOS",
    });

    await runIngestFlowLangGraph({
      userId: "u_quality_resume_1",
      threadId: "t2",
      message: "I shipped JWT auth",
    });

    await runIngestFlowLangGraph({
      userId: "u_quality_resume_1",
      threadId: "t3",
      message: "I added continuity API",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_quality_resume_1",
      question: "where did I leave off in MemoryOS?",
      topK: 5,
    });

    expect(retrieved.memories.length).toBeGreaterThan(0);
    expect(retrieved.memories[0]?.memoryType).toBe("project");

    const memoryTypes = new Set(
      retrieved.memories.map((memory) => memory.memoryType),
    );

    expect(memoryTypes.has("project")).toBe(true);
    expect(memoryTypes.has("episodic")).toBe(true);
  });
});
