"use client";

import React from "react";

interface HorosVerticalGridLinesProps {
  className?: string;
  hideOuter?: boolean;
}

/**
 * 4 Adaptive Vertical Dashed Guidelines (2 on Left, 2 on Right)
 * Non-fixed, fluidly scaling based on screen size:
 * - Mobile:   Inner lines frame 94% content width
 * - Tablet:   Inner lines at 8% / 8% (84% content), outer lines at 4%
 * - Laptop:   Inner lines at 10% / 10% (80% content), outer lines at 5%
 * - Desktop:  Inner lines at 14% / 14% (72% content), outer lines at 7%
 * - Ultra:    Inner lines at 18% / 18% (64% content), outer lines at 10%
 */
export function HorosVerticalGridLines({
  className = "",
  hideOuter = false,
}: HorosVerticalGridLinesProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      {/* 1. Left Outer Vertical Dashed Line */}
      {!hideOuter && (
        <div className="hidden md:block absolute left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
      )}

      {/* 2. Left Inner Vertical Dashed Line (snaps to content/navbar left border) */}
      <div className="absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333333]" />

      {/* 3. Right Inner Vertical Dashed Line (snaps to content/navbar right border) */}
      <div className="absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#333333]" />

      {/* 4. Right Outer Vertical Dashed Line */}
      {!hideOuter && (
        <div className="hidden md:block absolute right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#262626]" />
      )}
    </div>
  );
}

