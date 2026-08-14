"use client";

import { useRef } from "react";
import { Reveal } from "./motion";
import { InViewDither } from "@/components/ui/Dither";
import type { DitherProps } from "@/components/ui/Dither";

type GraphicProps = Omit<DitherProps, 'disableAnimation' | 'enableMouseInteraction' | 'mouseRadius'>;

const RUNTIME_FEATURES: { id: string; title: string; body: string; graphicProps: GraphicProps }[] = [
  {
    id: "01",
    title: "Mission & Authority",
    body: "Turn intent into a mission contract and bind it to an institution, owner, role set, budget, evidence duty, and authority chain.",
    graphicProps: {
      waveColor: [0.9568627450980393, 0.24705882352941178, 0.3686274509803922],
      colorNum: 4,
      pixelSize: 2,
      waveAmplitude: 0.5,
      waveFrequency: 8,
      waveSpeed: 0.03
    }
  },
  {
    id: "02",
    title: "Reality Fabric",
    body: "Connect company memory, decision history, systems, incidents, policies, evidence, and fitness into the operating graph institutions use.",
    graphicProps: {
      waveColor: [0.48627450980392156, 0.22745098039215686, 0.9294117647058824],
      colorNum: 4,
      pixelSize: 2,
      waveAmplitude: 0.5,
      waveFrequency: 3,
      waveSpeed: 0.09
    }
  },
  {
    id: "03",
    title: "Company DNA",
    body: "Preserve principles, policies, institution templates, behavior patterns, evidence lineage, and evolution history for future work.",
    graphicProps: {
      waveColor: [0.06274509803921569, 0.7254901960784313, 0.5058823529411764],
      colorNum: 5,
      pixelSize: 2,
      waveAmplitude: 0.6,
      waveFrequency: 5,
      waveSpeed: 0.1
    }
  },
  {
    id: "04",
    title: "Capability Leases",
    body: "Lease temporary access to internal systems, databases, APIs, wallets, and agent services based strictly on approved mission authority.",
    graphicProps: {
      waveColor: [0.2627450980392157, 0.23137254901960785, 0.9647058823529412],
      colorNum: 4,
      pixelSize: 2,
      waveAmplitude: 0.3,
      waveFrequency: 1.2,
      waveSpeed: 0.05
    }
  },
  {
    id: "05",
    title: "Proof & Settlement",
    body: "Every mission produces evidence, independent verification, PASS/FAIL/UNKNOWN, cost attribution, audit records, and settlement state.",
    graphicProps: {
      waveColor: [0.9254901960784314, 0.2823529411764706, 0.6],
      colorNum: 8,
      pixelSize: 2,
      waveAmplitude: 0.65,
      waveFrequency: 5,
      waveSpeed: 0.1
    }
  },
  {
    id: "06",
    title: "Evolution Runtime",
    body: "Measure fitness, propose mutations, simulate alternatives, select safer genomes, and roll forward the next institution version.",
    graphicProps: {
      waveColor: [0.9764705882352941, 0.45098039215686275, 0.08627450980392157],
      colorNum: 16,
      pixelSize: 2,
      waveAmplitude: 0.4,
      waveFrequency: 5,
      waveSpeed: 0.1
    }
  }
];

export function InstitutionRuntimeSection() {
  const container = useRef<HTMLElement>(null);

  return (
    <section ref={container} className="bg-white border-b border-[#c9d8ee] relative" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
      <Reveal className="px-5 py-12 text-center lg:px-7 lg:py-20">
        <h2 className="mx-auto max-w-[1000px] text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1]">
          The institution is the new cloud primitive for autonomous <span className="text-[#0015FF]">work.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[700px] text-[17px] leading-[1.6] text-slate-500">
          An institution is not an agent, workflow, pipeline, or dashboard. It is a versioned operating unit that coordinates agents, humans, tools, budgets, authority, evidence, verification, settlement, and evolution.
        </p>
      </Reveal>

      {/* Dotted Grid Layout */}
      <div className="border-t border-dotted border-slate-300 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {RUNTIME_FEATURES.map((feature, index) => (
            <Reveal
              key={feature.id}
              delay={0.05 + index * 0.04}
              className={`flex flex-col border-b border-dotted border-slate-300 bg-white relative ${index % 2 === 0 ? "md:border-r md:border-dotted md:border-slate-300" : ""
                } ${index % 3 !== 2 ? "lg:border-r lg:border-dotted lg:border-slate-300" : "lg:border-r-0"
                }`}
            >
              {/* Top Section (Header + Graphic) */}
              <div className="relative w-full h-[276px]">
                {/* Graphic Box */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <InViewDither
                    {...feature.graphicProps}
                    disableAnimation={true}
                    enableMouseInteraction={false}
                    mouseRadius={0}
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="px-6 pb-10 pt-6 flex flex-col flex-1 relative z-10 bg-white">
                <h3 className="text-[22px] text-slate-900 tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="text-[14px] text-slate-500 mt-3 leading-[1.65]">
                  {feature.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


