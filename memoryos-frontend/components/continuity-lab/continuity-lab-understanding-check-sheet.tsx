"use client";

import { useMemo } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import {
  summarizePromptForUnderstanding,
  type PromptUnderstandingSummary,
} from "@/lib/continuity-lab/prompt-understanding-stub";
import { cn } from "@/lib/utils";

type ContinuityLabUnderstandingCheckSheetProps = {
  open: boolean;
  prompt: string;
  loading?: boolean;
  onConfirm: (summary: PromptUnderstandingSummary) => void;
  onEdit: () => void;
  onClose?: () => void;
};

export function ContinuityLabUnderstandingCheckSheet({
  open,
  prompt,
  loading = false,
  onConfirm,
  onEdit,
  onClose,
}: ContinuityLabUnderstandingCheckSheetProps) {
  const summary = useMemo(() => summarizePromptForUnderstanding(prompt), [prompt]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="understanding-check-title"
    >
      <div className="w-full max-w-lg border border-[#4338CA]/40 bg-[#0A0A0A] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#2F2F2F] px-5 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-indigo-300" />
            <div>
              <h2 id="understanding-check-title" className="text-sm font-semibold text-[#F0EFE2]">
                Understanding check
              </h2>
              <p className="mt-1 text-xs text-[#F0EFE2]/50">
                {/* Stub: bullets from your prompt — not an LLM rewrite yet */}
                Review what MemoryOS will work on before tools run.
              </p>
            </div>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="text-[#F0EFE2]/40 hover:text-[#F0EFE2]/70"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="max-h-[min(50vh,320px)] overflow-y-auto px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-200/80">Goal</p>
          <p className="mt-1 text-sm leading-relaxed text-[#F0EFE2]/90">{summary.headline}</p>
          <ul className="mt-4 space-y-2">
            {summary.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-2 text-sm leading-relaxed text-[#F0EFE2]/75 before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-[#6366F1] before:content-['']"
              >
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#2F2F2F] px-5 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onEdit}
            className="inline-flex h-9 items-center border border-[#3A3A3A] px-4 text-xs font-medium text-[#F0EFE2]/80 hover:bg-[#141414] disabled:opacity-40"
          >
            Edit prompt
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(summary)}
            className={cn(
              "inline-flex h-9 items-center gap-2 border border-[#6366F1] bg-[#4338CA] px-4 text-xs font-semibold text-[#F0EFE2] hover:bg-[#4f46e5] disabled:opacity-40",
            )}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Looks right — continue
          </button>
        </div>
      </div>
    </div>
  );
}
