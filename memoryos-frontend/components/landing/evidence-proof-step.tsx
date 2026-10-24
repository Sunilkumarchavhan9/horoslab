"use client";

import React, { useState } from "react";
import { FileCheck, Check, Copy } from "lucide-react";
import { AWSLogo, OpenTelemetryLogo, NvidiaLogo } from "@/components/horos/primitives/brand-icons";

export function EvidenceProofStep() {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText("sha256:7f8a9e21d3c544e98f0291ba4c90184b2c198a0029b47e");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const evidenceItems = [
    { num: "01", title: "AWS Cost Explorer (CUR)", desc: "-$34.20/day verified delta match", status: "verified", Icon: AWSLogo },
    { num: "02", title: "OpenTelemetry P95 Collector", desc: "38.2ms p95 across 10,000 trace samples", status: "verified", Icon: OpenTelemetryLogo },
    { num: "03", title: "HOROS Golden Eval Suite", desc: "98.9% accuracy with zero quality regression", status: "verified", Icon: ({ size = 14 }) => <FileCheck size={size} className="text-[#75bf00]" /> },
    { num: "04", title: "NVIDIA NVML Power Sensors", desc: "185W average sustained on L40S", status: "verified", Icon: NvidiaLogo },
    { num: "05", title: "Audit Provenance Trace", desc: "Verifiable SHA256 immutable receipt", status: "signed", Icon: ({ size = 14 }) => <Check size={size} className="text-[#75bf00]" /> },
    { num: "06", title: "Independent Verifier Signature", desc: "HOROS-Independent-Verifier-04", status: "valid", Icon: ({ size = 14 }) => <Check size={size} className="text-[#75bf00]" /> },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#333333] p-6 lg:p-8 bg-[#151515] rounded-[1px] font-mono select-none">
      {/* Header */}
      <div className="flex items-start justify-between p-5 lg:p-6 border-b border-dashed border-[#333333]">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 border border-[#444] rounded-[1px] p-1.5 bg-[#1a1a1a]">
            <FileCheck size={16} className="text-[#C8C7BA]" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[#F0EFE2] font-medium text-[14px]">Independent Proof & Verification</div>
            <div className="text-[#666666] font-mono text-[11px]">The executor is never the sole judge of its own success</div>
          </div>
        </div>
        <div className="border border-[#333] bg-[#1a1a1a] text-[#75bf00] font-mono text-[10px] px-2 py-0.5 rounded-[1px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse" />
          verified
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 border-b border-dashed border-[#333333] divide-x divide-dashed divide-[#333333]">
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">VERIFIER VERDICT</div>
          <div className="text-[#75bf00] font-medium text-[13px]">100% PROVEN</div>
        </div>
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">OBSERVATION WINDOW</div>
          <div className="text-[#F0EFE2] font-medium text-[13px]">Active (94.2s)</div>
        </div>
        <div className="p-4 lg:p-5 flex flex-col gap-1.5">
          <div className="text-[#666666] font-mono text-[9px] uppercase tracking-wider">CROSS-VALIDATION</div>
          <div className="text-[#F0EFE2] font-medium text-[13px]">4 / 4 Sources</div>
        </div>
      </div>

      {/* Cross-Validation Grid */}
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[#C8C7BA] font-mono text-[10px] uppercase tracking-wider">INDEPENDENT SOURCES</div>
          <div className="text-[#666666] font-mono text-[10px]">Cross-validated telemetry</div>
        </div>

        {/* Evidence Items List */}
        <div className="space-y-3">
          {evidenceItems.map((item) => (
            <EvidenceItem key={item.num} item={item} />
          ))}
        </div>
      </div>

      {/* Footer Bar */}
      <div className="border-t border-dashed border-[#333333] p-4 lg:px-6 lg:py-4 flex items-center justify-between">
        <div className="text-[#666666] font-mono text-[10px] flex items-center gap-2 truncate mr-2">
          <span className="w-[3px] h-[3px] bg-[#75bf00]" />
          <span>sha256:7f8a9e21d3c544e98f0291ba4c90184b2c198a0029b47e</span>
        </div>
        <button 
          onClick={copyHash}
          className="text-[#C8C7BA] hover:text-[#F0EFE2] font-mono text-[10px] uppercase tracking-wider transition-colors shrink-0"
        >
          {copied ? "Copied ✓" : "Copy Hash"}
        </button>
      </div>
    </div>
  );
}

function EvidenceItem({ item }: { item: any }) {
  return (
    <div className="flex items-start gap-3.5 pb-2.5 border-b border-dashed border-[#222222] last:border-0 last:pb-0">
      <div className="text-[#F0EFE2] font-mono text-[11px] font-bold mt-0.5 shrink-0">{item.num}</div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <item.Icon size={12} />
            <span className="text-[#dddddd] font-medium text-[12px] leading-tight truncate">{item.title}</span>
          </div>
          <span className="shrink-0 flex items-center gap-1.5 border border-[#333] bg-[#1a1a1a] px-1.5 py-0.5 rounded-[1px]">
            <span className="w-1 h-1 rounded-full bg-[#75bf00]" />
            <span className="font-mono text-[8px] uppercase tracking-wider text-[#75bf00]">
              {item.status}
            </span>
          </span>
        </div>
        <div className="text-[#666666] text-[11px] leading-tight font-sans truncate">
          {item.desc}
        </div>
      </div>
    </div>
  );
}

