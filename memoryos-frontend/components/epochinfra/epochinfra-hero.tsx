"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, Play, Pause, ChevronLeft } from "lucide-react";
import { NvidiaLogo, QwenLogo, MetaLogo, MistralLogo, GLMLogo, DeepSeekLogo, PhysicalIntelligenceLogo } from "@/components/epoch/primitives/brand-icons";

// Helper to generate a dot object
const createDot = (x: string, y: string, speed: number, cost: string, cacheHit: string) => ({
  x, y, speed, cost, cacheHit
});

const HERO_MODELS = [
  {
    id: "qwen-vl",
    name: "Qwen2.5-VL 7B",
    icon: <QwenLogo size={24} className="text-[#8B5CF6]" />,
    speed: 140,
    cost: "$0.01",
    cacheHit: "96.1%",
    yPos: "12%",
    xPos: "12%",
    xAxisLabels: ["$0", "$0.06", "$0.12", "$0.18"],
    yAxisLabels: ["120", "80", "40", "0"],
    bgDots: [
      createDot("20%", "45%", 72, "$0.048", "65.2%"),
      createDot("20%", "50%", 80, "$0.048", "61.0%"),
      createDot("20%", "55%", 88, "$0.048", "58.4%"),
      createDot("20%", "60%", 96, "$0.048", "55.1%"),
      createDot("12%", "35%", 56, "$0.030", "71.9%"),
      createDot("38%", "20%", 32, "$0.091", "45.0%"),
      createDot("38%", "40%", 64, "$0.091", "41.5%"),
      createDot("58%", "40%", 64, "$0.139", "33.2%"),
      createDot("58%", "60%", 96, "$0.139", "30.1%"),
      createDot("90%", "60%", 96, "$0.216", "22.5%")
    ],
    trendLine: { x1: "12%", y1: "35%", x2: "20%", y2: "55%" }
  },
  {
    id: "llama",
    name: "Llama 3.1 8B",
    icon: <MetaLogo size={24} className="text-[#0081FB]" />,
    speed: 254,
    cost: "$0.01",
    cacheHit: "98.9%",
    yPos: "5%",
    xPos: "22%",
    xAxisLabels: ["$0", "$0.015", "$0.03", "$0.045"],
    yAxisLabels: ["240", "160", "80", "0"],
    bgDots: [
      createDot("50%", "5%", 16, "$0.030", "55.1%"),
      createDot("50%", "10%", 32, "$0.030", "58.2%"),
      createDot("50%", "15%", 48, "$0.030", "59.5%"),
      createDot("50%", "20%", 64, "$0.030", "62.0%"),
      createDot("50%", "35%", 112, "$0.030", "64.3%"),
      createDot("50%", "55%", 176, "$0.030", "68.9%"),
      createDot("50%", "60%", 192, "$0.030", "70.1%"),
      createDot("25%", "15%", 48, "$0.015", "73.1%"),
      createDot("33%", "8%", 25, "$0.020", "61.2%"),
      createDot("42%", "10%", 32, "$0.025", "60.0%"),
      createDot("83%", "15%", 48, "$0.050", "45.5%")
    ],
    trendLine: { x1: "25%", y1: "15%", x2: "50%", y2: "55%" }
  },
  {
    id: "pixtral",
    name: "Pixtral 12B",
    icon: <MistralLogo size={24} className="opacity-90" />,
    speed: 216,
    cost: "$0.01",
    cacheHit: "98.3%",
    yPos: "20%",
    xPos: "90%",
    xAxisLabels: ["$0", "$0.0025", "$0.005", "$0.0075"],
    yAxisLabels: ["180", "120", "60", "0"],
    bgDots: [],
    trendLine: null
  },
  {
    id: "nemotron",
    name: "Nemotron-4 340B",
    icon: <NvidiaLogo size={24} className="text-[#76b900]" />,
    speed: 541,
    cost: "$0.01",
    cacheHit: "87.5%",
    yPos: "8%",
    xPos: "22%",
    xAxisLabels: ["$0", "$0.015", "$0.03", "$0.045"],
    yAxisLabels: ["450", "300", "150", "0"],
    bgDots: [
      createDot("65%", "10%", 60, "$0.039", "51.2%"),
      createDot("80%", "30%", 180, "$0.048", "65.5%")
    ],
    trendLine: { x1: "65%", y1: "10%", x2: "80%", y2: "30%" }
  },
  {
    id: "glm-5-3-flash",
    name: "GLM 5.3 Flash",
    icon: <GLMLogo size={24} />,
    speed: 254,
    cost: "$0.011",
    cacheHit: "98.9%",
    yPos: "20%",
    xPos: "25%",
    xAxisLabels: ["$0", "$0.015", "$0.03", "$0.045"],
    yAxisLabels: ["320", "213", "106", "0"],
    bgDots: [
      createDot("20%", "45%", 72, "$0.048", "65.2%"),
      createDot("20%", "50%", 80, "$0.048", "61.0%"),
      createDot("20%", "55%", 88, "$0.048", "58.4%"),
      createDot("20%", "60%", 96, "$0.048", "55.1%"),
      createDot("12%", "35%", 56, "$0.030", "71.9%"),
      createDot("38%", "20%", 32, "$0.091", "45.0%"),
      createDot("38%", "40%", 64, "$0.091", "41.5%"),
      createDot("58%", "40%", 64, "$0.139", "33.2%"),
      createDot("58%", "60%", 96, "$0.139", "30.1%"),
      createDot("90%", "60%", 96, "$0.216", "22.5%")
    ],
    trendLine: { x1: "12%", y1: "35%", x2: "20%", y2: "55%" }
  },
  {
    id: "nemotron-3-5-lightning-30b",
    name: "Nemotron 3.5 Lightning 30B",
    icon: <NvidiaLogo size={24} />,
    speed: 541,
    cost: "$0.015",
    cacheHit: "87.7%",
    yPos: "15%",
    xPos: "33%",
    xAxisLabels: ["$0", "$0.015", "$0.03", "$0.045"],
    yAxisLabels: ["640", "420", "210", "0"],
    bgDots: [
      createDot("50%", "5%", 16, "$0.030", "55.1%"),
      createDot("50%", "10%", 32, "$0.030", "58.2%"),
      createDot("50%", "15%", 48, "$0.030", "59.5%"),
      createDot("50%", "20%", 64, "$0.030", "62.0%"),
      createDot("50%", "35%", 112, "$0.030", "64.3%"),
      createDot("50%", "55%", 176, "$0.030", "68.9%"),
      createDot("50%", "60%", 192, "$0.030", "70.1%"),
      createDot("25%", "15%", 48, "$0.015", "73.1%"),
      createDot("33%", "8%", 25, "$0.020", "61.2%"),
      createDot("42%", "10%", 32, "$0.025", "60.0%"),
      createDot("83%", "15%", 48, "$0.050", "45.5%")
    ],
    trendLine: { x1: "25%", y1: "15%", x2: "50%", y2: "55%" }
  },
  {
    id: "qwen3-8-27b",
    name: "Qwen3.8 27B",
    icon: <QwenLogo size={24} />,
    speed: 140,
    cost: "$0.014",
    cacheHit: "96.1%",
    yPos: "25%",
    xPos: "31%",
    xAxisLabels: ["$0", "$0.015", "$0.03", "$0.045"],
    yAxisLabels: ["180", "120", "60", "0"],
    bgDots: [
      createDot("65%", "10%", 60, "$0.039", "51.2%"),
      createDot("80%", "30%", 180, "$0.048", "65.5%")
    ],
    trendLine: { x1: "65%", y1: "10%", x2: "80%", y2: "30%" }
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    icon: <DeepSeekLogo size={24} />,
    speed: 216,
    cost: "$0.012",
    cacheHit: "98.3%",
    yPos: "15%",
    xPos: "26%",
    xAxisLabels: ["$0", "$0.015", "$0.03", "$0.045"],
    yAxisLabels: ["250", "160", "80", "0"],
    bgDots: [
      createDot("20%", "45%", 72, "$0.048", "65.2%"),
      createDot("20%", "50%", 80, "$0.048", "61.0%"),
      createDot("20%", "55%", 88, "$0.048", "58.4%"),
      createDot("20%", "60%", 96, "$0.048", "55.1%"),
      createDot("12%", "35%", 56, "$0.030", "71.9%"),
      createDot("38%", "20%", 32, "$0.091", "45.0%"),
      createDot("38%", "40%", 64, "$0.091", "41.5%"),
      createDot("58%", "40%", 64, "$0.139", "33.2%"),
      createDot("58%", "60%", 96, "$0.139", "30.1%"),
      createDot("90%", "60%", 96, "$0.216", "22.5%")
    ],
    trendLine: { x1: "12%", y1: "35%", x2: "20%", y2: "55%" }
  },
  {
    id: "llama-3-1-405b",
    name: "Llama 3.1 405B",
    icon: <MetaLogo size={24} />,
    speed: 120,
    cost: "$0.12",
    cacheHit: "91.2%",
    yPos: "25%",
    xPos: "40%",
    xAxisLabels: ["$0", "$0.10", "$0.20", "$0.30"],
    yAxisLabels: ["160", "100", "50", "0"],
    bgDots: [
      createDot("50%", "5%", 16, "$0.030", "55.1%"),
      createDot("50%", "10%", 32, "$0.030", "58.2%"),
      createDot("50%", "15%", 48, "$0.030", "59.5%"),
      createDot("50%", "20%", 64, "$0.030", "62.0%"),
      createDot("50%", "35%", 112, "$0.030", "64.3%"),
      createDot("50%", "55%", 176, "$0.030", "68.9%"),
      createDot("50%", "60%", 192, "$0.030", "70.1%"),
      createDot("25%", "15%", 48, "$0.015", "73.1%"),
      createDot("33%", "8%", 25, "$0.020", "61.2%"),
      createDot("42%", "10%", 32, "$0.025", "60.0%"),
      createDot("83%", "15%", 48, "$0.050", "45.5%")
    ],
    trendLine: { x1: "25%", y1: "15%", x2: "50%", y2: "55%" }
  },
  {
    id: "mistral-large-2",
    name: "Mistral Large 2",
    icon: <MistralLogo size={24} />,
    speed: 60,
    cost: "$0.53",
    cacheHit: "82.4%",
    yPos: "50%",
    xPos: "35%",
    xAxisLabels: ["$0", "$0.50", "$1.00", "$1.50"],
    yAxisLabels: ["120", "80", "40", "0"],
    bgDots: [
      createDot("65%", "10%", 60, "$0.039", "51.2%"),
      createDot("80%", "30%", 180, "$0.048", "65.5%")
    ],
    trendLine: { x1: "65%", y1: "10%", x2: "80%", y2: "30%" }
  },
  {
    id: "pi0-robotics",
    name: "Physical Intelligence pi0",
    icon: <PhysicalIntelligenceLogo size={24} />,
    speed: 85,
    cost: "$0.02",
    cacheHit: "88.5%",
    yPos: "30%",
    xPos: "40%",
    xAxisLabels: ["$0", "$0.015", "$0.03", "$0.05"],
    yAxisLabels: ["120", "80", "40", "0"],
    bgDots: [
      createDot("20%", "45%", 72, "$0.048", "65.2%"),
      createDot("20%", "50%", 80, "$0.048", "61.0%"),
      createDot("20%", "55%", 88, "$0.048", "58.4%"),
      createDot("20%", "60%", 96, "$0.048", "55.1%"),
      createDot("12%", "35%", 56, "$0.030", "71.9%"),
      createDot("38%", "20%", 32, "$0.091", "45.0%"),
      createDot("38%", "40%", 64, "$0.091", "41.5%"),
      createDot("58%", "40%", 64, "$0.139", "33.2%"),
      createDot("58%", "60%", 96, "$0.139", "30.1%"),
      createDot("90%", "60%", 96, "$0.216", "22.5%")
    ],
    trendLine: { x1: "12%", y1: "35%", x2: "20%", y2: "55%" }
  },
  {
    id: "nvidia-cosmos",
    name: "Nvidia Cosmos 1.0",
    icon: <NvidiaLogo size={24} />,
    speed: 45,
    cost: "$0.04",
    cacheHit: "84.1%",
    yPos: "50%",
    xPos: "40%",
    xAxisLabels: ["$0", "$0.03", "$0.06", "$0.10"],
    yAxisLabels: ["90", "60", "30", "0"],
    bgDots: [
      createDot("50%", "5%", 16, "$0.030", "55.1%"),
      createDot("50%", "10%", 32, "$0.030", "58.2%"),
      createDot("50%", "15%", 48, "$0.030", "59.5%"),
      createDot("50%", "20%", 64, "$0.030", "62.0%"),
      createDot("50%", "35%", 112, "$0.030", "64.3%"),
      createDot("50%", "55%", 176, "$0.030", "68.9%"),
      createDot("50%", "60%", 192, "$0.030", "70.1%"),
      createDot("25%", "15%", 48, "$0.015", "73.1%"),
      createDot("33%", "8%", 25, "$0.020", "61.2%"),
      createDot("42%", "10%", 32, "$0.025", "60.0%"),
      createDot("83%", "15%", 48, "$0.050", "45.5%")
    ],
    trendLine: { x1: "25%", y1: "15%", x2: "50%", y2: "55%" }
  }
];

export function EpochInfraHero() {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Hover states
  const [hoveredMain, setHoveredMain] = useState(false);
  const [hoveredDotIdx, setHoveredDotIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_MODELS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const model = HERO_MODELS[index];

  const handleNext = () => setIndex((prev) => (prev + 1) % HERO_MODELS.length);
  const handlePrev = () => setIndex((prev) => (prev - 1 + HERO_MODELS.length) % HERO_MODELS.length);

  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-[45%_1fr] gap-16 lg:gap-12">

      {/* Left Column: Copy & Actions */}
      <div className="flex flex-col w-full lg:max-w-xl">
        <div className="flex items-center gap-2 text-[12px] font-bold text-[#888] mb-8">
          <span>Powered by</span>
          <div className="flex items-center gap-1.5 bg-[#1a1a1a] border border-[#333] px-2 py-0.5 rounded-[2px]">
            <NvidiaLogo size={12} className="text-[#76b900]" />
            <span className="text-white tracking-tight">Inception</span>
          </div>
        </div>

        <h1 className="text-5xl lg:text-[64px] font-medium tracking-tight leading-[1.1] text-[#F0EFE2] mb-6 mt-[-1rem]">
          Teach open models to<br />decode <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">reality</span>
        </h1>

        <p className="text-[17px] text-[#A0A0A0] leading-relaxed mb-10 pr-0 sm:pr-12">
          The permanent Reality Intelligence Runtime. Teach intelligent systems to decode reality through verified interaction with software, compute, and the physical world.
        </p>

        <div className="flex items-center gap-6">
          <button className="bg-[#75bf00] hover:bg-[#86dc00] text-black font-medium text-[14px] px-6 py-3 rounded-[2px] flex items-center gap-2 transition-colors cursor-pointer">
            Initialize Runtime <ChevronRight size={14} strokeWidth={2} />
          </button>
          <button className="text-[#A0A0A0] hover:text-[#F0EFE2] text-[14px] font-medium flex items-center gap-2 transition-colors cursor-pointer">
            Explore Capabilities <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Right Column: Interactive Scatter Plot */}
      <div className="w-full flex flex-col min-w-0">
        {/* Chart Area */}
        <div className="relative w-full h-[320px] sm:h-[400px] border-l border-b border-[#333] bg-[#141414] mt-6 lg:mt-0 ml-4 lg:ml-8">

          {/* Inner clipping container for chart visuals */}
          <div className="absolute inset-0 overflow-hidden z-0">
            {/* Lighter Background Bottom Half */}
            <div className="absolute bottom-0 left-0 w-full h-[50%] bg-[#1a1a1a] border-t border-[#222]"></div>

            {/* Green Background Box (Highlight Area) */}
            <div
              className="absolute bottom-[50%] left-0 bg-[#232712] transition-all duration-500 ease-in-out"
              style={{ width: model.xPos, top: 0 }}
            />

            {/* Scatter Points (Background Dots & Lines) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-500 ease-in-out" preserveAspectRatio="none">
              {/* Small dotted line connecting cluster of points */}
              {model.trendLine && (
                <line
                  x1={model.trendLine.x1}
                  y1={`calc(100% - ${model.trendLine.y1})`}
                  x2={model.trendLine.x2}
                  y2={`calc(100% - ${model.trendLine.y2})`}
                  stroke="#888"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Background Scatter Dots */}
              {model.bgDots.map((dot, idx) => {
                const isHovered = hoveredDotIdx === idx;
                return (
                  <circle
                    key={idx}
                    cx={dot.x}
                    cy={`calc(100% - ${dot.y})`}
                    r={isHovered ? "5.5" : "4.5"}
                    fill={isHovered ? "#fff" : "#666"}
                    className="transition-all duration-200 ease-in-out cursor-crosshair"
                    style={{ pointerEvents: 'auto' }}
                    onMouseEnter={() => setHoveredDotIdx(idx)}
                    onMouseLeave={() => setHoveredDotIdx(null)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Competitor Hover Tooltip */}
          {hoveredDotIdx !== null && model.bgDots[hoveredDotIdx] && (
            <div
              className="absolute z-50 bg-[#F0EFE2] text-[#111] p-3 rounded-[2px] shadow-xl text-[12px] leading-relaxed w-[260px] pointer-events-none transition-opacity duration-200"
              style={{
                left: model.bgDots[hoveredDotIdx].x,
                bottom: `calc(${model.bgDots[hoveredDotIdx].y} + 12px)`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="font-bold mb-1">Generic cloud provider</div>
              <div className="mb-2">{model.bgDots[hoveredDotIdx].speed} tok/s, {model.bgDots[hoveredDotIdx].cost} per 1M cached input tokens</div>
              <div className="text-[#333] mb-2">{model.bgDots[hoveredDotIdx].cacheHit} cache hit. Provider-reported cache rate; aggregation and window unspecified, lacks verified Reality Fabric context.</div>
              <div className="text-[#444] text-[11px]">Standard Cloud, 2026-09-05. Static environment, no continuous Verified Mission Results.</div>
            </div>
          )}

          {/* Y Axis Label */}
          <div className="absolute top-2 left-4 text-[11px] text-[#888] z-30 pointer-events-none">Higher speed (tok/s)</div>

          {/* Y Axis Grid Lines & Labels */}
          <div className="absolute top-[25%] left-0 w-full border-t border-[#2a2a2a] z-10 pointer-events-none"></div>
          <div className="absolute top-[50%] left-0 w-full border-t border-[#2a2a2a] z-10 pointer-events-none"></div>
          <div className="absolute top-[75%] left-0 w-full border-t border-[#2a2a2a] z-10 pointer-events-none"></div>

          <div className="absolute top-[25%] -left-8 text-[11px] text-[#888] font-mono -translate-y-1/2">{model.yAxisLabels[0]}</div>
          <div className="absolute top-[50%] -left-8 text-[11px] text-[#888] font-mono -translate-y-1/2">{model.yAxisLabels[1]}</div>
          <div className="absolute top-[75%] -left-8 text-[11px] text-[#888] font-mono -translate-y-1/2">{model.yAxisLabels[2]}</div>
          <div className="absolute bottom-0 -left-4 text-[11px] text-[#888] font-mono translate-y-1/2">{model.yAxisLabels[3]}</div>

          {/* X Axis Grid Lines & Labels */}
          <div className="absolute bottom-0 left-[25%] h-full border-l border-[#2a2a2a] z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-[50%] h-full border-l border-[#2a2a2a] z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-[75%] h-full border-l border-[#2a2a2a] z-10 pointer-events-none"></div>

          <div className="absolute -bottom-6 left-0 text-[11px] text-[#888] font-mono -translate-x-1/2">{model.xAxisLabels[0]}</div>
          <div className="absolute -bottom-6 left-[25%] text-[11px] text-[#888] font-mono -translate-x-1/2">{model.xAxisLabels[1]}</div>
          <div className="absolute -bottom-6 left-[50%] text-[11px] text-[#888] font-mono -translate-x-1/2">{model.xAxisLabels[2]}</div>
          <div className="absolute -bottom-6 left-[75%] text-[11px] text-[#888] font-mono -translate-x-1/2">{model.xAxisLabels[3]}</div>

          {/* Vertical & Horizontal Dotted Lines from the icon */}
          <div
            className="absolute border-l-2 border-dotted border-[#75bf00] transition-all duration-500 ease-in-out z-10 flex flex-col items-center justify-end pointer-events-none"
            style={{ left: model.xPos, top: model.yPos, bottom: 0 }}
          >
            {/* The green dot at the bottom on the X axis */}
            <div className="w-2.5 h-2.5 rounded-full bg-[#75bf00] translate-y-1/2 translate-x-[-1px]"></div>
          </div>

          <div
            className="absolute border-t-2 border-dotted border-[#75bf00]/50 transition-all duration-500 ease-in-out z-10 pointer-events-none"
            style={{ left: 0, width: model.xPos, top: model.yPos }}
          />

          {/* Highlighted Point (Dynamic Icon) */}
          <div
            className="absolute z-40 flex flex-col items-start gap-1 transition-all duration-500 ease-in-out cursor-pointer"
            style={{ top: model.yPos, left: model.xPos, transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => {
              setHoveredMain(true);
              setIsPlaying(false); // Pause sliding on hover
            }}
            onMouseLeave={() => {
              setHoveredMain(false);
              setIsPlaying(true);
            }}
          >
            {/* Glowing Ring Container */}
            <div className={`relative flex items-center justify-center transition-all duration-300 ${hoveredMain ? 'w-[90px] h-[90px]' : 'w-[84px] h-[84px]'}`}>
              {/* Outer faint glow */}
              <div className="absolute inset-0 rounded-full bg-[#75bf00]/10 blur-md"></div>
              {/* Middle transparent dark ring */}
              <div className="absolute inset-1 rounded-full bg-black/40 border border-[#75bf00]/30 backdrop-blur-sm"></div>
              {/* Thick Green Segment Ring (approximated with border) */}
              <div className={`absolute inset-3 rounded-full border-[3px] border-[#75bf00] transition-opacity ${hoveredMain ? 'opacity-100' : 'opacity-80'}`}></div>
              {/* Inner solid dark circle for icon */}
              <div className="absolute inset-[18px] rounded-full bg-[#111] border border-[#333] flex items-center justify-center shadow-lg">
                {model.icon}
              </div>
            </div>

            {/* The Text Label */}
            <div className="absolute left-[70px] top-1/2 -translate-y-1/2 flex flex-col justify-center whitespace-nowrap drop-shadow-md pointer-events-none">
              <span className="text-[#F0EFE2] font-bold text-[16px] drop-shadow-lg">{model.name}</span>
              <span className="text-[#75bf00] text-[13px] font-medium tracking-tight drop-shadow-lg">{model.cacheHit} cache hits</span>
            </div>
          </div>

          {/* Main Model Hover Tooltip */}
          {hoveredMain && (
            <div
              className="absolute z-50 bg-[#F0EFE2] text-[#111] p-3 rounded-[2px] shadow-xl text-[12px] leading-relaxed w-[260px] pointer-events-none"
              style={{
                left: `calc(${model.xPos} - 130px)`, // Center below icon
                top: `calc(${model.yPos} + 50px)`,
              }}
            >
              <div className="font-bold mb-1">Reality Intelligence Runtime</div>
              <div className="mb-2">{model.speed} tok/s, {model.cost} per 1M cached input tokens</div>
              <div className="text-[#333]">{model.cacheHit} Reality Fabric hit. Last 24 hours. Measured end to end on the verifiable physical routing path, verified Mission Result 2026-08-15.</div>
            </div>
          )}

        </div>

        {/* X Axis Label & Controls */}
        <div className="flex items-center justify-between mt-10">
          <div className="text-[12px] text-[#A0A0A0] flex items-center gap-1">
            <span>&larr; Optimized Intelligence Cost</span>
            <span className="text-[#666]">(USD / 1M tokens)</span>
          </div>
          <div className="flex items-center gap-1 bg-[#222] p-1 rounded-[4px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 hover:bg-[#333] hover:text-white text-[#A0A0A0] rounded-[2px] transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-[#333] hover:text-white text-[#A0A0A0] rounded-[2px] transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-[#333] hover:text-white text-[#A0A0A0] rounded-[2px] transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-dashed border-[#333]">
          <div className="flex flex-col transition-opacity duration-300">
            <div className="text-[12px] text-[#888] font-normal tracking-wide mb-1">Fast output</div>
            <div className="text-[28px] font-bold text-[#F0EFE2] tracking-tight">{model.speed} <span className="text-[13px] font-normal text-[#888]">tok/s</span></div>
            <div className="text-[11px] text-[#666] mt-1">End-to-end</div>
          </div>
          <div className="flex flex-col transition-opacity duration-300">
            <div className="text-[12px] text-[#888] font-normal tracking-wide mb-1">Low cost</div>
            <div className="text-[28px] font-bold text-[#F0EFE2] tracking-tight">{model.cost} <span className="text-[13px] font-normal text-[#888]">/ 1M</span></div>
            <div className="text-[11px] text-[#666] mt-1">Reality Fabric</div>
          </div>
          <div className="flex flex-col transition-opacity duration-300">
            <div className="text-[12px] text-[#888] font-normal tracking-wide mb-1">Fabric match rate</div>
            <div className="text-[28px] font-bold text-[#75bf00] tracking-tight flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#75bf00] shrink-0 inline-block mr-1"></span>
              {model.cacheHit}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
