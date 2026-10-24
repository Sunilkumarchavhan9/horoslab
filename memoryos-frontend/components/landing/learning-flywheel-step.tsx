"use client";

import React from "react";
import { Sparkles, ArrowRight, BookOpen, Brain, RefreshCw } from "lucide-react";

export function LearningFlywheelStep() {
  const lessons = [
    { num: "01", title: "MoE Burst Routing", desc: "Prefer AWQ-Marlin on L40S for 79% latency drop", status: "promoted" },
    { num: "02", title: "FP8 KV Page Allocation", desc: "Eliminates memory fragmentation during peak", status: "shadow" },
    { num: "03", title: "State Perception v4", desc: "Understanding accuracy improved 64% → 88%", status: "promoted" },
    { num: "04", title: "Anomaly Detection Rule", desc: "Detection accuracy compounded 51% → 79%", status: "evaluate" },
    { num: "05", title: "Autonomous Policy Tuning", desc: "14 matching production workloads updated", status: "promoted" },
    { num: "06", title: "Background Drift Check", desc: "Zero regression across golden eval suite", status: "shadow" },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#333333] p-6 lg:p-8 bg-[#151515] rounded-[1px] font-mono select-none">
      {/* Header */}
      <div className="flex items-start justify-between p-5 lg:p-6 border-b border-dashed border-[#333333]">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 border border-[#444] rounded-[1px] p-1.5 bg-[#1a1a1a]">
            <Sparkles size={16} className="text-[#C8C7BA]" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[#F0EFE2] font-medium text-[14px]">Teaching Fabric & Intelligence Evolution</div>
            <div className="flex items-center gap-2 text-[#666666] font-mono text-[10px]">
              <span>EXPERIENCE ENGINE</span>
              <ArrowRight size={10} />
              <span>LESSON ENGINE</span>
              <ArrowRight size={10} />
              <span className="text-[#C8C7BA]">SYNTHETIC DATA FACTORY</span>
            </div>
          </div>
        </div>
        <div className="border border-[#333] bg-[#1a1a1a] text-[#75bf00] font-mono text-[10px] px-2 py-0.5 rounded-[1px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse" />
          compounding
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 border-b border-dashed border-[#333333] divide-x divide-dashed divide-[#333333]">
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">STATE UNDERSTANDING</div>
          <div className="text-[#F0EFE2] font-medium text-[13px]">64% → 88% (+24%)</div>
        </div>
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">ANOMALY ACCURACY</div>
          <div className="text-[#F0EFE2] font-medium text-[13px]">51% → 79% (+28%)</div>
        </div>
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">COST EFFICIENCY</div>
          <div className="text-[#75bf00] font-medium text-[13px]">$0.12/1M (-71%)</div>
        </div>
      </div>

      {/* Extracted Lessons Grid */}
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[#C8C7BA] font-mono text-[10px] uppercase tracking-wider">SYNTHETIC DATA FACTORY / LESSONS</div>
          <div className="text-[#666666] font-mono text-[10px] flex gap-3">
            <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#444] rounded-full" /> Software</span>
            <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#444] rounded-full" /> Cloud</span>
            <span className="flex items-center gap-1"><span className="w-1 h-1 bg-[#444] rounded-full" /> Physical</span>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <div className="text-[9px] font-mono border border-[#333] text-[#777] px-1.5 py-0.5 rounded-[1px]">VERIFIED EXPERIENCE</div>
          <div className="text-[9px] font-mono border border-[#333] text-[#777] px-1.5 py-0.5 rounded-[1px]">ACTIVE LEARNING</div>
          <div className="text-[9px] font-mono border border-[#333] text-[#777] px-1.5 py-0.5 rounded-[1px]">SYNTHETIC DATA</div>
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          {lessons.map((l) => (
            <LessonItem key={l.num} num={l.num} title={l.title} desc={l.desc} status={l.status} />
          ))}
        </div>
      </div>

      {/* Footer Bar */}
      <div className="border-t border-dashed border-[#333333] p-4 lg:px-6 lg:py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="text-[#666666] font-mono text-[10px] flex items-center gap-2 shrink-0">
          <span className="w-[3px] h-[3px] bg-[#75bf00]" />
          <span className="whitespace-nowrap">Drift Monitor: <strong className="text-[#F0EFE2]">0 material drift events</strong></span>
        </div>
        <div className="text-[#555555] font-mono text-[8px] sm:text-[9px] uppercase tracking-wider flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span>EVALUATE</span>
          <ArrowRight size={10} className="text-[#444]" />
          <span>SHADOW</span>
          <ArrowRight size={10} className="text-[#444]" />
          <span>CANARY</span>
          <ArrowRight size={10} className="text-[#444]" />
          <span className="text-[#75bf00]">PROMOTE</span>
          <ArrowRight size={10} className="text-[#444]" />
          <span className="text-[#F0EFE2] bg-[#333] px-1.5 py-0.5 rounded-sm">CONTINUOUS AGENT</span>
          <span className="hidden sm:inline"> (DISCOVER/DIAGNOSE/OPTIMIZE)</span>
        </div>
      </div>
    </div>
  );
}

function LessonItem({ num, title, desc, status }: { num: string; title: string; desc: string; status: string }) {
  return (
    <div className="flex items-start gap-3.5 pb-2.5 border-b border-dashed border-[#222222] last:border-0 last:pb-0">
      <div className="text-[#F0EFE2] font-mono text-[11px] font-bold mt-0.5 shrink-0">{num}</div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-[#dddddd] font-medium text-[12px] leading-tight truncate">{title}</span>
          <span className="shrink-0 flex items-center gap-1.5 border border-[#333] bg-[#1a1a1a] px-1.5 py-0.5 rounded-[1px]">
            <span className={`w-1 h-1 rounded-full ${status === 'promoted' ? 'bg-[#75bf00]' : status === 'shadow' ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]'}`} />
            <span className={`font-mono text-[8px] uppercase tracking-wider ${status === 'promoted' ? 'text-[#75bf00]' : status === 'shadow' ? 'text-[#f59e0b]' : 'text-[#3b82f6]'}`}>
              {status}
            </span>
          </span>
        </div>
        <div className="text-[#666666] text-[11px] leading-tight font-sans truncate">
          {desc}
        </div>
      </div>
    </div>
  );
}

