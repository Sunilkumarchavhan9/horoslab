"use client";

import { cn } from "@/lib/utils";

type PathBrandIconProps = {
  className?: string;
  d: string;
  fill: string;
  viewBox?: string;
};

/** Renders a single-path Simple Icons mark. */
export function PathBrandIcon({
  className,
  d,
  fill,
  viewBox = "0 0 24 24",
}: PathBrandIconProps) {
  const monochrome = fill === "currentColor";
  return (
    <svg
      className={cn("shrink-0", monochrome && "text-[#F0EFE2]/80", className)}
      viewBox={viewBox}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill={monochrome ? "currentColor" : fill} d={d} />
    </svg>
  );
}
