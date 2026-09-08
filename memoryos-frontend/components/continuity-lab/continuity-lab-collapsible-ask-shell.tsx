"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  useAskBarCollapsed,
  type AskBarCollapseScope,
} from "@/lib/continuity-lab/ask-bar-collapse-storage";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type ContinuityLabCollapsibleAskShellProps = {
  children: ReactNode;
  scope?: AskBarCollapseScope;
  layout?: "floating" | "inline";
  expandLabel?: string;
  header?: ReactNode;
  className?: string;
  footer?: ReactNode;
};

function MemoryOSStarMark() {
  return (
    <svg
      className="size-5 shrink-0 text-zinc-100"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M10 1 L12.25 6.1 L17.79 5.5 L14.5 10 L17.79 14.5 L12.25 13.9 L10 19 L7.75 13.9 L2.21 14.5 L5.5 10 L2.21 5.5 L7.75 6.1 Z" />
    </svg>
  );
}

function AskFab({ expandLabel, onExpand }: { expandLabel: string; onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full px-4 py-2.5",
        "border border-white/[0.06] bg-[#1a1a1a]/95 text-[#F0EFE2] backdrop-blur-sm",
        "transition duration-200",
        "hover:bg-[#222]/95",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]",
      )}
      aria-label={expandLabel}
      title={expandLabel}
    >
      <MemoryOSStarMark />
      <span className="text-sm font-medium tracking-tight">Ask MemoryOS</span>
    </button>
  );
}

function CollapseButton({ onCollapse }: { onCollapse: () => void }) {
  return (
    <button
      type="button"
      onClick={onCollapse}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[#F0EFE2]/50 hover:bg-[#1A1A1A] hover:text-[#F0EFE2]"
      aria-label="Minimize ask"
      title="Minimize ask"
    >
      <ChevronDown className="size-4" />
    </button>
  );
}

export function ContinuityLabCollapsibleAskShell({
  children,
  scope = "global",
  layout = "floating",
  expandLabel = "Open ask",
  header,
  className,
  footer,
}: ContinuityLabCollapsibleAskShellProps) {
  const { collapsed, setCollapsed, hydrated } = useAskBarCollapsed(scope);

  if (!hydrated) {
    if (layout === "floating") {
      return (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4 pt-8",
            className,
          )}
        >
          <div className="pointer-events-auto w-full max-w-3xl opacity-0" aria-hidden>
            {children}
          </div>
        </div>
      );
    }
    return <div className={className}>{children}</div>;
  }

  if (collapsed) {
    return (
      <>
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-5 sm:px-6",
            className,
          )}
        >
          <div className="pointer-events-auto">
            <AskFab expandLabel={expandLabel} onExpand={() => setCollapsed(false)} />
          </div>
        </div>
        {footer}
      </>
    );   
  }

  if (layout === "floating") {
    return (
      <>
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4 pt-8",
            className,
          )}
        >
          <div
            className={cn(
              subtlePanel(),
              "pointer-events-auto w-full max-w-3xl border-white/[0.06] bg-[#1a1a1a]/95 p-3 backdrop-blur-sm",
              "transition-all duration-200 ease-out",
            )}
            style={{
              backgroundImage:
                "linear-gradient(to top, rgba(10,10,10,0.98) 60%, rgba(10,10,10,0.85))",
            }}
          >
            {header ? (
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">{header}</div>
                <CollapseButton onCollapse={() => setCollapsed(true)} />
              </div>
            ) : (
              <div className="mb-2 flex justify-end">
                <CollapseButton onCollapse={() => setCollapsed(true)} />
              </div>
            )}
            {children}
          </div>
        </div>
        {footer}
      </>
    );
  }

  return (
    <>
      <div className={cn("relative w-full", className)}>
        <div className="mb-1 flex justify-end">
          <CollapseButton onCollapse={() => setCollapsed(true)} />
        </div>
        {children}
      </div>
      {footer}
    </>
  );
}
