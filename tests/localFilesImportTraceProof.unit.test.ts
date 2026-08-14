import { describe, expect, it } from "vitest";
import { buildLocalFileMemorySourceDetails } from "../lib/integrations/localFiles";

describe("local files import trace proof", () => {
  it("builds stable docs source refs and trace proof", () => {
    const proof = buildLocalFileMemorySourceDetails({
      relativePath: "docs/phase1.md",
      absolutePath: "C:/projects/MemoryOS/docs/phase1.md",
      capturedAt: "2026-06-18T00:00:00.000Z",
    });

    expect(proof.sourceRef).toBe("docs://docs/phase1.md");
    expect(proof.traceProof).toMatchObject({
      sourceType: "docs",
      sourceRef: "docs://docs/phase1.md",
      confidence: 0.9,
      capturedAt: "2026-06-18T00:00:00.000Z",
    });
    expect(proof.traceProof.evidence).toEqual([
      "Document: docs/phase1.md",
      "C:/projects/MemoryOS/docs/phase1.md",
    ]);
    expect(proof.developerSignals.projectArea).toEqual(["docs/phase1.md"]);
  });
});
