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

describe("Retrieve intent quality guardrails", () => {
  it("detects handoff intent and surfaces project continuity memory", async () => {
    await runIngestFlowLangGraph({
      userId: "u_intent_handoff",
      threadId: "t1",
      message: "I am building MemoryOS collaboration backend",
    });

    await runIngestFlowLangGraph({
      userId: "u_intent_handoff",
      threadId: "t2",
      message: "I solved Redis locking bug in worker queue",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_intent_handoff",
      question: "Create a handoff for another agent to take over this project.",
      topK: 5,
    });

    expect(retrieved.debug.length).toBeGreaterThan(0);
    expect(retrieved.debug[0]?.intent).toBe("handoff");
    const topTypes = new Set(
      retrieved.memories.slice(0, 3).map((memory) => memory.memoryType),
    );
    expect(topTypes.has("project")).toBe(true);
  });

  it("detects decision recall intent and prioritizes preference memory", async () => {
    await runIngestFlowLangGraph({
      userId: "u_intent_decision",
      threadId: "t1",
      message: "I prefer TypeScript over Python",
    });

    await runIngestFlowLangGraph({
      userId: "u_intent_decision",
      threadId: "t2",
      message: "I am building MemoryOS API",
    });

    const retrieved = await retrieveRelevantMemory({
      userId: "u_intent_decision",
      question: "Why did I choose TypeScript over Python before?",
      topK: 5,
    });

    expect(retrieved.debug.length).toBeGreaterThan(0);
    expect(retrieved.debug[0]?.intent).toBe("decision_recall");
    expect(retrieved.memories[0]?.memoryType).toBe("preference");
  });
});

