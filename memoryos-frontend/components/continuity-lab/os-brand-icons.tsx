"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AskOsId } from "@/lib/continuity-lab/ask-os-preference";

type IconProps = { className?: string; muted?: boolean };

/**
 * Brand-accurate OS marks for the Continuity Lab sandbox picker.
 *
 * - Ubuntu: Circle of Friends path from Simple Icons v14.12.3
 *   (https://simpleicons.org/?q=ubuntu) on Ubuntu brand orange #E95420.
 * - Windows: Four-pane geometry from Wikimedia Commons "Windows logo - 2021"
 *   (https://commons.wikimedia.org/wiki/File:Windows_logo_-_2021.svg).
 *   Colored variant uses Microsoft brand pane colors; monochrome uses currentColor.
 */

const UBUNTU_BRAND_ORANGE = "#E95420";

/** Simple Icons `ubuntu` path (viewBox 0 0 24 24). */
const UBUNTU_CIRCLE_OF_FRIENDS_PATH =
  "M17.61.455a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zM12.92.8C8.923.777 5.137 2.941 3.148 6.451a4.5 4.5 0 0 1 .26-.007 4.92 4.92 0 0 1 2.585.737A8.316 8.316 0 0 1 12.688 3.6 4.944 4.944 0 0 1 13.723.834 11.008 11.008 0 0 0 12.92.8zm9.226 4.994a4.915 4.915 0 0 1-1.918 2.246 8.36 8.36 0 0 1-.273 8.303 4.89 4.89 0 0 1 1.632 2.54 11.156 11.156 0 0 0 .559-13.089zM3.41 7.932A3.41 3.41 0 0 0 0 11.342a3.41 3.41 0 0 0 3.41 3.409 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41zm2.027 7.866a4.908 4.908 0 0 1-2.915.358 11.1 11.1 0 0 0 7.991 6.698 11.234 11.234 0 0 0 2.422.249 4.879 4.879 0 0 1-.999-2.85 8.484 8.484 0 0 1-.836-.136 8.304 8.304 0 0 1-5.663-4.32zm11.405.928a3.41 3.41 0 0 0-3.41 3.41 3.41 3.41 0 0 0 3.41 3.41 3.41 3.41 0 0 0 3.41-3.41 3.41 3.41 0 0 0-3.41-3.41z";

/** Official Windows four-pane geometry (viewBox 0 0 4875 4875). */
const WINDOWS_VIEWBOX = "0 0 4875 4875";

const WINDOWS_PANE_COLORS = {
  topLeft: "#F25022",
  topRight: "#7FBA00",
  bottomLeft: "#00A4EF",
  bottomRight: "#FFB900",
} as const;

const WINDOWS_PANES = [
  { fill: WINDOWS_PANE_COLORS.topLeft, d: "M0 0h2311v2310H0z" },
  { fill: WINDOWS_PANE_COLORS.topRight, d: "M2564 0h2311v2310H2564z" },
  { fill: WINDOWS_PANE_COLORS.bottomLeft, d: "M0 2564h2311v2311H0z" },
  { fill: WINDOWS_PANE_COLORS.bottomRight, d: "M2564 2564h2311v2311H2564z" },
] as const;

function BrandSvg({
  className,
  muted,
  children,
  viewBox = "0 0 24 24",
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0", muted && "opacity-55", className)}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function UbuntuBrandIcon({ className, muted }: IconProps) {
  return (
    <BrandSvg className={className} muted={muted}>
      <circle cx="12" cy="12" r="12" fill={UBUNTU_BRAND_ORANGE} />
      <path fill="#FFFFFF" d={UBUNTU_CIRCLE_OF_FRIENDS_PATH} />
    </BrandSvg>
  );
}

export function WindowsBrandIcon({ className, muted }: IconProps) {
  return (
    <BrandSvg className={className} muted={muted} viewBox={WINDOWS_VIEWBOX}>
      {WINDOWS_PANES.map((pane) => (
        <path key={pane.d} fill={pane.fill} d={pane.d} />
      ))}
    </BrandSvg>
  );
}

export function OsBrandIcon({ os, className, muted }: { os: AskOsId } & IconProps) {
  return os === "windows" ? (
    <WindowsBrandIcon className={className} muted={muted} />
  ) : (
    <UbuntuBrandIcon className={className} muted={muted} />
  );
}
