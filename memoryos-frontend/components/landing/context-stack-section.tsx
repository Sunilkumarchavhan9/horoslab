"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CONTEXT_LAYERS } from "./data";
import { Reveal } from "./motion";
import MemoryOsSVG from "./memoryostmsvg";
import MemoryOsSVG2 from "./memoryossvg2";

const LAYER_IMPLEMENTATION: Record<string, { usedFor: string; builtWith: string[]; flow: string }> = {
  "01": {
    usedFor: "Processes raw developer messages into candidate memories with extraction and importance scoring.",
    builtWith: ["extractMemory.ts", "scoreMemory.ts", "POST /api/memory/process"],
    flow: "message -> extract -> score -> candidate memory",
  },
  "02": {
    usedFor: "Detects overlaps against existing memories before writing final memory state.",
    builtWith: ["mergeMemory.ts", "Mem0 search candidate fetch", "recentMemoryStore.ts"],
    flow: "candidate memory -> overlap check -> merge decision",
  },
  "03": {
    usedFor: "Fetches and reranks memories so the next answer uses relevant and recent context.",
    builtWith: ["retrieveRelevantMemory.ts", "POST /api/memory/retrieve", "POST /api/memory/continue"],
    flow: "query -> retrieve -> rerank -> continuation context",
  },
  "04": {
    usedFor: "Upgrades stale memories when stronger follow-up evidence appears in later messages.",
    builtWith: ["evolveMemory.ts", "lib/workflows/ingestGraph.ts", "revisionMemory.ts"],
    flow: "new evidence -> compare -> evolve memory -> revision diff",
  },
  "05": {
    usedFor: "Surfaces traceability so developers can inspect what changed and why.",
    builtWith: ["GET /api/memory/timeline", "GET /api/memory/revisions", "GET /api/memory/explain"],
    flow: "retrieve memory -> timeline + revisions -> explainable output",
  },
};

function LayerVisual() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { amount: 0.32, once: true });
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState<"base" | "exploded">("base");
  const visibleStage = prefersReducedMotion ? "exploded" : stage;

  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;

    const timer = setTimeout(() => {
      setStage("exploded");
    }, 1000);

    return () => clearTimeout(timer);
  }, [isInView, prefersReducedMotion]);

  return (
    <div ref={containerRef} className="relative h-[700px] w-full overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(36,102,243,0.15),rgba(36,102,243,0)_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.45),rgba(255,255,255,0)_42%)]" />

      <AnimatePresence mode="wait">
        {visibleStage === "base" ? (
          <motion.div
            key="base-chip"
            className="absolute bottom-2 left-1/2 w-[500px] max-w-[94%] -translate-x-1/2"
            initial={{ opacity: 0, y: 36, scale: 0.92, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -60, scale: 0.82, filter: "blur(5px)" }}
            transition={{ duration: 0.75, ease: [0.2, 0.78, 0.2, 1] }}
          >
            <MemoryOsSVG />
          </motion.div>
        ) : (
          <motion.div
            key="exploded-stack"
            className="absolute bottom-2 left-1/2 w-[485px] max-w-[92%] -translate-x-1/2"
            initial={{ opacity: 0, y: 140, scale: 0.84, rotateX: 9, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: [0.18, 0.8, 0.18, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <MemoryOsSVG2 />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContextStackSection() {
  const [activeId, setActiveId] = useState(CONTEXT_LAYERS[0]?.id ?? "01");

  return (
    <section className="border-b border-[#c9d8ee]">
      <Reveal className="px-5 py-7 text-center">
        <p className="font-mono text-[11px] tracking-[0.2em] text-[#356acc]">
          MEMORYOS CONTEXT STACK
        </p>
        <h2
          className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl"
          style={{ fontFamily: "var(--font-space-grotesk), var(--font-sora), sans-serif" }}
        >
          Five layers that turn conversation into durable developer context.
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-base text-slate-600 md:text-lg">
          MemoryOS does more than store notes. It builds a developer profile, retrieves the right
          context for the next task, evolves memory when new evidence arrives, and keeps every change inspectable.
        </p>
      </Reveal>

      <div className="grid border-t border-[#c9d8ee] lg:grid-cols-[1.25fr_1fr]">
        <div className="hidden border-r border-[#c9d8ee] bg-white px-5 py-6 lg:sticky lg:top-20 lg:block lg:self-start">
          <LayerVisual />
        </div>

        <div className="bg-white">
          {CONTEXT_LAYERS.map((layer, index) => {
            const isActive = activeId === layer.id;
            const implementation = LAYER_IMPLEMENTATION[layer.id];

            return (
              <Reveal
                key={layer.id}
                delay={index * 0.04}
                className={`border-b border-[#c9d8ee] ${
                  isActive ? "border-l-[4px] border-l-[#1f63f2] bg-white" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(layer.id)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  aria-expanded={isActive}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-[11px] ${isActive ? "text-[#1f63f2]" : "text-[#a3b0c3]"}`}>
                      {layer.id}
                    </span>
                    <span className={`h-3.5 w-3.5 rounded-full ${isActive ? "bg-[#1f63f2] ring-4 ring-[#bfd1f8]" : "bg-[#5a87d9]"}`} />
                    <h3 className={`text-[21px] font-semibold tracking-[-0.02em] md:text-[30px] ${isActive ? "text-[#1f63f2]" : "text-slate-900"}`}>
                      {layer.title}
                    </h3>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`shrink-0 transition-transform duration-200 ${isActive ? "rotate-180 text-[#1f63f2]" : "text-[#7f8da5]"}`}
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {isActive && (
                  <div className="bg-white px-6 pb-7 md:px-20">
                    <p className="max-w-3xl text-[14px] leading-[1.55] text-[#4d6281] md:text-[16px]">
                      {layer.desc}
                    </p>
                    <p className="mt-3 max-w-3xl text-[13px] leading-[1.55] text-[#3f5477] md:text-[14px]">
                      {implementation?.usedFor}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {implementation?.builtWith.map((item) => (
                        <span
                          key={`${layer.id}-${item}`}
                          className="border border-[#b6c8e8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#365888]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 font-mono text-[11px] tracking-[0.05em] text-[#3f66a3]">
                      {implementation?.flow}
                    </p>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
