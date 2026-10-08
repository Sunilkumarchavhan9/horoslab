"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  OpenAILogo, 
  MetaLogo, 
  NvidiaLogo, 
  HuggingFaceLogo, 
  SGLangLogo, 
  KimiLogo,
  MistralLogo,
  MicrosoftLogo,
  QwenLogo,
  DeepSeekLogo,
  VLLMLogo,
  AnthropicLogo
} from "@/components/horos/primitives/brand-icons";
import { AiOrb } from "@/components/orb/ai-orb";

export function AIAssistantGrid() {
  return (
    <div className="w-full mx-auto relative flex justify-center items-center select-none" style={{ aspectRatio: '1054/740' }}>
      
      {/* Custom SVG Grid Background */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" width="1054" height="740" viewBox="0 0 1054 740" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>
          {`
            @keyframes colorCycle {
              0%   { stroke: #0ea5e9; } /* Electric Blue */
              20%  { stroke: #10b981; } /* Emerald Green */
              40%  { stroke: #8b5cf6; } /* Amethyst Purple */
              60%  { stroke: #f43f5e; } /* Cyber Rose */
              80%  { stroke: #f59e0b; } /* Solar Amber */
              100% { stroke: #0ea5e9; } /* Back to Blue */
            }
            @keyframes opacityPulse {
              0%, 100% { opacity: 0.15; }
              50% { opacity: 0.9; }
            }
            .grid-lines path {
              animation: colorCycle 30s linear infinite, opacityPulse 3s ease-in-out infinite;
            }
          `}
        </style>
        <g className="grid-lines">
          <path d="M161.5 5V593.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
          <path d="M309 3V596.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M751.5 2V590.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M899 0V593.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0 509H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0 419H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0 174H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0 84H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M529 85.5V169.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M163.5 128H750" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M309 552H753.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M530.5 511V596.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M235.5 84V509" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M163.5 466H309" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M829.5 174L829.5 511" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M753.5 466H899" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M163.5 308.5H307.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M749.5 309H893.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M83 511V595" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0 550.5H163.5" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M83.5 3V87" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0 42.5H164" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M978.5 174L978.5 511" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M898.5 309H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M898.5 466H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0.5 596V739" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M83.5 597V740" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M161.5 594V737" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M751.5 597V740" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M824.5 597V740" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M898.5 594V737" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M0.5 596.5V1H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M824.5 597H0" stroke="#6E6E6E" strokeDasharray="3 2"/>
        <path d="M824.5 597.5H1054" stroke="#6E6E6E" strokeDasharray="3 2"/>
        </g>
      </svg>
      
      {/* Foreground Icons overlaying the SVG Grid */}
      <div className="absolute inset-0 z-20 w-full h-full pointer-events-none">
        {/* Helper inner container that maintains the exact 1054/740 aspect ratio for precise positioning */}
        <div className="w-full h-full relative" style={{ aspectRatio: '1054/740' }}>
        
          {/* Top Row */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '36.5%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
            <OpenAILogo size={24} />
          </div>
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '50%', top: '11.4%', transform: 'translate(-50%, -50%)' }}>
            <MistralLogo size={42} /> 
          </div>
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '78.3%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
            <SGLangLogo size={32} />
          </div>

          {/* Text: Chat */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap" style={{ left: '22.3%', top: '29.2%', transform: 'translate(-50%, -50%)' }}>
            Chat
          </div>

          {/* Text: Tool use & Anthropic */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap" style={{ left: '78.3%', top: '29.2%', transform: 'translate(-50%, -50%)' }}>
            Tool use
          </div>
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '92.5%', top: '29.2%', transform: 'translate(-50%, -50%)' }}>
            <AnthropicLogo size={24} />
          </div>


          {/* Center AI Orb (WebGL) */}
          <div className="absolute z-30 flex items-center justify-center pointer-events-auto" style={{ left: '50.189%', top: '40%', transform: 'translate(-50%, -50%)' }}>
            <div className="relative w-[160px] h-[160px] hover:scale-105 transition-transform duration-700 cursor-pointer">
              <AiOrb state="thinking" />
            </div>
          </div>
          {/* Mid Left */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '7.6%', top: '46.9%', transform: 'translate(-50%, -50%)' }}>
            <MicrosoftLogo size={24} />
          </div>

          {/* Bottom Left */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '7.6%', top: '68.5%', transform: 'translate(-50%, -50%)' }}>
            <KimiLogo size={24} />
          </div>

          {/* Text: Code agent */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap" style={{ left: '50%', top: '68.5%', transform: 'translate(-50%, -50%)' }}>
            Code agent
          </div>

          {/* Bottom Right */}
          <div className="absolute flex items-center justify-center text-blue-500 pointer-events-auto" style={{ left: '85.3%', top: '68.5%', transform: 'translate(-50%, -50%)' }}>
            <MetaLogo size={28} />
          </div>

          {/* Bottom Row */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '29%', top: '77%', transform: 'translate(-50%, -50%)' }}>
            <DeepSeekLogo size={24} />
          </div>
          
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '78.3%', top: '77%', transform: 'translate(-50%, -50%)' }}>
            <VLLMLogo size={24} />
          </div>
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-xs sm:text-sm md:text-base xl:text-lg font-medium whitespace-nowrap text-center leading-tight" style={{ left: '85.3%', top: '77%', transform: 'translate(-50%, -50%)' }}>
            Knowledge<br/>work
          </div>
          
        </div>
      </div>

    </div>
  );
}
