"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const PIXEL_COLS = 24;
const PIXEL_ROWS = 5;
const PIXEL_COUNT = PIXEL_COLS * PIXEL_ROWS;

export type PixelLoadTone = "dark" | "light" | "muted";

export function PixelLoadOverlay({ tone = "dark" }: { tone?: PixelLoadTone }) {
  const indices = useMemo(() => Array.from({ length: PIXEL_COUNT }, (_, i) => i), []);

  return (
    <span className={cn("pixel-load-overlay", `pixel-load-overlay--${tone}`)} aria-hidden>
      {indices.map((index) => (
        <span
          key={index}
          className="pixel-load-overlay__cell"
          style={{
            animationDelay: `${(index % PIXEL_COLS) * 42 + Math.floor(index / PIXEL_COLS) * 76}ms`,
          }}
        />
      ))}
    </span>
  );
}
