"use client";

import { useEffect, useRef } from "react";

const ASCII_CHARS = " .:+*x234589";
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const THEME = {
  blueLow: { r: 159, g: 191, b: 255 },
  blueMid: { r: 95, g: 146, b: 255 },
  blueHigh: { r: 53, g: 106, b: 204 },
  white: { r: 255, g: 255, b: 255 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fract(value: number) {
  return value - Math.floor(value);
}

function hashNoise(x: number, y: number, t: number) {
  return fract(Math.sin(x * 12.9898 + y * 78.233 + t * 0.41) * 43758.5453);
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/** Radial flower mask: bud + petals expand with progress (0–1). */
function flowerIntensity(
  x: number,
  y: number,
  cx: number,
  cy: number,
  maxR: number,
  progress: number,
  time: number,
): number {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const petalCount = 8;
  const petalWave = 0.52 + 0.48 * Math.cos(angle * petalCount);
  const bloom = easeOutCubic(clamp(progress, 0, 1));

  const budR = maxR * 0.14 * Math.min(1, bloom * 2.8);
  if (dist <= budR) {
    const core = 0.88 + hashNoise(x, y, time) * 0.1;
    return clamp(core, 0, 1);
  }

  const petalReach = maxR * (0.18 + bloom * 0.82) * petalWave;
  const stemAngle = Math.abs(Math.sin(angle * 2)) * 0.08;
  const reach = petalReach * (1 + stemAngle);

  if (dist > reach) {
    const halo = reach + maxR * 0.06 * bloom;
    if (dist < halo) {
      const falloff = 1 - (dist - reach) / (halo - reach);
      return falloff * 0.12 * bloom;
    }
    return 0;
  }

  const edge = 1 - dist / Math.max(reach, 1);
  const ripple = 0.06 * Math.sin(dist * 0.22 - time * 2.4 + angle * 3);
  const grain = (hashNoise(x * 0.7, y * 0.7, time) - 0.5) * 0.08;
  return clamp(edge * 0.92 + ripple + grain, 0, 1);
}

function beamIntensity(
  x: number,
  y: number,
  flower: number,
  width: number,
  height: number,
  t: number,
) {
  if (flower < 0.14) return 0;
  const px = x / Math.max(1, width);
  const py = y / Math.max(1, height);
  const center = (t * 0.22) % 1;
  const line = px * 0.92 + py * 0.08;
  const d = Math.abs(line - center);
  const main = Math.max(0, 1 - d * 14);
  const tail = Math.max(0, 1 - d * 6) * 0.35;
  return clamp((main + tail) * flower, 0, 1);
}

function mixColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

type CompanyBrainFlowerCanvasProps = {
  className?: string;
  progress: number;
  idle?: boolean;
};

export function CompanyBrainFlowerCanvas({
  className,
  progress,
  idle = false,
}: CompanyBrainFlowerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);
  const idleRef = useRef(idle);

  useEffect(() => {
    progressRef.current = progress;
    idleRef.current = idle;
  }, [progress, idle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cell = 7;
    let raf = 0;

    const resize = () => {
      width = Math.max(1, Math.floor(canvas.clientWidth));
      height = Math.max(1, Math.floor(canvas.clientHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = width > 520 ? 8 : 7;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    };

    const drawFrame = (time: number) => {
      const t = time * 0.001;
      const p = progressRef.current;
      const isIdle = idleRef.current && p >= 0.99;
      const shimmer = isIdle ? Math.sin(t * 1.6) * 0.04 : 0;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.54;
      const maxR = Math.min(width, height) * 0.42;

      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          let intensity = flowerIntensity(x + cell * 0.5, y + cell * 0.5, cx, cy, maxR, p, t);
          intensity = clamp(intensity + shimmer, 0, 1);

          const gridX = Math.floor(x / cell);
          const gridY = Math.floor(y / cell);
          const threshold = (BAYER_4X4[((gridY & 3) * 4) + (gridX & 3)] + 0.5) / 16;
          intensity = clamp(intensity + (threshold - 0.5) * 0.22, 0, 1);

          if (intensity < 0.1) continue;

          const charIndex = Math.min(
            ASCII_CHARS.length - 1,
            Math.floor(intensity * (ASCII_CHARS.length - 1)),
          );
          const ch = ASCII_CHARS[charIndex];

          const beam = beamIntensity(x + cell * 0.5, y + cell * 0.5, intensity, width, height, t);
          const blue =
            intensity < 0.44
              ? mixColor(THEME.blueLow, THEME.blueMid, intensity / 0.44)
              : mixColor(THEME.blueMid, THEME.blueHigh, (intensity - 0.44) / 0.56);
          const color = mixColor(blue, THEME.white, beam * 0.88);

          const alpha = clamp(0.34 + intensity * 0.56 + beam * 0.22, 0.24, 0.98);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, x, y);
        }
      }

      raf = window.requestAnimationFrame(drawFrame);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    raf = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "block h-full w-full"}
      aria-hidden="true"
    />
  );
}
