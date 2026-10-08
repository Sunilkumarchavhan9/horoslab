"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RotateCcw } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Deterministic PRNG
function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

const WIDTH = 800;
const HEIGHT = 300;
const INSTABILITY_X = 580;

type Point = { x: number, y: number, reward: number };

function generatePaths() {
  const getRand = sfc32(1337, 42, 999, 12345);
  const primaryPath: Point[] = [];
  const counterfactualPath: Point[] = [];

  // Base learning curve: exponential approach to 0.95
  for (let x = 0; x <= WIDTH; x += 5) {
    const progress = x / WIDTH; // 0 to 1

    // Base mathematical learning curve
    let baseReward = 0.95 * (1 - Math.exp(-progress * 5));

    // Add noise that decreases as progress increases
    const noiseScale = 0.15 * (1 - progress * 0.8);
    const noise = (getRand() - 0.5) * noiseScale;

    let reward = Math.max(0, Math.min(1, baseReward + noise));

    // The Instability Event
    if (x === INSTABILITY_X) {
      reward = 0.45; // Sudden collapse
    } else if (x > INSTABILITY_X && x < INSTABILITY_X + 40) {
      // Recovery phase
      const recProg = (x - INSTABILITY_X) / 40;
      reward = 0.45 + (0.92 - 0.45) * recProg + ((getRand() - 0.5) * 0.05);
    } else if (x >= INSTABILITY_X + 40) {
      // Converging safely to 0.92
      reward = 0.92 + ((getRand() - 0.5) * 0.02);
      if (x === WIDTH) reward = 0.92; // Lock final point
    }

    primaryPath.push({ x, y: HEIGHT - (reward * HEIGHT), reward });

    // Counterfactual (Uncorrected) - only after instability
    if (x >= INSTABILITY_X) {
      if (x === INSTABILITY_X) {
        counterfactualPath.push({ x, y: HEIGHT - (reward * HEIGHT), reward });
      } else {
        // Continues to degrade
        const degProg = (x - INSTABILITY_X) / (WIDTH - INSTABILITY_X);
        let uncorrectedReward = 0.45 - (degProg * 0.3) + ((getRand() - 0.5) * 0.1);
        uncorrectedReward = Math.max(0, uncorrectedReward);
        counterfactualPath.push({ x, y: HEIGHT - (uncorrectedReward * HEIGHT), reward: uncorrectedReward });
      }
    }
  }

  // Generate Rollout Traces
  const rollouts: Point[][] = [];
  for (let r = 0; r < 19; r++) {
    const rRand = sfc32(r * 100, 200, 300, 400);
    const trace: Point[] = [];
    for (let i = 0; i < primaryPath.length; i++) {
      const p = primaryPath[i];
      const progress = p.x / WIDTH;
      // Traces converge as progress increases, but scatter wildly at instability
      let scatter = 0.1 * (1 - progress);
      if (p.x >= INSTABILITY_X && p.x <= INSTABILITY_X + 60) {
        scatter = 0.2; // High disagreement during instability
      }
      const yOffset = (rRand() - 0.5) * scatter * HEIGHT;
      trace.push({ x: p.x, y: p.y + yOffset, reward: 0 });
    }
    rollouts.push(trace);
  }

  return { primaryPath, counterfactualPath, rollouts };
}

const toSvgPath = (points: Point[]) => {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
};

export function AdaptiveRewardObservatory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [activeReward, setActiveReward] = useState(0.00);
  const [showCounterfactual, setShowCounterfactual] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { primaryPath, counterfactualPath, rollouts } = useMemo(() => generatePaths(), []);
  const primarySvgPath = useMemo(() => toSvgPath(primaryPath), [primaryPath]);
  const counterfactualSvgPath = useMemo(() => toSvgPath(counterfactualPath), [counterfactualPath]);
  const rolloutSvgPaths = useMemo(() => rollouts.map(toSvgPath), [rollouts]);

  // Confidence Envelope (Polygon surrounding primary path)
  const confidencePolygon = useMemo(() => {
    let top = "";
    let bottom = "";
    primaryPath.forEach(p => {
      const progress = p.x / WIDTH;
      let spread = 40 * (1 - progress);
      if (p.x === INSTABILITY_X) spread = 60;
      top += `${p.x},${p.y - spread} `;
      bottom = `${p.x},${p.y + spread} ` + bottom;
    });
    return top + bottom;
  }, [primaryPath]);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useGSAP(() => {
    if (!mounted || !containerRef.current) return;
    const scroller = document.querySelector(".landing-scroll-shell") || window;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        scroller: scroller,
        start: "top 65%",
        toggleActions: "play none none none",
      },
      onComplete: () => setIsInteractive(true)
    });

    if (reducedMotion) {
      tl.progress(1);
      return;
    }

    // [0.0s - 0.8s]: Grid and axes calibrate
    tl.to(".aro-grid", { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(".aro-y-label", { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }, 0);

    // [0.5s - 1.5s]: Config values resolve
    tl.to(".aro-config-row", { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 0.5);

    // [1.2s - 4.8s]: Main trajectory & Rollouts develop
    const preInstabilityDuration = 3.6; // 4.8 - 1.2

    // We animate the mask or dashoffset of the primary path up to INSTABILITY_X
    const instabilityPercent = INSTABILITY_X / WIDTH;

    tl.to(".aro-primary-path", {
      strokeDashoffset: (1 - instabilityPercent) * 2000, // Assuming total length ~2000
      duration: preInstabilityDuration,
      ease: "none"
    }, 1.2);

    tl.to(".aro-rollout-path", {
      strokeDashoffset: (1 - instabilityPercent) * 2000,
      duration: preInstabilityDuration,
      ease: "none",
      opacity: 0.1,
      stagger: { each: 0.02, from: "random" }
    }, 1.2);

    // Sync state for readout
    const proxy = { x: 0 };
    tl.to(proxy, {
      x: INSTABILITY_X,
      duration: preInstabilityDuration,
      ease: "none",
      onUpdate: () => updateReadout(proxy.x)
    }, 1.2);

    // [4.8s]: Instability Event
    tl.addLabel("instability", 4.8);
    tl.set(".aro-instability-overlay", { opacity: 1 }, "instability")
      .to(".aro-grid", { scaleY: 1.05, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut", transformOrigin: `center ${HEIGHT - 150}px` }, "instability")
      .to(".aro-instability-dot", { scale: 1.5, opacity: 0, duration: 0.5 }, "instability");

    // Pause for 500ms -> [5.3s]
    tl.addLabel("resume", 5.3);

    // [5.3s - 6.5s]: Counterfactual branch
    tl.to(".aro-counterfactual-path", {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.out"
    }, "resume");

    // [5.3s - 8.5s]: Corrected trajectory recovers and completes
    const postInstabilityDuration = 3.2; // 8.5 - 5.3
    tl.to(".aro-primary-path", {
      strokeDashoffset: 0,
      duration: postInstabilityDuration,
      ease: "power2.out"
    }, "resume");

    tl.to(".aro-rollout-path", {
      strokeDashoffset: 0,
      duration: postInstabilityDuration,
      ease: "power2.out"
    }, "resume");

    tl.to(proxy, {
      x: WIDTH,
      duration: postInstabilityDuration,
      ease: "power2.out",
      onUpdate: () => updateReadout(proxy.x)
    }, "resume");

    // [8.5s - 9.3s]: Verified Convergence
    tl.addLabel("convergence", 8.5);
    tl.to(".aro-final-endpoint", { fill: "#059669", scale: 1.5, duration: 0.4 }, "convergence")
      .to(".aro-convergence-overlay", { opacity: 1, y: -5, duration: 0.5 }, "convergence")
      .to(".aro-counterfactual-group", { opacity: 0, duration: 0.8 }, "convergence"); // Fade out counterfactual

  }, { scope: containerRef, dependencies: [mounted] });

  const updateReadout = (x: number) => {
    // Find closest point
    const point = primaryPath.reduce((prev, curr) =>
      Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
    );
    setActiveStep(Math.round((point.x / WIDTH) * 10000));
    setActiveReward(point.reward);

    // Position cursor
    gsap.set(".aro-cursor", { x: point.x, y: point.y });
    gsap.set(".aro-scanline", { x: point.x });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractive || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(WIDTH, (e.clientX - rect.left) * (WIDTH / rect.width)));
    updateReadout(x);
  };

  const handlePointerLeave = () => {
    if (!isInteractive) return;
    // Animate back to end
    gsap.to(".aro-cursor", { x: WIDTH, y: primaryPath[primaryPath.length - 1].y, duration: 0.4, ease: "power2.out" });
    gsap.to(".aro-scanline", { x: WIDTH, duration: 0.4, ease: "power2.out" });
    setActiveStep(10000);
    setActiveReward(0.92);
  };

  const replay = () => {
    setIsInteractive(false);
    if (containerRef.current) {
      gsap.globalTimeline.getTweensOf(containerRef.current.querySelectorAll("*")).forEach(t => t.kill());
    }
    // Note: properly restarting a scoped timeline requires keeping a ref to `tl`.
    // We'll dispatch a custom event or just unmount/remount in a real scenario, but for now we'll trigger ScrollTrigger refresh.
  };

  return (
    <div ref={containerRef} className="w-full h-full font-sans flex flex-col lg:flex-row relative overflow-hidden group select-none">

      {/* LEFT: Observatory Graph */}
      <div className="flex-[7] relative px-6 lg:px-8 py-8 md:py-10">
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-[14px] font-bold text-gray-900 tracking-wide uppercase">Adaptive Reward Observatory</h3>
            {isInteractive && (
              <button onClick={() => setShowCounterfactual(!showCounterfactual)} className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 transition-colors text-[#C8C7BA] uppercase z-20 relative">
                {showCounterfactual ? "Hide Futures" : "Compare Futures"}
              </button>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#C8C7BA] font-mono uppercase tracking-widest mb-1">Live Readout</div>
            <div className="flex items-baseline gap-4">
              <div className="text-[11px] font-mono text-[#C8C7BA]">Step {activeStep.toLocaleString()}</div>
              <div className={`text-[20px] font-mono font-bold ${activeReward >= 0.9 ? 'text-emerald-600' : 'text-[#2477ff]'}`}>
                {activeReward.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full aspect-[8/3]">
          {mounted && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-full overflow-visible touch-none cursor-crosshair relative z-10"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              {/* Layer 1: Coordinate Field */}
              <g className="aro-grid opacity-0" stroke="#e0e7ff" strokeWidth="1">
                {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val, i) => {
                  const y = HEIGHT - (val * HEIGHT);
                  return (
                    <g key={i}>
                      <line x1="0" y1={y} x2={WIDTH} y2={y} strokeDasharray={val === 0 ? "" : "4 4"} />
                      <text x="-10" y={y + 3} fontSize="10" fontFamily="monospace" fill="#94a3b8" textAnchor="end" className="aro-y-label opacity-0 -translate-x-2">{val.toFixed(1)}</text>
                    </g>
                  );
                })}
                {[0, 2000, 4000, 6000, 8000, 10000].map((val, i) => {
                  const x = (val / 10000) * WIDTH;
                  return <line key={i} x1={x} y1="0" x2={x} y2={HEIGHT} strokeDasharray="2 6" />;
                })}
              </g>

              {/* Layer 4: Confidence Envelope */}
              <polygon points={confidencePolygon} fill="#2477ff" className="opacity-[0.03]" />

              {/* Layer 2: Rollout Traces */}
              <g className="opacity-60 mix-blend-multiply">
                {rolloutSvgPaths.map((path, i) => (
                  <path key={i} d={path} fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3000" strokeDashoffset="3000" className="aro-rollout-path" vectorEffect="non-scaling-stroke" />
                ))}
              </g>

              {/* Layer 6: Counterfactual Branch */}
              <g className={`aro-counterfactual-group ${showCounterfactual ? '!opacity-100' : ''}`}>
                <path d={counterfactualSvgPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,5, 3000" strokeDashoffset="3000" className="aro-counterfactual-path" vectorEffect="non-scaling-stroke" />
                <text x={WIDTH} y={counterfactualPath[counterfactualPath.length - 1]?.y - 10} fontSize="10" fontFamily="sans-serif" fill="#ef4444" textAnchor="end" className="opacity-0 aro-counterfactual-path font-bold tracking-widest">UNCORRECTED</text>
              </g>

              {/* Layer 3: Primary Trajectory */}
              <path d={primarySvgPath} fill="none" stroke="#2477ff" strokeWidth="2" strokeLinejoin="round" strokeDasharray="3000" strokeDashoffset="3000" className="aro-primary-path drop-shadow-sm" vectorEffect="non-scaling-stroke" />

              {/* Active Scanning Elements */}
              <line x1="0" y1="0" x2="0" y2={HEIGHT} stroke="#2477ff" strokeWidth="1" className="aro-scanline opacity-30" strokeDasharray="2 2" />
              <g className="aro-cursor">
                <circle r="12" fill="#2477ff" className="opacity-10" />
                <circle r="4" fill="#2477ff" className="aro-final-endpoint" />
              </g>

              {/* Layer 5: Instability Event Overlays */}
              <g className="aro-instability-overlay opacity-0" transform={`translate(${INSTABILITY_X}, ${HEIGHT - (0.45 * HEIGHT)})`}>
                <circle r="20" fill="none" stroke="#ef4444" strokeWidth="1" className="aro-instability-dot" />
                <circle r="4" fill="#ef4444" />
                <line x1="0" y1="-30" x2="0" y2="-10" stroke="#ef4444" strokeWidth="1" />
                <text x="0" y="-35" fontSize="9" fontFamily="sans-serif" fill="#ef4444" textAnchor="middle" className="font-bold tracking-widest">INSTABILITY DETECTED</text>
              </g>

              {/* Layer 7: Verified Convergence */}
              <g className="aro-convergence-overlay opacity-0" transform={`translate(${WIDTH}, ${HEIGHT - (0.92 * HEIGHT)})`}>
                <circle r="16" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="-80" y1="0" x2="-16" y2="0" stroke="#059669" strokeWidth="1" className="opacity-50" />
                <text x="-8" y="-12" fontSize="9" fontFamily="sans-serif" fill="#059669" textAnchor="end" className="font-bold tracking-widest">CONVERGENCE VERIFIED</text>
              </g>

            </svg>
          )}
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden lg:block w-px h-auto bg-blue-100"></div>

      {/* RIGHT: Configuration Console */}
      <div className="flex-[3] flex flex-col justify-center">
        <div className="text-[10px] text-[#C8C7BA] font-mono uppercase tracking-widest mb-6 border-b border-blue-100 pb-2">Experiment Ledger</div>
        <div className="flex flex-col gap-5">
          {[
            { label: "max_steps", value: "10,000" },
            { label: "rollouts_per_example", value: "19" },
            { label: "seq_len", value: "4" },
            { label: "batch_size", value: "65,536" },
            { label: "max_tokens", value: "256" },
            { label: "learning_rate", value: "0.00005" },
          ].map((param, i) => (
            <div key={i} className="flex justify-between items-center text-[12px] font-mono aro-config-row opacity-0 translate-y-2 group/row">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#2477ff] rounded-full opacity-30 group-hover/row:opacity-100 transition-opacity"></div>
                <span className="text-[#64748b]">{param.label}</span>
              </div>
              <span className="text-gray-900 font-bold">{param.value}</span>
            </div>
          ))}
        </div>

        {isInteractive && (
          <button onClick={() => window.location.reload()} className="mt-12 text-[10px] font-bold tracking-widest uppercase bg-white border border-gray-200 text-gray-600 px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 self-start z-20 relative">
            <RotateCcw size={12} /> Replay Experiment
          </button>
        )}
      </div>

    </div>
  );
}


