"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function DhyraContextRouting() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="w-full flex flex-col lg:flex-row items-center justify-between gap-16 py-32 border-t border-[#222]">

      {/* Left Column: Routing Diagram */}
      <div className="w-full lg:w-1/2 flex flex-col font-mono text-[13px] text-[#A0A0A0]">

        <div className="flex justify-between mb-4 w-full max-w-[480px]">
          <span>reality runtime, active mission</span>
          <span>execution fabric</span>
        </div>

        <div className="relative w-full max-w-[480px]">
          {/* Rows */}
          <div className="flex flex-col gap-4 relative z-10 w-full">
            {[
              { id: 1, type: "cold", target: 1 },
              { id: 2, type: "hit", target: 2 },
              { id: 3, type: "hit", target: 2 },
              { id: 4, type: "hit", target: 2 },
              { id: 5, type: "hit", target: 2 },
            ].map((call, i) => (
              <div key={i} className="flex items-center justify-between relative w-full h-[36px]">

                {/* Left Box (Call) */}
                <div className="w-[140px] h-full flex items-center justify-between border border-[#333] bg-[#1a1a1a] px-3 rounded-[2px] shadow-sm">
                  <span className="text-[#ccc]">intent {call.id}</span>
                  <span className={call.type === "hit" ? "text-white" : "text-[#666]"}>{call.type}</span>
                </div>

                {/* Right Box (Node) - Only render if it's the node itself */}
                {i < 4 && (
                  <div className={`w-[140px] h-full flex items-center justify-between border ${i === 1 ? 'border-[#75bf00] shadow-[0_0_15px_rgba(117,191,0,0.15)]' : 'border-[#333]'} bg-[#1a1a1a] px-3 rounded-[2px] transition-all`}>
                    <span className="text-[#ccc]">node {i + 1}</span>
                    {i === 1 && (
                      <div className="flex flex-col items-center">
                        <span className="text-[#75bf00] font-bold">warm</span>
                        <div className="w-full h-[2px] border-b-[2px] border-dashed border-[#75bf00] mt-0.5 opacity-80"></div>
                      </div>
                    )}
                  </div>
                )}
                {i >= 4 && <div className="w-[140px] h-full"></div>}
              </div>
            ))}
          </div>

          {/* SVG Connecting Lines - Absolute positioning overlay */}
          {mounted && (
            <svg
              className="absolute top-0 left-[140px] h-full pointer-events-none -z-0"
              style={{ width: 'calc(100% - 280px)' }}
              preserveAspectRatio="none"
              viewBox="0 0 100 244" // 5 rows * 36px + 4 gaps * 16px = 244px total height.
            >
              <defs>
                <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#75bf00" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#75bf00" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Call 1 to Replica 2 */}
              <motion.path
                d="M 0 18 C 40 18, 60 70, 100 70"
                stroke="#444"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, strokeDashoffset: [0, -40] }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{
                  opacity: { duration: 0.8 },
                  strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" }
                }}
              />

              {/* Call 2 to Replica 2 */}
              <motion.path
                d="M 0 70 C 40 70, 60 70, 100 70"
                stroke="url(#glowLine)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, strokeDashoffset: [0, -40] }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.2 },
                  strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" }
                }}
              />

              {/* Call 3 to Replica 2 */}
              <motion.path
                d="M 0 122 C 40 122, 60 70, 100 70"
                stroke="url(#glowLine)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, strokeDashoffset: [0, -40] }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.4 },
                  strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" }
                }}
              />

              {/* Call 4 to Replica 2 */}
              <motion.path
                d="M 0 174 C 40 174, 60 70, 100 70"
                stroke="url(#glowLine)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, strokeDashoffset: [0, -40] }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.6 },
                  strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" }
                }}
              />

              {/* Call 5 to Replica 2 */}
              <motion.path
                d="M 0 226 C 40 226, 60 70, 100 70"
                stroke="url(#glowLine)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, strokeDashoffset: [0, -40] }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.8 },
                  strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" }
                }}
              />
            </svg>
          )}
        </div>

        <p className="mt-8 text-[12px] text-[#666]">
          Without state affinity, continuous reality context is fragmented across the execution fabric.
        </p>

      </div>

      {/* Right Column: Copy */}
      <div className="w-full lg:w-1/2 flex flex-col lg:pl-16">

        <h2 className="text-5xl lg:text-[64px] font-medium tracking-tight leading-[1.1] text-[#F0EFE2] mb-6">
          Reality Fabric<br />state <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative">affinity</span>
        </h2>

        <p className="text-[18px] text-[#A0A0A0] leading-relaxed mb-10 max-w-xl">
          The Mission Runtime maintains state across computational, operational, and edge surfaces, keeping intent and verification data warm across thousands of interactions.
        </p>

        <div className="flex flex-col">
          <div className="py-6">
            <h3 className="text-[22px] font-medium text-[#F0EFE2] mb-2 tracking-tight">One intent, one execution loop.</h3>
            <p className="text-[16px] text-[#888] leading-relaxed">
              Mission workflows naturally route to the execution node holding the physical and computational state of the current Outcome Contract.
            </p>
          </div>

          <div className="py-6 border-t border-dashed border-[#333]">
            <h3 className="text-[22px] font-medium text-[#F0EFE2] mb-2 tracking-tight">Automatic state affinity.</h3>
            <p className="text-[16px] text-[#888] leading-relaxed">
              No manual hints needed. Dhyra detects the mission structure and pins execution to the nodes holding the heaviest Reality Fabric state.
            </p>
          </div>

          <div className="py-6 border-t border-dashed border-[#333]">
            <h3 className="text-[22px] font-medium text-[#F0EFE2] mb-2 tracking-tight">Continuous verification.</h3>
            <p className="text-[16px] text-[#888] leading-relaxed">
              Latency drops to milliseconds for continuous execution loops, allowing constant state rechecks against reality without paying full processing costs.
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}
