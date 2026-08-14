"use client";

import { motion } from "framer-motion";

export function LiquidPinkGradient() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-90 [mask-image:linear-gradient(to_top,black,transparent)] pointer-events-none">
      <div className="absolute inset-0 bg-pink-100" />
      
      {/* Animated Blobs */}
      <motion.div
        animate={{
          x: [0, 20, -20, 0],
          y: [0, -30, 10, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-[20%] top-[20%] w-[140%] h-[80%] rounded-full bg-pink-300 mix-blend-multiply filter blur-[40px] opacity-70"
      />
      <motion.div
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[30%] -top-[10%] w-[120%] h-[100%] rounded-full bg-rose-300 mix-blend-multiply filter blur-[50px] opacity-60"
      />
      <motion.div
        animate={{
          x: [0, 40, -10, 0],
          y: [0, 20, 40, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-[20%] top-[40%] w-[100%] h-[100%] rounded-full bg-fuchsia-300 mix-blend-multiply filter blur-[60px] opacity-50"
      />
      
      {/* Texture overlay (SVG turbulence) */}
      <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}
