import { describe, expect, it } from "vitest";
import { buildEpochEvidenceBundle } from "../lib/epoch/evidenceBundle";

const mission = { id: "mission-1", title: "Test", objective: "Verify", state: "completed" };
const evidence = [{
  id: "evidence-1",
  kind: "test",
  summary: "Passed",
  payload: { b: 2, a: 1 },
  proof: {},
  createdAt: "2026-07-30T00:00:00.000Z",
}];

describe("Epoch evidence bundles", () => {
  it("produces a stable bundle hash", () => {
    const first = buildEpochEvidenceBundle({ mission, evidence, verification: { finalDecision: "PASS" } });
    const second = buildEpochEvidenceBundle({ mission, evidence: [{ ...evidence[0], payload: { a: 1, b: 2 } }], verification: { finalDecision: "PASS" } });
    expect(first.bundleHash).toBe(second.bundleHash);
    expect(first.version).toBe("epoch.evidence-bundle.v1");
  });

  it("includes integrity results and verification data", () => {
    const bundle = buildEpochEvidenceBundle({ mission, evidence, verification: { finalDecision: "PASS" } });
    expect(bundle.evidence).toHaveLength(1);
    expect((bundle.evidence[0] as { integrity: { valid: boolean } }).integrity.valid).toBe(true);
    expect(bundle.verification).toEqual({ finalDecision: "PASS" });
  });
});
