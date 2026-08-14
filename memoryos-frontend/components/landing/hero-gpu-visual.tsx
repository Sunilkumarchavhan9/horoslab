"use client";

import { motion } from "framer-motion";

export function HeroGpuVisual() {
  return (
    <div className="relative mt-16 w-full max-w-[1000px] mx-auto group cursor-crosshair">
      {/* Container to maintain aspect ratio (approx 16:9 for the provided images) */}
      <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden border border-slate-200/50 bg-[#0a0a0a] shadow-2xl">
        
        {/* Base Image (Wireframe / Outline) */}
        <img 
          src="/images/gpu-outline.png" 
          alt="GPU Cluster Architecture Wireframe" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Hover Image (Colored / Shader) */}
        <img 
          src="/images/gpu-color.png" 
          alt="GPU Cluster Architecture Active" 
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-105"
        />

        {/* Optional: Scanning line effect on hover */}
        <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden transition-opacity duration-500">
          <motion.div 
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.8)]"
          />
        </div>
      </div>

      {/* Decorative caption */}
      <div className="mt-4 flex justify-between items-center text-[11px] font-mono text-slate-500 uppercase tracking-widest px-2">
        <span>Status: Standby</span>
        <span className="group-hover:text-purple-500 transition-colors">Hover to activate compilation</span>
        <span>Nodes: 2048</span>
      </div>
    </div>
  );
}
