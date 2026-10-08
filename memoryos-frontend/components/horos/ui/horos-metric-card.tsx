"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HorosMetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  delta?: {
    value: string;
    isPositive?: boolean;
    isGood?: boolean;
  };
  unit?: string;
  accent?: boolean;
  dark?: boolean;
  className?: string;
}

export function HorosMetricCard({
  label,
  value,
  subtext,
  delta,
  unit,
  accent = false,
  dark = false,
  className,
}: HorosMetricCardProps) {
  return (
    <div
      className={cn(
        "border p-4 transition-colors",
        dark
          ? accent
            ? "border-[#75bf00]/70 bg-[#162013] text-[#F0EFE2]"
            : "border-[#2a3229] bg-[#141814] text-[#F0EFE2] hover:border-[#75bf00]"
          : accent
          ? "border-[#75bf00]/70 bg-[#fbfdf9] text-[#151515]"
          : "border-[#d8ddd3] bg-white text-[#151515] hover:border-[#b4bcb0]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#788173]">
          {label}
        </span>
        {delta ? (
          <span
            className={cn(
              "font-mono text-xs font-medium",
              delta.isGood
                ? "text-[#75bf00]"
                : delta.isPositive
                ? "text-[#3b82f6]"
                : "text-[#ef4444]"
            )}
          >
            {delta.value}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className={cn(
          "font-mono text-2xl font-semibold tracking-[-0.03em] md:text-3xl",
          dark ? "text-[#F0EFE2]" : "text-[#151515]"
        )}>
          {value}
        </span>
        {unit ? (
          <span className="font-mono text-xs text-[#788173]">{unit}</span>
        ) : null}
      </div>
      {subtext ? (
        <p className={cn("mt-1 text-xs leading-relaxed", dark ? "text-[#9ea89d]" : "text-[#687063]")}>
          {subtext}
        </p>
      ) : null}
    </div>
  );
}
