"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, ChevronRight, FileCode, Layers, Cpu, Check } from "lucide-react";
import { EvidenceItem } from "@/lib/dhyra-types";
import { cn } from "@/lib/utils";

interface EvidenceChainGraphProps {
  evidence: EvidenceItem;
  dark?: boolean;
  className?: string;
}

export function EvidenceChainGraph({ evidence, dark = true, className }: EvidenceChainGraphProps) {
  const [selectedNode, setSelectedNode] = useState<"claim" | "measurements" | "runs" | "artifacts" | "verification">("claim");

  const { claimChain, confidencePct } = evidence;

  return (
    <div className={cn(
      "border rounded-xs transition-colors",
      dark ? "border-[#2e2e2e] bg-[#202020] text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#171a17]",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b px-4 py-3",
        dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#e1e4df] bg-[#fafbfa]"
      )}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#75bf00]" />
          <span className={cn(
            "text-xs font-semibold uppercase tracking-[0.14em]",
            dark ? "text-[#F0EFE2]" : "text-[#171a17]"
          )}>
            Dhyra Evidence & Assurance Graph
          </span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 font-mono text-xs font-bold px-2 py-0.5 rounded-xs",
          dark
            ? "text-[#a3e635] bg-[#162916] border border-[#75bf00]/40"
            : "text-[#3c7000] bg-[#f2fbe6] border border-[#b9de78]"
        )}>
          <span>Statistical Confidence: {confidencePct}%</span>
        </div>
      </div>

      {/* Interactive Horizontal Flow Rail */}
      <div className={cn(
        "border-b border-dashed px-4 py-3",
        dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-[#fdfefc]"
      )}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          {[
            { id: "claim", label: "01. CLAIM", count: "1" },
            { id: "measurements", label: "02. MEASUREMENTS", count: `${claimChain.measurements.length}` },
            { id: "runs", label: "03. RUNS", count: `${claimChain.runs.length}` },
            { id: "artifacts", label: "04. ARTIFACTS", count: `${claimChain.artifacts.length}` },
            { id: "verification", label: "05. VERIFICATION", count: `${claimChain.verification.length}` },
          ].map((node, idx) => (
            <React.Fragment key={node.id}>
              <button
                type="button"
                onClick={() => setSelectedNode(node.id as typeof selectedNode)}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 transition-all rounded-xs",
                  selectedNode === node.id
                    ? "border-[#75bf00] bg-[#75bf00] text-black font-bold"
                    : dark
                    ? "border-[#383838] bg-[#222] text-[#889084] hover:border-[#555] hover:text-[#F0EFE2]"
                    : "border-[#d8ddd3] bg-white text-[#5c6457] hover:border-[#a8b0a2]"
                )}
              >
                <span>{node.label}</span>
                <span className="opacity-70">[{node.count}]</span>
              </button>

              {idx < 4 ? <span className={dark ? "text-[#555]" : "text-[#969e92]"}>→</span> : null}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Selected Node Detailed Inspector */}
      <div className="p-5">
        {selectedNode === "claim" && (
          <div>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#788274] font-semibold">
              Formal Claim Formulation
            </span>
            <p className={cn(
              "mt-2 text-xs font-medium leading-relaxed border-l-2 border-[#75bf00] pl-3",
              dark ? "text-[#F0EFE2]" : "text-[#151515]"
            )}>
              &ldquo;{claimChain.claim}&rdquo;
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 font-mono text-xs">
              <div className={cn("border p-2.5 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                <span className="text-[10px] text-[#788274] uppercase block">Target Candidate</span>
                <span className={cn("mt-1 font-semibold block truncate", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{evidence.candidateName}</span>
              </div>
              <div className={cn("border p-2.5 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                <span className="text-[10px] text-[#788274] uppercase block">Hardware Evaluated</span>
                <span className={cn("mt-1 font-semibold block", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{evidence.hardwareProfilesEvaluated} Profiles</span>
              </div>
              <div className={cn("border p-2.5 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                <span className="text-[10px] text-[#788274] uppercase block">Assurance SLA</span>
                <span className={cn("mt-1 font-semibold block", dark ? "text-[#a3e635]" : "text-[#3c7000]")}>
                  {evidence.verificationChecksPassed}/{evidence.verificationChecksTotal} Passed
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedNode === "measurements" && (
          <div>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#788274] font-semibold mb-3">
              Measured Empirical Delta vs Baseline
            </span>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs font-mono">
                <thead className={cn("border-b text-[10px] uppercase", dark ? "border-[#2e2e2e] text-[#889084]" : "border-[#e1e4df] text-[#788274]")}>
                  <tr>
                    <th className="px-3 py-2 text-left font-sans">Measurement</th>
                    <th className="px-3 py-2 text-left">Observed Value</th>
                    <th className="px-3 py-2 text-left">Baseline</th>
                    <th className="px-3 py-2 text-right">Delta</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", dark ? "divide-[#2e2e2e]" : "divide-[#edf0eb]")}>
                  {claimChain.measurements.map((m, idx) => (
                    <tr key={idx} className={dark ? "hover:bg-[#252525]" : "hover:bg-[#f8faf6]"}>
                      <td className={cn("px-3 py-2.5 font-sans font-medium", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{m.name}</td>
                      <td className={cn("px-3 py-2.5 font-bold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{m.value}</td>
                      <td className="px-3 py-2.5 text-[#788274]">{m.baseline}</td>
                      <td className={cn("px-3 py-2.5 text-right font-semibold", dark ? "text-[#a3e635]" : "text-[#3c7000]")}>{m.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedNode === "runs" && (
          <div>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#788274] font-semibold mb-3">
              Supporting Benchmark & Sweep Runs
            </span>
            <div className="space-y-2">
              {claimChain.runs.map((r) => (
                <div key={r.id} className={cn("flex items-center justify-between border p-3 text-xs font-mono rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white")}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#60a5fa]">{r.id}</span>
                    <span className={cn("font-sans", dark ? "text-[#F0EFE2]" : "text-[#2a3028]")}>{r.name}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] uppercase font-bold rounded-xs",
                    dark ? "border border-[#75bf00]/40 bg-[#162916] text-[#a3e635]" : "border border-[#b9de78] bg-[#f2fbe6] text-[#3c7000]"
                  )}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNode === "artifacts" && (
          <div>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#788274] font-semibold mb-3">
              Generated Signed Artifacts
            </span>
            <div className="space-y-2">
              {claimChain.artifacts.map((a, idx) => (
                <div key={idx} className={cn("flex items-center justify-between border p-3 text-xs font-mono rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white")}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#fbbf24]">{a.name}</span>
                  </div>
                  <span className="text-[#889084] text-[11px]">{a.hash ? `${a.hash.slice(0, 12)}...` : "sha256"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNode === "verification" && (
          <div>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[#788274] font-semibold mb-3">
              Formal Policy Verification Results
            </span>
            <div className="space-y-2">
              {claimChain.verification.map((v, idx) => (
                <div key={idx} className={cn("flex items-center justify-between border p-3 text-xs font-mono rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white")}>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-[#75bf00]" />
                    <span className={cn("font-sans", dark ? "text-[#F0EFE2]" : "text-[#2a3028]")}>{v.rule}</span>
                  </div>
                  <span className={cn("font-bold text-[10px] uppercase", dark ? "text-[#a3e635]" : "text-[#3c7000]")}>
                    Passed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
