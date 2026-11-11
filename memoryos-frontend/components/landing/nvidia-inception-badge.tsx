"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NvidiaInceptionBadgeProps {
  className?: string;
}

/**
 * NVIDIA Inception Program membership badge for the global landing footer.
 * Renders the stacked NVIDIA split-eye swirl mark and wordmark beside a
 * vertical hairline divider and "INCEPTION / PROGRAM" lockup.
 */
export function NvidiaInceptionBadge({ className }: NvidiaInceptionBadgeProps) {
  return (
    <a
      href="https://www.nvidia.com/en-us/startups/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="NVIDIA Inception Program Member"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-[7px] bg-[#222322] border border-[#323432] hover:border-[#474947] px-3 py-2 transition-colors select-none",
        className
      )}
    >
      {/* Left: Stacked NVIDIA Eye Swirl + Wordmark */}
      <div className="flex flex-col items-center">
        <svg
          width="32"
          height="21"
          viewBox="0 4 24 16"
          fill="#76B900"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" />
        </svg>

        <div className="mt-1 flex items-end gap-[1.5px]">
          <svg
            width="44"
            height="8"
            viewBox="0 0 85 16"
            fill="#FFFFFF"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            {/* n */}
            <path d="M0 0 H10.5 C12.6 0 14 1.4 14 3.5 V16 H10.8 V3.3 C10.8 2.9 10.5 2.7 10.1 2.7 H3.2 V16 H0 Z" />
            {/* V */}
            <path d="M16.8 0 H20.4 L24.5 11.8 L28.6 0 H32.2 L26.3 16 H22.7 Z" />
            {/* I */}
            <path d="M35 0 H38.2 V16 H35 Z" />
            {/* D */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M41.8 0 H51.5 C54.8 0 56.8 2.0 56.8 5.2 V10.8 C56.8 14.0 54.8 16 51.5 16 H41.8 Z M45 2.8 V13.2 H51.2 C52.8 13.2 53.6 12.2 53.6 10.6 V5.4 C53.6 3.8 52.8 2.8 51.2 2.8 Z"
            />
            {/* I */}
            <path d="M60.4 0 H63.6 V16 H60.4 Z" />
            {/* A */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M73.0 0 H77.0 L83.4 16 H79.9 L78.3 11.8 H71.7 L70.1 16 H66.6 Z M75.0 3.3 L72.6 9.2 H77.4 Z"
            />
          </svg>
          <span className="text-[4px] leading-none text-white/80 font-sans -mb-[1px]">
            ®
          </span>
        </div>
      </div>

      {/* Center Vertical Hairline Divider */}
      <div className="w-px h-8 bg-[#5E605E] shrink-0" aria-hidden="true" />

      {/* Right: INCEPTION / PROGRAM */}
      <div className="flex flex-col justify-center pr-0.5 text-[#E5E5E0] font-sans text-[9.5px] font-light tracking-[0.07em] leading-[1.28] uppercase">
        <span>INCEPTION</span>
        <span>PROGRAM</span>
      </div>
    </a>
  );
}

