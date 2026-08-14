"use client";

import { MemoryOSFullLogo } from "./memoryos-full-logo";

type MemoryStarLogoProps = {
  tone?: "auto" | "black" | "white";
  className?: string;
  iconColor?: string;
  textColor?: string;
};

export function MemoryStarLogo({ tone = "auto", className, iconColor, textColor }: MemoryStarLogoProps) {
  const colorClass =
    tone === "white" ? "text-white" : tone === "black" ? "text-black" : "text-current";

  return (
    <MemoryOSFullLogo
      className={["block h-[28px] w-auto shrink-0", colorClass, className].filter(Boolean).join(" ")}
      iconColor={iconColor}
      textColor={textColor}
    />
  );
}
