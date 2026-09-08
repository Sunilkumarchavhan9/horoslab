"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ContinuityLabInstructionConfirmBar } from "@/components/continuity-lab/continuity-lab-instruction-confirm-bar";
import { ContinuityLabMcpInfoBanner } from "@/components/continuity-lab/continuity-lab-mcp-info-banner";
import { cn } from "@/lib/utils";

export const BANNER_ROTATE_MS = 3000;

/** Scroll offset on the lab main pane before the rotating strip appears. */
export const BANNER_SCROLL_THRESHOLD = 32;

/** Black sticky strip background (replaces legacy Devin blue). */
export const stickyStripBannerClass =
  "bg-[#2563EB] border-b border-white/[0.06]";

/** Flat strip styling when nested inside a sticky banner stack. */
export const bannerStackItemClass =
  "rounded-none border-0 bg-transparent px-0 py-0";

const BANNERS = ["mcp", "confirm"] as const;
type BannerKey = (typeof BANNERS)[number];

const SCROLL_ROOT_SELECTOR = "[data-continuity-lab-scroll-root]";

function getLabScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SCROLL_ROOT_SELECTOR);
}

type ContinuityLabBannerStackProps = {
  /** Optional static banners (e.g. connect GitHub) shown below the rotating strip. */
  children?: ReactNode;
  className?: string;
  /** Constrains banner content width to match the page column below. */
  innerClassName?: string;
};

/** Sticky rotating MCP + confirm banners; optional connect banners render below. */
export function ContinuityLabBannerStack({
  children,
  className,
  innerClassName,
}: ContinuityLabBannerStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeBanner: BannerKey = BANNERS[activeIndex];

  useEffect(() => {
    const root = getLabScrollRoot();
    if (!root) return;

    const onScroll = () => {
      setScrolled(root.scrollTop > BANNER_SCROLL_THRESHOLD);
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(
      () => setActiveIndex((index) => (index + 1) % BANNERS.length),
      BANNER_ROTATE_MS,
    );
    return () => clearTimeout(timer);
  }, [activeIndex, paused]);

  const fadeTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeInOut" as const };

  const stripMotionClass = reduceMotion
    ? scrolled
      ? "max-h-9 opacity-100"
      : "max-h-0 opacity-0 pointer-events-none"
    : cn(
        "transition-[max-height,opacity,transform] duration-200 ease-out",
        scrolled
          ? "max-h-9 translate-y-0 opacity-100"
          : "max-h-0 -translate-y-full opacity-0 pointer-events-none",
      );

  return (
    <div className={cn("sticky top-0 z-30 w-full shrink-0", className)}>
      <div
        className={cn(
          stickyStripBannerClass,
          "relative w-full overflow-x-hidden overflow-y-hidden text-[13px] leading-none text-[#F0EFE2] sm:text-sm",
          stripMotionClass,
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-live="polite"
        aria-hidden={!scrolled}
      >
        <div
          className={cn(
            "flex h-9 min-h-9 w-full min-w-0 items-center justify-center overflow-hidden",
            innerClassName,
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeBanner}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={fadeTransition}
              className="w-full min-w-0 overflow-hidden"
            >
              {activeBanner === "mcp" ? (
                <ContinuityLabMcpInfoBanner
                  variant="stickyStrip"
                  className={bannerStackItemClass}
                />
              ) : (
                <ContinuityLabInstructionConfirmBar
                  variant="stickyStrip"
                  className={bannerStackItemClass}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {children ? (
        <div className="border-b border-white/[0.06] bg-[#0f0f0f]/95 backdrop-blur-sm">
          <div
            className={cn("flex flex-col divide-y divide-white/[0.06]", innerClassName)}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
