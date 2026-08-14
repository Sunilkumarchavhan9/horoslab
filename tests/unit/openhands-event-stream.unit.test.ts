import { describe, expect, it } from "vitest";
import {
  dedupeOpenHandsEvents,
  normalizeIncomingEvents,
} from "../../memoryos-frontend/lib/continuity-lab/openhands-event-stream";

describe("openhands event stream helpers", () => {
  it("normalizes runtime UI events into OpenHands-like shape", () => {
    const normalized = normalizeIncomingEvents([
      {
        kind: "message",
        payload: {
          id: "m1",
          role: "user",
          text: "hello",
          timestamp: "2026-01-01T00:00:00.000Z",
        },
      },
      {
        kind: "shell",
        payload: {
          id: "s1",
          command: "npm run lint",
          timestamp: "2026-01-01T00:00:01.000Z",
        },
      },
      {
        kind: "desktop_preview_url",
        payload: {
          id: "d1",
          previewUrl: "https://preview.memoryos.dev",
          timestamp: "2026-01-01T00:00:02.000Z",
        },
      },
    ]);

    expect(normalized).toHaveLength(3);
    expect(normalized[0]).toMatchObject({
      id: "m1",
      source: "user",
      llm_message: {
        role: "user",
      },
    });
    expect(normalized[1]).toMatchObject({
      id: "s1",
      tool_name: "execute_bash",
      action: { command: "npm run lint" },
    });
    expect(normalized[2]).toMatchObject({
      id: "d1",
      tool_name: "runtime.desktop_preview_url",
      observation: {
        kind: "desktop_preview_url",
        content: "https://preview.memoryos.dev",
      },
    });
  });

  it("dedupes by id while keeping events without id", () => {
    const seen = new Set<string>(["dup"]);
    const deduped = dedupeOpenHandsEvents(
      [
        { id: "dup", timestamp: "a" },
        { id: "new", timestamp: "b" },
        { timestamp: "c" },
      ],
      seen,
    );

    expect(deduped).toHaveLength(2);
    expect(deduped[0]?.id).toBe("new");
    expect(deduped[1]?.id).toBeUndefined();
    expect(seen.has("new")).toBe(true);
  });
});
