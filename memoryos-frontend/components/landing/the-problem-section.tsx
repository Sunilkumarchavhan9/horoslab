"use client";

import { ChevronRight, Box, Layers, Search, ChevronDown, Activity, Cpu, CalendarDays, BarChart2, Share2, Server, Settings, TrendingUp, Code, GitPullRequest, Database } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { useScroll } from "framer-motion";
import Image from "next/image";
import PixelCard from "../PixelCard";
import { MemoryStarLogo } from "./memory-star-logo";
import { MemoryOSLogo } from "./memoryos-logo";
import { AnimatedSciFiNode } from "../ui/AnimatedSciFiNode";
import { IsometricStack } from "./isometric-stack";
import { MissionReviewWidget } from "./mission-review-widget";
import { DefineProductWidget } from "./define-product-widget";
import { ComputationalBackground } from "./computational-background";
import { DataPath } from "./data-packet-system";
import gsap from "gsap";

export function TheProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const distanceX = (x - centerX) / centerX; // -1 to 1
      const distanceY = (y - centerY) / centerY; // -1 to 1

      // 3D Tilt for the center wrapper
      gsap.to(".parallax-center", {
        rotateX: -distanceY * 3,
        rotateY: distanceX * 3,
        duration: 1,
        ease: "power2.out",
        transformPerspective: 1000
      });



      // Parallax for background
      gsap.to(".parallax-bg", {
        x: -distanceX * 4,
        y: -distanceY * 4,
        duration: 2,
        ease: "power2.out"
      });
      
      // Magnetic effect for nodes
      gsap.to(".parallax-nodes", {
        x: distanceX * 15,
        y: distanceY * 15,
        duration: 0.8,
        ease: "back.out(1.2)"
      });
    };


    const handleMouseLeave = () => {
      gsap.to([".parallax-center", ".parallax-bg", ".parallax-nodes"], {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 1.5,
        ease: "power3.out"
      });
    };

    // Provider node pulsing
    const providers = [".provider-codex", ".provider-anthropic", ".provider-nvidia"];
    providers.forEach((selector) => {
      gsap.to(selector, {
        boxShadow: "0 0 20px rgba(59,130,246,0.6)",
        borderColor: "rgba(59,130,246,0.8)",
        duration: 1,
        repeat: -1,
        yoyo: true,
        repeatDelay: Math.random() * 8 + 4,
        ease: "sine.inOut"
      });
    });

    // PR Badge Animation
    gsap.to(".pr-badge-node", {
      y: "-=5",
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    
    gsap.to(".pr-badge-node svg", {
      rotation: 4,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Generate stable pseudo-random heights and opacities for the abstract vertical lines
  const lines = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 150; i++) {
      // Deterministic pseudo-random based on index
      const rand1 = Math.abs(Math.sin(i * 12.9898 + 78.233));
      const rand2 = Math.abs(Math.sin(i * 4.321 + 11.23));

      // Create a pattern that starts small on the left, grows in the middle, and fluctuates
      const baseHeight = 20 + Math.sin(i * 0.1) * 20 + rand1 * 60;
      const height = Math.max(10, Math.min(100, baseHeight));
      const opacity = rand2 * 0.5 + 0.5;

      // Assign some random colors based on index (light mode adjusted)
      let color = "bg-slate-200";
      if (i % 7 === 0) color = "bg-blue-500";
      else if (i % 11 === 0) color = "bg-emerald-500";
      else if (i % 13 === 0) color = "bg-rose-500";
      else if (i % 3 === 0) color = "bg-slate-300";
      else if (i % 5 === 0) color = "bg-slate-800";

      arr.push({ height: `${height.toFixed(2)}%`, opacity: Number(opacity.toFixed(2)), color });
    }
    return arr;
  }, []);

  return (
    <section ref={containerRef} className="relative w-full bg-white text-slate-900 font-sans border-t border-slate-200 pt-16 pb-24 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">

        {/* Header section */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="bg-slate-100 border border-slate-200 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider">
              RUNTIME PLANES
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-6 max-w-[1000px] mx-auto">
            Identity, communication, wallet, and tools are not enough. Agents need <span className="text-[#0015FF]">organization.</span>
          </h2>

          <p className="text-slate-500 text-[16px] max-w-[800px] leading-relaxed mb-8 mx-auto">
            The agent-native internet gives agents access. Epoch gives them institutions: mission runtime, authority runtime, execution runtime, verification runtime, settlement runtime, and evolution runtime.
          </p>
        </div>

        {/* Abstract Vertical Lines */}
        <div className="w-full h-48 mb-8 flex items-center gap-[3px] opacity-70">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`w-[2px] ${line.color} rounded-full`}
              style={{ height: line.height, opacity: line.opacity }}
            />
          ))}
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2  overflow-hidden">

          {/* Top Left: 01 CONNECT */}
          <PixelCard className="p-8 md:p-12 border-b md:border-r border-slate-200 relative overflow-hidden bg-white flex flex-col" variant="default" animateOnHoverOnly={false}>
            <ComputationalBackground className="parallax-bg" />

            <div className="mb-2 relative z-10">
              <h3 className="text-[28px] tracking-tight font-bold mb-4 text-[#0b162c] uppercase">01 - CONNECT</h3>

            </div>

            {/* Custom Node UI */}
            <div className="relative flex-1 mt-10 min-h-[350px] flex items-center justify-center -mx-4 z-10">

              <div className="relative z-10 scale-[0.45] sm:scale-75 lg:scale-100 origin-center translate-y-6">
                {/* SVG Lines (Now perfectly anchored to the cards) */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible parallax-center" style={{ zIndex: -1 }}>
                  {/* Left connection */}
                  <DataPath d="M -80 70 L 40 70" delay={7} duration={2} />
                  <circle cx="40" cy="70" r="3" fill="#818cf8" />

                  {/* Right connection */}
                  <DataPath d="M 240 70 L 340 70 L 340 30 L 440 30" delay={8} duration={2.5} />
                  <DataPath d="M 240 70 L 340 70 L 340 150 L 440 150" delay={9} duration={2.5} />
                  <circle cx="240" cy="70" r="3" fill="#818cf8" />

                  {/* Bottom connection (to PR) */}
                  <DataPath d="M 140 140 L 140 250" delay={5} duration={2} />
                  <circle cx="140" cy="140" r="3" fill="#818cf8" />

                  {/* Top connection (to Model-2047 node) */}
                  <DataPath d="M 140 0 L 140 -40" delay={0.5} duration={1.5} />

                  {/* Branches to 3 Models */}
                  {/* Middle Line (to Anthropic) */}
                  <DataPath d="M 170 -70 L 350 -70" delay={3} duration={1.5} reverse={true} />

                  {/* Top Line (to Codex) */}
                  <DataPath d="M 220 -70 L 220 -125 L 350 -125" delay={1} duration={2} reverse={true} />

                  {/* Bottom Line (to Nvidia) */}
                  <DataPath d="M 220 -70 L 220 -15 L 350 -15" delay={4} duration={2} reverse={true} />
                </svg>

                {/* 3 Right Branch Nodes */}
                <div className="absolute top-[-140px] left-[350px] flex items-center justify-center z-20 bg-white p-2 rounded-md border border-slate-200 shadow-sm gap-2 w-[110px] parallax-nodes provider-codex">
                  <img src="https://imgs.search.brave.com/dvMwLnTWoDqshysiZTQt6tOx0aN0pwKbLKATe95zbYg/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZjhjMTYzM2Zi/Y2U4NjEyZWQ3Mjgz/MTFiYjg2NTZmN2Mx/OTgyODJkNzQ0MTNl/NWI1MGQ5MjgyN2Y3/ZmNiM2NjOC9jaGF0/Z3B0LmNvbS8" alt="ChatGPT" className="w-4 h-4 object-contain rounded-[2px]" />
                  <span className="text-[11px] font-bold text-slate-700">Codex</span>
                </div>

                <div className="absolute top-[-85px] left-[350px] flex items-center justify-center z-20 bg-white p-2 rounded-md border border-slate-200 shadow-sm gap-2 w-[110px] parallax-nodes provider-anthropic">
                  <img src="https://imgs.search.brave.com/pR77i0D9jHLE7BnlANBtzsTMgvt_s6LdJtDJ3zh0OaI/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZTczZTUwY2Q1/NjM4YWM1YjQ1ZWRi/MzUxNzEwMjgyMWRm/NzhmNDM0MTNhMDQ3/NzI5NWQ4MDU1N2Ex/ZmY2NGQwYy93d3cu/YW50aHJvcGljLmNv/bS8" alt="Anthropic" className="w-4 h-4 object-contain rounded-[2px]" />
                  <span className="text-[11px] font-bold text-slate-700">Anthropic</span>
                </div>

                <div className="absolute top-[-30px] left-[350px] flex items-center justify-center z-20 bg-white p-2 rounded-md border border-slate-200 shadow-sm gap-2 w-[110px] parallax-nodes provider-nvidia">
                  <img src="https://imgs.search.brave.com/uuFFL1yFVZL5_ounswg4oe5y4lvQeKLtG4TRaCoIm5A/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvZmFhYzFlODgz/MmMxZGM5ZDVlYTJh/NmI4MGMxMzhmYWIy/NzdlNzg3YmUzYzk4/ODJlYTU1ODhlMzdl/YWI5YWNiZC9udmlk/aWFuZXdzLm52aWRp/YS5jb20v" alt="Nvidia" className="w-4 h-4 object-contain" />
                  <span className="text-[11px] font-bold text-slate-700">Nvidia</span>
                </div>

                {/* Left Branch Node (Define Product Widget) */}
                <div className="absolute top-[70px] left-[-120px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 scale-[0.65] origin-right parallax-nodes">
                  <DefineProductWidget />
                </div>
                {/* Top Box (Animated Sci-Fi Node) */}
                <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 flex items-center justify-center z-25 w-[110px] parallax-center">
                  <AnimatedSciFiNode text="Model-2047 " />
                </div>

                {/* Central Company Logo */}
                <div className="w-[280px] h-[140px] bg-transparent flex items-center justify-center relative z-10 parallax-center">
                  <div className="bg-white flex items-center justify-center px-5 py-3">
                    <MemoryStarLogo className="h-5 w-auto" />
                  </div>
                </div>


                {/* Pull Request Badge (Bottom) */}
                <div className="absolute top-[250px] left-[140px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 parallax-nodes pr-badge-node">
                  <div className="bg-white p-2.5  flex items-center gap-3 min-w-[220px]">
                    <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center shrink-0">
                      <GitPullRequest className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[12px] font-bold text-slate-900 leading-tight">PR #4092</div>
                      <div className="text-[10px] text-slate-500 font-mono">Authority lease update</div>
                    </div>
                    <div className="ml-auto pl-2">
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Merged
                      </span>
                    </div>
                  </div>
                </div>

                {/* Faded Background Nodes (Simulation) */}
                <div className="absolute -left-[140px] -top-[40px] opacity-[0.15] pointer-events-none grayscale scale-90">
                  <div className="bg-white rounded-md p-4 border border-slate-200 w-[180px]">
                    <div className="text-right text-[11px] font-bold text-emerald-500 mb-1">$21,191</div>
                  </div>
                </div>

                <div className="absolute -left-[200px] bottom-[0px] opacity-[0.25] pointer-events-none grayscale scale-90">
                  <div className="bg-white rounded-md p-5 border border-slate-200 w-[240px]">
                    <div className="font-bold text-[18px] mb-1 text-slate-900 flex items-center gap-2">Inbound SDR <span className="text-slate-400 text-[12px] font-normal">📉 0.2%</span></div>
                    <div className="text-[12px] text-slate-400">By Cia Pizza</div>
                  </div>
                </div>
                <div className="absolute -right-[150px] -bottom-[40px] opacity-30 pointer-events-none grayscale scale-90">
                  <div className="bg-white rounded-md p-5 border border-slate-200 w-[240px]">
                    <div className="font-bold text-[18px] mb-1 text-slate-900 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-slate-200"></div> Client Success</div>
                    <div className="text-[12px] text-slate-400">By Anthony</div>
                  </div>
                </div>

              </div>
            </div>
          </PixelCard>

          {/* Top Right: 02 CONTROL */}
          <PixelCard className="p-8 md:p-12 border-b border-slate-200 relative overflow-hidden bg-slate-50 flex flex-col" variant="default" animateOnHoverOnly={false}>
            <div className="text-[10px] text-slate-400 font-mono absolute top-4 left-4 tracking-wider">FIG.5</div>

            <div className="mb-10">
              <h3 className="text-[28px] tracking-tight font-bold mb-4 text-[#0b162c] uppercase">02 - AUTHORIZE</h3>
              <p className="text-slate-500 text-[16px] leading-relaxed">
                Give agents short-lived authority for only the approved mission, parameters, budget, institution, and evidence duty.
              </p>
            </div>


            <div className="flex flex-col border border-slate-200 bg-white mt-auto w-full shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              {/* Row 1 */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="mt-0.5">
                    <Box size={22} className="text-slate-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-slate-900 text-[16px]">Mission Authority</div>
                    <div className="text-[12px] font-mono">
                      <span className="text-emerald-600 font-semibold">Approved</span> <span className="text-slate-400 ml-1">Env • Flags</span>
                    </div>
                    <div className="text-[12px] font-mono text-slate-400">
                      Model Weights <span className="mx-1">•</span> Runtime Config <span className="mx-1">•</span> Evaluators
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="font-extrabold text-slate-900 text-[17px]">$500</span><span className="text-[10px] font-bold uppercase text-slate-400 ml-1.5">MAX</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="mt-0.5">
                    <Layers size={22} className="text-slate-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-slate-900 text-[16px]">Institution Scope</div>
                    <div className="text-[12px] font-mono">
                      <span className="text-emerald-600 font-semibold">Approved</span> <span className="text-slate-400 ml-1">Repo • PR</span>
                    </div>
                    <div className="text-[12px] font-mono text-slate-400">
                      Targeted Repositories <span className="mx-1">•</span> Specific Branches <span className="mx-1">•</span> APIs
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="font-extrabold text-slate-900 text-[17px]">$250</span><span className="text-[10px] font-bold uppercase text-slate-400 ml-1.5">MAX</span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="p-6 flex items-start justify-between">
                <div className="flex items-start gap-5">
                  <div className="mt-0.5">
                    <Server size={22} className="text-slate-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-slate-900 text-[16px]">Settlement Budget</div>
                    <div className="text-[12px] font-mono">
                      <span className="text-emerald-600 font-semibold">Approved</span> <span className="text-slate-400 ml-1">Compute • Data</span>
                    </div>
                    <div className="text-[12px] font-mono text-slate-400">
                      Short-lived Tokens <span className="mx-1">•</span> Auto-Revoke <span className="mx-1">•</span> Timeout
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="font-extrabold text-slate-900 text-[17px]">$100</span><span className="text-[10px] font-bold uppercase text-slate-400 ml-1.5">MAX</span>
                </div>
              </div>
            </div>
          </PixelCard>

          {/* Bottom Left: 03 PROVE */}
          <PixelCard className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-200 relative bg-white flex flex-col" variant="default" animateOnHoverOnly={false}>
            {/* Subtle dotted grid background simulation */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>

            <div className="text-[10px] text-slate-400 font-mono absolute top-4 left-4 tracking-wider">FIG.7</div>

            <div className="mb-10 relative z-10">
              <h3 className="text-[28px] tracking-tight font-bold mb-4 text-[#0b162c] uppercase">03 - PROVE</h3>
              <p className="text-slate-500 text-[16px] leading-relaxed">
                Challenge every claim with independent evidence and return PASS, FAIL, or UNKNOWN before the outcome becomes trusted state.
              </p>
            </div>

            <div className="w-full mt-auto relative z-10 flex items-center justify-center">
              <IsometricStack />
            </div>
          </PixelCard>

          {/* Bottom Right: 04 LEARN */}
          <PixelCard className="p-8 md:p-12 relative flex flex-col bg-slate-50" variant="default" animateOnHoverOnly={false}>
            <h3 className="text-[28px] tracking-tight font-bold mb-4 text-[#0b162c] uppercase">04 - EVOLVE</h3>
            <p className="text-slate-500 text-[16px] mb-12 leading-relaxed">
              Settle the mission against reality, measure institutional fitness, and mutate the genome before the next run.
            </p>

            <div className="w-full mt-auto relative z-10 flex flex-col items-center justify-center pb-2">
              <MissionReviewWidget />
            </div>


          </PixelCard>

        </div>
      </div>
    </section>
  );
}


