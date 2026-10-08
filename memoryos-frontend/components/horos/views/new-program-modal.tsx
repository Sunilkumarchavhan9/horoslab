"use client";

import React, { useState } from "react";
import { X, Sparkles, ArrowRight, Cpu, Layers, DollarSign, Gauge, Shield } from "lucide-react";
import { HorosButton } from "../ui/horos-button";
import { cn } from "@/lib/utils";

interface NewProgramModalProps {
  open: boolean;
  onClose: () => void;
  onCreateProgram: (payload: {
    name: string;
    objective: string;
    modelTarget: string;
    targetHardware?: string;
    maxCostPerReq?: number;
    p95LatencyMsTarget?: number;
    minQualityRetentionPct?: number;
  }) => void;
  initialPrompt?: string;
}

export function NewProgramModal({
  open,
  onClose,
  onCreateProgram,
  initialPrompt = "",
}: NewProgramModalProps) {
  const [prompt, setPrompt] = useState(
    initialPrompt ||
      "Optimize @Qwen/Qwen2.5-7B-Instruct for customer support inference under $0.0002/request and p95 latency under 600ms."
  );

  const [modelTarget, setModelTarget] = useState("Qwen 2.5 7B Instruct");
  const [objectiveType, setObjectiveType] = useState("Latency + Cost Optimization");
  const [p95Target, setP95Target] = useState(600);
  const [maxCost, setMaxCost] = useState(0.0002);
  const [hardware, setHardware] = useState("NVIDIA L4 24GB");
  const [qualityRetention, setQualityRetention] = useState(95);

  if (!open) return null;

  function handleSubmit() {
    onCreateProgram({
      name: `Optimize ${modelTarget}`,
      objective: prompt,
      modelTarget,
      targetHardware: hardware,
      maxCostPerReq: maxCost,
      p95LatencyMsTarget: p95Target,
      minQualityRetentionPct: qualityRetention,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-[680px] border border-[#a8b0a2] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e1e4df] bg-[#fafbfa] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center bg-[#75bf00] text-[#111]">
              <Sparkles size={12} />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#171a17]">
              Command-Oriented Program Creation
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-[#8e968b] hover:text-[#171a17]">
            <X size={16} />
          </button>
        </div>

        {/* Prompt Input Box */}
        <div className="p-5">
          <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7367]">
            What do you want HOROS to accomplish?
          </label>
          <div className="mt-2 border border-[#b4bcb0] bg-[#fdfefc] p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Optimize @model on hardware with p95 target..."
              className="w-full resize-none bg-transparent text-sm text-[#171a17] outline-none font-medium leading-relaxed"
            />
          </div>

          {/* Extracted Structured Controls Matrix */}
          <div className="mt-5 border border-dashed border-[#c9cec4] bg-[#fafbfa] p-4">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#788274] mb-3">
              Extracted Structured Controls
            </span>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              {/* Model */}
              <div className="border border-[#d8ddd3] bg-white p-2.5">
                <span className="text-[10px] text-[#788274] uppercase block flex items-center gap-1">
                  <Cpu size={11} /> Target Model
                </span>
                <select
                  value={modelTarget}
                  onChange={(e) => setModelTarget(e.target.value)}
                  className="mt-1 w-full bg-transparent font-mono font-semibold text-[#171a17] outline-none"
                >
                  <option value="Qwen 2.5 7B Instruct">Qwen 2.5 7B Instruct</option>
                  <option value="Llama 3.1 8B Instruct">Llama 3.1 8B Instruct</option>
                  <option value="DeepSeek V4 Flash">DeepSeek V4 Flash</option>
                  <option value="BGE-M3 Embeddings">BGE-M3 Embeddings</option>
                  <option value="FLUX.1 Schnell">FLUX.1 Schnell</option>
                </select>
              </div>

              {/* Hardware */}
              <div className="border border-[#d8ddd3] bg-white p-2.5">
                <span className="text-[10px] text-[#788274] uppercase block flex items-center gap-1">
                  <Layers size={11} /> Hardware Envelope
                </span>
                <select
                  value={hardware}
                  onChange={(e) => setHardware(e.target.value)}
                  className="mt-1 w-full bg-transparent font-mono font-semibold text-[#171a17] outline-none"
                >
                  <option value="NVIDIA L4 24GB">NVIDIA L4 (24GB)</option>
                  <option value="NVIDIA A10G 24GB">NVIDIA A10G (24GB)</option>
                  <option value="NVIDIA H100 SXM5 80GB">NVIDIA H100 (80GB)</option>
                  <option value="RTX 4090 24GB">RTX 4090 (24GB)</option>
                </select>
              </div>

              {/* Latency Constraint */}
              <div className="border border-[#d8ddd3] bg-white p-2.5">
                <span className="text-[10px] text-[#788274] uppercase block flex items-center gap-1">
                  <Gauge size={11} /> p95 Latency SLA Target
                </span>
                <div className="mt-1 flex items-center gap-1 font-mono font-bold text-[#171a17]">
                  <input
                    type="number"
                    value={p95Target}
                    onChange={(e) => setP95Target(Number(e.target.value))}
                    className="w-20 bg-transparent outline-none border-b border-[#d8ddd3]"
                  />
                  <span>ms</span>
                </div>
              </div>

              {/* Budget Constraint */}
              <div className="border border-[#d8ddd3] bg-white p-2.5">
                <span className="text-[10px] text-[#788274] uppercase block flex items-center gap-1">
                  <DollarSign size={11} /> Max Cost / Request
                </span>
                <div className="mt-1 flex items-center gap-1 font-mono font-bold text-[#171a17]">
                  <span>$</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={maxCost}
                    onChange={(e) => setMaxCost(Number(e.target.value))}
                    className="w-24 bg-transparent outline-none border-b border-[#d8ddd3]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e1e4df] bg-[#fafbfa] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-[#687063] hover:text-[#171a17]"
          >
            Cancel
          </button>

          <HorosButton variant="action" size="md" onClick={handleSubmit}>
            <span>Start Discovery →</span>
          </HorosButton>
        </div>
      </div>
    </div>
  );
}
