"use client";

import { useEffect, useRef } from "react";

const CHARS = "2233444555667788899+*";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fract(value: number) {
  return value - Math.floor(value);
}

function hash(x: number, y: number, t: number) {
  return fract(Math.sin((x * 17.13) + (y * 43.71) + (t * 0.27)) * 43758.5453);
}

type HeroBrainCyberCanvasProps = {
  className?: string;
  src?: string;
};

export function HeroBrainCyberCanvas({
  className,
  src = "/braine.png",
}: HeroBrainCyberCanvasProps) {
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

    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d");
    if (!offCtx) {
      return;
    }

    const img = new Image();
    img.decoding = "async";
    img.src = src;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let loaded = false;
    let cell = 7;

    const resize = () => {
      width = Math.max(1, Math.floor(canvas.clientWidth));
      height = Math.max(1, Math.floor(canvas.clientHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = width > 360 ? 8 : 7;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      off.width = width;
      off.height = height;
      ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx.textBaseline = "top";
    };

    const drawImageToOffscreen = (t: number) => {
      offCtx.clearRect(0, 0, width, height);

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) {
        return;
      }

      const ratio = Math.min(width / iw, height / ih);
      const dw = iw * ratio;
      const dh = ih * ratio;
      const dx = (width - dw) * 0.5;
      const dy = (height - dh) * 0.5;

      // Draw in thin horizontal slices with tiny time-varying offsets
      // to create a subtle cyber-scan distortion.
      const slice = 2;
      for (let sy = 0; sy < ih; sy += slice) {
        const sh = Math.min(slice, ih - sy);
        const py = dy + ((sy / ih) * dh);
        const ph = (sh / ih) * dh;
        const offset = Math.sin((sy * 0.08) + (t * 2.8)) * 1.6;
        offCtx.drawImage(img, 0, sy, iw, sh, dx + offset, py, dw, ph);
      }
    };

    const frame = (ms: number) => {
      const t = ms * 0.001;

      ctx.clearRect(0, 0, width, height);

      if (!loaded) {
        raf = window.requestAnimationFrame(frame);
        return;
      }

      drawImageToOffscreen(t);
      const pixels = offCtx.getImageData(0, 0, width, height).data;

      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const sx = clamp(
            Math.floor(x + Math.sin((y * 0.06) + (t * 3.2)) * 1.4),
            0,
            width - 1,
          );
          const sy = clamp(
            Math.floor(y + Math.sin((x * 0.05) - (t * 2.4)) * 1.1),
            0,
            height - 1,
          );

          const i = ((sy * width) + sx) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];

          // Keep only "ink-like" blue zones so the full-grid background does not appear.
          const blueDominance = clamp((b - Math.max(r, g)) / 105, 0, 1);
          const signal = blueDominance;
          if (signal < 0.2) {
            continue;
          }

          const noise = hash(x, y, t);
          const scan = 0.5 + (0.5 * Math.sin((y * 0.23) + (t * 7.2)));
          const intensity = clamp((signal * 0.94) + (scan * 0.08) + (noise * 0.06), 0, 1);

          // Thin out weaker regions for cleaner silhouette.
          const dropout = 0.08 + ((1 - signal) * 0.22);
          if (hash(x * 1.2, y * 0.9, t + 11) < dropout) {
            continue;
          }

          const idx = Math.min(CHARS.length - 1, Math.floor(intensity * (CHARS.length - 1)));
          const ch = CHARS[idx];

          const alpha = clamp(0.44 + (intensity * 0.5), 0.42, 0.96);
          const blueR = 20 + Math.floor(intensity * 28);
          const blueG = 118 + Math.floor(intensity * 54);
          const blueB = 236 + Math.floor(intensity * 16);
          ctx.fillStyle = `rgba(${blueR}, ${blueG}, ${blueB}, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, x, y);
        }
      }

      raf = window.requestAnimationFrame(frame);
    };

    const onLoad = () => {
      loaded = true;
    };
    img.addEventListener("load", onLoad);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      img.removeEventListener("load", onLoad);
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className ?? "block h-full w-full"} />;
}
