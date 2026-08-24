"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Terminal,
  Activity,
  Cpu,
  Server,
  Clock,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Zap,
  TrendingDown,
  Layers,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { RunEntity } from "@/lib/epoch-types";
import { VLLMLogo } from "../primitives/brand-icons";
import { EpochButton } from "../ui/epoch-button";
import { cn } from "@/lib/utils";

interface RunDetailViewProps {
  run: RunEntity;
  onBack: () => void;
  dark?: boolean;
}

export function RunDetailView({ run, onBack, dark = true }: RunDetailViewProps) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<number>(3);
  const [logFilter, setLogFilter] = useState<"all" | "gpu" | "vllm" | "verifier">("all");

  const serveCommand = `vllm serve meta-llama/Llama-3.1-8B-Instruct \\
  --tensor-parallel-size 1 \\
  --gpu-memory-utilization 0.90 \\
  --max-num-seqs 256 \\
  --enable-chunked-prefill \\
  --port 8000`;

  const copyServeCommand = () => {
    navigator.clipboard.writeText(serveCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const phases = [
    {
      index: 1,
      title: "Hardware selection",
      engine: "Hardware Engine",
      strategy: "GPU compatibility sweep",
      why: "Estimate VRAM, latency, and request cost across compatible GPUs before any paid run.",
      result: "Selected 1x A100-40GB ($0.002866/req lowest cost vs $0.003884 on A10G).",
      status: "completed",
      duration: "18s",
    },
    {
      index: 2,
      title: "Baseline profile",
      engine: "Profiler",
      strategy: "Measured baseline profile",
      why: "Run the FP16 baseline on the selected GPU and record latency, throughput, and VRAM.",
      result: "Baseline latency: 142.1ms • Throughput: 38.2 tok/s • Peak VRAM: 19.5GB.",
      status: "completed",
      duration: "45s",
    },
    {
      index: 3,
      title: "Apply Serving config tuning",
      engine: "Serving Engine",
      strategy: "vLLM serving candidate sweep",
      why: "Benchmark a small set of serving configs and keep the one that improves tail latency or throughput.",
      result: "Applied chunked prefill (block_size=16) + max_num_seqs=256.",
      status: "completed",
      duration: "120s",
    },
    {
      index: 4,
      title: "Benchmark Serving config tuning",
      engine: "Serving Engine",
      strategy: "vLLM serving candidate sweep",
      why: "Benchmark a small set of serving configs and keep the one that improves tail latency or throughput.",
      result: "P99 tail latency dropped to 82.4ms (-42%) • Throughput rose to 61.4 tok/s (+60%).",
      status: "completed",
      duration: "115s",
    },
    {
      index: 5,
      title: "Compare baseline vs optimized",
      engine: "Comparison",
      strategy: "Baseline-vs-optimized verdict (recorded, 0 GPU)",
      why: "Rank the measured pre-optimization baseline against the optimized version this run produced.",
      result: "Verdict: 100% Verified. Candidate promoted to winner.",
      status: "completed",
      duration: "32s",
    },
  ];

  const logs = [
    { time: "12:30:14", tag: "SYS", text: "Initializing execution workspace for meta-llama/Llama-3.1-8B-Instruct" },
    { time: "12:30:16", tag: "GPU", text: "Probing hardware fabric: NVIDIA A100-PCIE-40GB (Driver 550.54.14, CUDA 12.4)" },
    { time: "12:30:20", tag: "vLLM", text: "Loading model weights with FP16 precision (16.07 GB mapped)" },
    { time: "12:30:32", tag: "OPT", text: "Profiling baseline workload: 2048 input / 256 output tokens (n=100 requests)" },
    { time: "12:31:17", tag: "OPT", text: "Baseline profile complete: p50=124ms, p95=142.1ms, TTFT=48.2ms, VRAM=19.5GB" },
    { time: "12:31:18", tag: "vLLM", text: "Injecting serving candidate: --enable-chunked-prefill --max-num-seqs 256" },
    { time: "12:33:18", tag: "OPT", text: "Candidate benchmark complete: p50=74ms, p95=82.4ms, TTFT=28.1ms, VRAM=12.8GB" },
    { time: "12:35:13", tag: "VERIF", text: "Cryptographic proof generated: sha256:7f8a9e14c09d51b3a88f7236e788c3a1e4b9d029f" },
    { time: "12:35:44", tag: "SYS", text: "Run completed successfully. Winner promoted to registry." },
  ];

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "gpu") return l.tag === "GPU";
    if (logFilter === "vllm") return l.tag === "vLLM";
    if (logFilter === "verifier") return l.tag === "VERIF";
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-12 font-sans text-xs animate-in fade-in duration-150">
      {/* Top Header & Breadcrumbs */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b pb-4",
        dark ? "border-[#282828]" : "border-[#e1e4df]"
      )}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "flex h-7 w-7 items-center justify-center border rounded-xs transition-colors cursor-pointer",
              dark ? "border-[#383838] bg-[#202020] text-[#888] hover:text-white hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#687063] hover:border-[#171a17]"
            )}
            title="Back to Runs"
          >
            <ArrowLeft size={13} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#788274]">
              <span>Runs</span>
              <span>/</span>
              <span className="text-white font-semibold">{run.id}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <h1 className="text-base font-bold font-mono text-white">
                {run.id}
              </h1>
              <span className="border border-[#384820] bg-[#1c2a12] text-[#86dc00] px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs">
                {run.status.toUpperCase()}
              </span>
              <span className="text-[10px] text-[#788274] font-mono uppercase">
                {run.type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <EpochButton variant="outline" size="sm" onClick={copyServeCommand}>
            {copiedCmd ? <Check size={12} className="text-[#86dc00]" /> : <Copy size={12} />}
            <span>{copiedCmd ? "Copied Command" : "Copy serve.sh"}</span>
          </EpochButton>

          <EpochButton variant="action" size="sm" onClick={onBack}>
            <span>View Deploy Options</span>
          </EpochButton>
        </div>
      </div>

      {/* Meta Grid Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div className={cn(
          "border p-3 rounded-xs space-y-0.5",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Model Target</span>
          <span className="font-bold text-white truncate block">Llama-3.1-8B-Instruct</span>
        </div>

        <div className={cn(
          "border p-3 rounded-xs space-y-0.5",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Inference Engine</span>
          <div className="flex items-center gap-1 text-white font-bold">
            <VLLMLogo size={11} />
            <span>vLLM</span>
          </div>
        </div>

        <div className={cn(
          "border p-3 rounded-xs space-y-0.5",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Hardware Allocated</span>
          <span className="font-bold text-white truncate block">1x A100-40GB</span>
        </div>

        <div className={cn(
          "border p-3 rounded-xs space-y-0.5",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Duration</span>
          <span className="font-bold text-white">{run.durationSeconds || 330}s (≈5.5m)</span>
        </div>

        <div className={cn(
          "border p-3 rounded-xs space-y-0.5",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <span className="text-[10px] text-[#788274] uppercase block">Run Compute Cost</span>
          <span className="font-bold text-[#86dc00]">${run.metrics?.costUsd?.toFixed(2) || "18.50"}</span>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 5-Phase Execution Sequence & Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: 5-Phase Sequence */}
          <div className={cn(
            "border rounded-xs p-4 space-y-4",
            dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
          )}>
            <div className="flex items-center justify-between border-b border-[#282828] pb-2.5">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                5-Phase Execution Sequence
              </h3>
              <span className="text-[10px] font-mono text-[#86dc00]">5 of 5 Completed</span>
            </div>

            <div className="space-y-3">
              {phases.map((p) => {
                const isSelected = selectedPhase === p.index;
                return (
                  <div
                    key={p.index}
                    onClick={() => setSelectedPhase(p.index)}
                    className={cn(
                      "border p-3 rounded-xs transition-colors cursor-pointer space-y-1.5",
                      isSelected
                        ? "border-[#444] bg-[#222]"
                        : dark
                        ? "border-[#282828] bg-[#1a1a1a] hover:border-[#383838]"
                        : "border-[#e0e0e0] bg-[#fafbfa] hover:border-[#ccc]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono font-bold text-white text-[11px]">
                        <span className="text-[#86dc00]">✓</span>
                        <span>{p.index}. {p.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#788274]">{p.duration}</span>
                    </div>

                    <div className="text-[11px] text-[#a0a89d] pl-4 space-y-0.5">
                      <div><strong className="text-white">Engine:</strong> {p.engine} • <strong className="text-white">Strategy:</strong> {p.strategy}</div>
                      <div className="text-[10px] text-[#788274]">{p.why}</div>
                      <div className="text-white pt-1 text-[11px] font-mono bg-[#141414] p-1.5 rounded-xs border border-[#262626]">
                        ↳ {p.result}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Performance Deltas (Continuous 4-Metric Grid) */}
          <div className={cn(
            "border rounded-xs p-4 space-y-3",
            dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
          )}>
            <h3 className="font-bold text-xs text-white uppercase tracking-wider border-b border-[#282828] pb-2">
              Empirical Performance &amp; Resource Deltas
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="border border-[#282828] bg-[#1a1a1a] p-3 rounded-xs space-y-1">
                <span className="text-[10px] text-[#788274] uppercase block">p95 Latency</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white">82.4 ms</span>
                  <span className="text-[10px] text-[#86dc00] font-bold">-42.0%</span>
                </div>
                <span className="text-[10px] text-[#788274] block">Baseline: 142.1 ms</span>
              </div>

              <div className="border border-[#282828] bg-[#1a1a1a] p-3 rounded-xs space-y-1">
                <span className="text-[10px] text-[#788274] uppercase block">Token Throughput</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white">61.4 tok/s</span>
                  <span className="text-[10px] text-[#86dc00] font-bold">+60.7%</span>
                </div>
                <span className="text-[10px] text-[#788274] block">Baseline: 38.2 tok/s</span>
              </div>

              <div className="border border-[#282828] bg-[#1a1a1a] p-3 rounded-xs space-y-1">
                <span className="text-[10px] text-[#788274] uppercase block">Peak VRAM Memory</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white">12.8 GB</span>
                  <span className="text-[10px] text-[#86dc00] font-bold">-34.3%</span>
                </div>
                <span className="text-[10px] text-[#788274] block">Baseline: 19.5 GB</span>
              </div>

              <div className="border border-[#282828] bg-[#1a1a1a] p-3 rounded-xs space-y-1">
                <span className="text-[10px] text-[#788274] uppercase block">Cost per 1M Tokens</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white">$0.28</span>
                  <span className="text-[10px] text-[#86dc00] font-bold">-33.3%</span>
                </div>
                <span className="text-[10px] text-[#788274] block">Baseline: $0.42</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Promoted Serving Config & Terminal Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Promoted Serving Config */}
          <div className={cn(
            "border rounded-xs p-4 space-y-3 font-mono",
            dark ? "border-[#282828] bg-[#181818]" : "border-[#d8ddd3] bg-white"
          )}>
            <div className="flex items-center justify-between border-b border-[#282828] pb-2">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-sans">
                Promoted Serving Script
              </h3>
              <button
                type="button"
                onClick={copyServeCommand}
                className="text-[11px] text-[#888] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedCmd ? <Check size={11} className="text-[#86dc00]" /> : <Copy size={11} />}
                <span>{copiedCmd ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <pre className="bg-[#121212] border border-[#242424] p-3 rounded-xs text-[11px] text-[#a0a89d] overflow-x-auto leading-relaxed">
              <code>{serveCommand}</code>
            </pre>

            <div className="space-y-1.5 text-[11px] text-[#788274] pt-1">
              <div className="flex items-center justify-between">
                <span>Base Container:</span>
                <span className="text-white font-mono">vllm/vllm-openai:v0.6.2</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Precision:</span>
                <span className="text-white font-mono">FP16</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quantization:</span>
                <span className="text-white font-mono">None (Lossless)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Live Execution Log Drawer */}
          <div className={cn(
            "border rounded-xs overflow-hidden font-mono text-xs",
            dark ? "border-[#282828] bg-[#121212]" : "border-[#d8ddd3] bg-white"
          )}>
            <div className="flex items-center justify-between border-b border-[#242424] px-3 py-2 bg-[#181818]">
              <div className="flex items-center gap-2">
                <Terminal size={12} className="text-[#788274]" />
                <span className="text-[11px] font-bold text-white">Execution Logs</span>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                {(["all", "gpu", "vllm", "verifier"] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setLogFilter(tag)}
                    className={cn(
                      "px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer uppercase",
                      logFilter === tag
                        ? "bg-[#282828] text-white font-bold"
                        : "text-[#788274] hover:text-white"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 space-y-1.5 max-h-[320px] overflow-y-auto text-[10px] leading-relaxed">
              {filteredLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#555] shrink-0">{log.time}</span>
                  <span className={cn(
                    "px-1 py-0.2 rounded-xs shrink-0 font-bold",
                    log.tag === "GPU" ? "bg-[#182613] text-[#86dc00]" :
                    log.tag === "vLLM" ? "bg-[#1e3a5f] text-[#60a5fa]" :
                    log.tag === "VERIF" ? "bg-[#281a38] text-[#c084fc]" :
                    "bg-[#202020] text-[#888]"
                  )}>
                    {log.tag}
                  </span>
                  <span className="text-[#a0a89d]">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
