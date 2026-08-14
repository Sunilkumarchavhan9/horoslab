"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { RotateCcw, AlertTriangle, ShieldCheck, Database, GitMerge, ChevronRight } from "lucide-react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);
}

const WIDTH = 500;
const HEIGHT = 340;
const CX = 250;
const CY = 300;
const R_INNER = 140;
const R_OUTER = 200;

type Checkpoint = { id: number; name: string; angle: number; x: number; y: number; ox: number; oy: number };

const CHECKPOINTS: Omit<Checkpoint, 'x' | 'y' | 'ox' | 'oy'>[] = [
    { id: 1, name: "01 — OUTCOME OBSERVED", angle: Math.PI },
    { id: 2, name: "02 — FAILURE ISOLATED", angle: Math.PI * 0.75 },
    { id: 3, name: "03 — EVIDENCE ATTACHED", angle: Math.PI * 0.5 },
    { id: 4, name: "04 — PATCH COMPILED", angle: Math.PI * 0.25 },
    { id: 5, name: "05 — PROTECTION INHERITED", angle: 0 }
];

const getPoint = (angle: number, radius: number) => ({
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle)
});

export function CausalLearningOrbit() {
    const containerRef = useRef<HTMLDivElement>(null);

    const [isInteractive, setIsInteractive] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const [reducedMotion, setReducedMotion] = useState(false);

    const points = useMemo<Checkpoint[]>(() =>
        CHECKPOINTS.map(c => ({
            ...c,
            ...getPoint(c.angle, R_INNER),
            ox: getPoint(c.angle, R_OUTER).x,
            oy: getPoint(c.angle, R_OUTER).y
        }))
        , []);

    // Construct SVG arc paths
    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    const innerArcPath = `M ${points[0].x} ${points[0].y} A ${R_INNER} ${R_INNER} 0 0 1 ${points[4].x} ${points[4].y}`;
    const outerArcPath = `M ${points[0].ox} ${points[0].oy} A ${R_OUTER} ${R_OUTER} 0 0 1 ${points[4].ox} ${points[4].oy}`;

    useEffect(() => {
        setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }, []);

    useGSAP(() => {
        if (!containerRef.current) return;
        const scroller = document.querySelector(".landing-scroll-shell") || window;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                scroller: scroller,
                start: "top 70%",
                toggleActions: "play none none none"
            },
            onComplete: () => setIsInteractive(true)
        });

        if (reducedMotion) {
            tl.progress(1);
            return;
        }

        // --- PHASE 1: CALIBRATION (0.0s - 1.5s) ---
        tl.to(".clo-bg-grid", { opacity: 1, duration: 1, ease: "power2.out" })
            .to(".clo-inner-arc", { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, 0)
            .to(".clo-outer-arc", { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", opacity: 0.3 }, 0.5)
            .to(".clo-cross", { scale: 1, opacity: 1, stagger: 0.1, duration: 0.4, ease: "back.out(2)" }, 0.5);

        // --- PHASE 2: REALITY FAILURE (1.5s - 3.0s) ---
        tl.addLabel("failure", 1.5);
        tl.set(".clo-signal", { opacity: 1, x: points[0].x, y: points[0].y }, "failure");

        // Move signal to Checkpoint 2
        tl.to(".clo-signal", {
            motionPath: {
                path: `M ${points[0].x} ${points[0].y} A ${R_INNER} ${R_INNER} 0 0 1 ${points[1].x} ${points[1].y}`,
                alignOrigin: [0.5, 0.5]
            },
            duration: 1,
            ease: "power1.inOut"
        }, "failure");

        // Failure pulse at CP 2
        tl.addLabel("pulse", 2.5);
        tl.to(".clo-cp-2-pulse", { scale: 2, opacity: 0, duration: 0.5, ease: "power2.out" }, "pulse")
            .to(".clo-cp-2", { stroke: "#ea580c", duration: 0.1 }, "pulse")
            .to(".clo-divergence-label", { opacity: 1, duration: 0.2 }, "pulse")
            .to(".clo-signal", { fill: "#ea580c", duration: 0.1 }, "pulse")
            // Grid distortion
            .to(".clo-bg-grid", { scale: 1.02, rotation: 1, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: `${points[1].x}px ${points[1].y}px` }, "pulse");

        // --- PHASE 3: EVIDENCE PROPAGATION (3.0s - 4.5s) ---
        tl.addLabel("propagation", 3.2);
        // Collapse pulse, become evidence
        tl.to(".clo-divergence-label", { opacity: 0, duration: 0.3 }, "propagation")
            .to(".clo-cp-2", { stroke: "#2477ff", duration: 0.3 }, "propagation")
            .to(".clo-signal", { fill: "#2477ff", duration: 0.3 }, "propagation");

        // Move to apex
        tl.to(".clo-signal", {
            motionPath: {
                path: `M ${points[1].x} ${points[1].y} A ${R_INNER} ${R_INNER} 0 0 1 ${points[2].x} ${points[2].y}`
            },
            duration: 1.2,
            ease: "power2.inOut"
        }, "propagation");

        // Trailing lineage line
        tl.to(".clo-lineage-trail", {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: "power2.inOut"
        }, "propagation");

        tl.to(".clo-evidence-metadata", { opacity: 1, y: -5, duration: 0.4 }, "propagation+=0.5")
            .to(".clo-evidence-metadata", { opacity: 0, duration: 0.3 }, "propagation+=1.2");

        // --- PHASE 4: COUNTERFACTUAL FUTURE (4.5s - 5.5s) ---
        tl.addLabel("counterfactual", 4.5);
        tl.set(".clo-cf-signal", { opacity: 1, x: points[2].ox, y: points[2].oy }, "counterfactual");
        tl.to(".clo-outer-arc", { stroke: "#ea580c", opacity: 0.5, duration: 0.3 }, "counterfactual");
        tl.to(".clo-cf-label", { opacity: 1, duration: 0.3 }, "counterfactual");

        tl.to(".clo-cf-signal", {
            motionPath: {
                path: `M ${points[2].ox} ${points[2].oy} A ${R_OUTER} ${R_OUTER} 0 0 1 ${points[4].ox} ${points[4].oy}`
            },
            duration: 1,
            ease: "power1.in"
        }, "counterfactual");

        // Dissolve
        tl.to(".clo-cf-signal", { opacity: 0, scale: 0, duration: 0.2 }, "counterfactual+=0.9")
            .to(".clo-outer-arc", { stroke: "#cbd5e1", opacity: 0.2, duration: 0.5 }, "counterfactual+=1.0")
            .to(".clo-cf-label", { opacity: 0, duration: 0.3 }, "counterfactual+=1.0");

        // --- PHASE 5: PATCH COMPILATION (5.5s - 7.5s) ---
        tl.addLabel("compilation", 5.5);
        tl.to(".clo-signal", { scale: 0, opacity: 0, duration: 0.2 }, "compilation");

        // Expand capsule
        tl.to(".clo-apex-capsule", { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)", transformOrigin: "center" }, "compilation");
        tl.to(".clo-cp-3", { opacity: 0, duration: 0.1 }, "compilation");

        // Compilation steps (simulated in GSAP by toggling visibility of text lines)
        const steps = [".clo-step-1", ".clo-step-2", ".clo-step-3", ".clo-step-4"];
        steps.forEach((step, i) => {
            tl.set(step, { opacity: 1 }, `compilation+=${0.6 + i * 0.2}`);
        });

        // Final verification ring
        tl.to(".clo-apex-ring", { scale: 1.1, opacity: 1, duration: 0.4, ease: "power2.out" }, "compilation+=1.6")
            .to(".clo-apex-capsule-bg", { fill: "#eff6ff", stroke: "#2477ff", duration: 0.3 }, "compilation+=1.6")
            .to(".clo-step-texts", { opacity: 0, duration: 0.2 }, "compilation+=1.6")
            .to(".clo-final-patch-text", { opacity: 1, duration: 0.3 }, "compilation+=1.8");

        // --- PHASE 6: PATCH INJECTION (7.5s - 8.5s) ---
        tl.addLabel("injection", 7.5);
        tl.set(".clo-injection-pulse", { opacity: 1, scale: 1 }, "injection");

        // Wave changes arc color
        tl.to(".clo-inner-arc", { stroke: "#2477ff", duration: 0.8, ease: "power2.inOut" }, "injection");
        tl.to(".clo-cross", { stroke: "#2477ff", duration: 0.5, stagger: { amount: 0.5, from: "center" } }, "injection");

        // Protective boundary appears
        tl.to(".clo-protective-boundary", { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out", transformOrigin: "center bottom" }, "injection");

        // --- PHASE 7: NEXT-MISSION PROTECTION (8.5s - 9.5s) ---
        tl.addLabel("protection", 8.5);
        tl.set(".clo-next-signal", { opacity: 1, x: points[4].x + 50, y: points[4].y }, "protection");

        // Signal moves in
        tl.to(".clo-next-signal", { x: points[4].x, duration: 0.5, ease: "power2.out" }, "protection");

        // Intercepted and turns blue
        tl.to(".clo-next-signal", { fill: "#2477ff", duration: 0.2 }, "protection+=0.4")
            .to(".clo-cp-5-pulse", { scale: 2, opacity: 0, duration: 0.5 }, "protection+=0.4");

        tl.to(".clo-final-status", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "protection+=0.6");

    }, { scope: containerRef });

    const replay = () => {
        setIsInteractive(false);
        if (containerRef.current) {
            gsap.globalTimeline.getTweensOf(containerRef.current.querySelectorAll("*")).forEach(t => t.restart());
        }
    };

    return (
        <div ref={containerRef} className="w-full bg-[#FCFCFA] p-6 lg:p-12 font-sans flex flex-col relative overflow-hidden group select-none h-full min-h-[480px]">

            <div className="absolute top-4 left-6 text-[10px] font-mono text-blue-900/40">FIG. 4</div>

            <div className="flex-1 relative w-full h-full flex items-center justify-center mt-8">
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-[600px] overflow-visible">

                    {/* Background Grid */}
                    <g className="clo-bg-grid opacity-0" stroke="#f1f5f9" strokeWidth="1">
                        <circle cx={CX} cy={CY} r={R_INNER} fill="none" />
                        <circle cx={CX} cy={CY} r={R_OUTER} fill="none" />
                        <circle cx={CX} cy={CY} r={R_INNER - 40} fill="none" strokeDasharray="4 4" />
                        {points.map((p, i) => (
                            <line key={i} x1={CX} y1={CY} x2={p.ox} y2={p.oy} strokeDasharray="2 4" />
                        ))}
                    </g>

                    {/* Protective Boundary (Phase 6) */}
                    <path d={`M ${points[0].x - 10} ${points[0].y} A ${R_INNER + 10} ${R_INNER + 10} 0 0 1 ${points[4].x + 10} ${points[4].y}`} fill="none" stroke="#bfdbfe" strokeWidth="8" className="clo-protective-boundary opacity-0 mix-blend-multiply" />

                    {/* Outer Counterfactual Arc */}
                    <path d={outerArcPath} fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 6" className="clo-outer-arc" strokeDashoffset="1500" style={{ strokeDasharray: "1500", opacity: 0 }} />

                    {/* Inner Reality Arc */}
                    <path d={innerArcPath} fill="none" stroke="#94a3b8" strokeWidth="2" className="clo-inner-arc" strokeDashoffset="1000" style={{ strokeDasharray: "1000" }} />

                    {/* Lineage Trail */}
                    <path d={`M ${points[1].x} ${points[1].y} A ${R_INNER} ${R_INNER} 0 0 1 ${points[2].x} ${points[2].y}`} fill="none" stroke="#93c5fd" strokeWidth="2" className="clo-lineage-trail opacity-50" strokeDashoffset="500" style={{ strokeDasharray: "500" }} />

                    {/* Cross Checkpoints */}
                    {points.map((p, i) => (
                        <g key={i} className={`clo-cross clo-cp-${p.id} opacity-0 scale-50 transition-all duration-300 ${isInteractive && hoveredPoint === p.id ? 'scale-125' : ''}`} transform={`translate(${p.x}, ${p.y})`} stroke="#64748b" strokeWidth="1.5"
                            onMouseEnter={() => isInteractive && setHoveredPoint(p.id)}
                            onMouseLeave={() => isInteractive && setHoveredPoint(null)}>

                            {/* Interactive invisible hit area */}
                            <circle r="20" fill="transparent" stroke="none" className="cursor-crosshair" />

                            <line x1="-5" y1="0" x2="5" y2="0" />
                            <line x1="0" y1="-5" x2="0" y2="5" />

                            {i === 1 && <circle r="12" fill="none" stroke="#ea580c" strokeWidth="1.5" className="clo-cp-2-pulse opacity-0" />}
                            {i === 4 && <circle r="12" fill="none" stroke="#2477ff" strokeWidth="1.5" className="clo-cp-5-pulse opacity-0" />}
                        </g>
                    ))}

                    {/* Signals */}
                    <circle r="4" fill="#64748b" className="clo-signal opacity-0" />
                    <circle r="3" fill="#ea580c" className="clo-cf-signal opacity-0" />
                    <circle r="4" fill="#94a3b8" className="clo-next-signal opacity-0" />

                    {/* Apex Capsule (Checkpoint 3 overrides) */}
                    <g className="clo-apex-capsule opacity-0 scale-50" transform={`translate(${points[2].x}, ${points[2].y - 20})`}>
                        <circle cx="0" cy="20" r="30" fill="none" stroke="#bfdbfe" strokeWidth="1" className="clo-apex-ring opacity-0 scale-50" />
                        <rect x="-70" y="-15" width="140" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" className="clo-apex-capsule-bg shadow-sm" />

                        <g className="clo-step-texts text-[7px] font-mono fill-gray-500" textAnchor="middle">
                            <text y="-2" className="clo-step-1 opacity-0">Reproduction locked...</text>
                            <text y="6" className="clo-step-2 opacity-0">Invariant encoded...</text>
                            <text y="14" className="clo-step-3 opacity-0">Policy updated...</text>
                            <text y="22" className="clo-step-4 opacity-0">Patch signed.</text>
                        </g>

                        <g className="clo-final-patch-text opacity-0" textAnchor="middle">
                            <text y="0" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#0f172a">EVAL CASE → MISSION PATCH</text>
                            <text y="12" fontSize="7" fontFamily="monospace" fill="#2477ff">v2 · VERIFIED</text>
                        </g>
                    </g>

                    {/* Overlays & Annotations */}
                    <g className="clo-divergence-label opacity-0" transform={`translate(${points[1].x - 60}, ${points[1].y - 20})`}>
                        <rect x="-10" y="-20" width="120" height="30" fill="#fff" rx="2" className="shadow-sm border border-red-100" />
                        <text x="50" y="-8" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#ea580c" textAnchor="middle">REALITY DIVERGENCE</text>
                        <text x="50" y="2" fontSize="7" fontFamily="monospace" fill="#64748b" textAnchor="middle">Expected ≠ Observed</text>
                    </g>

                    <g className="clo-evidence-metadata opacity-0" transform={`translate(${CX - 40}, ${CY - R_INNER + 40})`}>
                        <text x="0" y="0" fontSize="7" fontFamily="monospace" fill="#64748b">trace_8472</text>
                        <text x="0" y="10" fontSize="7" fontFamily="monospace" fill="#64748b">confidence 96%</text>
                        <text x="0" y="20" fontSize="7" fontFamily="monospace" fill="#64748b">sources 04</text>
                    </g>

                    <g className="clo-cf-label opacity-0" transform={`translate(${points[3].ox + 10}, ${points[3].oy - 10})`}>
                        <text x="0" y="0" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#ea580c">WITHOUT PATCH</text>
                        <text x="0" y="10" fontSize="7" fontFamily="monospace" fill="#ef4444">FAILURE REPEATS</text>
                    </g>

                    {/* Hover Tooltips */}
                    {points.map(p => (
                        <g key={`tooltip-${p.id}`} className={`transition-opacity duration-300 ${isInteractive && hoveredPoint === p.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} transform={`translate(${p.x}, ${p.y + (p.id <= 3 ? 15 : -10)})`}>
                            <text x="0" y="0" fontSize="8" fontFamily="sans-serif" fontWeight="bold" fill="#64748b" textAnchor="middle" letterSpacing="0.05em">{p.name}</text>
                        </g>
                    ))}

                </svg>

                {/* Final Status Block overlaying HTML */}
                <div className="absolute right-0 bottom-4 text-right clo-final-status opacity-0 translate-y-4">
                    <div className="text-[12px] font-bold text-[#059669] uppercase tracking-wide flex items-center justify-end gap-2 mb-1">
                        <ShieldCheck size={14} /> Next Mission Protected
                    </div>
                    <div className="text-[10px] text-gray-500 mb-4">Failure pattern inherited before execution</div>

                    <div className="inline-block border border-emerald-100 bg-emerald-50/50 rounded p-3 text-[9px] font-mono text-emerald-900 shadow-sm text-left">
                        <div className="flex justify-between gap-6 mb-1"><span>PATCH ACTIVE</span><span className="font-bold">v2</span></div>
                        <div className="flex justify-between gap-6 mb-1"><span>PROTECTION COVERAGE</span><span className="font-bold">100%</span></div>
                        <div className="flex justify-between gap-6 text-emerald-600"><span>CERTIFICATE</span><span className="font-bold">VALID</span></div>
                    </div>
                </div>
            </div>

            <div className="mt-auto flex justify-between items-end border-t border-gray-100 pt-4 z-10 relative">
                <div>
                    <h3 className="text-[13px] font-bold text-gray-900 tracking-widest uppercase mb-1">Causal Learning Trace</h3>
                    <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
                        REALITY <ChevronRight size={10} /> EVIDENCE <ChevronRight size={10} /> PROTECTION
                    </div>
                </div>
                {isInteractive && (
                    <button onClick={replay} className="text-[9px] font-bold tracking-widest uppercase bg-white border border-gray-200 text-gray-600 px-3 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1.5 rounded-sm">
                        <RotateCcw size={10} /> Replay Trace
                    </button>
                )}
            </div>
        </div>
    );
}


