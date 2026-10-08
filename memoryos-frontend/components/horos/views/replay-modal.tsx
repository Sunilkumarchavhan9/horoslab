"use client";

import React, { useState } from "react";
import {
  X,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplayModalProps {
  open: boolean;
  onClose: () => void;
  missionId?: string;
  dark?: boolean;
}

export function ReplayModal({
  open,
  onClose,
  missionId = "MIS-8492",
  dark = true,
}: ReplayModalProps) {
  const [replayMode, setReplayMode] = useState<"exact" | "controlled">("exact");
  const [gpuOverride, setGpuOverride] = useState<string>("1x A100-40GB");
  const [batchOverride, setBatchOverride] = useState<string>("256");
  const [runtimeOverride, setRuntimeOverride] = useState<string>("vLLM (v0.6.2)");
  const [modelOverride, setModelOverride] = useState<string>("meta-llama/Llama-3.1-8B-Instruct");

  if (!open) return null;

  const handleExecuteRerun = () => {
    if (replayMode === "exact") {
      alert(`Executing Exact Replay for ${missionId} with original verified parameters...`);
    } else {
      alert(`Executing Controlled Rerun for ${missionId} with parameter overrides (GPU: ${gpuOverride}, Batch: ${batchOverride}). Status: NOT VERIFIED until re-observed.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-xs select-none">
      <div className="w-full max-w-2xl border border-[#282828] bg-[#141414] text-[#f0f3ee] shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-dashed border-[#282828] bg-[#171717]">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="text-[#75bf00]" size={18} />
            <h2 className="text-base font-bold text-[#F0EFE2] tracking-wide">
              Run Again &amp; Replay Runner
            </h2>
            <span className="text-[10px] text-[#889284] border border-[#2e2e2e] bg-[#202020] px-2 py-0.5 font-bold">
              {missionId}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#889284] hover:text-[#F0EFE2] transition-colors cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Mode Selector Tabs (Exact Replay vs Controlled Rerun) */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-[#181818] border border-[#282828]">
            <button
              type="button"
              onClick={() => setReplayMode("exact")}
              className={cn(
                "py-2.5 px-3 font-mono text-xs transition-colors cursor-pointer flex flex-col items-center gap-1 border",
                replayMode === "exact"
                  ? "border-[#75bf00] bg-[#121c0e] text-[#F0EFE2] font-bold"
                  : "border-transparent text-[#889284] hover:text-[#F0EFE2]"
              )}
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw size={13} />
                <span>Exact Replay</span>
              </div>
              <span className="text-[10px] text-[#889284] font-normal">Deterministic re-execution</span>
            </button>

            <button
              type="button"
              onClick={() => setReplayMode("controlled")}
              className={cn(
                "py-2.5 px-3 font-mono text-xs transition-colors cursor-pointer flex flex-col items-center gap-1 border",
                replayMode === "controlled"
                  ? "border-[#75bf00] bg-[#121c0e] text-[#F0EFE2] font-bold"
                  : "border-transparent text-[#889284] hover:text-[#F0EFE2]"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Sliders size={13} />
                <span>Controlled Rerun</span>
              </div>
              <span className="text-[10px] text-[#889284] font-normal">Parameter override experimentation</span>
            </button>
          </div>

          {/* CRITICAL VERIFICATION BADGE DISTINCTION (USER EXPLICIT REQUIREMENT!) */}
          <div className="p-3 border border-[#282828] bg-[#181818] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#889284] text-[11px]">RUN STATUS:</span>
              {replayMode === "exact" ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#121c0e] border border-[#283818] text-[#75bf00] font-bold text-[10.5px]">
                  <ShieldCheck size={12} /> ORIGINAL · VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#1c1917] border border-[#422006] text-[#eab308] font-bold text-[10.5px]">
                  <ShieldAlert size={12} /> RERUN · NOT VERIFIED
                </span>
              )}
            </div>

            <p className="text-[10.5px] text-[#889284] font-sans">
              {replayMode === "exact"
                ? "Original run is cryptographically verified."
                : "Controlled reruns do NOT inherit original verification."}
            </p>
          </div>

          {/* MODE 1: EXACT REPLAY READONLY CONFIG */}
          {replayMode === "exact" && (
            <div className="p-4 border border-[#222222] bg-[#050505] space-y-2 text-xs">
              <div className="text-[10px] text-[#889284] uppercase font-bold tracking-wider mb-2">
                ORIGINAL REPLAY CONFIGURATION (LOCKED)
              </div>
              <div className="flex justify-between py-1 border-b border-[#1c1c1c]">
                <span className="text-[#889284]">Model:</span>
                <span className="text-[#F0EFE2] font-bold">meta-llama/Llama-3.1-8B-Instruct</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1c1c1c]">
                <span className="text-[#889284]">Runtime:</span>
                <span className="text-[#F0EFE2] font-bold">vLLM (v0.6.2)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1c1c1c]">
                <span className="text-[#889284]">Hardware Target:</span>
                <span className="text-[#F0EFE2] font-bold">1x NVIDIA A100-40GB GPU</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#889284]">WorldState Snapshot:</span>
                <span className="text-[#75bf00] font-bold">v85 (Locked)</span>
              </div>
            </div>
          )}

          {/* MODE 2: CONTROLLED RERUN PARAMETER OVERRIDES */}
          {replayMode === "controlled" && (
            <div className="space-y-4 font-mono">
              <div className="text-[10px] text-[#889284] uppercase font-bold tracking-wider">
                CONTROLLED RERUN OVERRIDES
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#889284] block">GPU Target Target:</label>
                  <select
                    value={gpuOverride}
                    onChange={(e) => setGpuOverride(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-[#F0EFE2] text-xs px-2.5 py-1.5 outline-none font-mono"
                  >
                    <option value="1x A100-40GB">1x NVIDIA A100-40GB</option>
                    <option value="1x H100-80GB">1x NVIDIA H100-80GB</option>
                    <option value="2x L4-24GB">2x NVIDIA L4-24GB</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#889284] block">Max Batch Size:</label>
                  <select
                    value={batchOverride}
                    onChange={(e) => setBatchOverride(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-[#F0EFE2] text-xs px-2.5 py-1.5 outline-none font-mono"
                  >
                    <option value="128">128</option>
                    <option value="256">256 (Default)</option>
                    <option value="512">512</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#889284] block">Serving Engine:</label>
                  <select
                    value={runtimeOverride}
                    onChange={(e) => setRuntimeOverride(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-[#F0EFE2] text-xs px-2.5 py-1.5 outline-none font-mono"
                  >
                    <option value="vLLM (v0.6.2)">vLLM (v0.6.2)</option>
                    <option value="SGLang (v0.3.0)">SGLang (v0.3.0)</option>
                    <option value="TensorRT-LLM">TensorRT-LLM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#889284] block">Candidate Model:</label>
                  <select
                    value={modelOverride}
                    onChange={(e) => setModelOverride(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-[#F0EFE2] text-xs px-2.5 py-1.5 outline-none font-mono"
                  >
                    <option value="meta-llama/Llama-3.1-8B-Instruct">meta-llama/Llama-3.1-8B-Instruct</option>
                    <option value="Qwen/Qwen3-32B">Qwen/Qwen3-32B</option>
                    <option value="deepseek-ai/DeepSeek-R1">deepseek-ai/DeepSeek-R1</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Modal Action Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-dashed border-[#282828] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#383838] bg-[#202020] hover:border-white text-[#F0EFE2] px-4 py-2 rounded-none transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteRerun}
              className="flex items-center gap-1.5 border border-[#75bf00] bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-4 py-2 rounded-none transition-colors cursor-pointer"
            >
              <Play size={13} />
              <span>{replayMode === "exact" ? "Execute Exact Replay" : "Execute Controlled Rerun"}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
