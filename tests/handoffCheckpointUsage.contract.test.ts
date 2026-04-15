import { beforeEach, describe, expect, it, vi } from "vitest";
import { planHandoff } from "../lib/memory/handoffPlanner";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

describe("Handoff checkpoint usage", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
  });

  it("uses previous handoff context when available", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [
        {
          id: "m1",
          memory: "MemoryOS trust layer endpoint work is in progress",
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
      previousCheckpoint: {
        result: {
          summary: "Previous handoff captured trust work.",
          currentState: "The handoff route had already been wired.",
          openLoops: ["Confirm the next partner-facing demo scope."],
          recommendedNextActions: ["Finish the handoff route tests."],
        },
      },
    });

    expect(result.summary).toContain("Previous handoff captured trust work.");
    expect(result.summary).toContain("Latest handoff context");
    expect(result.currentState).toContain(
      "The handoff route had already been wired.",
    );
    expect(result.openLoops).toContain(
      "Confirm the next partner-facing demo scope.",
    );
    expect(result.recommendedNextActions).toContain(
      "Finish the handoff route tests.",
    );
  });
});
