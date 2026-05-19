"use client";

import type { NavAsciiVariant } from "@/lib/nav-ascii-variants";
import { useEffect, useRef } from "react";

const ASCII_CHARS = " .,:;+*x234589";
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const THEME = {
  blueLow: { r: 142, g: 179, b: 246 },
  blueMid: { r: 86, g: 141, b: 238 },
  blueHigh: { r: 41, g: 100, b: 206 },
  white: { r: 255, g: 255, b: 255 },
} as const;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function fract(v: number) {
  return v - Math.floor(v);
}

function hashNoise(x: number, y: number, t: number) {
  return fract(Math.sin(x * 12.9898 + y * 78.233 + t * 0.41) * 43758.5453);
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

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function bloomIntensity(
  x: number,
  y: number,
  w: number,
  h: number,
  phase: number,
  t: number,
): number {
  const cx = w * 0.5;
  const cy = h * 0.52;
  const maxR = Math.min(w, h) * 0.4;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const petalWave = 0.52 + 0.48 * Math.cos(angle * 8);
  const bloom = easeOutCubic(phase);
  const budR = maxR * 0.16 * Math.min(1, bloom * 2.5);
  if (dist <= budR) return clamp(0.85 + hashNoise(x, y, t) * 0.1, 0, 1);
  const reach = maxR * (0.2 + bloom * 0.78) * petalWave;
  if (dist > reach) return 0;
  return clamp((1 - dist / reach) * 0.92 + hashNoise(x, y, t) * 0.06, 0, 1);
}

function sampleVariant(
  variant: NavAsciiVariant,
  x: number,
  y: number,
  w: number,
  h: number,
  phase: number,
  t: number,
): number {
  const nx = x / w;
  const ny = y / h;
  const cx = w * 0.5;
  const cy = h * 0.5;

  switch (variant) {
    case "pulse": {
      const waveY = cy + Math.sin(nx * 10 + phase * Math.PI * 2) * (h * 0.14);
      const d = Math.abs(y - waveY);
      const line = Math.max(0, 1 - d / (h * 0.09));
      const sweep = Math.max(0, 1 - Math.abs(nx - fract(phase)) * 5) * 0.35;
      return clamp(line + sweep, 0, 1);
    }
    case "bloom":
      return bloomIntensity(x, y, w, h, phase, t);
    case "grid": {
      const cell = 9;
      const gx = Math.floor(x / cell);
      const gy = Math.floor(y / cell);
      const flicker = hashNoise(gx, gy, t * 2.2 + phase * 4);
      const checker = (gx + gy) % 2 === 0 ? 0.55 : 0.25;
      return flicker > 0.62 - phase * 0.2 ? checker + 0.35 : checker * 0.4;
    }
    case "stack": {
      const layers = 5;
      const idx = Math.floor(ny * layers);
      const fill = clamp((phase * (layers + 1)) - idx, 0, 1);
      const edge = Math.abs((ny * layers) % 1 - 0.5) < 0.12 ? 0.25 : 0;
      return clamp(fill * 0.85 + edge, 0, 1);
    }
    case "orbit": {
      const ring = Math.abs(Math.hypot(x - cx, y - cy) - Math.min(w, h) * 0.28);
      const ringVal = Math.max(0, 1 - ring / 5);
      const angle = Math.atan2(y - cy, x - cx);
      const dotAngle = phase * Math.PI * 2;
      const dot = Math.max(0, 1 - Math.abs(angle - dotAngle) * 2.2) * 0.9;
      const dist = Math.hypot(x - cx - Math.cos(dotAngle) * 28, y - cy - Math.sin(dotAngle) * 28);
      return clamp(ringVal * 0.5 + Math.max(0, 1 - dist / 8) * dot, 0, 1);
    }
    case "fork": {
      const stem = Math.max(0, 1 - Math.abs(x - cx) / 4) * (ny > 0.45 ? 1 : ny / 0.45);
      const left = Math.max(0, 1 - Math.abs(y - (h * 0.25 - (cx - x) * 0.35)) / 5);
      const right = Math.max(0, 1 - Math.abs(y - (h * 0.25 - (x - cx) * 0.35)) / 5);
      return clamp(Math.max(stem * 0.7, left * 0.85, right * 0.85), 0, 1);
    }
    case "gauge": {
      const angle = Math.atan2(y - cy * 1.05, x - cx);
      const arc = angle > -Math.PI && angle < 0;
      const fillAngle = -Math.PI + phase * Math.PI;
      const filled = arc && angle < fillAngle;
      const rim = Math.abs(Math.hypot(x - cx, y - cy * 1.05) - Math.min(w, h) * 0.32) < 5;
      return clamp((filled ? 0.75 : 0) + (rim ? 0.35 : 0), 0, 1);
    }
    case "brief": {
      const padX = w * 0.18;
      const padY = h * 0.2;
      const inside =
        x > padX && x < w - padX && y > padY && y < h - padY;
      const border =
        x > padX - 4 &&
        x < w - padX + 4 &&
        y > padY - 4 &&
        y < h - padY + 4 &&
        !inside;
      const grow = phase;
      return clamp((inside ? 0.35 : 0) + (border ? 0.55 + grow * 0.35 : 0), 0, 1);
    }
    case "rocket": {
      const tipY = h * (0.22 - phase * 0.08);
      const tri = ny < 0.55 && Math.abs(x - cx) < (h - y) * 0.22;
      const trail = ny > 0.5 && Math.abs(x - cx) < 6 && fract(ny * 3 - t * 3) > 0.4;
      const flame = Math.hypot(x - cx, y - tipY) < 10 ? 0.9 : 0;
      return clamp((tri ? 0.7 : 0) + (trail ? 0.45 : 0) + flame, 0, 1);
    }
    case "wallet": {
      const card =
        x > w * 0.14 &&
        x < w * 0.86 &&
        y > h * 0.28 &&
        y < h * 0.72;
      const stripeY = h * (0.42 + fract(phase - t * 0.15) * 0.12);
      const stripe = card && Math.abs(y - stripeY) < 4;
      return clamp((card ? 0.4 : 0) + (stripe ? 0.55 : 0), 0, 1);
    }
    case "mesh": {
      const nodes = [
        { x: cx, y: h * 0.3 },
        { x: w * 0.22, y: h * 0.7 },
        { x: w * 0.78, y: h * 0.7 },
        { x: w * 0.35, y: h * 0.45 },
        { x: w * 0.65, y: h * 0.5 },
      ];
      let v = 0;
      for (const node of nodes) {
        const d = Math.hypot(x - node.x, y - node.y);
        v = Math.max(v, Math.max(0, 1 - d / 9) * (0.7 + 0.3 * Math.sin(t * 2 + node.x)));
      }
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const d = distToSegment(x, y, nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          v = Math.max(v, Math.max(0, 1 - d / 3) * 0.35);
        }
      }
      return clamp(v * (0.55 + phase * 0.45), 0, 1);
    }
    case "blocks": {
      const cols = 2;
      const rows = 2;
      const cw = w / cols;
      const ch = h / rows;
      const gx = Math.floor(x / cw);
      const gy = Math.floor(y / ch);
      const idx = gx + gy * cols;
      const lit = fract(phase * 1.2 - idx * 0.22 + t * 0.1) > 0.35;
      const inCell =
        x > gx * cw + 6 &&
        x < (gx + 1) * cw - 6 &&
        y > gy * ch + 6 &&
        y < (gy + 1) * ch - 6;
      return inCell && lit ? 0.82 : inCell ? 0.2 : 0;
    }
    case "plug": {
      const zig =
        cx +
        Math.sin(ny * 8 + phase * 4) * (w * 0.18);
      const d = Math.abs(x - zig);
      return Math.max(0, 1 - d / 5);
    }
    case "console": {
      const promptY = h * 0.62;
      const line = y > promptY - 4 && y < promptY + 10 && x > w * 0.12 && x < w * 0.88;
      const cursorX = w * 0.22 + (Math.sin(t * 4) > 0 ? 0 : 8);
      const cursor =
        Math.abs(x - cursorX) < 5 && Math.abs(y - promptY) < 8 && fract(t * 1.8) > 0.45;
      const header = y < h * 0.35 && x > w * 0.12 && x < w * 0.88;
      return clamp((line ? 0.35 : 0) + (cursor ? 0.95 : 0) + (header ? 0.25 : 0), 0, 1);
    }
    default:
      return 0;
  }
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return Math.hypot(px - ax, py - ay);
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function beamForTile(
  x: number,
  y: number,
  intensity: number,
  w: number,
  h: number,
  t: number,
  active: boolean,
) {
  if (!active || intensity < 0.12) return 0;
  const line = x / w + y / h * 0.15;
  const center = fract(t * 0.35);
  const d = Math.abs(line - center);
  return clamp(Math.max(0, 1 - d * 12) * intensity, 0, 1);
}

type NavAsciiTileProps = {
  variant: NavAsciiVariant;
  active?: boolean;
  className?: string;
  speed?: number;
  /** Floating search / API terms drawn over the ASCII field */
  searchTerms?: string[];
  /** 60fps paint loop with gentler phase stepping */
  smoothMotion?: boolean;
};

export function NavAsciiTile({
  variant,
  active = false,
  className,
  speed = 1,
  searchTerms,
  smoothMotion = false,
}: NavAsciiTileProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  const variantRef = useRef(variant);
  const visibleRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const searchTermsRef = useRef(searchTerms);
  const smoothMotionRef = useRef(smoothMotion);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    searchTermsRef.current = searchTerms;
  }, [searchTerms]);

  useEffect(() => {
    smoothMotionRef.current = smoothMotion;
  }, [smoothMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cell = 5;
    let raf = 0;
    let phase = 0.32;
    let lastTime = 0;
    let lastPaintTime = 0;
    let frameIntervalMs = smoothMotionRef.current ? 1000 / 60 : 1000 / 30;

    const scheduleLoop = () => {
      if (!raf && !reducedMotionRef.current && visibleRef.current && activeRef.current) {
        raf = window.requestAnimationFrame(loop);
      }
    };

    const resize = () => {
      width = Math.max(1, Math.floor(canvas.clientWidth));
      height = Math.max(1, Math.floor(canvas.clientHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = width > 120 ? 6 : width > 64 ? 5 : 4;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    };

    const paint = (time: number) => {
      const dt = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;
      const t = time * 0.001;
      const isActive = activeRef.current;
      const currentVariant = variantRef.current;

      if (isActive) {
        const phaseRate = smoothMotionRef.current ? 0.32 : 0.45;
        phase = (phase + dt * phaseRate * speed) % 1;
      } else {
        phase = 0.34;
        lastTime = 0;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const px = x + cell * 0.5;
          const py = y + cell * 0.5;
          let intensity = sampleVariant(currentVariant, px, py, width, height, phase, t);

          const gridX = Math.floor(x / cell);
          const gridY = Math.floor(y / cell);
          const threshold = (BAYER_4X4[((gridY & 3) * 4) + (gridX & 3)] + 0.5) / 16;
          intensity = clamp(intensity + (threshold - 0.5) * 0.2, 0, 1);

          if (intensity < 0.08) continue;

          const beam = beamForTile(px, py, intensity, width, height, t, isActive);
          const charIndex = Math.min(
            ASCII_CHARS.length - 1,
            Math.floor(intensity * (ASCII_CHARS.length - 1)),
          );
          const ch = beam > 0.5 ? "#" : ASCII_CHARS[charIndex];

          const blue =
            intensity < 0.44
              ? mixColor(THEME.blueLow, THEME.blueMid, intensity / 0.44)
              : mixColor(THEME.blueMid, THEME.blueHigh, (intensity - 0.44) / 0.56);
          const color = mixColor(blue, THEME.white, beam * 0.9);
          const alpha = clamp(0.46 + intensity * 0.5 + beam * 0.22, 0.34, 1);

          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, x, y);
        }
      }

      const terms = searchTermsRef.current;
      if (terms && terms.length > 0) {
        const termFont = Math.max(cell + 1, 9);
        ctx.font = `${termFont}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
        for (let i = 0; i < terms.length; i += 1) {
          const term = terms[i];
          const driftX = hashNoise(i * 3.1, 0.5, t * 0.55) * width * 0.72 + width * 0.1;
          const driftY = hashNoise(0.5, i * 2.7, t * 0.48) * height * 0.62 + height * 0.14;
          const pulse = 0.42 + 0.28 * Math.sin(t * 1.35 + i * 1.1);
          ctx.fillStyle = `rgba(41, 100, 206, ${pulse.toFixed(3)})`;
          ctx.fillText(term, driftX, driftY);
        }
      }
    };

    const loop = (time: number) => {
      frameIntervalMs = smoothMotionRef.current ? 1000 / 60 : 1000 / 30;
      if (
        !reducedMotionRef.current &&
        visibleRef.current &&
        activeRef.current &&
        time - lastPaintTime >= frameIntervalMs
      ) {
        lastPaintTime = time;
        paint(time);
      }
      if (!reducedMotionRef.current && visibleRef.current && activeRef.current) {
        raf = window.requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = reduced.matches;
    const onReducedChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      if (!event.matches) scheduleLoop();
    };
    reduced.addEventListener("change", onReducedChange);

    const observer = new ResizeObserver(() => {
      resize();
      paint(performance.now());
    });
    observer.observe(canvas);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = !!entry?.isIntersecting;
        if (visibleRef.current) scheduleLoop();
      },
      { threshold: 0.05 },
    );
    visibilityObserver.observe(canvas);

    resize();
    paint(performance.now());

    scheduleLoop();

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      visibilityObserver.disconnect();
      reduced.removeEventListener("change", onReducedChange);
    };
  }, [active, speed, smoothMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "block h-[76px] w-[76px] shrink-0 rounded-lg"}
      aria-hidden="true"
    />
  );
}
