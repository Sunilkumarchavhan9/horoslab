/**
 * Lightweight action memory + funnel hooks for Continuity Lab agent turns.
 */

import { consoleApiFetch } from "@/lib/console-api";

const recordedTurnIds = new Set<string>();

export async function recordLabAgentTurn(input: {
  sessionId: string;
  projectId: string;
  eventId: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  const dedupeKey = `${input.sessionId}:${input.eventId}`;
  if (recordedTurnIds.has(dedupeKey)) return;
  recordedTurnIds.add(dedupeKey);
  if (recordedTurnIds.size > 200) {
    recordedTurnIds.clear();
  }

  try {
    await consoleApiFetch("/api/memory/action-memory", {
      method: "POST",
      body: JSON.stringify({
        action: "agent_turn",
        reason: "Continuity Lab agent completed a turn",
        outcome: "success",
        sourceType: "continuity",
        sourceId: input.sessionId,
        projectId: input.projectId,
        metadata: { continuityLab: true, sessionId: input.sessionId },
      }),
    });
  } catch {
    // non-blocking
  }
}
