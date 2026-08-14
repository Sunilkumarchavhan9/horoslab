import { consoleApiFetch } from "@/lib/console-api";
import type { PrReviewViewModel } from "@/lib/continuity-lab/pr-review-model";

export type PrReviewActionKind = "approve" | "request_changes" | "save_learnings" | "merge";

export type MergePrReviewInput = {
  owner: string;
  repo: string;
  number: number;
  mergeMethod?: "merge" | "squash" | "rebase";
  commitTitle?: string | null;
  commitMessage?: string | null;
  expectedHeadSha?: string | null;
};

export type MergePrReviewResult = {
  merged: boolean;
  sha: string | null;
  mergedAt: string | null;
  message: string | null;
};

export type SavePrReviewActionMemoryInput = {
  projectId: string;
  workspace?: string | null;
  review: PrReviewViewModel;
  action: PrReviewActionKind;
  outcome?: "success" | "failed" | "rolled_back";
  sourceType?: "continuity" | "github_execution" | "manual";
  sourceId?: string | null;
  note?: string | null;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: unknown };
  return (record.data ?? payload) as T;
}

function summarizeReview(review: PrReviewViewModel): string {
  const parts = [
    review.header.repoFullName ? `${review.header.repoFullName}` : "Review",
    review.header.prNumber ? `#${review.header.prNumber}` : null,
    review.header.title,
  ].filter(Boolean);
  return parts.join(" ").trim();
}

export async function savePrReviewActionMemory(input: SavePrReviewActionMemoryInput): Promise<{
  ok: boolean;
  actionMemoryId: string | null;
  error?: string;
}> {
  const projectId = input.projectId.trim();
  if (!projectId) {
    return { ok: false, actionMemoryId: null, error: "projectId is required" };
  }

  const review = input.review;
  const actionLabel =
    input.action === "approve"
      ? "pr_review_approved"
      : input.action === "request_changes"
        ? "pr_review_changes_requested"
        : input.action === "merge"
          ? "pr_review_merge"
          : "pr_review_learnings_saved";

  const filesChanged = review.changes.flatMap((group) => group.files.map((file) => file.path));
  const learnings = review.learnings
    .map((item) => item.pattern.trim())
    .filter((item) => item.length > 0);
  const decisionReasons = review.decisions
    .map((item) => item.reason.trim())
    .filter((item) => item.length > 0);
  const followUps = [...learnings, ...decisionReasons].slice(0, 10);

  try {
    const res = await consoleApiFetch("/api/memory/action-memory", {
      method: "POST",
      body: JSON.stringify({
        projectId,
        workspace: input.workspace ?? "continuity-lab",
        action: actionLabel,
        reason:
          input.note?.trim() ||
          `${summarizeReview(review)} ${input.action.replaceAll("_", " ")}`.trim(),
        outcome: input.outcome ?? "success",
        sourceType: input.sourceType ?? "continuity",
        sourceId: input.sourceId ?? review.header.githubUrl ?? review.header.repoFullName ?? null,
        filesChanged,
        followUps,
        metadata: {
          kind: "pr_review",
          action: input.action,
          review: {
            repoFullName: review.header.repoFullName,
            prNumber: review.header.prNumber,
            title: review.header.title,
            ciStatus: review.header.ciStatus,
            statusLabel: review.header.statusLabel,
            bugs: review.bugs.length,
            memoriesUsed: review.memoryUsed.length,
            decisions: review.decisions.length,
            learnings: review.learnings.length,
          },
        },
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const message =
        (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : null) ?? "Could not save review memory.";
      return { ok: false, actionMemoryId: null, error: message };
    }

    const payload = await res.json().catch(() => null);
    const data = unwrapData<{ actionMemory?: { id: string } }>(payload);
    return {
      ok: true,
      actionMemoryId: data?.actionMemory?.id ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      actionMemoryId: null,
      error: error instanceof Error ? error.message : "Could not save review memory.",
    };
  }
}

export async function mergePrReview(
  input: MergePrReviewInput,
): Promise<{
  ok: boolean;
  mergeResult: MergePrReviewResult | null;
  error?: string;
}> {
  const owner = input.owner.trim();
  const repo = input.repo.trim();
  if (!owner || !repo) {
    return { ok: false, mergeResult: null, error: "owner and repo are required" };
  }
  if (!Number.isFinite(input.number) || input.number < 1) {
    return { ok: false, mergeResult: null, error: "number must be a positive integer" };
  }

  try {
    const res = await consoleApiFetch(
      `/api/connector/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${encodeURIComponent(String(Math.floor(input.number)))}/merge`,
      {
        method: "POST",
        body: JSON.stringify({
          ...(input.mergeMethod ? { mergeMethod: input.mergeMethod } : {}),
          ...(input.commitTitle?.trim() ? { commitTitle: input.commitTitle.trim() } : {}),
          ...(input.commitMessage?.trim() ? { commitMessage: input.commitMessage.trim() } : {}),
          ...(input.expectedHeadSha?.trim() ? { expectedHeadSha: input.expectedHeadSha.trim() } : {}),
        }),
      },
    );
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : null) ?? "Could not merge pull request.";
      return { ok: false, mergeResult: null, error: message };
    }

    const data = unwrapData<{ mergeResult?: MergePrReviewResult }>(payload);
    return {
      ok: true,
      mergeResult: data?.mergeResult ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      mergeResult: null,
      error: error instanceof Error ? error.message : "Could not merge pull request.",
    };
  }
}
