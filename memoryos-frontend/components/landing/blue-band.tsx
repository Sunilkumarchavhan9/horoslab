"use client";

import { motion } from "framer-motion";
import Dither from "@/components/ui/Dither";
import { MemoryStarLogo } from "./memory-star-logo";

export function BlueBand() {
  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] h-[220px] w-screen overflow-hidden border-b border-[#c9d8ee] md:h-[280px] bg-[#0015FF]">
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={[0,0.08235294117647059,1]}
          disableAnimation={false}
          enableMouseInteraction={false}
          mouseRadius={0.3}
          colorNum={9}
          pixelSize={2}
          waveAmplitude={0.7}
          waveFrequency={5.5}
          waveSpeed={1.5}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 0.95, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      >
        <span className="relative inline-flex place-items-center overflow-hidden drop-shadow-md">
          <MemoryStarLogo className="h-[48px] w-auto md:h-[64px]" tone="white" iconColor="#FFFFFF" textColor="#FFFFFF" />
        </span>
      </motion.div>
    </section>
  );
}
