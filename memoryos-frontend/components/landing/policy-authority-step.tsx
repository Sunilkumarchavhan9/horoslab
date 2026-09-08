"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export function PolicyAuthorityStep() {
  const gates = [
    { num: "01", title: "Gate A · Objective Ambiguity", desc: "Explicit intent: Confidence score 0.96", status: "passed" },
    { num: "02", title: "Gate B · Data Residency", desc: "EU-West-1 region enforcement validated", status: "passed" },
    { num: "03", title: "Gate C · Spend Authority", desc: "Projected $340/mo within $500/mo hard cap", status: "passed" },
    { num: "04", title: "Gate D · Blast Radius", desc: "Isolated to staging-cluster-02 namespace", status: "isolated" },
    { num: "05", title: "Gate E · Destruction & Reversal", desc: "Non-destructive plan with rollback snapshot", status: "verified" },
    { num: "06", title: "Gate F · Reality Freshness", desc: "Zero conflicting world state facts found", status: "clean" },
  ];

  return (
    <div className="w-full h-[580px] flex flex-col justify-between border border-dashed border-[#333333] p-6 lg:p-8 bg-[#151515] rounded-[1px] font-mono select-none">
      {/* Header */}
      <div className="flex items-start justify-between p-5 lg:p-6 border-b border-dashed border-[#333333]">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 border border-[#444] rounded-[1px] p-1.5 bg-[#1a1a1a]">
            <ShieldCheck size={16} className="text-[#C8C7BA]" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[#F0EFE2] font-medium text-[14px]">Policy & Safety Authority</div>
            <div className="text-[#666666] font-mono text-[11px]">Autonomous governance, blast radius checks, and spend boundary enforcement</div>
          </div>
        </div>
        <div className="border border-[#333] bg-[#1a1a1a] text-[#75bf00] font-mono text-[10px] px-2 py-0.5 rounded-[1px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse" />
          passed
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 border-b border-dashed border-[#333333] divide-x divide-dashed divide-[#333333]">
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">AUTONOMY LEVEL</div>
          <div className="text-[#75bf00] font-medium text-[13px]">L3 Bounded Prod</div>
        </div>
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">SPEND AUTHORITY</div>
          <div className="text-[#F0EFE2] font-medium text-[13px]">$340 / $500 cap</div>
        </div>
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">SAFETY GATES</div>
          <div className="text-[#F0EFE2] font-medium text-[13px]">6 / 6 Validated</div>
        </div>
      </div>

      {/* Safety Gates Grid */}
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[#C8C7BA] font-mono text-[10px] uppercase tracking-wider">SAFETY GATES (A–F)</div>
          <div className="text-[#666666] font-mono text-[10px]">6 autonomous checks validated</div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-4">
            {gates.slice(0, 3).map((g) => (
              <GateItem key={g.num} num={g.num} title={g.title} desc={g.desc} status={g.status} />
            ))}
          </div>
          <div className="space-y-4">
            {gates.slice(3, 6).map((g) => (
              <GateItem key={g.num} num={g.num} title={g.title} desc={g.desc} status={g.status} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="border-t border-dashed border-[#333333] p-4 lg:px-6 lg:py-4 flex items-center justify-between">
        <div className="text-[#666666] font-mono text-[10px] flex items-center gap-2">
          <span className="w-[3px] h-[3px] bg-[#75bf00]" />
          <span>Rollback Snapshot: <strong className="text-[#F0EFE2]">WorldState:v3.1.8-clean</strong></span>
        </div>
        <div className="text-[#555555] font-mono text-[10px] uppercase tracking-wider">
          Pre-authorized execution
        </div>
      </div>
    </div>
  );
}

function GateItem({ num, title, desc, status }: { num: string; title: string; desc: string; status: string }) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-dashed border-[#222222] last:border-0 last:pb-0">
      <div className="text-[#F0EFE2] font-mono text-[12px] font-bold mt-0.5">{num}</div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-[#dddddd] font-medium text-[12px] leading-tight truncate">{title}</span>
          <span className="shrink-0 flex items-center gap-1.5 border border-[#333] bg-[#1a1a1a] px-1.5 py-0.5 rounded-[1px]">
            <span className="w-1 h-1 rounded-full bg-[#75bf00]" />
            <span className="font-mono text-[8px] uppercase tracking-wider text-[#75bf00]">
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

