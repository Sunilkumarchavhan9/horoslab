import { beforeEach, describe, expect, it, vi } from "vitest";
import { planHandoff } from "../lib/memory/handoffPlanner";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

describe("Handoff planner contract", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
  });

  it("returns structured handoff output from retrieved memories", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [
        {
          id: "m1",
          memory: "MemoryOS trust layer work is in progress",
          memoryType: "project",
          importanceScore: 0.9,
          recencyScore: 1,
          typeRelevanceScore: 1,
          semanticScore: 0.95,
          continuityBoost: 0.1,
          finalScore: 0.98,
          updatedAt: "2026-04-13T00:00:00.000Z",
        },
      ],
      debug: [],
    });

    const result = await planHandoff({
      userId: "u1",
      project: "memoryos",
      question: "prepare a handoff",
    });

    expect(result.summary).toContain("Handoff for memoryos");
    expect(result.currentState).toContain("Top current state");
    expect(result.keyMemories).toHaveLength(1);
    expect(result.openLoops.length).toBeGreaterThan(0);
    expect(result.recommendedNextActions.length).toBeGreaterThan(0);
  });

  it("returns a safe fallback when no memories are retrieved", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });

    const result = await planHandoff({
      userId: "u1",
      project: "memoryos",
      question: "prepare a handoff",
    });

    expect(result.summary).toContain("No strong handoff context found");
    expect(result.keyMemories).toHaveLength(0);
  });
});
