import { readPlaygroundSettings } from "@/lib/playground-settings";

export const MEMORYOS_AGENT_ID_HEADER = "X-Dhyra-Agent-Id";
export const MEMORYOS_AGENT_SESSION_HEADER = "X-Dhyra-Agent-Session-Id";

const CONTINUITY_AGENT_ROUTE_PATTERN =
  /\/api\/memory\/(?:resume(?:\/brief|\/prompt)?|handoff)(?:\/|$|\?)/i;

export function isContinuityAgentRoute(routePath: string): boolean {
  return CONTINUITY_AGENT_ROUTE_PATTERN.test(routePath);
}

export function readPlaygroundAgentHeaders(): Record<string, string> {
  const settings = readPlaygroundSettings();
  const headers: Record<string, string> = {};
  const agentId = settings?.productAgentId?.trim();
  const sessionId = settings?.productAgentSessionId?.trim();
  if (agentId) {
    headers[MEMORYOS_AGENT_ID_HEADER] = agentId;
  }
  if (sessionId) {
    headers[MEMORYOS_AGENT_SESSION_HEADER] = sessionId;
  }
  return headers;
}

export function mergeContinuityAgentHeaders(
  routePath: string,
  initHeaders?: HeadersInit,
): HeadersInit {
  const merged = new Headers(initHeaders ?? undefined);
  if (!isContinuityAgentRoute(routePath)) {
    return merged;
  }
  for (const [key, value] of Object.entries(readPlaygroundAgentHeaders())) {
    merged.set(key, value);
  }
  return merged;
}
