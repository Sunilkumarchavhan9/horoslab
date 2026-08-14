import { afterEach, describe, expect, it, vi } from "vitest";
import { createEpochClient } from "../packages/epoch-sdk/src";

describe("MemoryOS SDK experience search", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces the phase-two experience retrieval endpoints", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          query: "rollback",
          total: 1,
          results: [
            {
              id: "exp_1",
              title: "FAIL release rollback",
              summary: "Rollback required after deployment drift.",
              lesson: "Pause before release when evidence is incomplete.",
              rootCause: "Missing rollback guard.",
              bestPractice: "Require rollback approval.",
              antiPattern: "Shipping without rollback evidence.",
              correctSolution: "Gate deploy behind rollback checks.",
              repository: "epochtm/app",
              pullRequestNumber: 42,
              pullRequestTitle: "Fix release flow",
              verdict: "FAIL",
              confidence: 91,
              language: "TypeScript",
              framework: "Next.js",
              files: ["app/page.tsx"],
              wrongAttempts: ["Tried to deploy without checks."],
              tests: ["npx tsc --noEmit"],
              createdAt: "2026-07-20T00:00:00.000Z",
              updatedAt: "2026-07-20T00:00:00.000Z",
              score: 12,
              matchReasons: ["rootCause:rollback"],
            },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createEpochClient({
      apiKey: "mk_test",
      baseUrl: "http://localhost:3011",
    });

    const search = await client.searchExperiences({ query: "rollback", limit: 10 });
    const lessons = await client.listExperienceLessons({ query: "rollback", limit: 10 });
    const patterns = await client.listFailurePatterns({ query: "rollback", limit: 10 });
    const rootCauses = await client.listRootCauses({ query: "rollback", limit: 10 });
    const similar = await client.findSimilarExperiences({ experienceId: "exp_1", limit: 10 });
    const recommendations = await client.getExperienceRecommendations({ query: "rollback", limit: 10 });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3011/api/experience/search?query=rollback&limit=10",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3011/api/experience/lessons?query=rollback&limit=10",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:3011/api/experience/failure-patterns?query=rollback&limit=10",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:3011/api/experience/root-causes?query=rollback&limit=10",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      "http://localhost:3011/api/experience/similar?limit=10&experienceId=exp_1",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      6,
      "http://localhost:3011/api/experience/recommendations?query=rollback&limit=10",
      expect.any(Object),
    );
    expect(search.total).toBe(1);
    expect(search.results[0]).toMatchObject({ verdict: "FAIL" });
    expect(lessons.total).toBe(1);
    expect(patterns.total).toBe(1);
    expect(rootCauses.total).toBe(1);
    expect(similar.total).toBe(1);
    expect(recommendations.total).toBe(1);
  });
});
