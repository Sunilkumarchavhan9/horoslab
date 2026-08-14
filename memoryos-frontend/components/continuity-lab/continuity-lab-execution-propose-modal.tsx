"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  proposeLabExecution,
  type LabExecutionActionKind,
  type ProposeLabExecutionInput,
} from "@/lib/continuity-lab/execution-governance";
import { cn } from "@/lib/utils";

export type ExecutionProposeModalPrefill = {
  goal?: string;
  commentBody?: string;
  actionKind?: LabExecutionActionKind;
};

type ContinuityLabExecutionProposeModalProps = {
  open: boolean;
  onClose: () => void;
  githubConnected: boolean;
  repoFullName: string | null;
  projectId: string;
  sessionId?: string;
  prefill?: ExecutionProposeModalPrefill;
  onProposed?: () => void;
};

export function ContinuityLabExecutionProposeModal({
  open,
  onClose,
  githubConnected,
  repoFullName,
  projectId,
  sessionId,
  prefill,
  onProposed,
}: ContinuityLabExecutionProposeModalProps) {
  const [actionKind, setActionKind] = useState<LabExecutionActionKind>("noop");
  const [goal, setGoal] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [riskTier, setRiskTier] = useState<"low" | "medium" | "high">("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseGithubComment = githubConnected && Boolean(repoFullName?.trim());

  useEffect(() => {
    if (!open) return;
    setError(null);
    setGoal(prefill?.goal ?? "");
    setCommentBody(prefill?.commentBody ?? "");
    setActionKind(
      prefill?.actionKind ?? (canUseGithubComment ? "issue_comment" : "noop"),
    );
    setIssueNumber("");
    setRiskTier("medium");
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prefill, canUseGithubComment, onClose]);

  const actionOptions = useMemo(() => {
    const options: Array<{ id: LabExecutionActionKind; label: string; hint: string }> = [
      {
        id: "noop",
        label: "No-op (dev)",
        hint: "Creates a governed proposal without an external GitHub write.",
      },
    ];
    if (canUseGithubComment) {
      options.unshift({
        id: "issue_comment",
        label: "Comment on PR / issue",
        hint: "Posts a governed comment on a GitHub pull request or issue.",
      });
    }
    return options;
  }, [canUseGithubComment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const input: ProposeLabExecutionInput = {
        actionKind,
        goal,
        riskTier,
        projectId,
        sessionId,
        repoFullName,
        commentBody: commentBody || goal,
        issueNumber: issueNumber.trim() ? Number(issueNumber) : undefined,
      };
      await proposeLabExecution(input);
      onProposed?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not propose action.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close propose action"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="propose-execution-title"
        className="relative z-10 w-full max-w-md border border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#2F2F2F] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6366F1]">
              Governed execution
            </p>
            <h2 id="propose-execution-title" className="mt-1 text-lg font-semibold text-white">
              Propose action
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center border border-[#3A3A3A] text-white/70 hover:bg-[#141414]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
          <fieldset className="space-y-2">
            <legend className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
              Action type
            </legend>
            {actionOptions.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex cursor-pointer gap-3 border px-3 py-2.5",
                  actionKind === opt.id
                    ? "border-[#6366F1] bg-[#4338CA]/15"
                    : "border-[#2F2F2F] bg-[#111111] hover:border-[#3A3A3A]",
                )}
              >
                <input
                  type="radio"
                  name="actionKind"
                  value={opt.id}
                  checked={actionKind === opt.id}
                  onChange={() => setActionKind(opt.id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-white">{opt.label}</span>
                  <span className="mt-0.5 block text-[11px] text-white/45">{opt.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="mt-4 block">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
              Goal
            </span>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              required
              placeholder="What outcome should this governed action achieve?"
              className="mt-1.5 w-full resize-none border border-[#3A3A3A] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#6366F1] focus:outline-none"
            />
          </label>

          {actionKind === "issue_comment" ? (
            <>
              <label className="mt-3 block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  PR / issue number
                </span>
                <input
                  type="number"
                  min={1}
                  value={issueNumber}
                  onChange={(e) => setIssueNumber(e.target.value)}
                  required={actionKind === "issue_comment"}
                  placeholder="e.g. 42"
                  className="mt-1.5 w-full border border-[#3A3A3A] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#6366F1] focus:outline-none"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                  Comment body
                </span>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={3}
                  placeholder="Defaults to goal text if empty"
                  className="mt-1.5 w-full resize-none border border-[#3A3A3A] bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#6366F1] focus:outline-none"
                />
              </label>
              {repoFullName ? (
                <p className="mt-2 text-[11px] text-white/40">Repository: {repoFullName}</p>
              ) : null}
            </>
          ) : null}

          <label className="mt-4 block">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
              Risk tier
            </span>
            <select
              value={riskTier}
              onChange={(e) => setRiskTier(e.target.value as "low" | "medium" | "high")}
              className="mt-1.5 w-full border border-[#3A3A3A] bg-[#111111] px-3 py-2 text-sm text-white focus:border-[#6366F1] focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting || !goal.trim()}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 bg-[#4338CA] px-4 text-sm font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-40 sm:flex-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Proposing…
                </>
              ) : (
                "Create proposal"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center border border-[#3A3A3A] px-4 text-sm text-white/70 hover:bg-[#141414]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
