"use client";

import { useState } from "react";
import { memoryGraph } from "./brain-map-graph-data";
import { LiveBrainMapDitherCanvas } from "./live-brain-map-dither-canvas";
import { Reveal } from "./motion";
import type { BrainMapSelection } from "@/lib/brain-map-types";

export function UnderTheHoodSection() {
  const [selectedGraphItem, setSelectedGraphItem] = useState<BrainMapSelection>(null);

  const hasGraphData = memoryGraph.nodes.length > 0 && memoryGraph.edges.length > 0;

  return (
    <section className="border-b border-[#c9d8ee] bg-white px-5 pt-7">
      <Reveal>
        <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl">
          Production memory lifecycle, end to end
        </h2>

        <p className="mx-auto mt-3 max-w-3xl text-center text-base text-slate-600 md:text-lg">
          MemoryOS implements extraction, contract scoring, merge/evolve logic, retrieval reranking,
          revision history, and explainable injection in one continuity flow.
        </p>
      </Reveal>

      <Reveal className="mt-6">
        <div className="bg-white">
          <div className="flex items-center justify-between px-2 py-4 sm:px-4">
            <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.22em] text-[#356acc]">
              Live Brain Map
            </h2>

            {selectedGraphItem ? (
              <button
                type="button"
                onClick={() => setSelectedGraphItem(null)}
                className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a7f9a] transition hover:text-[#356acc]"
              >
                Clear Focus
              </button>
            ) : null}
          </div>

          <div className="relative min-h-[min(72vh,780px)] overflow-hidden bg-white">
            {hasGraphData ? (
              <LiveBrainMapDitherCanvas
                className="absolute inset-0 h-full min-h-[min(72vh,780px)] w-full"
                graph={memoryGraph}
                selectedItem={selectedGraphItem}
                onSelectNode={(id) => setSelectedGraphItem({ kind: "node", id })}
                onSelectEdge={(id) => setSelectedGraphItem({ kind: "edge", id })}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <p className="font-mono text-[13px] text-[#6a7f9a]">No graph data yet.</p>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
