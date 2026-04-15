import { getMemoryTool, memoryTools } from "@/lib/memory/MCP";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("Memory MCP contract", () => {
  beforeEach(() => {
    mocks.beforeModel.mockReset();
    mocks.afterModel.mockReset();
    mocks.runHandoffFlowLangGraph.mockReset();
  });

  it("registers the expected MCP tool names", () => {
    const names = memoryTools.map((tool) => tool.name);

    expect(names).toContain("memory.before_model");
    expect(names).toContain("memory.after_model");
    expect(names).toContain("memory.handoff");
  });

  it("looks up a tool by name", () => {
    const tool = getMemoryTool("memory.before_model");

    expect(tool).toBeDefined();
    expect(tool?.name).toBe("memory.before_model");
  });

  it("executes beforeModel through the MCP wrapper", async () => {
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

    const tool = getMemoryTool("memory.before_model");
    const input = {
      userId: "u1",
      question: "what should I build next?",
    };

    const result = await tool!.execute(input);

    expect(mocks.beforeModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("source", "retrieve");
  });

  it("executes afterModel through the MCP wrapper", async () => {
    mocks.afterModel.mockResolvedValue({
      acceptedCount: 1,
      rejectedCount: 0,
    });

    const tool = getMemoryTool("memory.after_model");
    const input = {
      userId: "u2",
      message: "I fixed the SDK tests",
      modelResponse: "Next wire MCP.",
      threadId: "thread-1",
    };

    const result = await tool!.execute(input);

    expect(mocks.afterModel).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("acceptedCount", 1);
  });

  it("executes handoff workflow through the MCP wrapper", async () => {
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

    const tool = getMemoryTool("memory.handoff");
    const input = {
      userId: "u3",
      project: "memoryos",
      question: "prepare a handoff",
      workspace: "ws-alpha",
      threadId: "thread-7",
    };

    const result = await tool!.execute(input);

    expect(mocks.runHandoffFlowLangGraph).toHaveBeenCalledWith(input);
    expect(result).toHaveProperty("summary");
  });
});
