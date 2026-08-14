import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsertRecentMemory: vi.fn(async () => undefined),
}));

vi.mock("@/lib/memory/recentMemoryStore", () => ({
  upsertRecentMemory: mocks.upsertRecentMemory,
  getRecentMemories: vi.fn(async () => []),
}));

import { formatSlackApiError, SlackClient } from "@/lib/integrations/slack";

describe("Slack client contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mocks.upsertRecentMemory.mockClear();
  });

  it("formats actionable slack API errors", () => {
    expect(formatSlackApiError("conversations.list", "missing_scope")).toContain("Reconnect Slack");
    expect(formatSlackApiError("conversations.history", "ratelimited")).toContain("rate limit");
  });

  it("sync extracts mapped memories with contract counts and diagnostics", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("conversations.list")) {
        return new Response(
          JSON.stringify({
            ok: true,
            channels: [{ id: "C1", name: "incidents" }],
          }),
          { status: 200 },
        );
      }
      if (url.includes("conversations.history")) {
        return new Response(
          JSON.stringify({
            ok: true,
            messages: [
              {
                ts: "1710000100.000100",
                user: "U1",
                text: "Incident: API outage — we decided to rollback immediately.",
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ ok: false, error: "unknown_method" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await SlackClient.sync({
      userId: "user-1",
      accessToken: "xoxp-test",
      recentItemKeys: [],
    });

    expect(result.extractedCount).toBeGreaterThan(0);
    expect(result.contractCounts).toBeDefined();
    expect(Object.keys(result.contractCounts ?? {}).length).toBeGreaterThan(0);
    expect(result.diagnostics.channelsSynced).toBe(1);
    expect(result.dedupeKeys[0]).toBe("slack:message:C1:1710000100.000100");
    expect(result.checkpoint).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(mocks.upsertRecentMemory).toHaveBeenCalled();
    expect(mocks.upsertRecentMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        traceProof: expect.objectContaining({
          sourceType: "slack",
          sourceRef: expect.stringContaining("slack"),
          evidence: expect.arrayContaining([
            expect.stringContaining("Slack #incidents message 1710000100.000100"),
          ]),
        }),
      }),
    );
  });
});
