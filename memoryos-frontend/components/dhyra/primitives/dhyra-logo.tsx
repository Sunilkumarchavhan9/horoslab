"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DhyraLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "full" | "icon" | "wordmark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  dark?: boolean;
}

export function DhyraIcon({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 72 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto shrink-0 select-none", className)}
      {...props}
    >
      <g transform="scale(0.75, 0.85)">
        <path d="M2.17554 25.5762H26.6507C28.2824 25.7249 29.9141 26.171 31.3645 26.9145L39.8855 30.3345C41.6984 31.078 43.5114 31.3754 44.9618 31.3754H92.6431V38.0669H69.7996C68.3492 37.9182 66.8988 37.4721 65.6297 36.8773L54.208 32.565C52.395 31.9702 50.7633 31.5241 48.9503 31.5241H2.17554V25.5762Z" fill="#F0EFE2" />
        <path d="M11.188 14C13.502 14 15.282 14.4235 17.24 15.2706C20.088 16.5412 23.648 18.0941 26.318 18.9412C28.098 19.5059 29.7 19.6471 31.836 19.6471H35.396C37.532 19.6471 39.312 20.0706 41.27 20.7765L51.594 24.7294C53.552 25.4353 55.154 26 57.29 26H92V19.6471H31.836C29.7 19.6471 28.098 19.5059 26.318 18.9412C23.648 18.0941 20.088 16.5412 17.24 15.2706C15.282 14.4235 13.502 14 11.188 14H3V19.6471H31.836C29.7 19.6471 28.098 19.5059 26.318 18.9412C23.648 18.0941 20.088 16.5412 17.24 15.2706C15.282 14.4235 13.502 14 11.188 14Z" fill="#F0EFE2" />
        <path d="M3 1H37.2445C40.0982 1 41.525 1.49412 43.3086 2.31765C46.8757 3.96471 51.513 6.27059 55.0802 7.42353C56.6854 7.91765 57.9339 8.24706 59.3607 8.24706C60.6092 8.24706 61.6794 8.41176 62.7495 8.41176H92V15H84.509C82.012 15 79.8717 14.3412 77.9098 13.5176L68.992 9.56471C67.0301 8.74118 64.8898 8.41176 62.7495 8.41176H3V1Z" fill="#F0EFE2" />
      </g>
    </svg>
  );
}

export function DhyraLogo({
  variant = "full",
  size = "md",
  className,
  dark,
  ...props
}: DhyraLogoProps & { size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" }) {
  if (variant === "icon") {
    return <DhyraIcon className={className} {...props} />;
  }

  const heightClasses = {
    xs: "h-3 text-xs",
    sm: "h-3.5 text-sm",
    md: "h-4 text-base",
    lg: "h-5 text-lg",
    xl: "h-6 text-xl",
    "2xl": "h-8 text-2xl",
    "3xl": "h-12 text-3xl",
    "4xl": "h-16 text-4xl",
  };

  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1", heightClasses[size], className)} {...props}>
        <DhyraIcon className="w-auto h-[1.25em] text-current" />
        <span className="font-medium tracking-tight leading-none text-current">
          Dhyra
        </span>
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={cn("flex items-center gap-2", heightClasses[size], className)} {...props}>
        <DhyraIcon className="w-auto h-[1em] text-current" />
        <span className="font-medium tracking-tight text-current">
          Dhyra
        </span>
      </div>
    );
  }

  return (
    <DhyraIcon className={cn(heightClasses[size], className)} {...props} />
  );
}

export default DhyraLogo;
