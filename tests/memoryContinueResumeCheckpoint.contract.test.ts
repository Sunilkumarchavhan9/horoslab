import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runContinueFlowLangGraph } from "../lib/workflows/continueGraphLangGraph";
import { runHandoffFlowLangGraph } from "../lib/workflows/handoffGraphLangGraph";
import { runResumeFlowLangGraph } from "../lib/workflows/resumeGraphLangGraph";
import {
  resetWorkflowStateAdapter,
  setWorkflowStateAdapter,
} from "../lib/adapters/workflowStateAdapter";
import type { WorkflowStateAdapter } from "../lib/adapters/adapters";

const mocks = vi.hoisted(() => ({
  planContinuity: vi.fn(),
  planHandoff: vi.fn(),
  planResume: vi.fn(),
}));

vi.mock("../lib/memory/continuityPlanner", () => ({
  planContinuity: mocks.planContinuity,
}));

vi.mock("../lib/memory/handoffPlanner", () => ({
  planHandoff: mocks.planHandoff,
}));

vi.mock("../lib/memory/resumePlanner", () => ({
  planResume: mocks.planResume,
}));

describe("Continue and resume checkpoint contract", () => {
  beforeEach(() => {
    mocks.planContinuity.mockReset();
    mocks.planHandoff.mockReset();
    mocks.planResume.mockReset();
  });

  afterEach(() => {
    resetWorkflowStateAdapter();
  });

  it("continue flow key uses user/workspace/project/thread dimensions", async () => {
    mocks.planContinuity.mockResolvedValue({
      nextActions: [],
      usedMemories: [],
      debug: { mode: "build_next", retrieval: [] },
    });

    const saveCheckpoint = vi
      .fn<WorkflowStateAdapter["saveCheckpoint"]>()
      .mockResolvedValue(undefined);
    const loadCheckpoint = vi
      .fn<WorkflowStateAdapter["loadCheckpoint"]>()
      .mockResolvedValue(null);

    setWorkflowStateAdapter({
      saveCheckpoint,
      loadCheckpoint,
    });

    await runContinueFlowLangGraph({
      userId: "u-continue-key",
      question: "what next",
      workspace: "ws1",
      project: "memoryos",
      threadId: "t7",
    });

    expect(loadCheckpoint).toHaveBeenCalledWith({
      key: "continue:u-continue-key:ws1:memoryos:t7",
    });
    expect(mocks.planContinuity).toHaveBeenCalledWith({
      userId: "u-continue-key",
      question: "what next",
      workspace: "ws1",
      project: "memoryos",
      threadId: "t7",
      previousCheckpoint: null,
    });
    expect(saveCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "continue:u-continue-key:ws1:memoryos:t7",
      }),
    );
  });

  it("resume flow persists previous checkpoint in saved state", async () => {
    mocks.planResume.mockResolvedValue({
      summary: "resume summary",
      lastKnownState: "known state",
      openLoops: ["loop"],
      recommendedNextStep: "next",
      usedMemories: [],
      debug: { project: "memoryos", retrieval: [] },
    });

    const previous = { stage: "retrieval", at: "before" };
    const saveCheckpoint = vi
      .fn<WorkflowStateAdapter["saveCheckpoint"]>()
      .mockResolvedValue(undefined);
    const loadCheckpoint = vi
      .fn<WorkflowStateAdapter["loadCheckpoint"]>()
      .mockResolvedValue(previous);

    setWorkflowStateAdapter({
      saveCheckpoint,
      loadCheckpoint,
    });

    await runResumeFlowLangGraph({
      userId: "u-resume-key",
      project: "memoryos",
      question: "where left off",
      workspace: "ws2",
      threadId: "t9",
    });

    expect(loadCheckpoint).toHaveBeenCalledWith({
      key: "resume:u-resume-key:ws2:memoryos:t9",
    });
    expect(mocks.planResume).toHaveBeenCalledWith({
      userId: "u-resume-key",
      project: "memoryos",
      question: "where left off",
      workspace: "ws2",
      threadId: "t9",
      previousCheckpoint: previous,
    });
    expect(saveCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "resume:u-resume-key:ws2:memoryos:t9",
        state: expect.objectContaining({
          previousCheckpoint: previous,
          input: expect.objectContaining({
            userId: "u-resume-key",
            project: "memoryos",
            threadId: "t9",
          }),
        }),
      }),
    );
  });

  it("handoff flow key uses user/workspace/project/thread dimensions", async () => {
    mocks.planHandoff.mockResolvedValue({
      summary: "handoff summary",
      currentState: "current state",
      openLoops: ["loop"],
      recommendedNextActions: ["next"],
      keyMemories: [],
      debug: { project: "memoryos", retrieval: [] },
    });

    const saveCheckpoint = vi
      .fn<WorkflowStateAdapter["saveCheckpoint"]>()
      .mockResolvedValue(undefined);
    const loadCheckpoint = vi
      .fn<WorkflowStateAdapter["loadCheckpoint"]>()
      .mockResolvedValue(null);

    setWorkflowStateAdapter({
      saveCheckpoint,
      loadCheckpoint,
    });

    await runHandoffFlowLangGraph({
      userId: "u-handoff-key",
      project: "memoryos",
      question: "prepare a handoff",
      workspace: "ws3",
      threadId: "t11",
    });

    expect(loadCheckpoint).toHaveBeenCalledWith({
      key: "handoff:u-handoff-key:ws3:memoryos:t11",
    });
    expect(mocks.planHandoff).toHaveBeenCalledWith({
      userId: "u-handoff-key",
      project: "memoryos",
      question: "prepare a handoff",
      workspace: "ws3",
      threadId: "t11",
      previousCheckpoint: null,
    });
    expect(saveCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "handoff:u-handoff-key:ws3:memoryos:t11",
      }),
    );
  });
});
