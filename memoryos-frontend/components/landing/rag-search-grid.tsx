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

export interface RagSearchGridProps {
  label1?: string;
  label2?: string;
  label3?: string;
  label4?: string;
  label5?: string;
  label6?: string;
}

export function RagSearchGrid({
  label1 = "Q&A",
  label2 = "Citations",
  label3 = "Audits",
  label4 = "Briefs",
  label5,
  label6,
}: RagSearchGridProps = {}) {
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
        {/* Helper inner container that maintains the exact 1054/740 aspect ratio for precise positioning */}
        <div className="w-full h-full relative" style={{ aspectRatio: '1054/740' }}>
        
          {/* Row 1 (y=7%) */}
          {/* Col 2: OpenAI */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '28%', top: '7%', transform: 'translate(-50%, -50%)' }}>
            <OpenAILogo size={26} />
          </div>
          {/* Center: Mistral */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '50%', top: '7%', transform: 'translate(-50%, -50%)' }}>
            <MistralLogo size={38} /> 
          </div>
          {/* Col 4: Qwen */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '72%', top: '7%', transform: 'translate(-50%, -50%)' }}>
            <QwenLogo size={30} />
          </div>
          {/* Col 5: Nomic Ghost (moved up to Row 1 so it never collides with label2!) */}
          <div className="absolute flex items-center justify-center pointer-events-auto opacity-70" style={{ left: '90%', top: '7%', transform: 'translate(-50%, -50%)' }}>
            <span className="text-2xl">👻</span>
          </div>

          {/* Row 2 (y=19%) */}
          {/* Text: label1 */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap" style={{ left: '12%', top: '19%', transform: 'translate(-50%, -50%)' }}>
            {label1}
          </div>
          {/* Text: label2 */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap" style={{ left: '82%', top: '19%', transform: 'translate(-50%, -50%)' }}>
            {label2}
          </div>

          {/* Row 3 (y=38%) */}
          {/* Col 1: Microsoft */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '10%', top: '38%', transform: 'translate(-50%, -50%)' }}>
            <MicrosoftLogo size={22} />
          </div>

          {/* Center: Hugging Face Logo (Reduced from 240px to balanced ~100px) */}
          <div className="absolute z-30 flex items-center justify-center pointer-events-auto" style={{ left: '50%', top: '38%', transform: 'translate(-50%, -50%)' }}>
            <div className="relative hover:scale-105 transition-transform duration-300 drop-shadow-[0_8px_20px_rgba(255,255,255,0.08)]">
               <div className="absolute inset-0 bg-white/5 blur-[25px] rounded-full scale-110"></div>
               <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="Hugging Face" className="w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] md:w-[110px] md:h-[110px] relative z-10" />
            </div>
          </div>

          {/* Col 5: Meta */}
          <div className="absolute flex items-center justify-center text-blue-500 pointer-events-auto" style={{ left: '90%', top: '38%', transform: 'translate(-50%, -50%)' }}>
            <MetaLogo size={26} />
          </div>

          {/* Row 4 (y=56%) */}
          {/* Col 1: Kimi */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '10%', top: '56%', transform: 'translate(-50%, -50%)' }}>
            <KimiLogo size={22} />
          </div>
          
          {/* Center Text: label3 (Directly below Hugging Face logo with clear visibility) */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap" style={{ left: '50%', top: '56%', transform: 'translate(-50%, -50%)' }}>
            {label3}
          </div>

          {/* Optional Text: label6 */}
          {label6 && (
            <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap" style={{ left: '84%', top: '56%', transform: 'translate(-50%, -50%)' }}>
              {label6}
            </div>
          )}

          {/* Row 5 (y=75%) */}
          {/* Optional Text: label5 */}
          {label5 && (
            <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap" style={{ left: '12%', top: '75%', transform: 'translate(-50%, -50%)' }}>
              {label5}
            </div>
          )}

          {/* Col 2: DeepSeek */}
          <div className="absolute flex items-center justify-center pointer-events-auto opacity-70" style={{ left: '34%', top: '75%', transform: 'translate(-50%, -50%)' }}>
            <DeepSeekLogo size={22} />
          </div>
          
          {/* Col 4: VLLM (Moved inward away from label4 so ZERO overlap) */}
          <div className="absolute flex items-center justify-center pointer-events-auto" style={{ left: '64%', top: '75%', transform: 'translate(-50%, -50%)' }}>
            <VLLMLogo size={22} />
          </div>

          {/* Text: label4 */}
          <div className="absolute flex items-center justify-center pointer-events-auto text-[#F0EFE2] text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap" style={{ left: '84%', top: '75%', transform: 'translate(-50%, -50%)' }}>
            {label4}
          </div>
          
        </div>
      </div>

    </div>
  );
}
