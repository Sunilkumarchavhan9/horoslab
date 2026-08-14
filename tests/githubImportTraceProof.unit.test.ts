import { describe, expect, it } from "vitest";
import { buildGitHubMemorySourceDetails } from "../lib/integrations/github";

describe("GitHub import trace proof", () => {
  it("builds stable source proof for repositories", () => {
    const proof = buildGitHubMemorySourceDetails({
      kind: "repo",
      repoFullName: "memoryos/app",
      title: "memoryos/app",
      url: "https://github.com/memoryos/app",
      capturedAt: "2026-06-18T10:00:00.000Z",
    });

    expect(proof.sourceRef).toBe("github://memoryos/app");
    expect(proof.traceProof).toMatchObject({
      sourceType: "github",
      sourceRef: "github://memoryos/app",
      confidence: 0.92,
      capturedAt: "2026-06-18T10:00:00.000Z",
    });
    expect(proof.traceProof.evidence).toEqual([
      "Repository: memoryos/app",
      "https://github.com/memoryos/app",
    ]);
  });

  it("builds stable source proof for pull requests", () => {
    const proof = buildGitHubMemorySourceDetails({
      kind: "pr",
      repoFullName: "memoryos/app",
      number: 42,
      title: "Fix auth redirect",
      url: "https://github.com/memoryos/app/pull/42",
      capturedAt: "2026-06-18T10:00:00.000Z",
    });

    expect(proof.sourceRef).toBe("github://memoryos/app/pull/42");
    expect(proof.traceProof).toMatchObject({
      sourceType: "github",
      sourceRef: "github://memoryos/app/pull/42",
      confidence: 0.92,
      capturedAt: "2026-06-18T10:00:00.000Z",
    });
    expect(proof.traceProof.evidence).toContain("PR #42: Fix auth redirect");
    expect(proof.traceProof.evidence).toContain("https://github.com/memoryos/app/pull/42");
    expect(proof.developerSignals.projectArea).toEqual(["memoryos/app"]);
  });

  it("builds stable source proof for issues", () => {
    const proof = buildGitHubMemorySourceDetails({
      kind: "issue",
      repoFullName: "memoryos/app",
      number: 7,
      title: "Login returns 401",
      url: "https://github.com/memoryos/app/issues/7",
      capturedAt: "2026-06-18T10:00:00.000Z",
    });

    expect(proof.sourceRef).toBe("github://memoryos/app/issues/7");
    expect(proof.traceProof.sourceType).toBe("github");
    expect(proof.traceProof.evidence).toEqual([
      "Issue #7: Login returns 401",
      "https://github.com/memoryos/app/issues/7",
    ]);
  });
});
