"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { HuggingFaceLogo } from "@/components/horos/primitives/brand-icons";

export function FullSpecAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col bg-[#202020]">
      <div 
        className="border-t border-dashed border-[#333] px-8 py-4 flex justify-between items-center cursor-pointer hover:bg-[#2a2a2a] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[13px] font-medium text-[#F0EFE2]">View Full Spec</span>
        {isOpen ? (
          <ChevronUp size={14} className="text-[#76b900]" />
        ) : (
          <ChevronDown size={14} className="text-[#76b900]" />
        )}
      </div>

      {isOpen && (
        <div className="flex flex-col text-[13px]">
          <div className="border-t border-dashed border-[#333] px-8 py-6 flex flex-col gap-2">
            <h4 className="text-[#777] text-[12px]">Gateway compatibility</h4>
            <p className="text-[#ccc] leading-relaxed">OpenAI- and Anthropic-compatible APIs for compatible clients, tools, and gateways</p>
          </div>
          
          <div className="border-t border-dashed border-[#333] px-8 py-6 flex flex-col gap-2">
            <h4 className="text-[#777] text-[12px]">Prefix caching</h4>
            <p className="text-[#ccc] leading-relaxed">
              Automatic prefix caching runs on every replica, and requests from the same session or conversation are routed back to the replica that holds their cached prefix. A stable session hint or prompt_cache_key provides explicit grouping; otherwise RunInfra derives it from the start of the conversation. Hits remain best effort until eviction or a serve restart, never guaranteed. Cached input is billed at the cached input rate. Responses report cached token counts.
            </p>
          </div>

          <div className="border-t border-dashed border-[#333] px-8 py-6 flex flex-col gap-2">
            <h4 className="text-[#777] text-[12px]">Cache retention</h4>
            <p className="text-[#ccc] leading-relaxed">
              Prefix cache is held on the serving GPU and evicted under memory pressure. Retention is best effort.
            </p>
          </div>

          <div className="border-t border-dashed border-[#333] px-8 py-6 flex flex-col gap-2">
            <h4 className="text-[#777] text-[12px]">Upstream model</h4>
            <a href="#" className="flex items-center gap-1.5 text-[#F0EFE2] w-fit group">
              <HuggingFaceLogo size={14} className="text-[#FFD21E]" /> 
              <span className="underline underline-offset-4 decoration-[#777] group-hover:decoration-[#ccc] transition-colors">View model</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
