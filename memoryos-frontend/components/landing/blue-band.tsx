"use client";

import { motion } from "framer-motion";
import { BlueBandAsciiCanvas } from "./blue-band-ascii-canvas";

export function BlueBand() {
  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] h-[220px] w-screen overflow-hidden border-b border-[#c9d8ee] md:h-[280px]">
      <BlueBandAsciiCanvas className="absolute inset-0 h-full w-full" />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 0.95, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      >
        <span className="relative inline-grid place-items-center overflow-hidden">
          <motion.span
            animate={{
              scale: [1, 1.03, 1],
              textShadow: [
                "0 0 8px rgba(255,255,255,0.45)",
                "0 0 16px rgba(255,255,255,0.7)",
                "0 0 8px rgba(255,255,255,0.45)",
              ],
            }}
            transition={{ duration: 2.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="text-6xl font-bold text-white md:text-7xl"
          >
            ✶
          </motion.span>
          <motion.span
            animate={{ backgroundPosition: ["-140% 50%", "180% 50%"] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="pointer-events-none absolute inset-0 text-6xl font-bold text-transparent md:text-7xl [background-clip:text] [-webkit-background-clip:text]"
            style={{
              backgroundImage:
                "linear-gradient(110deg, rgba(255,255,255,0) 26%, rgba(255,255,255,0.95) 48%, rgba(216,224,236,0.92) 55%, rgba(255,255,255,0) 74%)",
              backgroundSize: "240% 100%",
              filter: "drop-shadow(0 0 8px rgba(198,208,225,0.55))",
            }}
          >
            ✶
          </motion.span>
        </span>
      </motion.div>
    </section>
  );
}
