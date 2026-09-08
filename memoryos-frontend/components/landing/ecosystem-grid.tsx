"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DeepSeekLogo,
  KimiLogo,
  MetaLogo,
  MicrosoftLogo,
  MistralLogo,
  NvidiaLogo,
  OpenAILogo,
  QwenLogo,
  SGLangLogo,
  VLLMLogo
} from "@/components/epoch/primitives/brand-icons";
import { VoiceOrb } from "@/components/ui/voice-orb";

export function EcosystemGrid() {
  const states = ["idle", "listening", "thinking", "speaking"] as const;
  const [currentStateIdx, setCurrentStateIdx] = useState(0);

  useEffect(() => {
    // Automatically cycle through states
    const interval = setInterval(() => {
      setCurrentStateIdx((prev) => (prev + 1) % states.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [states.length]);

  const currentState = states[currentStateIdx];

  // Audio-reactive grid stroke color based on Voice Orb state
  const gridColor = useMemo(() => {
    switch (currentState) {
      case "idle": return "rgba(110, 110, 110, 0.4)"; // Subtle grey
      case "listening": return "rgba(162, 210, 255, 0.6)"; // Soft blue
      case "thinking": return "rgba(179, 194, 91, 0.6)"; // Yellow-green
      case "speaking": return "rgba(117, 191, 0, 0.9)"; // Bright brand green
      default: return "rgba(110, 110, 110, 0.4)";
    }
  }, [currentState]);

  const xCoords = [161.5, 309, 751.5, 899];
  const yCoords = [84, 174, 419, 509];

  return (
    <div className="w-full mx-auto relative flex justify-center items-center select-none" style={{ aspectRatio: '1054/740' }}>
      <style>{`
        @keyframes dashFlow {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash-flow {
          animation: dashFlow 0.8s linear infinite;
        }
        .animate-dash-flow-slow {
          animation: dashFlow 2s linear infinite;
        }
      `}</style>

      {/* Custom SVG Grid Background with Radial Mask and Animation */}
      <svg 
        className="absolute inset-0 w-full h-full z-10 pointer-events-none" 
        width="1054" height="740" viewBox="0 0 1054 740" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)', maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)' }}
      >
        <g style={{ stroke: gridColor, transition: 'stroke 1.5s ease-in-out' }} className={currentState === "speaking" ? "animate-dash-flow" : "animate-dash-flow-slow"}>
          <path d="M161.5 5V593.5" strokeDasharray="3 2"/>
          <path d="M309 3V596.5" strokeDasharray="3 2"/>
          <path d="M751.5 2V590.5" strokeDasharray="3 2"/>
          <path d="M899 0V593.5" strokeDasharray="3 2"/>
          <path d="M0 509H1054" strokeDasharray="3 2"/>
          <path d="M0 419H1054" strokeDasharray="3 2"/>
          <path d="M0 174H1054" strokeDasharray="3 2"/>
          <path d="M0 84H1054" strokeDasharray="3 2"/>
          <path d="M529 85.5V169.5" strokeDasharray="3 2"/>
          <path d="M163.5 128H750" strokeDasharray="3 2"/>
          <path d="M309 552H753.5" strokeDasharray="3 2"/>
          <path d="M530.5 511V596.5" strokeDasharray="3 2"/>
          <path d="M235.5 84V509" strokeDasharray="3 2"/>
          <path d="M163.5 466H309" strokeDasharray="3 2"/>
          <path d="M829.5 174L829.5 511" strokeDasharray="3 2"/>
          <path d="M753.5 466H899" strokeDasharray="3 2"/>
          <path d="M163.5 308.5H307.5" strokeDasharray="3 2"/>
          <path d="M749.5 309H893.5" strokeDasharray="3 2"/>
          <path d="M83 511V595" strokeDasharray="3 2"/>
          <path d="M0 550.5H163.5" strokeDasharray="3 2"/>
          <path d="M83.5 3V87" strokeDasharray="3 2"/>
          <path d="M0 42.5H164" strokeDasharray="3 2"/>
          <path d="M978.5 174L978.5 511" strokeDasharray="3 2"/>
          <path d="M898.5 309H1054" strokeDasharray="3 2"/>
          <path d="M898.5 466H1054" strokeDasharray="3 2"/>
          <path d="M0.5 596V739" strokeDasharray="3 2"/>
          <path d="M83.5 597V740" strokeDasharray="3 2"/>
          <path d="M161.5 594V737" strokeDasharray="3 2"/>
          <path d="M751.5 597V740" strokeDasharray="3 2"/>
          <path d="M824.5 597V740" strokeDasharray="3 2"/>
          <path d="M898.5 594V737" strokeDasharray="3 2"/>
          <path d="M0.5 596.5V1H1054" strokeDasharray="3 2"/>
          <path d="M824.5 597H0" strokeDasharray="3 2"/>
          <path d="M824.5 597.5H1054" strokeDasharray="3 2"/>
        </g>
        
        {/* Glowing Intersection Nodes */}
        <g style={{ fill: gridColor, transition: 'fill 1.5s ease-in-out' }}>
          {xCoords.map(x => 
            yCoords.map(y => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" className="animate-pulse" />
            ))
          )}
        </g>
      </svg>
      
      {/* Foreground Icons overlaying the SVG Grid */}
      <div className="absolute inset-0 z-20 w-full h-full pointer-events-none">
        {/* Helper inner container that maintains the exact 1054/740 aspect ratio for precise positioning */}
        <div className="w-full h-full relative" style={{ aspectRatio: '1054/740' }}>
        
          {/* Row 1 (y=5.6%) */}
          {/* Col 2: OpenAI (x=22.3%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '22.3%', top: '5.6%', transform: 'translate(-50%, -50%)' }}>
            <OpenAILogo size={28} />
          </div>
          {/* Center (Col 3/4): Mistral (x=50%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '50%', top: '5.6%', transform: 'translate(-50%, -50%)' }}>
            <MistralLogo size={42} /> 
          </div>
          {/* Col 5: Qwen / Network (x=78.3%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '78.3%', top: '5.6%', transform: 'translate(-50%, -50%)' }}>
            <QwenLogo size={32} />
          </div>

          {/* Row 2 (y=17.4%) */}
          {/* Text: Voice agents */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap" style={{ left: '7.9%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
            Voice agents
          </div>
          {/* Text: API */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap" style={{ left: '78.3%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
            API
          </div>
          {/* Col 6: Ghost/SGLang (x=92.5%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '92.5%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
             <SGLangLogo size={32} />
          </div>

          {/* Row 3 (y=40%) */}
          {/* Col 1: Microsoft (x=7.6%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '7.6%', top: '40%', transform: 'translate(-50%, -50%)' }}>
            <MicrosoftLogo size={24} />
          </div>
          {/* Text: Call center */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap" style={{ left: '42.9%', top: '62.7%', transform: 'translate(-50%, -50%)' }}>
            Call center
          </div>

          {/* Center (Col 3/4): Voice Orb (x=50%) */}
          <div className="absolute z-30 flex items-center justify-center pointer-events-auto" style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}>
            <div className="relative">
               <VoiceOrb orbState={currentState} />
            </div>
          </div>

          {/* Row 4 (y=62.7%) */}
          {/* Col 1: Kimi (x=7.6%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '7.6%', top: '62.7%', transform: 'translate(-50%, -50%)' }}>
            <KimiLogo size={24} />
          </div>
          {/* Col 5: Meta (x=78.3%) */}
          <div className="absolute flex items-center justify-center text-blue-500 pointer-events-auto" style={{ left: '78.3%', top: '62.7%', transform: 'translate(-50%, -50%)' }}>
            <MetaLogo size={28} />
          </div>

          {/* Row 5 (y=74.6%) */}
          {/* Text: Transcription */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap" style={{ left: '90.9%', top: '74.5%', transform: 'translate(-50%, -50%)' }}>
            Transcription
          </div>
          {/* Col 2: DeepSeek (x=22.3%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '22.3%', top: '74.6%', transform: 'translate(-50%, -50%)' }}>
            <DeepSeekLogo size={28} />
          </div>
          {/* Col 5: VLLM (x=78.3%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '78.3%', top: '74.6%', transform: 'translate(-50%, -50%)' }}>
            <VLLMLogo size={24} />
          </div>
          
        </div>
      </div>

    </div>
  );
}
