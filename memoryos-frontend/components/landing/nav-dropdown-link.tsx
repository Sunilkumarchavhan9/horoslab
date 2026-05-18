"use client";

import { getNavAsciiVariant } from "@/lib/nav-ascii-variants";
import { EASE_OUT } from "@/lib/motion";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { NavAsciiTile } from "./nav-ascii-tile";

type NavDropdownLinkProps = {
  href: string;
  label: string;
  description: string;
};

export function NavDropdownLink({ href, label, description }: NavDropdownLinkProps) {
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const variant = getNavAsciiVariant(label);

  return (
    <motion.a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="group/card flex h-full min-h-[280px] flex-col items-center rounded-xl px-4 py-5 text-center transition-colors hover:bg-[#f6f9ff] focus-visible:bg-[#f6f9ff] focus-visible:outline-none"
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -6, transition: { duration: 0.28, ease: EASE_OUT } }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
    >
      <motion.div
        className="w-full max-w-[168px]"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: hovered ? 1.04 : 1,
                transition: { duration: 0.35, ease: EASE_OUT },
              }
        }
      >
        <NavAsciiTile
          variant={variant}
          active={hovered}
          className="aspect-square h-[168px] w-full shrink-0 rounded-xl"
        />
      </motion.div>
      <div className="mt-5 w-full min-w-0">
        <p className="text-[15px] font-semibold leading-snug text-slate-900 transition-colors group-hover/card:text-[#356acc]">
          {label}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#5d6f87]">{description}</p>
      </div>
    </motion.a>
  );
}
