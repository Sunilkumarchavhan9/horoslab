"use client";

import type { BrainMapEdge, BrainMapGraph, BrainMapNode, BrainMapSelection } from "@/lib/brain-map-types";
import { useEffect, useRef } from "react";

const VIEW_W = 900;
const VIEW_H = 560;
const ASCII_CHARS = " .,:;+*x234589#";
const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const THEME = {
  bg: "#ffffff",
  grid: "#e8f0fc",
  faint: { r: 201, g: 216, b: 238 },
  mid: { r: 91, g: 124, b: 186 },
  accent: { r: 53, g: 106, b: 204 },
  deep: { r: 30, g: 58, b: 95 },
  label: "#356acc",
  labelMuted: "#6a7f9a",
} as const;

const COLUMN_HEADERS = [
  { label: "Live Sessions", x: 54 },
  { label: "Memory Operations", x: 298 },
  { label: "Stored Knowledge", x: 596 },
  { label: "Live Agents", x: 800 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fract(value: number) {
  return value - Math.floor(value);
}

function hashNoise(x: number, y: number, t: number) {
  return fract(Math.sin(x * 12.9898 + y * 78.233 + t * 0.38) * 43758.5453);
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

type Point = { x: number; y: number };

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

function edgeControls(from: BrainMapNode, to: BrainMapNode) {
  const isSameColumn = Math.abs(from.x - to.x) < 10;
  if (isSameColumn) {
    const arcOffset = 80 + Math.abs(from.y - to.y) * 0.45;
    return {
      p0: { x: from.x, y: from.y },
      p1: { x: from.x - arcOffset, y: from.y },
      p2: { x: to.x - arcOffset, y: to.y },
      p3: { x: to.x, y: to.y },
    };
  }
  const midX = (from.x + to.x) / 2;
  return {
    p0: { x: from.x, y: from.y },
    p1: { x: midX, y: from.y },
    p2: { x: midX, y: to.y },
    p3: { x: to.x, y: to.y },
  };
}

function sampleEdge(edge: BrainMapEdge, nodeById: Map<string, BrainMapNode>, steps = 48): Point[] {
  const from = nodeById.get(edge.from);
  const to = nodeById.get(edge.to);
  if (!from || !to) return [];
  const { p0, p1, p2, p3 } = edgeControls(from, to);
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    points.push(cubicPoint(p0, p1, p2, p3, i / steps));
  }
  return points;
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return Math.hypot(px - ax, py - ay);
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function nodeBarIntensity(px: number, py: number, node: BrainMapNode) {
  const barW = node.r * 1.35;
  const barH = node.r * (node.kind === "operation" ? 4.2 : 3.2);
  const dx = Math.abs(px - node.x);
  const dy = Math.abs(py - node.y);
  if (dx > barW || dy > barH * 0.55) return 0;
  const nx = 1 - dx / barW;
  const ny = 1 - dy / (barH * 0.55);
  return clamp(nx * ny * 0.95, 0, 1);
}

function beamBoostAlongEdge(
  px: number,
  py: number,
  samples: Point[],
  phase: number,
  spread = 14,
): number {
  if (samples.length < 2) return 0;
  const head = (phase % 1) * (samples.length - 1);
  const idx = Math.floor(head);
  const frac = head - idx;
  const a = samples[idx];
  const b = samples[Math.min(idx + 1, samples.length - 1)];
  const bx = a.x + (b.x - a.x) * frac;
  const by = a.y + (b.y - a.y) * frac;
  const d = Math.hypot(px - bx, py - by);
  if (d > spread) return 0;
  return (1 - d / spread) ** 1.6;
}

type LiveBrainMapDitherCanvasProps = {
  className?: string;
  graph: BrainMapGraph;
  selectedItem?: BrainMapSelection;
  onSelectNode?: (id: string) => void;
  onSelectEdge?: (id: string) => void;
};

export function LiveBrainMapDitherCanvas({
  className,
  graph,
  selectedItem = null,
  onSelectNode,
  onSelectEdge,
}: LiveBrainMapDitherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphRef = useRef(graph);
  const selectedRef = useRef(selectedItem);
  const visibleRef = useRef(true);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    graphRef.current = graph;
    selectedRef.current = selectedItem;
  }, [graph, selectedItem]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cell = 6;
    let raf = 0;
    let lastPaintTime = 0;
    const frameIntervalMs = 1000 / 24;

    const resize = () => {
      width = Math.max(1, Math.floor(canvas.clientWidth));
      height = Math.max(1, Math.floor(canvas.clientHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = width > 900 ? 6 : 5;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "top";
      ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    };

    const drawFrame = (time: number) => {
      const t = time * 0.001;
      const currentGraph = graphRef.current;
      const selected = selectedRef.current;
      const nodeById = new Map(currentGraph.nodes.map((node) => [node.id, node]));

      const edgeSamples = currentGraph.edges.map((edge) => ({
        edge,
        samples: sampleEdge(edge, nodeById),
        phase: fract(t * 0.55 + hashNoise(edge.id.length, edge.from.length, 0) * 2.4),
      }));

      const scale = Math.min(width / VIEW_W, height / VIEW_H);
      const offsetX = (width - VIEW_W * scale) / 2;
      const offsetY = (height - VIEW_H * scale) / 2;

      const toScreen = (vx: number, vy: number) => ({
        x: offsetX + vx * scale,
        y: offsetY + vy * scale,
      });

      ctx.fillStyle = THEME.bg;
      ctx.fillRect(0, 0, width, height);

      // Light grid (blue dither dots only)
      for (let gy = 42; gy < VIEW_H; gy += 40) {
        for (let gx = 34; gx < VIEW_W; gx += 82) {
          const p = toScreen(gx, gy);
          const gxCell = Math.floor(p.x / cell);
          const gyCell = Math.floor(p.y / cell);
          const threshold = (BAYER_4X4[((gyCell & 3) * 4) + (gxCell & 3)] + 0.5) / 16;
          if (threshold > 0.72) {
            ctx.fillStyle = "rgba(201, 216, 238, 0.55)";
            ctx.fillText(".", Math.floor(p.x / cell) * cell, Math.floor(p.y / cell) * cell);
          }
        }
      }

      const intensityField: number[][] = [];
      const beamField: number[][] = [];
      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);

      for (let row = 0; row < rows; row += 1) {
        intensityField[row] = [];
        beamField[row] = [];
        for (let col = 0; col < cols; col += 1) {
          const sx = (col * cell + cell * 0.5 - offsetX) / scale;
          const sy = (row * cell + cell * 0.5 - offsetY) / scale;

          let edgeIntensity = 0;
          let beamIntensity = 0;

          for (const { edge, samples, phase } of edgeSamples) {
            if (samples.length < 2) continue;

            const selectedEdge = selected?.kind === "edge" && selected.id === edge.id;
            const faint =
              selected?.kind === "node" &&
              edge.from !== selected.id &&
              edge.to !== selected.id;

            for (let i = 1; i < samples.length; i += 1) {
              const d = distToSegment(
                sx,
                sy,
                samples[i - 1].x,
                samples[i - 1].y,
                samples[i].x,
                samples[i].y,
              );
              const tube = selectedEdge ? 10 : 5;
              if (d < tube) {
                const local = (1 - d / tube) * edge.opacity * (faint ? 0.08 : 1);
                edgeIntensity = Math.max(edgeIntensity, local);
              }
            }

            beamIntensity = Math.max(
              beamIntensity,
              beamBoostAlongEdge(sx, sy, samples, phase, selectedEdge ? 18 : 12) *
                edge.opacity *
                (faint ? 0.12 : 1),
            );
          }

          let nodeIntensity = 0;
          for (const node of currentGraph.nodes) {
            const selectedNode = selected?.kind === "node" && selected.id === node.id;
            const dimmed =
              selected?.kind === "node" && !selectedNode && selected.id !== node.id;

            const bar = nodeBarIntensity(sx, sy, node);
            if (bar > 0) {
              nodeIntensity = Math.max(
                nodeIntensity,
                bar * (dimmed ? 0.2 : selectedNode ? 1 : 0.82),
              );
            }
          }

          intensityField[row][col] = clamp(Math.max(edgeIntensity * 0.9, nodeIntensity), 0, 1);
          beamField[row][col] = beamIntensity;
        }
      }

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          let intensity = intensityField[row][col];
          const beam = beamField[row][col];

          const gridX = col;
          const gridY = row;
          const threshold = (BAYER_4X4[((gridY & 3) * 4) + (gridX & 3)] + 0.5) / 16;
          intensity = clamp(intensity + (threshold - 0.5) * 0.24, 0, 1);

          const x = col * cell;
          const y = row * cell;
          const shimmer = 0.03 * Math.sin(t * 3.2 + col * 0.31 + row * 0.19);

          if (beam > 0.08) {
            const beamChar = beam > 0.55 ? "#" : "+";
            const beamAlpha = clamp(0.55 + beam * 0.45 + shimmer, 0.4, 1);
            ctx.fillStyle = `rgba(255, 255, 255, ${beamAlpha.toFixed(3)})`;
            ctx.fillText(beamChar, x, y);
            ctx.fillStyle = `rgba(53, 106, 204, ${(beam * 0.35).toFixed(3)})`;
            ctx.fillText(beamChar, x + 1, y);
            continue;
          }

          if (intensity < 0.11) continue;

          const charIndex = Math.min(
            ASCII_CHARS.length - 1,
            Math.floor(intensity * (ASCII_CHARS.length - 1)),
          );
          const ch = ASCII_CHARS[charIndex];

          const color =
            intensity < 0.35
              ? mixColor(THEME.faint, THEME.mid, intensity / 0.35)
              : intensity < 0.7
                ? mixColor(THEME.mid, THEME.accent, (intensity - 0.35) / 0.35)
                : mixColor(THEME.accent, THEME.deep, (intensity - 0.7) / 0.3);

          const alpha = clamp(0.32 + intensity * 0.58 + shimmer, 0.25, 0.95);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, x, y);
        }
      }

      // Column headers + node labels (blue text only, no fills)
      ctx.font = `600 ${Math.max(10, cell + 4)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      for (const header of COLUMN_HEADERS) {
        const p = toScreen(header.x, 22);
        ctx.fillStyle = THEME.labelMuted;
        ctx.fillText("●", p.x - 2, p.y + 2);
        ctx.fillStyle = THEME.label;
        ctx.fillText(header.label.toUpperCase(), p.x + 10, p.y);
      }

      ctx.font = `${Math.max(9, cell + 2)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      for (const node of currentGraph.nodes) {
        const selectedNode = selected?.kind === "node" && selected.id === node.id;
        const dimmed = selected?.kind === "node" && !selectedNode;
        if (node.kind === "session" && !selectedNode) continue;

        const p = toScreen(node.x + node.r + 8, node.y + 3);
        ctx.fillStyle = dimmed ? "rgba(106, 127, 154, 0.45)" : `rgb(${THEME.deep.r}, ${THEME.deep.g}, ${THEME.deep.b})`;
        const label =
          node.label.length > 28 ? `${node.label.slice(0, 26)}…` : node.label;
        ctx.fillText(label, p.x, p.y);
      }

    };

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const scale = Math.min(width / VIEW_W, height / VIEW_H);
      const offsetX = (width - VIEW_W * scale) / 2;
      const offsetY = (height - VIEW_H * scale) / 2;
      const vx = (px - offsetX) / scale;
      const vy = (py - offsetY) / scale;

      let bestNode: BrainMapNode | null = null;
      let bestNodeDist = Infinity;
      for (const node of graphRef.current.nodes) {
        const d = Math.hypot(vx - node.x, vy - node.y);
        const hit = node.r + 12;
        if (d < hit && d < bestNodeDist) {
          bestNodeDist = d;
          bestNode = node;
        }
      }
      if (bestNode) {
        onSelectNode?.(bestNode.id);
        return;
      }

      const nodeById = new Map(graphRef.current.nodes.map((n) => [n.id, n]));
      let bestEdge: BrainMapEdge | null = null;
      let bestEdgeDist = Infinity;
      for (const edge of graphRef.current.edges) {
        const samples = sampleEdge(edge, nodeById, 32);
        for (let i = 1; i < samples.length; i += 1) {
          const d = distToSegment(
            vx,
            vy,
            samples[i - 1].x,
            samples[i - 1].y,
            samples[i].x,
            samples[i].y,
          );
          if (d < 10 && d < bestEdgeDist) {
            bestEdgeDist = d;
            bestEdge = edge;
          }
        }
      }
      if (bestEdge) onSelectEdge?.(bestEdge.id);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = !!entry?.isIntersecting;
      },
      { threshold: 0.05 },
    );
    visibilityObserver.observe(canvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = reduced.matches;
    const onReducedChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    reduced.addEventListener("change", onReducedChange);

    canvas.addEventListener("click", handleClick);
    resize();
    const loop = (time: number) => {
      if (!visibleRef.current) {
        raf = window.requestAnimationFrame(loop);
        return;
      }
      if (reducedMotionRef.current || time - lastPaintTime >= frameIntervalMs) {
        lastPaintTime = time;
        drawFrame(time);
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      visibilityObserver.disconnect();
      reduced.removeEventListener("change", onReducedChange);
      canvas.removeEventListener("click", handleClick);
    };
  }, [onSelectNode, onSelectEdge]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "block h-full w-full cursor-pointer"}
      aria-label="Live brain map dither visualization"
      role="img"
    />
  );
}
