"use client";

type DitherBackgroundProps = {
  cols?: number;
  rows?: number;
  accent?: string;
  background?: string;
  density?: number;
  className?: string;
  opacity?: number;
};

export function DitherBackground({
  cols = 96,
  rows = 56,
  accent = "#5fa4ff",
  background = "transparent",
  density = 0.62,
  className,
  opacity = 1,
}: DitherBackgroundProps) {
  void cols;
  void rows;
  void accent;
  void density;

  return <div aria-hidden className={className} style={{ opacity, background }} />;
}
