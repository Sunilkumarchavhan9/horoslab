"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Official MemoryOS star mark (matches landing / ask FAB). */
export const MEMORYOS_STAR_PATH =
  "M11.763,3.112 L13.368,3.112 L13.368,11.796 L12.419,11.796 L11.763,11.309 L11.763,3.112 Z M10.263,22.888 L9.395,20.691 L9.395,12.007 L10.355,12.007 L10.934,12.007 L10.934,12.954 L11.000,20.691 L10.263,22.888 Z M18.837,17.437 L17.607,18.469 L12.592,12.599 L14.526,12.449 L18.837,17.437 Z M4.132,4.933 L5.361,3.901 L10.205,9.674 L8.442,9.921 L4.132,4.933 Z M22.000,11.796 L22.000,10.191 L13.316,10.191 L13.316,11.140 L13.342,11.796 L13.803,11.796 L22.000,11.796 Z M2.197,10.401 L0.000,11.138 L2.197,12.007 L10.934,12.007 L10.882,11.164 L10.729,10.941 L9.947,10.401 L2.197,10.401 Z";

const SHIMMER_STOPS = [
  { offset: "0%", color: "#ef4444" },
  { offset: "14%", color: "#f97316" },
  { offset: "28%", color: "#eab308" },
  { offset: "42%", color: "#22c55e" },
  { offset: "56%", color: "#06b6d4" },
  { offset: "70%", color: "#3b82f6" },
  { offset: "84%", color: "#8b5cf6" },
  { offset: "92%", color: "#fbbf24" },
  { offset: "100%", color: "#ef4444" },
] as const;

type MemoryosLogoTileProps = {
  className?: string;
  /** Pixel width/height of the tile (square). */
  size?: number;
};

/** Sidebar / chrome: blue tile with star only — no label inside the square. */
export function MemoryosLogoTile({ className, size = 28 }: MemoryosLogoTileProps) {
  const iconSize = Math.round(size * 0.52);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-none border border-black/5 bg-white",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 22 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block text-[#d4af37]"
      >
        <path d={MEMORYOS_STAR_PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

type MemoryosLogoMarkProps = {
  className?: string;
  /** Pixel width/height of the mark (square). */
  size?: number;
  /** `tile` = Devin-style blue square; `mark` = standalone star */
  variant?: "mark" | "tile";
  /** Rainbow sweep — off by default for calmer Continuity Lab chrome */
  shimmer?: boolean;
};

function MemoryosLogoMarkStar({
  className,
  size,
  shimmer,
}: Required<Pick<MemoryosLogoMarkProps, "size" | "shimmer">> &
  Pick<MemoryosLogoMarkProps, "className">) {
  const uid = useId().replace(/:/g, "");
  const maskId = `memoryos-star-mask-${uid}`;
  const gradId = `memoryos-star-shimmer-${uid}`;

  return (
    <span
      className={cn("memoryos-logo-mark inline-flex shrink-0 text-zinc-300", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="MemoryOS"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="memoryos-logo-mark__svg block size-full overflow-visible"
        aria-hidden
      >
        {shimmer ? (
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="26">
              <path d={MEMORYOS_STAR_PATH} fill="white" />
            </mask>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="22"
              y2="26"
            >
              {SHIMMER_STOPS.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
        ) : null}

        <path d={MEMORYOS_STAR_PATH} className="memoryos-logo-mark__base" fill="currentColor" />

        {shimmer ? (
          <g mask={`url(#${maskId})`} className="memoryos-logo-mark__shimmer-wrap">
            <rect
              className="memoryos-logo-mark__shimmer"
              x="-22"
              y="-4"
              width="66"
              height="34"
              fill={`url(#${gradId})`}
            />
          </g>
        ) : null}
      </svg>
    </span>
  );
}

/** Standalone star for MCP catalog (e.g. DeepWiki). */
export function MemoryosStarIcon({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0 text-[#60A5FA]", className)}
      aria-hidden
    >
      <path d={MEMORYOS_STAR_PATH} fill="currentColor" />
    </svg>
  );
}

export function MemoryosLogoMark({
  className,
  size = 56,
  variant = "mark",
  shimmer = false,
}: MemoryosLogoMarkProps) {
  if (variant === "tile") {
    return <MemoryosLogoTile className={className} size={size} />;
  }
  return <MemoryosLogoMarkStar className={className} size={size} shimmer={shimmer} />;
}
