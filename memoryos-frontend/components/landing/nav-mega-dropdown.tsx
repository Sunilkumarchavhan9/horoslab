"use client";

import { EASE_OUT } from "@/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";

export type MegaMenuItem = {
  icon?: ReactNode;
  label: string;
  description: string;
  href: string;
};

export type MegaMenuSection = {
  title?: string;
  items: MegaMenuItem[];
};

export type MegaMenuCard = {
  title?: string;
  description?: string;
  href: string;
  bgClassName?: string;
  decoration?: ReactNode;
  content?: ReactNode;
};

type NavMegaDropdownProps = {
  label: string;
  sections: MegaMenuSection[];
  cards?: MegaMenuCard[];
  cardsPosition?: "left" | "right";
  iconTheme?: "purple" | "green";
  cardsTitle?: string;
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.01 },
  },
} as const;

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
} as const;

export function NavMegaDropdown({
  label,
  sections,
  cards,
  cardsPosition = "right",
  iconTheme = "purple",
  cardsTitle,
}: NavMegaDropdownProps) {
  const [open, setOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const iconClasses = iconTheme === "green"
    ? "from-emerald-500 to-green-600 border-green-500/30"
    : "from-[#4b00ff] to-[#1e00ff] border-indigo-500/20";

  return (
    <motion.div
      className="py-6"
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
        className={`inline-flex items-center gap-1 px-3 py-2 -mx-3 rounded-md text-[15px] font-medium transition-colors ${open ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}
        aria-expanded={open}
      >
        {label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
        >
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="absolute top-full left-0 right-0 w-full z-[100] bg-white border-b border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Background grid pattern */}
            <div className="absolute inset-0 pointer-events-none flex justify-center w-full bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.35]" />

            <div className="mx-auto max-w-[1440px] relative min-h-[400px] border-x border-slate-100/60 flex">
              
              <motion.div
                className="flex w-full relative z-10"
                variants={prefersReducedMotion ? undefined : STAGGER_CONTAINER}
                initial={prefersReducedMotion ? false : "hidden"}
                animate={prefersReducedMotion ? undefined : "show"}
              >
                {/* Left Cards */}
                {cards && cards.length > 0 && cardsPosition === "left" && (
                  <div className="w-[280px] shrink-0 pt-8 pb-10 px-6 flex flex-col gap-4 border-r border-slate-100/80 border-dashed bg-white/90 backdrop-blur-sm shadow-[1px_0_0_0_rgba(226,232,240,0.5)] z-20">
                    {cardsTitle && (
                      <h3 className="mb-2 text-[13px] font-medium text-slate-500">
                        {cardsTitle}
                      </h3>
                    )}
                    {cards.map((card, idx) => (
                      <motion.div key={idx} variants={prefersReducedMotion ? undefined : STAGGER_ITEM} className="h-full">
                        <Link
                          href={card.href}
                          className={`group relative flex flex-col justify-start overflow-hidden rounded-[2px] p-5 transition-transform hover:-translate-y-0.5 h-full ${card.bgClassName || 'bg-[#222530]'}`}
                        >
                          <div className="relative z-10">
                            {card.content ? card.content : (
                              <>
                                <h4 className="flex items-center gap-2 text-[15px] font-bold text-[#F0EFE2]">
                                  {card.title}
                                  <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-1" />
                                </h4>
                                <p className="mt-1.5 text-[12px] text-slate-300 leading-relaxed max-w-[200px] font-medium">
                                  {card.description}
                                </p>
                              </>
                            )}
                          </div>
                          {card.decoration && (
                            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2px]">
                              {card.decoration}
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Sections Container */}
                <div className="flex bg-white/90 backdrop-blur-sm shadow-[1px_0_0_0_rgba(226,232,240,0.5)] z-10">
                  {sections.map((section, idx) => (
                    <div key={idx} className={`w-[270px] shrink-0 relative pt-8 pb-10 px-6 ${idx !== sections.length - 1 ? 'border-r border-slate-100/80 border-dashed' : ''}`}>
                      {section.title && (
                        <h3 className="mb-6 text-[13px] font-medium text-slate-500">
                          {section.title}
                        </h3>
                      )}
                      <div className="flex flex-col gap-2 -ml-3">
                        {section.items.map((item, itemIdx) => (
                          <motion.div key={itemIdx} variants={prefersReducedMotion ? undefined : STAGGER_ITEM}>
                            <Link href={item.href} className="group flex items-start gap-4 rounded-md p-3 transition-colors hover:bg-slate-50/80">
                              {item.icon ? (
                                <div className={`mt-0.5 flex shrink-0 h-10 w-10 items-center justify-center rounded-[6px] bg-gradient-to-br text-[#F0EFE2] shadow-sm transition-transform group-hover:scale-105 border ${iconClasses}`}>
                                  {item.icon}
                                </div>
                              ) : (
                                  <div className="mt-0.5 flex shrink-0 h-10 w-10 items-center justify-center rounded-[6px] bg-slate-100 text-slate-400 group-hover:bg-[#2732fc] group-hover:text-[#F0EFE2] transition-all">
                                      <div className="h-2 w-2 rounded-full bg-current" />
                                  </div>
                              )}
                              <div>
                                <p className={`text-[14px] font-semibold text-slate-900 transition-colors leading-snug ${iconTheme === 'green' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#2732fc]'}`}>
                                  {item.label}
                                </p>
                                <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed max-w-[220px]">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Cards Container */}
                {cards && cards.length > 0 && cardsPosition === "right" && (
                  <div className="w-[280px] shrink-0 pt-8 pb-10 px-6 flex flex-col gap-4 border-l border-slate-100/80 border-dashed bg-white/90 backdrop-blur-sm shadow-[1px_0_0_0_rgba(226,232,240,0.5)] z-20">
                    {cardsTitle && (
                      <h3 className="mb-2 text-[13px] font-medium text-slate-500">
                        {cardsTitle}
                      </h3>
                    )}
                    {cards.map((card, idx) => (
                      <motion.div key={idx} variants={prefersReducedMotion ? undefined : STAGGER_ITEM} className="h-full">
                        <Link
                          href={card.href}
                          className={`group relative flex flex-col justify-start overflow-hidden rounded-[2px] p-5 transition-transform hover:-translate-y-0.5 h-full ${card.bgClassName || 'bg-[#222530]'}`}
                        >
                          <div className="relative z-10">
                            {card.content ? card.content : (
                              <>
                                <h4 className="flex items-center gap-2 text-[15px] font-bold text-[#F0EFE2]">
                                  {card.title}
                                  <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-1" />
                                </h4>
                                <p className="mt-1.5 text-[12px] text-slate-300 leading-relaxed max-w-[200px] font-medium">
                                  {card.description}
                                </p>
                              </>
                            )}
                          </div>
                          {card.decoration && (
                            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[2px]">
                              {card.decoration}
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {/* Empty Hatched Region for remaining space */}
                <div className="flex-1 relative bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(241,245,249,0.5)_4px,rgba(241,245,249,0.5)_8px)] overflow-hidden">
                </div>

              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}


