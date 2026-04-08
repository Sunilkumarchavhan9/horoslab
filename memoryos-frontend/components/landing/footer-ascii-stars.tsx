"use client";

import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";

type PointGlyph = {
  x: number;
  y: number;
  glyph: string;
  opacity: number;
  size: number;
};

const STAR_POSITIONS = [
  { x: 0.08, y: 0.09, scale: 0.64 },
  { x: 0.46, y: 0.06, scale: 0.36 },
  { x: 0.89, y: 0.03, scale: 0.66 },
  { x: 0.2, y: 0.52, scale: 0.52 },
  { x: 0.6, y: 0.58, scale: 0.46 },
  { x: 0.9, y: 0.34, scale: 0.54 },
] as const;

const STAR_WIDTH = 220;
const STAR_HEIGHT = 240;
const STAR_POLYGON = buildStarPolygon();

function buildStarPolygon() {
  const cx = STAR_WIDTH / 2;
  const cy = STAR_HEIGHT / 2;
  const rotation = -Math.PI / 2;
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < 12; i += 1) {
    const angle = rotation + i * (Math.PI / 6);
    const isOuter = i % 2 === 0;
    const outerIndex = Math.floor(i / 2);

    const outerRadius =
      outerIndex === 0 || outerIndex === 3
        ? 106
        : outerIndex === 1 || outerIndex === 5
          ? 108
          : 112;

    const innerRadius =
      outerIndex === 0 || outerIndex === 3
        ? 26
        : outerIndex === 1 || outerIndex === 5
          ? 24
          : 30;

    const radius = isOuter ? outerRadius : innerRadius;

    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }

  return points;
}

function hash(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function weightedRun(seed: number) {
  const value = hash(seed);
  if (value < 0.2) return "9";
  if (value < 0.48) return "99";
  if (value < 0.74) return "999";
  if (value < 0.9) return "9999";
  return "99999";
}

function isPointInPolygon(
  x: number,
  y: number,
  polygon: ReadonlyArray<{ x: number; y: number }>,
) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideStar(x: number, y: number) {
  return isPointInPolygon(x, y, STAR_POLYGON);
}

function buildPointCloud() {
  const points: PointGlyph[] = [];
  const rowStep = 7.4;
  const colStep = 6.2;

  for (let y = 8; y <= STAR_HEIGHT - 8; y += rowStep) {
    for (let x = 8; x <= STAR_WIDTH - 8; x += colStep) {
      if (!isInsideStar(x, y)) continue;

      const seed = x * 1000 + y * 17;
      if (hash(seed) < 0.38) continue;

      points.push({
        x: x + (hash(seed + 11) - 0.5) * 1.3,
        y: y + (hash(seed + 23) - 0.5) * 1.1,
        glyph: weightedRun(seed + 71),
        opacity: 0.82 + hash(seed + 37) * 0.14,
        size: 7 + hash(seed + 53) * 0.9,
      });
    }
  }

  return points;
}

const STAR_POINTS = buildPointCloud();

function AsciiStar({
  x,
  y,
  scale,
  delay,
  active,
  glitchGroup,
}: {
  x: number;
  y: number;
  scale: number;
  delay: number;
  active: boolean;
  glitchGroup: number;
}) {
  const glitchPoints = useMemo(
    () => STAR_POINTS.filter((_, index) => index % 4 === glitchGroup % 4),
    [glitchGroup],
  );
  const width = STAR_WIDTH * scale;
  const height = STAR_HEIGHT * scale;

  return (
    <motion.div
      className="pointer-events-none absolute"
      initial={{ opacity: 0, scale: 0.76, y: 18, filter: "blur(5px)" }}
      animate={
        active
          ? { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, scale: 0.76, y: 18, filter: "blur(5px)" }
      }
      transition={{
        duration: 0.75,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width,
        height,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle, rgba(33,102,243,0.12) 0%, rgba(33,102,243,0.05) 42%, rgba(33,102,243,0) 100%)",
          filter: "blur(8px)",
        }}
      />

      {STAR_POINTS.map((point, index) => (
        <span
          key={`base-${index}`}
          className="absolute font-mono leading-none text-[#2166f3]"
          style={{
            left: point.x * scale,
            top: point.y * scale,
            fontSize: point.size * scale,
            opacity: point.opacity,
            transform: "translate(-50%, -50%)",
            letterSpacing: `${-0.08 * point.size * scale}px`,
          }}
        >
          {point.glyph}
        </span>
      ))}

      {glitchPoints.map((point, index) => (
        <span
          key={`glitch-${index}`}
          className="absolute font-mono leading-none text-[#2166f3]"
          style={{
            left: point.x * scale,
            top: point.y * scale,
            fontSize: point.size * scale,
            opacity: 0.5,
            textShadow: "0 0 12px rgba(33,102,243,0.5), 0 0 24px rgba(33,102,243,0.18)",
            transform: "translate(-50%, -50%)",
            letterSpacing: `${-0.08 * point.size * scale}px`,
            animation: active
              ? `footerStarGlitch 1.15s steps(2, end) ${delay + index * 0.018}s infinite`
              : "none",
          }}
        >
          {point.glyph}
        </span>
      ))}
    </motion.div>
  );
}

export function FooterAsciiStars() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const active = useInView(containerRef, {
    amount: 0,
    margin: "0px 0px -15% 0px",
    once: true,
  });

  return (
    <>
      <style jsx>{`
        @keyframes footerStarGlitch {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
          7% {
            transform: translate(calc(-50% - 5px), calc(-50% + 1px)) scale(0.96);
            opacity: 0.16;
          }
          11% {
            transform: translate(calc(-50% + 7px), calc(-50% - 2px)) scale(1.06);
            opacity: 0.34;
          }
          15% {
            transform: translate(calc(-50% + 2px), calc(-50% + 4px)) scale(0.98);
            opacity: 0.1;
          }
          51% {
            transform: translate(calc(-50% - 4px), calc(-50% - 2px)) scale(0.95);
            opacity: 0.14;
          }
          56% {
            transform: translate(calc(-50% + 8px), calc(-50% + 1px)) scale(1.08);
            opacity: 0.4;
          }
          61% {
            transform: translate(calc(-50% - 2px), calc(-50% + 5px)) scale(0.97);
            opacity: 0.18;
          }
          66% {
            transform: translate(calc(-50% + 10px), calc(-50% - 3px)) scale(1.12);
            opacity: 0.46;
          }
          72% {
            transform: translate(calc(-50% - 6px), calc(-50% + 2px)) scale(0.94);
            opacity: 0.15;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {STAR_POSITIONS.map((star, index) => (
          <AsciiStar
            key={`${star.x}-${star.y}-${index}`}
            x={star.x}
            y={star.y}
            scale={0.46 + star.scale * 0.72}
            delay={index * 0.18}
            active={active}
            glitchGroup={index}
          />
        ))}
      </div>
    </>
  );
}
