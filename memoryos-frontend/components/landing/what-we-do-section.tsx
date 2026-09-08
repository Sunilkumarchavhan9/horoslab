"use client";

import { motion, useReducedMotion, useInView } from "framer-motion";
import { useEffect, useState, useRef, Fragment } from "react";
import { Database, GitBranch, Shield, Check, User, Target, FileText, Key, Brain, Search, Hammer, ShieldAlert, Bot, Scale } from "lucide-react";
import { MemoryStarLogo } from "./memory-star-logo";
import PixelCard from "../PixelCard";
import { DitherLine } from "./dither-line";

/* === Helper Components === */

function MotionWrapper({ top, left, children, isActive, isPill = false, delay = 0, className = "" }: any) {
  const shouldReduceMotion = useReducedMotion();
  let scaleBase = isPill ? 0.9 : 0;

  return (
    <div className={`absolute z-20 ${className}`} style={{ top, left, transform: "translate(-50%, -50%)" }}>
      <motion.div
        initial={{ opacity: 0, scale: scaleBase }}
        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: scaleBase }}
        transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 20, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function MotionLabel({ top, left, text, isActive }: any) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="absolute z-10" style={{ top, left, transform: "translate(-50%, -50%)" }}>
      <motion.span
        className="block text-[11px] text-slate-500 font-mono whitespace-nowrap"
        initial={{ opacity: 0, y: 3 }}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 3 }}
        transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 20 }}
      >
        {text}
      </motion.span>
    </div>
  );
}

function PillBadge({ label, icon }: { label: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 text-[#F0EFE2] rounded-full border border-slate-700 shadow-[0_0_12px_rgba(15,23,42,0.4)] whitespace-nowrap">
      {icon}
      <span className="text-[11px] font-medium font-mono tracking-tight">{label}</span>
    </div>
  );
}

function BranchNode({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="bg-white border-2 border-slate-300 rounded-full p-1.5 text-slate-600 flex items-center justify-center shadow-[0_0_10px_rgba(148,163,184,0.4)]">
      {icon}
    </div>
  );
}

function Checkmark() {
  return (
    <div className="bg-white rounded-full p-[2px] text-[#0015FF] flex items-center justify-center border-2 border-[#0015FF] shadow-[0_0_8px_rgba(0,21,255,0.5)]">
      <Check size={10} strokeWidth={4} />
    </div>
  );
}

export function WhatWeDoSection() {
  const [step, setStep] = useState(0);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px 0px" });

  useEffect(() => {
    if (!isInView) return;

    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= 12) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [isInView]);

  return (
    <section ref={sectionRef} className="relative w-full bg-white border-t border-slate-200 overflow-hidden" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
      


      <PixelCard variant="default" className="w-full h-full py-32 overflow-hidden relative z-20">

        {/* Header */}
        <div className="w-full max-w-[1400px] mx-auto px-6 mb-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">

            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-4xl"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            >
              Epoch turns agent work into an autonomous <span className="text-[#0015FF]">organization.</span>
            </motion.h2>
            <motion.p
              className="text-lg md:text-[19px] text-slate-500 leading-relaxed max-w-3xl"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            >
              A mission becomes a versioned institution with roles, authority, budget, policy, evidence duties, and settlement. Agents execute inside that institution, independent verifiers decide PASS, FAIL, or UNKNOWN, and the outcome becomes input for the next institutional genome.
            </motion.p>
          </div>
        </div>

        {/* === Main Timeline Graphic === */}
        <div className="w-full overflow-x-auto pb-16">
          <div className="relative bg-transparent select-none h-[1000px] min-w-[1200px] max-w-[1200px] mx-auto">

            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 1200 1000" preserveAspectRatio="xMidYMid meet">

              {/* Background Grid */}
              {Array.from({ length: 49 }).map((_, i) => (
                <line key={i} x1={i * 25} y1="0" x2={i * 25} y2="1000" stroke="#cbd5e1" strokeWidth="1" opacity="0.3" />
              ))}

              {/* Main Horizontal Green Line */}
              <motion.line
                x1="0" y1="500" x2="1200" y2="500"
                stroke="#0015FF" strokeWidth="2"
                style={{ filter: "drop-shadow(0px 0px 6px rgba(0, 21, 255, 0.6))" }}
                initial={{ pathLength: 0 }} animate={{ pathLength: step >= 1 ? 1 : 0 }} transition={{ duration: 10, ease: "linear" }}
              />

              {/* Tick Marks on Main Line */}
              {Array.from({ length: 49 }).map((_, i) => (
                <motion.line
                  key={`tick-${i}`} x1={i * 25} y1="496" x2={i * 25} y2="504"
                  stroke="#0015FF" strokeWidth="2" opacity="0.4"
                  initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? 0.4 : 0 }}
                />
              ))}

              {/* Main line split circles and connectors */}
              {[
                { x: 150, step: 1 },
                { x: 275, step: 2 },
                { x: 400, step: 3 },
                { x: 525, step: 4 },
                { x: 650, step: 5 },
                { x: 775, step: 6 },
                { x: 900, step: 7 },
                { x: 1050, step: 8 }
              ].map((node, i) => {
                const isTop = i % 2 === 0;
                const lineEnd = isTop ? 450 : 550;
                return (
                  <g key={`node-${i}`}>
                    <motion.circle cx={node.x} cy="500" r="4.5" fill="white" stroke="#0015FF" strokeWidth="2" style={{ filter: "drop-shadow(0px 0px 6px rgba(0, 21, 255, 0.6))" }} initial={{ opacity: 0 }} animate={{ opacity: step >= node.step ? 1 : 0 }} />
                    <motion.line x1={node.x} y1="500" x2={node.x} y2={lineEnd} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" style={{ filter: "drop-shadow(0px 0px 4px rgba(148, 163, 184, 0.4))" }} initial={{ opacity: 0 }} animate={{ opacity: step >= node.step ? 1 : 0 }} transition={{ duration: 0.5 }} />
                  </g>
                );
              })}

              {/* Branch 1 Paths (y=350) */}
              <motion.line
                x1="150" y1="500" x2="150" y2="425"
                stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4"
                style={{ filter: "drop-shadow(0px 0px 4px rgba(148, 163, 184, 0.4))" }}
                initial={{ pathLength: 0 }} animate={{ pathLength: step >= 2 ? 1 : 0 }} transition={{ duration: 0.5 }}
              />
              <motion.path
                d="M 150 425 L 150 380 A 30 30 0 0 1 180 350 L 700 350"
                fill="none" stroke="#94a3b8" strokeWidth="1.5"
                style={{ filter: "drop-shadow(0px 0px 4px rgba(148, 163, 184, 0.4))" }}
                initial={{ pathLength: 0 }} animate={{ pathLength: step >= 3 ? 1 : 0 }} transition={{ duration: 1 }}
              />

              {/* Branch 2 Paths (y=650) */}
              <motion.line
                x1="275" y1="500" x2="275" y2="575"
                stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4"
                style={{ filter: "drop-shadow(0px 0px 4px rgba(148, 163, 184, 0.4))" }}
                initial={{ pathLength: 0 }} animate={{ pathLength: step >= 6 ? 1 : 0 }} transition={{ duration: 0.5 }}
              />
              <motion.path
                d="M 275 575 L 275 620 A 30 30 0 0 0 305 650 L 950 650"
                fill="none" stroke="#94a3b8" strokeWidth="1.5"
                style={{ filter: "drop-shadow(0px 0px 4px rgba(148, 163, 184, 0.4))" }}
                initial={{ pathLength: 0 }} animate={{ pathLength: step >= 7 ? 1 : 0 }} transition={{ duration: 1 }}
              />

              {/* Checkmark vertical lines */}
              <motion.line x1="450" y1="342" x2="450" y2="320" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: step >= 4 ? 1 : 0 }} />
              <motion.line x1="550" y1="342" x2="550" y2="320" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: step >= 4 ? 1 : 0 }} />
              <motion.line x1="450" y1="658" x2="450" y2="680" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: step >= 6 ? 1 : 0 }} />
              <motion.line x1="650" y1="658" x2="650" y2="680" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: step >= 8 ? 1 : 0 }} />
              <motion.line x1="725" y1="658" x2="725" y2="680" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: step >= 8 ? 1 : 0 }} />
              <motion.line x1="900" y1="658" x2="900" y2="680" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={{ opacity: step >= 10 ? 1 : 0 }} />

              {/* Loop Back Arc */}
              <motion.path
                d="M 1050 500 C 1050 0, 150 0, 150 500"
                fill="none" stroke="#0015FF" strokeWidth="1.5" strokeDasharray="6 6"
                style={{ filter: "drop-shadow(0px 0px 4px rgba(0, 21, 255, 0.3))" }}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: step >= 11 ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
              />
              {/* Arrowhead */}
              <motion.polygon
                points="146,492 154,492 150,500"
                fill="#0015FF"
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 12 ? 1 : 0 }}
                transition={{ delay: 1.8 }}
              />
            </svg>

            {/* === HTML Nodes Overlay === */}

            {/* Production Badge (Logo) */}
            <MotionWrapper top="496px" left="60px" isActive={step >= 1} isPill>
              <div className="bg-white py-2 px-4 rounded-md border border-slate-200 shadow-[0_0_15px_rgba(255,255,255,1)]">
                <MemoryStarLogo className="h-6 w-auto" />
              </div>
            </MotionWrapper>

            {/* New 8-Node Loop with Detailed Labels */}
            {[
              { label: "Institution", subtext: "mission + roles", x: 150, top: 450, labelTop: 410, step: 1, icon: Database },
              { label: "Authority", subtext: "capability leases", x: 275, top: 550, labelTop: 595, step: 2, icon: Key },
              { label: "Execution", subtext: "agents + humans", x: 400, top: 450, labelTop: 410, step: 3, icon: GitBranch },
              { label: "Verification", subtext: "PASS / FAIL / UNKNOWN", x: 525, top: 550, labelTop: 595, step: 4, icon: Shield },
              { label: "Settlement", subtext: "cost + outcome", x: 650, top: 450, labelTop: 410, step: 5, icon: Scale },
              { label: "Fitness", subtext: "resource delta", x: 775, top: 550, labelTop: 595, step: 6, icon: Brain },
              { label: "Mutation", subtext: "better genome", x: 900, top: 450, labelTop: 410, step: 7, icon: Hammer },
              { label: "Next Institution", subtext: "inherited upgrade", x: 1050, top: 550, labelTop: 595, step: 8, icon: Database }
            ].map((node, i) => (
              <Fragment key={`node-group-${i}`}>
                <MotionWrapper key={`pill-${i}`} top={`${node.top}px`} left={`${node.x}px`} isActive={step >= node.step} isPill>
                  <PillBadge label={node.label} icon={<node.icon size={12} className="text-slate-300" />} />
                </MotionWrapper>
                <MotionLabel key={`label-${i}`} top={`${node.labelTop}px`} left={`${node.x}px`} text={node.subtext} isActive={step >= node.step} />
              </Fragment>
            ))}

            {/* === Branch 1: Constitution (y=350) === */}
            <MotionWrapper top="425px" left="150px" isActive={step >= 2}>
              <BranchNode icon={<GitBranch size={14} />} />
            </MotionWrapper>

            <MotionWrapper top="350px" left="220px" isActive={step >= 2} isPill>
              <PillBadge label="mission-intent" icon={<User size={12} className="text-slate-300" />} />
            </MotionWrapper>

            <MotionWrapper top="350px" left="350px" isActive={step >= 3} isPill>
              <PillBadge label="institution-genome" icon={<Database size={12} className="text-slate-300" />} />
            </MotionWrapper>

            <MotionLabel top="310px" left="450px" text="policy bound" isActive={step >= 4} />
            <MotionWrapper top="350px" left="450px" isActive={step >= 4}><Checkmark /></MotionWrapper>

            <MotionLabel top="310px" left="550px" text="authority leased" isActive={step >= 4} />
            <MotionWrapper top="350px" left="550px" isActive={step >= 4}><Checkmark /></MotionWrapper>

            <MotionWrapper top="350px" left="680px" isActive={step >= 5} isPill>
              <PillBadge label="active-institution" icon={<FileText size={12} className="text-slate-300" />} />
            </MotionWrapper>

            {/* === Branch 2: Execution & Evidence (y=650) === */}
            <MotionWrapper top="575px" left="275px" isActive={step >= 6}>
              <BranchNode icon={<GitBranch size={14} />} />
            </MotionWrapper>

            <MotionWrapper top="650px" left="350px" isActive={step >= 6} isPill>
              <PillBadge label="institution-run" icon={<Database size={12} className="text-slate-300" />} />
            </MotionWrapper>

            <MotionLabel top="695px" left="450px" text="governed execution" isActive={step >= 6} />
            <MotionWrapper top="650px" left="450px" isActive={step >= 6}><Checkmark /></MotionWrapper>

            <MotionWrapper top="650px" left="560px" isActive={step >= 7} isPill>
              <PillBadge label="evidence" icon={<Database size={12} className="text-slate-300" />} />
            </MotionWrapper>

            <MotionLabel top="695px" left="650px" text="claims captured" isActive={step >= 8} />
            <MotionWrapper top="650px" left="650px" isActive={step >= 8}><Checkmark /></MotionWrapper>

            <MotionLabel top="695px" left="725px" text="state checked" isActive={step >= 8} />
            <MotionWrapper top="650px" left="725px" isActive={step >= 8}><Checkmark /></MotionWrapper>

            <MotionWrapper top="650px" left="820px" isActive={step >= 9} isPill>
              <PillBadge label="verifier-roles" icon={<Shield size={12} className="text-slate-300" />} />
            </MotionWrapper>

            <MotionLabel top="695px" left="900px" text="outcome verified" isActive={step >= 10} />
            <MotionWrapper top="650px" left="900px" isActive={step >= 10}><Checkmark /></MotionWrapper>

          </div>
        </div>

        {/* Quote Section */}
        <div className="w-full max-w-[1400px] mx-auto px-6 mb-16 text-center relative z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 relative overflow-hidden">
            <blockquote className="text-xl md:text-2xl font-serif italic text-slate-900 leading-relaxed relative z-10 font-medium">
              "The agent can act. The institution decides whether it was allowed, proven, settled, and worth inheriting."
            </blockquote>
          </div>
        </div>
      </PixelCard>
    </section>
  );
}


