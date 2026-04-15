"use client";

import { useEffect, useRef } from "react";

const CHARS = "@#$%&!?*+-=~.,:;|/\\^<>[]{}ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789░▒▓█";
const FONT = "bold 11px monospace";
const CELL_W = 7;
const CELL_H = 12;
const TARGET_RADIUS = 210;

export function GlitchBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    mouseX: -9999,
    mouseY: -9999,
    hovering: false,
    radius: 0,
    t: 0,
    grid: [] as string[][],
    cols: 0,
    rows: 0,
    tears: [] as { y: number; h: number; dx: number; life: number }[],
  });
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true })!;
    const offA = document.createElement("canvas");
    let offACtx = offA.getContext("2d")!;
    let W = 0;
    let H = 0;
    const s = stateRef.current;

    const initGrid = () => {
      s.cols = Math.ceil(W / CELL_W) + 2;
      s.rows = Math.ceil(H / CELL_H) + 2;
      s.grid = Array.from({ length: s.rows }, () =>
        Array.from(
          { length: s.cols },
          () => CHARS[(Math.random() * CHARS.length) | 0]
        )
      );
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = canvas.width = r.width | 0;
      H = canvas.height = r.height | 0;
      offA.width = W;
      offA.height = H;
      offACtx = offA.getContext("2d")!;
      initGrid();
    };

    resize();
    // Retry after paint — canvas may not have layout yet on first run
    const retryTimer = setTimeout(resize, 150);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      if (!W || !H) {
        resize();
        return;
      }

      s.t++;
      const { t, grid, cols, rows } = s;

      // Mouse coords relative to canvas (mouse is tracked globally)
      const rect = canvas.getBoundingClientRect();
      const mx = s.mouseX - rect.left;
      const my = s.mouseY - rect.top;
      const inBounds = mx >= 0 && my >= 0 && mx <= W && my <= H;

      // Smoothly animate the reveal radius in/out
      const targetR = s.hovering && inBounds ? TARGET_RADIUS : 0;
      s.radius += (targetR - s.radius) * 0.1;

      ctx.clearRect(0, 0, W, H);
      if (s.radius < 2) return;

      // Randomly corrupt ~4% of chars per frame → unstable shimmer
      const flipN = (cols * rows * 0.04) | 0;
      for (let i = 0; i < flipN; i++) {
        grid[(Math.random() * rows) | 0][(Math.random() * cols) | 0] =
          CHARS[(Math.random() * CHARS.length) | 0];
      }

      // Manage tear strips every frame
      if (Math.random() < 0.11) {
        s.tears.push({
          y: (Math.random() * H) | 0,
          h: ((Math.random() * 14) | 0) + 2,
          dx: (Math.random() - 0.5) * 65,
          life: ((Math.random() * 5) | 0) + 2,
        });
      }
      s.tears = s.tears.filter((tr) => {
        tr.life--;
        return tr.life > 0;
      });

      // Frame jitter — rare, whole-frame shake
      const jOn = Math.sin(t * 0.47) > 0.92;
      const jx = jOn ? (Math.random() - 0.5) * 9 : 0;
      const jy = jOn ? (Math.random() - 0.5) * 4 : 0;

      const aberr = 3 + Math.sin(t * 0.055) * 2.2;
      const flicker = 0.74 + Math.sin(t * 0.18) * 0.14;

      // ── Render ASCII + glitch to offscreen canvas ─────────────────────
      offACtx.fillStyle = "#000";
      offACtx.fillRect(0, 0, W, H);
      offACtx.font = FONT;

      const drawPass = (color: string, dx: number, alpha: number) => {
        offACtx.save();
        offACtx.globalCompositeOperation = "screen";
        offACtx.globalAlpha = alpha;
        offACtx.fillStyle = color;
        for (let r = 0; r < rows; r++) {
          const cy = r * CELL_H + jy;
          let tdx = 0;
          for (const tr of s.tears) {
            if (cy >= tr.y && cy < tr.y + tr.h) {
              tdx = tr.dx;
              break;
            }
          }
          const baseX = jx + dx + tdx;
          for (let c = 0; c < cols; c++) {
            offACtx.fillText(grid[r][c], c * CELL_W + baseX, cy + CELL_H);
          }
        }
        offACtx.restore();
      };

      // RGB split: red → right, green → center, blue → left
      drawPass("rgb(255,28,52)", aberr, 0.92);
      drawPass("rgb(28,255,88)", 0, 0.80);
      drawPass("rgb(28,95,255)", -aberr, 0.92);

      // Scanlines — every other row dimmed
      offACtx.save();
      offACtx.globalAlpha = 0.18;
      offACtx.fillStyle = "#000";
      for (let y = 0; y < H; y += 2) offACtx.fillRect(0, y, W, 1);
      offACtx.restore();

      // Noise — random bright specks
      offACtx.save();
      offACtx.globalCompositeOperation = "screen";
      const nc = (W * H * 0.0012) | 0;
      for (let i = 0; i < nc; i++) {
        offACtx.globalAlpha = 0.2 + Math.random() * 0.72;
        offACtx.fillStyle = "#fff";
        offACtx.fillRect(
          (Math.random() * W) | 0,
          (Math.random() * H) | 0,
          Math.random() < 0.7 ? 1 : 2,
          1
        );
      }
      offACtx.restore();

      // Horizontal pixel streak (7% chance — cinematic)
      if (Math.random() < 0.07) {
        offACtx.save();
        offACtx.globalAlpha = 0.28 + Math.random() * 0.4;
        offACtx.globalCompositeOperation = "screen";
        offACtx.fillStyle = "#fff";
        offACtx.fillRect(
          (Math.random() * W * 0.2) | 0,
          (Math.random() * H) | 0,
          ((W * 0.3 + Math.random() * W * 0.55) | 0),
          1
        );
        offACtx.restore();
      }

      // ── Composite to main canvas with animated radial mask ────────────
      // Draw the full glitch frame
      ctx.save();
      ctx.globalAlpha = flicker;
      ctx.drawImage(offA, 0, 0);
      ctx.restore();

      // destination-in: keep only pixels inside the radial gradient.
      // Gradient alpha (1→0 from center to edge) decides what survives.
      const rr = s.radius;
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, rr);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.55, "rgba(0,0,0,0.92)");
      grad.addColorStop(0.82, "rgba(0,0,0,0.32)");
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    };

    rafRef.current = requestAnimationFrame(tick);

    // Track mouse globally (absolute coords), compute canvas-relative in tick
    const onMouseMove = (e: MouseEvent) => {
      s.mouseX = e.clientX;
      s.mouseY = e.clientY;
    };

    // Track hover state via parent section enter/leave
    const parent = canvas.parentElement!;
    const onEnter = () => {
      s.hovering = true;
    };
    const onLeave = () => {
      s.hovering = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    parent.addEventListener("mouseenter", onEnter);
    parent.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(retryTimer);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      parent.removeEventListener("mouseenter", onEnter);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 h-full w-full pointer-events-none"
    />
  );
}