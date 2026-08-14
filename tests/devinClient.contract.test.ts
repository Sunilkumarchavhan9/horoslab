import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsertRecentMemory: vi.fn(async () => undefined),
  extractMemory: vi.fn(() => [
    {
      userId: "user-devin",
      type: "project",
      content: "Devin fixed the Slack connector and left a handoff.",
      summary: "Future agents should check Slack connector auth before sync.",
      source: "import",
      status: "active",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      importanceScore: 0.8,
      confidence: 0.8,
      evidenceCount: 1,
      contractVersion: "memoryos.contract.v1",
      contractCategory: "previous_attempt",
      companyBrainType: "agent_action",
      developerSignals: { projectArea: ["slack"], goal: ["agent handoff"] },
    },
  ]),
}));

vi.mock("@/lib/memory/extractMemory", () => ({
  extractMemory: mocks.extractMemory,
}));

vi.mock("@/lib/memory/recentMemoryStore", () => ({
  upsertRecentMemory: mocks.upsertRecentMemory,
  getRecentMemories: vi.fn(async () => []),
}));

import { DevinClient } from "@/lib/integrations/devin";

describe("Devin connector contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mocks.upsertRecentMemory.mockClear();
    mocks.extractMemory.mockClear();
  });

  it("syncs Devin sessions into traceable agent-action memories", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          sessions: [
            {
              id: "sess_123",
              title: "Fix Phase 1 source gate",
              status: "completed",
              task: "Repair Slack source sync and run the gate.",
              summary: "Invited the Slack app to #general and verified trace proof.",
              url: "https://app.devin.ai/sessions/sess_123",
              updated_at: 1781872200,
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await DevinClient.sync({
      userId: "user-devin",
      accessToken: "cog_test",
      orgId: "org_devin",
      baseUrl: "https://api.devin.ai",
      recentItemKeys: [],
    });

    expect(result.extractedCount).toBe(2);
    expect(result.dedupeKeys).toEqual(["devin:session:sess_123:2026-06-19T12:30:00.000Z"]);
    expect(result.contractCounts).toEqual({ previous_attempt: 2 });
    expect(result.checkpoint).toBe("2026-06-19T12:30:00.000Z");
    expect(result.diagnostics).toEqual({
      sessionsListed: 1,
      sessionsSynced: 1,
      sessionsSkipped: 0,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/v3/organizations/org_devin/sessions"),
      }),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer cog_test",
        }),
      }),
    );
    expect(mocks.extractMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-devin",
        message: expect.stringContaining("Devin agent session: Fix Phase 1 source gate"),
      }),
    );
    expect(mocks.upsertRecentMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        companyBrainType: "agent_action",
        contractCategory: "previous_attempt",
        sourceRef: "devin-session://sess_123",
        traceProof: expect.objectContaining({
          sourceType: "devin",
          sourceRef: "devin-session://sess_123",
          evidence: expect.arrayContaining([
            "sess_123",
            "Fix Phase 1 source gate",
            "https://app.devin.ai/sessions/sess_123",
          ]),
        }),
      }),
    );
  });
});
