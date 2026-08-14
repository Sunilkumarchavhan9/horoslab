import { describe, expect, it } from "vitest";
import { buildEvidenceIntegrityProof, canonicalEvidencePayload, hashEvidencePayload, verifyEvidenceIntegrity } from "../lib/epoch/evidenceIntegrity";

const evidence = {
  kind: "test",
  summary: "Result",
  payload: { z: 1, a: ["stable"] },
};

describe("Epoch evidence integrity", () => {
  it("canonicalizes object key order before hashing", () => {
    expect(hashEvidencePayload(evidence)).toBe(hashEvidencePayload({ ...evidence, payload: { a: ["stable"], z: 1 } }));
    expect(canonicalEvidencePayload(evidence)).toContain('"kind":"test"');
  });

  it("detects tampering and accepts legacy evidence explicitly", () => {
    const proof = buildEvidenceIntegrityProof(evidence);
    expect(verifyEvidenceIntegrity({ ...evidence, proof })).toMatchObject({ valid: true, legacy: false });
    expect(verifyEvidenceIntegrity({ ...evidence, summary: "Changed", proof })).toMatchObject({ valid: false, legacy: false });
    expect(verifyEvidenceIntegrity({ ...evidence, proof: {} })).toMatchObject({ valid: true, legacy: true });
  });
});
