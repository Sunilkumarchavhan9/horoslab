"use client";

import { motion } from "framer-motion";

type AnimatedRailTicksProps = {
  positions?: string[];
  className?: string;
};

export function AnimatedRailTicks({
  positions = ["24%", "50%", "76%"],
  className = "",
}: AnimatedRailTicksProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {positions.map((left, index) => (
        <span
          key={`${left}-${index}`}
          className="absolute top-0 h-full border-l border-dashed border-[#c9d8ee]"
          style={{
            left,
            transform: left === "50%" ? "translateX(-50%)" : undefined,
          }}
        >
          <motion.span
            className="absolute -left-px top-0 h-full w-px bg-[#1363e1]"
            animate={{
              opacity: [0, 0.22, 1, 0.22, 0],
              boxShadow: [
                "0 0 0px rgba(19,99,225,0)",
                "0 0 10px rgba(19,99,225,0.45)",
                "0 0 18px rgba(19,99,225,0.95)",
                "0 0 10px rgba(19,99,225,0.45)",
                "0 0 0px rgba(19,99,225,0)",
              ],
            }}
            transition={{
              duration: 2.1,
              delay: index * 0.28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              repeatDelay: 0.18,
            }}
          />
        </span>
      ))}
    </div>
  );
}
