import { beforeEach, describe, expect, it, vi } from "vitest";
import { planResume } from "../lib/memory/resumePlanner";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

describe("Resume checkpoint usage", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
  });

  it("uses previous checkpoint summary and state when available", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [
        {
          id: "m1",
          memory: "User is building MemoryOS retrieval trust layer",
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

    const result = await planResume({
      userId: "u1",
      project: "memoryos",
      question: "where did I leave off?",
      previousCheckpoint: {
        result: {
          summary: "You were implementing resume continuity.",
          lastKnownState: "The resume flow was already checkpointed.",
        },
      },
    });

    expect(result.summary).toContain("You were implementing resume continuity.");
    expect(result.summary).toContain("Latest retrieved context");
    expect(result.lastKnownState).toContain(
      "The resume flow was already checkpointed.",
    );
    expect(result.lastKnownState).toContain("Refreshed with top memory");
  });
});
