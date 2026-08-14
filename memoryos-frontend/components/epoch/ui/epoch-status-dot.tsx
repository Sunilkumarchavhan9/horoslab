"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type StatusDotVariant =
  | "healthy"
  | "live"
  | "optimizing"
  | "warning"
  | "failed"
  | "paused"
  | "muted"
  | "running";

interface StatusDotProps {
  status: StatusDotVariant | string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

export function EpochStatusDot({
  status,
  size = "md",
  animate = true,
  className,
}: StatusDotProps) {
  const norm = (status || "muted").toLowerCase();

  let colorClasses = "bg-[#969696]";
  let pulseClasses = "";

  if (["healthy", "live", "ready", "available", "success", "passed", "deployed"].includes(norm)) {
    colorClasses = "bg-[#75bf00]";
    if (animate) pulseClasses = "after:bg-[#75bf00]/40";
  } else if (["optimizing", "benchmarking", "discovering", "verifying", "running"].includes(norm)) {
    colorClasses = "bg-[#2563eb]"; // technical subtle blue for live execution
    if (animate) pulseClasses = "after:bg-[#2563eb]/40 animate-pulse";
  } else if (["warning", "attention", "degraded"].includes(norm)) {
    colorClasses = "bg-[#d97706]";
  } else if (["failed", "error", "destructive"].includes(norm)) {
    colorClasses = "bg-[#dc2626]";
  } else if (["paused", "stopped", "draft", "queued"].includes(norm)) {
    colorClasses = "bg-[#8c9489]";
  }

  const sizeClasses =
    size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2";

  return (
    <span
      className={cn(
        "relative inline-flex flex-shrink-0 rounded-full",
        sizeClasses,
        colorClasses,
        pulseClasses,
        className
      )}
    />
  );
}
