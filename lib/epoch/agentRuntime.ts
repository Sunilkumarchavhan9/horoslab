import { decideEpochToolCall, type EpochToolPolicyDecision } from "./recoveryActions";

export const EPOCH_AGENT_FRAMEWORKS = ["custom_worker", "openai_agents", "langgraph"] as const;
export type EpochAgentFramework = (typeof EPOCH_AGENT_FRAMEWORKS)[number];
export type EpochAgentAdapter = { framework: EpochAgentFramework; protocol: "epoch.worker.v1"; capabilities: string[]; supports: string[] };
export type EpochAgentSession = { id: string; missionId: string; workerId: string; framework: EpochAgentFramework; parentSessionId?: string; status: "active" | "paused" | "completed" | "failed"; checkpointVersion: number };
export type EpochAgentCheckpoint = { sessionId: string; version: number; state: Record<string, unknown>; toolCallIds: string[]; createdAt: string };
export type EpochAgentToolCall = { id: string; missionId: string; sessionId: string; workerId: string; tool: string; arguments: Record<string, unknown>; status: "allowed" | "denied" | "review" | "completed"; createdAt: string; completedAt?: string };
export type EpochAgentToolDecision = { call: EpochAgentToolCall; policy: EpochToolPolicyDecision; traceId: string };

const ADAPTERS: EpochAgentAdapter[] = [
  { framework: "custom_worker", protocol: "epoch.worker.v1", capabilities: ["tools", "checkpoints", "handoffs"], supports: ["software", "ai_agent", "human"] },
  { framework: "openai_agents", protocol: "epoch.worker.v1", capabilities: ["tools", "sessions", "handoffs", "structured_output"], supports: ["ai_agent"] },
  { framework: "langgraph", protocol: "epoch.worker.v1", capabilities: ["graph_state", "checkpoints", "handoffs", "interrupts"], supports: ["ai_agent", "simulated_edge"] },
];

export function listEpochAgentAdapters(): EpochAgentAdapter[] { return ADAPTERS.map((adapter) => ({ ...adapter, capabilities: [...adapter.capabilities], supports: [...adapter.supports] })); }
export function getEpochAgentAdapter(framework: string): EpochAgentAdapter | null { return ADAPTERS.find((adapter) => adapter.framework === framework) ?? null; }

export function createEpochAgentSession(input: { id: string; missionId: string; workerId: string; framework: EpochAgentFramework; parentSessionId?: string }): EpochAgentSession {
  if (!getEpochAgentAdapter(input.framework)) throw new Error("epoch_agent_framework_unsupported");
  if (!input.missionId || !input.workerId) throw new Error("epoch_agent_scope_required");
  return { ...input, status: "active", checkpointVersion: 0 };
}

export function checkpointEpochAgent(input: { session: EpochAgentSession; state: Record<string, unknown>; toolCallIds: string[] }): { session: EpochAgentSession; checkpoint: EpochAgentCheckpoint } {
  if (input.session.status !== "active" && input.session.status !== "paused") throw new Error("epoch_agent_session_not_checkpointable");
  if (new Set(input.toolCallIds).size !== input.toolCallIds.length) throw new Error("epoch_agent_checkpoint_duplicate_tool_call");
  const version = input.session.checkpointVersion + 1;
  return { session: { ...input.session, status: "paused", checkpointVersion: version }, checkpoint: { sessionId: input.session.id, version, state: structuredClone(input.state), toolCallIds: [...input.toolCallIds], createdAt: new Date().toISOString() } };
}

export function resumeEpochAgent(input: { session: EpochAgentSession; checkpoint: EpochAgentCheckpoint }): { session: EpochAgentSession; state: Record<string, unknown>; toolCallIds: string[] } {
  if (input.session.id !== input.checkpoint.sessionId) throw new Error("epoch_agent_checkpoint_session_mismatch");
  if (input.session.status !== "paused") throw new Error("epoch_agent_session_not_resumable");
  if (input.checkpoint.version !== input.session.checkpointVersion) throw new Error("epoch_agent_checkpoint_version_mismatch");
  return { session: { ...input.session, status: "active" }, state: structuredClone(input.checkpoint.state), toolCallIds: [...input.checkpoint.toolCallIds] };
}

export function governEpochAgentToolCall(input: { session: EpochAgentSession; id: string; tool: string; arguments?: Record<string, unknown>; permissions: string[]; approvalGranted?: boolean; blockedTools?: string[]; traceId?: string }): EpochAgentToolDecision {
  if (input.session.status !== "active") throw new Error("epoch_agent_session_not_active");
  const policy = decideEpochToolCall({ tool: input.tool, permissions: input.permissions, approvalGranted: input.approvalGranted, blockedTools: input.blockedTools });
  return {
    policy,
    traceId: input.traceId ?? `trace_${input.id}`,
    call: { id: input.id, missionId: input.session.missionId, sessionId: input.session.id, workerId: input.session.workerId, tool: input.tool, arguments: structuredClone(input.arguments ?? {}), status: policy.decision === "allow" ? "allowed" : policy.decision === "deny" ? "denied" : "review", createdAt: new Date().toISOString() },
  };
}

export function completeEpochAgentToolCall(input: { decision: EpochAgentToolDecision; missionId: string; sessionId: string }): EpochAgentToolDecision {
  if (input.decision.call.missionId !== input.missionId || input.decision.call.sessionId !== input.sessionId) throw new Error("epoch_agent_tool_call_scope_mismatch");
  if (input.decision.policy.decision !== "allow") throw new Error("epoch_agent_tool_call_not_allowed");
  return { ...input.decision, call: { ...input.decision.call, status: "completed", completedAt: new Date().toISOString() } };
}

export function validateEpochAgentHandoff(input: { from: EpochAgentSession; to: EpochAgentSession; missionId: string }): { allowed: boolean; reason: string } {
  if (input.from.missionId !== input.missionId || input.to.missionId !== input.missionId) return { allowed: false, reason: "handoff_mission_scope_mismatch" };
  if (input.from.status === "failed" || input.to.status === "failed") return { allowed: false, reason: "handoff_session_failed" };
  return { allowed: true, reason: "handoff_scope_valid" };
}
