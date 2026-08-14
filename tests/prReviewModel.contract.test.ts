import { describe, expect, it } from "vitest";
import { buildPrReviewViewModel } from "../memoryos-frontend/lib/continuity-lab/pr-review-model";

describe("PR review model contract", () => {
  it("returns null when there is no real PR surface to render", () => {
    const review = buildPrReviewViewModel({
      repoFullName: "acme/widget",
      prReady: null,
      linkedPrUrl: null,
      defaultBranch: "main",
      previewUrl: null,
      brief: null,
      sessionMemories: [],
      handoffPacket: null,
      playbook: null,
      runtimeThread: null,
      runtimeArtifacts: [],
      executionHistory: [] as never[],
      runtimeHandoffs: [],
      changeGroups: [],
      bugs: [],
      discussion: [],
      latestReviewOutcome: null,
    });

    expect(review).toBeNull();
  });

  it("builds a live PR review view model from file diffs and review metadata", () => {
    const review = buildPrReviewViewModel({
      repoFullName: "acme/widget",
      prReady: {
        type: "pr_ready",
        id: "pr-ready-1",
        url: "https://github.com/acme/widget/pull/17",
        number: 17,
        title: "Fix signup regression",
        branch: "fix/signup-regression",
        baseBranch: "main",
        ciStatus: "passed",
        filesChanged: 2,
        additions: 48,
        deletions: 9,
        timestamp: new Date().toISOString(),
      },
      linkedPrUrl: "https://github.com/acme/widget/pull/17",
      repoPullTitle: "Fix signup regression",
      defaultBranch: "main",
      previewUrl: "https://preview.example.test",
      brief: null,
      sessionMemories: [],
      handoffPacket: null,
      playbook: null,
      runtimeThread: null,
      runtimeArtifacts: [],
      executionHistory: [] as never[],
      runtimeHandoffs: [],
      changeGroups: [
        {
          id: "group-1",
          index: 1,
          title: "signup.tsx",
          detail: "Updated validation",
          files: [
            {
              path: "app/signup.tsx",
              additions: 24,
              deletions: 4,
              kind: "modified",
              detail: "Unified diff from GitHub",
              content: "@@ -1,2 +1,2 @@\n-old\n+new",
            },
          ],
          summary: "Live diff",
        },
      ],
      bugs: [],
      learnings: [],
      discussion: [],
      latestReviewOutcome: { label: "Approved", detail: "Checks passed." },
    });

    expect(review?.header.repoFullName).toBe("acme/widget");
    expect(review?.header.prNumber).toBe(17);
    expect(review?.header.statusLabel).toBe("Ready to merge");
    expect(review?.header.filesChanged).toBe(2);
    expect(review?.header.additions).toBe(48);
    expect(review?.header.deletions).toBe(9);
    expect(review?.actions.canOpenGitHub).toBe(true);
    expect(review?.actions.canOpenPreview).toBe(true);
    expect(review?.actions.canMerge).toBe(true);
    expect(review?.changes[0]?.files[0]?.content).toContain("+new");
    expect(review?.overview.summary).toContain("Checks passed.");
    expect(review?.learnings).toHaveLength(0);
  });
});
