"use client";

import React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { ThinkingStep } from "@/lib/horos-types";
import { cn } from "@/lib/utils";

interface ThinkingPanelProps {
  steps: ThinkingStep[];
  title?: string;
  className?: string;
}

export function ThinkingPanel({
  steps,
  title = "HOROS Observable Reasoning & Activity",
  className,
}: ThinkingPanelProps) {
  return (
    <div className={cn("border border-[#d8ddd3] bg-white p-4 font-mono text-xs", className)}>
      <div className="flex items-center justify-between border-b border-dashed border-[#d8ddd3] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2563eb] animate-pulse" />
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-[#171a17]">
            {title}
          </span>
        </div>
        <span className="text-[11px] text-[#788274]">
          {steps.filter((s) => s.status === "completed").length}/{steps.length} checks resolved
        </span>
      </div>

      <div className="mt-3 space-y-1 text-[#2d332a]">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const branchPrefix = idx === 0 ? "● " : isLast ? "└─ " : "├─ ";

          return (
            <div key={step.id} className="group flex flex-col py-0.5">
              <div className="flex items-start gap-2">
                <span className="text-[#889083] select-none font-mono">
                  {branchPrefix}
                </span>

                <div className="flex flex-1 items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {step.status === "completed" ? (
                      <span className="text-[#75bf00] font-bold">✓</span>
                    ) : step.status === "in-progress" ? (
                      <Loader2 size={11} className="animate-spin text-[#2563eb]" />
                    ) : step.status === "failed" ? (
                      <AlertCircle size={11} className="text-[#dc2626]" />
                    ) : (
                      <span className="text-[#969e92]">○</span>
                    )}

                    <span
                      className={cn(
                        step.status === "in-progress"
                          ? "text-[#151515] font-semibold bg-[#eff6ff] px-1"
                          : step.status === "completed"
                          ? "text-[#40483c]"
                          : step.status === "failed"
                          ? "text-[#dc2626]"
                          : "text-[#889083]"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>

                  {step.durationMs ? (
                    <span className="text-[10px] text-[#8e968b]">
                      {(step.durationMs / 1000).toFixed(1)}s
                    </span>
                  ) : null}
                </div>
              </div>

              {step.detail ? (
                <div className="ml-6 mt-0.5 pl-2 border-l border-dashed border-[#d8ddd3] text-[11px] text-[#6b7367] font-sans">
                  {step.detail}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
