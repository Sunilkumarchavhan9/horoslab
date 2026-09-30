"use client";

import React from "react";
import { Check, AlertCircle } from "lucide-react";
import { ProgramPhase } from "@/lib/dhyra-types";
import { cn } from "@/lib/utils";

interface ProgramPhaseRailProps {
  currentPhase: ProgramPhase;
  status?: string;
  onPhaseClick?: (phase: ProgramPhase) => void;
  className?: string;
}

const PHASES: Array<{ id: ProgramPhase; label: string; description: string }> = [
  { id: "discovery", label: "DISCOVER", description: "Hardware & quant profiling" },
  { id: "benchmark", label: "BENCHMARK", description: "TTFT & p95 latency sweeps" },
  { id: "optimize", label: "OPTIMIZE", description: "Kernel & KV cache tuning" },
  { id: "verify", label: "VERIFY", description: "Assurance case & SLA check" },
  { id: "deploy", label: "DEPLOY", description: "Production promotion" },
];

export function ProgramPhaseRail({
  currentPhase,
  status = "running",
  onPhaseClick,
  className,
}: ProgramPhaseRailProps) {
  const currentIdx = PHASES.findIndex((p) => p.id === currentPhase);
  const isFailed = status === "failed";

  return (
    <div className={cn("w-full border border-[#d8ddd3] bg-white px-5 py-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#788274]">
          Operational Execution Rail
        </span>
        <span className="font-mono text-xs text-[#687063]">
          Phase {currentIdx + 1} of 5: <span className="font-semibold text-[#171a17] uppercase">{currentPhase}</span>
        </span>
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        {PHASES.map((phase, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <React.Fragment key={phase.id}>
              {/* Connecting line */}
              {idx > 0 && (
                <div className="relative h-[2px] flex-1 mx-2 bg-[#e4e7e1] overflow-hidden">
                  {isCompleted ? (
                    <div className="h-full w-full bg-[#75bf00]" />
                  ) : isActive ? (
                    <div className="relative h-full w-full bg-[#d8ddd3]">
                      <div className="absolute inset-0 h-full w-1/2 bg-gradient-to-r from-transparent via-[#2563eb] to-[#75bf00] animate-[shimmer_2s_infinite]" />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Phase Node */}
              <button
                type="button"
                onClick={() => onPhaseClick?.(phase.id)}
                className="group relative flex flex-col items-center focus:outline-none"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center border font-mono text-xs transition-all",
                    isCompleted && "border-[#75bf00] bg-[#75bf00] text-[#111] font-semibold",
                    isActive && !isFailed && "border-[#2563eb] bg-white text-[#2563eb] ring-4 ring-[#2563eb]/10 font-bold",
                    isActive && isFailed && "border-[#dc2626] bg-[#fef2f2] text-[#dc2626]",
                    isPending && "border-[#d8ddd3] bg-[#fafbfa] text-[#8e968b]"
                  )}
                >
                  {isCompleted ? (
                    <Check size={13} strokeWidth={3} />
                  ) : isActive && isFailed ? (
                    <AlertCircle size={13} />
                  ) : (
                    <span>0{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      "block text-[11px] font-medium tracking-[0.08em]",
                      isActive ? "text-[#151515] font-bold" : isCompleted ? "text-[#3c7000]" : "text-[#788274]"
                    )}
                  >
                    {phase.label}
                  </span>
                  <span className="hidden text-[10px] text-[#8e968b] sm:block">
                    {phase.description}
                  </span>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
