"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DhyraStatusDot } from "./dhyra-status-dot";

interface DhyraBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "healthy" | "active" | "optimizing" | "warning" | "failed" | "mono" | "highlight" | "outline";
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function DhyraBadge({
  children,
  variant = "default",
  showDot = false,
  size = "md",
  className,
}: DhyraBadgeProps) {
  let style = "border-[#d8ddd3] bg-[#f5f6f4] text-[#4b5247]";

  if (variant === "healthy") {
    style = "border-[#b9de78] bg-[#f2fbe6] text-[#336100]";
  } else if (variant === "active") {
    style = "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]";
  } else if (variant === "optimizing") {
    style = "border-[#fed7aa] bg-[#fffbeb] text-[#92400e]";
  } else if (variant === "warning") {
    style = "border-[#fde68a] bg-[#fefce8] text-[#854d0e]";
  } else if (variant === "failed") {
    style = "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]";
  } else if (variant === "highlight") {
    style = "border-[#75bf00] bg-[#75bf00] text-[#151515] font-semibold";
  } else if (variant === "mono") {
    style = "border-[#d8ddd3] bg-white font-mono text-[#252824]";
  } else if (variant === "outline") {
    style = "border-[#c9cec4] bg-transparent text-[#61685d]";
  }

  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-medium tracking-[0.02em]",
        pad,
        style,
        className
      )}
    >
      {showDot ? <DhyraStatusDot status={variant} size="sm" /> : null}
      {children}
    </span>
  );
}
