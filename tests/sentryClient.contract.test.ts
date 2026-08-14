import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsertRecentMemory: vi.fn(async () => undefined),
  extractMemory: vi.fn(() => [
    {
      userId: "user-sentry",
      type: "bug",
      content: "Sentry runtime error in production checkout.",
      summary: "Runtime error should be checked before future deployment changes.",
      source: "import",
      status: "active",
      createdAt: "2026-06-19T00:00:00.000Z",
      updatedAt: "2026-06-19T00:00:00.000Z",
      importanceScore: 0.8,
      confidence: 0.8,
      evidenceCount: 1,
      contractVersion: "memoryos.contract.v1",
      contractCategory: "bug",
      companyBrainType: "incident",
      developerSignals: { projectArea: ["checkout"], bugType: ["runtime error"] },
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

import { SentryClient } from "@/lib/integrations/sentry";

describe("Sentry deployment errors connector contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    mocks.upsertRecentMemory.mockClear();
    mocks.extractMemory.mockClear();
  });

  it("syncs unresolved Sentry issues into traceable deployment-error memories", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            id: "issue-1",
            shortId: "MEMORYOS-9",
            title: "TypeError: Cannot read properties of undefined",
            culprit: "checkout.submit",
            permalink: "https://sentry.io/organizations/memoryos/issues/1/",
            level: "error",
            status: "unresolved",
            count: "17",
            userCount: 4,
            firstSeen: "2026-06-19T08:00:00.000Z",
            lastSeen: "2026-06-19T12:10:00.000Z",
            project: { slug: "memoryos-frontend", name: "MemoryOS Frontend" },
            metadata: {
              type: "TypeError",
              value: "Cannot read properties of undefined",
              filename: "checkout.tsx",
              function: "submit",
            },
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await SentryClient.sync({
      userId: "user-sentry",
      accessToken: "sntrys_test",
      recentItemKeys: [],
      config: {
        orgSlug: "memoryos",
        projectSlugs: ["memoryos-frontend"],
      },
    });

    expect(result.extractedCount).toBe(1);
    expect(result.dedupeKeys).toEqual(["sentry:issue:issue-1:2026-06-19T12:10:00.000Z"]);
    expect(result.contractCounts).toEqual({ bug: 1 });
    expect(result.checkpoint).toBe("2026-06-19T12:10:00.000Z");
    expect(result.diagnostics).toEqual({
      issuesSeen: 1,
      issuesSynced: 1,
      projectsFiltered: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("/api/0/organizations/memoryos/issues/"),
      }),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer sntrys_test",
        }),
      }),
    );
    expect(mocks.extractMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-sentry",
        message: expect.stringContaining("Sentry deployment/runtime error"),
      }),
    );
    expect(mocks.upsertRecentMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceRef: "sentry://issue/MEMORYOS-9",
        traceProof: expect.objectContaining({
          sourceType: "sentry",
          sourceRef: "sentry://issue/MEMORYOS-9",
          evidence: expect.arrayContaining([
            "MEMORYOS-9",
            "TypeError: Cannot read properties of undefined",
            "https://sentry.io/organizations/memoryos/issues/1/",
          ]),
        }),
        developerSignals: expect.objectContaining({
          projectArea: expect.arrayContaining(["checkout", "memoryos-frontend", "checkout.tsx"]),
          bugType: expect.arrayContaining(["runtime error", "deployment regression", "error"]),
        }),
      }),
    );
  });
});
