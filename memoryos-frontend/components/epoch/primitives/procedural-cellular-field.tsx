"use client";

import React, { useEffect, useRef } from "react";

interface ProceduralCellularFieldProps {
  className?: string;
  cellSize?: number; // Size of each orthogonal grid block in px (e.g. 12-16)
  speed?: number; // Speed of time evolution
  strokeColor?: string; // 1px contour outline color (silver/metallic)
  fillColor?: string; // Cell fill color
  opacity?: number; // Base opacity
  centerClearance?: boolean; // Keep center quiet for headline/composer
}

export function ProceduralCellularField({
  className = "",
  cellSize = 12,
  speed = 0.0006,
  strokeColor = "rgba(185, 195, 205, 0.45)", // Metallic silver outline
  fillColor = "rgba(165, 175, 185, 0.12)", // Subtle metallic fill
  opacity = 0.85,
  centerClearance = true,
}: ProceduralCellularFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let time = 0;

    // Fast 2D Simplex/Perlin Noise approximation with Octaves
    // Permutation table
    const p = new Uint8Array(512);
    const permutation = [
      151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
      8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
      35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
      134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
      55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
      18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
      250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
      189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
      172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
      228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
      107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
      138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
    ];
    for (let i = 0; i < 256; i++) {
      p[i] = permutation[i];
      p[256 + i] = permutation[i];
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

      const A = p[X] + Y;
      const B = p[X + 1] + Y;

      return lerp(
        v,
        lerp(u, grad(p[A], xf, yf), grad(p[B], xf - 1, yf)),
        lerp(u, grad(p[A + 1], xf, yf - 1), grad(p[B + 1], xf - 1, yf - 1))
      );
    };

    const fbm = (x: number, y: number) => {
      // 3 octaves with domain warping for organic, natural geological/computational map contours
      const qx = noise2D(x + 1.2, y + 3.4);
      const qy = noise2D(x + 5.6, y + 2.8);

      const wx = noise2D(x + 4.0 * qx + 1.7, y + 4.0 * qy + 9.2);
      const wy = noise2D(x + 4.0 * qx + 8.3, y + 4.0 * qy + 2.8);

      return (
        noise2D(x + 2.5 * wx, y + 2.5 * wy) * 0.65 +
        noise2D(x * 2.1, y * 2.1) * 0.25 +
        noise2D(x * 4.2, y * 4.2) * 0.1
      );
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      cols = Math.ceil(width / cellSize);
      rows = Math.ceil(height / cellSize);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // 2D grid state buffer
    let grid: Uint8Array = new Uint8Array(0);

    const render = () => {
      time += speed;

      // Mouse smooth interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      if (!cols || !rows) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (grid.length !== cols * rows) {
        grid = new Uint8Array(cols * rows);
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.46;
      const clearRadiusX = width * 0.32;
      const clearRadiusY = height * 0.28;

      const scale = 0.032; // Noise frequency
      const threshold = 0.14; // Threshold to define cellular islands

      // 1. Compute discrete cell occupancy on the grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = c * cellSize;
          const py = r * cellSize;

          // Base noise sampling with slow temporal evolution
          let n = fbm(c * scale + time * 0.4, r * scale + time * 0.3);

          // Center clearance falloff (keeps hero typography & composer clearly readable)
          if (centerClearance) {
            const dx = (px - cx) / clearRadiusX;
            const dy = (py - cy) / clearRadiusY;
            const distSq = dx * dx + dy * dy;
            if (distSq < 1.0) {
              const damp = Math.pow(distSq, 1.5);
              n -= (1.0 - damp) * 0.48;
            }
          }

          // Subtle interactive mouse cursor distortion
          if (mouseRef.current.active) {
            const mdx = px - mouseRef.current.x;
            const mdy = py - mouseRef.current.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mDist < 160) {
              const mFactor = (1 - mDist / 160);
              n += Math.sin(mDist * 0.08 - time * 8) * 0.18 * mFactor;
            }
          }

          grid[r * cols + c] = n > threshold ? 1 : 0;
        }
      }

      // 2. Render Cell Fillings (Solid Stepped Regions with Subtle Silver/Metallic Hue)
      ctx.fillStyle = fillColor;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r * cols + c] === 1) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }

      // 3. Render Crisp 1px Rectilinear Stepped Contour Outlines
      ctx.lineWidth = 1;
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (grid[idx] === 1) {
            const x = c * cellSize;
            const y = r * cellSize;

            // Check 4 orthogonal neighbors to draw only the boundary contour lines
            // Top Edge
            if (r === 0 || grid[(r - 1) * cols + c] === 0) {
              ctx.moveTo(x, y);
              ctx.lineTo(x + cellSize, y);
            }
            // Bottom Edge
            if (r === rows - 1 || grid[(r + 1) * cols + c] === 0) {
              ctx.moveTo(x, y + cellSize);
              ctx.lineTo(x + cellSize, y + cellSize);
            }
            // Left Edge
            if (c === 0 || grid[r * cols + (c - 1)] === 0) {
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + cellSize);
            }
            // Right Edge
            if (c === cols - 1 || grid[r * cols + (c + 1)] === 0) {
              ctx.moveTo(x + cellSize, y);
              ctx.lineTo(x + cellSize, y + cellSize);
            }
          }
        }
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cellSize, speed, strokeColor, fillColor, centerClearance]);

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity }}
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
    />
  );
}
