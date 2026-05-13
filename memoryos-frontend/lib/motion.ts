export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.83, 0, 0.17, 1] as const;
export const EASE_TERMINAL = [0.16, 1, 0.3, 1] as const;

export const SPRING = {
  snappy: { type: "spring", stiffness: 520, damping: 34 },
  gentle: { type: "spring", stiffness: 220, damping: 26 },
  slow: { type: "spring", stiffness: 90, damping: 20 },
} as const;

export const FADE_UP = {
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
  transition: { duration: 0.32, ease: EASE_OUT },
} as const;

export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(5px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.98, filter: "blur(3px)" },
  transition: { duration: 0.28, ease: EASE_OUT },
} as const;

export const STAGGER = {
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
} as const;

export const COCKPIT_TRANSITION = {
  duration: 0.28,
  ease: EASE_TERMINAL,
} as const;

export const MOTION_SAFE_PROPS = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
} as const;

export const REDUCED_MOTION_PROPS = {
  initial: false,
  animate: false,
  exit: false,
  transition: { duration: 0 },
} as const;

export function preferReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
