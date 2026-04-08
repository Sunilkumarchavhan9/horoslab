"use client";

import { useEffect, useRef } from "react";

const STAR_POSITIONS = [
  { x: 0.08, y: 0.12, scale: 0.52 },
  { x: 0.46, y: 0.08, scale: 0.28 },
  { x: 0.86, y: 0.11, scale: 0.68 },
  { x: 0.2, y: 0.66, scale: 0.42 },
  { x: 0.6, y: 0.75, scale: 0.36 },
  { x: 0.86, y: 0.57, scale: 0.56 },
] as const;

const STAR_PATH_A =
  "M161.683 171.739L143.718 287L120.264 171.739L0 71L120.264 123.185H158.19L255 71L161.683 171.739Z";
const STAR_PATH_B =
  "M120.5 127L138.5 0L162 127L282.5 238L162 180.5H124L27 238L120.5 127Z";

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  glitch: number,
) {
  const scale = size / 287;
  const starA = new Path2D(STAR_PATH_A);
  const starB = new Path2D(STAR_PATH_B);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-141.5, -143.5);

  const glow = ctx.createRadialGradient(141.5, 143.5, 10, 141.5, 143.5, 150);
  glow.addColorStop(0, "rgba(53,236,250,0.32)");
  glow.addColorStop(0.45, "rgba(53,185,249,0.16)");
  glow.addColorStop(1, "rgba(53,185,249,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(-40, -40, 360, 360);

  const gradA = ctx.createLinearGradient(127.5, 71, 127.5, 287);
  gradA.addColorStop(0, "#35B9F9");
  gradA.addColorStop(1, "#35ECFA");
  const gradB = ctx.createLinearGradient(154.75, 0, 154.75, 238);
  gradB.addColorStop(0, "#35ECFA");
  gradB.addColorStop(1, "#35B9F9");

  ctx.shadowBlur = 20 + glitch * 22;
  ctx.shadowColor = "rgba(53, 236, 250, 0.55)";
  ctx.fillStyle = gradA;
  ctx.fill(starA);
  ctx.fillStyle = gradB;
  ctx.fill(starB);

  if (glitch > 0.08) {
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.18 + glitch * 0.12;
    ctx.translate((Math.random() - 0.5) * 8, 0);
    ctx.fillStyle = "#35ECFA";
    ctx.fill(starA);
    ctx.translate((Math.random() - 0.5) * -12, (Math.random() - 0.5) * 6);
    ctx.fillStyle = "#35B9F9";
    ctx.fill(starB);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.restore();
}

export function FooterStarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      frame += 1;

      STAR_POSITIONS.forEach((star, index) => {
        const pulse = (Math.sin(frame * 0.025 + index * 1.4) + 1) / 2;
        const glitch = Math.max(0, Math.sin(frame * 0.04 + index * 2.1)) * 0.22;
        const size = 34 + star.scale * 70 + pulse * 3;
        drawStar(ctx, width * star.x, height * star.y, size, glitch);
      });

      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#35B9F9";
      for (let i = 0; i < 4; i += 1) {
        const y = ((frame * 1.35 + i * 80) % (height + 80)) - 40;
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();

      raf = window.requestAnimationFrame(render);
    };

    resize();
    render();

    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
