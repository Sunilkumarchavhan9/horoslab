"use client";

import React from "react";
import { Sparkles, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { EpochRecommendation } from "@/lib/epoch-types";
import { EpochButton } from "../ui/epoch-button";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: EpochRecommendation;
  onReviewEvidence?: () => void;
  onApplyAction?: () => void;
  className?: string;
}

export function RecommendationCard({
  recommendation,
  onReviewEvidence,
  onApplyAction,
  className,
}: RecommendationCardProps) {
  const { expectedGains, confidencePct, evidencePoints } = recommendation;

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-[#b9de78] bg-[#fbfdf9] p-5 shadow-[0_4px_16px_rgba(117,191,0,0.06)]",
        className
      )}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[#cbe4a0] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#75bf00] text-[#111]">
            <Sparkles size={12} strokeWidth={2.5} />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#2d5800]">
            EPOCH RECOMMENDATION
          </span>
        </div>

        <div className="flex items-center gap-1.5 border border-[#b9de78] bg-white px-2 py-0.5 font-mono text-xs">
          <ShieldCheck size={13} className="text-[#65a30d]" />
          <span className="text-[#555]">Confidence:</span>
          <span className="font-bold text-[#1f4000]">{confidencePct}%</span>
        </div>
      </div>

      {/* Main Title & Summary */}
      <div className="mt-3">
        <h4 className="text-sm font-semibold text-[#171a17] md:text-base leading-snug">
          {recommendation.title}
        </h4>
        <p className="mt-1 text-xs text-[#525a4d] leading-relaxed">
          {recommendation.summary}
        </p>
      </div>

      {/* Expected Gains Matrix */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="border border-[#d8ddd3] bg-white p-2.5">
          <span className="block text-[10px] uppercase tracking-[0.1em] text-[#788274]">
            Latency
          </span>
          <span className="mt-1 block font-mono text-sm font-bold text-[#3c7000]">
            -{expectedGains.latencyReductionPct}%
          </span>
        </div>

        <div className="border border-[#d8ddd3] bg-white p-2.5">
          <span className="block text-[10px] uppercase tracking-[0.1em] text-[#788274]">
            Cost / Req
          </span>
          <span className="mt-1 block font-mono text-sm font-bold text-[#3c7000]">
            -{expectedGains.costReductionPct}%
          </span>
        </div>

        <div className="border border-[#d8ddd3] bg-white p-2.5">
          <span className="block text-[10px] uppercase tracking-[0.1em] text-[#788274]">
            Quality Delta
          </span>
          <span className="mt-1 block font-mono text-sm font-bold text-[#2563eb]">
            {expectedGains.qualityDeltaPct > 0 ? `+${expectedGains.qualityDeltaPct}%` : `${expectedGains.qualityDeltaPct}%`}
          </span>
        </div>

        <div className="border border-[#d8ddd3] bg-white p-2.5">
          <span className="block text-[10px] uppercase tracking-[0.1em] text-[#788274]">
            Throughput
          </span>
          <span className="mt-1 block font-mono text-sm font-bold text-[#3c7000]">
            +{expectedGains.throughputGainPct ?? 45}%
          </span>
        </div>
      </div>

      {/* Proof / Evidence Bullet Points */}
      <div className="mt-3 space-y-1 border-t border-dashed border-[#cbe4a0] pt-3 text-xs text-[#4c5447]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#788274]">
          Verified Proof Points:
        </span>
        {evidencePoints.map((point, idx) => (
          <div key={idx} className="flex items-start gap-1.5 pt-0.5">
            <CheckCircle2 size={12} className="text-[#65a30d] flex-shrink-0 mt-0.5" />
            <span className="text-[11px] leading-tight">{point}</span>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8ddd3] pt-3">
        <button
          type="button"
          onClick={onReviewEvidence}
          className="text-xs font-medium text-[#40483c] underline underline-offset-4 hover:text-[#171a17]"
        >
          [ Review assurance evidence ]
        </button>

        <EpochButton variant="action" size="sm" onClick={onApplyAction}>
          <span>{recommendation.suggestedActionLabel || "Apply recommendation"}</span>
          <ArrowRight size={13} />
        </EpochButton>
      </div>
    </div>
  );
}
