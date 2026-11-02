"use client";

import React from "react";
import HorosLogo from "@/components/horos/primitives/horos-logo";

interface SectionDividerProps {
  position?: "top" | "bottom";
  hideInnerCrosses?: boolean;
  className?: string;
}

export function SectionDivider({ position = "top", hideInnerCrosses = false, className = "" }: SectionDividerProps) {
  const positionClass = position === "top" ? "top-0" : "bottom-0";
  const borderClass = position === "top" ? "border-t" : "border-b";
  const layoutClass = className.includes("absolute") ? "" : "relative";

  return (
    <div className={`w-full ${layoutClass} z-20 h-px ${className}`}>
      <div className={`absolute left-0 right-0 ${positionClass} ${borderClass} border-dashed border-[#333]`} />

      {/* Crosses at intersections matching the 4 adaptive vertical lines */}
      <div className={`absolute hidden md:block left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>
      <div className={`absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>
      <div className={`absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] text-[#F0CC94] font-mono text-[10px] leading-none transform translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>
      <div className={`absolute hidden md:block right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] text-[#F0CC94] font-mono text-[10px] leading-none transform translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>

      {/* Center Logo Divider */}
      <div className={`absolute left-1/2 ${positionClass} ${position === "top" ? "-translate-y-1/2" : "translate-y-1/2"} -translate-x-1/2 z-20 bg-[#151515] p-2 hidden md:block`}>
        <HorosLogo variant="icon" size="sm" className="w-5 h-auto text-[#F0EFE2]" />
      </div>
    </div>
  );
}
