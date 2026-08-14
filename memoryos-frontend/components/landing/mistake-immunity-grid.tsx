"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const falseWinModes = [
  {
    title: "Apparent Win",
    desc: "Metric improves, hidden slice fails.",
    status: "FAIL",
    badgeColor: "text-red-700 bg-red-100/90 border-red-300 shadow-sm"
  },
  {
    title: "Missing Proof",
    desc: "Promising result, required evidence missing.",
    status: "UNKNOWN",
    badgeColor: "text-amber-800 bg-amber-100/90 border-amber-300 shadow-sm"
  },
  {
    title: "Bounded Correction",
    desc: "Approved change survives independent verification.",
    status: "PASS",
    badgeColor: "text-emerald-800 bg-emerald-100/90 border-emerald-300 shadow-sm"
  },
  {
    title: "Metric Substitution",
    desc: "Throughput up while customer outcome deteriorates.",
    status: "FAIL",
    badgeColor: "text-red-700 bg-red-100/90 border-red-300"
  },
  {
    title: "Hidden Workload Slice",
    desc: "Aggregate quality flat while long-context/tool-use fails.",
    status: "FAIL",
    badgeColor: "text-red-700 bg-red-100/90 border-red-300"
  },
  {
    title: "No Reality Settlement",
    desc: "Pre-deployment chart stays green even after production breaks.",
    status: "FAIL",
    badgeColor: "text-red-700 bg-red-100/90 border-red-300"
  }
];

const reasoningSequence = [
  "01 / INGESTING MISSION INTENT...",
  "02 / RESOLVING INSTITUTION GENOME 0x9F8B...",
  "03 / VERIFYING CAPABILITY LEASE SCOPE...",
  "04 / SIMULATING HELD-OUT INSTITUTION RUN...",
  "05 / SETTLING REALITY AGAINST CLAIMED OUTCOME...",
  "06 / FITNESS RECORDED - NEXT GENOME READY"
];

const compilerSteps = [
  "01 / NORMALIZING TOOL CALL PAYLOAD...",
  "02 / ISOLATING P99 LATENCY RISKS...",
  "03 / VERIFYING SANDBOX BOUNDARIES...",
  "04 / WORKLOAD ISOLATED — APPROVED"
];

const microTickers = ["COMPUTING", "EVALUATING", "VERIFIED", "SIMULATING", "SETTLED"];
const hexTelemetry = ["0xA12", "99.4%", "D-4", "12ms", "0x8B", "0xCF", "100%", "Sync", "0x9E", "OK", "0xF2"];

export function MistakeImmunityGrid() {
  const totalPanels = 18;
  const realStart = 12;

  // Living Engine States
  const [activePanel, setActivePanel] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reasoningStep, setReasoningStep] = useState(0);
  const [compilerStep, setCompilerStep] = useState(0);
  const [tickerStep, setTickerStep] = useState(0);
  const [isSettled, setIsSettled] = useState(false);
  const [activeEvaluatorNode, setActiveEvaluatorNode] = useState<number | null>(null);
  const [isSevered, setIsSevered] = useState(false);
  const [activeTrussNode, setActiveTrussNode] = useState<number | null>(null);
  const [isRollback, setIsRollback] = useState(false);
  const [isCircuitHovered, setIsCircuitHovered] = useState(false);
  const [pressurePulseIndex, setPressurePulseIndex] = useState(0);

  const [probabilityStates, setProbabilityStates] = useState([
    { scale: 1, blur: 0, opacity: 0.4 },
    { scale: 1.1, blur: 2, opacity: 0.3 },
    { scale: 0.95, blur: 1, opacity: 0.5 },
    { scale: 1.05, blur: 3, opacity: 0.35 },
    { scale: 1, blur: 0, opacity: 0.4 },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. AI Engine Loop (Reasoning + Compiler + Severing + Rollback)
  useEffect(() => {
    const reasoningInterval = setInterval(() => {
      setReasoningStep((prev) => {
        const next = (prev + 1) % reasoningSequence.length;
        if (next === reasoningSequence.length - 1) {
          setIsSettled(true);
          setTimeout(() => setIsSettled(false), 1200);
        }
        return next;
      });
    }, 1900);

    const compilerInterval = setInterval(() => {
      setCompilerStep((prev) => (prev + 1) % compilerSteps.length);
    }, 1800);

    const tickerInterval = setInterval(() => {
      setTickerStep((prev) => (prev + 1) % microTickers.length);
    }, 500);

    // Evolving State Snapshots
    const probInterval = setInterval(() => {
      setProbabilityStates((prev) =>
        prev.map(() => ({
          scale: 0.9 + Math.random() * 0.25,
          blur: Math.random() * 3,
          opacity: 0.25 + Math.random() * 0.3,
        }))
      );
    }, 1500);

    // Severing Event Loop
    const severInterval = setInterval(() => {
      setIsSevered(true);
      setTimeout(() => {
        setIsSevered(false);
      }, 2500);
    }, 7000);

    // Production Settlement Rollback Simulation Loop
    const rollbackInterval = setInterval(() => {
      setIsRollback(true);
      setTimeout(() => {
        setIsRollback(false);
      }, 3000);
    }, 22000);

    // Hydraulic Pressure Pulse Loop across 16 blades
    const pressureInterval = setInterval(() => {
      setPressurePulseIndex((prev) => (prev + 1) % 16);
    }, 250);

    return () => {
      clearInterval(reasoningInterval);
      clearInterval(compilerInterval);
      clearInterval(tickerInterval);
      clearInterval(probInterval);
      clearInterval(severInterval);
      clearInterval(rollbackInterval);
      clearInterval(pressureInterval);
    };
  }, []);

  // 2. Cursor Gravity Physics Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x: x * 8, y: y * 5 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`w-full bg-white font-sans text-[#222] border-t border-[#ccc] relative overflow-hidden min-h-[900px] pt-16 transition-colors duration-500 ${isSettled ? "ring-2 ring-emerald-500/30" : ""
        }`}
    >
      {/* System Settlement Confirmation Pulse */}
      <AnimatePresence>
        {isSettled && (
          <motion.div
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 0, scale: 1.02 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-emerald-500/5 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* Top Header Section (CAD Engineering Layout) */}
      <div className="max-w-[1400px] mx-auto px-6 mb-16 relative z-20 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="bg-slate-100 border border-slate-200 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider font-mono">
            THE ORGANIZATION PROBLEM
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-[1000px] mx-auto">
          One agent is manageable. A thousand agents become an <span className="text-[#0015FF]">institutional problem.</span>
        </h2>

        <p className="text-slate-500 text-[16px] max-w-[800px] leading-relaxed mb-8 mx-auto font-sans">
          Agent platforms can show tool calls, traces, and benchmarks. They do not prove which institution authorized the action, whether the capability was leased correctly, whether the evidence was sufficient, or whether the organization should inherit the behavior.
        </p>
      </div>

      {/* Layer 1: Living Procedural Dotted Engineering Grid */}
      <motion.div
        animate={{
          rotateX: [0, 1.8, 0, -1.8, 0],
          rotateY: [0, -2.2, 0, 2.2, 0],
          translateZ: [0, 15, 0, -15, 0],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.55] z-0 top-[250px]"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-grid-cad" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect x="11.5" y="11.5" width="1" height="1" fill="#777" />
            </pattern>
            <pattern id="line-grid-cad" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#bbb" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-cad)" />
          <rect width="100%" height="100%" fill="url(#line-grid-cad)" />

          {/* Diagonal engineering vectors */}
          <line x1="0" y1="200" x2="1200" y2="800" stroke="#bbb" strokeWidth="0.75" />
          <line x1="0" y1="400" x2="1200" y2="1000" stroke="#bbb" strokeWidth="0.75" />
          <line x1="0" y1="600" x2="1200" y2="1200" stroke="#bbb" strokeWidth="0.75" />

          {/* Animated Dashed Laser Streams across grid */}
          <line x1="0" y1="200" x2="1200" y2="800" stroke="#3b82f6" strokeWidth="1" strokeDasharray="8 12" opacity="0.7">
            <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="400" x2="1200" y2="1000" stroke="#22c55e" strokeWidth="1" strokeDasharray="8 12" opacity="0.7">
            <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="4s" repeatCount="indefinite" />
          </line>
        </svg>
      </motion.div>

      {/* Top Left Engineering Telemetry Label */}
      <div className="hidden lg:block absolute top-[300px] left-8 font-mono text-[10px] text-[#666] uppercase tracking-widest leading-relaxed z-[10]">
        3D COMPUTATIONAL VIEW<br />
        <span className="text-[#3b82f6] font-bold">PANEL 021 // REASONING PIPELINE</span>
      </div>

      {/* Desktop 3D Cascade & System Analysis Matrix */}
      <motion.div
        animate={{
          rotateX: mousePos.y * 0.35,
          rotateY: mousePos.x * 0.35,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="hidden lg:block w-full max-w-[1240px] mx-auto h-[600px] relative z-10"
      >
        {/* Infinite Memory Historical Depth Panels */}
        {Array.from({ length: 12 }).map((_, gIdx) => {
          const gLeft = 5 + gIdx * 12;
          const gTop = 2 + gIdx * 15;
          const gScale = 0.5 + gIdx * 0.025;
          return (
            <div
              key={`infinite-mem-${gIdx}`}
              className="absolute border border-[#888] bg-[#e4e5e7]/10 pointer-events-none"
              style={{
                width: "320px",
                height: "160px",
                left: `${gLeft}px`,
                top: `${gTop}px`,
                transform: `scale(${gScale})`,
                opacity: 0.01 + gIdx * 0.004,
                zIndex: gIdx,
              }}
            />
          );
        })}

        {/* Primary 3D Panel Cascade */}
        {Array.from({ length: totalPanels }).map((_, i) => {
          const isReal = i >= realStart;
          const mode = isReal ? falseWinModes[i - realStart] : null;

          const scale = 0.55 + (i / (totalPanels - 1)) * 0.45;
          const left = 30 + i * 20 + mousePos.x * (i * 0.35);
          const top = 20 + i * 28 + mousePos.y * (i * 0.25);
          const isHovered = activePanel === i;

          return (
            <motion.div
              key={`panel-${i}`}
              initial={{ opacity: 0, z: -60 }}
              animate={{
                opacity: 1,
                z: 0,
                scale: isHovered ? scale * 1.03 : scale,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setActivePanel(i)}
              onMouseLeave={() => setActivePanel(null)}
              className={`absolute flex flex-col border transition-all duration-300 cursor-pointer ${isHovered
                  ? "border-[#3b82f6] bg-white shadow-[0_16px_32px_rgba(59,130,246,0.16)] z-[70]"
                  : "border-[#777]/30 bg-white/75 backdrop-blur-[2px] shadow-[6px_6px_16px_rgba(0,0,0,0.06)] hover:bg-white hover:z-[60]"
                }`}
              style={{
                width: "320px",
                height: "160px",
                left: `${left}px`,
                top: `${top}px`,
                transformOrigin: "top left",
                zIndex: i + 15,
              }}
            >
              {/* Header Tab */}
              <div className="flex w-full h-[22px]">
                <div className={`flex items-center px-2 text-[#fff] text-[9px] font-mono tracking-widest gap-2 ${isHovered ? "bg-[#3b82f6]" : "bg-[#666]"}`}>
                  <div className="w-1.5 h-1.5 bg-[#fff] animate-pulse" />
                  PANEL 021
                </div>
                <div className="flex-1 border-b border-[#777]/30 flex justify-end items-center pr-2">
                  {isHovered && (
                    <span className="text-[8px] font-mono text-[#3b82f6] font-bold uppercase tracking-wider">
                      HOLOGRAPHIC FOCUS
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono tracking-widest text-[#555] uppercase">
                    NAVIGATOR 288 A
                  </span>
                  <span className="text-[10px] font-mono text-[#555]">1543.68%</span>
                </div>

                {isReal && mode ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[12px] font-bold text-[#111] font-mono uppercase tracking-tight">
                        {mode.title}
                      </h3>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${mode.badgeColor}`}>
                        {mode.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#333] font-medium leading-snug max-w-[95%]">
                      {mode.desc}
                    </p>
                  </div>
                ) : (
                  <div className="opacity-50">
                    <div className="flex gap-1.5 mb-1.5">
                      <div className="w-10 h-[2px] bg-[#888]/40" />
                      <div className="w-4 h-[2px] bg-[#888]/40" />
                      <div className="w-16 h-[2px] bg-[#888]/40" />
                    </div>
                    <div className="flex gap-1.5 mb-1.5">
                      <div className="w-6 h-[2px] bg-[#888]/40" />
                      <div className="w-12 h-[2px] bg-[#888]/40" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Connectivity SVG Vectors */}
        <svg className="absolute inset-0 w-full h-[800px] pointer-events-none z-[40]">
          {Array.from({ length: 6 }).map((_, idx) => {
            const i = idx + realStart;
            const scale = 0.55 + (i / (totalPanels - 1)) * 0.45;

            const x1 = 30 + i * 20 + 320 * scale + mousePos.x * (i * 0.35);
            const y1 = 20 + i * 28 + 80 * scale + mousePos.y * (i * 0.25);
            const x2 = 720;
            const y2 = 140 + idx * 45;

            return (
              <g key={`line-${idx}`}>
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="#555"
                  strokeWidth="0.75"
                  fill="none"
                  opacity="0.4"
                />
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="#3b82f6"
                  strokeWidth="1.25"
                  strokeDasharray="6 8"
                  fill="none"
                  opacity="0.9"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-28"
                    dur={`${1.6 + idx * 0.25}s`}
                    repeatCount="indefinite"
                  />
                </path>
                <rect x={x1 - 2.5} y={y1 - 2.5} width="5" height="5" fill="#e4e5e7" stroke="#555" strokeWidth="1" transform={`rotate(45 ${x1} ${y1})`} />
                <rect x={x2 - 2.5} y={y2 - 2.5} width="5" height="5" fill="#e4e5e7" stroke="#555" strokeWidth="1" transform={`rotate(45 ${x2} ${y2})`} />
              </g>
            );
          })}
        </svg>

        {/* Right Panel (CAD System Analysis Engine) */}
        <div
          className="absolute border border-[#777]/40 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex flex-col z-[50]"
          style={{ left: "720px", top: "50px", width: "480px", minHeight: "430px" }}
        >
          {/* Header Tab */}
          <div className="flex w-full h-[24px]">
            <div className="bg-[#666] flex items-center px-3 text-[#fff] text-[10px] font-mono tracking-widest gap-2">
              <div className="w-1.5 h-1.5 bg-[#fff] animate-pulse" />
              PANEL 021 // REALITY SETTLEMENT
            </div>
            <div className="flex-1 border-b border-[#777]/40 flex justify-end items-center pr-3">
              <span className="text-[9px] font-mono text-[#22c55e] font-bold">
                STATE: {microTickers[tickerStep]}
              </span>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col relative z-10 font-mono">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-mono tracking-widest text-[#555] uppercase">
                SYSTEM ANALYSIS // ROOT CAUSE
              </span>
              <span className="text-[11px] font-mono text-[#555]">1543.67%</span>
            </div>

            {/* AI Reasoning Stream Ticker */}
            <div className="mb-4 p-2.5 bg-slate-900 text-white font-mono text-[11px] flex items-center justify-between shadow-sm">
              <span className="text-[#38bdf8] font-semibold">{reasoningSequence[reasoningStep]}</span>
              <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
            </div>

            {/* Matrix & Cases Section */}
            <div className="flex flex-col gap-5">
              <div className="w-full h-[1px] bg-[#ddd]" />

              <div className="flex justify-between items-center text-[10px] font-mono text-[#666]">
                <span>CORRELATION MATRIX</span>
                <span className="text-emerald-600 font-bold">ACTIVE</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`h-8 ${(i * 7) % 10 > 6 ? "bg-[#555]/10" : "bg-[#e4e5e7]/40"} border border-[#ddd]`} />
                ))}
              </div>

              <div className="w-full h-[1px] bg-[#ddd]" />

              {/* 3 Concept Case Lines */}
              <div className="space-y-2 pt-1 font-sans">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500" />
                    <span className="font-semibold text-slate-900">Apparent Win</span>
                    <span className="text-[#666] text-[10px]">— metric improves, hidden slice fails.</span>
                  </div>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-300">
                    FAIL
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500" />
                    <span className="font-semibold text-slate-900">Missing Proof</span>
                    <span className="text-[#666] text-[10px]">— promising result, required evidence missing.</span>
                  </div>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300">
                    UNKNOWN
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500" />
                    <span className="font-semibold text-slate-900">Bounded Correction</span>
                    <span className="text-[#666] text-[10px]">— approved change survives independent verification.</span>
                  </div>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                    PASS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Layout Fallback */}
      <div className="block lg:hidden w-full px-6 py-12 relative z-10">
        <div className="flex flex-col gap-6">
          <div className="font-mono text-[11px] text-[#666] uppercase tracking-widest mb-2">
            FAILURE MODE CASCADE
          </div>
          {falseWinModes.map((mode, idx) => (
            <div key={idx} className="border border-[#777]/30 bg-white/60 backdrop-blur-md shadow-lg">
              <div className="flex w-full h-[22px]">
                <div className="bg-[#666] flex items-center px-2 text-[#fff] text-[9px] font-mono tracking-widest gap-2">
                  <div className="w-1.5 h-1.5 bg-[#fff]" />
                  PANEL 021
                </div>
                <div className="flex-1 border-b border-[#777]/30 flex justify-end items-center pr-2">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${mode.badgeColor}`}>
                    {mode.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-[13px] font-bold text-[#111] mb-2 font-mono uppercase tracking-tight">
                  {mode.title}
                </h3>
                <p className="text-[12px] text-[#333] leading-snug">
                  {mode.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Blueprint Diagram Section (Includes Sections 04 & 05 Execution & Settlement Engine) */}
      <div className="w-full relative mt-32 pt-20 border-t border-[#ccc]">
        <div className="max-w-[1240px] mx-auto opacity-90">
          <svg viewBox="0 0 1200 1600" className="w-full h-auto text-[#666] font-mono">
            {/* 1. TOP SECTION (3 Interactive Evaluator Squares SYS P-363A-1, 2, 3) */}
            <line x1="100" y1="200" x2="1100" y2="200" stroke="#bbb" strokeWidth="1" strokeDasharray="4 4" />

            <line x1="100" y1="200" x2="1100" y2="200" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="10 10" opacity="0.8">
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.5s" repeatCount="indefinite" />
            </line>

            <rect x="100" y="185" width="25" height="5" fill="#777" />
            <rect x="115" y="195" width="15" height="2" fill="#777" />
            <rect x="120" y="205" width="8" height="4" fill="#777" />

            <rect x="1075" y="185" width="25" height="5" fill="#777" />
            <rect x="1070" y="195" width="15" height="2" fill="#777" />
            <rect x="1080" y="205" width="8" height="4" fill="#777" />

            {[300, 600, 900].map((cx, i) => {
              const isNodeActive = activeEvaluatorNode === i;
              return (
                <g
                  key={`top-sq-${i}`}
                  onMouseEnter={() => setActiveEvaluatorNode(i)}
                  onMouseLeave={() => setActiveEvaluatorNode(null)}
                  className="cursor-pointer group"
                >
                  <rect
                    x={cx - 80}
                    y={120}
                    width="160"
                    height="160"
                    fill={isNodeActive ? "rgba(59,130,246,0.05)" : "none"}
                    stroke={isNodeActive ? "#3b82f6" : "#ccc"}
                    strokeWidth={isNodeActive ? "1.5" : "1"}
                    className="transition-colors duration-300"
                  />
                  <line x1={cx - 80} y1={120} x2={cx + 80} y2={280} stroke={isNodeActive ? "#3b82f6" : "#ddd"} strokeWidth="0.75" />
                  <line x1={cx + 80} y1={120} x2={cx - 80} y2={280} stroke={isNodeActive ? "#3b82f6" : "#ddd"} strokeWidth="0.75" />
                  <line x1={cx} y1={120} x2={cx} y2={280} stroke={isNodeActive ? "#3b82f6" : "#ddd"} strokeWidth="0.75" />
                  <line x1={cx - 80} y1={200} x2={cx + 80} y2={200} stroke={isNodeActive ? "#3b82f6" : "#ddd"} strokeWidth="0.75" />

                  <g transform={`rotate(${i * 45}, ${cx}, 200)`}>
                    <line x1={cx - 40} y1={200} x2={cx + 40} y2={200} stroke="#3b82f6" strokeWidth="0.5" opacity="0.5">
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 200`} to={`360 ${cx} 200`} dur="10s" repeatCount="indefinite" />
                    </line>
                  </g>

                  <rect x={cx - 80} y={100} width="4" height="4" fill={isNodeActive ? "#3b82f6" : "#888"} />
                  <text x={cx - 70} y={104} fontSize="7" fill={isNodeActive ? "#3b82f6" : "#888"} fontWeight="bold">LOCAL EVALUATOR</text>
                  <text x={cx - 70} y={112} fontSize="6" fill="#999">SYS P-363A-{i + 1}</text>

                  <rect x={cx - 75} y={262} width="150" height="14" fill={isNodeActive ? "#3b82f6" : "#444"} />
                  <text x={cx} y={272} fontSize="7" fill="#fff" textAnchor="middle" fontWeight="bold">
                    {i === 0 && "SYS 1: SIMULATING [PASS 99.4%]"}
                    {i === 1 && "SYS 2: HELD-OUT SUITE [VALIDATED]"}
                    {i === 2 && "SYS 3: CONSENSUS [100% CLEAN]"}
                  </text>
                </g>
              );
            })}

            {/* Miscellaneous small squares */}
            <g fill="#999">
              <rect x="150" y="150" width="6" height="6" />
              <rect x="150" y="250" width="6" height="6" />
              <rect x="620" y="140" width="4" height="4" />
              <rect x="530" y="270" width="8" height="8" fill="#666" />
              <rect x="700" y="270" width="8" height="8" fill="#666" />
              <text x="545" y="278" fontSize="6" fill="#888">NO. 182-B-12</text>
              <text x="715" y="278" fontSize="6" fill="#888">EXP 12.08 00A</text>
            </g>

            {/* 2. MIDDLE SECTION (Layer 4: Morphing Translucent Probability State Snapshots) */}
            <line x1="150" y1="550" x2="1050" y2="550" stroke="#bbb" strokeDasharray="3 4" strokeWidth="0.75" />
            <path d="M 400 400 Q 550 450, 480 750" fill="none" stroke="#bbb" strokeDasharray="3 3" />
            <path d="M 600 450 Q 700 350, 800 600" fill="none" stroke="#bbb" strokeDasharray="3 3" />

            {[
              { x: 350, y: 550 }, { x: 430, y: 500 }, { x: 510, y: 550 },
              { x: 590, y: 500 }, { x: 670, y: 550 }, { x: 770, y: 480 }, { x: 810, y: 550 }
            ].map((pos, i) => {
              const state = probabilityStates[i % probabilityStates.length];
              const boxSize = 120 * state.scale;
              return (
                <rect
                  key={`probability-block-${i}`}
                  x={pos.x - boxSize / 2}
                  y={pos.y - boxSize / 2}
                  width={boxSize}
                  height={boxSize}
                  fill="#bbb"
                  opacity={state.opacity}
                  style={{ transition: "all 1.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                />
              );
            })}

            {/* Locator Icons */}
            <g className="text-[7px]" fill="#888" stroke="#888" strokeWidth="1">
              <path d="M 350 430 L 355 435 L 360 430 M 355 435 L 355 440" fill="none" />
              <text x="365" y="438">LOCATOR OPEN</text>

              <path d="M 520 400 L 525 405 L 530 400 M 525 405 L 525 410" fill="none" />
              <text x="535" y="408">SEC-1</text>

              <path d="M 720 650 L 725 645 L 730 650 M 725 645 L 725 640" fill="none" />
              <text x="735" y="648">NODE ACTIVE</text>
            </g>

            {/* 3. STRUCTURAL TRUSS SECTION (03 / CAUSALITY LOG REAL-TIME ENGINE) */}
            <g transform="translate(250, 850) rotate(45)">
              <rect x="-100" y="-100" width="200" height="200" fill="none" stroke="#bbb" strokeWidth="0.75" />
            </g>
            <text x="220" y="810" fontSize="7" fill="#888">LOCAL</text>
            <text x="220" y="820" fontSize="7" fill="#888">SYS P-363A-0</text>

            <path
              d="M 320 815 Q 510 770, 710 815 T 970 815"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.25"
              strokeDasharray="4 6"
              opacity="0.85"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
            </path>
            <text x="580" y="775" fontSize="7" fill="#3b82f6" fontWeight="bold">ALT PREDICTION BRANCH [SIMULATED FUTURE]</text>

            <line
              x1="200"
              y1="850"
              x2="1050"
              y2="850"
              stroke={isSevered ? "#ef4444" : "#888"}
              strokeWidth={isSevered ? "1.5" : "0.75"}
              opacity="0.4"
            />

            <line
              x1="200"
              y1="850"
              x2="1050"
              y2="850"
              stroke={isSevered ? "#ef4444" : "#3b82f6"}
              strokeWidth="1.25"
              strokeDasharray="6 8"
              opacity="0.95"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2.2s" repeatCount="indefinite" />
            </line>

            {isSevered && (
              <path
                d="M 580 815 Q 645 760, 710 815"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite" />
              </path>
            )}

            {Array.from({ length: 11 }).map((_, i) => {
              const x = 320 + i * 65;
              const isFailedNode = isSevered && i === 5;
              const isNodeHovered = activeTrussNode === i;

              return (
                <g
                  key={`truss-${i}`}
                  onMouseEnter={() => setActiveTrussNode(i)}
                  onMouseLeave={() => setActiveTrussNode(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x - 5}
                    y="810"
                    width="10"
                    height="10"
                    fill={isFailedNode ? "#ef4444" : isNodeHovered ? "#3b82f6" : "none"}
                    stroke={isFailedNode ? "#ef4444" : isNodeHovered ? "#3b82f6" : "#888"}
                    strokeWidth={isNodeHovered ? "1.5" : "1"}
                    transform={`rotate(45 ${x} 815)`}
                  />
                  <rect x={x - 1.5} y={813.5} width="3" height="3" fill={isFailedNode ? "#fff" : isNodeHovered ? "#fff" : "#888"} />

                  <rect
                    x={x - 5}
                    y="880"
                    width="10"
                    height="10"
                    fill={isFailedNode ? "#ef4444" : isNodeHovered ? "#3b82f6" : "none"}
                    stroke={isFailedNode ? "#ef4444" : isNodeHovered ? "#3b82f6" : "#888"}
                    strokeWidth={isNodeHovered ? "1.5" : "1"}
                    transform={`rotate(45 ${x} 885)`}
                  />
                  <rect x={x - 1.5} y={883.5} width="3" height="3" fill={isFailedNode ? "#fff" : isNodeHovered ? "#fff" : "#888"} />

                  <text x={x} y="905" fontSize="6" fill={isFailedNode ? "#ef4444" : isNodeHovered ? "#3b82f6" : "#888"} textAnchor="middle" fontWeight="bold">
                    {isFailedNode ? "SEVERED" : hexTelemetry[i % hexTelemetry.length]}
                  </text>

                  {i < 10 && (
                    <>
                      <line x1={x} y1="815" x2={x + 65} y2="815" stroke={isSevered && i === 5 ? "#ef4444" : "#ccc"} strokeWidth="0.75" />
                      <line x1={x} y1="885" x2={x + 65} y2="885" stroke={isSevered && i === 5 ? "#ef4444" : "#ccc"} strokeWidth="0.75" />
                      <line x1={x} y1="815" x2={x + 65} y2="885" stroke="#ccc" strokeWidth="0.75" />
                      <line x1={x} y1="885" x2={x + 65} y2="815" stroke="#ccc" strokeWidth="0.75" />
                    </>
                  )}
                </g>
              );
            })}

            {isSevered && (
              <g transform="translate(645, 790)">
                <rect x="-70" y="-12" width="140" height="20" fill="#ef4444" />
                <text x="0" y="2" fontSize="8" fill="#fff" textAnchor="middle" fontWeight="bold">
                  ■ SEVERED: UNAUTHORIZED ACTION
                </text>
              </g>
            )}

            {/* 4. CIRCUIT SECTION (04 / PARAMETER FIREWALL ENGINE) */}
            <g
              onMouseEnter={() => setIsCircuitHovered(true)}
              onMouseLeave={() => setIsCircuitHovered(false)}
              className="cursor-pointer"
            >
              {/* Main PCB Circuit Traces */}
              <path d="M 150 1150 L 380 1150 L 420 1200 L 680 1200 L 730 1150 L 1000 1150" fill="none" stroke="#999" strokeWidth="0.75" />
              <path d="M 450 1050 L 500 1100 L 650 1100" fill="none" stroke="#999" strokeWidth="0.75" strokeDasharray="3 3" />
              <path d="M 580 1000 L 630 1050 L 850 1050" fill="none" stroke="#999" strokeWidth="0.75" />

              {/* Animated Dashed PCB Execution Stream Lines */}
              <path
                d="M 150 1150 L 380 1150 L 420 1200 L 680 1200 L 730 1150 L 1000 1150"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="8 8"
                opacity="0.9"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="2.4s" repeatCount="indefinite" />
              </path>

              <path
                d="M 450 1050 L 500 1100 L 650 1100"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.25"
                strokeDasharray="6 6"
                opacity="0.8"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.8s" repeatCount="indefinite" />
              </path>

              {/* Compiler Transformer Node 1 (7k-0X) */}
              <g transform="translate(250, 1060)">
                <rect x="0" y="0" width="100" height="20" fill={isCircuitHovered ? "#3b82f6" : "#444"} transition-colors="true" />
                <text x="50" y="13" fontSize="8" fill="#fff" fontWeight="bold" textAnchor="middle">
                  TRANSFORMER 7k-0X
                </text>
                <text x="0" y="32" fontSize="7" fill="#38bdf8" fontWeight="bold">
                  {compilerSteps[compilerStep]}
                </text>
              </g>

              {/* Compiler Transformer Node 2 (P-12A-B) */}
              <g transform="translate(850, 1120)">
                <rect x="0" y="0" width="100" height="20" fill={isCircuitHovered ? "#3b82f6" : "#444"} transition-colors="true" />
                <text x="50" y="13" fontSize="8" fill="#fff" fontWeight="bold" textAnchor="middle">
                  TRANSFORMER P-12A-B
                </text>
                <text x="0" y="32" fontSize="7" fill="#22c55e" fontWeight="bold">
                  [SANDBOX: ISOLATED OK]
                </text>
              </g>

              {/* Security Telemetry Lock Badges on Hover */}
              {isCircuitHovered && (
                <g transform="translate(500, 1140)">
                  <rect x="-80" y="-12" width="160" height="20" fill="#0f172a" />
                  <text x="0" y="2" fontSize="8" fill="#38bdf8" textAnchor="middle" fontWeight="bold">
                    [✓ SIGNED] [✓ ISOLATED] [✓ TRUSTED]
                  </text>
                </g>
              )}
            </g>

            {/* 5. THE RACK / PRODUCTION SETTLEMENT LIQUID CHAMBERS (05 / PRODUCTION SETTLEMENT) */}
            <g transform="translate(600, 1420)">
              {/* Outer Dashed Blueprint Frame */}
              <rect x="-320" y="-60" width="640" height="120" fill="none" stroke={isRollback ? "#ef4444" : "#777"} strokeWidth="1.5" strokeDasharray="6 3" />

              {/* 16 Vertical Glass Liquid Coolant Capsules */}
              {Array.from({ length: 16 }).map((_, i) => {
                const bx = -298 + i * 38;
                const isPulseActive = pressurePulseIndex === i;
                const liquidHeight = isRollback ? 15 : isPulseActive ? 95 : 85;
                const liquidY = 50 - liquidHeight;

                return (
                  <g key={`blade-${i}`}>
                    {/* Glass Chamber Outline */}
                    <rect
                      x={bx}
                      y="-50"
                      width="24"
                      height="100"
                      fill="none"
                      stroke={isPulseActive ? "#3b82f6" : "#bbb"}
                      strokeWidth={isPulseActive ? "1.5" : "0.75"}
                    />

                    {/* Smooth Quantum Liquid Coolant Fill */}
                    <rect
                      x={bx + 1}
                      y={liquidY}
                      width="22"
                      height={liquidHeight}
                      fill={isRollback ? "#ef4444" : isPulseActive ? "#3b82f6" : "#22c55e"}
                      opacity={isRollback ? "0.4" : isPulseActive ? "0.6" : "0.3"}
                      style={{ transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                    />

                    {/* Hydraulic Pressure Pulse Indicator */}
                    {isPulseActive && (
                      <line x1={bx + 2} y1="-50" x2={bx + 22} y2="-50" stroke="#3b82f6" strokeWidth="2" />
                    )}
                  </g>
                );
              })}

              <line x1="-380" y1="0" x2="380" y2="0" stroke="#bbb" strokeDasharray="3 6" strokeWidth="0.75" />
            </g>

            {/* Restore Point Footer Badge with Automated Rollback Telemetry */}
            <g transform="translate(360, 1520)">
              <rect
                x="0"
                y="0"
                width="240"
                height="26"
                fill={isRollback ? "#ef4444" : "#334155"}
                style={{ transition: "fill 0.3s ease" }}
              />
              <text x="120" y="17" fontSize="10" fill="#fff" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                {isRollback
                  ? "SN: 00:43/20-34 [ROLLBACK TRIGGERED]"
                  : "SN: 00:43/20-34 [RESTORE POINT: SETTLED]"}
              </text>
            </g>

            {/* VISITOR EXPLANATORY LABELS */}
            <foreignObject x="80" y="240" width="220" height="150">
              <div className="flex flex-col border-l-2 border-[#888] pl-4">
                <div className="text-[14px] font-bold text-[#111] font-mono tracking-tight mb-2">01 / PRE-FLIGHT CONSENSUS</div>
                <div className="text-[12px] text-[#555] leading-relaxed">
                  Independent evaluator instances simulate the proposed change against a held-out validation suite before any authorization is granted.
                </div>
              </div>
            </foreignObject>

            <foreignObject x="100" y="480" width="240" height="150">
              <div className="flex flex-col border-l-2 border-[#888] pl-4">
                <div className="text-[14px] font-bold text-[#111] font-mono tracking-tight mb-2">02 / STATE SNAPSHOT REGISTRY</div>
                <div className="text-[12px] text-[#555] leading-relaxed">
                  Every computational step is registered as an immutable volumetric state, allowing the system to diff reality against the agent's expected outcome.
                </div>
              </div>
            </foreignObject>

            <foreignObject x="880" y="730" width="240" height="150">
              <div className="flex flex-col border-r-2 border-[#888] pr-4 text-right">
                <div className="text-[14px] font-bold text-[#111] font-mono tracking-tight mb-2">03 / CAUSALITY LOG</div>
                <div className="text-[12px] text-[#555] leading-relaxed">
                  Changes are bound to a strict structural log. If an agent overreaches its authorized parameters, the chain is instantly severed.
                </div>
              </div>
            </foreignObject>

            <foreignObject x="80" y="1030" width="240" height="150">
              <div className="flex flex-col border-l-2 border-[#888] pl-4">
                <div className="text-[14px] font-bold text-[#111] font-mono tracking-tight mb-2">04 / PARAMETER FIREWALL</div>
                <div className="text-[12px] text-[#555] leading-relaxed">
                  Transformers explicitly restrict permitted tool calls and isolate risky latency. The workload is strictly confined to approved execution environments.
                </div>
              </div>
            </foreignObject>

            <foreignObject x="860" y="1370" width="250" height="150">
              <div className="flex flex-col border-r-2 border-[#888] pr-4 text-right">
                <div className="text-[14px] font-bold text-[#111] font-mono tracking-tight mb-2">05 / PRODUCTION SETTLEMENT</div>
                <div className="text-[12px] text-[#555] leading-relaxed">
                  If pre-deployment charts diverge from actual production impact, the automated restore point instantly reverts state flow control.
                </div>
              </div>
            </foreignObject>
          </svg>
        </div>
      </div>
    </section>
  );
}


