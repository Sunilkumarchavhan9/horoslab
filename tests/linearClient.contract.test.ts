import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsertRecentMemory: vi.fn(async () => undefined),
}));

vi.mock("@/lib/memory/recentMemoryStore", () => ({
  upsertRecentMemory: mocks.upsertRecentMemory,
  getRecentMemories: vi.fn(async () => []),
}));

import { LinearClient } from "@/lib/integrations/linear";

describe("Linear client contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mocks.upsertRecentMemory.mockClear();
  });

  it("sync extracts issue and comment memories with source trace proof", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            issues: {
              nodes: [
                {
                  id: "issue-1",
                  identifier: "MEM-42",
                  title: "Fix auth incident",
                  description: "Incident: production auth outage. Decision: rollback the risky auth change.",
                  priorityLabel: "High",
                  url: "https://linear.app/memoryos/issue/MEM-42/fix-auth-incident",
                  createdAt: "2026-06-19T09:00:00.000Z",
                  updatedAt: "2026-06-19T10:00:00.000Z",
                  state: { name: "In Progress", type: "started" },
                  team: { name: "MemoryOS", key: "MEM" },
                  assignee: { name: "Sunil" },
                  labels: { nodes: [{ name: "incident" }, { name: "auth" }] },
                  comments: {
                    nodes: [
                      {
                        id: "comment-1",
                        body: "Lesson: require auth regression tests before merge.",
                        createdAt: "2026-06-19T10:05:00.000Z",
                        updatedAt: "2026-06-19T10:05:00.000Z",
                        user: { name: "Reviewer" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await LinearClient.sync({
      userId: "user-linear",
      accessToken: "lin_api_test",
      recentItemKeys: [],
      config: { authMode: "api_key", teamKeys: ["MEM"] },
    });

    expect(result.extractedCount).toBeGreaterThan(0);
    expect(result.diagnostics).toMatchObject({
      issuesListed: 1,
      issuesSynced: 1,
      commentsSeen: 1,
      commentsSkipped: 0,
    });
    expect(result.dedupeKeys).toEqual([
      "linear:issue:issue-1",
      "linear:comment:issue-1:comment-1",
    ]);
    expect(result.checkpoint).toBe("2026-06-19T10:05:00.000Z");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.linear.app/graphql",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "lin_api_test",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(mocks.upsertRecentMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceRef: "linear://issue/MEM-42",
        traceProof: expect.objectContaining({
          sourceType: "linear",
          sourceRef: "linear://issue/MEM-42",
          evidence: expect.arrayContaining([
            "MEM-42",
            "Fix auth incident",
            "https://linear.app/memoryos/issue/MEM-42/fix-auth-incident",
          ]),
        }),
      }),
    );
  });

  it("builds Linear OAuth URLs with user actor by default", () => {
    const originalClientId = process.env.LINEAR_CLIENT_ID;
    const originalCallback = process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL;
    const originalActor = process.env.LINEAR_OAUTH_ACTOR;
    process.env.LINEAR_CLIENT_ID = "linear-client";
    process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL = "http://localhost:3000/api/connector/callback";
    delete process.env.LINEAR_OAUTH_ACTOR;

    try {
      const url = new URL(LinearClient.getAuthorizeUrl("state-token"));
      expect(url.origin).toBe("https://linear.app");
      expect(url.pathname).toBe("/oauth/authorize");
      expect(url.searchParams.get("client_id")).toBe("linear-client");
      expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/connector/callback");
      expect(url.searchParams.get("scope")).toBe("read");
      expect(url.searchParams.get("state")).toBe("state-token");
      expect(url.searchParams.get("actor")).toBe("user");
    } finally {
      process.env.LINEAR_CLIENT_ID = originalClientId;
      process.env.NEXT_PUBLIC_CONNECTOR_CALLBACK_URL = originalCallback;
      process.env.LINEAR_OAUTH_ACTOR = originalActor;
    }
  });
});
