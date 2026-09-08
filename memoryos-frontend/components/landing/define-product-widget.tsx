"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function DefineProductWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // Blinking status indicator
      gsap.to(".status-indicator", {
        opacity: 0.2,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Tiny progress sweep on button
      gsap.to(".button-sweep", {
        x: "200%",
        duration: 2,
        repeat: -1,
        ease: "power2.inOut",
        repeatDelay: 5
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-start bg-transparent font-sans w-[280px]">
      {/* Top Icon */}
      <div className="w-12 h-12 rounded-[14px] bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_8px_16px_rgba(59,130,246,0.3)] flex items-center justify-center mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/20 w-1/2 h-full -skew-x-12 -translate-x-[150%] button-sweep"></div>
        <div className="w-[22px] h-[18px] bg-white rounded-[4px] flex flex-col items-center justify-center gap-[3px] p-1 shadow-sm relative z-10">
           <div className="w-full h-[1.5px] bg-blue-500 rounded-full"></div>
           <div className="w-[60%] h-[1.5px] bg-blue-500 rounded-full"></div>
           <div className="w-full h-[1.5px] bg-blue-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Text */}
      <h3 className="text-[18px] font-bold text-slate-800 mb-1.5 tracking-tight flex items-center gap-2">
        Pin the exact context
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-indicator"></div>
      </h3>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-4 pr-2">
        Provide your runtime, workload, and evaluator to guarantee a reproducible environment.
      </p>

      {/* Inner Card */}
      <div className="w-full bg-white rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200/60 overflow-hidden mb-5">
        <div className="bg-[#f8f9fb] px-3 py-2 flex items-center gap-2 border-b border-slate-100/80">
          <div className="w-4 h-4 bg-blue-500 rounded-[4px] text-[#F0EFE2] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className="text-[9px] font-bold text-[#475569] tracking-wider uppercase flex-1">Three related concepts</span>
          <div className="text-[8px] font-mono text-slate-400 font-bold tracking-widest">LIVE</div>
        </div>
        <div className="p-3.5">
          <h4 className="text-[12px] font-bold text-slate-800 mb-1">Runtime, Workload, Evaluator</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Link these three related concepts together to ensure exact behavior across tests.
          </p>
        </div>
      </div>

      {/* Button */}
      <button className="relative overflow-hidden bg-gradient-to-b from-[#60a5fa] to-[#4f46e5] hover:from-[#3b82f6] hover:to-[#4338ca] text-[#F0EFE2] text-[12px] font-semibold py-2 px-4 rounded-[8px] shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition-all">
        <div className="absolute inset-0 bg-white/20 w-1/3 h-full -skew-x-12 -translate-x-[250%] button-sweep"></div>
        <span className="relative z-10">Pin Configuration</span>
      </button>
    </div>
  );
}


