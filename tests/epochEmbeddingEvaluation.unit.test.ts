import { describe, expect, it } from "vitest";
import { evaluateEpochEmbeddings } from "../lib/epoch/embeddingEvaluation";

describe("Epoch embedding evaluation", () => {
  it("computes Recall, MRR, and NDCG from observed vectors", () => {
    const result = evaluateEpochEmbeddings({ cases: [{ id: "q1", query: [1, 0], relevantDocumentIds: ["d1"] }, { id: "q2", query: [0, 1], relevantDocumentIds: ["d2"] }], documents: [{ id: "d1", embedding: [1, 0] }, { id: "d2", embedding: [0, 1] }, { id: "d3", embedding: [-1, 0] }], ks: [1, 2] });
    expect(result.status).toBe("PASS");
    expect(result.recallAtK["1"]).toBe(1);
    expect(result.mrr).toBe(1);
    expect(result.ndcgAtK["1"]).toBe(1);
    expect(result.datasetSha256).toHaveLength(64);
  });

  it("does not pass invalid or missing vectors", () => {
    const result = evaluateEpochEmbeddings({ cases: [{ id: "bad", query: [1], relevantDocumentIds: ["missing"] }], documents: [{ id: "d1", embedding: [] }] });
    expect(result.status).toBe("UNKNOWN");
    expect(result.invalidCaseIds).toContain("bad");
  });
});
