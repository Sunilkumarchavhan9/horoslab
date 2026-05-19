"use client";

import { DEV_FEATURE_ASCII, type NavAsciiVariant } from "@/lib/nav-ascii-variants";
import { EASE_OUT } from "@/lib/motion";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { NavAsciiTile } from "./nav-ascii-tile";

export type DeveloperExperienceFeature = {
  num: string;
  tab: string;
  heading: string;
  description: string;
  bullets: string[];
};

type DeveloperExperienceCardProps = {
  feature: DeveloperExperienceFeature;
  index: number;
};

export function DeveloperExperienceCard({ feature, index }: DeveloperExperienceCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { amount: 0.2, once: true });
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const variant: NavAsciiVariant = DEV_FEATURE_ASCII[feature.num] ?? "grid";
  const active = hovered;

  return (
    <motion.article
      ref={ref}
      id={`feature-${feature.num}`}
      className="group/card flex h-full flex-col overflow-hidden border border-[#dbe6f7] bg-[#f7f9fc] transition-colors hover:bg-white"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={prefersReducedMotion ? undefined : { y: -4, transition: { duration: 0.24, ease: EASE_OUT } }}
    >
      <div className="relative overflow-hidden border-b border-[#dbe6f7] bg-[#f3f6fb]">
        <NavAsciiTile
          variant={variant}
          active={active}
          className="h-[220px] w-full rounded-none"
        />
        <span className="absolute left-4 top-4 border border-[#d0def3] bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#356acc]">
          {feature.tab}
        </span>
        <span className="absolute right-4 top-4 font-mono text-[11px] font-semibold text-[#6a7f9a]">
          {feature.num}
        </span>
      </div>

      <div className="flex flex-1 flex-col bg-[#11131a] p-6 lg:p-7">
        <h3 className="text-[22px] font-semibold leading-[1.15] tracking-[-0.03em] text-slate-900 lg:text-[24px]">
          <span className="text-white">{feature.heading}</span>
        </h3>
        <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#9fb2cf]">{feature.description}</p>

        <ul className="mt-6 space-y-3 border-t border-[#29384f] pt-5">
          {feature.bullets.map((bullet) => (
            <li
              key={bullet}
              className="text-[13px] leading-relaxed text-[#d7e3f7] before:mr-2 before:text-[#6f98e0] before:content-['—']"
            >
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}
