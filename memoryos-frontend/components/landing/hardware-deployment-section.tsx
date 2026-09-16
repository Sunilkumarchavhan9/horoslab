"use client";

import React from "react";
import { Cloud, Cpu, Box, Anchor, Bot } from "lucide-react";
import { EpochLogo, ModalLogo, RunPodLogo, MetaLogo, AnthropicLogo, BAAILogo, GLMLogo, GoogleLogo, K8sFaviconLogo, OneXLogo, TeslaLogo, QwenLogo, MistralLogo, HuggingFaceLogo } from "../epoch/primitives/brand-icons";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import epochChipImg from "./epoch-chip.png";

const PREM_EASE = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -12, filter: 'blur(8px)', scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
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
      className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border w-56 min-h-[56px] relative z-10 transition-colors ${active ? 'border-[#75bf00] bg-[#1a2600]' : 'border-transparent bg-[#222] hover:bg-[#2a2a2a]'} ${className}`}
    >
      {icon && (
        <div className="flex items-center justify-center w-6 h-6 shrink-0">
          {icon}
        </div>
      )}
      <span className="font-semibold text-[15px] tracking-tight">{title}</span>
    </motion.div>
  );
}

const FLOWING_LOGOS = [
  <QwenLogo size={20} key="1" />,
  <MistralLogo size={20} key="2" />,
  <MetaLogo size={20} key="3" />,
  <AnthropicLogo size={20} key="4" />,
  <GoogleLogo size={20} key="5" />,
  <BAAILogo size={20} key="6" />,
];




// Param node inside the branches
function ParamNode({ title, subtitle, active = false }: { title: string, subtitle: string, active?: boolean }) {
  return (
    <div className={`flex flex-col px-3 py-1.5 rounded-md border w-28 relative z-10 bg-[#1c1c1c] transition-colors ${active ? 'border-[#75bf00]' : 'border-[#333] hover:border-[#555]'}`}>
      <span className="text-[12px] font-semibold text-[#F0EFE2]">{title}</span>
      <span className="text-[10px] text-[#C8C7BA]">{subtitle}</span>
    </div>
  );
}

const TARGET_Y = [-216, -144, -72, 0, 72, 144, 216];

const generateKeyframes = (spineX: number) => {
  return TARGET_Y.map((y, i) => {
    const pFadeIn = 5;
    const pSpine = 75; // All particles reach the spine at exactly 75% of the animation

    let pTurn = 75;
    if (y !== 0) {
      pTurn = 75 + (Math.abs(y) / (Math.abs(y) + 40)) * 25;
    }
    const pFadeOut = pTurn + 0.5 * (100 - pTurn);

    return `
      @keyframes global-flow-path-${i} {
        0% { transform: translate(0px, 0px) scale(0.5); opacity: 0; }
        ${pFadeIn}% { transform: translate(25px, 0px) scale(1); opacity: 1; }
        ${pSpine}% { transform: translate(${spineX}px, 0px) scale(1); opacity: 1; }
        ${pTurn}% { transform: translate(${spineX}px, ${y}px) scale(1); opacity: 1; }
        ${pFadeOut}% { transform: translate(${spineX + 20}px, ${y}px) scale(1); opacity: 1; }
        100% { transform: translate(${spineX + 40}px, ${y}px) scale(0.5); opacity: 0; }
      }
    `;
  }).join('\n');
};

const NUM_PARTICLES = 4;
const DURATION = 6; // 6 seconds loop

const PARTICLES = Array.from({ length: NUM_PARTICLES }).map((_, i) => {
  const targetIndex = (i * 3 + 1) % 7;
  const delay = (DURATION / NUM_PARTICLES) * i;
  return { id: i, logoIndex: i % 6, targetIndex, delay };
});

function GlobalParticleSystem({ hoveredNode }: { hoveredNode: 'none' | 'hf' | 'epoch' }) {
  const spineX = hoveredNode === 'epoch' ? 784 : (hoveredNode === 'hf' ? 634 : 484);

  return (
    <div className="absolute left-[192px] top-1/2 w-0 h-0 z-0 pointer-events-none">
      <style>{generateKeyframes(spineX)}</style>
      {PARTICLES.map(p => {
        const logo = FLOWING_LOGOS[p.logoIndex];
        return (
          <div
            key={p.id}
            className="absolute top-0 left-0 flex items-center justify-center w-8 h-8 bg-[#111] border border-[#333] rounded-[6px] shadow-lg"
            style={{
              marginTop: '-16px',
              marginLeft: '-16px',
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
  const [hoveredNode, setHoveredNode] = React.useState<'none' | 'hf' | 'epoch'>('none');

  return (
    <section className="relative w-full bg-[#151515] text-[#F0EFE2] font-sans select-none overflow-hidden py-24 border-t border-dashed border-[#333]">
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

      {/* Background Dashed Lines - Global Layout */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[6%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[94%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      {/* Header Section */}
      <div className="w-full relative px-[14%] mb-32 text-center">
        <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4 z-10 relative">
          Deploy and <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm inline-block leading-tight">verify</span> anywhere
        </h2>
        <p className="text-[#C8C7BA] max-w-2xl mx-auto text-[15px] z-10 relative">
          Epoch deploys intelligence into software, compute clusters, edge devices, and physical robotics. Actuate when authorized, and verify the physical consequences.
        </p>
      </div>

      {/* Diagram Container */}
      <div className="w-full relative z-10 flex justify-center items-center py-10 overflow-x-auto">
        <div className="flex items-center min-w-max px-[14%] transition-all duration-500 ease-in-out" style={{ transform: hoveredNode === 'hf' ? 'translateX(0px)' : 'translateX(0)' }}>

          {/* Main Horizontal Spine passing through everything */}
          <div className="flex items-center relative">
            <GlobalParticleSystem hoveredNode={hoveredNode} />

            {/* 1. Source Node (Hugging Face) */}
            <motion.div
              whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border bg-[#222] w-48 relative z-10 shadow-lg shrink-0 transition-colors duration-300 cursor-pointer ${hoveredNode === 'hf' ? 'border-[#555]' : 'border-[#333]'}`}
              onMouseEnter={() => setHoveredNode('hf')}
              onMouseLeave={() => setHoveredNode('none')}
            >
              <HuggingFaceLogo size={32} className="mb-3" />
              <span className="font-semibold text-[#F0EFE2] text-[16px] mb-1">Hugging Face</span>
              <span className="text-[12px] text-[#C8C7BA] mb-4">Any Hugging Face model</span>

              <div className="flex items-center gap-1.5">
                {[
                  <QwenLogo size={14} />,
                  <MistralLogo size={14} />,
                  <MetaLogo size={14} />,
                  <AnthropicLogo size={14} />,
                  <BAAILogo size={14} />,
                  <GLMLogo size={14} />,
                  <GoogleLogo size={14} />
                ].map((logo, i) => (
                  <div key={i} className="w-5 h-5 rounded-[4px] border border-[#444] bg-[#1a1a1a] flex items-center justify-center">
                    {logo}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Conditionally Rendered Left Connector */}
            <div
              className="flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] -mx-1"
              style={{ width: hoveredNode === 'hf' || hoveredNode === 'epoch' ? '308px' : '158px' }}
            >
              {hoveredNode === 'none' ? (
                /* Default direct connection */
                <div className="flex items-center w-full min-w-[158px] relative">
                  <div className="w-full h-[1px] border-t border-dashed border-[#75bf00]" />
                </div>
              ) : hoveredNode === 'hf' ? (
                /* Expanded branches for HF hover */
                <div className="flex items-center w-full min-w-[308px]">
                  <div className="w-7 h-[1px] border-t border-dashed border-[#75bf00]" />

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
                /* Expanded branches for Epoch hover */
                <div className="flex items-center w-full min-w-[308px]">
                  <div className="flex-1 h-[1px] border-t border-dashed border-[#75bf00] relative">
                  </div>

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
                  <div className="w-9 h-[1px] border-t border-dashed border-[#75bf00]" />
                </div>
              )}
            </div>

            {/* 2. Center Node (RunInfra) */}
            <motion.div
              whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border bg-[#222] w-[156px] min-h-[156px] relative z-20 shadow-lg shrink-0 transition-colors duration-300 cursor-pointer ${hoveredNode === 'epoch' ? 'border-[#555]' : 'border-[#333]'}`}
              onMouseEnter={() => setHoveredNode('epoch')}
              onMouseLeave={() => setHoveredNode('none')}
            >
              <div className="flex-1 flex items-center justify-center mb-1 rounded-sm overflow-hidden">
                <svg width="64" height="40" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="64" height="40" />
                  <path d="M53.6688 3.16846H59.9748C60.473 3.16846 60.9508 3.46054 61.3031 3.98044C61.6553 4.50034 61.8532 5.20548 61.8532 5.94073V15.2477C61.8532 15.9829 61.6553 16.6881 61.3031 17.208C60.9508 17.7279 60.473 18.0199 59.9748 18.0199H53.6688C53.1706 18.0199 52.6928 17.7279 52.3405 17.208C51.9882 16.6881 51.7903 15.9829 51.7903 15.2477V5.94073C51.7903 5.20548 51.9882 4.50034 52.3405 3.98044C52.6928 3.46054 53.1706 3.16846 53.6688 3.16846Z" fill="white" />
                  <path d="M22.2725 20.9902H32.3354V33.0694C32.3354 33.8047 32.1375 34.5098 31.7852 35.0297C31.433 35.5496 30.9552 35.8417 30.457 35.8417H24.1509C23.6527 35.8417 23.175 35.5496 22.8227 35.0297C22.4704 34.5098 22.2725 33.8047 22.2725 33.0694V20.9902Z" fill="white" />
                  <path d="M14.7589 6.13867H21.065C21.5632 6.13867 22.0409 6.43075 22.3932 6.95065C22.7455 7.47056 22.9434 8.1757 22.9434 8.91095V20.9902H14.7589C14.2607 20.9902 13.7829 20.6981 13.4307 20.1782C13.0784 19.6583 12.8805 18.9531 12.8805 18.2179V8.91095C12.8805 8.1757 13.0784 7.47056 13.4307 6.95065C13.7829 6.43075 14.2607 6.13867 14.7589 6.13867Z" fill="white" />
                  <path d="M41.7274 20H49.9119C50.4101 20 50.8879 20.2921 51.2401 20.812C51.5924 21.3319 51.7903 22.037 51.7903 22.7723V32.0792C51.7903 32.8145 51.5924 33.5196 51.2401 34.0395C50.8879 34.5594 50.4101 34.8515 49.9119 34.8515H43.6058C43.1076 34.8515 42.6299 34.5594 42.2776 34.0395C41.9253 33.5196 41.7274 32.8145 41.7274 32.0792V20Z" fill="white" />
                  <path d="M4.02514 21.9805H10.3312C10.8294 21.9805 11.3072 22.2725 11.6594 22.7924C12.0117 23.3124 12.2096 24.0175 12.2096 24.7527V34.0597C12.2096 34.7949 12.0117 35.5001 11.6594 36.02C11.3072 36.5399 10.8294 36.832 10.3312 36.832H4.02514C3.52695 36.832 3.04917 36.5399 2.6969 36.02C2.34463 35.5001 2.14673 34.7949 2.14673 34.0597V24.7527C2.14673 24.0175 2.34463 23.3124 2.6969 22.7924C3.04917 22.2725 3.52695 21.9805 4.02514 21.9805Z" fill="white" />
                  <path d="M33.543 6.13867H39.849C40.3472 6.13867 40.825 6.43075 41.1773 6.95065C41.5295 7.47056 41.7274 8.1757 41.7274 8.91095V20.9902H31.6646V8.91095C31.6646 8.1757 31.8625 7.47056 32.2147 6.95065C32.567 6.43075 33.0448 6.13867 33.543 6.13867Z" fill="white" />
                  <path d="M22.9434 18.2178C22.9434 20.297 23.319 20.9901 24.8218 20.9901H22.9434V18.2178Z" fill="white" />
                  <path d="M31.6645 18.2178C31.6645 20.297 31.2889 20.9901 29.7861 20.9901H31.6645V18.2178Z" fill="white" />
                  <path d="M22.2725 23.7625C22.2725 21.6833 21.8968 20.9902 20.3941 20.9902H22.2725V23.7625Z" fill="white" />
                  <path d="M41.7275 23.7625C41.7275 21.6833 41.3518 20.9902 39.8491 20.9902H41.7275V23.7625Z" fill="white" />
                  <path d="M32.3354 23.7625C32.3354 21.6833 32.7111 20.9902 34.2138 20.9902H32.3354V23.7625Z" fill="white" />
                  <path d="M41.7274 17.228C41.7274 19.3072 42.1031 20.0003 43.6058 20.0003H41.7274V17.228Z" fill="white" />
                </svg>
              </div>
              <span className="font-semibold text-[#F0EFE2] text-[15px] tracking-tight">epochInfra</span>
            </motion.div>

            {/* Conditionally Rendered Right Connector */}
            <div
              className="flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] -mx-1"
              style={{ width: hoveredNode === 'epoch' ? '308px' : '158px' }}
            >
              {hoveredNode === 'epoch' ? (
                /* Expanded branches for Epoch hover */
                <div className="flex items-center w-full min-w-[308px]">
                  <div className="w-9 h-[1px] border-t border-dashed border-[#75bf00] relative">
                  </div>

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

                  <div className="w-8 h-[1px] border-t border-dashed border-[#75bf00]" />
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
            <div className="flex flex-col gap-4 relative z-10 pl-10">
              {/* Vertical spine (flowing OUTWARDS from center to Target nodes) */}
              <div className="absolute left-0 top-1/2 -translate-y-full w-[1px] h-[calc(50%-2rem)] border-l border-dashed border-[#75bf00] flow-up -z-10" />
              <div className="absolute left-0 top-1/2 w-[1px] h-[calc(50%-2rem)] border-l border-dashed border-[#75bf00] flow-down -z-10" />

              <div className="relative">
                <div className="absolute top-1/2 left-[-2.5rem] w-[2.5rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                <TargetNode icon={<EpochLogo size={36} />} title="Epoch Cloud" />
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-[-2.5rem] w-[2.5rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                <TargetNode icon={<ModalLogo size={36} />} title="Modal" />
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-[-2.5rem] w-[2.5rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                <TargetNode icon={<RunPodLogo size={36} />} title="RunPod" />
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-[-2.5rem] w-[2.5rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                <TargetNode icon={<span className="text-[#3b82f6] font-bold text-[36px] leading-none">V</span>} title="Vast.ai" />
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-[-2.5rem] w-[2.5rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                <TargetNode title="Local hardware" />
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-[-2.5rem] w-[2.5rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                <TargetNode icon={<K8sFaviconLogo size={36} />} title="Kubernetes" />
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-[-2.5rem] w-[2.5rem] h-[1px] border-t border-dashed border-[#75bf00]" />
                <TargetNode icon={<Bot size={36} />} title="Robotic Systems" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
