"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import Dither from "@/components/ui/Dither";
import { MemoryOSFullLogo } from "@/components/landing/memoryos-full-logo";

const FAQ_ITEMS = [
  {
    question: "What is an institution run?",
    answer:
      "An institution run is one governed workflow with a mission, authority boundary, assigned agents or humans, evidence duties, verification, settlement, and a fitness record.",
  },
  {
    question: "Who is Epoch for right now?",
    answer:
      "Teams beginning to deploy AI workforces across engineering, infrastructure, support, security, or operations and needing proof, authority, and auditability before scale.",
  },
  {
    question: "Is Epoch an agent platform?",
    answer:
      "No. Epoch sits above agent platforms. Agent infrastructure gives agents identity, tools, communication, and compute. Epoch turns those agents into governed institutions.",
  },
  {
    question: "How does verification work?",
    answer:
      "Epoch separates execution from verification. Claims are checked against required evidence and return PASS, FAIL, or UNKNOWN before the outcome can be settled.",
  },
  {
    question: "Do you need production write access?",
    answer:
      "No. Early founder runs can stay read-only or tightly scoped. Any write capability must be explicit, mission-bound, time-limited, and revocable.",
  },
  {
    question: "What does a founder call produce?",
    answer:
      "A mission contract, authority map, evidence plan, verification result, settlement record, and the first reusable institution template for your organization.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-full bg-white py-24 font-sans text-slate-900 md:py-32">
      <div className="mx-auto max-w-[1000px] px-6 lg:px-12">
        <h2 className="mb-16 text-4xl font-medium leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
          The mechanics, <span className="text-[#0015FF]">in plain English.</span>
        </h2>

        <div className="border-t border-slate-200">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question} className="border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="group flex w-full items-center justify-between px-2 py-6 text-left transition-colors hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-6 md:gap-10">
                    <span className="w-6 font-mono text-xs text-slate-400 md:text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pr-4 text-[17px] font-medium text-slate-800 md:text-xl">
                      {item.question}
                    </span>
                  </div>
                  <span className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pl-14 pr-4 text-[15px] leading-relaxed text-slate-600 md:pl-20 md:text-[16px]">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-32 border-t border-dashed border-[#c9d8ee] pt-8 md:pt-16">
          <h2 className="mb-12 text-4xl font-medium leading-[1.1] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            See how teams turn agent work into institutions.
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]">
            <div className="relative flex min-h-[260px] flex-col justify-center overflow-hidden bg-[#0015FF] p-6 text-white md:p-10">
              <div className="absolute inset-0 z-0">
                <Dither
                  waveColor={[0, 0.08235294117647059, 1]}
                  disableAnimation={false}
                  enableMouseInteraction={false}
                  mouseRadius={0.3}
                  colorNum={9}
                  pixelSize={2}
                  waveAmplitude={0.7}
                  waveFrequency={5.5}
                  waveSpeed={0}
                />
              </div>
              <div className="relative z-10">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                  Founder-led onboarding
                </p>
                <p className="max-w-[28rem] text-[14px] leading-7 text-white/80">
                  Founder-led teams can sign up, connect GitHub and Slack, ask Reality a question, and create a mission without manual setup.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-medium text-white">
                  <Check className="size-4 text-[#3aff7d]" />
                  No placeholder onboarding
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <a
                href="/mission-control"
                className="flex h-16 items-center justify-between bg-white px-6 text-[15px] font-medium text-[#0015FF] transition-colors hover:bg-slate-50"
              >
                <span>Open Mission Control</span>
                <span>&rarr;</span>
              </a>
              <a
                href="https://cal.com/vegito"
                target="_blank"
                rel="noreferrer"
                className="flex h-16 items-center justify-between bg-[#0015FF] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#0015FF]/90"
              >
                <span>Book Founder Call</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
