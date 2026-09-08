"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { RotateCcw } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);
}

const WIDTH = 600;
const HEIGHT = 380;
const CX = 300;
const CY = 320;
const R_INNER = 160;
const R_OUTER = 220;

type Checkpoint = { id: number; name: string; angle: number; x: number; y: number; ox: number; oy: number };

const CHECKPOINTS: Omit<Checkpoint, 'x'|'y'|'ox'|'oy'>[] = [
  { id: 1, name: "01 — SOURCE EVENT", angle: Math.PI },
  { id: 2, name: "02 — REALITY FAILURE", angle: Math.PI * 0.75 },
  { id: 3, name: "03 — EVAL CASE", angle: Math.PI * 0.5 },
  { id: 4, name: "04 — MISSION PATCH", angle: Math.PI * 0.25 },
  { id: 5, name: "05 — NEXT-MISSION PROTECTION", angle: 0 }
];

const getPoint = (angle: number, radius: number) => ({
  x: CX + radius * Math.cos(angle),
  y: CY - radius * Math.sin(angle)
});

// Generate high-resolution paths for exact 1-to-1 node morphing
const generatePath = (radius: number, isRuptured: boolean) => {
  const points = 100;
  let d = "";
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const angle = Math.PI - (t * Math.PI); // 180 to 0
    let r = radius;
    
    // Create the downward rupture near Checkpoint 02 (135 degrees)
    if (isRuptured) {
      const cp2Angle = Math.PI * 0.75;
      const dist = Math.abs(angle - cp2Angle);
      if (dist < 0.25) {
        // dip down (decrease radius slightly and add y-offset by faking radius)
        // using a smooth gaussian-like dip
        const dip = Math.cos((dist / 0.25) * (Math.PI / 2));
        r -= dip * 12;
      }
    }
    
    const pt = getPoint(angle, r);
    d += `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)} `;
  }
  return d;
};

export function CounterfactualReplayChamber() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [mounted, setMounted] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: -1000, y: -1000 });
  
  const points = useMemo<Checkpoint[]>(() => 
    CHECKPOINTS.map(c => ({
      ...c,
      ...getPoint(c.angle, R_INNER),
      ox: getPoint(c.angle, R_OUTER).x,
      oy: getPoint(c.angle, R_OUTER).y
    }))
  , []);

  const pathA = useMemo(() => generatePath(R_INNER, true), []);  // Ruptured
  const pathB = useMemo(() => generatePath(R_INNER, false), []); // Corrected
  const outerPath = useMemo(() => generatePath(R_OUTER, false), []); // Dashed counterfactual

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;
    const scroller = document.querySelector(".landing-scroll-shell") || window;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => setIsInteractive(true)
    });

    if (isReduced) {
      tl.progress(1);
      return;
    }

    // Initialize state
    tl.set(".crc-inner-path", { attr: { d: pathA } });
    
    // --- 01 TRACE INITIALIZATION ---
    tl.to(".crc-inner-path", { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" })
      .to(".crc-outer-path", { strokeDashoffset: 0, duration: 1.5, opacity: 0.15, ease: "power2.inOut" }, 0.5)
      .to(".crc-cross", { scale: 1, opacity: 1, stagger: 0.1, duration: 0.4, ease: "back.out(2)" }, 0.5)
      .to(".crc-mission-label", { opacity: 1, y: 0, duration: 0.5 }, 1.0);

    // --- 02 FIRST MISSION ---
    tl.addLabel("first-mission", 1.5);
    tl.set(".crc-signal-1", { opacity: 1, x: points[0].x, y: points[0].y }, "first-mission");
    tl.to(".crc-signal-1", {
      motionPath: {
        path: `M ${points[0].x} ${points[0].y} A ${R_INNER} ${R_INNER} 0 0 1 ${points[1].x - 10} ${points[1].y + 10}`,
      },
      duration: 1,
      ease: "power2.in"
    }, "first-mission");

    // --- 03 REALITY FAILURE ---
    tl.addLabel("failure", 2.5);
    // Rupture pulse & Grid interference
    tl.to(".crc-interference-wave", { scale: 2.5, opacity: 0, duration: 0.6, ease: "power2.out" }, "failure")
      .to(".crc-divergence-label", { opacity: 1, duration: 0.2 }, "failure")
      .to(".crc-signal-1", { fill: "#ea580c", duration: 0.1 }, "failure")
      .to(".crc-cp-2", { stroke: "#ea580c", duration: 0.1 }, "failure");
      
    // Signal fragments
    tl.to(".crc-signal-1", { opacity: 0, duration: 0.1 }, "failure+=0.4");
    tl.to(".crc-frag", { opacity: 1, duration: 0.1, stagger: 0.05 }, "failure+=0.4");
    // Scatter fragments slightly
    tl.to(".crc-frag-1", { x: "-=5", y: "-=5", duration: 0.3, ease: "power1.out" }, "failure+=0.4")
      .to(".crc-frag-2", { x: "+=6", y: "-=2", duration: 0.3, ease: "power1.out" }, "failure+=0.4")
      .to(".crc-frag-3", { x: "-=2", y: "+=6", duration: 0.3, ease: "power1.out" }, "failure+=0.4");

    // Pause for failure absorption
    tl.addLabel("rewind", 3.5);

    // --- 04 CAUSAL REWIND ---
    // Scanning wave moves back
    tl.set(".crc-scan-wave", { opacity: 1, x: points[1].x, y: points[1].y }, "rewind");
    tl.to(".crc-scan-wave", {
      motionPath: { path: `M ${points[1].x} ${points[1].y} A ${R_INNER} ${R_INNER} 0 0 0 ${points[0].x} ${points[0].y}` },
      duration: 1,
      ease: "none"
    }, "rewind");
    tl.to(".crc-scan-wave", { opacity: 0, duration: 0.2 }, "rewind+=1");
    // Ghost path behind it
    tl.to(".crc-inner-path", { stroke: "#e2e8f0", duration: 1 }, "rewind");
    tl.to(".crc-divergence-label", { opacity: 0, duration: 0.3 }, "rewind");
    // Checkpoints deactivate
    tl.to(".crc-cp-2, .crc-cp-1", { stroke: "#94a3b8", duration: 0.5 }, "rewind");
    // Reveal dashed arc as replay
    tl.to(".crc-outer-path", { opacity: 0.5, stroke: "#94a3b8", duration: 0.5 }, "rewind+=0.5");

    // --- 05 EVAL CASE GENERATION ---
    tl.addLabel("eval-case", 4.5);
    // Fragments travel to apex
    tl.to(".crc-frag-1", { motionPath: { path: `M ${points[1].x-5} ${points[1].y-5} Q ${CX-40} ${CY-R_INNER-20} ${points[2].x} ${points[2].y}` }, duration: 0.8, ease: "power1.inOut" }, "eval-case")
      .to(".crc-frag-2", { motionPath: { path: `M ${points[1].x+6} ${points[1].y-2} Q ${CX-20} ${CY-R_INNER+20} ${points[2].x} ${points[2].y}` }, duration: 0.8, ease: "power1.inOut" }, "eval-case")
      .to(".crc-frag-3", { motionPath: { path: `M ${points[1].x-2} ${points[1].y+6} Q ${CX-50} ${CY-R_INNER+40} ${points[2].x} ${points[2].y}` }, duration: 0.8, ease: "power1.inOut" }, "eval-case");
      
    // Collapse to point
    tl.to(".crc-frag", { opacity: 0, duration: 0.1 }, "eval-case+=0.8");
    tl.to(".crc-apex-point", { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, "eval-case+=0.8");
    // Text morph
    tl.to(".crc-apex-text-1", { opacity: 1, duration: 0.2 }, "eval-case+=0.8");
    tl.to(".crc-apex-text-1", { opacity: 0, duration: 0.1 }, "eval-case+=1.5");
    tl.to(".crc-apex-text-2", { opacity: 1, duration: 0.2 }, "eval-case+=1.6");

    // --- 06 PATH REWRITE ---
    tl.addLabel("rewrite", 6.5);
    // Red ghost signal on dashed path
    tl.set(".crc-ghost-signal", { opacity: 1, x: points[2].ox, y: points[2].oy }, "rewrite");
    tl.to(".crc-ghost-signal", {
      motionPath: { path: `M ${points[2].ox} ${points[2].oy} A ${R_OUTER} ${R_OUTER} 0 0 1 ${points[3].ox} ${points[3].oy}` },
      duration: 1,
      ease: "power1.in"
    }, "rewrite");
    tl.to(".crc-ghost-signal", { opacity: 0, scale: 0, duration: 0.2 }, "rewrite+=0.8");
    
    // Inner path MORPHS
    tl.to(".crc-inner-path", { attr: { d: pathB }, stroke: "#2477ff", duration: 1, ease: "elastic.out(1, 0.75)" }, "rewrite");
    // Patch wave
    tl.set(".crc-patch-wave", { opacity: 1, scale: 0.1 }, "rewrite");
    tl.to(".crc-patch-wave", { scale: 3, opacity: 0, duration: 1, ease: "power2.out" }, "rewrite");

    // --- 07 SECOND MISSION ---
    tl.addLabel("second-mission", 7.5);
    tl.set(".crc-signal-2", { opacity: 1, x: points[0].x, y: points[0].y }, "second-mission");
    
    // Crosses safely
    tl.to(".crc-signal-2", {
      motionPath: { path: `M ${points[0].x} ${points[0].y} A ${R_INNER} ${R_INNER} 0 0 1 ${points[4].x} ${points[4].y}` },
      duration: 1.5,
      ease: "power1.inOut"
    }, "second-mission");
    
    // Checkpoints verify
    tl.to(".crc-cross", { stroke: "#2477ff", duration: 0.2, stagger: 0.25 }, "second-mission");
    // Annotation at CP02
    tl.to(".crc-patch-applied", { opacity: 1, duration: 0.2 }, "second-mission+=0.4");
    tl.to(".crc-patch-applied", { opacity: 0, duration: 0.3 }, "second-mission+=1.0");

    // --- 08 PROTECTION SETTLEMENT ---
    tl.addLabel("settlement", 9.0);
    tl.to(".crc-cp-5", { stroke: "#059669", duration: 0.3 }, "settlement");
    tl.to(".crc-final-status", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "settlement");
    tl.to(".crc-mission-label", { opacity: 0, duration: 0.5 }, "settlement");
    
    // Ambient pulse
    tl.to(".crc-ambient-pulse", { scale: 1.1, opacity: 0, duration: 2, repeat: -1, repeatDelay: 5 }, "settlement");

  }, { scope: containerRef, dependencies: [mounted] });

  const replay = () => {
    if (!isInteractive) return;
    setIsInteractive(false);
    gsap.globalTimeline.getTweensOf(containerRef.current?.querySelectorAll("*") as gsap.TweenTarget).forEach(t => t.restart());
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractive || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setPointerPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handlePointerLeave = () => {
    if (!isInteractive) return;
    setPointerPos({ x: -1000, y: -1000 });
  };

  if (!mounted) {
    return <div className="w-full h-full bg-[#FCFCFA] font-sans flex flex-col relative overflow-hidden group select-none" />;
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-[#FCFCFA] font-sans flex flex-col relative overflow-hidden group select-none p-4">
      
      <div className="flex-1 relative w-full h-full flex items-center justify-center">
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`} 
          className="w-full max-w-[800px] overflow-visible touch-none cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          
          <defs>
            {/* Temporal Comparison Lens Mask */}
            <clipPath id="temporal-lens">
              <circle cx={pointerPos.x} cy={pointerPos.y} r={isInteractive ? 60 : 0} />
            </clipPath>
          </defs>

          <g className="crc-mission-label opacity-0 -translate-y-2" transform={`translate(${CX}, 30)`}>
            <text x="0" y="0" fontSize="9" fontFamily="monospace" fill="#64748b" textAnchor="middle" letterSpacing="0.1em">MISSION TRACE · RUN 247</text>
          </g>

          {/* BACKGROUND LAYER */}
          <g>
            <circle cx={CX} cy={CY} r={R_INNER - 40} fill="none" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          </g>

          {/* ========================================================
              LAYER 2: OUTSIDE LENS (AFTER PATCH - CORRECTED STATE)
              ======================================================== */}
          <g>
            {/* The primary path that GSAP animates (morphs from PathA to PathB) */}
            <path 
              className="crc-inner-path" 
              d={pathB} // initial state will be overridden by GSAP to pathA on load
              fill="none" 
              stroke="#94a3b8" 
              strokeWidth="2" 
              strokeDasharray="2000" 
              strokeDashoffset="2000" 
            />
          </g>

          {/* ========================================================
              LAYER 1: INSIDE LENS (BEFORE PATCH - FAILED STATE)
              ======================================================== */}
          <g clipPath="url(#temporal-lens)">
            {/* Dimmed background circle for the lens effect */}
            <circle cx={pointerPos.x} cy={pointerPos.y} r={60} fill="#f8fafc" />
            
            {/* Original Ruptured Path */}
            <path d={pathA} fill="none" stroke="#64748b" strokeWidth="2" />
            {/* Original Dashed Counterfactual Path */}
            <path d={outerPath} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
            
            {/* Persistent Rupture Mark at CP02 */}
            <circle cx={points[1].x - 10} cy={points[1].y + 10} r="3" fill="#ea580c" />
            <text x={points[1].x - 10} y={points[1].y + 25} fontSize="7" fontFamily="sans-serif" fontWeight="bold" fill="#ea580c" textAnchor="middle">RUPTURE</text>
          </g>

          {/* Lens Edge & Labels */}
          {isInteractive && pointerPos.x > 0 && (
            <g className="pointer-events-none">
              <circle cx={pointerPos.x} cy={pointerPos.y} r={60} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4" />
              <text x={pointerPos.x} y={pointerPos.y - 65} fontSize="7" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">BEFORE PATCH</text>
              <text x={pointerPos.x} y={pointerPos.y + 70} fontSize="7" fontFamily="monospace" fill="#2477ff" textAnchor="middle">AFTER PATCH</text>
            </g>
          )}

          {/* ========================================================
              TOP LAYER: ANIMATION ELEMENTS (Signals, Text, Checkpoints)
              ======================================================== */}
          <g>
            {/* Outer Counterfactual Path (Animated during sequence) */}
            <path 
              className="crc-outer-path opacity-0" 
              d={outerPath} 
              fill="none" 
              stroke="#cbd5e1" 
              strokeWidth="1.5" 
              strokeDasharray="4 6 2000" 
              strokeDashoffset="2000" 
            />

            {/* Checkpoints */}
            {points.map((p, i) => (
              <g key={`cp-${p.id}`} className={`crc-cross crc-cp-${p.id} opacity-0 scale-50 transition-colors duration-300`} transform={`translate(${p.x}, ${p.y})`} stroke="#64748b" strokeWidth="1.5"
                 onMouseEnter={() => isInteractive && setHoveredPoint(p.id)}
                 onMouseLeave={() => isInteractive && setHoveredPoint(null)}>
                
                <circle r="15" fill="transparent" stroke="none" />
                <line x1="-4" y1="0" x2="4" y2="0" />
                <line x1="0" y1="-4" x2="0" y2="4" />

                {/* Minimalist Hover Text */}
                <g className={`transition-opacity duration-200 ${isInteractive && hoveredPoint === p.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <line x1="4" y1="-4" x2="15" y2="-15" stroke="#94a3b8" strokeWidth="1" />
                  <text x="18" y="-18" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#475569">{p.name}</text>
                </g>
              </g>
            ))}

            {/* Interference Wave at CP02 */}
            <circle cx={points[1].x - 10} cy={points[1].y + 10} r="15" fill="none" stroke="#ea580c" strokeWidth="1" className="crc-interference-wave opacity-0 scale-50" />
            
            {/* Divergence Label */}
            <g className="crc-divergence-label opacity-0" transform={`translate(${points[1].x - 60}, ${points[1].y + 30})`}>
              <text x="0" y="0" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#ea580c">REALITY DIVERGENCE</text>
              <text x="0" y="10" fontSize="7" fontFamily="monospace" fill="#ea580c">expected ≠ observed</text>
            </g>

            {/* Signals */}
            <circle r="4" fill="#2477ff" className="crc-signal-1 opacity-0" />
            <g className="crc-signal-2 opacity-0">
              <circle r="4" fill="#2477ff" />
              <rect x="-8" y="-3" width="3" height="6" fill="#10b981" /> {/* Inherited patch marker */}
            </g>
            
            <circle r="3" fill="#ea580c" className="crc-ghost-signal opacity-0" />
            <circle r="6" fill="#2477ff" className="crc-scan-wave opacity-0 mix-blend-overlay" />

            {/* Evidence Fragments */}
            <circle cx={points[1].x - 10} cy={points[1].y + 10} r="2" fill="#2477ff" className="crc-frag crc-frag-1 opacity-0" />
            <circle cx={points[1].x - 10} cy={points[1].y + 10} r="2" fill="#2477ff" className="crc-frag crc-frag-2 opacity-0" />
            <circle cx={points[1].x - 10} cy={points[1].y + 10} r="2" fill="#2477ff" className="crc-frag crc-frag-3 opacity-0" />

            {/* Apex elements */}
            <circle cx={points[2].x} cy={points[2].y} r="3" fill="#2477ff" className="crc-apex-point opacity-0 scale-0" />
            <text x={points[2].x} y={points[2].y - 12} fontSize="8" fontFamily="monospace" fill="#64748b" textAnchor="middle" className="crc-apex-text-1 opacity-0">eval-case/failure-247</text>
            <text x={points[2].x} y={points[2].y - 12} fontSize="9" fontFamily="monospace" fill="#0f172a" textAnchor="middle" className="crc-apex-text-2 opacity-0 font-bold">EVAL CASE → MISSION PATCH · <tspan fill="#2477ff">v2</tspan></text>
            
            <circle cx={points[2].x} cy={points[2].y} r="30" fill="none" stroke="#bfdbfe" strokeWidth="1" className="crc-patch-wave opacity-0 scale-0" />
            <circle cx={points[4].x} cy={points[4].y} r="15" fill="none" stroke="#10b981" strokeWidth="1" className="crc-ambient-pulse opacity-0 scale-50" />

            {/* Annotations */}
            <text x={points[1].x} y={points[1].y - 20} fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#2477ff" textAnchor="middle" className="crc-patch-applied opacity-0">PATCH APPLIED BEFORE EXECUTION</text>

          </g>
        </svg>

        {/* Final Status Text Below Orbit */}
        <div className="absolute bottom-4 w-full text-center crc-final-status opacity-0 translate-y-4">
          <h4 className="text-[11px] font-bold text-gray-900 tracking-widest uppercase mb-1">NEXT MISSION INHERITED THE FIX</h4>
          <div className="text-[9px] font-mono text-[#C8C7BA]">eval case 247 · mission patch v2 · <span className="text-emerald-600 font-bold">verified</span></div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end border-t border-gray-100 pt-3 z-10">
        <div>
          <h3 className="text-[11px] font-bold text-gray-900 tracking-widest uppercase mb-1">Counterfactual Replay Chamber</h3>
          <div className="text-[9px] font-mono text-[#C8C7BA]">
            Temporal trace reconstruction & verification
          </div>
        </div>
        {isInteractive && (
          <button onClick={replay} className="text-[9px] font-bold tracking-widest uppercase text-[#C8C7BA] hover:text-blue-600 transition-colors flex items-center gap-1.5 rounded-sm bg-white/50 px-2 py-1">
            <RotateCcw size={10} /> REPLAY TRACE
          </button>
        )}
      </div>
    </div>
  );
}


