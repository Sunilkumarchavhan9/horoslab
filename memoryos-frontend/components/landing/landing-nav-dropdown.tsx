"use client";

import { EASE_OUT } from "@/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { NavDropdownLink } from "./nav-dropdown-link";

type NavDropdownItem = {
  label: string;
  description: string;
  href: string;
};

type LandingNavDropdownProps = {
  label: string;
  items: readonly NavDropdownItem[];
  columns: 2 | 3;
  align?: "center" | "end";
  panelClassName?: string;
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
} as const;

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.38, ease: EASE_OUT },
  },
} as const;

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingNavDropdown({
  label,
  items,
  columns,
  align = "center",
  panelClassName,
}: LandingNavDropdownProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const alignClass =
    align === "end"
      ? "right-0 left-auto translate-x-0"
      : "left-1/2 -translate-x-1/2";

  const widthClass =
    panelClassName ??
    (columns === 3 ? "w-[min(96vw,920px)]" : "w-[min(92vw,620px)]");

  return (
    <motion.div
      className="relative -my-6 py-6"
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[15px] text-[#101827] transition hover:text-[#0015FF]"
        aria-expanded={open}
      >
        {label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
        >
          <Chevron />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className={`absolute top-full z-[100] ${alignClass} ${widthClass} mt-1 rounded-md border border-[#c9d8ee] bg-white p-4 shadow-[0_24px_48px_rgba(15,23,42,0.14)]`}
          >
            <motion.div
              className={`grid gap-3 ${columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
              variants={prefersReducedMotion ? undefined : STAGGER_CONTAINER}
              initial={prefersReducedMotion ? false : "hidden"}
              animate={prefersReducedMotion ? undefined : "show"}
            >
              {items.map((item) => (
                <motion.div key={item.label} variants={prefersReducedMotion ? undefined : STAGGER_ITEM}>
                  <NavDropdownLink
                    href={item.href}
                    label={item.label}
                    description={item.description}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function LandingNavLoginDropdown({
  children,
  items,
}: {
  children: ReactNode;
  items: readonly NavDropdownItem[];
}) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="relative -my-6 py-6"
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
    >
      <motion.div
        animate={{ scale: open ? 1.01 : 1 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="absolute right-0 top-full z-[100] mt-1 w-[min(92vw,640px)] rounded-md border border-[#c9d8ee] bg-white p-4 shadow-[0_24px_48px_rgba(15,23,42,0.14)]"
          >
            <motion.div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              variants={prefersReducedMotion ? undefined : STAGGER_CONTAINER}
              initial={prefersReducedMotion ? false : "hidden"}
              animate={prefersReducedMotion ? undefined : "show"}
            >
              {items.map((item) => (
                <motion.div key={item.label} variants={prefersReducedMotion ? undefined : STAGGER_ITEM}>
                  <NavDropdownLink
                    href={item.href}
                    label={item.label}
                    description={item.description}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}


