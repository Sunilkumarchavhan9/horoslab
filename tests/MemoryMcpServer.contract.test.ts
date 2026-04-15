import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeMemoryTool, listMemoryTools } from "@/lib/memory/MCP";

const mocks = vi.hoisted(() => ({
  beforeModel: vi.fn(),
  afterModel: vi.fn(),
  runHandoffFlowLangGraph: vi.fn(),
}));

vi.mock("../lib/SDK/memoryHooks", () => ({
  beforeModel: mocks.beforeModel,
  afterModel: mocks.afterModel,
}));

vi.mock("../lib/workflows/handoffGraphLangGraph", () => ({
  runHandoffFlowLangGraph: mocks.runHandoffFlowLangGraph,
}));

describe("Memory MCP server contract", () => {
  beforeEach(() => {
    mocks.beforeModel.mockReset();
    mocks.afterModel.mockReset();
    mocks.runHandoffFlowLangGraph.mockReset();
  });

  it("lists memory MCP tools", () => {
    const tools = listMemoryTools();

    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "memory.before_model" }),
        expect.objectContaining({ name: "memory.after_model" }),
        expect.objectContaining({ name: "memory.handoff" }),
      ]),
    );
  });

  it("returns a clean error for an unknown memory tool", async () => {
    const result = await invokeMemoryTool("memory.unknown", {});

    expect(result).toEqual({
      code: "NOT_FOUND",
      error: "Unknown memory tool: memory.unknown",
    });
  });

  it("returns a validation error for bad memory.before_model input", async () => {
    const result = await invokeMemoryTool("memory.before_model", {
      userId: "u1",
    });

    expect(result).toEqual({
      code: "BAD_REQUEST",
      error: "Invalid memory tool input",
      details: expect.any(Object),
    });
  });

  it("invokes memory.before_model through the dispatcher", async () => {
    mocks.beforeModel.mockResolvedValue({
      contextText: "1. [project] User is building MemoryOS",
      memories: [
        {
          id: "m1",
          content: "User is building MemoryOS",
          memoryType: "project",
          finalScore: 0.95,
        },
      ],
      source: "retrieve",
    });

    const input = {
      userId: "u1",
      question: "what should I build next?",
    };

    const result = await invokeMemoryTool("memory.before_model", input);

    expect(mocks.beforeModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("source", "retrieve");
  });

  it("invokes memory.after_model through the dispatcher", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
    });

    const input = {
      userId: "u2",
      message: "I fixed the SDK tests",
      modelResponse: "Next wire MCP.",
      threadId: "thread-1",
    };

    const result = await invokeMemoryTool("memory.after_model", input);

    expect(mocks.afterModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("acceptedCount", 1);
  });

  it("invokes memory.handoff through the dispatcher", async () => {
    mocks.runHandoffFlowLangGraph.mockResolvedValue({
      summary: "Handoff for MemoryOS.",
      currentState: "Trust layer work is in progress.",
      openLoops: ["Finish the MCP wrapper tests."],
      recommendedNextActions: ["Wire the MCP registry export."],
      keyMemories: [],
      debug: {
        project: "memoryos",
        retrieval: [],
      },
    });

    const input = {
      userId: "u3",
      project: "memoryos",
      question: "prepare a handoff",
      workspace: "ws-alpha",
      threadId: "thread-7",
    };

    const result = await invokeMemoryTool("memory.handoff", input);

    expect(mocks.runHandoffFlowLangGraph).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("summary");
  });
});
