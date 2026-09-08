"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { PixelLoadTone } from "@/components/ui/pixel-load-overlay";
import { cn } from "@/lib/utils";

export type PixelLoadButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  pixelTone?: PixelLoadTone;
};

function variantFromTone(tone: PixelLoadTone): "default" | "outline" | "secondary" | "ghost" {
  if (tone === "dark") return "default";
  if (tone === "light") return "outline";
  return "secondary";
}

/** Square / catalog actions — uses shared Button + pixel loading. */
export function PixelLoadButton({
  loading = false,
  pixelTone = "dark",
  variant,
  className,
  children,
  ...props
}: PixelLoadButtonProps) {
  return (
    <Button
      loading={loading}
      variant={variant ?? variantFromTone(pixelTone)}
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function pixelToneFromClassName(className?: string): PixelLoadTone {
  if (!className) return "dark";
  if (
    className.includes("bg-white")
    || className.includes("bg-[#F3F4F6]")
    || className.includes("bg-[#F9FAFB]")
    || className.includes("text-[#374151]")
  ) {
    return className.includes("bg-[#111827]") || className.includes("text-[#F0EFE2]") ? "dark" : "light";
  }
  if (className.includes("bg-[#111827]") || className.includes("text-[#F0EFE2]")) return "dark";
  return "muted";
}
