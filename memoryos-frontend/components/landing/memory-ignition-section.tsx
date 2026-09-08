"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Reveal } from "./motion";
import { Database, Terminal, ArrowUp, Check } from "lucide-react";
import { MemoryosLogoMark } from "@/components/continuity-lab/memoryos-logo-mark";
import { NewMemoryOsLogo } from "./new-memoryos-logo";
import { MemoryStarLogo } from "./memory-star-logo";

// Helper for typing effect in chat bubble
const TypingChat = () => {
  const text = "> Create an institution to run this agent workflow safely.";
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-[#0015FF] text-[#F0EFE2] p-5 rounded-md rounded-bl-sm max-w-[280px] shadow-lg text-[13px] leading-relaxed font-medium"
      >
        {displayed}
        <span className="animate-pulse inline-block ml-1">_</span>
      </motion.div>
      {/* Typing indicator dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: displayed.length === text.length ? 1 : 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-1.5 mt-4 ml-2 items-center"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#006EFF] animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </motion.div>
    </div>
  );
};

export function MemoryIgnitionSection() {
  const [activeFunnelCol, setActiveFunnelCol] = useState(2);
  const funnelData = [
    { label: "Sources Checked", val: "1.2k", verified: "1,200", coverage: "98%", drop: "2%" },
    { label: "Rules Validated", val: "1.1k", verified: "1,100", coverage: "100%", drop: "8%" },
    { label: "Tests Passed", val: "950", verified: "950", coverage: "100%", drop: "0%" },
    { label: "Trace Verified", val: "800", verified: "800", coverage: "100%", drop: "15%" },
    { label: "Approved", val: "750", verified: "750", coverage: "100%", drop: "5%" },
  ];

  const [activeRiskCol, setActiveRiskCol] = useState(6);
  const riskDates = ["Aug 25", "Sep 1", "Sep 8", "Sep 15", "Sep 22", "Sep 29", "Oct 6", "Oct 13", "Oct 20", "Oct 27", "Nov 3"];
  const activeRiskColData = [
    { max: "98°", min: "-2.10°", change: "+12%" },
    { max: "105°", min: "-1.50°", change: "+25%" },
    { max: "111°", min: "-4.17°", change: "+52%" },
    { max: "142°", min: "-8.30°", change: "+85%" },
    { max: "156°", min: "-12.5°", change: "+120%" },
    { max: "160°", min: "-15.2°", change: "+145%" },
    { max: "155°", min: "-11.8°", change: "+110%" },
    { max: "120°", min: "-6.40°", change: "+60%" },
    { max: "105°", min: "-3.20°", change: "+20%" },
    { max: "95°", min: "-1.80°", change: "-5%" },
    { max: "92°", min: "-1.10°", change: "-12%" },
  ];

  const activeRisk = {
    date: riskDates[activeRiskCol] || "Oct 6",
    incidents: (activeRiskCol >= 3 && activeRiskCol < 7) ? 7 : 0,
    files: (activeRiskCol >= 3 && activeRiskCol < 7) ? "200+" : "10+",
    max: activeRiskColData[activeRiskCol]?.max || "111°",
    min: activeRiskColData[activeRiskCol]?.min || "-4.17°",
    change: activeRiskColData[activeRiskCol]?.change || "+52%"
  };

  return (
    <section className="relative w-full overflow-hidden bg-white flex flex-col items-center pt-24 pb-32">

      {/* Diagonal lines background pattern (optional, mimicking reference) */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 8px)' }}></div>

      <div className="w-full max-w-[1100px] relative px-6 z-10">

        {/* HEADER AREA */}
        <div className="w-full pb-20 flex flex-col items-center text-center">
          <Reveal className="flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-5">
              Every agent starts with an institutional <span className="text-[#0015FF]">brief.</span>
            </h2>
            <p className="text-[16px] text-slate-500 max-w-[640px] font-light leading-relaxed">
              Before work begins, Epoch gives the agent its mission, authority boundary, risky files, required tests, human approvals, evidence duties, and settlement rule.
            </p>
          </Reveal>
        </div>

        {/* 2x2 GRID */}
        <div className="w-full relative">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* ---------------- BOX 1: Node Workflow UI ---------------- */}
            <div className="flex flex-col border-b md:border-r border-slate-200 p-8 md:p-10 h-[440px] relative group overflow-hidden bg-white">

              <div className="flex-1 flex items-center justify-center relative w-full h-[260px] mt-4">

                {/* Fixed Container for precise positioning */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[260px] scale-[0.55] sm:scale-[0.8] md:scale-100">
                  <style>{`
                    @keyframes dashFlow {
                      to { stroke-dashoffset: -24; }
                    }
                    .animate-dash-flow {
                      animation: dashFlow 1.5s linear infinite;
                    }
                    @keyframes customFloatSlow {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-4px); }
                    }
                    .animate-custom-float-slow {
                      animation: customFloatSlow 4s ease-in-out infinite;
                    }
                  `}</style>

                  {/* SVG Connecting Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 260">
                    <defs>
                      <filter id="glowPacket" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Left and Right connecting lines */}
                    <g stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" fill="none" className="animate-dash-flow">
                      {/* Left branches (merging to center) */}
                      <path d="M 108 39 C 180 39, 190 130, 230 130" />
                      <path d="M 108 103 C 180 103, 190 130, 230 130" />
                      <path d="M 108 167 C 180 167, 190 130, 230 130" />
                      <path d="M 108 231 C 180 231, 190 130, 230 130" />
                      
                      {/* Right branches (merging to center) */}
                      <path d="M 492 39 C 420 39, 410 130, 370 130" />
                      <path d="M 492 103 C 420 103, 410 130, 370 130" />
                      <path d="M 492 167 C 420 167, 410 130, 370 130" />
                      <path d="M 492 231 C 420 231, 410 130, 370 130" />
                    </g>
                  </svg>

                  {/* Hub and Spoke Nodes */}
                  
                  {/* Left Nodes */}
                  {[
                    // GitHub
                    <svg key="1" viewBox="0 0 24 24" fill="#181717" className="w-[20px] h-[20px]"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
                    // GitLab
                    <svg key="2" viewBox="0 0 24 24" className="w-[20px] h-[20px]"><path d="M23.955 13.587l-2.242-6.904a.63.63 0 0 0-.6-.438h-.012a.633.633 0 0 0-.594.462l-1.464 4.887H4.957L3.493 6.707a.634.634 0 0 0-.594-.462h-.01a.631.631 0 0 0-.602.438L.045 13.587a.754.754 0 0 0 .272.825L12 23.064l11.683-8.652a.754.754 0 0 0 .272-.825z" fill="#E24329"/><path d="M12 23.064l11.683-8.652H12.012z" fill="#FC6D26"/><path d="M12 23.064V14.41H.317z" fill="#FC6D26"/><path d="M4.957 11.594l1.464-4.887L12 14.41H4.957z" fill="#FCA326"/><path d="M19.043 11.594l-1.464-4.887L12 14.41h7.043z" fill="#FCA326"/></svg>,
                    // Notion
                    <svg key="3" viewBox="0 0 24 24" className="w-[20px] h-[20px]"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" fill="#000000" /></svg>,
                    // Slack
                    <svg key="4" viewBox="0 0 24 24" className="w-[20px] h-[20px]"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/><path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/><path d="M18.956 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.835zM17.688 8.835a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313z" fill="#2EB67D"/><path d="M15.165 18.958a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.52v-2.522h2.52zM15.165 17.687a2.527 2.527 0 0 1-2.52-2.52 2.528 2.528 0 0 1 2.52-2.522h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52h-6.313z" fill="#ECB22E"/></svg>
                  ].map((icon, i) => (
                    <div key={i} className="absolute w-[48px] h-[48px] flex items-center justify-center z-10 animate-custom-float-slow" style={{ left: '60px', top: `${15 + i * 64}px`, animationDelay: `${i * 0.2}s` }}>
                      {icon}
                    </div>
                  ))}

                  {/* Center Node (MemoryOS Core Full Logo) */}
                  <div className="absolute w-[140px] h-[50px] flex items-center justify-center z-10 animate-custom-float-slow" style={{ left: '230px', top: '105px', animationDelay: '1s' }}>
                    <div className="flex items-center justify-center scale-[0.65] origin-center">
                      <MemoryStarLogo />
                    </div>
                  </div>

                  {/* Right Nodes */}
                  {[
                    // Docker
                    <svg key="1" viewBox="-0.07 71.3 511.97 369.5" fill="#2496ED" className="w-[22px] h-[22px]"><path d="M501.4 212.3c-11.5-8-38-11-58.6-7-2.4-20-13.5-37.5-32.7-53l-11-8-7.7 11.5c-9.6 15-14.4 36-13 56 .5 7 2.9 19.5 10.1 30.5-6.7 4-20.7 9-38.9 9H2.3l-1 4c-3.4 20-3.4 82.5 36 130.5 29.8 36.5 74 55 132.1 55 125.9 0 219.1-60.5 262.8-170 17.3.5 54.3 0 73-37.5.5-1 1.4-3 4.8-10.5l1.9-4zM280 71.3h-52.8v50H280zm0 60h-52.8v50H280zm-62.5 0h-52.8v50h52.8zm-62.4 0h-52.8v50h52.8zm-62.5 60H39.8v50h52.8zm62.5 0h-52.8v50h52.8zm62.4 0h-52.8v50h52.8zm62.5 0h-52.8v50H280zm62.4 0h-52.8v50h52.8z"/></svg>,
                    // Figma
                    <svg key="2" viewBox="0 0 38 57" className="w-[18px] h-[18px]" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE"/><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83"/><path d="M19 0L9.5 0A9.5 9.5 0 0 0 0 9.5 9.5 9.5 0 0 0 9.5 19H19V0z" fill="#F24E1E"/><path d="M19 19H9.5A9.5 9.5 0 0 0 0 28.5 9.5 9.5 0 0 0 9.5 38H19V19z" fill="#A259FF"/><path d="M38 9.5A9.5 9.5 0 0 1 28.5 19H19V0h9.5A9.5 9.5 0 0 1 38 9.5z" fill="#FF7262"/></svg>,
                    // Discord
                    <svg key="3" viewBox="0 0 127.14 96.36" fill="#5865F2" className="w-[20px] h-[20px]"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>,
                    // Asana
                    <svg key="4" viewBox="0 0 24 24" fill="#F06A6A" className="w-[20px] h-[20px]"><path d="M12 2a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm-7.6 13.2a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm15.2 0a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8z"/></svg>
                  ].map((icon, i) => (
                    <div key={i} className="absolute w-[48px] h-[48px] flex items-center justify-center z-10 animate-custom-float-slow" style={{ left: '492px', top: `${15 + i * 64}px`, animationDelay: `${i * 0.3}s` }}>
                      {icon}
                    </div>
                  ))}
                </div>

              </div>
              <Reveal delay={0.1} className="mt-auto relative z-10">
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2">Institution Pre-flight Brief</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Give Epoch a goal, and the runtime generates the mission contract, role map, authority chain, proof requirements, and next action.
                </p>
              </Reveal>
            </div>

            {/* ---------------- BOX 2: Scanner UI ---------------- */}
            <div className="flex flex-col border-b border-slate-200 p-8 md:p-10 h-[440px] relative group overflow-hidden bg-white">

              <div className="flex-1 flex items-center justify-center relative w-full h-[260px] mt-4">

                {/* Fixed Container */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[260px] flex items-center justify-center scale-[0.85] md:scale-100">

                  {/* SVG Definitions for Noise */}
                  <svg className="absolute w-0 h-0">
                    <defs>
                      <filter id="squiggles">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.5" numOctaves="1" stitchTiles="stitch" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.4 0 0 0 0 0.45 0 0 0 0 0.55 1 0 0 0 0" />
                      </filter>
                    </defs>
                  </svg>

                  {/* The Scanner Line & Beam */}
                  <div className="absolute top-0 bottom-0 left-[275px] z-20 flex flex-col items-center">

                    {/* Top Pill */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#7b61ff] to-[#5b3df5] rounded-md px-4 py-2 flex items-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.4)] z-10 w-max">
                      <div className="w-3.5 h-3.5 rounded-full border-[2px] border-white/20 border-t-[#00ffcc] border-l-[#00ffcc] animate-spin"></div>
                      <span className="text-[#F0EFE2] text-[13px] font-medium tracking-wide">Coverage 78%</span>
                      {/* Smooth rounded downward pointer using SVG */}
                      <svg className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 text-[#6853f8]" width="14" height="7" viewBox="0 0 14 7" fill="none">
                        <path d="M 0 0 L 14 0 L 8.5 5.5 C 7.5 6.5 6.5 6.5 5.5 5.5 Z" fill="currentColor" />
                      </svg>
                    </div>

                    {/* Vertical Line */}
                    <div className="w-[1.5px] h-full bg-[#816bf5] relative mt-7">
                      {/* Left glowing gradient beam */}
                      <div className="absolute top-0 right-full w-[250px] h-full bg-gradient-to-l from-[#816bf5]/40 to-transparent pointer-events-none"></div>

                      {/* Floating Particles (White dust) */}
                      <div className="absolute top-[30px] -left-[10px] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>
                      <div className="absolute top-[80px] -left-[30px] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white]"></div>
                      <div className="absolute top-[110px] -left-[60px] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_white]"></div>
                      <div className="absolute top-[140px] -left-[15px] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white]"></div>
                      <div className="absolute top-[160px] -left-[80px] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white]"></div>
                      <div className="absolute top-[200px] -left-[20px] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>
                      <div className="absolute top-[220px] -left-[45px] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white]"></div>
                      <div className="absolute top-[50px] -left-[120px] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white] opacity-60"></div>
                      <div className="absolute top-[180px] -left-[130px] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white] opacity-60"></div>
                    </div>
                  </div>

                  {/* The Blurry Layer */}
                  <div className="absolute inset-0 z-10 pointer-events-none" style={{ maskImage: 'linear-gradient(to right, black 50%, transparent 50%)', WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 50%)' }}>
                    <motion.div
                      className="flex items-center w-max h-full"
                      animate={{ x: ["-50%", "0%"] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    >
                      {/* Render two identical blocks for seamless infinite scrolling */}
                      {[1, 2].map((key) => (
                        <div key={key} className="flex flex-col justify-center gap-6 w-[800px] h-full shrink-0 pt-[30px]">
                          {[
                            [{ w: 140 }, { w: 150 }, { w: 180 }, { w: 160 }],
                            [{ w: 100 }, { w: 210 }, { w: 140 }, { w: 180 }],
                            [{ w: 220 }, { w: 170 }, { w: 140 }, { w: 130 }],
                            [{ w: 130 }, { w: 160 }, { w: 130 }, { w: 140 }],
                          ].map((row, i) => (
                            <div key={i} className={`flex items-center gap-6 ${i % 2 === 0 ? 'translate-x-[20px]' : 'translate-x-[-30px]'}`}>
                              {row.map((c, j) => (
                                <div key={j} className="bg-slate-100 rounded-full blur-[1px] opacity-80 border border-slate-200 overflow-hidden relative p-1.5 shrink-0 h-[38px]" style={{ width: c.w }}>
                                  <svg className="w-full h-full opacity-70"><rect width="100%" height="100%" filter="url(#squiggles)" /></svg>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* The Clear Layer */}
                  <div className="absolute inset-0 z-10 pointer-events-none" style={{ maskImage: 'linear-gradient(to right, transparent 50%, black 50%)', WebkitMaskImage: 'linear-gradient(to right, transparent 50%, black 50%)' }}>
                    <motion.div
                      className="flex items-center w-max h-full"
                      animate={{ x: ["-50%", "0%"] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    >
                      {[1, 2].map((key) => (
                        <div key={key} className="flex flex-col justify-center gap-6 w-[800px] h-full shrink-0 pt-[30px]">
                          {[
                            [{ label: "E-commerce", check: true, w: 140 }, { label: "Healthcare App", w: 150 }, { label: "Finance Dashboard", check: true, w: 180 }, { label: "Logistics Engine", w: 160 }],
                            [{ label: "Portal", w: 100 }, { label: "Media Streaming Ser...", check: true, w: 210 }, { label: "CRM System", w: 140 }, { label: "Analytics Platform", w: 180 }],
                            [{ label: "Crypto Wallet & Exch...", check: true, w: 220 }, { label: "Analytics Platform", w: 170 }, { label: "Cloud Infra", check: true, w: 140 }, { label: "HR System", w: 130 }],
                            [{ label: "Real estate", check: true, w: 130 }, { label: "Logistics Engine", w: 160 }, { label: "HR System", check: true, w: 130 }, { label: "E-commerce", w: 140 }],
                          ].map((row, i) => (
                            <div key={i} className={`flex items-center gap-6 ${i % 2 === 0 ? 'translate-x-[20px]' : 'translate-x-[-30px]'}`}>
                              {row.map((c, j) => (
                                <div key={j} className="bg-white border border-slate-200 shadow-sm rounded-full px-4 flex items-center gap-2 shrink-0 h-[38px]" style={{ width: c.w }}>
                                  <span className="text-[13px] font-medium text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">{c.label}</span>
                                  {c.check && <div className="w-4 h-4 shrink-0 rounded-full bg-[#00c569] flex items-center justify-center ml-auto"><Check className="w-2.5 h-2.5 text-[#F0EFE2]" strokeWidth={3} /></div>}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* The Scanner Line & Beam */}
                  <div className="absolute top-0 bottom-0 left-[275px] z-20 flex flex-col items-center">

                    {/* Top Pill */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#608ee6] via-[#4879de] to-[#356acc] rounded-md px-4 py-1.5 flex items-center gap-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_15px_rgba(53,106,204,0.4)] w-max border border-blue-400/20 z-10">
                      <svg className="w-[14px] h-[14px] animate-spin" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00ffcc" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" stroke="url(#spinGrad)" strokeWidth="3.5" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" />
                      </svg>
                      <span className="text-[#F0EFE2] text-[13px] font-medium tracking-wide">Coverage 78%</span>
                      {/* Smooth rounded downward pointer using SVG */}
                      <svg className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 text-[#4879de]" width="14" height="7" viewBox="0 0 14 7" fill="none">
                        <path d="M 0 0 L 14 0 L 8.5 5.5 C 7.5 6.5 6.5 6.5 5.5 5.5 Z" fill="currentColor" />
                      </svg>
                    </div>

                    {/* Vertical Line */}
                    <div className="w-[1.5px] h-full bg-[#356acc] relative z-0">
                      {/* Left glowing gradient beam */}
                      <div className="absolute top-0 right-full w-[250px] h-full bg-gradient-to-l from-[#356acc]/40 to-transparent pointer-events-none"></div>

                      {/* Floating Particles (Twinkling Stars) */}
                      {[
                        { top: 30, left: 10, size: "w-1.5 h-1.5", delay: 0 },
                        { top: 80, left: 30, size: "w-1 h-1", delay: 0.5 },
                        { top: 110, left: 60, size: "w-1.5 h-1.5", delay: 1.2 },
                        { top: 140, left: 15, size: "w-1 h-1", delay: 0.8 },
                        { top: 160, left: 80, size: "w-1 h-1", delay: 0.3 },
                        { top: 200, left: 20, size: "w-1.5 h-1.5", delay: 1.5 },
                        { top: 220, left: 45, size: "w-1 h-1", delay: 0.9 },
                        { top: 50, left: 120, size: "w-1 h-1", delay: 0.2 },
                        { top: 180, left: 130, size: "w-1 h-1", delay: 1.1 },
                        { top: 20, left: 100, size: "w-1 h-1", delay: 0.7 },
                        { top: 150, left: 110, size: "w-1.5 h-1.5", delay: 1.8 },
                        { top: 70, left: 150, size: "w-1 h-1", delay: 0.4 },
                        { top: 230, left: 90, size: "w-1 h-1", delay: 1.3 },
                        { top: 100, left: 180, size: "w-1.5 h-1.5", delay: 0.6 },
                        { top: 190, left: 160, size: "w-1 h-1", delay: 1.6 },
                        { top: 40, left: 190, size: "w-1 h-1", delay: 0.1 },
                        { top: 120, left: 220, size: "w-1.5 h-1.5", delay: 1.4 },
                        { top: 210, left: 230, size: "w-1 h-1", delay: 0.5 },
                      ].map((star, i) => (
                        <motion.div
                          key={i}
                          className={`absolute bg-white rounded-full shadow-[0_0_8px_white] ${star.size}`}
                          style={{ top: star.top, left: -star.left }}
                          animate={{ opacity: [0.1, 1, 0.1], scale: [0.6, 1.1, 0.6] }}
                          transition={{ duration: 2 + (i % 2), repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              </div>
              <Reveal delay={0.2} className="mt-8 relative z-20">
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2">Institution Readiness Quality</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Readiness scoring checks whether the institution has enough context, policy, evidence, verifier coverage, and authority to begin.
                </p>
              </Reveal>
            </div>

            {/* ---------------- BOX 3: Heatmap Chart ---------------- */}
            <div className="flex flex-col md:border-r border-b md:border-b-0 border-slate-200 p-8 md:p-10 h-[440px] relative group overflow-hidden bg-white">
              <div className="flex-1 relative w-full h-[220px] -mx-2 mt-4">

                {/* Complex SVG Chart (Heatmap + Line + Annotations) */}
                <svg className="absolute inset-0 w-[110%] h-[110%] -left-[5%] -top-[5%]" viewBox="0 0 600 300" preserveAspectRatio="none">
                  <defs>
                    <clipPath id="scanClip">
                      <motion.rect animate={{ x: activeRiskCol * 50 + 50 }} transition={{ duration: 0.5, type: "spring", bounce: 0.2 }} y="0" width="100" height="300" />
                    </clipPath>
                  </defs>

                  {/* Grid Lines */}
                  {[50, 125, 200, 275].map((y, i) => (
                    <line key={`h-${i}`} x1="0" y1={y} x2="600" y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                  ))}
                  {[100, 200, 300, 400, 500].map((x, i) => (
                    <line key={`v-${i}`} x1={x} y1="0" x2={x} y2="280" stroke="#f1f5f9" strokeWidth="1.5" />
                  ))}

                  {/* Y-axis Labels */}
                  <text x="590" y="50" textAnchor="end" fill="#94a3b8" fontSize="11">100°</text>
                  <text x="590" y="125" textAnchor="end" fill="#94a3b8" fontSize="11">50°</text>
                  <text x="590" y="275" textAnchor="end" fill="#94a3b8" fontSize="11">0°</text>

                  {/* X-axis Labels */}
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S'].map((month, i) => (
                    <text key={`m-${i}`} x={80 + i * 50} y="295" fill="#94a3b8" fontSize="11" textAnchor="middle">{month}</text>
                  ))}

                  {/* Heatmap (Animated Red/Blue Density Blocks) */}
                  <g opacity="0.85">
                    {/* Simulated heatmap data - roughly following a sine wave */}
                    {Array.from({ length: 11 }).map((_, col) => {
                      const x = 50 + col * 50;
                      // Base Y follows a wave
                      const baseY = 160 + Math.sin(col * 0.6) * 60;

                      // Risk Zone (Red) vs Safe Zone (Blue)
                      const isIncidentZone = x >= 150 && x < 350;
                      const colorOuter = isIncidentZone ? "#fca5a5" : "#93c5fd";
                      const colorMid = isIncidentZone ? "#ef4444" : "#0015FF";
                      const colorCore = isIncidentZone ? "#b91c1c" : "#1d4ed8";

                      return (
                        <g key={`col-${col}`}>
                          {/* Faint outer blocks */}
                          <rect x={x} y={baseY - 60} width="50" height="30" fill={colorOuter} opacity="0.05" />
                          <rect x={x} y={baseY + 60} width="50" height="30" fill={colorOuter} opacity="0.05" />

                          {/* Mid blocks */}
                          <rect x={x} y={baseY - 30} width="50" height="30" fill={colorMid} opacity="0.1" />
                          <rect x={x} y={baseY + 30} width="50" height="30" fill={colorMid} opacity="0.1" />

                          {/* Core dense blocks */}
                          <rect x={x} y={baseY} width="50" height="30" fill={colorCore} opacity="0.25" />
                        </g>
                      );
                    })}
                  </g>

                  {/* Interactive Hitboxes */}
                  {Array.from({ length: 11 }).map((_, col) => (
                    <rect key={`hitbox-${col}`} x={25 + col * 50} y="0" width="50" height="300" fill="transparent" style={{ cursor: 'pointer' }} onClick={() => setActiveRiskCol(col)} />
                  ))}

                  {/* Sliding Scan Window (Green Box + Annotations) */}
                  <motion.g
                    animate={{ x: activeRiskCol * 50 - 100 }}
                    transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
                    className="pointer-events-none"
                  >
                    {/* Highlighted Box (Green) */}
                    <g opacity="1">
                      <rect x="150" y="20" width="100" height="260" fill="#22c55e" fillOpacity="0.03" stroke="#22c55e" strokeWidth="1.5" />

                      {/* Highlight Box Top/Bottom indicators */}
                      <rect x="145" y="20" width="10" height="6" rx="3" fill="#22c55e" />
                      <rect x="245" y="274" width="10" height="6" rx="3" fill="#22c55e" />
                      <text x="200" y="35" textAnchor="middle" fill="#16a34a" fontSize="11" fontWeight="600">{activeRisk.incidents} incidents</text>
                    </g>

                    {/* Dotted Annotation Lines */}
                    {/* Maximum */}
                    <line x1="150" y1="50" x2="250" y2="50" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="255" y="45" fill="#475569" fontSize="10">maximum</text>
                    <motion.text x="255" y="58" fill="#0f172a" fontSize="12" fontWeight="bold">{activeRisk.max}</motion.text>

                    {/* Minimum */}
                    <line x1="150" y1="260" x2="250" y2="260" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="255" y="255" fill="#475569" fontSize="10">minimum</text>
                    <motion.text x="255" y="268" fill="#0f172a" fontSize="12" fontWeight="bold">{activeRisk.min}</motion.text>

                    {/* Change */}
                    <line x1="220" y1="120" x2="250" y2="120" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Dynamic arrow up/down */}
                    {activeRisk.change.startsWith("-") ? (
                      <path d="M 245 110 L 245 125 L 242 122 M 245 125 L 248 122" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                    ) : (
                      <path d="M 245 125 L 245 110 L 242 113 M 245 110 L 248 113" fill="none" stroke="#0015FF" strokeWidth="1.5" />
                    )}
                    <text x="255" y="110" fill="#475569" fontSize="10">change</text>
                    <motion.text x="255" y="123" fill="#0f172a" fontSize="12" fontWeight="bold">{activeRisk.change}</motion.text>
                  </motion.g>

                  {/* Static Data Lines and Points */}
                  <path
                    d="M 25 120 L 75 140 L 125 170 L 175 180 L 225 160 L 275 130 L 325 120 L 375 125 L 425 150 L 475 160 L 525 130 L 575 110"
                    fill="none" stroke="#94a3b8" strokeWidth="2.5"
                  />
                  {[
                    [25, 120], [75, 140], [125, 170], [175, 180], [225, 160], [275, 130],
                    [325, 120], [375, 125], [425, 150], [475, 160], [525, 130], [575, 110]
                  ].map(([cx, cy], i) => (
                    <circle key={`pt-${i}`} cx={cx} cy={cy} r="4" fill="#94a3b8" />
                  ))}

                  {/* Dynamically Highlighted Line and Points (Clipped by Green Box) */}
                  <g clipPath="url(#scanClip)">
                    <path
                      d="M 25 120 L 75 140 L 125 170 L 175 180 L 225 160 L 275 130 L 325 120 L 375 125 L 425 150 L 475 160 L 525 130 L 575 110"
                      fill="none" stroke="#0f172a" strokeWidth="3"
                    />
                    {[
                      [25, 120], [75, 140], [125, 170], [175, 180], [225, 160], [275, 130],
                      [325, 120], [375, 125], [425, 150], [475, 160], [525, 130], [575, 110]
                    ].map(([cx, cy], i) => (
                      <circle key={`hpt-${i}`} cx={cx} cy={cy} r="4.5" fill="#0f172a" />
                    ))}
                  </g>
                </svg>
              </div>
              <Reveal delay={0.3} className="mt-auto relative z-10">
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2">Past Failures & Risk Memory</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Historical failures become institutional boundaries: risky files, forbidden actions, required verifiers, rollback policies, and escalation rules.
                </p>
              </Reveal>
            </div>

            {/* ---------------- BOX 4: Funnel Chart ---------------- */}
            <div className="flex flex-col p-8 md:p-10 h-[440px] relative group overflow-hidden bg-white">
              <div className="flex-1 relative w-full h-[220px] -mx-2 mt-4">

                {/* Complex SVG Funnel Chart */}
                <svg className="absolute inset-0 w-[110%] h-[110%] -left-[5%] -top-[5%]" viewBox="0 0 500 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#0015FF" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="slopeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="highlightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#0015FF" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="bgHighlight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#eff6ff" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>

                    {/* Diagonal Stripes Pattern */}
                    <pattern id="stripes" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" strokeWidth="3" />
                    </pattern>
                    <mask id="stripeMask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect width="100%" height="100%" fill="url(#stripes)" />
                    </mask>

                    {/* Drop shadow for tooltip */}
                    <filter id="shadow" x="-10%" y="-20%" width="120%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* Highlighted Column Background */}
                  <motion.rect animate={{ x: activeFunnelCol * 100 }} y="0" width="100" height="300" fill="url(#bgHighlight)" transition={{ type: "spring", bounce: 0.2 }} />

                  {/* Vertical dividers */}
                  {[100, 200, 300, 400].map((x) => (
                    <line key={`div-${x}`} x1={x} y1="0" x2={x} y2="300" stroke="#f1f5f9" strokeWidth="1" />
                  ))}

                  {/* Column 0 */}
                  <g transform="translate(0, 0)" onClick={() => setActiveFunnelCol(0)} style={{ cursor: 'pointer' }}>
                    <text x="10" y="20" fill={activeFunnelCol === 0 ? "#0f172a" : "#94a3b8"} fontSize="10" fontWeight={activeFunnelCol === 0 ? "600" : "400"}>Sources Checked</text>
                    <motion.text x="10" y="45" fill={activeFunnelCol === 0 ? "#0f172a" : "#cbd5e1"} fontSize="22" fontWeight={activeFunnelCol === 0 ? "500" : "300"}>1.2k</motion.text>
                    {activeFunnelCol !== 0 && <rect x="40" y="55" width="16" height="4" rx="2" fill="#93c5fd" />}

                    <motion.rect x="10" y="110" height="190" width="70" fill={activeFunnelCol === 0 ? "url(#highlightGrad)" : "url(#barGrad)"} mask={activeFunnelCol === 0 ? undefined : "url(#stripeMask)"} />
                    <motion.polygon fill="url(#slopeGrad)" points="80,110 95,160 95,300 80,300" />
                  </g>

                  {/* Column 1 */}
                  <g transform="translate(100, 0)" onClick={() => setActiveFunnelCol(1)} style={{ cursor: 'pointer' }}>
                    <text x="10" y="20" fill={activeFunnelCol === 1 ? "#0f172a" : "#94a3b8"} fontSize="10" fontWeight={activeFunnelCol === 1 ? "600" : "400"}>Rules Validated</text>
                    <motion.text x="10" y="45" fill={activeFunnelCol === 1 ? "#0f172a" : "#cbd5e1"} fontSize="22" fontWeight={activeFunnelCol === 1 ? "500" : "300"}>1.1k</motion.text>
                    {activeFunnelCol !== 1 && <rect x="40" y="55" width="16" height="4" rx="2" fill="#93c5fd" />}

                    <motion.rect x="10" y="160" height="140" width="70" fill={activeFunnelCol === 1 ? "url(#highlightGrad)" : "url(#barGrad)"} mask={activeFunnelCol === 1 ? undefined : "url(#stripeMask)"} />
                    <motion.polygon fill="url(#slopeGrad)" points="80,160 95,210 95,300 80,300" />
                  </g>

                  {/* Column 2 */}
                  <g transform="translate(200, 0)" onClick={() => setActiveFunnelCol(2)} style={{ cursor: 'pointer' }}>
                    <text x="10" y="20" fill={activeFunnelCol === 2 ? "#0f172a" : "#94a3b8"} fontSize="10" fontWeight={activeFunnelCol === 2 ? "600" : "400"}>Tests Passed</text>
                    <motion.text x="10" y="45" fill={activeFunnelCol === 2 ? "#0f172a" : "#cbd5e1"} fontSize="22" fontWeight={activeFunnelCol === 2 ? "500" : "300"}>950</motion.text>
                    {activeFunnelCol !== 2 && <rect x="40" y="55" width="16" height="4" rx="2" fill="#93c5fd" />}

                    <motion.rect x="10" y="210" height="90" width="70" fill={activeFunnelCol === 2 ? "url(#highlightGrad)" : "url(#barGrad)"} mask={activeFunnelCol === 2 ? undefined : "url(#stripeMask)"} />
                    <motion.polygon fill="url(#slopeGrad)" points="80,210 95,240 95,300 80,300" />
                  </g>

                  {/* Column 3 */}
                  <g transform="translate(300, 0)" onClick={() => setActiveFunnelCol(3)} style={{ cursor: 'pointer' }}>
                    <text x="10" y="20" fill={activeFunnelCol === 3 ? "#0f172a" : "#94a3b8"} fontSize="10" fontWeight={activeFunnelCol === 3 ? "600" : "400"}>Trace Verified</text>
                    <motion.text x="10" y="45" fill={activeFunnelCol === 3 ? "#0f172a" : "#cbd5e1"} fontSize="22" fontWeight={activeFunnelCol === 3 ? "500" : "300"}>800</motion.text>
                    {activeFunnelCol !== 3 && <rect x="40" y="55" width="16" height="4" rx="2" fill="#93c5fd" />}

                    <motion.rect x="10" y="240" height="60" width="70" fill={activeFunnelCol === 3 ? "url(#highlightGrad)" : "url(#barGrad)"} mask={activeFunnelCol === 3 ? undefined : "url(#stripeMask)"} />
                    <motion.polygon fill="url(#slopeGrad)" points="80,240 95,260 95,300 80,300" />
                  </g>

                  {/* Column 4 */}
                  <g transform="translate(400, 0)" onClick={() => setActiveFunnelCol(4)} style={{ cursor: 'pointer' }}>
                    <text x="10" y="20" fill={activeFunnelCol === 4 ? "#0f172a" : "#94a3b8"} fontSize="10" fontWeight={activeFunnelCol === 4 ? "600" : "400"}>Approved</text>
                    <motion.text x="10" y="45" fill={activeFunnelCol === 4 ? "#0f172a" : "#cbd5e1"} fontSize="22" fontWeight={activeFunnelCol === 4 ? "500" : "300"}>750</motion.text>
                    {activeFunnelCol !== 4 && <rect x="40" y="55" width="16" height="4" rx="2" fill="#93c5fd" />}

                    <motion.rect x="10" y="260" height="40" width="80" fill={activeFunnelCol === 4 ? "url(#highlightGrad)" : "url(#barGrad)"} mask={activeFunnelCol === 4 ? undefined : "url(#stripeMask)"} />
                  </g>

                  {/* Hover Tooltip and Cursor Animation */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                  >
                    <motion.g
                      animate={{ y: [0, -8, 0], x: [0, -4, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {/* Hover Tooltip over highlighted column */}
                      <motion.g animate={{ x: [20, 60, 140, 220, 260][activeFunnelCol] }} transition={{ type: "spring", bounce: 0.2 }} transform="translate(0, 160)" filter="url(#shadow)">
                        <rect x="0" y="0" width="220" height="28" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                        <text x="15" y="18" fill="#0f172a" fontSize="10">
                          <tspan fontWeight="bold">{funnelData[activeFunnelCol].verified}</tspan> verified | Coverage: <tspan fontWeight="bold">{funnelData[activeFunnelCol].coverage}</tspan> | Drop-off: <tspan fontWeight="bold">{funnelData[activeFunnelCol].drop}</tspan>
                        </text>
                      </motion.g>
                    </motion.g>
                  </motion.g>
                </svg>

              </div>
              <Reveal delay={0.4} className="mt-auto relative z-10">
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2">Trace Proof & Authority</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Every brief includes trace proof: sources used, policies checked, capability leases, approval status, and what must be proven before settlement.
                </p>
              </Reveal>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}


