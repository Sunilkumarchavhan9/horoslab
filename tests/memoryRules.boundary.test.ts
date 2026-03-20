import { afterEach, describe, expect, it, vi } from "vitest";
import { MEMORY_RULES } from "../lib/config/memoryRules";
import { filterAcceptedMemories, type ScoredMemoryCandidate } from "../lib/memory/scoreMemory";
import { mergeMemory } from "../lib/memory/mergeMemory";
import type { Memory } from "../lib/memory/types";

const mocks = vi.hoisted(() => ({
  searchMemoryFromMem0: vi.fn(),
  getRecentMemories: vi.fn(),
}));

vi.mock("../lib/integrations/mem0", () => ({
  searchMemoryFromMem0: mocks.searchMemoryFromMem0,
}));

vi.mock("../lib/memory/recentMemoryStore", () => ({
  getRecentMemories: mocks.getRecentMemories,
}));

import { retrieveRelevantMemory } from "../lib/memory/retrieveRelevantMemory";

const defaultRetrievalWeights = { ...MEMORY_RULES.retrieval.weights };

function makeScoredCandidate(score: number, content: string): ScoredMemoryCandidate {
  return {
    userId: "u_boundary",
    threadId: "t1",
    type: "profile",
    content,
    summary: content,
    source: "chat",
    importanceScore: score,
    confidence: 0.8,
    scoreReasons: ["test"],
  };
}

function makeMemory(input: {
  id: string;
  userId: string;
  type: Memory["type"];
  content: string;
}): Memory {
  const now = new Date().toISOString();
  return {
    id: input.id,
    userId: input.userId,
    type: input.type,
    content: input.content,
    summary: input.content,
    importanceScore: 0.7,
    confidence: 0.85,
    source: "chat",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: 1,
  };
}

afterEach(() => {
  Object.assign(MEMORY_RULES.retrieval.weights, defaultRetrievalWeights);
  mocks.searchMemoryFromMem0.mockReset();
  mocks.getRecentMemories.mockReset();
});

describe("Memory rule boundaries", () => {
  it("accepts score 0.65 and rejects score 0.64", () => {
    const scored = [
      makeScoredCandidate(0.65, "score-0.65"),
      makeScoredCandidate(0.64, "score-0.64"),
    ];

    const { accepted, rejected } = filterAcceptedMemories(
      scored,
      MEMORY_RULES.scoring.acceptThreshold,
    );

    expect(accepted).toHaveLength(1);
    expect(accepted[0]?.importanceScore).toBe(0.65);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.importanceScore).toBe(0.64);
  });

  it("does not merge when similarity is below threshold", () => {
    const existing = makeMemory({
      id: "m1",
      userId: "u_merge_boundary",
      type: "project",
      content: "User built payment service",
    });
    const incoming = makeMemory({
      id: "m2",
      userId: "u_merge_boundary",
      type: "project",
      content: "User fixed payment timeout bug",
    });

    const result = mergeMemory(existing, incoming);

    expect(result.shouldMerge).toBe(false);
    expect(result.reason).toBe("similarity below merge threshold");
  });

  it("changes retrieval order when ranking weights change", async () => {
    const now = new Date().toISOString();
    mocks.getRecentMemories.mockReturnValue([]);
    mocks.searchMemoryFromMem0.mockResolvedValue([
      {
        id: "sem-high",
        memory: "High semantic but low importance",
        score: 0.95,
        metadata: {
          memoryId: "sem-high",
          type: "learning",
          summary: "High semantic but low importance",
          importanceScore: "0.2",
          updatedAt: now,
          evidenceCount: "1",
        },
      },
      {
        id: "imp-high",
        memory: "Low semantic but high importance",
        score: 0.2,
        metadata: {
          memoryId: "imp-high",
          type: "learning",
          summary: "Low semantic but high importance",
          importanceScore: "0.95",
          updatedAt: now,
          evidenceCount: "1",
        },
      },
    ]);

    const baseline = await retrieveRelevantMemory({
      userId: "u_retrieval_boundary",
      question: "general memory question",
      topK: 2,
    });
    expect(baseline.memories[0]?.id).toBe("sem-high");

    MEMORY_RULES.retrieval.weights.semantic = 0.1;
    MEMORY_RULES.retrieval.weights.typeRelevance = 0.15;
    MEMORY_RULES.retrieval.weights.importance = 0.6;
    MEMORY_RULES.retrieval.weights.recency = 0.15;

    const weighted = await retrieveRelevantMemory({
      userId: "u_retrieval_boundary",
      question: "general memory question",
      topK: 2,
    });
    expect(weighted.memories[0]?.id).toBe("imp-high");
  });
});
