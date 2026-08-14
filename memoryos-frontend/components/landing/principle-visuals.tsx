"use client";

import { motion } from "framer-motion";
import { Bot, Database, Folder, Key, Server, Lock } from "lucide-react";

export function NoAmbientAuthorityVisual() {
  return (
    <div className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] overflow-hidden flex items-center justify-center rounded-[1px] mb-6">
      {/* Background grid/dots optional, but let's keep it clean */}
      
      {/* Outside Icons (Faded/Locked) */}
      <div className="absolute inset-0 flex items-center justify-around px-8 opacity-30 pointer-events-none">
        <div className="relative">
          <Database className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
          <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="relative -mt-20">
          <Folder className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
          <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="relative mt-20">
          <Key className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
          <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="relative">
          <Server className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
          <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-slate-500" strokeWidth={2.5} />
        </div>
      </div>

      {/* Permission Boundary */}
      <motion.div
        className="relative flex items-center justify-center w-24 h-24 rounded-full border border-dashed border-blue-300 bg-blue-50/50"
        whileHover={{
          boxShadow: "0 0 20px 5px rgba(59, 130, 246, 0.2)",
          borderColor: "rgba(59, 130, 246, 0.5)",
          scale: 1.05,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Agent */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 text-blue-600"
        >
          <Bot className="w-6 h-6" strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function MissionScopedAccessVisual() {
  return (
    <motion.div 
      className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] overflow-hidden flex items-center justify-center rounded-[1px] mb-6 cursor-pointer"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {/* Outside Resources */}
      <div className="absolute inset-0 flex items-center justify-between px-6 sm:px-12 pointer-events-none">
        <div className="opacity-30">
          <Key className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <div className="opacity-30">
          <Server className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Mission Zone */}
      <motion.div
        className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-indigo-50/50 border border-dashed border-indigo-200"
        variants={{
          rest: { backgroundColor: "rgba(238, 242, 255, 0.5)", borderColor: "rgba(199, 210, 254, 1)" },
          hover: { backgroundColor: "rgba(238, 242, 255, 0.8)", borderColor: "rgba(165, 180, 252, 1)", scale: 1.02 }
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Connection Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 192 192">
          {/* Top-left resource line */}
          <motion.line
            x1="96" y1="96" x2="48" y2="48"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="4 4"
            variants={{
              rest: { pathLength: 0, opacity: 0 },
              hover: { pathLength: 1, opacity: 1 }
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          {/* Bottom-right resource line */}
          <motion.line
            x1="96" y1="96" x2="144" y2="144"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="4 4"
            variants={{
              rest: { pathLength: 0, opacity: 0 },
              hover: { pathLength: 1, opacity: 1 }
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </svg>

        {/* Resources inside the zone */}
        <motion.div 
          className="absolute top-6 left-6 sm:top-8 sm:left-8 z-10 bg-white p-2.5 rounded-full shadow-sm border border-slate-100"
          variants={{
            rest: { y: 0 },
            hover: { y: -2 }
          }}
        >
          <Database className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 z-10 bg-white p-2.5 rounded-full shadow-sm border border-slate-100"
          variants={{
            rest: { y: 0 },
            hover: { y: -2 }
          }}
        >
          <Folder className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />
        </motion.div>

        {/* Agent */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 text-slate-800"
        >
          <Bot className="w-6 h-6" strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}


