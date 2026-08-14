export const MEMORYOS_AGENT_ID_HEADER = "x-memoryos-agent-id";
export const MEMORYOS_AGENT_SESSION_HEADER = "x-memoryos-agent-session-id";
export const MEMORYOS_GOAL_ID_HEADER = "x-memoryos-goal-id";

export type AgentLineageContext = {
  agentId?: string;
  sessionId?: string;
  goalId?: string;
};

const AGENT_LINEAGE_PAYLOAD_KEY = "_agentLineage";

function normalizeId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseAgentLineageFromHeaders(headers: {
  header(name: string): string | undefined;
}): AgentLineageContext {
  return {
    agentId: normalizeId(headers.header(MEMORYOS_AGENT_ID_HEADER)),
    sessionId: normalizeId(headers.header(MEMORYOS_AGENT_SESSION_HEADER)),
    goalId: normalizeId(headers.header(MEMORYOS_GOAL_ID_HEADER)),
  };
}

export function parseAgentLineageFromBody(body: unknown): AgentLineageContext {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  const record = body as Record<string, unknown>;
  const nested =
    record.agentLineage && typeof record.agentLineage === "object" && !Array.isArray(record.agentLineage)
      ? (record.agentLineage as Record<string, unknown>)
      : null;
  return {
    agentId: normalizeId(record.agentId ?? nested?.agentId),
    sessionId: normalizeId(record.sessionId ?? nested?.sessionId),
    goalId: normalizeId(record.goalId ?? nested?.goalId),
  };
}

export function mergeAgentLineage(
  ...sources: Array<AgentLineageContext | undefined>
): AgentLineageContext {
  const merged: AgentLineageContext = {};
  for (const source of sources) {
    if (!source) continue;
    if (source.agentId) merged.agentId = source.agentId;
    if (source.sessionId) merged.sessionId = source.sessionId;
    if (source.goalId) merged.goalId = source.goalId;
  }
  return merged;
}

export function attachAgentLineageToPayload(
  payload: Record<string, unknown>,
  lineage: AgentLineageContext,
): Record<string, unknown> {
  const next = mergeAgentLineage(extractAgentLineageFromPayload(payload), lineage);
  if (!next.agentId && !next.sessionId && !next.goalId) {
    const { [AGENT_LINEAGE_PAYLOAD_KEY]: _removed, ...rest } = payload;
    return rest;
  }
  return {
    ...payload,
    [AGENT_LINEAGE_PAYLOAD_KEY]: next,
  };
}

export function extractAgentLineageFromPayload(
  payload: Record<string, unknown>,
): AgentLineageContext {
  const raw = payload[AGENT_LINEAGE_PAYLOAD_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const record = raw as Record<string, unknown>;
  return {
    agentId: normalizeId(record.agentId),
    sessionId: normalizeId(record.sessionId),
    goalId: normalizeId(record.goalId),
  };
}

export function agentLineageMetadata(
  lineage: AgentLineageContext,
): Record<string, string> {
  const metadata: Record<string, string> = {};
  if (lineage.agentId) metadata.agentId = lineage.agentId;
  if (lineage.sessionId) metadata.sessionId = lineage.sessionId;
  if (lineage.goalId) metadata.goalId = lineage.goalId;
  return metadata;
}
