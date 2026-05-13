import {
  afterModel,
  beforeModel,
  type AfterModelInput,
  type AfterModelResult,
  type BeforeModelInput,
  type BeforeModelResult,
} from "../../SDK/memoryHooks";
import { runHandoffFlowLangGraph } from "../../workflows/handoffGraphLangGraph";
import type { HandoffPlannerResult } from "../handoffPlanner";
import { executePreflight, type PreflightInput } from "../preflightLogic";

export type McpTool<Input, Output> = {
  name: string;
  description: string;
  execute: (input: Input) => Promise<Output>;
};

export type HandoffToolInput = {
  userId: string;
  project: string;
  question: string;
  workspace?: string;
  threadId?: string;
  topK?: number;
  includeArchived?: boolean;
};

export const beforeModelTool: McpTool<BeforeModelInput, BeforeModelResult> = {
  name: "memory.before_model",
  description: "Retrieve continuity context before a model call.",
  async execute(input) {
    return beforeModel(input);
  },
};

export const afterModelTool: McpTool<AfterModelInput, AfterModelResult> = {
  name: "memory.after_model",
  description: "Persist memory context after a model or user turn.",
  async execute(input) {
    return afterModel(input);
  },
};

export const handoffTool: McpTool<HandoffToolInput, HandoffPlannerResult> = {
  name: "memory.handoff",
  description: "Generate a handoff package for another human or agent.",
  async execute(input) {
    return runHandoffFlowLangGraph(input);
  },
};

export const preflightTool: McpTool<PreflightInput, any> = {
  name: "memoryos.preflight",
  description: "Returns the project state, decisions, blockers, active tasks, relevant files, and next recommended action before an AI agent continues work.",
  async execute(input) {
    return executePreflight(input);
  },
};

export const memoryTools = [beforeModelTool, afterModelTool, handoffTool, preflightTool] as const;

export function getMemoryTool(name: string): McpTool<unknown, unknown> | undefined {
  return memoryTools.find((tool) => tool.name === name) as McpTool<unknown, unknown> | undefined;
}
