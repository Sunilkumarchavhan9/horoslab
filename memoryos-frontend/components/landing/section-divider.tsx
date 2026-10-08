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

      {/* Crosses at intersections */}
      <div className={`absolute hidden md:block left-[14%] lg:left-[18%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>
      <div className={`absolute hidden md:block left-[86%] lg:left-[82%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>
      {!hideInnerCrosses && (
        <>
          <div className={`hidden md:block absolute left-[calc(14%_+_120px)] lg:left-[calc(18%_+_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>
          <div className={`hidden md:block absolute left-[calc(86%_-_120px)] lg:left-[calc(82%_-_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] ${position === "top" ? "-translate-y-[52%]" : "translate-y-[50%]"} ${positionClass}`}>+</div>
        </>
      )}

      {/* Center Logo Divider */}
      <div className={`absolute left-1/2 ${positionClass} ${position === "top" ? "-translate-y-1/2" : "translate-y-1/2"} -translate-x-1/2 z-20 bg-[#151515] p-2 hidden md:block`}>
        <HorosLogo variant="icon" size="sm" className="w-5 h-auto text-[#F0EFE2]" />
      </div>
    </div>
  );
}
