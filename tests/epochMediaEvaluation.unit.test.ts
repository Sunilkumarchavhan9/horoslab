import { describe, expect, it } from "vitest";
import { evaluateEpochMedia, validateEpochMediaArtifact } from "../lib/epoch/mediaEvaluation";

describe("Epoch media evaluation", () => {
  it("validates image and video artifacts with deterministic hashes", () => {
    const image = { encoding: "data-url" as const, value: "data:image/png;base64," + "A".repeat(24) };
    expect(validateEpochMediaArtifact(image).valid).toBe(true);
    const result = evaluateEpochMedia({ cases: [{ id: "image", artifact: image, expectedMimePrefix: "image/" }] });
    expect(result.status).toBe("PASS"); expect(result.mimeMatchPct).toBe(1); expect(result.datasetSha256).toHaveLength(64);
  });
  it("rejects malformed artifacts and wrong media type", () => {
    const result = evaluateEpochMedia({ cases: [{ id: "bad", artifact: { encoding: "base64", value: "bad" }, expectedMimePrefix: "video/" }] });
    expect(result.status).toBe("UNKNOWN"); expect(result.invalidCaseIds).toEqual(["bad"]);
  });
});
