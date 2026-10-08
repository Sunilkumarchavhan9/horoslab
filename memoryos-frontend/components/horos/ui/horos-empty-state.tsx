"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { HorosButton } from "./horos-button";

interface HorosEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  dark?: boolean;
  className?: string;
}

export function HorosEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  dark = true,
  className,
}: HorosEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed px-8 py-20 text-center rounded-xs transition-colors",
        dark
          ? "border-[#2e2e2e] bg-[#202020] text-[#F0EFE2]"
          : "border-[#c9cec4] bg-white text-[#171a17]",
        className
      )}
    >
      {icon ? (
        <div className={cn(
          "mb-4 flex h-11 w-11 items-center justify-center border rounded-xs",
          dark ? "border-[#383838] bg-[#1a1a1a] text-[#889084]" : "border-[#c9cec4] bg-[#fbfbfa] text-[#6f7669]"
        )}>
          {icon}
        </div>
      ) : null}
      <h3 className={cn("text-sm font-semibold tracking-[-0.01em]", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
        {title}
      </h3>
      {description ? (
        <p className={cn("mx-auto mt-2 max-w-md text-xs leading-5", dark ? "text-[#889084]" : "text-[#6b7168]")}>
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-6">
          <HorosButton variant="secondary" size="md" onClick={onAction}>
            {actionLabel}
          </HorosButton>
        </div>
      ) : null}
    </div>
  );
}
