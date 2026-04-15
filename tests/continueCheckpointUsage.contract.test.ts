import { beforeEach, describe, expect, it, vi } from "vitest";
import { planContinuity } from "../lib/memory/continuityPlanner";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

describe("Continue checkpoint usage", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
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
});
