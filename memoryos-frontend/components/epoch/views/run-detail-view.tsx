"use client";

import React from "react";
import { ArrowLeft, Terminal, Activity, Cpu, Server, Clock, ShieldCheck, Download } from "lucide-react";
import { RunEntity } from "@/lib/epoch-types";
import { EpochBadge } from "../ui/epoch-badge";
import { EpochStatusDot } from "../ui/epoch-status-dot";
import { EpochButton } from "../ui/epoch-button";
import { cn } from "@/lib/utils";

interface RunDetailViewProps {
  run: RunEntity;
  onBack: () => void;
  dark?: boolean;
}

export function RunDetailView({ run, onBack, dark = true }: RunDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b pb-4",
        dark ? "border-[#2e2e2e]" : "border-[#e1e4df]"
      )}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "flex h-8 w-8 items-center justify-center border rounded-xs transition-colors",
              dark ? "border-[#383838] bg-[#202020] text-[#888] hover:text-white hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#687063] hover:border-[#171a17] hover:text-[#171a17]"
            )}
            title="Back to Runs"
          >
            <ArrowLeft size={15} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#788274]">
              <span>Runs</span>
              <span>/</span>
              <span className={cn("font-semibold", dark ? "text-white" : "text-[#171a17]")}>{run.id}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <h1 className={cn("text-xl font-semibold md:text-2xl font-mono", dark ? "text-white" : "text-[#171a17]")}>
                {run.id}
              </h1>
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs",
                run.status === "completed"
                  ? "border border-[#75bf00]/40 bg-[#162916] text-[#a3e635]"
                  : "border border-[#38bdf8]/40 bg-[#0c2a38] text-[#7dd3fc]"
              )}>
                {run.status.toUpperCase()} • {run.type.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 border px-3 py-1.5 text-xs rounded-xs font-medium transition-colors",
              dark ? "border-[#383838] bg-[#202020] text-white hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#171a17]"
            )}
          >
            <Download size={13} />
            <span>Export Trace JSON</span>
          </button>
        </div>
      </div>

      {/* Split Layout: Summary + Live Streaming Terminal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Summary & Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={cn("border p-4 rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#788274] mb-3">
              Execution Run Summary
            </span>

            <div className={cn("divide-y text-xs font-mono", dark ? "divide-[#282828]" : "divide-[#edf0eb]")}>
              <div className="flex items-center justify-between py-2">
                <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#6b7367]")}>Program</span>
                <span className={cn("font-bold", dark ? "text-white" : "text-[#171a17]")}>{run.programName}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#6b7367]")}>Candidate</span>
                <span className={dark ? "text-white" : "text-[#171a17]"}>{run.candidateName}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#6b7367]")}>Environment</span>
                <span className="text-[#60a5fa]">{run.environment}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#6b7367]")}>Duration</span>
                <span className={dark ? "text-white" : "text-[#171a17]"}>{run.durationSeconds} seconds</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#6b7367]")}>Started</span>
                <span className="text-[#788274]">{run.startedAt}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className={cn("border p-4 rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#788274] mb-3">
              Telemetry & Performance Metrics
            </span>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className={cn("border p-2.5 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                <span className="text-[10px] text-[#788274] uppercase font-sans block">p95 Latency</span>
                <span className={cn("mt-1 font-bold text-base block", dark ? "text-[#a3e635]" : "text-[#3c7000]")}>{run.metrics.latencyP95} ms</span>
              </div>

              <div className={cn("border p-2.5 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                <span className="text-[10px] text-[#788274] uppercase font-sans block">Throughput</span>
                <span className={cn("mt-1 font-bold text-base block", dark ? "text-white" : "text-[#171a17]")}>{run.metrics.throughputTps} tps</span>
              </div>

              <div className={cn("border p-2.5 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                <span className="text-[10px] text-[#788274] uppercase font-sans block">GPU Memory</span>
                <span className={cn("mt-1 font-bold text-base block", dark ? "text-white" : "text-[#171a17]")}>{run.metrics.gpuMemoryGb} GB</span>
              </div>

              <div className={cn("border p-2.5 rounded-xs", dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                <span className="text-[10px] text-[#788274] uppercase font-sans block">Run Cost</span>
                <span className={cn("mt-1 font-bold text-base block", dark ? "text-[#a3e635]" : "text-[#3c7000]")}>${run.metrics.costUsd.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Output Streaming Terminal (7 cols) */}
        <div className="lg:col-span-7">
          <div className="border border-[#2e2e2e] bg-[#151515] text-[#e0e6dd] font-mono text-xs overflow-hidden rounded-xs">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-[#282828] bg-[#202020] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-[#75bf00]" />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white">
                  Live Execution Logs & System Trace
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#75bf00]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00] animate-pulse" />
                <span>STREAM ACTIVE</span>
              </div>
            </div>

            {/* Terminal Content */}
            <div className="p-4 space-y-1.5 max-h-[440px] overflow-y-auto font-mono text-[11px] leading-relaxed">
              {run.logs && run.logs.length > 0 ? (
                run.logs.map((l, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#788274] select-none shrink-0">{l.timestamp}</span>
                    <span className={cn(
                      "font-bold uppercase text-[10px] px-1 py-0.2 shrink-0 rounded-xs",
                      l.level === "info" ? "text-[#75bf00] bg-[#162916]" : l.level === "error" ? "text-[#f87171] bg-[#3a1515]" : "text-[#60a5fa] bg-[#0c2a38]"
                    )}>
                      {l.level}
                    </span>
                    <span className="text-white">{l.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-[#788274]">No active log traces found for this execution.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
