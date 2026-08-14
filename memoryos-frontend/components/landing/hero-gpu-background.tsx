"use client";

import { motion } from "framer-motion";

export function HeroGpuBackground() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden bg-white pointer-events-none">
      {/* 
        We use a radial gradient mask so the SVG fades out towards the edges 
        and doesn't interfere too much with the text in the center.
      */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)'
        }}
      >
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[1400px] min-h-[800px]"
          viewBox="0 0 1400 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0015FF" strokeWidth="0.5" strokeOpacity="0.3" />
          </pattern>
          <rect width="1400" height="800" fill="url(#grid)" />

          {/* GPU Nodes */}
          {/* Node 1 */}
          <g transform="translate(300, 200)">
            <rect width="160" height="160" rx="8" fill="#f8fafc" stroke="#0015FF" strokeWidth="2" />
            <rect x="20" y="20" width="120" height="120" rx="4" fill="transparent" stroke="#0015FF" strokeWidth="1" strokeDasharray="4 4" />
            {/* Blinking Core */}
            <motion.rect
              x="60" y="60" width="40" height="40" rx="4"
              fill="#0015FF"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </g>

          {/* Node 2 */}
          <g transform="translate(600, 200)">
            <rect width="160" height="160" rx="8" fill="#f8fafc" stroke="#0015FF" strokeWidth="2" />
            <rect x="20" y="20" width="120" height="120" rx="4" fill="transparent" stroke="#0015FF" strokeWidth="1" strokeDasharray="4 4" />
            <motion.rect
              x="60" y="60" width="40" height="40" rx="4"
              fill="#0015FF"
              animate={{ opacity: [0.1, 0.9, 0.1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </g>

          {/* Node 3 */}
          <g transform="translate(900, 200)">
            <rect width="160" height="160" rx="8" fill="#f8fafc" stroke="#0015FF" strokeWidth="2" />
            <rect x="20" y="20" width="120" height="120" rx="4" fill="transparent" stroke="#0015FF" strokeWidth="1" strokeDasharray="4 4" />
            <motion.rect
              x="60" y="60" width="40" height="40" rx="4"
              fill="#0015FF"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </g>

          {/* Node 4 (Bottom Left) */}
          <g transform="translate(450, 450)">
            <rect width="160" height="160" rx="8" fill="#f8fafc" stroke="#0015FF" strokeWidth="2" />
            <rect x="20" y="20" width="120" height="120" rx="4" fill="transparent" stroke="#0015FF" strokeWidth="1" strokeDasharray="4 4" />
            <motion.rect
              x="60" y="60" width="40" height="40" rx="4"
              fill="#0015FF"
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
          </g>

          {/* Node 5 (Bottom Right) */}
          <g transform="translate(750, 450)">
            <rect width="160" height="160" rx="8" fill="#f8fafc" stroke="#0015FF" strokeWidth="2" />
            <rect x="20" y="20" width="120" height="120" rx="4" fill="transparent" stroke="#0015FF" strokeWidth="1" strokeDasharray="4 4" />
            <motion.rect
              x="60" y="60" width="40" height="40" rx="4"
              fill="#0015FF"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />
          </g>

          {/* Connecting Data Traces (Static lines) */}
          <path d="M 460 280 L 600 280" stroke="#0015FF" strokeWidth="2" strokeOpacity="0.5" />
          <path d="M 760 280 L 900 280" stroke="#0015FF" strokeWidth="2" strokeOpacity="0.5" />
          <path d="M 380 360 L 380 400 L 450 400 L 450 530" stroke="#0015FF" strokeWidth="2" strokeOpacity="0.5" />
          <path d="M 680 360 L 680 400 L 830 400 L 830 450" stroke="#0015FF" strokeWidth="2" strokeOpacity="0.5" />
          <path d="M 610 530 L 750 530" stroke="#0015FF" strokeWidth="2" strokeOpacity="0.5" />

          {/* Animated Data Packets traveling along traces */}
          {/* Packet 1 */}
          <motion.circle 
            r="4" 
            fill="#0015FF"
            animate={{
              cx: [460, 600, 600],
              cy: [280, 280, 280],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Packet 2 */}
          <motion.circle 
            r="4" 
            fill="#0015FF"
            animate={{
              cx: [760, 900, 900],
              cy: [280, 280, 280],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.5
            }}
          />

          {/* Packet 3 */}
          <motion.circle 
            r="4" 
            fill="#0015FF"
            animate={{
              cx: [380, 380, 450, 450],
              cy: [360, 400, 400, 530],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: 1
            }}
          />
          
          {/* Packet 4 */}
          <motion.circle 
            r="4" 
            fill="#0015FF"
            animate={{
              cx: [680, 680, 830, 830],
              cy: [360, 400, 400, 450],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: 0.2
            }}
          />

        </svg>
      </div>

      {/* A subtle white gradient at the bottom to transition smoothly into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}


