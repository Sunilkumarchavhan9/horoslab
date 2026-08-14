import { describe, expect, it } from "vitest";
import { evaluateEpochReranking } from "../lib/epoch/rerankingEvaluation";

describe("Epoch reranking evaluation", () => {
  it("computes Recall, MRR, and NDCG from observed ranked results", () => {
    const result = evaluateEpochReranking({ cases: [{ id: "q1", relevantDocumentIds: ["d1"], rankedDocumentIds: ["d1", "d2"] }, { id: "q2", relevantDocumentIds: ["d2"], rankedDocumentIds: ["d2", "d1"] }], ks: [1, 2] });
    expect(result.status).toBe("PASS");
    expect(result.recallAtK["1"]).toBe(1);
    expect(result.mrr).toBe(1);
    expect(result.ndcgAtK["1"]).toBe(1);
    expect(result.datasetSha256).toHaveLength(64);
  });

  it("rejects duplicate or missing judged documents", () => {
    const result = evaluateEpochReranking({ cases: [{ id: "bad", relevantDocumentIds: ["d1"], rankedDocumentIds: ["d2", "d2"] }] });
    expect(result.status).toBe("UNKNOWN");
    expect(result.invalidCaseIds).toContain("bad");
  });
});
