"use client";
import { SectionDivider } from "@/components/landing/section-divider";

import React from "react";
import { Cloud, Cpu, Box, Anchor, Bot } from "lucide-react";
import { HorosLogo, ModalLogo, RunPodLogo, MetaLogo, AnthropicLogo, BAAILogo, GLMLogo, GoogleLogo, K8sFaviconLogo, OneXLogo, TeslaLogo, QwenLogo, MistralLogo, HuggingFaceLogo } from "../horos/primitives/brand-icons";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import horosChipImg from "./horos-chip.png";
import { HorosAnimatedLogo } from "./horos-animated-logo";

const PREM_EASE = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -12, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.7, ease: PREM_EASE }
  }
};

const vLineTopVariants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.5, ease: PREM_EASE } }
};

const vLineBotVariants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.5, ease: PREM_EASE } }
};

const hLineVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.5, ease: PREM_EASE } }
};

// Reusable Target Node Component
function TargetNode({
  icon,
  title,
  active = false,
  className = ""
}: {
  icon?: React.ReactNode,
  title: string,
  active?: boolean,
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg border w-44 min-h-[44px] relative z-10 transition-colors ${active ? 'border-[#75bf00] bg-[#1a2600]' : 'border-transparent bg-[#222] hover:bg-[#2a2a2a]'} ${className}`}
    >
      {icon && (
        <div className="flex items-center justify-center w-5 h-5 shrink-0">
          {icon}
        </div>
      )}
      <span className="font-semibold text-[13px] tracking-tight">{title}</span>
    </motion.div>
  );
}

const FLOWING_LOGOS = [
  <QwenLogo size={16} key="1" />,
  <MistralLogo size={16} key="2" />,
  <MetaLogo size={16} key="3" />,
  <AnthropicLogo size={16} key="4" />,
  <GoogleLogo size={16} key="5" />,
  <BAAILogo size={16} key="6" />,
];

// Param node inside the branches
function ParamNode({ title, subtitle, active = false }: { title: string, subtitle: string, active?: boolean }) {
  return (
    <div className={`flex flex-col px-2.5 py-1 rounded-md border w-24 relative z-10 bg-[#1c1c1c] transition-colors ${active ? 'border-[#75bf00]' : 'border-[#333] hover:border-[#555]'}`}>
      <span className="text-[11px] font-semibold text-[#F0EFE2] leading-tight">{title}</span>
      <span className="text-[9px] text-[#C8C7BA] leading-tight">{subtitle}</span>
    </div>
  );
}

const TARGET_Y = [-112, -56, 0, 56, 112];

const generateKeyframes = (spineX: number) => {
  return TARGET_Y.map((y, i) => {
    const pFadeIn = 5;
    const pSpine = 75; // All particles reach the spine at exactly 75% of the animation

    let pTurn = 75;
    if (y !== 0) {
      pTurn = 75 + (Math.abs(y) / (Math.abs(y) + 30)) * 25;
    }
    const pFadeOut = pTurn + 0.5 * (100 - pTurn);

    return `
      @keyframes global-flow-path-${i} {
        0% { transform: translate(0px, 0px) scale(0.5); opacity: 0; }
        ${pFadeIn}% { transform: translate(20px, 0px) scale(1); opacity: 1; }
        ${pSpine}% { transform: translate(${spineX}px, 0px) scale(1); opacity: 1; }
        ${pTurn}% { transform: translate(${spineX}px, ${y}px) scale(1); opacity: 1; }
        ${pFadeOut}% { transform: translate(${spineX + 16}px, ${y}px) scale(1); opacity: 1; }
        100% { transform: translate(${spineX + 32}px, ${y}px) scale(0.5); opacity: 0; }
      }
    `;
  }).join('\n');
};

const NUM_PARTICLES = 4;
const DURATION = 6; // 6 seconds loop

const PARTICLES = Array.from({ length: NUM_PARTICLES }).map((_, i) => {
  const targetIndex = (i * 2 + 1) % TARGET_Y.length;
  const delay = (DURATION / NUM_PARTICLES) * i;
  return { id: i, logoIndex: i % 6, targetIndex, delay };
});

function GlobalParticleSystem({ hoveredNode }: { hoveredNode: 'none' | 'hf' | 'horos' }) {
  // Total horizontal distance from right edge of HF card to left edge of Targets column (the vertical spine):
  // Left Connector (200 - 8 = 192) + HOROS (112) + Right Connector (200 - 8 = 192) = 496px.
  const spineX = 496;

  return (
    <div className={`absolute left-[160px] top-1/2 w-0 h-0 z-0 pointer-events-none transition-opacity duration-300 ${hoveredNode !== 'none' ? 'opacity-0' : 'opacity-100'}`}>
      <style>{generateKeyframes(spineX)}</style>
      {PARTICLES.map(p => {
        const logo = FLOWING_LOGOS[p.logoIndex];
        return (
          <div
            key={p.id}
            className="absolute top-0 left-0 flex items-center justify-center w-7 h-7 bg-[#111] border border-[#333] rounded-[5px] shadow-lg"
            style={{
              marginTop: '-14px',
              marginLeft: '-14px',
              animationName: `global-flow-path-${p.targetIndex}`,
              animationDuration: `${DURATION}s`,
              animationDelay: `${p.delay}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              opacity: 0,
            }}
          >
            {logo}
          </div>
        );
      })}
    </div>
  );
}

export function HardwareDeploymentSection() {
  const [hoveredNode, setHoveredNode] = React.useState<'none' | 'hf' | 'horos'>('none');

  return (
    <>
      <SectionDivider />
      <section className="relative w-full bg-[#151515] text-[#F0EFE2] font-sans select-none overflow-hidden py-12 lg:py-16">
        <style>{`
        .border-dashed.border-\\[\\#75bf00\\] {
          border: none !important;
        }
        /* Horizontal flow (always left to right) */
        .border-dashed.border-\\[\\#75bf00\\].border-t,
        .border-dashed.border-\\[\\#75bf00\\].border-b {
          background-image: linear-gradient(to right, #75bf00 50%, transparent 50%) !important;
          background-size: 12px 1px !important;
          background-repeat: repeat-x !important;
          animation: move-dash-h 0.8s linear infinite !important;
        }
        /* Vertical flow UP */
        .border-dashed.border-\\[\\#75bf00\\].flow-up {
          background-image: linear-gradient(to top, #75bf00 50%, transparent 50%) !important;
          background-size: 1px 12px !important;
          background-repeat: repeat-y !important;
          animation: move-dash-v-up 0.8s linear infinite !important;
        }
        /* Vertical flow DOWN */
        .border-dashed.border-\\[\\#75bf00\\].flow-down {
          background-image: linear-gradient(to bottom, #75bf00 50%, transparent 50%) !important;
          background-size: 1px 12px !important;
          background-repeat: repeat-y !important;
          animation: move-dash-v-down 0.8s linear infinite !important;
        }
        /* Static Vertical Lines (when flow classes are absent) */
        .border-dashed.border-\\[\\#75bf00\\].border-l,
        .border-dashed.border-\\[\\#75bf00\\].border-r {
          background-image: linear-gradient(to bottom, #75bf00 50%, transparent 50%) !important;
          background-size: 1px 12px !important;
          background-repeat: repeat-y !important;
        }
        /* Disable animation on specific dashed lines (MUST BE DEFINED LAST) */
        .border-dashed.border-\\[\\#75bf00\\].no-dash-anim {
          animation: none !important;
        }
        
        @keyframes move-dash-h {
          0% { background-position: 0 0; }
          100% { background-position: 12px 0; }
        }
        @keyframes move-dash-v-down {
          0% { background-position: 0 0; }
          100% { background-position: 0 12px; }
        }
        @keyframes move-dash-v-up {
          0% { background-position: 0 0; }
          100% { background-position: 0 12px; }
        }
        @keyframes flow-horizontal {
          0% { left: 0%; transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          10% { left: 10%; transform: translate(-50%, -50%) scale(1); opacity: 1; }
          90% { left: 90%; transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { left: 100%; transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        }
        .animate-flow-horizontal {
          animation: flow-horizontal linear infinite;
        }
      `}</style>

        {/* 4 Adaptive Vertical Guidelines (2 on Left, 2 on Right) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left Outer Line */}
        <div className="hidden md:block absolute left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
        {/* Left Inner Line */}
        <div className="absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        {/* Right Inner Line */}
        <div className="absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#333]" />
        {/* Right Outer Line */}
        <div className="hidden md:block absolute right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#262626]" />
      </div>

        {/* Header Section */}
        <div className="w-full relative px-4 sm:px-6 md:px-8 lg:px-[10%] xl:px-[14%] 2xl:px-[18%] mb-10 lg:mb-14 text-center">
          <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4 z-10 relative">
            Deploy and <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm inline-block leading-tight">verify</span> anywhere
          </h2>
          <p className="text-[#C8C7BA] max-w-2xl mx-auto text-[15px] z-10 relative">
            HOROS deploys intelligence into software, compute clusters, edge devices, and physical robotics. Actuate when authorized, and verify the physical consequences.
          </p>
        </div>

        {/* Diagram Container */}
        <div className="w-full relative z-10 py-4 overflow-x-auto text-center no-scrollbar">
          <div className="inline-block transform scale-[0.8] sm:scale-90 md:scale-95 lg:scale-100 origin-center transition-transform">
            <div className="flex items-center text-left min-w-max px-6 transition-all duration-500 ease-in-out" style={{ transform: hoveredNode === 'hf' ? 'translateX(0px)' : 'translateX(0)' }}>

              {/* Main Horizontal Spine passing through everything */}
              <div className="flex items-center relative">
                <GlobalParticleSystem hoveredNode={hoveredNode} />

                {/* 1. Source Node (Hugging Face) */}
                <motion.div
                  whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-[#222] w-40 relative z-10 shadow-lg shrink-0 transition-colors duration-300 cursor-pointer ${hoveredNode === 'hf' ? 'border-[#555]' : 'border-[#333]'}`}
                  onMouseEnter={() => setHoveredNode('hf')}
                  onMouseLeave={() => setHoveredNode('none')}
                >
                  <HuggingFaceLogo size={28} className="mb-2" />
                  <span className="font-semibold text-[#F0EFE2] text-[14px] mb-0.5">Hugging Face</span>
                  <span className="text-[11px] text-[#C8C7BA] mb-3">Any Hugging Face model</span>

                  <div className="flex items-center gap-1">
                    {[
                      <QwenLogo size={12} key="q" />,
                      <MistralLogo size={12} key="m" />,
                      <MetaLogo size={12} key="meta" />,
                      <AnthropicLogo size={12} key="a" />,
                      <BAAILogo size={12} key="b" />,
                      <GLMLogo size={12} key="g" />,
                      <GoogleLogo size={12} key="goog" />
                    ].map((logo, i) => (
                      <div key={i} className="w-4.5 h-4.5 rounded-[3px] border border-[#444] bg-[#1a1a1a] flex items-center justify-center">
                        {logo}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Left Connector (Fixed Width to prevent layout shift) */}
                <div className="flex items-center overflow-hidden -mx-1" style={{ width: '200px' }}>
                  {hoveredNode === 'none' ? (
                    /* Default direct connection */
                    <div className="flex items-center w-full min-w-[158px] relative">
                      <div className="w-full h-[1px] border-t border-dashed border-[#75bf00]" />
                    </div>
                  ) : hoveredNode === 'hf' ? (
                    /* Expanded branches for HF hover */
                    <div className="flex items-center justify-center w-full">
                      <div className="flex-1 h-[1px] border-t border-dashed border-[#75bf00]" />

                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-3 relative z-10 shrink-0"
                      >
                        {/* Central cross line (connecting left spine to right spine) */}
                        <motion.div variants={hLineVariants} style={{ transformOrigin: 'left' }} className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] border-t border-dashed border-[#75bf00] -z-10" />

                        {/* Left vertical split (flowing OUTWARDS from center) */}
                        <motion.div variants={vLineTopVariants} style={{ transformOrigin: 'bottom' }} className="absolute left-0 top-1/2 -translate-y-full w-[1px] h-[calc(50%-1.75rem)] border-l border-dashed border-[#75bf00] no-dash-anim" />
                        <motion.div variants={vLineBotVariants} style={{ transformOrigin: 'top' }} className="absolute left-0 top-1/2 w-[1px] h-[calc(50%-1.75rem)] border-l border-dashed border-[#75bf00] no-dash-anim" />

                        {/* Right vertical merge (flowing INWARDS to center) */}
                        <motion.div variants={vLineTopVariants} style={{ transformOrigin: 'bottom' }} className="absolute right-0 top-1/2 -translate-y-full w-[1px] h-[calc(50%-1.75rem)] border-r border-dashed border-[#75bf00] no-dash-anim" />
                        <motion.div variants={vLineBotVariants} style={{ transformOrigin: 'top' }} className="absolute right-0 top-1/2 w-[1px] h-[calc(50%-1.75rem)] border-r border-dashed border-[#75bf00] no-dash-anim" />

                        {[
                          { title: "LLM", subtitle: "chat" },
                          { title: "Code", subtitle: "generation" },
                          { title: "VLM", subtitle: "vision" },
                          { title: "TTS", subtitle: "speech out" },
                          { title: "STT", subtitle: "speech in" },
                          { title: "OCR", subtitle: "extraction" },
                          { title: "Image", subtitle: "generation" },
                          { title: "Video", subtitle: "generation" },
                          { title: "Embeddings", subtitle: "vectors" },
                          { title: "Rankers", subtitle: "reranking" }
                        ].map((node, i) => (
                          <div key={i} className="relative px-5 flex items-center">
                            <motion.div variants={hLineVariants} style={{ transformOrigin: 'left' }} className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-[1px] border-t border-dashed border-[#75bf00] no-dash-anim" />
                            <motion.div variants={itemVariants} className="w-full">
                              <ParamNode title={node.title} subtitle={node.subtitle} />
                            </motion.div>
                            <motion.div variants={hLineVariants} style={{ transformOrigin: 'right' }} className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-[1px] border-t border-dashed border-[#75bf00] no-dash-anim" />
                          </div>
                        ))}
                      </motion.div>

                      <div className="flex-1 h-[1px] border-t border-dashed border-[#75bf00] relative">
                      </div>
                    </div>
                  ) : (
                    /* Expanded branches for HOROS hover */
                    <div className="flex items-center justify-center w-full">
                      <div className="flex-1 h-[1px] border-t border-dashed border-[#75bf00]" />

                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-3 relative z-10 shrink-0 pr-6"
                      >
                        <motion.div variants={hLineVariants} style={{ transformOrigin: 'right' }} className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] border-t border-dashed border-[#75bf00] -z-10" />
                        {/* Right vertical split (flowing OUTWARDS from center) */}
                        <motion.div variants={vLineTopVariants} style={{ transformOrigin: 'bottom' }} className="absolute right-0 top-1/2 -translate-y-full w-[1px] h-[calc(50%-1.75rem)] border-r border-dashed border-[#75bf00] no-dash-anim" />
                        <motion.div variants={vLineBotVariants} style={{ transformOrigin: 'top' }} className="absolute right-0 top-1/2 w-[1px] h-[calc(50%-1.75rem)] border-r border-dashed border-[#75bf00] no-dash-anim" />

                        {[
                          { title: "GPU fit", subtitle: "cost + VRAM" },
                          { title: "Baseline", subtitle: "measured" },
                          { title: "Quantization", subtitle: "quality gated" },
                          { title: "KV cache", subtitle: "memory tuned" },
                          { title: "Checkpoints", subtitle: "versioning" },
                          { title: "LoRA adapters", subtitle: "fine-tuned" },
                          { title: "Prefix caching", subtitle: "prompt reuse" }
                        ].map((node, i) => (
                          <div key={i} className="relative flex items-center justify-end z-10 bg-[#151515]">
                            <motion.div variants={itemVariants}>
                              <ParamNode title={node.title} subtitle={node.subtitle} />
                            </motion.div>
                            <motion.div variants={hLineVariants} style={{ transformOrigin: 'left' }} className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 w-6 h-[1px] border-t border-dashed border-[#75bf00] -z-10 no-dash-anim" />
                          </div>
                        ))}
                      </motion.div>
                      <div className="flex-1 h-[1px] border-t border-dashed border-[#75bf00]" />
                    </div>
                  )}
                </div>

                {/* 2. Center Node (RunInfra) */}
                <motion.div
                  whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-[#222] w-[112px] min-h-[112px] relative z-20 shadow-lg shrink-0 transition-colors duration-300 cursor-pointer ${hoveredNode === 'horos' ? 'border-[#555]' : 'border-[#333]'}`}
                  onMouseEnter={() => setHoveredNode('horos')}
                  onMouseLeave={() => setHoveredNode('none')}
                >
                  <div className="flex-1 flex items-center justify-center mb-0.5 rounded-sm overflow-hidden">
                    <HorosLogo variant="stacked" size="xl" className="text-[#F0EFE2]" />
                  </div>
                </motion.div>

                {/* Right Connector (Fixed Width to prevent layout shift) */}
                <div className="flex items-center overflow-hidden -mx-1" style={{ width: '200px' }}>
                  {hoveredNode === 'horos' ? (
                    /* Expanded branches for HOROS hover */
                    <div className="flex items-center justify-center w-full">
                      <div className="flex-1 h-[1px] border-t border-dashed border-[#75bf00]" />

                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col gap-3 relative z-10 shrink-0 pl-6"
                      >
                        <motion.div variants={hLineVariants} style={{ transformOrigin: 'left' }} className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] border-t border-dashed border-[#75bf00] -z-10 no-dash-anim" />
                        {/* Left vertical merge (flowing INWARDS to center) */}
                        <motion.div variants={vLineTopVariants} style={{ transformOrigin: 'bottom' }} className="absolute left-0 top-1/2 -translate-y-full w-[1px] h-[calc(50%-1.75rem)] border-l border-dashed border-[#75bf00] no-dash-anim" />
                        <motion.div variants={vLineBotVariants} style={{ transformOrigin: 'top' }} className="absolute left-0 top-1/2 w-[1px] h-[calc(50%-1.75rem)] border-l border-dashed border-[#75bf00] no-dash-anim" />

                        {[
                          { title: "Speculation", subtitle: "acceptance" },
                          { title: "Kernels", subtitle: "agent sweep" },
                          { title: "Batching", subtitle: "throughput" },
                          { title: "Cost routing", subtitle: "price/perf" },
                          { title: "Circuit break", subtitle: "fallback" },
                          { title: "Budgets", subtitle: "governance" },
                          { title: "Auditing", subtitle: "compliance" }
                        ].map((node, i) => (
                          <div key={i} className="relative flex items-center z-10 bg-[#151515]">
                            <motion.div variants={hLineVariants} style={{ transformOrigin: 'right' }} className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 w-6 h-[1px] border-t border-dashed border-[#75bf00] -z-10 no-dash-anim" />
                            <motion.div variants={itemVariants}>
                              <ParamNode title={node.title} subtitle={node.subtitle} />
                            </motion.div>
                          </div>
                        ))}
                      </motion.div>

                      <div className="flex-1 h-[1px] border-t border-dashed border-[#75bf00]" />
                    </div>
                  ) : (
                    /* Default / HF hover connection */
                    <div className="flex items-center w-full min-w-[158px] relative">
                      <div className="w-full h-[1px] border-t border-dashed border-[#75bf00]" />
                    </div>
                  )}
                </div>

                {/* 3. Targets Column */}
                <div className="flex flex-col gap-3 relative z-10 pl-8">
                  {/* Vertical spine (flowing OUTWARDS from center to Target nodes) */}
                  <div className="absolute left-0 top-1/2 -translate-y-full w-[1px] h-[112px] border-l border-dashed border-[#75bf00] flow-up -z-10" />
                  <div className="absolute left-0 top-1/2 w-[1px] h-[112px] border-l border-dashed border-[#75bf00] flow-down -z-10" />

                  <div className="relative">
                    <div className="absolute top-1/2 left-[-2rem] w-[2rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                    <TargetNode icon={<HorosLogo size={22} />} title="HOROS Cloud" />
                  </div>

                  <div className="relative">
                    <div className="absolute top-1/2 left-[-2rem] w-[2rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                    <TargetNode icon={<ModalLogo size={22} />} title="Modal" />
                  </div>

                  <div className="relative">
                    <div className="absolute top-1/2 left-[-2rem] w-[2rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                    <TargetNode icon={<RunPodLogo size={22} />} title="RunPod" />
                  </div>

                  <div className="relative">
                    <div className="absolute top-1/2 left-[-2rem] w-[2rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                    <TargetNode icon={<span className="text-[#3b82f6] font-bold text-[22px] leading-none">V</span>} title="Vast.ai" />
                  </div>

                  <div className="relative">
                    <div className="absolute top-1/2 left-[-2rem] w-[2rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                    <TargetNode title="Local hardware" />
                  </div>


                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

