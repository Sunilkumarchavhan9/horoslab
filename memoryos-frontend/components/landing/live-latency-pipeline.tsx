"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { OpenAILogo, MetaLogo, NvidiaLogo } from "@/components/dhyra/primitives/brand-icons";
import { Mic, Volume2 } from "lucide-react";

export function LiveLatencyPipeline() {
  const [activeStage, setActiveStage] = useState(0);

  // 0: Client -> STT, 1: STT -> LLM, 2: LLM -> TTS, 3: TTS -> Client
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 1200); // Sequence timing
    return () => clearInterval(interval);
  }, []);

  const w = 110;
  const h = 110;

  // Render a single isometric cube
  const renderCube = (cx: number, cy: number, type: "outline" | "solid", label: string) => {
    const isSolid = type === "solid";
    
    // Deep Dhyra purple/indigo for solid, clean wireframe for outline
    const topFill = isSolid ? "#6d28d9" : "transparent"; // Violet 700
    const leftFill = isSolid ? "#5b21b6" : "transparent"; // Violet 800
    const rightFill = isSolid ? "#4c1d95" : "transparent"; // Violet 900
    
    const stroke = isSolid ? "rgba(255,255,255,0.15)" : "#333";
    const strokeW = isSolid ? "1" : "1.5";

    // SVG Paths
    const topPath = `M ${cx} ${cy - h/2} L ${cx + w/2} ${cy - h/4} L ${cx} ${cy} L ${cx - w/2} ${cy - h/4} Z`;
    const leftPath = `M ${cx - w/2} ${cy - h/4} L ${cx} ${cy} L ${cx} ${cy + h/2} L ${cx - w/2} ${cy + h/4} Z`;
    const rightPath = `M ${cx} ${cy} L ${cx + w/2} ${cy - h/4} L ${cx + w/2} ${cy + h/4} L ${cx} ${cy + h/2} Z`;

    return (
      <g className={cn("transition-transform duration-500", isSolid && "hover:-translate-y-2 cursor-pointer")}>
        {/* Shadow for solid cubes */}
        {isSolid && (
          <ellipse cx={cx} cy={cy + h/2 + 10} rx={w/2.5} ry={h/5} fill="rgba(109, 40, 217, 0.15)" filter="blur(8px)" />
        )}
        <path d={topPath} fill={topFill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
        <path d={leftPath} fill={leftFill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
        <path d={rightPath} fill={rightFill} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
        
        {/* Center dot/hole for connecting lines */}
        {!isSolid && (
          <circle cx={cx + w/4} cy={cy + h/8} r="3" fill="#111" stroke="#333" strokeWidth="1" />
        )}
        {!isSolid && (
          <circle cx={cx - w/4} cy={cy + h/8} r="3" fill="#111" stroke="#333" strokeWidth="1" />
        )}
        
        {/* Label */}
        <text x={cx} y={cy + h/2 + 25} textAnchor="middle" fill="#666" fontSize="10" fontFamily="monospace" letterSpacing="0.1em" className="uppercase font-bold">
          {label}
        </text>
      </g>
    );
  };

  // Coordinates for the 4 nodes along the diagonal
  // dx = 180, dy = -60
  // Line constraint: cy2 - cy1 = -0.5 * (cx2 - cx1 - w/2)
  // -60 = -0.5 * (180 - 55) => -60 = -0.5 * 125 = -62.5 (Close enough, let's use exact math)
  // Let dx = 170. dy = -0.5 * (170 - 55) = -0.5 * 115 = -57.5.
  const nodes = [
    { cx: 120, cy: 300, type: "outline", label: "Client" },
    { cx: 290, cy: 242.5, type: "solid", label: "STT Engine" },
    { cx: 460, cy: 185, type: "solid", label: "LLM Core" },
    { cx: 630, cy: 127.5, type: "outline", label: "TTS Output" }
  ] as const;

  const getLinePath = (n1: number, n2: number) => {
    const x1 = nodes[n1].cx + w/4;
    const y1 = nodes[n1].cy + h/8;
    const x2 = nodes[n2].cx - w/4;
    const y2 = nodes[n2].cy + h/8;
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center relative font-mono select-none">
      
      {/* Scrollable container for mobile */}
      <div className="w-full overflow-x-auto overflow-y-visible pb-12 pt-8 hide-scrollbar flex justify-center">
        <div className="relative min-w-[750px] h-[400px]">
          
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 750 400">
            {/* Draw Connecting Lines First (so they are under the cubes) */}
            <path d={getLinePath(0, 1)} stroke="#333" strokeWidth="2" strokeDasharray="4 4" fill="none" />
            <path d={getLinePath(1, 2)} stroke="#333" strokeWidth="2" strokeDasharray="4 4" fill="none" />
            <path d={getLinePath(2, 3)} stroke="#333" strokeWidth="2" strokeDasharray="4 4" fill="none" />

            {/* Animated Pulses */}
            <circle r="4" fill="#6d28d9" className={cn("transition-opacity duration-300", activeStage === 0 ? "opacity-100" : "opacity-0")}>
              {activeStage === 0 && <animateMotion dur="1.2s" path={getLinePath(0, 1)} fill="freeze" />}
            </circle>
            <circle r="4" fill="#6d28d9" className={cn("transition-opacity duration-300", activeStage === 1 ? "opacity-100" : "opacity-0")}>
              {activeStage === 1 && <animateMotion dur="1.2s" path={getLinePath(1, 2)} fill="freeze" />}
            </circle>
            <circle r="4" fill="#6d28d9" className={cn("transition-opacity duration-300", activeStage === 2 ? "opacity-100" : "opacity-0")}>
              {activeStage === 2 && <animateMotion dur="1.2s" path={getLinePath(2, 3)} fill="freeze" />}
            </circle>

            {/* Draw Cubes */}
            {nodes.map((node, i) => (
              <g key={i}>
                {renderCube(node.cx, node.cy, node.type, node.label)}
              </g>
            ))}

          </svg>

          {/* HTML Overlays for Icons (easier than SVG perspective transforms) */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Node 0 Icon */}
            <div className="absolute flex items-center justify-center text-[#C8C7BA]" style={{ left: nodes[0].cx, top: nodes[0].cy - h/4, transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(-45deg)' }}>
              <Mic size={24} strokeWidth={1.5} />
            </div>
            {/* Node 1 Icon */}
            <div className="absolute flex items-center justify-center text-[#F0EFE2]" style={{ left: nodes[1].cx, top: nodes[1].cy - h/4, transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(-45deg)' }}>
              <OpenAILogo size={22} />
            </div>
            {/* Node 2 Icon */}
            <div className="absolute flex items-center justify-center text-[#F0EFE2]" style={{ left: nodes[2].cx, top: nodes[2].cy - h/4, transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(-45deg)' }}>
              <MetaLogo size={22} />
            </div>
            {/* Node 3 Icon */}
            <div className="absolute flex items-center justify-center text-[#C8C7BA]" style={{ left: nodes[3].cx, top: nodes[3].cy - h/4, transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(-45deg)' }}>
              <Volume2 size={24} strokeWidth={1.5} />
            </div>
          </div>

          {/* Floating Payload Cards */}
          <div className="absolute inset-0 pointer-events-none">
            
            {/* Card 1: Client -> STT */}
            <div className={cn(
              "absolute bg-white text-black p-3 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#e5e5e5] transition-all duration-500 min-w-[180px]",
              activeStage === 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
            style={{ left: nodes[0].cx + 40, top: nodes[0].cy - 120 }}>
              <div className="text-[#C8C7BA] text-[9px] font-mono mb-2 uppercase font-bold tracking-widest">POST /stream/audio</div>
              <div className="text-[10px] bg-[#f8f8f8] p-2 rounded text-[#333] border border-[#eee]">
                {"{"}<br/>
                &nbsp;&nbsp;"blob": "ev:0x3F...",<br/>
                &nbsp;&nbsp;"codec": "opus"<br/>
                {"}"}
              </div>
            </div>

            {/* Card 2: STT -> LLM */}
            <div className={cn(
              "absolute bg-white text-black p-3 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#e5e5e5] transition-all duration-500 min-w-[200px]",
              activeStage === 1 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
            style={{ left: nodes[1].cx + 40, top: nodes[1].cy - 120 }}>
              <div className="text-[#C8C7BA] text-[9px] font-mono mb-2 uppercase font-bold tracking-widest flex justify-between">
                <span>STT ➔ LLM</span>
                <span className="text-[#6d28d9]">42ms</span>
              </div>
              <div className="text-[10px] bg-[#f8f8f8] p-2 rounded text-[#333] border border-[#eee]">
                {"{"}<br/>
                &nbsp;&nbsp;"text": "book my flight",<br/>
                &nbsp;&nbsp;"confidence": 0.98<br/>
                {"}"}
              </div>
            </div>

            {/* Card 3: LLM -> TTS */}
            <div className={cn(
              "absolute bg-white text-black p-3 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#e5e5e5] transition-all duration-500 min-w-[220px]",
              activeStage === 2 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
            style={{ left: nodes[2].cx + 40, top: nodes[2].cy - 120 }}>
              <div className="text-[#C8C7BA] text-[9px] font-mono mb-2 uppercase font-bold tracking-widest flex justify-between">
                <span>LLM ➔ TTS</span>
                <span className="text-[#6d28d9]">221ms</span>
              </div>
              <div className="text-[10px] bg-[#f8f8f8] p-2 rounded text-[#333] border border-[#eee]">
                {"{"}<br/>
                &nbsp;&nbsp;"intent": "book_flight",<br/>
                &nbsp;&nbsp;"text": "I can help with..."<br/>
                {"}"}
              </div>
            </div>

            {/* Card 4: TTS -> Client */}
            <div className={cn(
              "absolute bg-white text-black p-3 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#e5e5e5] transition-all duration-500 min-w-[180px]",
              activeStage === 3 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
            style={{ left: nodes[3].cx - 100, top: nodes[3].cy - 120 }}>
              <div className="text-[#C8C7BA] text-[9px] font-mono mb-2 uppercase font-bold tracking-widest flex justify-between">
                <span>STREAM</span>
                <span className="text-[#6d28d9]">133ms</span>
              </div>
              <div className="text-[10px] bg-[#f8f8f8] p-2 rounded text-[#333] border border-[#eee]">
                {"{"}<br/>
                &nbsp;&nbsp;"buffer": "ev:0x7A...",<br/>
                &nbsp;&nbsp;"latency": "396ms"<br/>
                {"}"}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Latency Battlefield Bar (Kept intact for grounding metrics) */}
      <div className="w-full max-w-[450px] bg-[#0a0a0a] border border-[#222] p-5 rounded-md z-10 shadow-2xl relative mt-4">
        <div className="flex justify-between text-[10px] text-[#C8C7BA] mb-3 uppercase tracking-wider font-bold">
          <span>Response Latency</span>
          <span>Sub-600ms</span>
        </div>
        
        <div className="relative h-2 bg-[#222] rounded-full overflow-hidden mb-3">
          <div className="absolute top-0 bottom-0 left-[60%] w-[1px] bg-white/20 z-10" />
          <div 
            className={cn(
              "absolute top-0 left-0 bottom-0 bg-[#6d28d9] transition-all duration-500 ease-out",
              activeStage === 0 ? "w-[0%]" :
              activeStage === 1 ? "w-[15%]" :
              activeStage === 2 ? "w-[45%]" :
              activeStage >= 3 ? "w-[71%]" : "w-[0%]"
            )}
          />
        </div>

        <div className="flex justify-between items-end mt-5">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] text-[#666] font-bold uppercase tracking-wider">Traditional Stack</div>
            <div className="text-sm text-[#F0EFE2] line-through opacity-40 font-mono">1.42s</div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <div className="text-[10px] text-[#6d28d9] font-bold uppercase tracking-wider">Dhyra Pipeline</div>
            <div className="text-2xl font-bold text-[#F0EFE2] leading-none font-mono">
              {activeStage < 3 ? "..." : "428ms"}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
