"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HdBrandIconProps = {
  className?: string;
  viewBox?: string;
  children: ReactNode;
};

/** Shared wrapper for multi-path / gradient brand marks at list icon sizes. */
export function HdBrandIcon({
  className,
  viewBox = "0 0 24 24",
  children,
}: HdBrandIconProps) {
  return (
    <svg
      className={cn("size-5 shrink-0", className)}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}
