import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  runRetrieveFlowLangGraph,
} from "../lib/workflows/retrieveGraphLangGraph";
import {
  resetWorkflowStateAdapter,
  setWorkflowStateAdapter,
} from "../lib/adapters/workflowStateAdapter";
import type { WorkflowStateAdapter } from "../lib/adapters/adapters";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

describe("Retrieve checkpoint contract", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
  });

  afterEach(() => {
    resetWorkflowStateAdapter();
  });

  it("uses distinct checkpoint keys across thread dimensions", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
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

    await runRetrieveFlowLangGraph({
      userId: "u_ckpt",
      question: "what should I build next?",
      workspace: "ws1",
      project: "memoryos",
      threadId: "t1",
    });

    await runRetrieveFlowLangGraph({
      userId: "u_ckpt",
      question: "what should I build next?",
      workspace: "ws1",
      project: "memoryos",
      threadId: "t2",
    });

    expect(loadCheckpoint).toHaveBeenNthCalledWith(1, {
      key: "retrieve:u_ckpt:ws1:memoryos:t1",
    });
    expect(loadCheckpoint).toHaveBeenNthCalledWith(2, {
      key: "retrieve:u_ckpt:ws1:memoryos:t2",
    });

    expect(saveCheckpoint).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: "retrieve:u_ckpt:ws1:memoryos:t1",
      }),
    );
    expect(saveCheckpoint).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        key: "retrieve:u_ckpt:ws1:memoryos:t2",
      }),
    );
  });

  it("persists previous checkpoint context in saved retrieve state", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });

    const previous = { step: "fetchCandidates", from: "prior-run" };
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

    await runRetrieveFlowLangGraph({
      userId: "u_ckpt_prev",
      question: "where did I leave off?",
      workspace: "default",
      project: "memoryos",
      threadId: "thread-a",
    });

    expect(saveCheckpoint).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "retrieve:u_ckpt_prev:default:memoryos:thread-a",
        state: expect.objectContaining({
          previousCheckpoint: previous,
          input: expect.objectContaining({
            userId: "u_ckpt_prev",
            threadId: "thread-a",
          }),
          result: expect.objectContaining({
            memories: [],
            debug: [],
          }),
        }),
      }),
    );
  });
});

