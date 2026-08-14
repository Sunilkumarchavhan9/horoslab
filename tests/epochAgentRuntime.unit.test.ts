import { describe, expect, it } from "vitest";
import { checkpointEpochAgent, completeEpochAgentToolCall, createEpochAgentSession, governEpochAgentToolCall, listEpochAgentAdapters, resumeEpochAgent, validateEpochAgentHandoff } from "../lib/epoch/agentRuntime";

describe("Phase G agent runtime", () => {
  it("registers governed framework adapters", () => {
    expect(listEpochAgentAdapters().map((adapter) => adapter.framework)).toEqual(["custom_worker", "openai_agents", "langgraph"]);
  });

  it("checkpoints sessions with mission and worker scope", () => {
    const session = createEpochAgentSession({ id: "s1", missionId: "m1", workerId: "w1", framework: "langgraph" });
    const result = checkpointEpochAgent({ session, state: { step: "execute" }, toolCallIds: ["tool-1"] });
    expect(result.session.status).toBe("paused");
    expect(result.checkpoint.version).toBe(1);
  });

  it("rejects cross-mission handoffs", () => {
    const from = createEpochAgentSession({ id: "s1", missionId: "m1", workerId: "w1", framework: "custom_worker" });
    const to = createEpochAgentSession({ id: "s2", missionId: "m2", workerId: "w2", framework: "openai_agents" });
    expect(validateEpochAgentHandoff({ from, to, missionId: "m1" })).toMatchObject({ allowed: false, reason: "handoff_mission_scope_mismatch" });
  });

  it("resumes only the latest checkpoint in the same session", () => {
    const session = createEpochAgentSession({ id: "s1", missionId: "m1", workerId: "w1", framework: "custom_worker" });
    const saved = checkpointEpochAgent({ session, state: { step: "execute" }, toolCallIds: ["tool-1"] });
    const resumed = resumeEpochAgent({ session: saved.session, checkpoint: saved.checkpoint });
    expect(resumed.session.status).toBe("active");
    expect(resumed.state).toEqual({ step: "execute" });
  });

  it("governs and traces tool calls within mission scope", () => {
    const session = createEpochAgentSession({ id: "s1", missionId: "m1", workerId: "w1", framework: "custom_worker" });
    const decision = governEpochAgentToolCall({ session, id: "call-1", tool: "files.read", arguments: { path: "main.ts" }, permissions: ["tool.files.read"], traceId: "trace-1" });
    expect(decision).toMatchObject({ traceId: "trace-1", policy: { decision: "allow" }, call: { missionId: "m1", sessionId: "s1", status: "allowed" } });
    expect(completeEpochAgentToolCall({ decision, missionId: "m1", sessionId: "s1" }).call.status).toBe("completed");
  });

  it("does not execute a privileged call without approval", () => {
    const session = createEpochAgentSession({ id: "s1", missionId: "m1", workerId: "w1", framework: "custom_worker" });
    const decision = governEpochAgentToolCall({ session, id: "call-1", tool: "shell.execute", permissions: ["tool.shell.execute"] });
    expect(decision.call.status).toBe("review");
    expect(() => completeEpochAgentToolCall({ decision, missionId: "m1", sessionId: "s1" })).toThrow("epoch_agent_tool_call_not_allowed");
  });
});
