"use client";

import { MemoryOSFullLogo } from "./memoryos-full-logo";

type MemoryOSLogoProps = {
  className?: string;
};

export function MemoryOSLogo({ className }: MemoryOSLogoProps) {
  return (
    <MemoryOSFullLogo 
      className={className || "h-8 w-auto text-slate-900 dark:text-[#F0EFE2]"} 
    />
  );
}
