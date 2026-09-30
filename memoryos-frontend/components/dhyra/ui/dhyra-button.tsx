"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DhyraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "action";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function DhyraButton({
  children,
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: DhyraButtonProps) {
  let baseStyle = "border font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 select-none flex items-center justify-center gap-2";

  if (variant === "primary") {
    baseStyle += " border-[#171a17] bg-[#171a17] text-[#F0EFE2] hover:bg-[#2b302a]";
  } else if (variant === "action") {
    baseStyle += " border-[#65a30d] bg-[#75bf00] text-[#151515] hover:bg-[#83d400] font-semibold";
  } else if (variant === "secondary") {
    baseStyle += " border-[#c9cec4] bg-white text-[#171a17] hover:bg-[#f6f7f5] hover:border-[#aeb5a8]";
  } else if (variant === "outline") {
    baseStyle += " border-dashed border-[#c9cec4] bg-transparent text-[#575e53] hover:border-[#8e9688] hover:text-[#171a17]";
  } else if (variant === "danger") {
    baseStyle += " border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c] hover:bg-[#fee2e2]";
  } else if (variant === "ghost") {
    baseStyle += " border-transparent bg-transparent text-[#61685d] hover:bg-[#f2f4f0] hover:text-[#171a17]";
  }

  const sizeStyle =
    size === "sm"
      ? "px-2.5 py-1 text-xs"
      : size === "lg"
      ? "px-5 py-2.5 text-sm"
      : "px-3.5 py-1.5 text-xs md:text-sm";

  return (
    <button
      className={cn(baseStyle, sizeStyle, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
