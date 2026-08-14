"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function HeroAnnouncementStrip() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glitch-anim {
          0%, 90% { text-shadow: none; transform: translate(0); }
          92% { text-shadow: 2px 0 0 rgba(255,0,0,0.7), -2px 0 0 rgba(0,255,255,0.7); transform: translate(-1px, 0); }
          94% { text-shadow: -2px 0 0 rgba(255,0,0,0.7), 2px 0 0 rgba(0,255,255,0.7); transform: translate(1px, 0); }
          96% { text-shadow: 1px 1px 0 rgba(255,0,0,0.7), -1px -1px 0 rgba(0,255,255,0.7); transform: translate(-1px, 1px); }
          98% { text-shadow: -1px -1px 0 rgba(255,0,0,0.7), 1px 1px 0 rgba(0,255,255,0.7); transform: translate(1px, -1px); }
          100% { text-shadow: none; transform: translate(0); }
        }
        .glitch-text {
          animation: glitch-anim 4s infinite linear;
          display: inline-block;
        }
      `}} />
      <div className="border-b border-dashed border-[#c9d8ee] py-4 relative group">
        <div className="flex justify-center px-6 lg:px-7">
          <div className="inline-flex w-full max-w-full flex-col items-stretch overflow-hidden border-x border-[#c9d8ee] bg-white text-[12px] text-slate-500 sm:w-fit sm:flex-row sm:items-center sm:text-[13px]">
            <span className="inline-flex items-center justify-center gap-2 border-b border-[#c9d8ee] px-3 py-2 text-center font-mono sm:border-b-0 sm:border-r">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#0015FF]" />
              <span className="glitch-text text-[#0015FF] font-semibold tracking-wide uppercase">FOUNDER-LED INSTITUTION RUN</span>
            </span>
            <span className="bg-slate-50/50 px-3 py-2 text-center text-slate-800 font-medium">
              Bring one workflow. Leave with a governed institution, proof, settlement, and the next version.
            </span>
            <a href="/auth/sign-up" className="bg-slate-50/50 px-3 py-2 font-medium text-slate-800 hover:text-black transition inline-flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-[#c9d8ee]">
              Create account &rarr;
            </a>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-800 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X size={16} />
        </button>
      </div>
    </>
  );
}


