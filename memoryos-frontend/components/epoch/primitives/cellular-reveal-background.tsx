"use client";

import React, { useEffect, useRef } from "react";

export interface CellularRevealBackgroundProps {
  className?: string;
  revealRadius?: number; // Radius of reveal circle in px (desktop ~190)
  revealFeather?: number; // Feathering softness width in px (~100)
  cellSize?: number; // Size of discrete cellular grid units (~12)
  cellLineWidth?: number; // Width of contour outline (1px)
  cellOpacity?: number; // Opacity multiplier for cells (~0.75)
  backgroundOpacity?: number; // Overall reveal opacity (~0.85)
  mouseSmoothing?: number; // Interpolation factor for smooth cursor tracking (~0.12)
  seed?: number; // Deterministic integer seed (default 47291)
  topologyWhite?: string;
  topologySilver?: string;
  topologySteel?: string;
  topologyBlack?: string;
}

export function CellularRevealBackground({
  className = "",
  revealRadius = 190,
  revealFeather = 100,
  cellSize = 12,
  cellLineWidth = 1,
  cellOpacity = 0.75,
  backgroundOpacity = 0.85,
  mouseSmoothing = 0.12,
  seed = 47291,
  topologyWhite = "#F2F2F2",
  topologySilver = "#A6AAAE",
  topologySteel = "#55595D",
  topologyBlack = "#0A0A0A",
}: CellularRevealBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  const mouseState = useRef({
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    opacity: 0,
    targetOpacity: 0,
    isHovering: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    heroRef.current = canvas.closest("section") || canvas.parentElement;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;

    // Offscreen canvas for 100% STATIC geometry & mathematical typography caching
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    let isGeometryCached = false;

    // Deterministic Seeded Pseudo-Random Number Generator (Mulberry32)
    const createPrng = (s: number) => {
      let state = s | 0;
      return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const prng = createPrng(seed);
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
      perm[i] = Math.floor(prng() * 256);
      perm[256 + i] = perm[i];
    }

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t: number, a: number, b: number) => a + t * (b - a);
    const grad = (hash: number, x: number, y: number) => {
      const h = hash & 7;
      const u = h < 4 ? x : y;
      const v = h < 4 ? y : x;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    };

    const noise2D = (x: number, y: number) => {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const u = fade(xf);
      const v = fade(yf);

      const A = perm[X] + Y;
      const B = perm[X + 1] + Y;

      return lerp(
        v,
        lerp(u, grad(perm[A], xf, yf), grad(perm[B], xf - 1, yf)),
        lerp(u, grad(perm[A + 1], xf, yf - 1), grad(perm[B + 1], xf - 1, yf - 1))
      );
    };

    const fbm = (x: number, y: number) => {
      const qx = noise2D(x + 1.7, y + 3.2);
      const qy = noise2D(x + 5.1, y + 2.4);

      const wx = noise2D(x + 3.8 * qx + 1.2, y + 3.8 * qy + 7.8);
      const wy = noise2D(x + 3.8 * qx + 8.1, y + 3.8 * qy + 2.3);

      return (
        noise2D(x + 2.2 * wx, y + 2.2 * wy) * 0.62 +
        noise2D(x * 2.2, y * 2.2) * 0.26 +
        noise2D(x * 4.4, y * 4.4) * 0.12
      );
    };

    // Render & cache the entire static computational topology onto the offscreen canvas ONCE
    const buildStaticTopology = () => {
      if (!offCtx || width <= 0 || height <= 0 || cols <= 0 || rows <= 0) return;

      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.scale(dpr, dpr);
      offCtx.clearRect(0, 0, width, height);

      // Grid for cellular regions
      const grid = new Uint8Array(cols * rows);
      const scale = 0.036;

      const cx = width * 0.5;
      const cy = height * 0.46;
      const clearRadiusX = width * 0.28;
      const clearRadiusY = height * 0.24;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = c * cellSize;
          const py = r * cellSize;

          let val = fbm(c * scale, r * scale);

          // Center clearance falloff (keeps area behind composer clean so visible discoveries are in open space)
          const dx = (px - cx) / clearRadiusX;
          const dy = (py - cy) / clearRadiusY;
          const distSq = dx * dx + dy * dy;
          if (distSq < 1.0) {
            val -= (1.0 - Math.pow(distSq, 1.4)) * 0.45;
          }

          const idx = r * cols + c;

          if (val > 0.44) {
            grid[idx] = 3; // White highlight
          } else if (val > 0.26) {
            grid[idx] = 2; // Silver region
          } else if (val > 0.12) {
            grid[idx] = 1; // Steel gray region
          } else {
            const micro = noise2D(c * 0.48 + 14.2, r * 0.48 + 14.2);
            if (micro > 0.69 && val > -0.04) {
              grid[idx] = 2; // Isolated micro cell
            } else {
              grid[idx] = 0; // Negative space
            }
          }
        }
      }

      // 1. Draw flat monochrome cell fills
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellType = grid[r * cols + c];
          if (cellType === 0) continue;

          if (cellType === 3) {
            offCtx.fillStyle = hexToRgba(topologyWhite, 0.42 * cellOpacity);
          } else if (cellType === 2) {
            offCtx.fillStyle = hexToRgba(topologySilver, 0.24 * cellOpacity);
          } else {
            offCtx.fillStyle = hexToRgba(topologySteel, 0.14 * cellOpacity);
          }

          offCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }

      // 2. Draw 1px crisp orthogonal perimeter outlines
      offCtx.lineWidth = cellLineWidth;

      // Steel Outlines
      offCtx.strokeStyle = hexToRgba(topologySteel, 0.55);
      offCtx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r * cols + c] === 1) {
            drawCellPerimeter(offCtx, grid, c, r, cols, rows, cellSize, 1);
          }
        }
      }
      offCtx.stroke();

      // Silver Outlines
      offCtx.strokeStyle = hexToRgba(topologySilver, 0.72);
      offCtx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r * cols + c] === 2) {
            drawCellPerimeter(offCtx, grid, c, r, cols, rows, cellSize, 2);
          }
        }
      }
      offCtx.stroke();

      // White Outlines
      offCtx.strokeStyle = hexToRgba(topologyWhite, 0.9);
      offCtx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r * cols + c] === 3) {
            drawCellPerimeter(offCtx, grid, c, r, cols, rows, cellSize, 3);
          }
        }
      }
      offCtx.stroke();

      // 3. Render Distributed Mathematical Notation, GPU Specs, & 6 Epoch Capabilities
      renderMathematicalAnnotations(offCtx, width, height, topologyWhite, topologySilver, topologySteel);

      isGeometryCached = true;
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width <= 0 || height <= 0) return;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      cols = Math.ceil(width / cellSize);
      rows = Math.ceil(height / cellSize);

      buildStaticTopology();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Track Cursor on window to ensure smooth tracking across all hero elements
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= -20 && x <= rect.width + 20 && y >= -20 && y <= rect.height + 20) {
        mouseState.current.targetX = Math.max(0, Math.min(rect.width, x));
        mouseState.current.targetY = Math.max(0, Math.min(rect.height, y));
        mouseState.current.targetOpacity = 1;
        mouseState.current.isHovering = true;
      } else {
        mouseState.current.targetOpacity = 0;
        mouseState.current.isHovering = false;
      }
    };

    const handleWindowPointerLeave = () => {
      mouseState.current.targetOpacity = 0;
      mouseState.current.isHovering = false;
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    document.addEventListener("mouseleave", handleWindowPointerLeave);

    // Frame render loop: ONLY animates cursor reveal mask position and opacity fade
    const render = () => {
      const mouse = mouseState.current;

      // Smooth cursor position interpolation
      mouse.x += (mouse.targetX - mouse.x) * mouseSmoothing;
      mouse.y += (mouse.targetY - mouse.y) * mouseSmoothing;
      mouse.opacity += (mouse.targetOpacity - mouse.opacity) * 0.08;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mouse.opacity > 0.005 && isGeometryCached) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const actualRadius = window.innerWidth < 1024 ? revealRadius * 0.75 : revealRadius;
        const actualFeather = window.innerWidth < 1024 ? revealFeather * 0.75 : revealFeather;

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.drawImage(offscreen, 0, 0);

        // Apply feathered radial reveal mask centered at mouse position
        ctx.globalCompositeOperation = "destination-in";
        const maskGrad = ctx.createRadialGradient(
          mouse.x * dpr,
          mouse.y * dpr,
          0,
          mouse.x * dpr,
          mouse.y * dpr,
          actualRadius * dpr
        );

        const innerRadiusStop = Math.max(0, (actualRadius - actualFeather) / actualRadius);
        const peakAlpha = mouse.opacity * backgroundOpacity;

        maskGrad.addColorStop(0, `rgba(0, 0, 0, ${peakAlpha})`);
        maskGrad.addColorStop(innerRadiusStop, `rgba(0, 0, 0, ${peakAlpha * 0.85})`);
        maskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = maskGrad;
        ctx.beginPath();
        ctx.arc(mouse.x * dpr, mouse.y * dpr, actualRadius * dpr, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handleWindowPointerMove);
      document.removeEventListener("mouseleave", handleWindowPointerLeave);
    };
  }, [
    revealRadius,
    revealFeather,
    cellSize,
    cellLineWidth,
    cellOpacity,
    backgroundOpacity,
    mouseSmoothing,
    seed,
    topologyWhite,
    topologySilver,
    topologySteel,
    topologyBlack,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full select-none z-0 ${className}`}
    />
  );
}

// Draw 1px perimeter contour lines for cells of matching type
function drawCellPerimeter(
  ctx: CanvasRenderingContext2D,
  grid: Uint8Array,
  c: number,
  r: number,
  cols: number,
  rows: number,
  cellSize: number,
  targetType: number
) {
  const x = c * cellSize;
  const y = r * cellSize;

  if (r === 0 || grid[(r - 1) * cols + c] !== targetType) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + cellSize, y);
  }
  if (r === rows - 1 || grid[(r + 1) * cols + c] !== targetType) {
    ctx.moveTo(x, y + cellSize);
    ctx.lineTo(x + cellSize, y + cellSize);
  }
  if (c === 0 || grid[r * cols + (c - 1)] !== targetType) {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + cellSize);
  }
  if (c === cols - 1 || grid[r * cols + (c + 1)] !== targetType) {
    ctx.moveTo(x + cellSize, y);
    ctx.lineTo(x + cellSize, y + cellSize);
  }
}

// Render the mathematical notation, infrastructure metadata, and 6 Epoch capabilities across the open negative space
function renderMathematicalAnnotations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  white: string,
  silver: string,
  steel: string
) {
  const fontMono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Coordinate Grid Tick marks (Corners & perimeter)
  ctx.fillStyle = hexToRgba(steel, 0.45);
  ctx.font = `9px ${fontMono}`;
  ctx.fillText("+ 0x7F4B.TOPOLOGY[0,0]", 18, 14);
  ctx.fillText("+ LATENCY_PLANE.US_EAST", w - 190, 14);
  ctx.fillText("+ CLUSTER_TOPOLOGY.SXM5", 18, h - 24);
  ctx.fillText("+ LOSS_SURFACE.FP8_QUANT", w - 210, h - 24);

  // Position columns into the open left/right flanks outside the center 860px content block
  const centerContentWidth = 860;
  const leftFlankAvailable = Math.max(0, (w - centerContentWidth) / 2);
  const leftCol = leftFlankAvailable > 180 ? Math.max(20, leftFlankAvailable - 220) : Math.max(16, w * 0.04);
  const rightCol = leftFlankAvailable > 180 ? Math.min(w - 240, (w + centerContentWidth) / 2 + 16) : Math.max(w - 260, w * 0.72);

  // -------------------------------------------------------------
  // 1. TOP-LEFT FLANK: OPTIMIZE MODELS
  // -------------------------------------------------------------
  const optX = leftCol;
  const optY = Math.max(24, h * 0.08);

  ctx.fillStyle = hexToRgba(white, 0.95);
  ctx.font = `bold 11px ${fontMono}`;
  ctx.fillText("01 // OPTIMIZE MODELS", optX, optY);

  ctx.fillStyle = hexToRgba(silver, 0.85);
  ctx.font = `10px ${fontMono}`;
  ctx.fillText("min_m  α L(m) + β C(m) + γ V(m)", optX, optY + 16);

  ctx.fillStyle = hexToRgba(steel, 0.8);
  ctx.font = `9px ${fontMono}`;
  ctx.fillText("s.t.  A(m) ≥ A_min,  L(m) ≤ L_max", optX, optY + 31);
  ctx.fillText("Qwen 2.5 72B · H100 × 4 · VRAM 320GB", optX, optY + 45);

  // -------------------------------------------------------------
  // 2. TOP-RIGHT FLANK: COMPARE MODELS
  // -------------------------------------------------------------
  const cmpX = rightCol;
  const cmpY = Math.max(24, h * 0.08);

  ctx.fillStyle = hexToRgba(white, 0.95);
  ctx.font = `bold 11px ${fontMono}`;
  ctx.fillText("02 // COMPARE MODELS", cmpX, cmpY);

  ctx.fillStyle = hexToRgba(silver, 0.85);
  ctx.font = `10px ${fontMono}`;
  ctx.fillText("m* = argmin_m C(m)", cmpX, cmpY + 16);

  ctx.fillStyle = hexToRgba(steel, 0.8);
  ctx.font = `9px ${fontMono}`;
  ctx.fillText("s.t. A(m) ≥ A₀,  L(m) ≤ L₀", cmpX, cmpY + 31);
  ctx.fillText("DeepSeek-R1 vs Llama 3.1 70B · Pareto", cmpX, cmpY + 45);

  // Tiny Pareto curve schema
  ctx.strokeStyle = hexToRgba(steel, 0.65);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cmpX, cmpY + 62);
  ctx.lineTo(cmpX, cmpY + 96);
  ctx.lineTo(cmpX + 110, cmpY + 96);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(silver, 0.85);
  ctx.beginPath();
  ctx.moveTo(cmpX + 6, cmpY + 68);
  ctx.bezierCurveTo(cmpX + 16, cmpY + 88, cmpX + 46, cmpY + 93, cmpX + 98, cmpY + 94);
  ctx.stroke();

  ctx.fillText("accuracy ↑ vs cost →", cmpX + 8, cmpY + 102);

  // -------------------------------------------------------------
  // 3. MID-LEFT FLANK: TEACH MODELS (Flanking composer)
  // -------------------------------------------------------------
  const tchX = leftCol;
  const tchY = h * 0.44;

  ctx.fillStyle = hexToRgba(white, 0.95);
  ctx.font = `bold 11px ${fontMono}`;
  ctx.fillText("03 // TEACH MODELS", tchX, tchY);

  ctx.fillStyle = hexToRgba(silver, 0.85);
  ctx.font = `10px ${fontMono}`;
  ctx.fillText("θₜ₊₁ = θₜ − η ∇_θ L(θₜ)", tchX, tchY + 16);

  ctx.fillStyle = hexToRgba(steel, 0.8);
  ctx.font = `9px ${fontMono}`;
  ctx.fillText("L(θ) → min  // GRPO Policy Gradient", tchX, tchY + 31);
  ctx.fillText("InternScience/Agents-A1 · Loss 0.024", tchX, tchY + 45);

  // -------------------------------------------------------------
  // 4. MID-RIGHT FLANK: EVALUATE MODELS (Flanking composer)
  // -------------------------------------------------------------
  const evalX = rightCol;
  const evalY = h * 0.44;

  ctx.fillStyle = hexToRgba(white, 0.95);
  ctx.font = `bold 11px ${fontMono}`;
  ctx.fillText("04 // EVALUATE MODELS", evalX, evalY);

  ctx.fillStyle = hexToRgba(silver, 0.85);
  ctx.font = `10px ${fontMono}`;
  ctx.fillText("S(m) = Σᵢ wᵢ sᵢ(m)", evalX, evalY + 16);

  ctx.fillStyle = hexToRgba(steel, 0.8);
  ctx.font = `9px ${fontMono}`;
  ctx.fillText("weights: accuracy · latency · reasoning", evalX, evalY + 31);
  ctx.fillText("Benchmark Suite v4.2 · Pass@1: 89.4%", evalX, evalY + 45);

  // -------------------------------------------------------------
  // 5. LOWER-LEFT FLANK: ADAPT MODELS (Flanking workload cards)
  // -------------------------------------------------------------
  const adpX = leftCol;
  const adpY = Math.min(h * 0.80, h - 85);

  ctx.fillStyle = hexToRgba(white, 0.95);
  ctx.font = `bold 11px ${fontMono}`;
  ctx.fillText("06 // ADAPT MODELS", adpX, adpY);

  ctx.fillStyle = hexToRgba(silver, 0.85);
  ctx.font = `10px ${fontMono}`;
  ctx.fillText("W' = W + ΔW,  ΔW = AB", adpX, adpY + 16);

  ctx.fillStyle = hexToRgba(steel, 0.8);
  ctx.font = `9px ${fontMono}`;
  ctx.fillText("rank(ΔW) = r ≪ d  (LoRA r=16 · α=32 · q,v)", adpX, adpY + 31);

  // -------------------------------------------------------------
  // 6. LOWER-RIGHT FLANK: DEPLOY MODELS (Flanking workload cards)
  // -------------------------------------------------------------
  const dplX = rightCol;
  const dplY = Math.min(h * 0.80, h - 85);

  ctx.fillStyle = hexToRgba(white, 0.95);
  ctx.font = `bold 11px ${fontMono}`;
  ctx.fillText("05 // DEPLOY MODELS", dplX, dplY);

  ctx.fillStyle = hexToRgba(silver, 0.85);
  ctx.font = `10px ${fontMono}`;
  ctx.fillText("T = B / L  (H100 SXM5 · B=32 · L=84ms)", dplX, dplY + 16);

  ctx.fillStyle = hexToRgba(steel, 0.8);
  ctx.font = `9px ${fontMono}`;
  ctx.fillText("vLLM-Omni · FlashInfer · P99 92ms", dplX, dplY + 31);
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
