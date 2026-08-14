import { beforeEach, describe, expect, it, vi } from "vitest";
import { planContinuity } from "../lib/memory/continuityPlanner";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
  listActionMemories: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

vi.mock("../lib/memory/actionMemoryStore", () => ({
  listActionMemories: mocks.listActionMemories,
}));

describe("Continue checkpoint usage", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
    mocks.listActionMemories.mockReset();
    mocks.listActionMemories.mockResolvedValue([]);
  });

  it("reuses previous next actions when current retrieval is empty", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });

    const result = await planContinuity({
      userId: "u1",
      question: "what should I do next?",
      previousCheckpoint: {
        result: {
          nextActions: [
            "Finish the trust layer endpoint.",
            "Add retrieval diagnostics tests.",
          ],
          debug: {
            mode: "build_next",
          },
        },
      },
    });

    expect(result.nextActions).toContain("Finish the trust layer endpoint.");
    expect(result.nextActions).toContain("Add retrieval diagnostics tests.");
  });

  it("surfaces successful Mythic lineage in build-next planning", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });
    mocks.listActionMemories.mockResolvedValue([
      {
        id: "act-1",
        userId: "u1",
        projectId: "memoryos",
        workspace: "memoryos",
        action: "Mythic execution completed: Runtime worker hardening",
        reason: "Persist worker jobs and prevent duplicate retries",
        outcome: "success",
        sourceType: "continuity",
        sourceId: "thread-1",
        metadata: {
          provenanceTags: ["mythic_execution", "mythic_handoff"],
        },
        updatedAt: "2026-06-12T10:00:00.000Z",
      },
    ]);

    const result = await planContinuity({
      userId: "u1",
      question: "what should I build next?",
      project: "memoryos",
      mode: "build_next",
    });

    expect(result.usedMemories[0]?.source).toContain("mythic_execution");
    expect(result.nextActions[0]).toContain("successful Mythic execution path");
  });
});
