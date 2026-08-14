"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ContinuityLabWaitingConfirmationBarProps = {
  className?: string;
  onReview?: () => void;
};

export function ContinuityLabWaitingConfirmationBar({
  className,
  onReview,
}: ContinuityLabWaitingConfirmationBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/35 bg-amber-500/10 px-4 py-2 text-xs text-amber-100/95",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="size-3.5 shrink-0 text-amber-300" />
        <span>Waiting for your confirmation — approve the understanding check to send.</span>
      </div>
      {onReview ? (
        <button
          type="button"
          onClick={onReview}
          className="font-semibold text-amber-50 underline hover:text-white"
        >
          Review
        </button>
      ) : null}
    </div>
  );
}
