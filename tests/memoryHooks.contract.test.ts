import { beforeEach, describe, expect, it, vi } from "vitest";
import { afterModel, beforeModel } from "../lib/SDK/memoryHooks";

const mocks = vi.hoisted(() => ({
  runRetrieveFlowLangGraph: vi.fn(),
  runResumeFlowLangGraph: vi.fn(),
  runIngestFlowLangGraph: vi.fn(),
}));

vi.mock("../lib/workflows/retrieveGraphLangGraph", () => ({
  runRetrieveFlowLangGraph: mocks.runRetrieveFlowLangGraph,
}));

vi.mock("../lib/workflows/resumeGraphLangGraph", () => ({
  runResumeFlowLangGraph: mocks.runResumeFlowLangGraph,
}));

vi.mock("../lib/workflows/ingestGraphLangGraph", () => ({
  runIngestFlowLangGraph: mocks.runIngestFlowLangGraph,
}));

describe("memory hooks contract", () => {
  beforeEach(() => {
    mocks.runRetrieveFlowLangGraph.mockReset();
    mocks.runResumeFlowLangGraph.mockReset();
    mocks.runIngestFlowLangGraph.mockReset();
  });

  it("uses retrieve flow by default in beforeModel", async () => {
    mocks.runRetrieveFlowLangGraph.mockResolvedValue({
      memories: [
        {
          id: "m1",
          memory: "User is building MemoryOS",
          memoryType: "project",
          finalScore: 0.95,
          updatedAt: "2026-04-13T00:00:00.000Z",
        },
      ],
      debug: [],
    });

    const result = await beforeModel({
      userId: "u1",
      question: "what should I build next?",
    });

    expect(result.source).toBe("retrieve");
    expect(result.contextText).toContain("User is building MemoryOS");
    expect(result.memories).toHaveLength(1);
    expect(mocks.runRetrieveFlowLangGraph).toHaveBeenCalledWith({
      userId: "u1",
      question: "what should I build next?",
      topK: undefined,
      includeArchived: undefined,
    });
  });

  it("uses resume flow when requested", async () => {
    mocks.runResumeFlowLangGraph.mockResolvedValue({
      summary: "You were working on MemoryOS trust layer.",
      lastKnownState: "The retrieval diagnostics endpoint was in progress.",
      openLoops: ["Finish route tests"],
      recommendedNextStep: "Write handoff workflow tests.",
      usedMemories: [
        {
          id: "m2",
          content: "MemoryOS trust layer work",
          memoryType: "project",
          finalScore: 0.93,
          importanceScore: 0.9,
          updatedAt: "2026-04-13T00:00:00.000Z",
        },
      ],
      debug: { project: "memoryos", retrieval: [] },
    });

    const result = await beforeModel({
      userId: "u1",
      project: "memoryos",
      question: "where did I leave off?",
      mode: "resume",
    });

    expect(result.source).toBe("resume");
    expect(result.contextText).toContain(
      "You were working on MemoryOS trust layer.",
    );
    expect(result.memories).toHaveLength(1);
    expect(mocks.runResumeFlowLangGraph).toHaveBeenCalledWith({
      userId: "u1",
      project: "memoryos",
      question: "where did I leave off?",
      topK: undefined,
      includeArchived: undefined,
    });
  });

  it("ingests memory after model", async () => {
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [{ id: "m1" }],
      rejectedMemories: [{ id: "r1" }],
      timelineEvents: [],
    });

    const result = await afterModel({
      userId: "u1",
      message: "I fixed the MemoryOS handoff route tests",
      threadId: "thread-1",
    });

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: "u1",
      message: "I fixed the MemoryOS handoff route tests",
      threadId: "thread-1",
    });
  });

  it("combines user message and model response when modelResponse exists", async () => {
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [{ id: "m2" }],
      rejectedMemories: [],
      timelineEvents: [],
    });

    const result = await afterModel({
      userId: "u2",
      message: "What should I do next for MemoryOS?",
      modelResponse: "Finish the SDK hook tests and then wire MCP.",
      threadId: "thread-2",
    });

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(0);
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: "u2",
      threadId: "thread-2",
      message:
        "User: What should I do next for MemoryOS?\nAssistant: Finish the SDK hook tests and then wire MCP.",
    });
  });

  it("ingests from contract-only input when no message is provided", async () => {
    mocks.runIngestFlowLangGraph.mockResolvedValue({
      acceptedMemories: [{ id: "m3" }],
      rejectedMemories: [],
      timelineEvents: [],
    });

    const result = await afterModel({
      userId: "u3",
      threadId: "thread-contract-2",
      contract: {
        goal: "Improve continuity quality.",
        decisions: ["Prioritize MCP contract support."],
        next_actions: ["Run MCP contract tests."],
      },
      enforceContract: true,
    });

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(0);
    expect(result.contractFieldCount).toBe(3);
    expect(mocks.runIngestFlowLangGraph).toHaveBeenCalledWith({
      userId: "u3",
      threadId: "thread-contract-2",
      message: JSON.stringify({
        goal: "Improve continuity quality.",
        decisions: ["Prioritize MCP contract support."],
        next_actions: ["Run MCP contract tests."],
      }),
    });
  });
});
