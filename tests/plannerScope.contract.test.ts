import { beforeEach, describe, expect, it, vi } from "vitest";
import { planContinuity } from "../lib/memory/continuityPlanner";
import { planResume } from "../lib/memory/resumePlanner";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

describe("Planner scope contract", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });
  });

  it("forwards workspace/project/thread scope through continuity planning", async () => {
    await planContinuity({
      userId: "u_scope_continue",
      question: "continue memoryos work",
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-42",
    });

    expect(mocks.retrieveRelevantMemory).toHaveBeenCalledWith({
      userId: "u_scope_continue",
      question: "continue memoryos work",
      topK: 5,
      includeArchived: false,
      workspace: "ws-alpha",
      project: "memoryos",
      threadId: "thread-42",
    });
  });

  it("forwards workspace/thread scope through resume planning", async () => {
    await planResume({
      userId: "u_scope_resume",
      project: "memoryos",
      question: "where did I leave off?",
      workspace: "ws-beta",
      threadId: "thread-9",
    });

    expect(mocks.retrieveRelevantMemory).toHaveBeenCalledWith({
      userId: "u_scope_resume",
      question: "memoryos where did I leave off?",
      project: "memoryos",
      topK: 5,
      includeArchived: false,
      workspace: "ws-beta",
      threadId: "thread-9",
    });
  });
});
