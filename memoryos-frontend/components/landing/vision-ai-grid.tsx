"use client";

import React from "react";
import { 
  MetaLogo, 
  NvidiaLogo, 
  HuggingFaceLogo, 
  MistralLogo,
  MicrosoftLogo,
  QwenLogo,
  OpenAILogo,
  AnthropicLogo,
  DeepSeekLogo,
  VLLMLogo
} from "@/components/dhyra/primitives/brand-icons";

export function VisionAIGrid() {
  return (
    <div className="w-full mx-auto relative flex justify-center items-center select-none" style={{ aspectRatio: '1054/740' }}>
      
      {/* Custom SVG Grid Background from User */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none opacity-50" width="1054" height="740" viewBox="0 0 1054 740" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      </svg>
      
      {/* Foreground Icons overlaying the SVG Grid */}
      <div className="absolute inset-0 z-20 w-full h-full pointer-events-none">
        <div className="w-full h-full relative" style={{ aspectRatio: '1054/740' }}>
        
          {/* Col 2: OpenAI (x=22.3%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '22.3%', top: '5.6%', transform: 'translate(-50%, -50%)' }}>
            <OpenAILogo size={28} />
          </div>
          {/* Center (Col 3/4): Mistral (x=50%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '50%', top: '5.6%', transform: 'translate(-50%, -50%)' }}>
             <MistralLogo size={42} /> 
          </div>
          {/* Col 5: Qwen Logo (x=78.3%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '78.3%', top: '5.6%', transform: 'translate(-50%, -50%)' }}>
            <QwenLogo size={32} />
          </div>

          {/* Text: Object Detection */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#FFF5CE] text-xs sm:text-base sm:text-lg md:text-xl xl:text-lg font-medium whitespace-nowrap" style={{ left: '10%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
            Detection
          </div>
          {/* Text: Captioning */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#FFF5CE] text-xs sm:text-base sm:text-lg md:text-xl xl:text-lg font-medium whitespace-nowrap" style={{ left: '78.3%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
            Captioning
          </div>
          
          <div className="absolute flex items-center justify-center pointer-events-auto opacity-70" style={{ left: '92.5%', top: '17.4%', transform: 'translate(-50%, -50%)' }}>
             <AnthropicLogo size={32} />
          </div>

          {/* Col 1: Microsoft (x=7.6%) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '7.6%', top: '40%', transform: 'translate(-50%, -50%)' }}>
            <MicrosoftLogo size={24} />
          </div>

          {/* Center: Hugging Face Emoji (x=50%) */}
          <div className="absolute z-30 flex items-center justify-center pointer-events-auto" style={{ left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}>
            <div className="relative hover:scale-105 transition-transform duration-300 drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
               <div className="absolute inset-0 bg-white/5 blur-[50px] rounded-full scale-125"></div>
               <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="Hugging Face" className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] relative z-10" />
            </div>
          </div>

          <div className="absolute flex items-center justify-center pointer-events-auto text-[#FFF5CE] text-xs sm:text-base sm:text-lg md:text-xl xl:text-lg font-medium whitespace-nowrap" style={{ left: '50%', top: '65.7%', transform: 'translate(-50%, -50%)' }}>
            Spatial Reasoning
          </div>

          {/* Col 5: Meta (x=78.3%) */}
          <div className="absolute flex items-center justify-center text-blue-500 pointer-events-auto" style={{ left: '92.5%', top: '62.7%', transform: 'translate(-50%, -50%)' }}>
            <MetaLogo size={28} />
          </div>

          <div className="absolute flex items-center justify-center pointer-events-auto opacity-70" style={{ left: '22.3%', top: '74.6%', transform: 'translate(-50%, -50%)' }}>
            <DeepSeekLogo size={24} />
          </div>
          
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '78.3%', top: '74.6%', transform: 'translate(-50%, -50%)' }}>
            <VLLMLogo size={24} />
          </div>
          
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#FFF5CE] text-xs sm:text-base sm:text-lg md:text-xl xl:text-lg font-medium whitespace-nowrap" style={{ left: '92.5%', top: '74.6%', transform: 'translate(-50%, -50%)' }}>
            Video Analysis
          </div>
          
        </div>
      </div>
    </div>
  );
}
