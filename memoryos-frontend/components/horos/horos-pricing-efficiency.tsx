"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Zap, Banknote, Activity } from "lucide-react";
import Link from "next/link";
import { GLMLogo, NvidiaLogo, QwenLogo, AuthorMonogram, DeepSeekLogo, MetaLogo, MistralLogo, PhysicalIntelligenceLogo, HorosLogo } from "@/components/horos/primitives/brand-icons";
import { CAPABILITIES } from "@/lib/capabilities-data";

// Extended Mock data for multi-dimensional optimization
const MODELS = [
  {
    id: "horos-argvis",
    name: "Horos Argvis",
    brand: <HorosLogo size={28} className="text-[#F0EFE2]" />,

    // Cost
    listPrice: 0.12,
    effectivePrice: 0.010,
    multiplier: "12.0x",
    cacheHit: 99.4,
    cachedInputPrice: 0.01,
    outputPrice: 0.24,

    // Latency (TTFT)
    standardLatency: 420,
    optimizedLatency: 42,
    latencyMultiplier: "10.0x",

    // Throughput (tok/s)
    standardThroughput: 32,
    optimizedThroughput: 310.0,
    throughputMultiplier: "9.7x",

    tags: ["Frontier Lab", "Physical Control", "Spatial Reasoning", "Multimodal"],
    trending: true,
    frontierLab: true,
  },
  {
    id: "glm-5-3-flash",
    name: "GLM-4-9B",
    brand: <GLMLogo size={28} />,

    // Cost
    listPrice: 0.10,
    effectivePrice: 0.011,
    multiplier: "9.0x",
    cacheHit: 98.9,
    cachedInputPrice: 0.01,
    outputPrice: 0.40,

    // Latency (TTFT)
    standardLatency: 650,
    optimizedLatency: 85,
    latencyMultiplier: "7.6x",

    // Throughput (tok/s)
    standardThroughput: 35,
    optimizedThroughput: 254.1,
    throughputMultiplier: "7.2x",

    tags: ["Reasoning", "Tool Use", "Multimodal", "Long Context"],
    trending: true
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Qwen2.5-Coder-32B",
    brand: <QwenLogo size={28} />,

    // Cost
    listPrice: 0.05,
    effectivePrice: 0.015,
    multiplier: "3.4x",
    cacheHit: 87.7,
    cachedInputPrice: 0.01,
    outputPrice: 0.15,

    // Latency
    standardLatency: 480,
    optimizedLatency: 62,
    latencyMultiplier: "7.7x",

    // Throughput
    standardThroughput: 85,
    optimizedThroughput: 540.9,
    throughputMultiplier: "6.3x",

    tags: ["Reasoning", "Tool Use", "Code"],
    trending: false
  },
  {
    id: "qwen3-8-27b",
    name: "InternVL2",
    brand: <MetaLogo size={28} />, // Placeholder for OpenGVLab

    listPrice: 0.10,
    effectivePrice: 0.014,
    multiplier: "6.8x",
    cacheHit: 96.1,
    cachedInputPrice: 0.01,
    outputPrice: 0.40,

    standardLatency: 520,
    optimizedLatency: 75,
    latencyMultiplier: "6.9x",

    standardThroughput: 25,
    optimizedThroughput: 140,
    throughputMultiplier: "5.6x",

    tags: ["Reasoning", "Tool Use", "Multimodal"],
    trending: false
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    brand: <DeepSeekLogo size={28} />,

    listPrice: 0.10,
    effectivePrice: 0.012,
    multiplier: "8.6x",
    cacheHit: 98.3,
    cachedInputPrice: 0.01,
    outputPrice: 0.40,

    standardLatency: 600,
    optimizedLatency: 70,
    latencyMultiplier: "8.5x",

    standardThroughput: 30,
    optimizedThroughput: 216,
    throughputMultiplier: "7.2x",

    tags: ["Reasoning", "Tool Use", "Multimodal"],
    trending: false
  },
  {
    id: "llama-3-1-405b",
    name: "Llama-3.1-405B",
    brand: <MetaLogo size={28} />,

    listPrice: 0.80,
    effectivePrice: 0.12,
    multiplier: "6.6x",
    cacheHit: 91.2,
    cachedInputPrice: 0.08,
    outputPrice: 2.00,

    standardLatency: 1200,
    optimizedLatency: 185,
    latencyMultiplier: "6.4x",

    standardThroughput: 15,
    optimizedThroughput: 120,
    throughputMultiplier: "8.0x",

    tags: ["Reasoning", "Tool Use", "Planning"],
    trending: true
  },
  {
    id: "mistral-large-2",
    name: "OLMo-2-13B",
    brand: <MistralLogo size={28} />, // Placeholder for AllenAI

    listPrice: 2.00,
    effectivePrice: 0.53,
    multiplier: "3.7x",
    cacheHit: 82.4,
    cachedInputPrice: 0.20,
    outputPrice: 6.00,

    standardLatency: 850,
    optimizedLatency: 220,
    latencyMultiplier: "3.8x",

    standardThroughput: 18,
    optimizedThroughput: 60,
    throughputMultiplier: "3.3x",

    tags: ["Reasoning", "Tool Use", "Language"],
    trending: false
  },
  {
    id: "pi0-robotics",
    name: "Physical Intelligence pi0",
    brand: <PhysicalIntelligenceLogo size={28} />,

    listPrice: 0.15,
    effectivePrice: 0.02,
    multiplier: "7.5x",
    cacheHit: 88.5,
    cachedInputPrice: 0.01,
    outputPrice: 0.50,

    standardLatency: 450,
    optimizedLatency: 45,
    latencyMultiplier: "10.0x",

    standardThroughput: 20,
    optimizedThroughput: 85,
    throughputMultiplier: "4.2x",

    tags: ["Physical Control", "Spatial Reasoning", "Proprioception"],
    trending: true
  },
  {
    id: "nvidia-cosmos",
    name: "Cosmos-1.0",
    brand: <NvidiaLogo size={28} />,

    listPrice: 0.25,
    effectivePrice: 0.04,
    multiplier: "6.2x",
    cacheHit: 84.1,
    cachedInputPrice: 0.02,
    outputPrice: 0.80,

    standardLatency: 380,
    optimizedLatency: 35,
    latencyMultiplier: "10.8x",

    standardThroughput: 12,
    optimizedThroughput: 45,
    throughputMultiplier: "3.7x",

    tags: ["World Modeling", "Simulation", "Video Understanding"],
    trending: false
  }
];

// Get unique tags and their counts for dynamic filters
const TAG_COUNTS = MODELS.reduce((acc, model) => {
  model.tags.forEach(tag => {
    acc[tag] = (acc[tag] || 0) + 1;
  });
  return acc;
}, {} as Record<string, number>);

const UNIQUE_TAGS = Object.entries(TAG_COUNTS).sort((a, b) => b[1] - a[1]); // Sort by frequency

// Mapping functions for each dimension (approximate log scales)
const mapPriceToPercent = (price: number) => {
  if (price <= 0.01) return 0;
  if (price <= 0.05) return 0 + ((price - 0.01) / 0.04) * 25;
  if (price <= 0.20) return 25 + ((price - 0.05) / 0.15) * 25;
  if (price <= 1.00) return 50 + ((price - 0.20) / 0.80) * 25;
  if (price <= 3.00) return 75 + ((price - 1.00) / 2.00) * 25;
  return 100;
};

const mapLatencyToPercent = (latency: number) => {
  if (latency <= 10) return 0;
  if (latency <= 50) return 0 + ((latency - 10) / 40) * 25;
  if (latency <= 200) return 25 + ((latency - 50) / 150) * 25;
  if (latency <= 800) return 50 + ((latency - 200) / 600) * 25;
  if (latency <= 2000) return 75 + ((latency - 800) / 1200) * 25;
  return 100;
};

const mapThroughputToPercent = (tps: number) => {
  if (tps <= 10) return 0;
  if (tps <= 50) return 0 + ((tps - 10) / 40) * 25;
  if (tps <= 200) return 25 + ((tps - 50) / 150) * 25;
  if (tps <= 800) return 50 + ((tps - 200) / 600) * 25;
  if (tps <= 3000) return 75 + ((tps - 800) / 2200) * 25;
  return 100;
};

type OptimizationDimension = "cost" | "latency" | "throughput";

export function HorosPricingEfficiency() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dimension, setDimension] = useState<OptimizationDimension>("cost");

  const filteredModels = MODELS.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === "all") return true;
    return m.tags.includes(activeFilter);
  });

  return (
    <section id="intelligence-optimization" className="w-full flex flex-col py-20 border-t border-dashed border-[#222] scroll-mt-24">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan-line {
          0% { left: 0%; transform: translateX(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; transform: translateX(0%); opacity: 0; }
        }
        @keyframes glitch-enter {
          0% { transform: skew(0deg); opacity: 0; filter: blur(4px); }
          10% { transform: skew(10deg); opacity: 1; filter: drop-shadow(2px 0px 0px rgba(117,191,0,0.8)) drop-shadow(-2px 0px 0px rgba(255,255,255,0.8)); }
          20% { transform: skew(-15deg); filter: drop-shadow(2px 0px 0px rgba(117,191,0,0.8)) drop-shadow(-2px 0px 0px rgba(255,255,255,0.8)); }
          30% { transform: skew(5deg); filter: drop-shadow(2px 0px 0px rgba(117,191,0,0.8)) drop-shadow(-2px 0px 0px rgba(255,255,255,0.8)); }
          40% { transform: skew(0deg); filter: blur(0px); }
          100% { transform: skew(0deg); filter: blur(0px); }
        }
        .glitch-text {
          animation: glitch-enter 0.5s ease-out forwards;
          display: inline-flex;
        }
      `}} />

      {/* Header */}
      <div className="mb-12">
        <h2 className="text-5xl lg:text-[64px] font-medium tracking-tight leading-[1.1] text-[#F0EFE2] mb-6">
          Intelligence <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative -ml-1">Optimization</span>
        </h2>
        <p className="text-[16px] text-[#A0A0A0] max-w-2xl">
          Optimize intelligence across models, compute, tools, runtimes, and execution paths—measured against the verified outcome of each mission.
        </p>
      </div>

      {/* Manual Dimension Text Selector */}
      <div className="flex items-center gap-6 mb-10 text-[12px] font-bold tracking-widest uppercase border-b border-dashed border-[#333] pb-4 w-fit">
        <button
          onClick={() => setDimension("cost")}
          className={`flex items-center gap-2 transition-colors ${dimension === "cost" ? "text-[#75bf00]" : "text-[#555] hover:text-[#F0EFE2]"}`}
        >
          <Banknote size={16} /> Cost Efficiency
        </button>
        <button
          onClick={() => setDimension("latency")}
          className={`flex items-center gap-2 transition-colors ${dimension === "latency" ? "text-[#75bf00]" : "text-[#555] hover:text-[#F0EFE2]"}`}
        >
          <Zap size={16} /> Latency (TTFT)
        </button>
        <button
          onClick={() => setDimension("throughput")}
          className={`flex items-center gap-2 transition-colors ${dimension === "throughput" ? "text-[#75bf00]" : "text-[#555] hover:text-[#F0EFE2]"}`}
        >
          <Activity size={16} /> Throughput Scale
        </button>
      </div>      {/* Chart Area */}
      <div className="w-full mb-16 relative">
        {/* Dynamic X Axis Labels */}
        <div className="flex items-center text-[10px] text-[#666] font-mono border-b border-dashed border-[#333] pb-2 mb-0 pr-4 transition-all duration-500">
          <div className="w-[300px] shrink-0">
            {dimension === "cost" && "Price per 1M input tokens, log scale"}
            {dimension === "latency" && "Time to First Token (ms), log scale"}
            {dimension === "throughput" && "Output Tokens/sec, log scale"}
          </div>
          <div className="flex-1 relative h-4 mr-[150px]">
            {dimension === "cost" && (
              <>
                <span className="absolute left-[0%] -translate-x-1/2">$0.01</span>
                <span className="absolute left-[25%] -translate-x-1/2">$0.05</span>
                <span className="absolute left-[50%] -translate-x-1/2">$0.20</span>
                <span className="absolute left-[75%] -translate-x-1/2">$1.00</span>
                <span className="absolute left-[100%] -translate-x-1/2">$3.00</span>
              </>
            )}
            {dimension === "latency" && (
              <>
                <span className="absolute left-[0%] -translate-x-1/2">10ms</span>
                <span className="absolute left-[25%] -translate-x-1/2">50ms</span>
                <span className="absolute left-[50%] -translate-x-1/2">200ms</span>
                <span className="absolute left-[75%] -translate-x-1/2">800ms</span>
                <span className="absolute left-[100%] -translate-x-1/2">2s</span>
              </>
            )}
            {dimension === "throughput" && (
              <>
                <span className="absolute left-[0%] -translate-x-1/2">10</span>
                <span className="absolute left-[25%] -translate-x-1/2">50</span>
                <span className="absolute left-[50%] -translate-x-1/2">200</span>
                <span className="absolute left-[75%] -translate-x-1/2">800</span>
                <span className="absolute left-[100%] -translate-x-1/2">3000</span>
              </>
            )}
          </div>
        </div>

        {/* Background Vertical Grid Lines */}
        <div className="absolute top-[28px] bottom-0 left-[300px] right-[150px] pointer-events-none">
          <div className="absolute left-[0%] w-px h-full border-l border-dashed border-[#222]"></div>
          <div className="absolute left-[25%] w-px h-full border-l border-dashed border-[#222]"></div>
          <div className="absolute left-[50%] w-px h-full border-l border-dashed border-[#222]"></div>
          <div className="absolute left-[75%] w-px h-full border-l border-dashed border-[#222]"></div>
          <div className="absolute left-[100%] w-px h-full border-l border-dashed border-[#222]"></div>
        </div>

        {/* Chart Rows */}
        <div className="flex flex-col">
          {MODELS.map((model, i) => {

            // Calculate offsets based on current dimension
            let val1 = 0, val2 = 0;
            let labelOptimized = "", labelStandard = "";
            let textMultiplier = "", textSub = "";

            if (dimension === "cost") {
              val1 = mapPriceToPercent(model.effectivePrice);
              val2 = mapPriceToPercent(model.listPrice);
              labelOptimized = `Effective input $${model.effectivePrice}`;
              labelStandard = `List price $${model.listPrice.toFixed(2)}`;
              textMultiplier = model.multiplier;
              textSub = `cheaper, ${model.cacheHit}% cache hit`;
            } else if (dimension === "latency") {
              val1 = mapLatencyToPercent(model.optimizedLatency);
              val2 = mapLatencyToPercent(model.standardLatency);
              labelOptimized = `Optimized ${model.optimizedLatency}ms`;
              labelStandard = `Standard API ${model.standardLatency}ms`;
              textMultiplier = model.latencyMultiplier;
              textSub = "faster, direct RDMA";
            } else if (dimension === "throughput") {
              val1 = mapThroughputToPercent(model.standardThroughput);
              val2 = mapThroughputToPercent(model.optimizedThroughput);
              labelStandard = `Standard ${model.standardThroughput} tok/s`;
              labelOptimized = `HOROS Scale ${model.optimizedThroughput} tok/s`;
              textMultiplier = model.throughputMultiplier;
              textSub = "higher throughput";
            }

            const leftOffset = Math.min(val1, val2);
            const width = Math.abs(val1 - val2);

            // Determine which dot is green (left side for cost/latency, right side for throughput)
            const greenOffset = dimension === "throughput" ? Math.max(val1, val2) : Math.min(val1, val2);
            const grayOffset = dimension === "throughput" ? Math.min(val1, val2) : Math.max(val1, val2);

            return (
              <div key={model.id} className="relative flex items-center w-full py-8 border-b border-dashed border-[#222]">
                {/* Model Name */}
                <div className="w-[300px] flex items-center gap-3 font-bold text-[13px] text-[#F0EFE2]">
                  <span className="text-[#888] flex items-center justify-center w-8 h-8 shrink-0">{model.brand}</span>
                  <span className="truncate">{model.name}</span>
                </div>

                {/* The Bar Line */}
                <div className="flex-1 relative h-6 mr-[150px]">
                  {/* Track base */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-[1px] bg-[#333] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{ left: `${leftOffset}%`, width: `${width}%` }}
                  >
                    {/* Animated scanning beam */}
                    <div
                      className="absolute top-0 bottom-0 w-[50px] bg-gradient-to-r from-transparent via-[#75bf00] to-transparent"
                      style={{
                        animation: `scan-line ${2.5 + (i % 3) * 0.4}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  </div>

                  {/* Green Start/End Box (Optimized) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#75bf00] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10"
                    style={{ left: `${greenOffset}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-[#F0EFE2] transition-opacity duration-300">
                      {labelOptimized}
                    </div>
                  </div>

                  {/* Gray Start/End Box (Standard) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#666] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-0"
                    style={{ left: `${grayOffset}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-[#888] transition-opacity duration-300">
                      {labelStandard}
                    </div>
                  </div>
                </div>

                {/* Stats on the right */}
                <div className="absolute right-0 w-[150px] flex flex-col items-end text-right pr-4">
                  <div className="text-[18px] font-bold text-[#F0EFE2] leading-none mb-1 transition-all duration-300">{textMultiplier}</div>
                  <div className="text-[10px] text-[#666] transition-all duration-300">{textSub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[12px] text-[#666] mb-20 max-w-xl">
        Optimization paths are measured against the verified Reality Fabric, capturing end-to-end efficiency across hardware, networking, and precision configuration.
      </p>


      {/* Search and Table Area */}
      <div className="w-full flex flex-col">

        {/* Search Bar */}
        <div className="flex items-center gap-2 border-b border-dashed border-[#333] pb-4 mb-6">
          <Search size={16} className="text-[#75bf00]" />
          <input
            type="text"
            placeholder="Search intelligence systems or capabilities"
            className="bg-transparent border-none outline-none text-[#F0EFE2] text-[13px] w-full placeholder:text-[#555]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#666] whitespace-nowrap font-medium">{filteredModels.length} intelligence systems</span>
            {(search || activeFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setActiveFilter("all"); }}
                className="text-[12px] text-[#A0A0A0] hover:text-[#F0EFE2] transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Headers / Filter Tags */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12px] font-medium text-[#A0A0A0] mb-5 px-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`shrink-0 whitespace-nowrap font-medium transition-colors ${activeFilter === "all" ? "text-[#F0EFE2]" : "text-[#888] hover:text-[#F0EFE2]"}`}
          >
            Capabilities
          </button>

          {UNIQUE_TAGS.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeFilter === tag ? "bg-[#75bf00] text-[#151515] px-2.5 py-0.5 rounded-[2px] font-semibold" : "text-[#888] hover:text-[#F0EFE2]"}`}
            >
              {tag} <span className={activeFilter === tag ? "text-[#2a4500] font-bold" : "text-[#555]"}>{count}</span>
            </button>
          ))}
        </div>

        <div className="w-full h-[1px] border-t border-dashed border-[#333]"></div>

        {/* Table Rows (Clean horizontal alignment without awkward wrapping) */}
        <div className="flex flex-col">
          {filteredModels.map((model) => (
            <Link
              href={`/capabilities/${model.id}`}
              key={model.id}
              className="group flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 py-6 px-3 sm:px-4 border-b border-dashed border-[#333] hover:bg-[#1a1a1a] transition-colors cursor-pointer relative z-10"
            >
              {/* Left: Identity */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div className="mt-0.5 w-9 h-9 flex items-center justify-center shrink-0">
                  {model.brand}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[18px] font-semibold text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors truncate">
                      {model.name}
                    </h3>
                  </div>
                  <div className="text-[12px] text-[#777] mb-1.5 font-mono">{model.id}</div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {model.trending && (
                      <span className="bg-[#2a2a2a] text-[#C8C7BA] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[2px]">
                        Trending
                      </span>
                    )}
                    <span className="text-[11px] text-[#888] leading-relaxed">
                      {model.tags.join(" / ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Metrics */}
              <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-6 lg:gap-8 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-[#222]">
                {/* Execution cost */}
                <div className="flex flex-col items-start md:items-end w-16 sm:w-20">
                  <div className="text-[#F0EFE2] font-semibold text-[16px] sm:text-[17px] leading-tight">
                    <span className="text-[11px] text-[#777] font-normal mr-0.5">$</span>
                    {model.effectivePrice.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-[#777] text-left md:text-right leading-tight mt-1">
                    execution<br />cost
                  </div>
                </div>

                {/* Latency */}
                <div className="flex flex-col items-start md:items-end w-16 sm:w-20">
                  <div className="text-[#F0EFE2] font-semibold text-[16px] sm:text-[17px] leading-tight">
                    {model.optimizedLatency}
                    <span className="text-[11px] text-[#777] font-normal ml-0.5">ms</span>
                  </div>
                  <div className="text-[10px] text-[#777] text-left md:text-right leading-tight mt-1">
                    latency<br />(ttft)
                  </div>
                </div>

                {/* Success / verification */}
                <div className="flex flex-col items-start md:items-end w-18 sm:w-22">
                  <div className="text-[#F0EFE2] font-semibold text-[16px] sm:text-[17px] leading-tight">
                    {model.cacheHit}
                    <span className="text-[11px] text-[#777] font-normal ml-0.5">%</span>
                  </div>
                  <div className="text-[10px] text-[#777] text-left md:text-right leading-tight mt-1">
                    success /<br />verification
                  </div>
                </div>

                {/* Throughput */}
                <div className="flex flex-col items-start md:items-end w-20 sm:w-24">
                  <div className="text-[#F0EFE2] font-semibold text-[16px] sm:text-[17px] leading-tight">
                    {model.optimizedThroughput}
                  </div>
                  <div className="text-[10px] text-[#777] text-left md:text-right leading-tight mt-1">
                    throughput<br />(int/s)
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center justify-center w-5 text-[#555] group-hover:text-[#F0EFE2] transition-colors ml-1">
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

