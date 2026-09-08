"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContinuityLabPrReviewPanel } from "@/components/continuity-lab/continuity-lab-pr-review-panel";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { projectIdForLab } from "@/lib/continuity-lab/resume-brief";
import {
  fetchDecisionHistory,
  fetchExecutionHistory,
  type ExecutionLineageItem,
} from "@/lib/continuity-lab/operational-api";
import {
  fetchHandoffTrace,
  fetchRelevantMemories,
} from "@/lib/continuity-lab/continuity-memory-api";
import {
  fetchGitHubPullRequest,
  fetchGitHubRepoPullRequests,
  type GitHubPullRequestDetail,
  type GitHubRepoPullRequestEntry,
} from "@/lib/continuity-lab/wiki-api";
import { touchRecentPullRequest } from "@/lib/continuity-lab/review-storage";
import {
  buildPrReviewViewModel,
  type PrReviewBug,
  type PrReviewChangeGroup,
  type PrReviewDiscussionItem,
  type PrReviewViewModel,
} from "@/lib/continuity-lab/pr-review-model";
import type { OperationalResumeBrief } from "@/lib/continuity-lab/resume-brief";
import type { PrReadyArtifact } from "@/lib/continuity-lab/chat-events";

function reviewUrl(owner: string, repo: string, pr: number): string {
  return `https://github.com/${owner}/${repo}/pull/${pr}`;
}

type ContinuityLabReviewDetailProps = {
  owner: string;
  repo: string;
  pr: number;
};

export function ContinuityLabReviewDetail({ owner, repo, pr }: ContinuityLabReviewDetailProps) {
  const { connector } = useContinuityLab();
  const repoName = useMemo(() => repo.replace(/%20/g, " "), [repo]);
  const repoFullName = `${owner}/${repoName}`;
  const githubConnected = connector.payload.github.connected;
  const [review, setReview] = useState<PrReviewViewModel | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    touchRecentPullRequest({
      url: reviewUrl(owner, repoName, pr),
      fullName: repoFullName,
      pr,
      title: `Review ${repoFullName} pull request #${pr}`,
    });
    return () => {
      mountedRef.current = false;
    };
  }, [owner, pr, repoFullName, repoName]);

  useEffect(() => {
    let cancelled = false;

    async function loadReview() {
      const projectId = projectIdForLab({ repoFullName, fallbackProject: repoName });
      const question = `Review ${repoFullName} pull request #${pr}`;

      const [pulls, memories, handoffTrace, decisions, executionHistory] = await Promise.all([
        githubConnected ? fetchGitHubRepoPullRequests(owner, repoName, 12) : Promise.resolve([] as GitHubRepoPullRequestEntry[]),
        fetchRelevantMemories({ projectId, repo: repoFullName, question, topK: 6 }),
        fetchHandoffTrace({ projectId, repo: repoFullName, question, topK: 4 }),
        fetchDecisionHistory(projectId, 8),
        fetchExecutionHistory(projectId, 8),
      ]);

      const pullRequest: GitHubPullRequestDetail | null =
        githubConnected ? await fetchGitHubPullRequest(owner, repoName, pr) : null;

      if (cancelled || !mountedRef.current) return;

      if (!pullRequest) {
        setReview(null);
        return;
      }

      const prTitle =
        pullRequest?.title?.trim() ||
        pulls.find((entry) => entry.number === pr)?.title?.trim() ||
        `Review ${repoFullName} pull request #${pr}`;

      const brief: OperationalResumeBrief | null = null;
      const mappedMemories = memories.slice(0, 6).map((memory) => ({
        memoryType: "experience" as const,
        title: memory.summary,
        content: memory.content,
        evidence: [memory.id, memory.summary].filter(Boolean),
        confidence: memory.confidence ?? 0.72,
        importance: "medium" as const,
      }));

      const changeGroups: PrReviewChangeGroup[] = pullRequest?.files?.length
        ? pullRequest.files.map((file, index) => ({
            id: `${repoFullName}-${pr}-${file.filename}-${index}`,
            index: index + 1,
            title: file.filename,
            detail: `${file.status}${file.additions || file.deletions ? ` · +${file.additions} / -${file.deletions}` : ""}`,
            files: [
              {
                path: file.filename,
                additions: file.additions,
                deletions: file.deletions,
                kind: file.status,
                detail: file.patch ? "Unified diff from GitHub" : "No patch returned by GitHub",
                content: file.patch ?? null,
              },
            ],
            summary: file.patch?.trim() ? null : "GitHub did not return a diff patch for this file.",
          }))
        : [
            {
              id: `${repoFullName}-${pr}-summary`,
              index: 1,
              title: prTitle,
              detail: "Connected PR review",
              files: [],
              summary:
                handoffTrace?.summary?.trim() ||
                "Review this PR with MemoryOS context and backend-backed signals.",
            },
          ];

      const bugCards: PrReviewBug[] = [
        ...(pullRequest?.commentsList ?? [])
          .filter((comment) => /bug|error|failure|issue|fix|should|must|wrong/i.test(comment.body))
          .slice(0, 3)
          .map((comment) => ({
            id: `comment-${comment.id}`,
            severity: "medium" as const,
            title: comment.path ? `Review comment on ${comment.path}` : "Review comment finding",
            detail: comment.body,
            filePath: comment.path,
            line: comment.line,
            suggestion: "Verify this comment against the live diff and capture the fix in memory.",
          })),
        ...decisions
          .filter((entry) => /bug|error|failure|incident|rollback/i.test(`${entry.summary} ${entry.content}`))
          .slice(0, 2)
          .map((entry, index) => ({
            id: `${entry.memoryId}-${index}`,
            severity: "medium" as const,
            title: entry.summary,
            detail: entry.content,
            suggestion: "Capture the failure mode as a reusable review note.",
          })),
      ];

      const discussion: PrReviewDiscussionItem[] = [
        ...(pullRequest?.reviews ?? []).slice(0, 4).map((review) => ({
          id: `review-${review.id}`,
          author: review.user ?? "GitHub",
          title: review.state,
          detail: review.body?.trim() || "Review submitted.",
          tone:
            review.state.toLowerCase() === "approved"
              ? ("success" as const)
              : review.state.toLowerCase() === "changes_requested"
                ? ("warn" as const)
                : ("neutral" as const),
          timestamp: review.submittedAt,
        })),
        ...(pullRequest?.commentsList ?? []).slice(0, 4).map((comment) => ({
          id: `review-comment-${comment.id}`,
          author: comment.user ?? "GitHub",
          title: comment.path ? comment.path : "Inline comment",
          detail: comment.body,
          tone: "info" as const,
          timestamp: comment.createdAt,
        })),
        ...(handoffTrace?.recommendedNextActions ?? []).slice(0, 3).map((item, index) => ({
          id: `handoff-${index}`,
          author: "MemoryOS",
          title: "Recommended next action",
          detail: item,
          tone: "info" as const,
        })),
        ...(executionHistory[0]?.approvalTraces ?? []).slice(0, 2).map((approval) => ({
          id: approval.id,
          author: "MemoryOS",
          title: approval.decision === "approved" ? "Approved" : "Revision requested",
          detail: approval.reason || "Approval recorded.",
          tone: approval.decision === "approved" ? ("success" as const) : ("warn" as const),
        })),
      ];

      const reviewData = buildPrReviewViewModel({
        repoFullName,
        prReady:
          {
            type: "pr_ready",
            id: `review-${repoFullName}-${pr}`,
            url: pullRequest?.htmlUrl ?? reviewUrl(owner, repoName, pr),
            number: pullRequest?.number ?? pr,
            title: prTitle,
            branch: pullRequest?.headRef ?? undefined,
            baseBranch: pullRequest?.baseRef ?? "main",
            ciStatus:
              pullRequest?.statusState === "success"
                ? "passed"
                : pullRequest?.statusState === "failure"
                  ? "failed"
                  : pullRequest?.merged
                    ? "merged"
                    : "pending",
            filesChanged: pullRequest?.changedFiles ?? changeGroups.length,
            additions: pullRequest?.additions ?? 0,
            deletions: pullRequest?.deletions ?? 0,
          } satisfies PrReadyArtifact,
        linkedPrUrl: pullRequest?.htmlUrl ?? reviewUrl(owner, repoName, pr),
        repoPullTitle: prTitle,
        defaultBranch: pullRequest?.baseRef ?? "main",
        previewUrl: null,
        brief,
        sessionMemories: mappedMemories,
        handoffPacket: handoffTrace
          ? ({
              summary: handoffTrace.summary,
              injectedContext: memories,
              newMemories: mappedMemories,
              experienceLearned: [],
              recommendedNextActions: handoffTrace.recommendedNextActions,
              sameBugDetectionHint: "Compare the same failure mode against this PR first.",
            } as const)
          : null,
        playbook: null,
        runtimeThread: null,
        runtimeArtifacts: [],
        executionHistory: executionHistory as ExecutionLineageItem[],
        runtimeHandoffs: [],
        changeGroups,
        bugs: bugCards.length
          ? bugCards
          : pullRequest?.files?.length
            ? pullRequest.files.slice(0, 3).map((file) => ({
                id: `file-${file.filename}`,
                severity: "low" as const,
                title: file.filename,
                detail: file.patch?.trim()
                  ? "No explicit bug comment, but a live diff is available."
                  : "GitHub returned file metadata without a patch.",
                filePath: file.filename,
                suggestion: "Inspect the live diff and capture any review concern as a memory.",
              }))
            : [
                {
                  id: "no-bugs",
                  severity: "low" as const,
                  title: "No concrete review bug detected",
                  detail: "The review surface is hydrated from real memory and decision data.",
                  suggestion: "Open the session rail for live diff detail when the thread is available.",
                },
              ],
        discussion,
        latestReviewOutcome: null,
      });

      if (!cancelled && mountedRef.current) {
        setReview(reviewData);
      }
    }

    const timer = window.setTimeout(() => {
      void loadReview();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [githubConnected, owner, pr, repoFullName, repoName]);

  return (
    <div className="flex min-h-full flex-col bg-[#0A0A0A] text-[#F0EFE2]">
      <div className="flex-1 overflow-y-auto p-3">
        <ContinuityLabPrReviewPanel
          review={review}
          emptyTitle="No PR review data loaded"
          emptyDescription="This route is waiting for live pull request data or memory-backed review context."
        />
      </div>
      <div className="border-t border-white/10 px-4 py-2 text-[10px] text-[#F0EFE2]/35">
        Review route · {repoFullName}
      </div>
    </div>
  );
}
