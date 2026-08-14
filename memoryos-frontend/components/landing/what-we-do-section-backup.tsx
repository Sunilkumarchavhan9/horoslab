"use client";

import { motion, useAnimation, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* === Helper Components === */

function MotionWrapper({ top, left, children, isActive, isPill = false, delay = 0, sourceClick = false, translateX = "0px" }: any) {
  const shouldReduceMotion = useReducedMotion();
  
  let animateState: any = isActive ? { opacity: 1, scale: 1, filter: "blur(0px)", x: "-50%", y: "-50%", translateY: "0px", translateX: "0px" } : {};
  if (sourceClick) {
    animateState = { ...animateState, scale: [1, 0.94, 1.04, 1], transition: { duration: 0.4, times: [0, 0.2, 0.6, 1], ease: "easeInOut" } };
  }

  return (
    <motion.div
      className="absolute z-20"
      style={{ top, left }}
      initial={{ opacity: 0, scale: isPill ? 0.86 : 0, filter: "blur(3px)", x: "-50%", y: "-50%", translateY: "6px", translateX }}
      animate={animateState}
      transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 20, delay }}
    >
      {children}
    </motion.div>
  );
}

function MotionLabel({ top, left, text, color = 'text-[var(--landing-subtle)]', isActive }: any) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.span
      className={`absolute text-[10.5px] ${color} font-mono whitespace-nowrap z-10`}
      style={{ top, left }}
      initial={{ opacity: 0, x: "-50%", y: "-50%", translateY: "4px" }}
      animate={isActive ? { opacity: 1, x: "-50%", y: "-50%", translateY: "0px" } : {}}
      transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
    >
      {text}
    </motion.span>
  );
}

function MainDot() {
  return (
    <div className="w-[9px] h-[9px] rounded-full bg-[var(--landing-bg)] border-[2px] border-[#0015FF]" />
  );
}

function BranchBadge({ label, theme, icon }: { label: string, theme: 'light' | 'dark', icon: React.ReactNode }) {
  const isLight = theme === 'light';
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-tight shadow-md border
        ${isLight ? 'bg-[var(--landing-foreground)] text-[var(--landing-bg)] border-transparent' : 'bg-[var(--landing-surface)] text-[var(--landing-foreground)] border-[var(--landing-border)]'}`}
    >
      {icon}
      {label}
    </div>
  );
}

function CheckmarkNode() {
  return (
    <div className="w-[14px] h-[14px] rounded-full bg-[#0015FF] flex items-center justify-center">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--landing-bg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  );
}

function ArrowNode() {
  return (
    <div className="w-6 h-6 rounded-full bg-[var(--landing-bg)] border border-[var(--landing-border)] flex items-center justify-center p-1">
      <svg viewBox="0 0 24 24" fill="currentColor" className="text-[var(--landing-muted)] w-full h-full">
        <polygon points="12,5 20,18 4,18" />
      </svg>
    </div>
  );
}

function GithubNode() {
  return (
    <div className="w-7 h-7 rounded-full bg-[var(--landing-bg)] border border-[var(--landing-border)] flex items-center justify-center p-1">
      <svg viewBox="0 0 24 24" fill="currentColor" className="text-[var(--landing-muted)] w-full h-full">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    </div>
  );
}

function AvatarNode() {
  return (
    <div className="w-7 h-7 rounded-full border-2 border-[var(--landing-muted)] overflow-hidden bg-[var(--landing-surface)] shadow-[0_0_0_2px_var(--landing-bg)]">
      <img src="https://github.com/sunilkumarchavhan9.png" alt="User Profile" className="w-full h-full object-cover" />
    </div>
  );
}

function VerdictContextBlock({ top, left, isActive }: { top: string, left: string, isActive: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div 
      className="absolute flex flex-col items-start z-10" 
      style={{ top, left }}
      initial={{ opacity: 0, y: "-50%", translateY: "6px" }}
      animate={isActive ? { opacity: 1, y: "-50%", translateY: "0px" } : {}}
      transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[14px] h-[14px] rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <span className="text-[10.5px] text-amber-500 font-mono font-bold tracking-widest uppercase">
          CONDITIONAL
        </span>
      </div>
      <div className="border-l border-[var(--landing-border)] pl-3 ml-[6px] flex flex-col gap-1 text-[9px] text-[var(--landing-subtle)] font-mono">
        <span>4 conditions verified</span>
        <span>1 production canary required</span>
        <span>Confidence: <span className="text-[var(--landing-foreground)] font-semibold">94%</span></span>
        <span className="mt-1 pt-1 border-t border-[var(--landing-border)]">
          Composition: AI AGENT / HUMAN
        </span>
      </div>
    </motion.div>
  );
}

function DatabaseIcon(props: any) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  );
}


export function WhatWeDoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.35 });
  const shouldReduceMotion = useReducedMotion();

  const gridControls = useAnimation();
  const mainLineControls = useAnimation();
  const signalControls = useAnimation();
  
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const activate = (id: string) => setActiveIds(prev => new Set([...prev, id]));
  const isActive = (id: string) => activeIds.has(id);
  const [sourceClick, setSourceClick] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    if (shouldReduceMotion) {
      gridControls.start({ scaleY: 1, opacity: 0.04 });
      mainLineControls.start({ pathLength: 1 });
      const allIds = ["agent", "n19", "n38", "n64", "preview-1", "preview-2", "preview-3", "preview-4", "preview-5", "test-1", "test-2", "test-3", "test-4", "test-5", "dev-1", "dev-2", "dev-3", "final"];
      setActiveIds(new Set(allIds));
      return;
    }

    const runSequence = async () => {
      // 1. Grid Reveal
      gridControls.start(i => ({
        scaleY: 1,
        opacity: 0.04,
        transition: { duration: 0.4, delay: i * 0.025, ease: "easeOut" }
      }));

      await new Promise(r => setTimeout(r, 800));

      // 2. Main Line & Source Pill
      signalControls.set({ left: "0%", opacity: 1 });
      mainLineControls.start({ pathLength: 0.1, transition: { duration: 0.3, ease: "linear" } });
      await signalControls.start({ left: "10%", transition: { duration: 0.3, ease: "linear" } });
      
      activate("agent");
      await new Promise(r => setTimeout(r, 400));
      setSourceClick(true);
      await new Promise(r => setTimeout(r, 400));
      setSourceClick(false);

      // 3. To Preview Branch (19%)
      mainLineControls.start({ pathLength: 0.19, transition: { duration: 0.3, ease: "linear" } });
      await signalControls.start({ left: "19%", transition: { duration: 0.3, ease: "linear" } });
      activate("n19");
      await new Promise(r => setTimeout(r, 200));
      
      activate("preview-1");
      await new Promise(r => setTimeout(r, 250));
      activate("preview-2");
      await new Promise(r => setTimeout(r, 250));
      activate("preview-3");
      await new Promise(r => setTimeout(r, 250));
      activate("preview-4");
      await new Promise(r => setTimeout(r, 250));
      activate("preview-5");
      await new Promise(r => setTimeout(r, 250));

      // 4. To Test Branch (38%)
      mainLineControls.start({ pathLength: 0.38, transition: { duration: 0.5, ease: "linear" } });
      await signalControls.start({ left: "38%", transition: { duration: 0.5, ease: "linear" } });
      activate("n38");
      await new Promise(r => setTimeout(r, 200));
      
      activate("test-1");
      await new Promise(r => setTimeout(r, 250));
      activate("test-2");
      await new Promise(r => setTimeout(r, 250));
      activate("test-3");
      await new Promise(r => setTimeout(r, 250));
      activate("test-4");
      await new Promise(r => setTimeout(r, 250));
      activate("test-5");
      await new Promise(r => setTimeout(r, 250));

      // 5. To Dev Branch (64%)
      mainLineControls.start({ pathLength: 0.64, transition: { duration: 0.6, ease: "linear" } });
      await signalControls.start({ left: "64%", transition: { duration: 0.6, ease: "linear" } });
      activate("n64");
      await new Promise(r => setTimeout(r, 200));

      activate("dev-1");
      await new Promise(r => setTimeout(r, 250));
      activate("dev-2");
      await new Promise(r => setTimeout(r, 250));
      activate("dev-3");
      await new Promise(r => setTimeout(r, 250));

      // 6. To End
      mainLineControls.start({ pathLength: 1, transition: { duration: 0.7, ease: "linear" } });
      await signalControls.start({ left: "100%", transition: { duration: 0.7, ease: "linear" } });
      activate("final");
      await signalControls.start({ opacity: 0, transition: { duration: 0.4 } });
    };

    runSequence();
  }, [isInView, shouldReduceMotion, gridControls, mainLineControls, signalControls]);

  return (
    <section ref={containerRef} className="relative bg-[var(--landing-bg)] py-24 overflow-hidden font-mono text-[var(--landing-foreground)] border-y border-[var(--landing-border-soft)]">
      
      {/* Top Right Decorative SVG */}
      <div className="absolute top-0 right-0 z-0 pointer-events-none opacity-80">
        <svg width="398" height="301" viewBox="0 0 398 301" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 md:w-80 h-auto">
          <g filter="url(#filter0_wwd_tr)"><rect x="366" width="32" height="38" fill="#0015FF"/></g>
          <g filter="url(#filter1_wwd_tr)"><rect x="366" y="165" width="32" height="38" fill="#0015FF"/></g>
          <g filter="url(#filter2_wwd_tr)"><rect x="302" width="32" height="38" fill="#0015FF"/></g>
          <g filter="url(#filter3_wwd_tr)"><rect width="32" height="38" fill="url(#paint0_linear_55_3)"/></g>
          <g filter="url(#filter4_wwd_tr)"><rect x="366" y="263" width="32" height="38" fill="black"/></g>
          <g filter="url(#filter5_wwd_tr)"><rect x="334" y="38" width="32" height="38" fill="black"/></g>
          <defs>
            <filter id="filter0_wwd_tr" x="366" y="0" width="32" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="5214" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_55_3">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter id="filter1_wwd_tr" x="366" y="165" width="32" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="5214" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_55_3">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter id="filter2_wwd_tr" x="302" y="0" width="32" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="5214" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_55_3">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter id="filter3_wwd_tr" x="0" y="0" width="32" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="5214" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_55_3">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter id="filter4_wwd_tr" x="366" y="263" width="32" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="5214" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_55_3">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter id="filter5_wwd_tr" x="334" y="38" width="32" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="5214" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_55_3">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <linearGradient id="paint0_linear_55_3" x1="16" y1="0" x2="16" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0015FF"/>
              <stop offset="1"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Left Decorative SVG */}
      <div className="absolute bottom-0 left-0 z-0 pointer-events-none opacity-80">
        <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[21px] md:w-[26px] h-auto">
          <g filter="url(#filter0_wwd_bl)"><rect width="32" height="38" fill="url(#paint0_linear_486_6)"/></g>
          <defs>
            <filter id="filter0_wwd_bl" x="0" y="0" width="32" height="38" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="5214" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_486_6">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <linearGradient id="paint0_linear_486_6" x1="16" y1="0" x2="16" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0015FF"/>
              <stop offset="1"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-6 flex flex-col items-center relative z-10">
        
        {/* === Headline === */}
        <div className="w-full max-w-[1000px] mx-auto mb-16 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-[var(--landing-foreground)] mb-6 leading-[1.15]">
            Every pull request becomes<br className="hidden md:block" /> a compiled <span className="text-[#0015FF]">release decision.</span>
          </h2>
          <p className="text-lg text-[var(--landing-subtle)] font-sans max-w-3xl leading-relaxed">
            memoryos™ converts an agent’s proposed change into a structured model of its effects, verifies the required safety conditions, and returns <span className="text-[#0015FF] font-mono font-bold">PASS</span>, <span className="text-[var(--landing-subtle)] font-mono font-bold">CONDITIONAL</span>, or <span className="text-[var(--landing-foreground)] font-mono font-bold">BLOCK</span> with complete evidence.
          </p>
        </div>

        {/* === Main Timeline Graphic === */}
        <div className="w-full aspect-[2/1] relative bg-[var(--landing-bg)] overflow-visible mt-4 mb-20 select-none">
          
          {/* Signal Indicator */}
          <motion.div 
            className="absolute top-[50%] w-[5px] h-[5px] bg-white rounded-full z-[100] shadow-[0_0_12px_3px_#0015FF] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, left: "0%" }}
            animate={signalControls}
          />

          {/* SVG Canvas for Grid and Paths */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 1000 500" preserveAspectRatio="none">
            
            {/* Faint Vertical Grid Lines */}
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.line 
                key={`grid-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="500" 
                stroke="currentColor" strokeWidth="1" 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={gridControls}
                custom={i}
                style={{ originY: 0 }}
              />
            ))}

            {/* Main Production Line */}
            <motion.line 
              x1="-1000" y1="250" x2="2000" y2="250" 
              stroke="#0015FF" strokeWidth="1.5" opacity="0.8" 
              initial={{ pathLength: 0 }}
              animate={mainLineControls}
            />

            {/* Timeline Ticks on Main Line */}
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.line 
                key={`tick-${i}`} x1={i * 25} y1="245" x2={i * 25} y2="255" 
                stroke="#0015FF" strokeWidth="1.5" 
                initial={{ opacity: 0 }}
                animate={gridControls}
                custom={i}
              />
            ))}

            {/* --- Vertical Dashed Connectors --- */}
            {/* Preview */}
            <motion.line x1="190" y1="250" x2="190" y2="200" stroke="#0015FF" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("preview-1") ? { opacity: 0.7 } : {}} transition={{ duration: 0.3 }} />
            <motion.line x1="190" y1="250" x2="190" y2="280" stroke="#0015FF" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("preview-1") ? { opacity: 0.7 } : {}} transition={{ duration: 0.3 }} />
            
            {/* Test */}
            <motion.line x1="380" y1="250" x2="380" y2="310" stroke="#0015FF" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("test-1") ? { opacity: 0.7 } : {}} transition={{ duration: 0.3 }} />
            <motion.line x1="380" y1="250" x2="380" y2="220" stroke="#0015FF" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("test-1") ? { opacity: 0.7 } : {}} transition={{ duration: 0.3 }} />
            
            {/* Dev */}
            <motion.line x1="640" y1="250" x2="640" y2="190" stroke="#0015FF" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("dev-1") ? { opacity: 0.7 } : {}} transition={{ duration: 0.3 }} />
            <motion.line x1="640" y1="250" x2="640" y2="280" stroke="#0015FF" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("dev-1") ? { opacity: 0.7 } : {}} transition={{ duration: 0.3 }} />

            {/* Label Dashed Lines */}
            <motion.line x1="390" y1="120" x2="390" y2="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("preview-3") ? { opacity: 0.25 } : {}} transition={{ duration: 0.3 }} />
            <motion.line x1="480" y1="120" x2="480" y2="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("preview-4") ? { opacity: 0.25 } : {}} transition={{ duration: 0.3 }} />
            <motion.line x1="560" y1="380" x2="560" y2="410" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("test-3") ? { opacity: 0.25 } : {}} transition={{ duration: 0.3 }} />
            <motion.line x1="700" y1="380" x2="700" y2="410" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("test-4") ? { opacity: 0.25 } : {}} transition={{ duration: 0.3 }} />
            <motion.line x1="850" y1="120" x2="850" y2="90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" initial={{ opacity: 0 }} animate={isActive("dev-3") ? { opacity: 0.25 } : {}} transition={{ duration: 0.3 }} />

            {/* --- Branch Curved Paths --- */}
            <motion.path d="M 190 200 C 190 150, 210 120, 240 120 L 480 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" initial={{ opacity: 0 }} animate={isActive("preview-2") ? { opacity: 0.35 } : {}} transition={{ duration: 0.3 }} />
            <motion.path d="M 380 310 C 380 360, 400 380, 430 380 L 780 380" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" initial={{ opacity: 0 }} animate={isActive("test-2") ? { opacity: 0.35 } : {}} transition={{ duration: 0.3 }} />
            <motion.path d="M 640 190 C 640 150, 660 120, 690 120 L 730 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" initial={{ opacity: 0 }} animate={isActive("dev-2") ? { opacity: 0.35 } : {}} transition={{ duration: 0.3 }} />
            <motion.path d="M 730 120 L 2000 120" fill="none" stroke="currentColor" strokeWidth="1.5" initial={{ opacity: 0 }} animate={isActive("dev-3") ? { opacity: 0.25 } : {}} transition={{ duration: 0.3 }} />
          </svg>

          {/* === Absolute HTML Nodes === */}

          {/* --- Main Line (Y = 50%) --- */}
          <MotionWrapper top="50%" left="10%" isActive={isActive("agent")} isPill sourceClick={sourceClick} translateX="-8px">
            <BranchBadge label="AI Agent / Human" theme="light" icon={<DatabaseIcon />} />
          </MotionWrapper>

          <MotionWrapper top="50%" left="19%" isActive={isActive("n19")}>
            <MainDot />
          </MotionWrapper>
          <MotionLabel top="58%" left="19%" text="18:24:00" isActive={isActive("n19")} />

          <MotionWrapper top="50%" left="38%" isActive={isActive("n38")}>
            <MainDot />
          </MotionWrapper>
          <MotionLabel top="42%" left="38%" text="19:08:12" isActive={isActive("n38")} />

          <MotionWrapper top="50%" left="64%" isActive={isActive("n64")}>
            <MainDot />
          </MotionWrapper>
          <MotionLabel top="58%" left="64%" text="20:32:04" isActive={isActive("n64")} />


          {/* --- Preview Branch (Y = 24%) --- */}
          <MotionWrapper top="40%" left="19%" isActive={isActive("preview-1")}>
            <ArrowNode />
          </MotionWrapper>
          <MotionWrapper top="24%" left="29%" isActive={isActive("preview-2")} isPill>
            <BranchBadge label="GitHub Pull Request" theme="dark" icon={<DatabaseIcon />} />
          </MotionWrapper>

          <MotionWrapper top="24%" left="39%" isActive={isActive("preview-3")}>
            <CheckmarkNode />
          </MotionWrapper>
          <MotionLabel top="16%" left="39%" text="Intent Contract" isActive={isActive("preview-3")} />

          <MotionWrapper top="24%" left="48%" isActive={isActive("preview-4")}>
            <CheckmarkNode />
          </MotionWrapper>
          <MotionLabel top="16%" left="48%" text="Change IR" isActive={isActive("preview-4")} />

          <MotionLabel top="24%" left="57%" text="Living World Model" color="text-[var(--landing-muted)]" isActive={isActive("preview-5")} />


          {/* --- Test Branch (Y = 76%) --- */}
          <MotionWrapper top="62%" left="38%" isActive={isActive("test-1")}>
            <GithubNode />
          </MotionWrapper>
          <MotionWrapper top="76%" left="47%" isActive={isActive("test-2")} isPill>
            <BranchBadge label="Consequence Graph" theme="dark" icon={<DatabaseIcon />} />
          </MotionWrapper>

          <MotionWrapper top="76%" left="56%" isActive={isActive("test-3")}>
            <CheckmarkNode />
          </MotionWrapper>
          <MotionLabel top="84%" left="56%" text="Verification Plan" color="text-[var(--landing-muted)]" isActive={isActive("test-3")} />

          <MotionWrapper top="76%" left="70%" isActive={isActive("test-4")}>
            <CheckmarkNode />
          </MotionWrapper>
          <MotionLabel top="84%" left="70%" text="Evidence Graph" color="text-[var(--landing-muted)]" isActive={isActive("test-4")} />

          <VerdictContextBlock top="76%" left="78%" isActive={isActive("test-5")} />


          {/* --- Dev Branch (Y = 24%) --- */}
          <MotionWrapper top="38%" left="64%" isActive={isActive("dev-1")}>
            <AvatarNode />
          </MotionWrapper>
          <MotionWrapper top="24%" left="73%" isActive={isActive("dev-2")} isPill>
            <BranchBadge label="Release Certificate" theme="light" icon={<DatabaseIcon />} />
          </MotionWrapper>

          <MotionWrapper top="24%" left="85%" isActive={isActive("dev-3")}>
            <CheckmarkNode />
          </MotionWrapper>
          <MotionLabel top="16%" left="85%" text="Reality Settlement" isActive={isActive("dev-3")} />

        </div>

        {/* === Step Labels (5-column strip) === */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-[1200px] mt-8 bg-[var(--landing-bg)] z-20">
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-[var(--landing-subtle)] font-mono font-bold tracking-widest uppercase">01 — Understand</div>
            <p className="text-[var(--landing-muted)] text-xs font-sans leading-relaxed">Determine what the change intends to accomplish and what is actually being modified.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-[var(--landing-subtle)] font-mono font-bold tracking-widest uppercase">02 — Predict</div>
            <p className="text-[var(--landing-muted)] text-xs font-sans leading-relaxed">Trace dependencies, historical incidents, database assumptions, and second-order consequences.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-[var(--landing-subtle)] font-mono font-bold tracking-widest uppercase">03 — Verify</div>
            <p className="text-[var(--landing-muted)] text-xs font-sans leading-relaxed">Select and execute the smallest evidence plan sufficient for the risk.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-[var(--landing-subtle)] font-mono font-bold tracking-widest uppercase">04 — Certify</div>
            <p className="text-[var(--landing-muted)] text-xs font-sans leading-relaxed">Produce a deterministic release decision bound to exact code, policies, and evidence.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-[var(--landing-subtle)] font-mono font-bold tracking-widest uppercase">05 — Settle</div>
            <p className="text-[var(--landing-muted)] text-xs font-sans leading-relaxed">Compare predicted consequences with observed outcomes and learn from divergence.</p>
          </div>
        </div>

        {/* === Closing Line === */}
        <div className="w-full max-w-[800px] mx-auto mt-20 text-center">
          <p className="text-xl md:text-2xl text-[var(--landing-foreground)] font-sans font-medium italic leading-relaxed">
            "Models decide what might be done. memoryos™ determines what has earned the right to become real."
          </p>
        </div>

      </div>
    </section>
  );
}


