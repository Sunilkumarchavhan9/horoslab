import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeMemoryTool, listMemoryTools } from "@/lib/memory/MCP";

const mocks = vi.hoisted(() => ({
  searchVerificationExperiences: vi.fn(),
  listExperienceLessons: vi.fn(),
  listFailurePatterns: vi.fn(),
  listRootCauses: vi.fn(),
  findSimilarExperiences: vi.fn(),
  buildExperienceRecommendations: vi.fn(),
}));

vi.mock("../lib/realityCompiler/experienceInsights", () => ({
  searchVerificationExperiences: mocks.searchVerificationExperiences,
  listExperienceLessons: mocks.listExperienceLessons,
  listFailurePatterns: mocks.listFailurePatterns,
  listRootCauses: mocks.listRootCauses,
}));

vi.mock("../lib/realityCompiler/experienceRecommendation", () => ({
  findSimilarExperiences: mocks.findSimilarExperiences,
  buildExperienceRecommendations: mocks.buildExperienceRecommendations,
}));

describe("Experience MCP contract", () => {
  beforeEach(() => {
    mocks.searchVerificationExperiences.mockReset();
    mocks.listExperienceLessons.mockReset();
    mocks.listFailurePatterns.mockReset();
    mocks.listRootCauses.mockReset();
    mocks.findSimilarExperiences.mockReset();
    mocks.buildExperienceRecommendations.mockReset();
  });

  it("registers the phase-two experience tools", () => {
    const names = listMemoryTools().map((tool) => tool.name);

    expect(names).toEqual(expect.arrayContaining([
      "memoryignition_search_experiences",
      "memoryignition_list_lessons",
      "memoryignition_list_failure_patterns",
      "memoryignition_list_root_causes",
      "memoryignition_find_similar_experiences",
      "memoryignition_get_experience_recommendations",
    ]));
  });

  it("invokes the experience search dispatcher", async () => {
    mocks.searchVerificationExperiences.mockResolvedValue({
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
    });

    const result = await invokeMemoryTool("memoryignition_search_experiences", {
      userId: "u1",
      query: "rollback",
      limit: 10,
    });

    expect(mocks.searchVerificationExperiences).toHaveBeenCalledWith({
      userId: "u1",
      orgId: undefined,
      query: "rollback",
      limit: 10,
      verdict: undefined,
    });
    expect(result).toMatchObject({
      query: "rollback",
      total: 1,
      results: [expect.objectContaining({ id: "exp_1", verdict: "FAIL" })],
    });
  });

  it("invokes the lesson, failure-pattern, and root-cause dispatchers", async () => {
    mocks.listExperienceLessons.mockResolvedValue({
      query: "",
      total: 1,
      lessons: [{ id: "lesson-1", title: "Keep rollout guarded", count: 1, confidence: 88, repositories: ["epochtm/app"], verdicts: ["PASS"], rootCause: "", lesson: "Keep rollout guarded", antiPattern: "", language: "TypeScript", framework: "Next.js", files: [], pullRequestNumbers: [1], latestAt: "2026-07-20T00:00:00.000Z", example: null }],
    });
    mocks.listFailurePatterns.mockResolvedValue({
      query: "",
      total: 1,
      patterns: [{ id: "pattern-1", title: "Missing rollback guard", count: 1, confidence: 82, repositories: ["epochtm/app"], verdicts: ["FAIL"], rootCause: "Missing rollback guard.", lesson: "Keep rollout guarded", antiPattern: "Shipping without rollback evidence.", language: "TypeScript", framework: "Next.js", files: ["app/page.tsx"], pullRequestNumbers: [42], latestAt: "2026-07-20T00:00:00.000Z", example: null }],
    });
    mocks.listRootCauses.mockResolvedValue({
      query: "",
      total: 1,
      rootCauses: [{ id: "root-1", title: "Missing rollback guard", count: 1, confidence: 82, repositories: ["epochtm/app"], verdicts: ["FAIL"], rootCause: "Missing rollback guard.", lesson: "Keep rollout guarded", antiPattern: "Shipping without rollback evidence.", language: "TypeScript", framework: "Next.js", files: ["app/page.tsx"], pullRequestNumbers: [42], latestAt: "2026-07-20T00:00:00.000Z", example: null }],
    });

    await expect(invokeMemoryTool("memoryignition_list_lessons", { userId: "u1" })).resolves.toMatchObject({ total: 1 });
    await expect(invokeMemoryTool("memoryignition_list_failure_patterns", { userId: "u1" })).resolves.toMatchObject({ total: 1 });
    await expect(invokeMemoryTool("memoryignition_list_root_causes", { userId: "u1" })).resolves.toMatchObject({ total: 1 });
  });

  it("invokes the similar-experience and recommendation dispatchers", async () => {
    mocks.findSimilarExperiences.mockResolvedValue({
      query: "rollback",
      experienceId: "exp-1",
      total: 1,
      results: [
        {
          id: "exp-2",
          title: "FAIL release rollback",
          repository: "epochtm/app",
          pullRequestNumber: 42,
          pullRequestTitle: "Fix release flow",
          verdict: "FAIL",
          confidence: 91,
          score: 18,
          similarity: 88,
          reasoning: ["same_repository"],
          rootCause: "Missing rollback guard.",
          lesson: "Pause before release when evidence is incomplete.",
          bestPractice: "Require rollback approval.",
          antiPattern: "Shipping without rollback evidence.",
          language: "TypeScript",
          framework: "Next.js",
          files: ["app/page.tsx"],
          createdAt: "2026-07-20T00:00:00.000Z",
        },
      ],
    });
    mocks.buildExperienceRecommendations.mockResolvedValue({
      query: "rollback",
      total: 1,
      recommendations: [
        {
          id: "rec-1",
          type: "lesson",
          title: "Pause before release",
          reason: "Rollback evidence was incomplete.",
          recommendedAction: "Require rollback approval.",
          confidence: 90,
          count: 2,
          repositories: ["epochtm/app"],
          verdicts: ["FAIL"],
          exampleExperienceIds: ["exp-1"],
          latestAt: "2026-07-20T00:00:00.000Z",
        },
      ],
    });

    await expect(invokeMemoryTool("memoryignition_find_similar_experiences", { userId: "u1", query: "rollback" })).resolves.toMatchObject({ experienceId: "exp-1", total: 1 });
    await expect(invokeMemoryTool("memoryignition_get_experience_recommendations", { userId: "u1", query: "rollback" })).resolves.toMatchObject({ total: 1 });
  });
});
