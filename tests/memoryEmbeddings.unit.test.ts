import { describe, expect, it } from "vitest";
import {
  computeHybridScore,
  cosineSimilarity,
} from "../lib/memory/embeddings";

describe("memory embeddings", () => {
  it("computes cosine similarity in 0..1 range", () => {
    const identical = cosineSimilarity([1, 0, 0], [1, 0, 0]);
    const orthogonal = cosineSimilarity([1, 0, 0], [0, 1, 0]);
    const opposite = cosineSimilarity([1, 0, 0], [-1, 0, 0]);

    expect(identical).toBeCloseTo(1, 5);
    expect(orthogonal).toBeCloseTo(0.5, 5);
    expect(opposite).toBeCloseTo(0, 5);
  });

  it("merges lexical and vector scores with configurable weight", () => {
    const lexicalOnly = computeHybridScore({ lexicalScore: 0.8 });
    expect(lexicalOnly).toBeCloseTo(0.8, 5);

    const hybrid = computeHybridScore({
      lexicalScore: 0.2,
      vectorScore: 0.9,
      vectorWeight: 0.6,
    });

    expect(hybrid).toBeCloseTo(0.62, 5);
  });

  it("prefers vector signal when lexical overlap is weak", () => {
    const lexicalWeak = computeHybridScore({
      lexicalScore: 0.1,
      vectorScore: 0.95,
    });
    const lexicalStrong = computeHybridScore({
      lexicalScore: 0.9,
      vectorScore: 0.2,
    });

    expect(lexicalWeak).toBeGreaterThan(lexicalStrong);
  });
});
