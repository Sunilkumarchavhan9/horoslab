"use client";

import { motion, useInView } from "framer-motion";
import type { CSSProperties } from "react";
import { useMemo, useRef } from "react";

type PointGlyph = {
  x: number;
  y: number;
  glyph: string;
  opacity: string;
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

function px(value: number, precision = 3) {
  return `${value.toFixed(precision)}px`;
}

function decimal(value: number, precision = 6) {
  return value.toFixed(precision);
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
        opacity: decimal(0.82 + hash(seed + 37) * 0.14),
        size: 7 + hash(seed + 53) * 0.9,
      });
    }
  }

  return points;
}

const STAR_POINTS = buildPointCloud();

function glitchStyle(seed: number, delay: number): CSSProperties {
  const xBack = -2 - Math.round(hash(seed + 5) * 5);
  const xFront = 4 + Math.round(hash(seed + 11) * 8);
  const yBack = -2 + Math.round(hash(seed + 17) * 5);
  const yFront = -3 + Math.round(hash(seed + 23) * 7);
  const blur = (1.2 + hash(seed + 29) * 2.8).toFixed(2);
  const scaleFront = (1.08 + hash(seed + 31) * 0.28).toFixed(3);
  const scaleBack = (0.88 + hash(seed + 37) * 0.1).toFixed(3);
  const duration = (0.92 + hash(seed + 41) * 0.72).toFixed(3);

  return {
    "--glitch-x-back": `${xBack}px`,
    "--glitch-x-front": `${xFront}px`,
    "--glitch-y-back": `${yBack}px`,
    "--glitch-y-front": `${yFront}px`,
    "--glitch-blur": `${blur}px`,
    "--glitch-scale-front": scaleFront,
    "--glitch-scale-back": scaleBack,
    animationDelay: `${(delay + hash(seed + 47) * 0.12).toFixed(3)}s`,
    animationDuration: `${duration}s`,
  } as CSSProperties;
}

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
  const width = px(STAR_WIDTH * scale);
  const height = px(STAR_HEIGHT * scale);

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
            left: px(point.x * scale),
            top: px(point.y * scale),
            fontSize: px(point.size * scale),
            opacity: point.opacity,
            transform: "translate(-50%, -50%)",
            letterSpacing: px(-0.08 * point.size * scale),
          }}
        >
          {point.glyph}
        </span>
      ))}

      {glitchPoints.map((point, index) => (
        <span
          key={`glitch-${index}`}
          className={`absolute font-mono leading-none text-[#2166f3] ${active ? "footer-star-glitch" : ""}`}
          style={{
            left: px(point.x * scale),
            top: px(point.y * scale),
            fontSize: px(point.size * scale),
            opacity: "0.5",
            textShadow: "0 0 12px rgba(33,102,243,0.5), 0 0 24px rgba(33,102,243,0.18)",
            transform: "translate(-50%, -50%)",
            letterSpacing: px(-0.08 * point.size * scale),
            ...glitchStyle(glitchGroup * 1000 + index * 37, delay + index * 0.018),
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
            filter: blur(0px);
            opacity: 0;
          }
          6% {
            transform: translate(
                calc(-50% + var(--glitch-x-back)),
                calc(-50% + var(--glitch-y-back))
              )
              scale(var(--glitch-scale-back));
            filter: blur(calc(var(--glitch-blur) * 0.65));
            opacity: 0.14;
          }
          11% {
            transform: translate(
                calc(-50% + var(--glitch-x-front)),
                calc(-50% + var(--glitch-y-front))
              )
              scale(var(--glitch-scale-front));
            filter: blur(var(--glitch-blur));
            opacity: 0.42;
          }
          15% {
            transform: translate(calc(-50% + 1px), calc(-50% - 1px)) scale(1.02);
            filter: blur(calc(var(--glitch-blur) * 0.22));
            opacity: 0.1;
          }
          52% {
            transform: translate(
                calc(-50% + var(--glitch-x-back)),
                calc(-50% + var(--glitch-y-front))
              )
              scale(var(--glitch-scale-back));
            filter: blur(calc(var(--glitch-blur) * 0.9));
            opacity: 0.18;
          }
          58% {
            transform: translate(
                calc(-50% + var(--glitch-x-front)),
                calc(-50% + var(--glitch-y-back))
              )
              scale(calc(var(--glitch-scale-front) + 0.05));
            filter: blur(calc(var(--glitch-blur) * 1.15));
            opacity: 0.48;
          }
          63% {
            transform: translate(calc(-50% - 1px), calc(-50% + 2px)) scale(0.97);
            filter: blur(calc(var(--glitch-blur) * 0.35));
            opacity: 0.12;
          }
          69% {
            transform: translate(
                calc(-50% + calc(var(--glitch-x-front) * 1.2)),
                calc(-50% + calc(var(--glitch-y-front) * 1.1))
              )
              scale(calc(var(--glitch-scale-front) + 0.08));
            filter: blur(calc(var(--glitch-blur) * 1.3));
            opacity: 0.54;
          }
          76% {
            transform: translate(calc(-50% + 2px), calc(-50% - 2px)) scale(1.01);
            filter: blur(calc(var(--glitch-blur) * 0.16));
            opacity: 0.08;
          }
        }

        .footer-star-glitch {
          animation-iteration-count: infinite;
          animation-name: footerStarGlitch;
          animation-timing-function: steps(2, end);
          will-change: transform, opacity, filter;
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
