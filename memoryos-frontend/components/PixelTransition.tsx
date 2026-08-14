"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface PixelTransitionProps {
  firstContent: React.ReactNode;
  secondContent: React.ReactNode;
  gridSize?: number;
  pixelColor?: string | string[] | ((row: number, col: number, size: number) => string);
  once?: boolean;
  animationStepDuration?: number;
  className?: string;
  isActive?: boolean;
}

export default function PixelTransition({
  firstContent,
  secondContent,
  gridSize = 8,
  pixelColor = "#ffffff",
  once = false,
  animationStepDuration = 0.4,
  className,
  isActive,
}: PixelTransitionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const activeState = isActive !== undefined ? isActive : isHovered;

  // Generate random delays and colors for each pixel
  const pixels = useMemo(() => {
    return Array.from({ length: gridSize * gridSize }).map((_, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      const color = typeof pixelColor === 'function'
        ? pixelColor(row, col, gridSize)
        : Array.isArray(pixelColor)
          ? pixelColor[Math.floor(Math.random() * pixelColor.length)]
          : pixelColor;

      return {
        id: i,
        delay: Math.random() * animationStepDuration,
        color,
      };
    });
  }, [gridSize, pixelColor, animationStepDuration]);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !once && setIsHovered(false)}
    >
      {/* Second Content (Bottom Layer) */}
      <div className="relative w-full h-full z-0">
        {secondContent}
      </div>

      {/* Pixels overlaying the base content */}
      <div 
        className="absolute inset-0 z-10 grid pointer-events-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {pixels.map((pixel) => (
          <motion.div
            key={pixel.id}
            initial={{ opacity: 1 }}
            animate={{ opacity: activeState ? 0 : 1 }}
            transition={{ duration: animationStepDuration, delay: pixel.delay }}
            style={{ backgroundColor: pixel.color }}
            className="w-full h-full"
          />
        ))}
      </div>

      {/* First Content (Top Layer) */}
      <motion.div
        className="absolute inset-0 z-20 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: activeState ? 0 : 1 }}
        transition={{ duration: animationStepDuration / 2 }}
      >
        {firstContent}
      </motion.div>
    </div>
  );
}
