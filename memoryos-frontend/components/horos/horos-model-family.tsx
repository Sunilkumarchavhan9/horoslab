"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Zap,
  Activity,
  ArrowRight,
  Eye,
  Code2,
  Mic,
  Video,
  Globe2,
  ChevronDown,
  Layers,
  Cpu,
  ShieldCheck,
  ExternalLink,
  LucideIcon,
} from "lucide-react";

type Dimension = "cost" | "latency" | "benchmark";

interface HorosFoundationModel {
  id: string;
  name: string;
  shortTag: string;
  domain: string;
  icon: LucideIcon;
  parameters: string;
  contextWindow: string;
  precision: string;
  summary: string;
  capabilities: string[];
  route: string;

  // Cost dimension
  listPrice: number;
  effectivePrice: number;
  costMultiplier: string;
  costSub: string;
  costOptimizedLabel: string;
  costStandardLabel: string;

  // Latency dimension
  standardLatency: number;
  optimizedLatency: number;
  latencyMultiplier: string;
  latencySub: string;
  latencyOptimizedLabel: string;
  latencyStandardLabel: string;

  // Benchmark dimension
  baselineScore: number;
  optimizedScore: number;
  benchmarkMultiplier: string;
  benchmarkSub: string;
  benchmarkOptimizedLabel: string;
  benchmarkStandardLabel: string;
}

const HOROS_FOUNDATION_MODELS: HorosFoundationModel[] = [
  {
    id: "reality-decoder",
    name: "Horos Reality Decoder",
    shortTag: "128B MoE",
    domain: "Physical Reality & Sensor Decoding",
    icon: Eye,
    parameters: "128B Mixture-of-Experts",
    contextWindow: "1M Spatial Tokens",
    precision: "FP8 / BF16 Native",
    summary:
      "A foundation perception model trained across multi-view camera feeds, LiDAR point clouds, acoustic sensors, and industrial telemetry. Decodes unstructured physical world streams into continuous spatial-temporal state for robots, vehicles, and automation agents.",
    capabilities: [
      "Multi-camera spatial depth & geometry reconstruction",
      "Real-time sensor fusion across heterogeneous telemetry",
      "Physical anomaly detection & continuous state grounding",
      "Direct integration with Horos Reality Fabric state cache",
    ],
    route: "/capabilities/Horos/Reality%20Decoder",

    listPrice: 0.12,
    effectivePrice: 0.01,
    costMultiplier: "12.0x",
    costSub: "cheaper, 99.4% cache hit",
    costOptimizedLabel: "Effective input $0.010",
    costStandardLabel: "List price $0.12",

    standardLatency: 420,
    optimizedLatency: 42,
    latencyMultiplier: "10.0x",
    latencySub: "faster, direct sensor bus",
    latencyOptimizedLabel: "Optimized 42ms TTFT",
    latencyStandardLabel: "Standard Vision 420ms",

    baselineScore: 88.2,
    optimizedScore: 96.4,
    benchmarkMultiplier: "+8.2%",
    benchmarkSub: "Spatial-Eval 3D SOTA",
    benchmarkOptimizedLabel: "Reality Decoder 96.4%",
    benchmarkStandardLabel: "Gemini 1.5 Pro 88.2%",
  },
  {
    id: "code-intelligence",
    name: "Horos Code Intelligence",
    shortTag: "100B Core",
    domain: "Automated Software Synthesis & Verification",
    icon: Code2,
    parameters: "100B Reasoning Core",
    contextWindow: "512K Codebase Context",
    precision: "FP8 Verified",
    summary:
      "Frontier reasoning engine with automated verifier loops and test-time scaling. Employs execution verification and AST analysis to architect, refactor, and self-repair codebases with mathematical guarantees.",
    capabilities: [
      "Autonomous whole-repository dependency refactoring",
      "Test-time verifier loops with simulated runtime testing",
      "Formal contract synthesis & type verification",
      "Compatible with Claude Code, Cline, Aider, and Horos CLI",
    ],
    route: "/capabilities/Horos/Code%20Intelligence",

    listPrice: 0.2,
    effectivePrice: 0.018,
    costMultiplier: "11.1x",
    costSub: "cheaper, 98.6% cache hit",
    costOptimizedLabel: "Effective input $0.018",
    costStandardLabel: "List price $0.20",

    standardLatency: 580,
    optimizedLatency: 65,
    latencyMultiplier: "8.9x",
    latencySub: "faster, speculative verifiers",
    latencyOptimizedLabel: "Optimized 65ms TTFT",
    latencyStandardLabel: "Standard Reasoning 580ms",

    baselineScore: 62.6,
    optimizedScore: 68.7,
    benchmarkMultiplier: "+6.1%",
    benchmarkSub: "LiveCodeBench Pass@1",
    benchmarkOptimizedLabel: "Code Intelligence 68.7%",
    benchmarkStandardLabel: "Qwen2.5-Coder 62.6%",
  },
  {
    id: "voice-intelligence",
    name: "Horos Voice Intelligence",
    shortTag: "18B Audio",
    domain: "Sub-100ms Conversational Audio",
    icon: Mic,
    parameters: "18B Native Audio",
    contextWindow: "128K Audio Tokens",
    precision: "BF16 Latent",
    summary:
      "End-to-end neural audio model operating directly on raw audio waveforms without intermediate text bottlenecks. Delivers sub-100ms conversational turn-taking, multilingual ASR, and expressive speech generation.",
    capabilities: [
      "Sub-100ms full-duplex conversational latency",
      "Noise-robust spatial speech separation & diarization",
      "Real-time audio tool-calling & intent classification",
      "Emotion-grounded acoustic voice synthesis",
    ],
    route: "/capabilities/Horos/Voice%20Intelligence",

    listPrice: 0.08,
    effectivePrice: 0.009,
    costMultiplier: "8.9x",
    costSub: "cheaper, streaming audio",
    costOptimizedLabel: "Effective input $0.009",
    costStandardLabel: "List price $0.08",

    standardLatency: 650,
    optimizedLatency: 78,
    latencyMultiplier: "8.3x",
    latencySub: "faster, end-to-end waveform",
    latencyOptimizedLabel: "Optimized 78ms TTFT",
    latencyStandardLabel: "Pipeline ASR+TTS 650ms",

    baselineScore: 78.0,
    optimizedScore: 96.4,
    benchmarkMultiplier: "4.82 MOS",
    benchmarkSub: "Human-parity turn-taking",
    benchmarkOptimizedLabel: "Voice Intelligence 4.82",
    benchmarkStandardLabel: "Whisper+TTS 3.90",
  },
  {
    id: "visual-generation",
    name: "Horos Visual Generation",
    shortTag: "45B DiT",
    domain: "Physics-Consistent Generative Simulation",
    icon: Video,
    parameters: "45B Diffusion Transformer",
    contextWindow: "16-Camera 4K Feeds",
    precision: "FP8 Diffusion",
    summary:
      "A generative reality model that simulates multi-view physical environments, lighting, gravity, and fluid dynamics. Used to generate endless synthetic training scenarios and simulation edge-cases for autonomous systems.",
    capabilities: [
      "Physics-consistent multi-view 4K world generation",
      "Action-conditioned counterfactual visual rollouts",
      "Synthetic sensor degradation & weather simulation",
      "Direct coupling with the Horos Ground Truth Factory",
    ],
    route: "/capabilities/Horos/Visual%20Generation",

    listPrice: 0.35,
    effectivePrice: 0.038,
    costMultiplier: "9.2x",
    costSub: "cheaper, latent frame reuse",
    costOptimizedLabel: "Effective input $0.038",
    costStandardLabel: "List price $0.35",

    standardLatency: 210,
    optimizedLatency: 16,
    latencyMultiplier: "13.1x",
    latencySub: "60 FPS real-time DiT",
    latencyOptimizedLabel: "Optimized 16ms (60 FPS)",
    latencyStandardLabel: "Standard Diffusion 210ms",

    baselineScore: 75.6,
    optimizedScore: 94.8,
    benchmarkMultiplier: "+19.2%",
    benchmarkSub: "Physics Consistency SOTA",
    benchmarkOptimizedLabel: "Visual Generation 94.8%",
    benchmarkStandardLabel: "Cosmos 1.0 75.6%",
  },
  {
    id: "world-dynamics",
    name: "Horos World Dynamics Model",
    shortTag: "96B Spatio-Temporal",
    domain: "Causal Prediction & Action Forecasting",
    icon: Globe2,
    parameters: "96B Spatio-Temporal",
    contextWindow: "256K Trajectory Tokens",
    precision: "FP8 Native",
    summary:
      "Predicts the trajectory of dynamic physical systems across software, robotic actuators, and physical facilities. Allows autonomous agents to anticipate the consequences of actions before executing them in the physical world.",
    capabilities: [
      "Action-conditioned future trajectory forecasting",
      "Counterfactual safety verification before actuation",
      "Collision, slip, and kinetic dynamics estimation",
      "Continuous synchronization with physical edge nodes",
    ],
    route: "/capabilities/Horos/World%20Dynamics",

    listPrice: 0.28,
    effectivePrice: 0.029,
    costMultiplier: "9.7x",
    costSub: "cheaper, 99.2% state hit",
    costOptimizedLabel: "Effective input $0.029",
    costStandardLabel: "List price $0.28",

    standardLatency: 460,
    optimizedLatency: 48,
    latencyMultiplier: "9.6x",
    latencySub: "faster, action-conditioned step",
    latencyOptimizedLabel: "Optimized 48ms TTFT",
    latencyStandardLabel: "Standard Physics 460ms",

    baselineScore: 82.1,
    optimizedScore: 97.3,
    benchmarkMultiplier: "+15.2%",
    benchmarkSub: "Action Trajectory Accuracy",
    benchmarkOptimizedLabel: "World Dynamics 97.3%",
    benchmarkStandardLabel: "Prior World Models 82.1%",
  },
];

// Log scale mapping functions matching Image 2
const mapPriceToPercent = (price: number) => {
  if (price <= 0.01) return 0;
  if (price <= 0.05) return 0 + ((price - 0.01) / 0.04) * 25;
  if (price <= 0.2) return 25 + ((price - 0.05) / 0.15) * 25;
  if (price <= 1.0) return 50 + ((price - 0.2) / 0.8) * 25;
  if (price <= 3.0) return 75 + ((price - 1.0) / 2.0) * 25;
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

const mapBenchmarkToPercent = (score: number) => {
  if (score <= 50) return 0;
  if (score <= 65) return 0 + ((score - 50) / 15) * 25;
  if (score <= 80) return 25 + ((score - 65) / 15) * 25;
  if (score <= 90) return 50 + ((score - 80) / 10) * 25;
  if (score <= 100) return 75 + ((score - 90) / 10) * 25;
  return 100;
};

export function HorosModelFamily() {
  const [dimension, setDimension] = useState<Dimension>("cost");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="horos-model-family" className="w-full flex flex-col scroll-mt-24 select-none">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono font-medium tracking-[0.2em] text-[#75bf00] uppercase mb-3">
            <span className="w-2 h-2 bg-[#75bf00] inline-block" />
            FRONTIER AI LAB · FIRST-PARTY FOUNDATION MODELS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0EFE2] leading-tight">
            The Horos Foundation{" "}
            <span className="bg-[#75bf00] text-black px-2 py-0.5 font-semibold inline-block">
              Model Family
            </span>
          </h2>
          <p className="text-[#888] text-sm sm:text-base mt-3 leading-relaxed">
            Proprietary foundation architectures built from the ground up for spatial-physical perception, verifiable reasoning, low-latency audio, generative world simulation, and causal dynamics.
          </p>
        </div>

        {/* View all in capabilities fabric link */}
        <div className="shrink-0">
          <Link
            href="/capabilities/Horos"
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#75bf00] hover:text-[#F0EFE2] border border-[#75bf00]/30 hover:border-[#75bf00] px-4 py-2.5 transition-all group"
          >
            <span>EXPLORE ALL HOROS ARCHITECTURES</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Dimension Selector Tabs (matching Image 2 style) */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-dashed border-[#333] pb-4 mb-8 text-xs sm:text-sm font-mono font-medium">
        <button
          onClick={() => setDimension("cost")}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            dimension === "cost" ? "text-[#75bf00] font-semibold" : "text-[#555] hover:text-[#F0EFE2]"
          }`}
        >
          <Banknote size={16} /> Cost & Cache Efficiency
        </button>
        <button
          onClick={() => setDimension("latency")}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            dimension === "latency" ? "text-[#75bf00] font-semibold" : "text-[#555] hover:text-[#F0EFE2]"
          }`}
        >
          <Zap size={16} /> Streaming Latency (TTFT)
        </button>
        <button
          onClick={() => setDimension("benchmark")}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            dimension === "benchmark" ? "text-[#75bf00] font-semibold" : "text-[#555] hover:text-[#F0EFE2]"
          }`}
        >
          <Activity size={16} /> Empirical SOTA Gain
        </button>
      </div>

      {/* Interactive Metric Matrix (Exact Image 2 layout) */}
      <div className="w-full relative">
        {/* Dynamic X Axis Header */}
        <div className="flex items-center text-[10px] text-[#666] font-mono border-b border-dashed border-[#333] pb-2 mb-0 pr-4 transition-all duration-500">
          <div className="w-[280px] sm:w-[320px] shrink-0 font-medium">
            {dimension === "cost" && "Price per 1M input tokens, log scale"}
            {dimension === "latency" && "Time to First Token (TTFT), log scale"}
            {dimension === "benchmark" && "Empirical Benchmark Accuracy, log-linear scale"}
          </div>
          <div className="flex-1 relative h-4 mr-[140px] sm:mr-[180px]">
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
            {dimension === "benchmark" && (
              <>
                <span className="absolute left-[0%] -translate-x-1/2">50%</span>
                <span className="absolute left-[25%] -translate-x-1/2">65%</span>
                <span className="absolute left-[50%] -translate-x-1/2">80%</span>
                <span className="absolute left-[75%] -translate-x-1/2">90%</span>
                <span className="absolute left-[100%] -translate-x-1/2">100%</span>
              </>
            )}
          </div>
        </div>

        {/* Background Vertical Grid Lines matching the scale positions */}
        <div className="absolute top-[28px] bottom-0 left-[280px] sm:left-[320px] right-[140px] sm:right-[180px] pointer-events-none">
          <div className="absolute left-[0%] w-px h-full border-l border-dashed border-[#222]" />
          <div className="absolute left-[25%] w-px h-full border-l border-dashed border-[#222]" />
          <div className="absolute left-[50%] w-px h-full border-l border-dashed border-[#222]" />
          <div className="absolute left-[75%] w-px h-full border-l border-dashed border-[#222]" />
          <div className="absolute left-[100%] w-px h-full border-l border-dashed border-[#222]" />
        </div>

        {/* Model Rows */}
        <div className="flex flex-col">
          {HOROS_FOUNDATION_MODELS.map((model, i) => {
            const Icon = model.icon;
            const isExpanded = expandedId === model.id;

            // Calculate offsets based on current dimension
            let val1 = 0;
            let val2 = 0;
            let labelOptimized = "";
            let labelStandard = "";
            let textMultiplier = "";
            let textSub = "";

            if (dimension === "cost") {
              val1 = mapPriceToPercent(model.effectivePrice);
              val2 = mapPriceToPercent(model.listPrice);
              labelOptimized = model.costOptimizedLabel;
              labelStandard = model.costStandardLabel;
              textMultiplier = model.costMultiplier;
              textSub = model.costSub;
            } else if (dimension === "latency") {
              val1 = mapLatencyToPercent(model.optimizedLatency);
              val2 = mapLatencyToPercent(model.standardLatency);
              labelOptimized = model.latencyOptimizedLabel;
              labelStandard = model.latencyStandardLabel;
              textMultiplier = model.latencyMultiplier;
              textSub = model.latencySub;
            } else if (dimension === "benchmark") {
              val1 = mapBenchmarkToPercent(model.optimizedScore);
              val2 = mapBenchmarkToPercent(model.baselineScore);
              labelOptimized = model.benchmarkOptimizedLabel;
              labelStandard = model.benchmarkStandardLabel;
              textMultiplier = model.benchmarkMultiplier;
              textSub = model.benchmarkSub;
            }

            const leftOffset = Math.min(val1, val2);
            const width = Math.max(1, Math.abs(val1 - val2));

            // Green dot position (left side for cost/latency, right side for benchmark)
            const greenOffset = dimension === "benchmark" ? Math.max(val1, val2) : Math.min(val1, val2);
            const grayOffset = dimension === "benchmark" ? Math.min(val1, val2) : Math.max(val1, val2);

            return (
              <div key={model.id} className="flex flex-col border-b border-dashed border-[#222] transition-colors hover:bg-white/[0.015]">
                {/* Main Row */}
                <div
                  onClick={() => toggleExpand(model.id)}
                  className="relative flex items-center w-full py-8 cursor-pointer group"
                >
                  {/* Model Brand & Title */}
                  <div className="w-[280px] sm:w-[320px] shrink-0 flex items-center gap-3 pr-4">
                    <div className="w-8 h-8 rounded-[2px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#75bf00] group-hover:border-[#75bf00]/50 transition-colors shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors truncate">
                          {model.name}
                        </span>
                        <ChevronDown
                          size={12}
                          className={`text-[#666] group-hover:text-[#F0EFE2] transition-transform duration-300 shrink-0 ${
                            isExpanded ? "rotate-180 text-[#75bf00]" : ""
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-[#75bf00] bg-[#75bf00]/10 px-1 py-0.2 rounded-xs">
                          {model.shortTag}
                        </span>
                        <span className="text-[11px] text-[#777] font-sans truncate">
                          {model.domain}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Bar with Green/Gray Nodes */}
                  <div className="flex-1 relative h-6 mr-[140px] sm:mr-[180px]">
                    {/* Track Base */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-[1px] bg-[#333] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{ left: `${leftOffset}%`, width: `${width}%` }}
                    >
                      {/* Animated scanning laser beam */}
                      <div
                        className="absolute top-0 bottom-0 w-[50px] bg-gradient-to-r from-transparent via-[#75bf00] to-transparent"
                        style={{
                          animation: `scan-line ${2.4 + (i % 3) * 0.4}s ease-in-out infinite`,
                          animationDelay: `${i * 0.18}s`,
                        }}
                      />
                    </div>

                    {/* Green Start/End Box (Horos Foundation Model) */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#75bf00] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10"
                      style={{ left: `${greenOffset}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-[#F0EFE2] transition-opacity duration-300">
                        {labelOptimized}
                      </div>
                    </div>

                    {/* Gray Start/End Box (Industry Baseline) */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#666] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-0"
                      style={{ left: `${grayOffset}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-[#888] transition-opacity duration-300">
                        {labelStandard}
                      </div>
                    </div>
                  </div>

                  {/* Multiplier & Subtitle on Right */}
                  <div className="absolute right-0 w-[140px] sm:w-[180px] flex flex-col items-end text-right pr-2 sm:pr-4">
                    <div className="text-[18px] sm:text-[20px] font-bold text-[#F0EFE2] leading-none mb-1 transition-all duration-300">
                      {textMultiplier}
                    </div>
                    <div className="text-[10px] text-[#666] font-mono transition-all duration-300">
                      {textSub}
                    </div>
                  </div>
                </div>

                {/* Expandable Model Details Drawer */}
                {isExpanded && (
                  <div className="w-full pb-8 pt-2 px-4 sm:px-6 bg-[#181818]/80 border-t border-dashed border-[#2a2a2a] flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Summary & Capabilities */}
                      <div className="lg:col-span-8 flex flex-col gap-4">
                        <p className="text-xs sm:text-sm text-[#C8C7BA] leading-relaxed">
                          {model.summary}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {model.capabilities.map((cap, cIdx) => (
                            <div
                              key={cIdx}
                              className="text-[11px] font-mono text-[#AAA] bg-[#222] border border-[#333] px-2.5 py-1 rounded-[2px] flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 bg-[#75bf00] rounded-full inline-block" />
                              {cap}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Specs & Actions */}
                      <div className="lg:col-span-4 flex flex-col gap-3 font-mono text-xs border-l border-dashed border-[#333] pl-6">
                        <div className="flex items-center justify-between text-[#888] pb-1.5 border-b border-dashed border-[#282828]">
                          <span>Architecture:</span>
                          <span className="text-[#F0EFE2] font-semibold">{model.parameters}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#888] pb-1.5 border-b border-dashed border-[#282828]">
                          <span>Context Horizon:</span>
                          <span className="text-[#F0EFE2] font-semibold">{model.contextWindow}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#888] pb-1.5 border-b border-dashed border-[#282828]">
                          <span>Runtime Precision:</span>
                          <span className="text-[#75bf00] font-semibold">{model.precision}</span>
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                          <Link
                            href={model.route}
                            className="inline-flex items-center gap-1.5 text-xs text-[#75bf00] hover:text-[#F0EFE2] font-semibold transition-colors group/link"
                          >
                            <span>Model Spec in Capabilities</span>
                            <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
