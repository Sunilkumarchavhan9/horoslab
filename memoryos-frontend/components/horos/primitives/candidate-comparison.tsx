"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
import { CandidateProfile } from "@/lib/horos-types";
import { HorosBadge } from "../ui/horos-badge";
import { cn } from "@/lib/utils";

interface CandidateComparisonProps {
  candidates: CandidateProfile[];
  onSelectCandidate?: (candidate: CandidateProfile) => void;
  className?: string;
}

export function CandidateComparison({
  candidates,
  onSelectCandidate,
  className,
}: CandidateComparisonProps) {
  if (candidates.length === 0) return null;

  return (
    <div className={cn("overflow-hidden border border-[#d8ddd3] bg-white", className)}>
      <div className="flex items-center justify-between border-b border-[#e1e4df] bg-[#fafbfa] px-4 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#75806f]">
          Candidate Evaluation Surface
        </span>
        <span className="font-mono text-xs text-[#788274]">
          {candidates.length} configurations profiled
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs font-mono">
          <thead className="border-b border-[#edf0eb] bg-white text-[11px] text-[#788274]">
            <tr>
              <th className="px-4 py-3 font-sans font-medium text-[#171a17]">Metric / Dimension</th>
              {candidates.map((cand) => (
                <th
                  key={cand.id}
                  className={cn(
                    "px-4 py-3 font-sans font-semibold text-center min-w-[160px]",
                    cand.isRecommended ? "bg-[#f5fbe9] text-[#2d5800]" : "text-[#171a17]"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{cand.name}</span>
                    {cand.isRecommended ? (
                      <HorosBadge variant="highlight" size="sm">
                        <Sparkles size={10} /> RECOMMENDED
                      </HorosBadge>
                    ) : cand.isBaseline ? (
                      <HorosBadge variant="outline" size="sm">
                        BASELINE
                      </HorosBadge>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0eb]">
            {/* Format & Engine */}
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-[#5c6457]">Runtime & Quant</td>
              {candidates.map((cand) => (
                <td key={cand.id} className={cn("px-4 py-2.5 text-center", cand.isRecommended && "bg-[#f5fbe9]/50 font-bold")}>
                  {cand.engine} ({cand.format})
                </td>
              ))}
            </tr>

            {/* Latency */}
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-[#5c6457]">p95 Latency</td>
              {candidates.map((cand) => (
                <td
                  key={cand.id}
                  className={cn(
                    "px-4 py-2.5 text-center",
                    cand.isRecommended ? "bg-[#f5fbe9]/50 font-bold text-[#3c7000]" : "text-[#1f241d]"
                  )}
                >
                  {cand.metrics.p95LatencyMs} ms
                </td>
              ))}
            </tr>

            {/* Cost */}
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-[#5c6457]">Cost / 1k Tokens</td>
              {candidates.map((cand) => (
                <td
                  key={cand.id}
                  className={cn(
                    "px-4 py-2.5 text-center",
                    cand.isRecommended ? "bg-[#f5fbe9]/50 font-bold text-[#3c7000]" : "text-[#1f241d]"
                  )}
                >
                  ${cand.metrics.costPer1kTokens.toFixed(5)}
                </td>
              ))}
            </tr>

            {/* Quality Score */}
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-[#5c6457]">Quality Retention</td>
              {candidates.map((cand) => (
                <td
                  key={cand.id}
                  className={cn(
                    "px-4 py-2.5 text-center",
                    cand.isRecommended ? "bg-[#f5fbe9]/50 font-bold text-[#2563eb]" : "text-[#1f241d]"
                  )}
                >
                  {cand.metrics.qualityScore.toFixed(1)}%
                </td>
              ))}
            </tr>

            {/* VRAM Footprint */}
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-[#5c6457]">VRAM Required</td>
              {candidates.map((cand) => (
                <td
                  key={cand.id}
                  className={cn(
                    "px-4 py-2.5 text-center",
                    cand.isRecommended ? "bg-[#f5fbe9]/50 font-bold text-[#151515]" : "text-[#1f241d]"
                  )}
                >
                  {cand.metrics.vramGb} GB
                </td>
              ))}
            </tr>

            {/* Throughput */}
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-[#5c6457]">Throughput (TPS)</td>
              {candidates.map((cand) => (
                <td
                  key={cand.id}
                  className={cn(
                    "px-4 py-2.5 text-center",
                    cand.isRecommended ? "bg-[#f5fbe9]/50 font-bold text-[#3c7000]" : "text-[#1f241d]"
                  )}
                >
                  {cand.metrics.throughputTokensSec} tok/s
                </td>
              ))}
            </tr>

            {/* Hardware Profile */}
            <tr>
              <td className="px-4 py-2.5 font-sans font-medium text-[#5c6457]">Target GPU</td>
              {candidates.map((cand) => (
                <td
                  key={cand.id}
                  className={cn(
                    "px-4 py-2.5 text-center text-[11px] text-[#656d60]",
                    cand.isRecommended && "bg-[#f5fbe9]/50 font-medium"
                  )}
                >
                  {cand.hardware}
                </td>
              ))}
            </tr>

            {/* Selection Action */}
            {onSelectCandidate ? (
              <tr>
                <td className="px-4 py-3 font-sans font-medium text-[#5c6457]">Action</td>
                {candidates.map((cand) => (
                  <td
                    key={cand.id}
                    className={cn(
                      "px-4 py-3 text-center",
                      cand.isRecommended && "bg-[#f5fbe9]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectCandidate(cand)}
                      className={cn(
                        "w-full border px-2.5 py-1 text-xs font-sans font-medium transition-colors",
                        cand.isRecommended
                          ? "border-[#65a30d] bg-[#75bf00] text-[#111] hover:bg-[#85d400]"
                          : "border-[#c9cec4] bg-white text-[#2a3028] hover:bg-[#f6f7f5]"
                      )}
                    >
                      Select configuration
                    </button>
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
