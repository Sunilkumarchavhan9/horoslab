import React from "react";
import { motion } from "framer-motion";
import {
  OpenAILogo,
  MistralLogo,
  MetaLogo,
  MicrosoftLogo,
  AnthropicLogo,
  DeepSeekLogo,
  VLLMLogo,
  KimiLogo,
  QwenLogo
} from "@/components/epoch/primitives/brand-icons";

export function DocumentAIGrid() {
  return (
    <div className="relative w-[500px] h-[500px] bg-[#151515]">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="docGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#docGrid)" />
          {/* Add crosshairs at intersections */}
          {Array.from({ length: 9 }).map((_, i) => (
            Array.from({ length: 9 }).map((_, j) => (
              <rect key={`${i}-${j}`} x={i * 60 - 1.5} y={j * 60 - 1.5} width="3" height="3" fill="#666" />
            ))
          ))}
        </svg>
      </div>

      {/* Main Center Emoji */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
      >
        <div className="text-[140px] leading-none drop-shadow-2xl select-none" style={{ textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          🤗
        </div>
        <div className="text-[#F0EFE2] font-semibold text-[14px] mt-6 tracking-wide relative z-30">
          Forms
        </div>
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top Left: Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-[110px] left-[30px] flex items-center gap-2"
        >
          <span className="text-[#F0EFE2] font-semibold text-[14px] tracking-wide">Invoices</span>
        </motion.div>

        {/* Top Right: Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute top-[110px] right-[30px] flex items-center gap-2"
        >
          <span className="text-[#F0EFE2] font-semibold text-[14px] tracking-wide">Contracts</span>
          <AnthropicLogo size={18} />
        </motion.div>

        {/* Bottom Right: Tables */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-[110px] right-[30px] flex items-center gap-2"
        >
          <VLLMLogo size={20} />
          <span className="text-[#F0EFE2] font-semibold text-[14px] tracking-wide">Tables</span>
        </motion.div>

        {/* Scattered Logos */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute top-[50px] left-[150px]"
        >
          <OpenAILogo size={24} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute top-[40px] left-[250px]"
        >
          <MistralLogo size={32} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute top-[60px] right-[100px]"
        >
          <QwenLogo size={28} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute top-[230px] left-[50px]"
        >
          <MicrosoftLogo size={20} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          className="absolute bottom-[170px] left-[60px]"
        >
          <KimiLogo size={18} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
          className="absolute bottom-[110px] left-[160px]"
        >
          <DeepSeekLogo size={24} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-[170px] right-[50px]"
        >
          <MetaLogo size={20} />
        </motion.div>

      </div>
    </div>
  );
}
