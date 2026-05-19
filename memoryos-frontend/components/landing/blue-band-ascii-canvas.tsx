"use client";

import { useEffect, useRef } from "react";

const ASCII_CHARS = " .,:;+*x234589";
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fract(value: number) {
  return value - Math.floor(value);
}

function hashNoise(x: number, y: number, t: number) {
  return fract(Math.sin((x * 12.9898) + (y * 78.233) + (t * 0.35)) * 43758.5453);
}

type BlueBandAsciiCanvasProps = {
  className?: string;
};

export function BlueBandAsciiCanvas({ className }: BlueBandAsciiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let cell = 8;

    const resize = () => {
      width = Math.max(1, Math.floor(canvas.clientWidth));
      height = Math.max(1, Math.floor(canvas.clientHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = width > 1100 ? 8 : 7;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    };

    const drawFrame = (time: number) => {
      const t = time * 0.001;

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#1f72f3");
      gradient.addColorStop(1, "#0d5bd8");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const ringLeft = Math.cos((Math.hypot(x - (width * 0.18), y - (height * 0.62)) * 0.093) - (t * 2.4));
          const ringRight = Math.cos((Math.hypot(x - (width * 0.82), y - (height * 0.62)) * 0.093) - (t * 2.4));
          const ringField = Math.max(ringLeft, ringRight) * 0.5 + 0.5;

          const scan = 0.5 + 0.5 * Math.sin((y * 0.24) + (t * 8.0) + (x * 0.014));
          const noise = hashNoise(x + 17, y + 31, t);

          let intensity = (0.08 + (ringField * 0.43) + (scan * 0.2) + (noise * 0.09));
          intensity = clamp(intensity, 0, 1);

          const gridX = Math.floor(x / cell);
          const gridY = Math.floor(y / cell);
          const threshold = (BAYER_4X4[((gridY & 3) * 4) + (gridX & 3)] + 0.5) / 16;
          intensity = clamp(intensity + ((threshold - 0.5) * 0.28), 0, 1);

          if (intensity < 0.1) {
            continue;
          }

          const charIndex = Math.min(
            ASCII_CHARS.length - 1,
            Math.floor(intensity * (ASCII_CHARS.length - 1)),
          );
          const ch = ASCII_CHARS[charIndex];
          const alpha = clamp(0.34 + (intensity * 0.6), 0.3, 1);
          const lift = Math.floor(220 + (intensity * 30));
          ctx.fillStyle = `rgba(${lift}, ${lift + 6}, 255, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, x, y);
        }
      }

      ctx.fillStyle = "rgba(210, 228, 255, 0.1)";
      for (let i = 0; i < 3; i += 1) {
        const lineY = Math.floor(((Math.sin((t * 1.2) + (i * 2.1)) * 0.5) + 0.5) * height);
        ctx.fillRect(0, lineY, width, 1);
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

  return <canvas ref={canvasRef} className={className ?? "block h-full w-full"} />;
}
