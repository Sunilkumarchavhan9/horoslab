"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileDiff,
  GitBranch,
  GitPullRequest,
  MemoryStick,
  ShieldAlert,
  Sparkles,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PrReviewChangeGroup,
  PrReviewViewModel,
} from "@/lib/continuity-lab/pr-review-model";

type PrReviewPanelProps = {
  review: PrReviewViewModel | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  onSaveLearnings?: () => void;
  onMerge?: () => void;
  onOpenPreview?: () => void;
  onOpenGitHub?: () => void;
  className?: string;
};

type ReviewTab = "overview" | "changes" | "bugs" | "memory" | "decisions" | "learnings" | "discussion";

const REVIEW_TABS: Array<{ id: ReviewTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "changes", label: "Changes" },
  { id: "bugs", label: "Bugs" },
  { id: "memory", label: "Memory Used" },
  { id: "decisions", label: "Decisions" },
  { id: "learnings", label: "Learnings" },
  { id: "discussion", label: "Discussion" },
];

function statusTone(status: string): string {
  if (status === "Ready to merge" || status === "Merged") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "Checks failing") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }
  if (status === "Checks running") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-white/15 bg-white/[0.05] text-[#F0EFE2]/70";
}

function severityTone(severity: string): string {
  if (severity === "high") return "border-rose-500/25 bg-rose-500/[0.08] text-rose-100";
  if (severity === "medium") return "border-amber-500/25 bg-amber-500/[0.08] text-amber-100";
  return "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-100";
}

function EmptyTabState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed border-white/10 bg-[#0b0b0b] px-4 py-6 text-center">
      <p className="text-sm font-medium text-[#F0EFE2]/85">{title}</p>
      <p className="mt-1 text-[11px] leading-6 text-[#F0EFE2]/50">{description}</p>
    </div>
  );
}

export function ContinuityLabPrReviewPanel({
  review,
  emptyTitle = "No pull request review data yet",
  emptyDescription = "Link a runtime thread or open a real PR to populate the review model with changes, bugs, memory, and decisions.",
  onApprove,
  onRequestChanges,
  onSaveLearnings,
  onMerge,
  onOpenPreview,
  onOpenGitHub,
  className,
}: PrReviewPanelProps) {
  const [tab, setTab] = useState<ReviewTab>("overview");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const selectedGroup =
    review?.changes.find((group) => group.id === selectedGroupId) ?? review?.changes[0] ?? null;

  if (!review) {
    return (
      <div
        className={cn(
          "flex min-h-[60vh] items-center justify-center px-4 py-8",
          className,
        )}
      >
        <div className="max-w-xl rounded-md border border-white/10 bg-white/[0.03] px-6 py-8 text-center">
          <GitPullRequest className="mx-auto size-8 text-emerald-300" />
          <h2 className="mt-4 text-xl font-semibold text-[#F0EFE2]">{emptyTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-[#F0EFE2]/55">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  const canOpenGitHub = review.actions.canOpenGitHub && Boolean(review.header.githubUrl);
  const canOpenPreview = review.actions.canOpenPreview && Boolean(review.header.previewUrl);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-md border border-white/10 bg-[#0b0b0b] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", statusTone(review.header.statusLabel))}>
                <GitPullRequest className="size-3.5" />
                {review.header.prNumber ? `PR #${review.header.prNumber}` : "Pull request"}
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium", statusTone(review.header.statusLabel))}>
                {review.header.statusLabel === "Ready to merge" ? (
                  <CheckCircle2 className="size-3" />
                ) : review.header.statusLabel === "Checks failing" ? (
                  <XCircle className="size-3" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                {review.header.statusLabel}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-[#F0EFE2]">{review.header.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#F0EFE2]/50">
              <span className="inline-flex items-center gap-1">
                <MemoryStick className="size-3.5 text-[#F0EFE2]/40" />
                {review.header.repoFullName ?? "MemoryOS Review"}
              </span>
              <span className="text-[#F0EFE2]/25">•</span>
              <span className="inline-flex items-center gap-1">
                <GitBranch className="size-3.5 text-[#F0EFE2]/40" />
                {review.header.branch ?? review.header.baseBranch ?? "branch unknown"}
              </span>
              {review.header.baseBranch ? (
                <>
                  <span className="text-[#F0EFE2]/25">←</span>
                  <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[#F0EFE2]/70">
                    {review.header.baseBranch}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#F0EFE2]/65">
            <span className="rounded-full border border-white/10 px-2 py-0.5">
              {review.header.filesChanged} file{review.header.filesChanged === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
              {review.header.additions != null ? `+${review.header.additions}` : "+0"}
            </span>
            <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-rose-200">
              {review.header.deletions != null ? `-${review.header.deletions}` : "-0"}
            </span>
            {canOpenGitHub && review.header.githubUrl ? (
              <a
                href={review.header.githubUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  if (!onOpenGitHub) return;
                  event.preventDefault();
                  onOpenGitHub();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2 py-0.5 text-[#F0EFE2]/80 hover:bg-white/[0.08]"
              >
                Review in GitHub
                <ExternalLink className="size-3" />
              </a>
            ) : null}
            {canOpenPreview && review.header.previewUrl ? (
              <button
                type="button"
                onClick={onOpenPreview}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] px-2 py-0.5 text-indigo-100 hover:bg-indigo-500/[0.12]"
              >
                Open Preview
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {REVIEW_TABS.map((entry) => {
            const active = tab === entry.id;
            const count =
              entry.id === "changes"
                ? review.changes.length
                : entry.id === "bugs"
                  ? review.bugs.length
                  : entry.id === "memory"
                    ? review.memoryUsed.length
                    : entry.id === "decisions"
                      ? review.decisions.length
                      : entry.id === "learnings"
                        ? review.learnings.length
                        : entry.id === "discussion"
                          ? review.discussion.length
                          : null;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-medium transition",
                  active
                    ? "border-white/15 bg-white/[0.08] text-[#F0EFE2]"
                    : "border-transparent bg-transparent text-[#F0EFE2]/55 hover:border-white/10 hover:bg-white/[0.04] hover:text-[#F0EFE2]",
                )}
              >
                <span>{entry.label}</span>
                {typeof count === "number" ? (
                  <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] text-[#F0EFE2]/60">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]">
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          {tab === "overview" ? (
            <div className="space-y-4">
              <div className="rounded-md border border-white/10 bg-[#0b0b0b] px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-indigo-100">
                    <ShieldAlert className="size-3.5" />
                    MemoryOS Review
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#F0EFE2]/60">
                    Confidence {review.overview.confidence}%
                  </span>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", review.overview.riskLevel === "High" ? "border-rose-500/25 bg-rose-500/10 text-rose-100" : review.overview.riskLevel === "Medium" ? "border-amber-500/25 bg-amber-500/10 text-amber-100" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100")}>
                    Risk {review.overview.riskLevel}
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-7 text-[#F0EFE2]/88">{review.overview.summary}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {review.overview.bullets.slice(0, 4).map((bullet) => (
                    <div key={bullet} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] leading-6 text-[#F0EFE2]/70">
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <MetricCard label="Confidence" value={`${review.overview.confidence}%`} detail="resume score" />
                <MetricCard label="Risk" value={review.overview.riskLevel} detail={review.overview.needsHumanReview ? "human review needed" : "auto-merge likely"} />
                <MetricCard label="Files" value={String(review.header.filesChanged)} detail="changed files" />
              </div>

              {review.decisions.length > 0 ? (
                <div className="rounded-md border border-white/10 bg-[#0b0b0b] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">Key decision</p>
                  <p className="mt-2 text-sm font-medium text-[#F0EFE2]">{review.decisions[0]?.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#F0EFE2]/58">{review.decisions[0]?.reason}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "changes" ? (
            <div className="grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="rounded-md border border-white/10 bg-[#0b0b0b] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">Changed files</p>
                <div className="mt-3 space-y-1.5">
                  {review.changes.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left transition",
                        selectedGroup?.id === group.id
                          ? "border-indigo-500/25 bg-indigo-500/[0.08]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                      )}
                    >
                      <p className="truncate text-sm font-medium text-[#F0EFE2]">{group.title}</p>
                      <p className="mt-1 text-[11px] text-[#F0EFE2]/50">{group.detail ?? group.summary ?? ""}</p>
                      <p className="mt-2 font-mono text-[11px] text-[#F0EFE2]/60">
                        {group.files.length} file{group.files.length === 1 ? "" : "s"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-white/10 bg-[#0b0b0b] p-3">
                {selectedGroup ? (
                  <DiffCard group={selectedGroup} />
                ) : (
                  <div className="flex min-h-[24rem] items-center justify-center text-sm text-[#F0EFE2]/50">
                    No change group selected.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {tab === "bugs" ? (
            review.bugs.length === 0 ? (
              <EmptyTabState
                title="No review findings yet"
                description="Real bug findings will appear here once the review payload contains findings from GitHub, runtime analysis, or saved memory."
              />
            ) : (
              <div className="space-y-2">
                {review.bugs.map((bug) => (
                  <div key={bug.id} className={cn("rounded-md border px-3 py-3", severityTone(bug.severity))}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0EFE2]">{bug.title}</p>
                        <p className="mt-1 whitespace-pre-line text-[11px] leading-5 text-[#F0EFE2]/65">{bug.detail}</p>
                        {bug.suggestion ? (
                          <p className="mt-2 text-[11px] text-[#F0EFE2]/50">{bug.suggestion}</p>
                        ) : null}
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#F0EFE2]/60">
                        {bug.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "memory" ? (
            review.memoryUsed.length === 0 ? (
              <EmptyTabState
                title="No memory context attached"
                description="When the backend returns selected memories or a handoff packet, we will show exactly which memories influenced the review."
              />
            ) : (
              <div className="space-y-2">
                {review.memoryUsed.map((memory) => (
                  <div key={memory.id} className="rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0EFE2]">{memory.title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#F0EFE2]/60">{memory.summary}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-[#F0EFE2]/40">
                          Source: {memory.source} · Used for: {memory.usedFor}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#F0EFE2]/60">
                        {memory.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "decisions" ? (
            review.decisions.length === 0 ? (
              <EmptyTabState
                title="No decisions captured yet"
                description="Once the review has backend decisions or approval traces, they will appear here with a direct path to save them into Company Brain."
              />
            ) : (
              <div className="space-y-2">
                {review.decisions.map((decision) => (
                  <div key={decision.id} className="rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0EFE2]">{decision.title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#F0EFE2]/60">{decision.reason}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-[#F0EFE2]/40">
                          {decision.risk ?? "No risk noted"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onSaveLearnings}
                        className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-[#F0EFE2]/80 hover:bg-white/[0.08]"
                      >
                        Save to Company Brain
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "learnings" ? (
            review.learnings.length === 0 ? (
              <EmptyTabState
                title="No learnings saved yet"
                description="Saved learnings from approvals, decision notes, and memory extraction will show up here."
              />
            ) : (
              <div className="space-y-2">
                {review.learnings.map((learning) => (
                  <div key={learning.id} className="rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0EFE2]">{learning.title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#F0EFE2]/60">{learning.pattern}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {learning.applyTo.map((item) => (
                            <span key={item} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#F0EFE2]/55">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onSaveLearnings}
                        className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/[0.08] px-2.5 py-1 text-[11px] text-indigo-100 hover:bg-indigo-500/[0.12]"
                      >
                        <WandSparkles className="size-3.5" />
                        {learning.buttonLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "discussion" ? (
            review.discussion.length === 0 ? (
              <EmptyTabState
                title="No discussion thread loaded"
                description="Inline comments, review summaries, and runtime handoffs will appear here once the backend provides them."
              />
            ) : (
              <div className="space-y-2">
                {review.discussion.map((item) => (
                  <div key={item.id} className="rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F0EFE2]">{item.author}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-[#F0EFE2]/40">{item.title}</p>
                        <p className="mt-1 whitespace-pre-line text-[11px] leading-5 text-[#F0EFE2]/60">{item.detail}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#F0EFE2]/55">
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-white/10 bg-[#0b0b0b] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">Actions</p>
            <div className="mt-3 space-y-2">
              <ActionButton
                label="Approve"
                onClick={onApprove}
                disabled={!onApprove || !review.actions.canApprove}
                tone="emerald"
              />
              <ActionButton
                label="Request Changes"
                onClick={onRequestChanges}
                disabled={!onRequestChanges || !review.actions.canRequestChanges}
                tone="rose"
              />
              <ActionButton
                label="Save Learnings"
                onClick={onSaveLearnings}
                disabled={!onSaveLearnings || !review.actions.canSaveLearnings}
                tone="indigo"
              />
              <ActionButton
                label="Merge"
                onClick={onMerge}
                disabled={!onMerge || !review.actions.canMerge}
                tone="default"
              />
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-[#0b0b0b] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">Context</p>
            <div className="mt-3 space-y-3 text-sm">
              <ContextLine label="Status" value={review.header.statusLabel} />
              <ContextLine label="PR URL" value={review.header.githubUrl ?? "Not linked"} />
              <ContextLine label="Preview" value={review.header.previewUrl ?? "Not available"} />
              <ContextLine label="Confidence" value={`${review.overview.confidence}%`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#F0EFE2]">{value}</p>
      <p className="mt-1 text-[11px] text-[#F0EFE2]/50">{detail}</p>
    </div>
  );
}

function DiffCard({ group }: { group: PrReviewChangeGroup }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#F0EFE2]">{group.title}</p>
          <p className="mt-1 text-[11px] text-[#F0EFE2]/50">{group.detail ?? group.summary ?? ""}</p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[#F0EFE2]/55">
          {group.files.length} file{group.files.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2">
        {group.files.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            {group.files.map((file) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[#F0EFE2]/65"
              >
                <FileDiff className="size-3 text-[#F0EFE2]/35" />
                {file.path}
              </span>
            ))}
          </div>
        ) : null}
        {group.files.map((file) => (
          <div key={file.path} className="rounded-md border border-white/10 bg-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-[#F0EFE2]/55">
              <span className="inline-flex items-center gap-1.5">
                <FileDiff className="size-3.5 text-[#F0EFE2]/40" />
                {file.path}
              </span>
              <span className="font-mono">
                <span className="text-emerald-300">{file.additions != null ? `+${file.additions}` : "+0"}</span>{" "}
                <span className="text-rose-300">{file.deletions != null ? `-${file.deletions}` : "-0"}</span>
              </span>
            </div>
            <pre className="max-h-[28rem] overflow-auto px-3 py-3 font-mono text-[11px] leading-6 text-[#F0EFE2]/75">
              {(file.content && file.content.trim()) ||
                file.detail ||
                "No diff content available from runtime events yet."}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  tone: "emerald" | "rose" | "indigo" | "default";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
      : tone === "rose"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
        : tone === "indigo"
          ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-100"
          : "border-white/15 bg-white/[0.05] text-[#F0EFE2]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        toneClass,
      )}
    >
      {label}
    </button>
  );
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-[#F0EFE2]/45">{label}</p>
      <p className="max-w-[14rem] truncate text-right text-[#F0EFE2]/75">{value}</p>
    </div>
  );
}
