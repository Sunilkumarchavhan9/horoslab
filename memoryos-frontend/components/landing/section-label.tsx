"use client";

import { motion } from "framer-motion";

type SectionLabelProps = {
  title: string;
  index: string;
  className?: string;
  dark?: boolean;
};

export function SectionLabel({ title, index, className, dark }: SectionLabelProps) {
  const defaultColors = "border-y border-[#c9d8ee] bg-white text-[#28456f]";
  const darkColors = "border-y border-[#222] bg-transparent text-[#666]";
  
  return (
    <div
      className={`relative flex items-center justify-between overflow-hidden px-4 py-4 font-mono text-[15px] tracking-[0.18em] ${dark ? darkColors : defaultColors} ${className ?? ""}`}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[-30%] w-[42%] bg-[linear-gradient(90deg,rgba(19,99,225,0),rgba(19,99,225,0.08),rgba(19,99,225,0.22),rgba(19,99,225,0.08),rgba(19,99,225,0))]"
        animate={{
          x: ["-10%", "180%"],
          opacity: [0, 0.35, 0.8, 0.35, 0],
        }}
        transition={{
          duration: 2.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <span className="relative z-10">{title}</span>
      <span className="relative z-10">{index}</span>
    </div>
  );
}


