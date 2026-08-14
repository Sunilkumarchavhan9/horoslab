import { beforeEach, describe, expect, it, vi } from "vitest";
import { planResume, BRIEF_INSUFFICIENT_DATA } from "../lib/memory/resumePlanner";
import { computeResumeConfidence } from "../lib/memory/resumeConfidence";

const mocks = vi.hoisted(() => ({
  retrieveRelevantMemory: vi.fn(),
  getRecentMemories: vi.fn(),
  listActionMemories: vi.fn(),
  loadOperationalLoopHistoryForProject: vi.fn(),
  countRecentCompletedLoops: vi.fn(),
  loadProjectDriftBriefLines: vi.fn(),
}));

vi.mock("../lib/memory/retrieveRelevantMemory", () => ({
  retrieveRelevantMemory: mocks.retrieveRelevantMemory,
}));

vi.mock("../lib/memory/recentMemoryStore", () => ({
  getRecentMemories: mocks.getRecentMemories,
}));

vi.mock("../lib/memory/actionMemoryStore", () => ({
  listActionMemories: mocks.listActionMemories,
}));

vi.mock("../lib/companyBrain/operationalLoopService", () => ({
  loadOperationalLoopHistoryForProject: mocks.loadOperationalLoopHistoryForProject,
  countRecentCompletedLoops: mocks.countRecentCompletedLoops,
  loadProjectDriftBriefLines: mocks.loadProjectDriftBriefLines,
}));

const REQUIRED_BRIEF_KEYS = [
  "whatChangedRecently",
  "currentGoal",
  "keyDecisions",
  "openBlockers",
  "riskyFiles",
  "nextBestAction",
  "mustKnowContextForAgent",
  "projectGoal",
  "currentState",
  "recentChanges",
  "blockedAreas",
  "openDecisions",
  "nextRecommendedActions",
  "relevantPRs",
  "relevantIssues",
  "agentSuggestions",
  "executionHistory",
  "driftAndCorrectiveActions",
  "whyTheseMemoriesWereSelected",
  "resumeConfidence",
] as const;

function buildRankedMemory(overrides: Record<string, unknown> = {}) {
  return {
    id: "m-resume-1",
    memory: "Shipped resume brief hardening in lib/memory/resumePlanner.ts. PR #42 fixes issue #17.",
    memoryType: "project",
    contractCategory: "decision",
    importanceScore: 0.9,
    recencyScore: 0.95,
    typeRelevanceScore: 1,
    semanticScore: 0.92,
    continuityBoost: 0.12,
    finalScore: 0.94,
    updatedAt: new Date().toISOString(),
    metadata: { summary: "Resume brief hardening landed" },
    ...overrides,
  };
}

describe("Resume brief contract", () => {
  beforeEach(() => {
    mocks.retrieveRelevantMemory.mockReset();
    mocks.getRecentMemories.mockReset();
    mocks.listActionMemories.mockReset();
    mocks.loadOperationalLoopHistoryForProject.mockReset();
    mocks.countRecentCompletedLoops.mockReset();
    mocks.loadProjectDriftBriefLines.mockReset();
    mocks.getRecentMemories.mockResolvedValue([]);
    mocks.listActionMemories.mockResolvedValue([]);
    mocks.loadOperationalLoopHistoryForProject.mockResolvedValue([]);
    mocks.countRecentCompletedLoops.mockResolvedValue(0);
    mocks.loadProjectDriftBriefLines.mockResolvedValue({
      lines: [],
      hasUnresolvedHighDrift: false,
    });
  });

  it("includes all required brief section keys with confidence between 0 and 100", async () => {
    const memory = buildRankedMemory();
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [memory],
      debug: [
        {
          id: memory.id,
          semanticScore: memory.semanticScore,
          typeRelevanceScore: memory.typeRelevanceScore,
          importanceScore: memory.importanceScore,
          recencyScore: memory.recencyScore,
          continuityBoost: memory.continuityBoost,
          intent: "resume_project",
          weightsUsed: {
            semantic: 0.4,
            typeRelevance: 0.2,
            importance: 0.2,
            recency: 0.2,
          },
          reasonTags: ["resume_project", "project"],
          contributions: {
            semantic: 0.36,
            typeRelevance: 0.2,
            importance: 0.18,
            recency: 0.19,
            continuity: 0.12,
            total: 0.94,
          },
          finalScore: memory.finalScore,
          lifecycle: {
            latestEventType: null,
            latestReason: null,
            latestChangedAt: null,
          },
        },
      ],
    });

    const result = await planResume({
      userId: "u-brief",
      project: "MemoryOS",
      question: "where did I leave off?",
    });

    for (const key of REQUIRED_BRIEF_KEYS) {
      expect(result.brief).toHaveProperty(key);
    }

    expect(result.brief.resumeConfidence.score).toBeGreaterThanOrEqual(0);
    expect(result.brief.resumeConfidence.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.brief.resumeConfidence.factors)).toBe(true);
    expect(result.brief.resumeConfidence.factors.length).toBeGreaterThan(0);
    expect(result.brief.relevantPRs.some((item) => /42|PR/i.test(item))).toBe(true);
    expect(result.brief.relevantIssues.some((item) => /17|issue/i.test(item))).toBe(true);
    expect(result.brief.whyTheseMemoriesWereSelected.length).toBeGreaterThan(0);
    expect(result.brief.whyTheseMemoriesWereSelected[0]?.memoryId).toBe(memory.id);
  });

  it("uses insufficient-data markers when no memories are retrieved", async () => {
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [],
      debug: [],
    });

    const result = await planResume({
      userId: "u-empty",
      project: "MemoryOS",
      question: "resume",
    });

    expect(result.brief.resumeConfidence.score).toBeGreaterThanOrEqual(0);
    expect(result.brief.resumeConfidence.score).toBeLessThanOrEqual(100);
    expect(result.brief.relevantPRs).toContain(BRIEF_INSUFFICIENT_DATA);
    expect(result.brief.executionHistory).toContain(BRIEF_INSUFFICIENT_DATA);
    expect(result.brief.whyTheseMemoriesWereSelected).toEqual([]);
  });

  it("keeps legacy brief fields aligned with canonical sections", async () => {
    const memory = buildRankedMemory({
      memory: "Decision: keep Postgres canonical. Blocker: migration script pending.",
      contractCategory: "blocker",
    });
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [memory],
      debug: [],
    });

    const result = await planResume({
      userId: "u-legacy",
      project: "MemoryOS",
      question: "continue",
    });

    expect(result.brief.currentGoal).toBe(result.brief.projectGoal);
    expect(result.brief.keyDecisions).toEqual(result.brief.openDecisions);
    expect(result.brief.openBlockers).toEqual(result.brief.blockedAreas);
  });

  it("adds Mythic lineage to why-selected reasoning and execution history", async () => {
    const memory = buildRankedMemory();
    mocks.retrieveRelevantMemory.mockResolvedValue({
      memories: [memory],
      debug: [],
    });
    mocks.listActionMemories.mockResolvedValue([
      {
        id: "act-mythic-1",
        userId: "u-brief",
        projectId: "memoryos",
        workspace: "memoryos",
        action: "Mythic execution completed: Runtime worker hardening",
        reason: "Persist worker jobs and prevent duplicate retries",
        outcome: "success",
        sourceType: "continuity",
        sourceId: "thread-99",
        metadata: {
          provenanceTags: ["mythic_execution", "mythic_verification", "mythic_pr"],
        },
        updatedAt: "2026-06-12T10:00:00.000Z",
        createdAt: "2026-06-12T10:00:00.000Z",
      },
    ]);

    const result = await planResume({
      userId: "u-brief",
      project: "memoryos",
      question: "where did I leave off?",
    });

    expect(result.usedMemories.some((item) => item.source?.startsWith("mythic_execution:"))).toBe(true);
    expect(
      result.brief.whyTheseMemoriesWereSelected.some((item) =>
        item.reasonTags?.some((tag) => tag.includes("mythic_execution")),
      ),
    ).toBe(true);
    expect(
      result.brief.executionHistory.some((line) => line.includes("Mythic execution completed")),
    ).toBe(true);
  });
});

describe("Resume confidence scoring", () => {
  it("returns bounded score and weighted factor contributions", () => {
    const score = computeResumeConfidence({
      usedMemories: [{ finalScore: 0.9, recencyScore: 0.8, updatedAt: new Date().toISOString() }],
      retrievalDebug: [{ recencyScore: 0.85, continuityBoost: 0.1 } as never],
      populatedSectionCount: 8,
      totalSectionCount: 11,
      githubSignalCount: 2,
      executionTraceCount: 1,
    });

    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.factors.reduce((sum, factor) => sum + factor.contribution, 0)).toBeGreaterThan(0);
  });
});
