"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CompanyBrainFlowerCanvas } from "./company-brain-flower-canvas";

const BLOOM_MS = 5200;

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reducedMotion;
}

export function CompanyBrainThesisSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);
  const startedRef = useRef(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) return;
    if (startedRef.current) return;
    startedRef.current = true;

    let raf = 0;
    const begin = performance.now();

    const tick = (now: number) => {
      const next = Math.min(1, (now - begin) / BLOOM_MS);
      setProgress(next);
      if (next < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(raf);
  }, [inView, reducedMotion]);

  const reveal = useMemo(() => {
    if (reducedMotion) {
      return { label: true, title: true, body: true, is: true, not: true };
    }
    return {
      label: progress >= 0.08,
      title: progress >= 0.2,
      body: progress >= 0.36,
      is: progress >= 0.58,
      not: progress >= 0.8,
    };
  }, [progress, reducedMotion]);

  const fade = (show: boolean) =>
    `transition-all duration-500 ${show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`;

  const bloomProgress = reducedMotion ? 1 : progress;

  return (
    <section
      ref={sectionRef}
      id="company-brain-thesis"
      className="border-b border-slate-200/80 bg-white px-5 py-8 lg:px-7"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="p-0 md:p-0">
          <div className="h-[320px] w-full md:h-[420px]">
            <CompanyBrainFlowerCanvas progress={bloomProgress} idle className="h-full w-full" />
          </div>
        </div>

        <div className="space-y-5">
          <p className={`${fade(reveal.label)} font-mono text-[11px] tracking-[0.22em] text-[#356acc]`}>
            COMPANY BRAIN THESIS
          </p>
          <h2 className={`${fade(reveal.title)} max-w-[780px] text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-900 md:text-4xl`}>
            Models are ready. Company knowledge is the bottleneck.
          </h2>
          <p className={`${fade(reveal.body)} max-w-[780px] text-[16px] leading-[1.55] text-[#516882]`}>
            MemoryOS turns scattered company knowledge into a living, executable skills layer for agents.
            We ingest context from real systems, structure it as decisions and policies, and make it safe to execute with governance.
          </p>

          <div className={fade(reveal.is)}>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a7f9a]">What MemoryOS Is</p>
            <ul className="mt-3 space-y-2 text-[14px] text-[#2f4968]">
              <li>- Living map of incidents, decisions, workflows, and constraints</li>
              <li>- Evidence-backed skills generated from real company signals</li>
              <li>- Policy-gated execution with approvals and audit trail</li>
            </ul>
          </div>

          <div className={fade(reveal.not)}>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a7f9a]">What It Is Not</p>
            <ul className="mt-3 space-y-2 text-[14px] text-[#2f4968]">
              <li>- Not a simple document chatbot</li>
              <li>- Not keyword search over static files</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

