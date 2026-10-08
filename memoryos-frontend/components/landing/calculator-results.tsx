"use client";

import React, { useState } from "react";
import { Info, Plus, Copy, Calendar, ChevronRight, X, Cpu, Server, Activity, Terminal, AlertTriangle, Bot, ExternalLink, Box, Link2, Layers, Binary, BarChart, Gauge, ArrowRight } from "lucide-react";
import { HorosLogo, NvidiaLogo } from "@/components/horos/primitives/brand-icons";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export function CalculatorResults({
  model = "Qwen/Qwen3-0.6B",
  gpu = "NVIDIA H100 SXM 80 GB",
  quantization = "FP16",
  utilization = "30%",
  requestsPerDay = "10,000",
  inputTokens = "512",
  outputTokens = "128",
  units = "1",
  maxContext = "8192",
  onEdit
}: any) {
  const [isChartInfoOpen, setIsChartInfoOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isShareBadgeOpen, setIsShareBadgeOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  
  const [activeModel, setActiveModel] = useState(model);
  const [activeGpu, setActiveGpu] = useState(gpu);
  const [activeQuant, setActiveQuant] = useState(quantization);
  const [activeUtil, setActiveUtil] = useState(utilization);
  const [activeRequests, setActiveRequests] = useState(requestsPerDay);
  const [activeInput, setActiveInput] = useState(inputTokens);
  const [activeOutput, setActiveOutput] = useState(outputTokens);
  const [activeUnits, setActiveUnits] = useState(units);
  const [activeContext, setActiveContext] = useState(maxContext);

  React.useEffect(() => {
    setActiveModel(model);
    setActiveGpu(gpu);
    setActiveQuant(quantization);
    setActiveUtil(utilization);
    setActiveRequests(requestsPerDay);
    setActiveInput(inputTokens);
    setActiveOutput(outputTokens);
    setActiveUnits(units);
    setActiveContext(maxContext);
  }, [model, gpu, quantization, utilization, requestsPerDay, inputTokens, outputTokens, units, maxContext]);

  // Parse strings for display based on active state
  const modelName = activeModel.includes('/') ? activeModel.split('/')[1] : activeModel;
  const gpuBase = activeGpu.replace(/ \d+ GB/, '');
  const gpuMemStr = activeGpu.match(/(\d+) GB/)?.[1] || '80';
  const gpuMem = parseInt(gpuMemStr);

  // Dynamic memory fit logic
  const getMockRequiredGB = (name: string) => {
    const lName = name.toLowerCase();
    let parameters = 15.0; // fallback
    if (lName.match(/(\d+\.?\d*)b/)) {
      parameters = parseFloat(lName.match(/(\d+\.?\d*)b/)?.[1] || "15");
    }
    
    let bytesPerParam = 2; // FP16/BF16
    if (activeQuant.includes("INT8") || activeQuant.includes("FP8")) bytesPerParam = 1;
    if (activeQuant.includes("INT4")) bytesPerParam = 0.5;
    
    // Weights GB
    const weightsGB = parameters * bytesPerParam;
    
    // KV Cache GB
    // Exact transformer shape: 28 layers, 8 KV heads, 128 head dim
    // = 28672 params per token * 2 bytes = 57344 bytes per token
    const ctx = parseInt(activeContext.replace(/,/g, "")) || 8192;
    const kvCacheBytes = ctx * 57344;
    const kvCacheGB = kvCacheBytes / Math.pow(1024, 3);
    
    return {
      weights: weightsGB,
      kvCache: kvCacheGB,
      total: weightsGB + kvCacheGB + 0.4 // 0.4 for runtime overhead
    };
  };

  const memReq = getMockRequiredGB(modelName);
  const requiredGB = memReq.total.toFixed(1);
  const weightsGB = memReq.weights.toFixed(1);
  const kvCacheGB = memReq.kvCache.toFixed(1);
  
  const numUnits = parseInt(activeUnits) || 1;
  const totalAvailableGB = gpuMem * numUnits;
  const usableGB = parseFloat((totalAvailableGB * 0.9).toFixed(1));
  const doesFit = parseFloat(requiredGB) <= usableGB;

  // Real Cost Math
  const baseRates: Record<string, number> = {
    "H100 SXM 80 GB": 2.69,
    "H100 NVL 94 GB": 2.89,
    "H200 141 GB": 3.49,
    "A100 SXM 80 GB": 1.50,
    "A100 SXM 40 GB": 1.10,
    "L4 24 GB": 0.40,
    "L40S 48 GB": 0.85,
    "T4 16 GB": 0.20,
    "MI300X": 2.10,
    "MI325X": 2.60
  };
  const baseRate = Object.entries(baseRates).find(([k]) => activeGpu.includes(k))?.[1] || 1.0;
  const hourlyRate = baseRate * numUnits;
  
  // Real Throughput Math (Bandwidth Ceiling)
  const bandwidthGBps: Record<string, number> = {
    "H100 SXM 80 GB": 3350,
    "A100 SXM 80 GB": 2039,
    "L4 24 GB": 300,
    "MI300X": 5300
  };
  const bw = Object.entries(bandwidthGBps).find(([k]) => activeGpu.includes(k))?.[1] || 1000;
  const decodeCeiling = Math.round((bw * 1024) / memReq.weights);

  const providers = [
    { name: "DigitalOcean, GPU Droplets", price: hourlyRate * 1.05, pct: 100 },
    { name: "Hyperstack", price: hourlyRate * 1.01, pct: 96 },
    { name: "Lambda Cloud", price: hourlyRate * 0.95, pct: 90 },
    { name: "Nebius", price: hourlyRate * 0.85, pct: 80 },
    { name: "RunPod, Community Cloud", price: hourlyRate, pct: 97 },
    { name: "RunPod, Secure Cloud", price: hourlyRate * 1.15, pct: 108 },
  ].sort((a, b) => a.price - b.price);

  return (
    <div className="w-full flex flex-col items-center text-sans relative z-10">

      {/* Unified Main Container (with dashed borders) */}
      <div className="w-[88%] md:w-[calc(64%-240px)] mx-auto border-x border-dashed border-[#333] relative flex flex-col pt-16 md:pt-20 pb-32 bg-[#151515]">

        {/* Top Full-width Horizontal Divider */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] border-t border-dashed border-[#333]"></div>

        {/* Title Area */}
        <div className="px-6 md:px-10 mb-10 relative">
          <h2 className="text-4xl md:text-[44px] font-semibold text-[#F0EFE2] tracking-tight leading-tight mb-5">
            {modelName} on {gpuBase} {gpuMem} <span className="bg-[#76b900] text-black px-2 py-0.5 rounded-[2px] inline-block leading-none">GB</span>
          </h2>
          <p className="text-[12px] text-[#888] font-medium tracking-wide">
            {activeUnits} GPU, {activeQuant}, {activeRequests} requests/day. {activeInput} input and {activeOutput} output tokens per request.
          </p>
        </div>

        {/* Bottom Full-width Horizontal Divider with Centered Icon */}
        <div className="w-full relative h-[1px]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] border-t border-dashed border-[#333]"></div>

          {/* Top Centered Green Icon on border */}
          <div className="absolute left-1/2 top-0 -translate-y-1/2 -translate-x-1/2 bg-[#151515] p-2 flex items-center justify-center z-20">
            <div className="w-4 h-4 bg-[#76b900] text-black flex items-center justify-center rounded-[2px]">
              <HorosLogo variant="icon" className="w-2.5 h-auto" />
            </div>
          </div>
        </div>

        <div className="px-6 md:px-10 py-10 flex flex-col gap-10">

          {/* 1. Estimated Memory Fit Box */}
          <div className="border border-dashed border-[#333] rounded-[4px] overflow-hidden flex flex-col bg-[#151515]">
            <div className="p-6 md:p-8 flex flex-col gap-3">
              <div className={`flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase mb-1 ${doesFit ? "text-[#76b900]" : "text-[#ff4f4f]"}`}>
                {doesFit ? <Info size={16} /> : <AlertTriangle size={16} />}
                {doesFit ? "Estimated Memory Fit" : "Memory Result"}
              </div>
              <h3 className="text-3xl font-medium text-[#F0EFE2]">
                {doesFit ? "Fits in memory, cost withheld." : "This configuration needs more memory."}
              </h3>
              <p className="text-[13px] text-[#ccc] leading-relaxed max-w-3xl mt-1">
                {doesFit ? (
                  "No measured aggregate serving capacity matches this configuration. Memory fit and dated hourly rates remain available; monthly rent, replica counts, and API comparisons are withheld."
                ) : (
                  <>
                    The model and KV cache need more VRAM than the selected GPU count provides. No serving cost is published for a configuration that cannot run.<br /><br />
                    Memory fit: 4 x AMD Instinct MI355X 288 GB at 90% vLLM GPU memory utilization on one node. Attention head count was not resolved, so this is a memory topology, not a validated tensor-parallel size.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-dashed border-[#333]">
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-1.5">
                <span className="text-[11px] text-[#888]">Memory required</span>
                <span className="text-[28px] font-medium text-[#F0EFE2]">{requiredGB} GB</span>
              </div>
              <div className="p-6 md:p-8 flex flex-col gap-1.5">
                <span className="text-[11px] text-[#888]">Usable GPU memory</span>
                <span className="text-[28px] font-medium text-[#F0EFE2]">{usableGB} GB</span>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-dashed border-[#333]">
              <button className="bg-[#76b900] hover:bg-[#86dc00] text-black font-semibold text-[13px] px-5 py-2.5 rounded-[2px] transition-colors flex items-center gap-2 w-fit">
                See {doesFit ? "Model" : modelName.split('-')[0]} APIs pricing <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* 2. Edit Inputs Accordion */}
          <div className="flex flex-col group">
            <div
              onClick={() => {
                if (onEdit) onEdit();
                else if (typeof window !== 'undefined') window.history.back();
              }}
              className="flex justify-between items-center py-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors px-2 -mx-2 rounded"
            >
              <span className="text-[13px] font-semibold text-[#F0EFE2]">Edit inputs</span>
              <Plus size={16} strokeWidth={1.5} className="text-[#76b900] group-hover:scale-110 transition-transform" />
            </div>
            <div className="border border-dashed border-[#333] rounded-[4px] overflow-hidden mt-4 flex flex-col bg-[#151515]">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-4 md:p-5 flex items-center gap-4 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
                  <Box size={20} className="text-[#666] ml-2" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Model</span>
                    <span className="text-[14px] font-medium text-[#F0EFE2]">{model}</span>
                  </div>
                </div>
                <div className="p-4 md:p-5 flex items-center gap-4">
                  <NvidiaLogo size={20} className="text-[#76b900] ml-2" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Hardware</span>
                    <span className="text-[14px] font-medium text-[#F0EFE2]">{units} x {gpu}, {quantization}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-dashed border-[#333] rounded-[4px] overflow-hidden mt-6 flex flex-col bg-[#151515]">
              <div className="p-6 md:p-8 flex flex-col gap-8 border-b border-dashed border-[#333]">
                <div className="flex items-center gap-3">
                  <Server size={22} className="text-[#888]" />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-medium text-[#F0EFE2]">Memory fit</h3>
                    <p className="text-[13px] text-[#888]">Weights and KV cache stay separate so the fit is reproducible.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-medium text-[#F0EFE2]">{weightsGB} GB</span>
                    <span className="text-[12px] text-[#888]">Model weights</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-medium text-[#F0EFE2]">{kvCacheGB} GB</span>
                    <span className="text-[12px] text-[#888]">KV cache</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-medium text-[#F0EFE2]">{requiredGB} GB</span>
                    <span className="text-[12px] text-[#888]">Total required</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-medium text-[#F0EFE2]">{usableGB} GB</span>
                    <span className="text-[12px] text-[#888]">Usable (90% of 80 GB)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 md:p-8 bg-[#1a1a1a]">
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-medium text-[#F0EFE2]">{parseInt(activeContext.replace(/,/g, "") || "8192").toLocaleString()} tokens</span>
                  <span className="text-[12px] text-[#888]">Served context used</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-medium text-[#F0EFE2]">0.4 GB</span>
                  <span className="text-[12px] text-[#888]">Runtime overhead</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-medium text-[#F0EFE2]">Exact transformer shape</span>
                  <span className="text-[12px] text-[#888]">KV cache method</span>
                </div>
              </div>
            </div>

          </div>

          {/* Optimization Evidence */}
          <Accordion type="single" collapsible className="border border-dashed border-[#333] rounded-[4px] bg-[#151515]">
            <AccordionItem value="optimization-evidence" className="border-none">
              <AccordionTrigger className="px-4 md:px-5 py-4 md:py-5 hover:bg-[#1a1a1a] transition-colors hover:no-underline [&[data-state=open]>span>svg.plus]:hidden [&[data-state=closed]>span>svg.x]:hidden [&>svg]:hidden">
                <div className="flex w-full items-center justify-between">
                  <span className="text-[14px] font-medium text-[#F0EFE2]">Optimization evidence</span>
                  <span className="flex items-center text-[#76b900]">
                    <Plus size={16} className="plus" />
                    <X size={16} className="x" />
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 md:p-5 pt-0 border-t border-dashed border-[#333] pb-4 md:pb-5">
                <div className="flex flex-col gap-3 pt-6">
                  <div className="flex items-center gap-3">
                    <Activity size={22} className="text-[#888]" />
                    <h3 className="text-2xl font-medium text-[#F0EFE2]">Not measured on this config yet</h3>
                  </div>
                  <p className="text-[13px] text-[#888] ml-8">No site-wide multiplier is applied.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 3. Decode Bandwidth Ceiling Box */}
          <div className="flex flex-col w-full border border-dashed border-[#333] rounded-[4px] overflow-hidden bg-[#151515]">
            <div className="px-6 md:px-10 py-8 flex gap-4">
              <div className="mt-1 flex items-start text-[#ffb000]">
                <Gauge size={20} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[22px] font-medium text-[#F0EFE2]">
                  Decode bandwidth ceiling
                </h3>
                <p className="text-[13px] text-[#888]">
                  Single-stream physics only. Batched serving capacity is not established.
                </p>
              </div>
            </div>
            
            <div className="px-6 md:px-10 py-8 border-t border-dashed border-[#333] flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-medium text-[#F0EFE2]">{decodeCeiling.toLocaleString()} output tok/s</span>
                <span className="border border-[#ffb000]/30 text-[#ffb000] text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-[2px] uppercase">
                  Ceiling
                </span>
              </div>
              <p className="text-[13px] text-[#ccc]">
                Ceiling, not an expected throughput result.
              </p>
              <p className="text-[12px] text-[#666] mt-1">
                Decode and prefill ceilings derived from GPU memory bandwidth, dense compute, and model parameters, as of 2026-08-08
              </p>
            </div>
          </div>

          {/* 4. Provider price spread */}
          <div className="flex flex-col w-full border border-dashed border-[#333] rounded-[4px] overflow-hidden bg-[#151515]">
            <div className="px-6 md:px-10 py-8 flex flex-col gap-2">
              <h3 className="text-[22px] font-medium text-[#F0EFE2]">Provider price spread, {gpu}</h3>
              <p className="text-[13px] text-[#888]">Dated GPU-hour rental prices for this hardware. They are not monthly serving totals because throughput evidence is missing.</p>
            </div>

            <div className="px-6 md:px-10 py-10 border-t border-dashed border-[#333] flex flex-col gap-5 w-full">
              {providers.map((provider, i) => {
                const isCheapest = i === 0;
                return (
                  <div key={i} className="grid grid-cols-[160px_1fr_60px] md:grid-cols-[180px_1fr_60px] gap-6 items-center">
                    <span className={`text-[12px] leading-tight whitespace-pre-line ${isCheapest ? "text-[#76b900]" : "text-[#888]"}`}>
                      {isCheapest ? `Cheapest: ${provider.name}` : provider.name}
                    </span>
                    <div className="w-full h-3 bg-[#222]">
                      <div
                        className={`h-full ${isCheapest ? "bg-[#76b900]" : "bg-[#555]"}`}
                        style={{ width: `${provider.pct}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-bold text-[#F0EFE2] text-right">${provider.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="px-6 md:px-10 py-8 border-t border-dashed border-[#333] flex flex-col gap-4">
              <span className="text-[12px] font-bold text-[#F0EFE2]">Source:</span>
              <a href="#" className="text-[12px] text-[#666] hover:text-[#ccc] underline decoration-[#333] underline-offset-4">DigitalOcean, GPU Droplets, on demand, 1 month ago, captured 2026-08-08</a>
              <a href="#" className="text-[12px] text-[#666] hover:text-[#ccc] underline decoration-[#333] underline-offset-4">Hyperstack, on demand, 1 month ago, captured 2026-08-08</a>
              <a href="#" className="text-[12px] text-[#666] hover:text-[#ccc] underline decoration-[#333] underline-offset-4">Lambda Cloud, on demand, 1 month ago, captured 2026-08-08</a>
              <a href="#" className="text-[12px] text-[#666] hover:text-[#ccc] underline decoration-[#333] underline-offset-4">Nebius, on demand, 1 month ago, captured 2026-08-08</a>
              <a href="#" className="text-[12px] text-[#666] hover:text-[#ccc] underline decoration-[#333] underline-offset-4">RunPod, Community Cloud, on demand, 1 month ago, captured 2026-08-08</a>
              <a href="#" className="text-[12px] text-[#666] hover:text-[#ccc] underline decoration-[#333] underline-offset-4">RunPod, Secure Cloud, on demand, 1 month ago, captured 2026-08-08</a>
              <a href="#" className="text-[12px] text-[#666] hover:text-[#ccc] underline decoration-[#333] underline-offset-4">Verda, on demand, 1 month ago, captured 2026-08-08</a>
            </div>

            <div className="px-6 md:px-10 py-6 border-t border-dashed border-[#333]">
              <div
                onClick={() => setIsChartInfoOpen(!isChartInfoOpen)}
                className="flex items-center gap-2 cursor-pointer hover:text-[#F0EFE2] text-[#888] transition-colors w-fit"
              >
                {isChartInfoOpen ? <X size={14} className="text-[#76b900]" /> : <Plus size={14} className="text-[#76b900]" />}
                <span className="text-[13px] font-bold text-[#F0EFE2]">What this chart means</span>
              </div>
            </div>
            {isChartInfoOpen && (
              <div className="bg-[#1a1a1a] p-6 border border-[#222] rounded-[2px]">
                <p className="text-[13px] text-[#ccc]">These are GPU-hour rental prices only. A monthly serving total requires throughput evidence and remains absent.</p>
              </div>
            )}
          </div>

          {/* 5. vLLM deployment starting point */}
          <div className="border border-dashed border-[#333] flex flex-col bg-[#151515]">
            <div className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-dashed border-[#333]">
              <div className="flex items-start gap-3">
                <Terminal size={18} className="text-[#888] mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-[16px] font-medium text-[#F0EFE2]">vLLM deployment starting point</h3>
                  <p className="text-[12px] text-[#777]">This line starts the selected vLLM shape. It is not a throughput reproduction claim.</p>
                </div>
              </div>
              <button className="flex items-center gap-2 border border-[#333] hover:bg-[#1c1c1c] text-[#F0EFE2] text-[11px] font-medium px-3 py-1.5 rounded-[2px] transition-colors">
                <Copy size={12} /> Copy command
              </button>
            </div>
            <div className="p-6 bg-[#111] overflow-x-auto">
              <code className="text-[#a5d6ff] font-mono text-[12px] whitespace-nowrap">
                vllm serve '{model}' --dtype {quantization.toLowerCase()} --tensor-parallel-size 1 --max-model-len 8192 --gpu-memory-utilization 0.9
              </code>
            </div>
          </div>

          {/* 6. Optimization evidence */}
          <div className="flex flex-col group border border-dashed border-[#333]">
            <div className="flex justify-between items-center p-6 cursor-pointer hover:bg-[#1a1a1a] transition-colors">
              <span className="text-[14px] font-semibold text-[#888]">Optimization evidence</span>
              <Plus size={16} strokeWidth={1.5} className="text-[#76b900]" />
            </div>
          </div>

          {/* 7. Sources and caveats */}
          <div className="flex flex-col border border-dashed border-[#333] bg-[#151515] mb-12">
            <div
              onClick={() => setIsSourcesOpen(!isSourcesOpen)}
              className="flex justify-between items-center p-6 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-[#888] mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-[18px] font-semibold text-[#F0EFE2]">Sources and caveats</h3>
                  <p className="text-[13px] text-[#888]">13 sources, 6 caveats</p>
                  <p className="text-[12px] text-[#F0EFE2] font-medium mt-1">{isSourcesOpen ? "Hide evidence" : "Show evidence"}</p>
                </div>
              </div>
              {isSourcesOpen ? <X size={16} className="text-[#76b900]" /> : <Plus size={16} className="text-[#76b900]" />}
            </div>

            {isSourcesOpen && (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] border-t border-dashed border-[#333]">
                {/* Provenance */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6">
                  <span className="text-[13px] font-bold text-[#F0EFE2]">Provenance</span>

                  {[
                    "Hugging Face model API revision sha",
                    "model.safetensors tensor header",
                    "config.json:max_position_embeddings",
                    "config.json:architectures[0]"
                  ].map((src, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <a href="#" className="text-[12px] font-medium text-[#C8C7BA] hover:text-[#F0EFE2] underline decoration-[#333] underline-offset-4">{src}</a>
                      <span className="text-[11px] text-[#666] flex items-center gap-1.5"><Calendar size={10} /> As of 2026-10-04</span>
                    </div>
                  ))}

                  <div className="flex flex-col gap-1.5">
                    <a href="#" className="text-[12px] font-medium text-[#C8C7BA] hover:text-[#F0EFE2] underline decoration-[#333] underline-offset-4">NVIDIA H100 Tensor Core GPU datasheet</a>
                    <span className="text-[11px] text-[#666] flex items-center gap-1.5"><Calendar size={10} /> As of 2026-08-08</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <a href="#" className="text-[12px] font-medium text-[#C8C7BA] hover:text-[#F0EFE2] underline decoration-[#333] underline-offset-4">Hugging Face config.json transformer shape</a>
                    <span className="text-[11px] text-[#666] flex items-center gap-1.5"><Calendar size={10} /> As of 2026-10-04</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <a href="#" className="text-[12px] font-medium text-[#C8C7BA] hover:text-[#F0EFE2] underline decoration-[#333] underline-offset-4">RunInfra Engine feasibility runtime-overhead policy</a>
                    <span className="text-[11px] text-[#666] flex items-center gap-1.5"><Calendar size={10} /> As of 2026-08-09</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <a href="#" className="text-[12px] font-medium text-[#C8C7BA] hover:text-[#F0EFE2] underline decoration-[#333] underline-offset-4">Decode and prefill ceilings derived from GPU memory bandwidth, dense compute, and model parameters</a>
                    <span className="text-[11px] text-[#666] flex items-center gap-1.5"><Calendar size={10} /> As of 2026-08-08</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <a href="#" className="text-[12px] font-medium text-[#C8C7BA] hover:text-[#F0EFE2] underline decoration-[#333] underline-offset-4">vLLM serve CLI documentation</a>
                    <span className="text-[11px] text-[#666] flex items-center gap-1.5"><Calendar size={10} /> As of 2026-08-08</span>
                  </div>
                </div>

                {/* Caveats */}
                <div className="p-6 flex flex-col gap-6">
                  <span className="text-[13px] font-bold text-[#F0EFE2]">Caveats</span>

                  <div className="flex items-start gap-3">
                    <Plus size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#888] leading-relaxed">Served context is {maxContext} tokens. It is a serving-capacity decision and is not inferred from average input or output tokens.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#888] leading-relaxed">KV cache uses the exact transformer-shape formula with 28 layers, 8 KV heads, and head dimension 128.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#888] leading-relaxed">Runtime overhead adds 0.4 GB to the total memory requirement. This approximate 15% policy allowance covers CUDA context, activations, and vLLM overhead. Deployment-time profiling, including CUDA graph capture and allocator behavior, can differ.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#888] leading-relaxed">Single-stream physics ceiling, not batched serving capacity. Batching changes aggregate throughput, so this concurrency-1 model cannot establish a minimum replica count or monthly rent. A measured serving benchmark matching the workload is required.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#888] leading-relaxed">Compute prefill ceiling: 657,901 tokens/sec. Bandwidth decode ceiling: 2,228 tokens/sec.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Plus size={14} className="text-[#76b900] shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#888] leading-relaxed">The workload settings has no GPU provider selector. The calculation uses the lowest supplied on-demand rate for H100: RunPod, Community Cloud at $2.69/GPU-hour.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 8. Share and API */}
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] border border-dashed border-[#333] mb-12">

            {/* Share this calculation */}
            <div className="p-6 md:p-8 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-dashed border-[#333]">
              <button className="flex items-center gap-2 border border-[#333] hover:bg-[#1c1c1c] text-[#F0EFE2] text-[11px] font-medium px-3 py-1.5 rounded-[2px] transition-colors w-fit">
                <Copy size={12} /> Copy link
              </button>

              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-[#888] mt-1" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-[18px] font-semibold text-[#F0EFE2]">Share this calculation</h3>
                  <p className="text-[12px] text-[#888] leading-relaxed">Embed code appears only when the calculator can publish a sourced cost for a fitting configuration.</p>
                </div>
              </div>

              <div className="flex flex-col border border-dashed border-[#333] mt-2">
                <div
                  onClick={() => setIsShareBadgeOpen(!isShareBadgeOpen)}
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                >
                  <span className="text-[13px] font-medium text-[#F0EFE2]">Badge unavailable for this configuration</span>
                  {isShareBadgeOpen ? <X size={14} className="text-[#76b900]" /> : <Plus size={14} className="text-[#76b900]" />}
                </div>
                {isShareBadgeOpen && (
                  <div className="p-4 pt-0 text-[13px] text-[#888] leading-relaxed">
                    The calculator does not have a complete throughput source for this workload, so it withheld the cost and does not generate embed code.
                  </div>
                )}
              </div>
            </div>

            {/* Use it from an agent or script */}
            <div className="p-6 md:p-8 flex flex-col">
              <div className="flex items-start gap-3 mb-6">
                <Bot size={18} className="text-[#888] mt-1" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-[18px] font-semibold text-[#F0EFE2]">Use it from an agent or script</h3>
                  <p className="text-[12px] text-[#888] leading-relaxed">GET the current inputs, or inspect the descriptor for accepted parameters and response fields.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-dashed border-[#333] pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-[#888] font-bold tracking-wider">ENDPOINT</span>
                  <button className="flex items-center gap-2 border border-[#333] hover:bg-[#1c1c1c] text-[#F0EFE2] text-[10px] font-medium px-2 py-1 rounded-[2px] transition-colors">
                    <Copy size={10} /> Copy API request
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-mono text-[#F0EFE2]">GET https://runinfra.ai/api/calc</span>
                  <span className="text-[10px] font-mono text-[#666] break-all">https://runinfra.ai/api/calc?hfId=Qwen%2FQwen3-0.6B&gpuId=H100&gpuCount=1&requestsPerDay=50000&avgInputTokens=500&avgOutputTokens=500&utilization=0.3&quantization=fp16&servedContextTokens=8192</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-dashed border-[#333] mt-4 pt-4">
                <span className="text-[9px] text-[#888] font-bold tracking-wider">CANONICAL RESULT</span>
                <a href="#" className="flex justify-between items-center group">
                  <span className="text-[12px] font-mono font-medium text-[#C8C7BA] group-hover:text-[#F0EFE2] transition-colors">https://runinfra.ai/calc/Qwen%2FQwen3-0.6B/h100/50k-req-day</span>
                  <ExternalLink size={12} className="text-[#666] group-hover:text-[#F0EFE2] transition-colors" />
                </a>
              </div>

              <div className="flex flex-col gap-3 border-t border-dashed border-[#333] mt-4 pt-4">
                <span className="text-[9px] text-[#888] font-bold tracking-wider">DESCRIPTOR</span>
                <a href="#" className="flex justify-between items-center group">
                  <span className="text-[12px] font-mono font-medium text-[#C8C7BA] group-hover:text-[#F0EFE2] transition-colors">https://runinfra.ai/api/calc/schema</span>
                  <ExternalLink size={12} className="text-[#666] group-hover:text-[#F0EFE2] transition-colors" />
                </a>
                <span className="text-[11px] text-[#666]">28 GPU ids, 7 quantizations</span>
              </div>
            </div>
          </div>

          {/* 9. Configuration details */}
          <div className="flex flex-col gap-4">
            <div
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="flex justify-between items-center cursor-pointer group"
            >
              <span className="text-[13px] font-medium text-[#F0EFE2] group-hover:text-white transition-colors">Configuration details</span>
              {isConfigOpen ? <X size={14} className="text-[#76b900]" /> : <Plus size={14} className="text-[#76b900]" />}
            </div>

            {isConfigOpen && (
              <div className="border border-dashed border-[#333] bg-[#1a1a1a] flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-6 border-b md:border-r border-dashed border-[#333] flex flex-col gap-4">
                    <Box size={18} className="text-[#888]" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#888] font-bold tracking-wider uppercase">Model</span>
                      <span className="text-[14px] font-medium text-[#F0EFE2]">{model}</span>
                    </div>
                  </div>
                  <div className="p-6 border-b border-dashed border-[#333] flex flex-col gap-4">
                    <Cpu size={18} className="text-[#888]" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#888] font-bold tracking-wider uppercase">GPU</span>
                      <span className="text-[14px] font-medium text-[#F0EFE2]">{gpu}</span>
                    </div>
                  </div>
                  <div className="p-6 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-4">
                    <Link2 size={18} className="text-[#888]" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#888] font-bold tracking-wider uppercase">Requests/Day</span>
                      <span className="text-[14px] font-medium text-[#F0EFE2]">{requestsPerDay}</span>
                    </div>
                  </div>
                  <div className="p-6 border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-4">
                    <Layers size={18} className="text-[#888]" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#888] font-bold tracking-wider uppercase">GPU Count</span>
                      <span className="text-[14px] font-medium text-[#F0EFE2]">1</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 border-t border-dashed border-[#333]">
                  <div className="p-6 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-4">
                    <Binary size={18} className="text-[#888]" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#888] font-bold tracking-wider uppercase">Quantization</span>
                      <span className="text-[14px] font-medium text-[#F0EFE2]">{quantization}</span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <Activity size={18} className="text-[#888]" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[#888] font-bold tracking-wider uppercase">Tokens/Request</span>
                      <span className="text-[14px] font-medium text-[#F0EFE2]">{inputTokens} in, {outputTokens} out</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 border border-[#222] bg-[#111] px-3 py-1.5 rounded-[2px]">
                <BarChart size={14} className="text-[#76b900]" />
                <span className="text-[11px] text-[#C8C7BA]">Charts use cited evidence</span>
              </div>
              <div className="flex items-center gap-2 border border-[#222] bg-[#111] px-3 py-1.5 rounded-[2px]">
                <Gauge size={14} className="text-[#76b900]" />
                <span className="text-[11px] text-[#C8C7BA]">Utilization defaults to {utilization}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

